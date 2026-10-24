(function () {
  'use strict';

  var estado = {
    quote: null,
    detalle: [],
    bcv: null,
    tipo: 'adhesivo'
  };
  window.estadoVinil = estado;

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
      anchoLaminado.value = String(P.vinil.anchoRolloLaminadoCm);
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
        unidad: 'ud',
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
          unidad: 'ud',
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
    var btnGuardarHistVinil = document.getElementById('btnGuardarHistVinil');
    var btnLimpiarHistVinil = document.getElementById('btnLimpiarHistVinil');
    if (btnGuardarHistVinil) btnGuardarHistVinil.addEventListener('click', guardarHistorialVinil);
    if (btnLimpiarHistVinil) btnLimpiarHistVinil.addEventListener('click', limpiarHistorialVinil);
    renderHistorialVinil();

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


  var CLAVE_HIST_VINIL = 'hw_hist_vinil';
  var MAX_HIST_VINIL = 20;

  function obtenerHistorialVinil() {
    if (window.HW && HW.persist && HW.persist.get) {
      var v = HW.persist.get(CLAVE_HIST_VINIL, []);
      return Array.isArray(v) ? v : [];
    }
    try {
      var raw = localStorage.getItem(CLAVE_HIST_VINIL);
      var v2 = raw ? JSON.parse(raw) : [];
      return Array.isArray(v2) ? v2 : [];
    } catch (e) { return []; }
  }

  function guardarHistorialVinilArr(arr) {
    if (window.HW && HW.persist && HW.persist.set) {
      HW.persist.set(CLAVE_HIST_VINIL, arr);
      return;
    }
    try { localStorage.setItem(CLAVE_HIST_VINIL, JSON.stringify(arr)); } catch (e) {}
  }

  function generarResumenCortoVinil() {
    try {
      var tipo = document.getElementById('tipoTrabajo').value;
      return (tipo === 'textil' ? 'Vinil textil' : 'Vinil adhesivo') + ' · ' + (val('anchoPieza')||0) + ' x ' + (val('altoPieza')||0) + ' cm · ' + (val('cantidad')||1) + ' ud';
    } catch (e) { return ''; }
  }

  function obtenerSnapshotVinil() {
    return {
      tipoTrabajo: document.getElementById('tipoTrabajo').value,
      anchoPieza: val('anchoPieza'),
      altoPieza: val('altoPieza'),
      cantidad: val('cantidad'),
      anchoRollo: val('anchoRollo'),
      costoMaterial: val('costoMaterial'),
      margen: val('margen'),
      incluirDiseno: document.getElementById('incluirDiseno').checked,
      costoDiseno: val('costoDiseno'),
      tipoDiseno: document.getElementById('tipoDiseno').value,
      incluirCorte: document.getElementById('incluirCorte').checked,
      costoCorte: val('costoCorte'),
      tipoCorte: document.getElementById('tipoCorte').value,
      incluirInstalacion: document.getElementById('incluirInstalacion').checked,
      costoInstalacion: val('costoInstalacion'),
      tipoInstalacion: document.getElementById('tipoInstalacion').value,
      incluirPlanchado: document.getElementById('incluirPlanchado').checked,
      costoPlanchado: val('costoPlanchado'),
      tipoPlanchado: document.getElementById('tipoPlanchado').value
    };
  }

  function cargarDesdeHistorialVinil(h) {
    if (!h || !h.datos) return;
    var d = h.datos;
    if (d.tipoTrabajo) {
      var tipo = document.getElementById('tipoTrabajo');
      tipo.value = d.tipoTrabajo;
      tipo.dispatchEvent(new Event('change', { bubbles: true }));
    }
    document.getElementById('anchoPieza').value = d.anchoPieza != null ? d.anchoPieza : '';
    document.getElementById('altoPieza').value = d.altoPieza != null ? d.altoPieza : '';
    document.getElementById('cantidad').value = d.cantidad != null ? d.cantidad : 1;
    document.getElementById('anchoRollo').value = d.anchoRollo != null ? d.anchoRollo : '';
    document.getElementById('costoMaterial').value = d.costoMaterial != null ? d.costoMaterial : '';
    document.getElementById('margen').value = d.margen != null ? d.margen : 40;
    document.getElementById('incluirDiseno').checked = !!d.incluirDiseno;
    document.getElementById('costoDiseno').value = d.costoDiseno != null ? d.costoDiseno : 5;
    document.getElementById('tipoDiseno').value = d.tipoDiseno || 'pieza';
    document.getElementById('incluirCorte').checked = !!d.incluirCorte;
    document.getElementById('costoCorte').value = d.costoCorte != null ? d.costoCorte : 5;
    document.getElementById('tipoCorte').value = d.tipoCorte || 'pieza';
    document.getElementById('incluirInstalacion').checked = !!d.incluirInstalacion;
    document.getElementById('costoInstalacion').value = d.costoInstalacion != null ? d.costoInstalacion : 10;
    document.getElementById('tipoInstalacion').value = d.tipoInstalacion || 'pieza';
    document.getElementById('incluirPlanchado').checked = !!d.incluirPlanchado;
    document.getElementById('costoPlanchado').value = d.costoPlanchado != null ? d.costoPlanchado : 1.5;
    document.getElementById('tipoPlanchado').value = d.tipoPlanchado || 'pieza';
    ['incluirDiseno','incluirCorte','incluirInstalacion','incluirPlanchado'].forEach(function(id){ var el=document.getElementById(id); if(el) el.dispatchEvent(new Event('change',{bubbles:true})); });
    if (typeof calcular === 'function') calcular();
    if (window.HW && HW.toast) HW.toast('Cotización cargada del historial');
  }

  function renderHistorialVinil() {
    var hist = obtenerHistorialVinil();
    var box = document.getElementById('histVinil');
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
      btn.addEventListener('click', function(){ cargarDesdeHistorialVinil(h); });
      box.appendChild(btn);
    });
  }

  function guardarHistorialVinil() {
    if (!window.estadoVinil || !window.estadoVinil.quote || !(window.estadoVinil.quote.total > 0)) {
      if (window.HW && HW.toast) HW.toast('No hay cotización válida para guardar', true);
      return;
    }
    var hist = obtenerHistorialVinil();
    var item = {
      id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2,5),
      ts: Date.now(),
      fecha: new Date().toLocaleString('es-VE'),
      titulo: 'Vinil',
      total: window.estadoVinil.quote.total,
      unitario: window.estadoVinil.quote.unitario,
      cantidad: window.estadoVinil.quote.cantidad,
      resumen: generarResumenCortoVinil(),
      datos: obtenerSnapshotVinil()
    };
    hist.unshift(item);
    hist = hist.slice(0, MAX_HIST_VINIL);
    guardarHistorialVinilArr(hist);
    renderHistorialVinil();
    if (window.HW && HW.toast) HW.toast('Cotización guardada en historial');
  }

  function limpiarHistorialVinil() {
    if (!confirm('¿Limpiar todo el historial de este cotizador?')) return;
    guardarHistorialVinilArr([]);
    renderHistorialVinil();
    if (window.HW && HW.toast) HW.toast('Historial limpiado');
  }
