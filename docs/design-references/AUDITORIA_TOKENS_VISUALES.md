# Auditoria de tokens visuales LBB

Fecha: 2026-06-26  
Rama: `refactor/lbb-responsive-design-system`

## Colores existentes detectados

- Tokens LBB ya centralizados en `app/globals.css`: `#080A08`, `#10120F`, `#171A14`, `#DDAF37`, `#FFD91A`, `#7A4B12`, `#3A2408`, `#14A83B`, `#063F1E`, `#0B2E1A`, `#1AC767`, `#F8E7B0`, `#C7A96B`, `#FFF4D2`, `#6A00FF`, `#2A0B3D`, `#E3345A`, `#8E1F2F`.
- Colores legacy o utilitarios frecuentes: `amber-*`, `emerald-*`, `zinc-*`, `slate-*`, `rose-*`, `sky-*`, `lime-*`, `violet-*`.
- CSS del slot Golden Bear usa paleta propia en `new_games/styles.css` y `public/games/golden-bear/styles.css`: maderas oscuras, dorados, mint y rojos con hex dispersos.
- Admin y flujos operativos usan muchos `bg-zinc-*`, `text-zinc-*`, `bg-amber-*`, `bg-emerald-*`, `bg-rose-*`.
- Avatares SVG generados en `app/api/avatar/[key]/route.ts` tienen paletas embebidas especificas para ilustraciones.

## Duplicados o similares

- Dorados: `#DDAF37`, `#FFD91A`, `#fbbf24`, `#f59e0b`, `#ffd45d`, `#ffe089`, `amber-200/300`.
- Verdes: `#14A83B`, `#1AC767`, `#04f77c`, `#30e17b`, `emerald-300/400/500/600`, `#45f2a7`.
- Fondos negros: `#080A08`, `#050805`, `#020704`, `#090503`, `zinc-950`, `rgb(11, 11, 16)`.
- Rojos: `#E3345A`, `#8E1F2F`, `red-500`, `rose-500/600`, `#ff4f6f`.

## Conviene conservar

- La paleta propuesta ya instalada en `:root` como base LBB.
- `zinc-*` y `slate-*` solo como neutros internos de UI/admin mientras se normaliza por etapas.
- Paleta del slot Golden Bear temporalmente, porque tiene arte western/cabinet propio y conviene migrarla con pruebas visuales.
- Colores de avatares generados, porque forman parte de ilustraciones y no de la UI global.

## Conviene reemplazar luego

- Hex directos de fondos globales: `#050805`, `#020704`, `#090503`.
- Dorados directos repetidos en componentes por variables `--lbb-gold`, `--lbb-gold-bright`, `--lbb-gold-dark`.
- Verdes directos tipo `#04f77c`, `#30e17b`, `#45f2a7` por `--lbb-green-glow` o `--lbb-green`.
- Rojos `red-*`/`rose-*` de estados financieros por `--lbb-danger` y `--lbb-danger-dark`, cuidando contraste.

## Faltantes

- Tokens semanticos de superficie: `--lbb-surface-glass`, `--lbb-border-gold`, `--lbb-border-soft`.
- Tokens de estados economicos: `--lbb-balance-positive`, `--lbb-balance-negative`, `--lbb-balance-pending`.
- Tokens especificos de juego: `--lbb-slot-wood`, `--lbb-slot-wood-dark`, `--lbb-slot-reel-bg`.
- Tokens de foco/hover para botones premium y botones secundarios.

## Propuesta final

- Mantener `:root` como fuente de verdad CSS.
- Exponer en Tailwind mediante clases con variables CSS, no con nuevos hex por componente.
- Crear capas semanticas:
  - Base: fondo, panel, texto, borde.
  - Marca: dorado, verde, violeta bingo.
  - Estado: exito, alerta, peligro, pendiente.
  - Juego: slot, truco, bingo, arcade.

## Archivos a normalizar por etapas

- `app/globals.css`
- `components/site-header.tsx`
- `components/home/lobby-operativo-home.tsx`
- `components/auth/login-modal.tsx`
- `app/auth/login/page.tsx`
- `app/juegos/page.tsx`
- `components/games/game-shell.tsx`
- `new_games/styles.css`
- `public/games/golden-bear/styles.css`
- `components/admin/*`
- `app/admin/**/*`

## Riesgos de reemplazo masivo

- El admin puede perder contraste si se reemplazan `zinc/slate` sin revisar tablas densas.
- El slot puede perder profundidad visual si se aplana su paleta de maderas y luces.
- Reemplazar rojos/verdes financieros sin pruebas puede confundir estados de saldo, retiro o deposito.
- Cambios globales de `--primary` impactan botones, inputs, focus rings y componentes Radix.
