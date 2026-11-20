# AGENTS.md — Hướng Dẫn Cho AI Agent

## 1. Thông Tin Dự Án
- **Tên dự án**: Đảo Đèn Lồng (3D Game - AI SDLC Day 12)
- **Học viên**: Trần Quốc Đồng (MSSV: 2A202603643 - Lớp: K5-L3A)

## 2. Quy Tắc Kỹ Thuật (Architecture & Invariants)
- **Tách biệt Core và Visual Layer**:
  - `src/core/`: Chứa toàn bộ trạng thái game, PRNG, va chạm, quy tắc logic. Hoạt động độc lập 100% không phụ thuộc DOM / Canvas / GPU.
  - `src/render/`: Three.js hiển thị 3D và Web Audio API sound effects.
- **Tính Tất Định (Determinism)**:
  - Cùng `--seed`, kịch bản `--scenario` và `--inputs` bắt buộc cho ra output byte-for-byte giống hệt nhau.
- **Tuân thủ Test Contract v1.0**:
  - Tọa độ làm tròn đúng 3 chữ số thập phân (`round3`).
  - Đơn vị đo là mét trên mặt phẳng ngang XZ.
  - Snapshot ở tick 0 và mỗi `--snapshot-every` tick.
  - Dòng cuối bắt buộc là `end`.

## 3. Lệnh Thường Dùng (Commands)
```bash
# Cài đặt
npm install

# Chạy kiểm thử tự động
npm test

# Chạy chế độ headless
node src/headless.js --seed 42 --night 1 --ticks 120 --out out.jsonl

# Mở game có giao diện
npx serve -l 3000 .
```
