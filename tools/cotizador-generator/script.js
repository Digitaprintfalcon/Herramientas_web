(function () {
  'use strict';

  var MAX_HISTORIAL = 15;

  var PERS_NRO = 'hw_cot_nro';
  var PERS_ULTIMA = 'hw_cot_ultima';
  var PERS_HISTORIAL = 'hw_cot_historial';
  var PERS_TASA = 'hw_cot_tasa';

  var EMP = (window.HW_EMPRESA && typeof window.HW_EMPRESA === 'object') ? window.HW_EMPRESA : {};

  var tasaRaw = 0;
  var tasaEf = 0;
  var tasaFecha = '';

  var lastSubUsd = 0;
  var lastDescuento = 0;
  var lastTotalUsd = 0;
  var lastTotalBs = 0;

  function Hw() {
    return window.HW || null;
  }

  function num(v) {
    var x = parseFloat(v);
    return isFinite(x) ? x : 0;
  }

  function fmtNum(x) {
    return x.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function fmtCant(x) {
    return x.toLocaleString('es-ES', { maximumFractionDigits: 2 });
  }

  function fmtUsd(x) {
    return fmtNum(x) + ' USDT';
  }

  function fmtBs(x) {
    return 'Bs. ' + fmtNum(x);
  }

  function hoyISO() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2);
  }

  function fechaEs(iso) {
    if (!iso) return '';
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  function ahoraLocal() {
    return new Date().toLocaleString('es-VE');
  }

  function pad(n, l) {
    return String(n).padStart(l, '0');
  }

  function anioActual() {
    return new Date().getFullYear();
  }

  function contadorNro() {
    var c = Hw() ? Hw().persist.get(PERS_NRO, null) : null;
    var y = anioActual();
    if (!c || c.anio !== y) c = { anio: y, n: 0 };
    return c;
  }

  function siguienteNroLabel(c) {
    return 'COT-' + c.anio + '-' + pad(c.n + 1, 3);
  }

  function lineaFilaHtml() {
    var tr = document.createElement('tr');
    tr.className = 'linea-fila align-middle';
    tr.innerHTML =
      '<td class="linea-indice text-center text-secondary"></td>' +
      '<td><input type="text" class="form-control form-control-sm l-desc" placeholder="Descripción del trabajo"></td>' +
      '<td><input type="number" class="form-control form-control-sm text-end l-cant" value="1" min="0" step="any"></td>' +
      '<td><input type="text" class="form-control form-control-sm l-unidad" value="m²"></td>' +
      '<td><input type="number" class="form-control form-control-sm text-end l-precio" min="0" step="0.01" placeholder="0,00"></td>' +
      '<td class="l-importe-usd text-end fw-semibold text-secondary">0,00</td>' +
      '<td class="l-importe-bs text-end fw-semibold text-success">Bs. 0,00</td>' +
      '<td class="text-center"><button type="button" class="btn btn-sm btn-outline-danger l-del" title="Quitar línea"><i class="bi bi-trash"></i></button></td>';
    return tr;
  }

  // ===== Tasa del día =====

  function obtenerTasa() {
    return tasaEf;
  }

  function renderTasaInfo() {
    var info = document.getElementById('tasaInfo');
    if (!info) return;
    info.innerHTML =
      'Tasa BCV (USD/VES): <strong>' + (tasaRaw > 0 ? fmtNum(tasaRaw) : '—') + '</strong> · ' +
      'Efectiva USDT/VES: <strong>' + (tasaEf > 0 ? fmtNum(tasaEf) : '—') + '</strong> · ' +
      'Actualizada: ' + (tasaFecha || '—');
  }

  function guardarTasa() {
    if (!Hw()) return;
    Hw().persist.set(PERS_TASA, {
      raw: tasaRaw,
      ef: tasaEf,
      spread: num(document.getElementById('tasaSpread').value),
      fecha: tasaFecha,
      ts: Date.now()
    });
  }

  function aplicarSpread() {
    var sp = num(document.getElementById('tasaSpread').value);
    if (tasaRaw > 0) {
      tasaEf = tasaRaw * (1 + sp / 100);
      document.getElementById('tasaInput').value = tasaEf.toFixed(2);
    }
    guardarTasa();
    renderTasaInfo();
    recalcular();
  }

  function aplicarTasaManual() {
    var t = num(document.getElementById('tasaInput').value);
    if (t > 0) {
      tasaEf = t;
      if (!tasaFecha && t > 0) tasaFecha = ahoraLocal();
      guardarTasa();
      renderTasaInfo();
      recalcular();
    }
  }

  async function sincronizarTasa() {
    var ico = document.getElementById('tasaSyncIcon');
    if (ico) ico.classList.add('hw-bcv-spin');
    var t = Hw() ? await Hw().bcv.fetchTasa() : null;
    if (ico) ico.classList.remove('hw-bcv-spin');
    if (t && t > 0) {
      tasaRaw = t;
      tasaFecha = ahoraLocal();
      aplicarSpread();
    } else if (tasaEf > 0) {
      HW.toast('Sin conexión; se mantiene la tasa actual', true);
      renderTasaInfo();
    } else {
      tasaFecha = ahoraLocal();
      renderTasaInfo();
      HW.toast('No se obtuvo la tasa; ingresala manualmente', true);
    }
  }

  function cargarTasaGuardada() {
    if (!Hw()) return false;
    var c = Hw().persist.get(PERS_TASA, null);
    if (!c) return false;
    tasaRaw = num(c.raw);
    tasaEf = num(c.ef);
    tasaFecha = c.fecha || '';
    document.getElementById('tasaSpread').value = isFinite(c.spread) ? c.spread : 0;
    if (tasaEf > 0) document.getElementById('tasaInput').value = tasaEf.toFixed(2);
    renderTasaInfo();
    return tasaEf > 0;
  }

  // ===== Líneas y totales =====

  function recalcular() {
    var tbody = document.getElementById('lineasTbody');
    var filas = Array.prototype.slice.call(tbody.querySelectorAll('tr.linea-fila'));
    var tasa = obtenerTasa();
    var subUsd = 0;

    var docBody = document.getElementById('docTableBody');
    docBody.innerHTML = '';

    filas.forEach(function (tr, i) {
      var desc = tr.querySelector('.l-desc').value.trim();
      var cant = num(tr.querySelector('.l-cant').value);
      var unidad = tr.querySelector('.l-unidad').value.trim();
      var precio = num(tr.querySelector('.l-precio').value);
      var impUsd = cant * precio;

      if (desc && cant > 0 && precio > 0) subUsd += impUsd;

      var ind = tr.querySelector('.linea-indice');
      if (ind) ind.textContent = String(i + 1);
      tr.querySelector('.l-importe-usd').textContent = fmtNum(impUsd);
      tr.querySelector('.l-importe-bs').textContent = fmtNum(impUsd * tasa);

      if (desc || cant > 0 || precio > 0) {
        var docTr = document.createElement('tr');
        var cel = function (txt, cls) {
          var td = document.createElement('td');
          td.textContent = txt;
          if (cls) td.className = cls;
          docTr.appendChild(td);
        };
        cel(String(i + 1), 'text-center');
        cel(desc);
        cel(fmtCant(cant), 'text-center');
        cel(unidad, 'text-center');
        cel(fmtNum(precio), 'text-end');
        cel(fmtNum(impUsd), 'text-end fw-semibold');
        cel(fmtBs(impUsd), 'text-end text-success');
        docBody.appendChild(docTr);
      }
    });

    lastDescuento = Math.max(0, num(document.getElementById('inputDescuento').value));
    lastSubUsd = subUsd;
    lastTotalUsd = Math.max(0, subUsd - lastDescuento);
    lastTotalBs = lastTotalUsd * tasa;

    document.getElementById('totalSubtotalUsd').textContent = fmtNum(lastSubUsd);
    document.getElementById('totalUsd').textContent = fmtNum(lastTotalUsd);
    document.getElementById('totalBs').textContent = fmtBs(lastTotalBs);

    document.getElementById('docSubtotalUsd').textContent = fmtNum(lastSubUsd);
    document.getElementById('docDescuento').textContent = fmtNum(lastDescuento);
    document.getElementById('docTotalUsd').textContent = fmtNum(lastTotalUsd);
    document.getElementById('docTotalBs').textContent = fmtBs(lastTotalBs);
    document.getElementById('docTasa').textContent = tasa > 0 ? fmtNum(tasa) + ' Bs/USDT' : '—';
  }

  function agregarLinea() {
    var tbody = document.getElementById('lineasTbody');
    tbody.appendChild(lineaFilaHtml());
    recalcular();
  }

  // ===== Datos de empresa y bindings del documento =====

  function renderEmpresa() {
    var nombre = document.getElementById('docEmpresaNombre');
    var datos = document.getElementById('docEmpresaDatos');
    if (nombre) nombre.textContent = EMP.nombre || '';
    if (datos) {
      var partes = [EMP.lema, EMP.rif, EMP.telefono, EMP.email, EMP.direccion].filter(Boolean);
      datos.textContent = partes.join(' · ');
    }
  }

  var bindings = [
    { input: 'inputNro', doc: 'docNro' },
    { input: 'inputFecha', doc: 'docFecha', map: fechaEs },
    { input: 'inputVigencia', doc: 'docVigencia', map: function (v) { return v ? 'Válida por ' + v + ' días' : ''; } },
    { input: 'inputVendedor', doc: 'docVendedor' },
    { input: 'inputClienteNombre', doc: 'docClienteNombre' },
    { input: 'inputClienteRif', doc: 'docClienteRif' },
    { input: 'inputClienteTelefono', doc: 'docClienteTelefono' },
    { input: 'inputClienteEmail', doc: 'docClienteEmail' },
    { input: 'inputNotas', doc: 'docNotas' }
  ];

  function aplicarBinding(b) {
    var el = document.getElementById(b.input);
    var target = document.getElementById(b.doc);
    if (!el || !target) return;
    var val = el.value;
    if (typeof b.map === 'function') val = b.map(val);
    target.textContent = val;
  }

  function aplicarBindings() {
    bindings.forEach(aplicarBinding);
  }

  // ===== Validación =====

  function validarYReportar() {
    var faltan = [];

    if (!document.getElementById('inputClienteNombre').value.trim()) faltan.push('nombre del cliente');
    if (!(tasaEf > 0)) faltan.push('tasa del día');

    var validas = 0;
    document.querySelectorAll('#lineasTbody tr.linea-fila').forEach(function (tr) {
      var d = tr.querySelector('.l-desc').value.trim();
      var c = num(tr.querySelector('.l-cant').value);
      var p = num(tr.querySelector('.l-precio').value);
      if (d && c > 0 && p > 0) validas++;
    });
    if (validas === 0) faltan.push('al menos una línea con descripción y precio');

    var alerta = document.getElementById('cotAlert');
    if (!alerta) return faltan.length === 0;

    if (faltan.length) {
      alerta.innerHTML = '<i class="bi bi-exclamation-triangle me-1"></i><strong>Completa:</strong> ' + faltan.join(', ') + '.';
      alerta.classList.remove('d-none');
      alerta.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return false;
    }
    alerta.classList.add('d-none');
    return true;
  }

  // ===== Guardar / cargar / historial =====

  function guardarSnapshot() {
    var lineas = [];
    document.querySelectorAll('#lineasTbody tr.linea-fila').forEach(function (tr) {
      var d = tr.querySelector('.l-desc').value.trim();
      var c = num(tr.querySelector('.l-cant').value);
      var u = tr.querySelector('.l-unidad').value.trim();
      var p = num(tr.querySelector('.l-precio').value);
      if (d || c > 0 || p > 0) lineas.push({ desc: d, cant: c, unidad: u, precio: p });
    });

    return {
      nro: document.getElementById('inputNro').value.trim(),
      fecha: document.getElementById('inputFecha').value,
      vigencia: document.getElementById('inputVigencia').value,
      vendedor: document.getElementById('inputVendedor').value.trim(),
      clienteNombre: document.getElementById('inputClienteNombre').value.trim(),
      clienteRif: document.getElementById('inputClienteRif').value.trim(),
      clienteTelefono: document.getElementById('inputClienteTelefono').value.trim(),
      clienteEmail: document.getElementById('inputClienteEmail').value.trim(),
      lineas: lineas,
      descuento: lastDescuento,
      notas: document.getElementById('inputNotas').value.trim(),
      tasa: tasaEf,
      tasaFecha: tasaFecha,
      totalUsd: lastTotalUsd,
      totalBs: lastTotalBs
    };
  }

  function guardarCotizacion() {
    if (!validarYReportar()) return;

    var snap = guardarSnapshot();
    var hist = Hw() ? Hw().persist.get(PERS_HISTORIAL, []) : [];
    hist = hist.filter(function (h) { return h.nro !== snap.nro || h.fecha !== snap.fecha; });
    hist.unshift(snap);
    if (Hw()) {
      Hw().persist.set(PERS_HISTORIAL, hist.slice(0, MAX_HISTORIAL));
      Hw().persist.set(PERS_ULTIMA, snap);
    }

    var partes = snap.nro.split('-');
    var npart = parseInt(partes[partes.length - 1], 10);
    var c = contadorNro();
    if (isFinite(npart) && npart > c.n) {
      c.n = npart;
      if (Hw()) Hw().persist.set(PERS_NRO, c);
    }

    renderHistorial();
    if (Hw()) Hw().toast('Cotización ' + (snap.nro || '') + ' guardada');
  }

  function renderHistorial() {
    var hist = Hw() ? Hw().persist.get(PERS_HISTORIAL, []) : [];
    var box = document.getElementById('historialList');
    if (!box) return;

    if (!hist.length) {
      box.innerHTML = '<div class="text-center small py-3 text-muted">Sin cotizaciones guardadas.</div>';
      return;
    }
    box.innerHTML = '';

    hist.forEach(function (h) {
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'hist-item d-flex justify-content-between align-items-center gap-2 text-start';
      var left = document.createElement('span');
      left.innerHTML = '<strong>' + (h.nro || '—') + '</strong> · ' + (h.clienteNombre || 'Sin cliente');
      var right = document.createElement('span');
      right.innerHTML = '<span class="text-success">' + fmtBs(h.totalBs || 0) + '</span>';
      item.appendChild(left);
      item.appendChild(right);
      item.addEventListener('click', function () { cargarCotizacion(h); });
      box.appendChild(item);
    });
  }

  function cargarCotizacion(h) {
    var set = function (id, v) {
      var el = document.getElementById(id);
      if (el) el.value = v == null ? '' : v;
    };

    set('inputNro', h.nro);
    set('inputFecha', h.fecha || hoyISO());
    set('inputVigencia', h.vigencia || 15);
    set('inputVendedor', h.vendedor);
    set('inputClienteNombre', h.clienteNombre);
    set('inputClienteRif', h.clienteRif);
    set('inputClienteTelefono', h.clienteTelefono);
    set('inputClienteEmail', h.clienteEmail);
    set('inputDescuento', h.descuento || 0);
    set('inputNotas', h.notas);

    var tbody = document.getElementById('lineasTbody');
    tbody.innerHTML = '';
    var lineas = (h.lineas && h.lineas.length) ? h.lineas : [{}];
    lineas.forEach(function (l) {
      var tr = lineaFilaHtml();
      tr.querySelector('.l-desc').value = l.desc || '';
      tr.querySelector('.l-cant').value = l.cant || '';
      tr.querySelector('.l-unidad').value = l.unidad || '';
      tr.querySelector('.l-precio').value = l.precio || '';
      tbody.appendChild(tr);
    });

    if (h.tasa > 0) {
      tasaEf = h.tasa;
      document.getElementById('tasaInput').value = tasaEf.toFixed(2);
    }

    aplicarBindings();
    recalcular();
    if (Hw()) Hw().toast('Cotización ' + (h.nro || '') + ' cargada');
  }

  function nuevaCotizacion() {
    var set = function (id, v) {
      var el = document.getElementById(id);
      if (el) el.value = v == null ? '' : v;
    };

    set('inputFecha', hoyISO());
    set('inputVigencia', 15);
    set('inputVendedor', '');
    set('inputClienteNombre', '');
    set('inputClienteRif', '');
    set('inputClienteTelefono', '');
    set('inputClienteEmail', '');
    set('inputDescuento', 0);
    set('inputNotas', '');

    var tbody = document.getElementById('lineasTbody');
    tbody.innerHTML = '';
    tbody.appendChild(lineaFilaHtml());

    set('inputNro', siguienteNroLabel(contadorNro()));

    var alerta = document.getElementById('cotAlert');
    if (alerta) alerta.classList.add('d-none');

    aplicarBindings();
    recalcular();
    if (Hw()) Hw().toast('Nueva cotización lista');
  }

  function cargarUltima() {
    if (!Hw()) return;
    var ultima = Hw().persist.get(PERS_ULTIMA, null);
    if (ultima && ultima.nro) {
      cargarCotizacion(ultima);
      if (Hw()) {
        var c = contadorNro();
        var partes = String(ultima.nro).split('-');
        var npart = parseInt(partes[partes.length - 1], 10);
        if (isFinite(npart) && npart > c.n) {
          c.n = npart;
          Hw().persist.set(PERS_NRO, c);
        }
      }
    }
  }

  // ===== Copiar resumen =====

  function copiarCotizacion() {
    if (!validarYReportar()) return;

    var lineasTexto = [];
    document.querySelectorAll('#lineasTbody tr.linea-fila').forEach(function (tr, i) {
      var d = tr.querySelector('.l-desc').value.trim();
      var cant = num(tr.querySelector('.l-cant').value);
      var unidad = tr.querySelector('.l-unidad').value.trim();
      var precio = num(tr.querySelector('.l-precio').value);
      if (d && cant > 0 && precio > 0) {
        lineasTexto.push(
          (i + 1) + '. ' + d + (unidad ? ' (' + unidad + ')' : '') + ' · ' +
          fmtCant(cant) + ' x ' + fmtNum(precio) + ' = ' + fmtUsd(cant * precio)
        );
      }
    });

    var texto =
      '*COTIZACIÓN ' + document.getElementById('inputNro').value + '*\n' +
      'Cliente: ' + document.getElementById('inputClienteNombre').value.trim() + '\n' +
      'Fecha: ' + fechaEs(document.getElementById('inputFecha').value) + '\n' +
      (lineasTexto.length ? '\n' + lineasTexto.join('\n') + '\n' : '') +
      '\nSubtotal: ' + fmtUsd(lastSubUsd) +
      (lastDescuento > 0 ? '\nDescuento: ' + fmtUsd(lastDescuento) + '\n' : '') +
      '\n*TOTAL: ' + fmtUsd(lastTotalUsd) + '*\n' +
      'Equivalente: ' + fmtBs(lastTotalBs) + '\n' +
      'Tasa: ' + (tasaEf > 0 ? fmtNum(tasaEf) : '—') + ' Bs/USDT';

    if (Hw()) Hw().copyResult(texto, 'Cotización copiada al portapapeles');
  }

  // ===== Exportar / imprimir =====

  function pdfCotizacion() {
    if (!validarYReportar()) return;
    abrirPreview();
    var element = document.getElementById('documento-pdf-modal');
    if (!element) element = document.getElementById('documento-pdf');
    var baseNombre = (document.getElementById('inputNro').value || 'Cotizacion').trim().replace(/[\/\\]/g, '_');

    var opt = {
      margin: 0,
      filename: baseNombre + '.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    var escalaPrevia = element.style.transform || '';
    element.style.transform = 'none';
    try {
      var worker = html2pdf().set(opt).from(element).save();
      var restaurar = function () { element.style.transform = escalaPrevia; };
      if (worker && typeof worker.then === 'function') {
        worker.then(restaurar).catch(restaurar);
      } else {
        setTimeout(restaurar, 800);
      }
    } catch (e) {
      element.style.transform = escalaPrevia;
      throw e;
    }
  }

  function abrirPreview() {
    var src = document.getElementById('documento-pdf');
    var dst = document.getElementById('documento-pdf-modal');
    if (!dst) return;

    if (src && src.innerHTML) {
      dst.innerHTML = src.innerHTML;
    }

    aplicarBindings();
    recalcular();

    var modalEl = document.getElementById('previewModal');
    if (modalEl && window.bootstrap && bootstrap.Modal) {
      var m = bootstrap.Modal.getOrCreateInstance(modalEl);
      m.show();
      if (Hw() && Hw().initPaperFit) {
        setTimeout(function () { Hw().initPaperFit(); }, 50);
        setTimeout(function () { Hw().initPaperFit(); }, 250);
        setTimeout(function () { Hw().initPaperFit(); }, 500);
      }
    } else if (Hw() && Hw().initPaperFit) {
      setTimeout(function () { Hw().initPaperFit(); }, 50);
    }
  }

  function imprimirCotizacion() {
    if (!validarYReportar()) return;
    abrirPreview();
    window.print();
  }

  // ===== Inicialización =====

  function init() {
    renderEmpresa();

    var c = contadorNro();
    document.getElementById('inputNro').value = siguienteNroLabel(c);
    document.getElementById('inputFecha').value = hoyISO();

    document.getElementById('lineasTbody').appendChild(lineaFilaHtml());

    bindings.forEach(function (b) {
      var el = document.getElementById(b.input);
      if (!el) return;
      var update = function () { aplicarBinding(b); };
      el.addEventListener('input', update);
      el.addEventListener('change', update);
    });

    var tbody = document.getElementById('lineasTbody');
    tbody.addEventListener('input', recalcular);
    tbody.addEventListener('click', function (e) {
      var btn = e.target.closest('.l-del');
      if (!btn) return;
      var filas = tbody.querySelectorAll('tr.linea-fila');
      if (filas.length <= 1) return;
      btn.closest('tr').remove();
      recalcular();
    });

    document.getElementById('tasaInput').addEventListener('input', aplicarTasaManual);
    document.getElementById('tasaSpread').addEventListener('change', aplicarSpread);
    document.getElementById('tasaSync').addEventListener('click', sincronizarTasa);
    document.getElementById('inputDescuento').addEventListener('input', recalcular);

    var btnClearHistorial = document.getElementById('btnClearHistorial');
    if (btnClearHistorial) {
      btnClearHistorial.addEventListener('click', function () {
        if (Hw()) {
          Hw().persist.set(PERS_HISTORIAL, []);
          Hw().toast('Historial limpiado');
        }
        renderHistorial();
      });
    }

    if (!cargarTasaGuardada()) sincronizarTasa();
    cargarUltima();
    renderHistorial();
    aplicarBindings();
    recalcular();

    if (Hw() && Hw().initPaperFit) Hw().initPaperFit();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.abrirPreview = abrirPreview;
  window.togglePreview = abrirPreview;
  window.agregarLinea = agregarLinea;
  window.sincronizarTasa = sincronizarTasa;
  window.guardarCotizacion = guardarCotizacion;
  window.copiarCotizacion = copiarCotizacion;
  window.nuevaCotizacion = nuevaCotizacion;
  window.pdfCotizacion = pdfCotizacion;
  window.imprimirCotizacion = imprimirCotizacion;
})();