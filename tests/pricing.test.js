'use strict';

const assert = require('node:assert/strict');
const pricing = require('../tools/pricing.js');

const P = pricing.PRECIOS;

function close(actual, expected, tolerance, message) {
  assert.ok(
    Math.abs(actual - expected) <= (tolerance == null ? 0.000001 : tolerance),
    message || `${actual} != ${expected}`
  );
}

assert.equal(P.servicios.planchado, 1.5);
assert.equal(P.servicios.instalacion, 10);
assert.equal(P.accesorios.ojales.precio, 1);
assert.equal(P.accesorios.bolsillos.precio, 2);
assert.equal(P.accesorios.separadores.precio, 2);
assert.equal(P.accesorios.ojales.cantidad, 4);
assert.equal(P.accesorios.bolsillos.cantidad, 4);
assert.equal(P.accesorios.separadores.cantidad, 4);
close(pricing.total(P.accesorios.ojales.precio, P.accesorios.ojales.cantidad), 4);
close(pricing.total(P.accesorios.bolsillos.precio, P.accesorios.bolsillos.cantidad), 8);
close(pricing.total(P.accesorios.separadores.precio, P.accesorios.separadores.cantidad), 8);
assert.equal(P.corte.margen, 40);
assert.equal(P.pvc.margen, 33.33);
assert.equal(P.pvc.vinilMargen, 37.5);
assert.equal(P.pvc.laminadoMargen, 33.33);

close(pricing.areaM2(100, 135), 1.35);
close(pricing.areaM2(10, 10), 0.01);
close(pricing.metrosLineales(1.35, 135), 1);
close(pricing.costoRollo(1.35, 135, 12), 12);
close(pricing.costoArea(1.35, 25), 33.75);
close(pricing.aplicarMerma(100, 10), 110);
close(pricing.precioVenta(100, 40), 100 / 0.6);
close(pricing.precioVenta(100, 0), 100);
assert.equal(pricing.precioVenta(100, 100), 100, 'margen 100 no debe ser Infinity');
close(pricing.conServicios(10, [1.5, 10]), 21.5);
close(pricing.total(11.85, 3), 35.55);

// Vinil: 100 × 135 cm, $25/m², laminado $12/ml, diseño $5, corte $5, instalación $10.
const vinilArea = pricing.areaM2(100, 135);
const vinilUnit = pricing.conServicios(
  pricing.costoArea(vinilArea, P.vinil.impresionM2) +
  pricing.costoRollo(vinilArea, P.vinil.anchoRolloLaminadoCm, P.vinil.laminadoMl),
  [P.vinil.diseno, P.vinil.corte, P.servicios.instalacion]
);
close(vinilUnit, 65.75, 1e-9, 'vinil unitario');

// Banner: 10 × 10 cm, $25/m², logística $10 total.
const bannerArea = pricing.areaM2(10, 10);
const bannerUnit = pricing.conServicios(pricing.costoArea(bannerArea, P.banner.impresionM2), [P.banner.logistica]);
close(bannerUnit, 10.25, 1e-9, 'banner unitario');

// Corte: 20 × 15 cm, rollo 50 cm, $3.50/ml, margen 40%, planchado 1.50, instalación 10.
const corteArea = pricing.areaM2(20, 15);
const corteUnit = pricing.conServicios(
  pricing.precioVenta(pricing.costoRollo(corteArea, P.corte.anchoRolloCm, P.corte.materialMl), P.corte.margen),
  [P.servicios.planchado, P.servicios.instalacion]
);
close(corteUnit, 11.85, 1e-9, 'corte unitario');

// DTF: 10 × 10 cm, rollo 57 cm, $25/ml.
const dtfArea = pricing.areaM2(10, 10);
const dtfSubtotal = pricing.costoRollo(dtfArea, P.dtf.anchoRolloCm, P.dtf.impresionMl);
close(dtfSubtotal, 0.43859649122807015, 1e-12, 'dtf subtotal');

// PVC: 50 × 30 cm con lámina 244 × 122 cm de $45, merma 10%, margen 33.33%.
const pvcWorkArea = pricing.areaM2(50, 30);
const pvcSheetArea = pricing.areaM2(P.pvc.baseLargoCm, P.pvc.baseAnchoCm);
const pvcCostM2 = P.pvc.costoHoja / pvcSheetArea;
const pvc = pricing.precioVenta(
  pricing.aplicarMerma(pricing.costoArea(pvcWorkArea, pvcCostM2), P.pvc.merma),
  P.pvc.margen
);
const vinilPvc = pricing.precioVenta(
  pricing.aplicarMerma(pricing.costoArea(pvcWorkArea, P.pvc.vinilCostoM2), P.pvc.vinilMerma),
  P.pvc.vinilMargen
);
const laminadoPvc = pricing.precioVenta(
  pricing.costoArea(pvcWorkArea, P.pvc.laminadoCostoM2),
  P.pvc.laminadoMargen
);
close(pvc, 3.7414, 0.001, 'pvc');
close(vinilPvc, 3.96, 1e-9, 'vinil pvc');
close(laminadoPvc, 1.8, 0.001, 'laminado pvc');
close(pvc + vinilPvc + laminadoPvc, 9.5014, 0.002, 'total pvc');

// poblar no debe fallar si un input no existe.
const values = {};
const fakeDoc = {
  getElementById(id) {
    if (id === 'no-existe') return null;
    if (!values[id]) values[id] = { value: '' };
    return values[id];
  }
};
pricing.poblar({ a: 1, b: 2, 'no-existe': 3 }, fakeDoc);
assert.equal(values.a.value, '1');
assert.equal(values.b.value, '2');

console.log('pricing.test.js: OK');
