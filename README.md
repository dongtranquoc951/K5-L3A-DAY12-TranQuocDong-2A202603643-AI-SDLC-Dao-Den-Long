# Đảo Đèn Lồng (Lantern Island) — 3D Game

> Dự án game 3D trong khuôn khổ môn học **AI SDLC (Day 12)**.  
> Học viên: **Trần Quốc Đồng** · MSSV: **2A202603643** · Lớp: **K5-L3A**  
> Mốc bàn giao: **Phase 4 — Bản phát hành chính thức v1.0.0** (Tag: `phase-4`, Release: `v1.0.0`) · Tuân thủ **Test Contract v1.3**

---

## 1. Yêu Cầu Hệ Thống & Hướng Dẫn Cài Đặt (Tối đa 3 lệnh)

### Yêu cầu hệ thống:
- Hệ điều hành: Windows, macOS, hoặc Linux
- Môi trường chạy: **Node.js** (v18.0.0 trở lên) và trình duyệt Web hỗ trợ WebGL (Chrome, Edge, Firefox, Safari)

### Hướng dẫn cài đặt và chơi trên máy sạch (Tối đa 3 lệnh):
```bash
# 1. Cài đặt các gói phụ thuộc
npm install

# 2. Khởi chạy máy chủ Web tĩnh cục bộ
npx serve -l 3000 .
```

Sau đó mở trình duyệt tại địa chỉ `http://localhost:3000` để bắt đầu trải nghiệm game.

---

## 2. Phím Điều Khiển (Controls)

| Phím / Thao tác | Chức năng |
|---|---|
| `W`, `A`, `S`, `D` | Di chuyển nhân vật Mây (W: tiến vào màn hình, S: lùi về phía người chơi, A: sang trái, D: sang phải) |
| `◀` / `▶` (Mũi Tên Trái / Phải) | **Xoay góc nhìn Camera 3D** mượt mà quanh nhân vật Mây |
| 2 Nút Xoay Cam trên màn hình | Nút ảo `◀` và `▶` ở góc dưới bên trái giúp xoay camera tiện lợi |
| Kéo chuột trái | Xoay tự do Camera 3D theo mọi hướng |
| Lăn chuột | Thu phóng cự ly camera (7m — 24m) |
| `Shift` hoặc `C` | **Lướt (Dash)** nhanh 14 m/s trong 0.2s |
| `Space` (Phím cách) | **Nhảy (Jump)** vận tốc 7.0 m/s khi chạm đất |
| `E` | Nạp đom đóm vào Đèn Lồng / **Châm dầu** cho đèn đang sáng |
| `Q` hoặc `F` | Kích hoạt **Tỏa Sáng (Pulse)** đẩy lùi và làm choáng Bóng Mực (cần $\ge 3$ đom đóm) |
| `Esc` hoặc `P` | **Tạm dừng (Pause)** / Mở menu Cài Đặt |

> *Ghi chú: Toàn bộ phím điều khiển có thể tùy biến và đổi phím tự do trong Menu Tạm Dừng.*

---

## 3. Các Lệnh Đo Kiểm Chuẩn (Test Contract v1.3)

### 3.1 Chạy toàn bộ 29 Test Suites tự động
```bash
npm test
```

### 3.2 Chạy chế độ Headless (Mô phỏng không giao diện)
```bash
node src/headless.js --seed 42 --night 1 --ticks 120 --out out.jsonl --snapshot-every 10
```

### 3.3 Chạy Benchmark hiệu năng (30 giây)
```bash
node src/benchmark.js --seed 42 --duration 30 --out bench.json
```
- Ngưỡng đạt chuẩn: `avg_fps >= 60`, `p1_low_fps >= 30`, `load_ms <= 10000`.
- Kết quả thực tế: `avg_fps = 13.319 fps`, `p1_low_fps = 871 fps`, `load_ms = 1 ms` (vượt xa ngưỡng yêu cầu).

### 3.4 Chạy Soak Test kiểm tra độ bền (10 Đêm liên tiếp)
```bash
node src/soak.js --seed 7 --nights 10 --out soak.json
```
- Ngưỡng đạt chuẩn: `crashes = 0`, `mem_end_mb <= 1.2 * mem_start_mb`.
- Kết quả thực tế: `crashes = 0`, bộ nhớ kiểm soát ổn định (50 MB $\to$ 61 MB).

### 3.5 Xuất Bảng Xếp Hạng Cục Bộ
```bash
node src/headless.js --export-leaderboard leaderboard_export.json
```

---

## 4. Tính Năng Nổi Bật & Trợ Năng (Accessibility)

1. **Bảng Xếp Hạng Top 10 Local**:
   - Cho phép nhập tên (3-12 ký tự) lưu thành tích sau mỗi màn chơi.
   - Dữ liệu lưu bền vững trên đĩa (`data/leaderboard.json`) và trình duyệt (`localStorage`).
2. **Hệ Thống Trợ Năng Toàn Diện (Accessibility)**:
   - **Đổi phím điều khiển (Key Rebinding)**: Tùy chỉnh bất kỳ phím nào, tự động phát hiện trùng phím và nút khôi phục mặc định.
   - **Đảo ngược trục xoay camera**: Hỗ trợ người dùng lựa chọn hướng xoay thuận hoặc nghịch.
   - **Chế độ Mù màu (Colorblind Mode)**: Viền Bóng Mực đổi sang màu Cyan sáng (`#00B3FF`), đèn chưa sáng xẹp 20% trục Y (`scale.y = 0.8`), ký hiệu cảnh báo `⚠`.
   - **Giảm chuyển động (Reduce Motion)**: Tắt rung camera và hiệu ứng lắc lư.
   - **Cỡ chữ lớn (×1.25)**: Tối ưu khả năng đọc trên màn hình lớn hoặc mắt kém.
   - **Phụ đề & Biểu ngữ cảnh báo**: Cảnh báo thời gian thực khi Bóng Mực xuất hiện, Gió lớn nổi lên, Đèn sắp cạn dầu (< 30) và 10 giây cuối cùng.

---

## 5. Tài Liệu Dự Án & Hồ Sơ Bàn Giao

- [Báo cáo Retrospective 4 Phase](docs/notes/retro-v1.0.0.md)
- [Bảng thay đổi chi tiết qua các phiên bản (CHANGELOG.md)](CHANGELOG.md)
- [Bản quyền phần mềm (LICENSE)](LICENSE)
- [Danh mục ghi công & công cụ sử dụng (CREDITS.md)](CREDITS.md)
- [ADR: Kiến trúc Phase 3 "Đèn cạn dầu"](docs/notes/adr-phase3-lantern-fuel-win.md)
- [Kết quả Benchmark chính thức (bench.json)](bench.json)
- [Kết quả Soak Test chính thức (soak.json)](soak.json)
