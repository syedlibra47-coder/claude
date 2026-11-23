// Homepage tools: the mortgage calculator and the 2-minute property match quiz.
(async function () {
  if (window.dataReady) await window.dataReady;

  const WA = ((window.CONTACT_CONTENT_DATA && window.CONTACT_CONTENT_DATA.whatsappNumber) || '').replace(/[^0-9]/g, '') || '971500000000';
  const aed = n => 'AED ' + Math.round(n).toLocaleString('en-US');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = id => document.getElementById(id);

  // ===================== Mortgage calculator =====================
  const form = $('mortgageForm');
  if (form) {
    const MIN_DOWN = { national: 15, expat: 20, nonres: 40 };
    const priceEl = $('mPrice'), buyerEl = $('mBuyer'), downEl = $('mDown'), rateEl = $('mRate'), termEl = $('mTerm');

    const readPrice = () => Number(String(priceEl.value).replace(/[^0-9.]/g, '')) || 0;

    function calc() {
      const price = readPrice();
      // UAE Central Bank caps: higher minimum down payment above AED 5M for first homes
      let minDown = MIN_DOWN[buyerEl.value];
      if (buyerEl.value !== 'nonres' && price > 5000000) minDown += 10;
      downEl.min = minDown;
      if (Number(downEl.value) < minDown) downEl.value = minDown;

      const downPct = Number(downEl.value);
      const years = Number(termEl.value);
      const rate = Math.max(0, Number(rateEl.value) || 0) / 100 / 12;
      const loan = price * (1 - downPct / 100);
      const n = years * 12;
      const monthly = loan <= 0 ? 0 : rate === 0 ? loan / n : loan * rate / (1 - Math.pow(1 + rate, -n));

      const down = price - loan;
      const dld = price * 0.04 + 580;
      const reg = loan > 0 ? loan * 0.0025 + 290 : 0;
      const agency = price * 0.02 * 1.05;
      const bank = loan * 0.01;
      const upfront = down + dld + reg + agency + bank;

      $('mDownLabel').textContent = downPct + '%';
      $('mTermLabel').textContent = years + ' years';
      $('mMonthly').textContent = aed(monthly);
      $('mLoan').textContent = aed(loan);
      $('mDownAmt').textContent = aed(down);
      $('mDld').textContent = aed(dld);
      $('mReg').textContent = aed(reg);
      $('mAgency').textContent = aed(agency);
      $('mBank').textContent = aed(bank);
      $('mUpfront').textContent = aed(upfront);

      const msg = `Hi HomesPartner, I'd like help with mortgage pre-approval. Property price ${aed(price)}, ${downPct}% down, ${years} years at ${rateEl.value}% (about ${aed(monthly)} a month).`;
      $('mCta').href = `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
    }

    priceEl.addEventListener('input', () => {
      const digits = priceEl.value.replace(/[^0-9]/g, '');
      priceEl.value = digits ? Number(digits).toLocaleString('en-US') : '';
      calc();
    });
    [buyerEl, downEl, rateEl, termEl].forEach(el => el.addEventListener('input', calc));
    form.addEventListener('submit', e => e.preventDefault());
    calc();
  }

  // ===================== 2-minute property match quiz =====================
  const body = $('quizBody');
  if (!body) return;

  const AREA_GROUPS = {
    waterfront: ['Dubai Marina', 'Palm Jumeirah', 'Dubai Creek Harbour'],
    city: ['Downtown Dubai', 'Business Bay'],
    community: ['Jumeirah Village Circle', 'Jumeirah Lake Towers', 'Al Furjan', 'Dubai Land Residence Complex']
  };

  const QUESTIONS = [
    { key: 'goal', q: 'What are you looking for?', options: [
      { v: 'buy', label: 'Buy a ready home' }, { v: 'rent', label: 'Rent a home' }, { v: 'offplan', label: 'Invest off-plan' }] },
    { key: 'budget', q: a => a.goal === 'rent' ? 'What’s your monthly rent budget?' : 'What’s your budget?', options: a => a.goal === 'rent'
      ? [{ v: '0-6000', label: 'Under AED 6,000' }, { v: '6000-9000', label: 'AED 6,000 – 9,000' }, { v: '9000-15000', label: 'AED 9,000 – 15,000' }, { v: '15000-', label: 'AED 15,000+' }]
      : [{ v: '0-1000000', label: 'Under AED 1M' }, { v: '1000000-2000000', label: 'AED 1M – 2M' }, { v: '2000000-5000000', label: 'AED 2M – 5M' }, { v: '5000000-', label: 'AED 5M+' }] },
    { key: 'beds', q: 'How many bedrooms?', options: [
      { v: '0', label: 'Studio' }, { v: '1', label: '1 bedroom' }, { v: '2', label: '2 bedrooms' }, { v: '3', label: '3 bedrooms' }, { v: '4', label: '4+ bedrooms' }] },
    { key: 'area', q: 'Which kind of area suits you?', options: [
      { v: 'waterfront', label: 'Waterfront', hint: 'Marina, Palm, Creek Harbour' }, { v: 'city', label: 'City centre', hint: 'Downtown, Business Bay' },
      { v: 'community', label: 'Family community', hint: 'JVC, JLT, Al Furjan, DLRC' }, { v: 'any', label: 'Open to suggestions' }] },
    { key: 'purpose', q: a => a.goal === 'rent' ? 'Who will live there?' : 'What’s it for?', options: a => a.goal === 'rent'
      ? [{ v: 'single', label: 'Just me' }, { v: 'couple', label: 'Me and my partner' }, { v: 'family', label: 'My family' }, { v: 'sharing', label: 'Sharing' }]
      : [{ v: 'live', label: 'To live in' }, { v: 'income', label: 'Rental income' }, { v: 'visa', label: 'Golden Visa' }, { v: 'holiday', label: 'Holiday home' }] },
    { key: 'timeline', q: 'When do you want to move forward?', options: [
      { v: 'now', label: 'Within a month' }, { v: '1-3', label: 'In 1–3 months' }, { v: '3-6', label: 'In 3–6 months' }, { v: 'exploring', label: 'Just exploring' }] }
  ];

  const answers = {};
  const labels = {};
  let step = 0;

  const resolve = (x) => typeof x === 'function' ? x(answers) : x;

  function setProgress() {
    const total = QUESTIONS.length + 1;
    $('quizBar').style.width = Math.round((Math.min(step, total) / total) * 100) + '%';
    $('quizStep').textContent = step < QUESTIONS.length ? `Question ${step + 1} of ${QUESTIONS.length}` : step === QUESTIONS.length ? 'Last step' : 'Your shortlist';
    $('quizBack').hidden = step === 0 || step > QUESTIONS.length;
  }

  function renderQuestion() {
    const Q = QUESTIONS[step];
    body.innerHTML = `
      <h3 class="quiz-q">${esc(resolve(Q.q))}</h3>
      <div class="quiz-options">
        ${resolve(Q.options).map(o => `
          <button type="button" class="quiz-option${answers[Q.key] === o.v ? ' is-picked' : ''}" data-v="${esc(o.v)}">
            <span>${esc(o.label)}</span>${o.hint ? `<small>${esc(o.hint)}</small>` : ''}
          </button>`).join('')}
      </div>`;
    body.querySelectorAll('.quiz-option').forEach(btn => btn.addEventListener('click', () => {
      answers[Q.key] = btn.dataset.v;
      labels[Q.key] = btn.querySelector('span').textContent;
      btn.classList.add('is-picked');
      setTimeout(next, 180);
    }));
    setProgress();
  }

  function next() { step++; step < QUESTIONS.length ? renderQuestion() : renderContact(); }
  $('quizBack').addEventListener('click', () => { if (step > 0) { step--; renderQuestion(); } });

  function findMatches() {
    const [lo, hiRaw] = (answers.budget || '0-').split('-');
    const min = Number(lo) || 0, max = hiRaw ? Number(hiRaw) : Infinity;
    const wantBeds = Number(answers.beds);
    const areas = AREA_GROUPS[answers.area] || null;
    const bedsOf = b => /stud/i.test(String(b)) ? 0 : parseInt(b, 10) || 0;

    let pool;
    if (answers.goal === 'offplan') {
      pool = Object.values(window.OFFPLAN_DATA || {}).map(p => ({
        id: p.id, title: p.title, community: p.community, price: Number(p.price) || 0, priceLabel: 'from ' + p.priceLabel,
        hero: p.hero, href: `offplan-detail.html?id=${encodeURIComponent(p.id)}`, meta: `Handover ${p.handover}`,
        beds: (p.unitTypes || []).map(u => /stud/i.test(u.type) ? 0 : parseInt(u.type, 10)).filter(n => !isNaN(n))
      }));
    } else {
      const type = answers.goal === 'rent' ? 'rent' : 'sale';
      pool = Object.values(window.LISTINGS_DATA || {}).filter(l => l.type === type).map(l => ({
        id: l.id, title: l.title, community: l.community, price: Number(l.price) || 0,
        priceLabel: l.priceLabel + (l.priceSuffix ? ' ' + l.priceSuffix : ''), hero: l.hero,
        href: `listing-detail.html?id=${encodeURIComponent(l.id)}`, meta: `${l.beds === 'Studio' ? 'Studio' : l.beds + ' Beds'} · ${l.sqft} sqft`,
        beds: [bedsOf(l.beds)]
      }));
    }
    return pool.map(p => {
      let score = 0;
      if (p.price >= min && p.price <= max) score += 3; else if (p.price <= max * 1.2) score += 1;
      if (p.beds.some(b => wantBeds >= 4 ? b >= 4 : b === wantBeds)) score += 2;
      if (!areas || areas.some(a => (p.community || '').indexOf(a) === 0)) score += 2;
      return Object.assign(p, { score });
    }).filter(p => p.score >= 3).sort((a, b) => b.score - a.score).slice(0, 3);
  }

  function renderContact() {
    setProgress();
    const count = findMatches().length;
    body.innerHTML = `
      <h3 class="quiz-q">${count ? `We found ${count} ${count === 1 ? 'match' : 'matches'} for you` : 'We’ll build your shortlist'}</h3>
      <p class="quiz-lead">Where should we send ${count ? 'them' : 'it'}? An advisor follows up on WhatsApp with prices, floor plans and availability.</p>
      <form class="quiz-form" id="quizForm" novalidate>
        <label><span>Your name</span><input name="name" type="text" autocomplete="name" required></label>
        <label><span>WhatsApp number</span><input name="whatsapp" type="tel" autocomplete="tel" inputmode="tel" placeholder="+971 or +44 …" required></label>
        <label class="quiz-form-wide"><span>Email</span><input name="email" type="email" autocomplete="email" inputmode="email" required></label>
        <p class="quiz-error" id="quizError" role="alert"></p>
        <button type="submit" class="btn btn-gold quiz-submit">Show My Matches</button>
        <p class="quiz-privacy">We only use these details to send your shortlist.</p>
      </form>`;
    $('quizForm').addEventListener('submit', submit);
  }

  async function submit(e) {
    e.preventDefault();
    const f = e.target;
    const lead = { name: f.name.value.trim(), whatsapp: f.whatsapp.value.trim(), email: f.email.value.trim() };
    const err = $('quizError');
    if (!lead.name) { err.textContent = 'Write the name we should use.'; f.name.focus(); return; }
    if (lead.whatsapp.replace(/[^0-9]/g, '').length < 8) { err.textContent = 'Write a WhatsApp number with its country code, like +971 or +44.'; f.whatsapp.focus(); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(lead.email)) { err.textContent = 'Write an email address with an @, like name@example.com.'; f.email.focus(); return; }
    err.textContent = '';
    const btn = f.querySelector('.quiz-submit');
    btn.disabled = true; btn.textContent = 'Finding your matches…';

    const matches = findMatches();
    try {
      if (window.supabase && window.SUPABASE_URL) {
        const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
        await client.from('quiz_leads').insert({
          name: lead.name, whatsapp: lead.whatsapp, email: lead.email,
          answers: labels, matches: matches.map(m => m.id), page_url: location.href
        });
      }
    } catch (ex) { console.warn('Quiz lead not saved', ex); }
    renderResults(lead, matches);
  }

  function renderResults(lead, matches) {
    step = QUESTIONS.length + 1;
    setProgress();
    $('quizBar').style.width = '100%';
    const summary = Object.keys(labels).map(k => labels[k]).join(', ');
    const waText = `Hi HomesPartner, I'm ${lead.name}. I just did the property match quiz: ${summary}.` +
      (matches.length ? ` I'm interested in: ${matches.map(m => m.title).join(', ')}.` : '');
    body.innerHTML = `
      <h3 class="quiz-q">Thanks, ${esc(lead.name.split(' ')[0])}. Here’s your shortlist</h3>
      <p class="quiz-lead">${matches.length ? 'An advisor will send details for these on WhatsApp shortly.' : 'Nothing on our public list fits exactly yet, so an advisor will send options from our full portfolio.'}</p>
      ${matches.length ? `<div class="quiz-matches">${matches.map(m => `
        <a class="quiz-match" href="${m.href}">
          <img src="${esc(m.hero)}" alt="${esc(m.title)}" loading="lazy">
          <span class="qm-shade" aria-hidden="true"></span>
          <span class="qm-info"><span class="qm-price">${esc(m.priceLabel)}</span><span class="qm-title">${esc(m.title)}</span><span class="qm-meta">${esc(m.community)} · ${esc(m.meta)}</span></span>
        </a>`).join('')}</div>` : ''}
      <div class="quiz-actions">
        <a class="btn btn-gold" href="https://wa.me/${WA}?text=${encodeURIComponent(waText)}" target="_blank" rel="noopener">Talk to an Advisor Now</a>
        <button type="button" class="quiz-restart" id="quizRestart">Start again</button>
      </div>`;
    $('quizRestart').addEventListener('click', () => { step = 0; Object.keys(answers).forEach(k => delete answers[k]); Object.keys(labels).forEach(k => delete labels[k]); renderQuestion(); });
  }

  renderQuestion();
})();
