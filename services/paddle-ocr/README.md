# PaddleOCR service

Servicio OCR opcional para Lucky Bingo Bear. La app de Next.js lo usa cuando `PADDLE_OCR_ENDPOINT` esta configurado o cuando Vercel Services inyecta `PADDLE_OCR_URL`; si falla, vuelve al OCR actual.

## Local

```bash
docker build -t lbb-paddle-ocr services/paddle-ocr
docker run --rm -p 8000:8000 -e PADDLE_OCR_API_KEY=change-me lbb-paddle-ocr
```

En `.env.local` de la app:

```bash
PADDLE_OCR_ENDPOINT=http://localhost:8000/ocr
PADDLE_OCR_API_KEY=change-me
```

Despues abrí `/admin/depositos` y usá el probador OCR con un comprobante real.

## Produccion

El proyecto puede desplegar este servicio con Vercel Services bajo `/paddle-ocr`. El endpoint OCR queda en `/paddle-ocr/ocr` y el frontend intenta usar `PADDLE_OCR_URL` automaticamente.

Si Vercel no inyecta esa variable, configurá manualmente:

```bash
PADDLE_OCR_ENDPOINT=https://www.luckybingbear.com/paddle-ocr/ocr
PADDLE_OCR_API_KEY=change-me
```

Para produccion barata, tambien sigue siendo valido publicarlo como contenedor aparte en una VM, mini PC, VPS o servicio de contenedores, y configurar `PADDLE_OCR_ENDPOINT` + `PADDLE_OCR_API_KEY` en Vercel.

El endpoint solo devuelve texto. La validacion de monto, operacion repetida, cuenta destino y DNI sigue viviendo en Next.js/Supabase.
