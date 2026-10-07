/* Datos por defecto de tu empresa para el encabezado de las cotizaciones.
   Estos placeholders se muestran si no existe empresa.local.js.
   Para usar tus datos reales sin publicarlos en git:
   1. copiá empresa.local.example.js como empresa.local.js
   2. completalo con tus datos (este archivo tiene prioridad) */
window.HW_EMPRESA = Object.assign(window.HW_EMPRESA || {}, {
  nombre: 'Tu Empresa C.A.',
  rif: 'J-00000000-0',
  telefono: '0414-0000000',
  email: 'contacto@tuempresa.com',
  direccion: 'Avenida Principal, Edificio, Piso 1, Local 2',
  lema: 'Calidad e impresión profesional'
});