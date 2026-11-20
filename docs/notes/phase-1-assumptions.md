# Hợp Đồng & Giả Định Thiết Kế Phase 1 (PRD-0)

## 1. Thông Tin Chung
- **Dự án**: Đảo Đèn Lồng (Day 12 — AI SDLC)
- **Học viên**: Trần Quốc Đồng (MSSV: 2A202603643 - Lớp K5-L3A)
- **Phase**: 1 (Tag: `phase-1`)
- **Phiên bản Contract**: `1.0`

## 2. Các Giả Định Kỹ Thuật (Assumptions) & Thông Số Tuning

| Thông số | Giá trị | Ý nghĩa |
|---|---|---|
| `player_speed` | 6.0 m/s | Tốc độ di chuyển của Mây (0.1 m/tick) |
| `carry_capacity` | 5 | Số đom đóm tối đa Mây có thể mang theo |
| `lantern_cost` | 3 | Số đom đóm cần nạp để thắp sáng một Đèn Lồng Lớn |
| `lantern_count_night1` | 5 | Đêm 1 có 5 Đèn Lồng Lớn (L1, L2, L3, L4, L5) |
| `pickup_radius` | 1.5 m | Bán kính nhặt đom đóm (khoảng cách mặt phẳng XZ) |
| `interact_radius` | 2.5 m | Bán kính tương tác nạp đom đóm vào đèn |
| `pulse_cost` | 1 | Số đom đóm tiêu hao khi kích hoạt Tỏa sáng (Pulse) |
| `pulse_radius` | 5.0 m | Bán kính sóng tỏa sáng xua Bóng Mực |
| `pulse_stun_s` | 3.0 s | Thời gian Bóng Mực bị choáng (180 ticks) |
| `pulse_push_m` | 4.0 m | Cự ly đẩy lùi Bóng Mực khi bị trúng tỏa sáng |
| `pulse_cooldown_s` | 1.0 s | Thời gian hồi chiêu của kỹ năng Tỏa sáng (60 ticks) |
| `safe_radius` | 4.0 m | Bán kính an toàn quanh đèn đã thắp (Bóng Mực không thể vào) |
| `night1_duration_s` | 180 s | Thời lượng Đêm 1 (180 giây = 10,800 ticks) |
| `flames` | 3 | Số ngọn lửa / sinh lực khởi đầu của Mây |
| `invuln_s` | 2.0 s | Thời gian miễn nhiễm sau khi bị Bóng Mực đánh trúng |
| `hit_drop_ratio` | 0.5 | Tỉ lệ đom đóm đánh rơi khi bị va chạm (`floor(carried * 0.5)`) |
| `shade_speed` | 3.5 m/s | Tốc độ đuổi của Bóng Mực (~0.0583 m/tick) |
| `shade_hit_radius` | 1.0 m | Bán kính gây sát thương của Bóng Mực |
| `fall_enabled` | false | Đêm 1 đảo có rào chắn gió mây, không rơi khỏi đảo |
| `score.per_mote` | 10 | Điểm khi nhặt 1 đom đóm |
| `score.per_lantern` | 100 | Điểm khi thắp sáng hoàn toàn 1 Đèn Lồng |
| `score.per_stun` | 20 | Điểm khi làm choáng 1 Bóng Mực |
| `score.per_second_left`| 5 | Điểm thưởng cho mỗi giây còn lại khi thắng |
| `score.per_flame_left` | 50 | Điểm thưởng cho mỗi ngọn lửa còn nguyên khi thắng |

## 3. Kiến Trúc Tách Biệt & Tính Tất Định
- **Core Engine (`src/core/`)**: Chạy độc lập hoàn toàn với GPU / DOM, điều khiển bởi một PRNG tất định (Mulberry32) nhận `--seed`. Cùng một hạt giống và kịch bản input sẽ cho ra đầu ra JSONL giống nhau 100%.
- **Chế độ Headless**: Thực thi chính xác theo tick (60 ticks/giây). Đọc frames từ file `--inputs`, xử lý scenario từ `--scenario`, ghi log các snapshots và events ra `--out`.
- **Render Layer 3D (`src/render/`)**: Sử dụng Three.js để dựng màn chơi Đêm 1 huyền ảo với ánh sáng vàng cam ấm áp, mô hình Mây nón lá, hiệu ứng hạt đom đóm lơ lửng và sương đêm.
