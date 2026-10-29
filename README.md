# Website HALLCO® LIVE FLOOR® – Như Tín

Website nhiều trang giới thiệu Như Tín là đại lý ủy quyền HALLCO® tại Việt Nam. HTML, CSS và JavaScript thuần: **tải cả thư mục lên hosting là chạy**, không cần Node hay Python trên máy chủ. Form báo giá cần PHP 8.0 trở lên (hoặc dùng phương án Google Sheet, không cần PHP).

## Các trang

| File | Nội dung |
|---|---|
| `index.html` | Trang chủ: video hero, dải thanh sàn, tóm tắt mọi chủ đề, form báo giá |
| `cach-hoat-dong.html` | Chu trình 3 bước (mô phỏng tương tác), nguyên lý ma sát, Accelerator™, cấu tạo bộ sàn, nạp/xả hàng, so với nâng ben, bạt quét đáy |
| `san-pham.html` | Tổng quan sản phẩm, so sánh bộ dẫn động, bảng chọn theo loại hàng |
| `san-pham-i-series.html` | i-4000 và i-6000: thông số đầy đủ, thanh sàn tương thích, yêu cầu hệ thủy lực |
| `san-pham-w-floor.html` | W Floor™ kín nước và bộ dẫn động BRUTE™ |
| `san-pham-thanh-san.html` | Các profile thanh sàn nhôm, sàn nhựa, ổ trượt, cách đo khi thay |
| `san-pham-he-thong-co-dinh.html` | Hệ LIVE FLOOR® cố định cho hầm chứa, kho cấp liệu lò hơi |
| `ung-dung.html` | Từng loại hàng (dăm gỗ, mùn cưa, trấu, vỏ điều, nông sản, thức ăn chăn nuôi, rác, phế liệu, compost, than) và cấu hình gợi ý |
| `bao-hanh.html` | Điều kiện bảo hành i-Series đầy đủ, quy trình đăng ký |
| `hoi-dap.html` | 20 câu hỏi chia 5 chủ đề (có dữ liệu FAQPage cho Google) |
| `about.html` | Về Như Tín, quan hệ đại lý ủy quyền, mạng lưới HALLCO |
| `lien-he.html` | Form báo giá, thông tin liên hệ, việc cần chuẩn bị |
| `404.html` | Trang lỗi |

**Bản tiếng Anh:** 12 trang tương ứng nằm trong thư mục `en/` (cùng tên file, ví dụ `en/san-pham-i-series.html`). Nút **VI | EN** ở góc phải header chuyển sang đúng trang tương ứng của ngôn ngữ kia. Mỗi trang có thẻ `hreflang` để Google hiển thị đúng bản cho người tìm bằng tiếng Việt hay tiếng Anh, và cả 24 trang đều có trong `sitemap.xml`. Trang 404 chỉ có bản tiếng Việt.

Mọi số liệu kỹ thuật lấy từ tài liệu chính thức của HALLCO (trang web, tài liệu sản phẩm và bảo hành). Nguồn ghi trong `assets/SOURCES.md`.

## Cấu trúc thư mục

```
/
├── *.html                  13 trang đã build, đây là thứ được upload  ← KHÔNG sửa trực tiếp
├── _src/                   Nguồn của các trang  ← SỬA Ở ĐÂY
│   ├── layout.html         Khung chung: <head>, header, menu, mã GA4
│   ├── partials/           Khối dùng chung: footer, form, CTA, con dấu, bảng cấu hình, chatbot...
│   ├── pages/              Nội dung riêng từng trang
│   ├── chatbot/kb.json     Kho kiến thức bổ sung cho Trợ lý Như Tín
│   └── en/                 Bản tiếng Anh: layout.html, partials/, pages/, chatbot/kb.json
├── tools/build.py          Ghép _src thành *.html và sitemap.xml (Python 3.8+, không cần cài thêm gì)
├── send.php, config.php    Form gửi mail SMTP (PHPMailer), cấu hình đọc từ biến môi trường
├── Dockerfile, render.yaml Chạy trên Render (Apache + PHP)
├── css/style.css           Toàn bộ giao diện (đã gồm khai báo font)
├── js/main.js              Menu, mô phỏng thanh sàn, đếm số, form, GA4
├── js/chatbot.js           Trợ lý Như Tín (chatbot tự trả lời)
├── js/chatbot-kb.js        Dữ liệu chatbot tiếng Việt, sinh tự động  ← KHÔNG sửa trực tiếp
├── js/chatbot-kb-en.js     Dữ liệu chatbot tiếng Anh, sinh tự động  ← KHÔNG sửa trực tiếp
├── en/                     12 trang tiếng Anh đã build  ← KHÔNG sửa trực tiếp
├── assets/                 img, video, fonts, icons, docs (PDF bảo hành), SOURCES.md
├── lib/PHPMailer/          Thư viện PHPMailer 6.9.3 (không cần Composer)
├── google-apps-script/     Mã cho phương án ghi vào Google Sheet
├── docs/                   Kế hoạch thiết kế
├── sitemap.xml             Sinh tự động bởi tools/build.py
├── robots.txt, favicon.ico, site.webmanifest
└── .htaccess               Nén, cache, trang 404, chặn file nhạy cảm (Apache)
```

## Sửa nội dung

Header, menu và footer giống nhau trên 13 trang, nên chúng được viết **một lần** trong `_src/` và ghép lại bằng script:

1. Sửa file trong `_src/` (ví dụ đổi số điện thoại ở `_src/partials/footer.html`, sửa một đoạn ở `_src/pages/ung-dung.html`).
2. Chạy: `python tools/build.py`
3. Upload các file `*.html` và `sitemap.xml` vừa được tạo lại.

Nếu sửa trực tiếp file `*.html` ở thư mục gốc, lần build sau sẽ ghi đè. Sửa CSS (`css/style.css`), JS (`js/main.js`), ảnh hay PHP thì không cần build.

Mỗi trang trong `_src/pages/` mở đầu bằng một khối cấu hình (tiêu đề, mô tả SEO, mục menu đang chọn, breadcrumb, loại dữ liệu có cấu trúc). Thêm trang mới: chép một trang có sẵn, đổi khối cấu hình và nội dung, thêm vào menu ở biến `NAV` trong `tools/build.py` nếu cần, rồi build.

Trong nội dung có hai cú pháp đặc biệt:

- `{{cta: Câu dẫn}}`: chèn dải "Nhận báo giá" với câu dẫn đó
- `{{include: ten-khoi}}`: chèn `_src/partials/ten-khoi.html`

Các cụm không được ngắt dòng ("i-Series", "i-4000", "rơ-moóc", số hotline…) được script tự bọc trong `<span class="nw">`. Muốn thêm cụm mới, sửa biến `NOWRAP` trong `tools/build.py`.

Câu hỏi trong trang Hỏi đáp (thẻ `<details data-faq-item>`) được build tự động thành dữ liệu FAQPage cho Google, nên nội dung đánh dấu luôn khớp với nội dung hiển thị.

### Bản tiếng Anh

Bản tiếng Anh có nguồn riêng trong `_src/en/`, build cùng lúc với bản tiếng Việt:

- `_src/en/pages/`: nội dung từng trang, **cùng tên file** với trang tiếng Việt tương ứng. Sửa nội dung tiếng Việt thì nhớ sửa luôn trang tiếng Anh cùng tên.
- `_src/en/partials/`: footer, form, CTA, chatbot... bằng tiếng Anh. Khối nào không có ở đây (ví dụ `sprite.html`) thì dùng bản trong `_src/partials/`.
- `_src/en/layout.html`: khung trang tiếng Anh. Khi bật GA4 thì bỏ comment ở **cả hai** layout.
- Chữ trên menu tiếng Anh nằm ở biến `LANGS` trong `tools/build.py`.

Đường dẫn ảnh, CSS, JS trong nguồn tiếng Anh viết giống bản tiếng Việt (`assets/...`); build tự thêm `../` cho các trang trong `en/`.

Form tiếng Anh hiển thị chữ tiếng Anh nhưng **giá trị gửi đi vẫn là tiếng Việt**, nên email (hoặc Google Sheet) về Như Tín đọc như bình thường, có thêm dòng "Ngôn ngữ trang: Tiếng Anh" để biết khách có thể là người nước ngoài. Form chấp nhận cả số Việt Nam lẫn số quốc tế dạng `+mã nước` (ví dụ `+44 20 7946 0958`). Thông báo lỗi ở trình duyệt, `send.php` và Apps Script đều có bản tiếng Anh.

### Trợ lý Như Tín (chatbot)

Nút tròn có logo Như Tín ở góc phải dưới, trên nút Zalo và Gọi. Chatbot **không dùng AI hay API nào**, chạy hoàn toàn trên trình duyệt: nó so câu khách gõ (có dấu hay không dấu, viết tắt kiểu "ko", "dc", "bn" đều hiểu) với kho câu trả lời soạn sẵn và chọn câu khớp nhất. Không tìm được câu đủ khớp thì nó không đoán, mà mời khách gọi hotline, nhắn Zalo hoặc gửi form báo giá. Lịch sử trò chuyện được giữ khi khách chuyển trang (trong cùng phiên trình duyệt).

Trên trang tiếng Anh, chatbot nói tiếng Anh và dùng kho `_src/en/chatbot/kb.json` cùng 20 câu ở `_src/en/pages/hoi-dap.html` (build ra `js/chatbot-kb-en.js`). Cách thêm câu trả lời giống hệt bản tiếng Việt, chỉ khác từ khóa viết bằng tiếng Anh, chữ thường.

Kho câu trả lời tiếng Việt gồm hai phần, `tools/build.py` gộp thành `js/chatbot-kb.js`:

1. **20 câu ở trang Hỏi đáp**, lấy tự động. Sửa câu trả lời trong `_src/pages/hoi-dap.html` là chatbot đổi theo.
2. **Các mục riêng** trong `_src/chatbot/kb.json` (`entries`): thông số i-Series, W Floor, thanh sàn, từng loại hàng, quy trình, liên hệ...

Thêm một câu trả lời: thêm một mục vào `entries` với `q` (câu hỏi), `a` (câu trả lời, được dùng thẻ `<b>`, `<a>`), `keywords` (các cách khách hay hỏi, viết **không dấu, chữ thường**, ví dụ `"bao nhieu tien"`), tùy chọn `link` (trang xem chi tiết), `actions` (`"quote"` hoặc `"contact"` để hiện nút báo giá, gọi, Zalo) và `related` (câu hỏi gợi ý tiếp). Muốn câu hỏi đáp nào bắt được thêm cách hỏi, thêm từ khóa vào `faq_keywords`. Sau đó chạy `python tools/build.py`. Câu trả lời phải đúng như nội dung website, không thêm số liệu chưa kiểm chứng.

Câu gợi ý hiện lúc mở chat và lời chào nằm ở đầu `js/chatbot.js` (biến `CHIPS`, `GREETING`).

## 1. Việc phải làm trước khi đưa lên mạng

Tìm và thay các giá trị tạm sau **trong `_src/`**, rồi chạy `python tools/build.py`:

| Tìm | Thay bằng | Có trong |
|---|---|---|
| `[EMAIL]`, `[MST]` | Thông tin công ty | `_src/partials/footer.html`, `_src/pages/lien-he.html`, biến `ORG`/`BUSINESS` trong `tools/build.py`; email nhận báo giá đặt ở biến môi trường `MAIL_TO` |
| `https://hallco.nhutin.com` | Tên miền thật (**tên miền này chỉ là giả định**) | Biến `SITE` trong `tools/build.py`, và `robots.txt` |
| `G-XXXXXXX` | Mã GA4 | `_src/layout.html` |

## 2. Đổi thông tin liên hệ

Hotline `0907 917 301` xuất hiện ở nhiều chỗ, luôn theo một định dạng:

- Chữ hiển thị: `0907 917 301`
- Liên kết gọi: `tel:+84907917301`
- Zalo: `https://zalo.me/0907917301`
- JSON-LD: `+84907917301` (biến `PHONE_TEL` trong `tools/build.py`)
- `js/main.js` (biến `HOTLINE`), `send.php` (hằng `HOTLINE`), `google-apps-script/Code.gs`: dùng trong thông báo lỗi

Khi đổi số, tìm `0907 917 301`, `0907917301` và `84907917301` trong `_src/`, `tools/`, `js/`, `send.php`, rồi build lại.

## 3. Cấu hình form

Form có 3 trường bắt buộc (Họ tên, Số điện thoại, Nhu cầu/loại xe) và 1 trường Ghi chú. Số điện thoại được kiểm tra theo định dạng Việt Nam: di động 10 số bắt đầu bằng 03, 05, 07, 08, 09; cố định 11 số bắt đầu bằng 02; chấp nhận dạng `+84`.

Các nút "Tư vấn" trên trang sản phẩm mở `lien-he.html?nhu-cau=...` và tự chọn sẵn nhu cầu (danh sách khóa ở biến `NEED_FROM_LINK` trong `js/main.js`).

Chống spam gồm: ô honeypot ẩn; từ chối nếu gửi trong vòng 3 giây sau khi mở trang; giới hạn 3 lần trong 10 phút theo IP (PHP) hoặc theo số điện thoại (Google Sheet); trình duyệt chặn gửi lại trong 60 giây.

Chọn phương án ở đầu `js/main.js`:

```js
var FORM_CONFIG = {
  mode: 'php',          // 'php' hoặc 'gsheet'
  phpEndpoint: 'send.php',
  gsheetEndpoint: ''    // URL Web App của Google Apps Script
};
```

### Phương án A: gửi email qua SMTP (mặc định)

1. Đặt các biến môi trường `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL` và `MAIL_TO` (nhiều email cách nhau bằng dấu phẩy). Trên Render đặt ở *Environment*; trên cPanel không đặt được biến thì điền thẳng giá trị mặc định trong `config.php` và **không commit** file đó.
   - **Gmail / Google Workspace:** `smtp.gmail.com`, cổng `465`, `ssl`. Mật khẩu là **App Password** (Tài khoản Google → Bảo mật → Xác minh 2 bước → Mật khẩu ứng dụng), không phải mật khẩu đăng nhập.
   - **Email theo tên miền trên cPanel:** thường là `mail.tenmien.vn`, cổng `465`, `ssl`. Xem mục *Email Accounts → Connect Devices* trong cPanel.
2. Giữ `mode: 'php'` trong `js/main.js`.
3. Gửi thử một yêu cầu. Nếu thất bại, trang hiện thông báo kèm số hotline; lỗi chi tiết được ghi vào error log của PHP.

`send.php` từ chối gửi nếu chưa có máy chủ SMTP, mật khẩu hoặc email nhận, để không âm thầm làm mất yêu cầu báo giá.

### Phương án B: ghi vào Google Sheet

1. Tạo một Google Sheet mới.
2. Trong Sheet: *Tiện ích mở rộng → Apps Script*. Xóa mã mẫu, dán toàn bộ `google-apps-script/Code.gs`.
3. Nếu muốn nhận email thông báo, điền `NOTIFY_EMAIL` ở đầu file.
4. *Triển khai → Tùy chọn triển khai mới → Ứng dụng web*:
   - Thực thi dưới dạng: **Tôi**
   - Người có quyền truy cập: **Bất kỳ ai**
5. Cấp quyền khi được hỏi, rồi sao chép URL Web App (dạng `https://script.google.com/macros/s/.../exec`).
6. Trong `js/main.js`: đặt `mode: 'gsheet'` và dán URL vào `gsheetEndpoint`.

Mỗi lần sửa `Code.gs`, phải *Quản lý triển khai → Chỉnh sửa → Phiên bản mới* thì thay đổi mới có hiệu lực.

### Chuyển qua lại giữa hai phương án

Chỉ cần đổi `mode` trong `js/main.js`. Hai phương án dùng chung giao diện, cách kiểm tra dữ liệu và định dạng phản hồi (`{"ok": true}`), nên không phải sửa HTML.

## 4. Chèn mã GA4

1. Tạo luồng dữ liệu web trong Google Analytics, lấy mã đo lường dạng `G-ABC123XYZ`.
2. Trong `_src/layout.html`, thay `G-XXXXXXX` (2 chỗ) bằng mã thật, **bỏ cặp `<!--` `-->`** bao quanh khối script, rồi chạy `python tools/build.py`. Mã sẽ có trên cả 13 trang.

Các sự kiện đã được gửi sẵn khi GA4 hoạt động:

| Sự kiện | Khi nào |
|---|---|
| `click_call` | Bấm bất kỳ liên kết gọi điện nào |
| `click_zalo` | Bấm bất kỳ liên kết Zalo nào |
| `generate_lead` | Gửi form báo giá thành công (kèm `need`) |
| `chat_open` | Mở khung Trợ lý Như Tín (kèm `chat_lang`: `vi` hoặc `en`) |
| `chat_question` | Khách hỏi chatbot (kèm `chat_match`: mã câu trả lời, `fallback` là câu chưa trả lời được) |
| `chat_quote` | Bấm "Nhận báo giá" trong khung chat |

Trong GA4, đánh dấu `generate_lead` là *Sự kiện chính* (Key event) để theo dõi chuyển đổi.

## 5. Đưa lên hosting

### Render: bản demo giao diện (đang dùng)

`render.yaml` hiện tạo **Static Site miễn phí**: không cần PHP, không bị tắt khi không có truy cập. Form ở chế độ `mode: 'demo'` trong `js/main.js`: vẫn kiểm tra dữ liệu nhưng không gửi đi đâu, chỉ báo "bản demo" kèm hotline. Triển khai: Render → *New → Blueprint* → chọn repo → *Apply*.

Khi cần form chạy thật: đổi `mode` sang `'php'` (dùng Docker bên dưới) hoặc `'gsheet'` (giữ Static Site).

### Render (Docker), khi cần form gửi mail

Repo đã có `Dockerfile` (PHP 8.3 + Apache, dùng luôn `.htaccess`) và `render.yaml`. `.dockerignore` loại `_src/`, `tools/`, `docs/`, `google-apps-script/` và file `.md` khỏi máy chủ.

1. Đẩy code lên GitHub.
2. Render → *New → Web Service* → chọn repo → *Language: Docker*, rồi tự thêm các biến ở *Environment*, kèm `TRUST_PROXY=1`.
3. Gắn tên miền ở *Settings → Custom Domains*; Render tự cấp SSL.

Lưu ý:

- **Gói Free của Render chặn cổng SMTP (25, 465, 587)**, nên phương án A không gửi được mail. Cần gói trả phí (Starter trở lên), hoặc dùng phương án B (Google Sheet) với Static Site miễn phí.
- Gói Free cũng tắt máy chủ sau ~15 phút không có truy cập; lượt vào đầu tiên sau đó mất khoảng 1 phút.
- `TRUST_PROXY=1` để `send.php` lấy đúng IP khách sau proxy của Render; thiếu biến này, mọi khách bị tính chung một IP và giới hạn 3 lần/10 phút áp cho cả website.
- Mỗi lần push lên nhánh `main`, Render tự build lại. Nhớ chạy `python tools/build.py` và commit các file `*.html` trước khi push.

### cPanel (Apache)

1. *File Manager* → vào `public_html` (hoặc thư mục của tên miền phụ).
2. Nén cả thư mục dự án thành `.zip` trên máy, tải lên, chọn *Extract*. Đảm bảo `index.html` nằm ngay trong `public_html`, không nằm trong thư mục con.
3. Bật hiển thị file ẩn (*Settings → Show Hidden Files*) để kiểm tra `.htaccess` đã có.
4. *Select PHP Version* (hoặc *MultiPHP Manager*): chọn PHP 8.0 trở lên, bật extension `openssl` và `mbstring`.
5. Điền SMTP trong `config.php` trực tiếp trên File Manager (xem mục 3).
6. Cài SSL miễn phí: *SSL/TLS Status → Run AutoSSL*.

### VPS (Nginx + PHP-FPM)

```bash
sudo apt install nginx php-fpm php-mbstring
sudo mkdir -p /var/www/hallco && sudo cp -r ./* /var/www/hallco/
sudo chown -R www-data:www-data /var/www/hallco
```

`/etc/nginx/sites-available/hallco` (thay `tenmien.vn` và phiên bản `php8.x-fpm`):

```nginx
server {
    listen 80;
    server_name tenmien.vn www.tenmien.vn;
    root /var/www/hallco;
    index index.html;

    gzip on;
    gzip_types text/css application/javascript image/svg+xml application/json application/manifest+json application/xml;

    location ~ ^/(config\.php|README\.md|lib/|docs/|google-apps-script/|_src/|tools/) { deny all; }
    error_page 404 /404.html;

    location ~* \.(webp|png|jpg|ico|mp4|webm|woff2|svg|pdf)$ { expires 1y; add_header Cache-Control "public"; }
    location ~* \.(css|js)$ { expires 30d; }

    location = /send.php {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
    }
    location ~ \.php$ { deny all; }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/hallco /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install certbot python3-certbot-nginx && sudo certbot --nginx -d tenmien.vn -d www.tenmien.vn
```

Sau khi lên mạng: gửi `sitemap.xml` trong Google Search Console và kiểm tra dữ liệu có cấu trúc bằng [Rich Results Test](https://search.google.com/test/rich-results).

### Xem thử trên máy

```bash
php -S 127.0.0.1:8000
```

Mở `http://127.0.0.1:8000`. Server này không nén và không cache, nên tốc độ đo được sẽ thấp hơn trên hosting thật.

## 6. Checklist trước khi bàn giao

Đánh dấu `[x]` là đã kiểm tra trong lúc làm; `[ ]` là việc còn lại cho người triển khai.

### Responsive
- [x] Không tràn ngang ở 360, 768, 1280, 1920px trên cả 13 trang (đo bằng trình duyệt tự động); bảng dữ liệu rộng cuộn ngang trong khung riêng
- [x] Menu hamburger dưới 1200px, có menu con "Sản phẩm" mở bằng nút; trên desktop menu con mở khi rê chuột hoặc dùng phím Tab; đóng menu bằng phím Esc
- [x] Cụm nút Gọi ngay và Zalo nổi ở góc phải dưới trên mọi kích thước; dưới 480px thu thành nút tròn
- [ ] Thử trên điện thoại thật: iPhone Safari và Android Chrome (video hero tự phát khi tắt tiếng)

### Tốc độ
- [x] Ảnh WebP, có `srcset` bản 640px, lazy-load dưới màn hình đầu, có `width`/`height` (CLS ≈ 0)
- [x] Font tự host, chỉ preload 2 file cho tiêu đề; video hero tự chạy và lặp lại (MP4 2,2MB / WebM 1,7MB), có ảnh poster hiện ngay khi chờ tải
- [x] Lighthouse desktop (trang chủ, Cách hoạt động, i-Series, Ứng dụng): Hiệu năng 99–100, Hỗ trợ tiếp cận, Phương pháp hay, SEO đều 100
- [ ] Lighthouse mobile: Hỗ trợ tiếp cận, Phương pháp hay, SEO đều 100, nhưng **Hiệu năng mới đạt 71–87** tùy trang khi đo trên máy phát triển (dao động mạnh giữa các lần đo). Cần đo lại bằng PageSpeed Insights sau khi lên hosting thật có HTTP/2 và gzip.

### SEO
- [x] Mỗi trang đúng một H1 (kiểm tra tự động), mỗi khối một H2; breadcrumb trên mọi trang con
- [x] Title, meta description (~150 ký tự, có "sàn tự đổ", "live floor", "đại lý ủy quyền HALLCO"), canonical
- [x] Open Graph và Twitter Card, ảnh OG 1200×630
- [x] JSON-LD: Organization trên mọi trang; LocalBusiness ở trang chủ, Về Như Tín, Liên hệ; Product ở trang chủ và 4 trang sản phẩm; BreadcrumbList ở trang con; FAQPage chỉ ở trang Hỏi đáp, sinh tự động từ 20 câu hiển thị
- [x] `sitemap.xml`, `robots.txt`, favicon, manifest
- [x] Mọi ảnh có `alt` tiếng Việt
- [ ] Thay tên miền giả định `hallco.nhutin.com`

### Form
- [x] Kiểm tra phía trình duyệt: báo lỗi từng ô, nói rõ cách sửa
- [x] `send.php`: đã thử phương thức GET, số sai, nhu cầu sai, honeypot, gửi quá nhanh, số dạng +84
- [ ] Đặt biến môi trường SMTP thật (hoặc điền `config.php`) và gửi thử một yêu cầu đến hộp thư
- [ ] (Nếu dùng) Triển khai Apps Script và gửi thử vào Google Sheet

### Liên kết
- [x] Không có link nội bộ chết hay neo sai trên cả 13 trang (kiểm tra tự động); không có `href="#!"`; không lỗi 404 hay lỗi console khi tải trang; mọi ảnh tải được
- [x] Liên kết ngoài mở tab mới với `rel="noopener"`
- [ ] Kiểm tra lại hotline và Zalo bằng điện thoại thật

### Bản tiếng Anh
- [x] 12 trang tiếng Anh: không link chết (25 đường dẫn nội bộ), không lỗi console, không tràn ngang ở 390 và 1280 px, không sót chữ tiếng Việt (trừ tên riêng như "Như Tín")
- [x] Nút VI | EN chuyển đúng trang tương ứng hai chiều; header vừa từ 320 px đến màn hình lớn
- [x] Form tiếng Anh: báo lỗi bằng tiếng Anh, nhận số quốc tế dạng +mã nước
- [ ] Người thạo tiếng Anh (tốt nhất là người trong ngành vận tải) đọc soát bản dịch

### Chatbot
- [x] Thử 30 câu hỏi kiểu khách hay gõ (có dấu, không dấu, viết tắt, số điện thoại, câu ngoài lề): câu nào cũng ra đúng câu trả lời, câu ngoài lề chuyển sang mời gọi hotline
- [x] Giữ lịch sử khi chuyển trang; Esc đóng khung và trả focus về nút; mobile mở toàn màn hình, không tràn ngang
- [x] Chatbot tiếng Anh: thử 12 câu (giá, xe cũ, i-4000 với i-6000, bảo hành, dăm gỗ, trấu, rác ướt, pallet, câu ngoài lề…), đều ra đúng câu trả lời
- [ ] Sau khi chạy GA4 một thời gian, lọc `chat_question` có `chat_match = fallback` để biết bao nhiêu câu hỏi chatbot chưa trả lời được. Nội dung khách gõ không được gửi lên GA4 (tránh lộ số điện thoại), nên hỏi thêm bộ phận bán hàng khách hay hỏi gì rồi bổ sung vào `kb.json`

### Chính tả và nhãn hiệu
- [x] Viết đúng "HALLCO®" và "LIVE FLOOR®" ở tiêu đề, H1, H2 và các lần nhắc chính (nhãn nhỏ và chữ thay thế của ảnh viết không kèm ®)
- [x] Không nhắc tới thương hiệu sàn tự đổ nào khác
- [x] Không dùng số liệu tự đặt: thông số kỹ thuật, bảo hành, yêu cầu thủy lực đều lấy từ tài liệu HALLCO (danh sách trong `assets/SOURCES.md`); chỗ hãng không công bố (sàn nhựa, vỏ hạt điều, than) được ghi rõ là Như Tín tư vấn sau khảo sát
- [ ] Người phụ trách nội dung của Như Tín đọc soát lần cuối

### Còn lại
- [ ] Thay `[EMAIL]`, `[MST]`, `G-XXXXXXX`
- [x] Ảnh trấu và than đã thay bằng ảnh thật (`ung-dung-trau.webp`, `ung-dung-than.webp`). Hai ảnh này khá nhỏ, nếu có bản lớn hơn (từ 1000px) nên thay để nét hơn trên desktop
- [ ] Xác nhận với HALLCO việc dùng logo, hình ảnh và video của hãng trên trang của đại lý
- [ ] Xác nhận điều kiện bảo hành cho W Floor, BRUTE, thanh sàn và hệ cố định (trang web hiện chỉ nêu bảo hành i-Series)
- [ ] Đối chiếu số cơ sở của tập đoàn: brief ghi 7, trang "About" của HALLCO ghi 6 (trang web đang dùng số 7 theo brief)
