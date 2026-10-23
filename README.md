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
│   ├── pricing.js             # Catálogo de costos y fórmulas compartidas (HW.pricing)
│   ├── quote.js               # Motor de cotización y resumen compartido (HW.quote)
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

- Las 10 herramientas están definidas una sola vez en `HW_TOOLS` (`tools/common.js`).
  El menú "Herramientas" de la barra superior y las tarjetas del panel principal se
  generan desde esa fuente: para agregar/quitar una herramienta se edita solo ahí.
- Tema claro/oscuro: automático por dispositivo, con preferencia manual guardada en
  `localStorage`. Botón 🌙/☀️ en la barra superior.

## Precios y cotizadores

- Los costos y parámetros base viven en `tools/pricing.js` (`HW.pricing.COSTOS`,
  `SERVICIOS` y `ACCESORIOS`). Los estimadores los cargan después de `common.js` y los
  usan para inicializar sus campos; si el usuario edita un valor, se respeta durante la
  sesión.
- `tools/quote.js` (`HW.quote`) calcula la cotización completa, arma el resumen visual,
  copia el texto y genera el borrador que consume el generador de cotizaciones.
- El botón de limpiar/restablecer vuelve a los valores del catálogo.
- Las unidades importan: `$/m²` para área, `$/ml` para rollo/metro lineal y `$/unidad`
  para servicios. No se mezclan áreas con metros lineales.
- El margen es **sobre el precio de venta**: `precio = costo / (1 - margen/100)`.
  El pipeline es `costo base → merma → margen → servicios → cantidad`.
- El margen único por defecto es **40%**. Banner y vinil adhesivo quedan en `$25/m²`,
  DTF en `$25/ml`; PVC y laminado de vinil se recalibraron con el mismo criterio.
- Planchado e instalación usan los valores únicos `$1.50` y `$10.00`.
- Accesorios con precio fijo: ojales `$1` c/u y bolsillos `$2` c/u en pendones/banners;
  separadores `$2` c/u solo cuando la pieza incluye PVC. Inician activos con 4 unidades
  por pieza y se pueden desactivar o cambiar de cantidad.
- El cotizador de vinil unifica el vinil adhesivo y el textil (corte). La ruta antigua
  `tools/cut-estimator/` redirige a `?tipo=textil`.
- Para probar las fórmulas y el motor: `node tests/pricing.test.js` y
  `node tests/quote.test.js`. El detalle de la arquitectura está en
  [`docs/cotizadores.md`](docs/cotizadores.md).

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