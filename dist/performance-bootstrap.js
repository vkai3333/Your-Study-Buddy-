(function () {
  "use strict";
  function optimizeImage(image) {
    if (!(image instanceof HTMLImageElement)) return;
    if (!image.hasAttribute("loading")) image.loading = "lazy";
    image.decoding = "async";
  }
  document.querySelectorAll("img").forEach(optimizeImage);
  new MutationObserver((entries) => entries.forEach((entry) => entry.addedNodes.forEach((node) => {
    if (node instanceof HTMLImageElement) optimizeImage(node);
    else if (node instanceof Element) node.querySelectorAll("img").forEach(optimizeImage);
  }))).observe(document.documentElement, { childList: true, subtree: true });
})();
