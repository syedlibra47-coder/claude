// HomesPartner homepage: launch data, the plaque, the filters and the scale model.
const WA = 'https://api.whatsapp.com/send?text=';

const LAUNCHES = {
  'sobha-one': { name: 'Sobha One', dev: 'Sobha', area: 'Sobha Hartland 2', handover: 'Q4 2027', price: 'AED 1.65M', plan: [10, 50, 40], ref: 'HP-L01', url: 'https://homespartner.ae/sobha-hartland-2/sobha-one/', model: 'towers' },
  'safa-two': { name: 'Safa Two', dev: 'DAMAC', area: 'Business Bay', handover: 'Q2 2028', price: 'AED 2.1M', plan: [20, 60, 20], ref: 'HP-L02', url: 'https://homespartner.ae/business-bay/safa-two/', model: 'tall' },
  'palm-jebel-ali': { name: 'Palm Jebel Ali Beach Villas', short: 'Palm Jebel Ali', dev: 'Nakheel', area: 'Palm Jebel Ali', handover: 'Q4 2028', price: 'AED 18.5M', plan: [20, 60, 20], ref: 'HP-L03', url: 'https://homespartner.ae/palm-jebel-ali/beach-villas/', model: 'villas' },
};

const planLabel = p => `${p[0] + p[1]}/${p[2]}`;
const askHref = l => WA + encodeURIComponent(`Hi HomesPartner, I'd like details on ${l.name} (ref ${l.ref}): ${l.url}`);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

let model = null;
let current = 'sobha-one';

function show(id, { scroll = false } = {}) {
  const l = LAUNCHES[id];
  if (!l) return;
  current = id;
  const plaque = $('[data-plaque]');
  $('[data-f="name"]', plaque).textContent = l.name;
  $('[data-f="where"]', plaque).textContent = `${l.dev}, ${l.area}`;
  $('[data-f="handover"]', plaque).textContent = l.handover;
  $('[data-f="price"]', plaque).textContent = l.price;
  $('[data-f="plan"]', plaque).textContent = planLabel(l.plan);
  $('[data-f="ask"]', plaque).href = askHref(l);
  $$('[data-pick]', plaque).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pick === id)));
  // the payment wall below follows the model on show
  $('[data-plan-name]').textContent = l.name;
  const max = Math.max(...l.plan);
  l.plan.forEach((v, i) => {
    $(`[data-bar="${i}"]`).style.setProperty('--h', Math.round(v / max * 100) + '%');
    $(`[data-pct="${i}"]`).textContent = v + '%';
  });
  $('[data-mid]').textContent = `In instalments until ${l.handover}.`;
  if (model) model.show(l.model);
  if (scroll) $('#top').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

$$('[data-pick]').forEach(b => b.addEventListener('click', () => show(b.dataset.pick)));
$$('[data-show]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); show(a.dataset.show, { scroll: true }); }));

// filters: developer chips, the hero finder and the area list all narrow one list of launches
const state = { dev: '', area: '', year: '' };
function filter() {
  let shown = 0;
  $$('[data-launches] > li').forEach(row => {
    const ok = (!state.dev || row.dataset.dev === state.dev) && (!state.area || row.dataset.area === state.area) && (!state.year || Number(row.dataset.year) <= Number(state.year));
    row.hidden = !ok;
    if (ok) shown++;
  });
  $('[data-empty]').hidden = shown > 0;
  $$('[data-filters] button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.dev === state.dev)));
}
$$('[data-filters] button').forEach(b => b.addEventListener('click', () => { state.dev = b.dataset.dev; state.area = ''; state.year = ''; filter(); }));
const finder = $('[data-finder]');
$('[data-find]', finder).addEventListener('click', e => {
  e.preventDefault();
  state.dev = $('#f-dev').value; state.area = $('#f-area').value; state.year = $('#f-year').value;
  filter();
  $('#launches').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
});
$$('[data-area-link]').forEach(a => a.addEventListener('click', () => { state.dev = ''; state.year = ''; state.area = a.dataset.areaLink; filter(); }));
const q = new URLSearchParams(location.search);
if (q.get('developer') || q.get('area') || q.get('year')) { state.dev = q.get('developer') || ''; state.area = q.get('area') || ''; state.year = q.get('year') || ''; filter(); }

// the scale model: three.js, loaded after the page is readable; the drawn still stands until it is ready
const frame = $('[data-model]');
const still = matchMedia('(prefers-reduced-motion: reduce)').matches || matchMedia('(max-width: 639px)').matches;
const start = () => import('./model.js').then(m => {
  model = m.mount(frame, { live: !still });
  if (model) { frame.classList.add('is-live'); model.show(LAUNCHES[current].model, true); }
}).catch(() => {});
if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 1200 }); else setTimeout(start, 300);
