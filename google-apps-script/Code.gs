/**
 * Phương án thay thế: ghi yêu cầu báo giá vào Google Sheet.
 * Cách cài đặt: xem README, mục "Phương án B: Google Sheet".
 */

// Email nhận thông báo mỗi khi có yêu cầu mới. Để trống nếu chỉ cần ghi vào Sheet.
var NOTIFY_EMAIL = '';
var SHEET_NAME = 'Báo giá';
var NEEDS = [
  'Lắp hoặc cải tạo rơ-moóc, thùng xe',
  'Xe tải thùng',
  'Xe chở rác',
  'Bồn chứa, hầm chứa cố định',
  'Phụ tùng, bảo trì hệ thống đang dùng',
  'Khác (ghi rõ ở phần ghi chú)'
];

// Thông báo trả về theo ngôn ngữ trang (form tiếng Anh gửi kèm lang=en)
var MESSAGES = {
  vi: {
    name: 'Nhập họ và tên để Như Tín biết cách xưng hô khi gọi lại.',
    phone: 'Số điện thoại chưa đúng. Nhập 10 số bắt đầu bằng 0, ví dụ 0907 917 301.',
    need: 'Chọn nhu cầu gần nhất với xe của bạn.',
    rate: 'Số này đã gửi 3 yêu cầu trong 10 phút qua. Gọi 0907 917 301 hoặc thử lại sau.'
  },
  en: {
    name: 'Enter your full name so Như Tín knows who to ask for when calling back.',
    phone: 'This phone number does not look right. Use a 10-digit Vietnamese number starting with 0, such as 0907 917 301, or an international number starting with +.',
    need: 'Choose the option closest to your needs.',
    rate: 'This number has sent 3 requests in the last 10 minutes. Call 0907 917 301 or try again later.'
  }
};

function doPost(e) {
  var p = (e && e.parameter) || {};
  var lang = p.lang === 'en' ? 'en' : 'vi';
  var M = MESSAGES[lang];

  // Honeypot: bot nhận phản hồi thành công giả
  if (p.website) return json_({ ok: true });

  var name = String(p.name || '').trim().slice(0, 80);
  var phone = normalizePhone_(String(p.phone || ''));
  var need = String(p.need || '').trim();
  var note = String(p.note || '').trim().slice(0, 1000);
  var page = String(p.page || '').slice(0, 300);

  if (name.length < 2) return json_({ ok: false, field: 'name', error: M.name });
  // Số Việt Nam, hoặc số quốc tế dạng +mã nước (cho khách nước ngoài)
  if (!/^0(3|5|7|8|9)\d{8}$/.test(phone) && !/^02\d{9}$/.test(phone) && !/^\+[1-9]\d{7,14}$/.test(phone)) {
    return json_({ ok: false, field: 'phone', error: M.phone });
  }
  if (NEEDS.indexOf(need) === -1) return json_({ ok: false, field: 'need', error: M.need });

  // Giới hạn tần suất: tối đa 3 lần mỗi số điện thoại trong 10 phút
  var cache = CacheService.getScriptCache();
  var key = 'rl_' + phone;
  var count = Number(cache.get(key) || 0);
  if (count >= 3) return json_({ ok: false, error: M.rate });
  cache.put(key, String(count + 1), 600);

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Thời gian', 'Họ và tên', 'Số điện thoại', 'Nhu cầu', 'Ghi chú', 'Trang gửi', 'Ngôn ngữ']);
    }
    // Thêm dấu ' để Sheet giữ số 0 ở đầu số điện thoại
    sheet.appendRow([new Date(), name, "'" + phone, need, note, page, lang === 'en' ? 'Tiếng Anh' : 'Tiếng Việt']);
  } finally {
    lock.releaseLock();
  }

  if (NOTIFY_EMAIL) {
    MailApp.sendEmail(NOTIFY_EMAIL, 'Báo giá LIVE FLOOR: ' + name + ' – ' + phone,
      'Họ và tên: ' + name + '\nSố điện thoại: ' + phone + '\nNhu cầu: ' + need + '\nGhi chú: ' + (note || '(không có)') + '\nTrang gửi: ' + page);
  }

  return json_({ ok: true });
}

function normalizePhone_(v) {
  var p = v.replace(/[\s.\-()]/g, '');
  if (p.indexOf('00') === 0) p = '+' + p.slice(2);
  if (p.indexOf('+84') === 0) p = '0' + p.slice(3);
  else if (p.indexOf('84') === 0 && p.length === 11) p = '0' + p.slice(2);
  return p;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
