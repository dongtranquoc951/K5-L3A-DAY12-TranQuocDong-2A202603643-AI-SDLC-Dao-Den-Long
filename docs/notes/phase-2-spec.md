# Đặc Tả Kỹ Thuật & Tiêu Chí Nghiệm Thu Phase 2 (Ticket-02)

- **Dự án**: Đảo Đèn Lồng — 3D Game
- **Học viên**: Trần Quốc Đồng (MSSV: 2A202603643 - K5-L3A)
- **Mốc bàn giao**: Phase 2 (Tag: `phase-2`) · Test Contract `v1.1`

## 1. Tiêu Chí Nghiệm Thu (Acceptance Criteria) Các Tính Năng Mới

### AC-01: Cơ chế Lướt (Dash)
- **Điều kiện**: Nhấn nút Lướt (`Shift` hoặc `C`, input `dash: true`).
- **Hành vi**:
  - Mây lướt với vận tốc $14.0\text{ m/s}$ trong $0.2\text{ s}$ (12 ticks).
  - Hướng lướt: hướng di chuyển hiện tại; nếu đứng yên thì theo hướng Mây đang quay mặt.
  - Hồi chiêu: $1.5\text{ s}$ (90 ticks) tính từ lúc bắt đầu lướt.
  - Khi lướt trên không: giữ nguyên độ cao ($v_y = 0$). Không bất tử khi lướt.
  - Phát sinh event: `{"type":"event","tick":k,"name":"dash","data":{}}`.

### AC-02: Bùa Gió (Wind Charm)
- **Vị trí**: Đêm 2 tại $(35, 0, 0)$ trên cầu tre; Đêm 3 tại $(30, 0, 25)$ và $(-30, 0, 25)$.
- **Hành vi**:
  - Nhặt tự động khi $XZ \le 1.0\text{ m}$ và $|\Delta Y| \le 1.5\text{ m}$.
  - Hiệu lực $10\text{ s}$ (600 ticks). Nhặt lại làm mới thời gian.
  - Tốc độ chạy tăng lên $7.2\text{ m/s}$.
  - Lướt không có thời gian hồi chiêu (cooldown = 0).
  - Tái xuất hiện sau $45\text{ s}$ (2700 ticks).
  - Phát sinh event: `{"type":"event","tick":k,"name":"charm_picked","data":{"charm_id":"C1","charm_ticks":600}}`.

### AC-03: Kẻ địch Gió Lạc (Drifters)
- **Xuất hiện**: Đêm 2 và Đêm 3, tối đa 2 con, sinh lúc tick 1200, 2400,...
- **Hành vi**:
  - Trạng thái `idle` (bay 2 m/s) $\rightarrow$ `chase` khi Mây mang $\ge 5$ đom đóm và cự ly $\le 15\text{ m}$.
  - Chạm Mây ($XZ \le 1.2\text{ m}$): cướp $\min(3, \text{đang mang})$ đom đóm, chuyển `flee` bay xa 7 m/s trong 240 ticks rồi biến mất.
  - Tỏa Sáng trúng: nếu đang `chase` $\rightarrow$ `flee` không cướp; nếu đang `flee` có đồ $\rightarrow$ thả toàn bộ đom đóm đã cướp tại chỗ (TTL 480 ticks) và biến mất sau 120 ticks.
  - Không làm mất ngọn lửa; vùng an toàn không chặn Gió Lạc.
  - Sự kiện: `drifter_steal` và `drifter_drop`.

### AC-04: Bục Nhảy (Launch Pads) & Địa Hình
- **Đêm 2 (Đảo Cau)**: Hai đảo bán kính 28m cách nhau 70m, cầu tre ở giữa không lan can. 2 bục nhảy tại $(20,0,18)$ và $(50,0,-18)$ phóng Mây lên với $v_y = 14\text{ m/s}, v_h = 24\text{ m/s}$ sang đảo đối diện.
- **Đêm 3 (Đảo Chuông)**: Đảo 3 tầng (Y=0, 3, 6m). Bục nhảy tại $(0,3,13)$ phóng lên Tầng 2 ($v_y = 12\text{ m/s}, v_z = -8\text{ m/s}$). Gió mạnh giật 2 m/s mỗi 30s kéo dài 5s.

### AC-05: Tạm Dừng (Pause)
- Nhấn `Esc` hoặc `P` (input `pause: true`).
- Logic dừng hoàn toàn: `sim_tick`, bộ đếm thời gian, hồi chiêu, spawn đứng yên. Snapshot ghi `state: "paused"`.
- Phát sinh event: `paused` và `resumed`.

### AC-06: Rơi Khỏi Đảo (Y < -10)
- Trừ 1 Ngọn Lửa, mất toàn bộ đom đóm.
- Chờ 60 ticks rồi hồi sinh tại $(0,0,0)$ với vận tốc 0, bất tử 90 ticks.
- Nếu hết Ngọn Lửa: thua ngay (`game_over` lý do `no_flames`).
- Phát sinh event: `player_hit` với `{ "by": "fall", "flames": n, "dropped": 0, "lost": n }`.

### AC-07: Chuỗi 3 Đêm & HUD Hoàn Chỉnh
- Menu dẫn truyện lời Ông Đăng $\rightarrow$ chơi $\rightarrow$ tổng kết $\rightarrow$ sang Đêm tiếp theo. Thắng Đêm 3 hiện màn hình Bình Minh tổng kết điểm toàn bộ hành trình.
- Đầy đủ HUD 10 ô đom đóm, đồng hồ đếm ngược chuyển đỏ/nhấp nháy khi $\le 30\text{ s}$, biểu tượng hồi chiêu, lời nhắc nạp ánh sáng.
