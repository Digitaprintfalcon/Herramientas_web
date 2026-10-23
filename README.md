# Centro de Herramientas Web

Panel de utilidades para una imprenta/señalización: cotizadores (PVC, vinil, DTF, pendones),
calculadoras con tasa BCV en tiempo real, generador de QR, consulta de cédula (DNI) y
generadores de documentos (referencias y autorizaciones).

## Estructura

```
.
├── index.html                 # Panel principal: tarjetas generadas desde HW_TOOLS
├── favicon.ico
├── favicon.svg
├── favicon-16x16.png
├── favicon-32x32.png
├── favicon-48x48.png
├── apple-touch-icon.png
├── icon-192x192.png
├── icon-512x512.png
├── site.webmanifest
├── tools/
│   ├── common.js              # Lógica compartida (tema, nav, helpers, catálogo)
│   ├── common.css             # Tokens de diseño y estilos compartidos
│   ├── pricing.js             # Catálogo de precios y fórmulas compartidas (HW.pricing)
│   ├── cedula-client.js       # Cliente de consulta de cédulas (HW.cedula)
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

- Las 11 herramientas están definidas una sola vez en `HW_TOOLS` (`tools/common.js`).
  El menú "Herramientas" de la barra superior y las tarjetas del panel principal se
  generan desde esa fuente: para agregar/quitar una herramienta se edita solo ahí.
- Tema claro/oscuro: automático por dispositivo, con preferencia manual guardada en
  `localStorage`. Botón 🌙/☀️ en la barra superior.

## Precios y cotizadores

- Todos los precios y parámetros base viven en `tools/pricing.js` (`HW.pricing.PRECIOS`).
  Los estimadores los cargan después de `common.js` y los usan para inicializar sus
  campos; si el usuario edita un precio, se respeta durante la sesión.
- El botón de limpiar/restablecer vuelve a los valores del catálogo. En DTF, la
  cotización persistida en `localStorage` tiene prioridad sobre los defaults.
- Las unidades importan: `$/m²` para área, `$/ml` para rollo/metro lineal y `$/unidad`
  para servicios. No se mezclan áreas con metros lineales.
- El margen es **sobre el precio de venta**: `precio = costo / (1 - margen/100)`.
  El pipeline es `costo base → merma → margen → servicios → cantidad`.
- Planchado e instalación usan los valores únicos `$1.50` y `$10.00`.
- Para probar las fórmulas compartidas: `node tests/pricing.test.js`.

## Referencias precargadas

El generador de referencias guarda sus referentes en `localStorage` con la clave
`hw_ref_base`. Desde el botón "Administrar base" se pueden crear, editar, eliminar,
exportar e importar. La primera vez se cargan tres ejemplos; si la base se deja vacía,
se respeta y no se vuelve a sembrar.

La fecha del documento se completa sola al cargar o cambiar de modo. Si se edita a
mano, deja de actualizarse automáticamente. La foto de la cédula se muestra como
miniatura, se puede ampliar y quitar antes de generar el PDF.

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