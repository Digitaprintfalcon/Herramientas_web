(function (root) {
  'use strict';

  var HW = root.HW = root.HW || {};
  var P = HW.pricing;

  function num(value) {
    var n = parseFloat(value);
    return isFinite(n) ? n : 0;
  }

  function money(value) {
    return HW.fmtUsd ? HW.fmtUsd(value) : '$' + num(value).toFixed(2);
  }

  function escape(value) {
    return HW.escapeHtml ? HW.escapeHtml(value) : String(value == null ? '' : value);
  }

  function redondear(value, decimales) {
    return P ? P.redondear(value, decimales) : num(value);
  }

  // Construye una cotización completa a partir de componentes ya calculados.
  // costoBase de cada material es el costo de todo el trabajo (no por pieza).
  function build(input) {
    input = input || {};
    var cantidad = Math.max(0, num(input.cantidad));
    var margenDefault = input.margenPct != null
      ? num(input.margenPct)
      : (P ? P.PRECIOS.margen : 40);

    var materiales = (input.materiales || []).map(function (m) {
      m = m || {};
      var costoBase = num(m.costoBase);
      var mermaPct = num(m.mermaPct);
      var margenPct = m.margenPct != null ? num(m.margenPct) : margenDefault;
      var merma = costoBase * mermaPct / 100;
      var costoConMerma = costoBase + merma;
      var precio = P ? P.precioVenta(costoConMerma, margenPct) : costoConMerma;
      var unidad = m.unidad || 'ud';
      return {
        tipo: 'material',
        nombre: m.nombre || 'Material',
        detalle: m.detalle || '',
        unidad: unidad,
        cantidad: cantidad,
        precioUnitario: cantidad > 0 ? precio / cantidad : 0,
        costoBase: costoBase,
        mermaPct: mermaPct,
        merma: merma,
        margenPct: margenPct,
        precio: precio,
        total: precio
      };
    });

    var servicios = (input.servicios || []).filter(function (s) {
      return s && num(s.precio) > 0;
    }).map(function (s) {
      var modo = s.modo === 'lote' ? 'lote' : 'pieza';
      var lineCantidad = modo === 'lote' ? 1 : cantidad;
      var precioUnitario = num(s.precio);
      var total = precioUnitario * lineCantidad;
      return {
        tipo: 'servicio',
        nombre: s.nombre || 'Servicio',
        detalle: s.detalle || (modo === 'lote' ? 'por lote' : 'por pieza'),
        unidad: modo === 'lote' ? 'lote' : 'ud',
        modo: modo,
        cantidad: lineCantidad,
        precioUnitario: precioUnitario,
        precio: total,
        total: total
      };
    });

    var accesorios = (input.accesorios || []).filter(function (a) {
      return a && num(a.precio) > 0 && num(a.cantidad) > 0;
    }).map(function (a) {
      var cantidadPorPieza = num(a.cantidad);
      var lineCantidad = cantidadPorPieza * cantidad;
      var precioUnitario = num(a.precio);
      var total = precioUnitario * lineCantidad;
      return {
        tipo: 'accesorio',
        nombre: a.nombre || 'Accesorio',
        detalle: a.detalle || (cantidadPorPieza + ' por pieza'),
        unidad: 'ud',
        cantidad: lineCantidad,
        cantidadPorPieza: cantidadPorPieza,
        precioUnitario: precioUnitario,
        precio: total,
        total: total
      };
    });

    var lineas = materiales.concat(servicios, accesorios);
    var totalMaterial = materiales.reduce(function (suma, l) { return suma + l.total; }, 0);
    var totalServicios = servicios.reduce(function (suma, l) { return suma + l.total; }, 0);
    var totalAccesorios = accesorios.reduce(function (suma, l) { return suma + l.total; }, 0);
    var totalGeneral = totalMaterial + totalServicios + totalAccesorios;

    return {
      titulo: input.titulo || 'Cotización',
      detalle: input.detalle || [],
      cantidad: cantidad,
      unidad: input.unidad || 'ud',
      materiales: materiales,
      servicios: servicios,
      accesorios: accesorios,
      lineas: lineas,
      margenPct: margenDefault,
      totalMaterial: totalMaterial,
      totalServicios: totalServicios,
      totalAccesorios: totalAccesorios,
      total: totalGeneral,
      unitario: cantidad > 0 ? totalGeneral / cantidad : 0
    };
  }

  function texto(quote, opts) {
    opts = opts || {};
    if (!quote) return '';
    var lineas = [];
    lineas.push('*COTIZACIÓN ' + String(opts.titulo || quote.titulo || '').toUpperCase() + '*');
    (opts.detalle || quote.detalle || []).forEach(function (linea) {
      if (linea) lineas.push(linea);
    });
    lineas.push('');
    quote.lineas.forEach(function (l) {
      var detalle = l.detalle ? ' (' + l.detalle + ')' : '';
      lineas.push('• ' + l.nombre + detalle + ': ' + money(l.total));
    });
    lineas.push('');
    lineas.push('Precio unitario: ' + money(quote.unitario));
    lineas.push('*TOTAL: ' + money(quote.total) + '*');
    var tasa = num(opts.tasa);
    if (tasa > 0) {
      lineas.push('Equivalente: ' + (HW.fmtBs ? HW.fmtBs(quote.total * tasa) : 'Bs. ' + (quote.total * tasa).toFixed(2)));
      lineas.push('Tasa BCV: ' + tasa.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Bs/$');
    }
    return lineas.join('\n');
  }

  function copiar(quote, opts) {
    if (!quote || !(quote.total > 0)) {
      if (HW.toast) HW.toast('Ingresa los datos para cotizar', true);
      return Promise.resolve(false);
    }
    return HW.copyResult(texto(quote, opts), 'Cotización copiada al portapapeles');
  }

  function copiarTotal(quote, opts) {
    opts = opts || {};
    var tasa = num(opts.tasa);
    if (HW.copyTotal) return HW.copyTotal(quote ? quote.total : 0, tasa, 'Total copiado al portapapeles');
    return Promise.resolve(false);
  }

  function borrador(quote, opts) {
    opts = opts || {};
    return {
      version: 1,
      titulo: opts.titulo || quote.titulo || 'Cotización',
      detalle: opts.detalle || quote.detalle || [],
      lineas: quote.lineas.map(function (l) {
        var cantidad = l.cantidad > 0 ? l.cantidad : 1;
        return {
          desc: l.nombre + (l.detalle ? ' · ' + l.detalle : ''),
          cant: redondear(cantidad, 2),
          unidad: l.unidad || 'ud',
          precio: redondear(l.total / cantidad, 4)
        };
      }),
      total: redondear(quote.total, 2),
      ts: Date.now()
    };
  }

  function enviarAlGenerador(quote, opts) {
    opts = opts || {};
    if (!quote || !(quote.total > 0)) {
      if (HW.toast) HW.toast('Ingresa los datos para cotizar', true);
      return false;
    }
    var draft = borrador(quote, opts);
    if (HW.persist) HW.persist.set('hw_cot_borrador', draft);
    var destino = opts.generatorPath || '../cotizador-generator/index.html';
    root.location.href = destino + '?importar=1';
    return true;
  }

  function renderResumen(el, quote, opts) {
    if (!el || !quote) return;
    opts = opts || {};
    var html = '';
    html += '<div class="hw-summary-unit">' +
      '<span class="hw-summary-label">Precio unitario</span>' +
      '<span class="hw-summary-value">' + escape(money(quote.unitario)) + '</span>' +
      '</div>';
    html += '<div class="hw-summary-total">' +
      '<span class="hw-summary-label">Total del trabajo</span>' +
      '<span class="hw-summary-value">' + escape(money(quote.total)) + '</span>' +
      '</div>';

    html += '<div class="hw-breakdown">';
    quote.lineas.forEach(function (l) {
      var detalle = l.detalle || '';
      if (l.tipo !== 'material' && l.cantidad > 0 && l.unidad !== 'lote') {
        detalle = (detalle ? detalle + ' · ' : '') + l.cantidad + ' ' + (l.unidad || 'ud');
      }
      html += '<div class="hw-breakdown-row">' +
        '<span class="hw-breakdown-name">' + escape(l.nombre) +
          (detalle ? '<small>' + escape(detalle) + '</small>' : '') +
        '</span>' +
        '<span class="hw-breakdown-value">' + escape(money(l.total)) + '</span>' +
        '</div>';
    });
    html += '</div>';

    if (quote.margenPct != null && opts.mostrarMargen !== false) {
      html += '<div class="hw-summary-note">Margen aplicado: ' +
        escape(quote.margenPct.toLocaleString('es-ES', { maximumFractionDigits: 2 })) + '%</div>';
    }
    if (opts.nota) {
      html += '<div class="hw-summary-note">' + escape(opts.nota) + '</div>';
    }
    el.innerHTML = html;
  }

  var api = {
    build: build,
    texto: texto,
    copiar: copiar,
    copiarTotal: copiarTotal,
    borrador: borrador,
    enviarAlGenerador: enviarAlGenerador,
    renderResumen: renderResumen
  };

  HW.quote = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
