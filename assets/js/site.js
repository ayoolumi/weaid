// =====================================================
// WE AID INITIATIVE — site behaviour (with full EN/HA translation)
// =====================================================

// ---------- Hero photo carousel (Ken Burns + cross-fade) ----------
// Reads image URLs from #hero-carousel[data-hero-images] (comma-separated).
// Gracefully degrades: if no images load, the navy gradient background stays in place.
(function initHeroCarousel() {
  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('hero-carousel');
    if (!root) return;
    const list = (root.dataset.heroImages || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!list.length) return;

    // Pre-validate that each image actually loads
    const validUrls = new Set();
    let pending = list.length;
    list.forEach(url => {
      const img = new Image();
      img.onload  = () => { validUrls.add(url); if (--pending === 0) build(); };
      img.onerror = () => { if (--pending === 0) build(); };
      img.src = url;
    });

    function build() {
      const ordered = list.filter(u => validUrls.has(u));
      if (!ordered.length) return; // no valid images — keep the gradient fallback
      ordered.forEach((url, i) => {
        const slide = document.createElement('div');
        slide.className = 'hero-slide' + (i === 0 ? ' is-active' : '');
        slide.style.backgroundImage = `url("${url}")`;
        root.appendChild(slide);
      });
      const dots = document.getElementById('hero-dots');
      const dotButtons = [];
      if (dots) {
        ordered.forEach((_, i) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('aria-label', `Go to slide ${i+1}`);
          if (i === 0) b.classList.add('is-active');
          b.addEventListener('click', () => show(i, true));
          dots.appendChild(b);
          dotButtons.push(b);
        });
      }
      let current = 0;
      const slides = root.querySelectorAll('.hero-slide');
      let timer = setInterval(() => show((current + 1) % slides.length), 6500);

      function show(idx, fromClick) {
        if (idx === current) return;
        slides[current].classList.remove('is-active');
        if (dotButtons[current]) dotButtons[current].classList.remove('is-active');
        current = idx;
        const next = slides[current];
        next.classList.remove('is-active');
        void next.offsetWidth; // force reflow so Ken Burns restarts
        next.classList.add('is-active');
        if (dotButtons[current]) dotButtons[current].classList.add('is-active');
        if (fromClick) {
          clearInterval(timer);
          timer = setInterval(() => show((current + 1) % slides.length), 6500);
        }
      }
    }
  });
})();

// ---------- Mobile nav ----------
document.addEventListener('click', (e) => {
  const toggle = e.target.closest('.nav-toggle');
  if (toggle) {
    document.querySelector('.primary-nav')?.classList.toggle('open');
  }
});

// ---------- Language switch (EN / HA) ----------
// Every translatable element on the page uses BOTH:
//   <span class="i18n-en">English text</span><span class="i18n-ha" hidden>Hausa text</span>
// The toggle simply flips which one is visible. This means EVERY visible
// string on a page is automatically translated when the user clicks HA — no
// dictionary maintenance required, the translations live next to the source.

function applyLang(lang) {
  document.documentElement.lang = lang;
  document.body.classList.toggle('lang-ha', lang === 'ha');
  document.body.classList.toggle('lang-en', lang === 'en');
  document.querySelectorAll('.lang-switch button').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });
  try { localStorage.setItem('weaid_lang', lang); } catch(e) {}
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('.lang-switch button');
  if (b) applyLang(b.dataset.lang);
});

document.addEventListener('DOMContentLoaded', () => {
  let saved = 'en';
  try { saved = localStorage.getItem('weaid_lang') || 'en'; } catch(e) {}
  applyLang(saved);
});

// ---------- Stats counter ----------
function animateCount(el) {
  const target = parseInt(el.dataset.count, 10);
  if (isNaN(target)) return;
  const duration = 1400, start = performance.now();
  function step(now) {
    const p = Math.min((now - start) / duration, 1);
    const v = Math.floor(target * (0.2 + 0.8 * (1 - Math.pow(1 - p, 3))));
    el.textContent = v.toLocaleString() + (el.dataset.suffix || '');
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target.toLocaleString() + (el.dataset.suffix || '');
  }
  requestAnimationFrame(step);
}
document.addEventListener('DOMContentLoaded', () => {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { animateCount(e.target); obs.unobserve(e.target); }
    });
  });
  document.querySelectorAll('[data-count]').forEach(el => obs.observe(el));
});

// ---------- Citizen reporting form ----------
const CITIZEN_KEY = 'weaid_citizen_reports';
function loadReports() {
  try { return JSON.parse(localStorage.getItem(CITIZEN_KEY) || '[]'); }
  catch(e) { return []; }
}
function saveReports(list) {
  try { localStorage.setItem(CITIZEN_KEY, JSON.stringify(list)); } catch(e){}
}
function genTrackingId() {
  const d = new Date();
  const code = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `CTZ-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}-${code}`;
}
function renderReports() {
  const tbody = document.querySelector('#reports-tbody');
  if (!tbody) return;
  const list = loadReports().slice().reverse();
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#6B7280; padding:24px;">No reports submitted yet. Be the first — use the form above.</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(r => `
    <tr>
      <td><code>${r.id}</code></td>
      <td>${r.category}</td>
      <td>${r.location || '<span style="color:#9CA3AF">—</span>'}</td>
      <td>${new Date(r.created).toLocaleDateString()}</td>
      <td><span class="status ${r.statusClass}">${r.status}</span></td>
    </tr>`).join('');
}
document.addEventListener('submit', (e) => {
  const form = e.target.closest('#citizen-report-form');
  if (!form) return;
  e.preventDefault();
  const data = new FormData(form);
  const report = {
    id: genTrackingId(),
    category: data.get('category'),
    location: data.get('location'),
    description: data.get('description'),
    anonymous: !!data.get('anonymous'),
    name: data.get('name'),
    contact: data.get('contact'),
    status: 'Submitted',
    statusClass: 's-submitted',
    created: Date.now(),
  };
  const list = loadReports();
  list.push(report);
  saveReports(list);
  renderReports();
  const banner = document.querySelector('#citizen-confirm');
  if (banner) {
    const isHa = document.documentElement.lang === 'ha';
    banner.innerHTML = isHa
      ? `<strong>An aiko rahoto.</strong> Lambar bin diddiginka ita ce <code>${report.id}</code>. Ka adana wannan lambar don ka bincika halin rahoton ka.`
      : `<strong>Report submitted.</strong> Your tracking ID is <code>${report.id}</code>. Save this code to check the status of your report.`;
    banner.style.display = 'block';
    banner.scrollIntoView({behavior:'smooth', block:'center'});
  }
  form.reset();
});
document.addEventListener('DOMContentLoaded', () => {
  renderReports();
  const list = loadReports();
  if (list.length === 0) {
    const seed = [
      { id: 'CTZ-202410-A4K2P', category: 'Poor Infrastructure', location: 'Bauchi, Bauchi LGA',
        description: 'Pot-holed road on Yandoka Street has been impassable for weeks.',
        status: 'In Progress', statusClass: 's-progress', created: Date.now() - 86400000*8 },
      { id: 'CTZ-202410-B9M7X', category: 'Healthcare', location: 'Toro LGA',
        description: 'PHC out of stock for malaria drugs since the rainy season started.',
        status: 'Escalated', statusClass: 's-escalated', created: Date.now() - 86400000*3 },
    ];
    saveReports(seed);
    renderReports();
  }
});

// ---------- Contact form (demo) ----------
document.addEventListener('submit', (e) => {
  const form = e.target.closest('#contact-form');
  if (!form) return;
  e.preventDefault();
  const banner = document.querySelector('#contact-confirm');
  if (banner) {
    const isHa = document.documentElement.lang === 'ha';
    banner.innerHTML = isHa
      ? `<strong>Mun gode.</strong> An karbi sakonka. Yawanci muna amsa cikin kwanaki 2 na aiki.`
      : `<strong>Thank you.</strong> Your message has been received. We typically respond within 2 business days.`;
    banner.style.display = 'block';
    banner.scrollIntoView({behavior:'smooth', block:'center'});
  }
  form.reset();
});
