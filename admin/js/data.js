/* Dữ liệu mẫu cho giao diện admin (chưa nối máy chủ).
   Sinh một lần khi mở admin lần đầu, lưu trong localStorage của trình duyệt.
   Cài đặt → Dữ liệu → "Khôi phục dữ liệu mẫu" để sinh lại. */
(function () {
  'use strict';

  // Ngẫu nhiên có hạt giống: mỗi lần khôi phục ra cùng một bộ dữ liệu
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  var NEEDS = [
    'Lắp hoặc cải tạo rơ-moóc, thùng xe',
    'Xe tải thùng',
    'Xe chở rác',
    'Bồn chứa, hầm chứa cố định',
    'Phụ tùng, bảo trì hệ thống đang dùng',
    'Khác (ghi rõ ở phần ghi chú)'
  ];
  var NEED_WEIGHT = [34, 22, 14, 9, 14, 7];

  var LAST = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
  var MID = ['Văn', 'Thị', 'Minh', 'Hữu', 'Đức', 'Quốc', 'Thanh', 'Ngọc', 'Hoàng', 'Công'];
  var FIRST = ['An', 'Bình', 'Cường', 'Dũng', 'Hải', 'Hùng', 'Khang', 'Long', 'Nam', 'Phong', 'Quân', 'Sơn', 'Tâm', 'Thành', 'Trung', 'Tuấn', 'Việt', 'Hạnh', 'Lan', 'Mai', 'Thảo', 'Trang'];
  var PROV = ['TP.HCM', 'Bình Dương', 'Đồng Nai', 'Long An', 'Bình Phước', 'Tây Ninh', 'Bà Rịa - Vũng Tàu', 'Đắk Lắk', 'Gia Lai', 'Cần Thơ', 'Bình Định', 'Quảng Nam'];
  var CO_KIND = ['Công ty TNHH Vận tải', 'Công ty CP Logistics', 'Công ty TNHH Năng lượng Sinh khối', 'Công ty CP Môi trường', 'HTX Vận tải', 'Công ty TNHH Lâm sản', 'Công ty CP Thức ăn Chăn nuôi'];
  var CO_NAME = ['Phú Thịnh', 'Tân Phát', 'Minh Long', 'Hưng Thịnh', 'Đại Việt', 'Sao Mai', 'Thuận An', 'Phước Lộc', 'Hòa Bình', 'Nam Tiến', 'Trường Sơn', 'Kim Ngân', 'An Khang', 'Việt Úc', 'Đông Á'];
  var CARGO = ['dăm gỗ', 'mùn cưa', 'vỏ hạt điều', 'trấu', 'rác sinh hoạt', 'phế liệu', 'thức ăn chăn nuôi', 'nông sản', 'than'];
  var NOTES = [
    'Có 3 rơ-moóc 45 feet đang chở {c}, muốn cải tạo lắp sàn tự đổ.',
    'Cần báo giá lắp mới cho 2 thùng xe chở {c}.',
    'Xe đang dùng bị kẹt hàng khi xả {c}, cần tư vấn.',
    'Hỏi giá bộ i-6000 cho xe chở {c} quãng đường dài.',
    'Muốn xem xe mẫu thực tế trước khi đặt.',
    'Cần thay thanh sàn bị mòn, xe đã chạy 6 năm.',
    'Nhà máy cần hầm cấp liệu cố định cho lò hơi đốt {c}.',
    'Hỏi thời gian lắp đặt và bảo hành.',
    ''
  ];
  var SOURCES = ['Form website', 'Form website', 'Form website', 'Chatbot', 'Gọi điện', 'Zalo'];
  var STAFF = ['Nguyễn Minh Tâm', 'Lê Thị Thảo', 'Phạm Quốc Việt'];

  function pick(r, arr) { return arr[Math.floor(r() * arr.length)]; }
  function pickW(r, arr, w) {
    var sum = w.reduce(function (a, b) { return a + b; }, 0), x = r() * sum;
    for (var i = 0; i < arr.length; i++) { x -= w[i]; if (x < 0) return arr[i]; }
    return arr[arr.length - 1];
  }
  function phone(r) {
    var pre = pick(r, ['090', '091', '093', '097', '098', '038', '035', '070', '079', '083', '086']);
    var n = String(Math.floor(r() * 10000000)).padStart(7, '0');
    return pre + ' ' + n.slice(0, 3) + ' ' + n.slice(3);
  }
  function person(r) { return pick(r, LAST) + ' ' + pick(r, MID) + ' ' + pick(r, FIRST); }
  function company(r) { return pick(r, CO_KIND) + ' ' + pick(r, CO_NAME); }
  var DAY = 86400000;
  function iso(t) { return new Date(t).toISOString(); }

  function seed() {
    var r = rng(20261030);
    var now = Date.now();

    /* ---- Khách hàng ---- */
    var customers = [];
    for (var i = 0; i < 18; i++) {
      var since = now - (60 + Math.floor(r() * 900)) * DAY;
      customers.push({
        id: 'KH' + String(i + 1).padStart(3, '0'),
        company: company(r),
        contact: person(r),
        phone: phone(r),
        email: '',
        province: pick(r, PROV),
        cargo: pick(r, CARGO),
        vehicles: 1 + Math.floor(r() * 12),
        note: '',
        createdAt: iso(since)
      });
    }

    /* ---- Bảo hành (bộ i-Series đã lắp) ---- */
    var warranties = [];
    for (var w = 0; w < 26; w++) {
      var cust = customers[Math.floor(r() * customers.length)];
      var installed = now - Math.floor(r() * 820) * DAY;
      var model = pickW(r, ['i-4000', 'i-6000', 'W Floor™ + BRUTE™'], [55, 35, 10]);
      warranties.push({
        id: 'BH' + String(w + 1).padStart(3, '0'),
        serial: (model === 'i-6000' ? 'I6' : model === 'i-4000' ? 'I4' : 'WF') + '-' + String(24000 + Math.floor(r() * 9000)),
        customerId: cust.id,
        model: model,
        vehicle: pick(r, ['Rơ-moóc 45 ft', 'Rơ-moóc 40 ft', 'Xe tải thùng 9,6 m', 'Xe chở rác']),
        plate: pick(r, ['51', '61', '60', '62', '93', '70', '72']) + 'C-' + String(10000 + Math.floor(r() * 89999)).slice(0, 3) + '.' + String(Math.floor(r() * 99)).padStart(2, '0'),
        installedAt: iso(installed),
        months: 24,
        registered: r() > 0.12,
        note: ''
      });
    }

    /* ---- Yêu cầu báo giá ---- */
    var leads = [];
    for (var k = 0; k < 74; k++) {
      // dày hơn ở những ngày gần đây
      var ago = Math.floor(Math.pow(r(), 1.6) * 90);
      var t = now - ago * DAY - Math.floor(r() * 10) * 3600000;
      var status = ago < 3 ? pickW(r, ['moi', 'tu-van'], [75, 25])
        : ago < 14 ? pickW(r, ['moi', 'tu-van', 'bao-gia', 'chot', 'huy'], [15, 35, 30, 10, 10])
        : pickW(r, ['tu-van', 'bao-gia', 'chot', 'huy'], [10, 25, 35, 30]);
      var needL = pickW(r, NEEDS, NEED_WEIGHT);
      var lang = r() > 0.9 ? 'EN' : 'VI';
      var notes = [];
      if (status !== 'moi') notes.push({ at: iso(t + 3 * 3600000), by: pick(r, STAFF), text: 'Đã gọi lại, khách hẹn gửi hình xe hiện tại.' });
      if (status === 'bao-gia' || status === 'chot') notes.push({ at: iso(t + 2 * DAY), by: pick(r, STAFF), text: 'Đã gửi báo giá qua Zalo.' });
      if (status === 'chot') notes.push({ at: iso(t + 6 * DAY), by: pick(r, STAFF), text: 'Khách đồng ý, hẹn lịch lắp đặt.' });
      if (status === 'huy') notes.push({ at: iso(t + 4 * DAY), by: pick(r, STAFF), text: 'Khách chưa có ngân sách năm nay.' });
      leads.push({
        id: 'YC' + String(1000 + k),
        createdAt: iso(t),
        name: person(r),
        company: r() > 0.35 ? company(r) : '',
        phone: lang === 'EN' ? '+44 20 7946 ' + String(1000 + Math.floor(r() * 8999)) : phone(r),
        need: needL,
        message: pick(r, NOTES).replace('{c}', pick(r, CARGO)),
        source: pick(r, SOURCES),
        lang: lang,
        page: pick(r, ['/', '/lien-he.html', '/san-pham-i-series.html', '/ung-dung.html', '/cach-hoat-dong.html', '/san-pham.html']),
        status: status,
        assignee: status === 'moi' ? '' : pick(r, STAFF),
        notes: notes
      });
    }
    leads.sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); });

    /* ---- Câu hỏi chatbot chưa trả lời được ---- */
    var fallbacks = [
      ['Có cho thuê xe lắp sàn không?', 14], ['Lắp cho xe ben được không', 11], ['có trả góp ko', 9],
      ['sàn chịu được nhiệt độ bao nhiêu', 7], ['có xe mẫu ở Đà Nẵng không', 6], ['giá thanh sàn nhựa', 5],
      ['bơm thủy lực hiệu gì', 4], ['xuất hóa đơn VAT được không', 4], ['Do you ship to Cambodia?', 3], ['bao lâu thì bảo dưỡng 1 lần', 3]
    ].map(function (x, i) { return { id: 'FB' + (i + 1), q: x[0], count: x[1], lastAt: iso(now - Math.floor(r() * 20) * DAY), done: false }; });

    /* ---- Sản phẩm ---- */
    var products = [
      { id: 'i-4000', name: 'Bộ dẫn động i-4000', group: 'i-Series', page: 'san-pham-i-series.html', image: 'i-4000.webp', visible: true,
        summary: 'Bộ dẫn động phổ biến cho rơ-moóc và thùng xe chở hàng rời.',
        specs: [['Dòng', 'i-Series'], ['Ứng dụng', 'Rơ-moóc, thùng xe hàng rời'], ['Bảo hành', 'Theo điều kiện bảo hành i-Series']] },
      { id: 'i-6000', name: 'Bộ dẫn động i-6000', group: 'i-Series', page: 'san-pham-i-series.html', image: 'bo-dan-dong-i6000-poster.webp', visible: true,
        summary: 'Bộ dẫn động lực đẩy lớn cho hàng nặng, nạp đầy.',
        specs: [['Dòng', 'i-Series'], ['Ứng dụng', 'Hàng nặng, quãng đường dài'], ['Bảo hành', 'Theo điều kiện bảo hành i-Series']] },
      { id: 'w-floor', name: 'W Floor™ và BRUTE™', group: 'W Floor', page: 'san-pham-w-floor.html', image: 'w-floor-xa-nuoc.webp', visible: true,
        summary: 'Sàn kín nước cho rác ướt, hàng có nước, đi cùng bộ dẫn động BRUTE™.',
        specs: [['Đặc điểm', 'Kín nước'], ['Bộ dẫn động', 'BRUTE™']] },
      { id: 'thanh-san', name: 'Thanh sàn nhôm và sàn nhựa', group: 'Thanh sàn', page: 'san-pham-thanh-san.html', image: 'thanh-san-triple-ridge-kin.webp', visible: true,
        summary: 'Các profile thanh sàn nhôm, sàn nhựa và ổ trượt; hướng dẫn đo khi thay.',
        specs: [['Vật liệu', 'Nhôm, nhựa'], ['Phụ kiện', 'Ổ trượt']] },
      { id: 'co-dinh', name: 'Hệ LIVE FLOOR® cố định', group: 'Hệ cố định', page: 'san-pham-he-thong-co-dinh.html', image: 'san-pham-he-thong-co-dinh.webp', visible: true,
        summary: 'Sàn cố định cho hầm chứa, kho cấp liệu lò hơi.',
        specs: [['Ứng dụng', 'Hầm chứa, kho cấp liệu'], ['Lắp đặt', 'Theo khảo sát hiện trạng']] }
    ];

    /* ---- Trang website ---- */
    var PAGES = [
      ['index.html', 'Trang chủ'], ['cach-hoat-dong.html', 'Cách hoạt động'], ['san-pham.html', 'Sản phẩm'],
      ['san-pham-i-series.html', 'i-Series'], ['san-pham-w-floor.html', 'W Floor™'], ['san-pham-thanh-san.html', 'Thanh sàn'],
      ['san-pham-he-thong-co-dinh.html', 'Hệ thống cố định'], ['ung-dung.html', 'Ứng dụng'], ['bao-hanh.html', 'Bảo hành'],
      ['hoi-dap.html', 'Hỏi đáp'], ['about.html', 'Về Như Tín'], ['lien-he.html', 'Liên hệ'], ['404.html', 'Trang lỗi 404']
    ];
    var pages = [];
    PAGES.forEach(function (p, i) {
      pages.push({ id: 'vi-' + p[0], lang: 'VI', path: p[0], name: p[1], title: '', desc: '', views: Math.floor(200 + r() * 3800 / (i + 1)), updatedAt: iso(now - Math.floor(r() * 30) * DAY), published: true });
      if (p[0] !== '404.html') pages.push({ id: 'en-' + p[0], lang: 'EN', path: 'en/' + p[0], name: p[1], title: '', desc: '', views: Math.floor(20 + r() * 400 / (i + 1)), updatedAt: iso(now - Math.floor(r() * 30) * DAY), published: true });
    });

    /* ---- Thư viện ảnh (file thật trong assets/img) ---- */
    var media = ('bat-quet-day-poster.webp bo-dan-dong-i6000-poster.webp brute-8500.webp cau-tao-thanh-san-o-truot.webp hallco-ban-do-toan-cau.webp ' +
      'hallco-logo-live-floor-320.webp hang-roi-dai-san.svg hang-roi-mo-phong.svg he-thong-co-dinh-container.webp hero-truck-poster.webp i-4000.webp ' +
      'mo-phong-xa-hang-poster.webp nhu-tin-bai-nguyen-lieu.webp nhu-tin-kho-ba-dieu.webp nhutin-logo-trim.webp nhutinlogo-440.webp og-image.jpg ' +
      'profile-nlr.webp profile-tufdeck.webp san-pham-he-thong-co-dinh.webp san-pham-i-series.webp san-pham-san-nhua.webp san-trong-thung-xe.webp ' +
      'thanh-san-triple-ridge-kin.webp thanh-san-trong-thung.webp ung-dung-dam-go.webp ung-dung-lop-xe-phe-lieu.webp ung-dung-mun-cua.webp ' +
      'ung-dung-nong-san.webp ung-dung-rac-sinh-hoat.webp ung-dung-rac-thai-phe-lieu.webp ung-dung-than.webp ung-dung-thuc-an-chan-nuoi.webp ' +
      'ung-dung-trau.webp ung-dung-vo-hat-dieu.webp w-floor-lap-dat.webp w-floor-xa-nuoc.webp').split(' ').map(function (f) {
      return { id: f, name: f, src: '/assets/img/' + f, folder: 'assets/img', size: Math.floor(18 + r() * 160) * 1024, alt: '', uploadedAt: iso(now - Math.floor(30 + r() * 30) * DAY) };
    });
    ['hallco-i-series-dieu-kien-bao-hanh.pdf'].forEach(function (f) {
      media.push({ id: f, name: f, src: '/assets/docs/' + f, folder: 'assets/docs', size: 412 * 1024, alt: '', uploadedAt: iso(now - 40 * DAY) });
    });

    /* ---- Người dùng ---- */
    var users = [
      { id: 'U1', name: 'Quản trị viên', email: 'admin@nhutin.com', role: 'admin', active: true, lastLogin: iso(now - 2 * 3600000) },
      { id: 'U2', name: STAFF[0], email: 'tam.nguyen@nhutin.com', role: 'sales', active: true, lastLogin: iso(now - 5 * 3600000) },
      { id: 'U3', name: STAFF[1], email: 'thao.le@nhutin.com', role: 'sales', active: true, lastLogin: iso(now - 26 * 3600000) },
      { id: 'U4', name: STAFF[2], email: 'viet.pham@nhutin.com', role: 'tech', active: true, lastLogin: iso(now - 3 * DAY) },
      { id: 'U5', name: 'Trần Ngọc Mai', email: 'mai.tran@nhutin.com', role: 'editor', active: false, lastLogin: iso(now - 41 * DAY) }
    ];

    /* ---- Nhật ký ---- */
    var activity = [];
    leads.slice(0, 20).forEach(function (l) {
      activity.push({ at: l.createdAt, by: 'Website', type: 'lead', text: 'Yêu cầu báo giá mới ' + l.id + ' từ ' + l.name + ' (' + l.source + ')' });
      l.notes.forEach(function (n) { activity.push({ at: n.at, by: n.by, type: 'lead', text: 'Ghi chú cho ' + l.id + ': ' + n.text }); });
    });
    activity.push({ at: iso(now - 4 * DAY), by: 'Quản trị viên', type: 'content', text: 'Cập nhật câu trả lời chatbot "Bảo hành thế nào?"' });
    activity.push({ at: iso(now - 9 * DAY), by: 'Trần Ngọc Mai', type: 'content', text: 'Sửa mô tả SEO trang Ứng dụng' });
    activity.push({ at: iso(now - 12 * DAY), by: 'Quản trị viên', type: 'system', text: 'Đổi chế độ form báo giá sang "demo"' });
    activity.sort(function (a, b) { return b.at.localeCompare(a.at); });

    var settings = {
      siteName: 'HALLCO® LIVE FLOOR® – Như Tín',
      domain: 'https://hallco.nhutin.com',
      company: 'Công ty Cổ phần Như Tín',
      taxId: '0309707718',
      address: '222C đường Linh Trung, Phường Linh Xuân, TP.HCM',
      hotline: '0907 917 301',
      zalo: '0907917301',
      mailTo: '',
      formMode: 'demo',
      phpEndpoint: 'send.php',
      gsheetEndpoint: '',
      rateLimit: 3,
      minSeconds: 3,
      ga4: '',
      chatEnabled: true,
      chatTeaser: true,
      chatMinScore: 4
    };

    return {
      version: 1,
      leads: leads, customers: customers, warranties: warranties, fallbacks: fallbacks,
      products: products, pages: pages, media: media, users: users, activity: activity,
      settings: settings, kb: null
    };
  }

  window.HallcoSeed = { seed: seed, NEEDS: NEEDS, STAFF: STAFF };
})();
