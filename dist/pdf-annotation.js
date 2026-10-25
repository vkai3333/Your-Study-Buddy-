import * as pdfjsLib from "./vendor/pdf.mjs";
import { WorkerMessageHandler } from "./vendor/pdf.worker.mjs";

// WKWebView can stall indefinitely when a module worker is started from a
// file:// app bundle. Register the worker handler on the main thread so
// PDF.js uses its supported loopback worker instead.
globalThis.pdfjsWorker = { WorkerMessageHandler };

const NOTES_KEY = "your-study-buddy-notes-v1";
const pagesHost = document.getElementById("pdf-note-pages");
const colorInput = document.getElementById("pdf-annotation-color");
const sizeInput = document.getElementById("pdf-annotation-size");
let tool = "pen";
let noteId = null;
let annotations = {};
let history = [];
let renderGeneration = 0;

function loadNotes() {
  try { return JSON.parse(localStorage.getItem(NOTES_KEY) || "[]"); } catch { return []; }
}

function saveAnnotations() {
  if (!noteId) return;
  const notes = loadNotes();
  const index = notes.findIndex((note) => note.id === noteId);
  if (index < 0) return;
  notes[index] = { ...notes[index], pdfAnnotations: annotations, updatedAt: Date.now() };
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

function saveExtractedText(id, text) {
  const cleaned = String(text || "").trim();
  if (!id || !cleaned) return;
  const notes = loadNotes();
  const index = notes.findIndex((note) => note.id === id);
  if (index < 0 || notes[index].extractedText === cleaned) return;
  notes[index] = { ...notes[index], extractedText: cleaned, updatedAt: Date.now() };
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  window.dispatchEvent(new CustomEvent("studybuddy:pdf-text-ready", { detail: { noteId: id } }));
}

async function extractPdfText(pdf) {
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const rows = [];
    content.items.filter((item) => String(item.str || "").trim()).forEach((item) => {
      const x = Number(item.transform?.[4] || 0);
      const y = Number(item.transform?.[5] || 0);
      let row = rows.find((candidate) => Math.abs(candidate.y - y) <= 2.5);
      if (!row) { row = { y, items: [] }; rows.push(row); }
      row.items.push({ x, text: String(item.str || "").trim() });
    });
    const lines = rows
      .sort((a, b) => b.y - a.y)
      .map((row) => row.items.sort((a, b) => a.x - b.x).map((item) => item.text).join(" ").replace(/\s+([,.;:!?])/g, "$1").trim())
      .filter(Boolean);
    if (lines.length) pages.push(lines.join("\n"));
  }
  return pages.join("\n\n");
}

function snapshot() {
  history.push(JSON.stringify(annotations));
  if (history.length > 40) history.shift();
}

function pageItems(pageNumber) {
  return annotations[String(pageNumber)] ||= [];
}

function drawAnnotations(canvas, pageNumber) {
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  pageItems(pageNumber).forEach((item) => {
    if (item.type === "text") {
      context.save();
      context.fillStyle = item.color;
      context.font = `${item.size}px Arial, sans-serif`;
      context.textBaseline = "top";
      String(item.text).split("\n").forEach((line, index) => context.fillText(line, item.x, item.y + index * item.size * 1.25));
      context.restore();
      return;
    }
    if (!item.points?.length) return;
    context.save();
    context.beginPath();
    context.moveTo(item.points[0].x, item.points[0].y);
    item.points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
    context.strokeStyle = item.color;
    context.lineWidth = item.size;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.globalAlpha = item.type === "highlighter" ? 0.28 : 1;
    context.stroke();
    context.restore();
  });
}

function pointOnCanvas(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
}

function wireAnnotationCanvas(canvas, pageNumber) {
  let current = null;
    canvas.addEventListener("pointerdown", async (event) => {
    event.preventDefault();
    const point = pointOnCanvas(event, canvas);
    const displayScale = canvas.width / Math.max(1, canvas.getBoundingClientRect().width);
    snapshot();
    if (tool === "text") {
      const text = await window.AppDialog.prompt("Enter the text to place on this PDF.", "", { title: "Add PDF text", inputLabel: "Text", confirmLabel: "Add text" });
      if (text) pageItems(pageNumber).push({ type: "text", x: point.x, y: point.y, text, color: colorInput.value, size: Math.max(12, Number(sizeInput.value) * 4) * displayScale });
      drawAnnotations(canvas, pageNumber);
      saveAnnotations();
      return;
    }
    if (tool === "eraser") {
      const items = pageItems(pageNumber);
      let closestIndex = -1;
      let closestDistance = Infinity;
      items.forEach((item, index) => {
        const points = item.points || [{ x: item.x, y: item.y }];
        points.forEach((candidate) => {
          const distance = Math.hypot(candidate.x - point.x, candidate.y - point.y);
          if (distance < closestDistance) { closestDistance = distance; closestIndex = index; }
        });
      });
      if (closestIndex >= 0 && closestDistance < Math.max(24, Number(sizeInput.value) * 3) * displayScale) items.splice(closestIndex, 1);
      drawAnnotations(canvas, pageNumber);
      saveAnnotations();
      return;
    }
    canvas.setPointerCapture(event.pointerId);
    current = { type: tool, color: colorInput.value, size: Number(sizeInput.value) * (tool === "highlighter" ? 4 : 1) * displayScale, points: [point] };
    pageItems(pageNumber).push(current);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!current) return;
    current.points.push(pointOnCanvas(event, canvas));
    drawAnnotations(canvas, pageNumber);
  });
  const finish = () => {
    if (!current) return;
    current = null;
    saveAnnotations();
  };
  canvas.addEventListener("pointerup", finish);
  canvas.addEventListener("pointercancel", finish);
}

async function renderPdf(blob, id) {
  const generation = ++renderGeneration;
  noteId = id;
  const note = loadNotes().find((item) => item.id === id);
  annotations = note?.pdfAnnotations && typeof note.pdfAnnotations === "object" ? note.pdfAnnotations : {};
  history = [];
  pagesHost.innerHTML = '<div class="pdf-loading-message">Loading PDF pages…</div>';
  const data = new Uint8Array(await blob.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  if (!note?.extractedText) {
    extractPdfText(pdf).then((text) => saveExtractedText(id, text)).catch(() => {});
  }
  pagesHost.replaceChildren();
  const firstPage = await pdf.getPage(1);
  const firstViewport = firstPage.getViewport({ scale: 1.3 });
  const renderPage = async (shell, pageNumber) => {
    if (shell.dataset.rendered || generation !== renderGeneration) return;
    shell.dataset.rendered = "true";
    shell.dataset.loading = "true";
    const page = pageNumber === 1 ? firstPage : await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.3 });
    const outputScale = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    shell.style.width = `${viewport.width}px`;
    shell.style.height = `${viewport.height}px`;
    const base = document.createElement("canvas");
    base.width = Math.ceil(viewport.width * outputScale);
    base.height = Math.ceil(viewport.height * outputScale);
    base.style.width = `${viewport.width}px`;
    base.style.height = `${viewport.height}px`;
    const overlay = document.createElement("canvas");
    overlay.className = "pdf-page-annotation";
    overlay.width = base.width;
    overlay.height = base.height;
    overlay.style.width = `${viewport.width}px`;
    overlay.style.height = `${viewport.height}px`;
    overlay.dataset.pdfPage = String(pageNumber);
    shell.append(base, overlay);
    await page.render({ canvasContext: base.getContext("2d"), viewport, transform: outputScale === 1 ? null : [outputScale, 0, 0, outputScale, 0, 0] }).promise;
    delete shell.dataset.loading;
    wireAnnotationCanvas(overlay, pageNumber);
    drawAnnotations(overlay, pageNumber);
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      renderPage(entry.target, Number(entry.target.dataset.pageNumber)).catch((error) => {
        entry.target.textContent = `Page could not be displayed: ${error.message}`;
      });
    });
  }, { root: pagesHost, rootMargin: "1000px 0px" });
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    if (generation !== renderGeneration) return;
    const shell = document.createElement("section");
    shell.className = "pdf-page-shell";
    shell.dataset.pageNumber = String(pageNumber);
    shell.style.width = `${firstViewport.width}px`;
    shell.style.height = `${firstViewport.height}px`;
    pagesHost.appendChild(shell);
    observer.observe(shell);
  }
  await renderPage(pagesHost.firstElementChild, 1);
}

document.querySelectorAll("[data-pdf-tool]").forEach((button) => button.addEventListener("click", () => {
  tool = button.dataset.pdfTool;
  document.querySelectorAll("[data-pdf-tool]").forEach((item) => item.classList.toggle("active", item === button));
  pagesHost.querySelectorAll(".pdf-page-annotation").forEach((canvas) => { canvas.style.cursor = tool === "text" ? "text" : tool === "eraser" ? "cell" : "crosshair"; });
}));

document.getElementById("pdf-annotation-undo")?.addEventListener("click", () => {
  const previous = history.pop();
  if (!previous) return;
  annotations = JSON.parse(previous);
  pagesHost.querySelectorAll(".pdf-page-annotation").forEach((canvas) => drawAnnotations(canvas, Number(canvas.dataset.pdfPage)));
  saveAnnotations();
});

document.getElementById("pdf-annotation-clear")?.addEventListener("click", async () => {
  if (!await window.AppDialog.confirm("Clear every annotation from this PDF?", { title: "Clear PDF annotations?", confirmLabel: "Clear annotations", danger: true })) return;
  snapshot();
  annotations = {};
  pagesHost.querySelectorAll(".pdf-page-annotation").forEach((canvas) => drawAnnotations(canvas, Number(canvas.dataset.pdfPage)));
  saveAnnotations();
});

window.addEventListener("studybuddy:open-pdf-note", (event) => {
  window.__pendingStudyBuddyPdf = null;
  renderPdf(event.detail.blob, event.detail.noteId).catch((error) => {
    pagesHost.textContent = `This PDF could not be displayed: ${error.message}`;
  });
});

if (window.__pendingStudyBuddyPdf) {
  const pending = window.__pendingStudyBuddyPdf;
  window.__pendingStudyBuddyPdf = null;
  renderPdf(pending.blob, pending.noteId).catch((error) => {
    pagesHost.textContent = `This PDF could not be displayed: ${error.message}`;
  });
}
