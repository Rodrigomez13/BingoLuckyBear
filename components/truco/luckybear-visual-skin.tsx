import type { ReactNode } from 'react'

/**
 * Presentation-only skin for the Truco UI.
 *
 * The game engine, wallet, auth, online rooms and server authority remain
 * completely owned by BingoLuckyBear. This component only changes the visual
 * layer so the table feels like the luckybear-arg experience.
 */
export function LuckyBearVisualSkin({ children }: { children: ReactNode }) {
  return (
    <div className="lbb-truco-skin min-h-screen">
      <div className="lbb-truco-ambient" aria-hidden="true" />
      <div className="lbb-truco-vignette" aria-hidden="true" />
      <div className="relative z-10">{children}</div>
      <style jsx global>{`
        .lbb-truco-skin {
          --lbb-gold: #dfb23f;
          --lbb-gold-bright: #ffd95a;
          --lbb-gold-soft: rgba(223,178,63,.22);
          --lbb-green: #0d5b35;
          --lbb-green-deep: #061f14;
          --lbb-cream: #f6efd9;
          color-scheme: dark;
          min-height: 100dvh;
        }

        .lbb-truco-ambient {
          position: fixed;
          inset: 0;
          z-index: -3;
          pointer-events: none;
          background:
            radial-gradient(55rem 34rem at 50% 42%, rgba(18,105,57,.25), transparent 72%),
            radial-gradient(34rem 26rem at 12% 8%, rgba(223,178,63,.11), transparent 72%),
            radial-gradient(30rem 22rem at 90% 88%, rgba(18,122,70,.12), transparent 72%),
            linear-gradient(145deg, #03130c 0%, #061d12 42%, #020b07 100%);
        }

        .lbb-truco-vignette {
          position: fixed;
          inset: 0;
          z-index: -2;
          pointer-events: none;
          box-shadow: inset 0 0 12rem rgba(0,0,0,.72);
        }

        .lbb-truco-skin [class*="bg-card"] {
          background: linear-gradient(145deg, rgba(12,22,16,.96), rgba(4,17,11,.94)) !important;
          border-color: rgba(223,178,63,.2) !important;
          box-shadow: 0 18px 55px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.025);
        }

        .lbb-truco-skin [class*="border-border"] {
          border-color: rgba(223,178,63,.18) !important;
        }

        .lbb-truco-skin [class*="rounded-3xl"] {
          border-color: rgba(223,178,63,.24) !important;
          box-shadow: 0 30px 100px rgba(0,0,0,.48), inset 0 0 90px rgba(20,160,86,.045);
        }

        /* Felt surface: the existing table DOM stays untouched functionally. */
        .lbb-truco-skin [class*="radial-gradient"] {
          background:
            radial-gradient(ellipse at center, #17653c 0%, #0d4529 47%, #061f14 100%) !important;
          border: 1px solid rgba(223,178,63,.3) !important;
          box-shadow: inset 0 0 80px rgba(0,0,0,.28), 0 22px 65px rgba(0,0,0,.45) !important;
        }

        /* A subtle inner rail makes the central surface read as a physical table. */
        .lbb-truco-skin [class*="radial-gradient"]::after {
          content: "";
          position: absolute;
          inset: 7px;
          pointer-events: none;
          border: 1px solid rgba(255,217,90,.12);
          border-radius: inherit;
          box-shadow: inset 0 0 45px rgba(0,0,0,.22);
        }

        /* Cards: same physical depth and lift language as luckybear-arg. */
        .lbb-truco-skin [data-sound="truco.play-card"] {
          filter: drop-shadow(0 12px 12px rgba(0,0,0,.42));
          transition: transform .18s ease, filter .18s ease;
        }

        .lbb-truco-skin [data-sound="truco.play-card"]:not(:disabled):hover {
          transform: translateY(-10px) scale(1.025);
          filter: drop-shadow(0 20px 20px rgba(0,0,0,.52));
        }

        .lbb-truco-skin [data-sound="truco.play-card"]:focus-visible {
          outline: 2px solid var(--lbb-gold-bright);
          outline-offset: 4px;
        }

        .lbb-truco-skin [class*="animate-card-drop"] {
          filter: drop-shadow(0 14px 18px rgba(0,0,0,.48));
          animation: lbb-card-drop .38s cubic-bezier(.2,.8,.2,1);
        }

        .lbb-truco-player-hand {
          position: relative;
          padding: .25rem .5rem .55rem;
        }

        .lbb-truco-hand-cards {
          perspective: 900px;
        }

        .lbb-truco-hand-card {
          transform-origin: 50% 100%;
        }

        .lbb-truco-hand-card-1 { transform: rotate(-3deg) translateY(3px); }
        .lbb-truco-hand-card-2 { transform: translateY(-1px); }
        .lbb-truco-hand-card-3 { transform: rotate(3deg) translateY(3px); }

        .lbb-truco-hand-card:hover {
          z-index: 20;
        }

        @keyframes lbb-card-drop {
          from { opacity: 0; transform: translateY(-18px) scale(.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Played cards become a small theatre inside the felt. */
        .lbb-truco-played-area {
          min-height: 9rem;
          padding: .4rem .5rem;
          border-radius: 1.1rem;
          background: radial-gradient(ellipse at center, rgba(255,255,255,.035), transparent 68%);
        }

        .lbb-truco-played-row {
          filter: drop-shadow(0 7px 12px rgba(0,0,0,.25));
        }

        .lbb-truco-played-card {
          transition: transform .18s ease, filter .18s ease;
        }

        .lbb-truco-played-card:hover {
          transform: translateY(-3px) scale(1.02);
        }

        .lbb-truco-card-slot {
          box-shadow: inset 0 0 18px rgba(0,0,0,.16);
        }

        .lbb-truco-trick-divider {
          opacity: .8;
        }

        /* Canto/announcement badge */
        .lbb-truco-skin [class*="animate-canto"] {
          border: 1px solid rgba(255,217,90,.58) !important;
          background: linear-gradient(135deg, rgba(12,91,53,.98), rgba(6,43,27,.98)) !important;
          color: var(--lbb-cream) !important;
          box-shadow: 0 10px 34px rgba(0,0,0,.35), 0 0 26px rgba(223,178,63,.14);
          text-transform: uppercase;
          letter-spacing: .055em;
          animation: lbb-canto .25s ease-out;
        }

        @keyframes lbb-canto {
          from { opacity: 0; transform: scale(.88); }
          to { opacity: 1; transform: scale(1); }
        }

        /* Action controls: premium casino-card-room treatment without changing callbacks. */
        .lbb-truco-action-panel {
          border-color: rgba(223,178,63,.26) !important;
          background: linear-gradient(145deg, rgba(7,28,18,.96), rgba(3,14,9,.97)) !important;
          box-shadow: 0 18px 45px rgba(0,0,0,.38), inset 0 1px 0 rgba(255,255,255,.035) !important;
        }

        .lbb-truco-action-panel button {
          min-height: 2.5rem;
          border-radius: .72rem;
        }

        .lbb-truco-primary-action,
        .lbb-truco-response-panel button[data-sound="truco.quiero"],
        .lbb-truco-response-panel button[data-sound="truco.retruco"],
        .lbb-truco-response-panel button[data-sound="truco.vale-cuatro"] {
          background: linear-gradient(135deg, #f2c94c, #c99523) !important;
          color: #251a05 !important;
          border: 1px solid rgba(255,224,126,.72) !important;
          box-shadow: 0 7px 22px rgba(194,143,31,.2), inset 0 1px 0 rgba(255,255,255,.28);
          font-weight: 900;
        }

        .lbb-truco-secondary-action {
          border-color: rgba(89,205,140,.34) !important;
          background: rgba(10,69,42,.38) !important;
          color: #d9f6e5 !important;
        }

        .lbb-truco-secondary-action:not(:disabled):hover {
          background: rgba(20,105,62,.62) !important;
          border-color: rgba(255,217,90,.35) !important;
        }

        .lbb-truco-fold-action {
          background: rgba(80,18,25,.22) !important;
          box-shadow: inset 0 0 0 1px rgba(255,100,115,.06);
        }

        .lbb-truco-response-panel {
          animation: lbb-response-in .22s ease-out;
        }

        @keyframes lbb-response-in {
          from { opacity: 0; transform: translateY(7px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Scoreboard */
        .lbb-truco-scoreboard {
          border-color: rgba(223,178,63,.28) !important;
          background: linear-gradient(145deg, rgba(6,27,17,.96), rgba(2,13,8,.96)) !important;
          box-shadow: 0 16px 42px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.035) !important;
        }

        .lbb-truco-score-column {
          border-color: rgba(255,255,255,.09) !important;
          background: linear-gradient(145deg, rgba(255,255,255,.045), rgba(0,0,0,.22)) !important;
        }

        .lbb-truco-score-progress {
          box-shadow: 0 0 12px rgba(223,178,63,.08);
        }

        .lbb-truco-score-target {
          border: 1px solid rgba(255,217,90,.12);
        }

        .lbb-truco-skin button {
          border-radius: .72rem;
          transition: transform .16s ease, box-shadow .16s ease, filter .16s ease, background .16s ease;
        }

        .lbb-truco-skin button:not(:disabled):hover {
          filter: brightness(1.08);
          box-shadow: 0 8px 26px rgba(0,0,0,.28), 0 0 18px rgba(30,196,105,.11);
        }

        .lbb-truco-skin button:not(:disabled):active {
          transform: translateY(1px) scale(.985);
        }

        .lbb-truco-skin button:focus-visible {
          outline: 2px solid rgba(255,217,90,.9);
          outline-offset: 3px;
        }

        .lbb-truco-skin img {
          image-rendering: auto;
        }

        @media (max-width: 1023px) {
          .lbb-truco-skin [class*="lg:grid-cols-"] {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }

        @media (max-width: 640px) {
          .lbb-truco-skin [class*="rounded-3xl"] {
            border-radius: 1.15rem;
          }

          .lbb-truco-skin [class*="p-6"] {
            padding: .8rem !important;
          }

          .lbb-truco-player-hand {
            padding-inline: .2rem;
          }

          .lbb-truco-hand-cards {
            gap: .25rem;
          }

          .lbb-truco-hand-card-1 { transform: rotate(-2deg) translateY(2px); }
          .lbb-truco-hand-card-3 { transform: rotate(2deg) translateY(2px); }

          .lbb-truco-played-area {
            min-height: 7.5rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .lbb-truco-skin *,
          .lbb-truco-skin *::before,
          .lbb-truco-skin *::after {
            animation-duration: .001ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: .001ms !important;
          }
        }
      `}</style>
    </div>
  )
}
