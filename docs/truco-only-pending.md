actua# Rama `feature/truco-only`

La ruta raíz abre Truco y las rutas públicas anteriores de juegos y casino redirigen a la experiencia de Truco. Los módulos anteriores no se eliminan para no afectar la rama principal.

## Integración reutilizada

- La sesión conserva la autenticación SSR existente.
- `/api/customer/wallet` sigue siendo la única fuente de saldo, movimientos e historial.
- Crear o unirse a una mesa usa los RPC existentes de Truco. La entrada registra `truco_entry_fee` y la liquidación de servidor registra `truco_prize`.
- Depósitos y retiros reutilizan `FundsPanel` y `/api/customer/funds`; no se creó dinero, tablas ni medios de pago paralelos.

## Alcance actual

La prueba funcional es Truco 1v1: crear mesa, entrar con créditos, jugar y liquidar en la wallet existente. Las rutas disponibles son `/truco`, `/truco/lobby`, `/truco/mesa/[roomCode]`, `/truco/partida/[roomCode]` y `/truco/perfil`.

## Pendiente 2v2

El modelo vigente tiene dos asientos y una liquidación 1v1. Antes de habilitar 2v2 se requiere una migración que modele equipos, cuatro asientos, reconexión, abandono y liquidación atómica para cuatro participantes. Se mantiene anunciado como próxima modalidad, sin habilitar una mesa no resoluble.
