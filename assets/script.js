(function () {
  'use strict';
  var root = document.documentElement;
  var body = document.body;
  root.classList.add('js');

  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) { return null; }
  }

  // ---------- прогресс чтения ----------
  var bar = document.querySelector('.progress span');
  function onScroll() {
    var max = root.scrollHeight - root.clientHeight;
    bar.style.setProperty('--p', max > 0 ? (root.scrollTop / max).toFixed(4) : 0);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- тема ----------
  document.querySelector('.theme-toggle').addEventListener('click', function () {
    var current = root.dataset.theme ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var next = current === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    store('rg-theme', next);
  });

  // ---------- мобильное оглавление ----------
  var menuBtn = document.querySelector('.menu-toggle');
  function setMenu(open) {
    body.classList.toggle('toc-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  }
  menuBtn.addEventListener('click', function () {
    setMenu(!body.classList.contains('toc-open'));
  });
  document.querySelectorAll('.toc a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });
  document.addEventListener('click', function (e) {
    if (body.classList.contains('toc-open') && !e.target.closest('.toc, .menu-toggle')) setMenu(false);
  });

  // ---------- фильтр источников ----------
  var filterBtns = document.querySelectorAll('.filter button');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.dataset.filter;
      filterBtns.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      if (f === 'all') delete body.dataset.filter;
      else {
        body.dataset.filter = f;
        var first = document.querySelector('[data-src="' + f + '"]');
        if (first && first.getBoundingClientRect().top > window.innerHeight) {
          first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    });
  });

  // ---------- активный пункт оглавления ----------
  var links = {};
  document.querySelectorAll('.toc a').forEach(function (a) {
    links[a.getAttribute('href').slice(1)] = a;
  });
  var sections = Object.keys(links)
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  function markCurrent() {
    var y = window.innerHeight * 0.3;
    var current = sections[0];
    sections.forEach(function (s) {
      if (s.getBoundingClientRect().top <= y) current = s;
    });
    if (current.id === 'top' && root.scrollTop > window.innerHeight) return;
    Object.keys(links).forEach(function (id) {
      links[id].classList.toggle('is-current', id === current.id);
    });
  }
  window.addEventListener('scroll', markCurrent, { passive: true });
  markCurrent();

  // ---------- чек-листы сохраняются ----------
  var boxes = document.querySelectorAll('.checklist input[type="checkbox"]');
  var saved = {};
  try { saved = JSON.parse(store('rg-checks') || '{}'); } catch (e) { saved = {}; }
  boxes.forEach(function (box, i) {
    if (saved[i]) box.checked = true;
    box.addEventListener('change', function () {
      saved[i] = box.checked;
      store('rg-checks', JSON.stringify(saved));
    });
  });

  // ---------- появление при прокрутке ----------
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var targets = document.querySelectorAll(
      '.part-head, .gel, .timeline > li, .q-card, .sci, .knowhow li, .vs-col, .verdict, .brief li, .person, .quote, .problem, .motive, .flow li, .case, .story, .risk, .rm-col, .price-chart, .callout, .insights'
    );
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var el = en.target;
          el.classList.add('is-in');
          io.unobserve(el);
          setTimeout(function () { el.style.transitionDelay = ''; }, 1200);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (t) {
      var siblings = t.parentElement ? Array.prototype.indexOf.call(t.parentElement.children, t) : 0;
      t.style.transitionDelay = Math.min(siblings, 6) * 60 + 'ms';
      t.classList.add('reveal');
      io.observe(t);
    });
  }
})();
