(function () {
  'use strict';

  var estado = {
    quote: null,
    detalle: [],
    bcv: null
  };

  function fmt(n, d) {
    return Number(n).toLocaleString('es-ES', {
      minimumFractionDigits: d || 0,
      maximumFractionDigits: d || 0
    });
  }

  function val(id) {
    return parseFloat(document.getElementById(id).value) || 0;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var P = HW.pricing.PRECIOS;
    var C = HW.pricing.COSTOS;
    var S = HW.pricing.SERVICIOS;
    var A = HW.pricing.ACCESORIOS;

    var ancho = document.getElementById('anchoDiseno');
    var alto = document.getElementById('altoDiseno');
    var cantidad = document.getElementById('cantidadPiezas');
    var costoM2 = document.getElementById('costoM2');
    var margen = document.getElementById('margen');
    var incluirLogistica = document.getElementById('incluirLogistica');
    var logistica = document.getElementById('costoLogistica');
    var modoLogistica = document.getElementById('modoLogistica');
    var incluirOjales = document.getElementById('incluirOjales');
    var cantidadOjales = document.getElementById('cantidadOjales');
    var costoOjal = document.getElementById('costoOjal');
    var incluirBolsillos = document.getElementById('incluirBolsillos');
    var cantidadBolsillos = document.getElementById('cantidadBolsillos');
    var costoBolsillo = document.getElementById('costoBolsillo');
    var costoTubos = document.getElementById('costoTubos');

    estado.bcv = HW.bcv.mount(document.getElementById('bcvBox'));

    function defaults() {
      HW.pricing.poblar({
        costoM2: C.bannerM2,
        margen: P.margen,
        costoLogistica: S.logistica.precio,
        cantidadOjales: A.ojales.cantidad,
        cantidadBolsillos: A.bolsillos.cantidad,
        costoOjal: A.ojales.precio,
        costoBolsillo: A.bolsillos.precio,
        costoTubos: A.tubos.precio
      });
      if (modoLogistica) modoLogistica.value = 'lote';
      incluirLogistica.checked = false;
      incluirOjales.checked = false;
      incluirBolsillos.checked = true;
      sincronizarAccesorios();
    }

    function sincronizarAccesorios() {
      var conOjales = incluirOjales.checked;
      var conBolsillos = incluirBolsillos.checked;
      var conLogistica = incluirLogistica.checked;

      cantidadOjales.disabled = !conOjales;
      if (costoOjal) costoOjal.disabled = !conOjales;
      cantidadBolsillos.disabled = !conBolsillos;
      if (costoBolsillo) costoBolsillo.disabled = !conBolsillos;
      if (costoTubos) costoTubos.disabled = !conBolsillos;
      logistica.disabled = !conLogistica;
      if (modoLogistica) modoLogistica.disabled = !conLogistica;

      document.getElementById('cuerpoOjales').classList.toggle('d-none', !conOjales);
      document.getElementById('cuerpoBolsillos').classList.toggle('d-none', !conBolsillos);
    }

    function aplicarExclusividad(origen) {
      if (origen === incluirOjales && incluirOjales.checked) {
        incluirBolsillos.checked = false;
      }
      if (origen === incluirBolsillos && incluirBolsillos.checked) {
        incluirOjales.checked = false;
      }
    }

    function calcular() {
      var piezas = Math.max(0, parseFloat(cantidad.value) || 0);
      var area = HW.pricing.areaM2(val('anchoDiseno'), val('altoDiseno'));
      var margenPct = Math.max(0, val('margen'));
      var costoBase = HW.pricing.costoArea(area, Math.max(0, val('costoM2'))) * piezas;

      var materiales = [{
        nombre: 'Banner',
        detalle: fmt(area, 3) + ' m² × ' + fmt(piezas, 0) + ' ud',
        unidad: 'ud',
        costoBase: costoBase,
        mermaPct: 0,
        margenPct: margenPct
      }];

      var servicios = [];
      if (incluirLogistica.checked) {
        var modoLog = modoLogistica ? modoLogistica.value : 'lote';
        servicios.push({
          nombre: 'Logística',
          precio: Math.max(0, val('costoLogistica')),
          modo: modoLog,
          detalle: modoLog === 'pieza' ? 'por unidad' : 'por lote'
        });
      }

      var accesorios = [];
      if (incluirOjales.checked) {
        accesorios.push({
          nombre: 'Ojales',
          precio: costoOjal ? Math.max(0, val('costoOjal')) : Math.max(0, A.ojales.precio),
          cantidad: Math.max(0, parseInt(cantidadOjales.value, 10) || 0)
        });
      }
      if (incluirBolsillos.checked) {
        accesorios.push({
          nombre: 'Bolsillos',
          precio: Math.max(0, val('costoBolsillo')),
          cantidad: Math.max(0, parseInt(cantidadBolsillos.value, 10) || 0)
        });
        accesorios.push({
          nombre: 'Tubos',
          precio: Math.max(0, val('costoTubos')),
          cantidad: A.tubos.cantidad,
          detalle: 'por pieza'
        });
      }

      estado.detalle = [
        fmt(piezas, 0) + ' ' + (piezas === 1 ? 'unidad' : 'unidades') + ' de ' +
          fmt(val('anchoDiseno'), 1) + ' x ' + fmt(val('altoDiseno'), 1) + ' cm',
        'Área por unidad: ' + fmt(area, 3) + ' m²'
      ];

      estado.quote = HW.quote.build({
        titulo: 'Pendones',
        cantidad: piezas,
        detalle: estado.detalle,
        materiales: materiales,
        servicios: servicios,
        accesorios: accesorios,
        margenPct: margenPct
      });

      HW.quote.renderResumen(document.getElementById('resumen'), estado.quote);
      if (estado.bcv) estado.bcv.setUsd(estado.quote.total);
    }

    function reiniciar() {
      ancho.value = '10';
      alto.value = '10';
      cantidad.value = '1';
      defaults();
      calcular();
    }

    [
      ancho, alto, cantidad, costoM2, margen,
      logistica, cantidadOjales, cantidadBolsillos, costoOjal, costoBolsillo, costoTubos
    ].forEach(function (el) {
      if (el) el.addEventListener('input', calcular);
    });

    if (modoLogistica) {
      modoLogistica.addEventListener('change', calcular);
    }

    incluirLogistica.addEventListener('change', function () {
      sincronizarAccesorios();
      calcular();
    });

    [incluirOjales, incluirBolsillos].forEach(function (el) {
      el.addEventListener('change', function () {
        aplicarExclusividad(el);
        sincronizarAccesorios();
        calcular();
      });
    });

    document.getElementById('btnReiniciar').addEventListener('click', reiniciar);
    document.getElementById('btnCopiar').addEventListener('click', function () {
      HW.quote.copiar(estado.quote, {
        titulo: 'Pendones',
        detalle: estado.detalle,
        tasa: estado.bcv ? estado.bcv.getTasa() : 0
      });
    });
    document.getElementById('btnCopiarTotal').addEventListener('click', function () {
      HW.quote.copiarTotal(estado.quote, { tasa: estado.bcv ? estado.bcv.getTasa() : 0 });
    });
    document.querySelectorAll('[data-banner-ancho]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        ancho.value = btn.getAttribute('data-banner-ancho');
        alto.value = btn.getAttribute('data-banner-alto');
        calcular();
      });
    });

    var btnGuardarHistBanner = document.getElementById('btnGuardarHistBanner');
    var btnLimpiarHistBanner = document.getElementById('btnLimpiarHistBanner');
    if (btnGuardarHistBanner) btnGuardarHistBanner.addEventListener('click', guardarHistorialBanner);
    if (btnLimpiarHistBanner) btnLimpiarHistBanner.addEventListener('click', limpiarHistorialBanner);
    renderHistorialBanner();

    document.getElementById('btnGenerador').addEventListener('click', function () {
      HW.quote.enviarAlGenerador(estado.quote, {
        titulo: 'Pendones',
        detalle: estado.detalle
      });
    });

    defaults();
    calcular();
  });
})();


  var CLAVE_HIST_BANNER = 'hw_hist_banner';
  var MAX_HIST_BANNER = 20;

  function obtenerHistorialBanner() {
    if (window.HW && HW.persist && HW.persist.get) {
      var v = HW.persist.get(CLAVE_HIST_BANNER, []);
      return Array.isArray(v) ? v : [];
    }
    try {
      var raw = localStorage.getItem(CLAVE_HIST_BANNER);
      var v2 = raw ? JSON.parse(raw) : [];
      return Array.isArray(v2) ? v2 : [];
    } catch (e) { return []; }
  }

  function guardarHistorialBannerArr(arr) {
    if (window.HW && HW.persist && HW.persist.set) {
      HW.persist.set(CLAVE_HIST_BANNER, arr);
      return;
    }
    try { localStorage.setItem(CLAVE_HIST_BANNER, JSON.stringify(arr)); } catch (e) {}
  }

  function generarResumenCortoBanner() {
    try {
      var a = val('anchoDiseno');
      var al = val('altoDiseno');
      var c = val('cantidadPiezas');
      var p = [];
      if (document.getElementById('incluirBolsillos').checked) p.push('Bolsillos');
      if (document.getElementById('incluirOjales').checked) p.push('Ojales');
      if (document.getElementById('incluirLogistica').checked) p.push('Logística');
      return a + ' x ' + al + ' cm · ' + c + ' ud' + (p.length ? ' · ' + p.join(' + ') : '');
    } catch (e) { return ''; }
  }

  function obtenerSnapshotBanner() {
    return {
      ancho: val('anchoDiseno'),
      alto: val('altoDiseno'),
      cantidad: val('cantidadPiezas'),
      costoM2: val('costoM2'),
      margen: val('margen'),
      incluirLogistica: document.getElementById('incluirLogistica').checked,
      modoLogistica: document.getElementById('modoLogistica').value,
      costoLogistica: val('costoLogistica'),
      incluirOjales: document.getElementById('incluirOjales').checked,
      cantidadOjales: val('cantidadOjales'),
      costoOjal: val('costoOjal'),
      incluirBolsillos: document.getElementById('incluirBolsillos').checked,
      cantidadBolsillos: val('cantidadBolsillos'),
      costoBolsillo: val('costoBolsillo'),
      costoTubos: val('costoTubos')
    };
  }

  function cargarDesdeHistorialBanner(h) {
    if (!h || !h.datos) return;
    var d = h.datos;
    document.getElementById('anchoDiseno').value = d.ancho != null ? d.ancho : 10;
    document.getElementById('altoDiseno').value = d.alto != null ? d.alto : 10;
    document.getElementById('cantidadPiezas').value = d.cantidad != null ? d.cantidad : 1;
    document.getElementById('costoM2').value = d.costoM2 != null ? d.costoM2 : '';
    document.getElementById('margen').value = d.margen != null ? d.margen : '';
    document.getElementById('costoLogistica').value = d.costoLogistica != null ? d.costoLogistica : 0;
    if (document.getElementById('modoLogistica')) document.getElementById('modoLogistica').value = d.modoLogistica || 'lote';
    document.getElementById('incluirLogistica').checked = !!d.incluirLogistica;
    document.getElementById('incluirOjales').checked = !!d.incluirOjales;
    document.getElementById('cantidadOjales').value = d.cantidadOjales != null ? d.cantidadOjales : 4;
    if (document.getElementById('costoOjal')) document.getElementById('costoOjal').value = d.costoOjal != null ? d.costoOjal : 1;
    document.getElementById('incluirBolsillos').checked = !!d.incluirBolsillos;
    document.getElementById('cantidadBolsillos').value = d.cantidadBolsillos != null ? d.cantidadBolsillos : 2;
    document.getElementById('costoBolsillo').value = d.costoBolsillo != null ? d.costoBolsillo : 2;
    document.getElementById('costoTubos').value = d.costoTubos != null ? d.costoTubos : 10;
    if (typeof aplicarExclusividad === 'function') {
      if (document.getElementById('incluirOjales').checked) aplicarExclusividad(document.getElementById('incluirOjales'));
      else if (document.getElementById('incluirBolsillos').checked) aplicarExclusividad(document.getElementById('incluirBolsillos'));
    }
    if (typeof sincronizarAccesorios === 'function') sincronizarAccesorios();
    if (typeof calcular === 'function') calcular();
    if (window.HW && HW.toast) HW.toast('Cotización cargada del historial');
  }

  function renderHistorialBanner() {
    var hist = obtenerHistorialBanner();
    var box = document.getElementById('histBanner');
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
      btn.innerHTML = '<div class="d-flex justify-content-between w-100"><strong>' + (h.fecha || '') + '</strong><span class="text-success">' + totalTxt + '</span></div>' +
                      '<small class="text-muted">' + (h.resumen || '') + '</small>';
      btn.addEventListener('click', function(){ cargarDesdeHistorialBanner(h); });
      box.appendChild(btn);
    });
  }

  function guardarHistorialBanner() {
    if (!estado.quote || !(estado.quote.total > 0)) {
      if (window.HW && HW.toast) HW.toast('No hay cotización válida para guardar', true);
      return;
    }
    var hist = obtenerHistorialBanner();
    var item = {
      id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2,5),
      ts: Date.now(),
      fecha: new Date().toLocaleString('es-VE'),
      titulo: 'Pendones',
      total: estado.quote.total,
      unitario: estado.quote.unitario,
      cantidad: estado.quote.cantidad,
      resumen: generarResumenCortoBanner(),
      datos: obtenerSnapshotBanner()
    };
    hist.unshift(item);
    hist = hist.slice(0, MAX_HIST_BANNER);
    guardarHistorialBannerArr(hist);
    renderHistorialBanner();
    if (window.HW && HW.toast) HW.toast('Cotización guardada en historial');
  }

  function limpiarHistorialBanner() {
    if (!confirm('¿Limpiar todo el historial de este cotizador?')) return;
    guardarHistorialBannerArr([]);
    renderHistorialBanner();
    if (window.HW && HW.toast) HW.toast('Historial limpiado');
  }
