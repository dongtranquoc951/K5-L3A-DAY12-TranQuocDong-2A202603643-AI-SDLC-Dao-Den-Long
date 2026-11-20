# Báo Cáo Retrospective: Phát Hành Dự Án Đảo Đèn Lồng v1.0.0

- **Học viên**: Trần Quốc Đồng
- **MSSV**: 2A202603643
- **Lớp**: K5-L3A
- **Thời điểm**: 2026-11-20
- **Phiên bản phát hành**: v1.0.0 (Phase 4 — Contract v1.3)

---

## 1. Tổng Kết Đánh Giá Qua 4 Phase (Evaluation Summary)

| Giai đoạn | Mục tiêu cốt lõi | Kết quả đạt được | Điểm nổi bật & Thách thức |
| :--- | :--- | :--- | :--- |
| **Phase 1 (Contract v1.0)** | Đảo Bến, di chuyển 3D, nhặt đom đóm, thắp đèn, Tỏa Sáng, né Bóng Mực | 100% test pass, hoàn thành khung game tách bạch Core/Render | Thiết lập PRNG tất định và cơ chế snapshot làm nền tảng vững chắc |
| **Phase 2 (Contract v1.1)** | Chuẩn hóa vật lý, 3 Đêm, lướt (Dash), bục nhảy, Gió Lạc, Bùa Gió, Pause | Hoàn thành đúng số liệu chuẩn, mở rộng 3 hòn đảo khác biệt | Đo đạc va chạm địa hình 3D dốc và bục nhảy liên đảo chính xác |
| **Phase 3 (Contract v1.2)** | Change Request "Đèn cạn dầu", Bóng hút dầu, sống sót tới bình minh | Thay đổi luật cốt lõi an toàn, không phá vỡ logic cũ | Cập nhật hệ thống test hồi quy, bổ sung thanh nhiên liệu 3D trực quan |
| **Phase 4 (Contract v1.3)** | Non-functional: Benchmark, Soak test 10 đêm, Bảng xếp hạng, Trợ năng | avg_fps > 13.000, rò rỉ RAM 0%, 29 test suite pass 100% | Tối ưu hóa bộ nhớ tiến trình, chế độ đổi phím và hỗ trợ tiếp cận |

---

## 2. Bài Học Khi Làm Việc Cùng AI Agent (What Worked & What Didn't)

### Điều Hiệu Quả (What Worked Well):
1. **Kiến trúc phân tách Core & Visual Layer**: Giữ cho `src/core/` 100% độc lập với DOM và GPU giúp AI chạy test tự động trong tích tắc mà không phụ thuộc môi trường đồ họa.
2. **Contract-Driven Development**: Việc quy định chặt chẽ Test Contract (`game.contract.json`) và thứ tự xử lý trong 1 tick giúp AI không đi chệch hướng, đảm bảo tính tất định trên mọi nền tảng.
3. **Phát triển TDD (Test-Driven)**: Viết test scenario trước hoặc song song giúp phát hiện sớm các sai sót logic (ví dụ: hao hụt dầu làm tròn số thực, khoảng cách nhận diện kẻ địch).

### Điều Chưa Hiệu Quả & Những Lần AI Sai (What Didn't Work & AI Mistakes):
1. **Lệch hệ trục tọa độ camera 3D**: AI từng nhầm lẫn chiều dương/âm của trục Z khi kết hợp camera góc nhìn thứ 3 với vector di chuyển, dẫn đến phím W/S và xoay góc nhìn bị ngược.
   - *Cách phát hiện*: Trực tiếp chơi thử trên trình duyệt qua `npx serve` và kiểm tra phản ứng của nhân vật theo hướng nhìn camera.
2. **Gán đè mảng cấu hình trong hàm khởi tạo**: Ở Phase 2, AI từng khởi tạo `this.initMapData()` sau đó lại gán `this.charms = []`, làm mất dữ liệu bùa gió.
   - *Cách phát hiện*: Test suite `Phase 2 Feature: Wind Charm` báo lỗi không tìm thấy thực thể bùa trên map.

---

## 3. Harness Trợ Lực Đắc Lực Nhất (Most Helpful Harnesses)
- **`AGENTS.md`**: Đóng vai trò kim chỉ nam lưu trữ thứ tự bắt buộc 12 bước trong 1 tick, các lệnh thường dùng và nguyên tắc bất biến (invariants).
- **Test Runner tích hợp `node:test`**: Tốc độ thực thi cực nhanh (toàn bộ 29 tests chỉ chạy trong ~1.5 giây), không cần cài đặt Jest/Mocha nặng nề.
- **Git Tags & Checkpoints**: Lưu lại trạng thái từng phase (`phase-1`, `phase-2`, `phase-3`, `phase-4`), dễ dàng đối chiếu sự thay đổi qua `git diff`.

---

## 4. Ước Tính Token & Chiến Lược Tiết Kiệm (Token & Cost Optimization)
- **Tổng token ước tính**: ~110.000 tokens qua cả 4 giai đoạn.
- **Cách tiết kiệm token**:
  - Gộp các lệnh kiểm tra và chỉnh sửa song song trong một lượt gọi tool.
  - Sử dụng tệp nhật ký `ai-log.md` và tóm tắt ngữ cảnh tự động thay vì đọc đi đọc lại toàn bộ mã nguồn.
  - Tận dụng `run_command` kiểm tra diff thay vì đọc toàn bộ tệp lớn.

---

## 5. Nếu Làm Lại Từ Đầu Thì Sẽ Thay Đổi Gì?
- Ngay từ Phase 1, sẽ định nghĩa quy ước hệ trục tọa độ Camera và phím bấm thành một tài liệu chuẩn (Spec) để không phải chỉnh sửa lại hướng di chuyển ở Phase 3.
- Xây dựng sẵn bộ công cụ tạo visual mock và benchmark ngay từ đầu để theo dõi hiệu năng liên tục qua từng commit.
