# Sistema de Agendamiento de Clases (Serverless)

## Requisitos

- Node.js 18+
- Neon PostgreSQL (DATABASE_URL)
- Google OAuth (AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET)
- Token de Telegram (TELEGRAM_BOT_TOKEN)

## Configuracion inicial

1. Copia `.env.example` a `.env` y completa las variables.
2. Ejecuta `npx prisma db push` para crear tablas.
3. Ejecuta `npm run dev`.

## Seed local

Opcional (solo desarrollo):

1. Define `SEED_ADMIN_EMAIL` en `.env`.
2. Ejecuta POST a `/api/seed` (desde el panel admin o con curl).

## Rutas principales

- `/` Landing
- `/login` Acceso Google
- `/onboarding` Completar nombre
- `/dashboard` Panel estudiante
- `/admin` Panel admin

## Notas

- El acceso se controla via Whitelist en `signIn`.
- Reservas y cancelaciones usan transacciones SQL.
- Telegram es tolerante a fallos de red.
