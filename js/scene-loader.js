// Load WebGL after the first paint, and load the floor scene near its section.
(function () {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const loader = document.getElementById("loader");
  const loaderLabel = document.getElementById("loaderLabel");
  const base = new URL(".", document.currentScript.src);
  const loaded = new Set();

  loader?.classList.add("is-done");

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
      if (name === "hero") {
        loader?.classList.add("is-done");
      }
    } catch (err) {
      console.warn(name + " scene load failed:", err.message);
      if (loaderLabel) {
        loaderLabel.textContent = "Couldn't load 3D engine. Check your connection.";
      }
      loader?.classList.add("is-done");
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
    loadScene("hero", "hero-deck-scene.js", "scene-hero-ready");
  });
  loadNear(document.getElementById("floor"), () => {
    loadScene("floor", "floor-scene.js", "scene-floor-ready");
  });
})();
