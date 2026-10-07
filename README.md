# Centro de Herramientas Web

Panel de utilidades para una imprenta/señalización: cotizadores (PVC, vinil, DTF, pendones),
calculadoras con tasa BCV en tiempo real, generador de QR, consulta de cédula (DNI) y
generadores de documentos (referencias y autorizaciones).

## Estructura

```
.
├── index.html                 # Panel principal: tarjetas generadas desde HW_TOOLS
├── tools/
│   ├── common.js              # Lógica compartida (tema, nav, helpers, catálogo)
│   ├── common.css             # Tokens de diseño y estilos compartidos
│   ├── <herramienta>/index.html
│   ├── <herramienta>/script.js
│   └── dni-checker/
│       ├── config.js          # Config pública (URL del proxy)
│       └── config.local.js    # Credenciales (NO se sube a git)
└── worker/                    # Cloudflare Worker: proxy de la API de cédulas
```

## Ejecutar en local

Solo necesitás Python 3:

```bash
./servir.sh          # http://127.0.0.1:8000
./servir.sh 8080     # http://127.0.0.1:8080
```

## Catálogo y navegación

- Las 10 herramientas están definidas una sola vez en `HW_TOOLS` (`tools/common.js`).
  El menú "Herramientas" de la barra superior y las tarjetas del panel principal se
  generan desde esa fuente: para agregar/quitar una herramienta se edita solo ahí.
- Tema claro/oscuro: automático por dispositivo, con preferencia manual guardada en
  `localStorage`. Botón 🌙/☀️ en la barra superior.

## Herramienta de cédulas (dni-checker)

La API de cédulas no permite CORS, por eso las consultas pasan por un Cloudflare Worker.

1. Crear el Worker desde `worker/`:

   ```bash
   cd worker
   npx wrangler deploy
   npx wrangler secret put CEDULA_TOKEN   # token de la API de cédulas
   ```

2. En `tools/dni-checker/config.js`, completá `proxyUrl` con la URL del Worker
   (`https://<nombre>.<subdominio>.workers.dev/api/cedula`) y subí el cambio.

3. (Alternativa local) Copiá `config.local.example.js` como `config.local.js` y
   configurá `modo: 'directo'`, `appId` y `token`. Ese archivo está en `.gitignore`.

Las últimas 20 consultas exitosas quedan guardadas localmente en el navegador
(`hw_dni_history`) y se pueden re-consultar desde el historial.

## Despliegue

El CI (`.github/workflows/deploy.yml`) despliega al pushear a `main`:

1. **Cloudflare Pages** (sitio estático): `directory: .`.
2. **Cloudflare Worker** (proxy de cédulas): desde `worker/`.

Secrets necesarios en GitHub (Settings → Secrets and variables → Actions):

- `CLOUDFLARE_API_TOKEN` — token con permisos Workers + Pages.
- `CLOUDFLARE_ACCOUNT_ID` — ID de tu cuenta Cloudflare.
- `CLOUDFLARE_PAGES_PROJECT` — nombre del proyecto siempre que no se use
  el valor por defecto `herramientas-web` de `deploy.yml`.

El token de la API de cédulas (`CEDULA_TOKEN`) se configura por separado
con `wrangler secret put` y no se guarda en el repositorio.