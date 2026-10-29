<?php
/**
 * Nhận form báo giá và gửi email qua SMTP bằng PHPMailer.
 * Trả về JSON: {"ok": true} hoặc {"ok": false, "error": "...", "field": "..."}
 * Cấu hình: config.php
 */
declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as MailException;

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

const HOTLINE = '0907 917 301';
const NEEDS = [
    'Lắp hoặc cải tạo rơ-moóc, thùng xe',
    'Xe tải thùng',
    'Xe chở rác',
    'Bồn chứa, hầm chứa cố định',
    'Phụ tùng, bảo trì hệ thống đang dùng',
    'Khác (ghi rõ ở phần ghi chú)',
];

// Thông báo trả về cho khách theo ngôn ngữ trang (trường ẩn "lang" trong form tiếng Anh)
const MESSAGES = [
    'vi' => [
        'method'    => 'Trang này chỉ nhận dữ liệu gửi từ form báo giá.',
        'rate'      => 'Bạn đã gửi %d yêu cầu trong %d phút qua. Gọi ' . HOTLINE . ' hoặc thử lại sau.',
        'name'      => 'Nhập họ và tên để Như Tín biết cách xưng hô khi gọi lại.',
        'phone'     => 'Số điện thoại chưa đúng. Nhập 10 số bắt đầu bằng 0, ví dụ ' . HOTLINE . '.',
        'need'      => 'Chọn nhu cầu gần nhất với xe của bạn.',
        'not_ready' => 'Form chưa được cấu hình xong. Gọi ' . HOTLINE . ' để được báo giá ngay.',
        'mail'      => 'Chưa gửi được yêu cầu do lỗi máy chủ thư. Gọi ' . HOTLINE . ' để được báo giá ngay.',
    ],
    'en' => [
        'method'    => 'This page only accepts submissions from the quote form.',
        'rate'      => 'You have sent %d requests in the last %d minutes. Call ' . HOTLINE . ' or try again later.',
        'name'      => 'Enter your full name so Như Tín knows who to ask for when calling back.',
        'phone'     => 'This phone number does not look right. Use a 10-digit Vietnamese number starting with 0, such as ' . HOTLINE . ', or an international number starting with +.',
        'need'      => 'Choose the option closest to your needs.',
        'not_ready' => 'The form is not fully set up yet. Call ' . HOTLINE . ' for a quote right away.',
        'mail'      => 'Your request could not be sent because of a mail server error. Call ' . HOTLINE . ' for a quote right away.',
    ],
];
$lang = ($_POST['lang'] ?? '') === 'en' ? 'en' : 'vi';

function msg(string $key): string
{
    global $lang;
    return MESSAGES[$lang][$key];
}

function respond(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function clean(string $value, int $max): string
{
    $value = trim(strip_tags($value));
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
    return mb_substr($value, 0, $max);
}

function normalize_phone(string $phone): string
{
    $p = preg_replace('/[\s.\-()]/', '', $phone) ?? '';
    if (str_starts_with($p, '00')) {
        $p = '+' . substr($p, 2);
    }
    if (str_starts_with($p, '+84')) {
        $p = '0' . substr($p, 3);
    } elseif (str_starts_with($p, '84') && strlen($p) === 11) {
        $p = '0' . substr($p, 2);
    }
    return $p;
}

// Số Việt Nam, hoặc số quốc tế dạng +mã nước (cho khách nước ngoài)
function is_valid_phone(string $p): bool
{
    return (bool) preg_match('/^0(3|5|7|8|9)\d{8}$/', $p)
        || (bool) preg_match('/^02\d{9}$/', $p)
        || (bool) preg_match('/^\+[1-9]\d{7,14}$/', $p);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, ['ok' => false, 'error' => msg('method')]);
}

$config = require __DIR__ . '/config.php';

// 1. Honeypot: người thật không điền ô "website". Bot nhận phản hồi "thành công" giả.
if (!empty($_POST['website'])) {
    respond(200, ['ok' => true]);
}

// 2. Gửi quá nhanh sau khi mở trang thì coi là bot.
$startedMs = (int) ($_POST['started'] ?? 0);
if ($startedMs > 0 && (microtime(true) * 1000 - $startedMs) < ($config['min_fill_seconds'] * 1000)) {
    respond(200, ['ok' => true]);
}

// 3. Giới hạn tần suất theo IP.
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
if ($config['trust_proxy']) {
    // Render chạy sau Cloudflare: CF-Connecting-IP do Cloudflare ghi đè, khách không giả được
    $fwd = $_SERVER['HTTP_CF_CONNECTING_IP']
        ?? $_SERVER['HTTP_TRUE_CLIENT_IP']
        ?? explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '')[0];
    if (filter_var(trim($fwd), FILTER_VALIDATE_IP)) {
        $ip = trim($fwd);
    }
}
$rl = $config['rate_limit'];
$rlDir = $rl['dir'] !== '' ? $rl['dir'] : sys_get_temp_dir();
$rlFile = rtrim($rlDir, '/\\') . DIRECTORY_SEPARATOR . 'nt_quote_' . hash('sha256', $ip . '|nhutin-hallco') . '.json';
$now = time();
$hits = [];
if (is_file($rlFile)) {
    $hits = json_decode((string) file_get_contents($rlFile), true) ?: [];
    $hits = array_values(array_filter($hits, static fn($t) => is_int($t) && $t > $now - $rl['window']));
}
if (count($hits) >= $rl['max']) {
    respond(429, [
        'ok' => false,
        'error' => sprintf(msg('rate'), $rl['max'], intdiv($rl['window'], 60)),
    ]);
}

// 4. Kiểm tra dữ liệu.
$name  = clean((string) ($_POST['name'] ?? ''), 80);
$phone = normalize_phone(clean((string) ($_POST['phone'] ?? ''), 20));
$need  = clean((string) ($_POST['need'] ?? ''), 80);
$note  = clean((string) ($_POST['note'] ?? ''), 1000);
$page  = clean((string) ($_POST['page'] ?? ''), 300);

if (mb_strlen($name) < 2) {
    respond(422, ['ok' => false, 'field' => 'name', 'error' => msg('name')]);
}
if (!is_valid_phone($phone)) {
    respond(422, ['ok' => false, 'field' => 'phone', 'error' => msg('phone')]);
}
if (!in_array($need, NEEDS, true)) {
    respond(422, ['ok' => false, 'field' => 'need', 'error' => msg('need')]);
}

// 5. Gửi email.
$smtp = $config['smtp'];
if ($smtp['host'] === '' || str_contains($smtp['host'], 'example.com') || $smtp['password'] === '' || !$config['to']) {
    error_log('[send.php] SMTP chưa được cấu hình (biến môi trường SMTP_* / MAIL_TO hoặc config.php)');
    respond(500, ['ok' => false, 'error' => msg('not_ready')]);
}

require __DIR__ . '/lib/PHPMailer/Exception.php';
require __DIR__ . '/lib/PHPMailer/PHPMailer.php';
require __DIR__ . '/lib/PHPMailer/SMTP.php';

$e = static fn(string $s): string => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
$time = (new DateTime('now', new DateTimeZone('Asia/Ho_Chi_Minh')))->format('H:i d/m/Y');

$html = '<h2 style="font-family:Arial,sans-serif">Yêu cầu báo giá HALLCO® LIVE FLOOR®</h2>'
    . '<table cellpadding="6" style="font-family:Arial,sans-serif;font-size:15px;border-collapse:collapse">'
    . '<tr><td><b>Họ và tên</b></td><td>' . $e($name) . '</td></tr>'
    . '<tr><td><b>Số điện thoại</b></td><td><a href="tel:' . $e($phone) . '">' . $e($phone) . '</a></td></tr>'
    . '<tr><td><b>Nhu cầu</b></td><td>' . $e($need) . '</td></tr>'
    . '<tr><td><b>Ghi chú</b></td><td>' . nl2br($e($note !== '' ? $note : '(không có)')) . '</td></tr>'
    . '<tr><td><b>Thời gian</b></td><td>' . $e($time) . '</td></tr>'
    . '<tr><td><b>Trang gửi</b></td><td>' . $e($page) . '</td></tr>'
    . '<tr><td><b>Ngôn ngữ trang</b></td><td>' . ($lang === 'en' ? 'Tiếng Anh' : 'Tiếng Việt') . '</td></tr>'
    . '</table>';
$text = "Yêu cầu báo giá HALLCO LIVE FLOOR\n\nHọ và tên: $name\nSố điện thoại: $phone\nNhu cầu: $need\nGhi chú: "
    . ($note !== '' ? $note : '(không có)') . "\nThời gian: $time\nTrang gửi: $page\nNgôn ngữ trang: "
    . ($lang === 'en' ? 'Tiếng Anh' : 'Tiếng Việt') . "\n";

$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host = $smtp['host'];
    $mail->Port = (int) $smtp['port'];
    $mail->SMTPAuth = true;
    $mail->Username = $smtp['username'];
    $mail->Password = $smtp['password'];
    if ($smtp['secure'] === 'ssl') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    } elseif ($smtp['secure'] === 'tls') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    }
    $mail->CharSet = PHPMailer::CHARSET_UTF8;
    $mail->setFrom($smtp['from_email'], $smtp['from_name']);
    foreach ($config['to'] as $to) {
        $mail->addAddress($to);
    }
    $mail->Subject = 'Báo giá LIVE FLOOR: ' . $name . ' – ' . $phone;
    $mail->isHTML(true);
    $mail->Body = $html;
    $mail->AltBody = $text;
    $mail->send();
} catch (MailException $ex) {
    error_log('[send.php] Lỗi gửi mail: ' . $mail->ErrorInfo);
    respond(500, ['ok' => false, 'error' => msg('mail')]);
}

$hits[] = $now;
@file_put_contents($rlFile, json_encode($hits), LOCK_EX);

respond(200, ['ok' => true]);
