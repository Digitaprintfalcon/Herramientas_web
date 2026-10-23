const DTF_PERSIST_KEY = 'hw_dtf_estado';

let dtfDisenos = [];   // [{ id, etiqueta, ancho, alto, cantidad }]
let dtfSeq = 1;
let dtfBcv = null;
let dtfResumen = {
  impresion: 0,
  planchado: 0,
  prenda: 0,
  piezas: 0,
  unitario: 0,
  total: 0
};

let dtfDom = {};

function dtfNuevoId() {
  return 'dis' + (dtfSeq++);
}

function dtfFmt(n, d) {
  return Number(n).toLocaleString('es-ES', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
}

// Subtotal de un diseño: área del diseño convertida a metros lineales de rollo.
function dtfSubtotal(d, anchoImp, precioMetro) {
  if (anchoImp <= 0) return 0;
  const areaDisenoM2 = HW.pricing.areaM2(d.ancho, d.alto);
  return HW.pricing.costoRollo(areaDisenoM2, anchoImp, precioMetro) * (d.cantidad || 0);
}

document.addEventListener('DOMContentLoaded', () => {
  dtfDom = {
    anchoImprimible: document.getElementById('anchoImprimible'),
    altoImprimible: document.getElementById('altoImprimible'),
    precioImpresion: document.getElementById('precioImpresion'),
    listaDisenos: document.getElementById('listaDisenos'),
    incluirPlanchado: document.getElementById('incluirPlanchado'),
    seccionPlanchado: document.getElementById('seccionPlanchado'),
    costoPlanchado: document.getElementById('costoPlanchado'),
    tipoPlanchado: document.getElementById('tipoPlanchado'),
    incluirPrenda: document.getElementById('incluirPrenda'),
    seccionPrenda: document.getElementById('seccionPrenda'),
    costoPrenda: document.getElementById('costoPrenda'),
    tipoPrenda: document.getElementById('tipoPrenda'),
    resultadoUnitario: document.getElementById('resultadoUnitario'),
    resultadoTotal: document.getElementById('resultadoTotal'),
    resumenImpresion: document.getElementById('resumenImpresion'),
    resumenPlanchado: document.getElementById('resumenPlanchado'),
    resumenPrenda: document.getElementById('resumenPrenda'),
    resumenPiezas: document.getElementById('resumenPiezas'),
    lineaResumenPlanchado: document.getElementById('lineaResumenPlanchado'),
    lineaResumenPrenda: document.getElementById('lineaResumenPrenda')
  };

  dtfBcv = HW.bcv.mount(document.getElementById('bcvBox'));

  const P = HW.pricing.PRECIOS;
  HW.pricing.poblar({
    anchoImprimible: P.dtf.anchoRolloCm,
    altoImprimible: P.dtf.altoRolloCm,
    precioImpresion: P.dtf.impresionMl,
    costoPlanchado: P.servicios.planchado,
    costoPrenda: P.dtf.prenda
  });

  dtfRestaurar();
  if (!dtfDisenos.length) {
    dtfDisenos.push({ id: dtfNuevoId(), etiqueta: '', ancho: 10, alto: 10, cantidad: 1 });
  }
  dtfRenderDisenos();

  dtfDom.incluirPlanchado.addEventListener('change', () => {
    dtfDom.seccionPlanchado.style.display = dtfDom.incluirPlanchado.checked ? 'flex' : 'none';
    dtfCalcular();
  });
  dtfDom.incluirPrenda.addEventListener('change', () => {
    dtfDom.seccionPrenda.style.display = dtfDom.incluirPrenda.checked ? 'flex' : 'none';
    dtfCalcular();
  });

  [
    dtfDom.anchoImprimible, dtfDom.precioImpresion,
    dtfDom.costoPlanchado, dtfDom.tipoPlanchado,
    dtfDom.costoPrenda, dtfDom.tipoPrenda
  ].forEach((el) => {
    if (el) {
      el.addEventListener('input', dtfCalcular);
      el.addEventListener('change', dtfCalcular);
    }
  });

  dtfCalcular();
});

// ===== Render de la lista de diseños =====

function dtfRenderDisenos() {
  const cont = dtfDom.listaDisenos;
  cont.innerHTML = '';

  if (!dtfDisenos.length) {
    const vacio = document.createElement('p');
    vacio.className = 'text-muted small text-center border rounded-3 py-3 mb-0';
    vacio.innerHTML = '<i class="bi bi-inbox me-1"></i>Sin diseños. Agrega uno para cotizar.';
    cont.appendChild(vacio);
    return;
  }

  dtfDisenos.forEach((d, i) => {
    cont.appendChild(dtfCrearFila(d, i));
  });
}

function dtfCrearFila(d, indice) {
  const card = document.createElement('div');
  card.className = 'border rounded-3 p-3 mb-2 bg-white';

  // Fila superior: etiqueta + eliminar
  const header = document.createElement('div');
  header.className = 'd-flex justify-content-between align-items-center mb-2 gap-2';

  const numero = document.createElement('span');
  numero.className = 'badge text-bg-light border text-secondary';
  numero.textContent = '#' + (indice + 1);

  const etiqueta = document.createElement('input');
  etiqueta.type = 'text';
  etiqueta.className = 'form-control form-control-sm';
  etiqueta.placeholder = 'Etiqueta (opcional)';
  etiqueta.value = d.etiqueta || '';
  etiqueta.maxLength = 40;
  etiqueta.addEventListener('input', () => {
    d.etiqueta = etiqueta.value;
    dtfPersistir();
  });

  const btnEliminar = document.createElement('button');
  btnEliminar.type = 'button';
  btnEliminar.className = 'btn btn-sm btn-outline-danger';
  btnEliminar.title = 'Eliminar diseño';
  btnEliminar.innerHTML = '<i class="bi bi-trash"></i>';
  btnEliminar.addEventListener('click', () => dtfEliminarDiseno(d.id));

  header.appendChild(numero);
  header.appendChild(etiqueta);
  header.appendChild(btnEliminar);
  card.appendChild(header);

  // Medidas
  const row = document.createElement('div');
  row.className = 'row g-2';

  const colAncho = dtfCampoNumero('Ancho', d.ancho, (v) => { d.ancho = v; dtfCalcular(); });
  const colAlto = dtfCampoNumero('Alto', d.alto, (v) => { d.alto = v; dtfCalcular(); });
  const colCant = dtfCampoNumero('Cantidad', d.cantidad, (v) => { d.cantidad = v; dtfCalcular(); }, 1);

  row.appendChild(colAncho);
  row.appendChild(colAlto);
  row.appendChild(colCant);
  card.appendChild(row);

  // Subtotal
  const pie = document.createElement('div');
  pie.className = 'd-flex justify-content-between align-items-center small mt-2';
  const area = document.createElement('span');
  area.className = 'text-muted';
  area.setAttribute('data-area', d.id);
  const subtotal = document.createElement('span');
  subtotal.className = 'fw-semibold';
  subtotal.setAttribute('data-subtotal', d.id);
  pie.appendChild(area);
  pie.appendChild(subtotal);
  card.appendChild(pie);

  return card;
}

function dtfCampoNumero(label, valor, onChange, min) {
  const col = document.createElement('div');
  col.className = 'col-4';

  const l = document.createElement('label');
  l.className = 'form-label text-muted mb-1';
  l.style.fontSize = '0.72rem';
  l.textContent = label;

  const group = document.createElement('div');
  group.className = 'input-group input-group-sm';

  const input = document.createElement('input');
  input.type = 'number';
  input.className = 'form-control';
  input.step = label === 'Cantidad' ? '1' : '0.1';
  input.min = String(min != null ? min : 0);
  input.value = valor;

  const suffix = document.createElement('span');
  suffix.className = 'input-group-text bg-light text-muted';
  suffix.textContent = label === 'Cantidad' ? 'un.' : 'cm';

  input.addEventListener('input', () => {
    const v = parseFloat(input.value) || 0;
    onChange(v);
  });

  group.appendChild(input);
  group.appendChild(suffix);
  col.appendChild(l);
  col.appendChild(group);
  return col;
}

function dtfActualizarSubtotales(anchoImp, precioMetro) {
  dtfDisenos.forEach((d) => {
    const sub = dtfSubtotal(d, anchoImp, precioMetro);
    const st = dtfDom.listaDisenos.querySelector('[data-subtotal="' + d.id + '"]');
    const ar = dtfDom.listaDisenos.querySelector('[data-area="' + d.id + '"]');
    if (st) st.textContent = 'Subtotal: ' + HW.fmtCurrency(sub);
    if (ar) ar.textContent = 'Área: ' + dtfFmt(d.ancho * d.alto, 1) + ' cm²';
  });
}

// ===== Acciones de la lista =====

function agregarDiseno() {
  dtfDisenos.push({ id: dtfNuevoId(), etiqueta: '', ancho: 10, alto: 10, cantidad: 1 });
  dtfRenderDisenos();
  dtfCalcular();
}

function dtfEliminarDiseno(id) {
  dtfDisenos = dtfDisenos.filter((d) => d.id !== id);
  dtfRenderDisenos();
  dtfCalcular();
}

// ===== Cálculo =====

function dtfCalcular() {
  const anchoImp = parseFloat(dtfDom.anchoImprimible.value) || 0;
  const precioMetro = parseFloat(dtfDom.precioImpresion.value) || 0;

  let totalImpresion = 0;
  let totalPiezas = 0;

  dtfDisenos.forEach((d) => {
    totalImpresion += dtfSubtotal(d, anchoImp, precioMetro);
    totalPiezas += d.cantidad;
  });

  dtfActualizarSubtotales(anchoImp, precioMetro);

  // Planchado
  let totalPlanchado = 0;
  if (dtfDom.incluirPlanchado.checked) {
    const v = parseFloat(dtfDom.costoPlanchado.value) || 0;
    totalPlanchado = dtfDom.tipoPlanchado.value === 'pieza' ? v * totalPiezas : v;
  }

  // Prenda
  let totalPrenda = 0;
  if (dtfDom.incluirPrenda.checked) {
    const v = parseFloat(dtfDom.costoPrenda.value) || 0;
    totalPrenda = dtfDom.tipoPrenda.value === 'pieza' ? v * totalPiezas : v;
  }

  const totalGeneral = totalImpresion + totalPlanchado + totalPrenda;
  const unitario = totalPiezas > 0 ? totalImpresion / totalPiezas : 0;

  dtfResumen = {
    impresion: totalImpresion,
    planchado: totalPlanchado,
    prenda: totalPrenda,
    piezas: totalPiezas,
    unitario: unitario,
    total: totalGeneral
  };

  dtfDom.resumenImpresion.textContent = HW.fmtCurrency(totalImpresion);
  dtfDom.resumenPlanchado.textContent = HW.fmtCurrency(totalPlanchado);
  dtfDom.resumenPrenda.textContent = HW.fmtCurrency(totalPrenda);
  dtfDom.resumenPiezas.textContent = totalPiezas;
  dtfDom.lineaResumenPlanchado.style.display = dtfDom.incluirPlanchado.checked ? 'flex' : 'none';
  dtfDom.lineaResumenPrenda.style.display = dtfDom.incluirPrenda.checked ? 'flex' : 'none';

  dtfDom.resultadoUnitario.textContent = HW.fmtCurrency(unitario);
  dtfDom.resultadoTotal.textContent = HW.fmtCurrency(totalGeneral);
  if (dtfBcv) dtfBcv.setUsd(totalGeneral);

  dtfPersistir();
}

// ===== Persistencia =====

function dtfPersistir() {
  HW.persist.set(DTF_PERSIST_KEY, {
    disenos: dtfDisenos,
    anchoImp: dtfDom.anchoImprimible.value,
    precioMetro: dtfDom.precioImpresion.value,
    planchado: {
      on: dtfDom.incluirPlanchado.checked,
      costo: dtfDom.costoPlanchado.value,
      tipo: dtfDom.tipoPlanchado.value
    },
    prenda: {
      on: dtfDom.incluirPrenda.checked,
      costo: dtfDom.costoPrenda.value,
      tipo: dtfDom.tipoPrenda.value
    }
  });
}

function dtfRestaurar() {
  const est = HW.persist.get(DTF_PERSIST_KEY, null);
  if (!est || typeof est !== 'object') return;

  if (est.anchoImp != null) dtfDom.anchoImprimible.value = est.anchoImp;
  if (est.precioMetro != null) dtfDom.precioImpresion.value = est.precioMetro;

  const pl = est.planchado || {};
  dtfDom.incluirPlanchado.checked = !!pl.on;
  if (pl.costo != null) dtfDom.costoPlanchado.value = pl.costo;
  if (pl.tipo) dtfDom.tipoPlanchado.value = pl.tipo;
  dtfDom.seccionPlanchado.style.display = pl.on ? 'flex' : 'none';

  const pr = est.prenda || {};
  dtfDom.incluirPrenda.checked = !!pr.on;
  if (pr.costo != null) dtfDom.costoPrenda.value = pr.costo;
  if (pr.tipo) dtfDom.tipoPrenda.value = pr.tipo;
  dtfDom.seccionPrenda.style.display = pr.on ? 'flex' : 'none';

  if (Array.isArray(est.disenos)) {
    dtfDisenos = est.disenos
      .filter((d) => d && typeof d === 'object')
      .map((d) => ({
        id: dtfNuevoId(),
        etiqueta: typeof d.etiqueta === 'string' ? d.etiqueta : '',
        ancho: parseFloat(d.ancho) || 0,
        alto: parseFloat(d.alto) || 0,
        cantidad: parseInt(d.cantidad, 10) || 1
      }));
  }
}

// ===== Copiado =====

function copiarCotizacion() {
  const e = dtfResumen;
  if (!(e.total > 0)) {
    HW.toast('Ingresa las medidas para cotizar', true);
    return;
  }

  const lineas = [];
  lineas.push('*COTIZACIÓN DTF*');

  if (dtfDisenos.length) {
    lineas.push('--- Diseños ---');
    dtfDisenos.forEach((d, i) => {
      const nombre = d.etiqueta ? d.etiqueta + ': ' : 'Diseño ' + (i + 1) + ': ';
      const sub = dtfSubtotal(d, parseFloat(dtfDom.anchoImprimible.value) || 0, parseFloat(dtfDom.precioImpresion.value) || 0);
      lineas.push(nombre + dtfFmt(d.ancho, 1) + ' x ' + dtfFmt(d.alto, 1) + ' cm × ' + d.cantidad + ' = ' + HW.fmtUsd(sub));
    });
  }

  lineas.push('Rollo: ' + dtfFmt(parseFloat(dtfDom.anchoImprimible.value) || 0, 1) + ' cm de ancho');
  lineas.push('Impresión: ' + HW.fmtUsd(e.impresion) + ' (' + HW.fmtUsd(e.unitario) + '/pieza)');

  if (dtfDom.incluirPlanchado.checked) {
    lineas.push('Planchado: ' + HW.fmtUsd(e.planchado) + ' (' + HW.fmtUsd(parseFloat(dtfDom.costoPlanchado.value) || 0) + (dtfDom.tipoPlanchado.value === 'pieza' ? ' por pieza' : ' por lote') + ')');
  }
  if (dtfDom.incluirPrenda.checked) {
    lineas.push('Prenda: ' + HW.fmtUsd(e.prenda) + ' (' + HW.fmtUsd(parseFloat(dtfDom.costoPrenda.value) || 0) + (dtfDom.tipoPrenda.value === 'pieza' ? ' por pieza' : ' por lote') + ')');
  }

  lineas.push('Total piezas: ' + e.piezas);
  lineas.push('');
  lineas.push('*TOTAL: ' + HW.fmtUsd(e.total) + '*');

  const tasa = dtfBcv ? dtfBcv.getTasa() : 0;
  if (tasa > 0) {
    lineas.push('Equivalente: ' + HW.fmtBs(e.total * tasa));
    lineas.push('Tasa BCV: ' + dtfFmt(tasa, 2) + ' Bs/$');
  }
  HW.copyResult(lineas.join('\n'), 'Cotización copiada al portapapeles');
}

function copiarTotal() {
  const tasa = dtfBcv ? dtfBcv.getTasa() : 0;
  HW.copyTotal(dtfResumen.total, tasa, 'Total copiado al portapapeles');
}

window.agregarDiseno = agregarDiseno;
window.copiarCotizacion = copiarCotizacion;
window.copiarTotal = copiarTotal;
