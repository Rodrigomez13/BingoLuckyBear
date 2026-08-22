# Integracion PaddleOCR

PaddleOCR queda integrado como motor externo opcional. El flujo queda asi:

1. Si el comprobante es PDF con texto seleccionable, Next.js extrae el texto directamente.
2. Si es imagen y `PADDLE_OCR_ENDPOINT` existe, Next.js envia el archivo al servicio PaddleOCR.
3. Si el proyecto se despliega con Vercel Services, Next.js tambien puede usar `PADDLE_OCR_URL`, que Vercel inyecta automaticamente para el servicio `paddle-ocr`.
4. Si PaddleOCR no esta configurado o falla, se usa el OCR actual con Tesseract.
5. El texto vuelve al parser del proyecto, que valida monto, numero de operacion, cuenta destino, DNI del emisor y duplicados.

Esta separacion mantiene el OCR como un servicio independiente y evita bloquear el frontend si el motor OCR pesado falla.

## Variables

Para un servicio externo:

```bash
PADDLE_OCR_ENDPOINT=https://tu-servicio-ocr.example.com/ocr
PADDLE_OCR_API_KEY=un-token-largo
```

Para Vercel Services, `PADDLE_OCR_URL` queda inyectada automaticamente. Si no aparece o queres forzar el endpoint, configura:

```bash
PADDLE_OCR_ENDPOINT=https://www.luckybingbear.com/paddle-ocr/ocr
PADDLE_OCR_API_KEY=un-token-largo
```

`PADDLE_OCR_API_KEY` debe repetirse en el contenedor o servicio PaddleOCR.

## Probar sin transferencia real

1. Levanta el contenedor:

```bash
docker build -t lbb-paddle-ocr services/paddle-ocr
docker run --rm -p 8000:8000 -e PADDLE_OCR_API_KEY=change-me lbb-paddle-ocr
```

2. Configura `.env.local`:

```bash
PADDLE_OCR_ENDPOINT=http://localhost:8000/ocr
PADDLE_OCR_API_KEY=change-me
```

3. Reinicia Next.js y entra a `/admin/depositos`.
4. Usa "Probador OCR" con una captura de comprobante. No crea depositos ni mueve saldo.

## Recomendacion operativa

Para produccion barata, lo mas razonable sigue siendo una VM chica, mini PC, VPS o servicio de contenedores. Vercel Services puede servir para integrar todo en un mismo dominio, pero PaddleOCR instala dependencias pesadas y modelos grandes. Si el servicio OCR falla, la app no se cae: vuelve al OCR actual y deja el comprobante para revision manual.
