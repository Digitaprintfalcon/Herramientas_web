(function (global) {
  'use strict';

  var HW = global.HW || (global.HW = {});

  function getConfig() {
    var cfg = global.HW_CEDULA_CONFIG || global.HW_DNI_CONFIG || {};
    var proxyUrl = cfg.proxyUrl || '';
    if (global.location && global.location.protocol === 'file:') {
      // En file:// el proxy podría no aplicarse, pero mantenemos la lógica
    }
    return {
      proxyUrl: proxyUrl,
      timeout: cfg.timeout || 12000
    };
  }

  function configFalta() {
    var cfg = getConfig();
    return !cfg.proxyUrl;
  }

  function formatearCedula(n, pref) {
    if (!n) return '';
    var num = String(n).replace(/\D/g, '');
    if (!num) return '';
    var p = pref || 'V';
    p = String(p).toUpperCase().replace(/[^VE]/g, 'V');
    // Formato con puntos
    var out = num;
    if (out.length > 7) out = out.slice(0, 2) + '.' + out.slice(2, 5) + '.' + out.slice(5);
    else if (out.length > 4) out = out.slice(0, 2) + '.' + out.slice(2, 5) + '.' + out.slice(5);
    else if (out.length > 1) out = out.slice(0, 2) + '.' + out.slice(2);
    return p + '-' + out;
  }

  function nombreCompleto(data) {
    if (!data) return '';
    var partes = [
      data.primer_nombre,
      data.segundo_nombre,
      data.primer_apellido,
      data.segundo_apellido
    ].filter(function (x) { return x && String(x).trim(); });
    return partes.join(' ').replace(/\s+/g, ' ').trim();
  }

  function mensajeApi(cuerpo) {
    if (!cuerpo) return 'Error al consultar cédula.';
    if (cuerpo.error_str) {
      var e = String(cuerpo.error_str);
      if (e === 'RECORD_NOT_FOUND') return 'No se encontró registro para esa cédula.';
      if (e === 'RATE_LIMIT') return 'Se excedió el límite de consultas. Intenta nuevamente en unos minutos.';
      if (e === 'UPSTREAM_ERROR') return 'Error al consultar la API. Intenta nuevamente.';
      if (e === 'TOKEN_MISSING' || e === 'INVALID_TOKEN') return 'Error de configuración del proxy.';
      if (e === 'NOT_FOUND') return 'No se encontró registro.';
      if (e === 'URL_ERROR') return 'Error de configuración.';
      return 'Error: ' + e;
    }
    if (cuerpo.message) return cuerpo.message;
    if (cuerpo.error) return cuerpo.error;
    return 'Error al consultar cédula.';
  }

  function derivarNacionalidadDesdeInput(el) {
    if (!el) return 'v';
    var v = String(el.value || '').toLowerCase();
    if (v.indexOf('extr') !== -1) return 'e';
    return 'v';
  }

  function consultar(cedula, nac) {
    var cfg = getConfig();
    if (!cfg.proxyUrl) {
      var err = new Error('Falta configurar proxyUrl en la herramienta de cédulas.');
      err.code = 'NO_PROXY';
      throw err;
    }
    var num = String(cedula || '').replace(/\D/g, '');
    if (!num) {
      var err2 = new Error('Ingresa un número de cédula válido.');
      err2.code = 'INVALID';
      throw err2;
    }
    if (num.length < 5 || num.length > 10) {
      var err3 = new Error('La cédula debe tener entre 5 y 10 dígitos.');
      err3.code = 'INVALID';
      throw err3;
    }
    var nacParam = nac === 'e' ? 'e' : 'v';
    var url = cfg.proxyUrl.replace(/\/$/, '') + '?nacionalidad=' + encodeURIComponent(nacParam) + '&cedula=' + encodeURIComponent(num);

    var ctrl = new AbortController();
    var timer = setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, cfg.timeout);

    return fetch(url, { method: 'GET', cache: 'no-store', signal: ctrl.signal })
      .then(function (res) {
        clearTimeout(timer);
        return res.json().catch(function () { throw new Error('Respuesta inválida del servidor.'); });
      })
      .then(function (json) {
        if (!json || json.success === false) {
          throw new Error(mensajeApi(json || {}));
        }
        var data = json.data || json;
        if (!data || !nombreCompleto(data)) {
          throw new Error('No se encontraron datos para esta cédula.');
        }
        return data;
      })
      .catch(function (e) {
        clearTimeout(timer);
        if (e && e.name === 'AbortError') {
          throw new Error('La consulta tardó demasiado. Intenta nuevamente.');
        }
        throw e;
      });
  }

  HW.cedula = {
    configFalta: configFalta,
    consultar: consultar,
    formatearCedula: formatearCedula,
    nombreCompleto: nombreCompleto,
    mensajeApi: mensajeApi,
    derivarNacionalidad: derivarNacionalidadDesdeInput,
    getConfig: getConfig
  };

})(window);
