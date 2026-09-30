/* Credenciales de la API de cédulas (api.cedula.com.ve)
 *
 * Para usar la herramienta:
 *   1. Copiá este archivo como config.local.js (queda ignorado por git)
 *   2. Descomentá el bloque que necesites y completá los datos
 *
 * La configuración que se publica al sitio vive en config.js y no lleva
 * secretos: en modo proxy el token está en el Cloudflare Worker.
 * Este archivo solo sirve para tu máquina.
 */
window.HW_DNI_CONFIG = Object.assign(window.HW_DNI_CONFIG || {}, {});

/* --- Consultar a través del Worker local (`npx wrangler dev` en /worker) ---
 *
window.HW_DNI_CONFIG.proxyUrl = 'http://127.0.0.1:8787/api/cedula';
*/

/* --- Consultar directo a la API (solo funciona si la API manda CORS) ---
 *
window.HW_DNI_CONFIG.modo = 'directo';
window.HW_DNI_CONFIG.apiBase = 'https://api.cedula.com.ve/api/v1';
window.HW_DNI_CONFIG.appId = '9540';
window.HW_DNI_CONFIG.token = 'PEGÁ_AQUÍ_TU_TOKEN';
*/

/* --- Proxy CORS de terceros, para el modo directo ---
 *
window.HW_DNI_CONFIG.corsProxy = 'https://api.allorigins.win/raw?url=';
*/
