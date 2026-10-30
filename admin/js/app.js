/* HALLCO Admin – lõi: dữ liệu (localStorage), phiên đăng nhập, khung trang, định tuyến theo #/đường-dẫn.
   Các màn hình nằm trong js/views.js. Chưa nối máy chủ: mọi thao tác lưu trên trình duyệt này. */
(function () {
  'use strict';

  var DB_KEY = 'hallco_admin_db';
  var SESSION_KEY = 'hallco_admin_session';
  var LOGIN_URL = '/admin/login';
  var U = window.UI;

  /* ---------- Phiên đăng nhập ---------- */
  var me = null;
  try { me = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (e) { me = null; }
  if (!me) { location.replace(LOGIN_URL + (location.hash ? '?next=' + encodeURIComponent(location.hash) : '')); return; }

  /* ---------- Dữ liệu ---------- */
  var db;
  function loadDb() {
    try { db = JSON.parse(localStorage.getItem(DB_KEY) || 'null'); } catch (e) { db = null; }
    if (!db || db.version !== 1) db = window.HallcoSeed.seed();
  }
  function save() {
    try { localStorage.setItem(DB_KEY, JSON.stringify(db)); }
    catch (e) { U.toast('Bộ nhớ trình duyệt đã đầy, chưa lưu được thay đổi.', { error: true }); }
    refreshBadges();
  }
  function log(type, text) {
    db.activity.unshift({ at: new Date().toISOString(), by: me.name, type: type, text: text });
    if (db.activity.length > 500) db.activity.length = 500;
  }
  function resetDb() {
    db = window.HallcoSeed.seed();
    return loadKb(true).then(save);
  }
  loadDb();

  // Kho câu trả lời chatbot: lấy từ file thật của website (js/chatbot-kb.js, js/chatbot-kb-en.js) ở lần đầu
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src + '?t=' + Date.now();
      s.onload = function () { resolve(); s.remove(); };
      s.onerror = function () { reject(new Error(src)); s.remove(); };
      document.head.appendChild(s);
    });
  }
  function loadKb(force) {
    if (db.kb && !force) return Promise.resolve();
    var kb = { vi: [], en: [] };
    return loadScript('/js/chatbot-kb.js').then(function () { kb.vi = JSON.parse(JSON.stringify(window.NT_KB || [])); })
      .then(function () { return loadScript('/js/chatbot-kb-en.js'); })
      .then(function () { kb.en = JSON.parse(JSON.stringify(window.NT_KB || [])); })
      .catch(function () { /* không tải được: để trống, màn hình chatbot sẽ báo */ })
      .then(function () { db.kb = kb; save(); });
  }

  /* ---------- Menu ---------- */
  var ROLES = { admin: 'Quản trị', sales: 'Kinh doanh', tech: 'Kỹ thuật', editor: 'Biên tập' };
  var MENU = [
    { title: 'Tổng quan', items: [
      { id: 'dashboard', icon: 'home', label: 'Bảng điều khiển' }
    ] },
    { title: 'Bán hàng', items: [
      { id: 'leads', icon: 'inbox', label: 'Yêu cầu báo giá', badge: function () { return db.leads.filter(function (l) { return l.status === 'moi'; }).length; } },
      { id: 'customers', icon: 'users', label: 'Khách hàng' },
      { id: 'warranty', icon: 'shield', label: 'Bảo hành' }
    ] },
    { title: 'Nội dung', items: [
      { id: 'products', icon: 'box', label: 'Sản phẩm' },
      { id: 'chatbot', icon: 'chat', label: 'Trợ lý & Hỏi đáp', badge: function () { return db.fallbacks.filter(function (f) { return !f.done; }).length; } },
      { id: 'pages', icon: 'file', label: 'Trang & SEO' },
      { id: 'media', icon: 'image', label: 'Thư viện ảnh' }
    ] },
    { title: 'Hệ thống', items: [
      { id: 'users', icon: 'user', label: 'Người dùng', role: 'admin' },
      { id: 'activity', icon: 'list', label: 'Nhật ký hoạt động' },
      { id: 'settings', icon: 'gear', label: 'Cài đặt' }
    ] }
  ];

  function renderShell() {
    var side = MENU.map(function (g) {
      var items = g.items.filter(function (it) { return !it.role || it.role === me.role; });
      if (!items.length) return '';
      return '<div class="side-group"><div class="side-title">' + g.title + '</div>' + items.map(function (it) {
        return '<a class="side-link" href="#/' + it.id + '" data-nav="' + it.id + '">' + U.icon(it.icon) + '<span>' + it.label + '</span>' +
          (it.badge ? '<span class="side-badge" data-badge="' + it.id + '" hidden></span>' : '') + '</a>';
      }).join('') + '</div>';
    }).join('');

    document.body.innerHTML =
      '<a class="visually-hidden" href="#main">Bỏ qua menu</a>' +
      '<aside class="sidebar" id="sidebar" aria-label="Menu quản trị">' +
        '<a class="side-brand" href="#/dashboard"><img src="/assets/img/hallco-logo-live-floor-320.webp" alt="HALLCO LIVE FLOOR" width="96" height="22"><span>Admin</span></a>' +
        '<nav class="side-nav">' + side + '</nav>' +
        '<div class="side-foot"><a href="/" target="_blank" rel="noopener">Xem website ↗</a></div>' +
      '</aside>' +
      '<header class="topbar">' +
        '<button class="icon-btn menu-btn" type="button" aria-label="Mở menu" aria-controls="sidebar" aria-expanded="false" data-menu>' + U.icon('menu') + '</button>' +
        '<form class="top-search" role="search" data-top-search>' + U.icon('search') +
          '<label class="visually-hidden" for="top-q">Tìm yêu cầu, khách hàng</label>' +
          '<input id="top-q" type="search" placeholder="Tìm yêu cầu, khách hàng, số điện thoại…" autocomplete="off"></form>' +
        '<div class="top-actions">' +
          '<button class="icon-btn" type="button" aria-label="Thông báo" aria-haspopup="true" aria-expanded="false" data-notif>' + U.icon('bell') + '<span class="dot" hidden></span></button>' +
          '<button class="user-btn" type="button" aria-haspopup="true" aria-expanded="false" data-user>' +
            '<span class="avatar">' + U.esc(U.initials(me.name)) + '</span>' +
            '<span class="user-meta"><b>' + U.esc(me.name) + '</b><span>' + (ROLES[me.role] || '') + '</span></span></button>' +
        '</div>' +
      '</header>' +
      '<main class="main" id="main" tabindex="-1"><div class="page" data-view></div></main>';

    var sidebar = U.qs('#sidebar');
    var menuBtn = U.qs('[data-menu]');
    var backdrop = null;
    function closeSide() {
      sidebar.classList.remove('is-open');
      menuBtn.setAttribute('aria-expanded', 'false');
      if (backdrop) { backdrop.remove(); backdrop = null; }
    }
    menuBtn.addEventListener('click', function () {
      if (sidebar.classList.contains('is-open')) return closeSide();
      sidebar.classList.add('is-open');
      menuBtn.setAttribute('aria-expanded', 'true');
      backdrop = document.createElement('div');
      backdrop.className = 'backdrop';
      backdrop.addEventListener('click', closeSide);
      document.body.appendChild(backdrop);
    });
    sidebar.addEventListener('click', function (e) { if (e.target.closest('a')) closeSide(); });

    U.qs('[data-top-search]').addEventListener('submit', function (e) {
      e.preventDefault();
      var q = U.qs('#top-q').value.trim();
      go('leads', { q: q });
    });

    U.qs('[data-notif]').addEventListener('click', function (e) {
      var fresh = db.leads.filter(function (l) { return l.status === 'moi'; }).slice(0, 6);
      var html = '<div class="notif-head">Yêu cầu mới (' + fresh.length + ')</div>' +
        (fresh.length ? fresh.map(function (l) {
          return '<a href="#/leads/' + l.id + '">' + U.esc(l.name) + ' · ' + U.esc(l.need) + '<span>' + U.ago(l.createdAt) + ' · ' + U.esc(l.source) + '</span></a>';
        }).join('') : '<p class="muted small" style="padding:14px">Không có yêu cầu mới.</p>') +
        '<a href="#/leads?status=moi" style="font-weight:600;border-bottom:0">Xem tất cả</a>';
      var m = U.popup(e.currentTarget, html, 'notif');
      m.addEventListener('click', function (ev) { if (ev.target.closest('a')) U.closeMenu(); });
    });

    U.qs('[data-user]').addEventListener('click', function (e) {
      var m = U.popup(e.currentTarget,
        '<div style="padding:8px 10px 10px"><b>' + U.esc(me.name) + '</b><div class="small muted">' + U.esc(me.email) + '</div></div><hr>' +
        '<a href="#/settings?tab=account">' + U.icon('key') + 'Đổi mật khẩu</a>' +
        '<a href="/" target="_blank" rel="noopener">' + U.icon('external') + 'Xem website</a><hr>' +
        '<button type="button" data-logout>' + U.icon('logout') + 'Đăng xuất</button>');
      m.addEventListener('click', function (ev) {
        if (ev.target.closest('[data-logout]')) logout();
        else if (ev.target.closest('a')) U.closeMenu();
      });
    });
  }

  function refreshBadges() {
    MENU.forEach(function (g) {
      g.items.forEach(function (it) {
        if (!it.badge) return;
        var el = document.querySelector('[data-badge="' + it.id + '"]');
        if (!el) return;
        var n = it.badge();
        el.textContent = n;
        el.hidden = !n;
      });
    });
    var dot = document.querySelector('[data-notif] .dot');
    if (dot) dot.hidden = !db.leads.some(function (l) { return l.status === 'moi'; });
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    location.replace(LOGIN_URL);
  }

  /* ---------- Định tuyến: #/view/id?a=b ---------- */
  function parseHash() {
    var h = location.hash.replace(/^#\/?/, '');
    var qi = h.indexOf('?');
    var path = qi >= 0 ? h.slice(0, qi) : h;
    var query = {};
    if (qi >= 0) new URLSearchParams(h.slice(qi + 1)).forEach(function (v, k) { query[k] = v; });
    var parts = path.split('/').filter(Boolean);
    return { view: parts[0] || 'dashboard', id: parts[1] ? decodeURIComponent(parts[1]) : null, query: query };
  }
  function go(view, query, id) {
    var q = query ? Object.keys(query).filter(function (k) { return query[k] !== '' && query[k] != null; })
      .map(function (k) { return k + '=' + encodeURIComponent(query[k]); }).join('&') : '';
    var target = '#/' + view + (id ? '/' + encodeURIComponent(id) : '') + (q ? '?' + q : '');
    if (location.hash === target) route(); else location.hash = target;
  }
  // Đổi tham số trên địa chỉ mà không vẽ lại (lọc, phân trang)
  function setQuery(query) {
    var r = parseHash();
    var q = Object.keys(query).filter(function (k) { return query[k] !== '' && query[k] != null; })
      .map(function (k) { return k + '=' + encodeURIComponent(query[k]); }).join('&');
    history.replaceState(null, '', '#/' + r.view + (r.id ? '/' + encodeURIComponent(r.id) : '') + (q ? '?' + q : ''));
  }

  var current = null;
  function route() {
    var r = parseHash();
    var views = window.AdminViews;
    if (!views) return; // views.js chưa tải xong
    U.closeAll();
    var item = null;
    MENU.forEach(function (g) { g.items.forEach(function (it) { if (it.id === r.view) item = it; }); });
    if (!views[r.view] || (item && item.role && item.role !== me.role)) { go('dashboard'); return; }
    U.qsa('[data-nav]').forEach(function (a) {
      if (a.getAttribute('data-nav') === r.view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    // Phần tử mới mỗi lần vẽ để không gắn trùng sự kiện
    var old = U.qs('[data-view]');
    var root = old.cloneNode(false);
    old.replaceWith(root);
    var sameView = current === r.view;
    current = r.view;
    if (!sameView) window.scrollTo(0, 0);
    document.title = (item ? item.label : 'Admin') + ' — HALLCO Admin';
    views[r.view](root, r, sameView);
    refreshBadges();
  }

  window.Admin = {
    get db() { return db; },
    me: me, ROLES: ROLES, save: save, log: log, resetDb: resetDb, loadKb: loadKb,
    go: go, setQuery: setQuery, route: route, logout: logout,
    setMe: function (patch) {
      Object.assign(me, patch);
      localStorage.setItem(SESSION_KEY, JSON.stringify(me));
      U.qs('.user-meta b').textContent = me.name;
      U.qs('.user-btn .avatar').textContent = U.initials(me.name);
    }
  };

  function start() {
    renderShell();
    window.addEventListener('hashchange', route);
    loadKb().then(function () {
      if (!location.hash) history.replaceState(null, '', '#/dashboard');
      route();
    });
  }
  // Chờ DOMContentLoaded: lúc đó mọi script defer (kể cả views.js) đã chạy xong
  if (document.readyState === 'complete') start(); else document.addEventListener('DOMContentLoaded', start);
})();
