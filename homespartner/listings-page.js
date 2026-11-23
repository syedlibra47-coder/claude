(async function () {
  if (window.dataReady) await window.dataReady;

  const grid = document.getElementById('allListingsGrid');
  if (!grid || !window.LISTINGS_DATA) return;

  const WHATSAPP_NUMBER = (window.CONTACT_CONTENT_DATA && window.CONTACT_CONTENT_DATA.whatsappNumber) || '971500000000';
  const listings = Object.values(window.LISTINGS_DATA);

  const statusBtns = document.querySelectorAll('#allListingsStatus .filter-btn');
  const typeSelect = document.getElementById('filterType');
  const bedsSelect = document.getElementById('filterBeds');
  const bathsSelect = document.getElementById('filterBaths');
  const priceMinInput = document.getElementById('filterPriceMin');
  const priceMaxInput = document.getElementById('filterPriceMax');
  const sortSelect = document.getElementById('filterSort');
  const keywordInput = document.getElementById('filterKeyword');
  const resultsCount = document.getElementById('filterResultsCount');
  const emptyState = document.getElementById('filterEmptyState');
  const resetBtn = document.getElementById('filterReset');
  const viewToggleBtns = document.querySelectorAll('#filterViewToggle .filter-view-btn');
  const mapEl = document.getElementById('allListingsMap');
  let activeStatus = 'all';
  let activeView = 'list';
  let currentFiltered = [];
  let leafletMap = null;
  let mapMarkers = [];

  // ----- Apply filters handed off from the homepage search (?status=&category=&beds=&q=) -----
  function normalizeWord(s) { return s.trim().toLowerCase().replace(/s$/, ''); }
  function matchSelectOption(select, rawValue) {
    if (!rawValue) return null;
    const target = normalizeWord(rawValue);
    const opt = [...select.options].find(o => normalizeWord(o.value) === target || normalizeWord(o.textContent) === target);
    return opt ? opt.value : null;
  }
  const urlParams = new URLSearchParams(window.location.search);
  const pStatus = urlParams.get('status');
  const pCategory = urlParams.get('category');
  const pBeds = urlParams.get('beds');
  const pKeyword = urlParams.get('q');
  if (pStatus === 'sale' || pStatus === 'rent') {
    statusBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === pStatus));
    activeStatus = pStatus;
  }
  if (pCategory) {
    const matched = matchSelectOption(typeSelect, pCategory);
    if (matched) typeSelect.value = matched;
  }
  if (pBeds && ['0', '1', '2', '3', '4'].includes(pBeds)) bedsSelect.value = pBeds;
  if (pKeyword) keywordInput.value = pKeyword;

  function bedsFilterValue(beds) {
    if (beds === 'Studio') return '0';
    const n = parseInt(beds, 10);
    return n >= 4 ? '4' : String(n);
  }

  function bathsFilterValue(baths) {
    const n = parseInt(baths, 10) || 0;
    return n >= 4 ? '4' : String(n);
  }

  function parseSqft(sqft) {
    return Number(String(sqft).replace(/,/g, '')) || 0;
  }

  // Deterministic small offset per listing id, so markers for listings
  // sharing a community fallback coordinate don't stack exactly and
  // don't jump around between re-renders.
  function hashJitter(id) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) { hash = (hash * 31 + id.charCodeAt(i)) | 0; }
    const angle = (Math.abs(hash) % 360) * (Math.PI / 180);
    const dist = 0.003 + (Math.abs(hash) % 100) / 100000;
    return [Math.cos(angle) * dist, Math.sin(angle) * dist];
  }

  function resolveCoords(l) {
    if (l.latitude != null && l.longitude != null) return [l.latitude, l.longitude];
    const base = window.getCommunityCoords ? window.getCommunityCoords(l.community) : null;
    if (!base) return null;
    const [dLat, dLon] = hashJitter(l.id);
    return [base[0] + dLat, base[1] + dLon];
  }

  function cardHtml(l) {
    const waMessage = `Hi, I'm interested in ${l.title} (${l.community}, ${l.city}). Could you share more details?`;
    const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessage)}`;
    return `
    <article class="listing-card reveal in-view" data-type="${l.type}" data-category="${l.category.toLowerCase()}" data-beds="${bedsFilterValue(l.beds)}" data-search="${(l.title + ' ' + l.community + ' ' + l.city + ' ' + l.category).toLowerCase()}" data-listing-id="${l.id}">
      <div class="listing-image">
        <img src="${l.hero}" alt="${l.title}, ${l.community}">
        <span class="badge ${l.type === 'sale' ? 'badge--gold' : 'badge--navy'} listing-tag">${l.type === 'sale' ? 'For Sale' : 'For Rent'}</span>
        <div class="dots"><span class="dot active"></span><span class="dot"></span><span class="dot"></span></div>
      </div>
      <div class="listing-body">
        <div class="pill-row"><span class="pill">${l.tags[0] || l.category}</span><span class="pill">${l.tags[1] || l.category}</span></div>
        <div class="listing-price">${l.priceLabel}${l.priceSuffix ? ` <span>${l.priceSuffix}</span>` : ''}</div>
        <h3>${l.title}</h3>
        <p class="listing-location">${l.community}, ${l.city}</p>
        <div class="listing-meta"><span><svg viewBox="0 0 24 24" fill="none"><path d="M3 19v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M3 19h18M6 11V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>${l.beds === 'Studio' ? 'Studio' : l.beds + ' Beds'}</span><span><svg viewBox="0 0 24 24" fill="none"><path d="M4 12h16M6 12V6a2 2 0 0 1 2-2h1M6 12v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>${l.baths} Baths</span><span><svg viewBox="0 0 24 24" fill="none"><rect x="3.5" y="3.5" width="17" height="17" rx="1.5" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 8.5h17M8.5 3.5v17" stroke="currentColor" stroke-width="1.8"/></svg>${l.sqft} sqft</span></div>
        <div class="listing-footer">
          <a href="listing-detail.html?id=${l.id}" class="card-link">View Details &rarr;</a>
          <a class="whatsapp-btn whatsapp-btn--inline" href="${waHref}" target="_blank" rel="noopener" aria-label="Enquire about ${l.title} on WhatsApp">
            <img src="assets/WhatsApp.svg.webp" alt="WhatsApp">
          </a>
        </div>
      </div>
    </article>`;
  }

  function applyFilters() {
    const type = typeSelect.value;
    const beds = bedsSelect.value;
    const baths = bathsSelect.value;
    const priceMin = Number(priceMinInput.value) || 0;
    const priceMax = Number(priceMaxInput.value) || Infinity;
    const keyword = keywordInput.value.trim().toLowerCase();

    let filtered = listings.filter(l => {
      const matchesStatus = activeStatus === 'all' || l.type === activeStatus;
      const matchesType = type === 'all' || l.category.toLowerCase() === type;
      const matchesBeds = beds === 'all' || bedsFilterValue(l.beds) === beds;
      const matchesBaths = baths === 'all' || bathsFilterValue(l.baths) === baths;
      const matchesPrice = l.price >= priceMin && l.price <= priceMax;
      const matchesKeyword = !keyword || (l.title + ' ' + l.community + ' ' + l.city + ' ' + l.category).toLowerCase().includes(keyword);
      return matchesStatus && matchesType && matchesBeds && matchesBaths && matchesPrice && matchesKeyword;
    });

    if (sortSelect.value === 'price-asc') filtered = filtered.slice().sort((a, b) => a.price - b.price);
    else if (sortSelect.value === 'price-desc') filtered = filtered.slice().sort((a, b) => b.price - a.price);

    currentFiltered = filtered;

    grid.innerHTML = filtered.map(cardHtml).join('');
    resultsCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'property' : 'properties'}`;
    emptyState.classList.toggle('is-visible', filtered.length === 0);

    grid.querySelectorAll('.listing-card[data-listing-id]').forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        if (e.target.closest('a, button, input, select, textarea')) return;
        window.location.href = `listing-detail.html?id=${card.dataset.listingId}`;
      });
    });

    if (activeView === 'map') renderMap(filtered);
  }

  // ----- Map view (Leaflet + OpenStreetMap, no API key required) -----
  function ensureMap() {
    if (leafletMap || !window.L) return;
    leafletMap = window.L.map(mapEl).setView([25.15, 55.25], 11); // Dubai
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(leafletMap);
  }

  function renderMap(items) {
    if (!window.L) return;
    ensureMap();
    mapMarkers.forEach(m => leafletMap.removeLayer(m));
    mapMarkers = [];

    const bounds = [];
    items.forEach(l => {
      const coords = resolveCoords(l);
      if (!coords) return;
      bounds.push(coords);
      const marker = window.L.marker(coords).addTo(leafletMap);
      marker.bindPopup(`
        <div class="listings-map-popup">
          <img src="${l.hero}" alt="${l.title}">
          <div class="lmp-price">${l.priceLabel}${l.priceSuffix ? ` ${l.priceSuffix}` : ''}</div>
          <div class="lmp-title">${l.title}</div>
          <div class="lmp-location">${l.community}, ${l.city}</div>
          <a href="listing-detail.html?id=${l.id}">View Details &rarr;</a>
        </div>`);
      mapMarkers.push(marker);
    });

    if (bounds.length) leafletMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });

    // Leaflet needs a nudge after becoming visible/resized to size its tiles correctly.
    setTimeout(() => leafletMap.invalidateSize(), 50);
  }

  function setView(view) {
    activeView = view;
    viewToggleBtns.forEach(b => b.classList.toggle('active', b.dataset.view === view));
    grid.style.display = view === 'list' ? '' : 'none';
    mapEl.style.display = view === 'map' ? '' : 'none';
    if (view === 'map') renderMap(currentFiltered);
  }
  viewToggleBtns.forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.view)));

  statusBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      statusBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeStatus = btn.dataset.filter;
      applyFilters();
    });
  });
  typeSelect.addEventListener('change', applyFilters);
  bedsSelect.addEventListener('change', applyFilters);
  bathsSelect.addEventListener('change', applyFilters);
  priceMinInput.addEventListener('input', applyFilters);
  priceMaxInput.addEventListener('input', applyFilters);
  sortSelect.addEventListener('change', applyFilters);
  keywordInput.addEventListener('input', applyFilters);

  function resetAll() {
    statusBtns.forEach(b => b.classList.remove('active'));
    statusBtns[0].classList.add('active');
    activeStatus = 'all';
    typeSelect.value = 'all';
    bedsSelect.value = 'all';
    bathsSelect.value = 'all';
    priceMinInput.value = '';
    priceMaxInput.value = '';
    sortSelect.value = 'newest';
    keywordInput.value = '';
    applyFilters();
  }
  resetBtn.addEventListener('click', resetAll);
  document.querySelectorAll('[data-mirror-reset]').forEach(btn => btn.addEventListener('click', resetAll));

  // ----- Save this search (captured as a lead; no automated "new listing"
  // emails go out yet — that needs an email-sending service wired up
  // separately, so these land in admin for the team to action manually) -----
  const saveSearchBtn = document.getElementById('saveSearchBtn');
  const saveSearchForm = document.getElementById('filterSaveForm');
  const saveSearchNote = document.getElementById('filterSaveNote');
  const saveSearchEmail = document.getElementById('saveSearchEmail');

  saveSearchBtn.addEventListener('click', () => {
    const isOpen = saveSearchForm.style.display !== 'none';
    saveSearchForm.style.display = isOpen ? 'none' : 'flex';
    saveSearchBtn.classList.toggle('is-active', !isOpen);
    saveSearchNote.textContent = '';
  });

  saveSearchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    saveSearchNote.textContent = '';
    const submitBtn = document.getElementById('saveSearchSubmit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';
    try {
      if (!window.SUPABASE_URL || !window.supabase) throw new Error('not configured');
      const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
      const criteria = {
        status: activeStatus,
        type: typeSelect.value,
        beds: bedsSelect.value,
        baths: bathsSelect.value,
        priceMin: priceMinInput.value || null,
        priceMax: priceMaxInput.value || null,
        keyword: keywordInput.value || null
      };
      const { error } = await client.from('leads').insert({
        lead_type: 'saved_search',
        email: saveSearchEmail.value,
        search_criteria: criteria
      });
      if (error) throw error;
      saveSearchForm.style.display = 'none';
      saveSearchBtn.classList.remove('is-active');
      saveSearchNote.textContent = "Saved — we'll follow up when matching homes come in.";
      saveSearchForm.reset();
    } catch (err) {
      saveSearchNote.textContent = 'Something went wrong — please try again.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Notify Me';
    }
  });

  applyFilters();
})();
