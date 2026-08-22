# Roadmap Truco, cobros y economía

Lista priorizada después de revisar el flujo propio y la experiencia pública de Truco Online.

## P0 - Dinero y seguridad

- [x] Unificar cargas, retiros y consumos en un saldo general por jugador.
- [x] Mostrar el saldo total en el header y el saldo disponible dentro del juego.
- [x] Comprar varios cartones de Bingo con límite según precio y saldo disponible.
- [x] Gestionar ajustes individuales o masivos desde la lista de usuarios.
- [ ] Definir si el bono inicial puede retirarse o sólo consumirse antes de activar dinero real.
- [ ] Integrar conciliación bancaria por webhook, API o archivo CSV del proveedor.
- [ ] Mantener el OCR como asistente de revisión, nunca como autorización automática.
- [ ] Agregar una restricción única normalizada para números de operación confirmados.
- [ ] Convertir la vinculación de depósito, compra y cartones en una operación SQL atómica.
- [ ] Exigir identidad verificada antes del primer retiro o de habilitar juegos competitivos.
- [ ] Validar que el titular de la cuenta de retiro coincida con el documento verificado.
- [ ] Definir límites configurables de retiro por monto, frecuencia y antigüedad de cuenta.

## P0 - Partidas online

- [ ] Reemplazar el polling de la mesa por Supabase Realtime o WebSocket.
- [ ] Implementar heartbeat de ambos jugadores y estado de presencia.
- [ ] Definir timeout por turno con aviso previo y resolución automática.
- [ ] Resolver desconexión, reconexión, abandono, victoria y reintegro con reglas explícitas.
- [ ] Crear una tarea programada para cerrar o reintegrar mesas abandonadas.
- [ ] Hacer obligatorio el registro del evento de partida antes de confirmar la acción.
- [ ] Incorporar métricas y alertas para liquidaciones fallidas.

## P1 - Jugabilidad

- [x] Configurar partidas a 15 o 30 puntos al crear la mesa.
- [x] Permitir mesas con Flor habilitada o deshabilitada.
- [x] Elegir marcador numérico o tanteador tradicional de palitos.
- [ ] Implementar Contra Flor y Contra Flor al Resto como reglas opcionales.
- [ ] Configurar si la Falta Envido se calcula al partido o a las buenas.
- [ ] Implementar matchmaking para "Partida rápida" por puntaje objetivo y pozo.
- [ ] Mostrar cantidad de jugadores conectados y tiempo estimado de espera.
- [ ] Permitir reconectar desde cualquier dispositivo con sesión autenticada.
- [ ] Agregar temporadas de ranking, historial por temporada y reglas de desempate.
- [ ] Revisar piso mínimo de ranking para evitar puntajes negativos sin límite.
- [ ] Agregar protección contra rivales repetidos, colusión y partidas anormalmente cortas.
- [ ] Aplicar rate limiting a creación de mesas, unión y acciones.
- [ ] Agregar Pica Pica únicamente cuando existan partidas por equipos 3 contra 3.

## P1 - Experiencia

- [x] Compactar el inicio de Truco y mostrar las mesas antes del primer scroll.
- [x] Separar mesas disponibles de partidas en curso.
- [x] Agregar acceso de partida rápida con alternativa contra el bot.
- [x] Ocultar el aviso de instalación PWA dentro del lobby y las partidas.
- [x] Evitar service workers y cachés PWA obsoletos durante desarrollo.
- [ ] Mostrar filtros de mesas por gratis, con pozo, 15 y 30 puntos.
- [ ] Añadir estados visuales de reconexión, rival ausente y tiempo restante.
- [ ] Verificar la mesa completa en móviles pequeños y orientación horizontal.

## P1 - OCR y depósitos

- [x] Preprocesar imágenes y ejecutar una segunda lectura para comprobantes difíciles.
- [x] Extraer monto, operación, fecha, destino, documento y titular.
- [x] Comparar los campos detectados contra depósito, cuenta y usuario.
- [x] Detectar operaciones repetidas y bloquear aprobaciones dudosas.
- [x] Vincular automáticamente por documento cuando existe una coincidencia única.
- [x] Exigir OCR válido o revisión manual antes de aprobar un comprobante.
- [ ] Incorporar una cola de revisión con filtros por diferencias y confianza.
- [ ] Guardar métricas de precisión por banco y formato de comprobante.
- [ ] Agregar muestras anonimizadas para ampliar las pruebas del parser.

## P2 - Operación y producto

- [ ] Crear un tablero diario de ingresos, egresos, ventas, premios y saldos reservados.
- [ ] Alertar por diferencias entre ledger, wallets, depósitos y retiros.
- [ ] Incorporar búsqueda global por usuario, DNI, operación, mesa o compra.
- [ ] Exportar movimientos y conciliación diaria a CSV.
- [ ] Documentar procedimientos de disputa, devolución y bloqueo de cuenta.
- [ ] Revisar aspectos legales y regulatorios antes de permitir apuestas con dinero real.
