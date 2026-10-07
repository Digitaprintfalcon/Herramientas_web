
        (function () {
            'use strict';

            var CONFIG = window.HW_DNI_CONFIG || {};
            var TIEMPO_LIMITE_MS = 12000;
            var HIST_KEY = 'hw_dni_history';
            var HIST_MAX = 20;

            var el = {
                form: document.getElementById('searchForm'),
                cedula: document.getElementById('cedulaInput'),
                selNacionalidad: document.getElementById('nacionalidad'),
                setupBox: document.getElementById('setupBox'),
                setupTitle: document.getElementById('setupTitle'),
                setupHint: document.getElementById('setupHint'),
                setupFoot: document.getElementById('setupFoot'),
                alertBox: document.getElementById('alertBox'),
                alertIcon: document.getElementById('alertIcon'),
                alertMessage: document.getElementById('alertMessage'),
                resultBox: document.getElementById('resultBox'),
                consulta: document.getElementById('dConsulta'),
                nombre: document.getElementById('dNombre'),
                txtNacionalidad: document.getElementById('dNacionalidad'),
                cedulaTxt: document.getElementById('dCedula'),
                rif: document.getElementById('dRif'),
                fecha: document.getElementById('dFecha'),
                celdaEdad: document.getElementById('dCeldaEdad'),
                edad: document.getElementById('dEdad'),
                btn: document.getElementById('btnConsultar'),
                spinner: document.getElementById('btnSpinner'),
                btnText: document.getElementById('btnText'),
                toast: document.getElementById('toast'),
                toastIcon: document.getElementById('toastIcon'),
                toastMsg: document.getElementById('toastMsg')
            };

            var ultimo = null;

            var enProxy = function () {
                return (CONFIG.modo || 'proxy') === 'proxy';
            };

            function configFalta() {
                if (enProxy()) return !CONFIG.proxyUrl;
                if (!CONFIG.apiBase || !CONFIG.appId || !CONFIG.token) return true;
                return String(CONFIG.token).indexOf('PEGÁ_AQUÍ') !== -1;
            }

            function sinConfig() {
                if (enProxy()) {
                    el.setupTitle.textContent = 'Falta configurar el proxy';
                    el.setupHint.innerHTML = 'Editá <code>config.js</code> en <code>tools/dni-checker/</code> y completá <code>proxyUrl</code> con la URL de tu Cloudflare Worker.';
                    el.setupFoot.textContent = 'La API de cédulas no manda cabeceras CORS, así que sin proxy el navegador bloquea la consulta.';
                } else {
                    el.setupTitle.textContent = 'Faltan las credenciales de la API';
                    el.setupHint.innerHTML = 'Copiá <code>config.local.example.js</code> como <code>config.local.js</code> en esta misma carpeta y completá <code>appId</code> y <code>token</code>.';
                    el.setupFoot.textContent = 'Ese archivo queda fuera de git, así que las credenciales no se publican.';
                }
                el.setupBox.classList.remove('d-none');
                el.btn.disabled = true;
            }

            function dosDigitos(n) {
                return n < 10 ? '0' + n : String(n);
            }

            function normalizarCedula() {
                return el.cedula.value.replace(/\D/g, '');
            }

            function parseFecha(valor) {
                if (typeof valor !== 'string') return null;
                var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor.trim());
                if (!m) return null;
                var anio = Number(m[1]);
                var mes = Number(m[2]);
                var dia = Number(m[3]);
                if (anio < 1900 || mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
                var d = new Date(anio, mes - 1, dia);
                if (d.getFullYear() !== anio || d.getMonth() !== mes - 1 || d.getDate() !== dia) return null;
                return d;
            }

            function formatearFecha(d) {
                return dosDigitos(d.getDate()) + '/' + dosDigitos(d.getMonth() + 1) + '/' + d.getFullYear();
            }

            function formatearConsulta(iso) {
                if (typeof iso !== 'string') return '';
                var d = new Date(iso);
                if (isNaN(d.getTime())) return '';
                var h = d.getHours();
                var h12 = h % 12 === 0 ? 12 : h % 12;
                return dosDigitos(d.getDate()) + '/' + dosDigitos(d.getMonth() + 1) + '/' + d.getFullYear() +
                    ' ' + (h12 < 10 ? '0' + h12 : h12) + ':' + dosDigitos(d.getMinutes()) +
                    (h < 12 ? ' a. m.' : ' p. m.');
            }

            function calcularEdad(fecha) {
                if (!fecha) return null;
                var hoy = new Date();
                var anios = hoy.getFullYear() - fecha.getFullYear();
                var meses = hoy.getMonth() - fecha.getMonth();
                if (meses < 0 || (meses === 0 && hoy.getDate() < fecha.getDate())) anios--;
                return anios >= 0 && anios < 130 ? anios : null;
            }

            function nombreCompleto(d) {
                var partes = [d.primer_nombre, d.segundo_nombre, d.primer_apellido, d.segundo_apellido];
                return partes
                    .filter(function (p) { return typeof p === 'string' && p.trim() !== ''; })
                    .map(function (p) { return p.trim(); })
                    .join(' ')
                    .toUpperCase();
            }

            function urlConsulta(cedula) {
                var nac = el.selNacionalidad.value;

                if (enProxy()) {
                    return CONFIG.proxyUrl +
                        '?nacionalidad=' + encodeURIComponent(nac) +
                        '&cedula=' + encodeURIComponent(cedula);
                }

                var url = (CONFIG.apiBase || 'https://api.cedula.com.ve/api/v1') +
                    '?app_id=' + encodeURIComponent(CONFIG.appId) +
                    '&token=' + encodeURIComponent(CONFIG.token) +
                    '&nacionalidad=' + encodeURIComponent(nac) +
                    '&cedula=' + encodeURIComponent(cedula);

                return CONFIG.corsProxy ? CONFIG.corsProxy + encodeURIComponent(url) : url;
            }

            function mensajeApi(cuerpo, cedula) {
                var codigo = cuerpo && cuerpo.error_str;

                if (codigo === 'RECORD_NOT_FOUND') return 'No se encontraron datos para la cédula ' + cedula + '.';
                if (codigo === 'RATE_LIMIT') return 'Demasiadas consultas seguidas. Esperá un minuto e intentá de nuevo.';
                if (codigo === 'UPSTREAM_ERROR') return 'La API de cédulas no respondió. Intentá de nuevo en un momento.';
                if (codigo === 'TOKEN_MISSING') return 'El proxy no tiene el token configurado. Cargalo con: npx wrangler secret put CEDULA_TOKEN';
                if (codigo === 'NOT_FOUND') return 'La ruta del proxy no existe. Revisá proxyUrl en config.js.';

                if (codigo === 'INVALID_TOKEN') {
                    return enProxy()
                        ? 'El proxy tiene credenciales inválidas. Recargá el secret CEDULA_TOKEN.'
                        : 'Credenciales inválidas. Revisá appId y token en tools/dni-checker/config.local.js.';
                }

                if (codigo === 'URL_ERROR') {
                    return enProxy()
                        ? 'La consulta se armó incompleta. Revisá la URL del proxy en config.js.'
                        : 'La consulta se armó incompleta. Revisá appId y token en config.local.js.';
                }

                return 'La API respondió con un error' + (codigo ? ': ' + codigo : '.');
            }

            function mostrarError(mensaje) {
                el.alertMessage.textContent = mensaje;
                el.alertBox.classList.remove('d-none', 'alert-danger', 'alert-warning');
                el.alertBox.classList.add('alert-danger');
                el.alertIcon.className = 'bi bi-exclamation-triangle-fill me-2';
            }

            function ocultarAvisos() {
                el.alertBox.classList.add('d-none');
                el.alertMessage.textContent = '';
                el.resultBox.classList.add('d-none');
                el.consulta.textContent = '';
            }

            function mostrarToast(mensaje, esError) {
                HW.toast(mensaje, esError);
            }

            // ---- Historial de consultas recientes (localStorage) ----
            function guardarHistoria(entrada) {
                var historial = HW.persist.get(HIST_KEY, []);
                if (!Array.isArray(historial)) historial = [];
                historial = historial.filter(function (e) { return e && e.cedula !== entrada.cedula; });
                historial.unshift(entrada);
                historial = historial.slice(0, HIST_MAX);
                HW.persist.set(HIST_KEY, historial);
                return historial;
            }

            function formatearHora(ts) {
                var d = new Date(ts);
                if (isNaN(d.getTime())) return '';
                var h = d.getHours();
                var h12 = h % 12 === 0 ? 12 : h % 12;
                return dosDigitos(d.getDate()) + '/' + dosDigitos(d.getMonth() + 1) + '/' + d.getFullYear() +
                    ' ' + (h12 < 10 ? '0' + h12 : h12) + ':' + dosDigitos(d.getMinutes()) +
                    (h < 12 ? ' a. m.' : ' p. m.');
            }

            function renderHistoria() {
                var lista = document.getElementById('historyList');
                if (!lista) return;
                var historial = HW.persist.get(HIST_KEY, []);
                if (!Array.isArray(historial)) historial = [];

                lista.innerHTML = '';

                if (historial.length === 0) {
                    var vacio = document.createElement('div');
                    vacio.className = 'text-center small py-3 text-muted';
                    vacio.id = 'historyEmpty';
                    vacio.textContent = 'Sin consultas todavía.';
                    lista.appendChild(vacio);
                    return;
                }

                historial.forEach(function (e) {
                    var celda = document.createElement('button');
                    celda.type = 'button';
                    celda.className = 'd-flex align-items-center justify-content-between w-100 border-0 bg-transparent text-start px-3 py-2';
                    celda.style.cursor = 'pointer';

                    var info = document.createElement('span');
                    info.className = 'small';
                    var nac = (e.nac || 'v').toUpperCase();
                    info.innerHTML =
                        '<span class="fw-bold" style="color: var(--hw-accent);">' + nac + '-' + e.cedula + '</span> · ' +
                        HW.escapeHtml(e.nombre || '') +
                        '<br><span class="text-muted">' + formatearHora(e.ts) + '</span>';

                    var ico = document.createElement('i');
                    ico.className = 'bi bi-search';

                    celda.appendChild(info);
                    celda.appendChild(ico);

                    celda.addEventListener('click', function () {
                        el.cedula.value = e.cedula || '';
                        if (e.nac) el.selNacionalidad.value = e.nac;
                        consultar();
                    });

                    lista.appendChild(celda);
                });
            }

            function setCargando(activo) {
                el.btn.disabled = activo;
                el.spinner.classList.toggle('d-none', !activo);
                el.btnText.textContent = activo ? 'Consultando...' : 'Buscar';
                el.cedula.disabled = activo;
            }

            function render(datos, cedula) {
                var nombre = nombreCompleto(datos);
                var fecha = parseFecha(datos.fecha_nac);
                var edad = calcularEdad(fecha);

                el.nombre.textContent = nombre;
                el.txtNacionalidad.textContent = datos.nacionalidad === 'E' ? 'Extranjero' : 'Venezolano';
                el.cedulaTxt.textContent = cedula;
                el.rif.textContent = datos.rif || 'No registrado';
                el.fecha.textContent = fecha ? formatearFecha(fecha) : 'No registrada';
                el.celdaEdad.classList.toggle('d-none', edad === null);
                el.edad.textContent = edad === null ? '-' : edad + (edad === 1 ? ' año' : ' años');

                var consulta = formatearConsulta(datos.request_date);
                el.consulta.textContent = consulta ? 'Consultado: ' + consulta : '';

                ultimo = { nombre: nombre, cedula: cedula, rif: datos.rif || '', fecha: el.fecha.textContent, edad: edad };

                guardarHistoria({
                    cedula: cedula,
                    nombre: nombre,
                    rif: datos.rif || '',
                    fecha: el.fecha.textContent,
                    edad: edad,
                    nac: el.selNacionalidad.value,
                    ts: Date.now()
                });
                renderHistoria();

                el.resultBox.classList.remove('d-none');
                mostrarToast('Datos encontrados', false);
            }

            async function consultar() {
                ocultarAvisos();

                if (configFalta()) {
                    sinConfig();
                    return;
                }

                var cedula = normalizarCedula();
                if (!/^\d{5,10}$/.test(cedula)) {
                    mostrarError('Ingresá una cédula de 5 a 10 dígitos (solo números).');
                    el.cedula.focus();
                    return;
                }

                setCargando(true);

                var control = window.AbortController ? new AbortController() : null;
                var expiro = false;
                var temporizador = setTimeout(function () {
                    expiro = true;
                    if (control) control.abort();
                }, TIEMPO_LIMITE_MS);

                var opciones = { cache: 'no-store' };
                if (control) opciones.signal = control.signal;

                try {
                    var respuesta = await fetch(urlConsulta(cedula), opciones);
                    if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
                    var cuerpo = await respuesta.json();

                    if (!cuerpo || cuerpo.error || !cuerpo.data) {
                        mostrarError(cuerpo && cuerpo.error ? mensajeApi(cuerpo, cedula) : 'No se encontraron datos para la cédula ' + cedula + '.');
                        return;
                    }

                    render(cuerpo.data, cedula);

                } catch (e) {
                    console.error('Consulta de cédula fallida:', e);
                    if (expiro) {
                        mostrarError('La consulta tardó demasiado. Intentá de nuevo.');
                    } else if (enProxy()) {
                        mostrarError('No se pudo contactar el proxy. Verificá que esté desplegado y que proxyUrl en config.js sea correcto.');
                    } else {
                        mostrarError('No se pudo consultar la API: sin conexión, respuesta inválida o bloqueo CORS del navegador. Probá definir corsProxy en config.local.js o servir el sitio tras un proxy inverso.');
                    }
                } finally {
                    clearTimeout(temporizador);
                    setCargando(false);
                }
            }

            async function copiarDatos() {
                if (!ultimo) return;

                var lineas = [ultimo.nombre, 'Cédula: ' + ultimo.cedula];
                if (ultimo.rif) lineas.push('RIF: ' + ultimo.rif);
                lineas.push('Nacimiento: ' + ultimo.fecha);
                if (ultimo.edad !== null) lineas.push('Edad: ' + ultimo.edad + (ultimo.edad === 1 ? ' año' : ' años'));

                HW.copyResult(lineas.join('\n'), 'Datos copiados');
            }

            function limpiar() {
                el.cedula.value = '';
                ocultarAvisos();
                ultimo = null;
                el.cedula.focus();
            }

            el.cedula.addEventListener('input', function () {
                var limpio = normalizarCedula();
                if (limpio !== el.cedula.value) el.cedula.value = limpio;
            });

            el.cedula.addEventListener('keydown', function (evento) {
                if (evento.key === 'Enter') {
                    evento.preventDefault();
                    consultar();
                }
            });

            el.selNacionalidad.addEventListener('change', function () {
                el.cedula.placeholder = 'Ej: ' + (el.selNacionalidad.value === 'e' ? 'E-12345678' : '30893191');
            });

            window.consultar = consultar;
            window.copiarDatos = copiarDatos;
            window.limpiar = limpiar;

            var btnClearHistory = document.getElementById('btnClearHistory');
            if (btnClearHistory) {
                btnClearHistory.addEventListener('click', function () {
                    HW.persist.remove(HIST_KEY);
                    renderHistoria();
                });
            }
            renderHistoria();

            if (configFalta()) sinConfig();
            el.cedula.focus();
        })();
    