document.addEventListener('DOMContentLoaded', () => {
  const anchoDiseno = document.getElementById('anchoDiseno');
  const altoDiseno = document.getElementById('altoDiseno');
  const precioMetroCuadrado = document.getElementById('precioMetroCuadrado');
  const costoLogistica = document.getElementById('costoLogistica');
  const cantidadPiezas = document.getElementById('cantidadPiezas');

  const costoImpresionEl = document.getElementById('costoImpresion');
  const costoTotalUnitarioEl = document.getElementById('costoTotalUnitario');

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

    if (costoImpresionEl) costoImpresionEl.textContent = `$${costoImpresionUnitario.toFixed(2)}`;
    if (costoTotalUnitarioEl) costoTotalUnitarioEl.textContent = `$${costoFinal.toFixed(2)}`;
  }

  [anchoDiseno, altoDiseno, precioMetroCuadrado, costoLogistica, cantidadPiezas].forEach(el => {
    if (el) {
      el.addEventListener('input', calcular);
    }
  });

  // Cálculo inicial
  calcular();
});