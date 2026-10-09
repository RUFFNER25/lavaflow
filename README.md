# LavaFlow — SaaS para lavanderías

Sistema multi-tenant para registrar paquetes por **DNI + peso**, imprimir **PDF**, enviar **WhatsApp (Baileys)** y configurar **precios / tipos de lavado / prendas**.

Sin Docker: usa **SQLite** + Node.js.

## Requisitos

- Node.js 20+
- npm

## Arranque

```bash
cp .env.example .env
# Edita AUTH_SECRET, INTERNAL_API_KEY y (cuando lo tengas) DNI_API_TOKEN

npm run setup
npm run dev
```

Abre: http://localhost:3000

| Usuario | Clave |
|---------|-------|
| `admin@lavanderia.local` | `admin123` |
| `super@sitech.local` | `admin123` |

### WhatsApp (otra terminal)

```bash
cd whatsapp
WEB_URL=http://localhost:3000 \
INTERNAL_API_KEY=dev_internal_api_key_change_in_prod \
WA_SESSION_NAME=tenant-demo-lavanderia \
npm start
```

Escanea el QR de la terminal. La sesión queda en `whatsapp/auth/`.

## Flujo

1. Nuevo paquete → DNI + peso + tipo de lavado  
2. PDF o WhatsApp del comprobante  
3. Estado **Listo para entrega** → WhatsApp automático  
4. **Entregado** al entregar

## Configuración

Menú **Configuración**: precios, lavados, prendas, datos del negocio y plantillas WhatsApp  
(`{{nombre}}`, `{{codigo}}`, `{{total}}`, `{{peso}}`, `{{lavanderia}}`).

## API DNI

```env
DNI_API_URL=https://tu-api/{dni}
DNI_API_TOKEN=tu_token
DNI_DEMO_MODE=false
```

Sin token: deja `DNI_DEMO_MODE=true`.

## Robustez (sin ir al local)

| Medida | Detalle |
|--------|---------|
| SQLite | Un solo archivo: `web/data/lavanderia.db` |
| WhatsApp | Cola en BD + 5 reintentos con backoff |
| Health | `GET /api/health` y `:3100/health` |
| Backup | `npm run backup` (copia la BD a `./backups/`) |
| Auditoría | Login, altas y cambios de estado |
| Sesión WA | Carpeta `whatsapp/auth/` (no borrar) |

Backup programado (cron en el servidor):

```cron
0 3 * * * cd /ruta/al/proyecto && npm run backup
```

## Producción

```bash
npm run setup
npm run build
npm start          # web en :3000
# + proceso whatsapp (pm2 recomendado)
```

Checklist:

1. Cambiar `AUTH_SECRET` e `INTERNAL_API_KEY`  
2. Token DNI real y `DNI_DEMO_MODE=false`  
3. `APP_URL` con el dominio público  
4. PM2 / systemd para `web` y `whatsapp`  
5. Cron de `npm run backup`  
6. Monitorear `/api/health`

## Estructura

```
web/          Next.js + Prisma + SQLite
whatsapp/     Worker Baileys
scripts/      backup.sh
```
# lavaflow
