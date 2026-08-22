# Despliegue Lucky Bingo Bear
 aaa
Este repo debe tener una sola fuente de produccion para evitar mezclar cuentas.

## GitHub

- Repositorio: `Rodrigomez13/BingoLuckyBear`
- Rama de produccion recomendada: `main`
- Cada cambio productivo debe terminar en `main` y subir con:

```bash
git checkout main
pnpm build
git add .
git commit -m "Descripcion del cambio"
git push origin main
```

## Vercel

Usar el proyecto de Vercel de la cuenta donde esta comprado el dominio `luckybingobear.com`.

Segun las capturas actuales, ese proyecto es el que esta en el scope:

```text
rodrigonicolasgomez70-2677s-projects
```

El proyecto que conviene usar como produccion es el que tenga:

- Git conectado a `Rodrigomez13/BingoLuckyBear`
- Production Branch: `main`
- Dominio: `luckybingobear.com`
- Dominio: `www.luckybingobear.com`

Evitar usar como produccion el proyecto local que estaba linkeado por CLI:

```text
bingo-lucky-bear
rodrigo-gomezs-projects-d89e5f49
```

Ese link local estaba en `.vercel/project.json` y fue eliminado porque apuntaba a otra cuenta/scope.

## Dominio

El dominio debe estar asignado a un solo proyecto de Vercel.

Si `luckybingobear.com` aparece en dos proyectos, deja el dominio solamente en el proyecto correcto y eliminalo del proyecto equivocado. Esto evita estados como `Verification Needed` o `Invalid Configuration`.

Configuracion esperada:

```text
luckybingobear.com      -> Production
www.luckybingobear.com  -> Production
```

Si Vercel pide DNS manual:

```text
@    A      76.76.21.21
www  CNAME  cname.vercel-dns.com
```

Si el dominio fue comprado dentro de Vercel, normalmente no hace falta tocar DNS: solo hay que asociarlo al proyecto correcto.

## Variables de entorno

`.env.local` es solo local y no se sube a GitHub.

Las variables reales de produccion deben cargarse en:

```text
Vercel -> Project -> Settings -> Environment Variables
```

Variables importantes:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
BLOB_READ_WRITE_TOKEN
NEXT_PUBLIC_WHATSAPP_URL
NEXT_PUBLIC_WHATSAPP_GROUP_URL
WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_WINNER_TEMPLATE_NAME
WHATSAPP_TEMPLATE_LANGUAGE
CRON_SECRET
```

## Regla practica

Para no mezclar cuentas:

1. Hacer commits y push solo a `origin/main`.
2. No usar `vercel deploy` desde CLI si no estas logueado en la cuenta correcta.
3. Deployar desde GitHub/Vercel automatico.
4. Mantener el dominio solo en el proyecto de Vercel correcto.
