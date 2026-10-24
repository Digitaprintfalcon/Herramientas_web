const API = 'https://api.cedula.com.ve/api/v1';
const APP_ID = '9540';
const VENTANA_MS = 60000;
const MAX_POR_VENTANA = 20;
const MAX_ENTRADAS = 5000;
const golpes = new Map();

const ALLOWED_ORIGINS = [
  'https://herramientas-web.pages.dev',
  'https://herramientas-web.digitalprint-vnz.workers.dev',
  'http://localhost:8787',
  'http://127.0.0.1:8787',
  'http://localhost:8000'
];

const CABECERAS_BASE = {
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
  'Access-Control-Max-Age': '86400',
  'Cache-Control': 'no-store',
  'Vary': 'Origin'
};

function getCorsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    return Object.assign({}, CABECERAS_BASE, { 'Access-Control-Allow-Origin': origin });
  }
  return Object.assign({}, CABECERAS_BASE, { 'Access-Control-Allow-Origin': ALLOWED_ORIGINS[0] });
}

function responder(request, cuerpo, estado) {
  return new Response(typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo), {
    status: estado,
    headers: Object.assign({}, getCorsHeaders(request), { 'Content-Type': 'application/json; charset=utf-8' })
  });
}

function error(request, codigo, estado) {
  return responder(request, { error: true, data: false, error_str: codigo }, estado);
}

function excede(ip) {
  const ahora = Date.now();
  const registro = golpes.get(ip);

  if (!registro || ahora >= registro.reinicio) {
    golpes.set(ip, { conteo: 1, reinicio: ahora + VENTANA_MS });
    if (golpes.size > MAX_ENTRADAS) {
      for (const [clave, valor] of golpes) {
        if (ahora >= valor.reinicio) golpes.delete(clave);
      }
    }
    return false;
  }

  registro.conteo += 1;
  return registro.conteo > MAX_POR_VENTANA;
}

export default {
  async fetch(request, env) {
    const corsHeaders = getCorsHeaders(request);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

    const url = new URL(request.url);

    if (url.pathname !== '/api/cedula') return responder(request, { error: true, error_str: 'NOT_FOUND' }, 404);
    if (request.method !== 'GET') return error(request, 'URL_ERROR', 405);
    if (!env.CEDULA_TOKEN) return error(request, 'TOKEN_MISSING', 500);

    if (excede(request.headers.get('CF-Connecting-IP') || 'desconocida')) {
      return error(request, 'RATE_LIMIT', 429);
    }

    const cedula = (url.searchParams.get('cedula') || '').replace(/\D/g, '');
    const nacionalidad = (url.searchParams.get('nacionalidad') || 'v').toLowerCase();

    if (!/^\d{5,10}$/.test(cedula)) return error(request, 'URL_ERROR', 400);
    if (nacionalidad !== 'v' && nacionalidad !== 'e') return error(request, 'URL_ERROR', 400);

    const destino = API + '?app_id=' + APP_ID +
      '&token=' + encodeURIComponent(env.CEDULA_TOKEN) +
      '&nacionalidad=' + nacionalidad +
      '&cedula=' + cedula;

    try {
      const api = await fetch(destino, { headers: { Accept: 'application/json' } });
      return new Response(await api.text(), {
        status: api.status,
        headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json; charset=utf-8' })
      });
    } catch (e) {
      return error(request, 'UPSTREAM_ERROR', 502);
    }
  }
};
