(() => {
  const controls = document.getElementById("document-table-controls");
  const emptyState = document.getElementById("document-table-empty");
  const widthControl = document.getElementById("document-table-border-width");
  const colorControl = document.getElementById("document-table-border-color");
  const fillControl = document.getElementById("document-table-fill-color");
  if (!controls || !emptyState) return;

  let selectedTable = null;
  let selectedCell = null;

  const cssColorToHex = (value, fallback = "#ffffff") => {
    const parts = String(value || "").match(/\d+/g)?.slice(0, 3).map(Number);
    return parts?.length === 3 ? `#${parts.map((part) => part.toString(16).padStart(2, "0")).join("")}` : fallback;
  };

  const saveEditor = () => {
    const editor = selectedTable?.closest(".page-document-content");
    editor?.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const readSelection = () => {
    const selection = window.getSelection();
    const node = selection?.anchorNode;
    const element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
    const cell = element?.closest?.("th,td") || null;
    const table = cell?.closest("table") || element?.closest?.("table") || null;
    if (table?.closest(".page-document-content")) {
      selectedTable = table;
      selectedCell = cell || table.querySelector("th,td");
    } else if (!document.getElementById("document-edit-menu")?.contains(element)) {
      selectedTable = null;
      selectedCell = null;
    }
    const active = Boolean(selectedTable?.isConnected);
    document.querySelectorAll("[data-active-table-cell]").forEach((cell) => cell.removeAttribute("data-active-table-cell"));
    controls.hidden = !active;
    emptyState.hidden = active;
    if (active) {
      const firstCell = selectedTable.querySelector("th,td");
      const styles = firstCell ? getComputedStyle(firstCell) : null;
      widthControl.value = String(Math.min(6, Math.round(parseFloat(styles?.borderTopWidth) || 1)));
      const color = styles?.borderTopColor?.match(/\d+/g)?.slice(0, 3).map(Number);
      if (color?.length === 3) colorControl.value = `#${color.map((part) => part.toString(16).padStart(2, "0")).join("")}`;
      if (selectedCell) {
        selectedCell.dataset.activeTableCell = "true";
        fillControl.value = cssColorToHex(getComputedStyle(selectedCell).backgroundColor);
      }
    }
  };

  document.addEventListener("selectionchange", readSelection);
  document.addEventListener("pointerup", readSelection);
  document.addEventListener("keyup", readSelection);

  document.getElementById("document-edit-undo")?.addEventListener("click", () => document.execCommand("undo"));
  document.getElementById("document-edit-redo")?.addEventListener("click", () => document.execCommand("redo"));

  const applyBorders = () => {
    if (!selectedTable) return;
    selectedTable.querySelectorAll("th,td").forEach((cell) => {
      cell.style.borderStyle = widthControl.value === "0" ? "none" : "solid";
      cell.style.borderWidth = `${widthControl.value}px`;
      cell.style.borderColor = colorControl.value;
    });
    saveEditor();
  };
  widthControl.addEventListener("change", applyBorders);
  colorControl.addEventListener("input", applyBorders);
  fillControl?.addEventListener("input", () => {
    if (!selectedCell) return;
    selectedCell.style.backgroundColor = fillControl.value;
    saveEditor();
  });

  const mergeCellContent = (target, source) => {
    const targetHasText = target.textContent.trim() || target.querySelector("img,table,ul,ol");
    const sourceHasText = source.textContent.trim() || source.querySelector("img,table,ul,ol");
    if (targetHasText && sourceHasText) target.appendChild(document.createElement("br"));
    while (source.firstChild) target.appendChild(source.firstChild);
    if (!target.childNodes.length) target.appendChild(document.createElement("br"));
  };

  document.getElementById("document-table-merge-right")?.addEventListener("click", () => {
    if (!selectedCell) return;
    const neighbor = selectedCell.parentElement?.cells[selectedCell.cellIndex + 1];
    if (!neighbor || neighbor.rowSpan !== selectedCell.rowSpan) return;
    mergeCellContent(selectedCell, neighbor);
    selectedCell.colSpan += neighbor.colSpan || 1;
    neighbor.remove();
    saveEditor();
    readSelection();
  });

  document.getElementById("document-table-merge-down")?.addEventListener("click", () => {
    if (!selectedTable || !selectedCell) return;
    const row = selectedCell.parentElement;
    const nextRow = selectedTable.rows[row.rowIndex + (selectedCell.rowSpan || 1)];
    const neighbor = nextRow?.cells[selectedCell.cellIndex];
    if (!neighbor || neighbor.colSpan !== selectedCell.colSpan) return;
    mergeCellContent(selectedCell, neighbor);
    selectedCell.rowSpan += neighbor.rowSpan || 1;
    neighbor.remove();
    saveEditor();
    readSelection();
  });

  document.getElementById("document-table-split-cell")?.addEventListener("click", () => {
    if (!selectedTable || !selectedCell) return;
    const extraColumns = Math.max(0, selectedCell.colSpan - 1);
    const extraRows = Math.max(0, selectedCell.rowSpan - 1);
    const columnIndex = selectedCell.cellIndex;
    const rowIndex = selectedCell.parentElement.rowIndex;
    selectedCell.colSpan = 1;
    selectedCell.rowSpan = 1;
    for (let index = 0; index < extraColumns; index += 1) {
      const cell = selectedCell.parentElement.insertCell(columnIndex + 1 + index);
      cell.appendChild(document.createElement("br"));
    }
    for (let offset = 1; offset <= extraRows; offset += 1) {
      const row = selectedTable.rows[rowIndex + offset];
      if (!row) continue;
      for (let index = 0; index <= extraColumns; index += 1) {
        const cell = row.insertCell(Math.min(columnIndex + index, row.cells.length));
        cell.appendChild(document.createElement("br"));
      }
    }
    saveEditor();
    readSelection();
  });

  document.getElementById("document-table-add-row")?.addEventListener("click", () => {
    if (!selectedTable) return;
    const referenceRow = selectedCell?.parentElement || selectedTable.rows[selectedTable.rows.length - 1];
    const row = selectedTable.insertRow(referenceRow ? referenceRow.rowIndex + 1 : -1);
    const count = selectedTable.rows[0]?.cells.length || 1;
    for (let index = 0; index < count; index += 1) row.insertCell().appendChild(document.createElement("br"));
    selectedCell = row.cells[0];
    saveEditor();
  });

  document.getElementById("document-table-remove-row")?.addEventListener("click", () => {
    if (!selectedTable || selectedTable.rows.length <= 1) return;
    const row = selectedCell?.parentElement || selectedTable.rows[selectedTable.rows.length - 1];
    selectedTable.deleteRow(row.rowIndex);
    selectedCell = selectedTable.querySelector("th,td");
    saveEditor();
  });

  document.getElementById("document-table-add-column")?.addEventListener("click", () => {
    if (!selectedTable) return;
    const columnIndex = (selectedCell?.cellIndex ?? (selectedTable.rows[0]?.cells.length || 1) - 1) + 1;
    [...selectedTable.rows].forEach((row, rowIndex) => {
      const cell = rowIndex === 0 && row.parentElement?.tagName === "THEAD" ? document.createElement("th") : document.createElement("td");
      cell.appendChild(document.createElement("br"));
      row.insertBefore(cell, row.cells[columnIndex] || null);
    });
    saveEditor();
  });

  document.getElementById("document-table-remove-column")?.addEventListener("click", () => {
    if (!selectedTable || (selectedTable.rows[0]?.cells.length || 0) <= 1) return;
    const columnIndex = selectedCell?.cellIndex ?? selectedTable.rows[0].cells.length - 1;
    [...selectedTable.rows].forEach((row) => row.deleteCell(Math.min(columnIndex, row.cells.length - 1)));
    selectedCell = selectedTable.querySelector("th,td");
    saveEditor();
  });

  document.getElementById("document-table-delete")?.addEventListener("click", async () => {
    if (!selectedTable || !await window.AppDialog.confirm("Delete this table?", { title: "Delete table?", confirmLabel: "Delete table", danger: true })) return;
    const editor = selectedTable.closest(".page-document-content");
    selectedTable.remove();
    selectedTable = null;
    selectedCell = null;
    controls.hidden = true;
    emptyState.hidden = false;
    editor?.dispatchEvent(new Event("input", { bubbles: true }));
  });
})();
