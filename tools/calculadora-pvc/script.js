(function () {
  'use strict';

  var estado = {
    quote: null,
    detalle: [],
    bcv: null
  };
  window.estadoPvc = estado;

  function fmt(n, d) {
    return Number(n).toLocaleString('es-ES', {
      minimumFractionDigits: d || 0,
      maximumFractionDigits: d || 0
    });
  }

  function val(id) {
    var el = document.getElementById(id);
    if (!el) return 0;
    return parseFloat(el.value) || 0;
  }

  function checked(id) {
    return document.getElementById(id).checked;
  }

  function alternarCuerpo(id, activo) {
    document.getElementById(id).classList.toggle('d-none', !activo);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var P = HW.pricing.PRECIOS;
    var A = HW.pricing.ACCESORIOS;
    var C = HW.pricing.COSTOS;

    var ancho = document.getElementById('trabajoAncho');
    var alto = document.getElementById('trabajoLargo');
    var cantidad = document.getElementById('trabajoCantidad');
    var margen = document.getElementById('margen');
    var checkPvc = document.getElementById('checkPvc');
    var checkVinil = document.getElementById('checkVinil');
    var checkLaminado = document.getElementById('checkLaminado');
    var checkSeparadores = document.getElementById('checkSeparadores');
    var costoSeparador = document.getElementById('costoSeparador');
    var dobleLado = document.getElementById('checkVinilDobleLado');

    estado.bcv = HW.bcv.mount(document.getElementById('bcvBox'));

    function defaults() {
      ancho.value = '50';
      alto.value = '30';
      cantidad.value = '1';
      HW.pricing.poblar({
        margen: P.margen,
        baseLargo: P.pvc.baseLargoCm,
        baseAncho: P.pvc.baseAnchoCm,
        costoLamina: P.pvc.costoHoja,
        pvcMerma: P.pvc.merma,
        vinilCostoM2: C.pvcVinilM2,
        vinilMerma: C.pvcVinilMerma,
        laminadoCostoM2: C.pvcLaminadoM2,
        cantidadSeparadores: A.separadores.cantidad,
        costoSeparador: A.separadores.precio
      });
      checkPvc.checked = true;
      checkVinil.checked = true;
      checkLaminado.checked = false;
      checkSeparadores.checked = true;
      dobleLado.checked = false;
      sincronizarCuerpos();
    }

    function sincronizarCuerpos() {
      alternarCuerpo('cuerpoPvc', checkPvc.checked);
      alternarCuerpo('cuerpoVinil', checkVinil.checked);
      alternarCuerpo('cuerpoLaminado', checkLaminado.checked);
      checkSeparadores.disabled = !checkPvc.checked;
      if (costoSeparador) costoSeparador.disabled = !(checkPvc.checked && checkSeparadores.checked);
      alternarCuerpo('cuerpoSeparadores', checkPvc.checked && checkSeparadores.checked);
    }

    function calcular() {
      var tAncho = Math.max(0, val('trabajoAncho'));
      var tAlto = Math.max(0, val('trabajoLargo'));
      var piezas = Math.max(0, parseFloat(cantidad.value) || 0);
      var area = HW.pricing.areaM2(tAncho, tAlto);
      var margenPct = Math.max(0, val('margen'));
      var materiales = [];

      var incluyePvc = checkPvc.checked;
      var excedePvc = false;

      if (incluyePvc) {
        var baseLargo = Math.max(0, val('baseLargo'));
        var baseAncho = Math.max(0, val('baseAncho'));
        var areaBase = HW.pricing.areaM2(baseLargo, baseAncho);
        var costoM2 = areaBase > 0 ? Math.max(0, val('costoLamina')) / areaBase : 0;
        materiales.push({
          nombre: 'Lámina de PVC',
          detalle: fmt(tAncho, 1) + ' x ' + fmt(tAlto, 1) + ' cm',
          unidad: 'ud',
          costoBase: HW.pricing.costoArea(area, costoM2),
          mermaPct: Math.max(0, val('pvcMerma')),
          margenPct: margenPct
        });
        excedePvc = tAncho > baseAncho || tAlto > baseLargo;
      }

      if (checkVinil.checked) {
        var costoVinil = HW.pricing.costoArea(area, Math.max(0, val('vinilCostoM2')));
        if (dobleLado.checked) costoVinil *= 2;
        materiales.push({
          nombre: 'Impresión en vinil',
          detalle: dobleLado.checked ? '2 caras' : '1 cara',
          unidad: 'ud',
          costoBase: costoVinil,
          mermaPct: Math.max(0, val('vinilMerma')),
          margenPct: margenPct
        });
      }

      if (checkLaminado.checked) {
        materiales.push({
          nombre: 'Laminado',
          detalle: 'Cobertura por área',
          unidad: 'ud',
          costoBase: HW.pricing.costoArea(area, Math.max(0, val('laminadoCostoM2'))),
          mermaPct: 0,
          margenPct: margenPct
        });
      }

      var accesorios = [];
      var incluyeSeparadores = incluyePvc && checkSeparadores.checked;
      if (incluyeSeparadores) {
        var precioSep = costoSeparador ? Math.max(0, val('costoSeparador')) : Math.max(0, A.separadores.precio);
        accesorios.push({
          nombre: 'Separadores',
          precio: precioSep,
          cantidad: Math.max(0, parseInt(document.getElementById('cantidadSeparadores').value, 10) || 0)
        });
      }

      estado.detalle = [
        fmt(piezas, 0) + ' ' + (piezas === 1 ? 'unidad' : 'unidades') + ' de ' +
          fmt(tAncho, 1) + ' x ' + fmt(tAlto, 1) + ' cm',
        'Área por unidad: ' + fmt(area, 3) + ' m²'
      ];

      estado.quote = HW.quote.build({
        titulo: 'PVC · Vinil · Laminado',
        cantidad: piezas,
        detalle: estado.detalle,
        materiales: materiales,
        accesorios: accesorios,
        margenPct: margenPct
      });

      HW.quote.renderResumen(document.getElementById('resumen'), estado.quote);
      if (estado.bcv) estado.bcv.setUsd(estado.quote.total);
      document.getElementById('alertaExceso').classList.toggle('d-none', !(incluyePvc && excedePvc));
    }

    function reiniciar() {
      defaults();
      calcular();
    }

    [ancho, alto, cantidad, margen, document.getElementById('baseLargo'),
      document.getElementById('baseAncho'), document.getElementById('costoLamina'),
      document.getElementById('pvcMerma'), document.getElementById('vinilCostoM2'),
      document.getElementById('vinilMerma'), document.getElementById('laminadoCostoM2'),
      document.getElementById('cantidadSeparadores'), costoSeparador].forEach(function (el) {
      if (el) el.addEventListener('input', calcular);
    });

    [checkPvc, checkVinil, checkLaminado, checkVinilDobleLado, checkSeparadores].forEach(function (el) {
      el.addEventListener('change', function () {
        sincronizarCuerpos();
        calcular();
      });
    });

    document.querySelectorAll('[data-ancho]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        ancho.value = btn.getAttribute('data-ancho');
        alto.value = btn.getAttribute('data-alto');
        calcular();
      });
    });

    document.getElementById('btnReiniciar').addEventListener('click', reiniciar);
    document.getElementById('btnCopiar').addEventListener('click', function () {
      HW.quote.copiar(estado.quote, {
        titulo: 'PVC · Vinil · Laminado',
        detalle: estado.detalle,
        tasa: estado.bcv ? estado.bcv.getTasa() : 0
      });
    });
    document.getElementById('btnCopiarTotal').addEventListener('click', function () {
      HW.quote.copiarTotal(estado.quote, { tasa: estado.bcv ? estado.bcv.getTasa() : 0 });
    });
    var CLAVE_HIST_PVC = 'hw_hist_pvc';
    var MAX_HIST_PVC = 20;

    function obtenerHistorialPvc() {
      if (window.HW && HW.persist && HW.persist.get) {
        var v = HW.persist.get(CLAVE_HIST_PVC, []);
        return Array.isArray(v) ? v : [];
      }
      try {
        var raw = localStorage.getItem(CLAVE_HIST_PVC);
        var v2 = raw ? JSON.parse(raw) : [];
        return Array.isArray(v2) ? v2 : [];
      } catch (e) { return []; }
    }

    function guardarHistorialPvcArr(arr) {
      if (window.HW && HW.persist && HW.persist.set) {
        HW.persist.set(CLAVE_HIST_PVC, arr);
        return;
      }
      try { localStorage.setItem(CLAVE_HIST_PVC, JSON.stringify(arr)); } catch (e) {}
    }

    function generarResumenCortoPvc() {
      try {
        var p = [];
        if (document.getElementById('checkPvc').checked) p.push('PVC');
        if (document.getElementById('checkVinil').checked) p.push('Vinil');
        if (document.getElementById('checkLaminado').checked) p.push('Laminado');
        if (document.getElementById('checkSeparadores').checked && document.getElementById('checkPvc').checked) p.push('Sep.');
        return (val('trabajoAncho')||0) + ' x ' + (val('trabajoLargo')||0) + ' cm · ' + (val('trabajoCantidad')||1) + ' ud' + (p.length ? ' · ' + p.join(' + ') : '');
      } catch (e) { return ''; }
    }

    function obtenerSnapshotPvc() {
      return {
        trabajoAncho: val('trabajoAncho'),
        trabajoLargo: val('trabajoLargo'),
        trabajoCantidad: val('trabajoCantidad'),
        margen: val('margen'),
        checkPvc: document.getElementById('checkPvc').checked,
        checkVinil: document.getElementById('checkVinil').checked,
        checkLaminado: document.getElementById('checkLaminado').checked,
        checkSeparadores: document.getElementById('checkSeparadores').checked,
        checkVinilDobleLado: document.getElementById('checkVinilDobleLado').checked,
        baseLargo: val('baseLargo'),
        baseAncho: val('baseAncho'),
        costoLamina: val('costoLamina'),
        pvcMerma: val('pvcMerma'),
        vinilCostoM2: val('vinilCostoM2'),
        vinilMerma: val('vinilMerma'),
        laminadoCostoM2: val('laminadoCostoM2'),
        cantidadSeparadores: val('cantidadSeparadores'),
        costoSeparador: val('costoSeparador')
      };
    }

    function cargarDesdeHistorialPvc(h) {
      if (!h || !h.datos) return;
      var d = h.datos;
      document.getElementById('trabajoAncho').value = d.trabajoAncho != null ? d.trabajoAncho : 50;
      document.getElementById('trabajoLargo').value = d.trabajoLargo != null ? d.trabajoLargo : 30;
      document.getElementById('trabajoCantidad').value = d.trabajoCantidad != null ? d.trabajoCantidad : 1;
      document.getElementById('margen').value = d.margen != null ? d.margen : 40;
      document.getElementById('checkPvc').checked = d.checkPvc !== false;
      document.getElementById('checkVinil').checked = d.checkVinil !== false;
      document.getElementById('checkLaminado').checked = !!d.checkLaminado;
      document.getElementById('checkSeparadores').checked = d.checkSeparadores !== false;
      document.getElementById('checkVinilDobleLado').checked = !!d.checkVinilDobleLado;
      document.getElementById('baseLargo').value = d.baseLargo != null ? d.baseLargo : 244;
      document.getElementById('baseAncho').value = d.baseAncho != null ? d.baseAncho : 122;
      document.getElementById('costoLamina').value = d.costoLamina != null ? d.costoLamina : 45;
      document.getElementById('pvcMerma').value = d.pvcMerma != null ? d.pvcMerma : 10;
      document.getElementById('vinilCostoM2').value = d.vinilCostoM2 != null ? d.vinilCostoM2 : 15;
      document.getElementById('vinilMerma').value = d.vinilMerma != null ? d.vinilMerma : 10;
      document.getElementById('laminadoCostoM2').value = d.laminadoCostoM2 != null ? d.laminadoCostoM2 : 8;
      document.getElementById('cantidadSeparadores').value = d.cantidadSeparadores != null ? d.cantidadSeparadores : 4;
      if (document.getElementById('costoSeparador')) document.getElementById('costoSeparador').value = d.costoSeparador != null ? d.costoSeparador : 2;
      if (typeof sincronizarCuerpos === 'function') sincronizarCuerpos();
      if (typeof calcular === 'function') calcular();
      if (window.HW && HW.toast) HW.toast('Cotización cargada del historial');
    }

    function renderHistorialPvc() {
      var hist = obtenerHistorialPvc();
      var box = document.getElementById('histPvc');
      if (!box) return;
      if (!hist.length) {
        box.innerHTML = '<div class="text-center small py-3 text-muted">Sin cotizaciones guardadas.</div>';
        return;
      }
      box.innerHTML = '';
      hist.forEach(function(h) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'hist-item d-flex flex-column align-items-start text-start w-100 mb-1';
        var totalTxt = window.HW && HW.fmtUsd ? HW.fmtUsd(h.total || 0) : ('$' + (h.total||0));
        var esc = (window.HW && HW.escapeHtml) ? HW.escapeHtml : function (v) { return String(v == null ? '' : v); };
        var titulo = h.nombre || h.fecha || '';
        var lineaFecha = h.nombre ? '<small class="text-muted d-block">' + esc(h.fecha || '') + '</small>' : '';
        btn.innerHTML = '<div class="d-flex justify-content-between w-100"><strong>' + esc(titulo) + '</strong><span class="text-success">' + totalTxt + '</span></div>' +
                        '<small class="text-muted d-block">' + esc(h.resumen || '') + '</small>' +
                        (h.nota ? '<small class="text-muted d-block fst-italic">' + esc(h.nota) + '</small>' : '') +
                        lineaFecha;
        btn.addEventListener('click', function(){ cargarDesdeHistorialPvc(h); });
        box.appendChild(btn);
      });
    }

    function guardarHistorialPvc() {
      if (!window.estadoPvc || !window.estadoPvc.quote || !(window.estadoPvc.quote.total > 0)) {
        if (window.HW && HW.toast) HW.toast('No hay cotización válida para guardar', true);
        return;
      }
      var hist = obtenerHistorialPvc();
      var nombreEl = document.getElementById('histNombrePvc');
      var notaEl = document.getElementById('histNotaPvc');
      var nombre = nombreEl ? nombreEl.value.trim() : '';
      var nota = notaEl ? notaEl.value.trim() : '';
      var item = {
        id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2,5),
        ts: Date.now(),
        fecha: new Date().toLocaleString('es-VE'),
        titulo: 'PVC',
        nombre: nombre,
        nota: nota,
        total: window.estadoPvc.quote.total,
        unitario: window.estadoPvc.quote.unitario,
        cantidad: window.estadoPvc.quote.cantidad,
        resumen: generarResumenCortoPvc(),
        datos: obtenerSnapshotPvc()
      };
      hist.unshift(item);
      hist = hist.slice(0, MAX_HIST_PVC);
      guardarHistorialPvcArr(hist);
      renderHistorialPvc();
      if (window.HW && HW.toast) HW.toast('Cotización guardada en historial');
      if (nombreEl) nombreEl.value = '';
      if (notaEl) notaEl.value = '';
    }

    function limpiarHistorialPvc() {
      if (!confirm('¿Limpiar todo el historial de este cotizador?')) return;
      guardarHistorialPvcArr([]);
      renderHistorialPvc();
      if (window.HW && HW.toast) HW.toast('Historial limpiado');
    }

    var btnGuardarHistPvc = document.getElementById('btnGuardarHistPvc');
    var btnLimpiarHistPvc = document.getElementById('btnLimpiarHistPvc');
    if (btnGuardarHistPvc) btnGuardarHistPvc.addEventListener('click', guardarHistorialPvc);
    if (btnLimpiarHistPvc) btnLimpiarHistPvc.addEventListener('click', limpiarHistorialPvc);
    renderHistorialPvc();

    document.getElementById('btnGenerador').addEventListener('click', function () {
      HW.quote.enviarAlGenerador(estado.quote, {
        titulo: 'PVC · Vinil · Laminado',
        detalle: estado.detalle
      });
    });

    defaults();
    calcular();
  });
})();
