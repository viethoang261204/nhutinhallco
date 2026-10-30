/* HALLCO Admin – thành phần giao diện dùng chung: icon, định dạng, modal, ngăn chi tiết, thông báo, xác nhận. */
(function () {
  'use strict';

  var ICONS = {
    home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>',
    users: '<circle cx="9" cy="8" r="4"/><path d="M2 21v-1a7 7 0 0 1 14 0v1"/><path d="M16 4a4 4 0 0 1 0 8M22 21v-1a7 7 0 0 0-4-6.3"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
    chat: '<path d="M21 12a8.5 8.5 0 0 1-12.4 7.6L3 21l1.4-5.1A8.5 8.5 0 1 1 21 12z"/>',
    file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/>',
    list: '<path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    sort: '<path d="m7 15 5 5 5-5M7 9l5-5 5 5"/>',
    refresh: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/>',
    key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
    user_plus: '<circle cx="9" cy="8" r="4"/><path d="M2 21v-1a7 7 0 0 1 14 0v1M19 8v6M22 11h-6"/>'
  };

  function icon(name, cls) {
    return '<svg class="icon' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || ICONS.file) + '</svg>';
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function pad(n) { return String(n).padStart(2, '0'); }
  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
  }
  function fmtDateTime(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return fmtDate(iso) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function ago(iso) {
    var s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 60) return 'vừa xong';
    if (s < 3600) return Math.floor(s / 60) + ' phút trước';
    if (s < 86400) return Math.floor(s / 3600) + ' giờ trước';
    if (s < 86400 * 7) return Math.floor(s / 86400) + ' ngày trước';
    return fmtDate(iso);
  }
  function fmtSize(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return Math.round(b / 1024) + ' KB';
    return (b / 1048576).toFixed(1).replace('.', ',') + ' MB';
  }
  function initials(name) {
    var p = String(name || '?').trim().split(/\s+/);
    return ((p.length > 1 ? p[p.length - 2][0] : '') + p[p.length - 1][0]).toUpperCase();
  }
  // So khớp tìm kiếm không phân biệt dấu
  function fold(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
  }
  function matches(q, fields) {
    if (!q) return true;
    var f = fold(fields.join(' '));
    return fold(q).split(/\s+/).every(function (w) { return f.indexOf(w) >= 0; });
  }

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ---------- Thông báo nhỏ góc phải ---------- */
  function toast(msg, opts) {
    opts = opts || {};
    var box = qs('.toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    var t = document.createElement('div');
    t.className = 'toast' + (opts.error ? ' toast-err' : '');
    t.innerHTML = icon(opts.error ? 'alert' : 'check') + '<span>' + esc(msg) + '</span>' + (opts.undo ? '<button type="button">Hoàn tác</button>' : '');
    box.appendChild(t);
    var timer = setTimeout(function () { t.remove(); }, opts.undo ? 6000 : 3200);
    if (opts.undo) t.querySelector('button').addEventListener('click', function () { clearTimeout(timer); t.remove(); opts.undo(); });
  }

  /* ---------- Bẫy focus, đóng bằng Esc ---------- */
  var stack = [];
  document.addEventListener('keydown', function (e) {
    var top = stack[stack.length - 1];
    if (!top) return;
    if (e.key === 'Escape') { e.preventDefault(); top.close(); }
    if (e.key === 'Tab') {
      var f = qsa('a[href], button:not([disabled]), input:not([type=hidden]):not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])', top.panel)
        .filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  function layer(kind, opts) {
    var prev = document.activeElement;
    var wrap = document.createElement('div');
    wrap.className = kind === 'drawer' ? 'drawer-wrap' : 'modal-wrap';
    var id = 'dlg-' + Math.random().toString(36).slice(2, 8);
    wrap.innerHTML =
      '<div class="' + (kind === 'drawer' ? 'drawer' : 'modal' + (opts.size === 'lg' ? ' modal-lg' : '')) + '" role="dialog" aria-modal="true" aria-labelledby="' + id + '">' +
        '<div class="modal-head"><h2 id="' + id + '">' + esc(opts.title) + '</h2>' +
        '<button class="icon-btn" type="button" data-close aria-label="Đóng">' + icon('close') + '</button></div>' +
        '<div class="modal-body">' + (opts.body || '') + '</div>' +
        (opts.foot !== false ? '<div class="modal-foot">' + (opts.foot || '') + '</div>' : '') +
      '</div>';
    document.body.appendChild(wrap);
    document.documentElement.style.overflow = 'hidden';
    var panel = wrap.firstElementChild;
    var api = {
      el: panel,
      panel: panel,
      close: function (silent) {
        if (!wrap.isConnected) return;
        wrap.remove();
        stack.splice(stack.indexOf(api), 1);
        if (!stack.length) document.documentElement.style.overflow = '';
        if (silent === true) return;
        if (opts.onClose) opts.onClose();
        if (prev && prev.focus) prev.focus();
      }
    };
    stack.push(api);
    wrap.addEventListener('mousedown', function (e) { if (e.target === wrap) api.close(); });
    qsa('[data-close]', panel).forEach(function (b) { b.addEventListener('click', function () { api.close(); }); });
    var first = panel.querySelector('.modal-body input:not([type=hidden]):not([type=checkbox]), .modal-body select, .modal-body textarea') || panel.querySelector('[data-close]');
    setTimeout(function () { first && first.focus(); }, 30);
    return api;
  }
  function modal(opts) { return layer('modal', opts); }
  // Đóng mọi modal, ngăn chi tiết khi chuyển màn hình (không chạy onClose để khỏi đổi địa chỉ)
  function closeAll() { while (stack.length) stack[stack.length - 1].close(true); closeMenu(); }
  function drawer(opts) { return layer('drawer', opts); }

  function confirm(opts) {
    return new Promise(function (resolve) {
      var done = false;
      var m = modal({
        title: opts.title || 'Xác nhận',
        body: '<p>' + (opts.html || esc(opts.text || '')) + '</p>',
        foot: '<button class="btn" type="button" data-close>Hủy</button>' +
          '<button class="btn ' + (opts.danger ? 'btn-danger-solid' : 'btn-primary') + '" type="button" data-ok>' + esc(opts.ok || 'Đồng ý') + '</button>',
        onClose: function () { if (!done) resolve(false); }
      });
      m.el.querySelector('[data-ok]').addEventListener('click', function () { done = true; m.close(); resolve(true); });
      setTimeout(function () { m.el.querySelector('[data-ok]').focus(); }, 40);
    });
  }

  /* ---------- Menu thả xuống ---------- */
  var openMenu = null;
  function popup(anchor, html, cls) {
    closeMenu();
    var m = document.createElement('div');
    m.className = 'menu' + (cls ? ' ' + cls : '');
    m.innerHTML = html;
    document.body.appendChild(m);
    var r = anchor.getBoundingClientRect();
    var left = Math.min(r.right - m.offsetWidth, window.innerWidth - m.offsetWidth - 8);
    m.style.top = (r.bottom + window.scrollY + 6) + 'px';
    m.style.left = Math.max(8, left) + 'px';
    anchor.setAttribute('aria-expanded', 'true');
    openMenu = { el: m, anchor: anchor };
    return m;
  }
  function closeMenu() {
    if (!openMenu) return;
    openMenu.el.remove();
    openMenu.anchor.setAttribute('aria-expanded', 'false');
    openMenu = null;
  }
  document.addEventListener('mousedown', function (e) {
    if (openMenu && !openMenu.el.contains(e.target) && !openMenu.anchor.contains(e.target)) closeMenu();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && openMenu) { var a = openMenu.anchor; closeMenu(); a.focus(); } });

  /* ---------- Xuất CSV (mở được bằng Excel, có BOM để giữ dấu tiếng Việt) ---------- */
  function downloadCsv(filename, header, rows) {
    var cell = function (v) { v = String(v == null ? '' : v); return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var text = '﻿' + [header].concat(rows).map(function (r) { return r.map(cell).join(','); }).join('\r\n');
    download(filename, text, 'text/csv;charset=utf-8');
  }
  function download(filename, text, type) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: type || 'application/octet-stream' }));
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ---------- Phân trang ---------- */
  function pager(total, page, size) {
    var pages = Math.max(1, Math.ceil(total / size));
    var from = total ? (page - 1) * size + 1 : 0, to = Math.min(total, page * size);
    return '<div class="pager"><span>' + from + '–' + to + ' / ' + total + '</span><div class="btns">' +
      '<button class="btn btn-sm" type="button" data-page="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + '>Trước</button>' +
      '<span class="btn btn-sm btn-ghost" aria-current="page">' + page + ' / ' + pages + '</span>' +
      '<button class="btn btn-sm" type="button" data-page="' + (page + 1) + '"' + (page >= pages ? ' disabled' : '') + '>Sau</button>' +
      '</div></div>';
  }

  function empty(text, ic) {
    return '<div class="empty">' + icon(ic || 'search') + '<p>' + esc(text) + '</p></div>';
  }

  // Lấy giá trị form thành object
  function formData(form) {
    var o = {};
    qsa('input, select, textarea', form).forEach(function (el) {
      if (!el.name) return;
      if (el.type === 'checkbox') o[el.name] = el.checked;
      else if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; }
      else o[el.name] = el.value.trim();
    });
    return o;
  }

  window.UI = {
    icon: icon, esc: esc, fmtDate: fmtDate, fmtDateTime: fmtDateTime, ago: ago, fmtSize: fmtSize, initials: initials,
    fold: fold, matches: matches, qs: qs, qsa: qsa, toast: toast, modal: modal, drawer: drawer, closeAll: closeAll, confirm: confirm,
    popup: popup, closeMenu: closeMenu, downloadCsv: downloadCsv, download: download, pager: pager, empty: empty, formData: formData
  };
})();
