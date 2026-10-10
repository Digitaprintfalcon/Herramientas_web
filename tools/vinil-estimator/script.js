let vinilEstado = {
  anchoCm: 0,
  altoCm: 0,
  anchoRollo: 0,
  precioVinil: 0,
  cantidad: 1,
  laminado: false,
  precioLaminado: 0,
  diseno: false,
  costoDiseno: 0,
  corte: false,
  costoCorte: 0,
  instalacion: false,
  costoInstalacion: 0,
  unitario: 0,
  total: 0
};

let vinilBcv = null;

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
  const resultadoUnitario = document.getElementById('resultadoUnitario');
  const resultado = document.getElementById('resultado');

  vinilBcv = HW.bcv.mount(document.getElementById('bcvBox'));

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

    vinilEstado.anchoCm = aPieza;
    vinilEstado.altoCm = hPieza;
    vinilEstado.anchoRollo = aRollo;
    vinilEstado.precioVinil = precioVinil;
    vinilEstado.cantidad = cantidad;
    vinilEstado.laminado = incluirLaminado.checked;
    vinilEstado.precioLaminado = parseFloat(precioLaminado.value) || 0;
    vinilEstado.diseno = incluirDiseno.checked;
    vinilEstado.costoDiseno = parseFloat(costoDiseno.value) || 0;
    vinilEstado.corte = incluirCorte.checked;
    vinilEstado.costoCorte = parseFloat(costoCorte.value) || 0;
    vinilEstado.instalacion = incluirInstalacion.checked;
    vinilEstado.costoInstalacion = parseFloat(costoInstalacion.value) || 0;

    if (aRollo <= 0) {
      resultadoUnitario.textContent = "$0.00";
      resultado.textContent = "$0.00";
      vinilEstado.unitario = 0;
      vinilEstado.total = 0;
      if (vinilBcv) vinilBcv.setUsd(0);
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

    vinilEstado.unitario = costoUnitarioTotal;
    vinilEstado.total = precioFinal;

    resultadoUnitario.textContent = HW.fmtCurrency(costoUnitarioTotal);
    resultado.textContent = HW.fmtCurrency(precioFinal);
    if (vinilBcv) vinilBcv.setUsd(precioFinal);
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

function vinilFmt(n, d) {
  return Number(n).toLocaleString('es-ES', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
}

function copiarCotizacion() {
  const e = vinilEstado;
  if (!(e.total > 0)) {
    HW.toast('Ingresa las medidas para cotizar', true);
    return;
  }
  const lineas = [];
  lineas.push('*COTIZACIÓN VINIL*');
  lineas.push(e.cantidad + ' ' + (e.cantidad === 1 ? 'unidad' : 'unidades') + ' de ' + vinilFmt(e.anchoCm, 1) + ' x ' + vinilFmt(e.altoCm, 1) + ' cm');
  lineas.push('Vinil: ' + HW.fmtUsd(e.precioVinil) + ' /m²');
  const extras = [];
  if (e.laminado) extras.push('Laminado: ' + HW.fmtUsd(e.precioLaminado) + ' /m²');
  if (e.diseno) extras.push('Diseño: ' + HW.fmtUsd(e.costoDiseno));
  if (e.corte) extras.push('Corte: ' + HW.fmtUsd(e.costoCorte));
  if (e.instalacion) extras.push('Instalación: ' + HW.fmtUsd(e.costoInstalacion));
  extras.forEach(function (x) { lineas.push('• ' + x); });
  lineas.push('Precio unitario: ' + HW.fmtUsd(e.unitario));
  lineas.push('');
  lineas.push('*TOTAL: ' + HW.fmtUsd(e.total) + '*');
  const tasa = vinilBcv ? vinilBcv.getTasa() : 0;
  if (tasa > 0) {
    lineas.push('Equivalente: ' + HW.fmtBs(e.total * tasa));
    lineas.push('Tasa BCV: ' + vinilFmt(tasa, 2) + ' Bs/$');
  }
  HW.copyResult(lineas.join('\n'), 'Cotización copiada al portapapeles');
}

function copiarTotal() {
  const tasa = vinilBcv ? vinilBcv.getTasa() : 0;
  HW.copyTotal(vinilEstado.total, tasa, 'Total copiado al portapapeles');
}

window.copiarCotizacion = copiarCotizacion;
window.copiarTotal = copiarTotal;
