export const LINKS = {
  mail: 'ryansama.tech@gmail.com',
  github: 'https://github.com/etyb0c4',
  linkedin: 'https://linkedin.com/in/rayan-sama',
}

export const PROJECTS = [
  {
    id: 'b2r-kit', index: '01', sw: '', rest: 'b2r-kit', name: 'b2r-kit', role: 'Boot2root accelerator', year: '2026',
    blurb: 'A CLI that kills the two time-sinks when an LLM agent solves a machine: round-trip recon and verbose tool output eating context. One command scans, enumerates every service in parallel, and writes a state file the agent reads.',
    stack: ['Bash', 'nmap', 'ffuf', 'netexec', 'impacket'], metric: '1 command → full recon', img: '/proj/b2r-kit.jpg',
  },
  {
    id: 'chess3d', index: '02', sw: '', rest: 'chess3d', name: 'chess3d', role: 'Three.js chess engine', year: '2025',
    blurb: 'A full 3D chess game in the browser: legal-move validation with castling, promotion and en passant, a minimax + alpha-beta AI, and a cinematic render pipeline with bloom, afterimage trails and an orbit camera.',
    stack: ['Three.js', 'EffectComposer', 'minimax', 'WebGL'], metric: 'minimax depth 3 · bloom', img: '/proj/chess3d.jpg',
  },
  {
    id: 'jarvis-hud', index: '03', sw: 'J', rest: 'arvis HUD', name: 'Jarvis HUD', role: 'Reactive interface', year: '2026',
    blurb: 'A voice-assistant HUD built on React-Three-Fiber and drei: a reactive core that breathes with audio input, wrapped in framer-motion transitions. An experiment in making an interface feel alive.',
    stack: ['React', 'R3F', 'drei', 'framer-motion'], metric: 'audio-reactive core', img: '/proj/jarvis-hud.jpg',
  },
  {
    id: 'ctf', index: '04', sw: 'C', rest: 'TF field notes', name: 'CTF field notes', role: 'HackTheBox · Root-Me', year: 'ongoing',
    blurb: 'Machines rooted and flags captured across HackTheBox and Root-Me: web exploitation, binary pwn, reverse engineering, forensics. Every solve becomes a reusable playbook in the arsenal.',
    stack: ['pwntools', 'Ghidra', 'Burp', 'sqlmap'], metric: 'every solve → a playbook', img: '/proj/ctf.jpg',
  },
]

export const SHARD_LABELS = [
  { sw: 'W', a: 'eb', b: 'exploitation', c: 'Burp Suite · sqlmap · ZAP' },
  { sw: 'B', a: 'inary', b: 'pwn', c: 'pwntools · GDB · Metasploit' },
  { sw: 'R', a: 'everse', b: 'engineering', c: 'Ghidra · jadx' },
  { sw: 'F', a: 'orensics', b: '', c: 'Volatility · binwalk · Wireshark' },
]

export const STACK = ['C', 'Python', 'JavaScript', 'Rust', 'React', 'Three.js', 'Vite', 'Docker', 'Linux', 'Git']
