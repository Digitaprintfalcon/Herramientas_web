
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
  if (selReferente) {
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

function applyReferente(ref) {
  if (!ref) return;
  aplicarEmisorEnDocumento(ref);
  const prev = document.getElementById('referentePreview');
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
