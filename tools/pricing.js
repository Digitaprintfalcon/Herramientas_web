(function (root) {
  'use strict';

  // Catálogo único de precios. Las unidades están indicadas en cada clave.
  // Los servicios duplicados (planchado e instalación) usan el precio más alto.
  var PRECIOS = {
    servicios: {
      planchado: 1.5,
      instalacion: 10
    },
    accesorios: {
      ojales: { precio: 1, cantidad: 4 },
      bolsillos: { precio: 2, cantidad: 4 },
      separadores: { precio: 2, cantidad: 4 }
    },
    vinil: {
      impresionM2: 25,
      laminadoMl: 12,
      anchoRolloLaminadoCm: 135,
      diseno: 5,
      corte: 5
    },
    banner: {
      impresionM2: 25,
      logistica: 10
    },
    corte: {
      materialMl: 3.5,
      materialM2: 3.5,
      anchoRolloCm: 50,
      margen: 40
    },
    dtf: {
      impresionMl: 25,
      anchoRolloCm: 57,
      altoRolloCm: 100,
      prenda: 5
    },
    pvc: {
      baseLargoCm: 244,
      baseAnchoCm: 122,
      costoHoja: 45,
      merma: 10,
      margen: 33.33,
      vinilCostoM2: 15,
      vinilMerma: 10,
      vinilMargen: 37.5,
      laminadoCostoM2: 8,
      laminadoMargen: 33.33,
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
    PRECIOS: PRECIOS,
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
