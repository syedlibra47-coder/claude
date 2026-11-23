(async function () {
  if (window.dataReady) await window.dataReady;

  const WHATSAPP_NUMBER = (window.CONTACT_CONTENT_DATA && window.CONTACT_CONTENT_DATA.whatsappNumber) || '971500000000';

  // ===== Featured listings =====
  const listingGrid = document.getElementById('listingGrid');
  if (listingGrid && window.LISTINGS_DATA) {
    const all = Object.values(window.LISTINGS_DATA);
    const featured = all.filter(l => l.featured);
    const chosen = (featured.length ? featured : all).slice(0, 6);

    function listingCardHtml(l) {
      const waMessage = `Hi, I'm interested in ${l.title} (${l.community}, ${l.city}). Could you share more details?`;
      const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessage)}`;
      return `
      <article class="listing-card reveal in-view" data-type="${l.type}" data-listing-id="${l.id}">
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

    function renderListings(filter) {
      const list = filter === 'all' ? chosen : chosen.filter(l => l.type === filter);
      listingGrid.innerHTML = list.map(listingCardHtml).join('');
      listingGrid.querySelectorAll('.listing-card[data-listing-id]').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
          if (e.target.closest('a, button, input, select, textarea')) return;
          window.location.href = `listing-detail.html?id=${card.dataset.listingId}`;
        });
      });
    }

    renderListings('all');

    const filterBar = document.getElementById('listingFilters');
    if (filterBar) {
      filterBar.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          renderListings(btn.dataset.filter);
        });
      });
    }
  }

  // ===== Featured off-plan projects =====
  const offplanGrid = document.getElementById('offplanGrid');
  if (offplanGrid && window.OFFPLAN_DATA) {
    const all = Object.values(window.OFFPLAN_DATA);
    const featured = all.filter(p => p.featured);
    const chosen = (featured.length ? featured : all).slice(0, 4);

    function offplanCardHtml(p) {
      const plan = p.paymentPlans[0];
      const bookingPct = plan.segments[0].pct;
      const handoverPct = 100 - bookingPct;
      return `
      <article class="offplan-project reveal in-view" data-offplan-id="${p.id}">
        <div class="offplan-image">
          <img src="${p.hero}" alt="${p.title}, ${p.community}">
          <div class="badge-stack">
            <span class="badge badge--red">${plan.label} Payment Plan</span>
            <span class="badge ${p.statusBadge}">${p.status}</span>
          </div>
          <div class="dots"><span class="dot active"></span><span class="dot"></span><span class="dot"></span></div>
        </div>
        <div class="offplan-project-body">
          <div class="pill-row"><span class="pill pill--dark">${p.tags[0] || p.category}</span><span class="pill pill--dark">${p.tags[1] || p.category}</span></div>
          <h3>${p.title}</h3>
          <p class="listing-location">${p.community} &middot; Handover ${p.handover}</p>
          <div class="payment-plan">
            <div class="payment-plan-bar"><span style="width:${bookingPct}%"></span></div>
            <div class="payment-plan-labels"><span>${bookingPct}% booking</span><span>${handoverPct}% handover</span></div>
          </div>
          <div class="offplan-project-footer">
            <div class="offplan-price">from ${p.priceLabel}</div>
            <a href="offplan-detail.html?id=${p.id}" class="card-link">Discover More &rarr;</a>
          </div>
        </div>
      </article>`;
    }

    offplanGrid.innerHTML = chosen.map(offplanCardHtml).join('');
    offplanGrid.querySelectorAll('.offplan-project[data-offplan-id]').forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        if (e.target.closest('a, button, input, select, textarea')) return;
        window.location.href = `offplan-detail.html?id=${card.dataset.offplanId}`;
      });
    });
  }
})();
