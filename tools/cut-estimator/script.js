function cambiarMetodo() {
            const metodo = document.getElementById('metodo').value;
            const labelPrecio = document.getElementById('labelPrecioMaterial');
            const anchoRolloInput = document.getElementById('anchoRollo');

            if (metodo === 'lineal') {
                labelPrecio.innerText = "Precio Metro Lineal";
                anchoRolloInput.disabled = false;
            } else {
                labelPrecio.innerText = "Precio por m²";
                anchoRolloInput.disabled = true;
            }
            calcularCosto();
        }

        function toggleEditSection(boxId, switchId) {
            const boxEl = document.getElementById(boxId);
            const isChecked = document.getElementById(switchId).checked;

            if (isChecked) {
                boxEl.classList.remove('readonly-inputs');
            } else {
                boxEl.classList.add('readonly-inputs');
            }
            calcularCosto();
        }

        const cutEstado = {
            metodo: 'lineal',
            anchoCm: 0,
            altoCm: 0,
            anchoRollo: 0,
            precioMaterial: 0,
            cantidad: 1,
            margen: 0,
            planchado: false,
            costoPlanchado: 0,
            instalacion: false,
            costoInstalacion: 0,
            unitario: 0,
            total: 0
        };

        function calcularCosto() {
            const metodo = document.getElementById('metodo').value;
            const anchoDiseno = parseFloat(document.getElementById('anchoDiseno').value) || 0;
            const altoDiseno = parseFloat(document.getElementById('altoDiseno').value) || 0;
            const anchoRollo = parseFloat(document.getElementById('anchoRollo').value) || 50;
            const precioMaterial = parseFloat(document.getElementById('precioMaterial').value) || 0;
            const cantidad = parseInt(document.getElementById('cantidadPiezas').value) || 1;
            const margenGanancia = parseFloat(document.getElementById('margenGanancia').value) || 0;
            
            const incluirPlanchado = document.getElementById('incluirPlanchado').checked;
            const costoPlanchadoInput = parseFloat(document.getElementById('costoPlanchado').value) || 0;

            const incluirInstalacion = document.getElementById('incluirInstalacion').checked;
            const costoInstalacionInput = parseFloat(document.getElementById('costoInstalacion').value) || 0;
            
            // Mostrar u ocultar campos adicionales
            document.getElementById('divCostoPlanchado').style.display = incluirPlanchado ? 'block' : 'none';
            document.getElementById('divCostoInstalacion').style.display = incluirInstalacion ? 'block' : 'none';

            // Actualizar texto del título total según servicios activos
            let extrasTxt = [];
            if (incluirPlanchado) extrasTxt.push("Planchado");
            if (incluirInstalacion) extrasTxt.push("Instalación");
            
            if (extrasTxt.length > 0) {
                document.getElementById('labelTotalTitulo').innerText = `Precio Total (Con ${extrasTxt.join(' y ')})`;
            } else {
                document.getElementById('labelTotalTitulo').innerText = "Precio Total";
            }

            let costoMaterialNetoUnitario = 0;
            let formulaStr = "";

            if (metodo === 'lineal') {
                const areaDisenoCm2 = anchoDiseno * altoDiseno;
                const areaFranjaRolloCm2 = anchoRollo * 100;
                costoMaterialNetoUnitario = (areaDisenoCm2 / areaFranjaRolloCm2) * precioMaterial;
                formulaStr = `Fórmula: [(Ancho Diseño × Alto Diseño) ÷ (Ancho Rollo × 100 cm)] × Precio Metro`;
            } else {
                const areaM2 = (anchoDiseno / 100) * (altoDiseno / 100);
                costoMaterialNetoUnitario = areaM2 * precioMaterial;
                formulaStr = `Fórmula: [(Ancho m × Alto m) × Precio m²]`;
            }

            // Precio unitario aplicando margen de ganancia comercial (sobre precio de venta)
            let precioUnitarioVenta = costoMaterialNetoUnitario / (1 - (margenGanancia / 100));

            // Agregar servicios adicionales por pieza si están activos
            if (incluirPlanchado) {
                precioUnitarioVenta += costoPlanchadoInput;
            }
            if (incluirInstalacion) {
                precioUnitarioVenta += costoInstalacionInput;
            }

            const precioTotalVenta = precioUnitarioVenta * cantidad;

            cutEstado.metodo = metodo;
            cutEstado.anchoCm = anchoDiseno;
            cutEstado.altoCm = altoDiseno;
            cutEstado.anchoRollo = anchoRollo;
            cutEstado.precioMaterial = precioMaterial;
            cutEstado.cantidad = cantidad;
            cutEstado.margen = margenGanancia;
            cutEstado.planchado = incluirPlanchado;
            cutEstado.costoPlanchado = costoPlanchadoInput;
            cutEstado.instalacion = incluirInstalacion;
            cutEstado.costoInstalacion = costoInstalacionInput;
            cutEstado.unitario = precioUnitarioVenta;
            cutEstado.total = precioTotalVenta;

            // Actualizar interfaz
            document.getElementById('resPrecioUnitario').innerText = HW.fmtCurrency(precioUnitarioVenta);
            document.getElementById('resPrecioTotal').innerText = HW.fmtCurrency(precioTotalVenta);
            document.getElementById('textoFormula').innerText = formulaStr;
            if (bcvWidget) bcvWidget.setUsd(precioTotalVenta);
        }

        const DEFAULTS = {
            metodo: 'lineal',
            anchoDiseno: 20,
            altoDiseno: 15,
            anchoRollo: 50,
            precioMaterial: 3.50,
            cantidadPiezas: 1,
            margenGanancia: 40,
            costoPlanchado: 0.50,
            costoInstalacion: 1.00
        };

        function limpiarFormulario() {
            document.getElementById('metodo').value = DEFAULTS.metodo;
            document.getElementById('anchoDiseno').value = DEFAULTS.anchoDiseno;
            document.getElementById('altoDiseno').value = DEFAULTS.altoDiseno;
            document.getElementById('anchoRollo').value = DEFAULTS.anchoRollo;
            document.getElementById('precioMaterial').value = DEFAULTS.precioMaterial;
            document.getElementById('cantidadPiezas').value = DEFAULTS.cantidadPiezas;
            document.getElementById('margenGanancia').value = DEFAULTS.margenGanancia;
            document.getElementById('costoPlanchado').value = DEFAULTS.costoPlanchado;
            document.getElementById('costoInstalacion').value = DEFAULTS.costoInstalacion;

            document.getElementById('incluirPlanchado').checked = false;
            document.getElementById('incluirInstalacion').checked = false;
            document.getElementById('checkEditRollo').checked = false;
            toggleEditSection('rolloParamsBox', 'checkEditRollo');

            cambiarMetodo();
        }

        let bcvWidget = null;

        // Ejecutar cálculo inicial al cargar
        window.onload = function () {
            bcvWidget = HW.bcv.mount(document.getElementById('bcvBox'));
            calcularCosto();
        };

        function cutFmt(n, d) {
            return Number(n).toLocaleString('es-ES', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
        }

        function copiarCotizacion() {
            const e = cutEstado;
            if (!(e.total > 0)) {
                HW.toast('Ingresa los datos para cotizar', true);
                return;
            }
            const lineas = [];
            lineas.push('*COTIZACIÓN CORTE DE VINIL*');
            lineas.push(e.cantidad + ' ' + (e.cantidad === 1 ? 'unidad' : 'unidades') + ' de ' + cutFmt(e.anchoCm, 1) + ' x ' + cutFmt(e.altoCm, 1) + ' cm');
            lineas.push(e.metodo === 'lineal'
                ? 'Material: ' + HW.fmtUsd(e.precioMaterial) + ' metro lineal (rollo ' + cutFmt(e.anchoRollo, 1) + ' cm)'
                : 'Material: ' + HW.fmtUsd(e.precioMaterial) + ' /m²');
            lineas.push('Margen: ' + cutFmt(e.margen, 0) + '%');
            if (e.planchado) lineas.push('• Planchado: ' + HW.fmtUsd(e.costoPlanchado) + ' c/u');
            if (e.instalacion) lineas.push('• Instalación: ' + HW.fmtUsd(e.costoInstalacion) + ' c/u');
            lineas.push('Precio unitario: ' + HW.fmtUsd(e.unitario));
            lineas.push('');
            lineas.push('*TOTAL: ' + HW.fmtUsd(e.total) + '*');
            const tasa = bcvWidget ? bcvWidget.getTasa() : 0;
            if (tasa > 0) {
                lineas.push('Equivalente: ' + HW.fmtBs(e.total * tasa));
                lineas.push('Tasa BCV: ' + cutFmt(tasa, 2) + ' Bs/$');
            }
            HW.copyResult(lineas.join('\n'), 'Cotización copiada al portapapeles');
        }

        function copiarTotal() {
            const tasa = bcvWidget ? bcvWidget.getTasa() : 0;
            HW.copyTotal(cutEstado.total, tasa, 'Total copiado al portapapeles');
        }

        window.copiarCotizacion = copiarCotizacion;
        window.copiarTotal = copiarTotal;