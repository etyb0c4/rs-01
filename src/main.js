import '@fontsource-variable/archivo/wdth.css'
import '@fontsource-variable/archivo/wdth-italic.css'
import '@fontsource-variable/geist-mono'
import './style.css'
import gsap from 'gsap'
import { createStage } from './gl/stage.js'
import { createScene } from './gl/scene.js'
import { createAudio } from './audio.js'
import { IDENTITY, LINKS, RECORD, PROJECTS, PARTS, PORTS, STACK, NOTES, FLAGS } from './data.js'

const $ = (s, r = document) => r.querySelector(s)
const BASE = import.meta.env.BASE_URL
const asset = (p) => (/^(https?:)?\/\//.test(p) ? p : BASE + p.replace(/^\//, ''))
const ext = (url) => (url && !url.startsWith('mailto:') ? ' target="_blank" rel="noopener"' : '')
const when = (d) => {
  const [y, m] = String(d).split('-')
  return m ? `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${y}` : y
}
const chips = (list) => list.map((s) => `<span>${s}</span>`).join('')

/* ───────── the page, laid out from data.js ───────── */
const best = RECORD[0]
$('#hero-k').innerHTML = `<b>${IDENTITY.unit}</b> ${IDENTITY.base}`
$('#hero-name').innerHTML = IDENTITY.name.split(' ').map((w) => `<span>${w}</span>`).join(' ')
$('#hero-aka').innerHTML = `also known as ${IDENTITY.aliases.map((a) => `<b>${a}</b>`).join(' <i>or</i> ')}`
$('#hero-line').textContent = `${IDENTITY.role}. ${IDENTITY.line}`
$('#hero-chips').innerHTML =
  (best ? `<a class="chip hot" href="#record">${best.result} · ${best.event}</a>` : '') + `<span class="chip">${IDENTITY.status}</span>`

$('#ports').innerHTML = PORTS.map((p) => `<li><b>${p.title}</b><span>${p.note}</span></li>`).join('')
$('#parts').innerHTML = PARTS.map((p) => `<li><b>${p.key}</b><div><strong>${p.title}</strong><span>${p.tools.join(' · ')}</span></div></li>`).join('')

$('#record-list').innerHTML = RECORD.map((r) => {
  const body = `
    <span class="rank">${r.rank}</span>
    <div class="what">
      <strong>${r.event}</strong>
      <span>${[r.result, r.scope].filter(Boolean).join(' · ')}</span>
      <div class="tagsline">${chips(r.tags || [])}</div>
    </div>
    <dl>
      <div><dt>type</dt><dd>${r.kind}</dd></div>
      <div><dt>date</dt><dd>${when(r.date)}</dd></div>
      ${r.as ? `<div><dt>as</dt><dd>${r.as}</dd></div>` : ''}
    </dl>`
  return `<li>${r.url ? `<a class="row" href="${r.url}"${ext(r.url)}>${body}</a>` : `<div class="row">${body}</div>`}</li>`
}).join('')

$('#work-list').innerHTML = PROJECTS.map((p, i) => `
  <article class="card">
    <div class="shot"><img src="${asset(p.img)}" alt="${p.name}" loading="lazy" /><span class="side ${p.side}">${p.side}</span></div>
    <p class="meta"><b>${String(i + 1).padStart(2, '0')}</b>${p.role}<i>${p.year}</i></p>
    <h3>${p.url ? `<a href="${p.url}"${ext(p.url)}>${p.name} ↗</a>` : p.name}</h3>
    <p class="blurb">${p.blurb}</p>
    <p class="metric">${p.metric}</p>
    <div class="tagsline">${chips(p.stack)}</div>
  </article>`).join('')

$('#arsenal-list').innerHTML = PARTS.map((p) => `<div class="kit"><p><b>${p.key}</b>${p.title}</p><div class="tagsline">${chips(p.tools)}</div></div>`).join('') +
  `<div class="kit all"><p><b>+</b>Languages &amp; stack</p><div class="tagsline">${chips(STACK)}</div></div>`

if (NOTES.length) {
  $('#notes').hidden = false
  $('#contact-n').textContent = '08'
  $('#notes-list').innerHTML = NOTES.map((n) => `
    <li><a class="row" href="${n.url || '#'}"${ext(n.url)}>
      <span class="cat">${n.category}</span>
      <div class="what"><strong>${n.title}</strong><span>${n.summary || ''}</span><div class="tagsline">${chips(n.tags || [])}</div></div>
      <dl><div><dt>date</dt><dd>${when(n.date)}</dd></div></dl>
    </a></li>`).join('')
}

const initials = IDENTITY.name.split(' ').map((w) => w[0]).join('')
$('#id-card').innerHTML = `
  <div class="avatar"><img src="${asset(IDENTITY.avatar)}" alt="${IDENTITY.name}" /><span>${initials}</span></div>
  <div class="who">
    <h2>${IDENTITY.name}</h2>
    <p class="aka">${IDENTITY.aliases.map((a) => `<b>${a}</b>`).join(' <i>/</i> ')}</p>
    <dl class="facts">
      <div><dt>role</dt><dd>${IDENTITY.role}</dd></div>
      <div><dt>based in</dt><dd>${IDENTITY.base}</dd></div>
      <div><dt>school</dt><dd>${IDENTITY.school}</dd></div>
      <div><dt>status</dt><dd>${IDENTITY.status}</dd></div>
    </dl>
    <div class="links">${LINKS.map((l) => `<a href="${l.url}"${ext(l.url)}><i>${l.label}</i>${l.text}<b>↗</b></a>`).join('')}</div>
  </div>`
const av = $('.avatar img')
av.addEventListener('error', () => av.parentElement.classList.add('none'))
$('#foot').innerHTML = `<span>${IDENTITY.unit} · © ${new Date().getFullYear()} ${IDENTITY.name}</span><span>no trackers, no templates</span>`

const sections = [...document.querySelectorAll('.sec')].filter((s) => !s.hidden)
$('#nav').innerHTML = sections.filter((s) => s.dataset.nav).map((s) => `<a href="#${s.id}">${s.dataset.nav}</a>`).join('')
const navLinks = [...document.querySelectorAll('#nav a')]
$('#rail').insertAdjacentHTML('beforeend', sections.filter((s) => s.dataset.nav).map((s, i) =>
  `<b style="--at:${(+s.dataset.t / 9).toFixed(3)}">${String(i + 1).padStart(2, '0')}</b>`).join(''))

const tagEls = {}
const addTag = (id, html, cls, i = 0) => {
  const d = document.createElement('div'); d.className = 'tag ' + cls; d.innerHTML = html; d.style.setProperty('--i', i)
  $('#tags').append(d); tagEls[id] = { el: d, group: cls }
}
PORTS.forEach((p, i) => addTag(p.id, `<b>${p.title}</b><span>${p.note}</span>`, 'ports', i))
PARTS.forEach((p) => addTag(p.id, `<b>${p.key}</b><span>${p.title}</span>`, 'parts'))
addTag('flag', `<b>flag</b><span>${FLAGS.box}</span>`, 'flag')

console.log(`%c${IDENTITY.unit}%c you opened the box the right way. ${FLAGS.console}`, 'background:#ff4f1a;color:#0c0c0d;padding:2px 6px;font-weight:700', 'color:inherit')

/* ───────── the picture ───────── */
const G = { az: 0.62, el: 0.3, dist: 9.2, shift: 1.55, rise: 0, turn: 0, explode: 0, glass: 0, detail: 1, dark: 0, seam: 0, lens: 1, ports: 0, parts: 0, flag: 0, spin: 0, dim: 0, fade: 1, drop: 2.6, shake: 0, rage: 0, burst: 0 }
const FX = { seam: 0, shake: 0 }
const S = { t: 0, target: 0, time: 0, narrow: false, slow: 0, alive: true }
const still = matchMedia('(prefers-reduced-motion: reduce)').matches
const coarse = matchMedia('(hover: none)').matches

let tl
function build(narrow) {
  tl?.kill()
  // side: how far the box sits to the right of the text; on a narrow screen it stays centred, above or behind the text
  const side = narrow ? 0 : 1, far = narrow ? 1.5 : 1
  Object.assign(G, { az: 0.62, el: 0.3, dist: 9.2 * far, shift: 1.55 * side, rise: narrow ? 1.5 : 0, explode: 0, glass: 0, detail: 1, dark: 0, seam: 0, lens: 1, ports: 0, parts: 0, flag: 0, spin: 0, dim: 0, rage: 0, burst: 0 })
  tl = gsap.timeline({ paused: true, defaults: { ease: 'sine.inOut' } })
  const T = (vars, from, to, ease) => tl.to(G, { ...vars, duration: to - from, ...(ease ? { ease } : {}) }, from)

  // 01 way in: come round to the front, down to the ports
  T({ az: 0.2, el: 0.1, dist: 6.4 * far, shift: 1.2 * side, rise: narrow ? 1.25 : 0.42 }, 0.1, 1)
  T({ ports: 1 }, 0.72, 0.98)
  T({ ports: 0 }, 1.5, 1.75)
  T({ lens: 0 }, 1.6, 1.85)
  // 02 rupture: hard cut close on the seam, the world goes red, the shell lets go
  tl.set(G, { az: 0.06, el: 0.13 }, 1.96)
  T({ dist: 4.7 * far, shift: 0.85 * side, rise: narrow ? 1.15 : 0.42 }, 1.96, 2.24, 'power2.out')
  T({ rage: 1, seam: 1 }, 1.98, 2.42)
  T({ burst: 1 }, 2.1, 2.98, 'none')
  T({ dist: 7.0 * far, el: 0.21, rise: narrow ? 1.3 : 0.25 }, 2.26, 2.95, 'power2.out')
  // out of the red, into the clean autopsy
  T({ rage: 0, seam: 0 }, 2.86, 3.34)
  T({ az: 0.78, el: 0.42, dist: 12.6 * far, shift: 2.3 * side, rise: narrow ? 2.2 : 0.2 }, 2.8, 4.0)
  // 03 teardown
  T({ explode: 1 }, 3.05, 4.05, 'none')
  T({ parts: 1, flag: 1 }, 3.85, 4.05)
  T({ parts: 0, flag: 0 }, 4.37, 4.51)
  // 04 rebuild: lights out, and the same box goes back together in glass
  T({ dark: 1 }, 4.41, 4.81)
  T({ detail: 0 }, 4.41, 4.53)
  T({ glass: 1 }, 4.49, 4.77)
  T({ explode: 0 }, 4.61, 5.03)
  T({ az: 0.7, el: 0.24, dist: 10.6 * far, shift: 2.5 * side, rise: 0, spin: 1, dim: narrow ? 0.78 : 0 }, 4.53, 5.03)
  // the rest of the page: the glass box keeps turning beside the content
  T({ el: 0.36, dist: 11.4 * far }, 6.2, 7.2)
  T({ el: 0.16, dist: 9.8 * far }, 7.4, 8.4)
  T({ el: 0.3, dist: 10.4 * far, explode: 0.16 }, 8.5, 9)
  tl.to({}, { duration: 0.01 }, 9)
  for (const st of document.querySelectorAll('.story .st')) {
    const a = +st.dataset.in, b = +st.dataset.out, d = b - a
    const blocks = st.querySelectorAll('.b')
    tl.set(st, { autoAlpha: 1 }, a)
    blocks.forEach((blk, i) => {
      const at = a + i * d * 0.22
      tl.fromTo(blk, { autoAlpha: 0, y: 26, filter: 'blur(12px)' },
        { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: d * 0.34, ease: 'power3.out' }, at)
      tl.fromTo(blk.querySelectorAll('.x, .s'), { yPercent: 36, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: d * 0.3, ease: 'power3.out', stagger: d * 0.07 }, at)
    })
    tl.to(blocks, { autoAlpha: 0, y: -20, filter: 'blur(9px)', duration: d * 0.26, ease: 'power2.in', stagger: d * 0.04 }, b - d * 0.28)
    tl.set(st, { autoAlpha: 0 }, b)
  }
}

const stage = createStage($('#gl'))
const audio = createAudio()
let world

const snd = $('#snd')
const sndLabel = () => { snd.textContent = 'snd · ' + (audio.on ? 'on' : 'off'); snd.classList.toggle('off', !audio.on) }
sndLabel()
snd.addEventListener('click', () => { audio.start(); audio.toggle(); sndLabel() })
for (const ev of ['pointerdown', 'keydown', 'wheel', 'touchstart']) addEventListener(ev, () => audio.start(), { once: true, passive: true })

const ACTS = { top: 'paper', recon: 'paper', rupture: 'tear', teardown: 'tear', record: 'night', work: 'night', arsenal: 'night', notes: 'night', contact: 'end' }

/* scroll position → timeline time: each section's top is pinned to its data-t */
let marks = []
function measure() {
  marks = sections.map((s) => ({ y: s.offsetTop, t: +s.dataset.t, id: s.id, name: s.dataset.nav }))
  const end = Math.max(1, document.documentElement.scrollHeight - innerHeight)
  marks.push({ y: Math.max(end, marks.at(-1).y + 1), t: marks.at(-1).t, id: null })
}
function timeAt(y) {
  for (let i = 1; i < marks.length; i++) {
    const a = marks[i - 1], b = marks[i]
    if (y <= b.y) return a.t + ((b.t - a.t) * Math.max(0, y - a.y)) / Math.max(1, b.y - a.y)
  }
  return marks.at(-1).t
}

let current = ''
function chapter() {
  const y = scrollY + innerHeight * 0.45
  let cur = marks[0]
  for (const m of marks) if (m.id && m.y <= y) cur = m
  if (cur.id === current) return
  current = cur.id
  scramble($('#chapter'), cur.name || 'sealed unit')
  audio.setAct(ACTS[cur.id] || 'paper')
  navLinks.forEach((a) => a.classList.toggle('on', a.hash === '#' + cur.id))
}

function resize() {
  const w = innerWidth, h = innerHeight, narrow = w < 900 || w / h < 1
  stage.resize(w, h)
  world?.resize(w, h)
  if (narrow !== S.narrow || !tl) { S.narrow = narrow; build(narrow) }
  measure()
  S.target = timeAt(scrollY)
}

const GLYPHS = '#@%&$01<>/\\*+=?'
let scrambling = null
function scramble(el, to) {
  clearInterval(scrambling)
  let n = 0
  scrambling = setInterval(() => {
    n++
    el.textContent = [...to].map((c, i) => (c === ' ' || i < n ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join('')
    if (n >= to.length) clearInterval(scrambling)
  }, 26)
}

/* the seal: hold to break it — or it gives on its own once you force the box open */
const sealBtn = $('#seal-btn')
let sealed = true, holdP = 0, holding = false
function breakSeal(quiet) {
  if (!sealed) return
  sealed = false
  holding = false
  document.body.classList.add('broken')
  if (!quiet) {
    audio.hit('crack')
    gsap.to(FX, { seam: 0.95, duration: 0.09, ease: 'power2.in', onComplete: () => gsap.to(FX, { seam: 0, duration: 1.6, ease: 'power2.out' }) })
    gsap.fromTo(FX, { shake: 1 }, { shake: 0, duration: 1.1, ease: 'power2.out' })
    scramble($('#chapter'), 'seal broken')
  }
}
sealBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); audio.start(); holding = true; sealBtn.setPointerCapture(e.pointerId) })
addEventListener('pointerup', () => { holding = false })
addEventListener('pointercancel', () => { holding = false })
sealBtn.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { audio.start(); holding = true } })
sealBtn.addEventListener('keyup', () => { holding = false })

/* headings flinch when their section arrives */
const io = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('inview', e.isIntersecting)), { threshold: 0.12 })
sections.forEach((sec) => io.observe(sec))

let pointer = null
if (!coarse) {
  addEventListener('pointermove', (e) => { pointer = pointer || {}; pointer.x = e.clientX; pointer.y = e.clientY }, { passive: true })
  document.documentElement.addEventListener('pointerleave', () => { pointer = null })
}
addEventListener('scroll', () => { S.target = timeAt(scrollY); chapter() }, { passive: true })
addEventListener('resize', resize)
document.addEventListener('visibilitychange', () => { S.alive = !document.hidden; if (S.alive) { last = performance.now(); requestAnimationFrame(frame) } })

const P = { x: 0, y: 0 }, CUR = { x: innerWidth / 2, y: innerHeight / 2 }
const cur = $('#cur'), rail = $('#rail')
if (!coarse) {
  document.documentElement.classList.add('fine')
  addEventListener('pointerover', (e) => cur.classList.toggle('act', !!e.target.closest('a, button')), { passive: true })
}
let last = performance.now(), night = false, wasOpen = false, wasRage = false
function frame(now) {
  if (!S.alive) return
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  S.time += dt
  S.t += (S.target - S.t) * (still ? 1 : 1 - Math.exp(-dt * 7))
  tl.time(S.t)
  if (!still) G.turn += dt * 0.11 * G.spin
  G.turn *= 1 - (1 - G.spin) * (1 - Math.exp(-dt * 4))

  if (holding && sealed) {
    holdP = Math.min(1, holdP + dt / 1.15)
    audio.hold(holdP)
    G.shake = holdP * 0.55
    if (holdP >= 1) { audio.hold(0); G.shake = 0; breakSeal() }
  } else if (holdP > 0) { holdP = Math.max(0, holdP - dt * 2.2); audio.hold(holdP); G.shake = sealed ? holdP * 0.55 : 0 }
  sealBtn.style.setProperty('--p', (holdP * 100).toFixed(1))
  if (sealed && S.t > 1.7) breakSeal(true)

  const eff = FX.seam > 0.002 || FX.shake > 0.002 ? { ...G, seam: Math.min(1, G.seam + FX.seam), shake: G.shake + FX.shake } : G
  const view = world.update(eff, S.time, dt, coarse ? null : pointer || { x: -9999, y: -9999 })
  stage.render(S.time, world.scene, world.camera)

  if (!coarse) {
    if (pointer) {
      CUR.x += (pointer.x - CUR.x) * (1 - Math.exp(-dt * 24))
      CUR.y += (pointer.y - CUR.y) * (1 - Math.exp(-dt * 24))
      cur.style.transform = `translate3d(${CUR.x.toFixed(1)}px, ${CUR.y.toFixed(1)}px, 0)`
      cur.style.opacity = '1'
    } else cur.style.opacity = '0'
  }

  for (const id in tagEls) {
    const { el, group } = tagEls[id], k = G[group]
    if (k < 0.01) { if (el.style.opacity !== '0') el.style.opacity = '0'; continue }
    world.locate(id, P)
    el.style.opacity = k.toFixed(3)
    el.style.transform = `translate3d(${P.x.toFixed(1)}px, ${P.y.toFixed(1)}px, 0)`
  }
  rail.style.setProperty('--t', (S.t / 9).toFixed(4))
  if (G.dark > 0.5 !== night) { night = G.dark > 0.5; document.body.classList.toggle('night', night); $('meta[name=theme-color]').content = night ? '#0c0c0d' : '#ecebe7'; if (night) audio.hit('reveal') }
  if (G.explode > 0.42 !== wasOpen) { wasOpen = G.explode > 0.42; audio.hit(wasOpen ? 'open' : 'close') }
  if (G.rage > 0.4 !== wasRage) {
    wasRage = G.rage > 0.4
    if (wasRage) { audio.hit('shatter'); gsap.fromTo(FX, { shake: 1.3 }, { shake: 0, duration: 1.3, ease: 'power2.out' }) }
  }
  document.body.classList.toggle('xray', view.lens > 0.4)

  // drop the resolution when frames keep running long
  if (dt > 0.034) { if (++S.slow > 40 && stage.lower()) { S.slow = 0; stage.resize(innerWidth, innerHeight) } } else S.slow = Math.max(0, S.slow - 1)
  requestAnimationFrame(frame)
}

async function start() {
  const bootN = $('#boot-n'), t0 = performance.now()
  const count = setInterval(() => { bootN.textContent = String(Math.min(99, Math.round((performance.now() - t0) / 11))).padStart(3, '0') }, 40)
  // the print on the box is painted with the mono face, so it has to be there first
  await Promise.race([
    Promise.all([document.fonts.load('600 60px "Geist Mono Variable"'), document.fonts.load('800 60px "Archivo Variable"')]),
    new Promise((r) => setTimeout(r, 2500)),
  ])
  clearInterval(count)
  bootN.textContent = '100'
  world = createScene(stage)
  resize()
  S.t = S.target
  chapter()
  document.body.classList.add('ready')
  gsap.to(G, { fade: 0, duration: 1.4, ease: 'power2.out', delay: 0.1 })
  if (still) G.drop = 0
  else gsap.to(G, { drop: 0, duration: 1.25, ease: 'bounce.out', delay: 0.45, onComplete: () => {
    audio.hit('thud')
    gsap.fromTo(FX, { shake: 0.9 }, { shake: 0, duration: 0.7, ease: 'power2.out' })
  } })
  new ResizeObserver(() => { measure(); S.target = timeAt(scrollY) }).observe($('main'))
  requestAnimationFrame((t) => { last = t; frame(t) })
  if (import.meta.env.DEV) window.__rs = { G, S, world, stage }
}
start()
