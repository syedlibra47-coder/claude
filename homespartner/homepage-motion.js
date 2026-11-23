// Scroll-in motion for the homepage: cards and rows rise in, photo cards open
// from a slightly inset frame while the photo settles. Staggered per group.
// Runs only when IntersectionObserver exists, so nothing is ever left hidden.
(async function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.dataReady) await window.dataReady;
  await new Promise(r => setTimeout(r, 50)); // let the content scripts render first

  const groups = [
    ['.listing-card--photo', 'photo'], ['.offplan-project--photo', 'photo'], ['.advisor-portrait', 'photo'],
    ['.service-card', 'rise'], ['.office-card', 'rise'], ['.why-item', 'rise'], ['.stat', 'rise'],
    ['.youtube-card', 'rise'], ['.review-card', 'rise'], ['.advisor-body', 'rise'],
    ['.mortgage-result', 'rise'], ['.quiz-card', 'rise']
  ];
  document.documentElement.classList.add('anim-ready');

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-shown'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  const prepare = () => groups.forEach(([sel, kind]) => {
    document.querySelectorAll(sel).forEach(el => {
      if (el.dataset.anim) return;
      const siblings = el.parentElement ? [...el.parentElement.children] : [el];
      el.dataset.anim = kind;
      el.style.setProperty('--anim-delay', (Math.min(siblings.indexOf(el), 6) * 0.05).toFixed(2) + 's');
      io.observe(el);
    });
  });
  prepare();
  // the listing filters re-render their cards: pick those up too
  new MutationObserver(prepare).observe(document.body, { childList: true, subtree: true });
})();
