# Verificacion de pagos con OCR gratuito

El flujo de comprobantes funciona sin OpenAI ni servicios pagos. El admin usa el boton **Leer con OCR** desde el detalle del carton y el sistema intenta extraer:

- monto transferido
- numero de operacion
- cuenta destino
- fecha
- texto crudo detectado

## Formatos soportados

El OCR gratuito procesa imagenes:

- JPG / JPEG
- PNG
- WebP
- BMP
- TIFF

Los PDF escaneados quedan para revision manual. Para usar OCR con un PDF, subir una captura del comprobante en formato imagen.

## Como validar

1. Entrar al panel admin.
2. Abrir un participante con comprobante cargado.
3. Hacer click en **Leer con OCR**.
4. Revisar los campos detectados.
5. Aprobar, rechazar o guardar como pendiente segun corresponda.

El sistema no aprueba automaticamente si faltan datos criticos o si detecta diferencias contra el monto, numero de operacion o billetera esperados.

## Variables necesarias

No se necesita `OPENAI_API_KEY`.

El flujo sigue necesitando las variables habituales de Supabase y Vercel Blob:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BLOB_READ_WRITE_TOKEN`

## Limitaciones

El OCR gratuito depende de la calidad de la imagen. Si el comprobante esta borroso, muy comprimido, inclinado o tiene poco contraste, puede dejar datos vacios o incorrectos. En esos casos, revisar manualmente y guardar la decision desde el panel.
