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
        const usd = d && d.current && Number(d.current.usd) > 0
          ? Number(d.current.usd)
          : d && Number(d.usd) > 0 ? Number(d.usd) : 0;
        if (usd > 0) return usd;
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

  function hwThemeIcons(btn, dark) {
    const moon = btn.querySelector('.bi-moon-stars');
    const sun = btn.querySelector('.bi-sun');
    if (moon) moon.style.display = dark ? 'none' : '';
    if (sun) sun.style.display = dark ? '' : 'none';
  }

  function hwSavedTheme() {
    try {
      return global.localStorage.getItem('hw_theme');
    } catch (e) { /* sin almacenamiento: sin preferencia manual */ }
    return null;
  }

  function hwSystemPrefersDark() {
    return !!(global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  function hwThemeInit() {
    const html = document.documentElement;
    const saved = hwSavedTheme();
    const dark = saved !== null ? (saved === 'dark') : hwSystemPrefersDark();
    html.classList.toggle('dark', dark);

    let btn = global.document.querySelector('.hw-theme-toggle');
    if (!btn) {
      const nav = global.document.querySelector('.tool-nav');
      if (!nav) return;
      btn = global.document.createElement('button');
      btn.type = 'button';
      btn.className = 'hw-theme-toggle';
      btn.title = 'Cambiar tema';
      btn.setAttribute('aria-label', 'Cambiar tema');
      btn.innerHTML = '<i class="bi bi-moon-stars"></i><i class="bi bi-sun"></i>';
      nav.appendChild(btn);
    }

    hwThemeIcons(btn, dark);
    btn.addEventListener('click', function () {
      const next = html.classList.toggle('dark');
      hwThemeIcons(btn, next);
      try {
        global.localStorage.setItem('hw_theme', next ? 'dark' : 'light');
      } catch (e) { /* sin almacenamiento */ }
    });

    // Seguir al dispositivo solo mientras no haya preferencia manual guardada
    if (global.matchMedia) {
      const mq = global.matchMedia('(prefers-color-scheme: dark)');
      const onSystemChange = function (e) {
        if (hwSavedTheme() !== null) return;
        html.classList.toggle('dark', e.matches);
        const b = global.document.querySelector('.hw-theme-toggle');
        if (b) hwThemeIcons(b, e.matches);
      };
      if (typeof mq.addEventListener === 'function') mq.addEventListener('change', onSystemChange);
      else if (typeof mq.addListener === 'function') mq.addListener(onSystemChange);
    }
  }

  function hwThemeBoot() {
    if (global.document.readyState === 'loading') {
      global.document.addEventListener('DOMContentLoaded', hwThemeInit);
    } else {
      hwThemeInit();
    }
  }

  // Ajusta la hoja A4 (.paper) a la altura de su contenedor (layout paralelo)
  function initPaperFit() {
    const paper = global.document && global.document.getElementById('documento-pdf');
    if (!paper) return null;
    const wrap = paper.parentElement;

    const fit = function () {
      const w = paper.offsetWidth;
      const h = paper.offsetHeight;
      if (!w || !h) return;
      const wrapW = wrap ? wrap.clientWidth : global.innerWidth - 48;
      const wrapH = wrap ? wrap.clientHeight : global.innerHeight - 160;
      const scale = Math.min(1, wrapW / w, wrapH / h);
      paper.style.transform = scale >= 1 ? '' : 'scale(' + scale + ')';
    };

    fit();
    global.addEventListener('resize', fit);
    if (global.ResizeObserver) {
      try {
        new ResizeObserver(fit).observe(paper);
      } catch (e) { /* sin ResizeObserver */ }
    }
    return fit;
  }

  // ===== Barra de navegación: menú compartido de herramientas =====
  var HW_TOOLS = [
    {
      categoria: 'Consultas',
      items: [
        { nombre: 'Consulta de Cédula (DNI)', icon: 'person-vcard', href: '../dni-checker/index.html' }
      ]
    },
    {
      categoria: 'Finanzas',
      items: [
        { nombre: 'Calculadora BCV', icon: 'calculator', href: '../calculadora-bcv/index.html' }
      ]
    },
    {
      categoria: 'Producción',
      items: [
        { nombre: 'Cotizador de Pendones', icon: 'flag', href: '../banner-estimator/index.html' },
        { nombre: 'Cotizador DTF', icon: 'printer-fill', href: '../dtf-estimator/index.html' },
        { nombre: 'Cotizador de Vinil', icon: 'layers', href: '../vinil-estimator/index.html' },
        { nombre: 'Cotizador de Corte de Vinil', icon: 'scissors', href: '../cut-estimator/index.html' },
        { nombre: 'Calculadora PVC · Vinil · Laminado', icon: 'calculator', href: '../calculadora-pvc/index.html' }
      ]
    },
    {
      categoria: 'Utilidades',
      items: [
        { nombre: 'Generador QR', icon: 'qr-code', href: '../qr-generator/index.html' }
      ]
    },
    {
      categoria: 'Documentos',
      items: [
        { nombre: 'Generador de Referencias', icon: 'file-earmark-text', href: '../reference-generator/index.html' },
        { nombre: 'Generador de Autorizaciones', icon: 'file-earmark-check', href: '../authorization-generator/index.html' }
      ]
    }
  ];

  // Inyecta el botón "Herramientas" + desplegable en la barra .tool-nav existente
  function hwNavBarMount() {
    if (!global.document) return;
    const nav = global.document.querySelector('.tool-nav');
    if (!nav) return;

    const btn = global.document.createElement('button');
    btn.type = 'button';
    btn.className = 'hw-nav-menu-btn';
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML =
      '<i class="bi bi-grid-fill"></i>' +
      '<span class="hw-nav-txt">Herramientas</span>' +
      '<i class="bi bi-chevron-down hw-nav-caret"></i>';

    const panel = global.document.createElement('div');
    panel.className = 'hw-nav-menu';
    panel.hidden = true;

    const path = global.location
      ? global.location.pathname.replace(/\/+$/, '')
      : '';

    HW_TOOLS.forEach(function (grupo) {
      const sec = global.document.createElement('div');
      sec.className = 'hw-nav-group';

      const cab = global.document.createElement('div');
      cab.className = 'hw-nav-group-title';
      cab.textContent = grupo.categoria;
      sec.appendChild(cab);

      grupo.items.forEach(function (tool) {
        const a = global.document.createElement('a');
        a.className = 'hw-nav-link';
        a.href = tool.href;
        a.innerHTML = '<i class="bi bi-' + tool.icon + '"></i><span>' + tool.nombre + '</span>';

        const candidato = '/tools/' + tool.href.replace(/^\.\.\//, '');
        if (path.endsWith(candidato)) {
          a.classList.add('current');
          a.setAttribute('aria-current', 'page');
          a.innerHTML += '<i class="bi bi-check2 hw-nav-check"></i>';
        }
        sec.appendChild(a);
      });

      panel.appendChild(sec);
    });

    function setOpen(open) {
      panel.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(panel.hidden);
    });

    global.document.addEventListener('click', function () {
      if (!panel.hidden) setOpen(false);
    });

    global.document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) setOpen(false);
    });

    nav.appendChild(btn);
    nav.appendChild(panel);
  }

  // ===== Utilidades comunes reutilizables =====

  // Toast flotante compartido (usa el estilo .hw-toast de common.css)
  function hwToast(mensaje, esError) {
    if (!global.document || !mensaje) return;
    let el = global.document.getElementById('hw-toast-shared');
    if (!el) {
      el = global.document.createElement('div');
      el.id = 'hw-toast-shared';
      el.className = 'hw-toast';
      global.document.body.appendChild(el);
    }
    const icono = esError ? 'bi-exclamation-circle-fill' : 'bi-check-circle-fill';
    el.innerHTML = '<i class="bi ' + icono + '"></i><span></span>';
    el.querySelector('span').textContent = mensaje;
    el.classList.add('show');
    clearTimeout(hwToast.timer);
    hwToast.timer = setTimeout(function () {
      el.classList.remove('show');
    }, 2500);
  }

  // Copiar texto al portapapeles (la herramienta decide el mensaje)
  function copyText(texto) {
    if (!global.navigator || !navigator.clipboard || !navigator.clipboard.writeText) {
      return Promise.reject(new Error('sin portapapeles'));
    }
    return navigator.clipboard.writeText(String(texto));
  }

  function copyResult(texto, mensajeOk) {
    return copyText(texto).then(function () {
      hwToast(mensajeOk || 'Copiado al portapapeles');
      return true;
    }).catch(function () {
      hwToast('No se pudo copiar al portapapeles', true);
      return false;
    });
  }

  // Almacenamiento seguro (JSON) con manejo de errores
  function persistGet(key, fallback) {
    try {
      const raw = global.localStorage.getItem(key);
      return raw === null || raw === undefined ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function persistSet(key, valor) {
    try {
      global.localStorage.setItem(key, JSON.stringify(valor));
      return true;
    } catch (e) {
      return false;
    }
  }

  function persistRemove(key) {
    try {
      global.localStorage.removeItem(key);
    } catch (e) { /* sin almacenamiento */ }
  }

  global.HW = {
    fmtCurrency: fmtCurrency,
    fmtBs: fmtBs,
    safeParseJSON: safeParseJSON,
    safeGetJSON: safeGetJSON,
    escapeHtml: escapeHtml,
    initTheme: hwThemeInit,
    initPaperFit: initPaperFit,
    mountNavbar: hwNavBarMount,
    toast: hwToast,
    copyText: copyText,
    copyResult: copyResult,
    persist: {
      get: persistGet,
      set: persistSet,
      remove: persistRemove
    },
    bcv: {
      mount: bcvMount,
      fetchTasa: bcvFetchTasa
    }
  };

  hwNavBarMount();
  hwThemeBoot();
})(window);