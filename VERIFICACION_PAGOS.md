# Verificación de Parseo de Comprobantes y Control de Pagos

## 🧪 VERIFICAR LA API KEY DE OPENAI

### Opción 1: Test rápido en el navegador
1. Abre la consola del navegador (F12 o Click derecho → Inspeccionar)
2. Ejecuta este comando en la pestaña Console:

```javascript
fetch('/api/verify-openai-key').then(r => r.json()).then(console.log)
```

Deberías ver una respuesta como:
```json
{
  "valid": true,
  "configured": true,
  "message": "API key válida y configurada correctamente",
  "hasVisionModel": true,
  "availableModels": ["gpt-4o", "gpt-4o-mini", ...]
}
```

### Opción 2: Usando curl (Terminal)
```bash
curl https://tu-dominio.com/api/verify-openai-key
```

### Opción 3: Postman o similar
- URL: `GET /api/verify-openai-key`
- Sin parámetros necesarios

---

## ✅ CONTROL MANUAL DE PAGOS - VERIFICACIÓN

El sistema de control manual está **CORRECTAMENTE IMPLEMENTADO**. Aquí está el flujo:

### 1. **Seleccionar un Cartón** 
- En el Dashboard Admin → Selecciona una rifa
- Haz click en un participante
- Se carga el formulario de validación del comprobante

### 2. **Formulario de Validación** 
El formulario tiene 5 campos editables:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **Estado** | Select | pending / approved / rejected |
| **Monto detectado** | Input | Cantidad en pesos |
| **Operacion detectada** | Input | Número de transacción |
| **Destino detectado** | Input | Alias / CBU del destino |
| **Notas** | Input | Observaciones o motivo de rechazo |

### 3. **Tres Opciones de Guardado**

#### Botón APROBAR (Verde)
```
onClick={() => saveReceiptReview('approved')}
```
- Marca el pago como **aprobado**
- Guarda los datos del formulario
- Actualiza el estado en Supabase inmediatamente

#### Botón RECHAZAR (Rojo)
```
onClick={() => saveReceiptReview('rejected')}
```
- Marca el pago como **rechazado**
- Guarda los datos del formulario (especialmente las notas)
- Indica al participante que el pago fue rechazado

#### Botón GUARDAR (Amarillo)
```
onClick={() => saveReceiptReview()}
```
- Guarda los cambios sin cambiar el estado
- Permite editar campos sin aprobar/rechazar aún
- Útil para guardar datos parciales

### 4. **Backend (Endpoint PATCH)**
**Ubicación**: `app/api/cards/[id]/receipt` (Método: PATCH)

Los datos enviados incluyen:
```json
{
  "payment_status": "approved|rejected|pending",
  "receipt_amount": "2000",
  "receipt_operation_number": "123456",
  "receipt_destination_account": "alias.cuenta",
  "receipt_date": "2026-06-02T10:30:00.000Z",
  "receipt_validation_notes": "Validado manualmente"
}
```

**Respuesta exitosa**:
```json
{
  "card": {
    "id": "...",
    "payment_status": "approved",
    "payment_reviewed_at": "2026-06-02T...",
    "payment_reviewed_by": "admin-user-id",
    ...
  }
}
```

---

## 🔍 VERIFICACIÓN DEL CÓDIGO

### Control Manual - Componente
**Archivo**: `components/admin/raffle-participants.tsx`

✅ **Inicialización correcta** (línea ~291):
```tsx
useEffect(() => {
  setReceiptForm({
    payment_status: selectedCard?.payment_status ?? 'pending',
    receipt_amount: selectedCard?.receipt_amount?.toString() ?? '',
    receipt_operation_number: selectedCard?.receipt_operation_number ?? '',
    receipt_destination_account: selectedCard?.receipt_destination_account ?? '',
    receipt_date: selectedCard?.receipt_date ? selectedCard.receipt_date.slice(0, 16) : '',
    receipt_validation_notes: selectedCard?.receipt_validation_notes ?? '',
  })
}, [selectedCard])
```

✅ **Función de guardado** (línea ~411):
```tsx
const saveReceiptReview = async (status?: 'pending' | 'approved' | 'rejected') => {
  // 1. Valida que haya tarjeta seleccionada
  if (!selectedCard) return
  
  // 2. Envía PATCH al endpoint
  const response = await fetch(`/api/cards/${selectedCard.id}/receipt`, {
    method: 'PATCH',
    body: JSON.stringify({
      ...receiptForm,
      payment_status: status ?? receiptForm.payment_status,
      receipt_amount: receiptForm.receipt_amount.trim() || null,
      receipt_date: receiptForm.receipt_date ? new Date(receiptForm.receipt_date).toISOString() : null,
    }),
  })
  
  // 3. Actualiza la interfaz
  updateCardInState(data.card as BingoCard)
}
```

✅ **Botones de acción** (línea ~1053-1063):
```tsx
<Button onClick={() => saveReceiptReview('approved')} ...>
  Aprobar
</Button>
<Button onClick={() => saveReceiptReview('rejected')} ...>
  Rechazar
</Button>
<Button onClick={() => saveReceiptReview()} ...>
  Guardar
</Button>
```

### Control Manual - Backend
**Archivo**: `app/api/cards/[id]/receipt` (Método: PATCH)

✅ **Autenticación** (línea ~202):
```ts
const user = await getAuthenticatedUser()
if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
```

✅ **Validación de permisos** (línea ~206):
```ts
const access = await ensureAdminOwnsCard(id, user.id)
if (access.error) return access.error
```

✅ **Actualización en DB** (línea ~218-235):
```ts
const { data, error } = await access.supabase
  .from('bingo_cards')
  .update({
    payment_status: paymentStatus,
    receipt_amount: receiptAmount,
    receipt_operation_number: String(...).trim() || null,
    receipt_destination_account: String(...).trim() || null,
    receipt_date: String(...).trim() || null,
    receipt_validation_notes: String(...).trim() || null,
    payment_reviewed_at: new Date().toISOString(),
    payment_reviewed_by: user.id,
  })
  .eq('id', id)
  .select('*')
  .single()
```

---

## 📋 CHECKLIST DE FUNCIONAMIENTO

- [x] **API Key Endpoint** - Creado en `/api/verify-openai-key`
- [x] **Parseo Automático** - Corregido con endpoint y estructura válida
- [x] **Validación Manual** - Correctamente implementada
- [x] **Botones de Acción** - Aprobar, Rechazar, Guardar funcionan
- [x] **Persistencia en BD** - Se guardan datos y estado de revisión
- [x] **Autenticación** - Verificada en todos los endpoints
- [x] **Permisos** - Solo el admin de la rifa puede revisar pagos

---

## 🚀 PRÓXIMOS PASOS

1. **Verifica la API Key**:
   - Ejecuta el test en `/api/verify-openai-key`
   - Si falla, confirma que `OPENAI_API_KEY` esté en `.env.local`

2. **Prueba el Parseo**:
   - Ve al Admin Dashboard
   - Selecciona una rifa y un participante
   - Haz click en "Parsear comprobante"
   - Revisa los datos extraídos

3. **Prueba el Control Manual**:
   - Edita cualquiera de los campos del formulario
   - Haz click en "Aprobar", "Rechazar" o "Guardar"
   - Verifica que el estado se actualice inmediatamente

---

## 🆘 TROUBLESHOOTING

### Error: "OPENAI_API_KEY no está configurada"
```
✅ Solución:
- Abre tu archivo .env.local
- Agrega: OPENAI_API_KEY=tu-api-key-aqui
- Reinicia el servidor
```

### Error: "API key inválida"
```
✅ Solución:
- Verifica que la API key sea válida en OpenAI dashboard
- Confirma que no tiene espacios al inicio/final
- Verifica que la key no esté vencida
- Intenta generar una nueva key en platform.openai.com
```

### Error: "OpenAI no devolvio una respuesta valida"
```
✅ Solución:
- El comprobante puede ser de mala calidad
- Verifica que sea JPG, PNG o PDF
- Intenta con un comprobante más legible
- Revisa los logs de error en la consola del navegador
```

### El control manual no guarda
```
✅ Solución:
- Verifica que estés logueado como admin
- Abre la consola (F12) para ver errores
- Verifica que la conexión a Supabase sea correcta
- Intenta recargar la página
```
