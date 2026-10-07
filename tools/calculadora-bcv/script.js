
    // Configuración por moneda. La tasa del euro se guarda aparte y, si ninguna
    // API responde, se deriva del dólar guardado con el spread típico del BCV.
    var MONEDAS = {
      usd: {
        label: 'Dólares (USD)',
        prefijo: '$',
        unidadBs: 'Bs/$',
        labelTasa: 'Tasa Oficial BCV',
        storageKey: 'simple_bcv_rate',
        fallback: 857.01,
        tituloTasa: 'Tasa BCV'
      },
      eur: {
        label: 'Euros (EUR)',
        prefijo: '€',
        unidadBs: 'Bs/€',
        labelTasa: 'Tasa BCV del Euro',
        storageKey: 'simple_bcv_rate_eur',
        fallback: 976.84,
        tituloTasa: 'Tasa BCV Euro'
      }
    };

    var FACTOR_EUR = 1.135;

    var modo = 'usd';
    var rates = { usd: MONEDAS.usd.fallback, eur: MONEDAS.eur.fallback };

    // Hasta que una consulta confirme la tasa, ninguna se considera "en vivo"
    var estadoPorModo = { usd: 'estimado', eur: 'estimado' };

    function leerGuardado(key) {
      try {
        var num = parseFloat(localStorage.getItem(key));
        return (num > 0) ? num : 0;
      } catch (e) {
        return 0;
      }
    }

    function guardarTasa(key, valor) {
      try { localStorage.setItem(key, valor.toString()); } catch (e) { /* sin almacenamiento */ }
    }

    // El estado de la tasa se guarda aparte para que el pill siga siendo
    // honesto después de recargar (manual / estimado / en vivo).
    function guardarEstado(clave, estado) {
      try { localStorage.setItem(clave + '_estado', estado); } catch (e) { /* sin almacenamiento */ }
    }

    function leerEstado(clave) {
      try { return localStorage.getItem(clave + '_estado'); } catch (e) { return null; }
    }

    function fijarTasa(claveMoneda, valor, estado) {
      rates[claveMoneda] = valor;
      estadoPorModo[claveMoneda] = estado;
      guardarTasa(MONEDAS[claveMoneda].storageKey, valor);
      guardarEstado(MONEDAS[claveMoneda].storageKey, estado);
    }

    // Una tasa guardada viene de una consulta anterior, así que se respeta el
    // estado con el que se guardó; el euro solo se deriva si nunca hubo uno.
    function cargarTasasGuardadas() {
      ['usd', 'eur'].forEach(function (clave) {
        var guardado = leerGuardado(MONEDAS[clave].storageKey);
        if (guardado <= 0) return;

        var estado = leerEstado(MONEDAS[clave].storageKey);
        if (estado !== 'manual' && estado !== 'estimado') estado = 'live';

        rates[clave] = guardado;
        estadoPorModo[clave] = estado;
      });

      if (estadoPorModo.eur !== 'live' && estadoPorModo.eur !== 'manual') {
        rates.eur = rates.usd * FACTOR_EUR;
        estadoPorModo.eur = 'estimado';
      }
    }

    window.onload = function () {
      rates.usd = MONEDAS.usd.fallback;
      rates.eur = MONEDAS.eur.fallback;

      cargarTasasGuardadas();

      aplicarModo();
      fetchBcvRate();
    };

    function showToast(msg, isError) {
      HW.toast(msg, isError);
    }

    function pintarStatus() {
      var statusTag = document.getElementById('statusTag');

      if (estadoPorModo[modo] === 'manual') {
        statusTag.className = 'hw-status-pill hw-status-manual';
        statusTag.innerHTML = '<i class="bi bi-pencil"></i> Manual';
      } else if (estadoPorModo[modo] === 'estimado') {
        statusTag.className = 'hw-status-pill hw-status-estimated';
        statusTag.innerHTML = '<i class="bi bi-calculator"></i> Estimado';
      } else {
        statusTag.className = 'hw-status-pill hw-status-live';
        statusTag.innerHTML = '<i class="bi bi-wifi"></i> En vivo';
      }
    }

    function updateRateUI() {
      var cfg = MONEDAS[modo];

      document.getElementById('rateValue').textContent = rates[modo].toFixed(2);
      document.getElementById('rateUnit').textContent = cfg.unidadBs;
      document.getElementById('rateInput').placeholder = rates[modo].toFixed(2);

      // Recalcular el valor que esté activo
      var fxVal = document.getElementById('fxInput').value;
      if (fxVal) {
        convertirDesde(fxVal);
      } else {
        var bsVal = document.getElementById('bsInput').value;
        if (bsVal) convertirHacia(bsVal);
      }
    }

    // Pinta todo lo que depende de la moneda activa
    function aplicarModo() {
      var cfg = MONEDAS[modo];

      document.getElementById('rateLabel').textContent = cfg.labelTasa;
      document.getElementById('fxLabelText').textContent = cfg.label;
      document.getElementById('fxIcon').className = 'bi ' + (modo === 'eur' ? 'bi-currency-euro' : 'bi-currency-dollar');
      document.getElementById('fxPrefix').textContent = cfg.prefijo;
      document.getElementById('quickLabel').textContent = 'Montos Rápidos ' + (modo === 'eur' ? 'EUR' : 'USD');

      var chips = document.querySelectorAll('[data-amount]');
      for (var i = 0; i < chips.length; i++) {
        chips[i].textContent = cfg.prefijo + chips[i].getAttribute('data-amount');
      }

      var botones = document.querySelectorAll('.hw-seg-btn');
      for (var j = 0; j < botones.length; j++) {
        var activo = botones[j].getAttribute('data-modo') === modo;
        botones[j].classList.toggle('is-active', activo);
        botones[j].setAttribute('aria-pressed', activo ? 'true' : 'false');
      }

      pintarStatus();
      updateRateUI();
    }

    function setModo(nuevo) {
      if (nuevo === modo || !MONEDAS[nuevo]) return;
      modo = nuevo;
      aplicarModo();
    }

    function onManualRateChange(val) {
      var num = parseFloat(val);
      if (!isNaN(num) && num > 0) {
        fijarTasa(modo, num, 'manual');
        document.getElementById('rateValue').textContent = num.toFixed(2);

        pintarStatus();
        updateRateUI();
      }
    }

    async function fetchBcvRate() {
      var syncIcon = document.getElementById('syncIcon');
      syncIcon.classList.add('hw-bcv-spin');

      // Respaldos para el dólar cuando no responde dolarvzla
      var usdRespaldo = [
        { url: 'https://pydolarve.org/api/v1/dollar?page=bcv', leer: leerPydolarve },
        { url: 'https://ve.dolarapi.com/v1/dolares/oficial', leer: leerDolarapi }
      ];

      try {
        // Fuente principal: trae el dólar y el euro en la misma respuesta
        var res = await fetch('https://rates.dolarvzla.com/bcv/current.json', { cache: 'no-cache' });
        if (!res.ok) throw new Error('Respuesta ' + res.status);

        var data = await res.json();
        var usd = data && data.current ? parseFloat(data.current.usd) : (data ? parseFloat(data.usd) : NaN);
        var eur = data && data.current ? parseFloat(data.current.eur) : (data ? parseFloat(data.eur) : NaN);

        if (!(usd > 0)) throw new Error('Tasa del dólar ausente');

        fijarTasa('usd', usd, 'live');

        if (eur > 0) {
          fijarTasa('eur', eur, 'live');
        } else {
          fijarTasa('eur', usd * FACTOR_EUR, 'estimado');
        }
      } catch (e) {
        console.warn('Fallo la fuente principal de tasas:', e);

        var tasaUsd = await buscarRespaldoUsd(usdRespaldo);
        if (tasaUsd > 0) {
          fijarTasa('usd', tasaUsd, 'live');
        }

        // Solo se deriva el euro si no hay una tasa real guardada
        if (estadoPorModo.eur !== 'live' && estadoPorModo.eur !== 'manual') {
          fijarTasa('eur', rates.usd * FACTOR_EUR, 'estimado');
        }
      }

      syncIcon.classList.remove('hw-bcv-spin');

      document.getElementById('rateInput').value = '';
      pintarStatus();
      updateRateUI();

      if (estadoPorModo[modo] === 'estimado') {
        showToast(
          modo === 'eur'
            ? 'Sin fuente en vivo: euro estimado desde el dólar'
            : 'Sin fuente en vivo: se conserva la tasa guardada',
          true
        );
      } else if (estadoPorModo.usd === 'live' && estadoPorModo.eur === 'live') {
        showToast('Tasas BCV sincronizadas');
      } else {
        showToast('Tasa BCV sincronizada');
      }
    }

    async function buscarRespaldoUsd(fuentes) {
      for (var i = 0; i < fuentes.length; i++) {
        try {
          var res = await fetch(fuentes[i].url, { cache: 'no-cache' });
          if (!res.ok) continue;
          var tasa = fuentes[i].leer(await res.json());
          if (tasa > 0) return tasa;
        } catch (e) {
          console.warn('Respaldo ' + fuentes[i].url + ' no disponible:', e);
        }
      }
      return 0;
    }

    function leerPydolarve(data) {
      if (data && data.monedas && data.monedas.usd && data.monedas.usd.promedio) {
        return parseFloat(data.monedas.usd.promedio);
      }
      return data && data.promedio ? parseFloat(data.promedio) : 0;
    }

    function leerDolarapi(data) {
      return data && data.promedio ? parseFloat(data.promedio) : 0;
    }

    // Conversión moneda -> VES
    function convertirDesde(val) {
      var bsInput = document.getElementById('bsInput');
      var monto = parseFloat(val);
      if (isNaN(monto) || monto < 0) {
        bsInput.value = '';
        return;
      }
      bsInput.value = (monto * rates[modo]).toFixed(2);
    }

    // Conversión VES -> moneda
    function convertirHacia(val) {
      var fxInput = document.getElementById('fxInput');
      var monto = parseFloat(val);
      if (isNaN(monto) || monto < 0) {
        fxInput.value = '';
        return;
      }
      fxInput.value = (monto / rates[modo]).toFixed(2);
    }

    // Botones rápidos
    function setQuickAmount(monto) {
      var fxInput = document.getElementById('fxInput');
      fxInput.value = monto;
      convertirDesde(monto);
    }

    // Invertir orden de campos en pantalla
    function swapFields() {
      var container = document.getElementById('fxBox').parentNode;
      var fxBox = document.getElementById('fxBox');
      var bsBox = document.getElementById('bsBox');

      if (container.firstElementChild === fxBox) {
        container.appendChild(fxBox);
      } else {
        container.prepend(fxBox);
      }
    }

    // Limpiar inputs
    function clearInputs() {
      document.getElementById('fxInput').value = '';
      document.getElementById('bsInput').value = '';
      showToast('Campos vaciados');
    }

    // Copiar resultado al portapapeles
    function copyResult() {
      var cfg = MONEDAS[modo];
      var fxVal = parseFloat(document.getElementById('fxInput').value) || 0;
      var bsVal = parseFloat(document.getElementById('bsInput').value) || 0;

      if (fxVal === 0 && bsVal === 0) {
        HW.toast('Ingresa un monto para copiar', true);
        return;
      }

      var texto = cfg.prefijo + fxVal.toFixed(2) + ' ' + modo.toUpperCase() +
        ' = Bs. ' + bsVal.toFixed(2) + ' VES (' + cfg.tituloTasa + ': ' + rates[modo].toFixed(2) + ')';

      HW.copyResult(texto, '¡Copiado al portapapeles!');
    }
  