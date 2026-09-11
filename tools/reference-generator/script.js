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
});

// Descargar el documento vista previa en PDF usando html2pdf
function descargarPDF() {
  const element = document.getElementById('documento-pdf');
  const refNombre = document.getElementById('inputRefNombre')?.value || 'Referencia';

  const opt = {
    margin: 0,
    filename: `Referencia_Personal_${refNombre.trim().replace(/\s+/g, '_')}.pdf`,
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