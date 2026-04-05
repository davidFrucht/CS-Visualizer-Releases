/* ============================================================
   CS VISUALIZER — MARKETING WEBSITE
   main.js  —  Lenis · Three.js · GSAP ScrollTrigger · Theme
   ============================================================ */

'use strict';

/* ─── 1. LENIS SMOOTH SCROLL ──────────────────────────────── */
const lenis = new Lenis({
  duration: 1.0,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
});

gsap.ticker.add(time => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
lenis.on('scroll', ScrollTrigger.update);

/* smooth anchor clicks */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: -64, duration: 1.2 });
  });
});


/* ─── 2. THREE.JS — MINIMAL PARTICLE GRID ────────────────── */
(function initParticles() {
  const canvas   = document.getElementById('hero-canvas');
  const heroSec  = document.getElementById('hero');

  const W = () => heroSec.clientWidth;
  const H = () => heroSec.clientHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(W(), H());

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, W() / H(), 0.1, 800);
  camera.position.set(0, 0, 60);

  /* Monochrome accent color — single hue */
  const ACCENT_DARK  = new THREE.Color(0x00d4ff);
  const ACCENT_LIGHT = new THREE.Color(0x0284c7);
  let isDark = true;

  const COUNT   = 140;
  const pos     = new Float32Array(COUNT * 3);
  const col     = new Float32Array(COUNT * 3);
  const vel     = new Float32Array(COUNT * 3);

  function fillParticles() {
    const c = isDark ? ACCENT_DARK : ACCENT_LIGHT;
    for (let i = 0; i < COUNT; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 100;
      pos[i*3+1] = (Math.random() - 0.5) * 60;
      pos[i*3+2] = (Math.random() - 0.5) * 40;
      vel[i*3]   = (Math.random() - 0.5) * 0.006;
      vel[i*3+1] = (Math.random() - 0.5) * 0.006;
      vel[i*3+2] = 0;
      /* vary brightness slightly */
      const b = 0.4 + Math.random() * 0.6;
      col[i*3]   = c.r * b;
      col[i*3+1] = c.g * b;
      col[i*3+2] = c.b * b;
    }
  }
  fillParticles();

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.45,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
  });

  const pts = new THREE.Points(geo, mat);
  scene.add(pts);

  /* Static connections — rebuild on theme change */
  let linesMesh = buildLines();

  function buildLines() {
    const lp = [], lc = [];
    const c = isDark ? ACCENT_DARK : ACCENT_LIGHT;
    const THRESHOLD = 14;

    for (let i = 0; i < COUNT; i++) {
      for (let j = i + 1; j < COUNT; j++) {
        const dx = pos[i*3] - pos[j*3];
        const dy = pos[i*3+1] - pos[j*3+1];
        const d  = Math.sqrt(dx*dx + dy*dy);
        if (d < THRESHOLD) {
          const a = (1 - d / THRESHOLD) * 0.25;
          lp.push(pos[i*3], pos[i*3+1], pos[i*3+2]);
          lp.push(pos[j*3], pos[j*3+1], pos[j*3+2]);
          lc.push(c.r*a, c.g*a, c.b*a);
          lc.push(c.r*a, c.g*a, c.b*a);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lp), 3));
    g.setAttribute('color',    new THREE.BufferAttribute(new Float32Array(lc), 3));
    return new THREE.LineSegments(g, new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.25 : 0.18,
    }));
  }

  scene.add(linesMesh);

  /* Mouse parallax — very subtle */
  let mX = 0, mY = 0;
  window.addEventListener('mousemove', e => {
    mX = (e.clientX / innerWidth  - 0.5) * 2;
    mY = (e.clientY / innerHeight - 0.5) * 2;
  });

  function animate() {
    requestAnimationFrame(animate);

    /* drift */
    for (let i = 0; i < COUNT; i++) {
      pos[i*3]   += vel[i*3];
      pos[i*3+1] += vel[i*3+1];
      if (Math.abs(pos[i*3])   > 52) vel[i*3]   *= -1;
      if (Math.abs(pos[i*3+1]) > 32) vel[i*3+1] *= -1;
    }
    geo.attributes.position.needsUpdate = true;

    /* very gentle camera drift */
    camera.position.x += (mX * 2 - camera.position.x) * 0.02;
    camera.position.y += (-mY * 1.2 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  animate();

  /* Resize */
  const ro = new ResizeObserver(() => {
    renderer.setSize(W(), H());
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
  });
  ro.observe(heroSec);

  /* Theme API */
  window.heroSetTheme = function(theme) {
    isDark = theme === 'dark';
    fillParticles();
    geo.attributes.color.needsUpdate = true;
    scene.remove(linesMesh);
    linesMesh.geometry.dispose();
    linesMesh.material.dispose();
    linesMesh = buildLines();
    scene.add(linesMesh);
    mat.opacity = isDark ? 0.7 : 0.45;
  };
})();


/* ─── 3. HERO CAROUSEL ───────────────────────────────────── */
(function initCarousel() {
  const slides   = Array.from(document.querySelectorAll('.c-slide'));
  const dots     = Array.from(document.querySelectorAll('.c-dot'));
  const winTitle = document.getElementById('carousel-win-title');
  if (!slides.length) return;

  const NAMES = [
    'Flowchart Visualizer', 'Data Structures', 'OOP Concepts',
    'Recursion Visualizer', 'Algorithms', 'Complexity Analyzer',
    'DFOS — OS Concepts', 'Automata Theory', 'Numerical Methods', 'Boolean Algebra',
  ];

  let current = 0;
  let timer;

  function goTo(idx) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = idx;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
    if (winTitle) winTitle.textContent = NAMES[current];
  }

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(() => goTo((current + 1) % slides.length), 3500);
  }

  dots.forEach((dot, i) => dot.addEventListener('click', () => { goTo(i); startTimer(); }));

  startTimer();

  window.carouselSetTheme = function(theme) {
    slides.forEach(slide => {
      const src = theme === 'dark' ? slide.dataset.dark : slide.dataset.light;
      if (src) slide.src = src;
    });
  };
})();


/* ─── 4. THEME TOGGLE ─────────────────────────────────────── */
(function initTheme() {
  const btn  = document.getElementById('theme-toggle');
  const icon = document.getElementById('theme-icon');
  const root = document.documentElement;

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem('csviz-theme', theme);

    icon.className = theme === 'dark'
      ? 'fa-solid fa-moon'
      : 'fa-solid fa-sun';

    /* swap app screenshots */
    document.querySelectorAll('[data-dark-src]').forEach(img => {
      img.src = theme === 'dark' ? img.dataset.darkSrc : img.dataset.lightSrc;
    });

    if (typeof window.heroSetTheme === 'function') window.heroSetTheme(theme);
    if (typeof window.carouselSetTheme === 'function') window.carouselSetTheme(theme);

  }

  btn.addEventListener('click', () => {
    apply(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  apply(localStorage.getItem('csviz-theme') || 'dark');
})();


/* ─── 4. NAV — scroll state + active link ─────────────────── */
(function initNav() {
  const nav     = document.getElementById('navbar');
  const links   = document.querySelectorAll('.nav-links a');
  const sections = document.querySelectorAll('section[id]');

  ScrollTrigger.create({
    start: 'top -50',
    onUpdate: self => nav.classList.toggle('scrolled', self.progress > 0),
  });

  sections.forEach(sec => {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 50%',
      end: 'bottom 50%',
      onEnter:     () => setActive(sec.id),
      onEnterBack: () => setActive(sec.id),
    });
  });

  function setActive(id) {
    links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
  }
})();


/* ─── 5. COPY COMMAND BUTTONS ─────────────────────────────── */
document.querySelectorAll('.plat-cmd').forEach(cmd => {
  const btn = cmd.querySelector('.copy-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const text = cmd.querySelector('.cmd-text')?.textContent?.trim();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      btn.innerHTML = '<i class="fa-solid fa-check"></i>';
      setTimeout(() => btn.innerHTML = '<i class="fa-regular fa-copy"></i>', 1800);
    });
  });
});


/* ─── 6. GSAP SCROLL ANIMATIONS ──────────────────────────── */
gsap.registerPlugin(ScrollTrigger);

/* Hero — staggered entrance */
(function heroAnim() {
  const tl = gsap.timeline({ delay: 0.1 });
  tl.from('#hero-title',      { opacity: 0, y: 32, duration: 0.7, ease: 'power3.out' })
    .from('#hero-sub',        { opacity: 0, y: 20, duration: 0.6, ease: 'power2.out' }, '-=0.4')
    .from('#hero-actions > *',{ opacity: 0, y: 16, stagger: 0.1, duration: 0.5, ease: 'power2.out' }, '-=0.3')
    .from('#hero-right',      { opacity: 0, x: 40, duration: 1.0, ease: 'power3.out' }, '-=0.8');
})();

/* Section headers */
document.querySelectorAll('.section-eyebrow, .section-title, .section-sub').forEach(el => {
  gsap.from(el, {
    scrollTrigger: { trigger: el, start: 'top 87%' },
    opacity: 0, y: 24, duration: 0.7, ease: 'power2.out',
  });
});

/* Viz grid cards — batch stagger */
ScrollTrigger.batch('.viz-card', {
  onEnter: batch => gsap.fromTo(batch,
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 0.6, stagger: 0.06, ease: 'power2.out' }
  ),
  start: 'top 88%',
});

/* Platform cards */
ScrollTrigger.batch('.platform-card', {
  onEnter: batch => gsap.fromTo(batch,
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
  ),
  start: 'top 88%',
});

/* Plugin cards */
ScrollTrigger.batch('.plugin-card', {
  onEnter: batch => gsap.fromTo(batch,
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, duration: 0.6, stagger: 0.09, ease: 'power2.out' }
  ),
  start: 'top 88%',
});

/* Extension cards */
gsap.from('.ext-card', {
  scrollTrigger: { trigger: '.ext-grid', start: 'top 86%' },
  opacity: 0, y: 28, stagger: 0.12, duration: 0.7, ease: 'power2.out',
});

/* Pricing cards */
gsap.from('.pricing-card', {
  scrollTrigger: { trigger: '.pricing-grid', start: 'top 86%' },
  opacity: 0, y: 28, stagger: 0.12, duration: 0.7, ease: 'power2.out',
});

/* Fade elements */
document.querySelectorAll('[data-gsap="fade"]').forEach(el => {
  gsap.from(el, {
    scrollTrigger: { trigger: el, start: 'top 88%' },
    opacity: 0, y: 20, duration: 0.6, ease: 'power2.out',
  });
});

/* Footer */
gsap.from('footer .footer-brand', {
  scrollTrigger: { trigger: 'footer', start: 'top 88%' },
  opacity: 0, y: 20, duration: 0.6, ease: 'power2.out',
});

gsap.from('footer .footer-col', {
  scrollTrigger: { trigger: 'footer', start: 'top 88%' },
  opacity: 0, y: 16, stagger: 0.08, duration: 0.5, ease: 'power2.out', delay: 0.15,
});


/* ─── 7. VIZ EXPAND PANEL (inline between / below rows) ──── */
(function initVizPreview() {
  const ROW1_TYPES = new Set(['flow','ds','oop','rec','algo']);

  /* Panel 1 — between rows */
  const expand1 = document.getElementById('viz-expand');
  const img1    = document.getElementById('vp-img');
  const icon1   = document.getElementById('vp-icon');
  const title1  = document.getElementById('vp-title');
  const desc1   = document.getElementById('vp-desc');

  /* Panel 2 — below row 2 */
  const expand2 = document.getElementById('viz-expand-2');
  const img2    = document.getElementById('vp-img-2');
  const icon2   = document.getElementById('vp-icon-2');
  const title2  = document.getElementById('vp-title-2');
  const desc2   = document.getElementById('vp-desc-2');

  if (!expand1 || !expand2) return;

  /* alias for convenience */
  const expand = expand1;
  const img    = img1;
  const icon   = icon1;
  const title  = title1;
  const desc   = desc1;

  const DATA = {
    flow: { icon: '&#9654;', title: 'FLOWCHART VISUALIZER',  desc: 'Roslyn parses your method into an AST and generates a control-flow graph — decision diamonds, loop back-edges, and function call nodes.',            imageDark: 'images/flowchart-dark.png',  imageLight: 'images/flowchart-light.png' },
    ds:   { icon: '&#9783;', title: 'DATA STRUCTURES',        desc: 'Step through code and watch arrays, linked lists, stacks, queues, and binary trees update live on a heap + stack canvas.',                             imageDark: 'images/ds-dark.png',         imageLight: 'images/ds-light.png'        },
    oop:  { icon: '&#9671;', title: 'OOP CONCEPTS',           desc: 'Watch object references, virtual dispatch tables, and call stack frames update frame by frame as your class hierarchy executes.',                      imageDark: 'images/oop-dark.png',        imageLight: 'images/oop-light.png'       },
    rec:  { icon: '&#8635;', title: 'RECURSION VISUALIZER',   desc: 'Watch the call tree grow, inspect each frame\'s arguments and return values, and step through execution at any speed.',                                imageDark: 'images/rec-dark.png',        imageLight: 'images/rec-light.png'       },
    algo: { icon: '&#9660;', title: 'ALGORITHMS',             desc: 'Animate 9 sorting and searching algorithms bar by bar. Run two side-by-side in compare mode with live operation counters.',                            imageDark: 'images/algo-dark.png',       imageLight: 'images/algo-light.png'      },
    cmp:  { icon: '&#8734;', title: 'COMPLEXITY ANALYZER',    desc: 'Get Big O notation, a growth curve graph, and a plain-English explanation of your code\'s complexity — powered by GPT-4o-mini.',                     imageDark: 'images/complex-dark.png',    imageLight: 'images/complex-light.png'   },
    dfos: { icon: '&#9881;', title: 'DFOS — OS CONCEPTS',     desc: 'A live Rust microkernel in your browser. PCB state transitions, CPU scheduling Gantt charts, and physical memory frame allocation.',                   imageDark: 'images/dfos-dark.png',       imageLight: 'images/dfos-light.png'      },
    aut:  { icon: '&#8767;', title: 'AUTOMATA THEORY',        desc: 'Build DFAs, NFAs, PDAs, and Turing Machines interactively. Run input strings and watch state transitions animate step by step.',                       imageDark: 'images/auto-dark.png',       imageLight: 'images/auto-light.png'      },
    num:  { icon: '&#8721;', title: 'NUMERICAL METHODS',      desc: 'Root-finding, integration, interpolation, ODEs, and linear algebra — visualized with convergence graphs, iteration tables, and zoom/pan.',             imageDark: 'images/numerical-dark.png',  imageLight: 'images/numerical-light.png' },
    bool: { icon: '&#8853;', title: 'BOOLEAN ALGEBRA',        desc: 'Enter any boolean expression: truth table, logic gate circuit, step-by-step simplification, and an interactive 3D Karnaugh map.',                     imageDark: 'images/bool-dark.png',       imageLight: 'images/bool-light.png'      },
  };

  function getType(card) {
    return Object.keys(DATA).find(k => card.classList.contains(k)) || null;
  }

  function isDarkTheme() {
    return document.documentElement.getAttribute('data-theme') !== 'light';
  }

  let closeTimer1 = null;
  let closeTimer2 = null;
  let scrollLock  = false;  /* true while auto-scroll is running */
  let scrollLockTimer = null;

  const SCROLL_DURATION_MS = 1200; /* matches CSS transition duration */
  const CLOSE_DELAY_MS     = 300;

  function setScrollLock() {
    scrollLock = true;
    if (scrollLockTimer) clearTimeout(scrollLockTimer);
    scrollLockTimer = setTimeout(() => { scrollLock = false; }, SCROLL_DURATION_MS);
  }

  function populatePanel(panelImg, panelIcon, panelTitle, panelDesc, d, src) {
    panelIcon.innerHTML    = d.icon;
    panelTitle.textContent = d.title;
    panelDesc.textContent  = d.desc;
    panelImg.classList.remove('loaded');
    panelImg.onload = () => panelImg.classList.add('loaded');
    if (panelImg.getAttribute('src') !== src) {
      panelImg.src = src;
    } else {
      panelImg.classList.add('loaded');
    }
  }

  const PANEL_HEIGHT = 520;

  const vizRows = document.querySelectorAll('#visualizers .viz-row');
  const row1El  = vizRows[0];
  const row2El  = vizRows[1];
  const NAV_H  = 90; /* navbar height + breathing room */

  function openPanel(panel, isRow1, closingHeight) {
    panel.classList.add('open');

    let delta;
    if (isRow1) {
      /* Scroll so row 1 cards sit just below the navbar — cards stay fully
         visible and the gap expands into view below them */
      const row1Rect = row1El.getBoundingClientRect();
      delta = row1Rect.top - NAV_H;
    } else {
      /* Scroll so row 2 cards sit just below the navbar.
         Account for row 1 panel closing (layout shifts up). */
      const row2Rect = row2El.getBoundingClientRect();
      const adjustedTop = row2Rect.top - closingHeight;
      delta = adjustedTop - NAV_H;
    }

    if (Math.abs(delta) > 5) {
      setScrollLock();
      lenis.scrollTo(window.scrollY + delta, { duration: 1.2 });
    }
  }

  let activeRow = null; /* 1 or 2 — which panel is currently open */

  function showFor(card) {
    const type = getType(card);
    if (!type) return;
    const isRow1 = ROW1_TYPES.has(type);

    /* While scrolling, don't let the cursor drifting onto the other row steal the panel */
    if (scrollLock && activeRow !== null && activeRow !== (isRow1 ? 1 : 2)) return;

    const d = DATA[type];
    const src = isDarkTheme() ? d.imageDark : d.imageLight;

    if (isRow1) {
      activeRow = 1;
      if (closeTimer1) { clearTimeout(closeTimer1); closeTimer1 = null; }
      const closing2Height = expand2.classList.contains('open') ? PANEL_HEIGHT : 0;
      if (closing2Height) closePanel(expand2); else expand2.classList.remove('closing');
      populatePanel(img1, icon1, title1, desc1, d, src);
      openPanel(expand1, true, 0);
    } else {
      activeRow = 2;
      if (closeTimer2) { clearTimeout(closeTimer2); closeTimer2 = null; }
      const closing1Height = expand1.classList.contains('open') ? PANEL_HEIGHT : 0;
      if (closing1Height) closePanel(expand1); else expand1.classList.remove('closing');
      populatePanel(img2, icon2, title2, desc2, d, src);
      openPanel(expand2, false, closing1Height);

    }
  }

  function closePanel(panel) {
    panel.classList.remove('open');
    panel.classList.add('closing');
    activeRow = null;

    function onEnd(e) {
      if (e.propertyName !== 'height') return;
      panel.classList.remove('closing');
      panel.removeEventListener('transitionend', onEnd);
    }
    panel.addEventListener('transitionend', onEnd);
  }

  function tryClose1() {
    if (scrollLock) return;
    closeTimer1 = setTimeout(() => { closePanel(expand1); closeTimer1 = null; }, CLOSE_DELAY_MS);
  }
  function tryClose2() {
    if (scrollLock) return;
    closeTimer2 = setTimeout(() => { closePanel(expand2); closeTimer2 = null; }, CLOSE_DELAY_MS);
  }

  document.querySelectorAll('.lp-card').forEach(card => {
    card.addEventListener('mouseenter', () => showFor(card));
    card.addEventListener('mouseleave', () => {
      const type = getType(card);
      if (!type) return;
      if (ROW1_TYPES.has(type)) tryClose1(); else tryClose2();
    });
  });

  expand1.addEventListener('mouseenter', () => { if (closeTimer1) { clearTimeout(closeTimer1); closeTimer1 = null; } });
  expand1.addEventListener('mouseleave', tryClose1);

  expand2.addEventListener('mouseenter', () => { if (closeTimer2) { clearTimeout(closeTimer2); closeTimer2 = null; } });
  expand2.addEventListener('mouseleave', tryClose2);
})();


/* ─── 8. PLUGIN EXPAND PANEL (horizontal FLIP stagger) ────── */
(function initPluginPreview() {
  const wrap  = document.getElementById('plugin-expand-wrap');
  const panel = document.getElementById('plugin-expand');
  const img   = document.getElementById('pe-img');
  const title = document.getElementById('pe-title');
  const desc  = document.getElementById('pe-desc');
  if (!wrap || !panel) return;

  const DATA = {
    vs:      { title: 'VISUAL STUDIO', desc: 'Right-click any C# selection and open it directly in CS Visualizer.',          imageDark: 'images/vscode-dark.png',  imageLight: 'images/vscode-light.png' },
    vscode:  { title: 'VS CODE',       desc: 'Right-click any selection to open it in CS Visualizer.',                        imageDark: 'images/vscode-dark.png',  imageLight: 'images/vscode-light.png' },
    jb:      { title: 'JETBRAINS',     desc: 'Native plugin for IntelliJ, Rider, CLion, and WebStorm.',                       imageDark: 'images/jetbrains-dark.png',  imageLight: 'images/jetbrains-light.png' },
    eclipse: { title: 'ECLIPSE',       desc: 'Install the .jar plugin and right-click to visualize your code.',                imageDark: 'images/vscode-dark.png',  imageLight: 'images/vscode-light.png' },
  };

  const cards      = [...document.querySelectorAll('.plugin-card')];
  let closeTimer   = null;
  let isOpen       = false;
  let isAnimating  = false;

  function loadContent(key) {
    const d = DATA[key];
    if (!d) return;
    const src = document.documentElement.getAttribute('data-theme') === 'light' ? d.imageLight : d.imageDark;
    title.textContent = d.title;
    desc.textContent  = d.desc;
    img.classList.remove('loaded');
    img.onload = () => img.classList.add('loaded');
    if (img.getAttribute('src') !== src) img.src = src;
    else img.classList.add('loaded');
  }

  function openPanel(key) {
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    loadContent(key);
    if (isOpen || isAnimating) return;
    isAnimating = true;

    /* FLIP: record positions before layout change */
    const before = cards.map(c => c.getBoundingClientRect());

    /* Lock each card's width so it doesn't stretch in 1-col grid */
    cards.forEach(c => { c.style.width = c.offsetWidth + 'px'; });

    /* Switch grid to single column (instant layout change) */
    wrap.classList.add('layout-ready');

    /* Record positions after layout change */
    const after = cards.map(c => c.getBoundingClientRect());

    /* Prime each card at its old position */
    cards.forEach((card, i) => {
      gsap.set(card, {
        x: before[i].left - after[i].left,
        y: before[i].top  - after[i].top,
      });
    });

    /* Animate cards one by one to their new vertical positions */
    gsap.to(cards, {
      x: 0, y: 0,
      duration: 0.32,
      ease: 'power2.out',
      stagger: 0.09,
      onComplete: () => {
        /* All cards settled — now slide the expand panel open */
        wrap.classList.add('open');
        isOpen      = true;
        isAnimating = false;
      },
    });
  }

  function closePanel() {
    if (!isOpen || isAnimating) return;
    isAnimating = true;

    /* Close the expand panel, keep image visible during transition */
    wrap.classList.remove('open');
    wrap.classList.add('closing');

    function onTransitionEnd(e) {
      if (e.propertyName !== 'max-width') return;
      wrap.classList.remove('closing');
      panel.removeEventListener('transitionend', onTransitionEnd);
    }
    panel.addEventListener('transitionend', onTransitionEnd);

    /* After expand has slid away, animate cards back to horizontal */
    setTimeout(() => {
      const before = cards.map(c => c.getBoundingClientRect());
      wrap.classList.remove('layout-ready');
      /* Clear the locked width so cards return to natural grid sizing */
      cards.forEach(c => { c.style.width = ''; });
      const after = cards.map(c => c.getBoundingClientRect());

      cards.forEach((card, i) => {
        gsap.set(card, {
          x: before[i].left - after[i].left,
          y: before[i].top  - after[i].top,
        });
      });

      gsap.to(cards, {
        x: 0, y: 0,
        duration: 0.32,
        ease: 'power2.out',
        stagger: { each: 0.09, from: 'end' },
        onComplete: () => { isAnimating = false; },
      });

      isOpen = false;
    }, 1200);
  }

  function scheduleClose() {
    closeTimer = setTimeout(closePanel, 300);
  }

  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
      openPanel(card.dataset.plugin);
    });
    card.addEventListener('mouseleave', scheduleClose);
  });

  panel.addEventListener('mouseenter', () => { if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; } });
  panel.addEventListener('mouseleave', scheduleClose);
})();


/* ─── 9. EXT EXPAND PANEL ────────────────────────────────── */
(function initExtPreview() {
  const panel = document.getElementById('ext-expand');
  const img   = document.getElementById('ext-img');
  const icon  = document.getElementById('ext-icon');
  const title = document.getElementById('ext-title');
  const desc  = document.getElementById('ext-desc');
  if (!panel) return;

  const DATA = {
    chrome:  { icon: '<i class="fab fa-chrome"></i>',          title: 'CHROME EXTENSION',  desc: 'Spot a code snippet while browsing? Visualize it in one click — a floating panel opens right on the page, no tab switching.', imageDark: 'images/chrome-dark.png', imageLight: 'images/chrome-light.png' },
    firefox: { icon: '<i class="fab fa-firefox-browser"></i>', title: 'FIREFOX EXTENSION', desc: 'Browse any tutorial or documentation site and visualize code snippets instantly — without leaving the page.',              imageDark: 'images/chrome-dark.png', imageLight: 'images/chrome-light.png' },
  };

  let closeTimer = null;

  function isDarkTheme() { return document.documentElement.getAttribute('data-theme') !== 'light'; }

  function showFor(card) {
    const key = card.dataset.ext;
    const d = DATA[key];
    if (!d) return;
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }

    const src = isDarkTheme() ? d.imageDark : d.imageLight;
    icon.innerHTML    = d.icon;
    title.textContent = d.title;
    desc.textContent  = d.desc;
    img.classList.remove('loaded');
    img.onload = () => img.classList.add('loaded');
    if (img.getAttribute('src') !== src) img.src = src;
    else img.classList.add('loaded');

    panel.classList.remove('closing');
    panel.classList.add('open');
  }

  function scheduleClose() {
    closeTimer = setTimeout(() => {
      panel.classList.remove('open');
      panel.classList.add('closing');
      function onEnd(e) {
        if (e.propertyName !== 'height') return;
        panel.classList.remove('closing');
        panel.removeEventListener('transitionend', onEnd);
      }
      panel.addEventListener('transitionend', onEnd);
      closeTimer = null;
    }, 300);
  }

  document.querySelectorAll('.ext-card[data-ext]').forEach(card => {
    card.addEventListener('mouseenter', () => showFor(card));
    card.addEventListener('mouseleave', scheduleClose);
  });

  panel.addEventListener('mouseenter', () => { if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; } });
  panel.addEventListener('mouseleave', scheduleClose);
})();


/* ─── 10. CONTACT MODAL ───────────────────────────────────── */
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
    status.textContent = 'Sending…';

    emailjs.send('service_0x98wpz', 'template_74vo1wg', { name, email, title: subject, message })
      .then(() => {
        status.style.color = '#00ff9d';
        status.textContent = '✓ Message sent — thank you!';
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


