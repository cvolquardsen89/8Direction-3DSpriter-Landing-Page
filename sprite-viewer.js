(function () {
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function initSpriteViewer(container) {
    if (!container) return;

    var img = container.querySelector('img');
    if (!img) return;

    // State
    var scale = 1;
    var minScale = 0.25;
    var maxScale = 10;
    var offsetX = 0;
    var offsetY = 0;

    var isPanning = false;
    var startX = 0;
    var startY = 0;
    var startOffsetX = 0;
    var startOffsetY = 0;

    function applyTransform() {
      img.style.transform = 'translate(' + offsetX + 'px, ' + offsetY + 'px) scale(' + scale + ')';
    }

    function getLocalPoint(clientX, clientY) {
      var rect = container.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }

    function zoomAt(clientX, clientY, zoomFactor) {
      var p = getLocalPoint(clientX, clientY);

      // Current image-space point under cursor
      var imgX = (p.x - offsetX) / scale;
      var imgY = (p.y - offsetY) / scale;

      var nextScale = clamp(scale * zoomFactor, minScale, maxScale);
      if (nextScale === scale) return;

      // Keep cursor anchored
      scale = nextScale;
      offsetX = p.x - imgX * scale;
      offsetY = p.y - imgY * scale;

      applyTransform();
    }

    function onPointerDown(e) {
      // Only pan for primary button
      if (e.button !== undefined && e.button !== 0) return;
      isPanning = true;
      container.setPointerCapture && container.setPointerCapture(e.pointerId);
      startX = e.clientX;
      startY = e.clientY;
      startOffsetX = offsetX;
      startOffsetY = offsetY;
    }

    function onPointerMove(e) {
      if (!isPanning) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      offsetX = startOffsetX + dx;
      offsetY = startOffsetY + dy;
      applyTransform();
    }

    function onPointerUp(e) {
      isPanning = false;
      try {
        container.releasePointerCapture && container.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }

    function onWheel(e) {
      // Zoom with wheel; keep page scroll when not over viewer
      e.preventDefault();

      // Standardize: wheel down => zoom out
      var zoomIn = e.deltaY < 0;
      var factor = zoomIn ? 1.1 : 1 / 1.1;
      zoomAt(e.clientX, e.clientY, factor);
    }

    function onLoad() {
      // Start centered-ish
      offsetX = 8;
      offsetY = 8;
      scale = 1;
      applyTransform();
    }

    // Prevent default dragging ghost image
    img.addEventListener('dragstart', function (e) {
      e.preventDefault();
    });

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    container.addEventListener('wheel', onWheel, { passive: false });

    if (img.complete) onLoad();
    else img.addEventListener('load', onLoad);

    applyTransform();
  }

  function boot() {
    var container = document.getElementById('sprite-viewer');
    if (!container) return;
    initSpriteViewer(container);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
