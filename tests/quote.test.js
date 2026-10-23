'use strict';

const assert = require('node:assert/strict');
const pricing = require('../tools/pricing.js');
const quote = require('../tools/quote.js');

function close(actual, expected, tolerance, message) {
  assert.ok(
    Math.abs(actual - expected) <= (tolerance == null ? 0.000001 : tolerance),
    message || `${actual} != ${expected}`
  );
}

const banner = quote.build({
  titulo: 'Pendones',
  cantidad: 2,
  materiales: [
    { nombre: 'Banner', costoBase: 15 * 0.01 * 2, unidad: 'm²' }
  ],
  servicios: [
    { nombre: 'Logística', precio: 10, modo: 'lote' }
  ],
  accesorios: [
    { nombre: 'Ojales', precio: 1, cantidad: 4 },
    { nombre: 'Bolsillos', precio: 2, cantidad: 4 }
  ]
});

close(banner.totalMaterial, 0.5);
close(banner.totalServicios, 10);
close(banner.totalAccesorios, 24);
close(banner.total, 34.5);
close(banner.unitario, 17.25);
assert.equal(banner.lineas.length, 4);
assert.equal(banner.lineas[0].margenPct, 40);

const bannerConTubos = quote.build({
  titulo: 'Pendones',
  cantidad: 2,
  materiales: [
    { nombre: 'Banner', costoBase: 0.3, unidad: 'ud' }
  ],
  accesorios: [
    {
      nombre: 'Bolsillos',
      precio: pricing.ACCESORIOS.bolsillos.precio,
      cantidad: pricing.ACCESORIOS.bolsillos.cantidad
    },
    {
      nombre: 'Tubos',
      precio: pricing.ACCESORIOS.tubos.precio,
      cantidad: pricing.ACCESORIOS.tubos.cantidad
    }
  ]
});

close(bannerConTubos.totalAccesorios, 28);
close(bannerConTubos.total, 28.5);
assert.equal(bannerConTubos.accesorios[1].cantidad, 2);
assert.equal(bannerConTubos.accesorios[1].detalle, '1 por pieza');

const corte = quote.build({
  titulo: 'Corte de vinil',
  cantidad: 2,
  materiales: [
    { nombre: 'Vinil textil', costoBase: 0.21 * 2, unidad: 'm²' }
  ],
  servicios: [
    { nombre: 'Planchado', precio: 1.5, modo: 'pieza' },
    { nombre: 'Instalación', precio: 10, modo: 'pieza' }
  ]
});

close(corte.totalMaterial, 0.7);
close(corte.totalServicios, 23);
close(corte.total, 23.7);
close(corte.unitario, 11.85);

const pvc = quote.build({
  titulo: 'PVC',
  cantidad: 1,
  materiales: [
    { nombre: 'Lámina PVC', costoBase: 2.2675, mermaPct: 10, margenPct: 40 },
    { nombre: 'Laminado', costoBase: 1.2, mermaPct: 0, margenPct: 40 }
  ],
  accesorios: [
    { nombre: 'Separadores', precio: 2, cantidad: 4 }
  ]
});

close(pvc.lineas[0].merma, 0.22675);
close(pvc.lineas[0].total, 4.1570833333333335, 1e-9);
close(pvc.lineas[1].total, 2);
close(pvc.total, 14.157083333333334, 1e-9);

const disenos = quote.build({
  titulo: 'DTF',
  cantidad: 3,
  materiales: [
    { nombre: 'Diseño 1', costoBase: 60, cantidad: 1 },
    { nombre: 'Diseño 2', costoBase: 30, cantidad: 2 }
  ]
});
close(disenos.lineas[0].precioUnitario, 100, 1e-9);
close(disenos.lineas[1].precioUnitario, 25, 1e-9);
assert.equal(disenos.lineas[0].cantidad, 1);
assert.equal(disenos.lineas[1].cantidad, 2);
const draftDisenos = quote.borrador(disenos, { titulo: 'DTF' });
assert.equal(draftDisenos.lineas[0].cant, 1);
assert.equal(draftDisenos.lineas[1].cant, 2);

const texto = quote.texto(corte, {
  titulo: 'Corte de vinil',
  detalle: ['2 unidades de 20 x 15 cm'],
  tasa: 100
});
assert.match(texto, /COTIZACIÓN CORTE DE VINIL/);
assert.match(texto, /2 unidades de 20 x 15 cm/);
assert.match(texto, /Precio unitario/);
assert.match(texto, /TOTAL/);
assert.match(texto, /Tasa BCV: 100,00 Bs\/\$/);

const draft = quote.borrador(corte, { titulo: 'Corte de vinil' });
assert.equal(draft.version, 1);
assert.equal(draft.lineas.length, 3);
assert.equal(draft.lineas[0].unidad, 'm²');
assert.equal(draft.lineas[0].cant, 2);
assert.ok(draft.lineas[0].precio > 0);
assert.ok(draft.total > 0);

console.log('quote.test.js: OK');
