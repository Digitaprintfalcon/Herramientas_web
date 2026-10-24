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
      var lineCantidad = m.cantidad != null ? num(m.cantidad) : cantidad;
      return {
        tipo: 'material',
        nombre: m.nombre || 'Material',
        detalle: m.detalle || '',
        unidad: unidad,
        cantidad: lineCantidad,
        precioUnitario: lineCantidad > 0 ? precio / lineCantidad : 0,
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
    el.innerHTML = '';
    var esc = escape;

    var unit = document.createElement('div');
    unit.className = 'hw-summary-unit';
    var unitLabel = document.createElement('span');
    unitLabel.className = 'hw-summary-label';
    unitLabel.textContent = 'Precio unitario';
    var unitValue = document.createElement('span');
    unitValue.className = 'hw-summary-value';
    unitValue.textContent = (HW.fmtUsd ? HW.fmtUsd(quote.unitario) : money(quote.unitario));
    unit.appendChild(unitLabel);
    unit.appendChild(unitValue);
    el.appendChild(unit);

    var total = document.createElement('div');
    total.className = 'hw-summary-total';
    var totalLabel = document.createElement('span');
    totalLabel.className = 'hw-summary-label';
    totalLabel.textContent = 'Total del trabajo';
    var totalValue = document.createElement('span');
    totalValue.className = 'hw-summary-value';
    totalValue.textContent = (HW.fmtUsd ? HW.fmtUsd(quote.total) : money(quote.total));
    total.appendChild(totalLabel);
    total.appendChild(totalValue);
    el.appendChild(total);

    var breakdown = document.createElement('div');
    breakdown.className = 'hw-breakdown';
    quote.lineas.forEach(function (l) {
      var detalle = l.detalle || '';
      if (l.tipo !== 'material' && l.cantidad > 0 && l.unidad !== 'lote') {
        detalle = (detalle ? detalle + ' · ' : '') + l.cantidad + ' ' + (l.unidad || 'ud');
      }
      var row = document.createElement('div');
      row.className = 'hw-breakdown-row';
      var name = document.createElement('span');
      name.className = 'hw-breakdown-name';
      name.textContent = l.nombre || '';
      if (detalle) {
        var small = document.createElement('small');
        small.textContent = detalle;
        name.appendChild(small);
      }
      var val = document.createElement('span');
      val.className = 'hw-breakdown-value';
      val.textContent = (HW.fmtUsd ? HW.fmtUsd(l.total) : money(l.total));
      row.appendChild(name);
      row.appendChild(val);
      breakdown.appendChild(row);
    });
    el.appendChild(breakdown);

    if (quote.margenPct != null && opts.mostrarMargen !== false) {
      var note = document.createElement('div');
      note.className = 'hw-summary-note';
      note.textContent = 'Margen aplicado: ' + Number(quote.margenPct).toLocaleString('es-ES', { maximumFractionDigits: 2 }) + '%';
      el.appendChild(note);
    }
    if (opts.nota) {
      var note2 = document.createElement('div');
      note2.className = 'hw-summary-note';
      note2.textContent = String(opts.nota);
      el.appendChild(note2);
    }
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
