# Análisis de Parseo de Comprobantes

## ⚠️ PROBLEMAS CRÍTICOS ENCONTRADOS

### 1. **ENDPOINT OPENAI INCORRECTO** 🔴 CRÍTICO
**Ubicación**: [app/api/cards/[id]/receipt/route.ts](app/api/cards/[id]/receipt/route.ts#L142)

```ts
const response = await fetch('https://api.openai.com/v1/responses', {
```

**Problema**: Se está usando `https://api.openai.com/v1/responses` que **NO EXISTE** en la API de OpenAI.

**El endpoint correcto debe ser**: `https://api.openai.com/v1/chat/completions`

**Impacto**: Todos los parseos de comprobantes están **FALLANDO** porque el endpoint es inválido.

---

### 2. **ESTRUCTURA DEL REQUEST INCORRECTA** 🔴 CRÍTICO
**Ubicación**: [app/api/cards/[id]/receipt/route.ts](app/api/cards/[id]/receipt/route.ts#L147-L188)

**Estructura actual (INCORRECTA)**:
```ts
{
  model: OPENAI_RECEIPT_MODEL,
  input: [{...}],
  text: { format: {...} }
}
```

**La estructura correcta debe ser**:
```ts
{
  model: OPENAI_RECEIPT_MODEL,
  messages: [{...}],
  response_format: { type: "json_schema", json_schema: {...} }
}
```

**Impacto**: OpenAI rechazará todos los requests porque la estructura no es válida.

---

### 3. **ESTRUCTURA DEL FILE PART INCORRECTA** 🔴 CRÍTICO
**Ubicación**: [app/api/cards/[id]/receipt/route.ts](app/api/cards/[id]/receipt/route.ts#L126-L135)

**Problema**: Se está usando `type: 'input_file'` y `type: 'input_image'` que no son tipos válidos en OpenAI Vision API.

**Estructura correcta**:
```ts
// Para imágenes:
{
  type: 'image_url',
  image_url: {
    url: `data:${contentType};base64,${base64}`,
    detail: 'high'
  }
}

// Para PDFs (requiere vision capaz de PDFs):
{
  type: 'document',
  document: {
    type: 'document',
    source: {
      type: 'base64',
      media_type: 'application/pdf',
      data: base64
    }
  }
}
```

---

### 4. **VERSIÓN DEL MODELO POTENCIALMENTE INCORRECTA** 🟡 ADVERTENCIA
**Ubicación**: [app/api/cards/[id]/receipt/route.ts](app/api/cards/[id]/receipt/route.ts#L25)

```ts
const OPENAI_RECEIPT_MODEL = process.env.OPENAI_RECEIPT_MODEL || 'gpt-4.1-mini'
```

**Problema**: `gpt-4.1-mini` parece ser una versión incorrecta. 

**Modelos válidos de OpenAI Vision**:
- `gpt-4o` (recomendado - más barato y rápido)
- `gpt-4o-mini` (más económico)
- `gpt-4-turbo`
- `gpt-4-vision`

---

## ✅ COSAS QUE SÍ FUNCIONAN CORRECTAMENTE

### 1. **Lógica de Validación** ✓
La función `validateParsedReceipt` en [lib/receipt-validation.ts](lib/receipt-validation.ts) está bien estructurada:
- Valida montos con tolerancia de $1 (buena para imprecisiones)
- Normaliza números de operación y cuentas destino
- Genera advertencias útiles

### 2. **Parseo de Dinero** ✓
```ts
export function parseMoneyValue(value?: string | number | null) {
  // Maneja correctamente formato argentino: "1.234,56" → 1234.56
  // Maneja "1234,56" → 1234.56
}
```

### 3. **Manejo de Errores** ✓
- Maneja autenticación correctamente
- Verifica permisos del admin
- Valida estados de pago

---

## 📋 CAMBIOS NECESARIOS

### Cambio 1: Actualizar endpoint y estructura del request
**Archivo**: `app/api/cards/[id]/receipt/route.ts`

Reemplazar la función `parseReceiptWithOpenAI` completamente.

### Cambio 2: Actualizar el modelo por defecto
De `gpt-4.1-mini` a `gpt-4o-mini` o similar.

### Cambio 3: Ajustar el JSON schema
El schema actual es correcto pero debe estar en la estructura `response_format.json_schema.schema`.

---

## 🔧 TESTS RECOMENDADOS

1. Verificar que el endpoint de OpenAI responda correctamente
2. Validar estructura del request con herramientas como Postman
3. Probar con diferentes formatos de comprobantes (JPG, PNG, PDF)
4. Verificar parseo de montos con decimales

---

## ℹ️ REFERENCIAS

- OpenAI Vision API: https://platform.openai.com/docs/guides/vision
- Chat Completions: https://platform.openai.com/docs/api-reference/chat/create
- JSON Mode: https://platform.openai.com/docs/guides/json-mode
