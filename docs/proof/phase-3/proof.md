# Bằng Chứng Kiểm Thử & Ma Trận Yêu Cầu — Phase 3 (Contract v1.2)

- **Học viên**: Trần Quốc Đồng (MSSV: 2A202603643 - Lớp: K5-L3A)
- **Dự án**: Đảo Đèn Lồng (3D Game - AI SDLC Day 12)
- **Tag**: `phase-3`
- **Phiên bản Contract**: `1.2`

---

## 1. Ma Trận Truy Vết Yêu Cầu (Traceability Matrix)

| STT | Yêu Cầu TICKET-03 (Phase 3) | Hiện Thực Mã Nguồn | Kiểm Thử Tự Động (Automated Test) | Kết Quả |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Nhiên liệu đèn: max 100, hao hụt 1.0 unit/s | `src/core/engine.js` (lines 389-425) | `tests/phase3_features.test.js` | **PASS** |
| **2** | Châm dầu: nạp `min(carried, ceil((100 - fuel)/10))` | `src/core/engine.js` (lines 712-748) | `tests/phase3_features.test.js` | **PASS** |
| **3** | Cạn dầu: `fuel <= 0` chuyển sang tắt, `ever_lit = true`, phát `lantern_out` | `src/core/engine.js` (lines 420-432) | `tests/phase3_features.test.js` | **PASS** |
| **4** | Thắp lại đèn cũ (`ever_lit`): chỉ cần 5 đom đóm, thưởng +40 | `src/core/engine.js` (lines 669-709) | `tests/phase3_features.test.js` | **PASS** |
| **5** | Đèn `fuel < 30` mất vùng an toàn | `src/core/engine.js` (lines 751-765) | `tests/phase3_features.test.js` | **PASS** |
| **6** | Bóng Mực hút dầu: trạng thái `drain` khi cách đèn yếu $\le 2$m, hút 5/s, phát `fuel_drain` | `src/core/engine.js` (lines 396-415, 847-859, 917-919) | `tests/phase3_features.test.js` | **PASS** |
| **7** | Pulse trúng Bóng Mực đang drain thưởng +15 | `src/core/engine.js` (lines 783-795) | `tests/phase3_features.test.js` | **PASS** |
| **8** | Châm dầu lên $\ge 30$ đẩy lùi Bóng Mực trong 6m | `src/core/engine.js` (lines 733-745) | `tests/phase3_features.test.js` | **PASS** |
| **9** | Mục tiêu thắng mới: Sống sót tới bình minh với $\ge 60\%$ đèn sáng (`dawn_survived`) | `src/core/engine.js` (lines 1111-1127) | `tests/gameover.test.js` | **PASS** |
| **10** | Thua tại bình minh khi $< 60\%$ đèn sáng (`dawn`) | `src/core/engine.js` (lines 1128-1135) | `tests/phase3_features.test.js` | **PASS** |
| **11** | Sức chứa tăng tiến: `min(20, 10 + 2 * successful_lights)` | `src/core/engine.js` (line 702) | `tests/phase3_features.test.js` | **PASS** |
| **12** | Chế độ Mù màu (Colorblind Mode) & Trợ năng | `src/render/game3d.js`, `index.html` | Visual verification in UI | **PASS** |
| **13** | Sửa lỗi đảo ngược phím di chuyển W/S | `src/render/game3d.js` (lines 526-530, 630-633) | Browser manual test & input alignment | **PASS** |
| **14** | Snapshot v1.2 schema (`player.capacity`, `fuel`, `ever_lit`, `relit_count`) | `src/core/engine.js` (lines 1163, 1169-1177) | `tests/phase3_features.test.js` | **PASS** |
| **15** | Hiệu năng mô phỏng 1 Đêm (14.400 tick) $\le 30$ giây | `src/headless.js`, `src/core/engine.js` | `tests/phase3_features.test.js` (~1.7s) | **PASS** |

---

## 2. Kết Quả Kiểm Thử Toàn Diện (npm test)

```
> dao-den-long@1.0.0 test
> node --test

✔ Scenario Basic: Player moves and collects motes (56.4486ms)
✔ Scenario Deposit: Player deposits carried motes into lantern and lights it (51.3482ms)
✔ Scenario Pulse: Player pulses with >= 3 motes to stun and push nearby shade (163.583ms)
✔ GameCore initializes and ticks deterministically (9.1647ms)
✔ Determinism Test: Same seed and inputs produce byte-identical JSONL output (93.7944ms)
✔ Win Condition: Surviving until dawn with >= 60% lit lanterns triggers game_over won dawn_survived (61.8588ms)
✔ Loss Condition: Shade damage reduces flames to 0 triggers game_over lost no_flames (48.2747ms)
✔ Loss Condition: Time running out triggers game_over lost dawn (52.3234ms)
✔ Phase 2 Feature: Dash (Lướt) moves player at 14 m/s and emits dash event (160.3017ms)
✔ Phase 2 Feature: Wind Charm (Bùa Gió) boosts speed and gives zero dash cooldown (47.0574ms)
✔ Phase 2 Feature: Drifter (Gió Lạc) steals motes when player carries >= 5 (32.9556ms)
✔ Phase 2 Feature: Launch Pad (Bục nhảy) launches Mây across island (41.687ms)
✔ Phase 2 Feature: Pause & Resume toggles state and emits events (39.4766ms)
✔ Phase 2 Feature: Falling off island drops flames and carried motes (28.8551ms)
✔ Phase 2 Nights: Night 2 (Đảo Cau) runs headless with 6 lanterns and bamboo bridge (91.0398ms)
✔ Phase 2 Nights: Night 3 (Đảo Chuông) runs headless with 7 lanterns, 3 tiers and wind (13.3317ms)
✔ Phase 2 Performance: 21600 ticks headless simulation completes in < 5 seconds (1830.0582ms)
✔ Phase 3 Feature: Fuel Decay & lantern_out event (99.3443ms)
✔ Phase 3 Feature: Refueling lit lantern adds fuel and awards +5 per mote (27.7973ms)
✔ Phase 3 Feature: Relighting ever-lit lantern requires only 5 motes and awards +40 (37.9405ms)
✔ Phase 3 Feature: Shade enters drain state on weak lantern (fuel < 30) and emits fuel_drain event (37.1292ms)
✔ Phase 3 Feature: Pulse stunning a draining shade awards +15 score (50.8867ms)
✔ Phase 3 Feature: Progressive carry capacity increases with successful lights (26.3142ms)
✔ Phase 3 Feature: Dawn Loss triggers if < 60% lanterns are lit at dawn (30.3622ms)
✔ Phase 3 Performance: 14400 ticks (1 full Night) headless simulation completes in <= 30 seconds (1756.7444ms)
ℹ tests 25
ℹ suites 0
ℹ pass 25
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3049.2552
```
