# Nhật Ký Làm Việc Với AI & Đánh Giá SDLC (AI Log)

Học viên: Trần Quốc Đồng (MSSV: 2A202603643)

## Phase 0: Chuẩn Bị & Khởi Tạo Môi Trường
- **Mục tiêu**: Tạo cấu trúc chuẩn cho dự án, harness AI `AGENTS.md`, cấu hình test runner.
- **Quyết định kiến trúc**: Chọn Node.js và Three.js để dễ dàng chạy đa nền tảng (Windows/macOS/Linux), đảm bảo core logic chạy headless không phụ thuộc vào window/GPU.

## Phase 1: PRD-0 & Test Contract v1.0
- **Phân tích yêu cầu**:
  - Tách bạch yêu cầu bắt buộc: Test Contract v1.0, các sự kiện (`mote_picked`, `deposit`, `lantern_lit`, `pulse`, `player_hit`, `game_over`), định dạng JSONL, tính tất định (`determinism`).
  - Xác định các thông số tuning đưa vào `game.contract.json`.
- **Harness đã sử dụng**:
  - `AGENTS.md`: Quy định rõ lệnh test, lệnh headless và quy tắc tách biệt core vs render.
  - Bộ kiểm thử tự động với 8 test case kiểm tra mọi kịch bản (thu thập, nạp đèn, làm choáng, sát thương, thắng/thua, tính tất định).
- **Ước tính Token & Tối ưu hóa**:
  - Giữ ngữ cảnh ngắn gọn, đọc file theo đúng mục tiêu.
  - Sử dụng các file fixture JSON nhỏ gọn để kiểm thử tự động, tránh lãng phí token vào các vòng lặp kiểm tra thủ công.
  - Chi phí token ước tính cho Phase 1: ~35k prompt tokens, ~6k completion tokens.
- **Tự đánh giá & Retro Phase 1**:
  - *Điểm tốt*: Core logic chạy mượt mà, đạt 100% tiêu chí Test Contract v1.0, test chạy trong 300ms. Game 3D chơi được với đầy đủ HUD, âm thanh và hiệu ứng.
  - *Bài học*: Việc viết test kịch bản trước khi code logic giúp phát hiện ngay các trường hợp biên của việc chuyển đổi tick và góc quay camera.
