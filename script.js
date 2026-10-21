

// Configuración de precios por defecto
(function(){
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
    var map = [
      ['pr-cotizador-papelCarta', t.cotizador && t.cotizador.papelCarta],
      ['pr-cotizador-impresionColor', t.cotizador && t.cotizador.impresionColor],
      ['pr-cotizador-diseno', t.cotizador && t.cotizador.diseno],
      ['pr-vinil-precioVinilM2', t.vinil && t.vinil.precioVinilM2],
      ['pr-vinil-precioLaminadoM2', t.vinil && t.vinil.precioLaminadoM2],
      ['pr-banner-precioM2', t.banner && t.banner.precioM2],
      ['pr-cut-precioMaterialM2', t.cut && t.cut.precioMaterialM2],
      ['pr-dtf-precioMetro', t.dtf && t.dtf.precioMetro],
      ['pr-pvc-precioPvcHoja', t.pvc && t.pvc.precioPvcHoja],
      ['pr-pvc-precioVinilM2', t.pvc && t.pvc.precioVinilM2],
      ['pr-pvc-precioLaminadoM2', t.pvc && t.pvc.precioLaminadoM2]
    ];
    map.forEach(function(m){
      var el = document.getElementById(m[0]);
      if (el && m[1] !== undefined && m[1] !== null) el.value = m[1];
    });
    var last = document.getElementById('preciosLastMod');
    if (last) last.textContent = 'Última modificación: ' + fmtFecha(cfg.updatedAt);
  }
  function guardarForm(){
    if (!window.HW || !window.HW.precios) return;
    var cfg = window.HW.precios.load();
    cfg.tools = cfg.tools || {};
    function g(id){ var el = document.getElementById(id); if (!el) return undefined; var v = parseFloat(el.value); return isNaN(v) ? 0 : v; }
    cfg.tools.cotizador = cfg.tools.cotizador || {};
    cfg.tools.cotizador.papelCarta = g('pr-cotizador-papelCarta');
    cfg.tools.cotizador.impresionColor = g('pr-cotizador-impresionColor');
    cfg.tools.cotizador.diseno = g('pr-cotizador-diseno');
    cfg.tools.vinil = cfg.tools.vinil || {};
    cfg.tools.vinil.precioVinilM2 = g('pr-vinil-precioVinilM2');
    cfg.tools.vinil.precioLaminadoM2 = g('pr-vinil-precioLaminadoM2');
    cfg.tools.banner = cfg.tools.banner || {};
    cfg.tools.banner.precioM2 = g('pr-banner-precioM2');
    cfg.tools.cut = cfg.tools.cut || {};
    cfg.tools.cut.precioMaterialM2 = g('pr-cut-precioMaterialM2');
    cfg.tools.dtf = cfg.tools.dtf || {};
    cfg.tools.dtf.precioMetro = g('pr-dtf-precioMetro');
    cfg.tools.pvc = cfg.tools.pvc || {};
    cfg.tools.pvc.precioPvcHoja = g('pr-pvc-precioPvcHoja');
    cfg.tools.pvc.precioVinilM2 = g('pr-pvc-precioVinilM2');
    cfg.tools.pvc.precioLaminadoM2 = g('pr-pvc-precioLaminadoM2');
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
