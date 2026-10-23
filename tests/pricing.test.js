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

assert.equal(P.margen, 40);
assert.equal(pricing.MARGEN_DEFAULT, 40);
assert.equal(pricing.SERVICIOS.planchado.precio, 1.5);
assert.equal(pricing.SERVICIOS.instalacion.precio, 10);
assert.equal(pricing.SERVICIOS.diseno.precio, 5);
assert.equal(pricing.SERVICIOS.corte.precio, 5);
assert.equal(pricing.SERVICIOS.prenda.precio, 5);
assert.equal(pricing.SERVICIOS.logistica.precio, 10);
assert.equal(pricing.ACCESORIOS.ojales.precio, 1);
assert.equal(pricing.ACCESORIOS.bolsillos.precio, 2);
assert.equal(pricing.ACCESORIOS.separadores.precio, 2);
assert.equal(pricing.ACCESORIOS.ojales.cantidad, 4);
assert.equal(pricing.ACCESORIOS.separadores.cantidad, 4);
assert.deepEqual(pricing.ACCESORIOS.ojales.aplicaA, ['banner']);
assert.deepEqual(pricing.ACCESORIOS.separadores.aplicaA, ['pvc']);

assert.equal(P.costos.vinilAdhesivoM2, 15);
assert.equal(P.costos.bannerM2, 15);
assert.equal(P.costos.dtfMl, 15);
assert.equal(P.costos.vinilTextilMl, 3.5);
assert.equal(P.costos.pvcHoja, 45);
assert.equal(P.costos.pvcVinilM2, 15);
assert.equal(P.costos.pvcLaminadoM2, 8);

// El precio de venta con el margen único vuelve a los valores comerciales históricos.
close(pricing.precioVenta(P.costos.vinilAdhesivoM2, P.margen), 25);
close(pricing.precioVenta(P.costos.bannerM2, P.margen), 25);
close(pricing.precioVenta(P.costos.dtfMl, P.margen), 25);

// El metro cuadrado del vinil textil se deriva del ancho del rollo (50 cm).
close(P.corte.costoM2, 7);
close(P.corte.materialM2, 7);
assert.equal(P.corte.margen, 40);
assert.equal(P.pvc.margen, 40);
assert.equal(P.pvc.vinilMargen, 40);
assert.equal(P.pvc.laminadoMargen, 40);

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

// Vinil adhesivo: mismo precio de venta por m² que el catálogo anterior.
const vinilArea = pricing.areaM2(100, 135);
const vinilMaterial = pricing.precioVenta(
  pricing.costoArea(vinilArea, P.costos.vinilAdhesivoM2),
  P.margen
);
close(vinilMaterial, 33.75, 1e-9, 'vinil material');

// Banner: 10 × 10 cm.
const bannerArea = pricing.areaM2(10, 10);
const bannerMaterial = pricing.precioVenta(
  pricing.costoArea(bannerArea, P.costos.bannerM2),
  P.margen
);
close(bannerMaterial, 0.25, 1e-9, 'banner material');

// Corte de vinil textil: 20 × 15 cm, rollo 50 cm, costo 3.50/ml.
const corteArea = pricing.areaM2(20, 15);
const corteMaterial = pricing.precioVenta(
  pricing.costoRollo(corteArea, P.corte.anchoRolloCm, P.costos.vinilTextilMl),
  P.margen
);
close(corteMaterial, 0.35, 1e-9, 'corte material');

// DTF: 10 × 10 cm, rollo 57 cm, costo 15/ml.
const dtfArea = pricing.areaM2(10, 10);
const dtfMaterial = pricing.precioVenta(
  pricing.costoRollo(dtfArea, P.dtf.anchoRolloCm, P.costos.dtfMl),
  P.margen
);
close(dtfMaterial, 0.43859649122807015, 1e-12, 'dtf material');

// PVC: 50 × 30 cm con lámina 244 × 122 cm de $45, merma 10%, margen 40%.
const pvcWorkArea = pricing.areaM2(50, 30);
const pvcSheetArea = pricing.areaM2(P.pvc.baseLargoCm, P.pvc.baseAnchoCm);
const pvcCostM2 = P.pvc.costoHoja / pvcSheetArea;
const pvc = pricing.precioVenta(
  pricing.aplicarMerma(pricing.costoArea(pvcWorkArea, pvcCostM2), P.pvc.merma),
  P.pvc.margen
);
close(pvc, 4.156, 0.002, 'pvc');

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
