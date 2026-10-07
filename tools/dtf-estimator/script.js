
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

  const bcv = HW.bcv.mount(document.getElementById('bcvBox'));

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

    if (aImp <= 0 || hImp <= 0) {
      resultadoUnitario.textContent = HW.fmtCurrency(0);
      resultadoTotal.textContent = HW.fmtCurrency(0);
      if (bcv) bcv.setUsd(0);
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

    resultadoUnitario.textContent = HW.fmtCurrency(precioUnitario);
    resultadoTotal.textContent = HW.fmtCurrency(precioTotalLote);
    if (bcv) bcv.setUsd(precioTotalLote);
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
  