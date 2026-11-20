# AGENTS.md — Hướng Dẫn Cho AI Agent

## 1. Thông Tin Dự Án
- **Tên dự án**: Đảo Đèn Lồng (3D Game - AI SDLC Day 12)
- **Học viên**: Trần Quốc Đồng (MSSV: 2A202603643 - Lớp: K5-L3A)
- **Phiên bản hiện tại**: Phase 4 / Release v1.0.0 (Test Contract v1.3)

## 2. Quy Tắc Kỹ Thuật (Architecture & Invariants)
- **Tách biệt Core và Visual Layer**:
  - `src/core/`: Chứa toàn bộ trạng thái game 3 Đêm (Đảo Bến, Đảo Cau, Đảo Chuông), PRNG, va chạm, quy tắc logic, bảng xếp hạng. Hoạt động độc lập 100% không phụ thuộc DOM / Canvas / GPU.
  - `src/render/`: Three.js hiển thị 3D, thanh dầu nhấp nháy, chế độ mù màu, nút xoay camera và Web Audio API sound effects.
- **Tính Tất Định (Determinism)**:
  - Cùng `--seed`, kịch bản `--scenario` và `--inputs` bắt buộc cho ra output byte-for-byte giống hệt nhau.
- **Thứ tự xử lý bắt buộc trong 1 tick (Test Contract v1.3)**:
  1. Đọc input (xử lý pause trước)
  2. Giảm các bộ đếm: thời gian, hồi chiêu, bất tử, choáng, bùa, TTL đom đóm rơi; tính hao hụt dầu (1.0/s) & bóng hút dầu (5.0/s), phát `fuel_drain`/`lantern_out`
  3. Di chuyển Mây (nhảy, lướt, bục nhảy, gió) rồi kiểm tra rơi khỏi đảo
  4. Nhặt đom đóm và bùa
  5. Tương tác với đèn (thắp đèn, thắp lại, châm dầu)
  6. Cập nhật vùng an toàn (chỉ đèn fuel >= 30)
  7. Tỏa Sáng (Pulse stuns bóng mực, +15 nếu đang drain)
  8. Di chuyển Bóng Mực và Gió Lạc (bóng wander tìm đèn yếu fuel < 30 và vào drain)
  9. Chạm (Gió Lạc cướp trước, Bóng Mực gây hit sau theo thứ tự ID)
  10. Sinh thực thể theo lịch
  11. Xét thắng/thua (chỉ xét tại bình minh time_left_s <= 0 hoặc hết máu)
  12. Ghi snapshot

## 3. Lệnh Thường Dùng (Commands)
```bash
# Cài đặt
npm install

# Chạy kiểm thử tự động (29 test suites)
npm test

# Chạy chế độ headless (Test Contract v1.3)
node src/headless.js --seed 42 --night 1 --ticks 120 --out out.jsonl --snapshot-every 10

# Chạy đo kiểm năng Benchmark (30 giây)
node src/benchmark.js --seed 42 --duration 30 --out bench.json

# Chạy kiểm tra độ bền Soak Test (10 đêm)
node src/soak.js --seed 7 --nights 10 --out soak.json

# Xuất bảng xếp hạng cục bộ
node src/headless.js --export-leaderboard leaderboard_export.json

# Mở game có giao diện 3D
npx serve -l 3000 .
```
