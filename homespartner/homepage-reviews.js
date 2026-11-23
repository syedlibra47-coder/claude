(async function () {
  if (window.dataReady) await window.dataReady;

  const section = document.getElementById('reviews');
  const summaryEl = document.getElementById('reviewsSummary');
  const gridEl = document.getElementById('reviewsGrid');
  if (!section || !summaryEl || !gridEl) return;

  const all = window.TESTIMONIALS_DATA || [];
  if (!all.length) { section.style.display = 'none'; return; }

  function starString(rating) {
    const r = Math.max(0, Math.min(5, Math.round(rating)));
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  const avg = all.reduce((sum, t) => sum + (t.rating || 0), 0) / all.length;
  summaryEl.innerHTML = `
    <span class="reviews-summary-score">${avg.toFixed(1)}</span>
    <span class="reviews-summary-stars">${starString(avg)}</span>
    <span class="reviews-summary-count">${all.length} review${all.length === 1 ? '' : 's'}</span>
  `;

  const featured = all.filter(t => t.featured);
  const shown = (featured.length ? featured : all).slice(0, 3);

  gridEl.innerHTML = shown.map(t => `
    <div class="review-card reveal">
      <div class="review-card-stars">${starString(t.rating)}</div>
      <p class="review-card-text">"${esc(t.reviewText)}"</p>
      <div class="review-card-author">${esc(t.authorName)}</div>
      ${t.authorContext ? `<div class="review-card-context">${esc(t.authorContext)}</div>` : ''}
      ${t.source ? `<div class="review-card-source">via ${esc(t.source)}</div>` : ''}
    </div>`).join('');
})();
