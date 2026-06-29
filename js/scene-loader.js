// Load the WebGL scenes only when they are likely to improve the experience.
(function () {
  const desktopScene = window.matchMedia(
    "(min-width: 861px) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
  ).matches;
  const loader = document.getElementById("loader");
  const loaderLabel = document.getElementById("loaderLabel");

  function finishLiteMode() {
    document.documentElement.classList.add("scene-lite");
    loader?.classList.add("is-done");
  }

  if (!desktopScene) {
    finishLiteMode();
    return;
  }

  const base = new URL(".", document.currentScript.src);
  Promise.all([
    import(new URL("hero-deck-scene.js", base).href),
    import(new URL("floor-scene.js", base).href),
  ]).catch((err) => {
    console.warn("3D scene load failed:", err.message);
    if (loaderLabel) {
      loaderLabel.textContent = "Couldn't load 3D engine. Check your connection.";
    }
  });
})();
