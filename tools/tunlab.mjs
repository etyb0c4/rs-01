import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const p = await b.newPage({ viewport: { width: 1280, height: 800 } })
p.on('pageerror', (e) => console.log('PAGEERROR:', e.message))
await p.goto('http://localhost:5199/')
await p.waitForTimeout(1500)
await p.evaluate(() => { const r = window.__rs; r.G.dive = 1; r.DV.v = 1.4 })
for (const [n, w] of [['tun1', 1200], ['tun2', 2500], ['tun3', 2500]]) {
  await p.waitForTimeout(w)
  await p.screenshot({ path: `/tmp/claude-1000/-home-etyb0c4-perso-portfolio/c5771ad4-c78e-4b18-8257-ffb631cb2a1c/scratchpad/s-lab/${n}.png` })
}
await b.close()
