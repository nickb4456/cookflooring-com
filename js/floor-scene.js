      import * as THREE from "three";
      import { RoomEnvironment } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/environments/RoomEnvironment.js";

      // ---- Config -------------------------------------------------------
      const FLOOR_W = 12; // x extent
      const FLOOR_D = 8; // z extent
      const PLANK_W = 0.22; // board width (along z) — narrow-strip flooring
      const PLANK_GAP = 0.012;
      const PLANK_TH = 0.09;
      const WOOD_BASE = 0x9b7149;
      // -------------------------------------------------------------------

      const canvas = document.getElementById("floorCanvas");
      const floorSec = document.getElementById("floor");
      const floorIntro = document.getElementById("floorIntro");

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;

      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x2a211a, 40, 140);
      scene.background = new THREE.Color(0x241c16);

      const camera = new THREE.PerspectiveCamera(40, 2, 0.1, 250);

      // ---- Soft indoor reflections for the polished hardwood --------------
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

      // ---- Warm interior lighting -----------------------------------------
      scene.add(new THREE.HemisphereLight(0xfff0db, 0x40342a, 1.1));
      // Daylight raking in through the window — warm, shadow-casting.
      const windowLight = new THREE.DirectionalLight(0xffe7c4, 2.1);
      windowLight.position.set(-9, 11, 7);
      windowLight.castShadow = true;
      windowLight.shadow.mapSize.set(2048, 2048);
      windowLight.shadow.camera.left = -11;
      windowLight.shadow.camera.right = 11;
      windowLight.shadow.camera.top = 11;
      windowLight.shadow.camera.bottom = -11;
      windowLight.shadow.camera.far = 60;
      windowLight.shadow.bias = -0.0014;
      scene.add(windowLight);
      // Cozy lamp glow from the back corner.
      const lamp = new THREE.PointLight(0xffb867, 26, 26, 2.0);
      lamp.position.set(4.5, 2.6, -3);
      scene.add(lamp);
      const fill = new THREE.DirectionalLight(0xffd9a8, 0.35);
      fill.position.set(6, 4, 9);
      scene.add(fill);

      // ---- The room: two walls, baseboards, a glowing window --------------
      const WALL_H = 4.2;
      const BACK_Z = -FLOOR_D / 2 - 0.5;
      const RIGHT_X = FLOOR_W / 2 + 0.5;
      const wallMat = new THREE.MeshStandardMaterial({
        color: 0xece2d2,
        roughness: 0.96,
        metalness: 0,
      });
      const trimMat = new THREE.MeshStandardMaterial({
        color: 0xf6f1e8,
        roughness: 0.6,
      });
      const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(FLOOR_W + 2, WALL_H, 0.2),
        wallMat,
      );
      backWall.position.set(0, WALL_H / 2, BACK_Z);
      backWall.receiveShadow = true;
      scene.add(backWall);
      const rightWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, WALL_H, FLOOR_D + 2),
        wallMat,
      );
      rightWall.position.set(RIGHT_X, WALL_H / 2, 0);
      rightWall.receiveShadow = true;
      scene.add(rightWall);
      // Baseboards along the wall–floor junctions.
      const baseBack = new THREE.Mesh(
        new THREE.BoxGeometry(FLOOR_W + 2, 0.22, 0.06),
        trimMat,
      );
      baseBack.position.set(0, 0.11, BACK_Z + 0.13);
      scene.add(baseBack);
      const baseRight = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.22, FLOOR_D + 2),
        trimMat,
      );
      baseRight.position.set(RIGHT_X - 0.13, 0.11, 0);
      scene.add(baseRight);
      // Warm window on the back wall (frame + emissive pane).
      const winFrame = new THREE.Mesh(
        new THREE.BoxGeometry(3.4, 2.6, 0.16),
        trimMat,
      );
      winFrame.position.set(-2.4, 2.3, BACK_Z + 0.06);
      scene.add(winFrame);
      const winPane = new THREE.Mesh(
        new THREE.PlaneGeometry(3.0, 2.2),
        new THREE.MeshStandardMaterial({
          color: 0xfff2d8,
          emissive: 0xffe6bd,
          emissiveIntensity: 1.5,
        }),
      );
      winPane.position.set(-2.4, 2.3, BACK_Z + 0.16);
      scene.add(winPane);

      // ---- Subfloor the planks settle onto --------------------------------
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(FLOOR_W + 0.2, 0.3, FLOOR_D + 0.2),
        new THREE.MeshStandardMaterial({ color: 0x6b5236, roughness: 0.95 }),
      );
      slab.position.y = -0.18;
      slab.receiveShadow = true;
      scene.add(slab);

      // ---- Procedural hardwood grain (course lesson 5 canvas-texture) -----
      function woodGrainTexture() {
        const c = document.createElement("canvas");
        c.width = 512;
        c.height = 128;
        const g = c.getContext("2d");
        g.fillStyle = "#bb8d59";
        g.fillRect(0, 0, 512, 128);
        // Wavy grain streaks running along the plank length (u axis).
        for (let i = 0; i < 150; i++) {
          const y = Math.random() * 128;
          const shade = 0.55 + Math.random() * 0.55;
          g.strokeStyle = `rgba(${(116 * shade) | 0},${(82 * shade) | 0},${
            (50 * shade) | 0
          },${0.12 + Math.random() * 0.28})`;
          g.lineWidth = 0.5 + Math.random() * 1.6;
          g.beginPath();
          g.moveTo(0, y);
          for (let x = 0; x <= 512; x += 28) {
            g.lineTo(
              x,
              y + Math.sin(x * 0.03 + i) * 1.6 + (Math.random() - 0.5) * 1.4,
            );
          }
          g.stroke();
        }
        // A few darker knots for character.
        for (let k = 0; k < 5; k++) {
          const kx = Math.random() * 512;
          const ky = Math.random() * 128;
          const r = 2 + Math.random() * 4;
          const grad = g.createRadialGradient(kx, ky, 0, kx, ky, r * 2);
          grad.addColorStop(0, "rgba(60,40,24,0.5)");
          grad.addColorStop(1, "rgba(60,40,24,0)");
          g.fillStyle = grad;
          g.beginPath();
          g.arc(kx, ky, r * 2, 0, Math.PI * 2);
          g.fill();
        }
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace; // course lesson 2: tag color maps
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.anisotropy = renderer.capabilities.getMaxAnisotropy();
        return t;
      }
      const woodTex = woodGrainTexture();
      function plankMaterial() {
        // Satin-finished honey oak: clearcoat sheen + per-plank tone variation.
        const m = new THREE.MeshPhysicalMaterial({
          map: woodTex,
          roughness: 0.42,
          metalness: 0,
          clearcoat: 0.7,
          clearcoatRoughness: 0.32,
          envMapIntensity: 0.85,
        });
        m.color.setHSL(0.08, 0.22, 0.82 + (Math.random() - 0.5) * 0.16);
        return m;
      }

      // ---- Build the staggered floor; each plank flies in ----------------
      const easeOut = (t) => 1 - Math.pow(1 - t, 3);
      const clamp01 = (t) => Math.min(Math.max(t, 0), 1);
      const planks = [];
      const floorGroup = new THREE.Group();
      scene.add(floorGroup);

      const rows = Math.round(FLOOR_D / (PLANK_W + PLANK_GAP));
      const z0 = -((rows - 1) * (PLANK_W + PLANK_GAP)) / 2;
      const _v = new THREE.Vector3();
      const tmp = [];
      for (let r = 0; r < rows; r++) {
        const z = z0 + r * (PLANK_W + PLANK_GAP);
        // Staggered (running-bond) start offset per row.
        let x = -FLOOR_W / 2 + ((r * 0.9) % 2.4);
        // Lead-in stub so the row starts flush at the left edge.
        if (x > -FLOOR_W / 2 + 0.05) {
          const stub = -FLOOR_W / 2;
          tmp.push({ x: stub, z, len: x - stub - PLANK_GAP });
        }
        while (x < FLOOR_W / 2 - 0.05) {
          let len = 1.6 + Math.random() * 1.6;
          if (x + len > FLOOR_W / 2) len = FLOOR_W / 2 - x;
          tmp.push({ x, z, len });
          x += len + PLANK_GAP;
        }
      }

      tmp.forEach((p) => {
        if (p.len <= 0.12) return;
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(p.len, PLANK_TH, PLANK_W),
          plankMaterial(),
        );
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const final = new THREE.Vector3(p.x + p.len / 2, 0, p.z);
        // Scatter origin: high above + flung outward from center, tumbling.
        const dir = _v.set(final.x, 0, final.z).normalize();
        const start = new THREE.Vector3(
          final.x + dir.x * (2 + Math.random() * 3),
          5 + Math.random() * 4,
          final.z + dir.z * (2 + Math.random() * 3),
        );
        const startRot = new THREE.Euler(
          (Math.random() - 0.5) * 1.6,
          (Math.random() - 0.5) * 1.4,
          (Math.random() - 0.5) * 1.6,
        );
        mesh.position.copy(start);
        floorGroup.add(mesh);
        // Diagonal assembly order, left-to-right + front-to-back.
        planks.push({
          mesh,
          start,
          final,
          startRot,
          key: p.x + p.z * 0.6,
        });
      });

      // Assign scroll windows by assembly order.
      planks.sort((a, b) => a.key - b.key);
      planks.forEach((pl, i) => {
        const f = i / Math.max(1, planks.length - 1);
        pl.t0 = 0.05 + f * 0.7;
        pl.t1 = pl.t0 + 0.16;
      });

      // ---- Camera path: high reveal drifting to a grazing hero angle ------
      const camKeys = [
        new THREE.Vector3(0.5, 9.5, 11),
        new THREE.Vector3(-3.5, 5.5, 10),
        new THREE.Vector3(-6.5, 2.6, 8.5),
      ];
      const lookKeys = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-0.5, 0.1, -0.5),
        new THREE.Vector3(0, 0.2, -1),
      ];
      const camPath = new THREE.CatmullRomCurve3(camKeys);
      const lookPath = new THREE.CatmullRomCurve3(lookKeys);
      const camPos = new THREE.Vector3();
      const camLook = new THREE.Vector3();
      const easeInOutLite = (t) => t * t * (3 - 2 * t) * 0.7 + t * 0.3;

      function progress() {
        const rect = floorSec.getBoundingClientRect();
        const scrollable = floorSec.offsetHeight - window.innerHeight;
        if (scrollable <= 0) return 0;
        return Math.min(Math.max(-rect.top / scrollable, 0), 1);
      }

      function update() {
        const p = reduceMotion ? 1 : progress();

        camPath.getPoint(easeInOutLite(p), camPos);
        lookPath.getPoint(easeInOutLite(p), camLook);
        camera.position.copy(camPos);
        camera.lookAt(camLook);

        for (const pl of planks) {
          const t = clamp01((p - pl.t0) / (pl.t1 - pl.t0));
          if (t <= 0) {
            pl.mesh.visible = false;
            continue;
          }
          pl.mesh.visible = true;
          const e = easeOut(t);
          pl.mesh.position.lerpVectors(pl.start, pl.final, e);
          pl.mesh.rotation.set(
            pl.startRot.x * (1 - e),
            pl.startRot.y * (1 - e),
            pl.startRot.z * (1 - e),
          );
        }

        // Intro copy fades as the floor finishes landing.
        floorIntro.style.opacity = String(Math.max(0, 1 - p / 0.22));

        renderer.render(scene, camera);
      }

      function resize() {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
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
