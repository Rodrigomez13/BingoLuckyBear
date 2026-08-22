# Legacy Root Artifacts

Archivo creado durante la limpieza del repo del 2026-06-16.

Estos archivos estaban en la raiz del proyecto y no forman parte del flujo activo de build. Se conservaron aca para referencia historica en vez de borrarlos.

## Contenido

- `sql/`: migraciones SQL sueltas anteriores al esquema actual de `supabase/migrations/`.
- `docs/`: notas antiguas de analisis, roadmap y verificacion manual.
- `screenshots/`: capturas de referencia usadas durante iteraciones visuales.
- `scripts/`: scripts manuales historicos que no forman parte de `package.json`.

## Notas

Las migraciones activas deben vivir en `supabase/migrations/`. Los archivos SQL de esta carpeta no se ejecutan automaticamente.
