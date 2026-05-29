// =====================================================
// WE AID INITIATIVE — site behaviour (with full EN/HA translation)
// =====================================================

// ---------- Auto-inject sticky "Report an issue" floating button ----------
// Appears on every page except the report page itself and citizen sub-pages
// (where the CTA already lives prominently in the hero).
(function injectReportFAB() {
  document.addEventListener('DOMContentLoaded', () => {
    const path = location.pathname;
    if (path.includes('/citizen/')) {
      document.body.classList.add('is-citizen-page');
      return;
    }
    // Compute the right relative path to citizen/report.html from current depth
    const depth = path.split('/').filter(p => p && !p.endsWith('.html')).length;
    const prefix = depth === 0 ? '' : '../'.repeat(depth);
    const href = prefix + 'citizen/report.html';
    const isHa = (document.documentElement.lang === 'ha') ||
                 (() => { try { return localStorage.getItem('weaid_lang') === 'ha'; } catch(e) { return false; } })();
    const fab = document.createElement('a');
    fab.className = 'report-fab';
    fab.href = href;
    fab.setAttribute('aria-label', 'Report an issue');
    fab.innerHTML = `
      <span class="pulse"></span>
      <span class="i18n-en">Report an issue</span><span class="i18n-ha">Bayar da rahoto</span>
    `;
    document.body.appendChild(fab);
  });
})();


// ---------- Copy-to-clipboard for account numbers ----------
(function initCopyButtons() {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.copy-btn');
    if (!btn) return;
    const value = btn.dataset.copy;
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch (err) {
      // Fallback for older browsers / non-https
      const tmp = document.createElement('textarea');
      tmp.value = value;
      tmp.style.position = 'fixed'; tmp.style.opacity = '0';
      document.body.appendChild(tmp);
      tmp.select();
      try { document.execCommand('copy'); } catch (e2) {}
      document.body.removeChild(tmp);
    }
    // Visual feedback on the button
    const original = btn.textContent;
    btn.textContent = '✓';
    btn.classList.add('is-copied');
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove('is-copied');
    }, 1800);
    // Toast
    const toast = document.getElementById('copy-toast');
    if (toast) {
      const isHa = document.documentElement.lang === 'ha';
      toast.textContent = isHa
        ? `An kwafe lambar asusu: ${value}`
        : `Account number copied: ${value}`;
      toast.classList.add('is-visible');
      clearTimeout(toast._t);
      toast._t = setTimeout(() => toast.classList.remove('is-visible'), 2200);
    }
  });
})();

// ---------- Scroll-triggered reveal animations ----------
// Auto-tags eligible elements with .reveal / .reveal-stagger and watches with IntersectionObserver.
// Honours prefers-reduced-motion (CSS already handles the fallback).
(function initScrollReveal() {
  document.addEventListener('DOMContentLoaded', () => {
    // Auto-add .reveal to common section primitives so we don't have to touch every page
    document.querySelectorAll('.section-head, .feature, .prose, blockquote, .cta-strip, .page-hero .lead').forEach(el => {
      if (!el.classList.contains('reveal') && !el.classList.contains('reveal-stagger')) {
        el.classList.add('reveal');
      }
    });
    // Stagger card grids
    document.querySelectorAll('.section .grid, .section-soft .grid').forEach(grid => {
      // Only stagger grids that hold cards/articles (not feature media etc.)
      const isCardGrid = grid.querySelector(':scope > .card, :scope > article, :scope > .stat, :scope > .partner');
      if (isCardGrid) grid.classList.add('reveal-stagger');
    });

    if (!('IntersectionObserver' in window)) {
      // Old browser fallback — just show everything
      document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => el.classList.add('is-visible'));
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => obs.observe(el));
  });
})();

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
      let timer = setInterval(() => show((current + 1) % slides.length), 30000);

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
          timer = setInterval(() => show((current + 1) % slides.length), 30000);
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
// =====================================================
// Real form submission via Formspree
// Forms supported: #contact-form, #citizen-report-form, #volunteer-form
// Each form's <form action="..."> attribute provides its Formspree endpoint.
// =====================================================

// Map of formId → { confirmBannerId, successMessage(en, ha), augmentDataBeforePost }
const FORM_CONFIG = {
  'contact-form': {
    bannerId: 'contact-confirm',
    msgEn: (data) => `<strong>Thank you.</strong> Your message has been received. We typically respond within 2 business days.`,
    msgHa: (data) => `<strong>Mun gode.</strong> An karbi sakonka. Yawanci muna amsa cikin kwanaki 2 na aiki.`,
  },
  'citizen-report-form': {
    bannerId: 'citizen-confirm',
    augment: (form, data) => {
      // Generate tracking ID, also save to local dashboard mirror
      const id = genTrackingId();
      data.set('tracking_id', id);
      // Also append to localStorage so the dashboard table updates
      const report = {
        id,
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
      // Stash id for the success message
      form.dataset.lastTrackingId = id;
    },
    msgEn: (data, form) => `<strong>Report submitted.</strong> Your tracking ID is <code>${form.dataset.lastTrackingId}</code>. Save this code to check the status of your report. Our governance team will review within 5 business days.`,
    msgHa: (data, form) => `<strong>An aiko rahoto.</strong> Lambar bin diddiginka ita ce <code>${form.dataset.lastTrackingId}</code>. Tawagar shugabancinmu za ta duba cikin kwanaki 5 na aiki.`,
  },
  'volunteer-form': {
    bannerId: 'volunteer-confirm',
    msgEn: (data) => `<strong>Thank you!</strong> Your volunteer application has been received. We'll be in touch within a few days.`,
    msgHa: (data) => `<strong>Mun gode!</strong> An karbi neman sa kai naka. Za mu tuntube ka cikin 'yan kwanaki.`,
  },
};

document.addEventListener('submit', async (e) => {
  const form = e.target.closest('form');
  if (!form) return;
  const cfg = FORM_CONFIG[form.id];
  if (!cfg) return; // not one of our managed forms
  const endpoint = form.action;
  if (!endpoint || !endpoint.includes('formspree.io')) return; // safety: only intercept Formspree forms
  e.preventDefault();

  const banner = document.getElementById(cfg.bannerId);
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
  const isHa = document.documentElement.lang === 'ha';

  // Loading state
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = isHa ? 'Ana aikawa…' : 'Sending…';
  }

  const data = new FormData(form);
  if (cfg.augment) cfg.augment(form, data);

  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      body: data,
      headers: { 'Accept': 'application/json' },
    });
    if (resp.ok) {
      if (banner) {
        banner.innerHTML = isHa ? cfg.msgHa(data, form) : cfg.msgEn(data, form);
        banner.style.background = '#E3F4E9';
        banner.style.color = '#1E7C3A';
        banner.style.display = 'block';
        banner.scrollIntoView({behavior:'smooth', block:'center'});
      }
      form.reset();
    } else {
      let errMsg = isHa ? 'Akwai matsala wajen aika sako. Ka sake gwadawa, ko aiko zuwa info@weaidinitiative.org.' : 'There was a problem sending your message. Please try again, or email info@weaidinitiative.org directly.';
      try {
        const j = await resp.json();
        if (j && j.errors && j.errors.length) errMsg = j.errors.map(e => e.message).join(' · ');
      } catch(_) {}
      if (banner) {
        banner.innerHTML = `<strong>⚠️</strong> ${errMsg}`;
        banner.style.background = '#FBECE9';
        banner.style.color = '#962E22';
        banner.style.display = 'block';
        banner.scrollIntoView({behavior:'smooth', block:'center'});
      }
    }
  } catch (err) {
    if (banner) {
      banner.innerHTML = `<strong>⚠️</strong> ${isHa ? 'Babu intanet. Ka sake gwadawa lokacin da intanet ya dawo.' : 'Network error. Please check your connection and try again.'}`;
      banner.style.background = '#FBECE9';
      banner.style.color = '#962E22';
      banner.style.display = 'block';
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  }
});

// Dashboard starts empty — the first real citizen submission populates it.
// (Demo seed reports were removed for the launch; the empty-state copy
// "Be the first — use the form above." prompts the first submission.)
document.addEventListener('DOMContentLoaded', () => {
  renderReports();
});
