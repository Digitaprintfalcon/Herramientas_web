(function (global) {
  'use strict';

  var HW = global.HW || (global.HW = {});

  var LS_KEY = 'hw_tool_prices';

  var DEFAULTS = {
    version: 1,
    updatedAt: null,
    tools: {
      cotizador: {
        papelCarta: 0,
        impresionColor: 0,
        diseno: 0
      },
      vinil: {
        precioVinilM2: 0,
        precioLaminadoM2: 0
      },
      banner: {
        precioM2: 0
      },
      cut: {
        precioMaterialM2: 0
      },
      dtf: {
        precioMetro: 0
      },
      pvc: {
        precioPvcHoja: 0,
        precioVinilM2: 0,
        precioLaminadoM2: 0
      }
    }
  };

  function getDefaults() {
    return JSON.parse(JSON.stringify(DEFAULTS));
  }

  function load() {
    var base = getDefaults();
    try {
      var raw = (HW.persist && HW.persist.get) ? HW.persist.get(LS_KEY) : localStorage.getItem(LS_KEY);
      if (raw && typeof raw === 'string') raw = JSON.parse(raw);
      if (!raw || typeof raw !== 'object') return base;
      // merge
      base.version = raw.version || 1;
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
      obj.version = obj.version || 1;
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
    exportJSON: exportJSON,
    importJSON: importJSON
  };

})(window);
