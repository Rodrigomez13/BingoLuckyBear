import { NextResponse } from 'next/server'
import { getCustomerAvatar } from '@/lib/customer/avatars'

export const runtime = 'nodejs'

const motifPaths: Record<string, string> = {
  scepter: '<path d="M220 118l22-22 22 22-22 22-22-22Zm22 19v125" stroke="#3b2503" stroke-width="9" stroke-linecap="round"/><circle cx="242" cy="91" r="15" fill="#36a7ff" stroke="#3b2503" stroke-width="7"/>',
  cards: '<rect x="205" y="206" width="47" height="65" rx="8" fill="#fff1bd" stroke="#3b2503" stroke-width="6" transform="rotate(-12 205 206)"/><rect x="244" y="202" width="47" height="65" rx="8" fill="#fff1bd" stroke="#3b2503" stroke-width="6" transform="rotate(11 244 202)"/><text x="224" y="240" font-size="25" font-family="Arial" font-weight="900" fill="#8a1d12">1</text>',
  sword: '<path d="M246 82l13 104-13 58-13-58 13-104Z" fill="#dbeafe" stroke="#352103" stroke-width="7"/><path d="M217 190h58" stroke="#352103" stroke-width="9" stroke-linecap="round"/><path d="M246 195v66" stroke="#352103" stroke-width="10" stroke-linecap="round"/>',
  coin: '<circle cx="246" cy="164" r="31" fill="#ffd45a" stroke="#4a2a02" stroke-width="8"/><text x="246" y="174" text-anchor="middle" font-size="22" font-family="Arial" font-weight="900" fill="#5f3605">$</text>',
  bingo: '<circle cx="239" cy="150" r="40" fill="none" stroke="#4a2a02" stroke-width="7"/><path d="M201 150h76M239 111v78" stroke="#4a2a02" stroke-width="5"/><circle cx="229" cy="160" r="10" fill="#fff1bd" stroke="#4a2a02" stroke-width="4"/><circle cx="251" cy="141" r="10" fill="#fff1bd" stroke="#4a2a02" stroke-width="4"/>',
  club: '<path d="M231 101c-25 34-17 69 14 78 31-9 39-44 14-78l-14-21-14 21Z" fill="#6b3f12" stroke="#3b2503" stroke-width="7"/><path d="M245 180v70" stroke="#3b2503" stroke-width="9" stroke-linecap="round"/>',
  crown: '<path d="M205 133l23 28 18-42 20 42 23-28-8 64h-68l-8-64Z" fill="#ffd45a" stroke="#4a2a02" stroke-width="7"/><circle cx="246" cy="118" r="8" fill="#38bdf8"/>',
  board: '<rect x="203" y="203" width="86" height="60" rx="8" fill="#fff1bd" stroke="#4a2a02" stroke-width="7"/><path d="M203 223h86M203 243h86M224 203v60M246 203v60M268 203v60" stroke="#4a2a02" stroke-width="4"/>',
  'coin-stack': '<ellipse cx="238" cy="220" rx="43" ry="13" fill="#ffd45a" stroke="#4a2a02" stroke-width="6"/><path d="M195 190c0 7 19 13 43 13s43-6 43-13v30c0 7-19 13-43 13s-43-6-43-13v-30Z" fill="#e9a928" stroke="#4a2a02" stroke-width="6"/>',
  trophy: '<path d="M214 115h64v40c0 28-18 45-32 45s-32-17-32-45v-40Z" fill="#ffd45a" stroke="#4a2a02" stroke-width="7"/><path d="M214 129h-20c0 33 20 40 30 41M278 129h20c0 33-20 40-30 41M246 201v36M222 237h48" stroke="#4a2a02" stroke-width="7" stroke-linecap="round"/>',
  token: '<circle cx="246" cy="155" r="38" fill="#0d4f76" stroke="#ffd45a" stroke-width="8"/><text x="246" y="166" text-anchor="middle" font-size="24" font-family="Arial" font-weight="900" fill="#ffd45a">LBB</text>',
  dice: '<rect x="210" y="207" width="39" height="39" rx="8" fill="#fff1bd" stroke="#4a2a02" stroke-width="6"/><rect x="254" y="209" width="39" height="39" rx="8" fill="#fff1bd" stroke="#4a2a02" stroke-width="6"/><circle cx="222" cy="219" r="4" fill="#4a2a02"/><circle cx="237" cy="234" r="4" fill="#4a2a02"/><circle cx="267" cy="222" r="4" fill="#4a2a02"/><circle cx="281" cy="236" r="4" fill="#4a2a02"/>',
  chips: '<ellipse cx="238" cy="222" rx="50" ry="14" fill="#fef3c7" stroke="#4a2a02" stroke-width="6"/><circle cx="215" cy="219" r="12" fill="#ef4444"/><circle cx="245" cy="218" r="12" fill="#22c55e"/><circle cx="271" cy="220" r="12" fill="#3b82f6"/>',
  'club-card': '<rect x="206" y="151" width="62" height="86" rx="9" fill="#fff1bd" stroke="#4a2a02" stroke-width="7" transform="rotate(-8 206 151)"/><text x="231" y="193" text-anchor="middle" font-size="34" font-family="Arial" font-weight="900" fill="#244d16">♣</text>',
  'sword-card': '<rect x="206" y="151" width="62" height="86" rx="9" fill="#fff1bd" stroke="#4a2a02" stroke-width="7" transform="rotate(-8 206 151)"/><text x="232" y="194" text-anchor="middle" font-size="34" font-family="Arial" font-weight="900" fill="#1f3f7a">♠</text>',
  'trophy-card': '<rect x="202" y="151" width="62" height="86" rx="9" fill="#fff1bd" stroke="#4a2a02" stroke-width="7" transform="rotate(-8 202 151)"/><text x="226" y="194" text-anchor="middle" font-size="31" font-family="Arial" font-weight="900" fill="#92400e">🏆</text>',
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params
  const avatar = getCustomerAvatar(key)
  const [from, to] = avatar.colors
  const motif = motifPaths[avatar.motif] ?? motifPaths.token
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320" role="img" aria-label="${avatar.label}">
  <defs>
    <radialGradient id="bg" cx="48%" cy="34%" r="70%">
      <stop offset="0%" stop-color="${to}"/>
      <stop offset="100%" stop-color="${from}"/>
    </radialGradient>
    <linearGradient id="gold" x1="0" x2="1" y1="0" y2="1">
      <stop stop-color="#fff2a8"/>
      <stop offset=".45" stop-color="${avatar.accent}"/>
      <stop offset="1" stop-color="#9a5c08"/>
    </linearGradient>
  </defs>
  <rect width="320" height="320" fill="#020403"/>
  <circle cx="160" cy="160" r="144" fill="url(#bg)"/>
  <circle cx="160" cy="160" r="144" fill="none" stroke="#2b1502" stroke-width="15"/>
  <circle cx="160" cy="160" r="135" fill="none" stroke="url(#gold)" stroke-width="7"/>
  <path d="M70 84c45-36 139-35 180 6" fill="none" stroke="rgba(255,255,255,.09)" stroke-width="20" stroke-linecap="round"/>
  <circle cx="104" cy="116" r="35" fill="#c97719" stroke="#3b2503" stroke-width="9"/>
  <circle cx="216" cy="116" r="35" fill="#c97719" stroke="#3b2503" stroke-width="9"/>
  <circle cx="160" cy="164" r="82" fill="#f2a722" stroke="#3b2503" stroke-width="9"/>
  <circle cx="129" cy="153" r="12" fill="#211303"/>
  <circle cx="191" cy="153" r="12" fill="#211303"/>
  <circle cx="124" cy="148" r="4" fill="#fff"/>
  <circle cx="186" cy="148" r="4" fill="#fff"/>
  <ellipse cx="160" cy="179" rx="23" ry="18" fill="#fff3c2"/>
  <ellipse cx="160" cy="171" rx="17" ry="11" fill="#211303"/>
  <path d="M144 191c12 13 23 13 35 0" fill="none" stroke="#5a2605" stroke-width="7" stroke-linecap="round"/>
  <path d="M99 238c22-37 100-37 122 0v44H99v-44Z" fill="#061421" stroke="#3b2503" stroke-width="8"/>
  <path d="M138 236l22 33 22-33" fill="#f7f0df" stroke="#3b2503" stroke-width="5"/>
  <path d="M139 252h42" stroke="${avatar.accent}" stroke-width="8" stroke-linecap="round"/>
  <g opacity=".96">${motif}</g>
</svg>`

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
