# Đảo Đèn Lồng (Lantern Island) — 3D Game

> Dự án game 3D trong khuôn khổ môn học **AI SDLC (Day 12)**.  
> Học viên: **Trần Quốc Đồng** · MSSV: **2A202603643** · Lớp: **K5-L3A**  
> Mốc bàn giao: **Phase 3** (Tag: `phase-3`) · Tuân thủ **Test Contract v1.2**

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
| `W`, `A`, `S`, `D` hoặc Phím Mũi Tên | Di chuyển nhân vật Mây (chuẩn hướng camera, W tiến vào màn hình, S lùi về phía người chơi) |
| Kéo chuột trái | Xoay tự do Camera 3D (quanh Mây) |
| Lăn chuột | Thu phóng khoảng cách camera (7m — 24m) |
| `Shift` hoặc `C` | **Lướt (Dash)** nhanh 14 m/s trong 0.2s |
| `Space` (Phím cách) | **Nhảy (Jump)** vận tốc 7.0 m/s khi chạm đất |
| `E` | Nạp đom đóm vào Đèn Lồng Lớn / **Châm dầu** cho đèn đang sáng |
| `Q` hoặc `F` | Kích hoạt **Tỏa sáng (Pulse)** để đẩy lùi và làm choáng Bóng Mực (cần $\ge 3$ đom đóm) |
| `Esc` hoặc `P` | **Tạm dừng (Pause)** / Tiếp tục |

---

## 3. Luật Chơi & Tính Năng Mới — Phase 3 (Contract v1.2)

### 3.1 Cơ Chế Nhiên Liệu "Đèn Cạn Dầu" & Giữ Sáng Tới Bình Minh
- **Nhiên liệu đèn**: Mỗi đèn chứa tối đa 100 đơn vị dầu, hao hụt tự nhiên 1.0 đơn vị/giây khi đang sáng.
- **Châm dầu (Refuel)**: Bấm `E` gần đèn sáng để châm dầu (`+10 fuel` mỗi đom đóm nạp).
- **Cạn dầu (`lantern_out`)**: Khi `fuel <= 0`, đèn tắt và mất vùng an toàn. Đèn ghi nhớ đã từng sáng.
- **Thắp lại (`relight`)**: Đèn từng sáng chỉ tốn 5 đom đóm để thắp lại (thay vì 10 đom đóm khi thắp lần đầu).
- **Bóng Mực hút dầu (`drain`)**: Khi đèn có `fuel < 30`, đèn mất vùng an toàn. Bóng Mực ở trạng thái `wander` sẽ tiếp cận đèn yếu và vào trạng thái `drain` hút 5 fuel/giây (phát sự kiện `fuel_drain` mỗi 60 tick).
- **Tỏa Sáng giải cứu đèn**: Tỏa Sáng trúng Bóng Mực đang hút dầu được thưởng **+15 điểm** (thay vì +5).
- **Sức chứa tăng tiến**: Sức chứa đom đóm của Mây bắt đầu từ 10 và tăng thêm 2 sau mỗi lần thắp/thắp lại đèn thành công (`capacity = min(20, 10 + 2 * successful_lights)`).

### 3.2 Mục Tiêu Chiến Thắng Mới (Survive Until Dawn)
- **Không kết thúc sớm**: Người chơi phải bảo vệ đảo tới khi hết thời gian đêm (`time_left_s <= 0`).
- **Thắng (`dawn_survived`)**: Tại thời điểm bình minh, số đèn còn sáng $\ge \lceil 0.6 \times \text{tổng đèn} \rceil$ (3/5 ở Đêm 1, 4/6 ở Đêm 2, 5/7 ở Đêm 3).
- **Thua**: Hết lửa sinh mệnh (`no_flames`) hoặc tới bình minh không đủ 60% đèn sáng (`dawn`).

### 3.3 Điểm số mới (Ticket-03):
- `+5 điểm` cho mỗi đom đóm nạp vào đèn hoặc châm dầu
- `+100 điểm` khi thắp sáng đèn lần đầu
- `+40 điểm` khi thắp lại đèn từng sáng
- `+5 điểm` làm choáng Bóng Mực thông thường (`+15 điểm` nếu bóng đang hút dầu)
- **Thưởng bình minh**: `+ 50 + floor(fuel)` cho mỗi đèn còn sáng + `50 điểm` cho mỗi ngọn lửa còn lại.

---

## 4. Chế Độ Headless & Kiểm Thử Tự Động (Contract v1.2)

```bash
# Chạy chế độ headless (chọn --night 1, 2 hoặc 3)
node src/headless.js --seed 42 --night 1 --ticks 120 --out output.jsonl --snapshot-every 10

# Chạy toàn bộ 25 test suite tự động (bao gồm hồi quy Phase 1, Phase 2, các tính năng mới Phase 3 và benchmark)
npm test
```

---

## 5. Sáng Tạo & Trợ Năng (My Creative Additions)

1. **Chế độ Mù màu (Colorblind Mode)**: Tùy chọn trợ năng trong menu Cài đặt, viền Bóng Mực đổi sang màu Cyan sáng (`#00B3FF`), đèn chưa sáng xẹp 20% trục Y (`scale.y = 0.8`), ký hiệu cảnh báo `⚠` nổi bật.
2. **Thanh nhiên liệu 3D trực quan**: Trên đỉnh mỗi ngọn đèn hiển thị thanh dầu trực quan đổi màu (Xanh $\ge 50$ > Vàng $\ge 30$ > Đỏ $< 30$) và nhấp nháy chậm 1 Hz cảnh báo khi sắp cạn dầu.
3. **Hiệu ứng âm thanh procedural đa dạng**: Âm thanh chuông đom đóm, tiếng gió rít khi lướt (dash), tiếng cồng Tỏa Sáng, tiếng nhặt bùa may mắn và nhịp đếm ngược 10 giây cuối cùng bằng Web Audio API không tốn tài nguyên asset.
4. **Mũi tên chỉ hướng thông minh**: Hỗ trợ người chơi định vị ngọn đèn cần hỗ trợ hoặc chưa sáng trên không gian 3D.
5. **Hiệu năng siêu tốc**: Mô phỏng 14.400 tick headless chỉ mất ~1.7 giây (yêu cầu $\le 30$ giây).

---

## 6. Tài Liệu Thiết Kế & Minh Chứng Kiểm Chứng

- [ADR: Phase 3 Change Request "Đèn cạn dầu"](docs/notes/adr-phase3-lantern-fuel-win.md)
- [Bảng thay đổi chi tiết (CHANGELOG)](CHANGELOG.md)
- [Ma trận kiểm thử & Bằng chứng nghiệm thu](docs/proof/phase-3/proof.md)
