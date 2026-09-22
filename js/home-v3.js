/* Homepage v3 interactions: menu, hero entrance, service previews,
   before/after slider, pinned sideways gallery, scroll reveals.
   Every piece degrades to plain, visible content without JS. */
(function () {
  "use strict";
  const doc = document;
  const body = doc.body;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* Hero entrance */
  requestAnimationFrame(() =>
    requestAnimationFrame(() => body.classList.add("is-ready")),
  );

  /* Full-screen menu */
  const menuBtn = doc.querySelector(".bar__menu");
  const menu = doc.getElementById("menu");
  if (menuBtn && menu) {
    const setOpen = (open) => {
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.querySelector(".bar__menu-label").textContent = open
        ? "Close"
        : "Menu";
      body.classList.toggle("menu-open", open);
      if (open) {
        menu.hidden = false;
        requestAnimationFrame(() => menu.classList.add("is-open"));
        const first = menu.querySelector("a");
        if (first) first.focus({ preventScroll: true });
      } else {
        menu.classList.remove("is-open");
        window.setTimeout(
          () => {
            if (!menu.classList.contains("is-open")) menu.hidden = true;
          },
          reduce ? 0 : 600,
        );
      }
    };
    menuBtn.addEventListener("click", () =>
      setOpen(menuBtn.getAttribute("aria-expanded") !== "true"),
    );
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a")) setOpen(false);
    });
    doc.addEventListener("keydown", (e) => {
      if (
        e.key === "Escape" &&
        menuBtn.getAttribute("aria-expanded") === "true"
      ) {
        setOpen(false);
        menuBtn.focus();
      }
    });
  }

  /* Services index: a photo follows the cursor */
  const index = doc.querySelector("[data-index]");
  const float = doc.querySelector(".index__float");
  if (index && float && fine) {
    const img = float.querySelector("img");
    let x = 0,
      y = 0,
      fx = 0,
      fy = 0,
      raf = 0,
      on = false;
    const loop = () => {
      fx += (x - fx) * 0.18;
      fy += (y - fy) * 0.18;
      float.style.transform = `translate3d(${fx + 28}px, ${fy - 180}px, 0)`;
      raf = on || Math.abs(x - fx) > 0.5 ? requestAnimationFrame(loop) : 0;
    };
    index.querySelectorAll("a[data-preview]").forEach((a) => {
      const pre = new Image();
      pre.src = a.dataset.preview;
      a.addEventListener("mouseenter", () => {
        img.src = a.dataset.preview;
        on = true;
        float.classList.add("is-on");
        if (!raf) raf = requestAnimationFrame(loop);
      });
      a.addEventListener("mouseleave", () => {
        on = false;
        float.classList.remove("is-on");
      });
    });
    index.addEventListener("mousemove", (e) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf) {
        fx = x;
        fy = y;
        raf = requestAnimationFrame(loop);
      }
    });
  }

  /* Before / after */
  doc.querySelectorAll("[data-compare]").forEach((fig) => {
    const range = fig.querySelector(".compare__range");
    if (!range) return;
    const set = (v) => fig.style.setProperty("--pos", v + "%");
    range.addEventListener("input", () => set(range.value));
    // A short hint sweep the first time it scrolls into view
    if (!reduce && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          if (!entries[0].isIntersecting) return;
          io.disconnect();
          let t0 = null;
          const sweep = (t) => {
            if (t0 === null) t0 = t;
            const p = Math.min(1, (t - t0) / 1600);
            const v = 50 + Math.sin(p * Math.PI * 2) * 22 * (1 - p);
            set(v.toFixed(1));
            range.value = v;
            if (p < 1) requestAnimationFrame(sweep);
          };
          requestAnimationFrame(sweep);
        },
        { threshold: 0.6 },
      );
      io.observe(fig);
    }
  });

  /* Work: vertical scroll drives a sideways rail on wide screens */
  const work = doc.getElementById("work");
  const rail = doc.querySelector("[data-work-rail]");
  const bar = doc.querySelector("[data-work-bar]");
  const now = doc.querySelector("[data-work-now]");
  const total = doc.querySelector("[data-work-total]");
  if (work && rail) {
    const figs = Array.from(rail.querySelectorAll("figure"));
    if (total) total.textContent = String(figs.length).padStart(2, "0");
    const wide = window.matchMedia("(min-width: 900px)");
    let travel = 0;

    const report = (p) => {
      if (bar) bar.style.transform = `scaleX(${Math.max(0.08, p)})`;
      if (now)
        now.textContent = String(
          Math.min(figs.length, 1 + Math.round(p * (figs.length - 1))),
        ).padStart(2, "0");
    };
    const measure = () => {
      const pinned = wide.matches && !reduce;
      work.classList.toggle("is-pinned", pinned);
      if (!pinned) {
        work.style.height = "";
        rail.style.transform = "";
        return;
      }
      travel = Math.max(0, rail.scrollWidth - window.innerWidth);
      work.style.height = window.innerHeight + travel + "px";
      onScroll();
    };
    const onScroll = () => {
      if (!work.classList.contains("is-pinned")) return;
      const r = work.getBoundingClientRect();
      const span = work.offsetHeight - window.innerHeight;
      const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
      rail.style.transform = `translate3d(${-p * travel}px, 0, 0)`;
      report(p);
    };
    rail.addEventListener(
      "scroll",
      () => {
        if (work.classList.contains("is-pinned")) return;
        const max = rail.scrollWidth - rail.clientWidth;
        report(max > 0 ? rail.scrollLeft / max : 0);
      },
      { passive: true },
    );
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    wide.addEventListener("change", measure);
    rail
      .querySelectorAll("img")
      .forEach((im) => im.addEventListener("load", measure, { once: true }));
    measure();
  }

  /* Scroll reveals */
  if (!reduce && "IntersectionObserver" in window) {
    const targets = doc.querySelectorAll(
      ".sec__head > *, .index li, .diff__copy > *, .compare, .craft__copy > *, .craft__video, .steps li, .decks3__copy > *, .decks3__grid figure, .towns3, .area3__scope, .faq3__side > *, .faq3__item, .funnel3__pitch > *, .quote-card, .foot3__top > *",
    );
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          en.target.classList.add("in");
          io.unobserve(en.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    targets.forEach((el, i) => {
      el.classList.add("rv");
      const sib = el.parentElement
        ? Array.prototype.indexOf.call(el.parentElement.children, el)
        : 0;
      el.style.transitionDelay = Math.min(sib, 6) * 70 + "ms";
      io.observe(el);
    });
    doc.querySelectorAll(".steps li").forEach((li) => io.observe(li));
  }
})();
