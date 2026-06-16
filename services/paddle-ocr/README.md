# PaddleOCR service

Servicio OCR opcional para Lucky Bingo Bear. La app de Next.js lo usa cuando `PADDLE_OCR_ENDPOINT` esta configurado; si falla, vuelve al OCR actual.

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

No conviene ejecutar PaddleOCR dentro de Vercel: instala Python, PaddlePaddle y modelos pesados. Publicalo como contenedor aparte en una VM, mini PC, VPS o servicio de contenedores, y configurá `PADDLE_OCR_ENDPOINT` + `PADDLE_OCR_API_KEY` en Vercel.

El endpoint solo devuelve texto. La validacion de monto, operacion repetida, cuenta destino y DNI sigue viviendo en Next.js/Supabase.
