      // One orchestrated, staggered entrance for the real-work section.
      (function () {
        const items = Array.from(document.querySelectorAll(".reveal"));
        if (!("IntersectionObserver" in window) || !items.length) {
          items.forEach((el) => el.classList.add("in"));
          return;
        }
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              const el = entry.target;
              // Stagger siblings within the same row/group.
              const sibs = Array.from(
                el.parentElement.querySelectorAll(":scope > .reveal"),
              );
              const i = Math.max(0, sibs.indexOf(el));
              el.style.transitionDelay = i * 90 + "ms";
              el.classList.add("in");
              io.unobserve(el);
            });
          },
          { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
        );
        items.forEach((el) => io.observe(el));
      })();
