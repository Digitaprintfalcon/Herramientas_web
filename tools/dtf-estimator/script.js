let dtfEstado = {
  anchoCm: 0,
  altoCm: 0,
  anchoImp: 0,
  piezas: 1,
  precioMetro: 0,
  planchado: false,
  costoPlanchado: 0,
  tipoPlanchado: 'pieza',
  unitario: 0,
  total: 0
};

let dtfBcv = null;

document.addEventListener('DOMContentLoaded', () => {
  const anchoDiseno = document.getElementById('anchoDiseno');
  const altoDiseno = document.getElementById('altoDiseno');
  const anchoImprimible = document.getElementById('anchoImprimible');
  const altoImprimible = document.getElementById('altoImprimible');
  const precioImpresion = document.getElementById('precioImpresion');
  const cantidadPiezas = document.getElementById('cantidadPiezas');

  const incluirPlanchado = document.getElementById('incluirPlanchado');
  const seccionPlanchado = document.getElementById('seccionPlanchado');
  const costoPlanchado = document.getElementById('costoPlanchado');
  const tipoPlanchado = document.getElementById('tipoPlanchado');

  const resultadoUnitario = document.getElementById('resultadoUnitario');
  const resultadoTotal = document.getElementById('resultadoTotal');

  dtfBcv = HW.bcv.mount(document.getElementById('bcvBox'));

  // Mostrar u ocultar la configuración de planchado al activar el switch
  incluirPlanchado.addEventListener('change', () => {
    seccionPlanchado.style.display = incluirPlanchado.checked ? 'flex' : 'none';
    calcularPrecios();
  });

  function calcularPrecios() {
    const aDiseño = parseFloat(anchoDiseno.value) || 0;
    const hDiseño = parseFloat(altoDiseno.value) || 0;
    const aImp = parseFloat(anchoImprimible.value) || 0;
    const hImp = parseFloat(altoImprimible.value) || 100;
    const precio = parseFloat(precioImpresion.value) || 0;
    const piezas = parseInt(cantidadPiezas.value) || 1;

    dtfEstado.anchoCm = aDiseño;
    dtfEstado.altoCm = hDiseño;
    dtfEstado.anchoImp = aImp;
    dtfEstado.piezas = piezas;
    dtfEstado.precioMetro = precio;
    dtfEstado.planchado = incluirPlanchado.checked;
    dtfEstado.costoPlanchado = parseFloat(costoPlanchado.value) || 0;
    dtfEstado.tipoPlanchado = tipoPlanchado.value;

    if (aImp <= 0 || hImp <= 0) {
      resultadoUnitario.textContent = HW.fmtCurrency(0);
      resultadoTotal.textContent = HW.fmtCurrency(0);
      dtfEstado.unitario = 0;
      dtfEstado.total = 0;
      if (dtfBcv) dtfBcv.setUsd(0);
      return;
    }

    const areaDiseno = aDiseño * hDiseño;
    const areaTotalImprimible = aImp * hImp;

    const precioUnitario = (areaDiseno / areaTotalImprimible) * precio;
    let precioTotalLote = precioUnitario * piezas;

    // Calcular costos de planchado si está habilitado
    if (incluirPlanchado.checked) {
      const valorPlanchado = parseFloat(costoPlanchado.value) || 0;
      if (tipoPlanchado.value === 'pieza') {
        precioTotalLote += valorPlanchado * piezas;
      } else {
        precioTotalLote += valorPlanchado; // Cobro único por lote
      }
    }

    dtfEstado.unitario = precioUnitario;
    dtfEstado.total = precioTotalLote;

    resultadoUnitario.textContent = HW.fmtCurrency(precioUnitario);
    resultadoTotal.textContent = HW.fmtCurrency(precioTotalLote);
    if (dtfBcv) dtfBcv.setUsd(precioTotalLote);
  }

  // Escuchar eventos en todos los inputs relevantes
  [anchoDiseno, altoDiseno, anchoImprimible, precioImpresion, cantidadPiezas, costoPlanchado, tipoPlanchado].forEach(element => {
    if (element) {
      element.addEventListener('input', calcularPrecios);
      element.addEventListener('change', calcularPrecios);
    }
  });

  calcularPrecios();
});

function dtfFmt(n, d) {
  return Number(n).toLocaleString('es-ES', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
}

function copiarCotizacion() {
  const e = dtfEstado;
  if (!(e.total > 0)) {
    HW.toast('Ingresa las medidas para cotizar', true);
    return;
  }
  const lineas = [];
  lineas.push('*COTIZACIÓN DTF*');
  lineas.push('Diseño: ' + dtfFmt(e.anchoCm, 1) + ' x ' + dtfFmt(e.altoCm, 1) + ' cm');
  lineas.push('Rollo: ' + dtfFmt(e.anchoImp, 1) + ' cm de ancho');
  lineas.push('Cantidad: ' + e.piezas + ' ' + (e.piezas === 1 ? 'pieza' : 'piezas'));
  lineas.push('Precio unitario: ' + HW.fmtUsd(e.unitario));
  if (e.planchado) {
    lineas.push('Planchado: ' + HW.fmtUsd(e.costoPlanchado) + (e.tipoPlanchado === 'pieza' ? ' por pieza' : ' por lote'));
  }
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
  HW.copyTotal(dtfEstado.total, tasa, 'Total copiado al portapapeles');
}

window.copiarCotizacion = copiarCotizacion;
window.copiarTotal = copiarTotal;
