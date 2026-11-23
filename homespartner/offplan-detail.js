(async function () {
  if (window.dataReady) await window.dataReady;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const project = id && window.OFFPLAN_DATA ? window.OFFPLAN_DATA[id] : null;

  if (!project) {
    window.location.href = 'offplan-listings.html';
    return;
  }

  document.getElementById('pageTitle').textContent = `${project.title} — ${project.community} | HomesPartner Real Estate`;
  document.getElementById('offplanDeveloperEyebrow').textContent = `By ${project.developer}`;
  document.getElementById('offplanTitle').textContent = project.title;
  document.getElementById('offplanLocation').textContent = `${project.community}, ${project.city}`;
  document.getElementById('offplanPrice').textContent = `from ${project.priceLabel}`;

  // ----- RealEstateListing structured data (schema.org) -----
  try {
    const projectSchema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      "name": project.title,
      "description": project.description,
      "url": window.location.href,
      "image": project.gallery && project.gallery.length ? project.gallery : [project.hero],
      "about": {
        "@type": "Residence",
        "name": project.title,
        "address": { "@type": "PostalAddress", "addressLocality": project.community, "addressRegion": project.city, "addressCountry": "AE" }
      },
      "offers": {
        "@type": "Offer",
        "price": project.price,
        "priceCurrency": "AED",
        "availability": "https://schema.org/PreOrder",
        "businessFunction": "https://schema.org/Sell",
        "seller": { "@type": "Organization", "name": project.developer }
      }
    };
    const schemaScript = document.createElement('script');
    schemaScript.type = 'application/ld+json';
    schemaScript.textContent = JSON.stringify(projectSchema);
    document.head.appendChild(schemaScript);
  } catch (err) { console.warn('Off-plan schema injection failed', err); }

  document.getElementById('offplanBreadcrumb').innerHTML = `
    <a href="index.html#top">Home</a><span class="sep">/</span>
    <a href="offplan-listings.html">Off-Plan</a><span class="sep">/</span>
    <span class="current">${project.title}</span>`;

  // gallery
  const galleryMain = document.getElementById('offplanGalleryMain');
  galleryMain.src = project.hero;
  galleryMain.alt = project.title;
  document.getElementById('offplanGalleryBadges').innerHTML = `
    <span class="badge ${project.statusBadge}">${project.status}</span>
    <span class="badge badge--red">${project.paymentPlans[0].label} Payment Plan</span>`;
  const thumbs = document.getElementById('offplanGalleryThumbs');
  thumbs.innerHTML = project.gallery.map((src, i) =>
    `<button type="button" class="offplan-gallery-thumb${i === 0 ? ' is-active' : ''}" data-src="${src}"><img src="${src}" alt="${project.title} photo ${i + 1}"></button>`
  ).join('');
  thumbs.querySelectorAll('.offplan-gallery-thumb').forEach(btn => {
    btn.addEventListener('click', () => {
      galleryMain.src = btn.dataset.src;
      thumbs.querySelectorAll('.offplan-gallery-thumb').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
    });
  });

  // fact grid
  const facts = [
    { icon: '<path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>', value: project.developer, label: 'Developer' },
    { icon: '<rect x="3.5" y="5" width="17" height="16" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 3v4M16 3v4M3.5 10h17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>', value: project.handover, label: 'Handover' },
    { icon: '<path d="M3 17l6-6 4 4 8-9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 6h6v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>', value: project.roi, label: 'Est. ROI' },
    { icon: '<rect x="3.5" y="3.5" width="17" height="17" rx="1.5" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 8.5h17" stroke="currentColor" stroke-width="1.8"/>', value: project.paymentPlans[0].label, label: 'Payment Plan' }
  ];
  document.getElementById('offplanFactGrid').innerHTML = facts.map(f => `
    <div class="offplan-fact-item">
      <svg viewBox="0 0 24 24" fill="none">${f.icon}</svg>
      <span class="offplan-fact-value">${f.value}</span>
      <span class="offplan-fact-label">${f.label}</span>
    </div>`).join('');

  document.getElementById('offplanDescription').textContent = project.description;
  document.getElementById('offplanRef').textContent = project.permitNumber || '';
  document.getElementById('offplanRefRow').style.display = project.permitNumber ? '' : 'none';

  document.getElementById('offplanUnitTypes').innerHTML = project.unitTypes.map(u => `
    <tr><td>${u.type}</td><td>${u.size}</td><td>${u.price}</td></tr>`).join('');

  // payment plan tabs
  const planTabs = document.getElementById('offplanPlanTabs');
  const planTimeline = document.getElementById('offplanPlanTimeline');
  const planLegend = document.getElementById('offplanPlanLegend');
  const planNote = document.getElementById('offplanPlanNote');

  function renderPlan(index) {
    const plan = project.paymentPlans[index];
    planTimeline.innerHTML = plan.segments.map(s => `<div class="payment-plan-segment" style="flex:${s.pct}">${s.pct}%</div>`).join('');
    planLegend.innerHTML = plan.segments.map(s => `
      <div class="payment-plan-legend-item"><span class="payment-plan-legend-dot"></span>${s.name} — ${s.pct}%</div>`).join('');
    planNote.textContent = plan.note;
  }

  if (project.paymentPlans.length > 1) {
    planTabs.innerHTML = project.paymentPlans.map((plan, i) =>
      `<button type="button" class="payment-plan-tab${i === 0 ? ' active' : ''}" data-index="${i}">${plan.label}</button>`).join('');
    planTabs.querySelectorAll('.payment-plan-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        planTabs.querySelectorAll('.payment-plan-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderPlan(Number(btn.dataset.index));
      });
    });
  }
  renderPlan(0);

  document.getElementById('offplanAmenities').innerHTML = project.amenities.map(a => `<li>${a}</li>`).join('');

  document.getElementById('offplanLocationHighlights').innerHTML = project.locationHighlights.map(l => `
    <div class="location-highlight-row"><span>${l.label}</span><span>${l.time}</span></div>`).join('');

  document.getElementById('offplanDeveloperName').textContent = project.developer;
  document.getElementById('offplanDeveloperBlurb').textContent = project.developerBlurb;

  const enquiryForm = document.getElementById('offplanEnquiryForm');
  const enquiryNote = document.getElementById('offplanEnquiryNote');
  enquiryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    enquiryNote.textContent = `Thanks — a HomesPartner advisor will contact you about ${project.title} shortly.`;
    enquiryForm.reset();
  });

  // similar projects: same developer or same category, excluding current
  const all = Object.values(window.OFFPLAN_DATA);
  const similar = all
    .filter(p => p.id !== project.id)
    .sort((a, b) => {
      const aScore = (a.developer === project.developer ? 2 : 0) + (a.category === project.category ? 1 : 0);
      const bScore = (b.developer === project.developer ? 2 : 0) + (b.category === project.category ? 1 : 0);
      return bScore - aScore;
    })
    .slice(0, 4);

  document.getElementById('similarOffplanGrid').innerHTML = similar.map(p => `
    <article class="offplan-card reveal in-view" onclick="window.location.href='offplan-detail.html?id=${p.id}'">
      <div class="offplan-card-image">
        <img src="${p.hero}" alt="${p.title}, ${p.community}">
        <div class="offplan-gallery-badges">
          <span class="badge badge--red">${p.paymentPlans[0].label} Payment Plan</span>
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
    </article>`).join('');
})();
