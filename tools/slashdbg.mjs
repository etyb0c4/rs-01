import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] })
const p = await b.newPage({ viewport: { width: 1280, height: 800 } })
p.on('pageerror', (e) => console.log('PAGEERROR:', e.message))
await p.goto('http://localhost:5199/')
await p.waitForTimeout(1500)
await p.evaluate(() => {
  const r = window.__rs; r.enter()
  window.__dbg = { pd: null, pu: 0 }
  addEventListener('pointerdown', (e) => { window.__dbg.pd = (e.target.id || e.target.tagName) + ' @' + e.clientX + ',' + e.clientY }, true)
  addEventListener('pointerup', () => window.__dbg.pu++, true)
})
await p.waitForTimeout(3000)
await p.evaluate(() => { const r = window.__rs; r.solve(r.GATES[0]); setTimeout(() => { r.S.target = 35 }, 2600) })
await p.waitForTimeout(5500)
console.log('pre:', await p.evaluate(() => ({ t: window.__rs.S.t.toFixed(2), topEl: document.elementFromPoint(900, 240)?.id || document.elementFromPoint(900, 240)?.tagName })))
await p.mouse.move(900, 240); await p.mouse.down()
for (const [x, y] of [[800, 330], [680, 430], [540, 540], [420, 620]]) { await p.mouse.move(x, y, { steps: 2 }); await p.waitForTimeout(25) }
await p.mouse.up()
await p.waitForTimeout(300)
console.log('dbg:', await p.evaluate(() => JSON.stringify({ ...window.__dbg, solved: window.__rs.GATES[1].solved })))
await b.close()
