import * as THREE from 'three'
import { rng } from './acts.js'
import { NOISE } from './glsl.js'

const MINT = '#3fe0a0'
const RED = '#e5514a'

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.86, metalness: 0, ...o })
const coast = (a) => 12.6 + 1.4 * Math.sin(a * 2 + 0.6) + 0.9 * Math.sin(a * 3 + 2.1) + 0.5 * Math.sin(a * 5 + 4.0)
const coastAt = (x, z) => coast(Math.atan2(-z, x))

const outline = (k) => {
  const s = new THREE.Shape()
  for (let i = 0; i <= 120; i++) {
    const a = (i / 120) * Math.PI * 2, r = coast(a) * k
    i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  return s
}

const slab = (k, depth, top, mat) => {
  const b = 0.3
  const g = new THREE.ExtrudeGeometry(outline(k), { depth, bevelEnabled: true, bevelSize: b, bevelThickness: b, bevelSegments: 5 })
  g.rotateX(-Math.PI / 2)
  g.translate(0, top - depth - b, 0)
  const m = new THREE.Mesh(g, mat)
  m.receiveShadow = true
  return m
}

const lathe = (pts, s, mat) => {
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r * s, y * s)), 28), mat)
  return m
}

const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return m }

export const SITES = [
  { id: 'ring0', x: 0, z: 0, top: 3.0, r: 2.7 },
  { id: 'b2r-kit', x: 5.2, z: -3.5, top: 5.6, r: 2.1 },
  { id: 'chess3d', x: -5.0, z: -3.7, top: 3.0, r: 2.5 },
  { id: 'jarvis-hud', x: -4.7, z: 4.8, top: 3.1, r: 2.2 },
  { id: 'ctf', x: 5.0, z: 4.7, top: 3.2, r: 2.2 },
]

function buildCity(scene, rnd) {
  const boxes = [], trees = []
  const STEP = 1.22
  for (let i = -9; i <= 9; i++) for (let j = -9; j <= 9; j++) {
    const x = i * STEP, z = j * STEP, d = Math.hypot(x, z)
    if (d > coastAt(x, z) * 0.70) continue
    if (i === 0 || j === 0) continue
    if (SITES.some((s) => Math.hypot(x - s.x, z - s.z) < s.r + 0.35)) continue
    if (rnd() < 0.13) { for (let k = 0; k < 6; k++) trees.push([x + (rnd() - 0.5) * 0.9, z + (rnd() - 0.5) * 0.9, 0.7 + rnd() * 0.7]); continue }
    const w = 0.62 + rnd() * 0.34, dp = 0.62 + rnd() * 0.34
    const h = 0.35 + Math.pow(rnd(), 2.2) * 3.4 * (1.15 - d / 11) + rnd() * 0.4
    boxes.push([x, 0, z, w, h, dp])
    if (rnd() < 0.36) boxes.push([x, h, z, w * 0.58, h * (0.25 + rnd() * 0.4), dp * 0.58])
  }
  for (let k = 0; k < 520; k++) {
    const a = rnd() * Math.PI * 2, r = coast(a) * (0.745 + rnd() * 0.20)
    const x = Math.cos(a) * r, z = -Math.sin(a) * r
    trees.push([x, z, 0.8 + rnd() * 1.1])
  }

  const bgeo = new THREE.BoxGeometry(1, 1, 1); bgeo.translate(0, 0.5, 0)
  const bmat = std('#ffffff', { roughness: 0.8 })
  bmat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWp; varying vec3 vNw;')
      .replace('#include <project_vertex>', '#include <project_vertex>\n#ifdef USE_INSTANCING\nmat4 wm = modelMatrix * instanceMatrix;\n#else\nmat4 wm = modelMatrix;\n#endif\nvWp = (wm * vec4(transformed, 1.0)).xyz; vNw = normalize(mat3(wm) * objectNormal);')
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWp; varying vec3 vNw;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 an = abs(normalize(vNw));
        if (an.y < 0.5) {
          float uu = an.x > an.z ? vWp.z : vWp.x;
          vec2 wf = fract(vec2(uu * 5.2, vWp.y * 4.4));
          float win = step(0.22, wf.x) * step(wf.x, 0.80) * step(0.30, wf.y) * step(wf.y, 0.82) * step(0.12, vWp.y);
          diffuseColor.rgb *= mix(1.0, 0.70, win);
          diffuseColor.rgb += vec3(0.02, 0.05, 0.07) * win;
        }`)
  }
  const city = new THREE.InstancedMesh(bgeo, bmat, boxes.length)
  const pal = ['#f6f3ec', '#eceff1', '#dfe8eb', '#f3e8da', '#d3dde3', '#ffffff', '#fbfaf7', '#c3d3dc', '#ebc3ae']
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), C = new THREE.Color()
  boxes.forEach(([x, y, z, w, h, d], i) => {
    M.compose(new THREE.Vector3(x, y, z), Q, new THREE.Vector3(w, h, d))
    city.setMatrixAt(i, M)
    city.setColorAt(i, C.set(pal[Math.floor(Math.pow(rnd(), 1.4) * pal.length)]))
  })
  city.castShadow = city.receiveShadow = true
  scene.add(city)

  const forest = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.22, 1), std('#ffffff', { roughness: 1, flatShading: true }), trees.length)
  const greens = ['#8fbf9a', '#a6cfa9', '#6ea98a', '#bcd9ac', '#7fb89f']
  trees.forEach(([x, z, s], i) => {
    M.compose(new THREE.Vector3(x, 0.16 * s, z), Q, new THREE.Vector3(s, s * 1.15, s))
    forest.setMatrixAt(i, M)
    forest.setColorAt(i, C.set(greens[Math.floor(rnd() * greens.length)]))
  })
  forest.castShadow = forest.receiveShadow = true
  scene.add(forest)
}

function landmarkRing0() {
  const g = new THREE.Group(), spin = []
  g.add(mesh(new THREE.CylinderGeometry(2.45, 2.45, 0.1, 64), std('#f7f7f4'), 0, 0.05, 0))
  g.add(mesh(new THREE.SphereGeometry(1.3, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#8ff7b6', transparent: true, opacity: 0.62 }), 0, 0.1, 0))
  g.add(mesh(new THREE.SphereGeometry(0.85, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#eafff2' }), 0, 0.1, 0))
  const beam = mesh(new THREE.CylinderGeometry(1.0, 1.0, 11, 48, 1, true), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `precision highp float; varying vec2 vUv; uniform float uTime;
      void main(){ float a = pow(1.0 - vUv.y, 2.2) * (0.42 + 0.14 * sin(vUv.y * 40.0 - uTime * 3.0)); gl_FragColor = vec4(vec3(0.35, 1.0, 0.6) * a, 1.0); }`,
  }), 0, 5.6, 0)
  g.add(beam)
  for (const [r, t, y] of [[1.75, 0.04, 0.32], [2.1, 0.022, 0.2]]) {
    const ring = mesh(new THREE.TorusGeometry(r, t, 8, 96, Math.PI * 1.6), new THREE.MeshBasicMaterial({ color: MINT }), 0, y, 0)
    ring.rotation.x = Math.PI / 2
    g.add(ring); spin.push(ring)
  }
  g.userData.tick = (t) => { beam.material.uniforms.uTime.value = t; spin[0].rotation.z = t * 0.5; spin[1].rotation.z = -t * 0.3 }
  return g
}

function landmarkTower() {
  const g = new THREE.Group()
  const white = std('#f6f3ef'), red = std(RED, { roughness: 0.6 })
  g.add(mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.1, 48), std('#f2ede8'), 0, 0.05, 0))
  g.add(mesh(new THREE.CylinderGeometry(0.26, 0.54, 3.7, 8), white, 0, 1.95, 0))
  g.add(mesh(new THREE.CylinderGeometry(0.47, 0.5, 0.26, 8), red, 0, 0.75, 0))
  g.add(mesh(new THREE.CylinderGeometry(0.345, 0.37, 0.22, 8), red, 0, 2.5, 0))
  g.add(mesh(new THREE.CylinderGeometry(0.56, 0.3, 0.46, 8), red, 0, 3.98, 0))
  g.add(mesh(new THREE.CylinderGeometry(0.5, 0.56, 0.1, 8), white, 0, 4.26, 0))
  g.add(mesh(new THREE.CylinderGeometry(0.02, 0.03, 1.1, 6), white, 0, 4.85, 0))
  const tip = mesh(new THREE.SphereGeometry(0.08, 12, 8), new THREE.MeshBasicMaterial({ color: '#ff4a40' }), 0, 5.42, 0)
  g.add(tip)
  const dish = new THREE.Group(); dish.position.y = 4.45
  const d1 = mesh(new THREE.TorusGeometry(0.82, 0.025, 8, 64), red); d1.rotation.x = Math.PI / 2
  const d2 = mesh(new THREE.TorusGeometry(0.6, 0.02, 8, 48, Math.PI), white, 0, 0.1, 0); d2.rotation.y = 0.5
  dish.add(d1, d2); g.add(dish)
  for (const [x, z, h] of [[1.05, 0.5, 0.5], [-0.9, 0.85, 0.36], [0.3, -1.15, 0.62]]) g.add(mesh(new THREE.BoxGeometry(0.5, h, 0.5), white, x, 0.1 + h / 2, z))
  g.userData.tick = (t) => { dish.rotation.y = t * 0.9; tip.scale.setScalar(1 + 0.5 * Math.max(0, Math.sin(t * 3))) }
  return g
}

function landmarkChess() {
  const g = new THREE.Group()
  const S = 0.46
  g.add(mesh(new THREE.BoxGeometry(S * 8 + 0.36, 0.16, S * 8 + 0.36), std('#3a3331'), 0, 0.08, 0))
  const sq = new THREE.InstancedMesh(new THREE.BoxGeometry(S, 0.05, S), std('#ffffff', { roughness: 0.5 }), 64)
  const M = new THREE.Matrix4(), C = new THREE.Color()
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
    M.makeTranslation((i - 3.5) * S, 0.185, (j - 3.5) * S)
    sq.setMatrixAt(i * 8 + j, M); sq.setColorAt(i * 8 + j, C.set((i + j) % 2 ? '#3f3b42' : '#f5edda'))
  }
  sq.receiveShadow = true
  g.add(sq)
  const ivory = std('#fbf6ea', { roughness: 0.35 }), ebony = std('#2e2a31', { roughness: 0.35 })
  const KING = [[0, 0], [0.3, 0], [0.3, 0.06], [0.24, 0.1], [0.2, 0.16], [0.12, 0.3], [0.09, 0.75], [0.14, 0.82], [0.14, 0.86], [0.1, 0.9], [0.15, 1.08], [0.17, 1.14], [0, 1.14]]
  const PAWN = [[0, 0], [0.2, 0], [0.2, 0.05], [0.15, 0.09], [0.08, 0.22], [0.06, 0.42], [0.11, 0.46], [0.06, 0.5], [0, 0.5]]
  const at = (m, i, j) => { m.position.set((i - 3.5) * S, 0.21, (j - 3.5) * S); g.add(m); return m }
  const king = (mat, s) => {
    const k = new THREE.Group(); k.add(lathe(KING, s, mat))
    k.add(mesh(new THREE.BoxGeometry(0.05 * s, 0.3 * s, 0.05 * s), mat, 0, 1.28 * s, 0), mesh(new THREE.BoxGeometry(0.2 * s, 0.05 * s, 0.05 * s), mat, 0, 1.31 * s, 0))
    return k
  }
  const pawn = (mat, s) => { const p = new THREE.Group(); p.add(lathe(PAWN, s, mat), mesh(new THREE.SphereGeometry(0.115 * s, 16, 12), mat, 0, 0.58 * s, 0)); return p }
  at(king(ivory, 1.75), 4, 3); at(king(ebony, 1.55), 2, 5)
  at(pawn(ivory, 1.5), 2, 2); at(pawn(ivory, 1.5), 6, 2); at(pawn(ivory, 1.5), 6, 5)
  at(pawn(ebony, 1.5), 1, 6); at(pawn(ebony, 1.5), 4, 6); at(pawn(ebony, 1.5), 0, 3)
  return g
}

function landmarkOrb() {
  const g = new THREE.Group()
  g.add(mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.1, 48), std('#f2f4f3'), 0, 0.05, 0))
  const body = mesh(new THREE.TorusGeometry(1.25, 0.27, 18, 72), std('#eef3f4', { roughness: 0.55 }), 0, 0.36, 0)
  body.rotation.x = Math.PI / 2; body.scale.z = 1.25
  g.add(body)
  g.add(mesh(new THREE.CylinderGeometry(0.98, 0.98, 0.06, 40), std('#a9d2b0'), 0, 0.13, 0))
  const orb = new THREE.Group(); orb.position.y = 1.95
  orb.add(mesh(new THREE.SphereGeometry(0.4, 32, 20), new THREE.MeshBasicMaterial({ color: '#b9fff0' })))
  orb.add(mesh(new THREE.SphereGeometry(0.56, 32, 20), new THREE.MeshBasicMaterial({ color: '#5fe9d0', transparent: true, opacity: 0.32, depthWrite: false })))
  const rings = [0.78, 0.95].map((r, i) => { const t = mesh(new THREE.TorusGeometry(r, 0.016, 8, 72, Math.PI * 1.5), new THREE.MeshBasicMaterial({ color: '#2fc9a8' })); t.rotation.x = 1.1 + i; orb.add(t); return t })
  g.add(orb)
  g.add(mesh(new THREE.CylinderGeometry(0.03, 0.2, 1.5, 12, 1, true), new THREE.MeshBasicMaterial({ color: '#8ff5df', transparent: true, opacity: 0.35, depthWrite: false }), 0, 0.9, 0))
  g.userData.tick = (t) => { orb.position.y = 1.95 + Math.sin(t * 1.3) * 0.1; rings[0].rotation.y = t * 0.9; rings[1].rotation.z = -t * 0.7; orb.children[1].scale.setScalar(1 + 0.08 * Math.sin(t * 2.4)) }
  return g
}

function landmarkKeep() {
  const g = new THREE.Group()
  const stone = std('#ece4d8'), roof = std(RED, { roughness: 0.6 })
  g.add(mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.1, 48), std('#f1ece4'), 0, 0.05, 0))
  const W = 1.15
  for (const [x, z, r] of [[0, W, 0], [0, -W, 0], [W, 0, 1], [-W, 0, 1]]) { const w = mesh(new THREE.BoxGeometry(W * 2, 0.62, 0.18), stone, x, 0.41, z); w.rotation.y = r * Math.PI / 2; g.add(w) }
  for (const [x, z] of [[W, W], [W, -W], [-W, W], [-W, -W]]) {
    g.add(mesh(new THREE.CylinderGeometry(0.25, 0.28, 1.1, 12), stone, x, 0.65, z))
    g.add(mesh(new THREE.ConeGeometry(0.33, 0.48, 12), roof, x, 1.44, z))
  }
  g.add(mesh(new THREE.BoxGeometry(0.95, 1.6, 0.95), stone, 0, 0.9, 0))
  g.add(mesh(new THREE.BoxGeometry(1.1, 0.16, 1.1), stone, 0, 1.78, 0))
  g.add(mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.5, 6), std('#6b6660'), 0, 2.6, 0))
  const fg = new THREE.PlaneGeometry(0.78, 0.44, 10, 1); fg.translate(0.39, 0, 0)
  const flag = mesh(fg, new THREE.MeshStandardMaterial({ color: RED, side: THREE.DoubleSide, roughness: 0.7 }), 0, 3.1, 0)
  g.add(flag)
  const base = fg.attributes.position.array.slice()
  g.userData.tick = (t) => {
    const p = fg.attributes.position
    for (let i = 0; i < p.count; i++) { const x = base[i * 3]; p.setZ(i, Math.sin(x * 7 - t * 5) * 0.07 * x * 2) }
    p.needsUpdate = true
  }
  return g
}

export function createWorld() {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(26, 1, 1, 400)
  const rnd = rng(42)

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8fb0aa, 1.55))
  const sun = new THREE.DirectionalLight(0xffecd0, 3.3)
  sun.position.set(-18, 20, 9)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  Object.assign(sun.shadow.camera, { left: -19, right: 19, top: 19, bottom: -19, near: 1, far: 80 })
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; sun.shadow.radius = 3
  scene.add(sun)

  const sea = mesh(new THREE.PlaneGeometry(400, 400), new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `precision highp float; varying vec3 vW; uniform float uTime; ${NOISE}
      void main(){
        float a = atan(-vW.z, vW.x);
        float c = 12.6 + 1.4 * sin(a * 2.0 + 0.6) + 0.9 * sin(a * 3.0 + 2.1) + 0.5 * sin(a * 5.0 + 4.0);
        float d = length(vW.xz) - c * 1.09;
        float n = fbm3(vW.xz * 0.5 + uTime * 0.06);
        vec3 col = mix(vec3(0.60, 0.88, 0.85), vec3(0.24, 0.52, 0.66), smoothstep(-0.5, 9.0, d + n * 2.0));
        col = mix(col, vec3(0.17, 0.40, 0.56), smoothstep(8.0, 45.0, d));
        float foam = smoothstep(0.75, 1.0, sin(d * 2.6 - uTime * 1.1 + n * 5.0)) * smoothstep(3.2, 0.0, d);
        col += foam * 0.38;
        col += pow(fbm3(vW.xz * 2.4 + vec2(uTime * 0.15, 0.0)), 5.0) * 1.2;
        gl_FragColor = vec4(col, 1.0);
      }`,
  }), 0, -0.7, 0)
  sea.rotation.x = -Math.PI / 2
  scene.add(sea)

  scene.add(slab(1.09, 0.5, -0.32, std('#efe3c8', { roughness: 1 })))
  scene.add(slab(1.0, 1.2, 0, std('#c9dcc4', { roughness: 1 })))
  const pave = new THREE.ShapeGeometry(outline(0.735), 1); pave.rotateX(-Math.PI / 2)
  const pv = mesh(pave, std('#e3e7e5', { roughness: 0.95 }), 0, 0.012, 0); pv.receiveShadow = true
  scene.add(pv)

  buildCity(scene, rnd)

  // never drawn: these only exist to drag soft cloud shadows across the city
  const puffMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })
  const puffs = []
  for (let i = 0; i < 7; i++) {
    const g = new THREE.Group()
    for (let k = 0; k < 5; k++) {
      const m = mesh(new THREE.SphereGeometry(0.7 + rnd() * 0.9, 14, 10), puffMat, (rnd() - 0.5) * 3.4, (rnd() - 0.5) * 0.5, (rnd() - 0.5) * 1.6)
      m.scale.y = 0.55; m.castShadow = true
      g.add(m)
    }
    g.position.set((rnd() - 0.5) * 44, 13 + rnd() * 2, (rnd() - 0.5) * 30 + 6)
    g.userData.v = 0.25 + rnd() * 0.3
    scene.add(g); puffs.push(g)
  }

  const builders = { ring0: landmarkRing0, 'b2r-kit': landmarkTower, chess3d: landmarkChess, 'jarvis-hud': landmarkOrb, ctf: landmarkKeep }
  const hits = [], marks = {}
  for (const s of SITES) {
    const g = builders[s.id]()
    g.position.set(s.x, 0.012, s.z)
    g.traverse((o) => { if (o.isMesh && o.material.isMeshStandardMaterial) { o.castShadow = true; o.receiveShadow = true } })
    const halo = mesh(new THREE.RingGeometry(s.r - 0.12, s.r + 0.04, 72), new THREE.MeshBasicMaterial({ color: MINT, transparent: true, opacity: 0, depthWrite: false }), 0, 0.14, 0)
    halo.rotation.x = -Math.PI / 2
    g.add(halo)
    const hit = mesh(new THREE.CylinderGeometry(s.r * 0.8, s.r * 0.9, s.top, 12), new THREE.MeshBasicMaterial({ visible: false }), s.x, s.top / 2, s.z)
    hit.userData.id = s.id
    scene.add(g, hit)
    hits.push(hit)
    marks[s.id] = { g, halo, glow: 0, site: s }
  }

  const DIR = new THREE.Vector3(1, 0.9, 1).normalize()
  const RIGHT = new THREE.Vector3(1, 0, -1).normalize(), FWD = new THREE.Vector3(-1, 0, -1).normalize()
  let HOME = 41
  const view = { x: 0, z: 0, d: HOME, tx: 0, tz: 0, td: HOME, intro: 1 }
  const ray = new THREE.Raycaster(), v2 = new THREE.Vector2(), v3 = new THREE.Vector3()
  let hover = null, active = null, H = 1

  const api = {
    scene, camera, view,
    resize(w, h) { camera.aspect = w / h; camera.fov = w < h ? 40 : 26; camera.updateProjectionMatrix(); H = h; HOME = w < h ? 62 : 41; if (!active) view.td = HOME },
    pan(dx, dy) {
      const k = (view.d * 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / H
      view.tx -= RIGHT.x * dx * k - FWD.x * dy * k * 1.45
      view.tz -= RIGHT.z * dx * k - FWD.z * dy * k * 1.45
      const l = Math.hypot(view.tx, view.tz)
      if (l > 10) { view.tx *= 10 / l; view.tz *= 10 / l }
    },
    zoom(delta) { view.td = THREE.MathUtils.clamp(view.td + delta, 17, HOME + 11) },
    atMaxOut: () => view.td >= HOME + 10.9,
    pick(nx, ny) {
      ray.setFromCamera(v2.set(nx, ny), camera)
      const h = ray.intersectObjects(hits, false)[0]
      return h ? h.object.userData.id : null
    },
    setHover(id) { hover = id },
    focus(id) {
      active = id
      if (id) { const s = marks[id].site, k = camera.aspect > 1.1 ? 2.6 : 0; view.tx = s.x + RIGHT.x * k; view.tz = s.z + RIGHT.z * k; view.td = 23 } else view.td = HOME
    },
    home() { active = null; view.tx = 0; view.tz = 0; view.td = HOME },
    screen(id, w, h) {
      const s = marks[id].site
      v3.set(s.x, s.top + 0.35, s.z).project(camera)
      return { x: (v3.x * 0.5 + 0.5) * w, y: (-v3.y * 0.5 + 0.5) * h, ok: v3.z < 1 }
    },
    // open: 0 still under cloud, 1 fully revealed
    update(time, dt, open) {
      const k = 1 - Math.exp(-dt * 4.5)
      view.x += (view.tx - view.x) * k; view.z += (view.tz - view.z) * k; view.d += (view.td - view.d) * k
      const e = 1 - Math.pow(1 - THREE.MathUtils.clamp(open, 0, 1), 2)
      const d = view.d + (1 - e) * 26
      const yaw = (1 - e) * -0.5 + Math.sin(time * 0.1) * 0.012
      v3.copy(DIR).applyAxisAngle(THREE.Object3D.DEFAULT_UP, yaw)
      camera.position.set(view.x + v3.x * d, v3.y * d, view.z + v3.z * d)
      camera.lookAt(view.x, 0.6, view.z)
      sea.material.uniforms.uTime.value = time
      for (const p of puffs) { p.position.x += p.userData.v * dt; if (p.position.x > 26) p.position.x = -26 }
      for (const id in marks) {
        const m = marks[id]
        m.g.userData.tick?.(time)
        const want = id === active ? 1 : id === hover ? 0.75 : 0.16 + 0.1 * Math.sin(time * 2 + m.site.x)
        m.glow += (want - m.glow) * k
        m.halo.material.opacity = m.glow
        m.halo.scale.setScalar(1 + 0.05 * Math.sin(time * 2.2 + m.site.z))
      }
    },
  }
  return api
}
