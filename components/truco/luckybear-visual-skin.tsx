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
          --lbb-green: #0d5b35;
          --lbb-green-deep: #061f14;
          --lbb-cream: #f6efd9;
          color-scheme: dark;
        }

        .lbb-truco-ambient {
          position: fixed;
          inset: 0;
          z-index: -3;
          pointer-events: none;
          background:
            radial-gradient(55rem 34rem at 50% 42%, rgba(18, 105, 57, .23), transparent 72%),
            radial-gradient(34rem 26rem at 12% 8%, rgba(223, 178, 63, .11), transparent 72%),
            radial-gradient(30rem 22rem at 90% 88%, rgba(18, 122, 70, .12), transparent 72%),
            linear-gradient(145deg, #03130c 0%, #061d12 42%, #020b07 100%);
        }

        .lbb-truco-vignette {
          position: fixed;
          inset: 0;
          z-index: -2;
          pointer-events: none;
          box-shadow: inset 0 0 12rem rgba(0, 0, 0, .72);
        }

        /* Main lobby/table surfaces */
        .lbb-truco-skin [class*="bg-card"] {
          background: linear-gradient(145deg, rgba(12, 22, 16, .96), rgba(4, 17, 11, .94)) !important;
          border-color: rgba(223, 178, 63, .2) !important;
          box-shadow: 0 18px 55px rgba(0, 0, 0, .3), inset 0 1px 0 rgba(255,255,255,.025);
        }

        .lbb-truco-skin [class*="border-border"] {
          border-color: rgba(223, 178, 63, .18) !important;
        }

        .lbb-truco-skin [class*="rounded-3xl"] {
          border-color: rgba(223, 178, 63, .24) !important;
          box-shadow: 0 30px 100px rgba(0, 0, 0, .48), inset 0 0 90px rgba(20, 160, 86, .045);
        }

        /* Table: preserve the existing game DOM but give it the felt/card-room look. */
        .lbb-truco-skin [class*="radial-gradient"] {
          background:
            radial-gradient(ellipse at center, #155b36 0%, #0c3b24 47%, #061f14 100%) !important;
          border: 1px solid rgba(223, 178, 63, .3) !important;
        }

        /* Cards get the same physical depth/interaction language as luckybear-arg. */
        .lbb-truco-skin [data-sound="truco.play-card"] {
          filter: drop-shadow(0 12px 12px rgba(0,0,0,.42));
          transition: transform .18s ease, filter .18s ease;
        }

        .lbb-truco-skin [data-sound="truco.play-card"]:not(:disabled):hover {
          transform: translateY(-10px) scale(1.025);
          filter: drop-shadow(0 20px 20px rgba(0,0,0,.52));
        }

        .lbb-truco-skin [class*="animate-card-drop"] {
          filter: drop-shadow(0 14px 18px rgba(0,0,0,.48));
          animation: lbb-card-drop .38s cubic-bezier(.2,.8,.2,1);
        }

        @keyframes lbb-card-drop {
          from { opacity: 0; transform: translateY(-18px) scale(.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Canto/announcement badge */
        .lbb-truco-skin [class*="animate-canto"] {
          border: 1px solid rgba(255, 217, 90, .58) !important;
          background: linear-gradient(135deg, rgba(12, 91, 53, .98), rgba(6, 43, 27, .98)) !important;
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

        /* Action buttons: premium green/gold controls without changing callbacks. */
        .lbb-truco-skin button {
          border-radius: .72rem;
          transition: transform .16s ease, box-shadow .16s ease, filter .16s ease, background .16s ease;
        }

        .lbb-truco-skin button:not(:disabled):hover {
          filter: brightness(1.08);
          box-shadow: 0 8px 26px rgba(0,0,0,.28), 0 0 18px rgba(30, 196, 105, .11);
        }

        .lbb-truco-skin button:not(:disabled):active {
          transform: translateY(1px) scale(.985);
        }

        .lbb-truco-skin button[data-sound="truco.truco"],
        .lbb-truco-skin button[data-sound="truco.retruco"],
        .lbb-truco-skin button[data-sound="truco.vale-cuatro"] {
          background: linear-gradient(135deg, #f2c94c, #c99523) !important;
          color: #251a05 !important;
          border-color: rgba(255, 224, 126, .7) !important;
          box-shadow: 0 6px 20px rgba(194, 143, 31, .18);
        }

        /* Score/player cards */
        .lbb-truco-skin [class*="score"] {
          text-shadow: 0 1px 2px rgba(0,0,0,.45);
        }

        /* Images already present in BingoLuckyBear are treated as part of the skin. */
        .lbb-truco-skin img {
          image-rendering: auto;
        }

        /* Prevent the game table from becoming unusably wide on small screens. */
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
        }
      `}</style>
    </div>
  )
}
