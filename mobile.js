/* ============================================================
   CS VISUALIZER — MOBILE WEBSITE
   mobile.js — Theme · Carousel · Touch-hold preview · Contact
   ============================================================ */

'use strict';

/* ─── 1. SMOOTH ANCHOR CLICKS ────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});


/* ─── 2. THEME TOGGLE ────────────────────────────────────── */
(function initTheme() {
  const btn  = document.getElementById('theme-toggle');
  const icon = document.getElementById('theme-icon');
  const root = document.documentElement;

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem('csviz-theme', theme);
    icon.className = theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';

    /* swap hero video */
    const videoSource = document.querySelector('.hero-video video source');
    if (videoSource) {
      videoSource.src = theme === 'dark'
        ? 'videos/cs-visualizor-dark.mp4'
        : 'videos/cs-visualizor-light.mp4';
      videoSource.parentElement.load();
    }
  }

  btn.addEventListener('click', () => {
    apply(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  apply(localStorage.getItem('csviz-theme') || 'dark');
})();


/* ─── 3. VISUALIZER CAROUSEL ─────────────────────────────── */
(function initCarousel() {
  const carousel = document.getElementById('viz-carousel');
  const track    = document.getElementById('viz-carousel-track');
  const dotsWrap = document.getElementById('carousel-dots');
  const cards    = [...track.querySelectorAll('.viz-card')];
  if (!cards.length) return;

  /* Build dots */
  cards.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dotsWrap.appendChild(dot);
  });
  const dots = [...dotsWrap.querySelectorAll('.carousel-dot')];

  /* Update active dot on scroll */
  let currentIndex = 0;

  function updateDots() {
    const scrollLeft = carousel.scrollLeft;
    const cardWidth  = cards[0].offsetWidth + 14; /* gap */
    const idx = Math.round(scrollLeft / cardWidth);
    if (idx !== currentIndex && idx >= 0 && idx < cards.length) {
      dots[currentIndex].classList.remove('active');
      currentIndex = idx;
      dots[currentIndex].classList.add('active');
    }
  }

  let scrollTimer = null;
  carousel.addEventListener('scroll', () => {
    if (scrollTimer) cancelAnimationFrame(scrollTimer);
    scrollTimer = requestAnimationFrame(updateDots);
  }, { passive: true });
})();


/* ─── 3b. FEATURES CAROUSEL ──────────────────────────────── */
(function initFeatCarousel() {
  const carousel = document.getElementById('feat-carousel');
  const dotsWrap = document.getElementById('feat-dots');
  if (!carousel || !dotsWrap) return;

  const cards = [...carousel.querySelectorAll('.feat-card')];
  if (!cards.length) return;

  cards.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dotsWrap.appendChild(dot);
  });
  const dots = [...dotsWrap.querySelectorAll('.carousel-dot')];

  let currentIndex = 0;

  function updateDots() {
    const scrollLeft = carousel.scrollLeft;
    const cardWidth  = cards[0].offsetWidth + 14;
    const idx = Math.round(scrollLeft / cardWidth);
    if (idx !== currentIndex && idx >= 0 && idx < cards.length) {
      dots[currentIndex].classList.remove('active');
      currentIndex = idx;
      dots[currentIndex].classList.add('active');
    }
  }

  let scrollTimer = null;
  carousel.addEventListener('scroll', () => {
    if (scrollTimer) cancelAnimationFrame(scrollTimer);
    scrollTimer = requestAnimationFrame(updateDots);
  }, { passive: true });
})();


/* ─── 4. TOUCH-AND-HOLD PREVIEW ──────────────────────────── */
(function initTouchPreview() {
  const preview = document.getElementById('viz-preview');
  const vpIcon  = document.getElementById('vp-icon');
  const vpTitle = document.getElementById('vp-title');
  const vpDesc  = document.getElementById('vp-desc');
  const vpImg   = document.getElementById('vp-img');
  const cards   = document.querySelectorAll('.viz-card');
  if (!preview || !cards.length) return;

  const DATA = {
    flow: { icon: '&#9654;', title: 'FLOWCHART VISUALIZER',  desc: 'Roslyn parses your method into an AST and generates a control-flow graph — decision diamonds, loop back-edges, and function call nodes.',  imageDark: 'images/flowchart-dark.png',  imageLight: 'images/flowchart-light.png' },
    ds:   { icon: '&#9783;', title: 'DATA STRUCTURES',        desc: 'Step through code and watch arrays, linked lists, stacks, queues, and binary trees update live on a heap + stack canvas.',               imageDark: 'images/ds-dark.png',         imageLight: 'images/ds-light.png'        },
    oop:  { icon: '&#9671;', title: 'OOP CONCEPTS',           desc: 'Watch object references, virtual dispatch tables, and call stack frames update frame by frame as your class hierarchy executes.',        imageDark: 'images/oop-dark.png',        imageLight: 'images/oop-light.png'       },
    rec:  { icon: '&#8635;', title: 'RECURSION VISUALIZER',   desc: 'Watch the call tree grow, inspect each frame\'s arguments and return values, and step through execution at any speed.',                  imageDark: 'images/rec-dark.png',        imageLight: 'images/rec-light.png'       },
    algo: { icon: '&#9660;', title: 'ALGORITHMS',             desc: 'Animate 9 sorting and searching algorithms bar by bar. Run two side-by-side in compare mode with live operation counters.',              imageDark: 'images/algo-dark.png',       imageLight: 'images/algo-light.png'      },
    cmp:  { icon: '&#8734;', title: 'COMPLEXITY ANALYZER',    desc: 'Get Big O notation, a growth curve graph, and a plain-English explanation of your code\'s complexity — powered by GPT-4o-mini.',       imageDark: 'images/complex-dark.png',    imageLight: 'images/complex-light.png'   },
    dfos: { icon: '&#9881;', title: 'DFOS — OS CONCEPTS',     desc: 'A live Rust microkernel in your browser. PCB state transitions, CPU scheduling Gantt charts, and physical memory frame allocation.',     imageDark: 'images/dfos-dark.png',       imageLight: 'images/dfos-light.png'      },
    aut:  { icon: '&#8767;', title: 'AUTOMATA THEORY',        desc: 'Build DFAs, NFAs, PDAs, and Turing Machines interactively. Run input strings and watch state transitions animate step by step.',         imageDark: 'images/auto-dark.png',       imageLight: 'images/auto-light.png'      },
    num:  { icon: '&#8721;', title: 'NUMERICAL METHODS',      desc: 'Root-finding, integration, interpolation, ODEs, and linear algebra — visualized with convergence graphs, iteration tables, and zoom/pan.', imageDark: 'images/numerical-dark.png', imageLight: 'images/numerical-light.png' },
    bool: { icon: '&#8853;', title: 'BOOLEAN ALGEBRA',        desc: 'Enter any boolean expression: truth table, logic gate circuit, step-by-step simplification, and an interactive 3D Karnaugh map.',       imageDark: 'images/bool-dark.png',       imageLight: 'images/bool-light.png'      },
  };

  function isDark() {
    return document.documentElement.getAttribute('data-theme') !== 'light';
  }

  const closeBtn = document.getElementById('vp-close');

  function showPreview(card) {
    const key = card.dataset.viz;
    const d   = DATA[key];
    if (!d) return;

    vpIcon.innerHTML    = d.icon;
    vpTitle.textContent = d.title;
    vpDesc.textContent  = d.desc;

    const src = isDark() ? d.imageDark : d.imageLight;
    vpImg.classList.remove('loaded');
    vpImg.onload = () => vpImg.classList.add('loaded');
    vpImg.src = src;

    preview.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function hidePreview() {
    preview.classList.remove('open');
    document.body.style.overflow = '';
  }

  cards.forEach(card => {
    card.addEventListener('click', () => {
      showPreview(card);
    });
  });

  /* Close button */
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    hidePreview();
  });

  /* Close on backdrop tap */
  preview.addEventListener('click', (e) => {
    if (e.target === preview) hidePreview();
  });
})();


/* ─── 5. CONTACT MODAL ──────────────────────────────────── */
(function initContact() {
  emailjs.init('FmUwP7A1Evl9DnKaq');

  const overlay = document.getElementById('contact-overlay');
  if (!overlay) return;

  document.getElementById('contact-btn').addEventListener('click', () => overlay.classList.add('open'));
  document.getElementById('contact-close').addEventListener('click', () => overlay.classList.remove('open'));
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });

  document.getElementById('cf-submit').addEventListener('click', () => {
    const name    = document.getElementById('cf-name').value.trim();
    const email   = document.getElementById('cf-email').value.trim();
    const subject = 'CS Visualizer';
    const message = document.getElementById('cf-message').value.trim();
    const status  = document.getElementById('cf-status');
    const btn     = document.getElementById('cf-submit');

    if (!name || !email || !message) {
      status.style.color = '#ff4466';
      status.textContent = 'Please fill in name, email and message.';
      return;
    }

    btn.disabled = true;
    status.style.color = 'var(--fg2)';
    status.textContent = 'Sending...';

    emailjs.send('service_0x98wpz', 'template_74vo1wg', { name, email, title: subject, message })
      .then(() => {
        status.style.color = '#00ff9d';
        status.textContent = 'Message sent — thank you!';
        document.getElementById('cf-name').value    = '';
        document.getElementById('cf-email').value   = '';
        document.getElementById('cf-message').value = '';
        btn.disabled = false;
        setTimeout(() => overlay.classList.remove('open'), 2000);
      })
      .catch(err => {
        status.style.color = '#ff4466';
        status.textContent = 'Send failed — please try again.';
        console.error(err);
        btn.disabled = false;
      });
  });
})();
