# Lucky Bingo Bear Design System

## Product

Lucky Bingo Bear is a Spanish-language digital bingo experience for mobile-first participants. The interface should feel festive, trustworthy, and operationally clear: people need to understand the active prize, buy a digital carton, keep their LBB code, and follow the live draw without confusion.

## Audience

- Participants who arrive from social links or WhatsApp and need a quick, confident path to buy.
- Admin users who manage raffles, payments, participants, cards, live draws, and winners.
- Sponsors or prize partners who may need visible promotional slots.

## Visual Direction

- Mood: premium raffle night, clear digital product, not casino clutter.
- Shape language: compact rounded rectangles, 8px radius for cards and controls.
- Layout density: mobile-first, scannable, with clear hierarchy for prize, action, and proof.
- Avoid: oversized marketing filler, decorative blobs, vague AI-looking gradients, text-heavy instruction blocks.

## Color Tokens

- Background: `#08090d`, `#15111a`, `#0d1720`.
- Surface: `#09090b`, `#18181b`, `rgba(255,255,255,0.06)`.
- Primary: amber `#fbbf24`.
- Primary dark text: zinc `#09090b`.
- Accent success: emerald `#34d399`.
- Accent live: sky `#38bdf8`.
- Accent alert/prize: red `#ef4444`.
- Text primary: `#ffffff`.
- Text secondary: zinc `#d4d4d8`.
- Text muted: zinc `#a1a1aa`.
- Borders: `rgba(255,255,255,0.1)` and `rgba(251,191,36,0.3)`.

## Typography

- Display: Fredoka, black weight, used for brand, prize amounts, and short section headings.
- Body: Inter, regular to bold, used for instructions, labels, forms, and admin content.
- Letter spacing: keep normal. Use uppercase only for short labels.
- Hero headline: brand-first, concise, no generic value prop as H1.

## Core Components

### Header

- Fixed top bar with translucent dark background.
- Brand logo plus "Bingo digital en vivo" descriptor on desktop.
- Primary nav: Participar, En Vivo, Ganadores, Admin.
- Active prize can appear as a compact status pill on larger screens.

### Hero

- First viewport must show Lucky Bingo Bear, primary prize, CTA to participate, CTA to live draw, and a bingo/carton visual.
- Use actual brand logo and bingo-machine/card visuals rather than abstract artwork.
- Prize block should be high contrast and readable on mobile.

### Prize Cards

- Prize 1 gets the strongest treatment.
- Prize 2 and Prize 3 are smaller but still visible.
- Use labels like "Primer premio", "Premio 2", "Premio 3".

### Process Steps

- Four clear steps: choose raffle, send payment, receive card, follow live draw.
- Icons should be from lucide-react.
- Cards should be compact and consistent, not nested inside larger cards.

### Trust Section

- Emphasize visible draw, published results, and admin controls.
- Use emerald as the confidence accent.
- Include direct actions for live draw and winners.

### Sponsor Slots

- Designed as optional repeated cards for sponsors, bonus prizes, or partner promotions.
- Must not distract from the active raffle CTA.

## Interaction Principles

- Main user action is always "Participar" or "Solicitar mi carton".
- Secondary user action is "Ver sorteo".
- Use icons inside buttons when available.
- Keep button text short enough for mobile.
- Avoid explaining UI features inside the page; the interface should make the flow obvious.

## Stitch Goals

- Preserve the Next.js + Tailwind + shadcn/ui structure.
- Generate refinements as React components using existing components where possible.
- Keep visuals responsive at 360px, 768px, and desktop widths.
- Maintain Spanish copy and ASCII-only source text unless a file already uses accented text.
- Prefer real project assets in `/public`: `logo-contexto.svg`, `logo-solo.svg`, and `lucky-bingo-bear-logo.svg`.

