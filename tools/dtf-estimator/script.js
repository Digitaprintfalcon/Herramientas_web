(function () {
  'use strict';

  var CLAVE_ESTADO = 'hw_dtf_estado';
  var estado = {
    disenos: [],
    seq: 1,
    quote: null,
    detalle: [],
    bcv: null
  };
  window.estadoDtf = estado;
  var dom = {};

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

  function limitarAncho(valor, maximo) {
    var n = parseFloat(valor);
    if (!isFinite(n) || n < 0) return 0;
    return Math.min(n, Math.max(0, maximo));
  }

  function nuevoId() {
    return 'dis' + (estado.seq++);
  }

  function costoDiseno(diseno, anchoRollo, costoMl) {
    if (anchoRollo <= 0) return 0;
    var ancho = Math.min(Math.max(0, diseno.ancho || 0), anchoRollo);
    var area = HW.pricing.areaM2(ancho, diseno.alto);
    return HW.pricing.costoRollo(area, anchoRollo, costoMl) * (diseno.cantidad || 0);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var P = HW.pricing.PRECIOS;
    var C = HW.pricing.COSTOS;
    var S = HW.pricing.SERVICIOS;
    var maxAnchoRollo = P.dtf.anchoRolloCm;

    dom = {
      anchoImprimible: document.getElementById('anchoImprimible'),
      altoImprimible: document.getElementById('altoImprimible'),
      costoImpresion: document.getElementById('costoImpresion'),
      margen: document.getElementById('margen'),
      listaDisenos: document.getElementById('listaDisenos'),
      incluirPlanchado: document.getElementById('incluirPlanchado'),
      cuerpoPlanchado: document.getElementById('cuerpoPlanchado'),
      costoPlanchado: document.getElementById('costoPlanchado'),
      tipoPlanchado: document.getElementById('tipoPlanchado'),
      incluirPrenda: document.getElementById('incluirPrenda'),
      cuerpoPrenda: document.getElementById('cuerpoPrenda'),
      costoPrenda: document.getElementById('costoPrenda'),
      tipoPrenda: document.getElementById('tipoPrenda')
    };

    estado.bcv = HW.bcv.mount(document.getElementById('bcvBox'));

    function defaults() {
      dom.anchoImprimible.max = String(maxAnchoRollo);
      HW.pricing.poblar({
        anchoImprimible: P.dtf.anchoRolloCm,
        altoImprimible: P.dtf.altoRolloCm,
        costoImpresion: C.dtfMl,
        margen: P.margen,
        costoPlanchado: S.planchado.precio,
        costoPrenda: S.prenda.precio
      });
      dom.tipoPlanchado.value = 'pieza';
      dom.tipoPrenda.value = 'pieza';
      dom.incluirPlanchado.checked = false;
      dom.incluirPrenda.checked = false;
      sincronizarCuerpos();
    }

    function sincronizarCuerpos() {
      dom.cuerpoPlanchado.classList.toggle('d-none', !dom.incluirPlanchado.checked);
      dom.cuerpoPrenda.classList.toggle('d-none', !dom.incluirPrenda.checked);
    }

    function ajustarAnchoImprimible() {
      if (dom.anchoImprimible.value === '') return 0;
      var ancho = limitarAncho(dom.anchoImprimible.value, maxAnchoRollo);
      if (parseFloat(dom.anchoImprimible.value) !== ancho) {
        dom.anchoImprimible.value = String(ancho);
      }
      return ancho;
    }

    function actualizarMaximoDisenos(maximo) {
      var limite = maximo > 0 ? maximo : maxAnchoRollo;
      var inputs = dom.listaDisenos.querySelectorAll('[data-campo="ancho"]');
      Array.prototype.forEach.call(inputs, function (input) {
        input.max = String(limite);
      });
    }

    function ajustarAnchoDisenos() {
      var maximo = ajustarAnchoImprimible();
      if (maximo > 0) {
        window.estadoDtf.disenos.forEach(function (diseno) {
          diseno.ancho = limitarAncho(diseno.ancho, maximo);
        });
      }
      renderDisenos();
    }

    function agregarDisenoValores(d) {
      var maximo = val('anchoImprimible');
      var ancho = d && parseFloat(d.ancho) || 10;
      estado.disenos.push({
        id: nuevoId(),
        etiqueta: (d && d.etiqueta) || '',
        ancho: maximo > 0 ? limitarAncho(ancho, maximo) : ancho,
        alto: d && parseFloat(d.alto) || 10,
        cantidad: d && parseInt(d.cantidad, 10) || 1
      });
    }

    function reiniciar() {
      defaults();
      window.estadoDtf.disenos = [];
      agregarDisenoValores();
      renderDisenos();
      calcular();
    }

    function renderDisenos() {
      dom.listaDisenos.innerHTML = '';

      if (!window.estadoDtf.disenos.length) {
        var vacio = document.createElement('p');
        vacio.className = 'text-muted small text-center border rounded-3 py-3 mb-0';
        vacio.innerHTML = '<i class="bi bi-inbox me-1"></i>Sin diseños. Agrega uno para cotizar.';
        dom.listaDisenos.appendChild(vacio);
        return;
      }

      window.estadoDtf.disenos.forEach(function (diseno, indice) {
        dom.listaDisenos.appendChild(crearFila(diseno, indice));
      });
    }

    function crearFila(diseno, indice) {
      var card = document.createElement('div');
      card.className = 'border rounded-3 p-3 mb-2';

      var header = document.createElement('div');
      header.className = 'd-flex justify-content-between align-items-center mb-2 gap-2';

      var numero = document.createElement('span');
      numero.className = 'badge text-bg-light border text-secondary';
      numero.textContent = '#' + (indice + 1);

      var etiqueta = document.createElement('input');
      etiqueta.type = 'text';
      etiqueta.className = 'form-control form-control-sm';
      etiqueta.placeholder = 'Etiqueta (opcional)';
      etiqueta.value = diseno.etiqueta || '';
      etiqueta.maxLength = 40;
      etiqueta.addEventListener('input', function () {
        diseno.etiqueta = etiqueta.value;
        calcular();
      });

      var btnEliminar = document.createElement('button');
      btnEliminar.type = 'button';
      btnEliminar.className = 'btn btn-sm btn-outline-danger';
      btnEliminar.title = 'Eliminar diseño';
      btnEliminar.innerHTML = '<i class="bi bi-trash"></i>';
      btnEliminar.addEventListener('click', function () {
        window.estadoDtf.disenos = window.estadoDtf.disenos.filter(function (d) { return d.id !== diseno.id; });
        renderDisenos();
        calcular();
      });

      header.appendChild(numero);
      header.appendChild(etiqueta);
      header.appendChild(btnEliminar);
      card.appendChild(header);

      var row = document.createElement('div');
      row.className = 'row g-2';
      row.appendChild(campoNumero('Ancho', diseno.ancho, function (v) {
        diseno.ancho = limitarAncho(v, val('anchoImprimible'));
        calcular();
      }, 0, diseno.id));
      row.appendChild(campoNumero('Alto', diseno.alto, function (v) {
        diseno.alto = v;
        calcular();
      }));
      row.appendChild(campoNumero('Cantidad', diseno.cantidad, function (v) {
        diseno.cantidad = v;
        calcular();
      }, 1));
      card.appendChild(row);

      var pie = document.createElement('div');
      pie.className = 'd-flex justify-content-between align-items-center small mt-2';
      var area = document.createElement('span');
      area.className = 'text-muted';
      area.setAttribute('data-area', diseno.id);
      var subtotal = document.createElement('span');
      subtotal.className = 'fw-semibold';
      subtotal.setAttribute('data-subtotal', diseno.id);
      pie.appendChild(area);
      pie.appendChild(subtotal);
      card.appendChild(pie);

      return card;
    }

    function campoNumero(label, valor, onChange, min, disenoId) {
      var col = document.createElement('div');
      col.className = 'col-4';

      var l = document.createElement('label');
      l.className = 'form-label text-muted mb-1';
      l.style.fontSize = '0.72rem';
      l.textContent = label;

      var group = document.createElement('div');
      group.className = 'input-group input-group-sm';

      var input = document.createElement('input');
      input.type = 'number';
      input.className = 'form-control';
      input.step = label === 'Cantidad' ? '1' : '0.1';
      input.min = String(min != null ? min : 0);
      input.value = valor;
      input.setAttribute('data-campo', label.toLowerCase());
      if (label === 'Ancho') {
        var anchoMax = val('anchoImprimible');
        input.max = String(anchoMax > 0 ? anchoMax : maxAnchoRollo);
      }
      if (disenoId) input.setAttribute('data-diseno', disenoId);

      var suffix = document.createElement('span');
      suffix.className = 'input-group-text';
      suffix.textContent = label === 'Cantidad' ? 'un.' : 'cm';

      input.addEventListener('input', function () {
        if (input.value === '') {
          onChange(0);
          return;
        }
        var v = parseFloat(input.value) || 0;
        if (v < 0) {
          v = 0;
          input.value = '0';
        }
        if (label === 'Ancho') {
          var maximo = val('anchoImprimible');
          if (v > maximo) {
            v = maximo;
            input.value = String(maximo);
          }
        }
        onChange(v);
      });

      group.appendChild(input);
      group.appendChild(suffix);
      col.appendChild(l);
      col.appendChild(group);
      return col;
    }

    function actualizarSubtotales() {
      var anchoRollo = val('anchoImprimible');
      var costoMl = val('costoImpresion');
      var margenPct = val('margen');

      window.estadoDtf.disenos.forEach(function (diseno) {
        var venta = HW.pricing.precioVenta(
          costoDiseno(diseno, anchoRollo, costoMl),
          margenPct
        );
        var st = dom.listaDisenos.querySelector('[data-subtotal="' + diseno.id + '"]');
        var ar = dom.listaDisenos.querySelector('[data-area="' + diseno.id + '"]');
        if (st) st.textContent = 'Venta: ' + HW.fmtUsd(venta);
        if (ar) ar.textContent = 'Área: ' + fmt(diseno.ancho * diseno.alto, 1) + ' cm²';
      });
    }

    function calcular() {
      var anchoRollo = val('anchoImprimible');
      var costoMl = Math.max(0, val('costoImpresion'));
      var margenPct = Math.max(0, val('margen'));
      var totalPiezas = 0;

      var materiales = window.estadoDtf.disenos.map(function (diseno, indice) {
        var cantidad = Math.max(0, diseno.cantidad || 0);
        totalPiezas += cantidad;
        return {
          nombre: diseno.etiqueta || ('Diseño ' + (indice + 1)),
          detalle: fmt(diseno.ancho, 1) + ' x ' + fmt(diseno.alto, 1) + ' cm × ' + fmt(cantidad, 0) + ' ud',
          unidad: 'ud',
          cantidad: cantidad,
          costoBase: costoDiseno(diseno, anchoRollo, costoMl),
          mermaPct: 0,
          margenPct: margenPct
        };
      });

      var servicios = [];
      if (dom.incluirPlanchado.checked) {
        servicios.push({
          nombre: 'Planchado',
          precio: Math.max(0, val('costoPlanchado')),
          modo: dom.tipoPlanchado.value,
          detalle: dom.tipoPlanchado.value === 'pieza' ? 'por pieza' : 'por lote'
        });
      }
      if (dom.incluirPrenda.checked) {
        servicios.push({
          nombre: 'Prenda',
          precio: Math.max(0, val('costoPrenda')),
          modo: dom.tipoPrenda.value,
          detalle: dom.tipoPrenda.value === 'pieza' ? 'por pieza' : 'por lote'
        });
      }

      estado.detalle = [
        'Rollo de ' + fmt(anchoRollo, 1) + ' cm de ancho',
        fmt(totalPiezas, 0) + ' ' + (totalPiezas === 1 ? 'pieza' : 'piezas') + ' en total'
      ];

      estado.quote = HW.quote.build({
        titulo: 'DTF',
        cantidad: totalPiezas,
        detalle: estado.detalle,
        materiales: materiales,
        servicios: servicios,
        margenPct: margenPct
      });

      HW.quote.renderResumen(document.getElementById('resumen'), estado.quote);
      actualizarSubtotales();
      if (estado.bcv) estado.bcv.setUsd(estado.quote.total);
      persistir();
    }

    function persistir() {
      HW.persist.set(CLAVE_ESTADO, {
        version: 2,
        disenos: window.estadoDtf.disenos,
        anchoImp: dom.anchoImprimible.value,
        costoMl: dom.costoImpresion.value,
        margen: dom.margen.value,
        planchado: {
          on: dom.incluirPlanchado.checked,
          costo: dom.costoPlanchado.value,
          tipo: dom.tipoPlanchado.value
        },
        prenda: {
          on: dom.incluirPrenda.checked,
          costo: dom.costoPrenda.value,
          tipo: dom.tipoPrenda.value
        }
      });
    }

    function restaurar() {
      var est = HW.persist.get(CLAVE_ESTADO, null);
      if (!est || typeof est !== 'object') return;

      if (est.anchoImp != null) dom.anchoImprimible.value = est.anchoImp;
      ajustarAnchoImprimible();

      // Los estados antiguos guardaban el precio de venta; se convierte a costo.
      if (est.version === 2) {
        if (est.costoMl != null) dom.costoImpresion.value = est.costoMl;
        if (est.margen != null) dom.margen.value = est.margen;
      } else if (est.precioMetro != null) {
        dom.costoImpresion.value = String(HW.pricing.redondear(
          (parseFloat(est.precioMetro) || 0) * (1 - HW.pricing.MARGEN_DEFAULT / 100),
          2
        ));
      }

      var planchado = est.planchado || {};
      dom.incluirPlanchado.checked = !!planchado.on;
      if (planchado.costo != null) dom.costoPlanchado.value = planchado.costo;
      if (planchado.tipo) dom.tipoPlanchado.value = planchado.tipo;

      var prenda = est.prenda || {};
      dom.incluirPrenda.checked = !!prenda.on;
      if (prenda.costo != null) dom.costoPrenda.value = prenda.costo;
      if (prenda.tipo) dom.tipoPrenda.value = prenda.tipo;

      if (Array.isArray(est.disenos)) {
        var maximo = val('anchoImprimible');
        window.estadoDtf.disenos = est.disenos
          .filter(function (d) { return d && typeof d === 'object'; })
          .map(function (d) {
            return {
              id: nuevoId(),
              etiqueta: typeof d.etiqueta === 'string' ? d.etiqueta : '',
              ancho: limitarAncho(d.ancho, maximo),
              alto: parseFloat(d.alto) || 0,
              cantidad: Math.max(1, parseInt(d.cantidad, 10) || 1)
            };
          });
      }
    }

    dom.incluirPlanchado.addEventListener('change', function () {
      sincronizarCuerpos();
      calcular();
    });
    dom.incluirPrenda.addEventListener('change', function () {
      sincronizarCuerpos();
      calcular();
    });

    dom.anchoImprimible.addEventListener('input', function () {
      var maximo = ajustarAnchoImprimible();
      actualizarMaximoDisenos(maximo);
      calcular();
    });
    dom.anchoImprimible.addEventListener('change', function () {
      ajustarAnchoDisenos();
      calcular();
    });

    [
      dom.costoImpresion, dom.margen,
      dom.costoPlanchado, dom.tipoPlanchado,
      dom.costoPrenda, dom.tipoPrenda
    ].forEach(function (el) {
      el.addEventListener('input', calcular);
      el.addEventListener('change', calcular);
    });

    document.getElementById('btnAgregarDiseno').addEventListener('click', function () {
      agregarDisenoValores();
      renderDisenos();
      calcular();
    });
    document.getElementById('btnReiniciar').addEventListener('click', reiniciar);
    document.getElementById('btnCopiar').addEventListener('click', function () {
      HW.quote.copiar(estado.quote, {
        titulo: 'DTF',
        detalle: estado.detalle,
        tasa: estado.bcv ? estado.bcv.getTasa() : 0
      });
    });
    document.getElementById('btnCopiarTotal').addEventListener('click', function () {
      HW.quote.copiarTotal(estado.quote, { tasa: estado.bcv ? estado.bcv.getTasa() : 0 });
    });
    var CLAVE_HIST_DTF = 'hw_hist_dtf';
    var MAX_HIST_DTF = 20;

    function obtenerHistorialDtf() {
      if (window.HW && HW.persist && HW.persist.get) {
        var v = HW.persist.get(CLAVE_HIST_DTF, []);
        return Array.isArray(v) ? v : [];
      }
      try {
        var raw = localStorage.getItem(CLAVE_HIST_DTF);
        var v2 = raw ? JSON.parse(raw) : [];
        return Array.isArray(v2) ? v2 : [];
      } catch (e) { return []; }
    }

    function guardarHistorialDtfArr(arr) {
      if (window.HW && HW.persist && HW.persist.set) {
        HW.persist.set(CLAVE_HIST_DTF, arr);
        return;
      }
      try { localStorage.setItem(CLAVE_HIST_DTF, JSON.stringify(arr)); } catch (e) {}
    }

    function generarResumenCortoDtf() {
      try {
        var totalP = 0;
        window.estadoDtf.disenos.forEach(function(d){ totalP += (parseInt(d.cantidad,10)||0); });
        var p = [];
        if (document.getElementById('incluirPlanchado').checked) p.push('Planchado');
        if (document.getElementById('incluirPrenda').checked) p.push('Prenda');
        return totalP + ' pzas · ' + val('anchoImprimible') + ' cm rollo' + (p.length ? ' · ' + p.join(' + ') : '');
      } catch (e) { return ''; }
    }

    function obtenerSnapshotDtf() {
      return {
        anchoImprimible: val('anchoImprimible'),
        costoImpresion: val('costoImpresion'),
        margen: val('margen'),
        incluirPlanchado: document.getElementById('incluirPlanchado').checked,
        costoPlanchado: val('costoPlanchado'),
        tipoPlanchado: document.getElementById('tipoPlanchado').value,
        incluirPrenda: document.getElementById('incluirPrenda').checked,
        costoPrenda: val('costoPrenda'),
        tipoPrenda: document.getElementById('tipoPrenda').value,
        disenos: window.estadoDtf.disenos.map(function(d){ return { etiqueta: d.etiqueta, ancho: d.ancho, alto: d.alto, cantidad: d.cantidad }; })
      };
    }

    function cargarDesdeHistorialDtf(h) {
      if (!h || !h.datos) return;
      var d = h.datos;
      document.getElementById('anchoImprimible').value = d.anchoImprimible != null ? d.anchoImprimible : 57;
      document.getElementById('costoImpresion').value = d.costoImpresion != null ? d.costoImpresion : '';
      document.getElementById('margen').value = d.margen != null ? d.margen : 40;
      document.getElementById('incluirPlanchado').checked = !!d.incluirPlanchado;
      document.getElementById('costoPlanchado').value = d.costoPlanchado != null ? d.costoPlanchado : 1.5;
      document.getElementById('tipoPlanchado').value = d.tipoPlanchado || 'pieza';
      document.getElementById('incluirPrenda').checked = !!d.incluirPrenda;
      document.getElementById('costoPrenda').value = d.costoPrenda != null ? d.costoPrenda : 5;
      document.getElementById('tipoPrenda').value = d.tipoPrenda || 'pieza';
      if (typeof sincronizarCuerpos === 'function') sincronizarCuerpos();
      window.estadoDtf.disenos = [];
      if (Array.isArray(d.disenos)) {
        d.disenos.forEach(function(ds){
          estado.disenos.push({ id: nuevoId(), etiqueta: ds.etiqueta || '', ancho: ds.ancho || 0, alto: ds.alto || 0, cantidad: ds.cantidad || 1 });
        });
      }
      if (!window.estadoDtf.disenos.length) agregarDisenoValores();
      if (typeof ajustarAnchoImprimible === 'function') ajustarAnchoImprimible();
      renderDisenos();
      if (typeof calcular === 'function') calcular();
      if (window.HW && HW.toast) HW.toast('Cotización cargada del historial');
    }

    function renderHistorialDtf() {
      var hist = obtenerHistorialDtf();
      var box = document.getElementById('histDtf');
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
        btn.addEventListener('click', function(){ cargarDesdeHistorialDtf(h); });
        box.appendChild(btn);
      });
    }

    function guardarHistorialDtf() {
      if (!window.estadoDtf || !window.estadoDtf.quote || !(window.estadoDtf.quote.total > 0)) {
        if (window.HW && HW.toast) HW.toast('No hay cotización válida para guardar', true);
        return;
      }
      var hist = obtenerHistorialDtf();
      var nombreEl = document.getElementById('histNombreDtf');
      var notaEl = document.getElementById('histNotaDtf');
      var nombre = nombreEl ? nombreEl.value.trim() : '';
      var nota = notaEl ? notaEl.value.trim() : '';
      var item = {
        id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2,5),
        ts: Date.now(),
        fecha: new Date().toLocaleString('es-VE'),
        titulo: 'DTF',
        nombre: nombre,
        nota: nota,
        total: window.estadoDtf.quote.total,
        unitario: window.estadoDtf.quote.unitario,
        cantidad: window.estadoDtf.quote.cantidad,
        resumen: generarResumenCortoDtf(),
        datos: obtenerSnapshotDtf()
      };
      hist.unshift(item);
      hist = hist.slice(0, MAX_HIST_DTF);
      guardarHistorialDtfArr(hist);
      renderHistorialDtf();
      if (window.HW && HW.toast) HW.toast('Cotización guardada en historial');
      if (nombreEl) nombreEl.value = '';
      if (notaEl) notaEl.value = '';
    }

    function limpiarHistorialDtf() {
      if (!confirm('¿Limpiar todo el historial de este cotizador?')) return;
      guardarHistorialDtfArr([]);
      renderHistorialDtf();
      if (window.HW && HW.toast) HW.toast('Historial limpiado');
    }

    var btnGuardarHistDtf = document.getElementById('btnGuardarHistDtf');
    var btnLimpiarHistDtf = document.getElementById('btnLimpiarHistDtf');
    if (btnGuardarHistDtf) btnGuardarHistDtf.addEventListener('click', guardarHistorialDtf);
    if (btnLimpiarHistDtf) btnLimpiarHistDtf.addEventListener('click', limpiarHistorialDtf);
    renderHistorialDtf();

    document.getElementById('btnGenerador').addEventListener('click', function () {
      HW.quote.enviarAlGenerador(estado.quote, {
        titulo: 'DTF',
        detalle: estado.detalle
      });
    });

    defaults();
    restaurar();
    if (!window.estadoDtf.disenos.length) agregarDisenoValores();
    renderDisenos();
    sincronizarCuerpos();
    calcular();
  });
})();
