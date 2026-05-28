# Stitch Prompt For Lucky Bingo Bear

Use this prompt in Google Stitch when generating or editing screens for this project.

```text
Redesign the Lucky Bingo Bear homepage as a premium, mobile-first Spanish digital bingo experience.

Keep the brand visible in the first viewport with the Lucky Bingo Bear name, bear logo, active prize, and two clear actions: "Participar" and "Ver sorteo".

Use the design system in DESIGN.md:
- Dark premium background with amber primary, emerald trust accents, sky live accents, and small red prize accents.
- Fredoka-style rounded display headings and Inter-style readable body text.
- Compact cards with 8px radius, no nested cards, no decorative abstract blobs.
- Use real bingo visuals: bingo balls, digital card grid, prize hierarchy, live draw status.

Create responsive React/Tailwind UI for:
1. Fixed header with logo, prize status, and navigation.
2. Hero with active prize, trust pills, CTA buttons, and bingo machine/card visual.
3. Prize explanation section with three prize cards.
4. Four-step participation section.
5. Trust section with live draw, published winners, and admin control signals.
6. Optional sponsor slots.

The result should feel festive but trustworthy, optimized for people arriving from WhatsApp on mobile.
```

## Implementation Notes

- Import generated React code into the existing Next.js app instead of replacing routes wholesale.
- Keep existing business logic for active raffles and prize amounts from `app/page.tsx` and `lib/bingo.ts`.
- Reuse existing UI primitives from `components/ui` and icons from `lucide-react`.
- After exporting from Stitch, compare generated tokens against `DESIGN.md` before merging.

