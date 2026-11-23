(async function () {
  if (window.dataReady) await window.dataReady;

  const grid = document.getElementById('serviceGridHome');
  if (!grid || !window.SERVICES_DATA) return;

  const services = [...window.SERVICES_DATA].sort((a, b) => a.sortOrder - b.sortOrder);

  grid.innerHTML = services.map(s => {
    const iconSvg = (window.ICON_LIBRARY && window.ICON_LIBRARY[s.icon]) || (window.ICON_LIBRARY && window.ICON_LIBRARY.home) || '';
    const href = s.id === 'offplan-projects' ? 'offplan-listings.html' : `services.html#${s.id}`;
    return `
    <div class="service-card reveal in-view" data-href="${href}">
      <div class="service-icon">
        <svg viewBox="0 0 24 24" fill="none">${iconSvg}</svg>
      </div>
      <h3>${s.title}</h3>
      <p>${s.cardSummary}</p>
      <a href="${href}" class="card-link">${s.ctaLabel} &rarr;</a>
    </div>`;
  }).join('');

  grid.querySelectorAll('.service-card[data-href]').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
      if (e.target.closest('a, button, input, select, textarea')) return;
      window.location.href = card.dataset.href;
    });
  });
})();
