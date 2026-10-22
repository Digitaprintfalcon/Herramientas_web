// Configuración de precios por defecto
(function(){
  // Cada campo del modal: [herramienta, clave del esquema]
  var CAMPOS = [
    ['vinil', 'precioVinilM2'],
    ['vinil', 'precioLaminadoM2'],
    ['vinil', 'costoDiseno'],
    ['vinil', 'costoCorte'],
    ['vinil', 'costoInstalacion'],
    ['banner', 'precioM2'],
    ['banner', 'costoLogistica'],
    ['cut', 'precioMaterialM2'],
    ['cut', 'costoPlanchado'],
    ['cut', 'costoInstalacion'],
    ['dtf', 'precioMetro'],
    ['dtf', 'costoPlanchado'],
    ['dtf', 'costoPrenda'],
    ['pvc', 'precioPvcHoja'],
    ['pvc', 'precioVinilM2'],
    ['pvc', 'precioLaminadoM2']
  ];

  function inputId(tool, key){
    return 'pr-' + tool + '-' + key;
  }

  function fmtFecha(iso){
    if (!iso) return '-';
    try {
      var d = new Date(iso);
      return d.toLocaleString();
    } catch(e){ return iso; }
  }

  function cargarForm(){
    if (!window.HW || !window.HW.precios) return;
    var cfg = window.HW.precios.load();
    var t = cfg.tools || {};
    CAMPOS.forEach(function(c){
      var el = document.getElementById(inputId(c[0], c[1]));
      if (!el) return;
      var v = (t[c[0]] || {})[c[1]];
      if (typeof v === 'number' && !isNaN(v)) el.value = v;
    });
    var last = document.getElementById('preciosLastMod');
    if (last) last.textContent = 'Última modificación: ' + fmtFecha(cfg.updatedAt);
  }

  function guardarForm(){
    if (!window.HW || !window.HW.precios) return;
    var cfg = window.HW.precios.load();
    cfg.tools = cfg.tools || {};
    CAMPOS.forEach(function(c){
      var el = document.getElementById(inputId(c[0], c[1]));
      if (!el) return;
      var v = parseFloat(el.value);
      if (isNaN(v)) v = 0;
      cfg.tools[c[0]] = cfg.tools[c[0]] || {};
      cfg.tools[c[0]][c[1]] = v;
    });
    window.HW.precios.save(cfg);
    var last = document.getElementById('preciosLastMod');
    if (last) last.textContent = 'Última modificación: ' + fmtFecha(cfg.updatedAt);
    if (window.HW.toast) window.HW.toast('Precios guardados correctamente');
  }

  function setup(){
    var modal = document.getElementById('preciosConfigModal');
    if (modal) modal.addEventListener('show.bs.modal', cargarForm);
    var btnG = document.getElementById('btnPreciosGuardar'); if (btnG) btnG.onclick = guardarForm;
    var btnR = document.getElementById('btnPreciosReset'); if (btnR) btnR.onclick = function(){ if (confirm('¿Restaurar valores por defecto?')) { if (window.HW.precios) window.HW.precios.reset(); cargarForm(); if (window.HW.toast) window.HW.toast('Valores restaurados'); } };
    var btnE = document.getElementById('btnPreciosExportar'); if (btnE) btnE.onclick = function(){ if (window.HW.precios) window.HW.precios.exportJSON(); };
    var inp = document.getElementById('inputPreciosImportar'); if (inp) inp.onchange = function(){
      if (this.files && this.files[0] && window.HW.precios){
        window.HW.precios.importJSON(this.files[0]).then(function(){ cargarForm(); if (window.HW.toast) window.HW.toast('Precios importados'); }).catch(function(e){ if (window.HW.toast) window.HW.toast(e.message || 'Error al importar', true); });
        this.value = '';
      }
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();
})();
