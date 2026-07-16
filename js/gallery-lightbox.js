// AGENT_TARGET: gallery-lightbox — keyboard-operable lightbox for .gallery__grid figures
(function () {
  const grid = document.querySelector(".gallery__grid");
  if (!grid) return;

  const overlay = document.createElement("div");
  overlay.id = "gallery-lightbox";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Photo lightbox");
  overlay.hidden = true;
  overlay.innerHTML =
    '<button class="lightbox__close" aria-label="Close photo">&#x2715;</button>' +
    '<figure class="lightbox__figure">' +
    '<img class="lightbox__img" src="" alt="" />' +
    '<figcaption class="lightbox__caption"></figcaption>' +
    "</figure>";
  document.body.appendChild(overlay);

  const closeBtn = overlay.querySelector(".lightbox__close");
  const img = overlay.querySelector(".lightbox__img");
  const caption = overlay.querySelector(".lightbox__caption");
  let triggerEl = null;

  function open(figure) {
    const srcImg = figure.querySelector("img");
    if (!srcImg) return;
    triggerEl = figure;
    const srcset = srcImg.getAttribute("srcset") || "";
    const match960 = srcset.match(/(\S+)\s+960w/);
    img.src = match960 ? match960[1] : srcImg.getAttribute("src");
    img.alt = srcImg.getAttribute("alt") || "";
    caption.textContent =
      figure.querySelector("figcaption")?.textContent.trim() || "";
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function close() {
    overlay.hidden = true;
    document.body.style.overflow = "";
    img.src = "";
    if (triggerEl) {
      triggerEl.focus();
      triggerEl = null;
    }
  }

  grid.querySelectorAll("figure").forEach(function (figure) {
    const srcImg = figure.querySelector("img");
    const altText = srcImg ? srcImg.getAttribute("alt") || "gallery photo" : "gallery photo";
    figure.setAttribute("tabindex", "0");
    figure.setAttribute("role", "button");
    figure.setAttribute("aria-label", "Expand: " + altText);
    figure.style.cursor = "pointer";

    figure.addEventListener("click", function () {
      open(figure);
    });
    figure.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open(figure);
      }
    });
  });

  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !overlay.hidden) close();
  });
})();
