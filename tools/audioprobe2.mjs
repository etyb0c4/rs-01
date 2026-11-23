import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] })
const p = await b.newPage({ viewport: { width: 1280, height: 800 } })
p.on('pageerror', (e) => console.log('PAGEERROR:', e.message))
await p.addInitScript(() => {
  const AC = window.AudioContext
  window.__taps = []
  window.AudioContext = class extends AC {
    constructor(...a) {
      super(...a)
      const an = this.createAnalyser(); an.fftSize = 2048; an.connect(this.destination)
      this.__an = an; window.__taps.push({ ctx: this, an })
      if (!window.__connPatched) {
        window.__connPatched = true
        const orig = AudioNode.prototype.connect
        AudioNode.prototype.connect = function (t, ...r) {
          if (t instanceof AudioDestinationNode && this.context.__an && this !== this.context.__an) return orig.call(this, this.context.__an, ...r)
          return orig.call(this, t, ...r)
        }
      }
    }
  }
})
await p.goto('http://localhost:5199/')
await p.waitForTimeout(1800)
await p.click('#skip')   // ONLY action: the previously silent path
await p.waitForTimeout(3500)
console.log(JSON.stringify(await p.evaluate(() => {
  const t = window.__taps[0]; if (!t) return 'no ctx created'
  const d = new Float32Array(t.an.fftSize); t.an.getFloatTimeDomainData(d)
  let peak = 0; for (const v of d) peak = Math.max(peak, Math.abs(v))
  return { state: t.ctx.state, peak }
})))
await b.close()
