# Đảo Đèn Lồng (Lantern Island) — 3D Game

> Dự án game 3D trong khuôn khổ môn học **AI SDLC (Day 12)**.  
> Học viên: **Trần Quốc Đồng** · MSSV: **2A202603643** · Lớp: **K5-L3A**  
> Mốc bàn giao: **Phase 1** (Tag: `phase-1`) · Tuân thủ **Test Contract v1.0**

---

## 1. Hướng Dẫn Cài Đặt & Chạy Game (Tối đa 3 lệnh)

Chỉ cần môi trường đã cài sẵn **Node.js** (v18 trở lên):

```bash
# 1. Cài đặt các gói phụ thuộc (nếu cần)
npm install

# 2. Khởi chạy máy chủ Web tĩnh cục bộ
npx serve -l 3000 .
```

Sau đó mở trình duyệt tại địa chỉ `http://localhost:3000` để bắt đầu chơi.

---

## 2. Phím Điều Khiển (Controls)

| Phím | Chức năng |
|---|---|
| `W`, `A`, `S`, `D` hoặc Phím Mũi Tên | Di chuyển nhân vật Mây |
| `E` | Nạp đom đóm mang theo vào Đèn Lồng Lớn |
| `Q` hoặc `F` | Kích hoạt **Tỏa sáng (Pulse)** để đẩy lùi và làm choáng Bóng Mực |
| Chuột | Camera 3D góc nhìn thứ ba tự động xoay mượt theo hướng chuyển động |

---

## 3. Luật Chơi & Cách Tính Điểm (Scoring)

- **Mục tiêu**: Thu thập các đốm sáng (đom đóm) rải rác trên Đảo Bến mang về thắp sáng đủ 5 Đèn Lồng Lớn (`L1` đến `L5`). Mỗi đèn cần 3 đom đóm để thắp sáng hoàn toàn.
- **Bóng Mực**: Rình rập trong sương đen và đuổi theo Mây. Nếu chạm phải Mây, Mây sẽ mất 1 ngọn lửa sinh mệnh (flame) và đánh rơi 50% số đom đóm đang giữ.
- **Khu vực an toàn**: Đèn Lồng sau khi được thắp sáng sẽ tạo ra một vùng ánh sáng an toàn (bán kính 4.0m) xua đuổi Bóng Mực.
- **Điều kiện thắng**: Thắp sáng toàn bộ 5 Đèn Lồng Lớn.
- **Điều kiện thua**: Hết ngọn lửa sinh lực (0 flames) hoặc hết thời gian Đêm 1 (180 giây).

### Công thức tính điểm:
- **Nhặt 1 đom đóm**: `+10 điểm`
- **Thắp sáng 1 Đèn Lồng**: `+100 điểm`
- **Làm choáng 1 Bóng Mực**: `+20 điểm`
- **Thưởng khi chiến thắng**:
  - `+5 điểm` cho mỗi giây còn lại
  - `+50 điểm` cho mỗi ngọn lửa sinh mệnh còn giữ được

---

## 4. Chế Độ Headless & Kiểm Thử Tự Động

Tuân thủ nghiêm ngặt **Test Contract v1.0** qua file khai báo `game.contract.json`.

### Chạy chế độ headless:
```bash
node src/headless.js --seed 42 --night 1 --ticks 120 --out output.jsonl --snapshot-every 10
```

### Chạy toàn bộ bộ kiểm thử tự động (Unit test, Scenarios, Determinism):
```bash
npm test
```

---

## 5. Sáng Tạo Của Tôi (My Creative Additions)

Trong khuôn khổ Phase 1, nhằm nâng cao tính nghệ thuật và cổ tích mà **hoàn toàn không làm ảnh hưởng đến Test Contract v1.0**:
1. **Âm thanh tổng hợp theo thời gian thực (Procedural Web Audio API)**:
   - Toàn bộ hiệu ứng âm thanh (tiếng chuông gió khi nhặt đom đóm, tiếng cồng lan tỏa khi Mây phát quang, giai điệu thắp đèn, tiếng va chạm u tối của Bóng Mực) được tổng hợp bằng bộ dao động tần số trực tiếp, không phụ thuộc vào file âm thanh ngoài.
2. **Chiếc nón lá truyền thống & Đèn bão bập bùng**:
   - Nhân vật Mây được thiết kế với chiếc nón lá Việt Nam và một chiếc đèn nhỏ treo bên hông. Đèn sẽ tỏa sáng rực rỡ hơn tương ứng với số đom đóm Mây đang thu gom được trong túi.
3. **Hiển thị sóng ánh sáng dạng vành khuyên (Pulse Ring Effect)**:
   - Khi Mây kích hoạt Tỏa Sáng, một vòng sóng ánh sáng vàng cam ấm áp mở rộng xua tan bóng tối quanh Mây.
4. **Cô lập logic**: Các hiệu ứng đồ họa và âm thanh trên được đóng gói riêng trong lớp `src/render/`, chế độ headless chạy thuần logic và đạt tính tất định 100%.

---

## 6. Minh Chứng Kiểm Chứng (Proof of Verification)
Bằng chứng chi tiết, kết quả chạy test và trace matrix được lưu tại [docs/proof/phase-1/proof.md](docs/proof/phase-1/proof.md).
