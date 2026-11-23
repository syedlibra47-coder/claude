// The sales-gallery scale model: white massing, navy glazing, a brass ring on a stone plinth.
import * as THREE from './vendor/three.module.min.js';

const WHITE = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78 });
const NAVY = new THREE.MeshStandardMaterial({ color: 0x2a3372, roughness: 0.3, metalness: 0.1 });
const BRASS = new THREE.MeshStandardMaterial({ color: 0xd9bd7a, roughness: 0.38, metalness: 0.25, emissive: 0x3a2c0c, emissiveIntensity: 0.25 });
const STONE = new THREE.MeshStandardMaterial({ color: 0xf6f7fa, roughness: 0.92 });
const WATER = new THREE.MeshStandardMaterial({ color: 0xbfcde6, roughness: 0.35 });

const box = (w, h, d, mat = WHITE) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
};

// a tower: a white core with navy glazing bands every floor group and an optional brass crown
function tower(w, h, d, { crown = false, step = 0.24 } = {}) {
  const g = new THREE.Group();
  const core = box(w, h, d); core.position.y = h / 2; g.add(core);
  const bands = Math.floor((h - 0.2) / step);
  const band = new THREE.InstancedMesh(new THREE.BoxGeometry(w + 0.012, step * 0.3, d + 0.012), NAVY, bands);
  const m = new THREE.Matrix4();
  for (let i = 0; i < bands; i++) { m.makeTranslation(0, 0.18 + i * step, 0); band.setMatrixAt(i, m); }
  band.castShadow = true;
  g.add(band);
  const top = box(w * 0.72, 0.34, d * 0.72); top.position.y = h + 0.17; g.add(top);
  const lip = box(w + 0.03, 0.04, d + 0.03); lip.position.y = h; g.add(lip);
  if (crown) { const c = box(w * 0.5, 0.05, d * 0.5, BRASS); c.position.y = h + 0.365; g.add(c); }
  return g;
}

const BUILD = {
  // Sobha One: a podium with three stepped towers
  towers() {
    const g = new THREE.Group();
    const pod = box(2.6, 0.42, 1.5); pod.position.y = 0.21; g.add(pod);
    const a = tower(0.62, 3.1, 0.62, { crown: true }); a.position.set(-0.6, 0.42, 0); g.add(a);
    const b = tower(0.56, 2.5, 0.56); b.position.set(0.25, 0.42, -0.25); g.add(b);
    const c = tower(0.5, 1.9, 0.5); c.position.set(0.9, 0.42, 0.25); g.add(c);
    return g;
  },
  // Safa Two: two slender towers joined by a sky bridge
  tall() {
    const g = new THREE.Group();
    const pod = box(2.0, 0.36, 1.2); pod.position.y = 0.18; g.add(pod);
    const a = tower(0.55, 4.0, 0.55, { crown: true, step: 0.22 }); a.position.set(-0.45, 0.36, 0); g.add(a);
    const b = tower(0.5, 3.5, 0.5, { step: 0.22 }); b.position.set(0.45, 0.36, 0); g.add(b);
    const bridge = box(0.5, 0.16, 0.34, BRASS); bridge.position.set(0, 3.2, 0); g.add(bridge);
    return g;
  },
  // Palm Jebel Ali: beach villas along a curved frond over water
  villas() {
    const g = new THREE.Group();
    const water = new THREE.Mesh(new THREE.CylinderGeometry(2.45, 2.45, 0.04, 96), WATER);
    water.position.y = 0.02; water.receiveShadow = true; g.add(water);
    const frond = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.3, 12, 80, Math.PI * 1.15), STONE);
    frond.rotation.x = -Math.PI / 2; frond.rotation.z = -Math.PI * 0.08; frond.scale.z = 0.12; frond.position.y = 0.05;
    frond.receiveShadow = true; g.add(frond);
    const n = 12;
    for (let i = 0; i < n; i++) {
      const t = -Math.PI * 0.08 + (i + 0.5) / n * Math.PI * 1.15;
      const v = new THREE.Group();
      const body = box(0.36, 0.2, 0.28); body.position.y = 0.085; v.add(body);
      const upper = box(0.2, 0.12, 0.2); upper.position.set(-0.04, 0.23, 0); v.add(upper);
      const glass = box(0.205, 0.05, 0.205, NAVY); glass.position.set(-0.04, 0.23, 0); v.add(glass);
      const pool = box(0.12, 0.012, 0.09, BRASS); pool.position.set(0.12, 0.012, 0.16); v.add(pool);
      v.position.set(Math.cos(t) * 1.55, 0.07, -Math.sin(t) * 1.55);
      v.rotation.y = t + Math.PI / 2;
      g.add(v);
    }
    return g;
  },
  // Creek Waters 2: two stepped towers at the water's edge
  creek() {
    const g = new THREE.Group();
    const water = new THREE.Mesh(new THREE.CylinderGeometry(2.45, 2.45, 0.04, 96, 1, false, Math.PI * 0.5, Math.PI), WATER);
    water.position.y = 0.02; water.receiveShadow = true; g.add(water);
    const pod = box(2.0, 0.3, 1.0); pod.position.set(0, 0.15, -0.6); g.add(pod);
    const a = tower(0.6, 2.9, 0.6, { crown: true }); a.position.set(-0.5, 0.3, -0.6); g.add(a);
    const b = tower(0.6, 2.3, 0.6); b.position.set(0.5, 0.3, -0.6); g.add(b);
    const deck = box(2.2, 0.06, 0.5, BRASS); deck.position.set(0, 0.03, 0.1); g.add(deck);
    return g;
  },
  // Azizi Venice: mid-rise blocks around a lagoon
  venice() {
    const g = new THREE.Group();
    const lagoon = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.04, 64), WATER);
    lagoon.position.y = 0.02; g.add(lagoon);
    for (let i = 0; i < 6; i++) {
      const t = i / 6 * Math.PI * 2 + 0.3;
      const blk = tower(0.62, 0.9 + (i % 3) * 0.25, 0.42, { step: 0.2 });
      blk.position.set(Math.cos(t) * 1.65, 0, Math.sin(t) * 1.65);
      blk.rotation.y = -t + Math.PI / 2;
      g.add(blk);
    }
    return g;
  },
};

// camera framing per model: distance and target height
const FRAME = { towers: [12.5, 1.3], tall: [14.5, 1.7], villas: [8.2, 0.1], creek: [12, 1.1], venice: [10.5, 0.2] };

export function mount(host, { live = true, preserve = false, offset = -0.55 } = {}) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power', preserveDrawingBuffer: preserve }); }
  catch { return null; }
  if (!renderer.getContext()) return null;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  // a shader that fails to compile drops the live model and leaves the still in place
  renderer.debug.onShaderError = () => { host.classList.remove('is-live'); renderer.domElement.remove(); renderer.setAnimationLoop(null); };
  const canvas = renderer.domElement;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Scale model of the launch on show. Drag to turn it.');
  host.prepend(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9dde8, 1.6));
  const sun = new THREE.DirectionalLight(0xfff6e6, 2.6);
  sun.position.set(5, 9, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 30 });
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xe8ecff, 0.6);
  fill.position.set(-6, 4, -3);
  scene.add(fill);

  // the plinth: stone drum, brass ring at its top edge
  const stage = new THREE.Group();
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.55, 0.32, 128), STONE);
  drum.position.y = -0.16; drum.receiveShadow = true; stage.add(drum);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.55, 0.022, 8, 160), BRASS);
  ring.rotation.x = Math.PI / 2; stage.add(ring);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(6, 64), new THREE.ShadowMaterial({ opacity: 0.12 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.32; floor.receiveShadow = true;
  scene.add(floor);
  scene.add(stage);

  const turn = new THREE.Group();
  stage.add(turn);
  let shown = null, leaving = null;
  let swapT = 1;
  const cam = { r: 12.5, y: 1.3, r0: 12.5, y0: 1.3, r1: 12.5, y1: 1.3 };

  let angle = -0.5, spin = live ? 0.12 : 0;
  let playing = live, dragging = false, lastX = 0, needs = true;

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    needs = true;
  }
  new ResizeObserver(resize).observe(host);
  resize();

  const ease = t => 1 - Math.pow(1 - t, 3);
  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    if (playing && !dragging) { angle += spin * dt; needs = true; }
    if (swapT < 1) {
      swapT = Math.min(1, swapT + dt / 0.75);
      const k = ease(swapT);
      if (shown) shown.scale.setScalar(Math.max(0.001, k));
      if (leaving) { leaving.scale.setScalar(Math.max(0.001, 1 - k)); if (swapT >= 1) { turn.remove(leaving); leaving = null; } }
      cam.r = cam.r0 + (cam.r1 - cam.r0) * k; cam.y = cam.y0 + (cam.y1 - cam.y0) * k;
      needs = true;
    }
    if (!needs) return;
    turn.rotation.y = angle;
    camera.position.set(-cam.r * 0.1, cam.y + cam.r * 0.4, cam.r);
    camera.lookAt(offset, cam.y - 0.35, 0);
    renderer.render(scene, camera);
    needs = false;
  }
  renderer.setAnimationLoop(frame);

  // drag to turn the model; the page still scrolls vertically on touch
  canvas.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (!dragging) return; angle += (e.clientX - lastX) * 0.008; lastX = e.clientX; needs = true; });
  const end = () => { dragging = false; };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  // pause button for the slow turn (a loop past five seconds)
  if (live) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'loop-pause model__pause';
    const icon = p => p ? '<svg viewBox="0 0 14 14" aria-hidden="true"><rect x="3" y="2" width="3" height="10"/><rect x="8" y="2" width="3" height="10"/></svg>'
      : '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M4 2l8 5-8 5z"/></svg>';
    const set = () => { btn.innerHTML = icon(playing); btn.setAttribute('aria-label', playing ? 'Pause the turning model' : 'Turn the model'); };
    btn.addEventListener('click', () => { playing = !playing; set(); });
    set();
    host.append(btn);
    // no turning while the hero is off screen
    new IntersectionObserver(([e]) => { renderer.setAnimationLoop(e.isIntersecting ? frame : null); last = performance.now(); }).observe(host);
  }

  return {
    renderNow() { needs = true; frame(performance.now()); },
    show(kind, instant = false) {
      if (shown && shown.userData.kind === kind) return;
      if (leaving) turn.remove(leaving);
      leaving = shown;
      shown = BUILD[kind]();
      shown.userData.kind = kind;
      turn.add(shown);
      const [r, y] = FRAME[kind];
      cam.r0 = cam.r; cam.y0 = cam.y; cam.r1 = r; cam.y1 = y;
      if (instant || !live) {
        if (leaving) { turn.remove(leaving); leaving = null; }
        shown.scale.setScalar(1); cam.r = r; cam.y = y; swapT = 1;
      } else {
        shown.scale.setScalar(0.001); swapT = 0;
      }
      needs = true;
    },
  };
}
