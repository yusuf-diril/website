/**
 * Yazılarım — Gece modu, rastgele alıntı, ay evresi, gizli kelimeler (keşif)
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'yazilarim-theme';
  var AMBIENT_KEY = 'yazilarim-ambient';
  var PAGETURN_KEY = 'yazilarim-pageturn';
  var READING_FONT_KEY = 'yazilarim-reading-font';
  var PROSE_SIZE_KEY = 'yazilarim-prose-size';

  function getStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function setStoredTheme(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (e) {}
  }

  function getPreferredTheme() {
    var stored = getStoredTheme();
    if (stored === 'dark' || stored === 'light') return stored;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  }

  function applyTheme(theme) {
    var root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
    setStoredTheme(theme);
    updateToggleLabel(theme);
  }

  function updateToggleLabel(theme) {
    var btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    btn.setAttribute('aria-label', theme === 'dark' ? 'Gündüz modu' : 'Gece modu');
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  function initReveal() {
    var list = document.querySelector('.yazi-listesi-v4');
    if (!list) return;
    var items = list.querySelectorAll('li');
    if (!items.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { rootMargin: '0px 0px -40px 0px', threshold: 0 }
    );

    items.forEach(function (el) {
      observer.observe(el);
    });
  }

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function initHeroQuote() {
    if (typeof window.YAZILARIM_HERO_QUOTES !== 'undefined' && Array.isArray(window.YAZILARIM_HERO_QUOTES) && window.YAZILARIM_HERO_QUOTES.length > 0) {
      var el = document.querySelector('.hero-quote');
      if (el) {
        el.textContent = pickRandom(window.YAZILARIM_HERO_QUOTES);
      }
    }
  }

  function initFooterQuote() {
    var el = document.getElementById('foot-quote');
    if (!el || typeof window.YAZILARIM_HERO_QUOTES === 'undefined' || !Array.isArray(window.YAZILARIM_HERO_QUOTES) || window.YAZILARIM_HERO_QUOTES.length === 0) return;
    el.textContent = pickRandom(window.YAZILARIM_HERO_QUOTES);
  }

  function initYaziSatirReveal() {
    var viewport = document.getElementById('yazi-slider-viewport');
    if (viewport) return;
    var sections = document.querySelectorAll('.yazi-satir');
    if (!sections.length) return;
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          }
        });
      },
      { rootMargin: '0px 0px -25% 0px', threshold: 0 }
    );
    sections.forEach(function (el) {
      observer.observe(el);
    });
  }

  function initIndexSlider() {
    var viewport = document.getElementById('yazi-slider-viewport');
    var track = document.getElementById('yazi-slider-track');
    if (!viewport || !track) return;
    var total = parseInt(viewport.getAttribute('data-total-slides'), 10) || 1;
    var sections = viewport.querySelectorAll('.yazi-satir');
    var current = 0;
    var transitionMs = 850;
    var busy = false;

    function setSlide(index) {
      var next = index < 0 ? 0 : index >= total ? total - 1 : index;
      if (next === current) return;
      current = next;
      track.style.setProperty('--slide-index', String(current));
      sections.forEach(function (s, i) {
        s.classList.toggle('in-view', i === current);
      });
      busy = true;
      setTimeout(function () { busy = false; }, transitionMs);
    }

    viewport.addEventListener('wheel', function (e) {
      if (busy) return;
      if (e.deltaY > 0) setSlide(current + 1);
      else if (e.deltaY < 0) setSlide(current - 1);
    }, { passive: true });

    var touchStartY = 0;
    viewport.addEventListener('touchstart', function (e) {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    viewport.addEventListener('touchend', function (e) {
      if (busy || !e.changedTouches.length) return;
      var dy = touchStartY - e.changedTouches[0].clientY;
      if (dy > 50) setSlide(current + 1);
      else if (dy < -50) setSlide(current - 1);
    }, { passive: true });

    setSlide(0);
  }

  function initFontDrawer() {
    var drawer = document.getElementById('font-drawer');
    var toggle = document.querySelector('.font-drawer-toggle');
    var closeBtn = drawer && drawer.querySelector('.font-drawer-close');
    if (!drawer) return;

    function open() {
      drawer.setAttribute('aria-hidden', 'false');
      drawer.classList.add('is-open');
    }
    function close() {
      drawer.setAttribute('aria-hidden', 'true');
      drawer.classList.remove('is-open');
    }

    if (toggle) {
      toggle.addEventListener('click', function () {
        if (drawer.classList.contains('is-open')) close(); else open();
      });
    }
    if (closeBtn) closeBtn.addEventListener('click', close);
    drawer.addEventListener('click', function (e) {
      if (e.target === drawer) close();
    });
  }

  function initSignatureCycle() {
    var sig = document.querySelector('.site-signature');
    if (!sig) return;
    var raw = sig.getAttribute('data-signature-variations');
    if (!raw) return;
    try {
      var list = JSON.parse(raw);
      if (!Array.isArray(list) || list.length === 0) return;
      var index = 0;
      var duration = 3200;
      function next() {
        sig.style.opacity = '0';
        setTimeout(function () {
          index = (index + 1) % list.length;
          sig.textContent = list[index];
          sig.style.opacity = '1';
        }, 320);
      }
      setInterval(next, duration);
    } catch (e) {}
  }

  function getMoonPhase() {
    var year = new Date().getFullYear();
    var month = new Date().getMonth() + 1;
    var day = new Date().getDate();
    var c = 0;
    var e = 0;
    var jd = 0;
    var b = 0;
    if (month < 3) {
      c = year - 1;
      e = month + 12;
    } else {
      c = year;
      e = month;
    }
    jd = Math.floor(365.25 * c) + Math.floor(30.6001 * (e + 1)) + day - 694039.09;
    jd /= 29.5305882;
    b = parseInt(jd, 10);
    jd -= b;
    b = Math.round(jd * 8);
    if (b >= 8) b = 0;
    return b;
  }

  var moonChars = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];

  function initMoonPhase() {
    var el = document.querySelector('.moon-phase');
    if (el) {
      el.textContent = moonChars[getMoonPhase()] || '🌙';
    }
  }

  function initSecretOverlay() {
    var overlay = document.getElementById('secret-overlay');
    var textEl = overlay && overlay.querySelector('.secret-overlay-text');
    if (!overlay || !textEl) return;

    function open(secretText) {
      textEl.textContent = secretText || '';
      overlay.setAttribute('aria-hidden', 'false');
    }

    function close() {
      overlay.setAttribute('aria-hidden', 'true');
    }

    document.body.addEventListener('click', function (e) {
      var target = e.target.closest && e.target.closest('.secret-word');
      if (!target) return;
      e.preventDefault();
      open(target.getAttribute('data-secret'));
    });

    document.body.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var target = e.target.closest && e.target.closest('.secret-word');
      if (!target) return;
      e.preventDefault();
      open(target.getAttribute('data-secret'));
    });

    var closeBtn = overlay.querySelector('.secret-overlay-close');
    if (closeBtn) closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
  }

  function initPageTurn() {
    var main = document.querySelector('.main');
    if (!main) return;

    function runEnter() {
      try {
        if (sessionStorage.getItem(PAGETURN_KEY) !== '1') return;
      } catch (e) { return; }
      document.body.classList.add('page-enter-ready');
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          document.body.classList.add('page-enter');
          try { sessionStorage.removeItem(PAGETURN_KEY); } catch (e) {}
        });
      });
    }

    document.body.addEventListener('click', function (e) {
      var link = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!link || link.getAttribute('target') === '_blank' || e.ctrlKey || e.metaKey || e.shiftKey) return;
      var href = link.getAttribute('href');
      if (!href || href === '#' || href === '') return;
      try {
        var url = new URL(link.href, window.location.href);
        if (url.origin !== window.location.origin) return;
        var path = url.pathname;
        var isYaziOrHome = path.indexOf('yazi/') !== -1 || path.endsWith('index.html') || path === '/' || path.endsWith('/') || path.endsWith('sukut.html');
        if (!isYaziOrHome) return;
      } catch (err) { return; }

      e.preventDefault();
      try { sessionStorage.setItem(PAGETURN_KEY, '1'); } catch (e) {}
      document.body.classList.add('page-turn-out');

      var done = false;
      function go() {
        if (done) return;
        done = true;
        main.removeEventListener('transitionend', go);
        window.location.href = link.href;
      }
      main.addEventListener('transitionend', go);
      setTimeout(go, 280);
    });

    runEnter();
  }

  function initWordReveal() {
    var paragraphs = document.querySelectorAll('.yazi-page .prose p');
    if (!paragraphs.length) return;

    function wrapCharsInNode(node, startIndex) {
      if (node.nodeType !== 3) return startIndex;
      var text = node.textContent;
      if (!text) return startIndex;
      var frag = document.createDocumentFragment();
      var idx = startIndex;
      for (var i = 0; i < text.length; i++) {
        var span = document.createElement('span');
        span.className = 'char-reveal';
        span.textContent = text[i];
        span.style.animationDelay = (idx * 0.035) + 's';
        frag.appendChild(span);
        idx++;
      }
      node.parentNode.replaceChild(frag, node);
      return idx;
    }

    function wrapCharsInElement(el, startIndex) {
      var idx = startIndex;
      var nodes = [];
      for (var i = 0; i < el.childNodes.length; i++) nodes.push(el.childNodes[i]);
      for (var j = 0; j < nodes.length; j++) {
        var n = nodes[j];
        if (n.nodeType === 3) idx = wrapCharsInNode(n, idx);
        else if (n.nodeType === 1 && !n.classList.contains('secret-word')) idx = wrapCharsInElement(n, idx);
      }
      return idx;
    }

    paragraphs.forEach(function (p) {
      wrapCharsInElement(p, 0);
    });

    var nextToType = 0;
    var pending = {};
    var CHAR_DELAY_MS = 35;
    var ANIM_END_MS = 120;

    function startParagraph(index) {
      var p = paragraphs[index];
      if (!p || p.classList.contains('typing')) return;
      p.classList.add('typing');
      var chars = p.querySelectorAll('.char-reveal');
      var duration = (chars.length * CHAR_DELAY_MS) + ANIM_END_MS;
      setTimeout(function () {
        nextToType = index + 1;
        if (pending[nextToType]) startParagraph(nextToType);
      }, duration);
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var p = entry.target;
          var index = parseInt(p.getAttribute('data-typing-index'), 10);
          if (isNaN(index)) return;
          pending[index] = true;
          if (index === nextToType) startParagraph(index);
        });
      },
      { rootMargin: '0px 0px -80px 0px', threshold: 0 }
    );

    for (var i = 0; i < paragraphs.length; i++) {
      paragraphs[i].setAttribute('data-typing-index', i);
      observer.observe(paragraphs[i]);
    }
  }

  function initReadingFont() {
    var wrap = document.querySelector('.yazi-page') || document.querySelector('.index-page');
    var fontSelect = document.getElementById('reading-font-select');
    var sizeSelect = document.getElementById('reading-size-select');
    if (!wrap) return;
    try {
      var savedFont = localStorage.getItem(READING_FONT_KEY);
      if (savedFont && fontSelect) {
        wrap.setAttribute('data-reading-font', savedFont);
        fontSelect.value = savedFont;
      }
      var savedSize = localStorage.getItem(PROSE_SIZE_KEY);
      if (savedSize && sizeSelect) {
        wrap.setAttribute('data-prose-size', savedSize);
        sizeSelect.value = savedSize;
      }
    } catch (e) {}
    if (fontSelect) {
      fontSelect.addEventListener('change', function () {
        var val = fontSelect.value;
        wrap.setAttribute('data-reading-font', val);
        try { localStorage.setItem(READING_FONT_KEY, val); } catch (e) {}
      });
    }
    if (sizeSelect) {
      sizeSelect.addEventListener('change', function () {
        var val = sizeSelect.value;
        wrap.setAttribute('data-prose-size', val);
        try { localStorage.setItem(PROSE_SIZE_KEY, val); } catch (e) {}
      });
    }
  }

  function initAmbient() {
    var toggle = document.querySelector('.ambient-toggle');
    var audio = document.getElementById('ambient-audio');
    if (!toggle) return;

    try {
      if (localStorage.getItem(AMBIENT_KEY) === '1') {
        toggle.checked = true;
        if (audio && document.documentElement.getAttribute('data-theme') === 'dark') {
          audio.volume = 0.15;
          audio.play().catch(function () {});
        }
      }
    } catch (e) {}

    toggle.addEventListener('change', function () {
      try {
        localStorage.setItem(AMBIENT_KEY, toggle.checked ? '1' : '0');
      } catch (e) {}
      if (audio) {
        if (toggle.checked) {
          audio.volume = 0.15;
          audio.play().catch(function () {});
        } else {
          audio.pause();
        }
      }
    });
  }

  function init() {
    applyTheme(getPreferredTheme());

    var btn = document.querySelector('.theme-toggle');
    if (btn) {
      btn.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-theme');
        applyTheme(current === 'dark' ? 'light' : 'dark');
      });
    }

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        if (getStoredTheme()) return;
        applyTheme(e.matches ? 'dark' : 'light');
      });
    }

    initReveal();
    initHeroQuote();
    initFooterQuote();
    initSignatureCycle();
    initYaziSatirReveal();
    initIndexSlider();
    initFontDrawer();
    initMoonPhase();
    initPageTurn();
    initReadingFont();
    initWordReveal();
    initSecretOverlay();
    initAmbient();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
