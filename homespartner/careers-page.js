(async function () {
  if (window.dataReady) await window.dataReady;

  const content = window.CAREERS_CONTENT_DATA || {};
  const jobs = (window.JOB_LISTINGS_DATA || []).filter(j => j.isActive !== false).sort((a, b) => a.sortOrder - b.sortOrder);

  const setText = (id, value) => { const el = document.getElementById(id); if (el && value != null) el.textContent = value; };

  setText('careersHeroEyebrow', content.heroEyebrow);
  setText('careersHeroHeading', content.heroHeading);
  setText('careersHeroSubtitle', content.heroSubtitle);
  setText('careersWhyJoinEyebrow', content.whyJoinEyebrow);
  setText('careersWhyJoinHeading', content.whyJoinHeading);
  setText('careersWhyJoinIntro', content.whyJoinIntro);
  setText('careersValuesEyebrow', content.valuesEyebrow);
  setText('careersValuesHeading', content.valuesHeading);
  setText('careersJobsEyebrow', content.jobsEyebrow);
  setText('careersJobsHeading', content.jobsHeading);
  setText('careersJobsSubtitle', content.jobsSubtitle);
  setText('careersCvEyebrow', content.cvEyebrow);
  setText('careersCvHeading', content.cvHeading);
  setText('careersCvSubtitle', content.cvSubtitle);
  setText('careersFaqEyebrow', content.faqEyebrow);
  setText('careersFaqHeading', content.faqHeading);

  const cvEmail = content.cvEmail || 'info@homespartner.ae';
  const cvBtn = document.getElementById('careersCvButton');
  if (cvBtn) cvBtn.href = `mailto:${cvEmail}?subject=${encodeURIComponent('Career Enquiry — HomesPartner')}`;

  // ----- Why Join value props -----
  const valuePropsGrid = document.getElementById('careersValuePropsGrid');
  if (valuePropsGrid && content.valueProps) {
    valuePropsGrid.innerHTML = content.valueProps.map(v => {
      const iconSvg = (window.ICON_LIBRARY && window.ICON_LIBRARY[v.icon]) || (window.ICON_LIBRARY && window.ICON_LIBRARY.star) || '';
      return `
      <div class="careers-value-card">
        <div class="service-icon"><svg viewBox="0 0 24 24" fill="none">${iconSvg}</svg></div>
        <h4>${v.title}</h4>
        <p>${v.description}</p>
      </div>`;
    }).join('');
  }

  // ----- Core values -----
  const coreValuesGrid = document.getElementById('coreValuesGrid');
  if (coreValuesGrid && content.coreValues) {
    coreValuesGrid.innerHTML = content.coreValues.map(v => `
      <div class="core-value-card">
        <h4>${v.title}</h4>
        <p>${v.tagline}</p>
      </div>`).join('');
  }

  // ----- Job listings -----
  const jobsList = document.getElementById('jobListingsList');
  const noJobsMsg = document.getElementById('noJobsMessage');
  if (jobsList) {
    if (!jobs.length) {
      jobsList.style.display = 'none';
      if (noJobsMsg) noJobsMsg.style.display = 'block';
    } else {
      jobsList.innerHTML = jobs.map(j => {
        const applySubject = encodeURIComponent(`Application: ${j.title}`);
        const applyHref = `mailto:${cvEmail}?subject=${applySubject}`;
        const metaBits = [j.location];
        if (j.department) metaBits.push(j.department);
        if (j.experienceLevel) metaBits.push(j.experienceLevel);
        metaBits.push(j.jobType);
        return `
        <div class="careers-role-row careers-role-row--full">
          <div class="careers-role-info">
            <span class="careers-role-title">${j.title}</span>
            <span class="careers-role-meta">${metaBits.join(' · ')}</span>
            ${j.description ? `<p class="careers-role-desc">${j.description}</p>` : ''}
          </div>
          <a href="${applyHref}" class="btn btn-navy btn-sm">Apply &rarr;</a>
        </div>`;
      }).join('');
    }
  }

  // ----- FAQ -----
  const faqList = document.getElementById('careersFaqList');
  if (faqList && content.faqs) {
    faqList.innerHTML = content.faqs.map((f, i) => `
      <details class="faq-item reveal in-view"${i === 0 ? ' open' : ''}>
        <summary>${f.question}</summary>
        <p>${f.answer}</p>
      </details>`).join('');
  }
})();
