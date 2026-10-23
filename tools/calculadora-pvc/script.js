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
