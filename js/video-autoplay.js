      (function () {
        const videos = Array.from(
          document.querySelectorAll("video[data-autoplay-video], video[muted][playsinline]"),
        );
        if (!videos.length) return;

        // AGENT_TARGET: viewport-gated-reel-load — DOM attrs eager, network warm deferred to near-view
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
          // Do NOT force preload="auto" here. Leaving the author/browser default
          // (metadata) keeps a below-fold reel from fetching its full payload
          // before it is near view. warmLoad() escalates this at the right time.
          if (!video.preload) video.preload = "metadata";
        };

        // Begin the real network fetch for a reel — only called once the video is
        // near view, so below-fold advertising reels stay dormant until needed.
        const warmLoad = (video) => {
          if (video.dataset.reelWarmed === "1") return;
          video.dataset.reelWarmed = "1";
          if (video.preload !== "auto") video.preload = "auto";
          if (video.dataset.autoplayVideo !== undefined) {
            video.load();
          }
        };

        const play = (video) => {
          prepare(video);
          warmLoad(video);
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
          // Intentionally NOT calling video.load() here. The IntersectionObserver
          // below (or playVisible in the fallback path) triggers warmLoad() once
          // the reel is near view, so we no longer fetch every payload up front.
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
