      // If the 3D module fails (offline, blocked CDN), say so instead of hanging.
      setTimeout(() => {
        const l = document.getElementById("loader");
        if (l && !l.classList.contains("is-done")) {
          document.getElementById("loaderLabel").textContent =
            "Couldn't load 3D engine. Check your connection.";
        }
      }, 8000);
