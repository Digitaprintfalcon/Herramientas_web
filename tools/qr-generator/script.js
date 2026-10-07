
        // Obtener elementos del DOM
        const modeTextBtn = document.getElementById('mode-text');
        const modeLinkBtn = document.getElementById('mode-link');
        const panelText = document.getElementById('panel-text');
        const panelLink = document.getElementById('panel-link');
        const textInput = document.getElementById('text-input');
        const urlInput = document.getElementById('url-input');
        const charCount = document.getElementById('char-count');
        const urlHint = document.getElementById('url-hint');
        const openLinkBtn = document.getElementById('btn-open-link');
        const generateBtn = document.getElementById('generate-btn');
        const qrContainer = document.getElementById('qr-container');
        const qrcodeDiv = document.getElementById('qrcode');
        const downloadBtn = document.getElementById('download-btn');

        let currentMode = 'texto';

        // Cambiar de modo
        function setMode(mode) {
            currentMode = mode;
            const esTexto = mode === 'texto';

            modeTextBtn.className = esTexto ? 'btn btn-primary active' : 'btn btn-outline-primary';
            modeLinkBtn.className = esTexto ? 'btn btn-outline-primary' : 'btn btn-primary active';

            panelText.classList.toggle('d-none', !esTexto);
            panelLink.classList.toggle('d-none', esTexto);

            if (!esTexto) {
                urlHint.classList.remove('d-none');
            }

            if (obtenerValorActual().trim() !== '') {
                generateQR();
            }
        }

        modeTextBtn.addEventListener('click', () => setMode('texto'));
        modeLinkBtn.addEventListener('click', () => setMode('enlace'));

        // Valor activo según el modo
        function obtenerValorActual() {
            if (currentMode === 'enlace') {
                let valor = urlInput.value.trim();
                if (valor !== '' && !/^https?:\/\//i.test(valor)) {
                    valor = 'https://' + valor;
                }
                return valor;
            }
            return textInput.value;
        }

        // Contador de caracteres
        textInput.addEventListener('input', () => {
            charCount.textContent = textInput.value.length + ' caracteres';
        });

        // Abrir el enlace en una pestaña nueva
        openLinkBtn.addEventListener('click', () => {
            const url = obtenerValorActual();
            if (/^https?:\/\//i.test(url)) {
                window.open(url, '_blank', 'noopener');
            }
        });

        // Función para generar el código QR
        function generateQR() {
            const text = obtenerValorActual().trim();

            if (text === "") {
                (currentMode === 'enlace' ? urlInput : textInput).focus();
                qrContainer.classList.add('d-none');
                alert(currentMode === 'enlace'
                    ? "Por favor, introduce un enlace."
                    : "Por favor, introduce algún texto.");
                return;
            }

            // Limpiar el contenedor de QR previo
            qrcodeDiv.innerHTML = "";

            // Generar nuevo QR usando la librería qrcode (node-qrcode)
            const niveles = ['H', 'M', 'L'];
            let intento = 0;
            const generar = () => {
                if (intento >= niveles.length) {
                    alert("El texto es demasiado largo para generar un código QR escaneable.");
                    return;
                }
                QRCode.toDataURL(text, {
                    width: 300,
                    margin: 2,
                    errorCorrectionLevel: niveles[intento],
                    color: { dark: '#000000', light: '#ffffff' }
                }).then(url => {
                    qrcodeDiv.innerHTML = "";
                    const img = document.createElement('img');
                    img.src = url;
                    img.alt = 'Código QR';
                    qrcodeDiv.appendChild(img);

                    // Mostrar la sección del QR y preparar la descarga
                    qrContainer.classList.remove('d-none');
                    downloadBtn.href = url;
                }).catch(() => {
                    intento += 1;
                    generar();
                });
            };
            generar();
        }

        // Event listener para el botón
        generateBtn.addEventListener('click', generateQR);

        // Generar al presionar "Enter" (siempre que el campo activo tenga foco)
        textInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                generateQR();
            }
        });

        urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                generateQR();
            }
        });
    