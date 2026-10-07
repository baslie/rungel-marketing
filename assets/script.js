(function () {
  'use strict';

  // Ключи localStorage. THEME_KEY читает и inline-скрипт в <head> index.html.
  var THEME_KEY = 'rg-theme';
  var CHECKS_KEY = 'rg-checks';

  var ACTIVE_LINE = 0.3;      // доля высоты окна: секция выше этой линии считается текущей
  var STAGGER_MS = 60;        // задержка появления между соседними элементами
  var STAGGER_MAX = 6;        // после шестого соседа задержка не растёт
  var DELAY_RESET_MS = 1200;  // после появления задержку снимаем, чтобы hover реагировал сразу
  var REVEAL_SELECTOR = [
    '.part-head', '.gel', '.timeline > li', '.q-card', '.sci', '.knowhow li', '.vs-col', '.verdict',
    '.brief li', '.person', '.quote', '.problem', '.motive', '.flow li', '.case', '.story', '.risk',
    '.rm-col', '.price-chart', '.callout', '.insights'
  ].join(', ');

  var root = document.documentElement;
  var body = document.body;
  root.classList.add('js');

  var storage = {
    get: function (key) {
      try { return localStorage.getItem(key); } catch (e) { return null; }
    },
    set: function (key, value) {
      try { localStorage.setItem(key, value); } catch (e) { /* приватный режим */ }
    }
  };

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // ---------- прогресс чтения ----------
  function initProgress() {
    var bar = document.querySelector('.progress span');
    return function () {
      var max = root.scrollHeight - root.clientHeight;
      bar.style.setProperty('--p', max > 0 ? (root.scrollTop / max).toFixed(4) : 0);
    };
  }

  // ---------- тема ----------
  function initTheme() {
    document.querySelector('.theme-toggle').addEventListener('click', function () {
      var current = root.dataset.theme ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      var next = current === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      storage.set(THEME_KEY, next);
    });
  }

  // ---------- оглавление: мобильное меню и активный пункт ----------
  function initToc() {
    var tocLinks = document.querySelectorAll('.toc a');
    var menuBtn = document.querySelector('.menu-toggle');

    function setMenu(open) {
      body.classList.toggle('toc-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
    }
    menuBtn.addEventListener('click', function () {
      setMenu(!body.classList.contains('toc-open'));
    });
    tocLinks.forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
    document.addEventListener('click', function (e) {
      if (body.classList.contains('toc-open') && !e.target.closest('.toc, .menu-toggle')) setMenu(false);
    });

    var links = {};
    tocLinks.forEach(function (a) {
      links[a.getAttribute('href').slice(1)] = a;
    });
    var sections = Object.keys(links)
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);

    return function markCurrent() {
      var y = window.innerHeight * ACTIVE_LINE;
      var current = sections[0];
      sections.forEach(function (s) {
        if (s.getBoundingClientRect().top <= y) current = s;
      });
      // #top — это весь <main>: не подсвечиваем «Обложку», если уже прокрутили дальше
      if (current.id === 'top' && root.scrollTop > window.innerHeight) return;
      Object.keys(links).forEach(function (id) {
        links[id].classList.toggle('is-current', id === current.id);
      });
    };
  }

  // ---------- фильтр источников ----------
  function initSourceFilter() {
    var filterBtns = document.querySelectorAll('.filter button');
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var f = btn.dataset.filter;
        filterBtns.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        if (f === 'all') {
          delete body.dataset.filter;
          return;
        }
        body.dataset.filter = f;
        var first = document.querySelector('[data-src="' + f + '"]');
        if (first && first.getBoundingClientRect().top > window.innerHeight) {
          first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    });
  }

  // ---------- чек-листы сохраняются ----------
  // Состояние хранится по порядковому номеру чекбокса на странице.
  function initChecklists() {
    var boxes = document.querySelectorAll('.checklist input[type="checkbox"]');
    var saved;
    try { saved = JSON.parse(storage.get(CHECKS_KEY) || '{}'); } catch (e) { saved = {}; }
    boxes.forEach(function (box, i) {
      if (saved[i]) box.checked = true;
      box.addEventListener('change', function () {
        saved[i] = box.checked;
        storage.set(CHECKS_KEY, JSON.stringify(saved));
      });
    });
  }

  // ---------- появление при прокрутке ----------
  function initReveal() {
    if (!('IntersectionObserver' in window) || prefersReducedMotion()) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add('is-in');
        io.unobserve(el);
        setTimeout(function () { el.style.transitionDelay = ''; }, DELAY_RESET_MS);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll(REVEAL_SELECTOR).forEach(function (t) {
      var index = t.parentElement ? Array.prototype.indexOf.call(t.parentElement.children, t) : 0;
      t.style.transitionDelay = Math.min(index, STAGGER_MAX) * STAGGER_MS + 'ms';
      t.classList.add('reveal');
      io.observe(t);
    });
  }

  var updateProgress = initProgress();
  initTheme();
  var markCurrent = initToc();
  initSourceFilter();
  initChecklists();
  initReveal();

  function onScroll() {
    updateProgress();
    markCurrent();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
