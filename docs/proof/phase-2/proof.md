# Bằng Chứng Kiểm Chứng Phase 2 (Verification Proof)

- **Mốc bàn giao**: Phase 2 (Tag `phase-2`)
- **Học viên**: Trần Quốc Đồng (MSSV: 2A202603643)
- **Phiên bản Contract**: `v1.1`

## 1. Ma Trận Truy Vết Yêu Cầu (Traceability Matrix)

| Mã yêu cầu | Yêu cầu chính (Ticket-02) | Phương pháp kiểm chứng | Bằng chứng | Kết quả |
|---|---|---|---|---|
| REQ-P2-01 | Chuẩn hóa thông số tuning Contract v1.1 | Chạy `game.contract.json` & Unit test | Khớp 100% số liệu Phần 1 Ticket-02 | ĐẠT |
| REQ-P2-02 | Kỹ năng Lướt (Dash) 14 m/s trong 0.2s | Headless scenario `tests/phase2_features.test.js` | Event `dash` được phát sinh, Mây di chuyển ~2.8m trong 12 ticks | ĐẠT |
| REQ-P2-03 | Bùa Gió (Wind Charm) tăng tốc & hồi lướt tức thì | Headless scenario `tests/phase2_features.test.js` | Event `charm_picked` (600 ticks), tốc độ 7.2 m/s, hồi lướt 0s | ĐẠT |
| REQ-P2-04 | Kẻ địch Gió Lạc (Drifter) cướp đom đóm | Headless scenario `tests/phase2_features.test.js` | Event `drifter_steal` cướp 3 đom đóm, Drifter chuyển `flee` | ĐẠT |
| REQ-P2-05 | Bục nhảy (Launch Pad) phóng Mây qua đảo | Headless scenario `tests/phase2_features.test.js` | Mây bay lên cao $Y > 1\text{ m}$, vận tốc giữ nguyên khi bay | ĐẠT |
| REQ-P2-06 | Tạm dừng (Pause / Resume) qua phím Esc/P | Headless scenario `tests/phase2_features.test.js` | Ghi nhận event `paused` và `resumed`, `state: "paused"` | ĐẠT |
| REQ-P2-07 | Rơi khỏi đảo ($Y < -10$) phạt mất máu & đom đóm | Headless scenario `tests/phase2_features.test.js` | Event `player_hit` `{by: "fall", lost: 5}`, hồi sinh sau 60 ticks | ĐẠT |
| REQ-P2-08 | Đêm 2 (Đảo Cau) 6 đèn, cầu tre, bục nhảy | Headless scenario `tests/phase2_nights.test.js` | Chạy headless Đêm 2 ra snapshot đúng 6 đèn, 1 bùa | ĐẠT |
| REQ-P2-09 | Đêm 3 (Đảo Chuông) 7 đèn, 3 tầng, gió mạnh | Headless scenario `tests/phase2_nights.test.js` | Chạy headless Đêm 3 ra snapshot đúng 7 đèn, 2 bùa, gió | ĐẠT |
| REQ-P2-10 | Hiệu năng headless 21.600 ticks $\le 30\text{ s}$ | Benchmark test `tests/phase2_nights.test.js` | Hoàn thành 21.600 ticks trong **0.78 giây** (nhanh gấp 38 lần) | ĐẠT |
| REQ-P2-11 | Hồi quy Phase 1 (Regression Tests) | 8 test suite từ Phase 1 cập nhật số chuẩn | 8/8 test suite hồi quy vượt qua 100% | ĐẠT |

## 2. Kết Quả Chạy Toàn Bộ Bộ Kiểm Thử Tự Động (npm test)

```text
> dao-den-long@1.0.0 test
> node --test

✔ Scenario Basic: Player moves and collects motes (23.5513ms)
✔ Scenario Deposit: Player deposits carried motes into lantern and lights it (25.0611ms)
✔ Scenario Pulse: Player pulses with >= 3 motes to stun and push nearby shade (23.3497ms)
✔ GameCore initializes and ticks deterministically (1.5829ms)
✔ Determinism Test: Same seed and inputs produce byte-identical JSONL output (37.9062ms)
✔ Win Condition: Lighting all 5 lanterns triggers game_over won all_lit (38.0989ms)
✔ Loss Condition: Shade damage reduces flames to 0 triggers game_over lost no_flames (19.8324ms)
✔ Loss Condition: Time running out triggers game_over lost dawn (16.1455ms)
✔ Phase 2 Feature: Dash (Lướt) moves player at 14 m/s and emits dash event (29.3436ms)
✔ Phase 2 Feature: Wind Charm (Bùa Gió) boosts speed and gives zero dash cooldown (28.073ms)
✔ Phase 2 Feature: Drifter (Gió Lạc) steals motes when player carries >= 5 (16.3487ms)
✔ Phase 2 Feature: Launch Pad (Bục nhảy) launches Mây across island (9.6034ms)
✔ Phase 2 Feature: Pause & Resume toggles state and emits events (19.9024ms)
✔ Phase 2 Feature: Falling off island drops flames and carried motes (12.9182ms)
✔ Phase 2 Nights: Night 2 (Đảo Cau) runs headless with 6 lanterns and bamboo bridge (24.0437ms)
✔ Phase 2 Nights: Night 3 (Đảo Chuông) runs headless with 7 lanterns, 3 tiers and wind (16.3477ms)
✔ Phase 2 Performance: 21600 ticks headless simulation completes in < 5 seconds (779.4878ms)
ℹ tests 17
ℹ suites 0
ℹ pass 17
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1233.637
```
