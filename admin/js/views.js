/* HALLCO Admin – các màn hình. Mỗi màn hình: AdminViews[tên](root, route). */
(function () {
  'use strict';

  var U = window.UI, A = window.Admin;
  var esc = U.esc, icon = U.icon;
  var V = window.AdminViews = {};
  var NEEDS = window.HallcoSeed.NEEDS;
  var PAGE_SIZE = 15;
  var DAY = 86400000;

  var STATUS = { moi: 'Mới', 'tu-van': 'Đang tư vấn', 'bao-gia': 'Đã báo giá', chot: 'Đã chốt', huy: 'Không thành' };
  var STATUS_KEYS = Object.keys(STATUS);
  var SOURCES = ['Form website', 'Chatbot', 'Gọi điện', 'Zalo'];
  var MODELS = ['i-4000', 'i-6000', 'W Floor™ + BRUTE™'];

  function pill(status) { return '<span class="pill pill-' + status + '">' + STATUS[status] + '</span>'; }
  function staffNames() { return A.db.users.filter(function (u) { return u.active && (u.role === 'sales' || u.role === 'admin' || u.role === 'tech'); }).map(function (u) { return u.name; }); }
  function options(list, sel, blank) {
    return (blank != null ? '<option value="">' + esc(blank) + '</option>' : '') + list.map(function (o) {
      var v = typeof o === 'string' ? o : o[0], t = typeof o === 'string' ? o : o[1];
      return '<option value="' + esc(v) + '"' + (String(v) === String(sel) ? ' selected' : '') + '>' + esc(t) + '</option>';
    }).join('');
  }
  function head(title, sub, actions) {
    return '<div class="page-head"><div><h1>' + esc(title) + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' +
      (actions ? '<div class="page-actions">' + actions + '</div>' : '') + '</div>';
  }
  function customerName(id) {
    var c = A.db.customers.find(function (x) { return x.id === id; });
    return c ? c.company : '(đã xóa)';
  }
  function within(iso, days) { return !days || Date.now() - new Date(iso).getTime() <= days * DAY; }
  function phoneDigits(p) { return String(p || '').replace(/[^\d+]/g, ''); }
  function validPhone(p) { var d = String(p || '').replace(/[\s.\-()]/g, ''); return /^(0[35789]\d{8}|02\d{9}|\+\d{9,15})$/.test(d); }
  function telLink(p) { var d = phoneDigits(p); return d.charAt(0) === '0' ? '+84' + d.slice(1) : d; }

  /* Bảo hành: trạng thái tính từ ngày lắp + số tháng */
  function wInfo(w) {
    var end = new Date(w.installedAt); end.setMonth(end.getMonth() + Number(w.months || 0));
    var left = Math.ceil((end.getTime() - Date.now()) / DAY);
    var st = !w.registered ? ['unreg', 'Chưa đăng ký', 'warn'] : left < 0 ? ['expired', 'Hết hạn', 'bad'] : left <= 60 ? ['soon', 'Sắp hết hạn', 'warn'] : ['ok', 'Còn hạn', 'ok'];
    return { end: end.toISOString(), left: left, key: st[0], label: st[1], cls: st[2] };
  }

  /* Gắn sự kiện sắp xếp cột */
  function sortBy(list, key, dir) {
    return list.slice().sort(function (a, b) {
      var x = a[key], y = b[key];
      if (typeof x === 'number' && typeof y === 'number') return dir * (x - y);
      return dir * String(x || '').localeCompare(String(y || ''), 'vi');
    });
  }
  function th(label, key, state) {
    if (!key) return '<th scope="col">' + label + '</th>';
    var aria = state.sort === key ? (state.dir > 0 ? 'ascending' : 'descending') : 'none';
    return '<th scope="col" aria-sort="' + aria + '"><button type="button" data-sort="' + key + '">' + label + icon('sort', '') + '</button></th>';
  }

  /* =====================================================================
     BẢNG ĐIỀU KHIỂN
     ===================================================================== */
  V.dashboard = function (root) {
    var db = A.db, now = Date.now();
    var leads30 = db.leads.filter(function (l) { return within(l.createdAt, 30); });
    var leadsPrev = db.leads.filter(function (l) { var t = now - new Date(l.createdAt).getTime(); return t > 30 * DAY && t <= 60 * DAY; });
    var fresh = db.leads.filter(function (l) { return l.status === 'moi'; });
    var closed90 = db.leads.filter(function (l) { return within(l.createdAt, 90) && (l.status === 'chot' || l.status === 'huy'); });
    var won = closed90.filter(function (l) { return l.status === 'chot'; }).length;
    var rate = closed90.length ? Math.round(won / closed90.length * 100) : 0;
    var soon = db.warranties.filter(function (w) { return wInfo(w).key === 'soon'; });
    var diff = leads30.length - leadsPrev.length;
    var hour = new Date().getHours();
    var hello = hour < 11 ? 'Chào buổi sáng' : hour < 14 ? 'Chào buổi trưa' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

    // Số yêu cầu theo ngày, 30 ngày gần nhất
    var days = [];
    for (var i = 29; i >= 0; i--) {
      var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      days.push({ d: d, n: 0 });
    }
    leads30.forEach(function (l) {
      var t = new Date(l.createdAt); t.setHours(0, 0, 0, 0);
      var idx = Math.round((t - days[0].d) / DAY);
      if (days[idx]) days[idx].n++;
    });

    // Theo nhu cầu
    var byNeed = NEEDS.map(function (n) { return { n: n, c: leads30.filter(function (l) { return l.need === n; }).length }; })
      .sort(function (a, b) { return b.c - a.c; });
    var maxNeed = Math.max(1, byNeed[0].c);

    var todo = fresh.slice().sort(function (a, b) { return a.createdAt.localeCompare(b.createdAt); }).slice(0, 6);
    var fb = db.fallbacks.filter(function (f) { return !f.done; }).sort(function (a, b) { return b.count - a.count; }).slice(0, 6);

    root.innerHTML =
      head(hello + ', ' + A.me.name, 'Tình hình yêu cầu báo giá và website, cập nhật đến ' + U.fmtDateTime(new Date().toISOString()) + '.',
        '<button class="btn" type="button" data-export>' + icon('download') + 'Xuất báo cáo 30 ngày</button>' +
        '<a class="btn btn-primary" href="#/leads?new=1">' + icon('plus') + 'Thêm yêu cầu</a>') +

      '<section class="kpis" aria-label="Số liệu chính">' +
        '<div class="kpi"><a href="#/leads?status=moi"><span class="kpi-label">Yêu cầu mới chưa xử lý</span><span class="kpi-num">' + fresh.length + '</span>' +
          '<span class="kpi-foot">' + (fresh.length ? 'Cũ nhất: ' + U.ago(todo[0].createdAt) : 'Đã xử lý hết') + '</span></a></div>' +
        '<div class="kpi"><a href="#/leads?days=30"><span class="kpi-label">Yêu cầu trong 30 ngày</span><span class="kpi-num">' + leads30.length + '</span>' +
          '<span class="kpi-foot">' + (diff >= 0 ? '+' : '−') + Math.abs(diff) + ' so với 30 ngày trước đó</span></a></div>' +
        '<div class="kpi"><a href="#/leads?status=chot"><span class="kpi-label">Tỉ lệ chốt (90 ngày)</span><span class="kpi-num">' + rate + '<small>%</small></span>' +
          '<span class="kpi-foot">' + won + ' chốt / ' + closed90.length + ' yêu cầu đã kết thúc</span></a></div>' +
        '<div class="kpi"><a href="#/warranty?tab=soon"><span class="kpi-label">Bảo hành sắp hết hạn</span><span class="kpi-num">' + soon.length + '</span>' +
          '<span class="kpi-foot">Trong 60 ngày tới</span></a></div>' +
      '</section>' +

      '<div class="grid grid-3-2">' +
        '<section class="card"><div class="card-head"><div><h2>Yêu cầu báo giá theo ngày</h2><div class="sub">30 ngày gần nhất · tổng ' + leads30.length + ' yêu cầu</div></div></div>' +
          '<div class="card-body"><div class="chart" data-chart></div></div></section>' +
        '<section class="card"><div class="card-head"><div><h2>Theo nhu cầu</h2><div class="sub">30 ngày gần nhất</div></div></div>' +
          '<div class="card-body"><ul class="hbars">' + byNeed.map(function (x) {
            return '<li><span class="lbl">' + esc(x.n) + '</span><span class="val">' + x.c + '</span>' +
              '<span class="track" aria-hidden="true"><span class="fill" style="width:' + (x.c / maxNeed * 100) + '%"></span></span></li>';
          }).join('') + '</ul></div></section>' +
      '</div>' +

      '<div class="grid grid-2" style="margin-top:20px">' +
        '<section class="card"><div class="card-head"><h2>Cần gọi lại</h2><a class="small" href="#/leads?status=moi">Tất cả</a></div><div class="card-body"><ul class="list">' +
          (todo.length ? todo.map(function (l) {
            return '<li><span class="avatar avatar-sm">' + esc(U.initials(l.name)) + '</span><span class="grow"><b>' + esc(l.name) + (l.company ? ' · ' + esc(l.company) : '') + '</b>' +
              '<span>' + esc(l.need) + ' · ' + U.ago(l.createdAt) + '</span></span>' +
              '<a class="btn btn-sm" href="tel:' + telLink(l.phone) + '">' + icon('phone') + '<span class="nw">' + esc(l.phone) + '</span></a>' +
              '<a class="btn btn-sm btn-ghost" href="#/leads/' + l.id + '" aria-label="Mở ' + esc(l.id) + '">Mở</a></li>';
          }).join('') : '<li class="muted">Không còn yêu cầu mới.</li>') + '</ul></div></section>' +
        '<section class="card"><div class="card-head"><h2>Trợ lý chưa trả lời được</h2><a class="small" href="#/chatbot?tab=fallback">Xử lý</a></div><div class="card-body"><ul class="list">' +
          (fb.length ? fb.map(function (f) {
            return '<li><span class="grow"><b>“' + esc(f.q) + '”</b><span>' + f.count + ' lượt hỏi · gần nhất ' + U.ago(f.lastAt) + '</span></span>' +
              '<a class="btn btn-sm" href="#/chatbot?tab=fallback&answer=' + f.id + '">Tạo câu trả lời</a></li>';
          }).join('') : '<li class="muted">Trợ lý đã trả lời được mọi câu hỏi gần đây.</li>') + '</ul></div></section>' +
      '</div>' +

      '<section class="card" style="margin-top:20px"><div class="card-head"><h2>Hoạt động gần đây</h2><a class="small" href="#/activity">Nhật ký</a></div><div class="card-body"><ul class="list">' +
        A.db.activity.slice(0, 6).map(function (a) {
          return '<li><span class="avatar avatar-sm">' + esc(U.initials(a.by)) + '</span><span class="grow"><b style="font-weight:500;white-space:normal">' + esc(a.text) + '</b><span>' + esc(a.by) + ' · ' + U.ago(a.at) + '</span></span></li>';
        }).join('') + '</ul></div></section>';

    barChart(U.qs('[data-chart]', root), days);

    U.qs('[data-export]', root).addEventListener('click', function () {
      exportLeads(leads30, 'yeu-cau-30-ngay');
    });
  };

  /* Biểu đồ cột một chuỗi: mép trên bo 4px, cách nhau 2px, lưới mờ, tooltip khi rê chuột, bảng ẩn cho trình đọc màn hình */
  function barChart(el, days) {
    var W = 640, H = 220, padL = 28, padB = 26, padT = 18;
    var max = Math.max(4, Math.max.apply(null, days.map(function (d) { return d.n; })));
    var step = max <= 6 ? 2 : max <= 12 ? 3 : 5;
    var top = Math.ceil(max / step) * step;
    var cw = (W - padL) / days.length, bw = Math.max(4, cw - 2);
    var y = function (v) { return padT + (H - padT - padB) * (1 - v / top); };
    var grid = '';
    for (var v = 0; v <= top; v += step) {
      grid += '<line class="grid-line" x1="' + padL + '" x2="' + W + '" y1="' + y(v) + '" y2="' + y(v) + '"/>' +
        '<text class="axis-text" x="' + (padL - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + v + '</text>';
    }
    var maxIdx = days.reduce(function (m, d, i) { return d.n > days[m].n ? i : m; }, 0);
    var bars = days.map(function (d, i) {
      var x = padL + i * cw + 1, h = y(0) - y(d.n), r = Math.min(4, h, bw / 2);
      var path = d.n ? 'M' + x + ',' + y(0) + 'V' + (y(d.n) + r) + 'Q' + x + ',' + y(d.n) + ' ' + (x + r) + ',' + y(d.n) +
        'H' + (x + bw - r) + 'Q' + (x + bw) + ',' + y(d.n) + ' ' + (x + bw) + ',' + (y(d.n) + r) + 'V' + y(0) + 'Z' : '';
      var label = (d.d.getDate() + '/' + (d.d.getMonth() + 1));
      return '<g data-i="' + i + '"><rect class="bar-hit" x="' + (padL + i * cw) + '" y="' + padT + '" width="' + cw + '" height="' + (H - padT - padB) + '"/>' +
        (path ? '<path class="bar" d="' + path + '"/>' : '') +
        (i === maxIdx && d.n ? '<text class="bar-label" x="' + (x + bw / 2) + '" y="' + (y(d.n) - 5) + '" text-anchor="middle">' + d.n + '</text>' : '') +
        ((i % 5 === 4 || i === 0) ? '<text class="axis-text" x="' + (x + bw / 2) + '" y="' + (H - 8) + '" text-anchor="middle">' + label + '</text>' : '') + '</g>';
    }).join('');
    el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Số yêu cầu báo giá mỗi ngày trong 30 ngày gần nhất">' + grid + bars + '</svg>' +
      '<div class="chart-tip" hidden></div>' +
      '<table class="visually-hidden"><caption>Yêu cầu báo giá theo ngày</caption><tr><th>Ngày</th><th>Số yêu cầu</th></tr>' +
      days.map(function (d) { return '<tr><td>' + U.fmtDate(d.d.toISOString()) + '</td><td>' + d.n + '</td></tr>'; }).join('') + '</table>';
    var tip = U.qs('.chart-tip', el), svg = U.qs('svg', el);
    U.qsa('g[data-i]', svg).forEach(function (g) {
      g.addEventListener('mouseenter', function () {
        var d = days[+g.getAttribute('data-i')];
        g.classList.add('is-hot');
        var hit = g.querySelector('.bar-hit').getBoundingClientRect(), box = el.getBoundingClientRect();
        var bar = g.querySelector('.bar');
        var topPx = bar ? bar.getBoundingClientRect().top : hit.bottom;
        tip.innerHTML = U.fmtDate(d.d.toISOString()) + ': <b>' + d.n + '</b> yêu cầu';
        tip.style.left = (hit.left + hit.width / 2 - box.left) + 'px';
        tip.style.top = (topPx - box.top) + 'px';
        tip.hidden = false;
      });
      g.addEventListener('mouseleave', function () { g.classList.remove('is-hot'); tip.hidden = true; });
    });
  }

  function exportLeads(list, name) {
    U.downloadCsv(name + '-' + new Date().toISOString().slice(0, 10) + '.csv',
      ['Mã', 'Ngày gửi', 'Họ tên', 'Công ty', 'Số điện thoại', 'Nhu cầu', 'Nguồn', 'Ngôn ngữ', 'Trạng thái', 'Phụ trách', 'Ghi chú của khách'],
      list.map(function (l) { return [l.id, U.fmtDateTime(l.createdAt), l.name, l.company, l.phone, l.need, l.source, l.lang, STATUS[l.status], l.assignee, l.message]; }));
    U.toast('Đã xuất ' + list.length + ' yêu cầu ra file CSV.');
  }

  /* =====================================================================
     YÊU CẦU BÁO GIÁ
     ===================================================================== */
  V.leads = function (root, r) {
    var q = r.query;
    var st = { status: q.status || '', q: q.q || '', need: q.need || '', source: q.source || '', days: q.days || '', who: q.who || '',
      page: +q.page || 1, sort: q.sort || 'createdAt', dir: q.dir === 'asc' ? 1 : -1, sel: {} };

    root.innerHTML = head('Yêu cầu báo giá', 'Từ form trên website, trợ lý, cuộc gọi và Zalo. Bấm một dòng để xem chi tiết.',
      '<button class="btn" type="button" data-export>' + icon('download') + 'Xuất CSV</button>' +
      '<button class="btn btn-primary" type="button" data-add>' + icon('plus') + 'Thêm yêu cầu</button>') +
      '<section class="card"><div class="tabs" role="tablist" data-tabs></div>' +
      '<div class="toolbar">' +
        '<div class="search">' + icon('search') + '<label class="visually-hidden" for="lq">Tìm</label><input id="lq" class="input" type="search" placeholder="Tên, công ty, số điện thoại, mã…" value="' + esc(st.q) + '" data-f="q"></div>' +
        '<label class="visually-hidden" for="lneed">Nhu cầu</label><select id="lneed" class="select" data-f="need">' + options(NEEDS, st.need, 'Mọi nhu cầu') + '</select>' +
        '<label class="visually-hidden" for="lsrc">Nguồn</label><select id="lsrc" class="select" data-f="source">' + options(SOURCES, st.source, 'Mọi nguồn') + '</select>' +
        '<label class="visually-hidden" for="ldays">Thời gian</label><select id="ldays" class="select" data-f="days">' + options([['7', '7 ngày'], ['30', '30 ngày'], ['90', '90 ngày']], st.days, 'Mọi lúc') + '</select>' +
        '<label class="visually-hidden" for="lwho">Phụ trách</label><select id="lwho" class="select" data-f="who">' + options([['-', 'Chưa ai nhận']].concat(staffNames()), st.who, 'Mọi người phụ trách') + '</select>' +
      '</div><div data-bulk></div><div class="table-wrap" data-table></div><div data-pager></div></section>';

    function filtered(ignoreStatus) {
      return A.db.leads.filter(function (l) {
        return (ignoreStatus || !st.status || l.status === st.status) &&
          (!st.need || l.need === st.need) && (!st.source || l.source === st.source) &&
          (!st.days || within(l.createdAt, +st.days)) &&
          (!st.who || (st.who === '-' ? !l.assignee : l.assignee === st.who)) &&
          U.matches(st.q, [l.id, l.name, l.company, l.phone, phoneDigits(l.phone), l.message]);
      });
    }

    function draw() {
      var base = filtered(true);
      U.qs('[data-tabs]', root).innerHTML = [['', 'Tất cả']].concat(STATUS_KEYS.map(function (k) { return [k, STATUS[k]]; })).map(function (t) {
        var n = t[0] ? base.filter(function (l) { return l.status === t[0]; }).length : base.length;
        return '<button class="tab" role="tab" type="button" aria-selected="' + (st.status === t[0]) + '" data-status="' + t[0] + '">' + t[1] + '<span class="count">' + n + '</span></button>';
      }).join('');

      var list = sortBy(filtered(false), st.sort, st.dir);
      var pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
      if (st.page > pages) st.page = pages;
      var rows = list.slice((st.page - 1) * PAGE_SIZE, st.page * PAGE_SIZE);
      var ids = rows.map(function (l) { return l.id; });
      var allSel = rows.length && ids.every(function (id) { return st.sel[id]; });

      U.qs('[data-table]', root).innerHTML = rows.length ?
        '<table class="table"><thead><tr><th class="col-check"><label class="check"><input type="checkbox" data-all' + (allSel ? ' checked' : '') + '><span class="visually-hidden">Chọn tất cả</span></label></th>' +
        th('Ngày gửi', 'createdAt', st) + th('Khách hàng', 'name', st) + th('Số điện thoại') + th('Nhu cầu', 'need', st) + th('Nguồn', 'source', st) +
        th('Trạng thái', 'status', st) + th('Phụ trách', 'assignee', st) + '<th class="col-act"><span class="visually-hidden">Thao tác</span></th></tr></thead><tbody>' +
        rows.map(function (l) {
          return '<tr class="is-click' + (st.sel[l.id] ? ' is-selected' : '') + '" data-id="' + l.id + '">' +
            '<td class="col-check"><label class="check"><input type="checkbox" data-sel="' + l.id + '"' + (st.sel[l.id] ? ' checked' : '') + '><span class="visually-hidden">Chọn ' + l.id + '</span></label></td>' +
            '<td class="nw">' + U.fmtDate(l.createdAt) + '<span class="cell-sub">' + U.ago(l.createdAt) + '</span></td>' +
            '<td><a class="cell-main" href="#/leads/' + l.id + '" style="color:inherit;text-decoration:none">' + esc(l.name) + '</a>' + (l.lang === 'EN' ? ' <span class="chip">EN</span>' : '') +
              '<span class="cell-sub">' + esc(l.company || '—') + '</span></td>' +
            '<td class="nw">' + esc(l.phone) + '</td>' +
            '<td>' + esc(l.need) + '</td>' +
            '<td class="nw">' + esc(l.source) + '</td>' +
            '<td>' + pill(l.status) + '</td>' +
            '<td>' + (l.assignee ? esc(l.assignee) : '<span class="muted">—</span>') + '</td>' +
            '<td class="col-act"><span class="row-actions"><a class="icon-btn" href="tel:' + telLink(l.phone) + '" aria-label="Gọi ' + esc(l.name) + '">' + icon('phone') + '</a></span></td></tr>';
        }).join('') + '</tbody></table>' : U.empty('Không có yêu cầu nào khớp bộ lọc.', 'inbox');
      U.qs('[data-pager]', root).innerHTML = list.length ? U.pager(list.length, st.page, PAGE_SIZE) : '';

      var n = Object.keys(st.sel).length;
      U.qs('[data-bulk]', root).innerHTML = n ? '<div class="bulkbar"><b>Đã chọn ' + n + '</b>' +
        '<label class="visually-hidden" for="bst">Đổi trạng thái</label><select id="bst" class="select" style="width:auto" data-bulk-status>' + options(STATUS_KEYS.map(function (k) { return [k, STATUS[k]]; }), '', 'Đổi trạng thái…') + '</select>' +
        '<label class="visually-hidden" for="bwho">Giao cho</label><select id="bwho" class="select" style="width:auto" data-bulk-who>' + options(staffNames(), '', 'Giao cho…') + '</select>' +
        '<button class="btn btn-sm btn-danger" type="button" data-bulk-del>' + icon('trash') + 'Xóa</button>' +
        '<button class="btn btn-sm btn-ghost" type="button" data-bulk-clear>Bỏ chọn</button></div>' : '';

      A.setQuery({ status: st.status, q: st.q, need: st.need, source: st.source, days: st.days, who: st.who, page: st.page > 1 ? st.page : '',
        sort: st.sort !== 'createdAt' ? st.sort : '', dir: st.dir > 0 ? 'asc' : '' });
    }

    root.addEventListener('click', function (e) {
      var t = e.target;
      var tab = t.closest('[data-status]');
      if (tab) { st.status = tab.getAttribute('data-status'); st.page = 1; return draw(); }
      var s = t.closest('[data-sort]');
      if (s) { var k = s.getAttribute('data-sort'); st.dir = st.sort === k ? -st.dir : (k === 'createdAt' ? -1 : 1); st.sort = k; return draw(); }
      var pg = t.closest('[data-page]');
      if (pg) { st.page = +pg.getAttribute('data-page'); draw(); return U.qs('[data-table]', root).scrollIntoView({ block: 'nearest' }); }
      if (t.closest('[data-bulk-clear]')) { st.sel = {}; return draw(); }
      if (t.closest('[data-bulk-del]')) {
        var ids = Object.keys(st.sel);
        return U.confirm({ title: 'Xóa ' + ids.length + ' yêu cầu?', text: 'Các yêu cầu đã chọn sẽ bị xóa khỏi danh sách.', danger: true, ok: 'Xóa' }).then(function (ok) {
          if (!ok) return;
          var removed = A.db.leads.filter(function (l) { return st.sel[l.id]; });
          A.db.leads = A.db.leads.filter(function (l) { return !st.sel[l.id]; });
          A.log('lead', 'Xóa ' + ids.length + ' yêu cầu báo giá');
          A.save(); st.sel = {}; draw();
          U.toast('Đã xóa ' + ids.length + ' yêu cầu.', { undo: function () { A.db.leads = A.db.leads.concat(removed).sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); }); A.save(); draw(); } });
        });
      }
      if (t.closest('a, input, label, button')) return;
      var row = t.closest('tr[data-id]');
      if (row) A.go('leads', currentQuery(), row.getAttribute('data-id'));
    });
    root.addEventListener('change', function (e) {
      var t = e.target;
      if (t.matches('[data-f]')) { st[t.getAttribute('data-f')] = t.value; st.page = 1; return draw(); }
      if (t.matches('[data-sel]')) { if (t.checked) st.sel[t.getAttribute('data-sel')] = 1; else delete st.sel[t.getAttribute('data-sel')]; return draw(); }
      if (t.matches('[data-all]')) {
        U.qsa('[data-sel]', root).forEach(function (c) { if (t.checked) st.sel[c.getAttribute('data-sel')] = 1; else delete st.sel[c.getAttribute('data-sel')]; });
        return draw();
      }
      if (t.matches('[data-bulk-status]') && t.value) {
        var n = 0;
        A.db.leads.forEach(function (l) { if (st.sel[l.id]) { l.status = t.value; n++; } });
        A.log('lead', 'Đổi ' + n + ' yêu cầu sang "' + STATUS[t.value] + '"');
        A.save(); U.toast('Đã cập nhật ' + n + ' yêu cầu.'); st.sel = {}; return draw();
      }
      if (t.matches('[data-bulk-who]') && t.value) {
        var m = 0;
        A.db.leads.forEach(function (l) { if (st.sel[l.id]) { l.assignee = t.value; if (l.status === 'moi') l.status = 'tu-van'; m++; } });
        A.log('lead', 'Giao ' + m + ' yêu cầu cho ' + t.value);
        A.save(); U.toast('Đã giao ' + m + ' yêu cầu cho ' + t.value + '.'); st.sel = {}; return draw();
      }
    });
    var timer;
    U.qs('#lq', root).addEventListener('input', function (e) {
      clearTimeout(timer);
      timer = setTimeout(function () { st.q = e.target.value; st.page = 1; draw(); }, 200);
    });
    U.qs('[data-export]', root).addEventListener('click', function () { exportLeads(sortBy(filtered(false), st.sort, st.dir), 'yeu-cau-bao-gia'); });
    U.qs('[data-add]', root).addEventListener('click', function () { leadForm(null, draw); });

    function currentQuery() {
      return { status: st.status, q: st.q, need: st.need, source: st.source, days: st.days, who: st.who, page: st.page > 1 ? st.page : '' };
    }

    draw();
    if (r.id) leadDrawer(r.id, function () { A.go('leads', currentQuery()); }, draw);
    if (q.new) { A.setQuery(currentQuery()); leadForm(null, draw); }
  };

  function leadForm(lead, after) {
    var l = lead || { name: '', phone: '', company: '', need: NEEDS[0], source: 'Gọi điện', message: '', assignee: '' };
    var m = U.modal({
      title: lead ? 'Sửa yêu cầu ' + lead.id : 'Thêm yêu cầu báo giá',
      body: '<form data-form novalidate><div class="form-grid">' +
        '<div class="field"><label for="f-name">Họ tên *</label><input id="f-name" class="input" name="name" value="' + esc(l.name) + '" required></div>' +
        '<div class="field"><label for="f-phone">Số điện thoại *</label><input id="f-phone" class="input" name="phone" type="tel" value="' + esc(l.phone) + '" required><div class="err" data-err="phone" hidden></div></div>' +
        '<div class="field full"><label for="f-co">Công ty</label><input id="f-co" class="input" name="company" value="' + esc(l.company) + '"></div>' +
        '<div class="field"><label for="f-need">Nhu cầu</label><select id="f-need" class="select" name="need">' + options(NEEDS, l.need) + '</select></div>' +
        '<div class="field"><label for="f-src">Nguồn</label><select id="f-src" class="select" name="source">' + options(SOURCES, l.source) + '</select></div>' +
        '<div class="field full"><label for="f-who">Phụ trách</label><select id="f-who" class="select" name="assignee">' + options(staffNames(), l.assignee, 'Chưa giao') + '</select></div>' +
        '<div class="field full"><label for="f-msg">Ghi chú của khách</label><textarea id="f-msg" class="textarea" name="message">' + esc(l.message) + '</textarea></div>' +
        '</div></form>',
      foot: '<button class="btn" type="button" data-close>Hủy</button><button class="btn btn-primary" type="button" data-save>Lưu</button>'
    });
    U.qs('[data-save]', m.el).addEventListener('click', function () {
      var d = U.formData(U.qs('[data-form]', m.el));
      var errPhone = U.qs('[data-err="phone"]', m.el);
      var okName = d.name.length >= 2, okPhone = validPhone(d.phone);
      U.qs('#f-name', m.el).setAttribute('aria-invalid', String(!okName));
      U.qs('#f-phone', m.el).setAttribute('aria-invalid', String(!okPhone));
      errPhone.hidden = okPhone; errPhone.textContent = 'Số chưa đúng. Ví dụ: 0907 917 301 hoặc +84 907 917 301.';
      if (!okName) return U.qs('#f-name', m.el).focus();
      if (!okPhone) return U.qs('#f-phone', m.el).focus();
      if (lead) {
        Object.assign(lead, d);
        A.log('lead', 'Sửa thông tin yêu cầu ' + lead.id);
      } else {
        var maxId = A.db.leads.reduce(function (mx, x) { return Math.max(mx, +x.id.slice(2)); }, 1000);
        var nl = Object.assign({ id: 'YC' + (maxId + 1), createdAt: new Date().toISOString(), lang: 'VI', page: '', status: d.assignee ? 'tu-van' : 'moi', notes: [] }, d);
        A.db.leads.unshift(nl);
        A.log('lead', 'Thêm yêu cầu ' + nl.id + ' (' + nl.source + ') từ ' + nl.name);
      }
      A.save(); m.close(); U.toast(lead ? 'Đã lưu thay đổi.' : 'Đã thêm yêu cầu.'); after && after();
    });
  }

  function leadDrawer(id, onClose, redraw) {
    var l = A.db.leads.find(function (x) { return x.id === id; });
    if (!l) { U.toast('Không tìm thấy yêu cầu ' + id + '.', { error: true }); onClose(); return; }
    var d = U.drawer({ title: l.id + ' · ' + l.name, body: '', onClose: onClose,
      foot: '<button class="btn btn-danger left" type="button" data-del>' + icon('trash') + 'Xóa</button>' +
        '<button class="btn" type="button" data-edit>' + icon('edit') + 'Sửa</button><button class="btn btn-primary" type="button" data-close>Xong</button>' });
    var body = U.qs('.modal-body', d.el);
    function paint() {
      var cust = A.db.customers.find(function (c) { return phoneDigits(c.phone) === phoneDigits(l.phone); });
      body.innerHTML =
        '<div class="quick"><a class="btn btn-primary" href="tel:' + telLink(l.phone) + '">' + icon('phone') + 'Gọi ' + esc(l.phone) + '</a>' +
          '<a class="btn" href="https://zalo.me/' + phoneDigits(l.phone).replace(/^\+84/, '0') + '" target="_blank" rel="noopener">' + icon('chat') + 'Zalo</a>' +
          (cust ? '<a class="btn" href="#/customers/' + cust.id + '">' + icon('users') + 'Khách hàng ' + esc(cust.id) + '</a>'
                : '<button class="btn" type="button" data-to-customer>' + icon('user_plus') + 'Tạo khách hàng</button>') + '</div>' +
        '<div class="form-grid">' +
          '<div class="field"><label for="d-st">Trạng thái</label><select id="d-st" class="select" data-status>' + options(STATUS_KEYS.map(function (k) { return [k, STATUS[k]]; }), l.status) + '</select></div>' +
          '<div class="field"><label for="d-who">Phụ trách</label><select id="d-who" class="select" data-who>' + options(staffNames(), l.assignee, 'Chưa giao') + '</select></div>' +
        '</div>' +
        '<dl class="dl"><dt>Gửi lúc</dt><dd>' + U.fmtDateTime(l.createdAt) + ' (' + U.ago(l.createdAt) + ')</dd>' +
          '<dt>Công ty</dt><dd>' + esc(l.company || '—') + '</dd>' +
          '<dt>Nhu cầu</dt><dd>' + esc(l.need) + '</dd>' +
          '<dt>Nguồn</dt><dd>' + esc(l.source) + (l.page ? ' · trang <span class="mono">' + esc(l.page) + '</span>' : '') + '</dd>' +
          '<dt>Ngôn ngữ trang</dt><dd>' + (l.lang === 'EN' ? 'Tiếng Anh' : 'Tiếng Việt') + '</dd></dl>' +
        '<div class="section-label">KHÁCH GHI CHÚ</div>' +
        '<p class="quote">' + (l.message ? esc(l.message) : '<span class="muted">Không có ghi chú.</span>') + '</p>' +
        '<div class="section-label">LỊCH SỬ XỬ LÝ</div>' +
        (l.notes.length ? '<ul class="timeline">' + l.notes.map(function (n) {
          return '<li>' + esc(n.text) + '<span class="meta">' + esc(n.by) + ' · ' + U.fmtDateTime(n.at) + '</span></li>';
        }).join('') + '</ul>' : '<p class="muted small">Chưa có ghi chú nào.</p>') +
        '<div class="field" style="margin-top:12px"><label for="d-note">Thêm ghi chú</label><textarea id="d-note" class="textarea" style="min-height:72px" placeholder="Ví dụ: đã gọi, hẹn khảo sát xe thứ 5…"></textarea></div>' +
        '<button class="btn" type="button" data-note>' + icon('plus') + 'Lưu ghi chú</button>';
    }
    paint();
    body.addEventListener('change', function (e) {
      if (e.target.matches('[data-status]')) {
        l.status = e.target.value;
        l.notes.push({ at: new Date().toISOString(), by: A.me.name, text: 'Đổi trạng thái: ' + STATUS[l.status] });
        A.log('lead', l.id + ': trạng thái "' + STATUS[l.status] + '"');
        A.save(); paint(); redraw(); U.toast('Đã đổi trạng thái.');
      }
      if (e.target.matches('[data-who]')) {
        l.assignee = e.target.value;
        if (l.assignee && l.status === 'moi') l.status = 'tu-van';
        l.notes.push({ at: new Date().toISOString(), by: A.me.name, text: l.assignee ? 'Giao cho ' + l.assignee : 'Bỏ người phụ trách' });
        A.log('lead', l.id + ': ' + (l.assignee ? 'giao cho ' + l.assignee : 'bỏ người phụ trách'));
        A.save(); paint(); redraw(); U.toast('Đã cập nhật người phụ trách.');
      }
    });
    body.addEventListener('click', function (e) {
      if (e.target.closest('[data-note]')) {
        var ta = U.qs('#d-note', body), text = ta.value.trim();
        if (!text) return ta.focus();
        l.notes.push({ at: new Date().toISOString(), by: A.me.name, text: text });
        A.log('lead', 'Ghi chú cho ' + l.id + ': ' + text);
        A.save(); paint(); U.toast('Đã lưu ghi chú.');
      }
      if (e.target.closest('[data-to-customer]')) {
        d.close();
        customerForm({ company: l.company || l.name, contact: l.name, phone: l.phone, note: 'Tạo từ yêu cầu ' + l.id }, function (c) { A.go('customers', null, c.id); });
      }
      if (e.target.closest('a[href^="#/customers"]')) d.close();
    });
    U.qs('[data-edit]', d.el).addEventListener('click', function () { leadForm(l, function () { paint(); redraw(); U.qs('.modal-head h2', d.el).textContent = l.id + ' · ' + l.name; }); });
    U.qs('[data-del]', d.el).addEventListener('click', function () {
      U.confirm({ title: 'Xóa yêu cầu ' + l.id + '?', text: 'Yêu cầu của ' + l.name + ' sẽ bị xóa khỏi danh sách.', danger: true, ok: 'Xóa' }).then(function (ok) {
        if (!ok) return;
        var idx = A.db.leads.indexOf(l);
        A.db.leads.splice(idx, 1);
        A.log('lead', 'Xóa yêu cầu ' + l.id);
        A.save(); d.close(); redraw();
        U.toast('Đã xóa ' + l.id + '.', { undo: function () { A.db.leads.splice(idx, 0, l); A.save(); redraw(); } });
      });
    });
  }

  /* =====================================================================
     KHÁCH HÀNG
     ===================================================================== */
  var PROVINCES = ['TP.HCM', 'Bình Dương', 'Đồng Nai', 'Long An', 'Bình Phước', 'Tây Ninh', 'Bà Rịa - Vũng Tàu', 'Đắk Lắk', 'Gia Lai', 'Cần Thơ', 'Bình Định', 'Quảng Nam', 'Khác'];

  V.customers = function (root, r) {
    var st = { q: r.query.q || '', prov: r.query.prov || '', page: 1, sort: 'company', dir: 1 };
    root.innerHTML = head('Khách hàng', 'Doanh nghiệp đã mua hoặc đang dùng sàn HALLCO®.',
      '<button class="btn" type="button" data-export>' + icon('download') + 'Xuất CSV</button>' +
      '<button class="btn btn-primary" type="button" data-add>' + icon('plus') + 'Thêm khách hàng</button>') +
      '<section class="card"><div class="toolbar">' +
        '<div class="search">' + icon('search') + '<label class="visually-hidden" for="cq">Tìm</label><input id="cq" class="input" type="search" placeholder="Tên công ty, người liên hệ, SĐT…" value="' + esc(st.q) + '"></div>' +
        '<label class="visually-hidden" for="cprov">Tỉnh</label><select id="cprov" class="select" data-prov>' + options(PROVINCES, st.prov, 'Mọi tỉnh thành') + '</select>' +
      '</div><div class="table-wrap" data-table></div><div data-pager></div></section>';

    function list() {
      return sortBy(A.db.customers.filter(function (c) {
        return (!st.prov || c.province === st.prov) && U.matches(st.q, [c.id, c.company, c.contact, c.phone, phoneDigits(c.phone), c.cargo]);
      }).map(function (c) { return Object.assign({ units: A.db.warranties.filter(function (w) { return w.customerId === c.id; }).length }, c); }), st.sort, st.dir);
    }
    function draw() {
      var all = list(), rows = all.slice((st.page - 1) * PAGE_SIZE, st.page * PAGE_SIZE);
      U.qs('[data-table]', root).innerHTML = rows.length ? '<table class="table"><thead><tr>' + th('Mã', 'id', st) + th('Công ty', 'company', st) + th('Số điện thoại') +
        th('Tỉnh thành', 'province', st) + th('Hàng chở', 'cargo', st) + '<th class="num" scope="col">Số xe</th><th class="num" scope="col">Bộ đã lắp</th><th class="col-act"><span class="visually-hidden">Thao tác</span></th></tr></thead><tbody>' +
        rows.map(function (c) {
          return '<tr class="is-click" data-id="' + c.id + '"><td class="mono">' + c.id + '</td>' +
            '<td><span class="cell-main">' + esc(c.company) + '</span><span class="cell-sub">' + esc(c.contact) + '</span></td>' +
            '<td class="nw">' + esc(c.phone) + '</td><td>' + esc(c.province) + '</td><td>' + esc(c.cargo || '—') + '</td>' +
            '<td class="num">' + (c.vehicles || 0) + '</td><td class="num">' + c.units + '</td>' +
            '<td class="col-act"><span class="row-actions"><button class="icon-btn" type="button" data-edit="' + c.id + '" aria-label="Sửa ' + esc(c.company) + '">' + icon('edit') + '</button>' +
            '<button class="icon-btn danger" type="button" data-del="' + c.id + '" aria-label="Xóa ' + esc(c.company) + '">' + icon('trash') + '</button></span></td></tr>';
        }).join('') + '</tbody></table>' : U.empty('Không có khách hàng nào khớp.', 'users');
      U.qs('[data-pager]', root).innerHTML = all.length ? U.pager(all.length, st.page, PAGE_SIZE) : '';
    }
    root.addEventListener('click', function (e) {
      var t = e.target, b;
      if ((b = t.closest('[data-sort]'))) { var k = b.getAttribute('data-sort'); st.dir = st.sort === k ? -st.dir : 1; st.sort = k; return draw(); }
      if ((b = t.closest('[data-page]'))) { st.page = +b.getAttribute('data-page'); return draw(); }
      if ((b = t.closest('[data-edit]'))) { var c = A.db.customers.find(function (x) { return x.id === b.getAttribute('data-edit'); }); return customerForm(c, draw); }
      if ((b = t.closest('[data-del]'))) return deleteCustomer(b.getAttribute('data-del'), draw);
      if (t.closest('a, button, input')) return;
      var row = t.closest('tr[data-id]');
      if (row) A.go('customers', null, row.getAttribute('data-id'));
    });
    U.qs('#cq', root).addEventListener('input', function (e) { st.q = e.target.value; st.page = 1; draw(); });
    U.qs('[data-prov]', root).addEventListener('change', function (e) { st.prov = e.target.value; st.page = 1; draw(); });
    U.qs('[data-add]', root).addEventListener('click', function () { customerForm(null, draw); });
    U.qs('[data-export]', root).addEventListener('click', function () {
      var l = list();
      U.downloadCsv('khach-hang-' + new Date().toISOString().slice(0, 10) + '.csv', ['Mã', 'Công ty', 'Người liên hệ', 'SĐT', 'Email', 'Tỉnh', 'Hàng chở', 'Số xe', 'Bộ đã lắp', 'Ghi chú'],
        l.map(function (c) { return [c.id, c.company, c.contact, c.phone, c.email, c.province, c.cargo, c.vehicles, c.units, c.note]; }));
      U.toast('Đã xuất ' + l.length + ' khách hàng.');
    });
    draw();
    if (r.id) customerDrawer(r.id, draw);
  };

  function customerForm(c, after) {
    var isNew = !c || !c.id;
    var v = Object.assign({ company: '', contact: '', phone: '', email: '', province: 'TP.HCM', cargo: '', vehicles: 1, note: '' }, c || {});
    var m = U.modal({
      title: isNew ? 'Thêm khách hàng' : 'Sửa ' + v.id,
      body: '<form data-form novalidate><div class="form-grid">' +
        '<div class="field full"><label for="c-co">Tên công ty / khách hàng *</label><input id="c-co" class="input" name="company" value="' + esc(v.company) + '"></div>' +
        '<div class="field"><label for="c-ct">Người liên hệ</label><input id="c-ct" class="input" name="contact" value="' + esc(v.contact) + '"></div>' +
        '<div class="field"><label for="c-ph">Số điện thoại *</label><input id="c-ph" class="input" name="phone" type="tel" value="' + esc(v.phone) + '"></div>' +
        '<div class="field"><label for="c-em">Email</label><input id="c-em" class="input" name="email" type="email" value="' + esc(v.email) + '"></div>' +
        '<div class="field"><label for="c-pv">Tỉnh thành</label><select id="c-pv" class="select" name="province">' + options(PROVINCES, v.province) + '</select></div>' +
        '<div class="field"><label for="c-cg">Loại hàng chở</label><input id="c-cg" class="input" name="cargo" value="' + esc(v.cargo) + '" placeholder="dăm gỗ, mùn cưa…"></div>' +
        '<div class="field"><label for="c-vh">Số xe</label><input id="c-vh" class="input" name="vehicles" type="number" min="0" value="' + esc(v.vehicles) + '"></div>' +
        '<div class="field full"><label for="c-nt">Ghi chú</label><textarea id="c-nt" class="textarea" name="note">' + esc(v.note) + '</textarea></div>' +
        '</div></form>',
      foot: '<button class="btn" type="button" data-close>Hủy</button><button class="btn btn-primary" type="button" data-save>Lưu</button>'
    });
    U.qs('[data-save]', m.el).addEventListener('click', function () {
      var d = U.formData(U.qs('[data-form]', m.el));
      d.vehicles = Math.max(0, parseInt(d.vehicles, 10) || 0);
      var okC = d.company.length >= 2, okP = validPhone(d.phone);
      U.qs('#c-co', m.el).setAttribute('aria-invalid', String(!okC));
      U.qs('#c-ph', m.el).setAttribute('aria-invalid', String(!okP));
      if (!okC) return U.qs('#c-co', m.el).focus();
      if (!okP) { U.toast('Số điện thoại chưa đúng định dạng.', { error: true }); return U.qs('#c-ph', m.el).focus(); }
      var saved;
      if (isNew) {
        var maxId = A.db.customers.reduce(function (mx, x) { return Math.max(mx, +x.id.slice(2)); }, 0);
        saved = Object.assign({ id: 'KH' + String(maxId + 1).padStart(3, '0'), createdAt: new Date().toISOString() }, d);
        A.db.customers.unshift(saved);
        A.log('customer', 'Thêm khách hàng ' + saved.id + ' – ' + saved.company);
      } else {
        saved = A.db.customers.find(function (x) { return x.id === c.id; });
        Object.assign(saved, d);
        A.log('customer', 'Sửa khách hàng ' + saved.id);
      }
      A.save(); m.close(); U.toast(isNew ? 'Đã thêm khách hàng.' : 'Đã lưu thay đổi.'); after && after(saved);
    });
  }

  function deleteCustomer(id, after) {
    var c = A.db.customers.find(function (x) { return x.id === id; });
    var units = A.db.warranties.filter(function (w) { return w.customerId === id; }).length;
    U.confirm({ title: 'Xóa ' + c.company + '?', danger: true, ok: 'Xóa',
      text: units ? 'Khách hàng này có ' + units + ' bộ đang theo dõi bảo hành. Các phiếu bảo hành đó cũng sẽ bị xóa.' : 'Khách hàng sẽ bị xóa khỏi danh sách.' }).then(function (ok) {
      if (!ok) return;
      var snapC = A.db.customers.slice(), snapW = A.db.warranties.slice();
      A.db.customers = A.db.customers.filter(function (x) { return x.id !== id; });
      A.db.warranties = A.db.warranties.filter(function (w) { return w.customerId !== id; });
      A.log('customer', 'Xóa khách hàng ' + id + ' – ' + c.company);
      A.save(); after && after();
      U.toast('Đã xóa ' + c.company + '.', { undo: function () { A.db.customers = snapC; A.db.warranties = snapW; A.save(); after && after(); } });
    });
  }

  function customerDrawer(id, redraw) {
    var c = A.db.customers.find(function (x) { return x.id === id; });
    if (!c) { U.toast('Không tìm thấy khách hàng ' + id + '.', { error: true }); return A.go('customers'); }
    var d = U.drawer({ title: c.company, onClose: function () { A.go('customers'); },
      foot: '<button class="btn btn-danger left" type="button" data-del>' + icon('trash') + 'Xóa</button><button class="btn" type="button" data-edit>' + icon('edit') + 'Sửa</button>' +
        '<button class="btn btn-primary" type="button" data-close>Xong</button>' });
    var body = U.qs('.modal-body', d.el);
    function paint() {
      var units = A.db.warranties.filter(function (w) { return w.customerId === id; });
      var leads = A.db.leads.filter(function (l) { return phoneDigits(l.phone) === phoneDigits(c.phone); });
      body.innerHTML = '<div class="quick"><a class="btn btn-primary" href="tel:' + telLink(c.phone) + '">' + icon('phone') + 'Gọi ' + esc(c.phone) + '</a>' +
        '<a class="btn" href="https://zalo.me/' + phoneDigits(c.phone) + '" target="_blank" rel="noopener">' + icon('chat') + 'Zalo</a></div>' +
        '<dl class="dl"><dt>Mã</dt><dd class="mono">' + c.id + '</dd><dt>Người liên hệ</dt><dd>' + esc(c.contact || '—') + '</dd>' +
        '<dt>Email</dt><dd>' + (c.email ? '<a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a>' : '—') + '</dd>' +
        '<dt>Tỉnh thành</dt><dd>' + esc(c.province) + '</dd><dt>Hàng chở</dt><dd>' + esc(c.cargo || '—') + '</dd><dt>Số xe</dt><dd>' + (c.vehicles || 0) + '</dd>' +
        '<dt>Khách từ</dt><dd>' + U.fmtDate(c.createdAt) + '</dd>' + (c.note ? '<dt>Ghi chú</dt><dd>' + esc(c.note) + '</dd>' : '') + '</dl>' +
        '<div class="section-label">BỘ ĐÃ LẮP (' + units.length + ')</div>' +
        (units.length ? '<ul class="list">' + units.map(function (w) {
          var wi = wInfo(w);
          return '<li><span class="grow"><b>' + esc(w.model) + ' · <span class="mono">' + esc(w.serial) + '</span></b><span>' + esc(w.vehicle) + ' ' + esc(w.plate) + ' · lắp ' + U.fmtDate(w.installedAt) + '</span></span><span class="pill pill-' + wi.cls + '">' + wi.label + '</span></li>';
        }).join('') + '</ul>' : '<p class="muted small">Chưa có bộ nào.</p>') +
        '<button class="btn btn-sm" type="button" data-add-w style="margin-top:8px">' + icon('plus') + 'Thêm bộ đã lắp</button>' +
        '<div class="section-label">YÊU CẦU BÁO GIÁ (' + leads.length + ')</div>' +
        (leads.length ? '<ul class="list">' + leads.map(function (l) {
          return '<li><span class="grow"><b><a href="#/leads/' + l.id + '">' + l.id + '</a> · ' + esc(l.need) + '</b><span>' + U.fmtDate(l.createdAt) + '</span></span>' + pill(l.status) + '</li>';
        }).join('') + '</ul>' : '<p class="muted small">Không có yêu cầu nào cùng số điện thoại.</p>');
    }
    paint();
    body.addEventListener('click', function (e) {
      if (e.target.closest('[data-add-w]')) warrantyForm({ customerId: id }, function () { paint(); redraw(); });
    });
    U.qs('[data-edit]', d.el).addEventListener('click', function () { customerForm(c, function () { paint(); redraw(); U.qs('.modal-head h2', d.el).textContent = c.company; }); });
    U.qs('[data-del]', d.el).addEventListener('click', function () { deleteCustomer(id, function () { d.close(); redraw(); }); });
  }

  /* =====================================================================
     BẢO HÀNH
     ===================================================================== */
  V.warranty = function (root, r) {
    var TABS = [['', 'Tất cả'], ['ok', 'Còn hạn'], ['soon', 'Sắp hết hạn'], ['expired', 'Hết hạn'], ['unreg', 'Chưa đăng ký']];
    var st = { tab: r.query.tab || '', q: '', model: '', page: 1, sort: 'end', dir: 1 };
    root.innerHTML = head('Bảo hành', 'Các bộ i-Series và W Floor™ đã lắp, ngày hết hạn tính từ ngày lắp. <a href="/assets/docs/hallco-i-series-dieu-kien-bao-hanh.pdf" target="_blank" rel="noopener">Điều kiện bảo hành i-Series (PDF)</a>',
      '<button class="btn" type="button" data-export>' + icon('download') + 'Xuất CSV</button>' +
      '<button class="btn btn-primary" type="button" data-add>' + icon('plus') + 'Thêm bộ đã lắp</button>') +
      '<section class="card"><div class="tabs" role="tablist" data-tabs></div><div class="toolbar">' +
        '<div class="search">' + icon('search') + '<label class="visually-hidden" for="wq">Tìm</label><input id="wq" class="input" type="search" placeholder="Số serial, khách hàng, biển số…"></div>' +
        '<label class="visually-hidden" for="wm">Model</label><select id="wm" class="select" data-model>' + options(MODELS, '', 'Mọi model') + '</select>' +
      '</div><div class="table-wrap" data-table></div><div data-pager></div></section>';

    function rowsAll(ignoreTab) {
      return A.db.warranties.map(function (w) { var i = wInfo(w); return Object.assign({ end: i.end, info: i, cust: customerName(w.customerId) }, w); })
        .filter(function (w) {
          return (ignoreTab || !st.tab || w.info.key === st.tab) && (!st.model || w.model === st.model) &&
            U.matches(st.q, [w.serial, w.cust, w.plate, w.vehicle]);
        });
    }
    function draw() {
      var base = rowsAll(true);
      U.qs('[data-tabs]', root).innerHTML = TABS.map(function (t) {
        var n = t[0] ? base.filter(function (w) { return w.info.key === t[0]; }).length : base.length;
        return '<button class="tab" role="tab" type="button" aria-selected="' + (st.tab === t[0]) + '" data-tab="' + t[0] + '">' + t[1] + '<span class="count">' + n + '</span></button>';
      }).join('');
      var all = sortBy(rowsAll(false), st.sort, st.dir), rows = all.slice((st.page - 1) * PAGE_SIZE, st.page * PAGE_SIZE);
      U.qs('[data-table]', root).innerHTML = rows.length ? '<table class="table"><thead><tr>' + th('Số serial', 'serial', st) + th('Khách hàng', 'cust', st) + th('Model', 'model', st) +
        th('Xe') + th('Ngày lắp', 'installedAt', st) + th('Hết hạn', 'end', st) + th('Trạng thái') + '<th class="col-act"><span class="visually-hidden">Thao tác</span></th></tr></thead><tbody>' +
        rows.map(function (w) {
          var left = w.info.left;
          return '<tr><td class="mono">' + esc(w.serial) + '</td><td><a href="#/customers/' + w.customerId + '">' + esc(w.cust) + '</a></td><td>' + esc(w.model) + '</td>' +
            '<td>' + esc(w.vehicle) + '<span class="cell-sub">' + esc(w.plate) + '</span></td><td class="nw">' + U.fmtDate(w.installedAt) + '</td>' +
            '<td class="nw">' + U.fmtDate(w.end) + '<span class="cell-sub">' + (left >= 0 ? 'còn ' + left + ' ngày' : 'quá ' + (-left) + ' ngày') + '</span></td>' +
            '<td><span class="pill pill-' + w.info.cls + '">' + w.info.label + '</span></td>' +
            '<td class="col-act"><span class="row-actions"><button class="icon-btn" type="button" data-edit="' + w.id + '" aria-label="Sửa ' + esc(w.serial) + '">' + icon('edit') + '</button>' +
            '<button class="icon-btn danger" type="button" data-del="' + w.id + '" aria-label="Xóa ' + esc(w.serial) + '">' + icon('trash') + '</button></span></td></tr>';
        }).join('') + '</tbody></table>' : U.empty('Không có phiếu bảo hành nào khớp.', 'shield');
      U.qs('[data-pager]', root).innerHTML = all.length ? U.pager(all.length, st.page, PAGE_SIZE) : '';
      A.setQuery({ tab: st.tab });
    }
    root.addEventListener('click', function (e) {
      var b;
      if ((b = e.target.closest('[data-tab]'))) { st.tab = b.getAttribute('data-tab'); st.page = 1; return draw(); }
      if ((b = e.target.closest('[data-sort]'))) { var k = b.getAttribute('data-sort'); st.dir = st.sort === k ? -st.dir : 1; st.sort = k; return draw(); }
      if ((b = e.target.closest('[data-page]'))) { st.page = +b.getAttribute('data-page'); return draw(); }
      if ((b = e.target.closest('[data-edit]'))) return warrantyForm(A.db.warranties.find(function (w) { return w.id === b.getAttribute('data-edit'); }), draw);
      if ((b = e.target.closest('[data-del]'))) {
        var w = A.db.warranties.find(function (x) { return x.id === b.getAttribute('data-del'); });
        return U.confirm({ title: 'Xóa phiếu ' + w.serial + '?', text: 'Phiếu bảo hành của ' + customerName(w.customerId) + ' sẽ bị xóa.', danger: true, ok: 'Xóa' }).then(function (ok) {
          if (!ok) return;
          var idx = A.db.warranties.indexOf(w);
          A.db.warranties.splice(idx, 1); A.log('warranty', 'Xóa phiếu bảo hành ' + w.serial); A.save(); draw();
          U.toast('Đã xóa phiếu ' + w.serial + '.', { undo: function () { A.db.warranties.splice(idx, 0, w); A.save(); draw(); } });
        });
      }
    });
    U.qs('#wq', root).addEventListener('input', function (e) { st.q = e.target.value; st.page = 1; draw(); });
    U.qs('[data-model]', root).addEventListener('change', function (e) { st.model = e.target.value; st.page = 1; draw(); });
    U.qs('[data-add]', root).addEventListener('click', function () { warrantyForm(null, draw); });
    U.qs('[data-export]', root).addEventListener('click', function () {
      var l = rowsAll(false);
      U.downloadCsv('bao-hanh-' + new Date().toISOString().slice(0, 10) + '.csv', ['Serial', 'Khách hàng', 'Model', 'Xe', 'Biển số', 'Ngày lắp', 'Hết hạn', 'Trạng thái'],
        l.map(function (w) { return [w.serial, w.cust, w.model, w.vehicle, w.plate, U.fmtDate(w.installedAt), U.fmtDate(w.end), w.info.label]; }));
      U.toast('Đã xuất ' + l.length + ' phiếu.');
    });
    draw();
  };

  function warrantyForm(w, after) {
    var isNew = !w || !w.id;
    var v = Object.assign({ serial: '', customerId: '', model: 'i-4000', vehicle: '', plate: '', installedAt: new Date().toISOString(), months: 24, registered: true, note: '' }, w || {});
    var custs = A.db.customers.slice().sort(function (a, b) { return a.company.localeCompare(b.company, 'vi'); }).map(function (c) { return [c.id, c.company + ' (' + c.id + ')']; });
    var m = U.modal({
      title: isNew ? 'Thêm bộ đã lắp' : 'Sửa phiếu ' + v.serial,
      body: '<form data-form novalidate><div class="form-grid">' +
        '<div class="field full"><label for="w-c">Khách hàng *</label><select id="w-c" class="select" name="customerId">' + options(custs, v.customerId, 'Chọn khách hàng') + '</select></div>' +
        '<div class="field"><label for="w-m">Model</label><select id="w-m" class="select" name="model">' + options(MODELS, v.model) + '</select></div>' +
        '<div class="field"><label for="w-s">Số serial *</label><input id="w-s" class="input" name="serial" value="' + esc(v.serial) + '" placeholder="I4-24518"></div>' +
        '<div class="field"><label for="w-v">Loại xe</label><input id="w-v" class="input" name="vehicle" value="' + esc(v.vehicle) + '" placeholder="Rơ-moóc 45 ft"></div>' +
        '<div class="field"><label for="w-p">Biển số</label><input id="w-p" class="input" name="plate" value="' + esc(v.plate) + '"></div>' +
        '<div class="field"><label for="w-d">Ngày lắp</label><input id="w-d" class="input" type="date" name="installedAt" value="' + v.installedAt.slice(0, 10) + '"></div>' +
        '<div class="field"><label for="w-mo">Thời hạn (tháng)</label><input id="w-mo" class="input" type="number" min="0" name="months" value="' + esc(v.months) + '"></div>' +
        '<div class="field full"><label class="check"><input type="checkbox" name="registered"' + (v.registered ? ' checked' : '') + '>Đã đăng ký bảo hành với HALLCO</label></div>' +
        '<div class="field full"><label for="w-n">Ghi chú</label><textarea id="w-n" class="textarea" name="note">' + esc(v.note) + '</textarea></div>' +
        '</div></form>',
      foot: '<button class="btn" type="button" data-close>Hủy</button><button class="btn btn-primary" type="button" data-save>Lưu</button>'
    });
    U.qs('[data-save]', m.el).addEventListener('click', function () {
      var d = U.formData(U.qs('[data-form]', m.el));
      if (!d.customerId) { U.qs('#w-c', m.el).setAttribute('aria-invalid', 'true'); return U.qs('#w-c', m.el).focus(); }
      if (!d.serial) { U.qs('#w-s', m.el).setAttribute('aria-invalid', 'true'); return U.qs('#w-s', m.el).focus(); }
      d.months = Math.max(0, parseInt(d.months, 10) || 0);
      d.installedAt = new Date(d.installedAt + 'T08:00:00').toISOString();
      if (isNew) {
        var maxId = A.db.warranties.reduce(function (mx, x) { return Math.max(mx, +x.id.slice(2)); }, 0);
        A.db.warranties.unshift(Object.assign({ id: 'BH' + String(maxId + 1).padStart(3, '0') }, d));
        A.log('warranty', 'Thêm bộ ' + d.model + ' ' + d.serial + ' cho ' + customerName(d.customerId));
      } else {
        Object.assign(A.db.warranties.find(function (x) { return x.id === w.id; }), d);
        A.log('warranty', 'Sửa phiếu bảo hành ' + d.serial);
      }
      A.save(); m.close(); U.toast(isNew ? 'Đã thêm phiếu bảo hành.' : 'Đã lưu thay đổi.'); after && after();
    });
  }

  /* =====================================================================
     SẢN PHẨM
     ===================================================================== */
  V.products = function (root) {
    root.innerHTML = head('Sản phẩm', 'Các dòng sản phẩm hiển thị trên website. Ẩn một sản phẩm để tạm bỏ nó khỏi trang Sản phẩm.',
      '<button class="btn btn-primary" type="button" data-add>' + icon('plus') + 'Thêm sản phẩm</button>') +
      '<div class="callout callout-info">Bản giao diện: thay đổi được lưu trên trình duyệt này. Để cập nhật lên website cần nối máy chủ (hoặc sửa nguồn trong <span class="mono">_src/</span> rồi chạy <span class="mono">python tools/build.py</span>).</div>' +
      '<div class="cards" data-cards></div>';
    function draw() {
      U.qs('[data-cards]', root).innerHTML = A.db.products.map(function (p) {
        return '<article class="card p-card' + (p.visible ? '' : ' is-hidden') + '">' +
          '<img src="/assets/img/' + esc(p.image) + '" alt="" loading="lazy">' +
          '<div class="card-pad"><span class="chip" style="align-self:flex-start">' + esc(p.group) + '</span><h3>' + esc(p.name) + '</h3><p class="muted small">' + esc(p.summary) + '</p>' +
          '<div class="foot"><label class="switch"><input type="checkbox" data-vis="' + p.id + '"' + (p.visible ? ' checked' : '') + '><span class="track"></span><span class="small">' + (p.visible ? 'Đang hiện' : 'Đang ẩn') + '</span></label>' +
          '<span><a class="btn btn-sm btn-ghost" href="/' + esc(p.page.replace(/\.html$/, '')) + '" target="_blank" rel="noopener" aria-label="Xem trang ' + esc(p.name) + '">' + icon('external') + '</a>' +
          '<button class="btn btn-sm" type="button" data-edit="' + p.id + '">' + icon('edit') + 'Sửa</button></span></div></div></article>';
      }).join('');
    }
    root.addEventListener('change', function (e) {
      if (!e.target.matches('[data-vis]')) return;
      var p = A.db.products.find(function (x) { return x.id === e.target.getAttribute('data-vis'); });
      p.visible = e.target.checked;
      A.log('content', (p.visible ? 'Hiện' : 'Ẩn') + ' sản phẩm ' + p.name);
      A.save(); draw(); U.toast((p.visible ? 'Đã hiện ' : 'Đã ẩn ') + p.name + '.');
    });
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-edit]');
      if (b) productForm(A.db.products.find(function (x) { return x.id === b.getAttribute('data-edit'); }), draw);
      if (e.target.closest('[data-add]')) productForm(null, draw);
    });
    draw();
  };

  function productForm(p, after) {
    var isNew = !p;
    var v = p ? JSON.parse(JSON.stringify(p)) : { id: '', name: '', group: 'i-Series', page: 'san-pham.html', image: 'san-pham-i-series.webp', visible: true, summary: '', specs: [['', '']] };
    var pages = A.db.pages.filter(function (x) { return x.lang === 'VI'; }).map(function (x) { return [x.path, x.name + ' (' + x.path + ')']; });
    var imgs = A.db.media.filter(function (x) { return /\.(webp|jpe?g|png|svg)$/i.test(x.name) && x.folder === 'assets/img'; }).map(function (x) { return x.name; });
    var m = U.modal({ size: 'lg', title: isNew ? 'Thêm sản phẩm' : 'Sửa ' + v.name,
      body: '<form data-form novalidate><div class="form-grid">' +
        '<div class="field"><label for="p-n">Tên sản phẩm *</label><input id="p-n" class="input" name="name" value="' + esc(v.name) + '"></div>' +
        '<div class="field"><label for="p-g">Nhóm</label><input id="p-g" class="input" name="group" value="' + esc(v.group) + '" list="p-groups"><datalist id="p-groups"><option>i-Series</option><option>W Floor</option><option>Thanh sàn</option><option>Hệ cố định</option></datalist></div>' +
        '<div class="field full"><label for="p-s">Mô tả ngắn</label><textarea id="p-s" class="textarea" name="summary" style="min-height:70px">' + esc(v.summary) + '</textarea></div>' +
        '<div class="field"><label for="p-pg">Trang chi tiết</label><select id="p-pg" class="select" name="page">' + options(pages, v.page) + '</select></div>' +
        '<div class="field"><label for="p-im">Ảnh đại diện</label><select id="p-im" class="select" name="image">' + options(imgs, v.image) + '</select></div>' +
        '<div class="field full"><img class="preview-img" data-prev src="/assets/img/' + esc(v.image) + '" alt="" style="max-height:200px"></div>' +
        '<div class="field full"><span class="field-label">Thông số hiển thị</span><div class="spec-rows" data-specs></div>' +
          '<button class="btn btn-sm" type="button" data-add-spec style="margin-top:8px">' + icon('plus') + 'Thêm dòng</button>' +
          '<div class="hint">Chỉ ghi số liệu có trong tài liệu chính thức của HALLCO.</div></div>' +
        '<div class="field full"><label class="switch"><input type="checkbox" name="visible"' + (v.visible ? ' checked' : '') + '><span class="track"></span>Hiện trên website</label></div>' +
        '</div></form>',
      foot: (isNew ? '' : '<button class="btn btn-danger left" type="button" data-del>' + icon('trash') + 'Xóa</button>') +
        '<button class="btn" type="button" data-close>Hủy</button><button class="btn btn-primary" type="button" data-save>Lưu</button>' });
    var specsEl = U.qs('[data-specs]', m.el);
    function paintSpecs() {
      specsEl.innerHTML = v.specs.map(function (s, i) {
        return '<div class="spec-row"><input class="input" aria-label="Tên thông số ' + (i + 1) + '" data-sk="' + i + '" value="' + esc(s[0]) + '" placeholder="Tên thông số">' +
          '<input class="input" aria-label="Giá trị ' + (i + 1) + '" data-sv="' + i + '" value="' + esc(s[1]) + '" placeholder="Giá trị">' +
          '<button class="icon-btn" type="button" data-rm="' + i + '" aria-label="Xóa dòng ' + (i + 1) + '">' + icon('close') + '</button></div>';
      }).join('');
    }
    paintSpecs();
    m.el.addEventListener('input', function (e) {
      var t = e.target;
      if (t.hasAttribute('data-sk')) v.specs[+t.getAttribute('data-sk')][0] = t.value;
      if (t.hasAttribute('data-sv')) v.specs[+t.getAttribute('data-sv')][1] = t.value;
    });
    U.qs('#p-im', m.el).addEventListener('change', function (e) { U.qs('[data-prev]', m.el).src = '/assets/img/' + e.target.value; });
    m.el.addEventListener('click', function (e) {
      var b;
      if (e.target.closest('[data-add-spec]')) { v.specs.push(['', '']); paintSpecs(); U.qs('[data-sk="' + (v.specs.length - 1) + '"]', m.el).focus(); }
      if ((b = e.target.closest('[data-rm]'))) { v.specs.splice(+b.getAttribute('data-rm'), 1); paintSpecs(); }
      if (e.target.closest('[data-del]')) {
        U.confirm({ title: 'Xóa ' + p.name + '?', text: 'Sản phẩm sẽ bị xóa khỏi danh sách.', danger: true, ok: 'Xóa' }).then(function (ok) {
          if (!ok) return;
          var idx = A.db.products.indexOf(p);
          A.db.products.splice(idx, 1); A.log('content', 'Xóa sản phẩm ' + p.name); A.save(); m.close(); after();
          U.toast('Đã xóa ' + p.name + '.', { undo: function () { A.db.products.splice(idx, 0, p); A.save(); after(); } });
        });
      }
    });
    U.qs('[data-save]', m.el).addEventListener('click', function () {
      var d = U.formData(U.qs('[data-form]', m.el));
      if (d.name.length < 2) { U.qs('#p-n', m.el).setAttribute('aria-invalid', 'true'); return U.qs('#p-n', m.el).focus(); }
      var out = { name: d.name, group: d.group, summary: d.summary, page: d.page, image: d.image, visible: d.visible,
        specs: v.specs.filter(function (s) { return s[0].trim() || s[1].trim(); }) };
      if (isNew) {
        out.id = U.fold(d.name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36).slice(-3);
        A.db.products.push(out); A.log('content', 'Thêm sản phẩm ' + out.name);
      } else { Object.assign(p, out); A.log('content', 'Sửa sản phẩm ' + out.name); }
      A.save(); m.close(); U.toast('Đã lưu sản phẩm.'); after();
    });
  }

  /* =====================================================================
     TRỢ LÝ & HỎI ĐÁP
     ===================================================================== */
  var NORM = {
    vi: {
      abbr: { k: 'khong', ko: 'khong', kh: 'khong', hok: 'khong', hong: 'khong', khg: 'khong', dc: 'duoc', dk: 'duoc', bn: 'bao nhieu', bnhieu: 'bao nhieu',
        sp: 'san pham', bh: 'bao hanh', sdt: 'so dien thoai', dt: 'dien thoai', nt: 'nhan tin', mooc: 'romooc', romoc: 'romooc', moc: 'romooc', ngta: 'nguoi ta',
        vs: 'voi', j: 'gi', z: 'gi', lm: 'lam', ntn: 'nhu the nao', tg: 'thoi gian', xl: 'xi lanh' },
      stop: ' a ah a oi oi em anh chi ban minh toi cho cua la co khong the nao gi duoc va voi thi nhu mot nhung cai nay do ra vay nhe ha a bao xe san hang lam can muon hoi cho e ad shop ben '
    },
    en: {
      abbr: { u: 'you', ur: 'your', pls: 'please', plz: 'please', w: 'with', tonne: 'tons', tonnes: 'tons', ton: 'tons', aluminum: 'aluminium', tires: 'tyres' },
      stop: ' a an the is are am be to of for in on at and or it its this that my your our me we you i do does can could would should will how what which there please about with from by as if any some floor floors truck trucks moving hallco live '
    }
  };
  function norm(s, L) {
    s = String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
    s = s.replace(/ro\s*-?\s*mooc/g, 'romooc').replace(/\bi\s*-?\s*(\d{4})\b/g, 'i$1').replace(/live\s*floor/g, 'livefloor');
    s = s.replace(/[^a-z0-9]+/g, ' ').trim();
    return s.split(' ').map(function (w) { return NORM[L].abbr[w] || w; }).join(' ');
  }
  function tokens(s, L) { return norm(s, L).split(' ').filter(function (w) { return w.length > 1 && NORM[L].stop.indexOf(' ' + w + ' ') < 0; }); }
  function testAsk(text, L) {
    var qn = norm(text, L), qt = tokens(text, L), padded = ' ' + qn + ' ';
    return (A.db.kb[L] || []).map(function (e) {
      var s = 0;
      if (qn === norm(e.q, L)) s = 100;
      else {
        (e.keywords || []).forEach(function (p) { p = norm(p, L); if (p && padded.indexOf(' ' + p + ' ') >= 0) s += 2.5 + p.split(' ').length * 1.5; });
        var et = tokens(e.q, L);
        qt.forEach(function (t) { if (et.indexOf(t) >= 0) s += 1.5; });
      }
      return { e: e, s: s };
    }).filter(function (r) { return r.s > 0; }).sort(function (a, b) { return b.s - a.s; });
  }

  V.chatbot = function (root, r) {
    var st = { tab: r.query.tab || 'vi', q: '' };
    if (!A.db.kb || (!A.db.kb.vi.length && !A.db.kb.en.length)) {
      root.innerHTML = head('Trợ lý & Hỏi đáp') + '<div class="callout">Không đọc được kho câu trả lời từ <span class="mono">/js/chatbot-kb.js</span>. Hãy mở admin qua máy chủ web (không mở trực tiếp file).</div>';
      return;
    }
    var TABS = [['vi', 'Câu trả lời (VI)', A.db.kb.vi.length], ['en', 'Câu trả lời (EN)', A.db.kb.en.length],
      ['fallback', 'Chưa trả lời được', A.db.fallbacks.filter(function (f) { return !f.done; }).length], ['test', 'Thử trợ lý', null]];
    root.innerHTML = head('Trợ lý & Hỏi đáp', 'Kho câu trả lời của Trợ lý Như Tín, đọc từ website. Trợ lý không dùng AI: nó so câu khách gõ với từ khóa và câu hỏi mẫu.',
      '<button class="btn btn-primary" type="button" data-add>' + icon('plus') + 'Thêm câu trả lời</button>') +
      '<div class="callout callout-info">Mục mã <span class="mono">faq-*</span> lấy từ trang Hỏi đáp (sửa trong <span class="mono">_src/pages/hoi-dap.html</span>). Các mục khác ở <span class="mono">_src/chatbot/kb.json</span>. Bản giao diện chỉ lưu trên trình duyệt; dùng nút "Xuất kb.json" để lấy file.</div>' +
      '<section class="card"><div class="tabs" role="tablist">' + TABS.map(function (t) {
        return '<button class="tab" role="tab" type="button" aria-selected="' + (st.tab === t[0]) + '" data-tab="' + t[0] + '">' + t[1] + (t[2] != null ? '<span class="count">' + t[2] + '</span>' : '') + '</button>';
      }).join('') + '</div><div data-pane></div></section>';

    function paneKb(L) {
      var list = A.db.kb[L].filter(function (e) { return U.matches(st.q, [e.id, e.q, (e.keywords || []).join(' '), e.a.replace(/<[^>]+>/g, ' ')]); });
      U.qs('[data-pane]', root).innerHTML = '<div class="toolbar"><div class="search">' + icon('search') + '<label class="visually-hidden" for="kq">Tìm</label>' +
        '<input id="kq" class="input" type="search" placeholder="Tìm câu hỏi, từ khóa, nội dung…" value="' + esc(st.q) + '"></div><span class="grow"></span>' +
        '<button class="btn btn-sm" type="button" data-export-kb>' + icon('download') + 'Xuất kb.json</button></div>' +
        '<div class="table-wrap">' + (list.length ? '<table class="table"><thead><tr><th scope="col">Câu hỏi</th><th scope="col">Từ khóa</th><th scope="col">Trang chi tiết</th><th scope="col">Nút</th><th class="col-act"><span class="visually-hidden">Thao tác</span></th></tr></thead><tbody>' +
        list.map(function (e) {
          var kw = e.keywords || [];
          return '<tr><td><span class="cell-main">' + esc(e.q) + '</span><span class="cell-sub mono">' + esc(e.id) + '</span></td>' +
            '<td>' + kw.slice(0, 3).map(function (k) { return '<span class="chip">' + esc(k) + '</span>'; }).join(' ') + (kw.length > 3 ? ' <span class="small muted">+' + (kw.length - 3) + '</span>' : '') + (kw.length ? '' : '<span class="pill pill-warn">Chưa có từ khóa</span>') + '</td>' +
            '<td class="mono">' + esc(e.link || '—') + '</td><td>' + (e.actions === 'quote' ? 'Báo giá' : e.actions === 'contact' ? 'Liên hệ' : '—') + '</td>' +
            '<td class="col-act"><span class="row-actions"><button class="icon-btn" type="button" data-edit="' + esc(e.id) + '" aria-label="Sửa">' + icon('edit') + '</button>' +
            '<button class="icon-btn danger" type="button" data-del="' + esc(e.id) + '" aria-label="Xóa">' + icon('trash') + '</button></span></td></tr>';
        }).join('') + '</tbody></table>' : U.empty('Không có câu trả lời nào khớp.', 'chat')) + '</div>';
      var inp = U.qs('#kq', root);
      inp.addEventListener('input', function () { st.q = inp.value; var pos = inp.selectionStart; paneKb(L); var n = U.qs('#kq', root); n.focus(); n.setSelectionRange(pos, pos); });
    }
    function paneFallback() {
      var list = A.db.fallbacks.slice().sort(function (a, b) { return (a.done - b.done) || (b.count - a.count); });
      U.qs('[data-pane]', root).innerHTML = '<div class="toolbar"><span class="muted small">Câu khách hỏi mà trợ lý chưa có câu trả lời đủ khớp (đếm theo phiên). Tạo câu trả lời mới hoặc thêm từ khóa cho câu đã có.</span></div>' +
        '<div class="table-wrap">' + (list.length ? '<table class="table"><thead><tr><th scope="col">Câu khách hỏi</th><th class="num" scope="col">Số lượt</th><th scope="col">Gần nhất</th><th scope="col">Tình trạng</th><th class="col-act"><span class="visually-hidden">Thao tác</span></th></tr></thead><tbody>' +
        list.map(function (f) {
          return '<tr><td class="cell-main">“' + esc(f.q) + '”</td><td class="num">' + f.count + '</td><td class="nw">' + U.ago(f.lastAt) + '</td>' +
            '<td>' + (f.done ? '<span class="pill pill-ok">Đã xử lý</span>' : '<span class="pill pill-warn">Chưa xử lý</span>') + '</td>' +
            '<td class="col-act"><span class="row-actions">' + (f.done ? '' : '<button class="btn btn-sm" type="button" data-answer="' + f.id + '">Tạo câu trả lời</button>' +
              '<button class="btn btn-sm btn-ghost" type="button" data-done="' + f.id + '">Bỏ qua</button>') +
            '<button class="icon-btn danger" type="button" data-fdel="' + f.id + '" aria-label="Xóa">' + icon('trash') + '</button></span></td></tr>';
        }).join('') + '</tbody></table>' : U.empty('Chưa có câu hỏi nào.', 'chat')) + '</div>';
    }
    function paneTest() {
      U.qs('[data-pane]', root).innerHTML = '<div class="card-body"><form class="tester" data-test><label class="visually-hidden" for="tq">Câu hỏi thử</label>' +
        '<input id="tq" class="input" placeholder="Gõ như khách, ví dụ: lap san cho xe cu dc ko" autocomplete="off">' +
        '<select class="select" style="width:auto" data-tl aria-label="Ngôn ngữ"><option value="vi">VI</option><option value="en">EN</option></select>' +
        '<button class="btn btn-primary" type="submit">Hỏi</button></form><div class="test-result" data-res><p class="muted small">Trợ lý trả lời khi điểm khớp từ ' + A.db.settings.chatMinScore + ' trở lên.</p></div></div>';
      U.qs('[data-test]', root).addEventListener('submit', function (e) {
        e.preventDefault();
        var text = U.qs('#tq', root).value.trim(), L = U.qs('[data-tl]', root).value;
        if (!text) return;
        var res = testAsk(text, L), best = res[0], min = A.db.settings.chatMinScore;
        U.qs('[data-res]', root).innerHTML = (best && best.s >= min ?
          '<div class="section-label">TRỢ LÝ SẼ TRẢ LỜI</div><div class="answer-box"><b>' + esc(best.e.q) + '</b><div style="margin-top:6px">' + best.e.a + '</div></div>' :
          '<div class="callout">Không có câu nào đạt điểm ' + min + ': trợ lý sẽ mời khách gọi hotline. <button class="btn btn-sm" type="button" data-new-from="' + esc(text) + '">Tạo câu trả lời cho câu này</button></div>') +
          '<div class="section-label">CÁC CÂU KHỚP NHẤT</div>' + (res.length ? '<ul class="list">' + res.slice(0, 5).map(function (x) {
            return '<li><span class="score' + (x.s >= min ? ' score-hi' : '') + '">' + Math.round(x.s * 10) / 10 + '</span><span class="grow"><b>' + esc(x.e.q) + '</b><span class="mono">' + esc(x.e.id) + '</span></span>' +
              '<button class="btn btn-sm" type="button" data-edit="' + esc(x.e.id) + '" data-lang="' + L + '">Sửa</button></li>';
          }).join('') + '</ul>' : '<p class="muted small">Không câu nào có từ khớp.</p>');
      });
    }
    function draw() {
      U.qsa('[data-tab]', root).forEach(function (t) { t.setAttribute('aria-selected', String(t.getAttribute('data-tab') === st.tab)); });
      if (st.tab === 'vi' || st.tab === 'en') paneKb(st.tab);
      else if (st.tab === 'fallback') paneFallback();
      else paneTest();
      A.setQuery({ tab: st.tab !== 'vi' ? st.tab : '' });
    }
    function langOf(btn) { return btn.getAttribute('data-lang') || (st.tab === 'en' ? 'en' : 'vi'); }
    root.addEventListener('click', function (e) {
      var b;
      if ((b = e.target.closest('[data-tab]'))) { st.tab = b.getAttribute('data-tab'); st.q = ''; return draw(); }
      if (e.target.closest('[data-add]')) return kbForm(st.tab === 'en' ? 'en' : 'vi', null, {}, draw);
      if ((b = e.target.closest('[data-edit]'))) { var L = langOf(b); return kbForm(L, A.db.kb[L].find(function (x) { return x.id === b.getAttribute('data-edit'); }), {}, draw); }
      if ((b = e.target.closest('[data-del]'))) {
        var L2 = langOf(b), entry = A.db.kb[L2].find(function (x) { return x.id === b.getAttribute('data-del'); });
        return U.confirm({ title: 'Xóa câu trả lời?', text: '“' + entry.q + '” sẽ bị xóa khỏi kho ' + L2.toUpperCase() + '.', danger: true, ok: 'Xóa' }).then(function (ok) {
          if (!ok) return;
          var idx = A.db.kb[L2].indexOf(entry);
          A.db.kb[L2].splice(idx, 1); A.log('content', 'Xóa câu trả lời chatbot "' + entry.q + '"'); A.save(); draw();
          U.toast('Đã xóa câu trả lời.', { undo: function () { A.db.kb[L2].splice(idx, 0, entry); A.save(); draw(); } });
        });
      }
      if ((b = e.target.closest('[data-answer]'))) {
        var f = A.db.fallbacks.find(function (x) { return x.id === b.getAttribute('data-answer'); });
        return kbForm(/[a-z]{3,} (to|you|the)\b/i.test(f.q) ? 'en' : 'vi', null, { q: f.q, keywords: [U.fold(f.q).replace(/[^a-z0-9 ]+/g, ' ').trim()] }, function () {
          f.done = true; A.save(); draw();
        });
      }
      if ((b = e.target.closest('[data-done]'))) {
        A.db.fallbacks.find(function (x) { return x.id === b.getAttribute('data-done'); }).done = true; A.save(); draw(); U.toast('Đã đánh dấu đã xử lý.');
      }
      if ((b = e.target.closest('[data-fdel]'))) {
        A.db.fallbacks = A.db.fallbacks.filter(function (x) { return x.id !== b.getAttribute('data-fdel'); }); A.save(); draw(); U.toast('Đã xóa.');
      }
      if ((b = e.target.closest('[data-new-from]'))) {
        var text = b.getAttribute('data-new-from');
        return kbForm(U.qs('[data-tl]', root).value, null, { q: text, keywords: [U.fold(text).replace(/[^a-z0-9 ]+/g, ' ').trim()] }, draw);
      }
      if (e.target.closest('[data-export-kb]')) {
        var Lx = st.tab === 'en' ? 'en' : 'vi';
        var entries = A.db.kb[Lx].filter(function (x) { return !/^faq-/.test(x.id); });
        U.download('kb' + (Lx === 'en' ? '-en' : '') + '-entries.json', JSON.stringify({ entries: entries }, null, 2), 'application/json');
        U.toast('Đã xuất ' + entries.length + ' mục (không gồm câu từ trang Hỏi đáp).');
      }
    });
    draw();
    if (r.query.answer) { var fb = U.qs('[data-answer="' + r.query.answer + '"]', root); if (fb) fb.click(); }
  };

  function kbForm(L, entry, preset, after) {
    var isNew = !entry;
    var v = entry ? JSON.parse(JSON.stringify(entry)) : Object.assign({ id: '', q: '', a: '', keywords: [], link: '', actions: '', related: [] }, preset);
    var isFaq = /^faq-/.test(v.id);
    var pages = A.db.pages.filter(function (x) { return x.lang === L.toUpperCase(); }).map(function (x) { return x.path.replace(/^en\//, '').replace(/\.html$/, ''); });
    var m = U.modal({ size: 'lg', title: (isNew ? 'Thêm câu trả lời' : 'Sửa câu trả lời') + ' (' + L.toUpperCase() + ')',
      body: (isFaq ? '<div class="callout">Câu này lấy từ trang Hỏi đáp. Sửa nội dung ở đây chỉ để thử; muốn đổi trên website, sửa trong <span class="mono">_src' + (L === 'en' ? '/en' : '') + '/pages/hoi-dap.html</span>.</div>' : '') +
        '<form data-form novalidate><div class="form-grid">' +
        '<div class="field full"><label for="k-q">Câu hỏi mẫu *</label><input id="k-q" class="input" name="q" value="' + esc(v.q) + '"><div class="hint">Hiện trên nút gợi ý trong khung chat.</div></div>' +
        '<div class="field full"><label for="k-a">Câu trả lời *</label><textarea id="k-a" class="textarea" name="a" style="min-height:140px">' + esc(v.a) + '</textarea><div class="hint">Được dùng thẻ &lt;p&gt;, &lt;b&gt;, &lt;ul&gt;&lt;li&gt;, &lt;a href&gt;. Chỉ ghi đúng như nội dung website.</div></div>' +
        '<div class="field full"><span class="field-label" id="k-kw-l">Từ khóa (cách khách hay hỏi)</span><div class="tags" data-tags></div>' +
          '<div class="hint">Gõ rồi nhấn Enter. ' + (L === 'vi' ? 'Viết không dấu, chữ thường, ví dụ "bao nhieu tien".' : 'Lowercase, e.g. "how much".') + '</div></div>' +
        '<div class="field"><label for="k-l">Trang xem chi tiết</label><input id="k-l" class="input" name="link" value="' + esc(v.link || '') + '" list="k-pages"><datalist id="k-pages">' + pages.map(function (p) { return '<option value="' + esc(p) + '">'; }).join('') + '</datalist></div>' +
        '<div class="field"><label for="k-ac">Nút kèm theo</label><select id="k-ac" class="select" name="actions">' + options([['', 'Không'], ['quote', 'Nhận báo giá + Gọi'], ['contact', 'Gọi + Zalo + Báo giá']], v.actions || '') + '</select></div>' +
        '<div class="field full"><label for="k-r">Câu hỏi gợi ý tiếp (mỗi dòng một câu)</label><textarea id="k-r" class="textarea" name="related" style="min-height:70px">' + esc((v.related || []).join('\n')) + '</textarea></div>' +
        '</div></form>',
      foot: '<button class="btn" type="button" data-close>Hủy</button><button class="btn btn-primary" type="button" data-save>Lưu</button>' });
    var tags = U.qs('[data-tags]', m.el);
    function paintTags() {
      tags.innerHTML = v.keywords.map(function (k, i) { return '<span class="tag">' + esc(k) + '<button type="button" data-rm-tag="' + i + '" aria-label="Bỏ ' + esc(k) + '">' + icon('close') + '</button></span>'; }).join('') +
        '<input aria-labelledby="k-kw-l" data-tag-in placeholder="Thêm từ khóa…">';
    }
    paintTags();
    tags.addEventListener('click', function (e) {
      var b = e.target.closest('[data-rm-tag]');
      if (b) { v.keywords.splice(+b.getAttribute('data-rm-tag'), 1); paintTags(); U.qs('[data-tag-in]', tags).focus(); }
      else U.qs('[data-tag-in]', tags).focus();
    });
    tags.addEventListener('keydown', function (e) {
      var t = e.target;
      if (!t.matches('[data-tag-in]')) return;
      if ((e.key === 'Enter' || e.key === ',') && t.value.trim()) {
        e.preventDefault();
        var k = L === 'vi' ? U.fold(t.value).trim() : t.value.toLowerCase().trim();
        if (v.keywords.indexOf(k) < 0) v.keywords.push(k);
        paintTags(); U.qs('[data-tag-in]', tags).focus();
      } else if (e.key === 'Backspace' && !t.value && v.keywords.length) { v.keywords.pop(); paintTags(); U.qs('[data-tag-in]', tags).focus(); }
      else if (e.key === 'Enter') e.preventDefault();
    });
    U.qs('[data-save]', m.el).addEventListener('click', function () {
      var d = U.formData(U.qs('[data-form]', m.el));
      var pending = U.qs('[data-tag-in]', tags).value.trim();
      if (pending) v.keywords.push(L === 'vi' ? U.fold(pending) : pending.toLowerCase());
      if (d.q.length < 3) { U.qs('#k-q', m.el).setAttribute('aria-invalid', 'true'); return U.qs('#k-q', m.el).focus(); }
      if (d.a.length < 3) { U.qs('#k-a', m.el).setAttribute('aria-invalid', 'true'); return U.qs('#k-a', m.el).focus(); }
      var out = { q: d.q, a: d.a, keywords: v.keywords, link: d.link };
      if (d.actions) out.actions = d.actions;
      var rel = d.related.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      if (rel.length) out.related = rel;
      if (isNew) {
        out.id = U.fold(d.q).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'muc-moi';
        while (A.db.kb[L].some(function (x) { return x.id === out.id; })) out.id += '-2';
        A.db.kb[L].push(out); A.log('content', 'Thêm câu trả lời chatbot "' + out.q + '"');
      } else {
        delete entry.actions; delete entry.related;
        Object.assign(entry, out); A.log('content', 'Sửa câu trả lời chatbot "' + out.q + '"');
      }
      A.save(); m.close(); U.toast('Đã lưu câu trả lời.'); after && after();
    });
  }

  /* =====================================================================
     TRANG & SEO
     ===================================================================== */
  V.pages = function (root) {
    var st = { lang: '', q: '' };
    root.innerHTML = head('Trang & SEO', 'Tiêu đề và mô tả hiển thị trên Google cho từng trang. Đọc trực tiếp từ website.') +
      '<section class="card"><div class="toolbar"><div class="search">' + icon('search') + '<label class="visually-hidden" for="pq">Tìm</label><input id="pq" class="input" type="search" placeholder="Tên trang, đường dẫn…"></div>' +
      '<label class="visually-hidden" for="pl">Ngôn ngữ</label><select id="pl" class="select" data-lang>' + options([['VI', 'Tiếng Việt'], ['EN', 'Tiếng Anh']], '', 'Mọi ngôn ngữ') + '</select>' +
      '<span class="grow"></span><span class="small muted" data-status></span></div><div class="table-wrap" data-table></div></section>';

    function meter(len, lo, hi) {
      var ok = len >= lo && len <= hi;
      return '<span class="meter ' + (len ? (ok ? 'ok' : 'warn') : '') + '"><i></i>' + (len ? len + ' ký tự' + (ok ? '' : len < lo ? ' · hơi ngắn' : ' · hơi dài') : 'Chưa đọc') + '</span>';
    }
    function url(p) { return '/' + p.path.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, ''); }
    function draw() {
      var list = A.db.pages.filter(function (p) { return (!st.lang || p.lang === st.lang) && U.matches(st.q, [p.name, p.path, p.title]); });
      U.qs('[data-table]', root).innerHTML = '<table class="table"><thead><tr><th scope="col">Trang</th><th scope="col">Tiêu đề (Google)</th><th scope="col">Mô tả</th>' +
        '<th class="num" scope="col">Lượt xem 30 ngày</th><th scope="col">Cập nhật</th><th class="col-act"><span class="visually-hidden">Thao tác</span></th></tr></thead><tbody>' +
        list.map(function (p) {
          return '<tr><td><span class="cell-main">' + esc(p.name) + ' <span class="chip">' + p.lang + '</span></span><span class="cell-sub mono">' + esc(url(p)) + '</span></td>' +
            '<td style="max-width:320px"><span class="small">' + esc(p.title || '—') + '</span><br>' + meter(p.title.length, 30, 65) + '</td>' +
            '<td>' + meter(p.desc.length, 70, 160) + '</td><td class="num">' + p.views.toLocaleString('vi-VN') + '</td><td class="nw">' + U.fmtDate(p.updatedAt) + '</td>' +
            '<td class="col-act"><span class="row-actions"><a class="icon-btn" href="' + esc(url(p)) + '" target="_blank" rel="noopener" aria-label="Xem ' + esc(p.name) + '">' + icon('external') + '</a>' +
            '<button class="icon-btn" type="button" data-edit="' + esc(p.id) + '" aria-label="Sửa SEO ' + esc(p.name) + '">' + icon('edit') + '</button></span></td></tr>';
        }).join('') + '</tbody></table>';
    }
    // Lần đầu: đọc <title> và meta description thật của từng trang
    var need = A.db.pages.filter(function (p) { return !p.title; });
    if (need.length) {
      U.qs('[data-status]', root).textContent = 'Đang đọc ' + need.length + ' trang…';
      Promise.all(need.map(function (p) {
        return fetch('/' + p.path).then(function (r) { return r.ok ? r.text() : ''; }).then(function (html) {
          var doc = new DOMParser().parseFromString(html, 'text/html');
          p.title = (doc.title || '').trim();
          var md = doc.querySelector('meta[name="description"]');
          p.desc = md ? md.getAttribute('content').trim() : '';
        }).catch(function () {});
      })).then(function () { A.save(); U.qs('[data-status]', root).textContent = ''; draw(); });
    }
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-edit]');
      if (!b) return;
      var p = A.db.pages.find(function (x) { return x.id === b.getAttribute('data-edit'); });
      var m = U.modal({ size: 'lg', title: 'SEO · ' + p.name + ' (' + p.lang + ')',
        body: '<div class="field"><label for="s-t">Tiêu đề</label><input id="s-t" class="input" value="' + esc(p.title) + '"><div class="hint" data-ct></div></div>' +
          '<div class="field"><label for="s-d">Mô tả</label><textarea id="s-d" class="textarea" style="min-height:90px">' + esc(p.desc) + '</textarea><div class="hint" data-cd></div></div>' +
          '<div class="section-label">XEM TRƯỚC TRÊN GOOGLE</div><div class="answer-box" style="background:#fff"><div class="small" style="color:#202124">hallco.nhutin.com › ' + esc(p.path.replace(/(^|\/)index\.html$/, '').replace(/\.html$/, '')) + '</div>' +
          '<div data-pt style="color:#1a0dab;font-size:1.125rem;line-height:1.3;margin:2px 0"></div><div data-pd class="small" style="color:#4d5156"></div></div>' +
          '<div class="callout callout-info" style="margin-top:16px">Tiêu đề và mô tả nằm ở khối cấu hình đầu file <span class="mono">_src' + (p.lang === 'EN' ? '/en' : '') + '/pages/' + esc(p.path.replace(/^en\//, '')) + '</span>. Bản giao diện chỉ lưu trên trình duyệt.</div>',
        foot: '<button class="btn" type="button" data-close>Hủy</button><button class="btn btn-primary" type="button" data-save>Lưu</button>' });
      var t = U.qs('#s-t', m.el), d = U.qs('#s-d', m.el);
      function live() {
        U.qs('[data-ct]', m.el).innerHTML = meter(t.value.length, 30, 65) + ' · nên 30–65 ký tự';
        U.qs('[data-cd]', m.el).innerHTML = meter(d.value.length, 70, 160) + ' · nên 70–160 ký tự';
        U.qs('[data-pt]', m.el).textContent = t.value.length > 65 ? t.value.slice(0, 62) + '…' : t.value;
        U.qs('[data-pd]', m.el).textContent = d.value.length > 160 ? d.value.slice(0, 157) + '…' : d.value;
      }
      t.addEventListener('input', live); d.addEventListener('input', live); live();
      U.qs('[data-save]', m.el).addEventListener('click', function () {
        p.title = t.value.trim(); p.desc = d.value.trim(); p.updatedAt = new Date().toISOString();
        A.log('content', 'Sửa SEO trang ' + p.name + ' (' + p.lang + ')'); A.save(); m.close(); draw(); U.toast('Đã lưu SEO cho ' + p.name + '.');
      });
    });
    U.qs('#pq', root).addEventListener('input', function (e) { st.q = e.target.value; draw(); });
    U.qs('[data-lang]', root).addEventListener('change', function (e) { st.lang = e.target.value; draw(); });
    draw();
  };

  /* =====================================================================
     THƯ VIỆN ẢNH
     ===================================================================== */
  V.media = function (root) {
    var st = { q: '', kind: '' };
    root.innerHTML = head('Thư viện ảnh', 'Ảnh và tài liệu dùng trên website (<span class="mono">assets/</span>). Ảnh nên ở định dạng WebP, rộng tối đa 1600px.',
      '<label class="btn btn-primary" for="up">' + icon('upload') + 'Tải lên</label><input id="up" type="file" accept="image/*,.pdf" multiple hidden>') +
      '<section class="card"><div class="toolbar"><div class="search">' + icon('search') + '<label class="visually-hidden" for="mq">Tìm</label><input id="mq" class="input" type="search" placeholder="Tên file…"></div>' +
      '<label class="visually-hidden" for="mk">Loại</label><select id="mk" class="select" data-kind>' + options([['img', 'Ảnh'], ['doc', 'Tài liệu']], '', 'Mọi loại') + '</select>' +
      '<span class="grow"></span><span class="small muted" data-count></span></div>' +
      '<div class="drop" data-drop>Kéo thả ảnh vào đây để tải lên (bản giao diện: tối đa 1,5 MB mỗi file, lưu trên trình duyệt)</div>' +
      '<div class="media-grid" data-grid></div></section>';

    function isImg(x) { return /\.(webp|jpe?g|png|gif|svg|avif)$/i.test(x.name) || /^data:image/.test(x.src); }
    function draw() {
      var list = A.db.media.filter(function (x) { return (!st.kind || (st.kind === 'img' ? isImg(x) : !isImg(x))) && U.matches(st.q, [x.name, x.alt]); })
        .sort(function (a, b) { return b.uploadedAt.localeCompare(a.uploadedAt); });
      U.qs('[data-count]', root).textContent = list.length + ' file · ' + U.fmtSize(list.reduce(function (s, x) { return s + x.size; }, 0));
      U.qs('[data-grid]', root).innerHTML = list.length ? list.map(function (x) {
        return '<button class="media-item' + (x.isNew ? ' is-new' : '') + '" type="button" data-open="' + esc(x.id) + '"><span class="thumb">' +
          (isImg(x) ? '<img src="' + esc(x.src) + '" alt="" loading="lazy">' : icon('file')) + '</span>' +
          '<span class="cap">' + esc(x.name) + '<span>' + U.fmtSize(x.size) + '</span></span></button>';
      }).join('') : '<div style="grid-column:1/-1">' + U.empty('Không có file nào.', 'image') + '</div>';
    }
    function addFiles(files) {
      var n = 0;
      Array.prototype.forEach.call(files, function (f) {
        if (f.size > 1.5 * 1048576) { U.toast(f.name + ' lớn hơn 1,5 MB, chưa tải lên được trong bản giao diện.', { error: true }); return; }
        var rd = new FileReader();
        rd.onload = function () {
          A.db.media.unshift({ id: 'up-' + Date.now() + '-' + f.name, name: f.name, src: rd.result, folder: /pdf$/i.test(f.name) ? 'assets/docs' : 'assets/img',
            size: f.size, alt: '', uploadedAt: new Date().toISOString(), isNew: true });
          A.log('content', 'Tải lên ' + f.name);
          n++; A.save(); draw(); U.toast('Đã tải lên ' + f.name + '.');
        };
        rd.readAsDataURL(f);
      });
    }
    U.qs('#up', root).addEventListener('change', function (e) { addFiles(e.target.files); e.target.value = ''; });
    var drop = U.qs('[data-drop]', root);
    ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('is-over'); }); });
    drop.addEventListener('drop', function (e) { addFiles(e.dataTransfer.files); });
    U.qs('#mq', root).addEventListener('input', function (e) { st.q = e.target.value; draw(); });
    U.qs('[data-kind]', root).addEventListener('change', function (e) { st.kind = e.target.value; draw(); });
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-open]');
      if (!b) return;
      var x = A.db.media.find(function (y) { return y.id === b.getAttribute('data-open'); });
      var path = /^data:/.test(x.src) ? x.folder + '/' + x.name + ' (chưa lên máy chủ)' : x.src;
      var m = U.modal({ size: 'lg', title: x.name,
        body: (isImg(x) ? '<img class="preview-img" src="' + esc(x.src) + '" alt="">' : '') +
          '<dl class="dl"><dt>Đường dẫn</dt><dd class="mono">' + esc(path) + '</dd><dt>Dung lượng</dt><dd>' + U.fmtSize(x.size) + '</dd><dt>Ngày tải lên</dt><dd>' + U.fmtDate(x.uploadedAt) + '</dd></dl>' +
          (isImg(x) ? '<div class="field"><label for="m-alt">Chữ thay thế (alt)</label><input id="m-alt" class="input" value="' + esc(x.alt) + '" placeholder="Mô tả ngắn nội dung ảnh, tiếng Việt"><div class="hint">Giúp người khiếm thị và Google hiểu ảnh.</div></div>' : ''),
        foot: '<button class="btn btn-danger left" type="button" data-del>' + icon('trash') + 'Xóa</button>' +
          '<button class="btn" type="button" data-copy>' + icon('copy') + 'Chép đường dẫn</button>' +
          (/^data:/.test(x.src) ? '' : '<a class="btn" href="' + esc(x.src) + '" target="_blank" rel="noopener">' + icon('external') + 'Mở</a>') +
          '<button class="btn btn-primary" type="button" data-save>Lưu</button>' });
      U.qs('[data-copy]', m.el).addEventListener('click', function () {
        var text = /^data:/.test(x.src) ? x.folder + '/' + x.name : x.src.replace(/^\//, '');
        (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () { U.toast('Đã chép: ' + text); }, function () { U.toast(text); });
      });
      U.qs('[data-save]', m.el).addEventListener('click', function () {
        var alt = U.qs('#m-alt', m.el); if (alt) x.alt = alt.value.trim();
        A.save(); m.close(); U.toast('Đã lưu.');
      });
      U.qs('[data-del]', m.el).addEventListener('click', function () {
        var used = A.db.products.filter(function (p) { return p.image === x.name; });
        U.confirm({ title: 'Xóa ' + x.name + '?', danger: true, ok: 'Xóa',
          text: used.length ? 'Ảnh đang dùng cho sản phẩm: ' + used.map(function (p) { return p.name; }).join(', ') + '. Trang đó sẽ mất ảnh.' : 'File sẽ bị xóa khỏi thư viện.' }).then(function (ok) {
          if (!ok) return;
          var idx = A.db.media.indexOf(x);
          A.db.media.splice(idx, 1); A.log('content', 'Xóa file ' + x.name); A.save(); m.close(); draw();
          U.toast('Đã xóa ' + x.name + '.', { undo: function () { A.db.media.splice(idx, 0, x); A.save(); draw(); } });
        });
      });
    });
    draw();
  };

  /* =====================================================================
     NGƯỜI DÙNG
     ===================================================================== */
  var ROLE_DESC = {
    admin: 'Toàn quyền, kể cả quản lý người dùng và cài đặt.',
    sales: 'Yêu cầu báo giá, khách hàng, bảo hành.',
    tech: 'Bảo hành, khách hàng; xem yêu cầu được giao.',
    editor: 'Sản phẩm, trợ lý, trang & SEO, thư viện ảnh.'
  };
  V.users = function (root) {
    root.innerHTML = head('Người dùng', 'Tài khoản đăng nhập trang quản trị.',
      '<button class="btn btn-primary" type="button" data-add>' + icon('user_plus') + 'Thêm người dùng</button>') +
      '<section class="card"><div class="table-wrap" data-table></div></section>' +
      '<section class="card card-pad" style="margin-top:20px"><h2 style="font-family:var(--f-display);font-size:1.375rem;margin-bottom:10px">Vai trò</h2><dl class="dl" style="margin:0">' +
      Object.keys(A.ROLES).map(function (k) { return '<dt>' + A.ROLES[k] + '</dt><dd style="font-weight:400">' + ROLE_DESC[k] + '</dd>'; }).join('') + '</dl></section>';
    function draw() {
      U.qs('[data-table]', root).innerHTML = '<table class="table"><thead><tr><th scope="col">Người dùng</th><th scope="col">Vai trò</th><th scope="col">Trạng thái</th><th scope="col">Đăng nhập gần nhất</th><th class="col-act"><span class="visually-hidden">Thao tác</span></th></tr></thead><tbody>' +
        A.db.users.map(function (u) {
          var self = u.email === A.me.email;
          return '<tr><td><span style="display:flex;align-items:center;gap:10px"><span class="avatar avatar-sm">' + esc(U.initials(u.name)) + '</span><span><span class="cell-main">' + esc(u.name) + (self ? ' <span class="chip">Bạn</span>' : '') + '</span><span class="cell-sub">' + esc(u.email) + '</span></span></span></td>' +
            '<td>' + A.ROLES[u.role] + '</td><td>' + (u.active ? '<span class="pill pill-ok">Đang hoạt động</span>' : '<span class="pill pill-off">Đã khóa</span>') + '</td>' +
            '<td class="nw">' + (u.lastLogin ? U.ago(u.lastLogin) : 'Chưa đăng nhập') + '</td>' +
            '<td class="col-act"><span class="row-actions"><button class="icon-btn" type="button" data-reset="' + u.id + '" aria-label="Gửi lại mật khẩu cho ' + esc(u.name) + '" title="Đặt lại mật khẩu">' + icon('key') + '</button>' +
            '<button class="icon-btn" type="button" data-edit="' + u.id + '" aria-label="Sửa ' + esc(u.name) + '">' + icon('edit') + '</button>' +
            (self ? '' : '<button class="icon-btn danger" type="button" data-del="' + u.id + '" aria-label="Xóa ' + esc(u.name) + '">' + icon('trash') + '</button>') + '</span></td></tr>';
        }).join('') + '</tbody></table>';
    }
    function form(u) {
      var isNew = !u, v = u || { name: '', email: '', role: 'sales', active: true };
      var self = u && u.email === A.me.email;
      var m = U.modal({ title: isNew ? 'Thêm người dùng' : 'Sửa ' + v.name,
        body: '<form data-form novalidate><div class="field"><label for="u-n">Họ tên *</label><input id="u-n" class="input" name="name" value="' + esc(v.name) + '"></div>' +
          '<div class="field"><label for="u-e">Email đăng nhập *</label><input id="u-e" class="input" type="email" name="email" value="' + esc(v.email) + '"><div class="err" data-err hidden></div></div>' +
          '<div class="field"><label for="u-r">Vai trò</label><select id="u-r" class="select" name="role"' + (self ? ' disabled' : '') + '>' + options(Object.keys(A.ROLES).map(function (k) { return [k, A.ROLES[k]]; }), v.role) + '</select>' +
          '<div class="hint" data-rd>' + ROLE_DESC[v.role] + '</div></div>' +
          '<div class="field"><label class="switch"><input type="checkbox" name="active"' + (v.active ? ' checked' : '') + (self ? ' disabled' : '') + '><span class="track"></span>Cho phép đăng nhập</label></div>' +
          (isNew ? '<div class="callout callout-info">Khi nối máy chủ, người dùng mới sẽ nhận email đặt mật khẩu.</div>' : '') + '</form>',
        foot: '<button class="btn" type="button" data-close>Hủy</button><button class="btn btn-primary" type="button" data-save>Lưu</button>' });
      U.qs('#u-r', m.el).addEventListener('change', function (e) { U.qs('[data-rd]', m.el).textContent = ROLE_DESC[e.target.value]; });
      U.qs('[data-save]', m.el).addEventListener('click', function () {
        var d = U.formData(U.qs('[data-form]', m.el));
        if (self) { d.role = u.role; d.active = true; }
        var err = U.qs('[data-err]', m.el);
        if (d.name.length < 2) { U.qs('#u-n', m.el).setAttribute('aria-invalid', 'true'); return U.qs('#u-n', m.el).focus(); }
        var dup = A.db.users.some(function (x) { return x !== u && x.email.toLowerCase() === d.email.toLowerCase(); });
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email) || dup) {
          err.hidden = false; err.textContent = dup ? 'Email này đã có người dùng.' : 'Email chưa đúng.';
          U.qs('#u-e', m.el).setAttribute('aria-invalid', 'true'); return U.qs('#u-e', m.el).focus();
        }
        if (isNew) { A.db.users.push(Object.assign({ id: 'U' + Date.now().toString(36), lastLogin: '' }, d)); A.log('user', 'Thêm người dùng ' + d.email); }
        else { if (self) A.setMe({ name: d.name, email: d.email }); Object.assign(u, d); A.log('user', 'Sửa người dùng ' + d.email); }
        A.save(); m.close(); draw(); U.toast('Đã lưu người dùng.');
      });
    }
    root.addEventListener('click', function (e) {
      var b;
      if (e.target.closest('[data-add]')) return form(null);
      if ((b = e.target.closest('[data-edit]'))) return form(A.db.users.find(function (u) { return u.id === b.getAttribute('data-edit'); }));
      if ((b = e.target.closest('[data-reset]'))) {
        var ur = A.db.users.find(function (u) { return u.id === b.getAttribute('data-reset'); });
        return U.confirm({ title: 'Đặt lại mật khẩu?', text: 'Gửi email đặt lại mật khẩu tới ' + ur.email + '.', ok: 'Gửi email' }).then(function (ok) {
          if (ok) { A.log('user', 'Gửi email đặt lại mật khẩu cho ' + ur.email); A.save(); U.toast('Đã gửi (mô phỏng) email tới ' + ur.email + '.'); }
        });
      }
      if ((b = e.target.closest('[data-del]'))) {
        var u = A.db.users.find(function (x) { return x.id === b.getAttribute('data-del'); });
        U.confirm({ title: 'Xóa ' + u.name + '?', text: 'Tài khoản ' + u.email + ' sẽ không đăng nhập được nữa.', danger: true, ok: 'Xóa' }).then(function (ok) {
          if (!ok) return;
          var idx = A.db.users.indexOf(u);
          A.db.users.splice(idx, 1); A.log('user', 'Xóa người dùng ' + u.email); A.save(); draw();
          U.toast('Đã xóa ' + u.name + '.', { undo: function () { A.db.users.splice(idx, 0, u); A.save(); draw(); } });
        });
      }
    });
    draw();
  };

  /* =====================================================================
     NHẬT KÝ HOẠT ĐỘNG
     ===================================================================== */
  V.activity = function (root) {
    var TYPES = [['lead', 'Yêu cầu báo giá'], ['customer', 'Khách hàng'], ['warranty', 'Bảo hành'], ['content', 'Nội dung'], ['user', 'Người dùng'], ['system', 'Hệ thống']];
    var st = { type: '', who: '', q: '', limit: 60 };
    var people = []; A.db.activity.forEach(function (a) { if (people.indexOf(a.by) < 0) people.push(a.by); });
    root.innerHTML = head('Nhật ký hoạt động', 'Ai đã làm gì, khi nào.', '<button class="btn" type="button" data-export>' + icon('download') + 'Xuất CSV</button>') +
      '<section class="card"><div class="toolbar"><div class="search">' + icon('search') + '<label class="visually-hidden" for="aq">Tìm</label><input id="aq" class="input" type="search" placeholder="Tìm nội dung…"></div>' +
      '<label class="visually-hidden" for="at">Loại</label><select id="at" class="select" data-f="type">' + options(TYPES, '', 'Mọi loại') + '</select>' +
      '<label class="visually-hidden" for="aw">Người</label><select id="aw" class="select" data-f="who">' + options(people, '', 'Mọi người') + '</select></div><div class="card-body" data-list></div></section>';
    function list() { return A.db.activity.filter(function (a) { return (!st.type || a.type === st.type) && (!st.who || a.by === st.who) && U.matches(st.q, [a.text]); }); }
    function draw() {
      var all = list(), rows = all.slice(0, st.limit), html = '', day = '';
      rows.forEach(function (a) {
        var d = U.fmtDate(a.at);
        if (d !== day) { html += (day ? '</ul>' : '') + '<div class="section-label">' + (d === U.fmtDate(new Date().toISOString()) ? 'HÔM NAY' : d) + '</div><ul class="list">'; day = d; }
        html += '<li><span class="avatar avatar-sm">' + esc(U.initials(a.by)) + '</span><span class="grow"><b style="font-weight:500;white-space:normal">' + esc(a.text) + '</b><span>' + esc(a.by) + ' · ' + new Date(a.at).toTimeString().slice(0, 5) + '</span></span></li>';
      });
      U.qs('[data-list]', root).innerHTML = rows.length ? html + '</ul>' + (all.length > st.limit ? '<button class="btn" type="button" data-more style="margin-top:12px">Xem thêm (' + (all.length - st.limit) + ')</button>' : '') : U.empty('Không có hoạt động nào.', 'list');
    }
    root.addEventListener('change', function (e) { if (e.target.matches('[data-f]')) { st[e.target.getAttribute('data-f')] = e.target.value; st.limit = 60; draw(); } });
    root.addEventListener('click', function (e) { if (e.target.closest('[data-more]')) { st.limit += 60; draw(); } });
    U.qs('#aq', root).addEventListener('input', function (e) { st.q = e.target.value; draw(); });
    U.qs('[data-export]', root).addEventListener('click', function () {
      var l = list();
      U.downloadCsv('nhat-ky-' + new Date().toISOString().slice(0, 10) + '.csv', ['Thời gian', 'Người', 'Loại', 'Nội dung'], l.map(function (a) { return [U.fmtDateTime(a.at), a.by, a.type, a.text]; }));
    });
    draw();
  };

  /* =====================================================================
     CÀI ĐẶT
     ===================================================================== */
  V.settings = function (root, r) {
    var TABS = [['general', 'Thông tin chung'], ['form', 'Form báo giá'], ['chat', 'Trợ lý'], ['tracking', 'Theo dõi (GA4)'], ['account', 'Tài khoản của tôi'], ['data', 'Dữ liệu']];
    var tab = r.query.tab || 'general';
    var s = A.db.settings;
    root.innerHTML = head('Cài đặt', 'Thông tin website, form báo giá, trợ lý và tài khoản.') +
      '<div class="settings"><nav class="card settings-nav" role="tablist" aria-label="Mục cài đặt">' + TABS.map(function (t) {
        return '<button type="button" role="tab" data-tab="' + t[0] + '" aria-selected="' + (t[0] === tab) + '">' + t[1] + '</button>';
      }).join('') + '</nav><section class="card" data-pane></section></div>';

    function field(id, label, value, hint, attrs) {
      return '<div class="field"><label for="s-' + id + '">' + label + '</label><input id="s-' + id + '" class="input" name="' + id + '" value="' + esc(value) + '"' + (attrs || '') + '>' + (hint ? '<div class="hint">' + hint + '</div>' : '') + '</div>';
    }
    function sw(id, label, on, hint) {
      return '<div class="field"><label class="switch"><input type="checkbox" name="' + id + '"' + (on ? ' checked' : '') + '><span class="track"></span>' + label + '</label>' + (hint ? '<div class="hint">' + hint + '</div>' : '') + '</div>';
    }
    function pane(title, body, noSave) {
      return '<div class="card-head"><h2>' + title + '</h2></div><form class="card-body" data-form novalidate>' + body +
        (noSave ? '' : '<div style="margin-top:8px"><button class="btn btn-primary" type="submit">Lưu thay đổi</button></div>') + '</form>';
    }
    var panes = {
      general: function () {
        return pane('Thông tin chung', '<div class="form-grid">' +
          '<div class="full">' + field('siteName', 'Tên website', s.siteName) + '</div>' +
          '<div class="full">' + field('domain', 'Tên miền', s.domain, 'Đang là tên miền giả định. Đổi cả biến SITE trong tools/build.py và robots.txt.') + '</div>' +
          field('company', 'Tên công ty', s.company) + field('taxId', 'Mã số thuế', s.taxId) +
          '<div class="full">' + field('address', 'Địa chỉ văn phòng', s.address) + '</div>' +
          field('hotline', 'Hotline hiển thị', s.hotline, 'Dạng 0907 917 301') + field('zalo', 'Số Zalo', s.zalo, 'Chỉ chữ số, dùng cho zalo.me/…') + '</div>');
      },
      form: function () {
        return pane('Form báo giá', '<div class="field"><span class="field-label">Cách gửi yêu cầu</span><div class="radio-cards">' +
          [['demo', 'Bản demo', 'Kiểm tra dữ liệu nhưng không gửi đi đâu, báo khách gọi hotline. Đang dùng trên Render Static Site.'],
           ['php', 'Gửi email (PHP + SMTP)', 'Cần máy chủ có PHP: Render Docker hoặc hosting cPanel. Điền SMTP trong biến môi trường.'],
           ['gsheet', 'Ghi vào Google Sheet', 'Không cần PHP. Dán URL Web App của Apps Script bên dưới.']].map(function (o) {
            return '<label class="radio-card"><input type="radio" name="formMode" value="' + o[0] + '"' + (s.formMode === o[0] ? ' checked' : '') + '><span><b>' + o[1] + '</b><span>' + o[2] + '</span></span></label>';
          }).join('') + '</div></div>' +
          field('phpEndpoint', 'Địa chỉ PHP', s.phpEndpoint) +
          field('gsheetEndpoint', 'URL Web App Google Sheet', s.gsheetEndpoint, '', ' placeholder="https://script.google.com/macros/s/…/exec"') +
          field('mailTo', 'Email nhận yêu cầu', s.mailTo, 'Nhiều email cách nhau bằng dấu phẩy.', ' placeholder="kinhdoanh@nhutin.com"') +
          '<div class="form-grid">' + field('rateLimit', 'Giới hạn gửi (lần / 10 phút / IP)', s.rateLimit, '', ' type="number" min="1"') +
          field('minSeconds', 'Chặn gửi nếu nhanh hơn (giây)', s.minSeconds, 'Chống máy tự điền form.', ' type="number" min="0"') + '</div>' +
          '<div class="callout callout-info">Trên website, chế độ form nằm ở biến <span class="mono">FORM_CONFIG</span> đầu <span class="mono">js/main.js</span>.</div>');
      },
      chat: function () {
        return pane('Trợ lý Như Tín', sw('chatEnabled', 'Hiện nút trợ lý trên website', s.chatEnabled) +
          sw('chatTeaser', 'Hiện lời mời "Hỏi nhanh về sàn tự đổ?" sau 6 giây', s.chatTeaser) +
          field('chatMinScore', 'Điểm khớp tối thiểu để trả lời', s.chatMinScore, 'Thấp hơn: trả lời nhiều câu hơn nhưng dễ sai. Mặc định 4.', ' type="number" min="1" max="20" step="0.5"') +
          '<p class="small"><a href="#/chatbot?tab=test">Thử trợ lý với điểm này</a></p>');
      },
      tracking: function () {
        return pane('Google Analytics 4', field('ga4', 'Mã đo lường GA4', s.ga4, 'Dạng G-ABC123XYZ. Thay G-XXXXXXX trong _src/layout.html và _src/en/layout.html rồi build lại.', ' placeholder="G-XXXXXXX"') +
          '<div class="section-label">SỰ KIỆN ĐÃ GỬI SẴN</div><ul class="list">' +
          [['click_call', 'Bấm liên kết gọi điện'], ['click_zalo', 'Bấm liên kết Zalo'], ['generate_lead', 'Gửi form báo giá thành công'], ['chat_open', 'Mở khung trợ lý'], ['chat_question', 'Khách hỏi trợ lý'], ['chat_quote', 'Bấm "Nhận báo giá" trong khung chat']]
            .map(function (e) { return '<li><span class="mono" style="min-width:130px">' + e[0] + '</span><span class="grow">' + e[1] + '</span></li>'; }).join('') + '</ul>');
      },
      account: function () {
        return pane('Tài khoản của tôi', '<div class="form-grid">' + field('myName', 'Họ tên', A.me.name) + field('myEmail', 'Email', A.me.email, '', ' type="email" readonly') + '</div>' +
          '<div class="section-label">ĐỔI MẬT KHẨU</div><div class="form-grid">' +
          '<div class="full">' + field('pwOld', 'Mật khẩu hiện tại', '', '', ' type="password" autocomplete="current-password"') + '</div>' +
          field('pwNew', 'Mật khẩu mới', '', 'Ít nhất 8 ký tự, có cả chữ và số.', ' type="password" autocomplete="new-password"') +
          field('pwNew2', 'Nhập lại mật khẩu mới', '', '', ' type="password" autocomplete="new-password"') + '</div>');
      },
      data: function () {
        return pane('Dữ liệu', '<p class="muted">Bản giao diện lưu dữ liệu trong trình duyệt này (localStorage). Mở trên máy khác sẽ thấy dữ liệu mẫu ban đầu.</p>' +
          '<div class="quick"><button class="btn" type="button" data-backup>' + icon('download') + 'Xuất bản sao (JSON)</button>' +
          '<label class="btn" for="restore">' + icon('upload') + 'Nhập bản sao</label><input id="restore" type="file" accept="application/json" hidden></div>' +
          '<div class="section-label">KHÔI PHỤC</div><p class="small muted">Xóa mọi thay đổi và sinh lại dữ liệu mẫu (yêu cầu, khách hàng, bảo hành…). Kho trợ lý đọc lại từ website.</p>' +
          '<button class="btn btn-danger" type="button" data-reset>' + icon('refresh') + 'Khôi phục dữ liệu mẫu</button>', true);
      }
    };

    function draw() {
      U.qsa('[data-tab]', root).forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-tab') === tab)); });
      var p = U.qs('[data-pane]', root);
      p.innerHTML = panes[tab]();
      A.setQuery({ tab: tab !== 'general' ? tab : '' });
      var form = U.qs('[data-form]', p);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var d = U.formData(form);
        if (tab === 'account') {
          if (d.myName.length < 2) return U.toast('Nhập họ tên.', { error: true });
          if (d.pwOld || d.pwNew || d.pwNew2) {
            if (!d.pwOld) return U.toast('Nhập mật khẩu hiện tại.', { error: true });
            if (d.pwNew.length < 8 || !/[a-z]/i.test(d.pwNew) || !/\d/.test(d.pwNew)) return U.toast('Mật khẩu mới cần ít nhất 8 ký tự, có chữ và số.', { error: true });
            if (d.pwNew !== d.pwNew2) return U.toast('Hai lần nhập mật khẩu mới chưa khớp.', { error: true });
          }
          var u = A.db.users.find(function (x) { return x.email === A.me.email; });
          if (u) u.name = d.myName;
          A.setMe({ name: d.myName });
          A.log('user', d.pwNew ? 'Đổi mật khẩu' : 'Cập nhật thông tin tài khoản');
          A.save(); draw(); return U.toast(d.pwNew ? 'Đã đổi mật khẩu (mô phỏng).' : 'Đã lưu.');
        }
        if (tab === 'tracking' && d.ga4 && !/^G-[A-Z0-9]{6,12}$/.test(d.ga4)) return U.toast('Mã GA4 có dạng G-ABC123XYZ.', { error: true });
        if (tab === 'form') {
          if (d.formMode === 'gsheet' && !/^https:\/\/script\.google\.com\//.test(d.gsheetEndpoint)) return U.toast('Chế độ Google Sheet cần URL Web App bắt đầu bằng https://script.google.com/', { error: true });
          if (d.mailTo && d.mailTo.split(',').some(function (m) { return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.trim()); })) return U.toast('Có email nhận chưa đúng.', { error: true });
          d.rateLimit = +d.rateLimit || 3; d.minSeconds = +d.minSeconds || 0;
        }
        if (tab === 'chat') d.chatMinScore = Math.max(1, +d.chatMinScore || 4);
        Object.assign(s, d);
        A.log('system', 'Cập nhật cài đặt: ' + TABS.find(function (t) { return t[0] === tab; })[1]);
        A.save(); U.toast('Đã lưu cài đặt.');
      });
      if (tab === 'data') {
        U.qs('[data-backup]', p).addEventListener('click', function () {
          U.download('hallco-admin-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(A.db, null, 2), 'application/json');
        });
        U.qs('#restore', p).addEventListener('change', function (e) {
          var f = e.target.files[0]; if (!f) return;
          var rd = new FileReader();
          rd.onload = function () {
            try {
              var d = JSON.parse(rd.result);
              if (d.version !== 1 || !Array.isArray(d.leads)) throw new Error();
              localStorage.setItem('hallco_admin_db', JSON.stringify(d));
              U.toast('Đã nhập bản sao, đang tải lại…'); setTimeout(function () { location.reload(); }, 600);
            } catch (err) { U.toast('File không phải bản sao của HALLCO Admin.', { error: true }); }
          };
          rd.readAsText(f);
        });
        U.qs('[data-reset]', p).addEventListener('click', function () {
          U.confirm({ title: 'Khôi phục dữ liệu mẫu?', text: 'Mọi thay đổi trên trình duyệt này sẽ mất.', danger: true, ok: 'Khôi phục' }).then(function (ok) {
            if (!ok) return;
            A.resetDb().then(function () { U.toast('Đã khôi phục dữ liệu mẫu.'); A.go('dashboard'); });
          });
        });
      }
    }
    root.addEventListener('click', function (e) { var b = e.target.closest('[data-tab]'); if (b) { tab = b.getAttribute('data-tab'); draw(); } });
    draw();
  };
})();
