/* Configuración de la herramienta de cédulas (se sube al repositorio).
 *
 * No hay secretos acá: en modo 'proxy' el app_id y el token viven en el
 * Cloudflare Worker de la carpeta /worker, no en el navegador.
 *
 * Para publicar la herramienta: completá proxyUrl con la URL de tu Worker
 * (https://<worker>.<subdominio>.workers.dev/api/cedula) y subí el cambio.
 */
window.HW_DNI_CONFIG = Object.assign(window.HW_DNI_CONFIG || {}, {
  // 'proxy' = consulta a través del Worker (funciona en el navegador)
  // 'directo' = consulta a la API sin proxy (solo si la API habilita CORS)
  modo: 'proxy',

  proxyUrl: 'https://dni-checker-proxy.digitalprint-vnz.workers.dev/api/cedula'
});
