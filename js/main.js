/* HALLCO® LIVE FLOOR® – Như Tín. JavaScript thuần, không thư viện. */
(function () {
  'use strict';

  /* ----------------------------------------------------------------
     CẤU HÌNH FORM (xem README, mục "Cấu hình form")
     mode: 'php'    -> gửi tới send.php (SMTP qua PHPMailer)
           'gsheet' -> gửi tới Google Apps Script, ghi vào Google Sheet
           'demo'   -> không gửi đi đâu, chỉ kiểm tra dữ liệu rồi mời gọi hotline (bản demo giao diện)
     ---------------------------------------------------------------- */
  var FORM_CONFIG = {
    mode: 'demo',
    phpEndpoint: 'send.php', // tính từ thư mục gốc website, trang tiếng Anh ở en/ vẫn gửi đúng chỗ
    gsheetEndpoint: '' // dán URL Web App dạng https://script.google.com/macros/s/.../exec
  };

  var HOTLINE = '0907 917 301';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Thư mục gốc của website, tính từ chính file này
  var BASE = (document.currentScript && document.currentScript.src || '').replace(/js\/main\.js(\?.*)?$/, '');

  /* ---------- Chữ theo ngôn ngữ trang (<html lang>) ---------- */
  var T = {
    vi: {
      menuOpen: 'Mở menu',
      menuClose: 'Đóng menu',
      step: 'Bước ',
      nameEmpty: 'Nhập họ và tên để Như Tín biết cách xưng hô khi gọi lại.',
      nameShort: 'Họ và tên cần ít nhất 2 ký tự.',
      phoneEmpty: 'Nhập số điện thoại để Như Tín gọi lại.',
      phoneBad: 'Số điện thoại chưa đúng. Nhập 10 số bắt đầu bằng 0, ví dụ ' + HOTLINE + '.',
      needEmpty: 'Chọn nhu cầu gần nhất với xe của bạn.',
      wait: function (sec) { return 'Bạn vừa gửi một yêu cầu. Đợi ' + sec + ' giây rồi gửi lại, hoặc gọi ' + HOTLINE + '.'; },
      noEndpoint: 'Form chưa được cấu hình nơi nhận. Gọi ' + HOTLINE + ' để được báo giá.',
      demo: 'Đây là bản demo, form tạm chưa gửi đi. Gọi ' + HOTLINE + ' để được báo giá.',
      sending: 'Đang gửi yêu cầu…',
      submit: 'Gửi yêu cầu báo giá',
      network: 'Chưa gửi được yêu cầu do lỗi kết nối. Gửi lại sau ít phút hoặc gọi ' + HOTLINE + '.'
    },
    en: {
      menuOpen: 'Open menu',
      menuClose: 'Close menu',
      step: 'Step ',
      nameEmpty: 'Enter your full name so Như Tín knows who to ask for when calling back.',
      nameShort: 'Your name needs at least 2 characters.',
      phoneEmpty: 'Enter a phone number so Như Tín can call you back.',
      phoneBad: 'This phone number does not look right. Use a 10-digit Vietnamese number starting with 0, such as ' + HOTLINE + ', or an international number starting with +.',
      needEmpty: 'Choose the option closest to your needs.',
      wait: function (sec) { return 'You just sent a request. Wait ' + sec + ' seconds before sending again, or call ' + HOTLINE + '.'; },
      noEndpoint: 'The form has no destination configured yet. Call ' + HOTLINE + ' for a quote.',
      demo: 'This is a demo, the form is not sending yet. Call ' + HOTLINE + ' for a quote.',
      sending: 'Sending your request…',
      submit: 'Request a quote',
      network: 'Your request could not be sent because of a connection problem. Try again in a few minutes or call ' + HOTLINE + '.'
    }
  }[document.documentElement.lang === 'en' ? 'en' : 'vi'];

  /* ---------- Đo lường GA4 ---------- */
  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-track]');
    if (el) track(el.getAttribute('data-track'), { link_url: el.getAttribute('href') || '' });
  });

  /* ---------- Menu mobile ---------- */
  var toggle = document.querySelector('[data-menu-toggle]');
  var nav = document.querySelector('[data-nav]');
  if (toggle && nav) {
    var setMenu = function (open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
      toggle.querySelector('.visually-hidden').textContent = open ? T.menuClose : T.menuOpen;
    };
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
    });
  }

  /* ---------- Menu con ---------- */
  document.querySelectorAll('[data-sub-toggle]').forEach(function (btn) {
    var sub = document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      if (sub) sub.classList.toggle('is-open', open);
    });
  });

  /* ---------- Mô phỏng thanh sàn ----------
     Chu trình: 0 cả sàn tiến (hàng đi theo), 1-3 lùi về từng nhóm, 4 nghỉ (chỉ ở mô phỏng lớn) */
  var PHASE_MS = 750;
  var floors = [];

  function Floor(el) {
    this.el = el;
    this.withSteps = el.hasAttribute('data-floor-steps');
    this.phases = this.withSteps ? 5 : 4;
    this.phase = -1;
    this.offset = 0;
    this.loadEl = el.querySelector('.floor-load');
    this.visible = false;
    this.holdUntil = 0;
    this.crate = el.querySelector('[data-crate]');
    this.crateStep = 0;
    this.steps = this.withSteps ? document.querySelectorAll('[data-steps] .how-step') : [];
    this.live = this.withSteps ? document.querySelector('[data-step-live]') : null;
  }
  Floor.prototype.stepOf = function (phase) {
    return phase === 0 ? 1 : phase === 4 ? 3 : 2;
  };
  Floor.prototype.show = function (phase) {
    this.phase = phase;
    this.el.setAttribute('data-phase', String(phase));
    if (phase === 0) {
      this.moveLoad();
      this.moveCrate();
    }
    if (this.withSteps) {
      var active = this.stepOf(phase);
      for (var i = 0; i < this.steps.length; i++) {
        this.steps[i].classList.toggle('is-active', i + 1 === active);
      }
    }
  };
  Floor.prototype.moveLoad = function () {
    if (!this.loadEl) return;
    var css = getComputedStyle(this.el);
    var s = parseFloat(css.getPropertyValue('--s')) || 40;
    var tile = parseFloat(css.getPropertyValue('--tile')) || 480;
    var load = this.loadEl;
    var self = this;
    this.offset += s;
    load.style.setProperty('--lx', this.offset + 'px');
    if (this.offset >= tile) {
      // đi hết một tile: kéo lùi đúng một tile, hình ảnh không đổi
      setTimeout(function () {
        load.classList.add('no-anim');
        self.offset -= tile;
        load.style.setProperty('--lx', self.offset + 'px');
        void load.offsetWidth;
        load.classList.remove('no-anim');
      }, PHASE_MS - 50);
    }
  };
  Floor.prototype.moveCrate = function () {
    if (!this.crate) return;
    var s = parseFloat(getComputedStyle(this.el).getPropertyValue('--s')) || 48;
    var width = this.el.clientWidth;
    var self = this;
    this.crateStep += 1;
    var x = 24 + this.crateStep * s;
    this.crate.style.setProperty('--cx', x + 'px');
    if (x > width) {
      // kiện hàng đã ra khỏi cửa sau: đưa về đầu thùng
      setTimeout(function () {
        self.crate.classList.add('no-anim');
        self.crate.style.opacity = '0';
        self.crateStep = 0;
        self.crate.style.setProperty('--cx', '24px');
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            self.crate.classList.remove('no-anim');
            self.crate.style.opacity = '';
          });
        });
      }, PHASE_MS);
    }
  };
  Floor.prototype.tick = function (now) {
    if (now < this.holdUntil) return;
    this.show((this.phase + 1) % this.phases);
  };

  // Dải thanh sàn luôn tự chạy (yêu cầu của khách hàng), kể cả khi máy bật giảm chuyển động
  document.querySelectorAll('[data-floor]').forEach(function (el) { floors.push(new Floor(el)); });

  if ('IntersectionObserver' in window) {
    var floorIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        floors.forEach(function (f) { if (f.el === en.target) f.visible = en.isIntersecting; });
      });
    }, { threshold: 0.2 });
    floors.forEach(function (f) { floorIO.observe(f.el); });
  } else {
    floors.forEach(function (f) { f.visible = true; });
  }

  setInterval(function () {
    if (document.hidden) return;
    var now = Date.now();
    floors.forEach(function (f) { if (f.visible) f.tick(now); });
  }, PHASE_MS);

  // Bấm vào từng bước để xem trạng thái tương ứng
  var stepPhase = { 1: 0, 2: 1, 3: 4 };
  document.querySelectorAll('[data-step-btn]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var step = Number(btn.getAttribute('data-step-btn'));
      var sim = floors.filter(function (f) { return f.withSteps; })[0];
      if (!sim) return;
      sim.show(stepPhase[step]);
      sim.holdUntil = Date.now() + 6000;
      if (sim.live) {
        sim.live.textContent = T.step + step + ': ' + btn.querySelector('.how-title').textContent;
      }
    });
  });

  /* ---------- Video hero: luôn tự chạy và lặp lại ---------- */
  var heroVideo = document.querySelector('[data-hero-video]');
  if (heroVideo) {
    var playHero = function () {
      var p = heroVideo.play();
      if (p && p.catch) p.catch(function () {});
    };
    playHero();
    // một số trình duyệt dừng video khi chuyển tab; chạy lại khi quay về
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && heroVideo.paused) playHero();
    });
  }

  /* ---------- Đếm số khi cuộn tới ---------- */
  var counters = document.querySelectorAll('[data-count]');
  if (!reduceMotion && 'IntersectionObserver' in window && counters.length) {
    counters.forEach(function (el) { el.textContent = el.getAttribute('data-from') || '0'; });
    var countIO = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        obs.unobserve(en.target);
        var el = en.target;
        var from = Number(el.getAttribute('data-from') || 0);
        var to = Number(el.getAttribute('data-count'));
        var start = null;
        var dur = 1200;
        var step = function (ts) {
          if (start === null) start = ts;
          var t = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - t, 3);
          el.textContent = String(Math.round(from + (to - from) * eased));
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countIO.observe(el); });
  }

  /* ---------- Điền sẵn nhu cầu từ liên kết, ví dụ lien-he.html?nhu-cau=xe-rac ---------- */
  var NEED_FROM_LINK = {
    'romooc': 'Lắp hoặc cải tạo rơ-moóc, thùng xe',
    'xe-tai': 'Xe tải thùng',
    'xe-rac': 'Xe chở rác',
    'co-dinh': 'Bồn chứa, hầm chứa cố định',
    'phu-tung': 'Phụ tùng, bảo trì hệ thống đang dùng'
  };
  var needSelect = document.getElementById('f-need');
  if (needSelect && 'URLSearchParams' in window) {
    var needKey = new URLSearchParams(location.search).get('nhu-cau');
    if (needKey && NEED_FROM_LINK[needKey]) needSelect.value = NEED_FROM_LINK[needKey];
  }

  /* ---------- Form báo giá ---------- */
  var form = document.querySelector('[data-quote-form]');
  if (form) {
    var started = form.querySelector('[data-started]');
    if (started) started.value = String(Date.now());

    var statusEl = form.querySelector('[data-form-status]');
    var submitBtn = form.querySelector('[data-submit]');
    var done = document.querySelector('[data-quote-done]');

    var normalizePhone = function (v) {
      var p = String(v || '').replace(/[\s.\-()]/g, '');
      if (p.indexOf('00') === 0) p = '+' + p.slice(2);
      if (p.indexOf('+84') === 0) p = '0' + p.slice(3);
      else if (p.indexOf('84') === 0 && p.length === 11) p = '0' + p.slice(2);
      return p;
    };
    // Số Việt Nam, hoặc số quốc tế dạng +mã nước (cho khách nước ngoài)
    var isValidPhone = function (p) {
      return /^0(3|5|7|8|9)\d{8}$/.test(p) || /^02\d{9}$/.test(p) || /^\+[1-9]\d{7,14}$/.test(p);
    };

    var rules = {
      name: function (v) {
        v = v.trim();
        if (!v) return T.nameEmpty;
        if (v.length < 2) return T.nameShort;
        return '';
      },
      phone: function (v) {
        if (!v.trim()) return T.phoneEmpty;
        if (!isValidPhone(normalizePhone(v))) return T.phoneBad;
        return '';
      },
      need: function (v) {
        return v ? '' : T.needEmpty;
      }
    };

    var showError = function (name, msg) {
      var input = form.elements[name];
      var box = form.querySelector('[data-error-for="' + name + '"]');
      if (box) box.textContent = msg;
      if (input) {
        if (msg) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
      }
    };

    Object.keys(rules).forEach(function (name) {
      var input = form.elements[name];
      if (!input) return;
      input.addEventListener('blur', function () {
        if (input.value) showError(name, rules[name](input.value));
      });
      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid') === 'true') showError(name, rules[name](input.value));
      });
    });

    var RATE_KEY = 'nt_quote_last';
    var RATE_MS = 60 * 1000;
    var readLast = function () {
      try { return Number(localStorage.getItem(RATE_KEY) || 0); } catch (e) { return 0; }
    };
    var writeLast = function () {
      try { localStorage.setItem(RATE_KEY, String(Date.now())); } catch (e) { /* bỏ qua */ }
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      statusEl.textContent = '';

      var firstBad = null;
      Object.keys(rules).forEach(function (name) {
        var msg = rules[name](form.elements[name].value);
        showError(name, msg);
        if (msg && !firstBad) firstBad = form.elements[name];
      });
      if (firstBad) { firstBad.focus(); return; }

      var wait = RATE_MS - (Date.now() - readLast());
      if (wait > 0) {
        statusEl.textContent = T.wait(Math.ceil(wait / 1000));
        return;
      }

      var data = new FormData(form);
      data.set('phone', normalizePhone(data.get('phone')));
      data.set('page', location.href);

      if (FORM_CONFIG.mode === 'demo') {
        statusEl.textContent = T.demo;
        return;
      }

      var endpoint = FORM_CONFIG.mode === 'gsheet'
        ? FORM_CONFIG.gsheetEndpoint
        : FORM_CONFIG.phpEndpoint && BASE + FORM_CONFIG.phpEndpoint;
      if (!endpoint) {
        statusEl.textContent = T.noEndpoint;
        return;
      }
      var body = FORM_CONFIG.mode === 'gsheet' ? new URLSearchParams(data) : data;

      submitBtn.disabled = true;
      submitBtn.textContent = T.sending;

      fetch(endpoint, { method: 'POST', body: body, headers: { 'Accept': 'application/json' } })
        .then(function (res) {
          return res.json().catch(function () { return { ok: false }; });
        })
        .then(function (json) {
          if (!json || !json.ok) {
            if (json && json.field) showError(json.field, json.error || '');
            throw new Error((json && json.error) || 'send_failed');
          }
          writeLast();
          track('generate_lead', { form_name: 'bao_gia', need: data.get('need') });
          var phoneOut = done.querySelector('[data-done-phone]');
          if (phoneOut) phoneOut.textContent = data.get('phone');
          form.hidden = true;
          done.hidden = false;
          done.classList.add('is-shown');
          done.focus();
        })
        .catch(function (err) {
          var msg = err && err.message && err.message !== 'send_failed' && err.message !== 'Failed to fetch'
            ? err.message
            : T.network;
          statusEl.textContent = msg;
          submitBtn.disabled = false;
          submitBtn.textContent = T.submit;
        });
    });
  }

  /* ---------- Bản đồ mạng lưới HALLCO: khung hẹp (điện thoại) lùi zoom để thấy cả thế giới ---------- */
  var netMap = document.querySelector('[data-net-map]');
  if (netMap && netMap.parentNode.clientWidth < 600) {
    netMap.src = netMap.src.replace(/([?&]z=)\d+/, function (m, key) { return key + '1'; });
  }

  /* ---------- Năm bản quyền ---------- */
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
