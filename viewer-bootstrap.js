(function () {
  function setMessage(message) {
    var container = document.getElementById('model-viewer');
    if (!container) return;

    container.innerHTML = '';
    var el = document.createElement('div');
    el.className = 'model-viewer-message';
    el.textContent = message;
    container.appendChild(el);
  }

  setMessage('Loading 3D preview...');

  (async function () {
    try {
      await import('./viewer.js');
    } catch (err) {
      var details = '';
      try {
        details = err && (err.stack || err.message) ? String(err.stack || err.message) : String(err);
      } catch (_) {
        details = 'Unknown error';
      }

      setMessage('3D viewer failed to start.\n\n' + details);
      // Also log to DevTools if available
      if (typeof console !== 'undefined' && console.error) console.error(err);
    }
  })();
})();
