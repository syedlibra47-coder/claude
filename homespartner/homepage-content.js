(async function () {
  if (window.dataReady) await window.dataReady;

  const c = window.HOMEPAGE_CONTENT_DATA;
  if (!c) return;

  const setText = (id, value) => { const el = document.getElementById(id); if (el && value != null) el.textContent = value; };

  // ----- Hero -----
  setText('heroBadgeText', c.heroBadgeText);
  setText('heroHeading', c.heroHeading);
  const heroSubtitleEl = document.getElementById('heroSubtitle');
  if (heroSubtitleEl) {
    const subtitle = (c.heroSubtitle || '').trim();
    if (subtitle) {
      heroSubtitleEl.textContent = subtitle;
      heroSubtitleEl.style.display = '';
    } else {
      heroSubtitleEl.style.display = 'none';
    }
  }

  // ----- Hero overlay tint/opacity (admin-adjustable, over the background photo/video) -----
  const heroEl = document.querySelector('.hero');
  if (heroEl && c.heroOverlayColor) {
    const opacityPct = c.heroOverlayOpacity != null ? c.heroOverlayOpacity : 80;
    const alphaHex = Math.round(Math.max(0, Math.min(100, opacityPct)) / 100 * 255).toString(16).padStart(2, '0').toUpperCase();
    heroEl.style.setProperty('--hero-overlay', `${c.heroOverlayColor}${alphaHex}`);
  }

  // ----- Hero background (uploaded image, or a YouTube video) -----
  const heroBgMedia = document.getElementById('heroBgMedia');
  if (heroBgMedia) {
    if (c.heroBgType === 'video' && c.heroBgVideoId) {
      heroBgMedia.innerHTML = `<iframe src="https://www.youtube.com/embed/${c.heroBgVideoId}?autoplay=1&mute=1&loop=1&playlist=${c.heroBgVideoId}&controls=0&showinfo=0&modestbranding=1&rel=0&playsinline=1" allow="autoplay; encrypted-media" title="Background video"></iframe>`;
      const sizeHeroVideo = () => {
        const iframe = heroBgMedia.querySelector('iframe');
        if (!iframe) return;
        const w = heroBgMedia.clientWidth, h = heroBgMedia.clientHeight;
        const ratio = 16 / 9;
        if (w / h > ratio) {
          iframe.style.width = w + 'px';
          iframe.style.height = Math.ceil(w / ratio) + 'px';
        } else {
          iframe.style.height = h + 'px';
          iframe.style.width = Math.ceil(h * ratio) + 'px';
        }
      };
      sizeHeroVideo();
      window.addEventListener('resize', sizeHeroVideo);
    } else if (c.heroBgImage) {
      heroBgMedia.innerHTML = `<img src="${c.heroBgImage}" alt="" class="hero-photo">`;
    }
  }

  // ----- Hero search: placeholder + filter dropdowns -----
  const heroSearchInput = document.getElementById('heroSearchInput');
  if (heroSearchInput && c.heroSearchPlaceholder) heroSearchInput.placeholder = c.heroSearchPlaceholder;

  const heroFiltersRow = document.getElementById('heroFiltersRow');
  if (heroFiltersRow && c.heroFilters) {
    heroFiltersRow.innerHTML = c.heroFilters.map(f => `
      <div class="search-field">
        <select data-match="${f.matchField || ''}">
          <option>${f.label}</option>
          ${(f.options || []).map(o => `<option>${o}</option>`).join('')}
        </select>
      </div>`).join('');
  }

  // ----- Hero search: Buy/Rent/Off-Plan + filters hand off to Listings / Off-Plan pages -----
  const searchToggle = document.getElementById('searchToggle');
  const searchBtn = document.querySelector('.search-panel .search-btn');
  if (searchToggle && searchBtn) {
    const normalizeBeds = (value) => {
      if (/stud/i.test(value)) return '0';
      const n = parseInt(value, 10);
      if (isNaN(n)) return '';
      return String(Math.min(n, 4));
    };

    const runSearch = () => {
      const mode = (searchToggle.querySelector('.toggle-pill.active') || {}).dataset?.mode || 'buy';
      const params = new URLSearchParams();
      const q = heroSearchInput ? heroSearchInput.value.trim() : '';
      if (q) params.set('q', q);

      document.querySelectorAll('#heroFiltersRow select').forEach(sel => {
        const match = sel.dataset.match;
        if (!match || !sel.value || sel.selectedIndex === 0) return;
        if (match === 'beds') {
          const norm = normalizeBeds(sel.value);
          if (norm) params.set('beds', norm);
        } else if (match === 'category') {
          params.set('category', sel.value);
        }
      });

      if (mode === 'offplan') {
        window.location.href = 'offplan-listings.html?' + params.toString();
      } else {
        params.set('status', mode === 'rent' ? 'rent' : 'sale');
        window.location.href = 'listings.html?' + params.toString();
      }
    };

    searchBtn.addEventListener('click', runSearch);
    if (heroSearchInput) {
      heroSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); runSearch(); }
      });
    }
  }

  // ----- Quick actions -----
  const quickGrid = document.getElementById('quickActionsGrid');
  if (quickGrid && c.quickActions) {
    quickGrid.innerHTML = c.quickActions.map(q => {
      const iconSvg = (window.ICON_LIBRARY && window.ICON_LIBRARY[q.icon]) || (window.ICON_LIBRARY && window.ICON_LIBRARY.home) || '';
      return `
      <a href="${q.href}" class="quick-card reveal in-view">
        <span class="quick-arrow">&#8599;</span>
        <span class="quick-icon"><svg viewBox="0 0 24 24" fill="none">${iconSvg}</svg></span>
        <h4>${q.title}</h4>
        <p>${q.description}</p>
      </a>`;
    }).join('');
  }

  // ----- Stats (with count-up animation) -----
  const statsStrip = document.getElementById('heroStatsStrip');
  if (statsStrip && c.stats) {
    statsStrip.innerHTML = c.stats.map(s => `
      <div class="stat"><span class="stat-num" data-count="${s.number}" data-suffix="${s.suffix || ''}">0</span><span class="stat-label">${s.label}</span></div>`).join('');

    const animateCount = (el) => {
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const duration = 1200;
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target).toLocaleString() + suffix;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const statObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          statObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    statsStrip.querySelectorAll('.stat-num[data-count]').forEach(el => statObserver.observe(el));
  }

  // ----- Section headings -----
  setText('servicesEyebrow', c.servicesEyebrow);
  setText('servicesHeading', c.servicesHeading);
  setText('servicesSubtitle', c.servicesSubtitle);
  setText('listingsEyebrow', c.listingsEyebrow);
  setText('listingsHeading', c.listingsHeading);
  setText('listingsSubtitle', c.listingsSubtitle);
  setText('offplanEyebrow', c.offplanEyebrow);
  setText('offplanHeading', c.offplanHeading);
  setText('offplanSubtitle', c.offplanSubtitle);
  setText('officesEyebrow', c.officesEyebrow);
  setText('officesHeading', c.officesHeading);
  setText('officesSubtitle', c.officesSubtitle);
  setText('youtubeEyebrow', c.youtubeEyebrow);
  setText('youtubeHeading', c.youtubeHeading);
  setText('youtubeSubtitle', c.youtubeSubtitle);
  setText('whyusEyebrow', c.whyusEyebrow);
  setText('whyusHeading', c.whyusHeading);
  setText('whyusSubtitle', c.whyusSubtitle);
  setText('ctaHeading', c.ctaHeading);
  setText('ctaSubtitle', c.ctaSubtitle);

  // ----- Off-plan features strip -----
  const offplanFeatures = document.getElementById('offplanFeaturesStrip');
  if (offplanFeatures && c.offplanFeatures) {
    offplanFeatures.innerHTML = c.offplanFeatures.map(f => `
      <div class="offplan-feature"><strong>${f.title}</strong><span>${f.description}</span></div>`).join('');
  }

  // ----- Why-us grid -----
  const whyusGrid = document.getElementById('whyusGrid');
  if (whyusGrid && c.whyusItems) {
    whyusGrid.innerHTML = c.whyusItems.map(item => `
      <div class="why-item"><h4>${item.title}</h4><p>${item.description}</p></div>`).join('');
  }

  // ----- Offices: teaser cards + map (reuses the same offices table as contact.html) -----
  const officeGrid = document.getElementById('officeGridHome');
  if (officeGrid && window.OFFICES_DATA) {
    const offices = [...window.OFFICES_DATA].sort((a, b) => a.sortOrder - b.sortOrder);
    officeGrid.innerHTML = offices.map(o => `
      <div class="office-card reveal in-view">
        <span class="badge badge--gold">${o.badgeLabel}</span>
        <h3>${o.title}</h3>
        <p>${o.address}</p>
      </div>`).join('');

    if (window.renderOfficeMap) window.renderOfficeMap(offices, 'mapRouteLines', 'mapNodes');
  }
})();
