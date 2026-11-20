# AGENTS.md — Hướng Dẫn Cho AI Agent

## 1. Thông Tin Dự Án
- **Tên dự án**: Đảo Đèn Lồng (3D Game - AI SDLC Day 12)
- **Học viên**: Trần Quốc Đồng (MSSV: 2A202603643 - Lớp: K5-L3A)
- **Phiên bản hiện tại**: Phase 2 (Test Contract v1.1)

## 2. Quy Tắc Kỹ Thuật (Architecture & Invariants)
- **Tách biệt Core và Visual Layer**:
  - `src/core/`: Chứa toàn bộ trạng thái game 3 Đêm (Đảo Bến, Đảo Cau, Đảo Chuông), PRNG, va chạm, quy tắc logic. Hoạt động độc lập 100% không phụ thuộc DOM / Canvas / GPU.
  - `src/render/`: Three.js hiển thị 3D và Web Audio API sound effects.
- **Tính Tất Định (Determinism)**:
  - Cùng `--seed`, kịch bản `--scenario` và `--inputs` bắt buộc cho ra output byte-for-byte giống hệt nhau.
- **Thứ tự xử lý bắt buộc trong 1 tick (Test Contract v1.1)**:
  1. Đọc input (xử lý pause trước)
  2. Giảm các bộ đếm: thời gian, hồi chiêu, bất tử, choáng, bùa, TTL đom đóm rơi
  3. Di chuyển Mây (nhảy, lướt, bục nhảy, gió) rồi kiểm tra rơi khỏi đảo
  4. Nhặt đom đóm và bùa
  5. Tương tác với đèn
  6. Cập nhật vùng an toàn
  7. Tỏa Sáng
  8. Di chuyển Bóng Mực và Gió Lạc
  9. Chạm (Gió Lạc cướp trước, Bóng Mực gây hit sau theo thứ tự ID)
  10. Sinh thực thể theo lịch
  11. Xét thắng/thua
  12. Ghi snapshot

## 3. Lệnh Thường Dùng (Commands)
```bash
# Cài đặt
npm install

# Chạy kiểm thử tự động (17 test suites)
npm test

# Chạy chế độ headless (Test Contract v1.1)
node src/headless.js --seed 42 --night 1 --ticks 120 --out out.jsonl --snapshot-every 10

# Mở game có giao diện 3D
npx serve -l 3000 .
```
