// Load the first-floor scene after paint, then load the deck scene near its section.
(function () {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const loader = document.getElementById("loader");
  const base = new URL(".", document.currentScript.src);
  const loaded = new Set();

  function afterFirstPaint(fn) {
    const run = () => {
      requestAnimationFrame(() => window.setTimeout(fn, 80));
    };
    if (document.readyState === "complete") {
      run();
    } else {
      window.addEventListener("load", run, { once: true });
    }
  }

  async function loadScene(name, file, readyClass) {
    if (loaded.has(name)) return;
    loaded.add(name);
    try {
      await import(new URL(file, base).href);
      document.documentElement.classList.add(readyClass);
      const fallback = document.getElementById(name + "SceneFallback");
      if (fallback) fallback.hidden = true;
      if (name === "floor") {
        loader?.classList.add("is-done");
      }
    } catch (err) {
      console.warn(name + " scene load failed:", err.message);
      const fallback = document.getElementById(name + "SceneFallback");
      if (fallback) fallback.hidden = false;
      if (name === "floor") loader?.classList.add("is-done");
    }
  }

  function loadNear(target, fn) {
    if (!target || !("IntersectionObserver" in window)) {
      afterFirstPaint(fn);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        fn();
      },
      { rootMargin: "900px 0px" },
    );
    observer.observe(target);
  }

  if (reduceMotion) {
    loader?.classList.add("is-done");
    return;
  }

  afterFirstPaint(() => {
    loadScene("floor", "floor-scene.js", "scene-floor-ready");
  });
  loadNear(document.getElementById("hero"), () => {
    loadScene("hero", "hero-deck-scene.js", "scene-hero-ready");
  });
})();
