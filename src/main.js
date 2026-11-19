import './style.css'
import gsap from 'gsap'
import * as THREE from 'three'
import { createStage } from './gl/stage.js'
import { createCore, createShards, createDepths } from './gl/acts.js'
import { createWorld, SITES } from './gl/world.js'
import { createAudio } from './audio.js'
import { PROJECTS, SHARD_LABELS, LINKS, STACK } from './data.js'

const $ = (s, r = document) => r.querySelector(s)
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const END = 40
const GATES = [{ at: 9, to: 10.7, dur: 2.4, solved: false }, { at: 32, to: 36, dur: 5.6, solved: false }]

// S is where we are; G is what the picture looks like there (driven by the timeline).
const S = { t: 0, target: 0, entered: false, auto: true, world: false, hold: 0, holding: false, time: 0, idle: 0, flash: 0, exit: 0 }
const G = { ice: 1, melt: 0, sky: 0, skyRich: 0, curtain: 0, deep: 0, worldBg: 0, black: 0, white: 0, cloud: 0, open: 0, camZ: 8, coreS: 0, coreY: -3.4, coreDark: 0, explode: 0, shards: 0, depths: 0, world: 0, grain: 0.05, vig: 0.22 }

const stage = createStage($('#gl'))
const audio = createAudio()
const actScene = new THREE.Scene()
const actCam = new THREE.PerspectiveCamera(35, 1, 0.1, 200)
const core = createCore()
const shards = createShards(SHARD_LABELS)
const depths = createDepths()
actScene.add(core.group, shards.group, depths.group)
const world = createWorld()

/* ───────── timeline ───────── */
const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } })
const T = (vars, at, duration, ease = 'power2.inOut') => tl.to(G, { ...vars, duration, ease }, at)

T({ skyRich: 1 }, 2.6, 4.6)
T({ coreS: 1, coreY: 0 }, 3.0, 2.8, 'power3.out')
T({ black: 1 }, 9.0, 0.22, 'power2.in')
tl.set(G, { sky: 0, curtain: 1, coreS: 0, shards: 1, vig: 0.1 }, 9.25)
T({ explode: 1 }, 9.25, 2.8, 'none')
T({ black: 0 }, 9.45, 0.9, 'power2.out')
T({ camZ: -34 }, 11.2, 8.3, 'sine.inOut')
T({ depths: 1 }, 18.4, 2.2)
T({ curtain: 0, deep: 1, grain: 0.09, vig: 0.3 }, 18.8, 2.4, 'sine.inOut')
T({ camZ: -64 }, 19.5, 12, 'sine.inOut')
T({ shards: 0 }, 20.6, 1.4)
tl.set(G, { coreDark: 1 }, 22)
T({ coreS: 1 }, 30.0, 1.8, 'power3.out')
T({ white: 1 }, 32.0, 0.55, 'power2.in')
tl.set(G, { deep: 0, worldBg: 1, coreS: 0, depths: 0, cloud: 1, world: 1, grain: 0.035, vig: 0 }, 32.6)
T({ white: 0 }, 33.0, 0.9, 'power2.out')
T({ open: 0.5 }, 36.5, 2.0, 'sine.inOut')
T({ open: 0.62 }, 38.5, 0.8, 'none')
T({ open: 1 }, 39.3, 0.7, 'sine.inOut')

function split(ln) {
  for (const n of [...ln.childNodes]) {
    if (n.nodeType !== 3) continue
    const frag = document.createDocumentFragment()
    for (const w of n.textContent.split(/(\s+)/)) {
      if (!w) continue
      if (/^\s+$/.test(w)) { frag.append(' '); continue }
      const wd = document.createElement('span'); wd.className = 'wd'
      for (const c of w) { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; wd.append(s) }
      frag.append(wd)
    }
    n.replaceWith(frag)
  }
}

document.querySelectorAll('.st').forEach((st) => {
  const tin = +st.dataset.in, tout = +st.dataset.out
  const lines = [...st.querySelectorAll('.ln')]
  gsap.set(st, { autoAlpha: 0 })
  tl.set(st, { autoAlpha: 1 }, tin)
  lines.forEach((ln, i) => {
    const at = tin + i * 0.2
    if (ln.classList.contains('name')) {
      tl.fromTo(ln, { opacity: 0, scale: 0.86, filter: 'blur(18px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out' }, at)
      return
    }
    split(ln)
    const chars = ln.querySelectorAll('.ch'), sw = ln.querySelectorAll('.sw')
    tl.fromTo(ln, { filter: 'blur(9px)' }, { filter: 'blur(0px)', duration: 0.7, ease: 'power2.out' }, at)
    if (chars.length) tl.fromTo(chars, { opacity: 0, yPercent: 42 }, { opacity: 1, yPercent: 0, duration: 0.55, ease: 'power3.out', stagger: 0.026 }, at)
    if (sw.length) tl.fromTo(sw, { opacity: 0, scale: 0.7, rotate: -8, xPercent: -10 }, { opacity: 1, scale: 1, rotate: 0, xPercent: 0, duration: 0.95, ease: 'power3.out' }, Math.max(0, at - 0.05))
  })
  tl.to(st, { autoAlpha: 0, duration: 0.42, ease: 'power2.in' }, tout)
  tl.to(lines, { yPercent: -24, duration: 0.42, ease: 'power2.in', stagger: 0.03 }, tout)
})

/* ───────── dom ───────── */
const el = {
  draw: $('#draw'), gate: $('#gate'), gateFg: $('#gate-fg'), hint: $('#hint'), explore: $('#explore'), pins: $('#pins'),
  needle: $('#needle'), ring: $('#ring'), uidN: $('#uid-n'), uidName: $('#uid-name'), sound: $('#sound'),
  dockMain: $('#dock-main'), menu: $('#menu'), menuBtn: $('#menu-btn'), panel: $('#panel'), panelBody: $('#panel-body'),
}
$('#ticks').innerHTML = '<i></i>'.repeat(31)
$('#sr-work').innerHTML = PROJECTS.map((p) => `<li><strong>${p.name}</strong>, ${p.role} (${p.year}). ${p.blurb}</li>`).join('')

const byId = Object.fromEntries(PROJECTS.map((p) => [p.id, p]))
const pins = SITES.map((s) => {
  const b = document.createElement('button')
  b.type = 'button'
  const p = byId[s.id]
  b.className = 'pin' + (p ? '' : ' hub')
  b.innerHTML = p ? `<i>${p.index}</i>${p.name}` : 'ring 0 · about'
  b.addEventListener('click', () => openPanel(s.id))
  el.pins.append(b)
  return { id: s.id, b }
})

$('#menu-list').innerHTML = PROJECTS.map((p) => `<li><button type="button" data-id="${p.id}"><i>${p.index}</i>${p.name}<span>${p.role}</span></button></li>`).join('') +
  `<li><button type="button" data-id="ring0"><i>00</i>About<span>Cotonou · Epitech 2029</span></button></li>`

const panelHTML = (id) => {
  const p = byId[id]
  if (!p) return `
    <p class="p-k">ring 0 · uid=0(root)</p>
    <h2 class="p-t"><i class="sw">R</i>ayan Sama</h2>
    <p class="p-r">Full-stack developer &amp; security researcher.</p>
    <p class="p-b">I build systems before I break them. Understanding a thing and defeating it are the same discipline, learned from opposite ends. When the existing tool is slower than the problem, the tool gets rewritten.</p>
    <dl class="p-f">
      <div><dt>based in</dt><dd>Cotonou, Bénin</dd></div>
      <div><dt>school</dt><dd>Epitech · class of 2029</dd></div>
      <div><dt>field</dt><dd>web · pwn · rev · forensics</dd></div>
      <div><dt>ranges</dt><dd>HackTheBox · Root-Me</dd></div>
      <div><dt>status</dt><dd>open to internships</dd></div>
    </dl>
    <div class="p-s">${STACK.map((s) => `<span>${s}</span>`).join('')}</div>
    <a class="p-a" href="mailto:${LINKS.mail}">Write to me</a><a class="p-a" href="${LINKS.github}" target="_blank" rel="noopener">GitHub ↗</a>`
  return `
    <p class="p-k">${p.index} / 04 · ${p.year}</p>
    <h2 class="p-t">${p.sw ? `<i class="sw">${p.sw}</i>` : ''}${p.rest}</h2>
    <p class="p-r">${p.role}</p>
    <img class="p-img" src="${p.img}" alt="${p.name} preview" loading="lazy" />
    <p class="p-b">${p.blurb}</p>
    <p class="p-m">${p.metric}</p>
    <div class="p-s">${p.stack.map((s) => `<span>${s}</span>`).join('')}</div>
    <a class="p-a" href="${LINKS.github}" target="_blank" rel="noopener">GitHub ↗</a>`
}

let openId = null
function openPanel(id) {
  if (!S.world) { skip(() => openPanel(id)); return }
  openId = id
  el.panelBody.innerHTML = panelHTML(id)
  el.panel.hidden = false
  el.panel.style.animation = 'none'; void el.panel.offsetWidth; el.panel.style.animation = ''
  el.panel.scrollTop = 0
  document.body.classList.add('panel-open')
  pins.forEach((p) => p.b.classList.toggle('is', p.id === id))
  world.focus(id)
  audio.hit('open')
  el.explore.classList.remove('on'); exploreSeen = true
  toggleMenu(false)
}
function closePanel() {
  if (!openId) return
  openId = null
  el.panel.hidden = true
  document.body.classList.remove('panel-open')
  pins.forEach((p) => p.b.classList.remove('is'))
  world.focus(null)
  audio.hit('close')
}
$('#panel-x').addEventListener('click', closePanel)

function toggleMenu(force) {
  const open = force ?? el.menu.hidden
  el.menu.hidden = !open
  el.menuBtn.setAttribute('aria-expanded', String(open))
}
el.menuBtn.addEventListener('click', () => { audio.start(); toggleMenu(); audio.hit('tick') })
$('#menu-list').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) openPanel(b.dataset.id) })
$('#cta').addEventListener('click', () => { el.dockMain.classList.add('open'); audio.hit('open') })
$('#say-hi').addEventListener('click', () => { el.dockMain.classList.add('open'); audio.hit('open') })
$('#back').addEventListener('click', () => el.dockMain.classList.remove('open'))
const syncSound = () => el.sound.setAttribute('aria-pressed', String(audio.on))
syncSound()
el.sound.addEventListener('click', () => { audio.start(); audio.toggle(); syncSound() })
$('#skip').addEventListener('click', () => skip())
$('#replay').addEventListener('click', () => location.reload())

/* ───────── flow ───────── */
function enter() {
  if (S.entered) return
  S.entered = true
  document.body.classList.add('in')
  el.draw.classList.add('gone')
  audio.hit('crack')
  gsap.timeline()
    .to(G, { melt: 1, duration: 1.0, ease: 'power2.in' })
    .add(() => { G.ice = 0; G.sky = 1; G.melt = 0 })
    .to(S, { t: 1.7, duration: 2.8, ease: 'power1.out' })
    .add(() => { S.target = S.t; S.auto = false })
}

function solve(gate) {
  gate.solved = true
  S.auto = true; S.holding = false
  audio.hit(gate === GATES[0] ? 'shatter' : 'reveal')
  gsap.to(S, { hold: 0, duration: 0.5, delay: 0.25 })
  gsap.to(S, { t: gate.to, duration: gate.dur, ease: 'none', onComplete: () => { S.target = S.t; S.auto = false } })
}

function skip(then) {
  if (S.world) { then?.(); return }
  GATES.forEach((g) => { g.solved = true })
  gsap.killTweensOf(S)
  S.auto = true; S.holding = false; S.hold = 0
  document.body.classList.add('in')
  el.draw.classList.add('gone')
  gsap.timeline()
    .to(S, { flash: 1, duration: 0.4, ease: 'power2.in' })
    .add(() => { S.entered = true; G.ice = 0; G.sky = 1; G.melt = 0; S.t = S.target = END })
    .to(S, { flash: 0, duration: 1.1, ease: 'power2.out' }, '+=0.1')
    .add(() => { S.auto = false; S.world = true; then?.() }, '-=0.5')
}

const limit = () => (GATES.find((g) => !g.solved)?.at ?? END)
const nudge = (d) => { if (S.entered && !S.auto && !S.world) { S.target = clamp(S.target + d, 0, limit()); S.idle = 0 } }

/* ───────── pointer ───────── */
const P = { x: 0.5, y: 0.5, px: 0.5, py: 0.5, down: false, sx: 0, sy: 0, lx: 0, ly: 0, moved: 0, speed: 0, stale: true, type: 'mouse' }
let stroke = [], fading = false, exploreSeen = false
const size = { w: innerWidth, h: innerHeight }

function isZero() {
  if (stroke.length < 14) return false
  let cx = 0, cy = 0
  for (const p of stroke) { cx += p.x; cy += p.y }
  cx /= stroke.length; cy /= stroke.length
  let r = 0
  for (const p of stroke) r += Math.hypot(p.x - cx, p.y - cy)
  r /= stroke.length
  if (r < Math.min(size.w, size.h) * 0.07) return false
  let sum = 0, prev = Math.atan2(stroke[0].y - cy, stroke[0].x - cx)
  for (let i = 1; i < stroke.length; i++) {
    const a = Math.atan2(stroke[i].y - cy, stroke[i].x - cx)
    let d = a - prev
    if (d > Math.PI) d -= Math.PI * 2; else if (d < -Math.PI) d += Math.PI * 2
    sum += d; prev = a
  }
  return Math.abs(sum) > 5.5
}

const nearCentre = (e) => Math.hypot(e.clientX - size.w / 2, e.clientY - size.h / 2) < Math.max(120, Math.min(size.w, size.h) * 0.2)
const atGate = () => { const g = GATES.find((x) => !x.solved); return S.entered && !S.auto && g && S.t > g.at - 0.08 ? g : null }
const canvas = stage.renderer.domElement

canvas.addEventListener('pointerdown', (e) => {
  audio.start()
  canvas.setPointerCapture?.(e.pointerId)
  P.down = true; P.type = e.pointerType
  P.sx = P.lx = e.clientX; P.sy = P.ly = e.clientY; P.moved = 0
  P.x = e.clientX / size.w; P.y = 1 - e.clientY / size.h
  P.px = P.x; P.py = P.y; P.stale = false
  toggleMenu(false)
  if (!S.entered) { stroke = [{ x: e.clientX, y: e.clientY }]; fading = false; el.draw.classList.add('busy') }
  else if (atGate() && nearCentre(e)) S.holding = true
  else if (S.world) document.body.classList.add('grabbing')
})
addEventListener('pointermove', (e) => {
  P.x = e.clientX / size.w; P.y = 1 - e.clientY / size.h
  if (P.stale) { P.px = P.x; P.py = P.y; P.stale = false }
  const dx = e.clientX - P.lx, dy = e.clientY - P.ly
  P.lx = e.clientX; P.ly = e.clientY
  if (P.down) {
    P.moved += Math.abs(dx) + Math.abs(dy)
    if (!S.entered) { stroke.push({ x: e.clientX, y: e.clientY }); if (isZero()) enter() }
    else if (S.world && e.target === canvas) { if (P.moved > 5) { world.pan(dx, dy); if (openId) closePanel(); el.explore.classList.remove('on'); exploreSeen = true } }
    else if (!S.holding && P.type === 'touch') nudge(-dy * 0.014)
  } else if (S.world && e.target === canvas && P.type === 'mouse') {
    const id = world.pick(P.x * 2 - 1, P.y * 2 - 1)
    world.setHover(id)
    document.body.classList.toggle('point', !!id)
  }
})
const release = (e) => {
  if (!P.down) return
  P.down = false; S.holding = false
  document.body.classList.remove('grabbing')
  if (!S.entered) { stroke = []; fading = true; el.draw.classList.remove('busy') }
  else if (S.world && P.moved < 6 && e.target === canvas) {
    const id = world.pick((e.clientX / size.w) * 2 - 1, -(e.clientY / size.h) * 2 + 1)
    if (id) openPanel(id); else closePanel()
  }
}
addEventListener('pointerup', release)
addEventListener('pointercancel', release)

addEventListener('wheel', (e) => {
  if (e.target.closest?.('.panel')) return
  e.preventDefault()
  const dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY
  if (!S.entered || S.auto) return
  if (S.world) {
    if (dy < 0 && world.atMaxOut()) { S.exit += -dy; if (S.exit > 500) leaveWorld() } else S.exit = 0
    world.zoom(dy * 0.012)
    return
  }
  nudge(dy * 0.0024)
}, { passive: false })

addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closePanel(); toggleMenu(false); return }
  if (e.target.closest?.('button, a, .panel') && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
  if (!S.entered) { if (e.key === 'Enter') { audio.start(); skip() } return }
  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); audio.start(); if (atGate()) S.holding = true; else nudge(0.9) }
  else if (e.key === 'ArrowDown' || e.key === 'PageDown') nudge(0.9)
  else if (e.key === 'ArrowUp' || e.key === 'PageUp') { if (S.world) leaveWorld(); else nudge(-0.9) }
})
addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') S.holding = false })

function leaveWorld() {
  closePanel(); world.home()
  S.world = false; S.exit = 0
  S.target = END - 1.4
}

/* ───────── hud state ───────── */
const PHASES = [
  { until: 9.25, ink: 'light', ring: 'RING 3', uid: 1000, name: 'guest', act: 'sky' },
  { until: 19.7, ink: 'red', ring: 'RING 2', uid: 33, name: 'www-data', act: 'red' },
  { until: 32.55, ink: 'deep', ring: 'RING 1', uid: 1, name: 'daemon', act: 'deep' },
  { until: Infinity, ink: 'slate', ring: 'RING 0', uid: 0, name: 'root', act: 'world' },
]
let phase = null
const uidTween = { v: 65534 }
function setPhase(p) {
  if (p === phase) return
  phase = p
  document.body.dataset.ink = p.ink
  el.ring.textContent = p.ring
  el.uidName.textContent = p.name
  gsap.to(uidTween, { v: p.uid, duration: 1.1, ease: 'power3.out', onUpdate: () => { el.uidN.textContent = Math.round(uidTween.v) } })
  audio.setAct(p.act)
  if (S.entered) audio.hit('tick')
}

/* ───────── loop ───────── */
function resize() {
  size.w = innerWidth; size.h = innerHeight
  stage.resize(size.w, size.h)
  actCam.aspect = size.w / size.h
  actCam.fov = actCam.aspect < 1 ? 58 : 35
  actCam.updateProjectionMatrix()
  world.resize(size.w, size.h)
}
addEventListener('resize', resize)
resize()

const cam = { x: 0, y: 0 }
let last = performance.now(), ema = 0.016, frames = 0
function frame(now) {
  const raw = Math.min(0.25, (now - last) / 1000), dt = Math.min(0.1, raw)
  last = now
  S.time += dt; S.idle += dt
  ema += (raw - ema) * 0.05
  if (++frames > 120 && ema > 0.03 && stage.lower()) { frames = 0; resize() }

  if (S.entered && !S.auto) {
    S.target = clamp(S.target, 0, limit())
    S.t += (S.target - S.t) * (1 - Math.exp(-dt * 5.5))
    if (Math.abs(S.target - S.t) < 0.0004) S.t = S.target
  }
  if (S.entered) tl.time(S.t)

  const gate = atGate()
  if (gate) {
    S.hold = clamp(S.hold + (S.holding ? raw / 1.35 : -raw * 1.3), 0, 1)
    if (S.hold >= 1) solve(gate)
  } else if (!S.auto) S.hold = Math.max(0, S.hold - dt * 2)
  el.gate.classList.toggle('on', !!gate)
  el.gateFg.style.strokeDashoffset = String(100 - S.hold * 100)
  audio.hold(gate || S.auto ? S.hold : 0)

  if (S.entered) setPhase(PHASES.find((p) => S.t < p.until))
  el.needle.style.transform = `translateX(${clamp(S.t / END, 0, 1) * 168 * (size.w < 720 ? 120 / 168 : 1)}px)`

  const wasWorld = S.world
  if (!S.world && !S.auto && S.t > END - 0.05) S.world = true
  if (S.world !== wasWorld && S.world && !exploreSeen) el.explore.classList.add('on')
  if (!S.world) el.explore.classList.remove('on')
  document.body.classList.toggle('grab', S.world)
  el.pins.classList.toggle('on', G.world > 0.5 && G.open > 0.86)
  el.hint.classList.toggle('on', S.entered && !S.auto && !gate && !S.world && S.idle > 2.2)

  // pointer trail
  const sp = Math.hypot(P.x - P.px, P.y - P.py)
  P.speed += (sp / Math.max(dt, 0.001) - P.speed) * 0.2
  if (!S.entered) {
    stage.stamp({ x: P.px, y: P.py }, P, P.down ? 1 : 0, { size: 0.03, fade: fading ? 0.93 : 0.999, sub: fading ? 0.004 : 0 })
    audio.draw(P.down ? P.speed * 0.8 : 0)
  } else {
    stage.stamp({ x: P.px, y: P.py }, P, S.world || P.stale ? 0 : Math.min(0.75, sp * 40), { size: 0.055, fade: 0.95, sub: 0.004 })
    audio.draw(0)
  }
  P.px = P.x; P.py = P.y

  // picture
  const b = stage.back, o = stage.over
  b.uIce.value = G.ice; b.uMelt.value = G.melt; b.uSky.value = G.sky; b.uSkyRich.value = G.skyRich
  b.uCurtain.value = G.curtain; b.uDeep.value = G.deep; b.uWorld.value = G.worldBg
  o.uCloud.value = G.cloud; o.uOpen.value = G.open; o.uBlack.value = G.black
  o.uWhite.value = Math.max(G.white, S.flash); o.uGrain.value = G.grain; o.uVig.value = G.vig

  const inWorld = G.world > 0.5
  if (inWorld) {
    world.update(S.time, dt, G.open)
    for (const p of pins) {
      const s = world.screen(p.id, size.w, size.h)
      p.b.style.transform = `translate(${s.x.toFixed(1)}px, ${(s.y - 40).toFixed(1)}px) translateX(-50%)`
    }
    stage.render(S.time, world.scene, world.camera)
  } else {
    cam.x += ((P.x - 0.5) * 0.7 - cam.x) * 0.05; cam.y += ((P.y - 0.5) * 0.4 - cam.y) * 0.05
    actCam.position.set(cam.x, cam.y, G.camZ)
    actCam.lookAt(cam.x * 0.3, cam.y * 0.3, G.camZ - 10)
    const firstGate = !GATES[0].solved || S.t < 9.25
    core.group.visible = G.coreS > 0.002
    core.group.position.set(0, G.coreY, G.camZ - 8)
    core.group.scale.setScalar(Math.max(0.0001, G.coreS) * (actCam.aspect < 1 ? 0.85 : 1))
    core.u.uDark.value = G.coreDark
    core.u.uCrack.value = firstGate ? S.hold : 0
    core.u.uGlow.value = 0.35 + S.hold * 1.4
    core.update(S.time, dt, S.hold)
    shards.update(S.time, dt, G.explode, G.shards, G.camZ)
    depths.update(S.time, dt, G.depths, stage.renderer.getPixelRatio() * size.h / 900)
    stage.render(S.time, actScene, actCam)
  }
  requestAnimationFrame(frame)
}

// handles for scripted walkthroughs and tests
window.__zero = { S, G, GATES, enter, skip, solve, openPanel, closePanel }

if (matchMedia('(prefers-reduced-motion: reduce)').matches) { S.flash = 1; skip() }
requestAnimationFrame(frame)
