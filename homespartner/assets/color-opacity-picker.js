// ============================================================
// Custom color + opacity picker.
//
// Native <input type="color"> has no alpha channel in any browser —
// that's a platform limitation, not something CSS/JS can add to it.
// This renders a swatch button that opens a popover with a
// saturation/value square, a hue slider and an opacity slider all
// visible together, so opacity is never hidden behind a native
// browser dialog.
//
// Usage: window.createColorOpacityPicker({ color, opacity, onChange })
// returns { el, getValue(), setValue(color, opacity) }.
// ============================================================

function copHexToRgb(hex) {
  hex = String(hex || '#000000').replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const num = parseInt(hex, 16) || 0;
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
function copRgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase();
}
function copRgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s: s * 100, v: max * 100 };
}
function copHsvToRgb(h, s, v) {
  s /= 100; v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = v - c;
  let r, g, b;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

window.createColorOpacityPicker = function ({ color, opacity, onChange }) {
  let hex = color || '#1F275C';
  let alpha = opacity != null ? opacity : 100;
  const rgb0 = copHexToRgb(hex);
  let hsv = copRgbToHsv(rgb0.r, rgb0.g, rgb0.b);

  const wrap = document.createElement('div');
  wrap.className = 'cop-widget';
  wrap.innerHTML = `
    <button type="button" class="cop-swatch-btn">
      <span class="cop-swatch-checker"><span class="cop-swatch-preview"></span></span>
    </button>
    <div class="cop-popover" hidden>
      <div class="cop-sv-square"><div class="cop-slider-cursor cop-sv-cursor"></div></div>
      <div class="cop-hue-slider"><div class="cop-slider-cursor cop-hue-cursor"></div></div>
      <div class="cop-alpha-slider">
        <div class="cop-alpha-checker"><div class="cop-alpha-gradient"></div></div>
        <div class="cop-slider-cursor cop-alpha-cursor"></div>
      </div>
      <div class="cop-hex-row">
        <label>Hex <input type="text" class="cop-hex-input"></label>
        <label>Opacity <input type="number" class="cop-alpha-input" min="0" max="100">%</label>
      </div>
    </div>
  `;

  const swatchBtn = wrap.querySelector('.cop-swatch-btn');
  const swatchPreview = wrap.querySelector('.cop-swatch-preview');
  const popover = wrap.querySelector('.cop-popover');
  const svSquare = wrap.querySelector('.cop-sv-square');
  const svCursor = wrap.querySelector('.cop-sv-cursor');
  const hueSlider = wrap.querySelector('.cop-hue-slider');
  const hueCursor = wrap.querySelector('.cop-hue-cursor');
  const alphaSlider = wrap.querySelector('.cop-alpha-slider');
  const alphaGradient = wrap.querySelector('.cop-alpha-gradient');
  const alphaCursor = wrap.querySelector('.cop-alpha-cursor');
  const hexInput = wrap.querySelector('.cop-hex-input');
  const alphaInput = wrap.querySelector('.cop-alpha-input');

  function currentRgb() {
    const { r, g, b } = copHsvToRgb(hsv.h, hsv.s, hsv.v);
    return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
  }

  function render() {
    const rgb = currentRgb();
    hex = copRgbToHex(rgb.r, rgb.g, rgb.b);
    swatchPreview.style.background = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha / 100})`;
    svSquare.style.background = `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h},100%,50%))`;
    svCursor.style.left = hsv.s + '%';
    svCursor.style.top = (100 - hsv.v) + '%';
    hueCursor.style.left = (hsv.h / 360 * 100) + '%';
    alphaGradient.style.background = `linear-gradient(to right, rgba(${rgb.r},${rgb.g},${rgb.b},0), rgba(${rgb.r},${rgb.g},${rgb.b},1))`;
    alphaCursor.style.left = alpha + '%';
    hexInput.value = hex;
    alphaInput.value = Math.round(alpha);
  }
  render();

  function emitChange() {
    render();
    if (onChange) onChange({ color: hex, opacity: Math.round(alpha) });
  }

  function dragHandler(target, onMove) {
    function pointerMove(e) {
      const rect = target.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      onMove(x, y);
      emitChange();
    }
    function pointerUp() {
      window.removeEventListener('pointermove', pointerMove);
      window.removeEventListener('pointerup', pointerUp);
    }
    target.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      pointerMove(e);
      window.addEventListener('pointermove', pointerMove);
      window.addEventListener('pointerup', pointerUp);
    });
  }

  dragHandler(svSquare, (x, y) => { hsv.s = x * 100; hsv.v = (1 - y) * 100; });
  dragHandler(hueSlider, (x) => { hsv.h = x * 360; });
  dragHandler(alphaSlider, (x) => { alpha = x * 100; });

  hexInput.addEventListener('change', () => {
    const val = hexInput.value.trim();
    if (/^#?[0-9a-fA-F]{6}$/.test(val)) {
      const rgb = copHexToRgb(val.startsWith('#') ? val : '#' + val);
      hsv = copRgbToHsv(rgb.r, rgb.g, rgb.b);
      emitChange();
    } else {
      hexInput.value = hex;
    }
  });
  alphaInput.addEventListener('change', () => {
    alpha = Math.max(0, Math.min(100, Number(alphaInput.value) || 0));
    emitChange();
  });

  swatchBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const wasOpen = !popover.hidden;
    document.querySelectorAll('.cop-popover').forEach(p => { p.hidden = true; });
    popover.hidden = wasOpen;
  });
  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) popover.hidden = true;
  });

  return {
    el: wrap,
    getValue: () => ({ color: hex, opacity: Math.round(alpha) }),
    setValue: (newColor, newOpacity) => {
      hex = newColor || hex;
      alpha = newOpacity != null ? newOpacity : alpha;
      const rgb = copHexToRgb(hex);
      hsv = copRgbToHsv(rgb.r, rgb.g, rgb.b);
      render();
    }
  };
};
