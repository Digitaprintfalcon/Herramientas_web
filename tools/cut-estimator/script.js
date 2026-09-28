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

            // Actualizar interfaz
            document.getElementById('resPrecioUnitario').innerText = HW.fmtCurrency(precioUnitarioVenta);
            document.getElementById('resPrecioTotal').innerText = HW.fmtCurrency(precioTotalVenta);
            document.getElementById('textoFormula').innerText = formulaStr;
        }

        // Ejecutar cálculo inicial al cargar
        window.onload = calcularCosto;