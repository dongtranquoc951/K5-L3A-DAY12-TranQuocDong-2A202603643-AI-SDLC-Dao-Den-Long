# CHANGELOG — Đảo Đèn Lồng

Toàn bộ các thay đổi qua các phiên bản và Phase phát triển.

---

## [Phase 4] - 2026-11-20 (Release v1.0.0 — Contract v1.3) - "Bình minh: phát hành v1.0.0"

### ✨ Added (Tính năng mới)
- **Chế độ Benchmark (`node src/benchmark.js`)**:
  - Mô phỏng và đo đạc hiệu năng với 200 Bóng Mực, 100 đom đóm, 3 đèn sáng, camera quay vòng tròn 30m ở độ cao 15m.
  - Xuất tệp `bench.json` chuẩn Test Contract v1.3 (`avg_fps`, `p1_low_fps`, `frame_ms_p95`, `frames`, `load_ms`, `peak_mem_mb`, `vsync_off`).
- **Soak Test (`node src/soak.js`)**:
  - Chạy liên tục 10 Đêm trong cùng một tiến trình với các hành động ngẫu nhiên theo seed.
  - Xuất tệp `soak.json` kiểm soát rò rỉ bộ nhớ (`mem_end_mb <= 1.2 * mem_start_mb`) và tỷ lệ crash 0.
- **Bảng Xếp Hạng Cục Bộ (Local Leaderboard)**:
  - Lưu trữ top 10 thành tích trên đĩa (`data/leaderboard.json`) và trình duyệt (`localStorage`).
  - Cho phép người chơi nhập tên (3-12 ký tự) sau khi chiến thắng hoặc kết thúc đêm.
  - Hỗ trợ lệnh xuất qua CLI: `node src/headless.js --export-leaderboard out.json`.
- **Hỗ Trợ Tiếp Cận (Accessibility & Controls)**:
  - Bổ sung 2 nút xoay camera trái/phải trực quan trên màn hình và điều khiển qua phím mũi tên trái/phải (`ArrowLeft`, `ArrowRight`).
  - Hỗ trợ đổi phím điều khiển (Key Rebinding) có phát hiện trùng phím và nút khôi phục mặc định.
  - Tùy chọn đảo ngược trục xoay camera (`invertCamYaw`).
  - Phụ đề và biểu ngữ cảnh báo hình ảnh: Bóng Mực xuất hiện, Gió lớn nổi lên, 10 giây cuối cùng, Đèn sắp cạn dầu (< 30).
  - Tùy chọn giảm chuyển động (`reduceMotion`) và cỡ chữ lớn (x1.25).
- **Hồ Sơ Phát Hành**:
  - Bổ sung `CREDITS.md`, `LICENSE`, và báo cáo đánh giá hồi cứu `docs/notes/retro-v1.0.0.md`.
  - Nâng cấp bộ test lên 29 test suites tự động vượt qua 100%.

---

## [Phase 3] - 2026-11-20 (Contract v1.2) - Change Request "Đèn cạn dầu"

### ⚠ Breaking Changes (Thay đổi phá vỡ luật cũ)
- **Mục tiêu chiến thắng**:
  - [CŨ]: Thắp đủ tất cả các ngọn đèn trên đảo sẽ kết thúc game ngay lập tức với chiến thắng (`reason: "all_lit"`).
  - [MỚI]: Không kết thúc sớm khi thắp hết đèn. Người chơi phải duy trì bảo vệ đảo tới khi hết thời gian (`time_left_s <= 0`). Thắng khi số đèn sáng tại bình minh $\ge \lceil 0.6 \times \text{tổng đèn} \rceil$ (`reason: "dawn_survived"`). Nếu $< 60\%$ đèn sáng, nhận thua (`reason: "dawn"`).
- **Quy tắc nạp đèn đã sáng**:
  - [CŨ]: Đèn đã sáng không nhận thêm đom đóm.
  - [MỚI]: Đèn sáng bị hao hụt 1.0 fuel/s. Người chơi có thể nạp thêm đom đóm để châm dầu (`refuel`, tối đa 100 fuel).
- **Vùng an toàn của đèn sáng**:
  - [CŨ]: Đèn sáng luôn tạo vùng an toàn bán kính 6m tuyệt đối chặn Bóng Mực.
  - [MỚI]: Khi `fuel < 30.0`, đèn mất vùng an toàn, cho phép Bóng Mực tiếp cận và hút dầu (`drain`, 5 fuel/s).
- **Hệ thống tính điểm**:
  - Thưởng thời gian còn lại khi thắng bị loại bỏ (vì game phải chơi đến hết giờ).
  - Điểm thưởng mới: +5 / đom đóm nạp hoặc châm dầu, +100 thắp lần đầu, +40 thắp lại, +15 làm choáng Bóng Mực đang hút dầu (+5 khi thường), +50 + floor(fuel) cho mỗi đèn còn sáng lúc bình minh, +50 cho mỗi ngọn lửa còn lại.

### ✨ Added (Tính năng mới)
- **Cơ chế Cạn dầu & Thắp lại**:
  - Đèn hết dầu (`fuel <= 0`) tự động tắt, ghi nhớ cờ `ever_lit = true`, phát sự kiện `lantern_out`.
  - Thắp lại đèn từng sáng chỉ tốn 5 đom đóm (`relight_cost = 5`).
- **Trạng thái mới cho Bóng Mực (`drain`)**:
  - Bóng Mực trạng thái `wander` tự động tìm đèn yếu (`fuel < 30`), vào trạng thái `drain` tại khoảng cách $\le 2$ m và hút 5 fuel/s.
  - Định kỳ 60 tick phát sự kiện `fuel_drain`.
- **Sức chứa tăng tiến**:
  - `capacity = min(20, 10 + 2 * successful_lights)`.
- **Chế độ mù màu (Colorblind Mode)**:
  - Tùy chọn trợ năng trong menu tạm dừng (Esc / P), viền Bóng Mực đổi sang màu Cyan sáng (`#00B3FF`), đèn chưa sáng xẹp 20% trục Y (`scale.y = 0.8`), ký hiệu cảnh báo `⚠`.
- **Sửa lỗi điều khiển**:
  - Sửa lỗi đảo ngược phím W/S khi di chuyển nhân vật trong không gian 3D.
- **Test Suite Contract v1.2**:
  - Bổ sung `tests/phase3_features.test.js` (8 test suites mới, nâng tổng lên 25 tests pass 100%).

---

## [Phase 2] - 2026-11-20 (Contract v1.1) - "Ba hòn đảo"

### ✨ Added
- Chuẩn hóa toàn bộ bộ số liệu vật lý: tốc độ chạy 6.0 m/s, nhảy 7.0 m/s, trọng lực -20 m/s².
- Kỹ năng Lướt (Dash): tốc độ 14 m/s trong 0.2s, hồi chiêu 1.5s.
- Mở rộng Đêm 2 (Đảo Cau) với cầu tre nối 2 đảo tròn và 2 bục nhảy liên đảo.
- Mở rộng Đêm 3 (Đảo Chuông) với địa hình 3 tầng cao và cơ chế gió thổi định kỳ.
- Thực thể Gió Lạc (Drifter) rình rập cướp đom đóm khi người chơi mang $\ge 5$.
- Bùa Gió (Wind Charm) tăng tốc chạy lên 9.0 m/s và xóa hồi chiêu lướt trong 8 giây.
- Tính năng Tạm dừng / Tiếp tục (`Escape` / `P`) với sự kiện `paused` và `resumed`.

---

## [Phase 1] - 2026-11-20 (Contract v1.0) - Khởi tạo Đảo Bến

### ✨ Added
- Màn chơi Đêm 1 trên Đảo Bến hình tròn bán kính 40m, 5 Đèn Lồng Lớn.
- Mô phỏng vật lý 60 tick/giây, PRNG tất định LCG.
- Tỏa Sáng (Pulse) xua đuổi và làm choáng Bóng Mực.
- Giao diện 3D WebGL với Three.js và hệ thống âm thanh Web Audio API.
