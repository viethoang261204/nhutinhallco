# Kế hoạch thiết kế (mục 7A)

## Chủ thể và nhiệm vụ của trang

- **Chủ thể:** sàn tự đổ HALLCO® LIVE FLOOR®, bán và lắp đặt qua Như Tín.
- **Người đọc:** chủ doanh nghiệp vận tải hàng rời, nhà máy dùng sinh khối (dăm gỗ, vỏ điều, trấu), đơn vị thu gom rác.
- **Nhiệm vụ duy nhất:** khiến họ gọi điện hoặc gửi yêu cầu báo giá.

## Bản nháp 1

| Hạng mục | Lựa chọn |
|---|---|
| Màu | Xanh HALLCO `#249B45`, xanh rừng `#0B4D2A`, trắng, xám than |
| Font | Be Vietnam Pro cho mọi thứ |
| Hero | Video toàn màn hình, lớp phủ tối, H1 căn giữa |
| Niềm tin | Dải 4 số to, nhãn nhỏ |
| Lợi ích, sản phẩm | Thẻ bo góc có bóng đổ, lưới 3 cột |
| Trang trí | Sọc chéo của logo làm vạch phân cách giữa mọi khối |

## Tự rà và sửa

1. **Hero video tối, chữ căn giữa** là công thức chung của mọi trang có video. Video gốc của HALLCO là bản render 3D **nền trắng**, phủ tối lên sẽ làm bẩn nó.
   → **Sửa:** để video nằm thẳng trên nền trắng của trang, không khung, không lớp phủ. Xe tải như chạy vào trang. Chữ đặt cột trái, căn lề trái.
2. **Chỉ một font** cho mọi thứ làm tiêu đề thiếu cá tính.
   → **Sửa:** thêm **Barlow Condensed** (chữ hẹp, gợi kiểu chữ kẻ trên thân xe và biển thông số máy, có đủ dấu tiếng Việt) cho H1, H2 và các con số. Be Vietnam Pro giữ cho phần thân bài.
3. **Dải số liệu kiểu SaaS** là mặc định, nhưng brief bắt buộc có 4 số.
   → **Sửa:** làm dải này thành phần **khung gầm xe** nằm ngay dưới "sàn" của hero, màu xanh rừng, số chữ hẹp, ngăn bằng vạch đứng như thanh sàn. Nó trở thành một phần của hình chiếc xe, không phải một dải thống kê rời.
4. **Thẻ bo góc có bóng cho lợi ích** là lối SaaS.
   → **Sửa:** lợi ích trình bày dạng danh sách 2 cột, icon nét mảnh, phân cách bằng đường kẻ mảnh, không bóng, không nền.
5. **Sọc chéo ở mọi vạch phân cách** là trang trí thừa.
   → **Sửa (bỏ một chi tiết theo nguyên tắc Chanel):** sọc chéo chỉ còn xuất hiện ở **con dấu "Đại lý ủy quyền"**. (Sau đó khách hàng thay con dấu bằng logo tròn của Như Tín, nên họa tiết sọc chéo không còn trên trang.)
6. **Hiệu ứng fade-slide cho mọi khối:** bỏ hẳn.

## Bản chốt

### Màu

| Tên | Hex | Vai trò |
|---|---|---|
| Xanh HALLCO | `#249B45` | Màu lấy từ logo. Thanh sàn đang chạy, icon, chi tiết lớn |
| Xanh nút | `#1B7A36` | Nút và liên kết (chữ trắng trên nền này đạt 5,4:1) |
| Xanh rừng | `#0B4D2A` | Khung gầm (dải số), khối form, footer |
| Than | `#222021` | Màu chữ chính, lấy từ chữ "LIVE FLOOR" trong logo |
| Thép | `#5F6870` | Chữ phụ (5,7:1 trên nền trắng), lấy từ sọc xám của logo |
| Nhôm | `#ECEFF1` | Nền phụ, thanh sàn đang nghỉ |

Đỏ và vàng chỉ đến từ video (xe đầu kéo đỏ, moóc vàng), không dùng trong giao diện.

### Chữ

| Font | Vai trò |
|---|---|
| Barlow Condensed 600/700 | H1, H2, số liệu, số bước. Viết thường theo câu, không viết hoa toàn bộ |
| Be Vietnam Pro 400/500/600/700 | Thân bài, nút, form, menu |

Thang chữ: 15 / 17 / 20 / 28 / 40 / 64px (co giãn bằng `clamp`). Đoạn văn tối đa 68 ký tự mỗi dòng.

### Bố cục

```
┌──────────────────────────────────────────────────────────────┐
│ [HALLCO LIVE FLOOR] | Đại lý ủy quyền  menu…   [Nhận báo giá] │  header trắng, cố định
├──────────────────────────────────────────────────────────────┤
│ H1 Đại lý ủy quyền          │                                 │
│ HALLCO® LIVE FLOOR®         │   video xe đỏ/moóc vàng         │  video trên nền trắng,
│ tại Việt Nam                │   (không khung, không phủ)      │  tràn mép phải
│ dòng phụ                    │                                 │
│ [Gọi ngay] [Nhận báo giá]   │                                 │
├══════════════════════════════════════════════════════════════┤  ← CHỮ KÝ: dải thanh sàn
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│    chạy đúng chu trình LIVE FLOOR
├──────────────────────────────────────────────────────────────┤
│  1968   │   4    │   2    │  2 năm   │                        │  khung gầm xanh rừng
└──────────────────────────────────────────────────────────────┘
  Cách hoạt động: [01][02][03] cột trái │ mô phỏng thanh sàn nhìn từ trên xuống
  ─ CTA mảnh ─
  Lợi ích: danh sách 2 cột, kẻ mảnh
  Ứng dụng: lưới ảnh 4×2, chú thích dưới ảnh
  ─ CTA mảnh ─
  Sản phẩm 2×2 │ Bảo hành (bảng điều kiện + con dấu) │ ─ CTA mảnh ─
  Về Như Tín │ FAQ │ Form (khối xanh rừng) │ Footer
```

Quy định căn lề: mọi nội dung căn trái theo một cột lưới duy nhất, rộng tối đa 1200px. Lề hai bên 16px ở 360px, 24px ở 768px, 32px từ 1280px. Không có khối nào căn giữa.

### Chữ ký

**Dải thanh sàn dưới hero.** Một hàng thanh sàn nhôm chạy đúng chu trình LIVE FLOOR: cả ba nhóm cùng tiến (hàng đi theo), sau đó lùi về từng nhóm một (hàng đứng yên). Mỗi chu trình, "hàng" (các hạt dăm) dịch ra mép phải và rơi khỏi thùng. Khối "Cách hoạt động" dùng lại đúng mô phỏng này ở cỡ lớn, đồng bộ với 3 bước.

### Nguyên tắc riêng

- Chuyển động chỉ có ở: video hero, dải thanh sàn, mô phỏng ở khối "Cách hoạt động", đếm số khi cuộn tới, mở FAQ, gửi form thành công. Không có gì khác.
- Video hero luôn tự chạy và lặp lại (yêu cầu của khách hàng), không có nút tạm dừng. Dải thanh sàn và mô phỏng cũng luôn chạy (yêu cầu của khách hàng). Với `prefers-reduced-motion`, chỉ phần đếm số hiện ngay giá trị cuối.
- Không có nhãn viết hoa giãn chữ trên tiêu đề. Không tô màu riêng một chữ trong tiêu đề. Không gắn "→" vào nút.
- Số thứ tự 01/02/03 chỉ dùng ở 3 bước hoạt động và tiến trình lắp đặt (trang giới thiệu).
- Góc bo 4px cho nút và ảnh. Không dùng bóng đổ, trừ cụm nút nổi.

## Mở rộng thành nhiều trang

- **Chữ ký chỉ ở một chỗ.** Dải thanh sàn chuyển động vẫn chỉ có ở trang chủ. Mô phỏng tương tác lớn nằm ở trang "Cách hoạt động", nơi nó giải thích nội dung.
- **Trang con dùng tiếng vọng tĩnh.** Đầu mỗi trang con kết thúc bằng một dải kẻ mảnh nhiều vạch, gợi lại các thanh sàn mà không chuyển động.
- **Thứ bậc giống nhau trên mọi trang:** breadcrumb, H1 kèm đoạn dẫn và một ảnh, sau đó là các khối nội dung xen kẽ nền trắng và nền nhôm, dải "Nhận báo giá" sau mỗi 2 đến 3 khối.
- **Số liệu kỹ thuật trình bày bằng bảng thật** (đầu bảng màu than, chữ phụ màu thép), không dựng thành thẻ.
- **Số thứ tự** chỉ dùng cho trình tự thật: 3 bước của chu trình, 4 bước quy trình lắp và đăng ký bảo hành, 3 phép đo khi thay thanh sàn. Danh sách 6 thành phần của bộ sàn không phải trình tự nên chỉ đánh dấu bằng vạch xanh.
