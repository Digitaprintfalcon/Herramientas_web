(function (global) {
  'use strict';

  var HW = global.HW || (global.HW = {});

  var LS_KEY = 'hw_tool_prices';

  // Los defaults son los mismos valores que traía cada herramienta hardcodeada
  // en su HTML. Así el modal muestra precios reales y una integración que lea
  // estas claves nunca deja un precio en 0.
  var DEFAULTS = {
    version: 2,
    updatedAt: null,
    tools: {
      vinil: {
        precioVinilM2: 25,
        precioLaminadoM2: 12,
        costoDiseno: 5,
        costoCorte: 5,
        costoInstalacion: 10
      },
      banner: {
        precioM2: 25,
        costoLogistica: 10
      },
      cut: {
        precioMaterialM2: 3.5,
        costoPlanchado: 0.5,
        costoInstalacion: 1
      },
      dtf: {
        precioMetro: 25,
        costoPlanchado: 1.5,
        costoPrenda: 5
      },
      pvc: {
        precioPvcHoja: 45,
        precioVinilM2: 15,
        precioLaminadoM2: 8
      }
    }
  };

  function getDefaults() {
    return JSON.parse(JSON.stringify(DEFAULTS));
  }

  function load() {
    var base = getDefaults();
    try {
      var raw = (HW.persist && HW.persist.get) ? HW.persist.get(LS_KEY, null) : localStorage.getItem(LS_KEY);
      if (raw && typeof raw === 'string') raw = JSON.parse(raw);
      if (!raw || typeof raw !== 'object') return base;
      // Configuración guardada con una versión anterior: se descarta para no
      // dejar precios en cero (la v1 usaba 0 como "sin configurar").
      if ((raw.version || 1) < 2) return base;
      base.version = raw.version || 2;
      base.updatedAt = raw.updatedAt || null;
      base.tools = base.tools || {};
      if (raw.tools && typeof raw.tools === 'object') {
        Object.keys(raw.tools).forEach(function (k) {
          base.tools[k] = base.tools[k] || {};
          var src = raw.tools[k] || {};
          Object.keys(src).forEach(function (kk) {
            var v = src[kk];
            if (typeof v === 'number' || (typeof v === 'string' && v.trim() !== '')) {
              var nv = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
              if (!isNaN(nv)) base.tools[k][kk] = nv;
            }
          });
        });
      }
      return base;
    } catch (e) {
      return base;
    }
  }

  function save(obj) {
    try {
      if (!obj || typeof obj !== 'object') obj = load();
      obj.version = obj.version || 2;
      obj.updatedAt = new Date().toISOString();
      if (HW.persist && HW.persist.set) HW.persist.set(LS_KEY, obj);
      else localStorage.setItem(LS_KEY, JSON.stringify(obj));
      return true;
    } catch (e) {
      return false;
    }
  }

  function reset() {
    var d = getDefaults();
    d.updatedAt = new Date().toISOString();
    return save(d);
  }

  function list() {
    return load();
  }

  function get(tool, key) {
    var cfg = load();
    var t = cfg.tools && cfg.tools[tool];
    if (!t) return null;
    if (key === undefined) return t;
    return (t[key] !== undefined && t[key] !== null) ? t[key] : null;
  }

  function set(tool, key, val) {
    var cfg = load();
    cfg.tools = cfg.tools || {};
    cfg.tools[tool] = cfg.tools[tool] || {};
    var nv = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
    if (isNaN(nv)) nv = 0;
    cfg.tools[tool][key] = nv;
    return save(cfg);
  }

  // Aplica los precios guardados a los inputs de una herramienta.
  // mapa = { claveEsquema: idDelInput }
  function aplicar(tool, mapa) {
    if (!global.document || !mapa) return 0;
    var t = get(tool);
    if (!t) return 0;
    var n = 0;
    Object.keys(mapa).forEach(function (key) {
      var el = global.document.getElementById(mapa[key]);
      if (!el) return;
      var v = t[key];
      if (typeof v !== 'number' || isNaN(v)) return;
      el.value = v;
      n++;
    });
    return n;
  }

  function exportJSON() {
    var cfg = load();
    var blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'precios-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importJSON(file) {
    return new Promise(function (resolve, reject) {
      if (!file) return reject(new Error('Archivo no válido'));
      var fr = new FileReader();
      fr.onload = function (e) {
        try {
          var data = JSON.parse(e.target.result);
          if (!data || typeof data !== 'object' || !data.tools || typeof data.tools !== 'object') {
            throw new Error('Estructura inválida. Se requiere { tools: {...} }');
          }
          if ((data.version || 1) < 2) {
            throw new Error('El archivo es de una versión anterior (precios en 0). Exporta la configuración actual y edítala.');
          }
          var cfg = load();
          Object.keys(data.tools).forEach(function (k) {
            cfg.tools[k] = cfg.tools[k] || {};
            var src = data.tools[k] || {};
            Object.keys(src).forEach(function (kk) {
              var v = src[kk];
              if (typeof v === 'number') cfg.tools[k][kk] = v;
              else if (typeof v === 'string' && v.trim() !== '') {
                var nv = parseFloat(String(v).replace(',', '.'));
                if (!isNaN(nv)) cfg.tools[k][kk] = nv;
              }
            });
          });
          cfg.updatedAt = new Date().toISOString();
          save(cfg);
          resolve(cfg);
        } catch (err) {
          reject(err);
        }
      };
      fr.onerror = function () { reject(new Error('Error al leer archivo')); };
      fr.readAsText(file);
    });
  }

  HW.precios = {
    getDefaults: getDefaults,
    load: load,
    save: save,
    reset: reset,
    list: list,
    get: get,
    set: set,
    aplicar: aplicar,
    exportJSON: exportJSON,
    importJSON: importJSON
  };

})(window);
