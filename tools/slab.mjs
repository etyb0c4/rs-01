import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const p = await b.newPage({ viewport: { width: 1280, height: 760 } })
await p.goto('file:///tmp/claude-1000/-home-etyb0c4-perso-portfolio/c5771ad4-c78e-4b18-8257-ffb631cb2a1c/scratchpad/s-lab/index.html')
await p.waitForTimeout(400)
await p.screenshot({ path: '/tmp/claude-1000/-home-etyb0c4-perso-portfolio/c5771ad4-c78e-4b18-8257-ffb631cb2a1c/scratchpad/s-lab/candidates.png' })
await b.close()
