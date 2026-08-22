# 🎯 ANÁLISIS DETALLADO: ESTRUCTURA VISUAL DEL PROYECTO BINOLUCKYBEAR

**Fecha de análisis:** 2 de junio de 2026  
**Ruta del proyecto:** `c:\Users\rodri\OneDrive\Documentos\BINGO PAGE\BingoLuckyBear`

---

## 📋 ÍNDICE

1. [Componentes Principales](#componentes-principales)
2. [Configuración de Estilos y Temas](#configuración-de-estilos-y-temas)
3. [Responsive Design & Breakpoints](#responsive-design--breakpoints)
4. [Lógica de Sorteos](#lógica-de-sorteos)
5. [UX/UI Issues Identificados](#uxui-issues-identificados)
6. [Recomendaciones](#recomendaciones)

---

## 📦 COMPONENTES PRINCIPALES

### 1. **Estructura de Carpetas de Componentes**

```
components/
├── home/                    # Componentes de landing page
│   ├── hero-section.tsx
│   ├── hero-banner-sequence.tsx
│   ├── bingo-machine-visual.tsx
│   ├── brand-marquee.tsx
│   ├── sponsor-showcase.tsx
│   ├── how-it-works.tsx
│   ├── trust-section.tsx
│   └── footer.tsx
├── participate/            # Componentes de participación
│   ├── participation-form.tsx
│   ├── bingo-card-display.tsx
│   ├── payment-instructions.tsx
│   ├── purchase-confirmation.tsx
│   └── no-active-raffle.tsx
├── live/                   # Componentes de sorteo en vivo
│   ├── live-draw-card.tsx
│   └── live-wall.tsx
├── admin/                  # Panel administrativo
│   ├── admin-dashboard.tsx
│   ├── draw-controls.tsx
│   └── raffle-participants.tsx
└── ui/                     # Componentes UI reutilizables
```

### 2. **Componentes Home (Landing Page)**

#### `hero-section.tsx` | [Ver archivo](components/home/hero-section.tsx)

**Responsabilidades:**
- Héroe principal con titular dinámico
- Botones de CTA (Participar/Ver Sorteo)
- Bolas flotantes animadas de bingo
- Pilares de confianza

**Responsive:**
- **Desktop (lg):** Grid 2 columnas, imagen 36rem x 36rem
- **Tablet (sm):** Grid 1 columna, imagen 31rem x 31rem  
- **Mobile:** Imagen 22rem x 22rem, textos centrados

```tsx
// Líneas 52-60: Tamaños de fuente adaptables
h2 className="text-5xl font-bold leading-[0.94] sm:text-6xl lg:text-7xl xl:text-8xl"
// Líneas 65-68: Copy adaptable
p className="text-base leading-7 text-slate-300 lg:mx-0 sm:text-lg"
```

**Problemas identificados:**
- ⚠️ El titular a `xl` puede ser muy grande en pantallas UHD (hasta 96px)
- ⚠️ Bolas flotantes se ocultan en md pero quizá sea intencional

---

#### `hero-banner-sequence.tsx` | [Ver archivo](components/home/hero-banner-sequence.tsx)

**Características:**
- Banner de 52 altura fija (h-52)
- Logo animado con `animate-banner-logo`
- Promesa de ganancia: "$350000"
- Tamaño de cartón: "$3000"

**Responsive:**
```tsx
// Líneas 27-31: Logo escalable
className="animate-banner-logo h-16 w-16 object-contain 
           drop-shadow-2xl sm:h-32 sm:w-32 md:h-40 md:w-40"

// Línea 36: Texto principal escalable
p className="text-2xl font-bold leading-none sm:text-4xl md:text-5xl"

// Línea 38: Subtexto
p className="text-xs font-medium text-slate-100/85 sm:text-lg"
```

**Problemas identificados:**
- ✅ Padding horizontal fijo: `px-20 sm:px-44 md:px-56` (puede ser demasiado en mobile)
- ⚠️ Salto de tamaño: xs (text-2xl) → sm (text-4xl) es muy abrupto

---

#### `sponsor-showcase.tsx` | [Ver archivo](components/home/sponsor-showcase.tsx)

**Layout:**
- Grid responsive: 1 col mobile, 2 cols desktop
- Tarjeta premium con gradiente radial
- Showcase de 4 beneficios

**Responsive:**
```tsx
// Línea 62: Grid principal
className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)]"

// Línea 65: Anidado en beneficios
className="grid h-full min-[520px]:grid-cols-[140px_minmax(0,1fr)] 
           sm:grid-cols-[160px_minmax(0,1fr)]"
```

**Problema:** Breakpoint custom `min-[520px]` no es estándar en Tailwind (requiere configuración).

---

### 3. **Componentes de Participación**

#### `participation-form.tsx` | [Ver archivo](components/participate/participation-form.tsx)

**Campos del formulario:**
- full_name, dni, address, phone, email
- payment_method, payment_reference
- payout_account_kind, payout_account, payout_holder_name
- quantity, file upload (receipt)

**Validaciones de receipt:**
```tsx
// Líneas 18-22
const MAX_RECEIPT_SIZE = 8 * 1024 * 1024      // 8MB
const MIN_RECEIPT_SIZE = 10 * 1024             // 10KB
const MIN_RECEIPT_DIMENSION = 480              // 480x480px mínimo
```

**Problemas de UX:**
- ⚠️ DNI y Address son requeridos pero en Argentina hay muchas variaciones
- ⚠️ Validation de receipt muy estricta (480px puede ser pequeño para fotos)
- ⚠️ Sin feedback visual durante upload/validation

---

#### `bingo-card-display.tsx` | [Ver archivo](components/participate/bingo-card-display.tsx)

**Grid del cartón:**
- 3 filas × 9 columnas (Bingo 90)
- Colores HEADER_COLORS: 9 colores diferentes
- Marcas en números extraídos

**Responsive del cartón:**
```tsx
// Línea 155: Tamaño de celdas adaptable
h-8 text-sm sm:h-10 sm:text-[15px]    // Normal
h-9 text-sm sm:h-11 sm:text-base      // Para descarga

// Línea 165: Tamaño de fuente para números
text-[8px] sm:text-[9px]              // Headers
text-[9px] sm:text-[10px]             // Números
```

**Problemas identificados:**
- ⚠️ En mobile (h-8 = 32px), el cartón puede ser muy comprimido
- ⚠️ Badge de número de cartón no tiene mucho contraste en el modal
- ⚠️ Download usa html2canvas, puede tener issues con animaciones

---

#### `payment-instructions.tsx` | [Ver archivo](components/participate/payment-instructions.tsx)

**Grid de datos:**
- 6 filas (Titular, Alias, CBU, Banco, Concepto, Monto)
- Layout: `grid auto-rows-fr gap-3 sm:grid-cols-2`

**Problemas identificados:**
- ⚠️ Los valores pueden ser MUY largos (CBU: 22 dígitos, alias: variable)
- ✅ Tiene botón copy, pero no hay feedback de "copiado"
- ⚠️ Textos muy pequeños en mobile (text-sm en 320px)

---

### 4. **Componentes Live (Sorteo en Vivo)**

#### `live-draw-card.tsx` | [Ver archivo](components/live/live-draw-card.tsx)

**Layout:**
- Grid: 1 col mobile, 2 cols (texto + números) en lg
- `lg:grid-cols-[minmax(0,1fr)_340px]`

**Información mostrada:**
```tsx
// Líneas 109-126: Badge + Título + Premios
<Badge>Sorteo en vivo / Cerrado</Badge>
<h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{raffle.name}</h2>
<p className="text-3xl font-bold sm:text-4xl">{jackpotPrize.amount}</p>
```

**Grid de premios:**
- Desktop: 4 columnas con `sm:grid-cols-4`
- Mobile: 1 columna por defecto

**Problemas identificados:**
- ⚠️ Premios pueden truncarse si textos largos
- ⚠️ Cantidad limitada de espacio en columna (340px para números)

---

#### `live-wall.tsx` | [Ver archivo](components/live/live-wall.tsx)

**Propósito:** Vista de pantalla completa para proyección en vivo
- Carga datos cada 3 segundos
- Muestra contador regresivo

---

### 5. **Componentes Admin**

#### `admin-dashboard.tsx` | [Ver archivo](components/admin/admin-dashboard.tsx)

**Características:**
- Gestión de sorteos
- Panel de participantes
- Control de pagos y validación de comprobantes

**Layout:** Complejo con diálogos y tablas

---

#### `draw-controls.tsx` | [Ver archivo](components/admin/draw-controls.tsx)

**Controles:**
- Inicio de sorteo (Start)
- Sorteo automático (Draw)
- Reset y Finish

**Input fields:**
- countdownMinutes (input numérico)
- autoIntervalSeconds (input numérico)

**Problemas identificados:**
- ⚠️ Los inputs no tienen validación de rango visible
- ⚠️ Sin confirmación antes de acciones destructivas (reset/finish)

---

## ⚙️ CONFIGURACIÓN DE ESTILOS Y TEMAS

### 1. **Tailwind & PostCSS**

#### `postcss.config.mjs` | [Ver archivo](postcss.config.mjs)
```mjs
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

**Nota:** Usa el nuevo Tailwind CSS 4 (con @tailwindcss/postcss)

---

#### `app/globals.css` | [Ver archivo](app/globals.css)

**Variables CSS definidas (root):**

```css
/* Colores principales */
--background: rgb(11, 11, 16);           /* Very dark blue-gray */
--foreground: rgb(248, 250, 252);        /* Slate 50 */
--primary: rgb(37, 99, 235);             /* Blue 600 */
--accent: rgb(249, 115, 22);             /* Orange 500 */

/* Colores de UI */
--card: rgba(255, 255, 255, 0.05);       /* Semi-transparent white */
--border: rgba(255, 255, 255, 0.1);      /* Borders */
--input: rgba(255, 255, 255, 0.08);      /* Inputs */

/* Radio */
--radius: 1rem;                          /* 16px */

/* Fuentes */
--font-fredoka: var(--font-dm-sans);     /* DM Sans */
```

**Configuración de fuentes:**

```tsx
// app/layout.tsx, líneas 7-8
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' })
```

**Modo oscuro:** El proyecto está todo en modo dark (no hay soporte para light mode)

---

## 📱 RESPONSIVE DESIGN & BREAKPOINTS

### Estándares de Breakpoints Tailwind Utilizados

```
xs: 0px          (default)
sm: 640px        ✅ Usado frecuentemente
md: 768px        ✅ Usado
lg: 1024px       ✅ Usado frecuentemente
xl: 1280px       ✅ Usado
2xl: 1536px      ⚠️ No visto mucho
min-[520px]     ⚠️ Breakpoint custom
```

### Patrones Responsive Identificados

#### 1. **Hero Section** (hero-section.tsx)

| Breakpoint | Cambios | Líneas |
|-----------|---------|--------|
| Mobile (xs) | - Imagen 22rem<br>- Texto centrado<br>- 1 columna | 42-44 |
| sm (640px) | + Imagen 31rem<br>- Botones lado a lado | 51 |
| lg (1024px) | + Imagen 36rem<br>+ Grid 2 col<br>+ Texto left | 52-53 |
| xl (1280px) | + Texto 8xl | 52 |

**Problema:** Falta breakpoint para 2xl y 3xl (pantallas UHD)

#### 2. **Banner Sequence** (hero-banner-sequence.tsx)

```tsx
// Padding dinámico (PROBLEMA: muy agresivo)
className="px-20 sm:px-44 md:px-56"

// Logo
className="h-16 w-16 object-contain 
           drop-shadow-2xl sm:h-32 sm:w-32 md:h-40 md:w-40"

// Texto
className="text-2xl font-bold leading-none sm:text-4xl md:text-5xl"
```

**Problema:** Padding de `px-56` (224px cada lado) es demasiado para lg

#### 3. **Bingo Card** (bingo-card-display.tsx)

```tsx
// Celdas del cartón
className="h-8 text-sm sm:h-10 sm:text-[15px]"   // Mobile: 32px alta

// Headers
className="text-[8px] sm:text-[9px]"             // Muy pequeño
```

**Problema:** En pantalla mobile de 320px con h-8, es muy comprimido

---

### Patrones de Escalado Identificados

#### ✅ Buenos patrones:

```tsx
// Hero section - escalado gradual
text-5xl sm:text-6xl lg:text-7xl xl:text-8xl

// Gaps escalables
gap-3 sm:gap-4

// Padding progresivo
px-4 sm:px-6 lg:px-8

// Altura dinámica de botones
h-13 w-full sm:w-auto
```

#### ⚠️ Problemas detectados:

```tsx
// 1. Saltos abruptos
text-2xl sm:text-4xl              // Salto de 32px a 48px (50%)

// 2. Valores magicos
px-20 sm:px-44 md:px-56           // Inconsistente
min-h-[24rem] sm:min-h-[30rem] lg:min-h-[34rem]

// 3. Breakpoints custom
min-[520px]:grid-cols-[140px_minmax(0,1fr)]  // No estándar

// 4. Valores de texto arbitrarios
text-[8px] sm:text-[9px]          // Muy pequeño
h-9 items-center gap-2 rounded-full... text-xs  // xs en h-9 es pequeño
```

---

## 🎲 LÓGICA DE SORTEOS

### 1. **Archivo Principal: `lib/raffle-lifecycle.ts`**

#### Constantes importantes:

```ts
// Línea 4: CIERRE DE COMPRAS
const PURCHASE_CLOSE_MS = 60 * 60 * 1000  // 1 HORA antes del sorteo

// Línea 5: Intervalo automático de sorteo
const DEFAULT_AUTO_DRAW_INTERVAL_SECONDS = 6
```

#### Estados del Sorteo:

```ts
// Línea 33: Estados posibles
draw_status?: 'idle' | 'running' | 'finished' | null

// Estados de transición:
// idle     → running    (automático 1 hora antes)
// running  → finished   (manual o automático)
```

---

### 2. **Función: `getPurchaseAvailability()` | Líneas 65-84**

Lógica de cuándo puedo comprar cartones:

```tsx
export function getPurchaseAvailability(
  raffle: Pick<RaffleForLifecycle, 'draw_date' | 'draw_status'>
) {
  // Condición 1: Sorteo ya terminó
  if (raffle.draw_status === 'finished') {
    return { canPurchase: false, reason: 'closed' }
  }

  // Condición 2: Sin fecha de sorteo
  if (!raffle.draw_date) {
    return { canPurchase: false, reason: 'missing_date' }
  }

  // Condición 3: Sorteo en progreso
  if (raffle.draw_status === 'running') {
    return { canPurchase: false, reason: 'running' }
  }

  // Condición 4: FALTA 1 HORA O MENOS (cierre de ventas)
  if (drawTime - Date.now() <= PURCHASE_CLOSE_MS) {
    return { canPurchase: false, reason: 'cutoff' }
  }

  // Si pasó todas las validaciones
  return { canPurchase: true, reason: null }
}
```

**Resumen:**
- ✅ Compra disponible si falta > 1 hora
- ❌ Compra NO disponible si falta ≤ 1 hora (cierre)
- ❌ Compra NO disponible si sorteo está running
- ❌ Compra NO disponible si sorteo está finished

---

### 3. **Función: `syncRaffleLifecycle()` | Líneas 211-287**

**Lógica automática de inicios:**

```ts
// Línea 219-229: AUTO-INICIO DEL SORTEO
if (status === 'idle' && 
    Number.isFinite(drawTime) && 
    drawTime - Date.now() <= PURCHASE_CLOSE_MS) {
  // Automáticamente cambia draw_status de 'idle' → 'running'
  // Se ejecuta cuando faltan ≤ 1 HORA para el sorteo
  draw_status: 'running'
}

// Línea 246-287: AUTO-DRAW (sorteo automático de números)
if (current.draw_status !== 'running') {
  return current  // Solo si está running
}

// Calcula cuántos números deben extraerse
const elapsedSeconds = Math.max(0, 
  Math.floor((Date.now() - startedAt) / 1000) - countdownSeconds
)
const targetDrawCount = Math.min(BINGO_TOTAL_BALLS, 
  Math.floor(elapsedSeconds / getAutoDrawIntervalSeconds())
)

// Extrae números automáticamente cada getAutoDrawIntervalSeconds()
// Por defecto cada 6 segundos (configurable vía env)
```

**Flujo temporal:**

```
draw_date = "2025-06-15 18:00:00"

[1 hora 5 min antes]  Estado: idle
   ↓
[1 hora exacta antes]  Estado: idle → running (AUTO)
   ↓
[Countdown: 60 min]    Espera antes de empezar a extraer
   ↓
[draw_started_at]      Comienza extracción automática
   ↓
[Cada 6 segundos]      Se extrae 1 número (configurable)
   ↓
[Bola 90]              Estado: finished (AUTO)
```

---

### 4. **Configuración del Intervalo de Sorteo**

```ts
// Línea 55-61: getAutoDrawIntervalSeconds()
function getAutoDrawIntervalSeconds() {
  const configured = Number(process.env.RAFFLE_AUTO_DRAW_INTERVAL_SECONDS)
  
  if (!Number.isFinite(configured)) {
    return DEFAULT_AUTO_DRAW_INTERVAL_SECONDS  // 6 segundos
  }
  
  return Math.max(3, Math.min(60, Math.round(configured)))
}
```

**Rango permitido:** 3 a 60 segundos (configurable por env var)

---

### 5. **Notificación de Ganadores**

```ts
// Línea 89-150: notifyNewWinnerAwards()
// Se ejecuta después de cada número extraído
// Busca coincidencias en cartones
// Envía WhatsApp si alguien gana
```

---

### 6. **Base de Datos - Información Crítica**

```ts
// Interfaz RaffleForLifecycle (líneas 22-35)
interface RaffleForLifecycle {
  id: string
  name: string
  is_active?: boolean | null
  prize?: string | null
  additional_prizes?: string[] | null
  amount?: string | null
  draw_date?: string | null              // 🔑 Fecha/hora del sorteo
  draw_status?: 'idle' | 'running' | 'finished' | null
  countdown_seconds?: number | null      // Segundos de espera inicial
  draw_started_at?: string | null        // Cuándo comenzó a extraer
  drawn_numbers?: number[] | null        // Números ya extraídos
}
```

---

## ⚠️ UX/UI ISSUES IDENTIFICADOS

### 1. **PROBLEMAS DE TIPOGRAFÍA Y ESCALA**

#### Problema 1.1: Textos muy pequeños en mobile
```tsx
// payment-instructions.tsx, línea 39
p className="text-sm leading-relaxed text-zinc-300"
// En 320px = 14px, puede ser difícil de leer
```

**Afección:** Instrucciones de pago, datos de cuenta  
**Gravedad:** 🟠 Media  
**Solución:** `text-sm sm:text-base`

---

#### Problema 1.2: Headers excesivamente grandes en desktop
```tsx
// hero-section.tsx, línea 52
h2 className="...text-5xl sm:text-6xl lg:text-7xl xl:text-8xl"
// xl = 96px (2 líneas en la mayoría de contextos)
```

**Afección:** Titular de hero  
**Gravedad:** 🟡 Baja (es intencional)  
**Solución:** Aceptar, es el diseño

---

#### Problema 1.3: Saltos abruptos entre breakpoints
```tsx
// hero-banner-sequence.tsx, línea 36
className="text-2xl font-bold leading-none 
           sm:text-4xl md:text-5xl"
// xs: 28px → sm: 36px → md: 48px (saltos del 28% y 33%)
```

**Afección:** Flujo visual inconsistente  
**Gravedad:** 🟡 Baja  
**Solución:** Añadir breakpoint intermedio con `text-3xl` en `min-[600px]`

---

### 2. **PROBLEMAS DE SPACING Y LAYOUT**

#### Problema 2.1: Padding excesivo en tablet/desktop
```tsx
// hero-banner-sequence.tsx, línea 30
div className="...px-20 sm:px-44 md:px-56"
// md: 224px padding cada lado en 768px = solo 320px de contenido
```

**Afección:** Contenido muy estrecho en tablets  
**Gravedad:** 🔴 Alta  
**Solución:** `px-4 sm:px-6 md:px-8 max-w-2xl mx-auto`

---

#### Problema 2.2: Cartón de bingo muy comprimido en mobile
```tsx
// bingo-card-display.tsx, línea 155
className="h-8 text-sm sm:h-10 sm:text-[15px]"
// Mobile: 32px = 24px altura de contenido (muy pequeño)
```

**Afección:** Números de bingo poco legibles en teléfonos  
**Gravedad:** 🔴 Alta (es funcional pero incómodo)  
**Solución:** Hacer scrolleable horizontal o aumentar a `h-10` en mobile

---

#### Problema 2.3: Grid de premios sin respeto a espacio
```tsx
// live-draw-card.tsx, línea 130
className="grid auto-rows-fr gap-2 sm:grid-cols-4"
// En mobile: 1 col ancha
// En sm: 4 cols que pueden quedarse cortas si hay muchos premios
```

**Afección:** Premios con textos largos se truncan  
**Gravedad:** 🟠 Media  
**Solución:** `grid-cols-2 lg:grid-cols-4`

---

### 3. **PROBLEMAS DE CONTRASTE Y VISIBILIDAD**

#### Problema 3.1: Texto de baja visibilidad en algunos componentes
```tsx
// sponsor-showcase.tsx, línea 73
className="text-slate-400"  // Bajo contraste en fondo oscuro
```

**Afección:** Descripción de beneficios difícil de leer  
**Gravedad:** 🟠 Media  
**Solución:** `text-slate-300` o `text-gray-300`

---

#### Problema 3.2: Badge de número de cartón poco visible
```tsx
// bingo-card-display.tsx, línea 197
<Badge className="mt-2 bg-amber-500 hover:bg-amber-500 text-white">
```

**Nota:** Está bien, pero el modal tiene `bg-zinc-950/85` que puede oscurecer

---

### 4. **PROBLEMAS DE INPUTS Y FORMULARIOS**

#### Problema 4.1: Validación de receipt muy estricta
```tsx
// participation-form.tsx, líneas 18-22
const MIN_RECEIPT_SIZE = 10 * 1024          // 10KB mínimo
const MIN_RECEIPT_DIMENSION = 480           // 480x480px mínimo
```

**Afección:** 
- Fotos de pantazo pueden ser < 480px en una dimensión
- Comprobantes escaneados pueden ser < 10KB si están comprimidos

**Gravedad:** 🟠 Media  
**Solución:** Reducir a `MIN_RECEIPT_DIMENSION = 320` o permitir 6-7KB

---

#### Problema 4.2: Sin feedback visual durante upload de comprobante
```tsx
// participation-form.tsx
// No hay indicador de progreso visible durante validación
// No hay skeleto o loader mientras procesa imagen
```

**Afección:** Usuario no sabe si está procesando o se colgó  
**Gravedad:** 🔴 Alta  
**Solución:** Mostrar loader durante `validateReceiptFile()`

---

#### Problema 4.3: DNI y Address requeridos sin formato flexible
```tsx
// participation-form.tsx
// Solo texto libre, sin máscara de DNI o sugerencias de dirección
```

**Afección:** Errores de tipografía, inconsistencias  
**Gravedad:** 🟡 Baja (depende del back-end)  
**Solución:** Agregar máscara `XX.XXX.XXX` para DNI

---

### 5. **PROBLEMAS DE INFORMACIÓN Y JERARQUÍA**

#### Problema 5.1: Textos muy largos sin truncamiento
```tsx
// payment-instructions.tsx, línea 35
<p className="min-w-0 break-all font-semibold text-white">{row.value}</p>
// CBU de 22 dígitos se quiebra sin límites
```

**Afección:** Quebrado visual desordenado  
**Gravedad:** 🟠 Media  
**Solución:** `max-w-xs lg:max-w-sm` + `truncate` o `line-clamp-2`

---

#### Problema 5.2: Copy del SponsorShowcase puede ser redundante
```tsx
// sponsor-showcase.tsx, línea 52-56
// Dos textos similares: uno en el title, otro en el copy
// Si no hay sorteo activo, mensaje muy largo
```

**Afección:** Confusión visual  
**Gravedad:** 🟡 Baja  
**Solución:** Resumir o reorganizar

---

### 6. **PROBLEMAS DE INTERACTIVIDAD**

#### Problema 6.1: Botón de descarga de cartón puede fallar silenciosamente
```tsx
// bingo-card-display.tsx, línea 86-94
// Si html2canvas falla, solo hay alert()
// Sin reintentos automáticos
```

**Afección:** Usuario no puede descargar cartón  
**Gravedad:** 🔴 Alta  
**Solución:** Mostrar error más amigable + opción para reintentar

---

#### Problema 6.2: Admin controls sin confirmación
```tsx
// draw-controls.tsx, líneas 70-120
// Botones de 'reset' y 'finish' sin confirmación
// Pueden ejecutarse por accidente
```

**Afección:** Pérdida de datos accidental  
**Gravedad:** 🔴 Alta  
**Solución:** `Dialog` de confirmación antes de ejecutar

---

#### Problema 6.3: Inputs de admin sin validación visual
```tsx
// draw-controls.tsx, línea 49
const autoInterval = Math.max(3, Math.min(60, Math.round(Number(autoIntervalSeconds || 0) || 6)))
// El input permite escribir cualquier cosa, luego se corrige silenciosamente
```

**Afección:** Usuario escribe 100 pero realmente se usa 60  
**Gravedad:** 🟠 Media  
**Solución:** Añadir `min="3" max="60"` al input

---

### 7. **PROBLEMAS DE RESPONSIVE AVANZADO**

#### Problema 7.1: Breakpoint custom `min-[520px]` sin documentación
```tsx
// sponsor-showcase.tsx, línea 65
className="grid h-full min-[520px]:grid-cols-[140px_minmax(0,1fr)] 
           sm:grid-cols-[160px_minmax(0,1fr)]"
```

**Afección:** Inconsistencia con el sistema de breakpoints  
**Gravedad:** 🟡 Baja  
**Solución:** Usar `sm` o crear breakpoint consistente en tailwind.config

---

#### Problema 7.2: Imágenes sin responsividad completa
```tsx
// hero-section.tsx, línea 38
<Image
  src="/brand/confetti-coins.svg"
  alt=""
  width={820}
  height={480}
  className="...absolute -right-56 top-10 -z-10 hidden w-[42rem] opacity-25"
/>
// width fijo pero w-[42rem] puede ser > 820px en xl
```

**Afección:** Distorsión en pantallas UHD  
**Gravedad:** 🟡 Baja  
**Solución:** `w-full lg:w-[42rem] max-w-2xl`

---

### 8. **PROBLEMAS DE RENDIMIENTO VISUAL**

#### Problema 8.1: Animaciones en bolas de bingo
```tsx
// hero-section.tsx, línea 121
style={{ animationDuration: `${3 + (number % 4) * 0.35}s` }}
// Animación continua en 4 elementos, puede afectar rendimiento en móviles
```

**Afección:** Rendimiento en dispositivos antiguos  
**Gravedad:** 🟡 Baja  
**Solución:** `prefers-reduced-motion: reduce`

---

#### Problema 8.2: Modal de cartón usa html2canvas
```tsx
// bingo-card-display.tsx, línea 101
const { default: html2canvas } = await import('html2canvas')
// Es una librería pesada (~50KB), importación dinámica es correcto
// Pero puede ser lento en conexiones lentas
```

**Afección:** Retraso al abrir/descargar modal  
**Gravedad:** 🟡 Baja  
**Solución:** Mostrar loader + mensaje de espera

---

---

## ✅ RECOMENDACIONES

### 1. **Tipografía & Escala**

- [ ] **Prioridad Alta:** Cambiar `text-sm` a `text-sm sm:text-base` en instruction/payment
- [ ] **Prioridad Alta:** Revisar saltos entre `text-2xl → text-4xl → text-5xl`
- [ ] **Prioridad Media:** Añadir breakpoint intermedio `2xl` para títulos grandes

### 2. **Spacing & Layout**

- [ ] **Prioridad Alta:** Cambiar padding `px-20 sm:px-44 md:px-56` a `px-4 sm:px-6 md:px-8`
- [ ] **Prioridad Alta:** Hacer cartón scrolleable o aumentar celda a `h-10` en mobile
- [ ] **Prioridad Media:** Revisar grid de premios en `live-draw-card.tsx`

### 3. **Validaciones & UX**

- [ ] **Prioridad Alta:** Mostrar loader durante validación de receipt
- [ ] **Prioridad Alta:** Añadir confirmación en acciones destructivas (admin)
- [ ] **Prioridad Media:** Reducir MIN_RECEIPT_DIMENSION a 320px
- [ ] **Prioridad Media:** Añadir máscara de formato a DNI

### 4. **Interactividad**

- [ ] **Prioridad Alta:** Mejorar manejo de errores en descarga de cartón
- [ ] **Prioridad Media:** Truncar textos largos (CBU, alias) con `line-clamp` o `truncate`
- [ ] **Prioridad Media:** Añadir validación numérica visual en admin inputs

### 5. **Responsive**

- [ ] **Prioridad Baja:** Documentar/unificar breakpoint `min-[520px]`
- [ ] **Prioridad Baja:** Revisar imágenes heroicas en pantallas UHD
- [ ] **Prioridad Baja:** Respetar `prefers-reduced-motion` en animaciones

### 6. **Performance**

- [ ] **Prioridad Media:** Añadir loader visual en modal de cartón
- [ ] **Prioridad Baja:** Optimizar librería html2canvas si es frecuente

---

## 📊 RESUMEN EJECUTIVO

| Área | Estado | Issues Críticos | Issues Menores |
|------|--------|------------------|-----------------|
| **Componentes** | ✅ Bien | Hero banner padding | - |
| **Responsive** | ⚠️ Bueno | Cartón mobile (h-8) | Breakpoint custom |
| **Tipografía** | ⚠️ Aceptable | Saltos abruptos | Textos pequeños |
| **Lógica Sorteos** | ✅ Correcta | - | - |
| **UX/UI** | ⚠️ Usable | Receipt validation, Admin confirm | Feedback visual |
| **Performance** | ✅ Aceptable | - | html2canvas peso |

---

## 📝 NOTAS FINALES

- **Diseño general:** Oscuro, moderno, con paleta ámbar/azul consistente
- **Tipografía:** DM Sans (principal), Space Grotesk (secundaria)
- **Radius:** 1rem (16px) uniforme en toda la app
- **Modo tema:** Solo dark (no hay light mode)
- **Sorteos:** Sistema automático bien implementado, cierre de compras a -1h
- **Próximas acciones:** Enfocarse en responsive mobile y validaciones

---

**Fin del análisis | 2 de junio de 2026**
