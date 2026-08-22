# Branch Cleanup 2026-06-16

Base revisada: `origin/main` en `2dc0fcc` (`ocr new status`).

## Decision

No se mergearon ramas completas. Las ramas no integradas eran snapshots antiguos o parciales que, al compararse contra `main`, quitaban funcionalidades actuales de admin, economia, OCR, Truco y Supabase.

## Ramas ya mergeadas o superadas

Estas ramas estaban mergeadas en `origin/main` o no aportaban cambios nuevos utiles:

- `origin/ocr-payment-verification` -> `7ba095e`
- `origin/tmp-noop` -> `e3ac149`
- `origin/tmp-noop-3` -> `e3ac149`
- `origin/tmp-noop-4` -> `e3ac149`
- `origin/tmp-noop-5` -> `e3ac149`
- `origin/tmp-noop-7` -> `e3ac149`
- `origin/tmp-noop-8` -> `e3ac149`
- `origin/v0/lucecitagomez04-2615-ba77e555` -> `ebaa310`
- `origin/v0/barrientoslautaro76-2628-2a4aab9a` -> `9ea0a4a`
- `origin/v0/analuzp985-3889-a4a3342a` -> `ffff5f3`
- `origin/v0/jarvisbet63-1454-dd749ec2` -> `62948df`
- `origin/v0/gfmultimarcasok-3279-c9484276` -> `0c9fbcf`
- `origin/v0/rodrigonicolasgomez70-2677-f8cdee1f` -> `2fa00ce`
- `origin/avatar-and-admin-panel-redesign` -> `1821638`
- `origin/mejoras-seguridad-ux-login` -> `4357d13`
- `origin/integracion-cuenta-legal-main` -> `30a600a`

## Ramas no mergeadas revisadas

- `origin/admin-panel-improvements` -> `7e91ebe`: admin viejo; `main` ya contiene admin financiero, usuarios, OCR y retiros mas completos.
- `origin/bingoluckybear-web-redesign` -> `d1a29c1`: snapshot visual viejo; eliminaba muchas rutas actuales.
- `origin/card-game-design` -> `3f10a75`: cambios viejos de cartas; `main` ya tiene assets individuales y spritesheet actuales.
- `origin/game-project-improvements` -> `2c171ba`: merge historico de mejoras visuales; `main` ya contiene el estado actual.
- `origin/v0/rodrigonicolasgomez087-1471-f9f0c448` -> `2c171ba`: duplicado de `game-project-improvements`.
- `origin/v0/serverusinaads-6027-fe56ed2c` -> `6a8f4a3`: init antiguo.
- `origin/website-redesign-and-admin-panel` -> `5de6308`: redisenio antiguo; `main` ya avanzo bastante por encima.

## Proyectos Vercel duplicados detectados en checks

Proyecto activo recomendado:

- `bingo-lucky-bear-sl1b`

Proyectos duplicados a desconectar desde Vercel si ya no se usan:

- `bingo-lucky-bear-202606`
- `bingoluckybearjarvis`
- `bingoluckybearanaluz`
- `bingoluckybearbarrientos`
- `bingo-lucky-bear`
- `bingoluckybearlucecita`
- `bingoluckybear`
