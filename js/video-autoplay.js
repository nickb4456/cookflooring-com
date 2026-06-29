      (function () {
        const videos = Array.from(
          document.querySelectorAll("video[data-autoplay-video], video[muted][playsinline]"),
        );
        if (!videos.length) return;

        const prepare = (video) => {
          video.muted = true;
          video.defaultMuted = true;
          video.loop = true;
          video.autoplay = true;
          video.playsInline = true;
          video.setAttribute("muted", "");
          video.setAttribute("playsinline", "");
          video.setAttribute("webkit-playsinline", "");
          video.setAttribute("autoplay", "");
          video.setAttribute("loop", "");
          if (video.preload !== "auto") video.preload = "auto";
        };

        const play = (video) => {
          prepare(video);
          const attempt = video.play();
          if (attempt && typeof attempt.catch === "function") {
            attempt.catch(() => {});
          }
        };

        const isVisible = (video) => {
          const rect = video.getBoundingClientRect();
          return rect.bottom > 0 && rect.top < window.innerHeight;
        };

        const playVisible = () => {
          videos.forEach((video) => {
            if (isVisible(video)) {
              play(video);
            } else {
              video.pause();
            }
          });
        };

        videos.forEach((video) => {
          prepare(video);
          video.addEventListener("loadeddata", () => play(video), { once: true });
          video.addEventListener("canplay", () => play(video), { once: true });
          if (video.dataset.autoplayVideo !== undefined) {
            video.load();
          }
        });

        if (!("IntersectionObserver" in window)) {
          playVisible();
          window.addEventListener("scroll", playVisible, { passive: true });
          window.addEventListener("resize", playVisible);
          return;
        }

        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              const video = entry.target;
              if (entry.isIntersecting) {
                play(video);
              } else {
                video.pause();
              }
            });
          },
          { threshold: 0.08, rootMargin: "35% 0px" },
        );

        videos.forEach((video) => io.observe(video));
        window.addEventListener("scroll", playVisible, { passive: true });
        window.addEventListener("focus", playVisible);
        document.addEventListener("visibilitychange", () => {
          if (!document.hidden) playVisible();
        });
        window.setTimeout(playVisible, 350);
        window.setTimeout(playVisible, 1400);
      })();
