(async function () {
  if (window.dataReady) await window.dataReady;

  const jumpNav = document.getElementById('serviceJumpInner');
  const container = document.getElementById('serviceSectionsContainer');
  if (!jumpNav || !container || !window.SERVICES_DATA) return;

  const services = [...window.SERVICES_DATA].sort((a, b) => a.sortOrder - b.sortOrder);

  jumpNav.innerHTML = services.map(s => `<a href="#${s.id}">${s.title}</a>`).join('');

  container.innerHTML = services.map((s, i) => {
    const iconSvg = (window.ICON_LIBRARY && window.ICON_LIBRARY[s.icon]) || (window.ICON_LIBRARY && window.ICON_LIBRARY.home) || '';
    return `
    <section class="service-detail${i % 2 === 1 ? ' service-detail--alt' : ''}" id="${s.id}">
      <div class="container service-detail-inner">
        <div class="service-detail-icon">
          <svg viewBox="0 0 24 24" fill="none">${iconSvg}</svg>
        </div>
        <div class="service-detail-body">
          <p class="eyebrow eyebrow--dark">${s.title}</p>
          <h2 class="display">${s.pageHeading}</h2>
          <p>${s.pageDescription}</p>
          <ul class="service-checklist">
            ${s.checklist.map(item => `<li>${item}</li>`).join('')}
          </ul>
          <a href="${s.ctaHref}" class="btn btn-navy">${s.ctaLabel} &rarr;</a>
        </div>
      </div>
    </section>`;
  }).join('');

  // ----- Valuation request form -----
  const valuationForm = document.getElementById('valuationForm');
  if (valuationForm) {
    const valuationNote = document.getElementById('valuationNote');
    const valuationSubmitBtn = document.getElementById('valuationSubmitBtn');
    valuationForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      valuationNote.textContent = '';
      valuationSubmitBtn.disabled = true;
      valuationSubmitBtn.textContent = 'Sending…';
      try {
        if (!window.SUPABASE_URL || !window.supabase) throw new Error('not configured');
        const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
        const { error } = await client.from('leads').insert({
          lead_type: 'valuation',
          name: document.getElementById('val_name').value,
          phone: document.getElementById('val_phone').value,
          email: document.getElementById('val_email').value,
          address: document.getElementById('val_address').value,
          property_type: document.getElementById('val_propertyType').value,
          bedrooms: document.getElementById('val_bedrooms').value,
          size_sqft: document.getElementById('val_sizeSqft').value
        });
        if (error) throw error;
        valuationNote.textContent = 'Thanks — a HomesPartner advisor will be in touch with your valuation shortly.';
        valuationForm.reset();
      } catch (err) {
        valuationNote.textContent = 'Something went wrong — please contact us directly instead.';
      } finally {
        valuationSubmitBtn.disabled = false;
        valuationSubmitBtn.textContent = 'Get My Free Valuation';
      }
    });
  }
})();
