<?php
/**
 * Cấu hình gửi mail cho form báo giá (send.php).
 *
 * Giá trị đọc từ biến môi trường (Render: Dashboard → Environment), nên file này
 * KHÔNG chứa mật khẩu và đưa lên GitHub được. Chạy trên hosting không đặt được
 * biến môi trường (cPanel) thì điền thẳng vào giá trị mặc định bên dưới,
 * nhưng khi đó KHÔNG commit file này nữa.
 */
$env = static function (string $key, string $default = ''): string {
    $v = getenv($key);
    return $v === false || $v === '' ? $default : trim($v);
};

return [
    'smtp' => [
        'host'       => $env('SMTP_HOST'),              // ví dụ smtp.gmail.com hoặc mail.tenmien.vn
        'port'       => (int) $env('SMTP_PORT', '465'), // 465 dùng 'ssl', 587 dùng 'tls'
        'secure'     => $env('SMTP_SECURE', 'ssl'),     // 'ssl' | 'tls' | ''
        'username'   => $env('SMTP_USERNAME'),
        'password'   => $env('SMTP_PASSWORD'),          // mật khẩu hoặc App Password
        'from_email' => $env('SMTP_FROM_EMAIL', $env('SMTP_USERNAME')),
        'from_name'  => $env('SMTP_FROM_NAME', 'Website HALLCO – Như Tín'),
    ],

    // Danh sách email nhận yêu cầu báo giá, cách nhau bằng dấu phẩy
    'to' => array_values(array_filter(array_map('trim', explode(',', $env('MAIL_TO'))))),

    // Giới hạn tần suất gửi theo IP
    'rate_limit' => [
        'max'    => 3,     // số lần gửi tối đa
        'window' => 600,   // trong bao nhiêu giây (600 = 10 phút)
        'dir'    => '',    // để trống: dùng thư mục tạm của hệ thống
    ],

    // Đứng sau proxy (Render, Cloudflare…) thì lấy IP khách từ header của proxy.
    // Chỉ bật khi chắc chắn có proxy phía trước, nếu không khách tự đặt header để né giới hạn.
    'trust_proxy' => $env('TRUST_PROXY') === '1',

    // Thời gian tối thiểu (giây) từ lúc mở trang đến lúc gửi; nhanh hơn coi là bot
    'min_fill_seconds' => 3,
];
