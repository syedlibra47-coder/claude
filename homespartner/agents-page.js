(async function () {
  if (window.dataReady) await window.dataReady;

  const grid = document.getElementById('agentsGrid');
  if (!grid || !window.AGENTS_DATA) return;

  const agents = [...window.AGENTS_DATA].sort((a, b) => a.sortOrder - b.sortOrder);

  const searchInput = document.getElementById('agentsSearchInput');
  const languageFilter = document.getElementById('agentsLanguageFilter');
  const specialtyFilter = document.getElementById('agentsSpecialtyFilter');
  const emptyState = document.getElementById('agentsFilterEmpty');

  function populateFilterOptions() {
    const languages = new Set();
    const specialties = new Set();
    agents.forEach(a => {
      (a.languages || []).forEach(l => languages.add(l));
      (a.specialties || []).forEach(s => specialties.add(s));
    });
    [...languages].sort().forEach(l => {
      const opt = document.createElement('option');
      opt.value = l;
      opt.textContent = l;
      languageFilter.appendChild(opt);
    });
    [...specialties].sort().forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      specialtyFilter.appendChild(opt);
    });
  }

  function initials(name) {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  function renderAgents(list) {
    if (!list.length) {
      grid.innerHTML = '';
      emptyState.style.display = '';
      return;
    }
    emptyState.style.display = 'none';
    grid.innerHTML = list.map(a => {
      const avatar = a.photoUrl
        ? `<img src="${a.photoUrl}" alt="${a.name}">`
        : initials(a.name);
      const languagesLine = a.languages && a.languages.length ? `<p class="agent-languages">Speaks: ${a.languages.join(', ')}</p>` : '';
      const specialtiesHtml = a.specialties && a.specialties.length
        ? `<div class="pill-row agent-specialty-pills">${a.specialties.map(s => `<span class="pill">${s}</span>`).join('')}</div>`
        : '';
      const waMessage = `Hi ${a.name}, I'd like to know more about a property.`;
      const waHref = `https://wa.me/${a.phone}?text=${encodeURIComponent(waMessage)}`;
      return `
      <div class="agent-card team-agent-card">
        <a href="agent-detail.html?id=${a.id}" class="agent-avatar${a.photoUrl ? ' agent-avatar--photo' : ''}">${avatar}</a>
        <h3><a href="agent-detail.html?id=${a.id}">${a.name}</a></h3>
        <p class="agent-role">${a.title}</p>
        ${languagesLine}
        ${specialtiesHtml}
        <a href="tel:+${a.phone}" class="agent-contact-row">
          <svg viewBox="0 0 24 24" fill="none"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1v3.5c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
          ${a.phoneDisplay}
        </a>
        <a href="mailto:${a.email}" class="agent-contact-row">
          <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="m3 7 9 6 9-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          ${a.email}
        </a>
        <a class="btn btn-navy agent-whatsapp-btn" href="${waHref}" target="_blank" rel="noopener">Message on WhatsApp</a>
        <a href="agent-detail.html?id=${a.id}" class="card-link agent-view-profile">View Profile &rarr;</a>
      </div>`;
    }).join('');
  }

  function applyFilters() {
    const query = searchInput.value.trim().toLowerCase();
    const language = languageFilter.value;
    const specialty = specialtyFilter.value;
    const filtered = agents.filter(a => {
      if (query && !a.name.toLowerCase().includes(query)) return false;
      if (language !== 'all' && !(a.languages || []).includes(language)) return false;
      if (specialty !== 'all' && !(a.specialties || []).includes(specialty)) return false;
      return true;
    });
    renderAgents(filtered);
  }

  populateFilterOptions();
  renderAgents(agents);

  searchInput.addEventListener('input', applyFilters);
  languageFilter.addEventListener('change', applyFilters);
  specialtyFilter.addEventListener('change', applyFilters);
})();
