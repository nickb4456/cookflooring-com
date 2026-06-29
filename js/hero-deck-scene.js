      import * as THREE from "three";

      // ---- Config -------------------------------------------------------
      const WOOD = 0x765947; // muted walnut board tone
      const WOOD_RAIL = 0x846554;
      const DECK_W = 10; // x
      const DECK_D = 6; // z
      const DECK_TOP = 1.0; // y of finished deck surface
      // -------------------------------------------------------------------

      const canvas = document.getElementById("heroCanvas");
      const hero = document.getElementById("hero");
      const loader = document.getElementById("loader");
      const loaderFill = document.getElementById("loaderFill");
      const loaderLabel = document.getElementById("loaderLabel");
      const introBlock = document.getElementById("introBlock");
      const outroBlock = document.getElementById("outroBlock");
      const scrollHint = document.getElementById("scrollHint");

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const isSmallScreen = window.matchMedia("(max-width: 860px)").matches;
      const maxPixelRatio = isSmallScreen ? 1 : 1.35;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !isSmallScreen,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.35;

      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x26344a, 30, 110);

      const camera = new THREE.PerspectiveCamera(42, 2, 0.1, 250);

      // ---- Dusk sky dome --------------------------------------------------
      const sky = new THREE.Mesh(
        new THREE.SphereGeometry(180, 24, 16),
        new THREE.ShaderMaterial({
          side: THREE.BackSide,
          depthWrite: false,
          fog: false,
          uniforms: {
            top: { value: new THREE.Color(0x16243a) },
            mid: { value: new THREE.Color(0x46607f) },
            glow: { value: new THREE.Color(0xcf9266) },
          },
          vertexShader: `
            varying vec3 vP;
            void main() {
              vP = position;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`,
          fragmentShader: `
            varying vec3 vP;
            uniform vec3 top; uniform vec3 mid; uniform vec3 glow;
            void main() {
              float h = normalize(vP).y;
              vec3 c = mix(mid, top, smoothstep(0.02, 0.55, h));
              float g = pow(max(0.0, 1.0 - abs(h + 0.02) * 4.5), 2.0);
              c = mix(c, glow, g * 0.5);
              gl_FragColor = vec4(c, 1.0);
            }`,
        }),
      );
      scene.add(sky);

      // ---- Lights ---------------------------------------------------------
      scene.add(new THREE.HemisphereLight(0x546e93, 0x2a221a, 1.7));

      const moon = new THREE.DirectionalLight(0xaec4e2, 1.5);
      moon.position.set(-14, 22, -10);
      moon.castShadow = true;
      moon.shadow.mapSize.set(isSmallScreen ? 768 : 1024, isSmallScreen ? 768 : 1024);
      moon.shadow.camera.left = -16;
      moon.shadow.camera.right = 16;
      moon.shadow.camera.top = 16;
      moon.shadow.camera.bottom = -16;
      moon.shadow.camera.far = 60;
      moon.shadow.bias = -0.0015;
      scene.add(moon);

      const warmFill = new THREE.DirectionalLight(0xb86f58, 0.42);
      warmFill.position.set(10, 4, 14);
      scene.add(warmFill);

      // ---- Flagstone patio --------------------------------------------------
      function flagstoneTexture() {
        const c = document.createElement("canvas");
        c.width = c.height = 512;
        const g = c.getContext("2d");
        g.fillStyle = "#3a414c";
        g.fillRect(0, 0, 512, 512);
        const rows = 8;
        const rh = 512 / rows;
        for (let r = 0; r < rows; r++) {
          let x = (r % 2) * -30;
          while (x < 512) {
            const w = 50 + Math.random() * 60;
            const shade = 68 + Math.floor(Math.random() * 22);
            g.fillStyle = `rgb(${shade},${shade + 4},${shade + 11})`;
            g.fillRect(x + 2.5, r * rh + 2.5, w - 5, rh - 5);
            x += w;
          }
        }
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(7, 7);
        return t;
      }
      const ground = new THREE.Mesh(
        new THREE.CircleGeometry(70, 48),
        new THREE.MeshStandardMaterial({
          map: flagstoneTexture(),
          roughness: 0.95,
          metalness: 0,
        }),
      );
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      // ---- Surroundings: trees, bushes, house -----------------------------
      const trunkMat = new THREE.MeshStandardMaterial({
        color: 0x3a2e22,
        roughness: 0.95,
      });
      function canopyMat() {
        const c = new THREE.Color().setHSL(
          0.3 + Math.random() * 0.05,
          0.32,
          0.2 + Math.random() * 0.08,
        );
        return new THREE.MeshStandardMaterial({
          color: c,
          roughness: 0.95,
          flatShading: true,
        });
      }
      function tree(x, z, s) {
        const g = new THREE.Group();
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14 * s, 0.22 * s, 2.4 * s, 6),
          trunkMat,
        );
        trunk.position.y = 1.2 * s;
        trunk.castShadow = false;
        g.add(trunk);
        const blobs = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < blobs; i++) {
          const r = (1.1 + Math.random() * 0.7) * s;
          const b = new THREE.Mesh(
            new THREE.IcosahedronGeometry(r, 1),
            canopyMat(),
          );
          b.position.set(
            (Math.random() - 0.5) * 1.4 * s,
            (2.6 + i * 0.9 + Math.random() * 0.5) * s,
            (Math.random() - 0.5) * 1.4 * s,
          );
          b.castShadow = false;
          g.add(b);
        }
        g.position.set(x, 0, z);
        g.rotation.y = Math.random() * Math.PI * 2;
        scene.add(g);
      }
      // Ring of trees around the courtyard (none in front of the camera path).
      const treeSpots = [
        [-16, -14, 1.5],
        [-9, -17, 1.8],
        [-2, -19, 1.4],
        [6, -18, 1.7],
        [13, -15, 1.5],
        [19, -9, 1.3],
        [21, 0, 1.6],
        [18, 9, 1.2],
        [-20, -6, 1.6],
        [-22, 3, 1.3],
        [-17, 11, 1.4],
        [12, 17, 1.3],
        [-10, 18, 1.5],
        [24, -16, 1.8],
        [-26, -12, 1.9],
      ];
      treeSpots.forEach(([x, z, s]) => tree(x, z, s));

      // Low bushes near the patio edge.
      const bushMat = new THREE.MeshStandardMaterial({
        color: 0x223622,
        roughness: 0.95,
        flatShading: true,
      });
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2 + 0.2;
        const r = 12.5 + Math.random() * 2.5;
        const s = 0.5 + Math.random() * 0.5;
        const b = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 1), bushMat);
        b.position.set(Math.cos(a) * r, s * 0.55, Math.sin(a) * r);
        b.castShadow = false;
        scene.add(b);
      }

      // Simple stone cottage, back-left, warm windows (echoes the old footage).
      function house() {
        const g = new THREE.Group();
        const stone = new THREE.MeshStandardMaterial({
          color: 0x4d4f55,
          roughness: 0.9,
        });
        const roofM = new THREE.MeshStandardMaterial({
          color: 0x2b2f36,
          roughness: 0.85,
        });
        const body = new THREE.Mesh(new THREE.BoxGeometry(9, 4.2, 6), stone);
        body.position.y = 2.1;
        body.castShadow = true;
        g.add(body);
        const roof = new THREE.Mesh(
          new THREE.CylinderGeometry(0.01, 4.6, 3, 4, 1),
          roofM,
        );
        roof.scale.set(1.45, 1, 1);
        roof.rotation.y = Math.PI / 4;
        roof.position.y = 5.7;
        g.add(roof);
        const winMat = new THREE.MeshStandardMaterial({
          color: 0x382408,
          emissive: 0xffc878,
          emissiveIntensity: 1.4,
        });
        [
          [-2.6, 0],
          [0, 0],
          [2.6, 0],
        ].forEach(([wx]) => {
          const w = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.5), winMat);
          w.position.set(wx, 2.0, 3.01);
          g.add(w);
        });
        const porch = new THREE.PointLight(0xffb86b, 0.9, 14, 1.8);
        porch.position.set(0, 2.6, 3.6);
        g.add(porch);
        g.position.set(-16.5, 0, -13);
        g.rotation.y = 0.5;
        scene.add(g);
      }
      house();

      // ---- Deck build (everything below animates with scroll) -------------
      const easeOut = (t) => 1 - Math.pow(1 - t, 3);
      const clamp01 = (t) => Math.min(Math.max(t, 0), 1);
      // Each entry: { node, t0, t1, mode: "drop"|"grow", baseY, drop }
      const builds = [];
      function stage(node, t0, t1, mode, drop = 2.0) {
        builds.push({ node, t0, t1, mode, baseY: node.position.y, drop });
      }

      function woodMat(base, spread = 0.05) {
        const c = new THREE.Color(base);
        const hsl = {};
        c.getHSL(hsl);
        c.setHSL(
          hsl.h + (Math.random() - 0.5) * 0.015,
          hsl.s + (Math.random() - 0.5) * 0.06,
          hsl.l + (Math.random() - 0.5) * spread,
        );
        return new THREE.MeshStandardMaterial({ color: c, roughness: 0.78 });
      }
      function beam(w, h, d, mat) {
        const m = new THREE.Mesh(
          new THREE.BoxGeometry(w, h, d),
          mat || woodMat(WOOD, 0.03),
        );
        m.castShadow = true;
        m.receiveShadow = true;
        return m;
      }
      // Bottom-origin box so scale.y "grows" it out of the ground.
      function grownBeam(w, h, d, mat) {
        const geo = new THREE.BoxGeometry(w, h, d);
        geo.translate(0, h / 2, 0);
        const m = new THREE.Mesh(geo, mat || woodMat(WOOD, 0.03));
        m.castShadow = true;
        m.receiveShadow = true;
        return m;
      }

      const deck = new THREE.Group();
      scene.add(deck);

      // Support posts rise first.
      const postXs = [-4.5, 0, 4.5];
      const postZs = [-2.6, 2.6];
      let pi = 0;
      for (const px of postXs) {
        for (const pz of postZs) {
          const p = grownBeam(0.2, 0.74, 0.2, woodMat(0x5f493c, 0.03));
          p.position.set(px, 0, pz);
          deck.add(p);
          stage(p, 0.04 + pi * 0.015, 0.13 + pi * 0.015, "grow");
          pi++;
        }
      }

      // Frame: rim joists + inner joists drop in as one structure.
      const frame = new THREE.Group();
      const rimMat = woodMat(0x634d40, 0.02);
      const rims = [
        beam(DECK_W, 0.2, 0.18, rimMat), // front
        beam(DECK_W, 0.2, 0.18, rimMat), // back
        beam(0.18, 0.2, DECK_D - 0.36, rimMat), // left
        beam(0.18, 0.2, DECK_D - 0.36, rimMat), // right
      ];
      rims[0].position.set(0, 0.84, DECK_D / 2 - 0.09);
      rims[1].position.set(0, 0.84, -DECK_D / 2 + 0.09);
      rims[2].position.set(-DECK_W / 2 + 0.09, 0.84, 0);
      rims[3].position.set(DECK_W / 2 - 0.09, 0.84, 0);
      rims.forEach((r) => frame.add(r));
      for (let x = -4; x <= 4; x += 1) {
        const j = beam(0.12, 0.2, DECK_D - 0.4, woodMat(0x634d40, 0.02));
        j.position.set(x, 0.84, 0);
        frame.add(j);
      }
      deck.add(frame);
      stage(frame, 0.13, 0.27, "drop", 2.4);

      // Deck boards lay one by one, left to right.
      const BOARD_W = 0.26;
      const GAP = 0.014;
      const nBoards = Math.floor(DECK_W / (BOARD_W + GAP));
      const firstX = -((nBoards - 1) * (BOARD_W + GAP)) / 2;
      for (let i = 0; i < nBoards; i++) {
        const b = beam(BOARD_W, 0.06, DECK_D + 0.2, woodMat(WOOD, 0.07));
        b.position.set(firstX + i * (BOARD_W + GAP), DECK_TOP - 0.03, 0);
        deck.add(b);
        const t0 = 0.26 + (i / nBoards) * 0.32;
        stage(b, t0, t0 + 0.05, "drop", 1.1);
      }

      // Stairs, front center.
      const stairs = new THREE.Group();
      const STEP_RISE = 0.25;
      const STEP_RUN = 0.32;
      for (let s = 0; s < 3; s++) {
        const tread = beam(2.4, 0.07, STEP_RUN + 0.06, woodMat(WOOD, 0.05));
        tread.position.set(
          0,
          STEP_RISE * (s + 1) - 0.035,
          DECK_D / 2 + STEP_RUN * (3 - s) - STEP_RUN / 2,
        );
        stairs.add(tread);
        const riser = beam(2.4, STEP_RISE, 0.05, woodMat(0x5f493c, 0.03));
        riser.position.set(
          0,
          STEP_RISE * (s + 0.5),
          DECK_D / 2 + STEP_RUN * (3 - s),
        );
        stairs.add(riser);
      }
      deck.add(stairs);
      stage(stairs, 0.58, 0.7, "drop", 1.6);

      // Railing: posts grow, then panels (rails + balusters) drop in.
      const RAIL_H = 1.0;
      const capLightMats = [];
      const capLights = [];
      function railPost(x, z, withLight) {
        const g = new THREE.Group();
        const p = grownBeam(0.12, RAIL_H, 0.12, woodMat(WOOD_RAIL, 0.03));
        g.add(p);
        const cap = beam(0.2, 0.05, 0.2, woodMat(0x5f493c, 0.02));
        cap.position.y = RAIL_H + 0.025;
        g.add(cap);
        const glowMat = new THREE.MeshStandardMaterial({
          color: 0x2a1c0c,
          emissive: 0xffb86b,
          emissiveIntensity: 0,
        });
        capLightMats.push(glowMat);
        const glow = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.07, 0.12),
          glowMat,
        );
        glow.position.y = RAIL_H + 0.085;
        g.add(glow);
        if (withLight) {
          const pl = new THREE.PointLight(0xffb86b, 0, 5.5, 2.0);
          pl.position.y = RAIL_H + 0.3;
          g.add(pl);
          capLights.push(pl);
        }
        g.position.set(x, DECK_TOP, z);
        return g;
      }
      function railPanel(x1, z1, x2, z2) {
        const g = new THREE.Group();
        const len = Math.hypot(x2 - x1, z2 - z1);
        const railMat = woodMat(WOOD_RAIL, 0.02);
        const top = beam(len - 0.12, 0.07, 0.09, railMat);
        top.position.y = RAIL_H - 0.035;
        g.add(top);
        const bottom = beam(len - 0.12, 0.06, 0.07, railMat);
        bottom.position.y = 0.12;
        g.add(bottom);
        const balMat = woodMat(WOOD_RAIL, 0.02);
        const n = Math.max(2, Math.round(len / 0.17));
        for (let i = 1; i < n; i++) {
          const b = new THREE.Mesh(
            new THREE.BoxGeometry(0.035, RAIL_H - 0.21, 0.035),
            balMat,
          );
          b.position.set(
            -len / 2 + (i / n) * len,
            (RAIL_H - 0.21) / 2 + 0.15,
            0,
          );
          b.castShadow = true;
          g.add(b);
        }
        g.position.set((x1 + x2) / 2, DECK_TOP, (z1 + z2) / 2);
        g.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
        return g;
      }

      const inset = 0.12;
      const L = -DECK_W / 2 + inset;
      const R = DECK_W / 2 - inset;
      const B = -DECK_D / 2 + inset;
      const F = DECK_D / 2 - inset;
      const STAIR_GAP = 1.35; // half-width of the railing opening at the stairs
      // Post positions: corners + midpoints + stair flanks.
      const postSpots = [
        [L, B],
        [-DECK_W / 6, B],
        [DECK_W / 6, B],
        [R, B], // back
        [L, 0],
        [R, 0], // side mids
        [L, F],
        [R, F], // front corners
        [-STAIR_GAP, F],
        [STAIR_GAP, F], // stair opening
      ];
      postSpots.forEach(([x, z], i) => {
        const p = railPost(x, z, i === 0 || i === 3 || i === 8 || i === 9);
        deck.add(p);
        stage(p, 0.66 + i * 0.012, 0.76 + i * 0.012, "grow");
      });
      const panels = [
        [L, B, -DECK_W / 6, B],
        [-DECK_W / 6, B, DECK_W / 6, B],
        [DECK_W / 6, B, R, B],
        [L, B, L, 0],
        [L, 0, L, F],
        [R, B, R, 0],
        [R, 0, R, F],
        [L, F, -STAIR_GAP, F],
        [STAIR_GAP, F, R, F],
      ];
      panels.forEach(([x1, z1, x2, z2], i) => {
        const p = railPanel(x1, z1, x2, z2);
        deck.add(p);
        stage(p, 0.78 + i * 0.013, 0.88 + i * 0.013, "drop", 0.9);
      });

      // ---- Scroll-driven choreography --------------------------------------
      function progress() {
        const rect = hero.getBoundingClientRect();
        const scrollable = hero.offsetHeight - window.innerHeight;
        if (scrollable <= 0) return 0;
        return Math.min(Math.max(-rect.top / scrollable, 0), 1);
      }

      const camKeys = [
        new THREE.Vector3(0, 1.2, 12.5), // low, frontal — empty courtyard
        new THREE.Vector3(5.5, 2.1, 10.5), // drifting right as the frame goes up
        new THREE.Vector3(9.0, 4.6, 8.5), // elevated three-quarter reveal
      ];
      const lookKeys = [
        new THREE.Vector3(0, 0.8, -6),
        new THREE.Vector3(0, 1.0, -1),
        new THREE.Vector3(0, 0.9, 0),
      ];
      const camPath = new THREE.CatmullRomCurve3(camKeys);
      const lookPath = new THREE.CatmullRomCurve3(lookKeys);
      const camPos = new THREE.Vector3();
      const camLook = new THREE.Vector3();

      function applyBuild(p) {
        for (const b of builds) {
          const t = clamp01((p - b.t0) / (b.t1 - b.t0));
          if (t <= 0) {
            b.node.visible = false;
            continue;
          }
          b.node.visible = true;
          const e = easeOut(t);
          if (b.mode === "grow") {
            b.node.scale.y = Math.max(e, 0.0001);
          } else {
            b.node.position.y = b.baseY + (1 - e) * b.drop;
          }
        }
        // Post-cap lights warm up at the very end.
        const lightRamp = clamp01((p - 0.9) / 0.1);
        for (const m of capLightMats) m.emissiveIntensity = lightRamp * 1.8;
        for (const l of capLights) l.intensity = lightRamp * 1.1;
        warmFill.intensity = 0.45 + lightRamp * 0.25;
      }

      function update() {
        const p = reduceMotion ? 1 : progress();

        camPath.getPoint(easeInOutLite(p), camPos);
        lookPath.getPoint(easeInOutLite(p), camLook);
        camera.position.copy(camPos);
        camera.lookAt(camLook);

        applyBuild(p);

        // Overlay choreography: intro fades out early, outro fades in late.
        introBlock.style.opacity = String(Math.max(0, 1 - p / 0.18));
        outroBlock.style.opacity = String(Math.max(0, (p - 0.82) / 0.18));
        scrollHint.style.opacity = String(Math.max(0, 1 - p / 0.1));

        renderer.render(scene, camera);
      }
      function easeInOutLite(t) {
        return t * t * (3 - 2 * t) * 0.7 + t * 0.3; // soften ends, keep linear feel
      }

      function resize() {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        if (!w || !h) return;
        const targetW = Math.floor(w * renderer.getPixelRatio());
        const targetH = Math.floor(h * renderer.getPixelRatio());
        if (canvas.width === targetW && canvas.height === targetH) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }

      let ticking = false;
      function onScroll() {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(() => {
            update();
            ticking = false;
          });
        }
      }

      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", () => {
        resize();
        update();
      });

      resize();
      update();

      // Scene is procedural — first render means we're done loading.
      loaderFill.style.width = "100%";
      loaderLabel.textContent = "Loading 100%";
      requestAnimationFrame(() => loader.classList.add("is-done"));
