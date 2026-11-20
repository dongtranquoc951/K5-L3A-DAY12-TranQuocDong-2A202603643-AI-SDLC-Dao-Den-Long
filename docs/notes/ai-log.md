# Nhật Ký Làm Việc Với AI & Đánh Giá SDLC (AI Log)

Học viên: Trần Quốc Đồng (MSSV: 2A202603643)

## Phase 0: Chuẩn Bị & Khởi Tạo Môi Trường
- Thiết lập kiến trúc Core vs Render, cấu hình `package.json`, `AGENTS.md`.

## Phase 1: PRD-0 & Test Contract v1.0
- Hiện thực hóa core game Đêm 1 (Đảo Bến), 8 test suite, xuất bản tag `phase-1`.

## Phase 2: Ticket-02 — "Ba Hòn Đảo" & Test Contract v1.1
- **Phân tích thay đổi**:
  - Chuẩn hóa toàn bộ số liệu: tốc độ chạy 6.0 m/s, nhảy 7.0 m/s, trọng lực -20 m/s², lướt 14 m/s (12 ticks, cd 90 ticks).
  - Đèn cần 10 đom đóm, Tỏa Sáng cần 3 đom đóm, điểm số chuẩn hóa tính khi nạp đom đóm (+10), thắp đèn (+100), choáng bóng mực (+5).
  - Tách bạch thứ tự xử lý nghiêm ngặt trong 1 tick: Pause -> Giảm đếm -> Di chuyển Mây -> Nhặt đom đóm & Bùa -> Tương tác đèn -> Vùng an toàn -> Tỏa Sáng -> Di chuyển địch -> Va chạm -> Sinh thực thể -> Xét thắng thua.
- **Xử lý hồi quy (Regression)**:
  - Cập nhật các test cũ của Phase 1 sang số chuẩn (chi phí đèn 10, chi phí tỏa sáng 3, điểm số tính theo nạp). Cả 8 test cũ đều xanh.
- **Tối ưu hóa Token & Hiệu Năng**:
  - Tận dụng cấu trúc dữ liệu Map và PRNG Mulberry32 tối ưu giúp chạy 21.600 ticks mô phỏng chỉ trong **~780ms**, vượt xa yêu cầu $\le 30\text{ s}$.
  - Sửa lỗi hướng camera 3D và góc nhìn điều khiển (W hướng thẳng về phía trước theo camera, chuột kéo xoay góc nhìn 3D mượt mà).
  - Cải thiện chất lượng hình ảnh: Bầu trời sao lấp lánh (starfield), đổ bóng thời gian thực (soft shadows), đèn lồng chạm khắc 8 cạnh, đom đóm 2 lớp phát sáng aura, và mũi tên định vị đèn chưa thắp ngoài màn hình.
  - Ước tính token sử dụng cho Phase 2: ~46k prompt tokens, ~10k completion tokens.
