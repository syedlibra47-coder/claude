(async function () {
  if (window.dataReady) await window.dataReady;

  const grid = document.getElementById('offplanListingsGrid');
  if (!grid || !window.OFFPLAN_DATA) return;

  const projects = Object.values(window.OFFPLAN_DATA);

  const statusBtns = document.querySelectorAll('#offplanStatusFilter .filter-btn');
  const typeSelect = document.getElementById('offplanTypeFilter');
  const developerSelect = document.getElementById('offplanDeveloperFilter');
  const planSelect = document.getElementById('offplanPlanFilter');
  const keywordInput = document.getElementById('offplanKeywordFilter');
  const resultsCount = document.getElementById('offplanResultsCount');
  const emptyState = document.getElementById('offplanEmptyState');
  const resetBtn = document.getElementById('offplanFilterReset');
  let activeStatus = 'all';

  // ----- Apply filters handed off from the homepage search (?category=&q=) -----
  function normalizeWord(s) { return s.trim().toLowerCase().replace(/s$/, ''); }
  function matchSelectOption(select, rawValue) {
    if (!rawValue) return null;
    const target = normalizeWord(rawValue);
    const opt = [...select.options].find(o => normalizeWord(o.value) === target || normalizeWord(o.textContent) === target);
    return opt ? opt.value : null;
  }
  const urlParams = new URLSearchParams(window.location.search);
  const pCategory = urlParams.get('category');
  const pKeyword = urlParams.get('q');

  // populate developer filter dynamically
  const developers = [...new Set(projects.map(p => p.developer))].sort();
  developers.forEach(dev => {
    const opt = document.createElement('option');
    opt.value = dev;
    opt.textContent = dev;
    developerSelect.appendChild(opt);
  });

  if (pCategory) {
    const matched = matchSelectOption(typeSelect, pCategory);
    if (matched) typeSelect.value = matched;
  }
  if (pKeyword) keywordInput.value = pKeyword;

  function cardHtml(p) {
    const planLabel = p.paymentPlans[0].label;
    return `
    <article class="offplan-card reveal in-view" data-status="${p.status}" data-category="${p.category}" data-developer="${p.developer}" data-plan="${p.paymentPlans[0].segments[0].pct}" data-search="${(p.title + ' ' + p.community + ' ' + p.developer).toLowerCase()}" onclick="window.location.href='offplan-detail.html?id=${p.id}'">
      <div class="offplan-card-image">
        <img src="${p.hero}" alt="${p.title}, ${p.community}">
        <div class="offplan-gallery-badges">
          <span class="badge badge--red">${planLabel} Payment Plan</span>
          <span class="badge badge--white">${p.tags.join(', ').toUpperCase()}</span>
        </div>
      </div>
      <div class="offplan-card-body">
        <div class="offplan-card-price">from ${p.priceLabel}</div>
        <h3>${p.title}</h3>
        <p class="offplan-card-location">
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="9.5" r="2.4" stroke="currentColor" stroke-width="1.6"/></svg>
          ${p.community}
        </p>
        <div class="offplan-card-facts">
          <div><span>Developer</span><span>${p.developer}</span></div>
          <div><span>Handover</span><span>${p.handover}</span></div>
        </div>
        <a href="offplan-detail.html?id=${p.id}" class="offplan-card-cta" onclick="event.stopPropagation()">Discover More</a>
      </div>
    </article>`;
  }

  function render() {
    const type = typeSelect.value;
    const developer = developerSelect.value;
    const plan = planSelect.value;
    const keyword = keywordInput.value.trim().toLowerCase();

    const filtered = projects.filter(p => {
      const matchesStatus = activeStatus === 'all' || p.status === activeStatus;
      const matchesType = type === 'all' || p.category === type;
      const matchesDeveloper = developer === 'all' || p.developer === developer;
      const matchesPlan = plan === 'all' || String(p.paymentPlans[0].segments[0].pct) === plan;
      const matchesKeyword = !keyword || (p.title + ' ' + p.community + ' ' + p.developer).toLowerCase().includes(keyword);
      return matchesStatus && matchesType && matchesDeveloper && matchesPlan && matchesKeyword;
    });

    grid.innerHTML = filtered.map(cardHtml).join('');
    resultsCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'project' : 'projects'}`;
    emptyState.classList.toggle('is-visible', filtered.length === 0);
  }

  statusBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      statusBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeStatus = btn.dataset.filter;
      render();
    });
  });
  typeSelect.addEventListener('change', render);
  developerSelect.addEventListener('change', render);
  planSelect.addEventListener('change', render);
  keywordInput.addEventListener('input', render);

  function resetAll() {
    statusBtns.forEach(b => b.classList.remove('active'));
    statusBtns[0].classList.add('active');
    activeStatus = 'all';
    typeSelect.value = 'all';
    developerSelect.value = 'all';
    planSelect.value = 'all';
    keywordInput.value = '';
    render();
  }
  resetBtn.addEventListener('click', resetAll);
  document.querySelectorAll('[data-mirror-reset]').forEach(btn => btn.addEventListener('click', resetAll));

  render();
})();
