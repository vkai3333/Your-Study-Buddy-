(() => {
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.querySelector("#notes-only-toggle")?.checked) window.setWorkspaceFullscreen?.(false);
  });
})();
