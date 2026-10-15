(() => {
  // app.js owns the current controls. Avoid installing a second text handler.
  if (window.__noteCanvasControlsReady) return;
  const canvas = document.getElementById("drawing-note-canvas");
  const textOptions = document.getElementById("canvas-text-options");
  if (!canvas || !textOptions) return;

  document.querySelectorAll("[data-note-tool]").forEach((button) => {
    button.addEventListener("click", () => {
      noteDrawingTool = button.dataset.noteTool;
      document.querySelectorAll("[data-note-tool]").forEach((item) => item.classList.toggle("active", item === button));
      textOptions.hidden = noteDrawingTool !== "text";
      canvas.style.cursor = noteDrawingTool === "text" ? "text" : noteDrawingTool === "eraser" ? "cell" : "crosshair";
    });
  });

  canvas.addEventListener("pointerdown", (event) => {
    if (noteDrawingTool !== "text" || activeNotebookNote()?.type !== "drawing") return;
    if (noteCanvasMode === "page" && notePageLayout === "document") return;
    if (event.target.closest?.(".canvas-text-editor")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const matrix = canvas.getScreenCTM?.();
    let point;
    if (matrix) {
      const svgPoint = canvas.createSVGPoint();
      svgPoint.x = event.clientX;
      svgPoint.y = event.clientY;
      const local = svgPoint.matrixTransform(matrix.inverse());
      point = { x: local.x, y: local.y };
    } else {
      const rect = canvas.getBoundingClientRect();
      point = { x: (event.clientX - rect.left) * drawingWorkspaceWidth() / rect.width, y: (event.clientY - rect.top) * drawingWorkspaceHeight() / rect.height };
    }
    noteDrawingTexts = noteDrawingTexts.filter((item) => (item?.text || "").trim());
    const scale = drawingWorkspaceWidth() / canvas.getBoundingClientRect().width;
    const textItem = {
      id: makeLocalId("canvas-text"), x: point.x, y: point.y,
      width: Math.min(drawingWorkspaceWidth() - point.x, drawingWorkspaceWidth() * 0.4),
      height: 220 * scale, style: noteCanvasTextStyle,
      fontSize: noteCanvasTextFormat.screenSize * scale,
      fontFamily: noteCanvasTextFormat.fontFamily, color: noteCanvasTextFormat.color,
      bold: noteCanvasTextFormat.bold, italic: noteCanvasTextFormat.italic, text: "",
    };
    noteDrawingTexts.push(textItem);
    selectedCanvasTextId = textItem.id;
    renderDrawingNoteVectors();
    requestAnimationFrame(() => document.querySelector(`#open-note-text-layer [data-canvas-text-id="${textItem.id}"]`)?.focus());
    saveDrawingNote();
  }, true);
})();
