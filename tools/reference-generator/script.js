
function abrirPreview() {
  const modalEl = document.getElementById('previewModal');
  if (modalEl && window.bootstrap && bootstrap.Modal) {
    const m = bootstrap.Modal.getOrCreateInstance(modalEl);
    m.show();
  }
}

// Personas predefinidas que emiten la referencia (modo Precargadas).
// Reemplaza estos placeholders con los datos reales de tus 3 referentes.
const REFERENTES = [
  { nombre: 'Nombre Referente 1', nacionalidad: 'Venezolano', cedula: 'V-00.000.000', telefono: '0414-0000000' },
  { nombre: 'Nombre Referente 2', nacionalidad: 'Venezolano', cedula: 'V-00.000.000', telefono: '0414-0000000' },
  { nombre: 'Nombre Referente 3', nacionalidad: 'Venezolano', cedula: 'V-00.000.000', telefono: '0414-0000000' }
];

let modoActual = 'manual';

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
      if (file) {
        const label = document.getElementById('fileLabel');
        if (label) label.innerText = '✅ Cédula agregada: ' + file.name;

        const reader = new FileReader();
        reader.onload = function (event) {
          const img = document.getElementById('docCedulaImg');
          const section = document.getElementById('cedulaSection');

          if (img) img.src = event.target.result;
          if (section) section.classList.remove('d-none');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // ---- Modos de captura (Manual / Precargadas / Vacía) ----
  const selReferente = document.getElementById('selectReferente');
  if (selReferente && typeof window.renderReferenteSelect === 'function') {
    window.renderReferenteSelect(selReferente.value);
    selReferente.onchange = function () {
      applyReferente(selReferente.value);
    };
  } else if (selReferente) {
    REFERENTES.forEach(function (p, i) {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = p.nombre || ('Referente ' + (i + 1));
      selReferente.appendChild(opt);
    });
    selReferente.addEventListener('change', function () {
      applyReferente(REFERENTES[Number(this.value)]);
    });
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

function applyReferente(refOrId) {
  var ref = null;
  if (refOrId && typeof refOrId === 'object') ref = refOrId;
  else if (typeof refOrId === 'string') {
    var base = (window.obtenerReferentesBase && window.obtenerReferentesBase()) || [];
    ref = base.find(function(x){ return x.id === refOrId; }) || (typeof REFERENTES !== 'undefined' ? REFERENTES.find(function(x){ return x.id === refOrId; }) : null);
    if (!ref && !isNaN(Number(refOrId)) && typeof REFERENTES !== 'undefined') ref = REFERENTES[Number(refOrId)];
  } else if (typeof refOrId === 'number' && typeof REFERENTES !== 'undefined') {
    ref = REFERENTES[refOrId];
  }
  if (!ref) return;
  aplicarEmisorEnDocumento(ref);
  var prev = document.getElementById('referentePreview');
  if (prev) prev.textContent = 'Se usará: ' + (ref.nombre || 'Referente') + ' · C.I ' + (ref.cedula || '');
}

function cambiarModo(m) {
  modoActual = m;

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
    if (sel) applyReferente(REFERENTES[Number(sel.value)] || REFERENTES[0]);
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
    const ref = sel ? REFERENTES[Number(sel.value)] : null;
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
        window.HW.cedula.consultar(cedula, nac).then(function(data){
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

  function obtenerReferentes(){
    try {
      var raw = (window.HW && window.HW.persist) ? window.HW.persist.get(LS_KEY) : localStorage.getItem(LS_KEY);
      if (raw && typeof raw === 'string') raw = JSON.parse(raw);
      if (Array.isArray(raw) && raw.length) return raw.filter(function(x){ return x && x.id && x.nombre && x.cedula; });
      return SEED.slice();
    } catch(e){ return SEED.slice(); }
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
    REFERENTES_BASE = obtenerReferentes();
    sel.innerHTML = '<option value="">Seleccione un referente...</option>';
    REFERENTES_BASE.forEach(function(r){
      var opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = r.nombre + ' - ' + r.cedula;
      sel.appendChild(opt);
    });
    if (selectedId) sel.value = selectedId;
    sel.onchange = function(){
      var id = sel.value;
      var ref = REFERENTES_BASE.find(function(x){ return x.id === id; });
      var prev = document.getElementById('referentePreview');
      if (prev){
        if (ref) prev.textContent = ref.nombre + ' | ' + (ref.nacionalidad||'') + ' | ' + ref.cedula + (ref.telefono? ' | ' + ref.telefono : '');
        else prev.textContent = '';
      }
    };
    sel.onchange();
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
    var arr = obtenerReferentes().filter(function(x){ return x.id !== r.id; });
    guardarBase(arr);
    renderAdminList();
    renderReferenteSelect(document.getElementById('selectReferente') ? document.getElementById('selectReferente').value : null);
    if (window.HW.toast) window.HW.toast('Referencia eliminada');
  }

  function guardar(){
    var id = document.getElementById('refBaseId').value || ('ref_' + Date.now());
    var nombre = (document.getElementById('refBaseNombre').value || '').trim();
    var nac = document.getElementById('refBaseNacionalidad').value || 'Venezolano';
    var ced = (document.getElementById('refBaseCedula').value || '').trim();
    var tel = (document.getElementById('refBaseTelefono').value || '').trim();
    if (!nombre || !ced){ if (window.HW.toast) window.HW.toast('Nombre y cédula son obligatorios', true); return; }
    var arr = obtenerReferentes();
    var idx = arr.findIndex(function(x){ return x.id === id; });
    var obj = { id: id, nombre: nombre.toUpperCase(), nacionalidad: nac, cedula: ced, telefono: tel, creado: idx >=0 && arr[idx].creado ? arr[idx].creado : new Date().toISOString(), actualizado: new Date().toISOString() };
    if (idx >=0) arr[idx] = obj; else arr.push(obj);
    guardarBase(arr);
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
