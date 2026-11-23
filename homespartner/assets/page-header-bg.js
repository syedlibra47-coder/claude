// Applies an admin-chosen background (flat color, image, or YouTube video)
// to a secondary page's title banner (<section class="page-hero" data-page="...">).
// Leaves the section untouched when the admin has it set to "Default" (or when
// nothing is configured yet), so the built-in navy gradient shows as before.
(async function () {
  if (window.dataReady) await window.dataReady;

  const hero = document.querySelector('.page-hero[data-page]');
  if (!hero) return;

  const data = window.PAGE_HEADERS_DATA && window.PAGE_HEADERS_DATA[hero.dataset.page];
  if (!data) return;

  function applyOverlayTint() {
    if (!data.overlayColor) return;
    const opacityPct = data.overlayOpacity != null ? data.overlayOpacity : 70;
    const alphaHex = Math.round(Math.max(0, Math.min(100, opacityPct)) / 100 * 255).toString(16).padStart(2, '0').toUpperCase();
    hero.style.setProperty('--page-hero-overlay', `${data.overlayColor}${alphaHex}`);
  }

  if (data.bgType === 'color' && data.bgColor) {
    hero.classList.add('page-hero--solid');
    hero.style.background = data.bgColor;
  } else if (data.bgType === 'image' && data.bgImage) {
    hero.classList.add('page-hero--media');
    applyOverlayTint();
    const mediaEl = hero.querySelector('.hero-bg-media');
    if (mediaEl) mediaEl.innerHTML = `<img src="${data.bgImage}" alt="" class="hero-photo">`;
  } else if (data.bgType === 'video' && data.bgVideoId) {
    hero.classList.add('page-hero--media');
    applyOverlayTint();
    const mediaEl = hero.querySelector('.hero-bg-media');
    if (mediaEl) {
      mediaEl.innerHTML = `<iframe src="https://www.youtube.com/embed/${data.bgVideoId}?autoplay=1&mute=1&loop=1&playlist=${data.bgVideoId}&controls=0&showinfo=0&modestbranding=1&rel=0&playsinline=1" allow="autoplay; encrypted-media" title="Background video"></iframe>`;
      const sizeVideo = () => {
        const iframe = mediaEl.querySelector('iframe');
        if (!iframe) return;
        const w = mediaEl.clientWidth, h = mediaEl.clientHeight, ratio = 16 / 9;
        if (w / h > ratio) {
          iframe.style.width = w + 'px';
          iframe.style.height = Math.ceil(w / ratio) + 'px';
        } else {
          iframe.style.height = h + 'px';
          iframe.style.width = Math.ceil(h * ratio) + 'px';
        }
      };
      sizeVideo();
      window.addEventListener('resize', sizeVideo);
    }
  } else if (data.bgType === 'banner' && data.bannerImage) {
    hero.classList.add('page-hero--banner');
    const link = document.createElement('a');
    link.className = 'page-hero-banner-link';
    link.href = data.bannerLink || '#';
    const img = document.createElement('img');
    img.className = 'page-hero-banner-img';
    img.src = data.bannerImage;
    img.alt = '';
    img.style.setProperty('--banner-height', (data.bannerHeight || 400) + 'px');
    img.style.setProperty('--banner-height-mobile', (data.bannerHeightMobile || 250) + 'px');
    link.appendChild(img);
    hero.appendChild(link);
  }
})();
