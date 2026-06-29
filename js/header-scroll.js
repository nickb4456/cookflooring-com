      // Solidify the header once the user scrolls past the hero fold.
      (function () {
        const hdr = document.getElementById("siteHeader");
        if (!hdr) return;
        const onScroll = () =>
          hdr.classList.toggle("is-stuck", window.scrollY > 24);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
      })();
