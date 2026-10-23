# Cotizadores: arquitectura y precios

Los cotizadores de Producción comparten el catálogo de costos y el motor de cálculo.
La meta es que una misma regla comercial produzca el mismo resultado en todas las
herramientas y en el generador de cotizaciones.

## Mapa de herramientas

| Herramienta | Archivo | Materiales | Servicios / accesorios |
| --- | --- | --- | --- |
| Pendones | `tools/banner-estimator/` | Banner por m² | Logística, ojales, bolsillos |
| Vinil | `tools/vinil-estimator/` | Vinil adhesivo, vinil textil, laminado | Diseño, corte, instalación, planchado |
| DTF | `tools/dtf-estimator/` | Uno o varios diseños DTF | Planchado, prenda |
| PVC | `tools/calculadora-pvc/` | Lámina PVC, vinil, laminado | Separadores |
| Generador | `tools/cotizador-generator/` | Recibe borradores | Documento final, PDF y totales |

El cotizador de corte de vinil ya no es una herramienta independiente. Su ruta
`tools/cut-estimator/index.html` redirige a
`tools/vinil-estimator/index.html?tipo=textil`.

## Regla de precio

El margen es sobre el precio de venta:

```text
precio = costoConMerma / (1 - margen / 100)
```

Pipeline estándar:

```text
costo base → merma → margen → servicios → accesorios → cantidad
```

- Los **materiales** reciben merma y margen.
- Los **servicios** y **accesorios** son precios fijos de venta: no reciben margen.
- La cantidad se aplica al final. Los servicios `lote` se cobran una vez; los servicios
  `pieza` y los accesorios se multiplican por la cantidad.
- El margen por defecto es 40%.

## Catálogo

`tools/pricing.js` expone:

- `HW.pricing.COSTOS`: costos de materiales.
- `HW.pricing.SERVICIOS`: precio fijo y unidad de cobro.
- `HW.pricing.ACCESORIOS`: precio, cantidad sugerida y herramientas donde aplica.
- `HW.pricing.PRECIOS`: vista compatible con las claves antiguas.
- Helpers: `areaM2`, `metrosLineales`, `costoRollo`, `costoArea`, `aplicarMerma`,
  `precioVenta`, `conServicios`, `total`, `poblar` y `redondear`.

Valores base actuales:

| Concepto | Costo | Venta con 40% |
| --- | ---: | ---: |
| Banner | `$15/m²` | `$25/m²` |
| Vinil adhesivo | `$15/m²` | `$25/m²` |
| DTF | `$15/ml` | `$25/ml` |
| Vinil textil | `$3.50/ml` | `$5.83/ml` |
| Lámina PVC | `$45` por lámina de 244 x 122 cm | según área |
| Vinil para PVC | `$15/m²` | `$25/m²` |
| Laminado para PVC | `$8/m²` | `$13.33/m²` |
| Laminado de vinil | `$12/ml` | `$20/ml` |

Servicios fijos: diseño `$5`, corte `$5`, planchado `$1.50`, instalación `$10`,
prenda `$5` y logística `$10`. Accesorios: ojales `$1` c/u, bolsillos `$2` c/u y
separadores `$2` c/u.

## Motor compartido

`tools/quote.js` expone `HW.quote`:

```js
const cotizacion = HW.quote.build({
  titulo: 'Pendones',
  cantidad: 2,
  detalle: ['2 unidades de 100 x 150 cm'],
  materiales: [
    { nombre: 'Banner', costoBase: 45, mermaPct: 0, margenPct: 40, unidad: 'm²' }
  ],
  servicios: [
    { nombre: 'Instalación', precio: 10, modo: 'pieza' }
  ],
  accesorios: [
    { nombre: 'Ojales', precio: 1, cantidad: 4 }
  ]
});

HW.quote.renderResumen(document.getElementById('resumen'), cotizacion);
HW.quote.copiar(cotizacion, { titulo: 'Pendones', tasa: 100 });
```

Métodos disponibles:

- `build(input)`: calcula líneas, subtotales, total y precio unitario.
- `texto(quote, opts)`: arma el texto para WhatsApp.
- `copiar(quote, opts)` y `copiarTotal(quote, opts)`: copian al portapapeles.
- `renderResumen(el, quote, opts)`: pinta el resumen y el desglose.
- `borrador(quote, opts)`: genera el borrador para el generador.
- `enviarAlGenerador(quote, opts)`: guarda `hw_cot_borrador` y navega con
  `?importar=1`.

## Integración con el generador

Cada cotizador tiene el botón **Enviar al generador**. El flujo es:

1. El cotizador calcula la cotización.
2. `HW.quote.enviarAlGenerador` guarda un borrador en `localStorage` bajo
   `hw_cot_borrador`.
3. El generador abre `tools/cotizador-generator/index.html?importar=1`, carga las
   líneas, el detalle en notas y elimina el borrador para no repetir la importación.

El generador también permite importar manualmente desde **Importar borrador**.

## Persistencia y migración

- DTF guarda su estado en `hw_dtf_estado` con `version: 2`.
- Los estados DTF anteriores guardaban `precioMetro` como precio de venta. Al migrar se
  convierte a costo equivalente con `costo = precioViejo × 0.6`, que conserva el valor
  de venta con el margen del 40%.
- PVC y los demás cotizadores no persisten sus formularios; vuelven al catálogo al
  recargar.

## Pruebas

```bash
node tests/pricing.test.js
node tests/quote.test.js
```

Las pruebas cubren catálogo, margen, merma, servicios, accesorios, PVC, vinil textil,
banner, DTF y generación de borradores.
