
function abrirPreview() {
  const src = document.getElementById('documento-pdf');
  const dst = document.getElementById('documento-pdf-modal');
  if (dst && src && src.innerHTML) {
    dst.innerHTML = src.innerHTML;
  }
  const modalEl = document.getElementById('previewModal');
  if (modalEl && window.bootstrap && bootstrap.Modal) {
    const m = bootstrap.Modal.getOrCreateInstance(modalEl);
    m.show();
    if (window.HW && HW.initPaperFit) {
      setTimeout(function () { HW.initPaperFit(); }, 50);
      setTimeout(function () { HW.initPaperFit(); }, 250);
      setTimeout(function () { HW.initPaperFit(); }, 500);
    }
  } else if (window.HW && HW.initPaperFit) {
    setTimeout(function () { HW.initPaperFit(); }, 50);
  }
}

const guias = [];

document.addEventListener('DOMContentLoaded', () => {
  // Mapeo de elementos de entrada con sus respectivos nodos en la vista previa
  const bindings = [
    { input: 'inputLugarFecha', doc: 'docLugarFecha' },
    { input: 'inputEmpresa', doc: 'docEmpresa' },
    { input: 'inputPresente', doc: 'docPresente' },
    { input: 'inputOtorganteNombre', doc: 'docOtorganteNombre', callback: updateSigNames },
    { input: 'inputOtorganteGenero', doc: 'docOtorganteGenero' },
    { input: 'inputOtorganteCedula', doc: 'docOtorganteCedula', callback: updateSigCedulas },
    { input: 'inputApoderadoNombre', doc: 'docApoderadoNombre', callback: updateSigNames },
    { input: 'inputApoderadoGenero', doc: 'docApoderadoGenero' },
    { input: 'inputApoderadoCedula', doc: 'docApoderadoCedula', callback: updateSigCedulas },
    { input: 'inputOficina', doc: 'docOficina' },
  ];

  // Escuchar eventos de entrada de texto e interacción
  bindings.forEach(item => {
    const el = document.getElementById(item.input);
    if (!el) return;

    const syncValue = () => {
      const docEl = document.getElementById(item.doc);
      if (docEl) docEl.innerText = el.value;
      if (item.callback) item.callback();
    };

    el.addEventListener('input', syncValue);
    el.addEventListener('change', syncValue);
  });

  // Configuración para la subida de imágenes locales mediante FileReader API
  setupImageUpload('inputOtorganteFoto', 'boxFotoOtorgante');
  setupImageUpload('inputApoderadoFoto', 'boxFotoApoderado');

  // ---- Guías / tracking: soporta una o varias ----
  const inputNuevaGuia = document.getElementById('inputNuevaGuia');
  const btnAgregarGuia = document.getElementById('btnAgregarGuia');
  const trackingList = document.getElementById('trackingList');

  function agregarGuia() {
    const valor = inputNuevaGuia.value.trim();
    if (valor === '') {
      inputNuevaGuia.focus();
      return;
    }
    guias.push(valor);
    inputNuevaGuia.value = '';
    renderGuiaList();
    inputNuevaGuia.focus();
  }

  function renderGuiaList() {
    trackingList.innerHTML = '';
    if (guias.length === 0) {
      const hint = document.createElement('span');
      hint.className = 'small text-muted';
      hint.textContent = 'Sin guías agregadas.';
      trackingList.appendChild(hint);
      actualizarDocTracking();
      return;
    }
    guias.forEach((guia, i) => {
      const item = document.createElement('div');
      item.className = 'd-inline-flex align-items-center gap-2 border rounded-pill px-2 py-1 bg-white';

      const lbl = document.createElement('span');
      lbl.className = 'fw-semibold small';
      lbl.textContent = guia;

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'btn btn-sm btn-outline-danger py-0 px-1';
      del.style.fontSize = '0.7rem';
      del.style.lineHeight = '1';
      del.textContent = '\u00D7';
      del.title = 'Eliminar guía';
      del.setAttribute('aria-label', 'Eliminar guía ' + guia);
      del.addEventListener('click', () => {
        guias.splice(i, 1);
        renderGuiaList();
      });

      item.appendChild(lbl);
      item.appendChild(del);
      trackingList.appendChild(item);
    });
    actualizarDocTracking();
  }

  function actualizarDocTracking() {
    const limpias = guias.map(g => g.trim()).filter(Boolean);
    const prefixEl = document.getElementById('docTrackingPrefix');
    const docEl = document.getElementById('docTracking');

    if (prefixEl) {
      prefixEl.textContent = limpias.length === 1
        ? 'el número de tracking de dicha encomienda es: '
        : 'los números de tracking de dichas encomiendas son: ';
    }
    if (docEl) {
      docEl.textContent = '';
      limpias.forEach((guia, i) => {
        if (i > 0) docEl.appendChild(document.createTextNode(i === limpias.length - 1 ? ' y ' : ', '));
        docEl.appendChild(document.createTextNode(guia));
      });
    }
  }

  if (inputNuevaGuia) {
    inputNuevaGuia.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        agregarGuia();
      }
    });
  }
  if (btnAgregarGuia) btnAgregarGuia.addEventListener('click', agregarGuia);

  renderGuiaList();

  // Inicializar nombres y cédulas en el bloque de firmas
  updateSigNames();
  updateSigCedulas();

  // Escalar la hoja A4 a la altura disponible (layout paralelo)
  if (window.HW && HW.initPaperFit) HW.initPaperFit();
});

// Función para actualizar los nombres debajo de la línea de firma (sin inyección de HTML)
function updateSigNames() {
  setNombreCompleto(document.getElementById('docSigOtorganteNombre'), document.getElementById('inputOtorganteNombre')?.value || '');
  setNombreCompleto(document.getElementById('docSigApoderadoNombre'), document.getElementById('inputApoderadoNombre')?.value || '');
}

// Muestra el nombre completo en una sola línea continua usando únicamente textContent
function setNombreCompleto(el, value) {
  if (!el) return;
  el.textContent = value.replace(/\s+/g, ' ').trim();
}

// Actualiza el número de cédula mostrado junto a cada firma
function updateSigCedulas() {
  const o = document.getElementById('docSigOtorganteCedula');
  if (o) o.textContent = document.getElementById('inputOtorganteCedula')?.value || '';
  const a = document.getElementById('docSigApoderadoCedula');
  if (a) a.textContent = document.getElementById('inputApoderadoCedula')?.value || '';
}

// Cargar imagen seleccionada en su contenedor
function setupImageUpload(inputId, containerId) {
  const inputEl = document.getElementById(inputId);
  if (!inputEl) return;

  inputEl.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        const container = document.getElementById(containerId);
        if (container) {
          container.innerHTML = `<img src="${event.target.result}" alt="Imagen de Cédula">`;
        }
      };
      reader.readAsDataURL(file);
    }
  });
}

// Campos obligatorios del formulario
function validarFormulario() {
  const requeridos = [
    { id: 'inputLugarFecha', label: 'Lugar y fecha' },
    { id: 'inputEmpresa', label: 'empresa' },
    { id: 'inputOtorganteNombre', label: 'nombre del otorgante' },
    { id: 'inputOtorganteCedula', label: 'cédula del otorgante' },
    { id: 'inputApoderadoNombre', label: 'nombre del apoderado' },
    { id: 'inputApoderadoCedula', label: 'cédula del apoderado' },
    { id: 'inputOficina', label: 'oficina de entrega' }
  ];
  const faltan = [];
  requeridos.forEach(item => {
    const el = document.getElementById(item.id);
    if (!el || !el.value.trim()) faltan.push(item.label);
  });
  if (guias.length === 0) faltan.push('al menos un número de guía');
  return faltan;
}

function validarYReportar() {
  const faltan = validarFormulario();
  const alerta = document.getElementById('authAlert');
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

// Exportar documento a PDF usando html2pdf
function descargarPDF() {
  if (!validarYReportar()) return;
  abrirPreview();
  let element = document.getElementById('documento-pdf-modal');
  if (!element) element = document.getElementById('documento-pdf');
  const otorgante = document.getElementById('inputOtorganteNombre')?.value || 'Autorizacion';

  const opt = {
    margin: 0,
    filename: `Autorizacion_${otorgante.trim().replace(/\s+/g, '_')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
  };

  const escalaPrevia = element.style.transform || '';
  element.style.transform = 'none';
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
  window.print();
}
window.abrirPreview = abrirPreview;
window.togglePreview = abrirPreview;
