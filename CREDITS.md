# CREDITS & ATTRIBUTION — Đảo Đèn Lồng

Dự án game 3D **Đảo Đèn Lồng** (Lantern Island) được phát triển trong khuôn khổ môn học **AI SDLC (Day 12)**.
- **Học viên**: Trần Quốc Đồng
- **MSSV**: 2A202603643
- **Lớp**: K5-L3A
- **Phiên bản phát hành**: v1.0.0 (Phase 4 — Contract v1.3)

---

## 1. Công Cụ AI & Mô Hình Trợ Lực (AI Tools)
- **Google DeepMind Antigravity Agentic Assistant**: Hỗ trợ thiết kế kiến trúc, lập trình logic tất định, tối ưu thuật toán vật lý 60 tick/giây, soạn thảo tài liệu kỹ thuật và tự động hóa kiểm thử hồi quy.
- **Gemini 2.5 Pro**: Hỗ trợ suy luận kiến trúc hướng contract-driven, xây dựng các ADR và giải quyết các bài toán biên phức tạp (soak test, benchmark, math camera orientation).

---

## 2. Thư Viện Mã Nguồn Mở (Open Source Libraries)
- **Three.js (r128)**: Thư viện WebGL 3D render đồ họa, chiếu sáng bóng đổ mềm (PCFSoftShadowMap), vật liệu phong cách low-poly cổ tích.
  - Bản quyền: MIT License (Mr.doob & Three.js Authors).
- **Node.js Test Runner (`node:test`, `node:assert`)**: Nền tảng thực thi kiểm thử tự động không phụ thuộc bên ngoài.
- **Serve (`npx serve`)**: Máy chủ tệp tĩnh cục bộ phát hành ứng dụng web.

---

## 3. Âm Thanh & Đồ Họa (Audio & Assets)
- **Âm thanh Procedural (Web Audio API)**:
  - Toàn bộ các hiệu ứng âm thanh (tiếng chuông đom đóm, tiếng lướt gió dash, tiếng cồng Tỏa Sáng, tiếng nhặt bùa may mắn, nhịp đếm ngược 10 giây) được tổng hợp trực tiếp bằng các bộ tạo sóng (Oscillator, Gain, Lowpass Filter) qua Web Audio API của trình duyệt. Không sử dụng tệp âm thanh bên ngoài, dung lượng 0 KB.
- **Mô hình 3D Hình học Procedural**:
  - Nhân vật Mây (áo nâu kem, khăn quàng đỏ, nón lá Việt Nam, đèn bão), Đèn Lồng Lớn 8 cạnh, Bóng Mực tím đen, Gió Lạc lụa xám, Bùa Gió đỏ viền vàng, Cầu tre và Tháp chuông cổ được dựng 100% bằng Three.js primitive geometries, đạt hiệu năng tối đa.
