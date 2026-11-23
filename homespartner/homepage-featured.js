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
      // Full-image card: the photo fills the card, a dark gradient rises from the
      // bottom, and only the essentials sit on it (status, price, name, area, size).
      const beds = l.beds === 'Studio' ? 'Studio' : `${l.beds} Beds`;
      return `
      <article class="listing-card listing-card--photo reveal in-view" data-type="${l.type}" data-listing-id="${l.id}">
        <img class="lc-photo" src="${l.hero}" alt="${l.title}, ${l.community}" loading="lazy">
        <div class="lc-shade" aria-hidden="true"></div>
        <div class="lc-top">
          <span class="lc-status lc-status--${l.type === 'sale' ? 'sale' : 'rent'}">${l.type === 'sale' ? 'For Sale' : 'For Rent'}</span>
          <a class="lc-wa" href="${waHref}" target="_blank" rel="noopener" aria-label="Enquire about ${l.title} on WhatsApp">
            <img src="assets/WhatsApp.svg.webp" alt="">
          </a>
        </div>
        <div class="lc-info">
          <div class="lc-price">${l.priceLabel}${l.priceSuffix ? `<span>${l.priceSuffix}</span>` : ''}</div>
          <h3 class="lc-title"><a href="listing-detail.html?id=${l.id}">${l.title}</a></h3>
          <p class="lc-location">${l.community}</p>
          <p class="lc-meta"><span>${beds}</span><span>${l.baths} Baths</span><span>${l.sqft} sqft</span></p>
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
      // Full-photo card, same family as the listing cards: status and plan on top,
      // developer, name, area, handover and price over a rising dark gradient.
      return `
      <article class="offplan-project offplan-project--photo reveal in-view" data-offplan-id="${p.id}">
        <img class="lc-photo" src="${p.hero}" alt="${p.title}, ${p.community}" loading="lazy">
        <div class="lc-shade" aria-hidden="true"></div>
        <div class="lc-top">
          <span class="lc-status">${p.status}</span>
          <span class="lc-status lc-status--sale">${plan.label} Plan</span>
        </div>
        <div class="lc-info">
          <p class="op-dev">${p.developer || ''}</p>
          <h3 class="lc-title"><a href="offplan-detail.html?id=${p.id}">${p.title}</a></h3>
          <p class="lc-location">${p.community}</p>
          <div class="payment-plan">
            <div class="payment-plan-bar"><span style="width:${bookingPct}%"></span></div>
            <div class="payment-plan-labels"><span>${bookingPct}% booking</span><span>${handoverPct}% handover</span></div>
          </div>
          <p class="lc-meta"><span>From ${p.priceLabel}</span><span>Handover ${p.handover}</span></p>
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
