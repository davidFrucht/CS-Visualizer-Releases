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


/* ─── 2. THREE.JS — MINIMAL PARTICLE GRID (disabled) ──────── */
(function initParticles() { return; // particles removed
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

    /* swap video */
    const videoSource = document.querySelector('#hero-right video source');
    if (videoSource) {
      videoSource.src = theme === 'dark' ? 'videos/cs-visualizor-dark.mp4' : 'videos/cs-visualizor-light.mp4';
      videoSource.parentElement.load(); // reload the video
    }

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

/* App replica cards */
ScrollTrigger.batch('.app-card', {
  onEnter: batch => gsap.fromTo(batch,
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out' }
  ),
  start: 'top 88%',
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


/* ─── DEMO SCROLL HELPER ─────────────────────────────────── */
function scrollToDemo() {
  const section = document.getElementById('testit');
  if (section) {
    lenis.scrollTo(section, { offset: -20, duration: 0.8 });
  }
}

/* ─── 12. FLOWCHART DEMO ─────────────────────────────────── */
(function initFlowchartDemo() {
  const appLanding = document.querySelector('.app-cards');
  const appTitle   = document.querySelector('.app-title');
  const appFooter  = document.querySelector('.app-footer');
  const demoView   = document.getElementById('demo-flow');
  const backBtn    = document.getElementById('demo-back-btn');
  const flowCard   = document.querySelector('.app-card.app-flow');

  if (!demoView || !flowCard) return;

  /* ── Pre-baked flowchart: FindMax(int[] arr) ── */
  const NODES = [
    { id: 'start',  label: 'START',                 type: 'start'    },
    { id: 'n1',     label: 'max = arr[0]',          type: 'process'  },
    { id: 'n2',     label: 'i = 1',                 type: 'process'  },
    { id: 'n3',     label: 'i < arr.Length?',        type: 'decision' },
    { id: 'n4',     label: 'arr[i] > max?',         type: 'decision' },
    { id: 'n5',     label: 'max = arr[i]',          type: 'process'  },
    { id: 'n6',     label: 'i++',                   type: 'process'  },
    { id: 'ret',    label: 'return max',            type: 'return'   },
    { id: 'end',    label: 'END',                   type: 'end'      },
  ];

  const EDGES = [
    { source: 'start', target: 'n1' },
    { source: 'n1',    target: 'n2' },
    { source: 'n2',    target: 'n3' },
    { source: 'n3',    target: 'n4',  label: 'true' },
    { source: 'n3',    target: 'ret', label: 'false' },
    { source: 'n4',    target: 'n5',  label: 'true' },
    { source: 'n4',    target: 'n6',  label: 'false' },
    { source: 'n5',    target: 'n6' },
    { source: 'n6',    target: 'n3' },
    { source: 'ret',   target: 'end' },
  ];

  /* Execution trace for arr = {3, 7, 2, 9, 4} */
  const TRACE = [
    { node: 'start', line: 1,  vars: {} },
    { node: 'n1',    line: 3,  vars: { max: 3, 'arr': '{3,7,2,9,4}' } },
    { node: 'n2',    line: 4,  vars: { max: 3, i: 1, 'arr': '{3,7,2,9,4}' } },
    { node: 'n3',    line: 4,  vars: { max: 3, i: 1 } },
    { node: 'n4',    line: 6,  vars: { max: 3, i: 1, 'arr[i]': 7 } },
    { node: 'n5',    line: 8,  vars: { max: 7, i: 1 } },
    { node: 'n6',    line: 4,  vars: { max: 7, i: 2 } },
    { node: 'n3',    line: 4,  vars: { max: 7, i: 2 } },
    { node: 'n4',    line: 6,  vars: { max: 7, i: 2, 'arr[i]': 2 } },
    { node: 'n6',    line: 4,  vars: { max: 7, i: 3 } },
    { node: 'n3',    line: 4,  vars: { max: 7, i: 3 } },
    { node: 'n4',    line: 6,  vars: { max: 7, i: 3, 'arr[i]': 9 } },
    { node: 'n5',    line: 8,  vars: { max: 9, i: 3 } },
    { node: 'n6',    line: 4,  vars: { max: 9, i: 4 } },
    { node: 'n3',    line: 4,  vars: { max: 9, i: 4 } },
    { node: 'n4',    line: 6,  vars: { max: 9, i: 4, 'arr[i]': 4 } },
    { node: 'n6',    line: 4,  vars: { max: 9, i: 5 } },
    { node: 'n3',    line: 4,  vars: { max: 9, i: 5 } },
    { node: 'ret',   line: 11, vars: { max: 9 } },
    { node: 'end',   line: 12, vars: { max: 9 } },
  ];

  const NODE_STYLES = {
    start:    { shape: 'ellipse',          bg: '#28c840', border: '#28c840' },
    end:      { shape: 'ellipse',          bg: '#ff5f57', border: '#ff5f57' },
    process:  { shape: 'round-rectangle',  bg: '#1e3a5f', border: '#4a9eff' },
    decision: { shape: 'diamond',          bg: '#3d2e00', border: '#ff9d00' },
    return:   { shape: 'round-rectangle',  bg: '#2d1b4e', border: '#a78bfa' },
  };

  let cy = null;
  let stepIndex = -1;
  let playTimer = null;
  let visited = new Set();

  function initCytoscape() {
    if (cy) { cy.destroy(); }

    const elements = [];

    NODES.forEach(n => {
      const s = NODE_STYLES[n.type];
      elements.push({
        data: { id: n.id, label: n.label, nodeType: n.type },
      });
    });

    EDGES.forEach((e, i) => {
      elements.push({
        data: { id: 'e' + i, source: e.source, target: e.target, label: e.label || '' },
      });
    });

    cy = cytoscape({
      container: document.getElementById('demo-cy'),
      elements: elements,
      layout: { name: 'dagre', rankDir: 'TB', nodeSep: 40, rankSep: 50 },
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-family': "'Share Tech Mono', monospace",
            'font-size': '10px',
            'color': '#c8d3f5',
            'text-wrap': 'wrap',
            'text-max-width': '100px',
            'width': 'label',
            'height': 'label',
            'padding': '14px',
            'background-color': '#1e3a5f',
            'border-width': 2,
            'border-color': '#4a9eff',
            'shape': 'round-rectangle',
            'transition-property': 'border-color, border-width, background-color, opacity',
            'transition-duration': '0.3s',
          }
        },
        /* Node type overrides */
        { selector: 'node[nodeType="start"]',    style: { 'shape': 'ellipse',         'background-color': '#0d3320', 'border-color': '#28c840' } },
        { selector: 'node[nodeType="end"]',      style: { 'shape': 'ellipse',         'background-color': '#3d1518', 'border-color': '#ff5f57' } },
        { selector: 'node[nodeType="decision"]', style: { 'shape': 'diamond',         'background-color': '#3d2e00', 'border-color': '#ff9d00', 'padding': '20px' } },
        { selector: 'node[nodeType="return"]',   style: { 'shape': 'round-rectangle', 'background-color': '#2d1b4e', 'border-color': '#a78bfa' } },
        /* Edges */
        {
          selector: 'edge',
          style: {
            'label': 'data(label)',
            'font-family': "'Share Tech Mono', monospace",
            'font-size': '9px',
            'color': '#7a8ab0',
            'text-margin-y': -8,
            'width': 1.5,
            'line-color': '#2a2a45',
            'target-arrow-color': '#2a2a45',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 0.8,
            'transition-property': 'line-color, target-arrow-color',
            'transition-duration': '0.3s',
          }
        },
        /* Highlight classes */
        { selector: '.node-active',  style: { 'border-color': '#ffe066', 'border-width': 3, 'background-color': '#3d3500' } },
        { selector: '.node-visited', style: { 'opacity': 0.45 } },
        { selector: '.edge-active',  style: { 'line-color': '#ffe066', 'target-arrow-color': '#ffe066', 'width': 2.5 } },
      ],
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      autoungrabify: true,
    });

    cy.fit(undefined, 30);
  }

  function updateStep() {
    if (!cy) return;

    /* Clear all highlights */
    cy.elements().removeClass('node-active node-visited edge-active');

    /* Mark visited */
    visited.forEach(id => {
      cy.getElementById(id).addClass('node-visited');
    });

    if (stepIndex < 0 || stepIndex >= TRACE.length) return;

    const step = TRACE[stepIndex];
    const node = cy.getElementById(step.node);

    /* Highlight active node */
    node.removeClass('node-visited');
    node.addClass('node-active');
    visited.add(step.node);

    /* Highlight incoming edge */
    if (stepIndex > 0) {
      const prevNodeId = TRACE[stepIndex - 1].node;
      const edge = cy.edges().filter(e =>
        e.data('source') === prevNodeId && e.data('target') === step.node
      );
      edge.addClass('edge-active');
    }

    /* Keep graph still — no panning */

    /* Highlight code line */
    document.querySelectorAll('.demo-code .line').forEach(l => l.classList.remove('active'));
    const activeLine = document.querySelector(`.demo-code .line[data-line="${step.line}"]`);
    if (activeLine) activeLine.classList.add('active');

    /* Update variables */
    const varsBody = document.getElementById('demo-vars-body');
    const entries = Object.entries(step.vars);
    if (entries.length === 0) {
      varsBody.innerHTML = '—';
    } else {
      varsBody.innerHTML = entries.map(([k, v]) =>
        `<span class="var-name">${k}</span> = <span class="var-value">${v}</span>`
      ).join('<br>');
    }
  }

  /* Controls */
  document.getElementById('demo-step').addEventListener('click', () => {
    if (stepIndex < TRACE.length - 1) { stepIndex++; updateStep(); }
  });

  document.getElementById('demo-prev').addEventListener('click', () => {
    if (stepIndex > 0) {
      /* Rebuild visited set up to previous step */
      stepIndex--;
      visited.clear();
      for (let i = 0; i <= stepIndex; i++) visited.add(TRACE[i].node);
      updateStep();
    }
  });

  document.getElementById('demo-reset').addEventListener('click', () => {
    stopPlay();
    stepIndex = -1;
    visited.clear();
    updateStep();
    document.querySelectorAll('.demo-code .line').forEach(l => l.classList.remove('active'));
    document.getElementById('demo-vars-body').innerHTML = '—';
    cy.elements().removeClass('node-active node-visited edge-active');
    cy.fit(undefined, 30);
  });

  const playBtn = document.getElementById('demo-play');

  function stopPlay() {
    if (playTimer) { clearInterval(playTimer); playTimer = null; }
    playBtn.innerHTML = '&#9654; PLAY';
    playBtn.classList.remove('playing');
  }

  playBtn.addEventListener('click', () => {
    if (playTimer) {
      stopPlay();
      return;
    }
    playBtn.innerHTML = '&#9632; STOP';
    playBtn.classList.add('playing');
    playTimer = setInterval(() => {
      if (stepIndex < TRACE.length - 1) {
        stepIndex++;
        updateStep();
      } else {
        stopPlay();
      }
    }, 700);
  });

  document.getElementById('demo-fit').addEventListener('click', () => {
    if (cy) cy.fit(undefined, 30);
  });

  /* Card click — open demo */
  flowCard.addEventListener('click', (e) => {
    e.preventDefault();
    appLanding.style.display = 'none';
    appTitle.style.display = 'none';
    appFooter.style.display = 'none';
    demoView.style.display = 'flex';

    /* Need to defer init so container has dimensions */
    setTimeout(() => {
      initCytoscape();
      stepIndex = -1;
      visited.clear();
    }, 50);
  });

  /* Back button */
  backBtn.addEventListener('click', () => {
    stopPlay();
    demoView.style.display = 'none';
    appLanding.style.display = '';
    appTitle.style.display = '';
    appFooter.style.display = '';
    stepIndex = -1;
    visited.clear();
    document.querySelectorAll('.demo-code .line').forEach(l => l.classList.remove('active'));
    document.getElementById('demo-vars-body').innerHTML = '—';
  });
})();


/* ─── 13. DATA STRUCTURES DEMO ───────────────────────────── */
(function initDSDemo() {
  const appLanding = document.querySelector('.app-cards');
  const appTitle   = document.querySelector('.app-title');
  const appFooter  = document.querySelector('.app-footer');
  const demoView   = document.getElementById('demo-ds');
  const dsCard     = document.querySelector('.app-card.app-ds');
  if (!demoView || !dsCard) return;

  const codeEl     = document.getElementById('ds-code');
  const headerEl   = document.getElementById('ds-code-header');
  const varsEl     = document.getElementById('ds-vars-body');
  const canvasEl   = document.getElementById('ds-canvas');
  const counterEl  = document.getElementById('ds-counter');
  const tabs       = document.querySelectorAll('.ds-tab');

  /* ── SVG helpers ── */
  const SVG_NS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs) {
    const e = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v);
    return e;
  }
  function svgText(x, y, text, attrs) {
    const t = svgEl('text', { x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#c8d3f5', 'font-family': "'Share Tech Mono', monospace", 'font-size': '13', ...attrs });
    t.textContent = text;
    return t;
  }

  const C = {
    node: '#1a3050', nodeBorder: '#4a9eff',
    nodeNew: '#0d3320', newBorder: '#28c840',
    fg2: '#7a8ab0', edge: '#2a2a45', arrow: '#4a9eff',
  };

  /* ── ARRAY ── */
  const DS_ARRAY = {
    fileName: 'ArrayDemo.cs',
    code: `<code><span class="line" data-line="1"><span class="kw">int</span>[] arr = <span class="kw">new</span> <span class="kw">int</span>[] {<span class="num">5</span>, <span class="num">3</span>, <span class="num">8</span>, <span class="num">1</span>, <span class="num">9</span>, <span class="num">2</span>};</span>
<span class="line" data-line="2">arr[<span class="num">2</span>] = <span class="num">7</span>;</span>
<span class="line" data-line="3">arr[<span class="num">4</span>] = <span class="num">4</span>;</span>
<span class="line" data-line="4"><span class="kw">int</span> temp = arr[<span class="num">0</span>];</span>
<span class="line" data-line="5">arr[<span class="num">0</span>] = arr[<span class="num">5</span>];</span>
<span class="line" data-line="6">arr[<span class="num">5</span>] = temp;</span></code>`,
    steps: [
      { line: 1, op: 'Initialize array', arr: [5,3,8,1,9,2], hl: -1, newIdxs: [0,1,2,3,4,5] },
      { line: 2, op: 'arr[2] = 7',       arr: [5,3,7,1,9,2], hl: 2,  newIdxs: [2] },
      { line: 3, op: 'arr[4] = 4',       arr: [5,3,7,1,4,2], hl: 4,  newIdxs: [4] },
      { line: 4, op: 'temp = arr[0]',    arr: [5,3,7,1,4,2], hl: 0,  newIdxs: [], vars: { temp: 5 } },
      { line: 5, op: 'arr[0] = arr[5]',  arr: [2,3,7,1,4,2], hl: 0,  newIdxs: [0] },
      { line: 6, op: 'arr[5] = temp',    arr: [2,3,7,1,4,5], hl: 5,  newIdxs: [5], vars: { temp: 5 } },
    ],
    render(step, svg) {
      const W = 54, H = 40, PAD = 20, GAP = 2;
      const arr = step.arr;
      const totalW = arr.length * (W + GAP) - GAP + PAD * 2;
      svg.setAttribute('viewBox', `0 0 ${totalW} ${H + 50}`);
      svg.setAttribute('width', totalW);
      arr.forEach((v, i) => {
        const x = PAD + i * (W + GAP);
        const isNew = step.newIdxs.includes(i);
        const isHl  = step.hl === i;
        const fill   = isHl ? '#3d3500' : isNew ? C.nodeNew : C.node;
        const stroke = isHl ? '#ffe066' : isNew ? C.newBorder : C.nodeBorder;
        svg.appendChild(svgEl('rect', { x, y: 24, width: W, height: H, rx: 4, fill, stroke, 'stroke-width': isHl ? 2.5 : 1.5 }));
        svg.appendChild(svgText(x + W/2, 44, String(v)));
        svg.appendChild(svgText(x + W/2, 14, String(i), { fill: C.fg2, 'font-size': '10' }));
      });
    }
  };

  /* ── LINKED LIST ── */
  const DS_LINKED = {
    fileName: 'LinkedList.cs',
    code: `<code><span class="line" data-line="1"><span class="kw">var</span> list = <span class="kw">new</span> LinkedList&lt;<span class="kw">int</span>&gt;();</span>
<span class="line" data-line="2">list.AddLast(<span class="num">10</span>);</span>
<span class="line" data-line="3">list.AddLast(<span class="num">20</span>);</span>
<span class="line" data-line="4">list.AddLast(<span class="num">30</span>);</span>
<span class="line" data-line="5">list.AddFirst(<span class="num">5</span>);</span>
<span class="line" data-line="6">list.Remove(<span class="num">20</span>);</span></code>`,
    steps: [
      { line: 1, op: 'Create empty list', nodes: [], newId: -1 },
      { line: 2, op: 'AddLast(10)',       nodes: [10], newId: 0 },
      { line: 3, op: 'AddLast(20)',       nodes: [10,20], newId: 1 },
      { line: 4, op: 'AddLast(30)',       nodes: [10,20,30], newId: 2 },
      { line: 5, op: 'AddFirst(5)',       nodes: [5,10,20,30], newId: 0 },
      { line: 6, op: 'Remove(20)',        nodes: [5,10,30], newId: -1 },
    ],
    render(step, svg) {
      const NW = 70, NH = 36, GAP = 50, PAD = 30;
      const nodes = step.nodes;
      const totalW = Math.max(200, nodes.length * (NW + GAP) - GAP + PAD * 2 + 50);
      svg.setAttribute('viewBox', `0 0 ${totalW} ${NH + 60}`);
      svg.setAttribute('width', totalW);
      if (nodes.length === 0) { svg.appendChild(svgText(totalW/2, 50, 'empty list', { fill: C.fg2, 'font-size': '11' })); return; }
      svg.appendChild(svgText(PAD + NW/2, 12, 'head', { fill: C.arrow, 'font-size': '10' }));
      nodes.forEach((v, i) => {
        const x = PAD + i * (NW + GAP);
        const isNew = step.newId === i;
        svg.appendChild(svgEl('rect', { x, y: 24, width: NW, height: NH, rx: 4, fill: isNew ? C.nodeNew : C.node, stroke: isNew ? C.newBorder : C.nodeBorder, 'stroke-width': 1.5 }));
        svg.appendChild(svgText(x + NW/2, 42, String(v)));
        if (i < nodes.length - 1) {
          const ax = x + NW;
          svg.appendChild(svgEl('line', { x1: ax, y1: 42, x2: ax + GAP - 8, y2: 42, stroke: C.arrow, 'stroke-width': 1.5 }));
          svg.appendChild(svgEl('polygon', { points: `${ax+GAP-8},38 ${ax+GAP},42 ${ax+GAP-8},46`, fill: C.arrow }));
        } else {
          const nx = x + NW + 10;
          svg.appendChild(svgEl('rect', { x: nx, y: 34, width: 30, height: 16, rx: 3, fill: 'none', stroke: C.fg2, 'stroke-width': 1, 'stroke-dasharray': '3,2' }));
          svg.appendChild(svgText(nx + 15, 42, 'null', { fill: C.fg2, 'font-size': '9' }));
        }
      });
    }
  };

  /* ── STACK ── */
  const DS_STACK = {
    fileName: 'StackDemo.cs',
    code: `<code><span class="line" data-line="1"><span class="kw">var</span> stack = <span class="kw">new</span> Stack&lt;<span class="kw">int</span>&gt;();</span>
<span class="line" data-line="2">stack.Push(<span class="num">10</span>);</span>
<span class="line" data-line="3">stack.Push(<span class="num">20</span>);</span>
<span class="line" data-line="4">stack.Push(<span class="num">30</span>);</span>
<span class="line" data-line="5"><span class="kw">int</span> top = stack.Pop();</span>
<span class="line" data-line="6">stack.Push(<span class="num">40</span>);</span></code>`,
    steps: [
      { line: 1, op: 'Create empty stack', nodes: [], newId: -1 },
      { line: 2, op: 'Push(10)',           nodes: [10], newId: 0 },
      { line: 3, op: 'Push(20)',           nodes: [20,10], newId: 0 },
      { line: 4, op: 'Push(30)',           nodes: [30,20,10], newId: 0 },
      { line: 5, op: 'Pop() → 30',        nodes: [20,10], newId: -1, vars: { top: 30 } },
      { line: 6, op: 'Push(40)',           nodes: [40,20,10], newId: 0 },
    ],
    render(step, svg) {
      const NW = 80, NH = 36, GAP = 6, PAD = 40;
      const nodes = step.nodes;
      const totalH = Math.max(120, nodes.length * (NH + GAP) + PAD * 2);
      svg.setAttribute('viewBox', `0 0 ${NW + PAD * 2 + 40} ${totalH}`);
      svg.setAttribute('width', NW + PAD * 2 + 40);
      if (nodes.length === 0) { svg.appendChild(svgText(PAD + NW/2 + 20, totalH/2, 'empty', { fill: C.fg2, 'font-size': '11' })); return; }
      svg.appendChild(svgText(20, PAD + NH/2, 'top', { fill: C.arrow, 'font-size': '10' }));
      svg.appendChild(svgEl('line', { x1: 32, y1: PAD + NH/2, x2: PAD - 4, y2: PAD + NH/2, stroke: C.arrow, 'stroke-width': 1, 'stroke-dasharray': '3,2' }));
      nodes.forEach((v, i) => {
        const x = PAD, y = PAD + i * (NH + GAP);
        const isNew = step.newId === i;
        svg.appendChild(svgEl('rect', { x, y, width: NW, height: NH, rx: 4, fill: isNew ? C.nodeNew : C.node, stroke: isNew ? C.newBorder : C.nodeBorder, 'stroke-width': 1.5 }));
        svg.appendChild(svgText(x + NW/2, y + NH/2, String(v)));
      });
    }
  };

  /* ── QUEUE ── */
  const DS_QUEUE = {
    fileName: 'QueueDemo.cs',
    code: `<code><span class="line" data-line="1"><span class="kw">var</span> queue = <span class="kw">new</span> Queue&lt;<span class="kw">int</span>&gt;();</span>
<span class="line" data-line="2">queue.Enqueue(<span class="num">10</span>);</span>
<span class="line" data-line="3">queue.Enqueue(<span class="num">20</span>);</span>
<span class="line" data-line="4">queue.Enqueue(<span class="num">30</span>);</span>
<span class="line" data-line="5"><span class="kw">int</span> front = queue.Dequeue();</span>
<span class="line" data-line="6">queue.Enqueue(<span class="num">40</span>);</span></code>`,
    steps: [
      { line: 1, op: 'Create empty queue', nodes: [], newId: -1 },
      { line: 2, op: 'Enqueue(10)',        nodes: [10], newId: 0 },
      { line: 3, op: 'Enqueue(20)',        nodes: [10,20], newId: 1 },
      { line: 4, op: 'Enqueue(30)',        nodes: [10,20,30], newId: 2 },
      { line: 5, op: 'Dequeue() → 10',    nodes: [20,30], newId: -1, vars: { front: 10 } },
      { line: 6, op: 'Enqueue(40)',        nodes: [20,30,40], newId: 2 },
    ],
    render(step, svg) {
      const NW = 70, NH = 36, GAP = 12, PAD = 30;
      const nodes = step.nodes;
      const totalW = Math.max(200, nodes.length * (NW + GAP) - GAP + PAD * 2 + 20);
      svg.setAttribute('viewBox', `0 0 ${totalW} ${NH + 60}`);
      svg.setAttribute('width', totalW);
      if (nodes.length === 0) { svg.appendChild(svgText(totalW/2, 50, 'empty', { fill: C.fg2, 'font-size': '11' })); return; }
      svg.appendChild(svgText(PAD + NW/2, 12, 'first', { fill: C.arrow, 'font-size': '10' }));
      if (nodes.length > 1) svg.appendChild(svgText(PAD + (nodes.length-1)*(NW+GAP) + NW/2, 12, 'last', { fill: '#ff9d00', 'font-size': '10' }));
      nodes.forEach((v, i) => {
        const x = PAD + i * (NW + GAP);
        const isNew = step.newId === i;
        svg.appendChild(svgEl('rect', { x, y: 24, width: NW, height: NH, rx: 4, fill: isNew ? C.nodeNew : C.node, stroke: isNew ? C.newBorder : C.nodeBorder, 'stroke-width': 1.5 }));
        svg.appendChild(svgText(x + NW/2, 42, String(v)));
        if (i < nodes.length - 1) {
          const ax = x + NW;
          svg.appendChild(svgEl('line', { x1: ax + 2, y1: 42, x2: ax + GAP - 6, y2: 42, stroke: C.arrow, 'stroke-width': 1.5 }));
          svg.appendChild(svgEl('polygon', { points: `${ax+GAP-6},38 ${ax+GAP},42 ${ax+GAP-6},46`, fill: C.arrow }));
        }
      });
    }
  };

  /* ── BINARY TREE ── */
  const DS_TREE = {
    fileName: 'BinaryTree.cs',
    code: `<code><span class="line" data-line="1"><span class="kw">var</span> root = <span class="kw">new</span> BinNode(<span class="num">10</span>);</span>
<span class="line" data-line="2">root.left = <span class="kw">new</span> BinNode(<span class="num">5</span>);</span>
<span class="line" data-line="3">root.right = <span class="kw">new</span> BinNode(<span class="num">15</span>);</span>
<span class="line" data-line="4">root.left.left = <span class="kw">new</span> BinNode(<span class="num">3</span>);</span>
<span class="line" data-line="5">root.left.right = <span class="kw">new</span> BinNode(<span class="num">7</span>);</span>
<span class="line" data-line="6">root.right.right = <span class="kw">new</span> BinNode(<span class="num">20</span>);</span></code>`,
    steps: [
      { line: 1, op: 'Create root(10)', tree: { v:10 }, newV: 10 },
      { line: 2, op: 'root.left = 5',   tree: { v:10, l:{ v:5 } }, newV: 5 },
      { line: 3, op: 'root.right = 15', tree: { v:10, l:{ v:5 }, r:{ v:15 } }, newV: 15 },
      { line: 4, op: 'left.left = 3',   tree: { v:10, l:{ v:5, l:{ v:3 } }, r:{ v:15 } }, newV: 3 },
      { line: 5, op: 'left.right = 7',  tree: { v:10, l:{ v:5, l:{ v:3 }, r:{ v:7 } }, r:{ v:15 } }, newV: 7 },
      { line: 6, op: 'right.right = 20',tree: { v:10, l:{ v:5, l:{ v:3 }, r:{ v:7 } }, r:{ v:15, r:{ v:20 } } }, newV: 20 },
    ],
    render(step, svg) {
      const R = 22, LVL_H = 70, PAD = 30;
      const tree = step.tree;
      if (!tree) { svg.setAttribute('viewBox', '0 0 200 80'); return; }
      const positions = [];
      function layout(node, depth, left, right) {
        if (!node) return;
        const mid = (left + right) / 2;
        positions.push({ x: mid, y: PAD + depth * LVL_H, v: node.v, node });
        layout(node.l, depth + 1, left, mid);
        layout(node.r, depth + 1, mid, right);
      }
      const depth = (function d(n) { return n ? 1 + Math.max(d(n.l), d(n.r)) : 0; })(tree);
      const W = Math.max(300, Math.pow(2, depth) * 60);
      layout(tree, 0, 0, W);
      const maxY = positions.reduce((m, p) => Math.max(m, p.y), 0);
      svg.setAttribute('viewBox', `0 0 ${W} ${maxY + R + PAD + 20}`);
      svg.setAttribute('width', W);
      svg.appendChild(svgText(positions[0].x, positions[0].y - R - 10, 'root', { fill: C.arrow, 'font-size': '10' }));
      function drawEdges(node, px, py) {
        if (!node) return;
        const pos = positions.find(p => p.node === node);
        if (px !== undefined) svg.appendChild(svgEl('line', { x1: px, y1: py + R, x2: pos.x, y2: pos.y - R, stroke: C.edge, 'stroke-width': 1.5 }));
        drawEdges(node.l, pos.x, pos.y);
        drawEdges(node.r, pos.x, pos.y);
      }
      drawEdges(tree);
      positions.forEach(p => {
        const isNew = p.v === step.newV;
        svg.appendChild(svgEl('circle', { cx: p.x, cy: p.y, r: R, fill: isNew ? C.nodeNew : C.node, stroke: isNew ? C.newBorder : C.nodeBorder, 'stroke-width': 1.5 }));
        svg.appendChild(svgText(p.x, p.y, String(p.v)));
      });
    }
  };

  const DS_DATA = { array: DS_ARRAY, linked: DS_LINKED, stack: DS_STACK, queue: DS_QUEUE, tree: DS_TREE };
  let activeDS = 'array';
  let dsStep = -1;
  let dsPlayTimer = null;

  function loadDS(key) {
    activeDS = key;
    dsStep = -1;
    stopDSPlay();
    const ds = DS_DATA[key];
    codeEl.innerHTML = ds.code;
    headerEl.textContent = ds.fileName;
    varsEl.innerHTML = '—';
    canvasEl.innerHTML = '';
    counterEl.textContent = `0 / ${ds.steps.length}`;
    tabs.forEach(t => t.classList.toggle('active', t.dataset.ds === key));
  }

  function renderDSStep() {
    const ds = DS_DATA[activeDS];
    canvasEl.innerHTML = '';
    if (dsStep < 0 || dsStep >= ds.steps.length) { counterEl.textContent = `0 / ${ds.steps.length}`; return; }
    const step = ds.steps[dsStep];
    counterEl.textContent = `${dsStep + 1} / ${ds.steps.length}`;
    codeEl.querySelectorAll('.line').forEach(l => l.classList.remove('active'));
    const line = codeEl.querySelector(`.line[data-line="${step.line}"]`);
    if (line) line.classList.add('active');
    varsEl.innerHTML = step.vars
      ? Object.entries(step.vars).map(([k,v]) => `<span class="var-name">${k}</span> = <span class="var-value">${v}</span>`).join('<br>')
      : `<span class="var-name">op</span> = <span class="var-value">${step.op}</span>`;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    ds.render(step, svg);
    canvasEl.appendChild(svg);
  }

  function stopDSPlay() {
    if (dsPlayTimer) { clearInterval(dsPlayTimer); dsPlayTimer = null; }
    const btn = document.getElementById('ds-play');
    btn.innerHTML = '&#9654; PLAY'; btn.classList.remove('playing');
  }

  document.getElementById('ds-step').addEventListener('click', () => {
    if (dsStep < DS_DATA[activeDS].steps.length - 1) { dsStep++; renderDSStep(); }
  });
  document.getElementById('ds-prev').addEventListener('click', () => {
    if (dsStep > 0) { dsStep--; renderDSStep(); }
  });
  document.getElementById('ds-reset').addEventListener('click', () => {
    stopDSPlay(); dsStep = -1; renderDSStep();
    codeEl.querySelectorAll('.line').forEach(l => l.classList.remove('active'));
    varsEl.innerHTML = '—'; canvasEl.innerHTML = '';
    counterEl.textContent = `0 / ${DS_DATA[activeDS].steps.length}`;
  });
  document.getElementById('ds-play').addEventListener('click', () => {
    if (dsPlayTimer) { stopDSPlay(); return; }
    const btn = document.getElementById('ds-play');
    btn.innerHTML = '&#9632; STOP'; btn.classList.add('playing');
    dsPlayTimer = setInterval(() => {
      if (dsStep < DS_DATA[activeDS].steps.length - 1) { dsStep++; renderDSStep(); }
      else stopDSPlay();
    }, 800);
  });
  tabs.forEach(t => t.addEventListener('click', () => loadDS(t.dataset.ds)));

  dsCard.addEventListener('click', (e) => {
    e.preventDefault();
    appLanding.style.display = 'none';
    appTitle.style.display = 'none';
    appFooter.style.display = 'none';
    demoView.style.display = 'flex';
    loadDS('array');
  });

  document.getElementById('demo-ds-back').addEventListener('click', () => {
    stopDSPlay();
    demoView.style.display = 'none';
    appLanding.style.display = '';
    appTitle.style.display = '';
    appFooter.style.display = '';
  });
})();


/* ─── 14. OOP DEMO ───────────────────────────────────────── */
(function initOOPDemo() {
  const appLanding = document.querySelector('.app-cards');
  const appTitle   = document.querySelector('.app-title');
  const appFooter  = document.querySelector('.app-footer');
  const demoView   = document.getElementById('demo-oop');
  const oopCard    = document.querySelector('.app-card.app-oop');
  if (!demoView || !oopCard) return;

  const codeEl    = document.getElementById('oop-code');
  const varsEl    = document.getElementById('oop-vars-body');
  const canvasEl  = document.getElementById('oop-canvas');
  const counterEl = document.getElementById('oop-counter');
  const tabs      = document.querySelectorAll('#oop-tabs .ds-tab');

  const SVG_NS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs) {
    const e = document.createElementNS(SVG_NS, tag);
    for (const [k,v] of Object.entries(attrs || {})) e.setAttribute(k, v);
    return e;
  }
  function svgText(x, y, text, attrs) {
    const t = svgEl('text', { x, y, 'dominant-baseline': 'central', fill: '#c8d3f5',
      'font-family': "'Share Tech Mono', monospace", 'font-size': '11', ...attrs });
    t.textContent = text;
    return t;
  }

  const PURPLE = '#7b2fff';
  const CYAN   = '#00d4ff';
  const GREEN  = '#28c840';

  const sceneContainer = document.getElementById('oop-scene-container');

  let activeTab = 'diagram';
  let oopStep = -1;
  let oopPlayTimer = null;

  /* ── THREE.JS SCENE ── */
  let sceneInited = false;
  let threeScene, threeCamera, threeRenderer, threeControls, dogGroup, parentRing, methodBubble;
  let sceneAnimId = null;

  function initScene() {
    if (sceneInited) return;
    sceneInited = true;

    threeScene = new THREE.Scene();
    threeScene.fog = new THREE.FogExp2(0x0d0d14, 0.02);

    threeCamera = new THREE.PerspectiveCamera(48, sceneContainer.clientWidth / sceneContainer.clientHeight, 0.1, 100);
    threeCamera.position.set(0, 5, 12);
    threeCamera.lookAt(0, 0.5, 0);

    threeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    threeRenderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
    threeRenderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    threeRenderer.setClearColor(0x0d0d14, 1);
    sceneContainer.appendChild(threeRenderer.domElement);

    /* Lights */
    threeScene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dirLight = new THREE.DirectionalLight(0x88ccff, 0.8);
    dirLight.position.set(5, 12, 8);
    threeScene.add(dirLight);
    const dirLight2 = new THREE.DirectionalLight(0x7b2fff, 0.25);
    dirLight2.position.set(-5, 4, -8);
    threeScene.add(dirLight2);

    /* Grid floor */
    const grid = new THREE.GridHelper(20, 40, 0x1a1a3a, 0x1a1a3a);
    grid.position.y = -1.5;
    threeScene.add(grid);

    /* Build dog avatar */
    dogGroup = new THREE.Group();
    const dogMat  = new THREE.MeshPhongMaterial({ color: 0x8B6914, flatShading: true });
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x00d4ff });

    function addPart(geo, px, py, pz, rx, ry, rz) {
      const mesh = new THREE.Mesh(geo, dogMat);
      mesh.position.set(px, py, pz);
      if (rx) mesh.rotation.x = rx;
      if (ry) mesh.rotation.y = ry;
      if (rz) mesh.rotation.z = rz;
      dogGroup.add(mesh);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
      edges.position.copy(mesh.position);
      edges.rotation.copy(mesh.rotation);
      dogGroup.add(edges);
    }

    /* Body */
    addPart(new THREE.BoxGeometry(1.4, 0.8, 0.72), 0, 0, 0);
    /* Head */
    addPart(new THREE.BoxGeometry(0.7, 0.7, 0.66), 0.9, 0.32, 0);
    /* Snout */
    addPart(new THREE.BoxGeometry(0.32, 0.22, 0.42), 1.28, 0.06, 0);
    /* Ears */
    addPart(new THREE.BoxGeometry(0.12, 0.28, 0.18), 0.78, 0.7, 0.22, 0, 0, 0.15);
    addPart(new THREE.BoxGeometry(0.12, 0.28, 0.18), 0.78, 0.7, -0.22, 0, 0, -0.15);
    /* Legs */
    addPart(new THREE.BoxGeometry(0.19, 0.5, 0.19), -0.5, -0.6, 0.22);
    addPart(new THREE.BoxGeometry(0.19, 0.5, 0.19), -0.5, -0.6, -0.22);
    addPart(new THREE.BoxGeometry(0.19, 0.5, 0.19), 0.5, -0.6, 0.22);
    addPart(new THREE.BoxGeometry(0.19, 0.5, 0.19), 0.5, -0.6, -0.22);
    /* Eyes */
    const eyeMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
    const eyeGeo = new THREE.SphereGeometry(0.055, 8, 8);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(1.22, 0.42, 0.2);
    dogGroup.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(1.22, 0.42, -0.2);
    dogGroup.add(eyeR);

    /* Tail */
    addPart(new THREE.BoxGeometry(0.1, 0.4, 0.1), -0.8, 0.4, 0, 0, 0, 0.4);

    dogGroup.position.y = 0.4;
    threeScene.add(dogGroup);

    /* Parent class halo ring */
    const ringGeo = new THREE.TorusGeometry(2.0, 0.05, 8, 64);
    const ringMat = new THREE.MeshPhongMaterial({ color: 0x7b2fff, emissive: 0x7b2fff, emissiveIntensity: 0.5, transparent: true, opacity: 0.45 });
    parentRing = new THREE.Mesh(ringGeo, ringMat);
    parentRing.rotation.x = -Math.PI / 2;
    parentRing.position.y = -1.05;
    threeScene.add(parentRing);

    /* Inner ring */
    const ring2Geo = new THREE.TorusGeometry(1.7, 0.03, 8, 64);
    const ring2Mat = new THREE.MeshPhongMaterial({ color: 0x7b2fff, transparent: true, opacity: 0.2 });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = -Math.PI / 2;
    ring2.position.y = -1.05;
    threeScene.add(ring2);

    /* Create HTML labels */
    const labelDiv = document.createElement('div');
    labelDiv.className = 'scene-label';
    labelDiv.innerHTML = '<span class="sl-type">Dog</span><br><span class="sl-parent">«Animal»</span>';
    labelDiv.style.left = '50%';
    labelDiv.style.top = '60px';
    sceneContainer.appendChild(labelDiv);

    /* Method bubble (hidden initially) */
    methodBubble = document.createElement('div');
    methodBubble.className = 'scene-label';
    methodBubble.style.display = 'none';
    methodBubble.style.left = '50%';
    methodBubble.style.top = '30px';
    sceneContainer.appendChild(methodBubble);

    /* OrbitControls — only if available */
    if (typeof THREE.OrbitControls !== 'undefined') {
      threeControls = new THREE.OrbitControls(threeCamera, threeRenderer.domElement);
      threeControls.enableDamping = true;
      threeControls.maxPolarAngle = Math.PI * 0.78;
      threeControls.target.set(0, 0.5, 0);
    }

    function animate() {
      sceneAnimId = requestAnimationFrame(animate);
      if (threeControls) threeControls.update();

      /* Slow rotate ring */
      if (parentRing) parentRing.rotation.z += 0.003;

      threeRenderer.render(threeScene, threeCamera);
    }
    animate();

    /* Resize */
    const ro = new ResizeObserver(() => {
      if (sceneContainer.style.display === 'none') return;
      const w = sceneContainer.clientWidth, h = sceneContainer.clientHeight;
      threeCamera.aspect = w / h;
      threeCamera.updateProjectionMatrix();
      threeRenderer.setSize(w, h);
    });
    ro.observe(sceneContainer);
  }

  function updateSceneStep() {
    if (!sceneInited || !dogGroup) return;

    /* Reset */
    dogGroup.visible = false;
    parentRing.visible = false;
    methodBubble.style.display = 'none';

    /* Edge color */
    const edgeColor = new THREE.Color(0x00d4ff);

    if (oopStep < 0) return;
    const step = TRACE[Math.min(oopStep, TRACE.length - 1)];

    if (oopStep >= 1) {
      /* Object exists */
      dogGroup.visible = true;
      parentRing.visible = true;

      /* Set edge colors based on state */
      const isActive = step.dispatch;
      const col = isActive ? 0xff9d00 : 0x00d4ff;
      dogGroup.children.forEach(c => {
        if (c.isLineSegments) c.material.color.setHex(col);
      });
    }

    if (step.dispatch || (oopStep === 4)) {
      methodBubble.style.display = '';
      methodBubble.innerHTML = oopStep === 4
        ? '<span class="sl-badge">Woof! 🐕</span>'
        : '<span class="sl-badge">virtual dispatch → Dog.Speak()</span>';
    }
  }

  /* ── STATIC DIAGRAM ── */
  function renderDiagram(svg) {
    const W = 600, H = 380;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', W);

    /* Animal class box (abstract) */
    const ax = 200, ay = 20, aw = 200, ah = 150;
    svg.appendChild(svgEl('rect', { x: ax, y: ay, width: aw, height: ah, rx: 4, fill: '#1a1a2e', stroke: PURPLE, 'stroke-width': 1.5 }));
    /* stereotype */
    svg.appendChild(svgText(ax + aw/2, ay + 16, '«abstract»', { 'text-anchor': 'middle', fill: PURPLE, 'font-size': '9', 'font-style': 'italic' }));
    /* name */
    svg.appendChild(svgText(ax + aw/2, ay + 36, 'Animal', { 'text-anchor': 'middle', fill: '#c8d3f5', 'font-size': '14', 'font-weight': 'bold' }));
    /* divider */
    svg.appendChild(svgEl('line', { x1: ax, y1: ay + 52, x2: ax + aw, y2: ay + 52, stroke: '#2a2a45', 'stroke-width': 1 }));
    /* fields */
    svg.appendChild(svgText(ax + 12, ay + 72, '+ Name : string', { 'text-anchor': 'start', fill: '#7a8ab0', 'font-size': '11' }));
    /* divider */
    svg.appendChild(svgEl('line', { x1: ax, y1: ay + 90, x2: ax + aw, y2: ay + 90, stroke: '#2a2a45', 'stroke-width': 1 }));
    /* methods */
    svg.appendChild(svgText(ax + 12, ay + 110, '+ Speak() : void', { 'text-anchor': 'start', fill: '#7a8ab0', 'font-size': '11' }));
    svg.appendChild(svgText(ax + aw - 12, ay + 110, '«virt»', { 'text-anchor': 'end', fill: PURPLE, 'font-size': '9' }));
    svg.appendChild(svgText(ax + 12, ay + 130, '+ Animal()', { 'text-anchor': 'start', fill: '#7a8ab0', 'font-size': '11' }));
    svg.appendChild(svgText(ax + aw - 12, ay + 130, '«ctor»', { 'text-anchor': 'end', fill: '#7a8ab0', 'font-size': '9' }));

    /* Dog class box */
    const dx = 200, dy = 230, dw = 200, dh = 120;
    svg.appendChild(svgEl('rect', { x: dx, y: dy, width: dw, height: dh, rx: 4, fill: '#1a1a2e', stroke: CYAN, 'stroke-width': 1.5 }));
    svg.appendChild(svgText(dx + dw/2, dy + 22, 'Dog', { 'text-anchor': 'middle', fill: '#c8d3f5', 'font-size': '14', 'font-weight': 'bold' }));
    svg.appendChild(svgEl('line', { x1: dx, y1: dy + 40, x2: dx + dw, y2: dy + 40, stroke: '#2a2a45', 'stroke-width': 1 }));
    svg.appendChild(svgText(dx + 12, dy + 60, '+ Speak() : void', { 'text-anchor': 'start', fill: '#7a8ab0', 'font-size': '11' }));
    svg.appendChild(svgText(dx + dw - 12, dy + 60, '«ovr»', { 'text-anchor': 'end', fill: GREEN, 'font-size': '9' }));
    svg.appendChild(svgText(dx + 12, dy + 80, '+ Dog()', { 'text-anchor': 'start', fill: '#7a8ab0', 'font-size': '11' }));
    svg.appendChild(svgText(dx + dw - 12, dy + 80, '«ctor»', { 'text-anchor': 'end', fill: '#7a8ab0', 'font-size': '9' }));

    /* Inheritance arrow (Dog → Animal) */
    const arrowX = dx + dw/2;
    svg.appendChild(svgEl('line', { x1: arrowX, y1: dy, x2: arrowX, y2: ay + ah + 8, stroke: CYAN, 'stroke-width': 1.5 }));
    svg.appendChild(svgEl('polygon', { points: `${arrowX-6},${ay+ah+8} ${arrowX},${ay+ah} ${arrowX+6},${ay+ah+8}`, fill: 'none', stroke: CYAN, 'stroke-width': 1.5 }));
    svg.appendChild(svgText(arrowX + 10, ay + ah + (dy - ay - ah)/2, 'inherits', { 'text-anchor': 'start', fill: '#7a8ab0', 'font-size': '9' }));
  }

  /* ── RUNTIME TRACE ── */
  const TRACE = [
    { line: 13, event: 'Create Dog object', heap: null, stack: [], vars: {} },
    { line: 13, event: 'new Dog() → obj created', heap: { type: 'Dog', fields: { Name: 'null' } }, stack: ['Dog.ctor()'], vars: { a: '→ Dog#1' } },
    { line: 14, event: 'a.Name = "Buddy"', heap: { type: 'Dog', fields: { Name: '"Buddy"' } }, stack: [], vars: { a: '→ Dog#1' }, hlField: 'Name' },
    { line: 15, event: 'a.Speak() — virtual dispatch', heap: { type: 'Dog', fields: { Name: '"Buddy"' } }, stack: ['Dog.Speak()'], vars: { a: '→ Dog#1' }, dispatch: true },
    { line: 10, event: 'Console.Write("Woof!")', heap: { type: 'Dog', fields: { Name: '"Buddy"' } }, stack: ['Dog.Speak()'], vars: { a: '→ Dog#1', output: '"Woof!"' } },
    { line: 15, event: 'Speak() returned', heap: { type: 'Dog', fields: { Name: '"Buddy"' } }, stack: [], vars: { a: '→ Dog#1', output: '"Woof!"' } },
  ];

  function renderRuntime(step, svg) {
    const W = 650, H = 340;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', W);

    if (!step.heap) {
      svg.appendChild(svgText(W/2, H/2, 'Press STEP to begin', { 'text-anchor': 'middle', fill: '#7a8ab0', 'font-size': '12' }));
      return;
    }

    /* ── STACK SIDE (left) ── */
    svg.appendChild(svgText(30, 22, 'CALL STACK', { 'text-anchor': 'start', fill: '#7a8ab0', 'font-size': '10', 'letter-spacing': '2px' }));
    svg.appendChild(svgEl('line', { x1: 20, y1: 32, x2: 250, y2: 32, stroke: '#2a2a45', 'stroke-width': 1 }));

    if (step.stack.length === 0) {
      svg.appendChild(svgText(135, 60, '(empty)', { 'text-anchor': 'middle', fill: '#3f3f5f', 'font-size': '11' }));
    } else {
      step.stack.forEach((frame, i) => {
        const fy = 44 + i * 46;
        const borderColor = step.dispatch ? '#ff9d00' : CYAN;
        svg.appendChild(svgEl('rect', { x: 24, y: fy, width: 222, height: 38, rx: 3, fill: '#12121e', stroke: borderColor, 'stroke-width': 1.5 }));
        svg.appendChild(svgText(135, fy + 14, frame, { 'text-anchor': 'middle', fill: '#c8d3f5', 'font-size': '11' }));
        if (step.dispatch) {
          svg.appendChild(svgText(135, fy + 28, '(virtual → Dog)', { 'text-anchor': 'middle', fill: '#ff9d00', 'font-size': '9' }));
        }
      });
    }

    /* Variables */
    const varY = 140;
    svg.appendChild(svgText(30, varY, 'VARIABLES', { 'text-anchor': 'start', fill: '#7a8ab0', 'font-size': '10', 'letter-spacing': '2px' }));
    svg.appendChild(svgEl('line', { x1: 20, y1: varY + 10, x2: 250, y2: varY + 10, stroke: '#2a2a45', 'stroke-width': 1 }));
    let vi = 0;
    for (const [k, v] of Object.entries(step.vars)) {
      const vy = varY + 26 + vi * 20;
      svg.appendChild(svgText(30, vy, k, { 'text-anchor': 'start', fill: CYAN, 'font-size': '11' }));
      svg.appendChild(svgText(100, vy, ': ' + v, { 'text-anchor': 'start', fill: '#c8d3f5', 'font-size': '11' }));
      vi++;
    }

    /* Reference arrow from 'a' variable to heap */
    if (step.vars.a) {
      const arrowStartX = 246, arrowStartY = varY + 26;
      const arrowEndX = 320, arrowEndY = 80;
      svg.appendChild(svgEl('path', {
        d: `M${arrowStartX},${arrowStartY} C${arrowStartX+40},${arrowStartY} ${arrowEndX-40},${arrowEndY} ${arrowEndX},${arrowEndY}`,
        fill: 'none', stroke: CYAN, 'stroke-width': 1.5, 'stroke-dasharray': '4,3'
      }));
      svg.appendChild(svgEl('polygon', { points: `${arrowEndX-5},${arrowEndY-4} ${arrowEndX},${arrowEndY} ${arrowEndX-5},${arrowEndY+4}`, fill: CYAN }));
    }

    /* ── HEAP SIDE (right) ── */
    svg.appendChild(svgText(340, 22, 'HEAP', { 'text-anchor': 'start', fill: '#7a8ab0', 'font-size': '10', 'letter-spacing': '2px' }));
    svg.appendChild(svgEl('line', { x1: 320, y1: 32, x2: 620, y2: 32, stroke: '#2a2a45', 'stroke-width': 1 }));

    /* Object card */
    const ox = 330, oy = 44, ow = 270, oh = 130;
    svg.appendChild(svgEl('rect', { x: ox, y: oy, width: ow, height: oh, rx: 4, fill: '#12121e', stroke: CYAN, 'stroke-width': 1.5 }));

    /* Object header */
    svg.appendChild(svgEl('rect', { x: ox, y: oy, width: ow, height: 30, rx: 4, fill: '#0a2a4a' }));
    svg.appendChild(svgEl('rect', { x: ox, y: oy + 20, width: ow, height: 10, fill: '#0a2a4a' }));
    svg.appendChild(svgText(ox + 12, oy + 15, step.heap.type, { 'text-anchor': 'start', fill: CYAN, 'font-size': '13', 'font-weight': 'bold' }));
    svg.appendChild(svgText(ox + ow - 12, oy + 15, '#1', { 'text-anchor': 'end', fill: '#7a8ab0', 'font-size': '10' }));

    /* Fields */
    svg.appendChild(svgEl('line', { x1: ox, y1: oy + 30, x2: ox + ow, y2: oy + 30, stroke: '#2a2a45', 'stroke-width': 1 }));

    /* inherited from Animal label */
    svg.appendChild(svgText(ox + 12, oy + 48, 'inherited from Animal:', { 'text-anchor': 'start', fill: PURPLE, 'font-size': '9', 'font-style': 'italic' }));

    let fi = 0;
    for (const [fname, fval] of Object.entries(step.heap.fields)) {
      const fy = oy + 66 + fi * 22;
      const isHighlighted = step.hlField === fname;
      if (isHighlighted) {
        svg.appendChild(svgEl('rect', { x: ox + 4, y: fy - 10, width: ow - 8, height: 20, rx: 2, fill: 'rgba(0,212,255,.08)' }));
      }
      svg.appendChild(svgText(ox + 16, fy, '+ ' + fname, { 'text-anchor': 'start', fill: '#7a8ab0', 'font-size': '11' }));
      svg.appendChild(svgText(ox + ow - 16, fy, fval, { 'text-anchor': 'end', fill: isHighlighted ? GREEN : '#c8d3f5', 'font-size': '11' }));
      fi++;
    }

    /* VTable indicator */
    const vtY = oy + oh + 16;
    svg.appendChild(svgEl('rect', { x: ox, y: vtY, width: ow, height: 50, rx: 4, fill: '#12121e', stroke: '#2a2a45', 'stroke-width': 1 }));
    svg.appendChild(svgText(ox + 12, vtY + 16, 'vtable', { 'text-anchor': 'start', fill: '#7a8ab0', 'font-size': '10', 'letter-spacing': '1px' }));
    svg.appendChild(svgText(ox + 16, vtY + 36, 'Speak → Dog.Speak()', { 'text-anchor': 'start', fill: step.dispatch ? '#ff9d00' : '#7a8ab0', 'font-size': '11' }));

    /* Event label at bottom */
    svg.appendChild(svgText(W/2, H - 16, step.event, { 'text-anchor': 'middle', fill: CYAN, 'font-size': '10', 'letter-spacing': '1px' }));
  }

  function render() {
    /* Show/hide containers */
    canvasEl.style.display   = activeTab === 'scene' ? 'none' : '';
    sceneContainer.style.display = activeTab === 'scene' ? '' : 'none';

    if (activeTab === 'scene') {
      initScene();
      updateSceneStep();
      counterEl.textContent = oopStep < 0 ? `0 / ${TRACE.length}` : `${oopStep + 1} / ${TRACE.length}`;

      codeEl.querySelectorAll('.line').forEach(l => l.classList.remove('active'));
      if (oopStep >= 0) {
        const step = TRACE[oopStep];
        const line = codeEl.querySelector(`.line[data-line="${step.line}"]`);
        if (line) line.classList.add('active');
        varsEl.innerHTML = `<span class="var-name">event</span> = <span class="var-value">${step.event}</span>`;
      }
      return;
    }

    canvasEl.innerHTML = '';
    const svg = document.createElementNS(SVG_NS, 'svg');

    if (activeTab === 'diagram') {
      renderDiagram(svg);
      counterEl.textContent = 'Static';
    } else {
      if (oopStep < 0) {
        renderRuntime(TRACE[0], svg);
        counterEl.textContent = `0 / ${TRACE.length}`;
      } else {
        renderRuntime(TRACE[oopStep], svg);
        counterEl.textContent = `${oopStep + 1} / ${TRACE.length}`;
      }

      codeEl.querySelectorAll('.line').forEach(l => l.classList.remove('active'));
      if (oopStep >= 0) {
        const step = TRACE[oopStep];
        const line = codeEl.querySelector(`.line[data-line="${step.line}"]`);
        if (line) line.classList.add('active');
        varsEl.innerHTML = `<span class="var-name">event</span> = <span class="var-value">${step.event}</span>`;
      }
    }
    canvasEl.appendChild(svg);
  }

  function stopOOPPlay() {
    if (oopPlayTimer) { clearInterval(oopPlayTimer); oopPlayTimer = null; }
    const btn = document.getElementById('oop-play');
    btn.innerHTML = '&#9654; PLAY'; btn.classList.remove('playing');
  }

  document.getElementById('oop-step').addEventListener('click', () => {
    if (activeTab === 'diagram') { activeTab = 'runtime'; tabs.forEach(t => t.classList.toggle('active', t.dataset.oop === 'runtime')); oopStep = 0; render(); return; }
    if (oopStep < TRACE.length - 1) { oopStep++; render(); }
  });

  document.getElementById('oop-prev').addEventListener('click', () => { if (oopStep > 0) { oopStep--; render(); } });
  document.getElementById('oop-reset').addEventListener('click', () => {
    stopOOPPlay(); oopStep = -1;
    codeEl.querySelectorAll('.line').forEach(l => l.classList.remove('active'));
    varsEl.innerHTML = '—'; render();
  });
  document.getElementById('oop-play').addEventListener('click', () => {
    if (oopPlayTimer) { stopOOPPlay(); return; }
    if (activeTab === 'diagram') { activeTab = 'runtime'; tabs.forEach(t => t.classList.toggle('active', t.dataset.oop === 'runtime')); oopStep = -1; }
    const btn = document.getElementById('oop-play');
    btn.innerHTML = '&#9632; STOP'; btn.classList.add('playing');
    oopPlayTimer = setInterval(() => {
      if (oopStep < TRACE.length - 1) { oopStep++; render(); }
      else stopOOPPlay();
    }, 1000);
  });

  tabs.forEach(t => t.addEventListener('click', () => {
    activeTab = t.dataset.oop;
    tabs.forEach(tb => tb.classList.toggle('active', tb.dataset.oop === activeTab));
    if (activeTab === 'diagram') { oopStep = -1; stopOOPPlay(); }
    render();
  }));

  /* If stepping into scene tab, keep step synced */

  oopCard.addEventListener('click', (e) => {
    e.preventDefault();
    appLanding.style.display = 'none';
    appTitle.style.display = 'none';
    appFooter.style.display = 'none';
    demoView.style.display = 'flex';
    activeTab = 'diagram'; oopStep = -1;
    tabs.forEach(t => t.classList.toggle('active', t.dataset.oop === 'diagram'));
    varsEl.innerHTML = '—';
    setTimeout(render, 50);
  });

  document.getElementById('demo-oop-back').addEventListener('click', () => {
    stopOOPPlay();
    demoView.style.display = 'none';
    sceneContainer.style.display = 'none';
    appLanding.style.display = '';
    appTitle.style.display = '';
    appFooter.style.display = '';
    codeEl.querySelectorAll('.line').forEach(l => l.classList.remove('active'));
    varsEl.innerHTML = '—';
  });
})();


/* ─── 15. RECURSION DEMO ─────────────────────────────────── */
(function initRecDemo() {
  const appLanding = document.querySelector('.app-cards');
  const appTitle   = document.querySelector('.app-title');
  const appFooter  = document.querySelector('.app-footer');
  const demoView   = document.getElementById('demo-rec');
  const recCard    = document.querySelector('.app-card.app-rec');
  if (!demoView || !recCard) return;

  const codeEl    = document.getElementById('rec-code');
  const stackEl   = document.getElementById('rec-stack');
  const statsEl   = document.getElementById('rec-stats');
  const canvasEl  = document.getElementById('rec-canvas');
  const counterEl = document.getElementById('rec-counter');

  const SVG_NS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs) {
    const e = document.createElementNS(SVG_NS, tag);
    for (const [k,v] of Object.entries(attrs || {})) e.setAttribute(k, v);
    return e;
  }
  function svgText(x, y, text, attrs) {
    const t = svgEl('text', { x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central',
      fill: '#c8d3f5', 'font-family': "'Share Tech Mono', monospace", 'font-size': '11', ...attrs });
    t.textContent = text;
    return t;
  }

  /* ── Fib(4) call tree ──
        fib(4)
       /      \
    fib(3)    fib(2)
    /   \     /   \
  fib(2) fib(1) fib(1) fib(0)
  /   \
fib(1) fib(0)
  */

  const CALLS = {
    0: { id:0, n:4, parent:null, children:[1,5], ret:3 },
    1: { id:1, n:3, parent:0,    children:[2,4], ret:2 },
    2: { id:2, n:2, parent:1,    children:[3,8], ret:1 },
    3: { id:3, n:1, parent:2,    children:[],    ret:1 },
    4: { id:4, n:1, parent:1,    children:[],    ret:1 },
    5: { id:5, n:2, parent:0,    children:[6,7], ret:1 },
    6: { id:6, n:1, parent:5,    children:[],    ret:1 },
    7: { id:7, n:0, parent:5,    children:[],    ret:0 },
    8: { id:8, n:0, parent:2,    children:[],    ret:0 },
  };

  /* Events: call/return sequence */
  const EVENTS = [
    { type:'call',   id:0, stack:[0] },
    { type:'call',   id:1, stack:[0,1] },
    { type:'call',   id:2, stack:[0,1,2] },
    { type:'call',   id:3, stack:[0,1,2,3] },
    { type:'return', id:3, stack:[0,1,2] },
    { type:'call',   id:8, stack:[0,1,2,8] },
    { type:'return', id:8, stack:[0,1,2] },
    { type:'return', id:2, stack:[0,1] },
    { type:'call',   id:4, stack:[0,1,4] },
    { type:'return', id:4, stack:[0,1] },
    { type:'return', id:1, stack:[0] },
    { type:'call',   id:5, stack:[0,5] },
    { type:'call',   id:6, stack:[0,5,6] },
    { type:'return', id:6, stack:[0,5] },
    { type:'call',   id:7, stack:[0,5,7] },
    { type:'return', id:7, stack:[0,5] },
    { type:'return', id:5, stack:[0] },
    { type:'return', id:0, stack:[] },
  ];

  /* Pre-compute callStep / returnStep */
  const callStep = {}, returnStep = {};
  EVENTS.forEach((e, i) => {
    if (e.type === 'call')   callStep[e.id] = i;
    if (e.type === 'return') returnStep[e.id] = i;
  });

  /* Node state at a given step */
  function nodeState(id, step) {
    if (step < 0 || (callStep[id] ?? Infinity) > step) return 'hidden';
    if ((returnStep[id] ?? Infinity) <= step) {
      return CALLS[id].children.length === 0 ? 'base_case' : 'returned';
    }
    const stk = EVENTS[step].stack;
    if (stk[stk.length - 1] === id) return 'active';
    if (stk.includes(id)) return 'waiting';
    return 'hidden';
  }

  const COLORS = {
    hidden:    { fill: 'transparent', stroke: 'transparent', text: 'transparent' },
    active:    { fill: '#0d2a35', stroke: '#00d4ff', text: '#00d4ff' },
    waiting:   { fill: '#0a1820', stroke: '#336688', text: '#4a7a99' },
    base_case: { fill: '#0d2e1a', stroke: '#00ff9d', text: '#00ff9d' },
    returned:  { fill: '#1a0d2e', stroke: '#7b2fff', text: '#b070ff' },
  };

  /* Layout: position each call node in a tree */
  const NW = 100, NH = 60, GAP_X = 16, GAP_Y = 36;

  function layoutTree() {
    const pos = {};
    /* Count leaves under each node */
    function leafCount(id) {
      const c = CALLS[id];
      if (c.children.length === 0) return 1;
      return c.children.reduce((s, ch) => s + leafCount(ch), 0);
    }

    function layout(id, depth, leftX) {
      const c = CALLS[id];
      const leaves = leafCount(id);
      const totalW = leaves * (NW + GAP_X) - GAP_X;

      if (c.children.length === 0) {
        pos[id] = { x: leftX + NW/2, y: depth * (NH + GAP_Y), w: NW };
      } else {
        let cx = leftX;
        c.children.forEach(ch => {
          const chLeaves = leafCount(ch);
          const chW = chLeaves * (NW + GAP_X) - GAP_X;
          layout(ch, depth + 1, cx);
          cx += chW + GAP_X;
        });
        /* Center parent over children */
        const firstChild = pos[c.children[0]];
        const lastChild  = pos[c.children[c.children.length - 1]];
        pos[id] = { x: (firstChild.x + lastChild.x) / 2, y: depth * (NH + GAP_Y), w: NW };
      }
    }

    layout(0, 0, 0);
    return pos;
  }

  let recStep = -1;
  let recPlayTimer = null;

  function renderRec() {
    canvasEl.innerHTML = '';
    counterEl.textContent = recStep < 0 ? `0 / ${EVENTS.length}` : `${recStep + 1} / ${EVENTS.length}`;

    const pos = layoutTree();
    const allX = Object.values(pos).map(p => p.x);
    const allY = Object.values(pos).map(p => p.y);
    const minX = Math.min(...allX) - NW/2 - 20;
    const maxX = Math.max(...allX) + NW/2 + 20;
    const maxY = Math.max(...allY) + NH + 20;

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `${minX} -10 ${maxX - minX} ${maxY + 10}`);
    svg.setAttribute('width', Math.min(maxX - minX, 800));

    /* Draw edges first */
    for (const [id, call] of Object.entries(CALLS)) {
      const p = pos[id];
      call.children.forEach(chId => {
        const cp = pos[chId];
        const parentState = nodeState(parseInt(id), recStep);
        const childState  = nodeState(chId, recStep);
        const visible = parentState !== 'hidden' && childState !== 'hidden';
        svg.appendChild(svgEl('line', {
          x1: p.x, y1: p.y + NH, x2: cp.x, y2: cp.y,
          stroke: visible ? '#2a2a45' : 'transparent', 'stroke-width': 1.5
        }));
      });
    }

    /* Draw nodes */
    for (const [id, p] of Object.entries(pos)) {
      const call  = CALLS[id];
      const state = nodeState(parseInt(id), recStep);
      const c     = COLORS[state];

      /* Glow for active */
      if (state === 'active') {
        svg.appendChild(svgEl('rect', {
          x: p.x - NW/2 - 4, y: p.y - 4, width: NW + 8, height: NH + 8, rx: 6,
          fill: 'none', stroke: c.stroke, 'stroke-width': 1, opacity: 0.4
        }));
      }

      /* Main box */
      svg.appendChild(svgEl('rect', {
        x: p.x - NW/2, y: p.y, width: NW, height: NH, rx: 4,
        fill: c.fill, stroke: c.stroke, 'stroke-width': state === 'active' ? 2 : 1.5
      }));

      /* Label: fib(n) */
      svg.appendChild(svgText(p.x, p.y + 22, `fib(${call.n})`, { fill: c.text, 'font-size': '14', 'font-weight': 'bold' }));

      /* Return value */
      if (state === 'base_case' || state === 'returned') {
        svg.appendChild(svgText(p.x, p.y + 44, `→ ${call.ret}`, { fill: c.text, 'font-size': '12' }));
      }
    }

    canvasEl.appendChild(svg);

    /* Update code highlighting */
    codeEl.querySelectorAll('.line').forEach(l => l.classList.remove('active'));
    if (recStep >= 0) {
      const ev = EVENTS[recStep];
      const call = CALLS[ev.id];
      let line;
      if (ev.type === 'call') {
        line = call.children.length === 0 ? 3 : (call.n <= 1 ? 3 : 1);
      } else {
        line = call.children.length === 0 ? 4 : 5;
      }
      const el = codeEl.querySelector(`.line[data-line="${line}"]`);
      if (el) el.classList.add('active');
    }

    /* Update call stack */
    if (recStep >= 0) {
      const stk = EVENTS[recStep].stack;
      if (stk.length === 0) {
        stackEl.innerHTML = '<span style="color:#7a8ab0;">(empty)</span>';
      } else {
        stackEl.innerHTML = [...stk].reverse().map((id, i) =>
          `<span class="var-name" style="color:${i === 0 ? '#00d4ff' : '#4a7a99'};">fib(${CALLS[id].n})</span>`
        ).join('<br>');
      }
    } else {
      stackEl.innerHTML = '—';
    }

    /* Update stats */
    if (recStep >= 0) {
      let calls = 0, bases = 0, maxDepth = 0;
      for (let i = 0; i <= recStep; i++) {
        if (EVENTS[i].type === 'call') { calls++; maxDepth = Math.max(maxDepth, EVENTS[i].stack.length); }
        if (EVENTS[i].type === 'return' && CALLS[EVENTS[i].id].children.length === 0) bases++;
      }
      const lastReturn = EVENTS[recStep].type === 'return' && EVENTS[recStep].id === 0;
      statsEl.innerHTML = [
        `<span class="var-name">calls</span> = <span class="var-value">${calls}</span>`,
        `<span class="var-name">depth</span> = <span class="var-value">${maxDepth}</span>`,
        `<span class="var-name">base cases</span> = <span class="var-value">${bases}</span>`,
        lastReturn ? `<span class="var-name">result</span> = <span class="var-value" style="color:#00ff9d;">${CALLS[0].ret}</span>` : '',
      ].filter(Boolean).join('<br>');
    } else {
      statsEl.innerHTML = '—';
    }
  }

  function stopRecPlay() {
    if (recPlayTimer) { clearInterval(recPlayTimer); recPlayTimer = null; }
    const btn = document.getElementById('rec-play');
    btn.innerHTML = '&#9654; PLAY'; btn.classList.remove('playing');
  }

  document.getElementById('rec-step').addEventListener('click', () => {
    if (recStep < EVENTS.length - 1) { recStep++; renderRec(); }
  });
  document.getElementById('rec-prev').addEventListener('click', () => {
    if (recStep > 0) { recStep--; renderRec(); }
  });
  document.getElementById('rec-reset').addEventListener('click', () => {
    stopRecPlay(); recStep = -1; renderRec();
  });
  document.getElementById('rec-play').addEventListener('click', () => {
    if (recPlayTimer) { stopRecPlay(); return; }
    const btn = document.getElementById('rec-play');
    btn.innerHTML = '&#9632; STOP'; btn.classList.add('playing');
    recPlayTimer = setInterval(() => {
      if (recStep < EVENTS.length - 1) { recStep++; renderRec(); }
      else stopRecPlay();
    }, 600);
  });

  recCard.addEventListener('click', (e) => {
    e.preventDefault();
    appLanding.style.display = 'none';
    appTitle.style.display = 'none';
    appFooter.style.display = 'none';
    demoView.style.display = 'flex';
    recStep = -1;
    setTimeout(renderRec, 50);
  });

  document.getElementById('demo-rec-back').addEventListener('click', () => {
    stopRecPlay();
    demoView.style.display = 'none';
    appLanding.style.display = '';
    appTitle.style.display = '';
    appFooter.style.display = '';
  });
})();


/* ─── 16. ALGORITHMS DEMO ───────────────────────────────── */
(function initAlgoDemo() {
  const appLanding = document.querySelector('.app-cards');
  const appTitle   = document.querySelector('.app-title');
  const appFooter  = document.querySelector('.app-footer');
  const demoView   = document.getElementById('demo-algo');
  const algoCard   = document.querySelector('.app-card.app-algo');
  if (!demoView || !algoCard) return;

  const barsEl    = document.getElementById('algo-bars');
  const descEl    = document.getElementById('algo-desc');
  const statsEl   = document.getElementById('algo-stats');
  const counterEl = document.getElementById('algo-counter');
  const headerEl  = document.getElementById('algo-header');
  const tabs      = document.querySelectorAll('#algo-tabs .ds-tab');

  const INIT_ARR = [7, 3, 9, 2, 8, 4, 6, 1, 5];
  const MAX_VAL  = 9;

  /* ── Step generators ── */
  function genBubble(a) {
    const arr = [...a], steps = [{ arr: [...arr], colors: [], desc: 'Initial array', comps: 0, swaps: 0 }];
    let comps = 0, swaps = 0;
    for (let i = 0; i < arr.length - 1; i++) {
      for (let j = 0; j < arr.length - 1 - i; j++) {
        comps++;
        const cols = new Array(arr.length).fill('');
        for (let s = arr.length - i; s < arr.length; s++) cols[s] = 'sorted';
        cols[j] = 'compare'; cols[j+1] = 'compare';
        steps.push({ arr: [...arr], colors: cols, desc: `Compare arr[${j}]=${arr[j]} and arr[${j+1}]=${arr[j+1]}`, comps, swaps });
        if (arr[j] > arr[j+1]) {
          [arr[j], arr[j+1]] = [arr[j+1], arr[j]];
          swaps++;
          const cols2 = new Array(arr.length).fill('');
          for (let s = arr.length - i; s < arr.length; s++) cols2[s] = 'sorted';
          cols2[j] = 'swap'; cols2[j+1] = 'swap';
          steps.push({ arr: [...arr], colors: cols2, desc: `Swap arr[${j}] ↔ arr[${j+1}]`, comps, swaps });
        }
      }
      const cols = new Array(arr.length).fill('');
      for (let s = arr.length - 1 - i; s < arr.length; s++) cols[s] = 'sorted';
      steps.push({ arr: [...arr], colors: cols, desc: `Pass ${i+1} complete`, comps, swaps });
    }
    const final = new Array(arr.length).fill('sorted');
    steps.push({ arr: [...arr], colors: final, desc: 'Sorted!', comps, swaps });
    return steps;
  }

  function genSelection(a) {
    const arr = [...a], steps = [{ arr: [...arr], colors: [], desc: 'Initial array', comps: 0, swaps: 0 }];
    let comps = 0, swaps = 0;
    for (let i = 0; i < arr.length - 1; i++) {
      let minIdx = i;
      for (let j = i + 1; j < arr.length; j++) {
        comps++;
        const cols = new Array(arr.length).fill('');
        for (let s = 0; s < i; s++) cols[s] = 'sorted';
        cols[minIdx] = 'current'; cols[j] = 'compare';
        steps.push({ arr: [...arr], colors: cols, desc: `Compare min=${arr[minIdx]} with arr[${j}]=${arr[j]}`, comps, swaps });
        if (arr[j] < arr[minIdx]) minIdx = j;
      }
      if (minIdx !== i) {
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        swaps++;
        const cols = new Array(arr.length).fill('');
        for (let s = 0; s < i; s++) cols[s] = 'sorted';
        cols[i] = 'swap'; cols[minIdx] = 'swap';
        steps.push({ arr: [...arr], colors: cols, desc: `Swap arr[${i}] ↔ arr[${minIdx}]`, comps, swaps });
      }
      const cols = new Array(arr.length).fill('');
      for (let s = 0; s <= i; s++) cols[s] = 'sorted';
      steps.push({ arr: [...arr], colors: cols, desc: `Position ${i} set`, comps, swaps });
    }
    steps.push({ arr: [...arr], colors: new Array(arr.length).fill('sorted'), desc: 'Sorted!', comps, swaps });
    return steps;
  }

  function genInsertion(a) {
    const arr = [...a], steps = [{ arr: [...arr], colors: [], desc: 'Initial array', comps: 0, swaps: 0 }];
    let comps = 0, swaps = 0;
    for (let i = 1; i < arr.length; i++) {
      const key = arr[i];
      let j = i - 1;
      const cols = new Array(arr.length).fill('');
      cols[i] = 'current';
      steps.push({ arr: [...arr], colors: cols, desc: `Insert arr[${i}]=${key}`, comps, swaps });
      while (j >= 0 && arr[j] > key) {
        comps++;
        arr[j+1] = arr[j];
        swaps++;
        const cols2 = new Array(arr.length).fill('');
        cols2[j] = 'swap'; cols2[j+1] = 'swap';
        steps.push({ arr: [...arr], colors: cols2, desc: `Shift arr[${j}]=${arr[j]} right`, comps, swaps });
        j--;
      }
      comps++;
      arr[j+1] = key;
      const cols3 = new Array(arr.length).fill('');
      cols3[j+1] = 'compare';
      steps.push({ arr: [...arr], colors: cols3, desc: `Place ${key} at index ${j+1}`, comps, swaps });
    }
    steps.push({ arr: [...arr], colors: new Array(arr.length).fill('sorted'), desc: 'Sorted!', comps, swaps });
    return steps;
  }

  function genMerge(a) {
    const arr = [...a], steps = [{ arr: [...arr], colors: [], desc: 'Initial array', comps: 0, swaps: 0 }];
    let comps = 0, swaps = 0;
    function merge(l, m, r) {
      const left = arr.slice(l, m+1), right = arr.slice(m+1, r+1);
      let i = 0, j = 0, k = l;
      while (i < left.length && j < right.length) {
        comps++;
        const cols = new Array(arr.length).fill('');
        cols[l + i] = 'compare'; cols[m + 1 + j] = 'compare';
        if (left[i] <= right[j]) { arr[k] = left[i]; i++; }
        else { arr[k] = right[j]; j++; swaps++; }
        cols[k] = 'pivot';
        steps.push({ arr: [...arr], colors: cols, desc: `Merge: place ${arr[k]} at [${k}]`, comps, swaps });
        k++;
      }
      while (i < left.length) { arr[k] = left[i]; i++; k++; }
      while (j < right.length) { arr[k] = right[j]; j++; k++; }
      const cols = new Array(arr.length).fill('');
      for (let x = l; x <= r; x++) cols[x] = 'compare';
      steps.push({ arr: [...arr], colors: cols, desc: `Merged [${l}..${r}]`, comps, swaps });
    }
    function sort(l, r) {
      if (l >= r) return;
      const m = Math.floor((l + r) / 2);
      sort(l, m);
      sort(m + 1, r);
      merge(l, m, r);
    }
    sort(0, arr.length - 1);
    steps.push({ arr: [...arr], colors: new Array(arr.length).fill('sorted'), desc: 'Sorted!', comps, swaps });
    return steps;
  }

  function genQuick(a) {
    const arr = [...a], steps = [{ arr: [...arr], colors: [], desc: 'Initial array', comps: 0, swaps: 0 }];
    let comps = 0, swaps = 0;
    function partition(lo, hi) {
      const pivot = arr[hi];
      const cols0 = new Array(arr.length).fill('');
      cols0[hi] = 'pivot';
      steps.push({ arr: [...arr], colors: cols0, desc: `Pivot = ${pivot} at [${hi}]`, comps, swaps });
      let i = lo - 1;
      for (let j = lo; j < hi; j++) {
        comps++;
        const cols = new Array(arr.length).fill('');
        cols[hi] = 'pivot'; cols[j] = 'compare';
        steps.push({ arr: [...arr], colors: cols, desc: `Compare ${arr[j]} with pivot ${pivot}`, comps, swaps });
        if (arr[j] < pivot) {
          i++;
          [arr[i], arr[j]] = [arr[j], arr[i]];
          swaps++;
          const cols2 = new Array(arr.length).fill('');
          cols2[hi] = 'pivot'; cols2[i] = 'swap'; cols2[j] = 'swap';
          steps.push({ arr: [...arr], colors: cols2, desc: `Swap arr[${i}] ↔ arr[${j}]`, comps, swaps });
        }
      }
      [arr[i+1], arr[hi]] = [arr[hi], arr[i+1]];
      swaps++;
      const cols3 = new Array(arr.length).fill('');
      cols3[i+1] = 'sorted';
      steps.push({ arr: [...arr], colors: cols3, desc: `Pivot ${pivot} placed at [${i+1}]`, comps, swaps });
      return i + 1;
    }
    function sort(lo, hi) {
      if (lo >= hi) return;
      const p = partition(lo, hi);
      sort(lo, p - 1);
      sort(p + 1, hi);
    }
    sort(0, arr.length - 1);
    steps.push({ arr: [...arr], colors: new Array(arr.length).fill('sorted'), desc: 'Sorted!', comps, swaps });
    return steps;
  }

  /* ── BINARY SEARCH ── */
  const SEARCH_ARR = [2, 5, 8, 12, 16, 23, 38, 42, 55, 67, 72, 84, 91, 95, 99];
  const SEARCH_TARGET = 72;

  function genBinary() {
    const arr = [...SEARCH_ARR];
    const target = SEARCH_TARGET;
    const steps = [{ arr, lo: 0, hi: arr.length-1, mid: -1, found: -1, desc: `Search for ${target}`, comps: 0, swaps: 0 }];
    let lo = 0, hi = arr.length - 1, comps = 0;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      comps++;
      steps.push({ arr, lo, hi, mid, found: -1, desc: `Check mid=${mid}: arr[${mid}]=${arr[mid]} vs ${target}`, comps, swaps: 0 });
      if (arr[mid] === target) {
        steps.push({ arr, lo, hi, mid, found: mid, desc: `Found ${target} at index ${mid}!`, comps, swaps: 0 });
        return steps;
      } else if (arr[mid] < target) {
        steps.push({ arr, lo: mid+1, hi, mid, found: -1, desc: `${arr[mid]} < ${target}, eliminate left`, comps, swaps: 0 });
        lo = mid + 1;
      } else {
        steps.push({ arr, lo, hi: mid-1, mid, found: -1, desc: `${arr[mid]} > ${target}, eliminate right`, comps, swaps: 0 });
        hi = mid - 1;
      }
    }
    return steps;
  }

  function renderBinaryStep(step) {
    barsEl.innerHTML = '';
    barsEl.style.flexDirection = 'column';
    barsEl.style.alignItems = 'center';
    barsEl.style.justifyContent = 'center';
    barsEl.style.gap = '0';

    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:4px;position:relative;padding-top:28px;';

    step.arr.forEach((v, i) => {
      const box = document.createElement('div');
      const inRange = i >= step.lo && i <= step.hi;
      const isMid   = i === step.mid;
      const isFound = i === step.found;

      box.style.cssText = `width:40px;height:40px;display:flex;align-items:center;justify-content:center;
        border-radius:3px;font-family:'Share Tech Mono',monospace;font-size:13px;font-weight:bold;
        border:1px solid;transition:all .2s;position:relative;`;

      if (isFound) {
        box.style.borderColor = '#00ff9d';
        box.style.background = 'rgba(0,255,157,.15)';
        box.style.color = '#00ff9d';
        box.style.boxShadow = '0 0 12px rgba(0,255,157,.5)';
      } else if (isMid) {
        box.style.borderColor = '#7b2fff';
        box.style.background = 'rgba(123,47,255,.12)';
        box.style.color = '#7b2fff';
      } else if (!inRange) {
        box.style.borderColor = '#2a2a45';
        box.style.background = '#12121e';
        box.style.color = '#c8d3f5';
        box.style.opacity = '0.2';
      } else {
        box.style.borderColor = '#2a2a45';
        box.style.background = '#1a1a2e';
        box.style.color = '#c8d3f5';
      }

      box.textContent = v;
      wrap.appendChild(box);

      /* Markers above */
      if (i === step.lo && step.found < 0) {
        const m = document.createElement('div');
        m.style.cssText = `position:absolute;top:-22px;left:${i*(40+4)+20}px;transform:translateX(-50%);
          font-family:'Orbitron',sans-serif;font-size:8px;letter-spacing:1px;color:#00d4ff;`;
        m.textContent = 'LO';
        wrap.appendChild(m);
      }
      if (i === step.hi && step.found < 0) {
        const m = document.createElement('div');
        m.style.cssText = `position:absolute;top:-22px;left:${i*(40+4)+20}px;transform:translateX(-50%);
          font-family:'Orbitron',sans-serif;font-size:8px;letter-spacing:1px;color:#ff9d00;`;
        m.textContent = 'HI';
        wrap.appendChild(m);
      }
      if (i === step.mid) {
        const m = document.createElement('div');
        m.style.cssText = `position:absolute;top:-22px;left:${i*(40+4)+20}px;transform:translateX(-50%);
          font-family:'Orbitron',sans-serif;font-size:8px;letter-spacing:1px;color:${step.found >= 0 ? '#00ff9d' : '#7b2fff'};`;
        m.textContent = step.found >= 0 ? 'FOUND' : 'MID';
        wrap.appendChild(m);
      }
    });

    barsEl.appendChild(wrap);

    /* Target indicator */
    const tgt = document.createElement('div');
    tgt.style.cssText = `margin-top:24px;font-family:'Orbitron',sans-serif;font-size:10px;letter-spacing:2px;
      color:#7a8ab0;display:flex;align-items:center;gap:10px;`;
    tgt.innerHTML = `TARGET <span style="color:#c8d3f5;font-size:16px;font-weight:bold;">${SEARCH_TARGET}</span>`;
    barsEl.appendChild(tgt);

    /* Index row */
    const idxRow = document.createElement('div');
    idxRow.style.cssText = 'display:flex;gap:4px;margin-top:8px;';
    step.arr.forEach((_, i) => {
      const idx = document.createElement('div');
      idx.style.cssText = `width:40px;text-align:center;font-family:'Share Tech Mono',monospace;font-size:9px;color:#7a8ab0;`;
      idx.textContent = i;
      idxRow.appendChild(idx);
    });
    barsEl.appendChild(idxRow);
  }

  /* ── DIJKSTRA (graph) ── */
  const GRAPH_NODES = [
    { id: 'A', x: 80,  y: 60  },
    { id: 'B', x: 220, y: 30  },
    { id: 'C', x: 220, y: 140 },
    { id: 'D', x: 380, y: 60  },
    { id: 'E', x: 380, y: 170 },
    { id: 'F', x: 520, y: 100 },
  ];
  const GRAPH_EDGES = [
    { from: 'A', to: 'B', w: 4 },
    { from: 'A', to: 'C', w: 2 },
    { from: 'B', to: 'D', w: 5 },
    { from: 'C', to: 'B', w: 1 },
    { from: 'C', to: 'E', w: 8 },
    { from: 'D', to: 'F', w: 2 },
    { from: 'E', to: 'F', w: 3 },
    { from: 'B', to: 'E', w: 6 },
  ];

  function genDijkstra() {
    const dist = {}, prev = {}, visited = new Set();
    GRAPH_NODES.forEach(n => { dist[n.id] = Infinity; prev[n.id] = null; });
    dist['A'] = 0;

    const steps = [];
    steps.push({ dist: {...dist}, visited: new Set(), current: null, edge: null, desc: 'Start at A, dist=0' });

    for (let i = 0; i < GRAPH_NODES.length; i++) {
      /* Pick unvisited with smallest dist */
      let u = null, best = Infinity;
      for (const n of GRAPH_NODES) {
        if (!visited.has(n.id) && dist[n.id] < best) { best = dist[n.id]; u = n.id; }
      }
      if (u === null) break;
      visited.add(u);
      steps.push({ dist: {...dist}, visited: new Set(visited), current: u, edge: null, desc: `Visit ${u} (dist=${dist[u]})` });

      /* Relax neighbors */
      for (const e of GRAPH_EDGES) {
        if (e.from !== u) continue;
        if (visited.has(e.to)) continue;
        const alt = dist[u] + e.w;
        steps.push({ dist: {...dist}, visited: new Set(visited), current: u, edge: e, checking: e.to,
          desc: `Check ${u}→${e.to}: ${dist[u]}+${e.w}=${alt} vs ${dist[e.to] === Infinity ? '∞' : dist[e.to]}` });
        if (alt < dist[e.to]) {
          dist[e.to] = alt;
          prev[e.to] = u;
          steps.push({ dist: {...dist}, visited: new Set(visited), current: u, edge: e, updated: e.to,
            desc: `Update dist[${e.to}] = ${alt}` });
        }
      }
    }

    /* Final — show shortest path A→F */
    const path = [];
    let c = 'F';
    while (c) { path.unshift(c); c = prev[c]; }
    steps.push({ dist: {...dist}, visited: new Set(visited), current: null, edge: null, path,
      desc: `Shortest path A→F: ${path.join('→')} (dist=${dist['F']})` });

    return steps;
  }

  const SVG_NS_A = 'http://www.w3.org/2000/svg';
  const graphEl = document.getElementById('algo-graph');

  function renderDijkstraStep(step) {
    graphEl.innerHTML = '';
    const svg = document.createElementNS(SVG_NS_A, 'svg');
    svg.setAttribute('viewBox', '0 0 600 220');
    svg.setAttribute('width', 600);

    function svgE(tag, attrs) {
      const e = document.createElementNS(SVG_NS_A, tag);
      for (const [k,v] of Object.entries(attrs || {})) e.setAttribute(k, v);
      return e;
    }
    function svgT(x, y, text, attrs) {
      const t = svgE('text', { x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central',
        fill: '#c8d3f5', 'font-family': "'Share Tech Mono', monospace", 'font-size': '12', ...attrs });
      t.textContent = text;
      return t;
    }

    const nodeMap = {};
    GRAPH_NODES.forEach(n => { nodeMap[n.id] = n; });

    /* Draw edges */
    GRAPH_EDGES.forEach(e => {
      const a = nodeMap[e.from], b = nodeMap[e.to];
      const isPath = step.path && step.path.includes(e.from) && step.path.includes(e.to)
        && Math.abs(step.path.indexOf(e.from) - step.path.indexOf(e.to)) === 1;
      const isActive = step.edge && step.edge.from === e.from && step.edge.to === e.to;
      const color = isPath ? '#00ff9d' : isActive ? '#ff9d00' : '#2a2a45';
      const width = isPath ? 3 : isActive ? 2.5 : 1.5;

      /* Arrow line */
      const dx = b.x - a.x, dy = b.y - a.y, len = Math.sqrt(dx*dx + dy*dy);
      const ux = dx/len, uy = dy/len;
      const x1 = a.x + ux*22, y1 = a.y + uy*22;
      const x2 = b.x - ux*22, y2 = b.y - uy*22;
      svg.appendChild(svgE('line', { x1, y1, x2, y2, stroke: color, 'stroke-width': width }));
      /* Arrowhead */
      const ax2 = x2 - ux*8 - uy*4, ay2 = y2 - uy*8 + ux*4;
      const ax3 = x2 - ux*8 + uy*4, ay3 = y2 - uy*8 - ux*4;
      svg.appendChild(svgE('polygon', { points: `${x2},${y2} ${ax2},${ay2} ${ax3},${ay3}`, fill: color }));
      /* Weight label */
      const mx = (a.x + b.x)/2 + uy*12, my = (a.y + b.y)/2 - ux*12;
      svg.appendChild(svgT(mx, my, String(e.w), { fill: color === '#2a2a45' ? '#7a8ab0' : color, 'font-size': '10' }));
    });

    /* Draw nodes */
    GRAPH_NODES.forEach(n => {
      const isVisited = step.visited.has(n.id);
      const isCurrent = step.current === n.id;
      const isChecking = step.checking === n.id;
      const isUpdated  = step.updated === n.id;
      const isOnPath = step.path && step.path.includes(n.id);

      let fill = '#12121e', stroke = '#2a2a45';
      if (isOnPath)    { fill = '#0d2e1a'; stroke = '#00ff9d'; }
      else if (isCurrent)  { fill = '#0d2a35'; stroke = '#00d4ff'; }
      else if (isUpdated)  { fill = '#0d2e1a'; stroke = '#28c840'; }
      else if (isChecking) { fill = '#3d2e00'; stroke = '#ff9d00'; }
      else if (isVisited)  { fill = '#1a0d2e'; stroke = '#7b2fff'; }

      svg.appendChild(svgE('circle', { cx: n.x, cy: n.y, r: 20, fill, stroke, 'stroke-width': isCurrent ? 2.5 : 1.5 }));
      svg.appendChild(svgT(n.x, n.y - 2, n.id, { fill: stroke === '#2a2a45' ? '#c8d3f5' : stroke, 'font-size': '14', 'font-weight': 'bold' }));

      /* Distance label below */
      const d = step.dist[n.id];
      svg.appendChild(svgT(n.x, n.y + 34, d === Infinity ? '∞' : String(d), { fill: '#7a8ab0', 'font-size': '10' }));
    });

    graphEl.appendChild(svg);
  }

  const ALGOS = {
    bubble:    { name: 'Bubble Sort',    gen: genBubble,    type: 'bars' },
    selection: { name: 'Selection Sort', gen: genSelection, type: 'bars' },
    insertion: { name: 'Insertion Sort', gen: genInsertion, type: 'bars' },
    merge:     { name: 'Merge Sort',     gen: genMerge,     type: 'bars' },
    quick:     { name: 'Quick Sort',     gen: genQuick,     type: 'bars' },
    binary:    { name: 'Binary Search',  gen: genBinary,    type: 'search' },
    dijkstra:  { name: 'Dijkstra',       gen: genDijkstra,  type: 'graph' },
  };

  let activeAlgo = 'bubble';
  let algoSteps = [];
  let algoStep = -1;
  let algoPlayTimer = null;

  function loadAlgo(key) {
    activeAlgo = key;
    algoStep = -1;
    stopAlgoPlay();
    const algo = ALGOS[key];
    headerEl.textContent = algo.name;
    algoSteps = (algo.type === 'graph' || algo.type === 'search') ? algo.gen() : algo.gen(INIT_ARR);
    tabs.forEach(t => t.classList.toggle('active', t.dataset.algo === key));
    renderAlgo();
  }

  function renderAlgo() {
    const algo = ALGOS[activeAlgo];
    const step = algoStep < 0 ? algoSteps[0] : algoSteps[algoStep];
    counterEl.textContent = algoStep < 0 ? `0 / ${algoSteps.length}` : `${algoStep + 1} / ${algoSteps.length}`;

    if (algo.type === 'graph') {
      barsEl.style.display = 'none';
      graphEl.style.display = '';
      renderDijkstraStep(step);
      descEl.innerHTML = `<span class="var-value">${step.desc}</span>`;
      const distStr = Object.entries(step.dist).map(([k,v]) =>
        `<span class="var-name">${k}</span>=<span class="var-value">${v === Infinity ? '∞' : v}</span>`
      ).join(' ');
      statsEl.innerHTML = distStr;
      return;
    }

    barsEl.style.display = '';
    barsEl.style.flexDirection = '';
    barsEl.style.alignItems = '';
    barsEl.style.justifyContent = '';
    barsEl.style.gap = '';
    graphEl.style.display = 'none';

    if (algo.type === 'search') {
      renderBinaryStep(step);
      descEl.innerHTML = `<span class="var-value">${step.desc}</span>`;
      statsEl.innerHTML = `<span class="var-name">comparisons</span> = <span class="var-value">${step.comps}</span>`;
      return;
    }

    /* Render bars */
    barsEl.innerHTML = '';
    step.arr.forEach((v, i) => {
      const bar = document.createElement('div');
      bar.className = 'algo-bar';

      const inner = document.createElement('div');
      inner.className = 'algo-bar-inner' + (step.colors[i] ? ' ' + step.colors[i] : '');
      inner.style.height = (v / MAX_VAL * 320) + 'px';

      const label = document.createElement('div');
      label.className = 'algo-bar-label';
      label.textContent = v;

      bar.appendChild(inner);
      bar.appendChild(label);
      barsEl.appendChild(bar);
    });

    descEl.innerHTML = `<span class="var-value">${step.desc}</span>`;
    statsEl.innerHTML = `<span class="var-name">comparisons</span> = <span class="var-value">${step.comps}</span><br>`
      + `<span class="var-name">swaps</span> = <span class="var-value">${step.swaps}</span>`;
  }

  function stopAlgoPlay() {
    if (algoPlayTimer) { clearInterval(algoPlayTimer); algoPlayTimer = null; }
    const btn = document.getElementById('algo-play');
    btn.innerHTML = '&#9654; PLAY'; btn.classList.remove('playing');
  }

  document.getElementById('algo-step').addEventListener('click', () => {
    if (algoStep < algoSteps.length - 1) { algoStep++; renderAlgo(); }
  });
  document.getElementById('algo-prev').addEventListener('click', () => {
    if (algoStep > 0) { algoStep--; renderAlgo(); }
  });
  document.getElementById('algo-reset').addEventListener('click', () => {
    stopAlgoPlay(); algoStep = -1; renderAlgo();
  });
  document.getElementById('algo-play').addEventListener('click', () => {
    if (algoPlayTimer) { stopAlgoPlay(); return; }
    const btn = document.getElementById('algo-play');
    btn.innerHTML = '&#9632; STOP'; btn.classList.add('playing');
    algoPlayTimer = setInterval(() => {
      if (algoStep < algoSteps.length - 1) { algoStep++; renderAlgo(); }
      else stopAlgoPlay();
    }, 200);
  });

  tabs.forEach(t => t.addEventListener('click', () => loadAlgo(t.dataset.algo)));

  algoCard.addEventListener('click', (e) => {
    e.preventDefault();
    appLanding.style.display = 'none';
    appTitle.style.display = 'none';
    appFooter.style.display = 'none';
    demoView.style.display = 'flex';
    loadAlgo('bubble');
  });

  document.getElementById('demo-algo-back').addEventListener('click', () => {
    stopAlgoPlay();
    demoView.style.display = 'none';
    appLanding.style.display = '';
    appTitle.style.display = '';
    appFooter.style.display = '';
  });
})();


/* ─── 17. COMPLEXITY DEMO ────────────────────────────────── */
(function initCmpDemo() {
  const appLanding = document.querySelector('.app-cards');
  const appTitle   = document.querySelector('.app-title');
  const appFooter  = document.querySelector('.app-footer');
  const demoView   = document.getElementById('demo-cmp');
  const cmpCard    = document.querySelector('.app-card.app-cmp');
  if (!demoView || !cmpCard) return;

  const codeEl    = document.getElementById('cmp-code');
  const headerEl  = document.getElementById('cmp-code-header');
  const resultEl  = document.getElementById('cmp-result');
  const graphEl   = document.getElementById('cmp-graph');
  const sliderRow = document.getElementById('cmp-slider-row');
  const tabs      = document.querySelectorAll('#cmp-tabs .ds-tab');

  const SVG_NS = 'http://www.w3.org/2000/svg';

  const CODE = `<code><span class="line" data-line="1"><span class="kw">void</span> <span class="fn">BubbleSort</span>(<span class="kw">int</span>[] arr)</span>
<span class="line" data-line="2">{</span>
<span class="line" data-line="3">    <span class="kw">for</span> (<span class="kw">int</span> i = <span class="num">0</span>; i &lt; arr.Length; i++)</span>
<span class="line" data-line="4">    {</span>
<span class="line" data-line="5">        <span class="kw">for</span> (<span class="kw">int</span> j = <span class="num">0</span>; j &lt; arr.Length-<span class="num">1</span>-i; j++)</span>
<span class="line" data-line="6">        {</span>
<span class="line" data-line="7">            <span class="kw">if</span> (arr[j] &gt; arr[j+<span class="num">1</span>])</span>
<span class="line" data-line="8">                Swap(arr, j, j+<span class="num">1</span>);</span>
<span class="line" data-line="9">        }</span>
<span class="line" data-line="10">    }</span>
<span class="line" data-line="11">}</span></code>`;

  const TABS = {
    time: {
      bigo: 'O(n²)', name: 'Quadratic Time', color: '#ff9d00', rating: 'POOR',
      explain: 'The outer loop runs <b>n</b> times. The inner loop runs up to <b>n−1</b> times per pass. This nested structure produces <b>n × n = n²</b> comparisons in the worst case.',
      tags: ['Nested loop', 'Comparison sort', 'Worst case'],
      fn: n => n * n, activeIdx: 5,
      yLabel: 'Operations',
    },
    space: {
      bigo: 'O(1)', name: 'Constant Space', color: '#00ff9d', rating: 'EXCELLENT',
      explain: 'Bubble sort swaps elements <b>in-place</b> using only a single temporary variable. No additional arrays or data structures are allocated — memory usage does not grow with input size.',
      tags: ['In-place', 'No extra allocation', 'Temp variable only'],
      fn: () => 1, activeIdx: 0,
      yLabel: 'Memory',
    },
    compare: {
      bigo: 'O(n²) time · O(1) space', name: 'Time & Space', color: '#ffe066', rating: 'TRADE-OFF',
      explain: 'Bubble sort sacrifices <b>time efficiency</b> (quadratic) to achieve <b>minimal memory</b> usage (constant). Compare: Merge sort is O(n log n) time but O(n) space — faster but uses more memory.',
      tags: ['Time vs Space', 'In-place advantage', 'Simple implementation'],
      fn: null, activeIdx: -1,
      yLabel: '',
    },
  };

  const CURVES = [
    { label: 'O(1)',       fn: () => 1,                        color: '#00ff9d' },
    { label: 'O(log n)',   fn: n => Math.log2(Math.max(1,n)),  color: '#00d4ff' },
    { label: 'O(√n)',      fn: n => Math.sqrt(n),              color: '#00e5cc' },
    { label: 'O(n)',       fn: n => n,                         color: '#7b2fff' },
    { label: 'O(n log n)', fn: n => n*Math.log2(Math.max(1,n)),color: '#ffe066' },
    { label: 'O(n²)',      fn: n => n*n,                       color: '#ff9d00' },
    { label: 'O(2ⁿ)',     fn: n => Math.pow(2,n),             color: '#ff4466' },
  ];

  let activeTab = 'time';
  let sliderN = 10;

  function svgE(tag, attrs) {
    const e = document.createElementNS(SVG_NS, tag);
    for (const [k,v] of Object.entries(attrs || {})) e.setAttribute(k, v);
    return e;
  }
  function svgT(x, y, text, attrs) {
    const t = svgE('text', { x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central',
      fill: '#c8d3f5', 'font-family': "'Share Tech Mono', monospace", 'font-size': '11', ...attrs });
    t.textContent = text;
    return t;
  }

  function drawGraph(activeIdx, yLabel) {
    graphEl.innerHTML = '';
    const W = 520, H = 260, PAD = 44;
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', W);
    const gw = W - PAD - 10, gh = H - PAD - 10, maxN = 20;
    const maxOps = CURVES[Math.max(0, activeIdx)].fn(maxN);
    const scale = Math.min(400, Math.max(20, maxOps));

    for (let i = 0; i <= 5; i++) {
      const x = PAD + (gw/5)*i, y = 10 + (gh/5)*i;
      svg.appendChild(svgE('line', { x1: x, y1: 10, x2: x, y2: 10+gh, stroke: '#1a1a2e', 'stroke-width': 1 }));
      svg.appendChild(svgE('line', { x1: PAD, y1: y, x2: PAD+gw, y2: y, stroke: '#1a1a2e', 'stroke-width': 1 }));
    }
    svg.appendChild(svgE('line', { x1: PAD, y1: 10, x2: PAD, y2: 10+gh, stroke: '#2a2a45', 'stroke-width': 1.5 }));
    svg.appendChild(svgE('line', { x1: PAD, y1: 10+gh, x2: PAD+gw, y2: 10+gh, stroke: '#2a2a45', 'stroke-width': 1.5 }));
    svg.appendChild(svgT(PAD + gw/2, H-4, 'Input size (n)', { fill: '#7a8ab0', 'font-size': '10' }));
    svg.appendChild(svgT(14, 10+gh/2, yLabel || 'Ops', { fill: '#7a8ab0', 'font-size': '10', transform: `rotate(-90,14,${10+gh/2})` }));
    for (let n = 0; n <= maxN; n += 5) {
      svg.appendChild(svgT(PAD + (n/maxN)*gw, 10+gh+14, String(n), { fill: '#7a8ab0', 'font-size': '9' }));
    }

    CURVES.forEach((curve, ci) => {
      const isActive = ci === activeIdx;
      let d = '';
      for (let n = 1; n <= maxN; n++) {
        const x = PAD + (n/maxN)*gw;
        const val = Math.min(curve.fn(n), scale);
        const y = 10 + gh - (val/scale)*gh;
        d += (n === 1 ? 'M' : 'L') + `${x},${Math.max(10,y)}`;
      }
      svg.appendChild(svgE('path', { d, fill: 'none', stroke: curve.color, 'stroke-width': isActive ? 2.5 : 1, opacity: isActive ? 1 : 0.2 }));
      if (isActive) {
        const lv = Math.min(curve.fn(maxN), scale);
        svg.appendChild(svgT(PAD+gw+5, Math.max(14, 10+gh-(lv/scale)*gh), curve.label, { fill: curve.color, 'font-size': '9', 'text-anchor': 'start' }));
      }
    });

    const sx = PAD + (sliderN/maxN)*gw;
    svg.appendChild(svgE('line', { x1: sx, y1: 10, x2: sx, y2: 10+gh, stroke: '#ffe066', 'stroke-width': 1, 'stroke-dasharray': '4,3', opacity: 0.6 }));
    if (activeIdx >= 0) {
      const av = CURVES[activeIdx].fn(sliderN);
      const sy = 10 + gh - (Math.min(av, scale)/scale)*gh;
      svg.appendChild(svgE('circle', { cx: sx, cy: Math.max(14,sy), r: 4, fill: CURVES[activeIdx].color, stroke: '#0d0d14', 'stroke-width': 1.5 }));
      svg.appendChild(svgT(sx, Math.max(14,sy)-12, `${Math.round(av)} ops`, { fill: CURVES[activeIdx].color, 'font-size': '9' }));
    }
    graphEl.appendChild(svg);
  }

  function drawCompareGraph() {
    graphEl.innerHTML = '';
    const W = 520, H = 260, PAD = 44;
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', W);
    const gw = W - PAD - 30, gh = H - PAD - 10, maxN = 20;

    for (let i = 0; i <= 5; i++) {
      const x = PAD + (gw/5)*i, y = 10 + (gh/5)*i;
      svg.appendChild(svgE('line', { x1: x, y1: 10, x2: x, y2: 10+gh, stroke: '#1a1a2e', 'stroke-width': 1 }));
      svg.appendChild(svgE('line', { x1: PAD, y1: y, x2: PAD+gw, y2: y, stroke: '#1a1a2e', 'stroke-width': 1 }));
    }
    svg.appendChild(svgE('line', { x1: PAD, y1: 10, x2: PAD, y2: 10+gh, stroke: '#2a2a45', 'stroke-width': 1.5 }));
    svg.appendChild(svgE('line', { x1: PAD, y1: 10+gh, x2: PAD+gw, y2: 10+gh, stroke: '#2a2a45', 'stroke-width': 1.5 }));
    svg.appendChild(svgT(PAD + gw/2, H-4, 'Input size (n)', { fill: '#7a8ab0', 'font-size': '10' }));

    /* Time curve: O(n²) */
    const timeFn = n => n*n;
    const scale = timeFn(maxN);
    let dTime = '';
    for (let n = 1; n <= maxN; n++) {
      const x = PAD + (n/maxN)*gw, y = 10 + gh - (timeFn(n)/scale)*gh;
      dTime += (n === 1 ? 'M' : 'L') + `${x},${Math.max(10,y)}`;
    }
    svg.appendChild(svgE('path', { d: dTime, fill: 'none', stroke: '#ff9d00', 'stroke-width': 2.5 }));
    svg.appendChild(svgT(PAD+gw+5, 14, 'Time O(n²)', { fill: '#ff9d00', 'font-size': '9', 'text-anchor': 'start' }));

    /* Space curve: O(1) — flat line at bottom */
    const spaceY = 10 + gh - (1/scale)*gh;
    svg.appendChild(svgE('line', { x1: PAD, y1: spaceY, x2: PAD+gw, y2: spaceY, stroke: '#00ff9d', 'stroke-width': 2.5 }));
    svg.appendChild(svgT(PAD+gw+5, spaceY, 'Space O(1)', { fill: '#00ff9d', 'font-size': '9', 'text-anchor': 'start' }));

    /* Slider */
    const sx = PAD + (sliderN/maxN)*gw;
    svg.appendChild(svgE('line', { x1: sx, y1: 10, x2: sx, y2: 10+gh, stroke: '#ffe066', 'stroke-width': 1, 'stroke-dasharray': '4,3', opacity: 0.6 }));
    const tv = timeFn(sliderN), ty = 10 + gh - (tv/scale)*gh;
    svg.appendChild(svgE('circle', { cx: sx, cy: Math.max(14,ty), r: 4, fill: '#ff9d00', stroke: '#0d0d14', 'stroke-width': 1.5 }));
    svg.appendChild(svgT(sx, Math.max(14,ty)-12, `${tv} ops`, { fill: '#ff9d00', 'font-size': '9' }));
    svg.appendChild(svgE('circle', { cx: sx, cy: spaceY, r: 4, fill: '#00ff9d', stroke: '#0d0d14', 'stroke-width': 1.5 }));
    svg.appendChild(svgT(sx, spaceY-12, '1 var', { fill: '#00ff9d', 'font-size': '9' }));

    graphEl.appendChild(svg);
  }

  function loadTab(key) {
    activeTab = key;
    sliderN = 10;
    const tab = TABS[key];
    headerEl.textContent = 'BubbleSort.cs';
    codeEl.innerHTML = CODE;
    tabs.forEach(t => t.classList.toggle('active', t.dataset.cmp === key));

    resultEl.innerHTML = `
      <div class="cmp-bigo-row">
        <div>
          <div class="cmp-bigo" style="color:${tab.color};text-shadow:0 0 20px ${tab.color}44;">${tab.bigo}</div>
          <div class="cmp-bigo-name">${tab.name}</div>
        </div>
        <div class="cmp-rating" style="color:${tab.color};border-color:${tab.color}44;">${tab.rating}</div>
      </div>
      <div class="cmp-explain">
        <div class="cmp-explain-title">WHY THIS NOTATION</div>
        <div class="cmp-explain-text">${tab.explain}</div>
        <div class="cmp-tags">${tab.tags.map(t => `<span class="cmp-tag">${t}</span>`).join('')}</div>
      </div>
    `;

    const sliderLabel = key === 'compare'
      ? `n=10 → ${100} time ops, 1 space`
      : `n=10 → ${Math.round((tab.fn || (()=>0))(10))} ${key === 'space' ? 'vars' : 'ops'}`;

    sliderRow.innerHTML = `
      <span class="cmp-slider-label">INPUT SIZE</span>
      <input type="range" class="cmp-slider" id="cmp-n-slider" min="1" max="20" value="10">
      <span class="cmp-slider-val" id="cmp-n-val">${sliderLabel}</span>
    `;

    document.getElementById('cmp-n-slider').addEventListener('input', (e) => {
      sliderN = parseInt(e.target.value);
      if (activeTab === 'compare') {
        document.getElementById('cmp-n-val').textContent = `n=${sliderN} → ${sliderN*sliderN} time ops, 1 space`;
        drawCompareGraph();
      } else {
        const t = TABS[activeTab];
        const val = Math.round(t.fn(sliderN));
        document.getElementById('cmp-n-val').textContent = `n=${sliderN} → ${val} ${activeTab === 'space' ? 'vars' : 'ops'}`;
        drawGraph(t.activeIdx, t.yLabel);
      }
    });

    if (key === 'compare') drawCompareGraph();
    else drawGraph(tab.activeIdx, tab.yLabel);
  }

  tabs.forEach(t => t.addEventListener('click', () => loadTab(t.dataset.cmp)));

  cmpCard.addEventListener('click', (e) => {
    e.preventDefault();
    appLanding.style.display = 'none';
    appTitle.style.display = 'none';
    appFooter.style.display = 'none';
    demoView.style.display = 'flex';
    loadTab('time');
  });

  document.getElementById('demo-cmp-back').addEventListener('click', () => {
    demoView.style.display = 'none';
    appLanding.style.display = '';
    appTitle.style.display = '';
    appFooter.style.display = '';
  });
})();


/* ─── 18. DFOS DEMO ─────────────────────────────────────── */
(function initDFOSDemo() {
  const appLanding = document.querySelector('.app-cards');
  const appTitle   = document.querySelector('.app-title');
  const appFooter  = document.querySelector('.app-footer');
  const demoView   = document.getElementById('demo-dfos');
  const dfosCard   = document.querySelector('.app-card.app-dfos');
  if (!demoView || !dfosCard) return;

  const procsEl   = document.getElementById('dfos-procs');
  const infoEl    = document.getElementById('dfos-info');
  const canvasEl  = document.getElementById('dfos-canvas');
  const counterEl = document.getElementById('dfos-counter');
  const tabs      = document.querySelectorAll('#dfos-tabs .ds-tab');

  const SVG_NS = 'http://www.w3.org/2000/svg';
  function svgE(tag, attrs) {
    const e = document.createElementNS(SVG_NS, tag);
    for (const [k,v] of Object.entries(attrs || {})) e.setAttribute(k, v);
    return e;
  }
  function svgT(x, y, text, attrs) {
    const t = svgE('text', { x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central',
      fill: '#c8d3f5', 'font-family': "'Share Tech Mono', monospace", 'font-size': '11', ...attrs });
    t.textContent = text;
    return t;
  }

  const PCOL = ['#ff6b35','#00d4ff','#7b2fff'];
  const SCOL = { New:'#ff6b35', Ready:'#00d4ff', Running:'#00ff9d', Waiting:'#7b2fff', Terminated:'#555577' };

  /* Pre-simulate Round Robin q=3 with 3 processes */
  const PROCS = [
    { pid: 0, name: 'P0', burst: 6, arrival: 0, color: PCOL[0], pages: [0,1,2] },
    { pid: 1, name: 'P1', burst: 4, arrival: 1, color: PCOL[1], pages: [3,4] },
    { pid: 2, name: 'P2', burst: 5, arrival: 2, color: PCOL[2], pages: [5,6,7] },
  ];
  const Q = 3;

  /* Generate tick-by-tick states */
  function simulate() {
    const states = [];
    const rem = PROCS.map(p => p.burst);
    const status = PROCS.map(() => 'New');
    const ready = [];
    let running = -1, qLeft = 0;
    const gantt = [];
    const totalTicks = PROCS.reduce((s,p) => s + p.burst, 0) + 3;

    for (let t = 0; t <= totalTicks; t++) {
      /* Arrivals */
      PROCS.forEach((p, i) => {
        if (p.arrival === t && status[i] === 'New') { status[i] = 'Ready'; ready.push(i); }
      });

      /* Check if running finished or quantum expired */
      if (running >= 0) {
        if (rem[running] === 0) {
          status[running] = 'Terminated';
          running = -1; qLeft = 0;
        } else if (qLeft === 0) {
          status[running] = 'Ready';
          ready.push(running);
          running = -1;
        }
      }

      /* Dispatch next */
      if (running < 0 && ready.length > 0) {
        running = ready.shift();
        status[running] = 'Running';
        qLeft = Q;
      }

      states.push({
        tick: t,
        status: [...status],
        running,
        ready: [...ready],
        rem: [...rem],
        gantt: [...gantt],
      });

      /* Execute tick */
      if (running >= 0) {
        rem[running]--;
        qLeft--;
        gantt.push({ pid: running, tick: t });
      } else {
        gantt.push({ pid: -1, tick: t });
      }

      if (status.every(s => s === 'Terminated')) { states.push({ tick: t+1, status: [...status], running: -1, ready: [], rem: [...rem], gantt: [...gantt] }); break; }
    }
    return states;
  }

  const STATES = simulate();
  let activeTab = 'pcb';
  let dfosStep = 0;
  let dfosPlayTimer = null;

  /* ── PCB STATE DIAGRAM ── */
  function drawPCB(step) {
    const W = 600, H = 300;
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', W);

    const positions = {
      New:        { x: 80,  y: 80 },
      Ready:      { x: 220, y: 80 },
      Running:    { x: 400, y: 80 },
      Terminated: { x: 540, y: 80 },
      Waiting:    { x: 310, y: 220 },
    };

    const arrows = [
      { from: 'New', to: 'Ready', label: 'admitted' },
      { from: 'Ready', to: 'Running', label: 'dispatch' },
      { from: 'Running', to: 'Ready', label: 'interrupt', curve: -40 },
      { from: 'Running', to: 'Waiting', label: 'I/O wait' },
      { from: 'Waiting', to: 'Ready', label: 'I/O done' },
      { from: 'Running', to: 'Terminated', label: 'exit' },
    ];

    /* Draw arrows */
    arrows.forEach(a => {
      const f = positions[a.from], t = positions[a.to];
      const R = 30;
      const dx = t.x - f.x, dy = t.y - f.y, len = Math.sqrt(dx*dx+dy*dy);
      const ux = dx/len, uy = dy/len;
      if (a.curve) {
        const mx = (f.x+t.x)/2, my = (f.y+t.y)/2 + a.curve;
        svg.appendChild(svgE('path', { d: `M${f.x+ux*R},${f.y+uy*R} Q${mx},${my} ${t.x-ux*R},${t.y-uy*R}`, fill: 'none', stroke: '#2a2a45', 'stroke-width': 1.5 }));
        svg.appendChild(svgT(mx, my - 8, a.label, { fill: '#7a8ab0', 'font-size': '8' }));
      } else {
        const x1 = f.x+ux*R, y1 = f.y+uy*R, x2 = t.x-ux*R, y2 = t.y-uy*R;
        svg.appendChild(svgE('line', { x1, y1, x2, y2, stroke: '#2a2a45', 'stroke-width': 1.5 }));
        svg.appendChild(svgE('polygon', { points: `${x2-ux*6-uy*4},${y2-uy*6+ux*4} ${x2},${y2} ${x2-ux*6+uy*4},${y2-uy*6-ux*4}`, fill: '#2a2a45' }));
        const lx = (f.x+t.x)/2 + uy*14, ly = (f.y+t.y)/2 - ux*14;
        svg.appendChild(svgT(lx, ly, a.label, { fill: '#7a8ab0', 'font-size': '8' }));
      }
    });

    /* Draw state circles */
    for (const [state, pos] of Object.entries(positions)) {
      const count = step.status.filter(s => s === state).length;
      const hasProcs = count > 0;
      const col = SCOL[state];

      /* Glow for running */
      if (state === 'Running' && hasProcs) {
        svg.appendChild(svgE('circle', { cx: pos.x, cy: pos.y, r: 34, fill: 'none', stroke: col, 'stroke-width': 1, opacity: 0.3 }));
      }

      svg.appendChild(svgE('circle', { cx: pos.x, cy: pos.y, r: 30, fill: hasProcs ? col + '22' : '#12121e', stroke: col, 'stroke-width': hasProcs ? 2 : 1.5, opacity: hasProcs ? 1 : 0.4 }));
      svg.appendChild(svgT(pos.x, pos.y - 4, state, { fill: hasProcs ? col : '#555', 'font-size': '10', 'font-weight': 'bold' }));

      /* Process names inside */
      if (hasProcs) {
        const names = PROCS.filter((_, i) => step.status[i] === state).map(p => p.name);
        svg.appendChild(svgT(pos.x, pos.y + 14, names.join(','), { fill: col, 'font-size': '9' }));
      }

      /* Count badge */
      if (count > 0) {
        svg.appendChild(svgE('circle', { cx: pos.x + 22, cy: pos.y - 22, r: 9, fill: col }));
        svg.appendChild(svgT(pos.x + 22, pos.y - 22, String(count), { fill: '#0d0d14', 'font-size': '9', 'font-weight': 'bold' }));
      }
    }

    return svg;
  }

  /* ── GANTT CHART ── */
  function drawGantt(step) {
    const W = 600, H = 180;
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', W);

    const PAD = 50, barH = 28, gap = 6;
    const maxT = Math.max(step.tick + 2, 16);
    const gw = W - PAD - 20;
    const tw = gw / maxT;

    /* Time axis */
    svg.appendChild(svgE('line', { x1: PAD, y1: H - 30, x2: PAD + gw, y2: H - 30, stroke: '#2a2a45', 'stroke-width': 1 }));
    for (let t = 0; t <= maxT; t += 2) {
      const x = PAD + t * tw;
      svg.appendChild(svgE('line', { x1: x, y1: H - 33, x2: x, y2: H - 27, stroke: '#2a2a45', 'stroke-width': 1 }));
      svg.appendChild(svgT(x, H - 18, String(t), { fill: '#7a8ab0', 'font-size': '9' }));
    }

    /* Process labels */
    PROCS.forEach((p, i) => {
      const y = 16 + i * (barH + gap);
      svg.appendChild(svgT(24, y + barH/2, p.name, { fill: p.color, 'font-size': '11', 'font-weight': 'bold' }));

      /* Draw bars from gantt */
      step.gantt.forEach(g => {
        if (g.pid !== p.pid) return;
        const x = PAD + g.tick * tw;
        svg.appendChild(svgE('rect', { x, y, width: Math.max(tw - 1, 2), height: barH, rx: 2, fill: p.color + 'cc' }));
      });
    });

    /* Current tick marker */
    const cx = PAD + step.tick * tw;
    svg.appendChild(svgE('line', { x1: cx, y1: 6, x2: cx, y2: H - 30, stroke: '#ffe066', 'stroke-width': 1.5, 'stroke-dasharray': '4,3' }));
    svg.appendChild(svgT(cx, 0, `t=${step.tick}`, { fill: '#ffe066', 'font-size': '9' }));

    return svg;
  }

  /* ── MEMORY FRAMES ── */
  function drawMemory(step) {
    const W = 500, H = 200;
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', W);

    const COLS = 8, cellW = 50, cellH = 32, padX = 40, padY = 30;
    const totalFrames = 16;

    svg.appendChild(svgT(padX + (COLS * cellW)/2, 12, 'PHYSICAL MEMORY (16 frames)', { fill: '#7a8ab0', 'font-size': '10', 'letter-spacing': '1px' }));

    /* Which frames are allocated */
    const frameMap = {};
    PROCS.forEach((p, i) => {
      if (step.status[i] !== 'Terminated') {
        p.pages.forEach((frame) => { frameMap[frame] = p; });
      }
    });

    for (let f = 0; f < totalFrames; f++) {
      const col = f % COLS, row = Math.floor(f / COLS);
      const x = padX + col * cellW, y = padY + row * (cellH + 4);
      const owner = frameMap[f];

      svg.appendChild(svgE('rect', {
        x, y, width: cellW - 2, height: cellH, rx: 3,
        fill: owner ? owner.color + '33' : '#12121e',
        stroke: owner ? owner.color : '#2a2a45',
        'stroke-width': owner ? 1.5 : 1,
        opacity: owner ? 1 : 0.4,
      }));

      if (owner) {
        svg.appendChild(svgT(x + (cellW-2)/2, y + cellH/2 - 4, owner.name, { fill: owner.color, 'font-size': '10', 'font-weight': 'bold' }));
        svg.appendChild(svgT(x + (cellW-2)/2, y + cellH/2 + 10, `F${f}`, { fill: '#7a8ab0', 'font-size': '8' }));
      } else {
        svg.appendChild(svgT(x + (cellW-2)/2, y + cellH/2, `F${f}`, { fill: '#3a3a55', 'font-size': '9' }));
      }
    }

    return svg;
  }

  function render() {
    canvasEl.innerHTML = '';
    const step = STATES[dfosStep];
    counterEl.textContent = `tick ${step.tick} / ${STATES[STATES.length-1].tick}`;

    let svg;
    if (activeTab === 'pcb') svg = drawPCB(step);
    else if (activeTab === 'gantt') svg = drawGantt(step);
    else svg = drawMemory(step);
    canvasEl.appendChild(svg);

    /* Process info */
    procsEl.innerHTML = PROCS.map((p, i) => {
      const s = step.status[i];
      const col = SCOL[s];
      return `<span style="color:${p.color};">${p.name}</span> <span style="color:${col};">${s}</span> (${step.rem[i]} left)`;
    }).join('<br>');

    infoEl.innerHTML = [
      `<span class="var-name">algo</span> = <span class="var-value">Round Robin</span>`,
      `<span class="var-name">quantum</span> = <span class="var-value">${Q}</span>`,
      `<span class="var-name">tick</span> = <span class="var-value">${step.tick}</span>`,
      `<span class="var-name">running</span> = <span class="var-value">${step.running >= 0 ? PROCS[step.running].name : 'idle'}</span>`,
    ].join('<br>');
  }

  function stopDFOSPlay() {
    if (dfosPlayTimer) { clearInterval(dfosPlayTimer); dfosPlayTimer = null; }
    const btn = document.getElementById('dfos-play');
    btn.innerHTML = '&#9654; PLAY'; btn.classList.remove('playing');
  }

  document.getElementById('dfos-step').addEventListener('click', () => {
    if (dfosStep < STATES.length - 1) { dfosStep++; render(); }
  });
  document.getElementById('dfos-prev').addEventListener('click', () => {
    if (dfosStep > 0) { dfosStep--; render(); }
  });
  document.getElementById('dfos-reset').addEventListener('click', () => {
    stopDFOSPlay(); dfosStep = 0; render();
  });
  document.getElementById('dfos-play').addEventListener('click', () => {
    if (dfosPlayTimer) { stopDFOSPlay(); return; }
    const btn = document.getElementById('dfos-play');
    btn.innerHTML = '&#9632; STOP'; btn.classList.add('playing');
    dfosPlayTimer = setInterval(() => {
      if (dfosStep < STATES.length - 1) { dfosStep++; render(); }
      else stopDFOSPlay();
    }, 500);
  });

  tabs.forEach(t => t.addEventListener('click', () => {
    activeTab = t.dataset.dfos;
    tabs.forEach(tb => tb.classList.toggle('active', tb.dataset.dfos === activeTab));
    render();
  }));

  dfosCard.addEventListener('click', (e) => {
    e.preventDefault();
    appLanding.style.display = 'none';
    appTitle.style.display = 'none';
    appFooter.style.display = 'none';
    demoView.style.display = 'flex';
    activeTab = 'pcb'; dfosStep = 0;
    tabs.forEach(t => t.classList.toggle('active', t.dataset.dfos === 'pcb'));
    render();
  });

  document.getElementById('demo-dfos-back').addEventListener('click', () => {
    stopDFOSPlay();
    demoView.style.display = 'none';
    appLanding.style.display = '';
    appTitle.style.display = '';
    appFooter.style.display = '';
  });
})();


/* ─── 19. AUTOMATA DEMO ─────────────────────────────────── */
(function initAutDemo() {
  const appLanding = document.querySelector('.app-cards');
  const appTitle   = document.querySelector('.app-title');
  const appFooter  = document.querySelector('.app-footer');
  const demoView   = document.getElementById('demo-aut');
  const autCard    = document.querySelector('.app-card.app-aut');
  if (!demoView || !autCard) return;

  const canvasEl  = document.getElementById('aut-canvas');
  const tapeEl    = document.getElementById('aut-tape');
  const logEl     = document.getElementById('aut-log');
  const counterEl = document.getElementById('aut-counter');

  const SVG_NS = 'http://www.w3.org/2000/svg';
  function svgE(tag, attrs) {
    const e = document.createElementNS(SVG_NS, tag);
    for (const [k,v] of Object.entries(attrs || {})) e.setAttribute(k, v);
    return e;
  }
  function svgT(x, y, text, attrs) {
    const t = svgE('text', { x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central',
      fill: '#c8d3f5', 'font-family': "'Share Tech Mono', monospace", 'font-size': '13', ...attrs });
    t.textContent = text;
    return t;
  }

  /* DFA: accepts strings ending in "01" */
  const DFA_STATES = [
    { id: 'q0', x: 100, y: 130, accept: false, label: 'q0' },
    { id: 'q1', x: 280, y: 130, accept: false, label: 'q1' },
    { id: 'q2', x: 460, y: 130, accept: true,  label: 'q2' },
  ];
  const DFA_TRANS = {
    'q0': { '0': 'q1', '1': 'q0' },
    'q1': { '0': 'q1', '1': 'q2' },
    'q2': { '0': 'q1', '1': 'q0' },
  };
  const INPUT = '110101';
  const R = 28;

  /* Pre-compute steps */
  function buildSteps() {
    const steps = [{ state: 'q0', pos: -1, log: 'Start at q0', result: null }];
    let cur = 'q0';
    for (let i = 0; i < INPUT.length; i++) {
      const ch = INPUT[i];
      const next = DFA_TRANS[cur][ch];
      steps.push({ state: next, pos: i, log: `Read '${ch}': ${cur} → ${next}`, result: null, from: cur, symbol: ch });
      cur = next;
    }
    const accepted = DFA_STATES.find(s => s.id === cur).accept;
    steps[steps.length - 1].result = accepted ? 'accept' : 'reject';
    steps[steps.length - 1].log += accepted ? ' — ACCEPTED' : ' — REJECTED';
    return steps;
  }
  const STEPS = buildSteps();

  let autStep = 0;
  let autPlayTimer = null;

  function drawArrow(svg, from, to, label, selfLoop, curveDir) {
    if (selfLoop) {
      const s = DFA_STATES.find(st => st.id === from);
      const cx = s.x, cy = s.y - R - 30;
      svg.appendChild(svgE('path', {
        d: `M${s.x-14},${s.y-R+2} C${s.x-30},${cy-10} ${s.x+30},${cy-10} ${s.x+14},${s.y-R+2}`,
        fill: 'none', stroke: '#2a2a45', 'stroke-width': 1.5
      }));
      svg.appendChild(svgE('polygon', {
        points: `${s.x+10},${s.y-R+6} ${s.x+16},${s.y-R} ${s.x+18},${s.y-R+10}`,
        fill: '#2a2a45'
      }));
      svg.appendChild(svgT(cx, cy - 8, label, { fill: '#7a8ab0', 'font-size': '12' }));
      return;
    }
    const a = DFA_STATES.find(st => st.id === from);
    const b = DFA_STATES.find(st => st.id === to);
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.sqrt(dx*dx+dy*dy);
    const ux = dx/len, uy = dy/len;
    const off = curveDir || 0;
    if (off) {
      const mx = (a.x+b.x)/2 - uy*off, my = (a.y+b.y)/2 + ux*off;
      svg.appendChild(svgE('path', {
        d: `M${a.x+ux*R},${a.y+uy*R} Q${mx},${my} ${b.x-ux*R},${b.y-uy*R}`,
        fill: 'none', stroke: '#2a2a45', 'stroke-width': 1.5
      }));
      svg.appendChild(svgT(mx, my - 10, label, { fill: '#7a8ab0', 'font-size': '12' }));
    } else {
      const x1 = a.x+ux*R, y1 = a.y+uy*R, x2 = b.x-ux*R, y2 = b.y-uy*R;
      svg.appendChild(svgE('line', { x1, y1, x2, y2, stroke: '#2a2a45', 'stroke-width': 1.5 }));
      const lx = (a.x+b.x)/2 - uy*14, ly = (a.y+b.y)/2 + ux*14;
      svg.appendChild(svgT(lx, ly, label, { fill: '#7a8ab0', 'font-size': '12' }));
    }
    /* Arrowhead at b */
    const ax2 = b.x-ux*(R+6)-uy*4, ay2 = b.y-uy*(R+6)+ux*4;
    const ax3 = b.x-ux*(R+6)+uy*4, ay3 = b.y-uy*(R+6)-ux*4;
    svg.appendChild(svgE('polygon', { points: `${b.x-ux*R},${b.y-uy*R} ${ax2},${ay2} ${ax3},${ay3}`, fill: '#2a2a45' }));
  }

  function render() {
    canvasEl.innerHTML = '';
    const step = STEPS[autStep];
    counterEl.textContent = `${autStep} / ${STEPS.length - 1}`;

    const W = 560, H = 260;
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', W);

    /* Start arrow */
    const s0 = DFA_STATES[0];
    svg.appendChild(svgE('line', { x1: s0.x - R - 30, y1: s0.y, x2: s0.x - R, y2: s0.y, stroke: '#00ff9d', 'stroke-width': 2 }));
    svg.appendChild(svgE('polygon', { points: `${s0.x-R-6},${s0.y-4} ${s0.x-R},${s0.y} ${s0.x-R-6},${s0.y+4}`, fill: '#00ff9d' }));

    /* Transitions */
    drawArrow(svg, 'q0', 'q0', '1', true);
    drawArrow(svg, 'q0', 'q1', '0');
    drawArrow(svg, 'q1', 'q1', '0', true);
    drawArrow(svg, 'q1', 'q2', '1');
    drawArrow(svg, 'q2', 'q1', '0', false, 40);
    drawArrow(svg, 'q2', 'q0', '1', false, -50);

    /* State circles */
    DFA_STATES.forEach(s => {
      const isActive = step.state === s.id;
      const isAccept = s.accept;
      const isResult = step.result && isActive;

      let fill = '#12121e', stroke = '#2a2a45', textFill = '#c8d3f5';

      if (isResult && step.result === 'accept') {
        fill = 'rgba(0,255,157,.15)'; stroke = '#00ff9d'; textFill = '#00ff9d';
      } else if (isResult && step.result === 'reject') {
        fill = 'rgba(255,68,102,.12)'; stroke = '#ff4466'; textFill = '#ff4466';
      } else if (isActive) {
        fill = 'rgba(255,224,102,.1)'; stroke = '#ffe066'; textFill = '#ffe066';
      }

      /* Accept double ring */
      if (isAccept) {
        svg.appendChild(svgE('circle', { cx: s.x, cy: s.y, r: R + 5, fill: 'none', stroke: isActive ? stroke : '#ffa100', 'stroke-width': 1.5 }));
      }

      /* Glow for active */
      if (isActive) {
        svg.appendChild(svgE('circle', { cx: s.x, cy: s.y, r: R + 10, fill: 'none', stroke, 'stroke-width': 1, opacity: 0.3 }));
      }

      svg.appendChild(svgE('circle', { cx: s.x, cy: s.y, r: R, fill, stroke, 'stroke-width': isActive ? 3 : 1.5 }));
      svg.appendChild(svgT(s.x, s.y, s.label, { fill: textFill, 'font-size': '16', 'font-weight': 'bold' }));
    });

    /* Result banner */
    if (step.result) {
      const col = step.result === 'accept' ? '#00ff9d' : '#ff4466';
      const txt = step.result === 'accept' ? 'ACCEPTED' : 'REJECTED';
      svg.appendChild(svgE('rect', { x: W/2 - 60, y: H - 36, width: 120, height: 26, rx: 3, fill: col + '22', stroke: col, 'stroke-width': 1 }));
      svg.appendChild(svgT(W/2, H - 23, txt, { fill: col, 'font-size': '12', 'font-weight': 'bold', 'letter-spacing': '2px' }));
    }

    canvasEl.appendChild(svg);

    /* Tape */
    tapeEl.innerHTML = INPUT.split('').map((ch, i) => {
      let style = 'display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;border:1px solid #2a2a45;border-radius:3px;margin:2px;font-size:14px;font-weight:bold;';
      if (i === step.pos) {
        style += 'border-color:#00d4ff;color:#00d4ff;background:rgba(0,212,255,.12);box-shadow:0 0 8px rgba(0,212,255,.4);';
      } else if (i < step.pos) {
        style += 'opacity:0.3;color:#7a8ab0;';
      } else {
        style += 'color:#c8d3f5;';
      }
      return `<span style="${style}">${ch}</span>`;
    }).join('');

    /* Log */
    const col = step.result === 'accept' ? '#00ff9d' : step.result === 'reject' ? '#ff4466' : '#c8d3f5';
    logEl.innerHTML = `<span style="color:${col};">${step.log}</span>`;
  }

  function stopAutPlay() {
    if (autPlayTimer) { clearInterval(autPlayTimer); autPlayTimer = null; }
    const btn = document.getElementById('aut-play');
    btn.innerHTML = '&#9654; PLAY'; btn.classList.remove('playing');
  }

  document.getElementById('aut-step').addEventListener('click', () => {
    if (autStep < STEPS.length - 1) { autStep++; render(); }
  });
  document.getElementById('aut-prev').addEventListener('click', () => {
    if (autStep > 0) { autStep--; render(); }
  });
  document.getElementById('aut-reset').addEventListener('click', () => {
    stopAutPlay(); autStep = 0; render();
  });
  document.getElementById('aut-play').addEventListener('click', () => {
    if (autPlayTimer) { stopAutPlay(); return; }
    const btn = document.getElementById('aut-play');
    btn.innerHTML = '&#9632; STOP'; btn.classList.add('playing');
    autPlayTimer = setInterval(() => {
      if (autStep < STEPS.length - 1) { autStep++; render(); }
      else stopAutPlay();
    }, 500);
  });

  autCard.addEventListener('click', (e) => {
    e.preventDefault();
    appLanding.style.display = 'none';
    appTitle.style.display = 'none';
    appFooter.style.display = 'none';
    demoView.style.display = 'flex';
    autStep = 0;
    render();
  });

  document.getElementById('demo-aut-back').addEventListener('click', () => {
    stopAutPlay();
    demoView.style.display = 'none';
    appLanding.style.display = '';
    appTitle.style.display = '';
    appFooter.style.display = '';
  });
})();

/* ─── 20. NUMERICAL METHODS DEMO ─────────────────────────── */
(function initNumDemo() {
  const appLanding = document.querySelector('.app-cards');
  const appTitle   = document.querySelector('.app-title');
  const appFooter  = document.querySelector('.app-footer');
  const demoView   = document.getElementById('demo-num');
  const numCard    = document.querySelector('.app-card.app-num');
  if (!demoView || !numCard) return;

  const tableEl   = document.getElementById('num-table');
  const canvasEl  = document.getElementById('num-canvas');
  const counterEl = document.getElementById('num-counter');

  const SVG_NS = 'http://www.w3.org/2000/svg';
  function svgE(tag, attrs) {
    const e = document.createElementNS(SVG_NS, tag);
    for (const [k,v] of Object.entries(attrs || {})) e.setAttribute(k, v);
    return e;
  }
  function svgT(x, y, text, attrs) {
    const t = svgE('text', { x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central',
      fill: '#c8d3f5', 'font-family': "'Share Tech Mono', monospace", 'font-size': '11', ...attrs });
    t.textContent = text;
    return t;
  }

  /* f(x) = x³ - x - 2,  f'(x) = 3x² - 1 */
  const f  = x => x*x*x - x - 2;
  const fp = x => 3*x*x - 1;
  const ROOT = 1.52138; /* approximate root */

  /* Pre-compute Newton iterations from x₀=3.0 */
  function buildIterations() {
    const iters = [];
    let x = 3.0;
    iters.push({ x, fx: f(x), fpx: fp(x) });
    for (let i = 0; i < 6; i++) {
      const fx = f(x), fpx = fp(x);
      const xNext = x - fx / fpx;
      iters.push({ x: xNext, fx: f(xNext), fpx: fp(xNext), xPrev: x });
      x = xNext;
    }
    return iters;
  }
  const ITERS = buildIterations();

  let numStep = 0;
  let numPlayTimer = null;

  /* Graph parameters */
  const XMIN = -1.5, XMAX = 3.5, YMIN = -6, YMAX = 22;
  const W = 580, H = 380, PAD_L = 48, PAD_R = 16, PAD_T = 16, PAD_B = 36;
  const gw = W - PAD_L - PAD_R, gh = H - PAD_T - PAD_B;

  function toSX(x) { return PAD_L + ((x - XMIN) / (XMAX - XMIN)) * gw; }
  function toSY(y) { return PAD_T + ((YMAX - y) / (YMAX - YMIN)) * gh; }

  function render() {
    canvasEl.innerHTML = '';
    counterEl.textContent = `${numStep} / ${ITERS.length - 1}`;

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', W);

    /* Grid */
    for (let x = Math.ceil(XMIN); x <= XMAX; x++) {
      const sx = toSX(x);
      svg.appendChild(svgE('line', { x1: sx, y1: PAD_T, x2: sx, y2: PAD_T + gh, stroke: '#1a1a2e', 'stroke-width': 1 }));
      svg.appendChild(svgT(sx, PAD_T + gh + 16, String(x), { fill: '#7a8ab0', 'font-size': '9' }));
    }
    for (let y = Math.ceil(YMIN); y <= YMAX; y += 4) {
      const sy = toSY(y);
      svg.appendChild(svgE('line', { x1: PAD_L, y1: sy, x2: PAD_L + gw, y2: sy, stroke: '#1a1a2e', 'stroke-width': 1 }));
      svg.appendChild(svgT(PAD_L - 18, sy, String(y), { fill: '#7a8ab0', 'font-size': '9' }));
    }

    /* Axes */
    const ax0 = toSX(0), ay0 = toSY(0);
    svg.appendChild(svgE('line', { x1: PAD_L, y1: ay0, x2: PAD_L + gw, y2: ay0, stroke: '#2a2a45', 'stroke-width': 1.5 }));
    svg.appendChild(svgE('line', { x1: ax0, y1: PAD_T, x2: ax0, y2: PAD_T + gh, stroke: '#2a2a45', 'stroke-width': 1.5 }));

    /* Function curve */
    let curvePath = '';
    const steps = 200;
    for (let i = 0; i <= steps; i++) {
      const x = XMIN + (XMAX - XMIN) * (i / steps);
      const y = f(x);
      const sx = toSX(x), sy = toSY(y);
      if (sy < PAD_T - 20 || sy > PAD_T + gh + 20) {
        curvePath += `M${sx},${Math.max(PAD_T - 5, Math.min(PAD_T + gh + 5, sy))}`;
        continue;
      }
      curvePath += (curvePath === '' || curvePath.endsWith('M') ? 'M' : 'L') + `${sx},${sy}`;
    }
    svg.appendChild(svgE('path', { d: curvePath, fill: 'none', stroke: '#00d4ff', 'stroke-width': 2.5 }));

    /* f(x) label */
    svg.appendChild(svgT(toSX(XMAX) - 10, toSY(f(XMAX - 0.3)) - 14, 'f(x) = x³−x−2', { fill: '#00d4ff', 'font-size': '10', 'text-anchor': 'end' }));

    /* Root marker */
    svg.appendChild(svgE('circle', { cx: toSX(ROOT), cy: toSY(0), r: 5, fill: 'none', stroke: '#00ff9d', 'stroke-width': 1.5, 'stroke-dasharray': '3,2' }));
    svg.appendChild(svgT(toSX(ROOT), toSY(0) + 16, 'root', { fill: '#00ff9d', 'font-size': '9' }));

    /* Draw iterations up to current step */
    for (let i = 0; i <= numStep && i < ITERS.length; i++) {
      const it = ITERS[i];
      const sx = toSX(it.x), sy = toSY(it.fx);
      const isCurrent = i === numStep;
      const opacity = isCurrent ? 1 : 0.2;

      /* Vertical drop from x-axis to curve */
      svg.appendChild(svgE('line', { x1: sx, y1: toSY(0), x2: sx, y2: sy, stroke: '#00ff9d', 'stroke-width': 1, opacity, 'stroke-dasharray': '3,3' }));

      /* Point on curve */
      svg.appendChild(svgE('circle', { cx: sx, cy: sy, r: isCurrent ? 5 : 3, fill: isCurrent ? '#00ff9d' : '#00ff9d', stroke: '#0d0d14', 'stroke-width': 1.5, opacity }));

      /* Tangent line */
      if (i < ITERS.length - 1 && i <= numStep) {
        const slope = it.fpx;
        const xNext = it.x - it.fx / slope;
        /* Draw tangent from (x, f(x)) to (xNext, 0) and a bit beyond */
        const tLen = 0.6;
        const tx1 = it.x - tLen, ty1 = it.fx - slope * tLen;
        const tx2 = xNext + tLen * 0.3, ty2 = 0 + slope * tLen * 0.3;
        svg.appendChild(svgE('line', {
          x1: toSX(tx1), y1: toSY(ty1), x2: toSX(tx2), y2: toSY(ty2),
          stroke: '#ff9d00', 'stroke-width': isCurrent ? 2 : 1, opacity: isCurrent ? 0.9 : 0.15,
          'stroke-dasharray': '6,4'
        }));

        /* x-axis intersection dot */
        if (isCurrent) {
          svg.appendChild(svgE('circle', { cx: toSX(xNext), cy: toSY(0), r: 4, fill: '#ff9d00', stroke: '#0d0d14', 'stroke-width': 1.5 }));
          svg.appendChild(svgT(toSX(xNext), toSY(0) - 12, `x${i+1}`, { fill: '#ff9d00', 'font-size': '9' }));
        }
      }

      /* Label current point */
      if (isCurrent) {
        svg.appendChild(svgT(sx + 12, sy - 10, `(${it.x.toFixed(3)}, ${it.fx.toFixed(3)})`, { fill: '#00ff9d', 'font-size': '9', 'text-anchor': 'start' }));
      }
    }

    canvasEl.appendChild(svg);

    /* Iteration table */
    let tableHTML = '<span style="color:#7a8ab0;">n &nbsp; xₙ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; f(xₙ)</span><br>';
    for (let i = 0; i <= numStep && i < ITERS.length; i++) {
      const it = ITERS[i];
      const isCurrent = i === numStep;
      const col = isCurrent ? '#00ff9d' : '#7a8ab0';
      tableHTML += `<span style="color:${col};">${i} &nbsp; ${it.x.toFixed(6)} &nbsp; ${it.fx.toFixed(6)}</span><br>`;
    }
    if (numStep >= ITERS.length - 1) {
      tableHTML += `<br><span style="color:#00ff9d;font-weight:bold;">Root ≈ ${ITERS[ITERS.length-1].x.toFixed(6)}</span>`;
    }
    tableEl.innerHTML = tableHTML;

  }

  function stopNumPlay() {
    if (numPlayTimer) { clearInterval(numPlayTimer); numPlayTimer = null; }
    const btn = document.getElementById('num-play');
    btn.innerHTML = '&#9654; PLAY'; btn.classList.remove('playing');
  }

  document.getElementById('num-step').addEventListener('click', () => {
    if (numStep < ITERS.length - 1) { numStep++; render(); }
  });
  document.getElementById('num-prev').addEventListener('click', () => {
    if (numStep > 0) { numStep--; render(); }
  });
  document.getElementById('num-reset').addEventListener('click', () => {
    stopNumPlay(); numStep = 0; render();
  });
  document.getElementById('num-play').addEventListener('click', () => {
    if (numPlayTimer) { stopNumPlay(); return; }
    const btn = document.getElementById('num-play');
    btn.innerHTML = '&#9632; STOP'; btn.classList.add('playing');
    numPlayTimer = setInterval(() => {
      if (numStep < ITERS.length - 1) { numStep++; render(); }
      else stopNumPlay();
    }, 900);
  });

  numCard.addEventListener('click', (e) => {
    e.preventDefault();
    appLanding.style.display = 'none';
    appTitle.style.display = 'none';
    appFooter.style.display = 'none';
    demoView.style.display = 'flex';
    numStep = 0;
    render();
  });

  document.getElementById('demo-num-back').addEventListener('click', () => {
    stopNumPlay();
    demoView.style.display = 'none';
    appLanding.style.display = '';
    appTitle.style.display = '';
    appFooter.style.display = '';
  });
})();

/* ─── 21. BOOLEAN ALGEBRA DEMO ───────────────────────────── */
(function initBoolDemo() {
  const appLanding = document.querySelector('.app-cards');
  const appTitle   = document.querySelector('.app-title');
  const appFooter  = document.querySelector('.app-footer');
  const demoView   = document.getElementById('demo-bool');
  const boolCard   = document.querySelector('.app-card.app-bool');
  if (!demoView || !boolCard) return;

  const canvasEl = document.getElementById('bool-canvas');
  const tabs     = document.querySelectorAll('#bool-tabs .ds-tab');

  const SVG_NS = 'http://www.w3.org/2000/svg';
  function svgE(tag, attrs) {
    const e = document.createElementNS(SVG_NS, tag);
    for (const [k,v] of Object.entries(attrs || {})) e.setAttribute(k, v);
    return e;
  }
  function svgT(x, y, text, attrs) {
    const t = svgE('text', { x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central',
      fill: '#c8d3f5', 'font-family': "'Share Tech Mono', monospace", 'font-size': '12', ...attrs });
    t.textContent = text;
    return t;
  }

  /* f = (A AND B) OR (A AND C) */
  /* Truth table: A B C | f */
  const ROWS = [
    [0,0,0, 0], [0,0,1, 0], [0,1,0, 0], [0,1,1, 0],
    [1,0,0, 0], [1,0,1, 1], [1,1,0, 1], [1,1,1, 1],
  ];

  let activeTab = 'truth';

  /* ── TRUTH TABLE ── */
  function drawTruth() {
    canvasEl.innerHTML = '';
    const div = document.createElement('div');
    div.style.cssText = "font-family:'Share Tech Mono',monospace;font-size:13px;";

    let html = '<table style="border-collapse:collapse;margin:auto;">';
    html += '<tr>';
    ['A','B','C','f'].forEach((h,i) => {
      const col = i < 3 ? '#7a8ab0' : '#a855f7';
      html += `<th style="padding:8px 20px;border-bottom:2px solid #2a2a45;color:${col};font-weight:bold;letter-spacing:2px;">${h}</th>`;
    });
    html += '</tr>';

    ROWS.forEach((r, ri) => {
      const bg = ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.02)';
      html += `<tr style="background:${bg};">`;
      r.forEach((v, ci) => {
        let col = '#c8d3f5';
        if (ci === 3) col = v === 1 ? '#00ff9d' : '#ff3355';
        const fw = ci === 3 ? 'bold' : 'normal';
        html += `<td style="padding:7px 20px;text-align:center;color:${col};font-weight:${fw};border-bottom:1px solid #1a1a2e;">${v}</td>`;
      });
      html += '</tr>';
    });
    html += '</table>';
    div.innerHTML = html;
    canvasEl.appendChild(div);
  }

  /* ── LOGIC GATES ── */
  function drawGates() {
    canvasEl.innerHTML = '';
    const W = 520, H = 300;
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', W);

    /* Input labels */
    svg.appendChild(svgT(30, 60, 'A', { fill: '#00d4ff', 'font-size': '14', 'font-weight': 'bold' }));
    svg.appendChild(svgT(30, 120, 'B', { fill: '#00d4ff', 'font-size': '14', 'font-weight': 'bold' }));
    svg.appendChild(svgT(30, 220, 'C', { fill: '#00d4ff', 'font-size': '14', 'font-weight': 'bold' }));

    /* Wires from inputs */
    /* A wire — branches to both AND gates */
    svg.appendChild(svgE('line', { x1: 50, y1: 60, x2: 140, y2: 60, stroke: '#2a2a45', 'stroke-width': 1.5 }));
    svg.appendChild(svgE('line', { x1: 90, y1: 60, x2: 90, y2: 180, stroke: '#2a2a45', 'stroke-width': 1.5 }));
    svg.appendChild(svgE('line', { x1: 90, y1: 180, x2: 140, y2: 180, stroke: '#2a2a45', 'stroke-width': 1.5 }));
    /* B wire */
    svg.appendChild(svgE('line', { x1: 50, y1: 120, x2: 140, y2: 100, stroke: '#2a2a45', 'stroke-width': 1.5 }));
    /* C wire */
    svg.appendChild(svgE('line', { x1: 50, y1: 220, x2: 140, y2: 220, stroke: '#2a2a45', 'stroke-width': 1.5 }));

    /* AND gate 1 (A, B) at x=140..210 y=50..110 */
    svg.appendChild(svgE('path', { d: 'M140,50 L175,50 A35,30 0 0 1 175,110 L140,110 Z', fill: '#12121e', stroke: '#a855f7', 'stroke-width': 2 }));
    svg.appendChild(svgT(167, 80, 'AND', { fill: '#a855f7', 'font-size': '10', 'font-weight': 'bold' }));

    /* AND gate 2 (A, C) at x=140..210 y=170..230 */
    svg.appendChild(svgE('path', { d: 'M140,170 L175,170 A35,30 0 0 1 175,230 L140,230 Z', fill: '#12121e', stroke: '#a855f7', 'stroke-width': 2 }));
    svg.appendChild(svgT(167, 200, 'AND', { fill: '#a855f7', 'font-size': '10', 'font-weight': 'bold' }));

    /* Wires from AND gates to OR gate */
    svg.appendChild(svgE('line', { x1: 210, y1: 80, x2: 300, y2: 120, stroke: '#2a2a45', 'stroke-width': 1.5 }));
    svg.appendChild(svgE('line', { x1: 210, y1: 200, x2: 300, y2: 170, stroke: '#2a2a45', 'stroke-width': 1.5 }));

    /* OR gate at x=300..380 y=110..190 */
    svg.appendChild(svgE('path', { d: 'M300,110 Q320,110 350,150 Q320,190 300,190 Q330,150 300,110 Z', fill: '#12121e', stroke: '#00ff9d', 'stroke-width': 2 }));
    svg.appendChild(svgT(330, 150, 'OR', { fill: '#00ff9d', 'font-size': '10', 'font-weight': 'bold' }));

    /* Output wire */
    svg.appendChild(svgE('line', { x1: 355, y1: 150, x2: 430, y2: 150, stroke: '#2a2a45', 'stroke-width': 1.5 }));
    svg.appendChild(svgT(460, 150, 'f', { fill: '#00ff9d', 'font-size': '16', 'font-weight': 'bold' }));

    /* Signal dots */
    svg.appendChild(svgE('circle', { cx: 210, cy: 80, r: 3, fill: '#a855f7' }));
    svg.appendChild(svgE('circle', { cx: 210, cy: 200, r: 3, fill: '#a855f7' }));
    svg.appendChild(svgE('circle', { cx: 355, cy: 150, r: 3, fill: '#00ff9d' }));

    canvasEl.appendChild(svg);
  }

  /* ── K-MAP (3 variable: 2×4) ── */
  function drawKMap() {
    canvasEl.innerHTML = '';
    const W = 420, H = 260;
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', W);

    /* 3-var K-map: rows=A (0,1), cols=BC (00,01,11,10) Gray code */
    const cellW = 60, cellH = 50, padX = 80, padY = 70;
    const colHeaders = ['00','01','11','10'];
    const rowHeaders = ['0','1'];

    /* K-map values: (A AND B) OR (A AND C) */
    /* Row A=0: all 0. Row A=1: BC=00→0, 01→1, 11→1, 10→1 */
    const kmap = [
      [0, 0, 0, 0],
      [0, 1, 1, 1],
    ];

    /* Header labels */
    svg.appendChild(svgT(padX - 20, padY - 30, 'A\\BC', { fill: '#7a8ab0', 'font-size': '11' }));
    colHeaders.forEach((h, i) => {
      svg.appendChild(svgT(padX + i * cellW + cellW/2, padY - 10, h, { fill: '#00d4ff', 'font-size': '11' }));
    });
    rowHeaders.forEach((h, i) => {
      svg.appendChild(svgT(padX - 20, padY + i * cellH + cellH/2, h, { fill: '#00d4ff', 'font-size': '11' }));
    });

    /* Cells */
    kmap.forEach((row, ri) => {
      row.forEach((v, ci) => {
        const x = padX + ci * cellW, y = padY + ri * cellH;
        svg.appendChild(svgE('rect', {
          x, y, width: cellW, height: cellH,
          fill: v ? 'rgba(0,255,157,.08)' : '#12121e',
          stroke: '#2a2a45', 'stroke-width': 1
        }));
        svg.appendChild(svgT(x + cellW/2, y + cellH/2, String(v), {
          fill: v ? '#00ff9d' : '#ff3355', 'font-size': '16', 'font-weight': 'bold', opacity: v ? 1 : 0.5
        }));
      });
    });

    /* Group rectangle — covers A=1, BC ∈ {01,11,10} → columns 1,2,3 of row 1 */
    const gx = padX + 1 * cellW - 3, gy = padY + 1 * cellH - 3;
    const gw = 3 * cellW + 6, gh = cellH + 6;
    svg.appendChild(svgE('rect', {
      x: gx, y: gy, width: gw, height: gh, rx: 8,
      fill: 'none', stroke: '#00d4ff', 'stroke-width': 2.5, 'stroke-dasharray': '6,3'
    }));
    svg.appendChild(svgT(gx + gw/2, gy + gh + 18, 'Group: A ∧ (B ∨ C)', { fill: '#00d4ff', 'font-size': '10' }));

    /* Info */
    svg.appendChild(svgT(W/2, H - 10, '3-variable K-map · 4×2 · 3 minterms = 1', { fill: '#7a8ab0', 'font-size': '9' }));

    canvasEl.appendChild(svg);
  }

  /* ── SIMPLIFY ── */
  function drawSimplify() {
    canvasEl.innerHTML = '';
    const div = document.createElement('div');
    div.style.cssText = "font-family:'Share Tech Mono',monospace;font-size:12px;color:#c8d3f5;padding:24px;max-width:480px;line-height:2;";

    const steps = [
      { rule: 'Original', expr: '(A ∧ B) ∨ (A ∧ C)', color: '#a855f7' },
      { rule: 'Distribution Law', expr: 'A ∧ (B ∨ C)', color: '#00d4ff' },
      { rule: 'Minterms', expr: 'Σm(3, 5, 6, 7)', color: '#ff9d00' },
      { rule: 'Prime Implicants', expr: 'AB, AC → essential', color: '#7a8ab0' },
      { rule: 'Minimal Form', expr: 'A ∧ (B ∨ C)', color: '#00ff9d' },
    ];

    let html = '';
    steps.forEach((s, i) => {
      const isLast = i === steps.length - 1;
      html += `<div style="padding:12px 16px;border-left:3px solid ${s.color};margin-bottom:12px;background:${s.color}08;border-radius:0 4px 4px 0;">`;
      html += `<div style="font-family:'Orbitron',sans-serif;font-size:9px;letter-spacing:2px;color:${s.color};margin-bottom:4px;">${s.rule}</div>`;
      html += `<div style="font-size:${isLast ? '16' : '14'}px;color:${isLast ? '#00ff9d' : '#c8d3f5'};font-weight:${isLast ? 'bold' : 'normal'};">${s.expr}</div>`;
      html += '</div>';
      if (i < steps.length - 1) {
        html += `<div style="text-align:center;color:#2a2a45;font-size:16px;margin:-4px 0;">↓</div>`;
      }
    });
    div.innerHTML = html;
    canvasEl.appendChild(div);
  }

  function render() {
    if (activeTab === 'truth') drawTruth();
    else if (activeTab === 'gates') drawGates();
    else if (activeTab === 'kmap') drawKMap();
    else drawSimplify();
  }

  tabs.forEach(t => t.addEventListener('click', () => {
    activeTab = t.dataset.bool;
    tabs.forEach(tb => tb.classList.toggle('active', tb.dataset.bool === activeTab));
    render();
  }));

  boolCard.addEventListener('click', (e) => {
    e.preventDefault();
    appLanding.style.display = 'none';
    appTitle.style.display = 'none';
    appFooter.style.display = 'none';
    demoView.style.display = 'flex';
    activeTab = 'truth';
    tabs.forEach(t => t.classList.toggle('active', t.dataset.bool === 'truth'));
    render();
  });

  document.getElementById('demo-bool-back').addEventListener('click', () => {
    demoView.style.display = 'none';
    appLanding.style.display = '';
    appTitle.style.display = '';
    appFooter.style.display = '';
  });
})();
