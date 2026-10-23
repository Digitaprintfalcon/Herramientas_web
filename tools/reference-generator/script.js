
function abrirPreview() {
  refrescarFechaSiAuto();
  const cedulaModalEl = document.getElementById('cedulaModal');
  if (cedulaModalEl && window.bootstrap && bootstrap.Modal) {
    bootstrap.Modal.getOrCreateInstance(cedulaModalEl).hide();
  }
  const modalEl = document.getElementById('previewModal');
  if (modalEl && window.bootstrap && bootstrap.Modal) {
    const m = bootstrap.Modal.getOrCreateInstance(modalEl);
    m.show();
  }
}

function mostrarPreviewCedula(src, nombre) {
  const wrap = document.getElementById('previewCedulaWrap');
  const img = document.getElementById('previewCedulaImg');
  const docImg = document.getElementById('docCedulaImg');
  const section = document.getElementById('cedulaSection');
  const label = document.getElementById('fileLabel');
  if (img) img.src = src || '';
  if (docImg) docImg.src = src || '';
  if (wrap) wrap.classList.toggle('d-none', !src);
  if (section) section.classList.toggle('d-none', !src);
  if (label) {
    label.innerText = src
      ? 'Cédula agregada' + (nombre ? ': ' + nombre : '')
      : 'Clic aquí para seleccionar/tomar foto de la Cédula';
  }
  if (!src && wrap) {
    const modalImg = document.getElementById('cedulaModalImg');
    if (modalImg) modalImg.src = '';
  }
}

function abrirModalCedula() {
  const img = document.getElementById('previewCedulaImg');
  const modalImg = document.getElementById('cedulaModalImg');
  const modalEl = document.getElementById('cedulaModal');
  const src = img ? img.getAttribute('src') : '';
  if (!src || !modalEl || !window.bootstrap || !bootstrap.Modal) return;
  if (modalImg) modalImg.src = src;
  bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

let modoActual = 'manual';
let fechaAuto = true;

function fechaActualVE() {
  const d = new Date();
  const mes = d.toLocaleDateString('es-VE', { month: 'long' });
  return {
    dia: String(d.getDate()).padStart(2, '0'),
    mes: mes.charAt(0).toUpperCase() + mes.slice(1),
    ano: String(d.getFullYear())
  };
}

function aplicarFechaActual() {
  if (!fechaAuto) return;
  const f = fechaActualVE();
  const dia = document.getElementById('inputDia');
  const mes = document.getElementById('inputMes');
  const ano = document.getElementById('inputAno');
  if (dia) dia.value = f.dia;
  if (mes) mes.value = f.mes;
  if (ano) ano.value = f.ano;
  const setDoc = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
  };
  setDoc('docDia', f.dia);
  setDoc('docMes', f.mes);
  setDoc('docAno', f.ano);
}

function marcarFechaManual() {
  fechaAuto = false;
}

function refrescarFechaSiAuto() {
  if (fechaAuto) aplicarFechaActual();
}

document.addEventListener('DOMContentLoaded', () => {
  // Configuración de los enlaces dinamicos entre inputs y nodos HTML del documento
  const bindings = [
    { 
      input: 'inputEmisorNombre', 
      doc: 'docEmisorNombre', 
      callback: () => {
        const sigName = document.getElementById('docSigEmisorNombre');
        if (sigName) sigName.innerText = document.getElementById('inputEmisorNombre').value;
      } 
    },
    { input: 'inputEmisorNacionalidad', doc: 'docEmisorNacionalidad' },
    { 
      input: 'inputEmisorCedula', 
      doc: 'docEmisorCedula', 
      callback: () => {
        const sigCedula = document.getElementById('docSigEmisorCedula');
        if (sigCedula) sigCedula.innerText = document.getElementById('inputEmisorCedula').value;
      } 
    },
    { input: 'inputEmisorTelefono', doc: 'docSigEmisorTelefono' },
    { input: 'inputRefNombre', doc: 'docRefNombre' },
    { input: 'inputRefNacionalidad', doc: 'docRefNacionalidad' },
    { input: 'inputRefCedula', doc: 'docRefCedula' },
    { input: 'inputTiempoConocer', doc: 'docTiempoConocer' },
    { input: 'inputCiudad', doc: 'docCiudad' },
    { input: 'inputDia', doc: 'docDia' },
    { input: 'inputMes', doc: 'docMes' },
    { input: 'inputAno', doc: 'docAno' },
  ];

  // Escuchar eventos 'input' y 'change' para reflejar datos en tiempo real
  bindings.forEach(item => {
    const el = document.getElementById(item.input);
    if (!el) return;

    const updateFn = () => {
      const target = document.getElementById(item.doc);
      if (target) target.innerText = el.value;
      if (item.callback) item.callback();
    };

    el.addEventListener('input', updateFn);
    el.addEventListener('change', updateFn);
  });

  // Configuración para la lectura e inserción de la foto de la cédula
  const inputCedula = document.getElementById('inputCedulaImg');
  if (inputCedula) {
    inputCedula.addEventListener('change', function (e) {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.type || file.type.indexOf('image/') !== 0) {
        if (window.HW && HW.toast) HW.toast('Selecciona un archivo de imagen', true);
        return;
      }
      const reader = new FileReader();
      reader.onload = function (event) {
        mostrarPreviewCedula(event.target.result, file.name);
      };
      reader.onerror = function () {
        if (window.HW && HW.toast) HW.toast('No se pudo leer la imagen', true);
      };
      reader.readAsDataURL(file);
    });
  }

  const previewCedula = document.getElementById('previewCedulaImg');
  if (previewCedula) {
    previewCedula.addEventListener('click', abrirModalCedula);
    previewCedula.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        abrirModalCedula();
      }
    });
  }
  const btnQuitarCedula = document.getElementById('btnQuitarCedula');
  if (btnQuitarCedula) {
    btnQuitarCedula.addEventListener('click', function () {
      if (inputCedula) inputCedula.value = '';
      mostrarPreviewCedula('', '');
    });
  }

  // La fecha se completa automáticamente hasta que el usuario la edite.
  ['inputDia', 'inputMes', 'inputAno'].forEach(function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', marcarFechaManual);
    el.addEventListener('change', marcarFechaManual);
  });
  aplicarFechaActual();

  // ---- Modos de captura (Manual / Precargadas / Vacía) ----
  const selReferente = document.getElementById('selectReferente');
  if (selReferente && typeof window.renderReferenteSelect === 'function') {
    window.renderReferenteSelect(selReferente.value);
  }

  document.querySelectorAll('[data-modo]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      cambiarModo(btn.dataset.modo);
    });
  });

  cambiarModo('manual');

  // Escalar la hoja A4 a la altura disponible (layout paralelo)
  if (window.HW && HW.initPaperFit) HW.initPaperFit();
});

function aplicarEmisorEnDocumento(datos) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
  };
  set('docEmisorNombre', datos.nombre);
  set('docEmisorNacionalidad', datos.nacionalidad);
  set('docEmisorCedula', datos.cedula);
  set('docSigEmisorNombre', datos.nombre);
  set('docSigEmisorCedula', datos.cedula);
  set('docSigEmisorTelefono', datos.telefono);
}

function sincronizarEmisorManual() {
  const val = (id) => {
    const el = document.getElementById(id);
    return el ? el.value : '';
  };
  aplicarEmisorEnDocumento({
    nombre: val('inputEmisorNombre'),
    nacionalidad: val('inputEmisorNacionalidad'),
    cedula: val('inputEmisorCedula'),
    telefono: val('inputEmisorTelefono')
  });
}

function limpiarEmisorEnDocumento() {
  ['docEmisorNombre', 'docEmisorNacionalidad', 'docEmisorCedula', 'docSigEmisorNombre', 'docSigEmisorCedula', 'docSigEmisorTelefono'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.innerText = '';
  });
}

function applyReferente(refOrId, forzar) {
  var ref = null;
  if (refOrId && typeof refOrId === 'object') {
    ref = refOrId;
  } else if (typeof refOrId === 'string') {
    var base = (window.obtenerReferentesBase && window.obtenerReferentesBase()) || [];
    ref = base.find(function (x) { return x.id === refOrId; }) || null;
  }

  var prev = document.getElementById('referentePreview');
  if (!ref) {
    if (prev) prev.textContent = 'No hay referencias disponibles. Usa "Administrar base" para crear una.';
    if (forzar || modoActual === 'precargado') limpiarEmisorEnDocumento();
    return;
  }

  if (forzar || modoActual === 'precargado') aplicarEmisorEnDocumento(ref);
  if (prev) {
    prev.textContent = ref.nombre + ' | ' + (ref.nacionalidad || '') + ' | ' + ref.cedula + (ref.telefono ? ' | ' + ref.telefono : '');
  }
}

function cambiarModo(m) {
  modoActual = m;
  refrescarFechaSiAuto();

  const bloques = {
    manual: ['bloqueEmisorManual', 'bloqueReferenciado', 'bloqueFoto', 'bloqueFecha'],
    precargado: ['bloqueEmisorPrecargado', 'bloqueReferenciado', 'bloqueFoto', 'bloqueFecha'],
    vacia: []
  };
  const visibles = bloques[m] || [];
  ['bloqueEmisorManual', 'bloqueEmisorPrecargado', 'bloqueReferenciado', 'bloqueFoto', 'bloqueFecha'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('d-none', !visibles.includes(id));
  });

  const info = document.getElementById('bloqueVacioInfo');
  if (info) info.classList.toggle('d-none', m !== 'vacia');

  document.querySelectorAll('[data-modo]').forEach(function (b) {
    b.classList.toggle('btn-primary', b.dataset.modo === m);
    b.classList.toggle('btn-outline-primary', b.dataset.modo !== m);
  });

  const lleno = document.getElementById('contenidoLleno');
  const vacio = document.getElementById('contenidoVacio');
  if (lleno) lleno.classList.toggle('d-none', m === 'vacia');
  if (vacio) vacio.classList.toggle('d-none', m !== 'vacia');

  const alerta = document.getElementById('refAlert');
  if (alerta) alerta.classList.add('d-none');

  if (m === 'precargado') {
    const sel = document.getElementById('selectReferente');
    if (sel) {
      if (!sel.value && sel.options.length > 1) sel.selectedIndex = 1;
      applyReferente(sel.value, true);
    }
  } else if (m === 'manual') {
    sincronizarEmisorManual();
  }
}

// Campos obligatorios del formulario según el modo activo
function validarFormulario() {
  if (modoActual === 'vacia') return [];

  const requeridos = [
    { id: 'inputRefNombre', label: 'nombre del referenciado' },
    { id: 'inputRefCedula', label: 'cédula del referenciado' },
    { id: 'inputTiempoConocer', label: 'tiempo de conocerlo(a)' },
    { id: 'inputCiudad', label: 'ciudad / municipio' },
    { id: 'inputDia', label: 'día de expedición' },
    { id: 'inputMes', label: 'mes de expedición' },
    { id: 'inputAno', label: 'año de expedición' }
  ];
  const faltan = [];
  requeridos.forEach(item => {
    const el = document.getElementById(item.id);
    if (!el || !el.value.trim()) faltan.push(item.label);
  });

  if (modoActual === 'manual') {
    const emisorNombre = document.getElementById('inputEmisorNombre')?.value.trim();
    const emisorCedula = document.getElementById('inputEmisorCedula')?.value.trim();
    if (!emisorNombre) faltan.push('nombre del emisor');
    if (!emisorCedula) faltan.push('cédula del emisor');
  }

  if (modoActual === 'precargado') {
    const sel = document.getElementById('selectReferente');
    const base = (window.obtenerReferentesBase && window.obtenerReferentesBase()) || [];
    const ref = sel ? base.find(function (x) { return x.id === sel.value; }) : null;
    if (!ref || !ref.nombre || !ref.cedula) faltan.push('datos del emisor precargado (nombre y cédula)');
  }

  return faltan;
}

function validarYReportar() {
  const faltan = validarFormulario();
  const alerta = document.getElementById('refAlert');
  if (!alerta) return faltan.length === 0;
  if (faltan.length > 0) {
    alerta.innerHTML = '<i class="bi bi-exclamation-triangle me-1"></i><strong>Completa:</strong> ' + faltan.join(', ') + '.';
    alerta.classList.remove('d-none');
    alerta.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return false;
  }
  alerta.classList.add('d-none');
  return true;
}

function restaurarEscala(element, previo) {
  element.style.transform = previo;
}

// Descargar el documento vista previa en PDF usando html2pdf
function descargarPDF() {
  refrescarFechaSiAuto();
  if (!validarYReportar()) return;
  abrirPreview();
  let element = document.getElementById('documento-pdf-modal');
  if (!element) element = document.getElementById('documento-pdf');
  let baseNombre = 'Referencia';
  if (modoActual === 'vacia') {
    baseNombre = 'En_Blanco';
  } else {
    baseNombre = (document.getElementById('inputRefNombre')?.value || 'Referencia').trim().replace(/\s+/g, '_');
  }

  const opt = {
    margin: 0,
    filename: `Referencia_Personal_${baseNombre}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      scrollY: -window.scrollY,
      windowWidth: document.documentElement.scrollWidth
    },
    jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
  };

  const escalaPrevia = element.style.transform || '';
  element.style.transform = 'none';
  window.scrollTo(0, 0);
  try {
    const worker = html2pdf().set(opt).from(element).save();
    const restaurar = () => restaurarEscala(element, escalaPrevia);
    if (worker && typeof worker.then === 'function') {
      worker.then(restaurar).catch(restaurar);
    } else {
      setTimeout(restaurar, 800);
    }
  } catch (e) {
    restaurarEscala(element, escalaPrevia);
    throw e;
  }
}

// Imprimir directamente el documento
function imprimirDocumento() {
  refrescarFechaSiAuto();
  if (!validarYReportar()) return;
  abrirPreview();
  setTimeout(function(){ window.print(); }, 450);
}
window.abrirPreview = abrirPreview;
window.togglePreview = abrirPreview;


// Autocompletar por cédula
(function(){
  function setupCedulaLookup(){
    if (!window.HW || !window.HW.cedula) return;
    document.querySelectorAll('[data-lookup-cedula]').forEach(function(btn){
      btn.addEventListener('click', function(){
        if (window.HW.cedula.avisoConfigFalta()) return;
        var inputId = btn.getAttribute('data-cedula-input');
        var map = btn.getAttribute('data-map') || '';
        var inp = document.getElementById(inputId);
        if (!inp) return;
        var cedula = inp.value || '';
        var num = cedula.replace(/\D/g,'');
        if (!num || num.length < 5 || num.length > 10){
          if (window.HW.toast) window.HW.toast('Ingresa un número de cédula válido', true);
          return;
        }
        var nacSel = map === 'emisor' ? document.getElementById('inputEmisorNacionalidad') : document.getElementById('inputRefNacionalidad');
        var nac = window.HW.cedula.derivarNacionalidad ? window.HW.cedula.derivarNacionalidad(nacSel) : 'v';
        var icon = btn.querySelector('i');
        var prevIcon = icon ? icon.className : '';
        if (icon) icon.className = 'bi bi-arrow-clockwise hw-bcv-spin';
        btn.disabled = true;
        Promise.resolve().then(function(){
          return window.HW.cedula.consultar(cedula, nac);
        }).then(function(data){
          var nombre = window.HW.cedula.nombreCompleto(data);
          if (map === 'emisor'){
            var n = document.getElementById('inputEmisorNombre'); if (n){ n.value = nombre; n.dispatchEvent(new Event('input',{bubbles:true})); n.dispatchEvent(new Event('change',{bubbles:true})); }
            var c = document.getElementById('inputEmisorCedula'); if (c){ c.value = window.HW.cedula.formatearCedula(num, data.nacionalidad || (nac==='e'?'E':'V')); c.dispatchEvent(new Event('input',{bubbles:true})); c.dispatchEvent(new Event('change',{bubbles:true})); }
            if (nacSel){
              var nv = (data.nacionalidad || nac) === 'E' ? 'Extranjero' : 'Venezolano';
              // mantener género si es femenina? opcional, ajustar básico
              if (nacSel.value && nacSel.value.toLowerCase().indexOf('ana') !== -1 && nv === 'Venezolano') nv = 'Venezolana';
              if (nacSel.value && nacSel.value.toLowerCase().indexOf('era') !== -1 && nv === 'Extranjero') nv = 'Extranjera';
              nacSel.value = nv; nacSel.dispatchEvent(new Event('change',{bubbles:true}));
            }
          }else if (map === 'referenciado'){
            var nr = document.getElementById('inputRefNombre'); if (nr){ nr.value = nombre; nr.dispatchEvent(new Event('input',{bubbles:true})); nr.dispatchEvent(new Event('change',{bubbles:true})); }
            var cr = document.getElementById('inputRefCedula'); if (cr){ cr.value = window.HW.cedula.formatearCedula(num, data.nacionalidad || (nac==='e'?'E':'V')); cr.dispatchEvent(new Event('input',{bubbles:true})); cr.dispatchEvent(new Event('change',{bubbles:true})); }
            var nr2 = document.getElementById('inputRefNacionalidad'); if (nr2){
              var nv2 = (data.nacionalidad || nac) === 'E' ? 'Extranjero' : 'Venezolano';
              if (nr2.value && nr2.value.toLowerCase().indexOf('ana') !== -1 && nv2 === 'Venezolano') nv2 = 'Venezolana';
              if (nr2.value && nr2.value.toLowerCase().indexOf('era') !== -1 && nv2 === 'Extranjero') nv2 = 'Extranjera';
              nr2.value = nv2; nr2.dispatchEvent(new Event('change',{bubbles:true}));
            }
          }
          if (window.HW.toast) window.HW.toast('Datos cargados desde cédula');
        }).catch(function(e){
          if (window.HW.toast) window.HW.toast(e.message || 'Error al consultar cédula', true);
        }).finally(function(){
          btn.disabled = false;
          if (icon) icon.className = prevIcon;
        });
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupCedulaLookup);
  else setupCedulaLookup();
})();


// Base editable de referencias (solo Precargadas) + importar/exportar JSON
(function(){
  var LS_KEY = 'hw_ref_base';
  var SEED = [
    { id: 'ref_seed_1', nombre: 'JUAN PÉREZ GONZÁLEZ', nacionalidad: 'Venezolano', cedula: 'V-12.345.678', telefono: '0412-5551234', creado: new Date().toISOString(), actualizado: new Date().toISOString() },
    { id: 'ref_seed_2', nombre: 'MARÍA RODRÍGUEZ LÓPEZ', nacionalidad: 'Venezolana', cedula: 'V-13.456.789', telefono: '0414-5555678', creado: new Date().toISOString(), actualizado: new Date().toISOString() },
    { id: 'ref_seed_3', nombre: 'CARLOS MARTÍNEZ SILVA', nacionalidad: 'Venezolano', cedula: 'V-14.567.890', telefono: '0424-5559012', creado: new Date().toISOString(), actualizado: new Date().toISOString() }
  ];

  function leerBase(){
    try {
      var raw = (window.HW && window.HW.persist) ? window.HW.persist.get(LS_KEY, null) : localStorage.getItem(LS_KEY);
      if (raw == null) return null;
      if (typeof raw === 'string') raw = JSON.parse(raw);
      return Array.isArray(raw) ? raw : null;
    } catch(e){ return null; }
  }

  function obtenerReferentes(){
    var raw = leerBase();
    if (raw === null){
      guardarBase(SEED);
      return SEED.slice();
    }
    return raw.filter(function(x){ return x && x.id && x.nombre && x.cedula; });
  }

  function guardarBase(arr){
    try {
      if (window.HW && window.HW.persist) window.HW.persist.set(LS_KEY, arr);
      else localStorage.setItem(LS_KEY, JSON.stringify(arr));
      return true;
    } catch(e){ return false; }
  }

  var REFERENTES_BASE = [];
  function renderReferenteSelect(selectedId){
    var sel = document.getElementById('selectReferente');
    if (!sel) return;
    var actual = sel.value;
    REFERENTES_BASE = obtenerReferentes();
    sel.innerHTML = '<option value="">Seleccione un referente...</option>';
    REFERENTES_BASE.forEach(function(r){
      var opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = r.nombre + ' - ' + r.cedula;
      sel.appendChild(opt);
    });

    var target = '';
    if (selectedId && REFERENTES_BASE.some(function(x){ return x.id === selectedId; })) target = selectedId;
    else if (actual && REFERENTES_BASE.some(function(x){ return x.id === actual; })) target = actual;
    else if (REFERENTES_BASE.length) target = REFERENTES_BASE[0].id;
    sel.value = target;

    sel.onchange = function(){
      applyReferente(sel.value, modoActual === 'precargado');
    };
    applyReferente(target, modoActual === 'precargado');
  }

  // exponer para uso existente
  window.renderReferenteSelect = renderReferenteSelect;
  window.obtenerReferentesBase = obtenerReferentes;

  // admin modal
  function renderAdminList(){
    var list = document.getElementById('refBaseList');
    if (!list) return;
    var arr = obtenerReferentes();
    list.innerHTML = '';
    if (!arr.length){
      var tr = document.createElement('tr');
      var td = document.createElement('td'); td.colSpan = 5; td.className = 'text-muted text-center'; td.textContent = 'Sin referencias en base'; tr.appendChild(td); list.appendChild(tr); return;
    }
    arr.forEach(function(r){
      var tr = document.createElement('tr');
      var tdN = document.createElement('td'); tdN.textContent = r.nombre || ''; tr.appendChild(tdN);
      var tdNac = document.createElement('td'); tdNac.textContent = r.nacionalidad || ''; tr.appendChild(tdNac);
      var tdC = document.createElement('td'); tdC.textContent = r.cedula || ''; tr.appendChild(tdC);
      var tdT = document.createElement('td'); tdT.textContent = r.telefono || ''; tr.appendChild(tdT);
      var tdA = document.createElement('td'); tdA.className = 'text-end';
      var btnE = document.createElement('button'); btnE.className = 'btn btn-outline-primary btn-sm me-1'; btnE.type='button'; btnE.innerHTML = '<i class="bi bi-pencil"></i>'; btnE.onclick = function(){ editar(r); };
      var btnD = document.createElement('button'); btnD.className = 'btn btn-outline-danger btn-sm'; btnD.type='button'; btnD.innerHTML = '<i class="bi bi-trash"></i>'; btnD.onclick = function(){ eliminar(r); };
      tdA.appendChild(btnE); tdA.appendChild(btnD); tr.appendChild(tdA); list.appendChild(tr);
    });
  }

  function showForm(edit){
    var wrap = document.getElementById('refBaseFormWrap');
    if (!wrap) return;
    document.getElementById('refBaseId').value = edit && edit.id ? edit.id : '';
    document.getElementById('refBaseNombre').value = edit && edit.nombre ? edit.nombre : '';
    document.getElementById('refBaseNacionalidad').value = edit && edit.nacionalidad ? edit.nacionalidad : 'Venezolano';
    document.getElementById('refBaseCedula').value = edit && edit.cedula ? edit.cedula : '';
    document.getElementById('refBaseTelefono').value = edit && edit.telefono ? edit.telefono : '';
    wrap.style.display = 'block';
  }

  function hideForm(){ var wrap = document.getElementById('refBaseFormWrap'); if (wrap) wrap.style.display = 'none'; }

  function nuevo(){ showForm(null); }
  function editar(r){ showForm(r); }
  function eliminar(r){
    if (!confirm('¿Eliminar esta referencia de la base?')) return;
    var sel = document.getElementById('selectReferente');
    var actual = sel ? sel.value : null;
    var arr = obtenerReferentes().filter(function(x){ return x.id !== r.id; });
    if (!guardarBase(arr)){ if (window.HW.toast) window.HW.toast('No se pudo guardar la base', true); return; }
    renderAdminList();
    renderReferenteSelect(actual === r.id ? null : actual);
    if (window.HW.toast) window.HW.toast('Referencia eliminada');
  }

  function guardar(){
    var id = document.getElementById('refBaseId').value || ('ref_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));
    var nombre = (document.getElementById('refBaseNombre').value || '').trim();
    var nac = document.getElementById('refBaseNacionalidad').value || 'Venezolano';
    var ced = (document.getElementById('refBaseCedula').value || '').trim();
    var tel = (document.getElementById('refBaseTelefono').value || '').trim();
    if (!nombre || !ced){ if (window.HW.toast) window.HW.toast('Nombre y cédula son obligatorios', true); return; }
    var arr = obtenerReferentes();
    var idx = arr.findIndex(function(x){ return x.id === id; });
    var cedKey = ced.replace(/\D/g, '');
    var duplicada = arr.some(function(x){
      return x.id !== id && String(x.cedula || '').replace(/\D/g, '') === cedKey;
    });
    if (duplicada){ if (window.HW.toast) window.HW.toast('Ya existe una referencia con esa cédula', true); return; }
    var obj = { id: id, nombre: nombre.toUpperCase(), nacionalidad: nac, cedula: ced, telefono: tel, creado: idx >=0 && arr[idx].creado ? arr[idx].creado : new Date().toISOString(), actualizado: new Date().toISOString() };
    if (idx >=0) arr[idx] = obj; else arr.push(obj);
    if (!guardarBase(arr)){ if (window.HW.toast) window.HW.toast('No se pudo guardar la base', true); return; }
    renderAdminList();
    renderReferenteSelect(id);
    hideForm();
    if (window.HW.toast) window.HW.toast('Referencia guardada');
  }

  function exportarBase(){
    var arr = obtenerReferentes();
    var blob = new Blob([JSON.stringify(arr, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'referencias-base.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  function importarBase(file){
    if (!file) return;
    var fr = new FileReader();
    fr.onload = function(e){
      try {
        var data = JSON.parse(e.target.result);
        if (!Array.isArray(data)){ if (window.HW.toast) window.HW.toast('Archivo JSON inválido', true); return; }
        var arr = obtenerReferentes();
        var added = 0;
        data.forEach(function(x){
          if (!x || !x.nombre || !x.cedula) return;
          var id = x.id || ('ref_imp_' + Date.now() + '_' + Math.random().toString(36).slice(2,6));
          if (arr.find(function(y){ return y.id === id || y.cedula === x.cedula; })) return;
          arr.push({ id: id, nombre: String(x.nombre).toUpperCase(), nacionalidad: x.nacionalidad || 'Venezolano', cedula: x.cedula, telefono: x.telefono || '', creado: new Date().toISOString(), actualizado: new Date().toISOString() });
          added++;
        });
        guardarBase(arr);
        renderAdminList();
        renderReferenteSelect();
        if (window.HW.toast) window.HW.toast(added + ' referencia(s) importada(s)');
      } catch(err){
        if (window.HW.toast) window.HW.toast('Error al importar JSON', true);
      }
    };
    fr.readAsText(file);
  }

  function restaurar(){
    if (!confirm('¿Restaurar ejemplos a la base? Se agregarán ejemplos si no existen.')) return;
    var arr = obtenerReferentes();
    SEED.forEach(function(s){
      if (!arr.find(function(x){ return x.cedula === s.cedula; })){
        arr.push({ id: 'ref_seed_' + Date.now() + '_' + Math.random().toString(36).slice(2,4), nombre: s.nombre, nacionalidad: s.nacionalidad, cedula: s.cedula, telefono: s.telefono, creado: new Date().toISOString(), actualizado: new Date().toISOString() });
      }
    });
    guardarBase(arr);
    renderAdminList();
    renderReferenteSelect();
    if (window.HW.toast) window.HW.toast('Ejemplos restaurados');
  }

  function setup(){
    var btnN = document.getElementById('btnRefNuevo'); if (btnN) btnN.onclick = nuevo;
    var btnG = document.getElementById('btnRefGuardar'); if (btnG) btnG.onclick = guardar;
    var btnC = document.getElementById('btnRefCancelar'); if (btnC) btnC.onclick = hideForm;
    var btnE = document.getElementById('btnRefExportar'); if (btnE) btnE.onclick = exportarBase;
    var inp = document.getElementById('inputRefImportar'); if (inp) inp.onchange = function(){ importarBase(this.files[0]); this.value=''; };
    var btnR = document.getElementById('btnRefRestaurar'); if (btnR) btnR.onclick = restaurar;
    var modal = document.getElementById('refBaseModal');
    if (modal) modal.addEventListener('show.bs.modal', function(){ renderAdminList(); hideForm(); });
    renderReferenteSelect();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();
})();
