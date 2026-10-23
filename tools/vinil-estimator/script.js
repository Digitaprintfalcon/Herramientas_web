(function () {
  'use strict';

  var estado = {
    quote: null,
    detalle: [],
    bcv: null,
    tipo: 'adhesivo'
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

  function alternarCuerpo(idCuerpo, activo) {
    document.getElementById(idCuerpo).classList.toggle('d-none', !activo);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var P = HW.pricing.PRECIOS;
    var C = HW.pricing.COSTOS;
    var S = HW.pricing.SERVICIOS;

    var tipo = document.getElementById('tipoTrabajo');
    var metodo = document.getElementById('metodo');
    var ancho = document.getElementById('anchoPieza');
    var alto = document.getElementById('altoPieza');
    var cantidad = document.getElementById('cantidadPiezas');
    var costoMaterial = document.getElementById('costoMaterial');
    var margen = document.getElementById('margen');
    var anchoRollo = document.getElementById('anchoRollo');
    var incluirLaminado = document.getElementById('incluirLaminado');
    var anchoLaminado = document.getElementById('anchoLaminado');
    var costoLaminado = document.getElementById('costoLaminado');

    var servicios = [
      { id: 'incluirDiseno', precio: 'precioDiseno', catalogo: S.diseno },
      { id: 'incluirCorte', precio: 'precioCorte', catalogo: S.corte },
      { id: 'incluirInstalacion', precio: 'precioInstalacion', catalogo: S.instalacion },
      { id: 'incluirPlanchado', precio: 'precioPlanchado', catalogo: S.planchado }
    ];

    estado.bcv = HW.bcv.mount(document.getElementById('bcvBox'));

    var params = new URLSearchParams(window.location.search);
    if (params.get('tipo') === 'textil') tipo.value = 'textil';

    servicios.forEach(function (servicio) {
      document.getElementById('precio' + servicio.id.slice(7)).value = servicio.catalogo.precio;
    });

    function defaultsTipo() {
      var esTextil = tipo.value === 'textil';
      ancho.value = esTextil ? '20' : '100';
      alto.value = esTextil ? '15' : '135';
      cantidad.value = '1';
      margen.value = String(P.margen);
      metodo.value = 'lineal';
      anchoRollo.value = String(P.corte.anchoRolloCm);
      anchoLaminado.value = String(P.dtf.anchoRolloCm);
      costoLaminado.value = String(C.laminadoVinilMl);

      if (esTextil) {
        costoMaterial.value = String(C.vinilTextilMl);
      } else {
        costoMaterial.value = String(C.vinilAdhesivoM2);
      }

      incluirLaminado.checked = false;
      servicios.forEach(function (servicio) {
        document.getElementById(servicio.id).checked = false;
      });

      actualizarTipo();
    }

    function actualizarTipo() {
      var esTextil = tipo.value === 'textil';
      estado.tipo = tipo.value;
      document.getElementById('navSubtitulo').textContent = esTextil
        ? 'Corte de vinil textil: rollo, m², planchado e instalación'
        : 'Vinil adhesivo de gran formato: m², laminado e instalación';

      document.querySelectorAll('.solo-textil').forEach(function (el) {
        el.classList.toggle('d-none', !esTextil);
      });
      document.querySelectorAll('.solo-adhesivo').forEach(function (el) {
        el.classList.toggle('d-none', esTextil);
      });

      if (!esTextil) {
        document.getElementById('incluirPlanchado').checked = false;
        alternarCuerpo('cuerpoPlanchado', false);
      }

      actualizarCostoMaterial();
      alternarCuerpo('cuerpoLaminado', !esTextil && incluirLaminado.checked);
    }

    function actualizarCostoMaterial() {
      var esTextil = tipo.value === 'textil';
      var esLineal = esTextil && metodo.value === 'lineal';
      var label = document.getElementById('labelCostoMaterial');

      if (!esTextil) {
        label.textContent = 'Costo del vinil adhesivo';
        document.getElementById('unidadCosto').textContent = '$/m²';
        costoMaterial.value = String(C.vinilAdhesivoM2);
      } else if (esLineal) {
        label.textContent = 'Costo del vinil textil';
        document.getElementById('unidadCosto').textContent = '$/ml';
        costoMaterial.value = String(C.vinilTextilMl);
      } else {
        label.textContent = 'Costo del vinil textil';
        document.getElementById('unidadCosto').textContent = '$/m²';
        costoMaterial.value = String(P.corte.costoM2);
      }
    }

    function calcular() {
      var piezas = Math.max(0, parseFloat(cantidad.value) || 0);
      var area = HW.pricing.areaM2(val('anchoPieza'), val('altoPieza'));
      var esTextil = tipo.value === 'textil';
      var esLineal = esTextil && metodo.value === 'lineal';
      var margenPct = Math.max(0, val('margen'));
      var costoBase = 0;
      var detalleMaterial = '';
      var nombreMaterial = esTextil ? 'Vinil textil' : 'Vinil adhesivo';

      if (!esTextil) {
        costoBase = HW.pricing.costoArea(area, Math.max(0, val('costoMaterial'))) * piezas;
        detalleMaterial = fmt(area, 3) + ' m² × ' + fmt(piezas, 0) + ' ud';
      } else if (esLineal) {
        var rollo = Math.max(0, val('anchoRollo'));
        var metros = rollo > 0 ? HW.pricing.metrosLineales(area, rollo) : 0;
        costoBase = (rollo > 0 ? HW.pricing.costoRollo(area, rollo, Math.max(0, val('costoMaterial'))) : 0) * piezas;
        detalleMaterial = fmt(metros, 3) + ' ml × ' + fmt(piezas, 0) + ' ud (rollo ' + fmt(rollo, 1) + ' cm)';
      } else {
        costoBase = HW.pricing.costoArea(area, Math.max(0, val('costoMaterial'))) * piezas;
        detalleMaterial = fmt(area, 3) + ' m² × ' + fmt(piezas, 0) + ' ud';
      }

      var materiales = [{
        nombre: nombreMaterial,
        detalle: detalleMaterial,
        unidad: esLineal ? 'ml' : 'm²',
        costoBase: costoBase,
        mermaPct: 0,
        margenPct: margenPct
      }];

      if (!esTextil && incluirLaminado.checked) {
        var rolloLaminado = Math.max(0, val('anchoLaminado'));
        var costoLam = rolloLaminado > 0
          ? HW.pricing.costoRollo(area, rolloLaminado, Math.max(0, val('costoLaminado')))
          : 0;
        materiales.push({
          nombre: 'Laminado',
          detalle: 'Cobertura por área',
          unidad: 'm²',
          costoBase: costoLam * piezas,
          mermaPct: 0,
          margenPct: margenPct
        });
      }

      var serviciosSeleccionados = [];
      servicios.forEach(function (servicio) {
        if (esTextil || servicio.id !== 'incluirPlanchado') {
          var activo = document.getElementById(servicio.id).checked;
          if (activo) {
            var precio = Math.max(0, val(servicio.precio));
            serviciosSeleccionados.push({
              nombre: servicio.catalogo.nombre,
              precio: precio,
              modo: 'pieza',
              detalle: '$' + fmt(precio, 2) + ' por pieza'
            });
          }
        }
      });

      estado.detalle = [
        fmt(piezas, 0) + ' ' + (piezas === 1 ? 'unidad' : 'unidades') + ' de ' +
          fmt(val('anchoPieza'), 1) + ' x ' + fmt(val('altoPieza'), 1) + ' cm',
        'Área por unidad: ' + fmt(area, 3) + ' m²'
      ];

      estado.quote = HW.quote.build({
        titulo: esTextil ? 'Vinil textil' : 'Vinil adhesivo',
        cantidad: piezas,
        detalle: estado.detalle,
        materiales: materiales,
        servicios: serviciosSeleccionados,
        margenPct: margenPct
      });

      HW.quote.renderResumen(document.getElementById('resumen'), estado.quote);
      if (estado.bcv) estado.bcv.setUsd(estado.quote.total);
    }

    function sincronizarCuerpos() {
      servicios.forEach(function (servicio) {
        var cuerpo = 'cuerpo' + servicio.id.slice(7);
        alternarCuerpo(cuerpo, document.getElementById(servicio.id).checked);
      });
      alternarCuerpo('cuerpoLaminado', !esTextilActual() && incluirLaminado.checked);
    }

    function esTextilActual() {
      return tipo.value === 'textil';
    }

    [ancho, alto, cantidad, margen, anchoRollo, anchoLaminado, costoLaminado].forEach(function (el) {
      el.addEventListener('input', calcular);
    });

    costoMaterial.addEventListener('input', calcular);

    tipo.addEventListener('change', function () {
      actualizarTipo();
      calcular();
    });

    metodo.addEventListener('change', function () {
      actualizarCostoMaterial();
      calcular();
    });

    incluirLaminado.addEventListener('change', function () {
      alternarCuerpo('cuerpoLaminado', incluirLaminado.checked);
      calcular();
    });

    servicios.forEach(function (servicio) {
      document.getElementById(servicio.id).addEventListener('change', function () {
        sincronizarCuerpos();
        calcular();
      });
      document.getElementById(servicio.precio).addEventListener('input', calcular);
    });

    document.getElementById('btnReiniciar').addEventListener('click', function () {
      defaultsTipo();
      sincronizarCuerpos();
      calcular();
    });
    document.getElementById('btnCopiar').addEventListener('click', function () {
      HW.quote.copiar(estado.quote, {
        titulo: esTextilActual() ? 'Vinil textil' : 'Vinil adhesivo',
        detalle: estado.detalle,
        tasa: estado.bcv ? estado.bcv.getTasa() : 0
      });
    });
    document.getElementById('btnCopiarTotal').addEventListener('click', function () {
      HW.quote.copiarTotal(estado.quote, { tasa: estado.bcv ? estado.bcv.getTasa() : 0 });
    });
    document.getElementById('btnGenerador').addEventListener('click', function () {
      HW.quote.enviarAlGenerador(estado.quote, {
        titulo: esTextilActual() ? 'Vinil textil' : 'Vinil adhesivo',
        detalle: estado.detalle
      });
    });

    defaultsTipo();
    sincronizarCuerpos();
    calcular();
  });
})();
