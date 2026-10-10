
        let tasaBCVOficial = 857.01;
        let horaTasaActualizada = '';

        // Última cotización calculada: es lo que se copia al portapapeles, para
        // que el texto coincida exactamente con lo que muestra la pantalla.
        let cotizacionActual = null;

        const idsInputs = [
            'trabajoAncho', 'trabajoLargo', 'trabajoCantidad',
            'baseLargo', 'baseAncho', 'costoLamina', 'pvcMerma', 'pvcGanancia',
            'vinilCostoM2', 'vinilMerma', 'vinilGanancia',
            'laminadoCostoM2', 'laminadoGanancia'
        ];

        idsInputs.forEach(id => {
            const el = document.getElementById(id);
            if(el) el.addEventListener('input', calcular);
        });

        function toggleUnifiedSection(contentId, switchId, containerId) {
            const contentEl = document.getElementById(contentId);
            const containerEl = document.getElementById(containerId);
            const isChecked = document.getElementById(switchId).checked;
            const bsCollapse = bootstrap.Collapse.getInstance(contentEl) || new bootstrap.Collapse(contentEl, { toggle: false });
            
            if (isChecked) {
                bsCollapse.show();
                containerEl.classList.remove('section-disabled');
            } else {
                bsCollapse.hide();
                containerEl.classList.add('section-disabled');
            }
            calcular();
        }

        function toggleEditSection(boxId, switchId) {
            const boxEl = document.getElementById(boxId);
            const isChecked = document.getElementById(switchId).checked;
            
            if (isChecked) {
                boxEl.classList.remove('readonly-inputs');
            } else {
                boxEl.classList.add('readonly-inputs');
            }
            calcular();
        }

        function cambioTasaManual() {
            const val = parseFloat(document.getElementById('inputTasaManual').value);
            if (!isNaN(val) && val > 0) {
                tasaBCVOficial = val;
                actualizarTimestamp();
                calcular();
            }
        }

        function actualizarTimestamp() {
            const now = new Date();
            const timeString = now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            horaTasaActualizada = now.toLocaleDateString('es-VE') + ' ' + timeString;
            document.getElementById('timestampTasa').innerText = `Última actualización: ${timeString}`;
        }

        async function fetchTasaBCV() {
            const syncIcon = document.getElementById('syncIcon');
            syncIcon.classList.add('fa-spin');
            
            try {
                const response = await fetch('https://rates.dolarvzla.com/bcv/current.json');
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.current && data.current.usd) {
                        tasaBCVOficial = parseFloat(data.current.usd);
                    } else if (data && data.usd) {
                        tasaBCVOficial = parseFloat(data.usd);
                    }
                } else {
                    const altRes = await fetch('https://bcv-api.rafnixg.dev/v1/exchange-rates/latest/USD');
                    if (altRes.ok) {
                        const altData = await altRes.json();
                        if (altData && altData.rate) {
                            tasaBCVOficial = parseFloat(altData.rate);
                        }
                    }
                }
            } catch (error) {
                console.warn('No se pudo conectar a la API en vivo, usando tasa respaldo actual:', error);
            } finally {
                syncIcon.classList.remove('fa-spin');
                document.getElementById('inputTasaManual').value = tasaBCVOficial.toFixed(2);
                actualizarTimestamp();
                calcular();
            }
        }

        function setPreset(ancho, largo) {
            document.getElementById('trabajoAncho').value = ancho;
            document.getElementById('trabajoLargo').value = largo;
            calcular();
        }

        function limpiarFormulario() {
            document.getElementById('trabajoAncho').value = 50;
            document.getElementById('trabajoLargo').value = 30;
            document.getElementById('trabajoCantidad').value = 1;
            
            // PVC incluido ($45)
            document.getElementById('checkPvc').checked = true;
            document.getElementById('checkEditPvc').checked = false;
            toggleUnifiedSection('pvcSubContent', 'checkPvc', 'cardPvcContainer');
            toggleEditSection('pvcParamsBox', 'checkEditPvc');
            
            document.getElementById('baseLargo').value = 244;
            document.getElementById('baseAncho').value = 122;
            document.getElementById('costoLamina').value = 45.00;
            document.getElementById('pvcMerma').value = 10;
            document.getElementById('pvcGanancia').value = 50;
            
            // Vinil incluido ($15)
            document.getElementById('checkVinil').checked = true;
            document.getElementById('checkEditVinil').checked = false;
            toggleUnifiedSection('vinilSubContent', 'checkVinil', 'cardVinilContainer');
            toggleEditSection('vinilParamsBox', 'checkEditVinil');

            document.getElementById('vinilCostoM2').value = 15.00;
            document.getElementById('vinilMerma').value = 10;
            document.getElementById('vinilGanancia').value = 60;

            // Laminado excluido ($8)
            document.getElementById('checkLaminado').checked = false;
            document.getElementById('checkEditLaminado').checked = false;
            toggleUnifiedSection('laminadoSubContent', 'checkLaminado', 'cardLaminadoContainer');
            toggleEditSection('laminadoParamsBox', 'checkEditLaminado');

            document.getElementById('laminadoCostoM2').value = 8.00;
            document.getElementById('laminadoGanancia').value = 50;
            
            calcular();
        }

        function calcular() {
            const tAncho = parseFloat(document.getElementById('trabajoAncho').value) || 0;
            const tLargo = parseFloat(document.getElementById('trabajoLargo').value) || 0;
            const areaTrabajoCm2 = tAncho * tLargo;
            const areaTrabajoM2 = areaTrabajoCm2 / 10000;

            // Un 0 tipeado es una cotización de 0, no debería caer al `|| 1`
            const cantRaw = parseFloat(document.getElementById('trabajoCantidad').value);
            const cantidad = isNaN(cantRaw) ? 1 : Math.max(0, cantRaw);

            // 1. PVC Base
            let precioPvcFinal = 0;
            let excedePvc = false;
            const incluyePvc = document.getElementById('checkPvc').checked;
            
            if (incluyePvc) {
                const bLargo = parseFloat(document.getElementById('baseLargo').value) || 0;
                const bAncho = parseFloat(document.getElementById('baseAncho').value) || 0;
                const costoLamina = parseFloat(document.getElementById('costoLamina').value) || 0;
                const pveMerma = parseFloat(document.getElementById('pvcMerma').value) || 0;
                const pveGanancia = parseFloat(document.getElementById('pvcGanancia').value) || 0;

                const areaBase = bLargo * bAncho;
                const costoPvcCm2 = areaBase > 0 ? (costoLamina / areaBase) : 0;
                const costoBasePvc = areaTrabajoCm2 * costoPvcCm2;
                const costoPvcConMerma = costoBasePvc * (1 + (pveMerma / 100));
                precioPvcFinal = costoPvcConMerma * (1 + (pveGanancia / 100));

                if (tAncho > bAncho || tLargo > bLargo) {
                    excedePvc = true;
                }
            }

            // 2. Impresión Vinil
            let precioVinilFinal = 0;
            const incluyeVinil = document.getElementById('checkVinil').checked;
            if (incluyeVinil) {
                const vinilCostoM2 = parseFloat(document.getElementById('vinilCostoM2').value) || 0;
                const vMerma = parseFloat(document.getElementById('vinilMerma').value) || 0;
                const vGanancia = parseFloat(document.getElementById('vinilGanancia').value) || 0;

                const costoBaseVinil = areaTrabajoM2 * vinilCostoM2;
                const costoVinilConMerma = costoBaseVinil * (1 + (vMerma / 100));
                precioVinilFinal = costoVinilConMerma * (1 + (vGanancia / 100));
            }

            // 3. Laminado (Sin merma)
            let precioLaminadoFinal = 0;
            const incluyeLaminado = document.getElementById('checkLaminado').checked;
            if (incluyeLaminado) {
                const lamCostoM2 = parseFloat(document.getElementById('laminadoCostoM2').value) || 0;
                const lGanancia = parseFloat(document.getElementById('laminadoGanancia').value) || 0;

                const costoBaseLam = areaTrabajoM2 * lamCostoM2;
                precioLaminadoFinal = costoBaseLam * (1 + (lGanancia / 100));
            }

            // Total general sumando componentes activos y multiplicando por unidades.
            // El precio de cada material es por unidad (una lámina por pieza), así que
            // la cantidad se aplica recién sobre el subtotal, no dentro del cálculo.
            const precioTotalUSD = (precioPvcFinal + precioVinilFinal + precioLaminadoFinal) * cantidad;
            const precioTotalBs = precioTotalUSD * tasaBCVOficial;

            // Alerta de exceso de dimensiones base PVC (se evalúa por unidad)
            const alerta = document.getElementById('alertaExceso');
            if (incluyePvc && excedePvc) {
                alerta.classList.remove('d-none');
            } else {
                alerta.classList.add('d-none');
            }

            // Actualizar interfaz de resumen
            document.getElementById('resAreaTrabajo').innerText = cantidad > 1
                ? areaTrabajoCm2.toLocaleString('es-ES') + ' cm² c/u · ' + (areaTrabajoCm2 * cantidad).toLocaleString('es-ES') + ' cm² total (' + (areaTrabajoM2 * cantidad).toFixed(3) + ' m²)'
                : areaTrabajoCm2.toLocaleString('es-ES') + ' cm² (' + areaTrabajoM2.toFixed(3) + ' m²)';
            document.getElementById('resSubPvc').innerText = incluyePvc ? formatearUsd(precioPvcFinal * cantidad) : 'No incluido';
            document.getElementById('resSubVinil').innerText = incluyeVinil ? formatearUsd(precioVinilFinal * cantidad) : 'No incluido';
            document.getElementById('resSubLaminado').innerText = incluyeLaminado ? formatearUsd(precioLaminadoFinal * cantidad) : 'No incluido';

            document.getElementById('resPrecioFinal').innerText = formatearUsd(precioTotalUSD);
            document.getElementById('resPrecioBs').innerText = 'Bs. ' + precioTotalBs.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            document.getElementById('resDimensionesTexto').innerText =
                `Para ${cantidad} ${cantidad === 1 ? 'unidad' : 'unidades'} de ${tAncho} x ${tLargo} cm`;

            cotizacionActual = {
                cantidad,
                ancho: tAncho,
                largo: tLargo,
                areaCm2: areaTrabajoCm2,
                areaM2: areaTrabajoM2,
                incluyePvc,
                incluyeVinil,
                incluyeLaminado,
                precioPvc: precioPvcFinal * cantidad,
                precioVinil: precioVinilFinal * cantidad,
                precioLaminado: precioLaminadoFinal * cantidad,
                totalUsd: precioTotalUSD,
                totalBs: precioTotalBs,
                tasa: tasaBCVOficial,
                horaTasa: horaTasaActualizada
            };
        }

        // Arma el texto plano de la cotización, pensado para pegar en WhatsApp
        function textoCotizacion(cot) {
            const lineas = [];

            lineas.push('*COTIZACIÓN PVC · VINIL · LAMINADO*');
            lineas.push(`${cot.cantidad} ${cot.cantidad === 1 ? 'unidad' : 'unidades'} de ${cot.ancho} x ${cot.largo} cm`);
            lineas.push(`Área por unidad: ${cot.areaCm2.toLocaleString('es-ES')} cm² (${cot.areaM2.toFixed(3)} m²)`);
            if (cot.cantidad > 1) {
                lineas.push(`Área total: ${(cot.areaCm2 * cot.cantidad).toLocaleString('es-ES')} cm² (${(cot.areaM2 * cot.cantidad).toFixed(3)} m²)`);
            }
            lineas.push('');
            lineas.push(`• Lámina PVC: ${cot.incluyePvc ? formatearUsd(cot.precioPvc) : 'No incluido'}`);
            lineas.push(`• Impresión Vinil: ${cot.incluyeVinil ? formatearUsd(cot.precioVinil) : 'No incluido'}`);
            lineas.push(`• Laminado: ${cot.incluyeLaminado ? formatearUsd(cot.precioLaminado) : 'No incluido'}`);
            lineas.push('');
            lineas.push(`*TOTAL: ${formatearUsd(cot.totalUsd)}*`);
            lineas.push(`Equivalente: Bs. ${cot.totalBs.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
            lineas.push(`Tasa BCV: ${cot.tasa.toFixed(2)} Bs/$${cot.horaTasa ? ' — ' + cot.horaTasa : ''}`);

            return lineas.join('\n');
        }

        function formatearUsd(n) {
            return '$' + n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        function copiarCotizacion() {
            if (!cotizacionActual || cotizacionActual.totalUsd <= 0) {
                mostrarToast('Ingresa las medidas para cotizar', true);
                return;
            }

            const texto = textoCotizacion(cotizacionActual);
            copiarTexto(texto, '¡Cotización copiada!');
        }

        function copiarTotal() {
            if (!cotizacionActual || cotizacionActual.totalUsd <= 0) {
                mostrarToast('Ingresa las medidas para cotizar', true);
                return;
            }

            const usd = formatearUsd(cotizacionActual.totalUsd);
            const bs = cotizacionActual.totalBs.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const texto = cotizacionActual.totalBs > 0 ? `${usd} (Bs. ${bs})` : usd;
            copiarTexto(texto, '¡Total copiado!');
        }

        function copiarTexto(texto, mensajeOk) {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(texto)
                    .then(() => mostrarToast(mensajeOk))
                    .catch(() => copiarConTextarea(texto, mensajeOk));
            } else {
                copiarConTextarea(texto, mensajeOk);
            }
        }

        function copiarConTextarea(texto, mensajeOk) {
            const el = document.createElement('textarea');
            el.value = texto;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            mostrarToast(mensajeOk || '¡Cotización copiada!');
        }

        function mostrarToast(msg, isError) {
            const toast = document.getElementById('toast');
            const toastMsg = document.getElementById('toastMsg');
            const toastIcon = document.getElementById('toastIcon');

            toastMsg.textContent = msg;
            toastIcon.className = isError ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-check';

            toast.classList.add('show');
            clearTimeout(mostrarToast.timer);
            mostrarToast.timer = setTimeout(() => toast.classList.remove('show'), 2500);
        }

        window.onload = function() {
            toggleUnifiedSection('pvcSubContent', 'checkPvc', 'cardPvcContainer');
            toggleUnifiedSection('vinilSubContent', 'checkVinil', 'cardVinilContainer');
            toggleUnifiedSection('laminadoSubContent', 'checkLaminado', 'cardLaminadoContainer');
            
            toggleEditSection('pvcParamsBox', 'checkEditPvc');
            toggleEditSection('vinilParamsBox', 'checkEditVinil');
            toggleEditSection('laminadoParamsBox', 'checkEditLaminado');
            
            fetchTasaBCV();
        };
    