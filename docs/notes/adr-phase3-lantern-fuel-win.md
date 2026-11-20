# ADR: Phase 3 Change Request — "Đèn cạn dầu" & Giữ sáng tới bình minh

- **Trạng thái**: Accepted
- **Ngày**: 2026-11-20
- **Tác giả**: Trần Quốc Đồng (MSSV: 2A202603643 - Lớp: K5-L3A)
- **Ticket**: TICKET-03 (Phase 3)
- **Contract Version**: v1.2

---

## 1. Bối Cảnh (Context)
Từ dữ liệu playtest Phase 2, người chơi thành thạo có xu hướng thắp hết 5 đèn trên đảo trong vòng dưới 2 phút, dẫn đến việc game kết thúc quá sớm và thiếu đi sự căng thẳng, kịch tính ở giai đoạn cuối Đêm.

Nhà thiết kế game đã ban hành Change Request (TICKET-03):
- Chuyển đổi mục tiêu cốt lõi từ **"thắp hết đèn để thắng ngay"** sang **"quản lý nhiên liệu và bảo vệ các ngọn đèn sáng cho tới khi bình minh xuất hiện"**.
- Đèn đã thắp sáng sẽ tự tiêu hao nhiên liệu (1.0 fuel/s) và có nguy cơ bị Bóng Mực hút cạn dầu (5.0 fuel/s). Khi cạn dầu (`fuel <= 0`), đèn tắt và mất vùng an toàn.
- Thay đổi này ảnh hưởng trực tiếp đến trạng thái game, logic kết thúc (win/loss condition), thứ tự mô phỏng trong tick, và hệ thống chấm điểm.

---

## 2. Quyết Định Thiết Kế (Decisions)

### 2.1 Cơ Chế Nhiên Liệu (Lantern Fuel & Refuel)
1. **Dung lượng**: Mỗi đèn chứa tối đa 100.0 đơn vị nhiên liệu.
2. **Tiêu hao tự nhiên**: Đèn sáng tiêu hao `1.0 unit/s` (tức `1/60` mỗi tick).
3. **Châm dầu (Refuel)**:
   - Người chơi đứng trong bán kính 2.0 m và bấm `Interact` (`E`).
   - `used = min(carried, ceil((100 - fuel) / 10))`
   - `fuel = min(100, fuel + 10 * used)`
   - Trừ `used` đom đóm trong kho chứa của Mây.
   - Thưởng +5 điểm cho mỗi đom đóm nạp vào đèn.
   - Phát sự kiện `refuel: { lantern_id, amount, fuel }`.
4. **Cạn dầu (`lantern_out`)**:
   - Khi `fuel <= 0`, đèn chuyển sang trạng thái tắt (`lit = false`, `deposited = 0`, `fuel = 0.0`).
   - Đèn ghi nhớ cờ `ever_lit = true`.
   - Phát sự kiện `lantern_out: { lantern_id }`.
5. **Thắp lại (`relight`)**:
   - Đèn chưa từng sáng (`ever_lit = false`) cần 10 đom đóm (`lantern_cost = 10`). Thắp sáng lần đầu thưởng +100 điểm.
   - Đèn từng sáng (`ever_lit = true`) chỉ cần 5 đom đóm (`relight_cost = 5`). Thắp lại thưởng +40 điểm và phát `lantern_lit: { lantern_id, relight: true }`.

### 2.2 Bóng Mực Hút Dầu & Mất Vùng An Toàn (Shade Drain)
1. **Ngưỡng nguy hiểm (`low_fuel_threshold = 30.0`)**:
   - Khi `fuel < 30.0`, đèn mất vùng an toàn (Bóng Mực có thể tự do xâm nhập). Đúng 30.0 vẫn duy trì vùng an toàn.
2. **Hành vi tìm đèn yếu (Wander -> Drain)**:
   - Bóng Mực đang ở trạng thái `wander` ưu tiên tìm đèn sáng có `fuel < 30` gần nhất.
   - Khi tiếp cận bán kính $\le 2.0$ m (XZ), Bóng Mực chuyển sang trạng thái mới `drain`, đứng yên và hút 5.0 fuel/s.
   - Mỗi chu kỳ 60 tick hút dầu, phát sự kiện `fuel_drain: { lantern_id, shade_id, fuel }`.
3. **Chuyển đổi trạng thái từ `drain`**:
   - Chuyển sang `chase` nếu Mây lại gần $\le 6.0$ m.
   - Chuyển sang `stunned` nếu trúng Tỏa Sáng (Pulse). Thưởng +15 điểm (thay vì +5 thông thường).
   - Chuyển sang `wander` nếu đèn tắt, đèn được châm dầu lên $\ge 30$, hoặc cự ly $> 2.0$ m.
4. **Kích hoạt lại vùng an toàn**:
   - Khi đèn yếu được châm dầu lên $\ge 30$, nếu có Bóng Mực trong vùng 6 m, chúng bị đẩy ra mép 6 m trong 30 tick tương tự đèn vừa thắp.

### 2.3 Điều Kiện Thắng / Thua Mới (Survive Until Dawn)
- **Xóa bỏ chiến thắng sớm**: Thắp đủ đèn không kết thúc game ngay lập tức.
- **Thắng (`won`, `dawn_survived`)**: Khi hết thời gian (`time_left_s <= 0`), nếu số đèn đang sáng $\ge \lceil 0.6 \times \text{total_lanterns} \rceil$:
  - Đêm 1: $\ge 3 / 5$ đèn sáng.
  - Đêm 2: $\ge 4 / 6$ đèn sáng.
  - Đêm 3: $\ge 5 / 7$ đèn sáng.
- **Thua (`lost`)**:
  - Hết lửa sinh mệnh: `reason: "no_flames"`.
  - Đến bình minh nhưng không đủ 60% đèn sáng: `reason: "dawn"`.

### 2.4 Sức Chứa Tăng Tiến (Progressive Capacity)
- Ban đầu Mây mang tối đa 10 đom đóm.
- Mỗi lần thắp sáng thành công một ngọn đèn (lần đầu hoặc thắp lại):
  `capacity = min(20, 10 + 2 * successful_lights)`.

---

## 3. Hệ Quả & Tương Thích (Consequences & Compatibility)
- **Test Contract v1.2**: Snapshot bổ sung trường `player.capacity`, các đèn trong snapshot có thêm `fuel` (làm tròn 1 chữ số thập phân), `ever_lit` (boolean), `relit_count` (int).
- **Hệ thống test hồi quy**: Cập nhật lại các test case cũ của Phase 1 & Phase 2 phụ thuộc vào cơ chế win sớm hoặc điểm số cũ; bổ sung bộ test độc lập `tests/phase3_features.test.js` kiểm tra 100% các tính năng mới của Phase 3.
