// Homepage "Your Advisors" section: one card per agent from AGENTS_DATA
// (Supabase agents table when connected). Shows the agent's photo when one is
// uploaded in the admin panel, otherwise a monogram.
(async function () {
  if (window.dataReady) await window.dataReady;

  const grid = document.getElementById('advisorGrid');
  const section = document.getElementById('advisors');
  if (!grid || !section) return;

  const agents = [...(window.AGENTS_DATA || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  if (!agents.length) { section.style.display = 'none'; return; }

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const initials = name => String(name || '').split(/\s+/).filter(Boolean).map(w => w[0]).slice(-2).join('').toUpperCase();

  grid.innerHTML = agents.map(a => {
    const phone = String(a.phone || '').replace(/[^0-9]/g, '');
    const wa = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(`Hi ${a.name}, I'd like to speak to you about a property.`)}` : '';
    const areas = (a.specialties || []).join(' · ');
    const langs = (a.languages || []).join(', ');
    return `
    <article class="advisor-card reveal in-view">
      <div class="advisor-portrait">
        ${a.photoUrl ? `<img src="${esc(a.photoUrl)}" alt="${esc(a.name)}" loading="lazy">` : `<span class="advisor-monogram" aria-hidden="true">${esc(initials(a.name))}</span>`}
      </div>
      <div class="advisor-body">
        <h3>${esc(a.name)}</h3>
        <p class="advisor-role">${esc(a.title || 'Property Consultant')}</p>
        ${areas ? `<p class="advisor-areas">${esc(areas)}</p>` : ''}
        ${langs ? `<p class="advisor-langs">Speaks ${esc(langs)}</p>` : ''}
        <div class="advisor-links">
          ${wa ? `<a href="${wa}" target="_blank" rel="noopener" class="advisor-link">WhatsApp</a>` : ''}
          ${a.email ? `<a href="mailto:${esc(a.email)}" class="advisor-link">Email</a>` : ''}
          <a href="agent-detail.html?id=${encodeURIComponent(a.id)}" class="advisor-link">Profile &rarr;</a>
        </div>
      </div>
    </article>`;
  }).join('');
})();
