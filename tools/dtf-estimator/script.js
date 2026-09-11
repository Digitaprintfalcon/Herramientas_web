document.addEventListener('DOMContentLoaded', () => {
  // Selección de elementos DOM
  const anchoDiseno = document.getElementById('anchoDiseno');
  const altoDiseno = document.getElementById('altoDiseno');
  const anchoImprimible = document.getElementById('anchoImprimible');
  const altoImprimible = document.getElementById('altoImprimible');
  const precioImpresion = document.getElementById('precioImpresion');
  const resultado = document.getElementById('resultado');

  function calcularPrecioUnitario() {
    const aDiseño = parseFloat(anchoDiseno.value) || 0;
    const hDiseño = parseFloat(altoDiseno.value) || 0;
    const aImp = parseFloat(anchoImprimible.value) || 0;
    const hImp = parseFloat(altoImprimible.value) || 100; // Fijo a 100 cm
    const precio = parseFloat(precioImpresion.value) || 0;

    if (aImp <= 0 || hImp <= 0) {
      resultado.textContent = "$0.00";
      return;
    }

    // Área del diseño vs Área total imprimible por metro
    const areaDiseno = aDiseño * hDiseño;
    const areaTotalImprimible = aImp * hImp;

    // Cálculo según fórmula especificada
    const precioUnitario = (areaDiseno / areaTotalImprimible) * precio;

    resultado.textContent = `$${precioUnitario.toFixed(2)}`;
  }

  // Escuchar eventos de cambio en cada campo relevante
  [anchoDiseno, altoDiseno, anchoImprimible, precioImpresion].forEach(element => {
    if (element) {
      element.addEventListener('input', calcularPrecioUnitario);
    }
  });

  // Cálculo inicial al cargar la página
  calcularPrecioUnitario();
});