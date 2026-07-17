      // If the 3D module fails (offline, blocked CDN), say so instead of hanging.
      setTimeout(() => {
        const l = document.getElementById("loader");
        if (l && !l.classList.contains("is-done")) {
          l.classList.add("is-done");
          const fallback = document.getElementById("floorSceneFallback");
          if (fallback) fallback.hidden = false;
        }
      }, 8000);
