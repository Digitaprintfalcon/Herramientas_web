// Última cotización calculada (para copiar lo mismo que se muestra en pantalla)
const bannerEstado = {
  anchoCm: 0,
  altoCm: 0,
  areaM2: 0,
  precioM2: 0,
  piezas: 1,
  unitario: 0,
  total: 0
};

let bannerBcv = null;

function bannerFmt(n, d) {
  return Number(n).toLocaleString('es-ES', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
}

document.addEventListener('DOMContentLoaded', () => {
  const anchoDiseno = document.getElementById('anchoDiseno');
  const altoDiseno = document.getElementById('altoDiseno');
  const precioMetroCuadrado = document.getElementById('precioMetroCuadrado');
  const costoLogistica = document.getElementById('costoLogistica');
  const cantidadPiezas = document.getElementById('cantidadPiezas');

  const costoImpresionEl = document.getElementById('costoImpresion');
  const costoTotalUnitarioEl = document.getElementById('costoTotalUnitario');
  const costoTotalGeneralEl = document.getElementById('costoTotalGeneral');

  bannerBcv = HW.bcv.mount(document.getElementById('bcvBox'));

  function calcular() {
    const aDiseñoCm = parseFloat(anchoDiseno.value) || 0;
    const hDiseñoCm = parseFloat(altoDiseno.value) || 0;
    const precioM2 = parseFloat(precioMetroCuadrado.value) || 0;
    const totalLogistica = parseFloat(costoLogistica.value) || 0;
    const piezas = parseFloat(cantidadPiezas.value) || 1;

    // 1. Costo de Impresión directo por área
    const areaM2 = (aDiseñoCm / 100) * (hDiseñoCm / 100);
    const costoImpresionUnitario = areaM2 * precioM2;

    // 2. Costo logístico por unidad
    const logisticaUnitario = piezas > 0 ? (totalLogistica / piezas) : 0;

    // 3. Costo Total Unitario
    const costoFinal = costoImpresionUnitario + logisticaUnitario;

    // 4. Precio total del trabajo
    const totalGeneral = costoFinal * (piezas > 0 ? piezas : 0);

    bannerEstado.anchoCm = aDiseñoCm;
    bannerEstado.altoCm = hDiseñoCm;
    bannerEstado.areaM2 = areaM2;
    bannerEstado.precioM2 = precioM2;
    bannerEstado.piezas = piezas;
    bannerEstado.unitario = costoFinal;
    bannerEstado.total = totalGeneral;

    if (costoImpresionEl) costoImpresionEl.textContent = HW.fmtCurrency(costoImpresionUnitario);
    if (costoTotalUnitarioEl) costoTotalUnitarioEl.textContent = HW.fmtCurrency(costoFinal);
    if (costoTotalGeneralEl) costoTotalGeneralEl.textContent = HW.fmtCurrency(totalGeneral);
    if (bannerBcv) bannerBcv.setUsd(totalGeneral);
  }

  [anchoDiseno, altoDiseno, precioMetroCuadrado, costoLogistica, cantidadPiezas].forEach(el => {
    if (el) {
      el.addEventListener('input', calcular);
    }
  });

  // Cálculo inicial
  calcular();
});

function copiarCotizacion() {
  const e = bannerEstado;
  if (!(e.total > 0)) {
    HW.toast('Ingresa las medidas para cotizar', true);
    return;
  }
  const lineas = [];
  lineas.push('*COTIZACIÓN PENDONES*');
  lineas.push(e.piezas + ' ' + (e.piezas === 1 ? 'unidad' : 'unidades') + ' de ' + bannerFmt(e.anchoCm, 1) + ' x ' + bannerFmt(e.altoCm, 1) + ' cm');
  lineas.push('Área por unidad: ' + bannerFmt(e.areaM2, 3) + ' m²');
  lineas.push('Material: ' + HW.fmtUsd(e.precioM2) + ' /m²');
  lineas.push('Precio unitario: ' + HW.fmtUsd(e.unitario));
  lineas.push('');
  lineas.push('*TOTAL: ' + HW.fmtUsd(e.total) + '*');
  const tasa = bannerBcv ? bannerBcv.getTasa() : 0;
  if (tasa > 0) {
    lineas.push('Equivalente: ' + HW.fmtBs(e.total * tasa));
    lineas.push('Tasa BCV: ' + bannerFmt(tasa, 2) + ' Bs/$');
  }
  HW.copyResult(lineas.join('\n'), 'Cotización copiada al portapapeles');
}

function copiarTotal() {
  const tasa = bannerBcv ? bannerBcv.getTasa() : 0;
  HW.copyTotal(bannerEstado.total, tasa, 'Total copiado al portapapeles');
}

window.copiarCotizacion = copiarCotizacion;
window.copiarTotal = copiarTotal;
