(function (root) {
  'use strict';

  // Margen único sobre el precio de venta para todos los materiales.
  // El catálogo separa costos de precios de venta: los servicios y accesorios
  // ya son precios fijos y no reciben margen.
  var MARGEN_DEFAULT = 40;

  var COSTOS = {
    vinilAdhesivoM2: 15,
    vinilTextilMl: 3.5,
    vinilTextilAnchoRolloCm: 50,
    laminadoVinilMl: 12,
    laminadoVinilAnchoRolloCm: 135,
    bannerM2: 15,
    dtfMl: 15,
    dtfAnchoRolloCm: 57,
    dtfAltoRolloCm: 100,
    pvcHoja: 45,
    pvcBaseLargoCm: 244,
    pvcBaseAnchoCm: 122,
    pvcMerma: 10,
    pvcVinilM2: 15,
    pvcVinilMerma: 10,
    pvcLaminadoM2: 8
  };

  var SERVICIOS = {
    diseno: { precio: 5, unidad: 'pieza' },
    corte: { precio: 5, unidad: 'pieza' },
    planchado: { precio: 1.5, unidad: 'pieza' },
    instalacion: { precio: 10, unidad: 'pieza' },
    prenda: { precio: 5, unidad: 'pieza' },
    logistica: { precio: 10, unidad: 'lote' }
  };

  var ACCESORIOS = {
    ojales: { precio: 1, cantidad: 4, unidad: 'ud', aplicaA: ['banner'] },
    bolsillos: { precio: 2, cantidad: 4, unidad: 'ud', aplicaA: ['banner'] },
    separadores: { precio: 2, cantidad: 4, unidad: 'ud', aplicaA: ['pvc'] }
  };

  // Compatibilidad temporal con las claves que usaban los estimadores viejos.
  // Las nuevas herramientas consumen COSTOS, SERVICIOS y ACCESORIOS.
  var PRECIOS = {
    margen: MARGEN_DEFAULT,
    costos: COSTOS,
    servicios: {
      planchado: SERVICIOS.planchado.precio,
      instalacion: SERVICIOS.instalacion.precio,
      diseno: SERVICIOS.diseno.precio,
      corte: SERVICIOS.corte.precio,
      prenda: SERVICIOS.prenda.precio,
      logistica: SERVICIOS.logistica.precio
    },
    accesorios: ACCESORIOS,
    vinil: {
      costoM2: COSTOS.vinilAdhesivoM2,
      impresionM2: 25,
      costoLaminadoMl: COSTOS.laminadoVinilMl,
      laminadoMl: COSTOS.laminadoVinilMl,
      anchoRolloLaminadoCm: COSTOS.laminadoVinilAnchoRolloCm,
      diseno: SERVICIOS.diseno.precio,
      corte: SERVICIOS.corte.precio
    },
    banner: {
      costoM2: COSTOS.bannerM2,
      impresionM2: 25,
      logistica: SERVICIOS.logistica.precio
    },
    corte: {
      costoMl: COSTOS.vinilTextilMl,
      costoM2: COSTOS.vinilTextilMl / (COSTOS.vinilTextilAnchoRolloCm / 100),
      materialMl: COSTOS.vinilTextilMl,
      materialM2: COSTOS.vinilTextilMl / (COSTOS.vinilTextilAnchoRolloCm / 100),
      anchoRolloCm: COSTOS.vinilTextilAnchoRolloCm,
      margen: MARGEN_DEFAULT
    },
    dtf: {
      costoMl: COSTOS.dtfMl,
      impresionMl: 25,
      anchoRolloCm: COSTOS.dtfAnchoRolloCm,
      altoRolloCm: COSTOS.dtfAltoRolloCm,
      prenda: SERVICIOS.prenda.precio
    },
    pvc: {
      baseLargoCm: COSTOS.pvcBaseLargoCm,
      baseAnchoCm: COSTOS.pvcBaseAnchoCm,
      costoHoja: COSTOS.pvcHoja,
      merma: COSTOS.pvcMerma,
      margen: MARGEN_DEFAULT,
      vinilCostoM2: COSTOS.pvcVinilM2,
      vinilMerma: COSTOS.pvcVinilMerma,
      vinilMargen: MARGEN_DEFAULT,
      laminadoCostoM2: COSTOS.pvcLaminadoM2,
      laminadoMargen: MARGEN_DEFAULT,
      tasaFallback: 857.01
    }
  };

  function num(value) {
    var n = parseFloat(value);
    return isFinite(n) ? n : 0;
  }

  function redondear(value, decimales) {
    var d = decimales == null ? 2 : decimales;
    var f = Math.pow(10, d);
    return Math.round((num(value) + Number.EPSILON) * f) / f;
  }

  function areaM2(anchoCm, altoCm) {
    return (num(anchoCm) / 100) * (num(altoCm) / 100);
  }

  function areaCm2(anchoCm, altoCm) {
    return num(anchoCm) * num(altoCm);
  }

  function metrosLineales(area, anchoRolloCm) {
    var anchoM = num(anchoRolloCm) / 100;
    return anchoM > 0 ? num(area) / anchoM : 0;
  }

  function costoArea(area, precioM2) {
    return num(area) * num(precioM2);
  }

  function costoRollo(area, anchoRolloCm, precioMl) {
    return metrosLineales(area, anchoRolloCm) * num(precioMl);
  }

  function aplicarMerma(costo, mermaPct) {
    return num(costo) * (1 + num(mermaPct) / 100);
  }

  // Margen sobre el precio de venta: costo / (1 - margen/100).
  // Un margen >= 100% no es representable; se devuelve el costo para evitar Infinity.
  function precioVenta(costo, margenPct) {
    var m = num(margenPct);
    if (m >= 100) return num(costo);
    return num(costo) / (1 - m / 100);
  }

  function conServicios(precio, servicios) {
    var total = num(precio);
    (servicios || []).forEach(function (s) {
      total += num(s);
    });
    return total;
  }

  function total(unitario, cantidad) {
    return num(unitario) * num(cantidad);
  }

  function poblar(mapa, doc) {
    var d = doc || (typeof document !== 'undefined' ? document : null);
    if (!d) return;
    Object.keys(mapa || {}).forEach(function (id) {
      var el = d.getElementById(id);
      if (el && mapa[id] != null) el.value = String(mapa[id]);
    });
  }

  var api = {
    MARGEN_DEFAULT: MARGEN_DEFAULT,
    PRECIOS: PRECIOS,
    COSTOS: COSTOS,
    SERVICIOS: SERVICIOS,
    ACCESORIOS: ACCESORIOS,
    num: num,
    redondear: redondear,
    areaM2: areaM2,
    areaCm2: areaCm2,
    metrosLineales: metrosLineales,
    costoArea: costoArea,
    costoRollo: costoRollo,
    aplicarMerma: aplicarMerma,
    precioVenta: precioVenta,
    conServicios: conServicios,
    total: total,
    poblar: poblar
  };

  root.HW = root.HW || {};
  root.HW.pricing = api;

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
