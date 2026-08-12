import type { ReactNode } from 'react'

/** Presentation-only skin for the Truco UI. It does not contain game logic. */
export function LuckyBearVisualSkin({ children }: { children: ReactNode }) {
  return (
    <div className="lbb-truco-skin">
      <div className="lbb-truco-ambient" aria-hidden="true" />
      <div className="relative z-10">{children}</div>
      <style jsx global>{`
        .lbb-truco-skin { position: relative; isolation: isolate; min-height: 100%; }
        .lbb-truco-ambient {
          position: fixed; inset: 0; z-index: -1; pointer-events: none;
          background:
            radial-gradient(42rem 28rem at 78% 12%, rgba(20,199,103,.16), transparent 68%),
            radial-gradient(34rem 24rem at 14% 82%, rgba(221,175,55,.12), transparent 70%),
            linear-gradient(135deg, rgba(4,63,30,.18), transparent 45%, rgba(122,75,18,.08));
        }
        .lbb-truco-skin [class*="bg-card"] {
          background: linear-gradient(145deg, rgba(16,18,15,.94), rgba(7,25,16,.90)) !important;
          border-color: rgba(221,175,55,.18) !important;
          box-shadow: 0 18px 50px rgba(0,0,0,.22);
        }
        .lbb-truco-skin [class*="border-border"] { border-color: rgba(221,175,55,.18) !important; }
        .lbb-truco-skin button { transition: transform .18s ease, box-shadow .18s ease, filter .18s ease, background .18s ease; }
        .lbb-truco-skin button:not(:disabled):hover { filter: brightness(1.08); box-shadow: 0 8px 24px rgba(4,247,124,.14); }
        .lbb-truco-skin button:not(:disabled):active { transform: translateY(1px) scale(.985); }
        .lbb-truco-skin [class*="rounded-3xl"] { box-shadow: 0 28px 90px rgba(0,0,0,.38), inset 0 0 80px rgba(20,199,103,.04); }
        .lbb-truco-skin [class*="animate-card-drop"] { filter: drop-shadow(0 14px 18px rgba(0,0,0,.4)); }
        .lbb-truco-skin [class*="animate-canto"] {
          border: 1px solid rgba(255,217,26,.5); box-shadow: 0 8px 28px rgba(221,175,55,.18);
          text-transform: uppercase; letter-spacing: .04em;
        }
        @media (max-width: 640px) { .lbb-truco-skin [class*="rounded-3xl"] { border-radius: 1.15rem; } }
      `}</style>
    </div>
  )
}
