document.addEventListener('DOMContentLoaded', () => {
  // Mapeo de elementos de entrada con sus respectivos nodos en la vista previa
  const bindings = [
    { input: 'inputLugarFecha', doc: 'docLugarFecha' },
    { input: 'inputEmpresa', doc: 'docEmpresa' },
    { input: 'inputPresente', doc: 'docPresente' },
    { input: 'inputOtorganteNombre', doc: 'docOtorganteNombre', callback: updateSigNames },
    { input: 'inputOtorganteGenero', doc: 'docOtorganteGenero' },
    { input: 'inputOtorganteCedula', doc: 'docOtorganteCedula' },
    { input: 'inputApoderadoNombre', doc: 'docApoderadoNombre', callback: updateSigNames },
    { input: 'inputApoderadoGenero', doc: 'docApoderadoGenero' },
    { input: 'inputApoderadoCedula', doc: 'docApoderadoCedula' },
    { input: 'inputTracking', doc: 'docTracking' },
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

  // Inicializar nombres en el bloque de firmas
  updateSigNames();
});

// Función para actualizar los nombres debajo de la línea de firma
function updateSigNames() {
  const otorgante = document.getElementById('inputOtorganteNombre')?.value || '';
  const apoderado = document.getElementById('inputApoderadoNombre')?.value || '';

  const docSigOtorgante = document.getElementById('docSigOtorganteNombre');
  const docSigApoderado = document.getElementById('docSigApoderadoNombre');

  if (docSigOtorgante) docSigOtorgante.innerHTML = otorgante.replace(/\s+/g, '<br>');
  if (docSigApoderado) docSigApoderado.innerHTML = apoderado.replace(/\s+/g, '<br>');
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

// Exportar documento a PDF usando html2pdf
function descargarPDF() {
  const element = document.getElementById('documento-pdf');
  const otorgante = document.getElementById('inputOtorganteNombre')?.value || 'Autorizacion';

  const opt = {
    margin: 0,
    filename: `Autorizacion_${otorgante.trim().replace(/\s+/g, '_')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
}

// Imprimir directamente el documento
function imprimirDocumento() {
  window.print();
}