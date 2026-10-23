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
  var dom = {};

  function fmt(n, d) {
    return Number(n).toLocaleString('es-ES', {
      minimumFractionDigits: d || 0,
      maximumFractionDigits: d || 0
    });
  }

  function val(id) {
    return parseFloat(document.getElementById(id).value) || 0;
  }

  function nuevoId() {
    return 'dis' + (estado.seq++);
  }

  function costoDiseno(diseno, anchoRollo, costoMl) {
    if (anchoRollo <= 0) return 0;
    var area = HW.pricing.areaM2(diseno.ancho, diseno.alto);
    return HW.pricing.costoRollo(area, anchoRollo, costoMl) * (diseno.cantidad || 0);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var P = HW.pricing.PRECIOS;
    var C = HW.pricing.COSTOS;
    var S = HW.pricing.SERVICIOS;

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

    function agregarDisenoValores(d) {
      estado.disenos.push({
        id: nuevoId(),
        etiqueta: (d && d.etiqueta) || '',
        ancho: d && parseFloat(d.ancho) || 10,
        alto: d && parseFloat(d.alto) || 10,
        cantidad: d && parseInt(d.cantidad, 10) || 1
      });
    }

    function reiniciar() {
      defaults();
      estado.disenos = [];
      agregarDisenoValores();
      renderDisenos();
      calcular();
    }

    function renderDisenos() {
      dom.listaDisenos.innerHTML = '';

      if (!estado.disenos.length) {
        var vacio = document.createElement('p');
        vacio.className = 'text-muted small text-center border rounded-3 py-3 mb-0';
        vacio.innerHTML = '<i class="bi bi-inbox me-1"></i>Sin diseños. Agrega uno para cotizar.';
        dom.listaDisenos.appendChild(vacio);
        return;
      }

      estado.disenos.forEach(function (diseno, indice) {
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
        estado.disenos = estado.disenos.filter(function (d) { return d.id !== diseno.id; });
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
        diseno.ancho = v;
        calcular();
      }));
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

    function campoNumero(label, valor, onChange, min) {
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

      var suffix = document.createElement('span');
      suffix.className = 'input-group-text';
      suffix.textContent = label === 'Cantidad' ? 'un.' : 'cm';

      input.addEventListener('input', function () {
        onChange(parseFloat(input.value) || 0);
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

      estado.disenos.forEach(function (diseno) {
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

      var materiales = estado.disenos.map(function (diseno, indice) {
        var cantidad = Math.max(0, diseno.cantidad || 0);
        totalPiezas += cantidad;
        return {
          nombre: diseno.etiqueta || ('Diseño ' + (indice + 1)),
          detalle: fmt(diseno.ancho, 1) + ' x ' + fmt(diseno.alto, 1) + ' cm × ' + fmt(cantidad, 0) + ' ud',
          unidad: 'pieza',
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
        disenos: estado.disenos,
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
        estado.disenos = est.disenos
          .filter(function (d) { return d && typeof d === 'object'; })
          .map(function (d) {
            return {
              id: nuevoId(),
              etiqueta: typeof d.etiqueta === 'string' ? d.etiqueta : '',
              ancho: parseFloat(d.ancho) || 0,
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

    [
      dom.anchoImprimible, dom.costoImpresion, dom.margen,
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
    document.getElementById('btnGenerador').addEventListener('click', function () {
      HW.quote.enviarAlGenerador(estado.quote, {
        titulo: 'DTF',
        detalle: estado.detalle
      });
    });

    defaults();
    restaurar();
    if (!estado.disenos.length) agregarDisenoValores();
    renderDisenos();
    sincronizarCuerpos();
    calcular();
  });
})();
