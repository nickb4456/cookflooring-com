      (function () {
        const videos = Array.from(
          document.querySelectorAll("video[muted][playsinline]"),
        );
        if (!videos.length) return;

        const play = (video) => {
          video.muted = true;
          video.playsInline = true;
          const attempt = video.play();
          if (attempt && typeof attempt.catch === "function") {
            attempt.catch(() => {});
          }
        };

        if (!("IntersectionObserver" in window)) {
          videos.forEach(play);
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
          { threshold: 0.24, rootMargin: "15% 0px" },
        );

        videos.forEach((video) => io.observe(video));
      })();
