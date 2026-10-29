# PROMPT: XÂY DỰNG LANDING PAGE ĐẠI LÝ ỦY QUYỀN HALLCO® TẠI VIỆT NAM

## 1. Vai trò

Bạn là một web developer kiêm UI designer và copywriter cấp senior, chuyên làm landing page B2B cho ngành công nghiệp và vận tải. Nhiệm vụ: xây dựng hoàn chỉnh một landing page tiếng Việt, sẵn sàng đưa lên máy chủ.

## 2. Bối cảnh

- **Khách hàng:** Công ty Cổ phần Như Tín (NHUTIN), website chính là https://nhutin.com
- **Vai trò của Như Tín:** đại lý ủy quyền của **HALLCO Industries, Inc.** (Mỹ) tại Việt Nam.
- **Sản phẩm:** hệ thống sàn tự đổ **HALLCO LIVE FLOOR®**. Đây là hệ thống thủy lực gồm nhiều thanh sàn chuyển động tuần tự, dùng để xếp và dỡ hàng rời ra khỏi thùng xe, rơ-moóc hoặc bồn chứa.
- **Website tham khảo về bố cục** (cùng chủ, cùng phong cách): https://thungxetudo.com. Chỉ tham khảo cấu trúc. **Không** dùng lại bất kỳ nội dung, số liệu hay tên thương hiệu nào của trang đó.
- **Website gốc của hãng:** https://www.hallcoindustries.com

## 3. Thông tin về HALLCO được dùng trên trang (đã xác minh)

- Là hãng phát minh ra hệ thống: nộp bằng sáng chế đầu tiên năm **1968** cho hệ sàn chuyển động qua lại theo phương ngang. Khẩu hiệu: "The Original LIVE FLOOR®".
- Trụ sở tại **Tillamook, Oregon (Mỹ)**, có trung tâm phân phối và dịch vụ ở North Carolina và Texas.
- Tập đoàn có **5 công ty thành viên, 4 châu lục, 7 cơ sở, 2 nhà máy sản xuất**, hơn 50 năm kinh nghiệm.
- Các dòng sản phẩm:
  - **i-Series / i-6000**: bộ dẫn động kín bên trong
  - **W Floor**: sàn chống rò rỉ cho xe chở rác
  - **Sàn nhựa** có bằng sáng chế
  - **Hệ thống cố định** cho bồn chứa và hầm chứa
- Lắp vừa gần như mọi loại rơ-moóc, xe tải, thùng chứa, **cả xe mới lẫn xe cũ**.
- **Bảo hành:** 2 năm cho toàn hệ thống i-Series. Phần thủy lực được bảo hành 3 năm nếu có bộ lọc cao áp do OEM hoặc **đại lý ủy quyền** lắp đặt. Đây là lý do chính để khách mua qua Như Tín.
- **Về Như Tín:** hoạt động trong lĩnh vực vận tải hàng rời từ năm 2010, hiểu rõ khó khăn khi bốc dỡ hàng từ xe xuống kho bãi và nhà máy.

**Không tự bịa số liệu** (năng suất gấp X lần, tiết kiệm Y%...). Nếu cần một con số mà danh sách trên không có, hãy tìm trong tài liệu chính thức của HALLCO. Không tìm được thì diễn đạt định tính.

## 4. Nguồn hình ảnh, video, logo: tự tìm trên web

Tự tìm và tải về, ưu tiên nguồn chính thức của hãng:

1. https://www.hallcoindustries.com: logo, ảnh sản phẩm, video hero (đoạn render 3D xe đầu kéo đỏ kéo thùng moóc vàng chạy vào khung hình), ảnh các ngành ứng dụng
2. https://www.hallco.eu và https://hallco-industries.odoo.com: ảnh, catalogue PDF, sơ đồ cấu tạo sàn
3. Kênh YouTube chính thức của HALLCO: video mô phỏng cách hoạt động. Nhúng bằng iframe, hoặc dùng làm video hero nếu tải được.
4. Ảnh về Như Tín lấy từ https://nhutin.com và https://thungxetudo.com (các ảnh về công ty, đội xe).

Yêu cầu khi xử lý tài nguyên:
- Lưu toàn bộ vào thư mục `assets/` của dự án, **không hotlink** sang website khác.
- Đặt tên file rõ nghĩa, ví dụ `hallco-logo.svg`, `hero-truck.mp4`, `ung-dung-dam-go.webp`.
- Ảnh chuyển sang **WebP**, chiều rộng tối đa 1920px. Video hero nén còn khoảng **2–4MB**, xuất cả MP4 và WebM, kèm một ảnh poster.
- Logo giữ đúng màu và tỉ lệ gốc, không chỉnh sửa.
- Lập file `assets/SOURCES.md` ghi URL nguồn của từng file.
- Không tìm được ảnh phù hợp cho mục nào thì để ảnh tạm có ghi chú `<!-- TODO: thay ảnh -->`. Không dùng ảnh của thương hiệu khác.

## 5. Nhận diện và thiết kế

- **Màu:** lấy theo logo HALLCO, gồm xanh lá (khoảng `#2E9B47`) và xanh đậm (khoảng `#0B4D2A`), kết hợp trắng và xám than. Lấy mã màu chính xác từ logo thật.
- **Font:** "Be Vietnam Pro" (Google Fonts), hiển thị dấu tiếng Việt chuẩn.
- **Phong cách:** công nghiệp, sạch, đáng tin, nhiều khoảng trắng, ảnh lớn. Hai thanh sọc chéo trong logo HALLCO có thể dùng làm họa tiết trang trí phụ.
- Phải **khác biệt rõ** với thungxetudo.com về màu và hình ảnh, để khách không nhầm hai thương hiệu.

## 6. Cấu trúc trang

Trang chính `index.html` là một trang cuộn dài, gồm các khối theo thứ tự:

1. **Header cố định:** logo HALLCO cạnh logo Như Tín (hoặc dòng chữ "Đại lý ủy quyền"), menu neo tới các khối, nút "Nhận báo giá". Trên mobile dùng menu hamburger.
2. **Hero:** video xe tải phát tự động (muted, loop, playsinline, có poster). Tiêu đề H1: "Đại lý ủy quyền HALLCO® LIVE FLOOR® tại Việt Nam". Thêm một dòng phụ nêu giá trị chính, và 2 nút: **Gọi ngay**, **Nhận báo giá**.
3. **Thanh niềm tin:** 4 con số chạy hiệu ứng đếm khi cuộn tới: 1968 (năm phát minh), 4 (châu lục), 2 (nhà máy), 3 năm (bảo hành thủy lực).
4. **Cách hoạt động:** giải thích bằng 3 bước minh họa (các thanh sàn tiến lên cùng nhau → lùi về từng nhóm → hàng được đẩy ra ngoài). Có thể làm thêm một hình động bằng CSS hoặc SVG mô phỏng các thanh sàn.
5. **Lợi ích:** 6 thẻ có icon: xuống hàng nhanh, giảm nhân công, an toàn cho tài xế, không cần nâng ben (vận hành được dưới mái che, đường dây điện), lắp được xe cũ, xả hàng sạch.
6. **Ứng dụng tại Việt Nam:** lưới ảnh các loại hàng: dăm gỗ, mùn cưa, trấu, vỏ hạt điều, nông sản (ngô, sắn), thức ăn chăn nuôi, rác thải và phế liệu, than.
7. **Dòng sản phẩm:** các thẻ i-Series, W Floor, sàn nhựa, hệ thống cố định. Mỗi thẻ có ảnh, mô tả ngắn và nút "Tư vấn".
8. **Bảo hành chính hãng:** nêu rõ điều kiện bảo hành 2 và 3 năm, nhấn mạnh việc lắp qua đại lý ủy quyền Như Tín. Có một dấu (badge) "Đại lý ủy quyền".
9. **Về Như Tín:** hoạt động từ năm 2010, có ảnh công ty, link sang `about.html`.
10. **FAQ:** 8–10 câu dạng accordion, viết tiếng Việt tự nhiên, không theo kiểu dịch máy. Gợi ý câu hỏi: hệ thống là gì, giá bao nhiêu, xe cũ có lắp được không, thời gian lắp đặt bao lâu, bảo trì ra sao, phụ tùng có sẵn không, bảo hành thế nào, chở được những loại hàng nào, tải trọng ra sao, liên hệ thế nào.
11. **Form báo giá:** chỉ có 3 trường bắt buộc (Họ tên, Số điện thoại, Nhu cầu/loại xe) và 1 trường tùy chọn (Ghi chú). Kiểm tra số điện thoại theo định dạng Việt Nam. Gửi thành công thì hiện lời cảm ơn.
12. **Footer:** thông tin công ty Như Tín, hotline, Zalo, email, link tới nhutin.com, bavohatdieu.com và hallcoindustries.com, dòng bản quyền.

Thêm trang **`about.html`**, giới thiệu chi tiết Như Tín và quan hệ đối tác với HALLCO, dùng chung header và footer với trang chính.

## 7. Kỹ thuật landing page bắt buộc áp dụng

- Trong 3 giây đầu, khách phải hiểu trang nói về sản phẩm gì và của ai.
- Có cụm nút nổi cố định ở góc phải dưới, trên mọi kích thước màn hình: **Gọi ngay** (`tel:`) và **Zalo**.
- Nút CTA "Nhận báo giá" lặp lại sau mỗi 2–3 khối nội dung.
- Chuyển động dùng có chủ đích, theo mục 7A. Tôn trọng thiết lập `prefers-reduced-motion`.
- Thiết kế cho mobile trước, kiểm tra ở các độ rộng 360px, 768px, 1280px và 1920px.
- Tải nhanh: ảnh lazy-load, preload font, không dùng framework nặng. Mục tiêu Lighthouse ≥ 90 ở cả 4 hạng mục.
- Thứ bậc thị giác rõ ràng: một H1 duy nhất, mỗi khối một H2.

## 7A. Kỹ năng UI: áp dụng skill `frontend-design`

Nguồn: https://github.com/anthropics/skills/tree/main/skills/frontend-design. Nếu môi trường của bạn có skill này, hãy đọc file `SKILL.md` trước khi thiết kế. Nếu không có, làm theo các nguyên tắc tóm tắt dưới đây.

**Vai trò:** bạn là trưởng nhóm thiết kế của một studio nổi tiếng vì luôn tạo cho mỗi khách hàng một bản sắc riêng. Khách hàng này đã từ chối những đề xuất trông rập khuôn. Mọi lựa chọn về màu, chữ và bố cục phải xuất phát từ chính bản brief này.

**Lấy chất liệu từ ngành nghề:** thép, thủy lực, thanh sàn nhôm chạy song song, hàng rời (dăm gỗ, trấu, vỏ điều), xe đầu kéo, bến bãi nhà máy. Bản sắc thị giác phải đến từ những thứ này. Ví dụ: nhịp các thanh sàn có thể trở thành họa tiết hoặc lưới bố cục của cả trang.

**Hero:** mở đầu bằng thứ đặc trưng nhất của ngành, ở đây là video xe tải và chuyển động của sàn. Không dùng công thức mặc định "số to, nhãn nhỏ, gradient".

**Typography:**
- Dùng 1–2 họ font, chọn có chủ đích và hỗ trợ đầy đủ tiếng Việt. "Be Vietnam Pro" là gợi ý, có thể đổi nếu tìm được lựa chọn hợp hơn.
- Thang cỡ chữ rõ ràng, độ dài dòng dưới 80 ký tự.
- Tránh các dấu hiệu của trang do AI tạo: tô màu hoặc in nghiêng riêng một chữ trong tiêu đề; nhãn VIẾT HOA giãn chữ trên mỗi tiêu đề; nhãn trang trí thừa.

**Cấu trúc thị giác phải mang thông tin:**
- Chỉ đánh số 01/02/03 khi nội dung thật sự là một trình tự (ví dụ 3 bước "Cách hoạt động", tiến trình lắp đặt).
- Không băm mọi nội dung thành các thẻ bo góc giống hệt nhau, cùng một kiểu bóng đổ.

**Chuyển động:** ít và có chủ đích. Dồn vào **một khoảnh khắc chính**, ví dụ màn mở đầu với video và mô phỏng thanh sàn. Không làm hiệu ứng fade-slide cho mọi khối, không bắt mọi thẻ phải nổi lên khi hover. Chuyển động đáp lại thao tác của người dùng (mở FAQ, gửi form thành công) thì nên có.

**Tránh các lối thiết kế mặc định của AI:**
- Nền kem kết hợp chữ serif và màu đất nung
- Nền đen với một màu neon duy nhất
- Bố cục kiểu tờ báo
- Bộ thẻ kiểu SaaS với gradient trang trí
- Chuỗi meta nối bằng dấu "·"
- Mũi tên "→" gắn vào mọi nút

**Quy trình làm hai bước:**
1. Viết bản kế hoạch thiết kế ngắn gọn gồm: 4–6 màu đặt tên kèm mã hex; font và vai trò của từng font; ý tưởng bố cục mô tả bằng wireframe ASCII, có quy định căn lề; các nguyên tắc riêng của trang.
2. Tự rà kế hoạch đó. Phần nào trông giống mặc định cho bất kỳ trang tương tự nào thì sửa lại, và ghi rõ đã sửa gì, vì sao. Chỉ sau bước này mới bắt đầu viết code.

**Tiết chế:** chỉ chọn **một điểm** thật ấn tượng, phần còn lại giữ yên và kỷ luật. Trước khi chốt, bỏ bớt một chi tiết trang trí. Chất lượng nền tối thiểu: responsive, focus bàn phím nhìn thấy được, độ tương phản đạt chuẩn WCAG AA.

**Câu chữ trên giao diện:**
- Viết từ góc nhìn khách hàng, dùng động từ rõ ràng.
- Nút ghi đúng việc sẽ xảy ra khi bấm: "Gửi yêu cầu báo giá", không ghi "Submit".
- Báo lỗi nói rõ sai ở đâu và cách sửa, không xin lỗi chung chung.
- CSS: cẩn thận với độ ưu tiên selector để các class không ghi đè lẫn nhau, nhất là padding và margin giữa các khối.

## 8. SEO và đo lường

- `<title>`: "HALLCO® LIVE FLOOR® – Sàn tự đổ chính hãng | Như Tín Việt Nam"
- Meta description dài khoảng 150 ký tự, chứa các từ khóa "sàn tự đổ", "live floor", "đại lý ủy quyền HALLCO".
- Có thẻ Open Graph và Twitter Card, kèm một ảnh OG kích thước 1200×630.
- Schema JSON-LD: `Organization` và `LocalBusiness` cho Như Tín, `Product` cho LIVE FLOOR®, `FAQPage` cho phần FAQ.
- Mọi ảnh đều có `alt` tiếng Việt mô tả đúng nội dung ảnh.
- Tạo `sitemap.xml`, `robots.txt` và favicon.
- Để sẵn chỗ chèn mã GA4 (`G-XXXXXXX`). Gửi sự kiện khi khách bấm gọi, bấm Zalo và gửi form.
- Không có link chết, không dùng `href="#!"`.

## 9. Công nghệ

- HTML5, CSS3 (dùng biến CSS) và JavaScript thuần. **Không cần bước build.** Upload thư mục lên máy chủ là chạy.
- Form: viết `send.php` gửi mail qua SMTP bằng PHPMailer, cấu hình SMTP đặt trong `config.php`. Đồng thời viết sẵn phương án thay thế gửi về Google Sheet qua Apps Script, kèm hướng dẫn cách chuyển đổi giữa hai phương án.
- Chống spam: trường honeypot và giới hạn tần suất gửi đơn giản.

Cấu trúc thư mục:
```
/
├── index.html
├── about.html
├── send.php
├── config.php
├── css/style.css
├── js/main.js
├── assets/ (img, video, icons, SOURCES.md)
├── sitemap.xml
├── robots.txt
└── README.md   (hướng dẫn deploy, đổi thông tin liên hệ, cấu hình form)
```

## 10. Thông tin liên hệ

- Hotline: **0907 917 301**. Dùng đúng một định dạng này ở mọi chỗ.
- Zalo: https://zalo.me/0907917301
- Website: https://nhutin.com
- Địa chỉ, email, mã số thuế: để placeholder `[ĐỊA CHỈ]`, `[EMAIL]`, `[MST]`, đánh dấu rõ để thay sau.

## 11. Ràng buộc

- **Không** nhắc tới KEITH®, WALKING FLOOR® hay bất kỳ thương hiệu sàn tự đổ nào khác.
- Luôn viết đúng các nhãn hiệu "HALLCO®" và "LIVE FLOOR®".
- Nội dung tiếng Việt phải tự nhiên, chuyên nghiệp, không lỗi chính tả, viết hoa thống nhất.
- Không sao chép nguyên văn đoạn văn từ website của HALLCO. Diễn đạt lại bằng tiếng Việt.

## 12. Đầu ra mong muốn

1. Toàn bộ mã nguồn theo cấu trúc thư mục ở mục 9, chạy được ngay.
2. Thư mục `assets/` đã có đủ tài nguyên, kèm `SOURCES.md`.
3. `README.md` hướng dẫn: deploy lên hosting (cPanel và VPS), thay thông tin liên hệ, cấu hình SMTP hoặc Google Sheet, chèn mã GA4.
4. Một checklist tự kiểm tra trước khi bàn giao: responsive, tốc độ, SEO, form, link, chính tả.

Làm lần lượt từng phần: (1) thu thập tài nguyên, (2) viết nội dung, (2b) lập và tự rà kế hoạch thiết kế theo mục 7A, (3) dựng HTML/CSS, (4) thêm JS và hiệu ứng, (5) làm form, (6) SEO, (7) tự kiểm tra. Sau mỗi phần, tóm tắt ngắn những gì đã làm.
