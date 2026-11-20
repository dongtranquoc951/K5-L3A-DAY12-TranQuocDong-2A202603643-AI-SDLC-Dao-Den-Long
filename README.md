# Đảo Đèn Lồng (Lantern Island) — 3D Game

> Dự án game 3D trong khuôn khổ môn học **AI SDLC (Day 12)**.  
> Học viên: **Trần Quốc Đồng** · MSSV: **2A202603643** · Lớp: **K5-L3A**  
> Mốc bàn giao: **Phase 2** (Tag: `phase-2`) · Tuân thủ **Test Contract v1.1**

---

## 1. Hướng Dẫn Cài Đặt & Chạy Game (Tối đa 3 lệnh)

Chỉ cần môi trường đã cài sẵn **Node.js** (v18 trở lên):

```bash
# 1. Cài đặt các gói phụ thuộc (nếu cần)
npm install

# 2. Khởi chạy máy chủ Web tĩnh cục bộ
npx serve -l 3000 .
```

Sau đó mở trình duyệt tại địa chỉ `http://localhost:3000` để bắt đầu chơi.

---

## 2. Phím Điều Khiển (Controls)

| Phím | Chức năng |
|---|---|
| `W`, `A`, `S`, `D` hoặc Phím Mũi Tên | Di chuyển nhân vật Mây (tốc độ 6.0 m/s) |
| `Shift` hoặc `C` | **Lướt (Dash)** nhanh 14 m/s trong 0.2s |
| `Space` (Phím cách) | **Nhảy (Jump)** vận tốc 7.0 m/s khi chạm đất |
| `E` | Nạp đom đóm mang theo vào Đèn Lồng Lớn |
| `Q` hoặc `F` | Kích hoạt **Tỏa sáng (Pulse)** để đẩy lùi và làm choáng Bóng Mực (cần $\ge 3$ đom đóm) |
| `Esc` hoặc `P` | **Tạm dừng (Pause)** / Tiếp tục |

---

## 3. Bản Đồ 3 Đêm & Tính Năng Mới (Phase 2)

- **Đêm 1 — Đảo Bến**: Đảo tròn bán kính 40m, 5 Đèn Lồng Lớn (`L1` đến `L5`).
- **Đêm 2 — Đảo Cau**: Hai đảo tròn bán kính 28m nối nhau bằng cầu tre, 6 Đèn Lồng Lớn (`L1` đến `L6`), bục nhảy phóng Mây giữa hai đảo và Bùa Gió tăng tốc.
- **Đêm 3 — Đảo Chuông**: Đảo 3 tầng cao độ (0m, 3m, 6m) với dốc thoai thoải, tháp chuông cổ kính, 7 Đèn Lồng Lớn (`L1` đến `L7`) và những cơn gió lớn từ biển mây.
- **Kẻ địch mới — Gió Lạc (Drifter)**: Dải lụa xám xanh bay lượn trên sương mù, rình rập cướp đom đóm khi Mây mang từ 5 đom đóm trở lên. Tỏa Sáng có thể xua đuổi và buộc Gió Lạc nhả lại đom đóm đã cướp.
- **Bùa Gió (Wind Charm)**: Tăng tốc độ chạy lên 7.2 m/s và xóa bỏ thời gian hồi chiêu của kỹ năng Lướt trong 10 giây.

### Điểm số chuẩn hóa (Ticket-02):
- `+10 điểm` cho mỗi đom đóm nạp vào đèn
- `+100 điểm` cho mỗi đèn lồng thắp sáng
- `+5 điểm` cho mỗi Bóng Mực trúng Tỏa Sáng
- **Thưởng chiến thắng mỗi Đêm**: `+ floor(giây còn lại) × 2 + 50 × Ngọn Lửa còn lại`.

---

## 4. Chế Độ Headless & Kiểm Thử Tự Động (Contract v1.1)

```bash
# Chạy chế độ headless (chọn --night 1, 2 hoặc 3)
node src/headless.js --seed 42 --night 1 --ticks 120 --out output.jsonl --snapshot-every 10

# Chạy toàn bộ 17 test case tự động (bao gồm kiểm thử hồi quy Phase 1, các tính năng mới và đo hiệu năng)
npm test
```

---

## 5. Sáng Tạo Của Tôi (My Creative Additions)

1. **Hiệu ứng âm thanh procedural đa dạng**: Âm thanh chuông đom đóm, tiếng gió rít khi lướt (dash), tiếng cồng Tỏa Sáng, tiếng nhặt bùa may mắn và nhịp đếm ngược 10 giây cuối cùng bằng Web Audio API không tốn thêm tài nguyên asset.
2. **Hệ thống dẫn truyện 3 Đêm (3-Night Saga)**: Từng Đêm đều có lời dặn dò ấm áp từ Ông Đăng trước khi bước vào đảo, và màn hình Bình Minh rạng ngời khi hoàn thành trọn vẹn cả 3 Đêm.
3. **Mũi tên chỉ hướng thông minh**: Hỗ trợ người chơi dễ dàng định vị Đèn Lồng chưa thắp sáng gần nhất trên không gian đảo 3D rộng lớn.
4. **Cô lập kỹ thuật**: Mọi sáng tạo hình ảnh/âm thanh nằm gọn trong lớp `src/render/`, chế độ headless duy trì tính tất định 100% và tốc độ siêu nhanh (21.600 ticks trong ~0.78s).

---

## 6. Minh Chứng Kiểm Chứng (Proof of Verification)
Chi tiết tại [docs/proof/phase-2/proof.md](docs/proof/phase-2/proof.md).
