(async function () {
  if (window.dataReady) await window.dataReady;

  const content = window.CONTACT_CONTENT_DATA || {};
  const offices = (window.OFFICES_DATA || []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const faqs = (window.FAQS_DATA || []).slice().sort((a, b) => a.sortOrder - b.sortOrder);

  const setText = (id, value) => { const el = document.getElementById(id); if (el && value != null) el.textContent = value; };

  // ----- Page text -----
  setText('contactHeroEyebrow', content.heroEyebrow);
  setText('contactHeroHeading', content.heroHeading);
  setText('contactHeroSubtitle', content.heroSubtitle);
  setText('contactIntroEyebrow', content.introEyebrow);
  setText('contactIntroHeading', content.introHeading);
  setText('contactIntroParagraph1', content.introParagraph1);
  setText('contactIntroParagraph2', content.introParagraph2);
  setText('contactNetworkEyebrow', content.networkEyebrow);
  setText('contactNetworkHeading', content.networkHeading);
  setText('contactNetworkSubtitle', content.networkSubtitle);
  setText('contactFormEyebrow', content.formEyebrow);
  setText('contactFormHeading', content.formHeading);
  setText('contactFormSubtitle', content.formSubtitle);
  setText('contactFaqEyebrow', content.faqEyebrow);
  setText('contactFaqHeading', content.faqHeading);
  if (document.title.trim() === '' || document.title.includes('Contact')) {
    document.title = `Contact Us — HomesPartner Real Estate | Dubai, UK, Pakistan & India Offices`;
  }

  // ----- Office cards -----
  const grid = document.getElementById('contactOfficeGrid');
  if (grid) {
    grid.innerHTML = offices.map(o => {
      const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.address)}`;
      const methods = [];
      if (o.phone) {
        methods.push(`<a href="tel:+${o.phone}" class="contact-method">
          <svg viewBox="0 0 24 24" fill="none"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1v3.5c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
          ${o.phoneDisplay || o.phone}
        </a>`);
      }
      if (o.email) {
        methods.push(`<a href="mailto:${o.email}" class="contact-method">
          <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="m3 7 9 6 9-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          ${o.email}
        </a>`);
      }
      if (o.byAppointmentNote) {
        methods.push(`<span class="contact-method contact-method--note">${o.byAppointmentNote}</span>`);
      } else if (o.address) {
        methods.push(`<a href="${directionsUrl}" class="contact-method" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="9.5" r="2.4" stroke="currentColor" stroke-width="1.6"/></svg>
          Get Directions
        </a>`);
      }
      return `
      <div class="contact-office-card reveal in-view">
        <span class="badge badge--gold">${o.badgeLabel}</span>
        <h3>${o.title}</h3>
        <p class="contact-office-address">${o.address}</p>
        <div class="contact-office-methods">${methods.join('')}</div>
      </div>`;
    }).join('');
  }

  // ----- FAQ accordion -----
  const faqList = document.getElementById('contactFaqList');
  if (faqList) {
    faqList.innerHTML = faqs.map((f, i) => `
      <details class="faq-item reveal in-view"${i === 0 ? ' open' : ''}>
        <summary>${f.question}</summary>
        <p>${f.answer}</p>
      </details>`).join('');
  }

  // ----- World map: pins + routes computed from lat/long -----
  if (window.renderOfficeMap) window.renderOfficeMap(offices, 'mapRouteLines', 'mapNodes');
})();
