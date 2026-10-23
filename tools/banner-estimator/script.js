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
    var incluirOjales = document.getElementById('incluirOjales');
    var cantidadOjales = document.getElementById('cantidadOjales');
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
        costoBolsillo: A.bolsillos.precio,
        costoTubos: A.tubos.precio
      });
      incluirLogistica.checked = false;
      incluirOjales.checked = false;
      incluirBolsillos.checked = true;
      sincronizarAccesorios();
    }

    function sincronizarAccesorios() {
      var conOjales = incluirOjales.checked;
      var conBolsillos = incluirBolsillos.checked;

      cantidadOjales.disabled = !conOjales;
      cantidadBolsillos.disabled = !conBolsillos;
      costoBolsillo.disabled = !conBolsillos;
      costoTubos.disabled = !conBolsillos;
      logistica.disabled = !incluirLogistica.checked;

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
        servicios.push({
          nombre: 'Logística',
          precio: Math.max(0, val('costoLogistica')),
          modo: 'lote',
          detalle: 'por lote'
        });
      }

      var accesorios = [];
      if (incluirOjales.checked) {
        accesorios.push({
          nombre: 'Ojales',
          precio: A.ojales.precio,
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
      logistica, cantidadOjales, cantidadBolsillos, costoBolsillo, costoTubos
    ].forEach(function (el) {
      el.addEventListener('input', calcular);
    });

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
