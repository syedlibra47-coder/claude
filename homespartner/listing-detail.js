(async function () {
  if (window.dataReady) await window.dataReady;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const listing = id && window.LISTINGS_DATA ? window.LISTINGS_DATA[id] : null;

  if (!listing) {
    window.location.href = 'listings.html';
    return;
  }

  const WHATSAPP_NUMBER = (window.CONTACT_CONTENT_DATA && window.CONTACT_CONTENT_DATA.whatsappNumber) || '971500000000';
  const whatsappMessage = `Hi, I'm interested in ${listing.title} (${listing.community}, ${listing.city}). Could you share more details?`;
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

  // ----- Title / meta -----
  document.getElementById('pageTitle').textContent = `${listing.title} — ${listing.community} | HomesPartner Real Estate`;
  document.getElementById('detailTitle').textContent = listing.title;
  document.getElementById('detailLocation').textContent = `${listing.community}, ${listing.city}`;
  document.getElementById('detailRef').textContent = listing.permitNumber || '';
  document.getElementById('detailRefRow').style.display = listing.permitNumber ? '' : 'none';

  const priceEl = document.getElementById('detailPrice');
  priceEl.innerHTML = listing.priceLabel + (listing.priceSuffix ? ` <span>${listing.priceSuffix}</span>` : '');

  // ----- RealEstateListing structured data (schema.org) -----
  try {
    const address = { "@type": "PostalAddress", "addressLocality": listing.community, "addressRegion": listing.city, "addressCountry": "AE" };
    const about = {
      "@type": "Residence",
      "name": listing.title,
      "address": address,
      "numberOfRooms": listing.beds === 'Studio' ? 0 : Number(listing.beds) || undefined,
      "numberOfBathroomsTotal": Number(listing.baths) || undefined,
      "floorSize": { "@type": "QuantitativeValue", "value": Number(String(listing.sqft).replace(/,/g, '')) || undefined, "unitCode": "FTK" }
    };
    if (listing.latitude != null && listing.longitude != null) {
      about.geo = { "@type": "GeoCoordinates", "latitude": listing.latitude, "longitude": listing.longitude };
    }
    const listingSchema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      "name": listing.title,
      "description": listing.description,
      "url": window.location.href,
      "image": listing.gallery && listing.gallery.length ? listing.gallery : [listing.hero],
      "about": about,
      "offers": {
        "@type": "Offer",
        "price": listing.price,
        "priceCurrency": "AED",
        "availability": "https://schema.org/InStock",
        "businessFunction": listing.type === 'sale' ? "https://schema.org/Sell" : "https://schema.org/LeaseOut"
      }
    };
    const schemaScript = document.createElement('script');
    schemaScript.type = 'application/ld+json';
    schemaScript.textContent = JSON.stringify(listingSchema);
    document.head.appendChild(schemaScript);
  } catch (err) { console.warn('Listing schema injection failed', err); }

  // ----- Breadcrumb -----
  const breadcrumb = document.getElementById('breadcrumb');
  breadcrumb.innerHTML = `
    <a href="index.html#top">Home</a><span class="sep">/</span>
    <a href="listings.html">Listings</a><span class="sep">/</span>
    <a href="listings.html">${listing.community}</a><span class="sep">/</span>
    <span class="current">${listing.title}</span>`;

  // ----- Tags -----
  document.getElementById('detailTags').innerHTML = listing.tags.map(t => `<span class="pill">${t}</span>`).join('');

  // ----- Gallery -----
  const galleryMain = document.getElementById('galleryMain');
  const galleryBadge = document.getElementById('galleryBadge');
  const galleryThumbs = document.getElementById('galleryThumbs');
  galleryMain.src = listing.hero;
  galleryMain.alt = listing.title;
  galleryBadge.textContent = listing.type === 'sale' ? 'For Sale' : 'For Rent';
  galleryBadge.className = 'badge listing-tag ' + (listing.type === 'sale' ? 'badge--gold' : 'badge--navy');

  galleryThumbs.innerHTML = listing.gallery.map((src, i) =>
    `<button type="button" class="gallery-thumb${i === 0 ? ' is-active' : ''}" data-src="${src}"><img src="${src}" alt="${listing.title} photo ${i + 1}"></button>`
  ).join('');
  galleryThumbs.querySelectorAll('.gallery-thumb').forEach(btn => {
    btn.addEventListener('click', () => {
      galleryMain.src = btn.dataset.src;
      galleryThumbs.querySelectorAll('.gallery-thumb').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
    });
  });

  // ----- Call / WhatsApp actions -----
  document.getElementById('detailCallBtn').href = `tel:+${listing.agent.phone}`;
  const detailWhatsapp = document.getElementById('detailWhatsapp');
  detailWhatsapp.href = whatsappUrl;

  // ----- Spec grid -----
  const specs = [
    { icon: '<path d="M4 11 12 4l8 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10v9h12v-9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>', value: listing.category, label: 'Property Type' },
    { icon: '<path d="M3 19v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M3 19h18M6 11V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>', value: listing.beds, label: 'Bedrooms' },
    { icon: '<path d="M4 12h16M6 12V6a2 2 0 0 1 2-2h1M6 12v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>', value: listing.baths, label: 'Bathrooms' },
    { icon: '<rect x="3.5" y="3.5" width="17" height="17" rx="1.5" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 8.5h17M8.5 3.5v17" stroke="currentColor" stroke-width="1.8"/>', value: listing.sqft + ' sqft', label: 'Area Size' }
  ];
  document.getElementById('specGrid').innerHTML = specs.map(s => `
    <div class="spec-item">
      <svg viewBox="0 0 24 24" fill="none">${s.icon}</svg>
      <span class="spec-value">${s.value}</span>
      <span class="spec-label">${s.label}</span>
    </div>`).join('');

  // ----- Description / amenities -----
  document.getElementById('detailDescription').textContent = listing.description;
  document.getElementById('amenitiesList').innerHTML = listing.amenities.map(a => `<li>${a}</li>`).join('');

  // ----- Agent card -----
  const initials = listing.agent.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  document.getElementById('agentAvatar').textContent = initials;
  document.getElementById('agentName').textContent = listing.agent.name;
  const agentPhoneRow = document.getElementById('agentPhoneRow');
  agentPhoneRow.href = `tel:+${listing.agent.phone}`;
  document.getElementById('agentPhoneText').textContent = listing.agent.phoneDisplay;
  const agentEmailRow = document.getElementById('agentEmailRow');
  agentEmailRow.href = `mailto:${listing.agent.email}`;
  document.getElementById('agentEmailText').textContent = listing.agent.email;
  const agentWhatsappBtn = document.getElementById('agentWhatsappBtn');
  agentWhatsappBtn.href = whatsappUrl;

  // ----- Enquiry form -----
  const enquiryForm = document.getElementById('enquiryForm');
  const enquiryNote = document.getElementById('enquiryNote');
  const enquirySubmitBtn = document.getElementById('enquirySubmitBtn');
  enquiryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    enquiryNote.textContent = '';
    enquirySubmitBtn.disabled = true;
    enquirySubmitBtn.textContent = 'Sending…';
    try {
      if (!window.SUPABASE_URL || !window.supabase) throw new Error('not configured');
      const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
      const { error } = await client.from('leads').insert({
        lead_type: 'enquiry',
        name: document.getElementById('enq_name').value,
        phone: document.getElementById('enq_phone').value,
        email: document.getElementById('enq_email').value,
        message: document.getElementById('enq_message').value,
        listing_id: listing.id,
        listing_title: listing.title
      });
      if (error) throw error;
      enquiryNote.textContent = `Thanks — ${listing.agent.name} will reach out shortly.`;
      enquiryForm.reset();
    } catch (err) {
      enquiryNote.textContent = 'Something went wrong sending your enquiry — please WhatsApp or call us directly instead.';
    } finally {
      enquirySubmitBtn.disabled = false;
      enquirySubmitBtn.textContent = 'Send Enquiry';
    }
  });

  // ----- Affordability calculator -----
  if (listing.type === 'sale') {
    const downPct = document.getElementById('calcDownPct');
    const rate = document.getElementById('calcRate');
    const term = document.getElementById('calcTerm');
    const downPctLabel = document.getElementById('calcDownPctLabel');
    const rateLabel = document.getElementById('calcRateLabel');
    const termLabel = document.getElementById('calcTermLabel');
    const monthlyOut = document.getElementById('calcMonthly');
    const downAmountOut = document.getElementById('calcDownAmount');
    const loanAmountOut = document.getElementById('calcLoanAmount');

    const fmt = (n) => 'AED ' + Math.round(n).toLocaleString();

    const recalc = () => {
      const dp = parseFloat(downPct.value);
      const r = parseFloat(rate.value);
      const yrs = parseFloat(term.value);
      downPctLabel.textContent = dp + '%';
      rateLabel.textContent = r.toFixed(2) + '%';
      termLabel.textContent = yrs + ' yrs';

      const downAmount = listing.price * (dp / 100);
      const loanAmount = listing.price - downAmount;
      const monthlyRate = (r / 100) / 12;
      const numPayments = yrs * 12;
      const monthly = monthlyRate === 0
        ? loanAmount / numPayments
        : loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);

      monthlyOut.textContent = fmt(monthly);
      downAmountOut.textContent = fmt(downAmount);
      loanAmountOut.textContent = fmt(loanAmount);
    };

    [downPct, rate, term].forEach(el => el.addEventListener('input', recalc));
    recalc();
  } else {
    document.getElementById('calculatorBlock').remove();
  }

  // ----- Similar properties -----
  const allListings = Object.values(window.LISTINGS_DATA);
  const similar = allListings
    .filter(l => l.id !== listing.id)
    .sort((a, b) => {
      const aScore = (a.community === listing.community ? 2 : 0) + (a.category === listing.category ? 1 : 0);
      const bScore = (b.community === listing.community ? 2 : 0) + (b.category === listing.category ? 1 : 0);
      return bScore - aScore;
    })
    .slice(0, 3);

  document.getElementById('similarGrid').innerHTML = similar.map(l => `
    <article class="listing-card" onclick="window.location.href='listing-detail.html?id=${l.id}'" style="cursor:pointer;">
      <div class="listing-image">
        <img src="${l.hero}" alt="${l.title}, ${l.community}">
        <span class="badge ${l.type === 'sale' ? 'badge--gold' : 'badge--navy'} listing-tag">${l.type === 'sale' ? 'For Sale' : 'For Rent'}</span>
        <div class="dots"><span class="dot active"></span><span class="dot"></span><span class="dot"></span></div>
      </div>
      <div class="listing-body">
        <div class="pill-row"><span class="pill">${l.tags[0]}</span><span class="pill">${l.tags[1] || l.tags[0]}</span></div>
        <div class="listing-price">${l.priceLabel}${l.priceSuffix ? ` <span>${l.priceSuffix}</span>` : ''}</div>
        <h3>${l.title}</h3>
        <p class="listing-location">${l.community}, ${l.city}</p>
        <div class="listing-meta"><span><svg viewBox="0 0 24 24" fill="none"><path d="M3 19v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M3 19h18M6 11V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>${l.beds === 'Studio' ? 'Studio' : l.beds + ' Beds'}</span><span><svg viewBox="0 0 24 24" fill="none"><path d="M4 12h16M6 12V6a2 2 0 0 1 2-2h1M6 12v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>${l.baths} Baths</span><span><svg viewBox="0 0 24 24" fill="none"><rect x="3.5" y="3.5" width="17" height="17" rx="1.5" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 8.5h17M8.5 3.5v17" stroke="currentColor" stroke-width="1.8"/></svg>${l.sqft} sqft</span></div>
        <div class="listing-footer">
          <a href="listing-detail.html?id=${l.id}" class="card-link">View Details &rarr;</a>
        </div>
      </div>
    </article>`).join('');
})();
