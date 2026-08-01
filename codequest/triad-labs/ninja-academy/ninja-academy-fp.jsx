import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";

/* ─────────────────────────────────────────────────────────
   NINJA ACADEMY — first-person trial prototype
   Bright-chamber futurism: pale fog, hard white geometry,
   indigo signal, amber threat. One rule holds from the last
   build: steps buy CONTENT (how much trial spawns), never POWER.
   ───────────────────────────────────────────────────────── */

const C = {
  fog: 0xdfe6ec,
  floor: 0xb9c3cd,
  struct: 0xf4f7f9,
  indigo: 0x4b5bff,
  amber: 0xff8a3d,
  gem: 0x12cbb8,
  ink: "#141922",
  paper: "#EDF1F5",
  line: "rgba(20,25,34,0.16)",
};
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');`;
const grotesk = "'Space Grotesk', system-ui, sans-serif";
const mono = "'JetBrains Mono', ui-monospace, monospace";

const BASE_NODES = 4;
const BASE_DRONES = 1;

/* ── STYLES ──────────────────────────────────────────────
   Four schools. Each one changes the numbers you feel — reach,
   weight, forgiveness, air — and each carries a different super.
   Nothing here is cosmetic.
   ──────────────────────────────────────────────────────── */
const STYLES = {
  shadowmark: {
    name: "Shadowmark",
    tag: "The vanishing school",
    accent: "#4B5BFF",
    speed: 6.8, sprint: 12.4, jump: 8.6, dash: 20, dashCd: 0.75,
    integrity: 2, reach: 4.2, damage: 1, deflects: false, regen: 0.22,
    super: "shatter",
    superName: "Shattering Palm",
    line: "Fastest on foot, two dashes to everyone else's one, and the thinnest skin in the academy. You survive by not being where the strike lands.",
    trade: "Two integrity. One mistake matters.",
  },
  skyborn: {
    name: "Skyborn",
    tag: "The rising school",
    accent: "#FF8A3D",
    speed: 5.6, sprint: 9.6, jump: 11.4, dash: 15, dashCd: 1.1,
    integrity: 3, reach: 7.5, damage: 1, deflects: false, regen: 0.2,
    super: "beam",
    superName: "Sunwrit Lance",
    line: "Heavy on the ground, weightless off it. You jump higher than anything else here and strike from well outside a sentry's reach.",
    trade: "Slow feet. The chamber floor is not your friend.",
  },
  ironbound: {
    name: "Ironbound",
    tag: "The standing school",
    accent: "#8A6A3D",
    speed: 5.4, sprint: 8.8, jump: 7.4, dash: 11, dashCd: 1.6,
    integrity: 5, reach: 3.6, damage: 2, deflects: false, regen: 0.16,
    super: "slam",
    superName: "Falling Mountain",
    line: "Five integrity and a strike that breaks a guard in one. You do not dodge. You arrive, and things stop.",
    trade: "Short reach, low jump, a dash you can barely call one.",
  },
  stillwater: {
    name: "Stillwater",
    tag: "The reading school",
    accent: "#12CBB8",
    speed: 6.2, sprint: 10.6, jump: 8.4, dash: 16, dashCd: 1.2,
    integrity: 3, reach: 4.6, damage: 1, deflects: true, regen: 0.34,
    super: "still",
    superName: "Held Breath",
    line: "Hit a raised guard and you turn the recoil aside instead of wearing it. Stamina returns fast. The school for people who want to learn the timing rather than survive it.",
    trade: "Nothing spectacular. You have to actually be good.",
  },
};

export default function NinjaAcademyFP() {
  const [screen, setScreen] = useState("style");
  const [styleKey, setStyleKey] = useState("shadowmark");
  const [steps, setSteps] = useState(6000);
  const [hud, setHud] = useState({ nodes: 0, total: 0, drones: 0, integrity: 3, maxIntegrity: 3, stamina: 1, charge: 0, gems: 0, gemTotal: 6, msg: "", ready: false });
  const [result, setResult] = useState(null);
  const mountRef = useRef(null);
  const gameRef = useRef(null);

  const nodeCount = BASE_NODES + Math.min(8, Math.floor(steps / 1500));
  const droneCount = BASE_DRONES + Math.min(3, Math.floor(steps / 5000));
  const ST = STYLES[styleKey];

  /* ── THE SIMULATION ── */
  useEffect(() => {
    if (screen !== "play" || !mountRef.current) return;
    const mount = mountRef.current;
    const S = STYLES[styleKey] || STYLES.shadowmark;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(C.fog);
    scene.fog = new THREE.Fog(C.fog, 18, 95);

    const camera = new THREE.PerspectiveCamera(72, mount.clientWidth / mount.clientHeight, 0.1, 400);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa8b8, 1.0));
    const sun = new THREE.DirectionalLight(0xffffff, 0.85);
    sun.position.set(24, 40, 16);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -50; sun.shadow.camera.right = 50;
    sun.shadow.camera.top = 50; sun.shadow.camera.bottom = -50;
    scene.add(sun);

    /* floor + grid */
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshLambertMaterial({ color: C.floor })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    const grid = new THREE.GridHelper(200, 100, C.indigo, 0x9aa6b4);
    grid.material.opacity = 0.25;
    grid.material.transparent = true;
    grid.position.y = 0.01;
    scene.add(grid);

    /* structures — a training chamber you can actually climb */
    const boxes = [];
    const structMat = new THREE.MeshLambertMaterial({ color: C.struct });
    const addBox = (x, y, z, w, h, d, mat) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || structMat);
      m.position.set(x, y + h / 2, z);
      m.castShadow = true; m.receiveShadow = true;
      scene.add(m);
      boxes.push({ min: new THREE.Vector3(x - w / 2, y, z - d / 2), max: new THREE.Vector3(x + w / 2, y + h, z + d / 2) });
      return m;
    };

    const layout = [
      [0, 0, -14, 10, 1.2, 10], [-12, 0, -6, 5, 2.4, 5], [12, 0, -6, 5, 3.6, 5],
      [-18, 0, 6, 6, 1.2, 6], [18, 0, 6, 6, 4.8, 6], [0, 0, 10, 8, 2.4, 8],
      [-8, 3.6, -18, 4, 1, 4], [8, 4.8, -18, 4, 1, 4], [0, 7, -22, 6, 1, 6],
      [-24, 0, -14, 4, 6, 4], [24, 0, -14, 4, 6, 4],
      [0, 2.4, 20, 5, 1, 5], [-10, 1.2, 22, 4, 1, 4], [10, 3.6, 24, 4, 1, 4],
    ];
    layout.forEach((b) => addBox(...b));

    /* pillars — vertical rhythm, no collision needed at height */
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const p = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 26, 12),
        new THREE.MeshLambertMaterial({ color: 0xffffff })
      );
      p.position.set(Math.cos(a) * 42, 13, Math.sin(a) * 42);
      p.castShadow = true;
      scene.add(p);
    }

    /* nodes: content the walking bought */
    const nodeMat = new THREE.MeshBasicMaterial({ color: C.indigo });
    const nodes = [];
    const spots = [
      [0, 3.4, -14], [-12, 4.6, -6], [12, 5.8, -6], [-18, 3.4, 6], [18, 7, 6],
      [0, 4.6, 10], [-8, 6.8, -18], [8, 8, -18], [0, 10.2, -22], [0, 4.6, 20],
      [-10, 3.4, 22], [10, 5.8, 24],
    ];
    for (let i = 0; i < nodeCount; i++) {
      const s = spots[i % spots.length];
      const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.42), nodeMat);
      m.position.set(s[0] + (i >= spots.length ? 2.5 : 0), s[1], s[2]);
      const halo = new THREE.Mesh(
        new THREE.RingGeometry(0.75, 0.85, 24),
        new THREE.MeshBasicMaterial({ color: C.indigo, side: THREE.DoubleSide, transparent: true, opacity: 0.55 })
      );
      m.add(halo);
      scene.add(m);
      nodes.push({ mesh: m, halo, taken: false, base: m.position.y });
    }

    /* diamonds: the super charge. Placed high and awkward — you earn
       these with in-game parkour, not with step count. */
    const DIAMOND_SPOTS = [
      [0, 9.2, -22], [8, 7, -18], [-8, 5.8, -18], [18, 6.4, 6], [12, 5.2, -6], [10, 5.4, 24],
    ];
    const diamonds = [];
    const gemMat = new THREE.MeshBasicMaterial({ color: C.gem });
    for (const s of DIAMOND_SPOTS) {
      const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.34), gemMat);
      m.scale.set(1, 1.7, 1);
      m.position.set(s[0], s[1], s[2]);
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 40, 6),
        new THREE.MeshBasicMaterial({ color: C.gem, transparent: true, opacity: 0.18 })
      );
      beam.position.y = 20;
      m.add(beam);
      scene.add(m);
      diamonds.push({ mesh: m, taken: false, base: s[1] });
    }

    /* shockwave ring for the super */
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1.25, 48),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(S.accent), side: THREE.DoubleSide, transparent: true, opacity: 0 })
    );
    ring.rotation.x = -Math.PI / 2;
    scene.add(ring);
    let waveT = -1;
    let slowT = 0;

    /* drones: timing, not spam */
    const drones = [];
    for (let i = 0; i < droneCount; i++) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 0), new THREE.MeshLambertMaterial({ color: 0x2b3342 }));
      const shell = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.95, 0),
        new THREE.MeshBasicMaterial({ color: C.indigo, wireframe: true })
      );
      g.add(body, shell);
      g.position.set(Math.cos((i / droneCount) * 6.28) * 12, 2.2, Math.sin((i / droneCount) * 6.28) * 12 - 4);
      scene.add(g);
      drones.push({ g, body, shell, hp: 2, open: false, timer: 1.5 + i * 0.7, alive: true, hitFlash: 0, forced: 0 });
    }

    /* player */
    const P = {
      pos: new THREE.Vector3(0, 1.7, 26),
      vel: new THREE.Vector3(),
      yaw: Math.PI, pitch: 0,
      onGround: false, stamina: 1, integrity: S.integrity,
      collected: 0, dashCd: 0, hurtCd: 0, strikeCd: 0, charge: 0, gems: 0,
    };
    const R = { w: 0.35, h: 1.7 };

    const keys = {};
    const onKeyDown = (e) => {
      keys[e.code] = true;
      if (e.code === "KeyE") unleash();
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
    };
    const onKeyUp = (e) => { keys[e.code] = false; };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    /* look: pointer lock, with drag fallback for iframes and touch */
    let dragging = false, lastX = 0, lastY = 0;
    const look = (dx, dy) => {
      P.yaw -= dx * 0.0026;
      P.pitch = Math.max(-1.4, Math.min(1.4, P.pitch - dy * 0.0026));
    };
    const el = renderer.domElement;
    const onMouseMove = (e) => {
      if (document.pointerLockElement === el) look(e.movementX, e.movementY);
      else if (dragging) { look(e.clientX - lastX, e.clientY - lastY); lastX = e.clientX; lastY = e.clientY; }
    };
    const onDown = (e) => {
      if (document.pointerLockElement !== el) {
        el.requestPointerLock && el.requestPointerLock();
        dragging = true; lastX = e.clientX; lastY = e.clientY;
      }
      strike();
    };
    const onUp = () => { dragging = false; };
    el.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMouseMove);

    /* touch: right side looks, tap strikes, on-screen stick drives */
    let touchId = null;
    const onTouchStart = (e) => {
      const t = e.changedTouches[0];
      touchId = t.identifier; lastX = t.clientX; lastY = t.clientY;
      strike();
    };
    const onTouchMove = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === touchId) {
          look(t.clientX - lastX, t.clientY - lastY);
          lastX = t.clientX; lastY = t.clientY;
        }
      }
      e.preventDefault();
    };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });

    /* strike: only lands while a drone is OPEN (amber). Guarding costs you. */
    let msg = "", msgT = 0;
    const say = (t) => { msg = t; msgT = 1.6; };
    const fwd = new THREE.Vector3();
    function strike() {
      if (P.strikeCd > 0) return;
      P.strikeCd = 0.45;
      fwd.set(0, 0, -1).applyEuler(new THREE.Euler(P.pitch, P.yaw, 0, "YXZ"));
      let best = null, bestD = S.reach;
      for (const d of drones) {
        if (!d.alive) continue;
        const to = d.g.position.clone().sub(P.pos);
        const dist = to.length();
        if (dist > bestD) continue;
        if (to.normalize().dot(fwd) > 0.86) { best = d; bestD = dist; }
      }
      if (!best) return;
      if (best.open) {
        best.hp -= S.damage; best.hitFlash = 0.25;
        if (best.hp <= 0) { best.alive = false; scene.remove(best.g); say("Guard broken."); }
        else say("Clean.");
      } else {
        best.hitFlash = 0.25;
        if (S.deflects) { say("Turned it aside. Stillwater does not pay for that."); return; }
        if (P.hurtCd <= 0) { P.integrity -= 1; P.hurtCd = 1.0; }
        say("It was still guarding. That one cost you.");
      }
    }

    /* SUPER — three diamonds charge it. Each school releases something
       different, but none of them does the killing for you: they open
       windows. The window is the prize. */
    function unleash() {
      if (P.charge < 3) { say("Not charged — three diamonds."); return; }
      P.charge = 0;
      waveT = 0;
      ring.position.set(P.pos.x, 0.06, P.pos.z);
      const kill = (d) => { if (d.hp <= 0) { d.alive = false; scene.remove(d.g); } };
      let caught = 0;

      if (S.super === "beam") {
        fwd.set(0, 0, -1).applyEuler(new THREE.Euler(P.pitch, P.yaw, 0, "YXZ"));
        for (const d of drones) {
          if (!d.alive) continue;
          const to = d.g.position.clone().sub(P.pos);
          if (to.length() > 34) continue;
          if (to.normalize().dot(fwd) < 0.8) continue;
          caught++; d.hp -= 2; d.hitFlash = 0.4; d.forced = 2.0; d.open = true; kill(d);
        }
        say(caught ? "Sunwrit lance. Straight through." : "Lance fired into empty air.");
      } else if (S.super === "slam") {
        for (const d of drones) {
          if (!d.alive) continue;
          if (d.g.position.distanceTo(P.pos) > 10) continue;
          caught++; d.hp -= 2; d.hitFlash = 0.4; d.forced = 2.5; d.open = true; kill(d);
        }
        say(caught ? "Falling mountain. The floor did most of it." : "Falling mountain. Nothing near enough.");
      } else if (S.super === "still") {
        slowT = 6;
        for (const d of drones) {
          if (!d.alive) continue;
          if (d.g.position.distanceTo(P.pos) > 22) continue;
          caught++; d.forced = 5.0; d.open = true;
        }
        say(caught ? "Held breath. Six seconds — make them count." : "Held breath. Nothing to hold it for.");
      } else {
        for (const d of drones) {
          if (!d.alive) continue;
          if (d.g.position.distanceTo(P.pos) > 16) continue;
          caught++; d.forced = 3.0; d.open = true; d.hp -= 1; d.hitFlash = 0.3; kill(d);
        }
        say(caught ? "Shattering palm. Guards are open — three seconds." : "Shattering palm. Nothing in range.");
      }
    }

    /* AABB resolution */
    function collide() {
      P.onGround = false;
      for (const b of boxes) {
        const pmin = new THREE.Vector3(P.pos.x - R.w, P.pos.y - R.h, P.pos.z - R.w);
        const pmax = new THREE.Vector3(P.pos.x + R.w, P.pos.y, P.pos.z + R.w);
        if (pmax.x < b.min.x || pmin.x > b.max.x || pmax.y < b.min.y || pmin.y > b.max.y || pmax.z < b.min.z || pmin.z > b.max.z) continue;
        const ox = Math.min(pmax.x - b.min.x, b.max.x - pmin.x);
        const oy = Math.min(pmax.y - b.min.y, b.max.y - pmin.y);
        const oz = Math.min(pmax.z - b.min.z, b.max.z - pmin.z);
        if (oy <= ox && oy <= oz) {
          if (P.pos.y - R.h / 2 > (b.min.y + b.max.y) / 2) { P.pos.y += oy; P.vel.y = 0; P.onGround = true; }
          else { P.pos.y -= oy; P.vel.y = Math.min(0, P.vel.y); }
        } else if (ox <= oz) {
          P.pos.x += P.pos.x > (b.min.x + b.max.x) / 2 ? ox : -ox;
        } else {
          P.pos.z += P.pos.z > (b.min.z + b.max.z) / 2 ? oz : -oz;
        }
      }
      if (P.pos.y - R.h <= 0) { P.pos.y = R.h; P.vel.y = 0; P.onGround = true; }
    }

    const clock = new THREE.Clock();
    let raf, running = true, hudT = 0;

    function loop() {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, clock.getDelta());
      const t = clock.getElapsedTime();

      /* input */
      const sprint = keys["ShiftLeft"] || keys["ShiftRight"];
      let ix = (keys["KeyD"] || keys["ArrowRight"] ? 1 : 0) - (keys["KeyA"] || keys["ArrowLeft"] ? 1 : 0);
      let iz = (keys["KeyS"] || keys["ArrowDown"] ? 1 : 0) - (keys["KeyW"] || keys["ArrowUp"] ? 1 : 0);
      const stick = gameRef.current?.stick;
      if (stick && (stick.x || stick.y)) { ix = stick.x; iz = stick.y; }

      const len = Math.hypot(ix, iz) || 1;
      const canSprint = sprint && P.stamina > 0.02 && (ix || iz);
      const spd = canSprint ? S.sprint : S.speed;
      P.stamina = Math.max(0, Math.min(1, P.stamina + (canSprint ? -0.28 : S.regen) * dt));

      const sin = Math.sin(P.yaw), cos = Math.cos(P.yaw);
      const wx = (ix / len) * cos - (iz / len) * sin;
      const wz = (ix / len) * sin + (iz / len) * cos;
      const target = new THREE.Vector3(wx * spd, 0, wz * spd);
      const accel = P.onGround ? 14 : 5;
      P.vel.x += (target.x - P.vel.x) * Math.min(1, accel * dt);
      P.vel.z += (target.z - P.vel.z) * Math.min(1, accel * dt);

      if ((keys["Space"] || gameRef.current?.jump) && P.onGround) { P.vel.y = S.jump; P.onGround = false; gameRef.current.jump = false; }
      if ((keys["KeyQ"] || gameRef.current?.dash) && P.dashCd <= 0 && P.stamina > 0.3) {
        P.vel.x += wx * S.dash; P.vel.z += wz * S.dash; P.vel.y = Math.max(P.vel.y, 2.5);
        P.stamina -= 0.3; P.dashCd = S.dashCd; gameRef.current.dash = false; say("Shadow step.");
      }
      P.dashCd -= dt; P.hurtCd -= dt; P.strikeCd -= dt;

      P.vel.y -= 23 * dt;
      P.pos.addScaledVector(P.vel, dt);
      collide();
      if (P.pos.y < -20) { P.pos.set(0, 2, 26); P.vel.set(0, 0, 0); }

      camera.position.copy(P.pos);
      camera.rotation.set(P.pitch, P.yaw, 0, "YXZ");

      /* nodes */
      for (const n of nodes) {
        if (n.taken) continue;
        n.mesh.rotation.y += dt * 1.6;
        n.mesh.position.y = n.base + Math.sin(t * 2 + n.base) * 0.14;
        n.halo.lookAt(camera.position);
        if (n.mesh.position.distanceTo(P.pos) < 1.5) {
          n.taken = true; scene.remove(n.mesh); P.collected++;
          say(`Ki node ${P.collected} of ${nodes.length}.`);
        }
      }

      /* diamonds */
      for (const d of diamonds) {
        if (d.taken) continue;
        d.mesh.rotation.y += dt * 2.2;
        d.mesh.position.y = d.base + Math.sin(t * 1.8 + d.base) * 0.2;
        if (d.mesh.position.distanceTo(P.pos) < 1.5) {
          d.taken = true; scene.remove(d.mesh); P.gems++;
          P.charge = Math.min(3, P.charge + 1);
          say(P.charge >= 3 ? `Charged. Press E — ${S.superName}.` : `Diamond ${P.charge} of 3.`);
        }
      }

      /* shockwave */
      if (waveT >= 0) {
        waveT += dt;
        const s = 1 + waveT * 30;
        ring.scale.set(s, s, s);
        ring.material.opacity = Math.max(0, 0.75 - waveT * 1.4);
        if (waveT > 0.6) { waveT = -1; ring.material.opacity = 0; }
      }
      if (gameRef.current?.super) { gameRef.current.super = false; unleash(); }

      /* drones: guard ↔ open cycle */
      if (slowT > 0) slowT -= dt;
      const dtd = dt * (slowT > 0 ? 0.32 : 1);
      for (const d of drones) {
        if (!d.alive) continue;
        d.timer -= dtd;
        if (d.forced > 0) { d.forced -= dt; d.open = true; d.timer = Math.max(d.timer, 0.6); }
        else if (d.timer <= 0) { d.open = !d.open; d.timer = d.open ? 1.5 : 2.6; }
        d.shell.material.color.setHex(d.open ? C.amber : C.indigo);
        d.shell.visible = !d.open || Math.sin(t * 22) > -0.4;
        d.body.material.color.setHex(d.hitFlash > 0 ? 0xffffff : 0x2b3342);
        d.hitFlash -= dt;
        d.shell.rotation.y += dt * (d.open ? 3.4 : 1.1);

        const to = P.pos.clone().sub(d.g.position);
        const dist = to.length();
        to.y = 0; to.normalize();
        if (dist > 3.2) d.g.position.addScaledVector(to, dtd * 2.6);
        d.g.position.y = 2.2 + Math.sin(t * 1.7 + d.timer) * 0.5;
        if (dist < 2.0 && !d.open && P.hurtCd <= 0) {
          P.integrity -= 1; P.hurtCd = 1.4; say("Too close while it was guarding.");
        }
      }

      msgT -= dt;
      hudT -= dt;
      if (hudT <= 0) {
        hudT = 0.12;
        const left = drones.filter((d) => d.alive).length;
        setHud({
          nodes: P.collected, total: nodes.length, drones: left,
          integrity: P.integrity, maxIntegrity: S.integrity, stamina: P.stamina,
          charge: P.charge, gems: P.gems, gemTotal: diamonds.length,
          msg: msgT > 0 ? msg : "",
          ready: drones.some((d) => d.alive && d.open && d.g.position.distanceTo(P.pos) < S.reach),
        });
        if (P.integrity <= 0 || (P.collected === nodes.length && left === 0)) {
          running = false;
          setResult({
            win: P.integrity > 0, nodes: P.collected, total: nodes.length,
            gems: P.gems, gemTotal: diamonds.length,
            steps, seconds: Math.round(t),
          });
          setScreen("done");
        }
      }

      renderer.render(scene, camera);
    }
    loop();

    const onResize = () => {
      if (!mount.clientWidth) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    gameRef.current = { stick: { x: 0, y: 0 }, jump: false, dash: false, super: false };

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("resize", onResize);
      el.removeEventListener("mousedown", onDown);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      if (document.pointerLockElement === el) document.exitPointerLock();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [screen, styleKey]); // eslint-disable-line

  /* ── chrome ── */
  const Rule = () => <div style={{ height: 1, background: C.line }} className="my-5" />;
  const Label = ({ children }) => (
    <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.2em", color: "rgba(20,25,34,0.45)" }} className="uppercase">{children}</div>
  );

  if (screen === "style") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-5" style={{ background: C.paper, color: C.ink }}>
        <style>{FONTS}</style>
        <div className="w-full" style={{ maxWidth: 620 }}>
          <div className="flex items-baseline justify-between">
            <div style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 13, letterSpacing: "0.32em" }}>NINJA ACADEMY</div>
            <div style={{ fontFamily: mono, fontSize: 10, color: "rgba(20,25,34,0.4)" }}>INTAKE</div>
          </div>
          <Rule />
          <h1 style={{ fontFamily: grotesk, fontWeight: 600, fontSize: 34, lineHeight: 1.15 }} className="mb-3">
            Four schools take students. Pick one.
          </h1>
          <p style={{ fontFamily: grotesk, fontSize: 15, lineHeight: 1.6, color: "rgba(20,25,34,0.68)" }} className="mb-7">
            None of them is stronger. Each moves, reaches and forgives differently, and each carries its own super.
            The one that suits you is the one whose weakness you can live with.
          </p>

          <div className="grid gap-3 mb-8">
            {Object.entries(STYLES).map(([k, s]) => {
              const on = k === styleKey;
              return (
                <button key={k} onClick={() => setStyleKey(k)} className="text-left w-full p-5"
                  style={{
                    background: on ? "rgba(255,255,255,0.9)" : "transparent",
                    border: `1.5px solid ${on ? s.accent : "rgba(20,25,34,0.14)"}`,
                    borderLeft: `4px solid ${s.accent}`,
                    cursor: "pointer",
                  }}>
                  <div className="flex items-baseline justify-between mb-1">
                    <span style={{ fontFamily: grotesk, fontWeight: 600, fontSize: 21 }}>{s.name}</span>
                    <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.16em", color: s.accent }}>
                      {s.tag.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ fontFamily: grotesk, fontSize: 14, lineHeight: 1.55, color: "rgba(20,25,34,0.72)" }} className="mb-3">
                    {s.line}
                  </p>
                  <div className="flex flex-wrap gap-x-6 gap-y-1" style={{ fontFamily: mono, fontSize: 11, color: "rgba(20,25,34,0.55)" }}>
                    <span>INTEGRITY {s.integrity}</span>
                    <span>REACH {s.reach}m</span>
                    <span>JUMP {s.jump}</span>
                    <span>SUPER · {s.superName.toUpperCase()}</span>
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 11, color: s.accent }} className="mt-2">
                    COST — {s.trade}
                  </div>
                </button>
              );
            })}
          </div>

          <button onClick={() => setScreen("brief")}
            className="w-full py-4"
            style={{ background: ST.accent, color: "#fff", fontFamily: mono, fontSize: 12, letterSpacing: "0.22em", border: "none", cursor: "pointer" }}>
            TRAIN AS {ST.name.toUpperCase()}
          </button>
        </div>
      </div>
    );
  }

  if (screen === "brief" || screen === "done") {
    const done = screen === "done";
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-5" style={{ background: C.paper, color: C.ink }}>
        <style>{FONTS}</style>
        <div className="w-full" style={{ maxWidth: 560 }}>
          <div className="flex items-baseline justify-between">
            <div style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 13, letterSpacing: "0.32em" }}>NINJA ACADEMY</div>
            <div style={{ fontFamily: mono, fontSize: 10, color: "rgba(20,25,34,0.4)" }}>TRIAL CHAMBER 01</div>
          </div>
          <Rule />
          <button onClick={() => setScreen("style")} className="w-full text-left p-4 mb-7"
            style={{ background: "transparent", border: "1px solid rgba(20,25,34,0.14)", borderLeft: `4px solid ${ST.accent}`, cursor: "pointer" }}>
            <div className="flex items-baseline justify-between">
              <span style={{ fontFamily: grotesk, fontWeight: 600, fontSize: 17 }}>{ST.name}</span>
              <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.16em", color: "rgba(20,25,34,0.45)" }}>CHANGE SCHOOL</span>
            </div>
            <div style={{ fontFamily: mono, fontSize: 11, color: "rgba(20,25,34,0.55)" }} className="mt-1">
              INTEGRITY {ST.integrity} · REACH {ST.reach}m · {ST.superName.toUpperCase()}
            </div>
          </button>

          {!done ? (
            <>
              <h1 style={{ fontFamily: grotesk, fontWeight: 600, fontSize: 34, lineHeight: 1.15 }} className="mb-3">
                The chamber builds itself from how far you walked.
              </h1>
              <p style={{ fontFamily: grotesk, fontSize: 15, lineHeight: 1.6, color: "rgba(20,25,34,0.68)" }} className="mb-8">
                A pedometer fills this in. Set it by hand and watch what changes — and, more importantly, what doesn't.
              </p>

              <Label>Steps today</Label>
              <div style={{ fontFamily: mono, fontSize: 40, fontWeight: 600 }} className="mt-1">{steps.toLocaleString()}</div>
              <input type="range" min={0} max={15000} step={500} value={steps}
                onChange={(e) => setSteps(Number(e.target.value))}
                className="w-full mt-4 mb-8" style={{ accentColor: "#4B5BFF" }} aria-label="Steps walked today" />

              <div className="grid grid-cols-3 gap-4 mb-2">
                <div style={{ borderLeft: `2px solid #4B5BFF`, paddingLeft: 12 }}>
                  <Label>Ki nodes</Label>
                  <div style={{ fontFamily: mono, fontSize: 26 }}>{nodeCount}</div>
                </div>
                <div style={{ borderLeft: `2px solid #FF8A3D`, paddingLeft: 12 }}>
                  <Label>Sentries</Label>
                  <div style={{ fontFamily: mono, fontSize: 26 }}>{droneCount}</div>
                </div>
                <div style={{ borderLeft: `2px solid #12CBB8`, paddingLeft: 12 }}>
                  <Label>Diamonds</Label>
                  <div style={{ fontFamily: mono, fontSize: 26 }}>6</div>
                </div>
              </div>
              <p style={{ fontFamily: grotesk, fontSize: 13, lineHeight: 1.6, color: "rgba(20,25,34,0.55)" }} className="mt-5 mb-8">
                Your speed, jump, dash and strike are identical at 0 steps and at 15,000. Walking builds a bigger chamber,
                not a stronger ninja. Six diamonds always spawn, high and awkward — the super is earned by climbing in
                here, never by walking out there.
              </p>

              <Rule />
              <Label>Controls</Label>
              <div style={{ fontFamily: mono, fontSize: 12, lineHeight: 1.9, color: "rgba(20,25,34,0.7)" }} className="mt-2 mb-8">
                WASD move · MOUSE look · SPACE jump · SHIFT sprint · Q dash · CLICK strike<br />
                E shattering palm (needs 3 diamonds) · Touch: stick, drag to look, tap to strike
              </div>

              <button onClick={() => { setResult(null); setScreen("play"); }}
                className="w-full py-4" style={{ background: ST.accent, color: "#fff", fontFamily: mono, fontSize: 12, letterSpacing: "0.22em", border: "none", cursor: "pointer" }}>
                ENTER THE CHAMBER
              </button>
            </>
          ) : (
            <>
              <h1 style={{ fontFamily: grotesk, fontWeight: 600, fontSize: 32 }} className="mb-6">
                {result?.win ? "Trial cleared." : "Integrity gone."}
              </h1>
              <div className="grid grid-cols-2 gap-y-4 mb-8" style={{ fontFamily: mono, fontSize: 13 }}>
                <span style={{ color: "rgba(20,25,34,0.5)" }}>School</span><span>{ST.name}</span>
                <span style={{ color: "rgba(20,25,34,0.5)" }}>Nodes taken</span><span>{result?.nodes}/{result?.total}</span>
                <span style={{ color: "rgba(20,25,34,0.5)" }}>Diamonds found</span><span>{result?.gems}/{result?.gemTotal}</span>
                <span style={{ color: "rgba(20,25,34,0.5)" }}>Time in chamber</span><span>{result?.seconds}s</span>
                <span style={{ color: "rgba(20,25,34,0.5)" }}>Steps logged</span><span>{result?.steps.toLocaleString()}</span>
              </div>
              <Rule />
              <p style={{ fontFamily: grotesk, fontSize: 14, lineHeight: 1.7, color: "rgba(20,25,34,0.68)" }} className="mb-8">
                Now run it again at 0 steps. If the small chamber is still worth playing, the design holds — a rest day
                gives you a shorter session, not a worse one. If it feels empty, that's the flaw, and it's better to find it here.
              </p>
              <button onClick={() => setScreen("brief")}
                className="w-full py-4 mb-3" style={{ background: C.ink, color: "#fff", fontFamily: mono, fontSize: 12, letterSpacing: "0.22em", border: "none", cursor: "pointer" }}>
                RUN IT AGAIN
              </button>
              <button onClick={() => setScreen("style")}
                className="w-full py-4" style={{ background: "transparent", color: C.ink, fontFamily: mono, fontSize: 12, letterSpacing: "0.22em", border: "1px solid rgba(20,25,34,0.25)", cursor: "pointer" }}>
                TRY ANOTHER SCHOOL
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  /* ── playing ── */
  const stickSet = (x, y) => { if (gameRef.current) gameRef.current.stick = { x, y }; };
  return (
    <div className="relative w-full" style={{ height: "100vh", background: "#DFE6EC", overflow: "hidden", touchAction: "none" }}>
      <style>{FONTS}</style>
      <div ref={mountRef} className="absolute inset-0" />

      {/* reticle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div style={{
          width: hud.ready ? 26 : 14, height: hud.ready ? 26 : 14,
          border: `1.5px solid ${hud.ready ? "#FF8A3D" : "rgba(20,25,34,0.55)"}`,
          borderRadius: "50%", transition: "all 90ms linear",
        }} />
      </div>

      {/* HUD */}
      <div className="absolute pointer-events-none" style={{ left: 20, top: 18, fontFamily: mono, color: C.ink }}>
        <div style={{ fontSize: 11, letterSpacing: "0.22em", color: ST.accent, marginBottom: 10 }}>{ST.name.toUpperCase()}</div>
        <div style={{ fontSize: 10, letterSpacing: "0.2em", opacity: 0.5 }}>KI NODES</div>        <div style={{ fontSize: 24 }}>{hud.nodes}<span style={{ opacity: 0.4 }}>/{hud.total}</span></div>
        <div style={{ fontSize: 10, letterSpacing: "0.2em", opacity: 0.5, marginTop: 12 }}>SENTRIES</div>
        <div style={{ fontSize: 24, color: hud.drones ? "#FF8A3D" : C.ink }}>{hud.drones}</div>
      </div>

      <div className="absolute pointer-events-none" style={{ right: 20, top: 18, fontFamily: mono, color: C.ink, textAlign: "right" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.2em", opacity: 0.5 }}>INTEGRITY</div>
        <div style={{ fontSize: 24 }}>{"■".repeat(Math.max(0, hud.integrity))}<span style={{ opacity: 0.25 }}>{"■".repeat(Math.max(0, hud.maxIntegrity - hud.integrity))}</span></div>
        <div style={{ fontSize: 10, letterSpacing: "0.2em", opacity: 0.5, marginTop: 12 }}>STAMINA</div>
        <div style={{ width: 92, height: 4, background: "rgba(20,25,34,0.18)", marginTop: 6, marginLeft: "auto" }}>
          <div style={{ width: `${hud.stamina * 100}%`, height: "100%", background: "#4B5BFF" }} />
        </div>
        <div style={{ fontSize: 10, letterSpacing: "0.2em", opacity: 0.5, marginTop: 12 }}>{ST.superName.toUpperCase()}</div>
        <div className="flex gap-2 justify-end" style={{ marginTop: 7 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: 13, height: 20, background: i < hud.charge ? ST.accent : "transparent",
              border: `1.5px solid ${i < hud.charge ? ST.accent : "rgba(20,25,34,0.28)"}`,
              clipPath: "polygon(50% 0%, 100% 32%, 50% 100%, 0% 32%)",
              boxShadow: hud.charge >= 3 ? `0 0 10px ${ST.accent}` : "none",
            }} />
          ))}
        </div>
        <div style={{ fontSize: 10, opacity: 0.45, marginTop: 5 }}>
          {hud.charge >= 3 ? "PRESS E" : `${hud.gems}/${hud.gemTotal} FOUND`}
        </div>
      </div>

      {hud.msg && (
        <div className="absolute pointer-events-none w-full text-center" style={{ bottom: 120, fontFamily: grotesk, fontSize: 16, color: C.ink }}>
          {hud.msg}
        </div>
      )}

      <div className="absolute pointer-events-none w-full text-center" style={{ bottom: 18, fontFamily: mono, fontSize: 10, letterSpacing: "0.14em", color: "rgba(20,25,34,0.45)" }}>
        STRIKE ONLY WHILE A SENTRY BURNS AMBER — HITTING ITS GUARD COSTS YOU INTEGRITY
      </div>

      {/* touch controls */}
      <div className="absolute" style={{ left: 18, bottom: 40 }}>
        <TouchStick onChange={stickSet} />
      </div>
      <div className="absolute flex flex-col gap-3" style={{ right: 18, bottom: 40 }}>
        <button
          onPointerDown={(e) => { e.stopPropagation(); if (gameRef.current) gameRef.current.super = true; }}
          style={{
            width: 68, height: 68, borderRadius: "50%",
            border: `1.5px solid ${hud.charge >= 3 ? ST.accent : "rgba(20,25,34,0.3)"}`,
            background: hud.charge >= 3 ? ST.accent : "rgba(255,255,255,0.5)",
            color: hud.charge >= 3 ? "#fff" : "rgba(20,25,34,0.4)",
            fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", cursor: "pointer",
          }}>
          SUPER
        </button>
        {[["JUMP", "jump"], ["DASH", "dash"]].map(([l, k]) => (
          <button key={k}
            onPointerDown={(e) => { e.stopPropagation(); if (gameRef.current) gameRef.current[k] = true; }}
            style={{ width: 68, height: 68, borderRadius: "50%", border: "1.5px solid rgba(20,25,34,0.3)", background: "rgba(255,255,255,0.5)", fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", color: C.ink, cursor: "pointer" }}>
            {l}
          </button>
        ))}
      </div>

      <button onClick={() => setScreen("brief")} className="absolute"
        style={{ left: "50%", transform: "translateX(-50%)", top: 18, background: "transparent", border: "1px solid rgba(20,25,34,0.25)", padding: "6px 14px", fontFamily: mono, fontSize: 10, letterSpacing: "0.18em", color: "rgba(20,25,34,0.6)", cursor: "pointer" }}>
        LEAVE
      </button>
    </div>
  );
}

/* on-screen stick for touch */
function TouchStick({ onChange }) {
  const [k, setK] = useState({ x: 0, y: 0 });
  const ref = useRef(null);
  const move = (e) => {
    const r = ref.current.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const m = Math.min(1, Math.hypot(dx, dy)) || 0;
    const a = Math.atan2(dy, dx);
    const v = { x: Math.cos(a) * m, y: Math.sin(a) * m };
    setK(v); onChange(v.x, v.y);
  };
  const reset = () => { setK({ x: 0, y: 0 }); onChange(0, 0); };
  return (
    <div ref={ref}
      onPointerDown={(e) => { e.target.setPointerCapture(e.pointerId); move(e); }}
      onPointerMove={(e) => { if (e.buttons || e.pointerType === "touch") move(e); }}
      onPointerUp={reset} onPointerCancel={reset}
      style={{ width: 108, height: 108, borderRadius: "50%", border: "1.5px solid rgba(20,25,34,0.25)", background: "rgba(255,255,255,0.42)", position: "relative", touchAction: "none" }}>
      <div style={{
        position: "absolute", width: 42, height: 42, borderRadius: "50%", background: "#4B5BFF",
        left: `calc(50% + ${k.x * 30}px - 21px)`, top: `calc(50% + ${k.y * 30}px - 21px)`,
      }} />
    </div>
  );
}
