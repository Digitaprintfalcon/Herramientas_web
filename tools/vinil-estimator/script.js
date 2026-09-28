document.addEventListener('DOMContentLoaded', () => {
  const anchoPieza = document.getElementById('anchoPieza');
  const altoPieza = document.getElementById('altoPieza');
  const anchoRollo = document.getElementById('anchoRollo');
  const precioImpresion = document.getElementById('precioImpresion');
  
  const incluirLaminado = document.getElementById('incluirLaminado');
  const seccionLaminado = document.getElementById('seccionLaminado');
  const anchoLaminado = document.getElementById('anchoLaminado');
  const precioLaminado = document.getElementById('precioLaminado');

  const incluirDiseno = document.getElementById('incluirDiseno');
  const seccionDiseno = document.getElementById('seccionDiseno');
  const costoDiseno = document.getElementById('costoDiseno');

  const incluirCorte = document.getElementById('incluirCorte');
  const seccionCorte = document.getElementById('seccionCorte');
  const costoCorte = document.getElementById('costoCorte');

  const incluirInstalacion = document.getElementById('incluirInstalacion');
  const seccionInstalacion = document.getElementById('seccionInstalacion');
  const costoInstalacion = document.getElementById('costoInstalacion');

  const cantidadPiezas = document.getElementById('cantidadPiezas');
  const resultado = document.getElementById('resultado');

  const bcv = HW.bcv.mount(document.getElementById('bcvBox'));

  // Eventos para mostrar/ocultar secciones opcionales
  incluirLaminado.addEventListener('change', () => {
    seccionLaminado.style.display = incluirLaminado.checked ? 'flex' : 'none';
    calcularPrecio();
  });

  incluirDiseno.addEventListener('change', () => {
    seccionDiseno.style.display = incluirDiseno.checked ? 'block' : 'none';
    calcularPrecio();
  });

  incluirCorte.addEventListener('change', () => {
    seccionCorte.style.display = incluirCorte.checked ? 'block' : 'none';
    calcularPrecio();
  });

  incluirInstalacion.addEventListener('change', () => {
    seccionInstalacion.style.display = incluirInstalacion.checked ? 'block' : 'none';
    calcularPrecio();
  });

  function calcularPrecio() {
    const aPieza = parseFloat(anchoPieza.value) || 0;
    const hPieza = parseFloat(altoPieza.value) || 0;
    const aRollo = parseFloat(anchoRollo.value) || 0;
    const precioVinil = parseFloat(precioImpresion.value) || 0;
    const cantidad = parseInt(cantidadPiezas.value) || 1;

    if (aRollo <= 0) {
      resultado.textContent = "$0.00";
      if (bcv) bcv.setUsd(0);
      return;
    }

    // Parte 1: Calcular el precio unitario del vinil
    const costoVinilUnitario = aPieza * hPieza * precioVinil * 0.0001;

    // Parte 2: Calcular el precio unitario del laminado (si está activo)
    let costoLamUnitario = 0;
    if (incluirLaminado.checked) {
      const aLam = parseFloat(anchoLaminado.value) || aRollo;
      const precioLam = parseFloat(precioLaminado.value) || 0;
      if (aLam > 0) {
        costoLamUnitario = (aPieza * hPieza) / (aLam * 100) * precioLam;
      }
    }

    // Parte 3: Costo unitario opcional de diseño (si está activo)
    let costoDisUnitario = 0;
    if (incluirDiseno.checked) {
      costoDisUnitario = parseFloat(costoDiseno.value) || 0;
    }

    // Parte 4: Costo unitario opcional de corte (si está activo)
    let costoCorUnitario = 0;
    if (incluirCorte.checked) {
      costoCorUnitario = parseFloat(costoCorte.value) || 0;
    }

    // Parte 5: Costo unitario opcional de instalación (si está activo)
    let costoInstUnitario = 0;
    if (incluirInstalacion.checked) {
      costoInstUnitario = parseFloat(costoInstalacion.value) || 0;
    }

    // Sumar todos los costos por pieza y multiplicar por la cantidad total
    const costoUnitarioTotal = costoVinilUnitario + costoLamUnitario + costoDisUnitario + costoCorUnitario + costoInstUnitario;
    const precioFinal = costoUnitarioTotal * (cantidad > 0 ? cantidad : 1);

    resultado.textContent = HW.fmtCurrency(precioFinal);
    if (bcv) bcv.setUsd(precioFinal);
  }

  const inputsMonitoreados = [
    anchoPieza, altoPieza, anchoRollo, precioImpresion, 
    anchoLaminado, precioLaminado, costoDiseno, costoCorte, 
    costoInstalacion, cantidadPiezas
  ];

  inputsMonitoreados.forEach(element => {
    if (element) {
      element.addEventListener('input', calcularPrecio);
    }
  });

  calcularPrecio();
});