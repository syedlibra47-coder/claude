const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

const WHATSAPP_NUMBER = (window.CONTACT_CONTENT_DATA && window.CONTACT_CONTENT_DATA.whatsappNumber) || '971500000000';
document.querySelectorAll('.whatsapp-btn[data-property]').forEach(btn => {
  const message = `Hi, I'm interested in ${btn.dataset.property}. Could you share more details?`;
  btn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
});

const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 10);
});

const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');
navToggle.addEventListener('click', () => mainNav.classList.toggle('open'));
mainNav.addEventListener('click', (e) => { if (e.target.tagName === 'A') mainNav.classList.remove('open'); });

// ===== Search bar Buy/Rent/Off-Plan toggle =====
const searchToggle = document.getElementById('searchToggle');
if (searchToggle) {
  const pills = searchToggle.querySelectorAll('.toggle-pill');
  const highlight = document.getElementById('toggleHighlight');
  const movePill = (pill) => {
    highlight.style.width = `${pill.offsetWidth}px`;
    highlight.style.transform = `translateX(${pill.offsetLeft - 4}px)`;
  };
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      movePill(pill);
    });
  });
  window.addEventListener('load', () => movePill(searchToggle.querySelector('.toggle-pill.active')));
}

// ===== Carousel arrow controls =====
document.querySelectorAll('[data-carousel-prev]').forEach(btn => {
  btn.addEventListener('click', () => {
    const track = document.getElementById(btn.dataset.carouselPrev);
    const card = track.querySelector(':scope > *');
    const step = card ? card.getBoundingClientRect().width + 26 : 340;
    track.scrollBy({ left: -step, behavior: 'smooth' });
  });
});
document.querySelectorAll('[data-carousel-next]').forEach(btn => {
  btn.addEventListener('click', () => {
    const track = document.getElementById(btn.dataset.carouselNext);
    const card = track.querySelector(':scope > *');
    const step = card ? card.getBoundingClientRect().width + 26 : 340;
    track.scrollBy({ left: step, behavior: 'smooth' });
  });
});

// ===== Scroll reveal =====
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach(el => revealObserver.observe(el));

// ===== YouTube click-to-play =====
document.querySelectorAll('.youtube-card[data-video-id]').forEach(card => {
  const thumb = card.querySelector('.youtube-thumb');
  thumb.addEventListener('click', () => {
    const videoId = card.dataset.videoId;
    thumb.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  }, { once: true });
});

// ===== Listing card click-through to detail page =====
document.querySelectorAll('.listing-card[data-listing-id]').forEach(card => {
  card.style.cursor = 'pointer';
  card.addEventListener('click', (e) => {
    if (e.target.closest('a, button, input, select, textarea')) return;
    window.location.href = `listing-detail.html?id=${card.dataset.listingId}`;
  });
});

// ===== Off-plan project card click-through to detail page =====
document.querySelectorAll('.offplan-project[data-offplan-id]').forEach(card => {
  card.style.cursor = 'pointer';
  card.addEventListener('click', (e) => {
    if (e.target.closest('a, button, input, select, textarea')) return;
    window.location.href = `offplan-detail.html?id=${card.dataset.offplanId}`;
  });
});

