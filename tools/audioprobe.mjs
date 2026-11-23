import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] })
const p = await b.newPage({ viewport: { width: 1280, height: 800 } })
p.on('pageerror', (e) => console.log('PAGEERROR:', e.message))
await p.addInitScript(() => {
  // route anything that connects to destination through an analyser so we can measure output
  const AC = window.AudioContext
  window.__taps = []
  window.AudioContext = class extends AC {
    constructor(...a) {
      super(...a)
      const an = this.createAnalyser(); an.fftSize = 2048
      an.connect(this.destination)
      const dest = this.destination
      const origConnect = AudioNode.prototype.connect
      // per-context shim: redirect connects aimed at this ctx's destination
      this.__an = an
      window.__taps.push({ ctx: this, an })
      if (!window.__connPatched) {
        window.__connPatched = true
        AudioNode.prototype.connect = function (target, ...rest) {
          if (target instanceof AudioDestinationNode && this.context.__an && this !== this.context.__an)
            return origConnect.call(this, this.context.__an, ...rest)
          return origConnect.call(this, target, ...rest)
        }
      }
    }
  }
})
await p.goto('http://localhost:5199/')
await p.waitForTimeout(1800)
const cx = 640, cy = 400
await p.mouse.move(cx + 60, cy - 120); await p.mouse.down()
for (const [dx,dy] of [[50,-110],[0,-130],[-55,-100],[-50,-40],[10,-10],[50,30],[55,80],[0,120],[-55,100]]) { await p.mouse.move(cx + dx, cy + dy, { steps: 6 }); await p.waitForTimeout(40) }
await p.mouse.up()
await p.waitForTimeout(3000)
const amp = await p.evaluate(() => {
  const t = window.__taps[0]; if (!t) return 'no ctx'
  const d = new Float32Array(t.an.fftSize); t.an.getFloatTimeDomainData(d)
  let peak = 0; for (const v of d) peak = Math.max(peak, Math.abs(v))
  return { state: t.ctx.state, peak }
})
console.log('amplitude after trace:', JSON.stringify(amp))
// scroll a bit (acts advance, pad should keep playing)
for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, 400); await p.waitForTimeout(250) }
await p.waitForTimeout(2000)
console.log('amplitude after scroll:', JSON.stringify(await p.evaluate(() => {
  const t = window.__taps[0]
  const d = new Float32Array(t.an.fftSize); t.an.getFloatTimeDomainData(d)
  let peak = 0; for (const v of d) peak = Math.max(peak, Math.abs(v))
  return { state: t.ctx.state, peak }
})))
await b.close()
