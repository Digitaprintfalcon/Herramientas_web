(function (global) {
  'use strict';

  function fmtCurrency(value) {
    const n = Number(value);
    return '$' + (isFinite(n) ? n.toFixed(2) : '0.00');
  }

  function safeParseJSON(raw, fallback) {
    if (typeof raw !== 'string' || raw === '') return fallback;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function safeGetJSON(key, fallback) {
    try {
      return safeParseJSON(global.localStorage.getItem(key), fallback);
    } catch (e) {
      return fallback;
    }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[c];
    });
  }

  function fmtBs(value) {
    const n = Number(value);
    if (!isFinite(n)) return 'Bs. 0,00';
    return 'Bs. ' + n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function bcvNowTime() {
    try {
      return new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return new Date().toLocaleTimeString();
    }
  }

  async function bcvFetchTasa() {
    try {
      const r = await fetch('https://rates.dolarvzla.com/bcv/current.json');
      if (r.ok) {
        const d = await r.json();
        if (d && Number(d.usd) > 0) return Number(d.usd);
      }
      const r2 = await fetch('https://bcv-api.rafnixg.dev/v1/exchange-rates/latest/USD');
      if (r2.ok) {
        const d2 = await r2.json();
        if (d2 && Number(d2.rate) > 0) return Number(d2.rate);
      }
    } catch (e) {
      /* sin conexión: se conserva la tasa actual */
    }
    return null;
  }

  function bcvMount(el, opts) {
    if (!el) return null;
    opts = opts || {};

    el.innerHTML =
      '<div class="bcv-widget">' +
        '<div class="d-flex justify-content-between align-items-center mb-2 gap-2">' +
          '<span class="small fw-semibold text-muted">Tasa BCV del día:</span>' +
          '<div class="input-group input-group-sm" style="max-width: 150px;">' +
            '<input type="number" id="hw-bcv-tasa" step="0.01" class="form-control form-control-sm text-success fw-bold" title="Tasa BCV (editable)">' +
            '<button class="btn btn-outline-primary btn-sm" type="button" id="hw-bcv-sync" title="Actualizar tasa BCV">' +
              '<i class="bi bi-arrow-repeat" id="hw-bcv-spin-ico"></i>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="mb-2"><small class="text-muted" id="hw-bcv-time">Última actualización: --:--:--</small></div>' +
        '<div class="small text-uppercase fw-semibold text-muted mb-1">Equivalente en Bolívares</div>' +
        '<div class="h4 fw-bold text-success mb-0" id="hw-bcv-bs">' + fmtBs(0) + '</div>' +
      '</div>';

    const input = el.querySelector('#hw-bcv-tasa');
    const sync = el.querySelector('#hw-bcv-sync');
    const ico = el.querySelector('#hw-bcv-spin-ico');
    const timeEl = el.querySelector('#hw-bcv-time');
    const bsEl = el.querySelector('#hw-bcv-bs');

    let usd = 0;
    let tasa = 857.01;
    let lastUpdate = null;

    function renderBs() {
      bsEl.textContent = fmtBs(usd * tasa);
      if (lastUpdate) timeEl.textContent = 'Última actualización: ' + lastUpdate;
    }

    function aplicarTasa(t) {
      if (!(Number(t) > 0)) return;
      tasa = Number(t);
      lastUpdate = bcvNowTime();
      input.value = tasa.toFixed(2);
      renderBs();
      if (typeof opts.onTasaChange === 'function') opts.onTasaChange(tasa);
    }

    input.value = tasa.toFixed(2);
    input.addEventListener('input', function () {
      const v = parseFloat(input.value);
      if (isFinite(v) && v > 0) aplicarTasa(v);
    });
    sync.addEventListener('click', function () {
      ico.classList.add('hw-bcv-spin');
      bcvFetchTasa().then(function (t) {
        ico.classList.remove('hw-bcv-spin');
        aplicarTasa(t);
      });
    });

    bcvFetchTasa().then(function (t) {
      aplicarTasa(t);
    });

    return {
      getTasa: function () { return tasa; },
      setUsd: function (n) {
        usd = isFinite(Number(n)) ? Number(n) : 0;
        renderBs();
      }
    };
  }

  global.HW = {
    fmtCurrency: fmtCurrency,
    fmtBs: fmtBs,
    safeParseJSON: safeParseJSON,
    safeGetJSON: safeGetJSON,
    escapeHtml: escapeHtml,
    bcv: {
      mount: bcvMount,
      fetchTasa: bcvFetchTasa
    }
  };
})(window);