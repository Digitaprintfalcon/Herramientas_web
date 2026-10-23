// Última cotización calculada (para copiar lo mismo que se muestra en pantalla)
const bannerEstado = {
  anchoCm: 0,
  altoCm: 0,
  areaM2: 0,
  precioM2: 0,
  piezas: 1,
  accesorios: [],
  extrasUnitario: 0,
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
  const incluirOjales = document.getElementById('incluirOjales');
  const cantidadOjales = document.getElementById('cantidadOjales');
  const incluirBolsillos = document.getElementById('incluirBolsillos');
  const cantidadBolsillos = document.getElementById('cantidadBolsillos');

  const costoImpresionEl = document.getElementById('costoImpresion');
  const costoTotalUnitarioEl = document.getElementById('costoTotalUnitario');
  const costoTotalGeneralEl = document.getElementById('costoTotalGeneral');
  const detalleAccesoriosEl = document.getElementById('detalleAccesorios');

  bannerBcv = HW.bcv.mount(document.getElementById('bcvBox'));

  const P = HW.pricing.PRECIOS;
  HW.pricing.poblar({
    precioMetroCuadrado: P.banner.impresionM2,
    costoLogistica: P.banner.logistica,
    cantidadOjales: P.accesorios.ojales.cantidad,
    cantidadBolsillos: P.accesorios.bolsillos.cantidad
  });

  function sincronizarAccesorios() {
    if (cantidadOjales) cantidadOjales.disabled = !incluirOjales.checked;
    if (cantidadBolsillos) cantidadBolsillos.disabled = !incluirBolsillos.checked;
  }

  function calcular() {
    const aDiseñoCm = parseFloat(anchoDiseno.value) || 0;
    const hDiseñoCm = parseFloat(altoDiseno.value) || 0;
    const precioM2 = parseFloat(precioMetroCuadrado.value) || 0;
    const totalLogistica = parseFloat(costoLogistica.value) || 0;
    const piezas = parseFloat(cantidadPiezas.value) || 1;

    // 1. Costo de Impresión directo por área
    const areaM2 = HW.pricing.areaM2(aDiseñoCm, hDiseñoCm);
    const costoImpresionUnitario = HW.pricing.costoArea(areaM2, precioM2);

    // 2. Costo logístico por unidad
    const logisticaUnitario = piezas > 0 ? (totalLogistica / piezas) : 0;

    // 3. Accesorios por pieza
    const accesorios = [];
    const agregarAccesorio = (label, activo, precio, cantidad) => {
      const unidades = Math.max(0, parseInt(cantidad, 10) || 0);
      if (!activo || unidades <= 0) return;
      accesorios.push({
        label,
        cantidad: unidades,
        precio,
        subtotal: HW.pricing.total(precio, unidades)
      });
    };
    agregarAccesorio('Ojales', incluirOjales.checked, P.accesorios.ojales.precio, cantidadOjales.value);
    agregarAccesorio('Bolsillos', incluirBolsillos.checked, P.accesorios.bolsillos.precio, cantidadBolsillos.value);
    const extrasUnitario = accesorios.reduce((suma, a) => suma + a.subtotal, 0);

    // 4. Costo Total Unitario
    const costoFinal = HW.pricing.conServicios(costoImpresionUnitario, [logisticaUnitario, extrasUnitario]);

    // 5. Precio total del trabajo
    const totalGeneral = HW.pricing.total(costoFinal, piezas > 0 ? piezas : 0);

    bannerEstado.anchoCm = aDiseñoCm;
    bannerEstado.altoCm = hDiseñoCm;
    bannerEstado.areaM2 = areaM2;
    bannerEstado.precioM2 = precioM2;
    bannerEstado.piezas = piezas;
    bannerEstado.accesorios = accesorios;
    bannerEstado.extrasUnitario = extrasUnitario;
    bannerEstado.unitario = costoFinal;
    bannerEstado.total = totalGeneral;

    if (costoImpresionEl) costoImpresionEl.textContent = HW.fmtCurrency(costoImpresionUnitario);
    if (costoTotalUnitarioEl) costoTotalUnitarioEl.textContent = HW.fmtCurrency(costoFinal);
    if (costoTotalGeneralEl) costoTotalGeneralEl.textContent = HW.fmtCurrency(totalGeneral);
    if (detalleAccesoriosEl) {
      detalleAccesoriosEl.classList.toggle('d-none', accesorios.length === 0);
      detalleAccesoriosEl.textContent = accesorios.length
        ? 'Accesorios: ' + accesorios.map(a => a.cantidad + ' ' + a.label.toLowerCase() + ' (' + HW.fmtUsd(a.subtotal) + ')').join(' + ') + ' = ' + HW.fmtUsd(extrasUnitario) + '/u'
        : '';
    }
    if (bannerBcv) bannerBcv.setUsd(totalGeneral);
  }

  [anchoDiseno, altoDiseno, precioMetroCuadrado, costoLogistica, cantidadPiezas, cantidadOjales, cantidadBolsillos].forEach(el => {
    if (el) {
      el.addEventListener('input', calcular);
    }
  });

  [incluirOjales, incluirBolsillos].forEach(el => {
    if (el) {
      el.addEventListener('change', () => {
        sincronizarAccesorios();
        calcular();
      });
    }
  });

  sincronizarAccesorios();
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
  if (e.accesorios.length) {
    lineas.push('Accesorios por pieza:');
    e.accesorios.forEach(a => {
      lineas.push('• ' + a.label + ': ' + a.cantidad + ' × ' + HW.fmtUsd(a.precio) + ' = ' + HW.fmtUsd(a.subtotal));
    });
  }
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
