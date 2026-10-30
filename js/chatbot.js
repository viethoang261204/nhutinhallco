/* Trợ lý Như Tín: chatbot tự trả lời, chạy hoàn toàn trên trình duyệt, không dùng API AI.
   Kho kiến thức js/chatbot-kb.js (tiếng Việt) và js/chatbot-kb-en.js (tiếng Anh) do tools/build.py sinh
   từ trang Hỏi đáp và chatbot/kb.json, chỉ tải khi khách mở khung chat lần đầu. */
(function () {
  'use strict';

  var root = document.getElementById('chatbot');
  var launcher = document.querySelector('[data-chat-open]');
  if (!root || !launcher) return;

  // Thư mục gốc của website, tính từ chính file này (trang tiếng Anh nằm ở en/)
  var BASE = (document.currentScript && document.currentScript.src || '').replace(/js\/chatbot\.js(\?.*)?$/, '');
  var LANG = document.documentElement.lang === 'en' ? 'en' : 'vi';

  var log = root.querySelector('[data-chat-log]');
  var form = root.querySelector('[data-chat-form]');
  var input = root.querySelector('[data-chat-input]');
  var teaser = document.querySelector('[data-chat-teaser]');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STORE = LANG === 'en' ? 'nt-chat-en' : 'nt-chat';
  var MIN_SCORE = 4;
  var AVATAR = BASE + 'assets/img/nhutinlogo-220.webp';
  var KB_SRC = BASE + (LANG === 'en' ? 'js/chatbot-kb-en.js' : 'js/chatbot-kb.js');

  var TEXT = {
    vi: {
      chips: [
        'Lắp sàn tự đổ HALLCO® giá bao nhiêu?',
        'Xe đang chạy có lắp được không?',
        'Bộ dẫn động i-4000 và i-6000 khác nhau thế nào?',
        'Sàn chở được những loại hàng nào?',
        'Bảo hành thế nào?',
        'Liên hệ Như Tín thế nào?'
      ],
      greeting: 'Chào anh chị, em là trợ lý tự động của <b>Như Tín</b>, đại lý ủy quyền HALLCO® LIVE FLOOR® tại Việt Nam. ' +
        'Anh chị hỏi về giá, lắp đặt, thông số, bảo hành hay loại hàng, em trả lời ngay theo tài liệu của hãng.',
      fallback: 'Câu này em chưa có sẵn câu trả lời chính xác. Để không trả lời sai, anh chị trao đổi trực tiếp với kỹ thuật Như Tín nhé, ' +
        'hoặc thử hỏi theo cách khác (ví dụ: <i>giá</i>, <i>bảo hành</i>, <i>xe cũ</i>, <i>dăm gỗ</i>).',
      phone: 'Em là trợ lý tự động nên chưa nhận được số điện thoại qua khung chat. Anh chị điền số vào <a href="lien-he">form nhận báo giá</a> (chỉ mất 30 giây), kỹ thuật Như Tín sẽ gọi lại trong giờ làm việc.',
      hello: 'Chào anh chị! Anh chị đang quan tâm lắp sàn cho xe nào, chở loại hàng gì ạ? Hoặc bấm một câu gợi ý bên dưới.',
      thanks: 'Dạ không có gì ạ. Cần báo giá cụ thể cho xe của mình, anh chị gọi hoặc nhắn Zalo <b>0907 917 301</b> nhé.',
      helloRe: / (xin chao|chao|hello|hi|alo|helo) /,
      thanksRe: / (cam on|thank|thanks|tks|ok|oke|okay) /,
      quote: 'Nhận báo giá',
      call: 'Gọi 0907 917 301',
      zalo: 'Nhắn Zalo',
      more: 'Xem chi tiết trên website',
      related: 'Có thể anh chị cũng quan tâm:',
      didYouMean: 'Hay ý anh chị là:',
      typing: 'Đang trả lời…',
      loadError: 'Không tải được dữ liệu trợ lý. Anh chị gọi <b>0907 917 301</b> để được tư vấn ngay.',
      // Viết tắt, kiểu gõ nhanh thường gặp → dạng đầy đủ không dấu
      abbr: {
        k: 'khong', ko: 'khong', kh: 'khong', hok: 'khong', hong: 'khong', khg: 'khong',
        dc: 'duoc', dk: 'duoc', bn: 'bao nhieu', bnhieu: 'bao nhieu',
        sp: 'san pham', bh: 'bao hanh', sdt: 'so dien thoai', dt: 'dien thoai', nt: 'nhan tin',
        mooc: 'romooc', romoc: 'romooc', moc: 'romooc', ngta: 'nguoi ta', vs: 'voi', j: 'gi', z: 'gi',
        lm: 'lam', ntn: 'nhu the nao', tg: 'thoi gian', xl: 'xi lanh'
      },
      stop: ' a ah a oi oi em anh chi ban minh toi cho cua la co khong the nao gi duoc va voi thi nhu mot nhung cai nay do ra vay nhe ha a bao xe san hang ' +
        'lam can muon hoi cho e ad shop ben '
    },
    en: {
      chips: [
        'How much does a HALLCO® moving floor cost?',
        'Can you fit a truck that is already in service?',
        'What is the difference between the i-4000 and the i-6000?',
        'What cargo can the floor carry?',
        'What is the warranty?',
        'How do I contact Nhu Tin?'
      ],
      greeting: 'Hello, I am the automated assistant of <b>Nhu Tin</b>, the authorized HALLCO® LIVE FLOOR® dealer in Vietnam. ' +
        'Ask me about price, installation, specifications, warranty or cargo and I will answer straight from the factory documents.',
      fallback: 'I don\'t have an exact answer to that yet. Rather than guess, please talk to a Nhu Tin technician directly, ' +
        'or try asking another way (for example: <i>price</i>, <i>warranty</i>, <i>retrofit</i>, <i>wood chips</i>).',
      phone: 'I am an automated assistant, so I can\'t take phone numbers in the chat. Please enter yours in the <a href="lien-he">quote form</a> (it takes 30 seconds) and a Nhu Tin technician will call you back during business hours.',
      hello: 'Hello! Which truck are you thinking of fitting, and what cargo does it carry? Or pick a suggested question below.',
      thanks: 'You\'re welcome. For a quote for your own truck, call or message us on Zalo at <b>0907 917 301</b>.',
      helloRe: / (hello|hi|hey|good morning|good afternoon|xin chao|chao) /,
      thanksRe: / (thank you|thanks|thank|thx|ok|okay|great|cheers) /,
      quote: 'Get a quote',
      call: 'Call 0907 917 301',
      zalo: 'Zalo',
      more: 'More details on the website',
      related: 'You might also want to know:',
      didYouMean: 'Did you mean:',
      typing: 'Typing…',
      loadError: 'The assistant could not load. Please call <b>0907 917 301</b> for advice right away.',
      abbr: { u: 'you', ur: 'your', pls: 'please', plz: 'please', w: 'with', tonne: 'tons', tonnes: 'tons', ton: 'tons', aluminum: 'aluminium', tires: 'tyres' },
      stop: ' a an the is are am be to of for in on at and or it its this that my your our me we you i do does can could would should will how what which ' +
        'there please about with from by as if any some floor floors truck trucks moving hallco live '
    }
  }[LANG];

  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }

  /* ---------- Chuẩn hóa câu hỏi (bỏ dấu, viết tắt) ---------- */
  function norm(s) {
    s = String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
    s = s.replace(/ro\s*-?\s*mooc/g, 'romooc').replace(/\bi\s*-?\s*(\d{4})\b/g, 'i$1').replace(/live\s*floor/g, 'livefloor');
    s = s.replace(/[^a-z0-9]+/g, ' ').trim();
    return s.split(' ').map(function (w) { return TEXT.abbr[w] || w; }).join(' ');
  }
  function tokens(s) {
    return norm(s).split(' ').filter(function (w) { return w.length > 1 && TEXT.stop.indexOf(' ' + w + ' ') < 0; });
  }

  /* ---------- Chỉ mục và chấm điểm ---------- */
  var index = null;
  function buildIndex(kb) {
    return kb.map(function (e) {
      return {
        e: e,
        phrases: (e.keywords || []).map(norm).filter(Boolean),
        qTokens: tokens(e.q),
        qNorm: norm(e.q)
      };
    });
  }

  function score(item, qn, qt) {
    var s = 0;
    var padded = ' ' + qn + ' ';
    if (qn === item.qNorm) return 100;
    item.phrases.forEach(function (p) {
      if (padded.indexOf(' ' + p + ' ') >= 0) s += 2.5 + p.split(' ').length * 1.5;
    });
    qt.forEach(function (t) { if (item.qTokens.indexOf(t) >= 0) s += 1.5; });
    return s;
  }

  function search(text) {
    var qn = norm(text), qt = tokens(text);
    return index.map(function (it) { return { it: it, s: score(it, qn, qt) }; })
      .filter(function (r) { return r.s > 0; })
      .sort(function (a, b) { return b.s - a.s; });
  }

  function byQuestion(q) {
    for (var i = 0; i < index.length; i++) if (index[i].e.q === q) return index[i].e;
    return null;
  }

  /* ---------- Ý định đặc biệt ---------- */
  function special(text) {
    var n = ' ' + norm(text) + ' ';
    var compact = text.replace(/[\s.\-()]/g, '');
    if (/^\+?\d{9,15}$/.test(compact)) {
      return { id: 'so-dien-thoai', a: TEXT.phone, actions: 'quote' };
    }
    if (TEXT.helloRe.test(n) && n.split(' ').length < 7) {
      return { id: 'chao', a: TEXT.hello, chips: true };
    }
    if (TEXT.thanksRe.test(n) && n.split(' ').length < 7) {
      return { id: 'cam-on', a: TEXT.thanks, actions: 'contact' };
    }
    return null;
  }

  /* ---------- Hiển thị ---------- */
  var history = [];
  var CHIPS_TAIL = /(<p class="chat-sub">[^<]*<\/p>)?<div class="chat-chips">[\s\S]*?<\/div>$/;
  function save() {
    try { sessionStorage.setItem(STORE, JSON.stringify(history.slice(-40))); } catch (err) { /* bỏ qua */ }
  }
  function load() {
    try { return JSON.parse(sessionStorage.getItem(STORE) || '[]'); } catch (err) { return []; }
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }

  function actionsHtml(kind) {
    var quote = '<a class="chat-act chat-act-main" href="lien-he" data-track="chat_quote">' + TEXT.quote + '</a>';
    var call = '<a class="chat-act" href="tel:+84907917301" data-track="click_call">' + TEXT.call + '</a>';
    var zalo = '<a class="chat-act chat-act-zalo" href="https://zalo.me/0907917301" target="_blank" rel="noopener" data-track="click_zalo">' + TEXT.zalo + '</a>';
    if (kind === 'quote') return quote + call;
    return call + zalo + quote;
  }

  function chipsHtml(list) {
    return '<div class="chat-chips">' + list.map(function (q) {
      return '<button type="button" class="chat-chip" data-chat-ask="' + escapeHtml(q) + '">' + escapeHtml(q) + '</button>';
    }).join('') + '</div>';
  }

  function scrollDown() {
    log.scrollTop = log.scrollHeight;
  }

  function render(msg) {
    var row = document.createElement('div');
    row.className = 'chat-row chat-' + msg.who;
    if (msg.who === 'bot') {
      row.innerHTML = '<img class="chat-row-avatar" src="' + AVATAR + '" alt="" width="28" height="28">' +
        '<div class="chat-bubble">' + msg.html + '</div>';
    } else {
      row.innerHTML = '<div class="chat-bubble">' + escapeHtml(msg.text) + '</div>';
    }
    log.appendChild(row);
    scrollDown();
  }

  function push(msg) {
    // Gợi ý cũ chỉ còn tác dụng ở tin mới nhất
    log.querySelectorAll('.chat-chips, .chat-sub').forEach(function (c) { c.remove(); });
    history.forEach(function (m) { if (m.html) m.html = m.html.replace(CHIPS_TAIL, ''); });
    history.push(msg);
    save();
    render(msg);
  }

  function answerHtml(entry, related) {
    var h = '<div class="chat-answer">' + entry.a + '</div>';
    if (entry.link) {
      h += '<a class="chat-more" href="' + entry.link + '">' + TEXT.more + '<span aria-hidden="true"> →</span></a>';
    }
    if (entry.actions) h += '<div class="chat-acts">' + actionsHtml(entry.actions) + '</div>';
    if (related.length) h += '<p class="chat-sub">' + TEXT.related + '</p>' + chipsHtml(related);
    return h;
  }

  function reply(text) {
    var sp = special(text);
    if (sp) {
      var h = sp.a;
      if (sp.actions) h += '<div class="chat-acts">' + actionsHtml(sp.actions) + '</div>';
      if (sp.chips) h += chipsHtml(TEXT.chips.slice(0, 4));
      return { id: sp.id, html: h };
    }
    var results = search(text);
    var best = results[0];
    if (!best || best.s < MIN_SCORE) {
      var near = results.slice(0, 3).filter(function (r) { return r.s >= 2; }).map(function (r) { return r.it.e.q; });
      var fh = TEXT.fallback + '<div class="chat-acts">' + actionsHtml('contact') + '</div>';
      if (near.length) fh += '<p class="chat-sub">' + TEXT.didYouMean + '</p>' + chipsHtml(near);
      return { id: 'fallback', html: fh };
    }
    var e = best.it.e;
    var related = (e.related || []).filter(function (q) { return byQuestion(q); });
    results.slice(1).forEach(function (r) {
      if (related.length < 3 && r.s >= MIN_SCORE && r.s >= best.s * 0.6 && related.indexOf(r.it.e.q) < 0) related.push(r.it.e.q);
    });
    if (!related.length) {
      // Không có câu liên quan: gợi ý tiếp vài câu phổ biến khách chưa hỏi
      var asked = history.filter(function (m) { return m.who === 'user'; }).map(function (m) { return m.text; });
      related = TEXT.chips.filter(function (q) { return q !== e.q && asked.indexOf(q) < 0; }).slice(0, 2);
    }
    return { id: e.id, html: answerHtml(e, related.slice(0, 3)) };
  }

  var busy = false;
  function ask(text) {
    text = text.trim();
    if (!text || busy || !index) return;
    busy = true;
    push({ who: 'user', text: text });
    var typing = document.createElement('div');
    typing.className = 'chat-row chat-bot chat-typing';
    typing.innerHTML = '<img class="chat-row-avatar" src="' + AVATAR + '" alt="" width="28" height="28">' +
      '<div class="chat-bubble"><span class="chat-spinner" aria-hidden="true"></span>' + TEXT.typing + '</div>';
    log.appendChild(typing);
    scrollDown();
    var r = reply(text);
    track('chat_question', { chat_match: r.id, chat_lang: LANG });
    setTimeout(function () {
      typing.remove();
      push({ who: 'bot', html: r.html });
      busy = false;
    }, 1000 + Math.random() * 1000); // 1–2 giây cho giống người đang trả lời
  }

  /* ---------- Tải kho kiến thức ---------- */
  var loading = null;
  function loadKb(done) {
    if (index) return done();
    if (window.NT_KB) { index = buildIndex(window.NT_KB); return done(); }
    if (!loading) {
      loading = [];
      var s = document.createElement('script');
      s.src = KB_SRC;
      s.onload = function () {
        index = buildIndex(window.NT_KB || []);
        loading.forEach(function (fn) { fn(); });
      };
      s.onerror = function () {
        loading = null;
        log.innerHTML = '';
        render({ who: 'bot', html: TEXT.loadError + '<div class="chat-acts">' + actionsHtml('contact') + '</div>' });
      };
      document.head.appendChild(s);
    }
    loading.push(done);
  }

  function start() {
    log.innerHTML = '';
    history = load();
    if (!history.length) {
      push({ who: 'bot', html: TEXT.greeting + chipsHtml(TEXT.chips) });
    } else {
      history.forEach(render);
    }
  }

  /* ---------- Mở, đóng ---------- */
  var started = false;
  function open() {
    if (!root.hidden) return;
    hideTeaser(true);
    root.hidden = false;
    document.documentElement.classList.add('chat-is-open');
    launcher.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(function () { root.classList.add('is-open'); });
    track('chat_open', { chat_lang: LANG });
    loadKb(function () {
      if (!started) { started = true; start(); }
      scrollDown();
    });
    // Trên điện thoại không tự bật bàn phím, để khách đọc lời chào trước
    if (window.matchMedia('(min-width: 600px)').matches) input.focus();
    else root.querySelector('[data-chat-close]').focus();
  }
  function close() {
    if (root.hidden) return;
    root.classList.remove('is-open');
    document.documentElement.classList.remove('chat-is-open');
    launcher.setAttribute('aria-expanded', 'false');
    setTimeout(function () { root.hidden = true; }, reduceMotion ? 0 : 200);
    launcher.focus();
  }

  launcher.addEventListener('click', function () { root.hidden ? open() : close(); });
  root.querySelector('[data-chat-close]').addEventListener('click', close);
  root.querySelector('[data-chat-reset]').addEventListener('click', function () {
    history = [];
    save();
    log.innerHTML = '';
    push({ who: 'bot', html: TEXT.greeting + chipsHtml(TEXT.chips) });
    input.focus();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !root.hidden) close();
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = input.value;
    input.value = '';
    ask(v);
  });
  log.addEventListener('click', function (e) {
    var chip = e.target.closest('[data-chat-ask]');
    if (chip) ask(chip.getAttribute('data-chat-ask'));
  });

  /* ---------- Lời mời nhỏ cạnh nút, hiện một lần mỗi phiên ---------- */
  var teaserTimer;
  function hideTeaser(forever) {
    clearTimeout(teaserTimer);
    if (teaser) teaser.hidden = true;
    if (forever) try { sessionStorage.setItem('nt-chat-teased', '1'); } catch (err) { /* bỏ qua */ }
  }
  var teased = false;
  try { teased = !!sessionStorage.getItem('nt-chat-teased') || !!sessionStorage.getItem(STORE); } catch (err) { /* bỏ qua */ }
  if (teaser && !teased) {
    teaserTimer = setTimeout(function () {
      teaser.hidden = false;
      teaserTimer = setTimeout(function () { hideTeaser(true); }, 9000);
    }, 6000);
  }
})();
