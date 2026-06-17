# Rediseño Lobby Operativo LBB

Esta rama explora una visual nueva para Lucky Bingo Bear: menos página informativa y más centro de juego. La prioridad pasa a ser que el usuario vea rápido su saldo, mesas activas, sorteos, recompensas y acciones disponibles.

## Dirección Visual

- Layout principal con navegación lateral en desktop y barra compacta en mobile.
- Header persistente con saludo, avatar, nivel, saldo disponible y accesos rápidos.
- Tarjetas de juego con estados claros: disponible, en juego, completa, pendiente de rival.
- Jerarquía visual basada en acción: jugar, apostar, comprar cartones, invitar, ver mesa.
- Menos bloques hero extensos y más módulos útiles desde el primer viewport.
- Estética verde oscuro, dorado, rojo real y violeta premium para diferenciar tipos de mesa.

## Foco De Información

- Inicio: resumen del jugador, saldo, mesas activas, acceso rápido a Bingo y Truco.
- Truco: lista de mesas con rival, puntos, pozo, estado y apuesta externa si la ventana está abierta.
- Bingo: sorteos activos, precio, premio, cartones disponibles y compra directa.
- Mi cuenta: datos en modo lectura, edición mediante modal.
- Finanzas del usuario: saldo, depósitos, retiros y movimientos recientes en una vista simple.

## Componentes Base

- `GameShell`: estructura con sidebar, topbar y contenido.
- `BalancePill`: saldo disponible y carga/retiro.
- `GameRoomCard`: carta visual para mesas destacadas.
- `GameTableList`: tabla compacta para muchas mesas.
- `PlayerStatus`: avatar, nivel, progreso y acceso a perfil.
- `ActionPanel`: panel lateral para apuesta, compra o detalle de mesa.

## Reglas De Contenido

- Todo texto público se dirige al usuario final.
- Evitar mensajes internos como admin, revisión manual o detalles técnicos.
- Mostrar siempre una acción siguiente cuando sea posible.
- Si no hay contenido real, usar estados vivos: próximos sorteos, mesas destacadas no comprables o recomendaciones.

## Implementación Por Etapas

1. Crear `GameShell` y aplicarlo al home.
2. Rediseñar el home como lobby general.
3. Rediseñar `/truco` como lobby de mesas con apuestas externas.
4. Rediseñar `/participar` como lobby de bingo.
5. Rediseñar `/mi-cuenta` con datos de solo lectura y modales de edición.
6. Ajustar mobile: navegación inferior o drawer, tarjetas apiladas y acciones fijas.
