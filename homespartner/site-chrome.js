(async function () {
  if (window.dataReady) await window.dataReady;

  const c = window.SITE_CHROME_DATA;
  if (!c) return;

  const currentPage = (location.pathname.split('/').pop() || 'index.html');
  const isHome = currentPage === 'index.html' || currentPage === '';

  // On the homepage itself, "index.html#anchor" links should become same-page
  // anchors ("#anchor") so they smooth-scroll instead of reloading the page.
  const resolveHref = (href) => {
    if (isHome && href.indexOf('index.html') === 0) {
      return href.slice('index.html'.length) || '#top';
    }
    return href;
  };

  const isActive = (href) => href.indexOf('#') === -1 && href === currentPage;

  // ----- Header brand logo link -----
  const brandLink = document.getElementById('brandLink');
  if (brandLink) brandLink.href = resolveHref('index.html#top');

  // ----- Main nav -----
  const mainNav = document.getElementById('mainNav');
  if (mainNav) {
    const primaryLinks = (c.navLinks || []).map(l =>
      `<a href="${resolveHref(l.href)}"${isActive(l.href) ? ' class="is-active"' : ''}>${l.label}</a>`
    ).join('');

    const submenuLinks = (c.whyusSubmenu || []).map(l =>
      `<a href="${resolveHref(l.href)}"${isActive(l.href) ? ' class="is-active"' : ''}>${l.label}</a>`
    ).join('');

    const whyUs = `
      <div class="nav-dropdown">
        <a href="${resolveHref(c.whyusHref)}">${c.whyusLabel}</a>
        <div class="nav-dropdown-menu">${submenuLinks}</div>
      </div>`;

    const contactLink = `<a href="${resolveHref(c.contactHref)}"${isActive(c.contactHref) ? ' class="is-active"' : ''}>${c.contactLabel}</a>`;

    mainNav.innerHTML = primaryLinks + whyUs + contactLink;
  }

  // ----- Header CTA button -----
  const ctaBtn = document.getElementById('headerCtaBtn');
  if (ctaBtn) {
    ctaBtn.href = resolveHref(c.ctaHref);
    ctaBtn.textContent = c.ctaText;
  }

  // ----- Footer brand -----
  const footerBlurb = document.getElementById('footerBlurb');
  if (footerBlurb) footerBlurb.textContent = c.footerBlurb;

  const footerEmail = document.getElementById('footerEmail');
  if (footerEmail) {
    footerEmail.textContent = c.footerEmail;
    footerEmail.href = 'mailto:' + c.footerEmail;
  }

  // ----- Footer columns -----
  const footerColumns = document.getElementById('footerColumns');
  if (footerColumns && c.footerColumns) {
    footerColumns.innerHTML = c.footerColumns.map(col => `
      <div class="footer-col">
        <h5>${col.heading}</h5>
        ${(col.links || []).map(l => `<a href="${resolveHref(l.href)}">${l.label}</a>`).join('')}
      </div>`).join('');
  }

  // ----- Footer copyright -----
  const footerCopyright = document.getElementById('footerCopyright');
  if (footerCopyright) footerCopyright.textContent = c.footerCopyright;

  // ----- Footer legal/compliance line (RERA broker no. / trade license / registered office) -----
  const footerCompliance = document.getElementById('footerCompliance');
  if (footerCompliance) {
    const parts = [];
    if (c.reraBrokerNumber) parts.push(`RERA Broker No. ${c.reraBrokerNumber}`);
    if (c.tradeLicenseNumber) parts.push(`Trade License No. ${c.tradeLicenseNumber}`);
    if (c.registeredOfficeAddress) parts.push(c.registeredOfficeAddress);
    footerCompliance.textContent = parts.join(' · ');
    footerCompliance.style.display = parts.length ? '' : 'none';
  }

  // ----- Footer legal links (Privacy / Terms / Cookies / Complaints) -----
  const footerLegalLinks = document.getElementById('footerLegalLinks');
  if (footerLegalLinks) {
    const legalLinks = [
      { slug: 'privacy-policy', label: 'Privacy Policy' },
      { slug: 'terms-and-conditions', label: 'Terms & Conditions' },
      { slug: 'cookie-policy', label: 'Cookie Policy' },
      { slug: 'complaints-procedure', label: 'Complaints Procedure' }
    ];
    footerLegalLinks.innerHTML = legalLinks
      .map(l => `<a href="${resolveHref('custom-page.html?slug=' + l.slug)}">${l.label}</a>`)
      .join('<span aria-hidden="true"> · </span>');
  }

  // ----- Global floating WhatsApp click-to-chat, every page -----
  try {
    const contact = window.CONTACT_CONTENT_DATA || {};
    const waNumber = (contact.whatsappNumber || '').replace(/[^0-9]/g, '');
    if (waNumber && !document.getElementById('globalWhatsappFloat')) {
      const wa = document.createElement('a');
      wa.id = 'globalWhatsappFloat';
      wa.className = 'whatsapp-float';
      wa.href = `https://wa.me/${waNumber}?text=${encodeURIComponent('Hi, I have a question about a property.')}`;
      wa.target = '_blank';
      wa.rel = 'noopener';
      wa.setAttribute('aria-label', 'Chat with us on WhatsApp');
      wa.innerHTML = '<img src="assets/WhatsApp.svg.webp" alt="">';
      document.body.appendChild(wa);
    }
  } catch (err) { console.warn('WhatsApp float injection failed', err); }

  // ----- Cookie consent banner, every page -----
  try {
    if (!localStorage.getItem('hp_cookie_consent') && !document.getElementById('cookieConsentBanner')) {
      const banner = document.createElement('div');
      banner.id = 'cookieConsentBanner';
      banner.className = 'cookie-consent';
      banner.innerHTML = `
        <p>We use cookies to improve your experience and analyse site traffic. By continuing to browse, you agree to our
        <a href="${resolveHref('custom-page.html?slug=cookie-policy')}">Cookie Policy</a>.</p>
        <button type="button" class="btn btn-gold btn-sm" id="cookieConsentAccept">Accept</button>`;
      document.body.appendChild(banner);
      document.getElementById('cookieConsentAccept').addEventListener('click', () => {
        localStorage.setItem('hp_cookie_consent', '1');
        banner.remove();
      });
    }
  } catch (err) { console.warn('Cookie consent banner injection failed', err); }

  // ----- Organization / RealEstateAgent structured data (schema.org), every page -----
  // Helps Google understand HomesPartner as a business entity for rich results —
  // separate from the per-listing RealEstateListing schema on detail pages.
  try {
    const hub = (window.OFFICES_DATA || []).find(o => o.isHub) || (window.OFFICES_DATA || [])[0];
    const contact = window.CONTACT_CONTENT_DATA || {};
    const org = {
      "@context": "https://schema.org",
      "@type": "RealEstateAgent",
      "name": "HomesPartner Real Estate",
      "url": window.location.origin + '/',
      "logo": window.location.origin + '/assets/logo.png',
      "image": window.location.origin + '/assets/logo.png'
    };
    if (contact.generalEmail || c.footerEmail) org.email = contact.generalEmail || c.footerEmail;
    if (contact.generalPhone) org.telephone = contact.generalPhone;
    if (hub && hub.address) {
      org.address = { "@type": "PostalAddress", "streetAddress": hub.address, "addressCountry": "AE" };
    }
    if (hub && hub.latitude != null && hub.longitude != null) {
      org.geo = { "@type": "GeoCoordinates", "latitude": hub.latitude, "longitude": hub.longitude };
    }
    let orgScript = document.getElementById('schema-org-ld');
    if (!orgScript) {
      orgScript = document.createElement('script');
      orgScript.type = 'application/ld+json';
      orgScript.id = 'schema-org-ld';
      document.head.appendChild(orgScript);
    }
    orgScript.textContent = JSON.stringify(org);
  } catch (err) { console.warn('Organization schema injection failed', err); }
})();
