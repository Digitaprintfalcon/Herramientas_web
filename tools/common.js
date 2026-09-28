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

  global.HW = {
    fmtCurrency: fmtCurrency,
    safeParseJSON: safeParseJSON,
    safeGetJSON: safeGetJSON,
    escapeHtml: escapeHtml
  };
})(window);