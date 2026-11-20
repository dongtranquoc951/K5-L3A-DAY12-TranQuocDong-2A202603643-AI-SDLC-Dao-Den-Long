# Bằng Chứng Kiểm Chứng Phase 1 (Verification Proof)

- **Mốc bàn giao**: Phase 1 (Tag `phase-1`)
- **Học viên**: Trần Quốc Đồng (MSSV: 2A202603643)

## 1. Ma Trận Truy Vết Yêu Cầu (Traceability Matrix)

| Mã yêu cầu | Yêu cầu chính (PRD-0) | Phương pháp kiểm chứng | Bằng chứng | Kết quả |
|---|---|---|---|---|
| REQ-01 | Nhân vật Mây di chuyển và nhặt đom đóm | Scenario Test (`scenario_basic.json` + `inputs_walk.json`) | `Scenario Basic: Player moves and collects motes` pass 100%, ghi nhận event `mote_picked` | ĐẠT |
| REQ-02 | Nạp đom đóm vào Đèn Lồng Lớn | Scenario Test (`scenario_deposit.json` + `inputs_deposit.json`) | Ghi nhận event `deposit` và `lantern_lit` đúng ID `L1` | ĐẠT |
| REQ-03 | Kỹ năng Tỏa Sáng (Pulse) xua và làm choáng Bóng Mực | Scenario Test (`scenario_pulse.json` + `inputs_pulse.json`) | Ghi nhận event `pulse` với `stunned_ids: ["S1"]`, Bóng Mực bị đẩy lùi | ĐẠT |
| REQ-04 | Bóng Mực va chạm làm mất máu (flames) | Scenario Test sát thương | Ghi nhận event `player_hit` giảm `flames` và làm rơi đom đóm | ĐẠT |
| REQ-05 | Điều kiện Thắng: thắp đủ 5 Đèn Lồng | Scenario Win Test (`gameover.test.js`) | Ghi nhận event `game_over` với `result: "won", reason: "all_lit"` | ĐẠT |
| REQ-06 | Điều kiện Thua: hết máu hoặc hết giờ | Scenario Loss Test (`gameover.test.js`) | Ghi nhận event `game_over` với `no_flames` và `dawn` | ĐẠT |
| REQ-07 | Tính tất định (Determinism) theo Test Contract v1.0 | Chạy headless 2 lần cùng hạt giống seed & inputs | File output JSONL giống nhau 100% từng byte | ĐẠT |
| REQ-08 | Định dạng Snapshot, Event và End trong JSONL | Kiểm tra cấu trúc từng dòng output | Tuân thủ 100% schema Test Contract v1.0 | ĐẠT |

## 2. Kết Quả Chạy Kiểm Thử Tự Động (npm test)

```text
> dao-den-long@1.0.0 test
> node --test

✔ Scenario Basic: Player moves and collects motes (17.8392ms)
✔ Scenario Deposit: Player deposits carried motes into lantern and lights it (10.5469ms)
✔ Scenario Pulse: Player pulses to stun and push nearby shade (11.1243ms)
✔ GameCore initializes and ticks deterministically (2.5338ms)
✔ Determinism Test: Same seed and inputs produce byte-identical JSONL output (19.7876ms)
✔ Win Condition: Lighting all 5 lanterns triggers game_over won all_lit (17.8203ms)
✔ Loss Condition: Shade damage reduces flames to 0 triggers game_over lost no_flames (16.4436ms)
✔ Loss Condition: Time running out triggers game_over lost dawn (13.6026ms)
ℹ tests 8
ℹ suites 0
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 318.6911
```

## 3. Mẫu Dữ Liệu Đầu Ra Headless JSONL (Trích đoạn)
```json
{"type":"snapshot","tick":0,"sim_tick":0,"state":"playing","time_left_s":180,"score":0,"player":{"pos":[0,0,0],"flames":3,"carried":0},"lanterns":[{"id":"L1","pos":[0,0,20],"lit":false,"deposited":0},{"id":"L2","pos":[19.021,0,6.18],"lit":false,"deposited":0},{"id":"L3","pos":[11.756,0,-16.18],"lit":false,"deposited":0},{"id":"L4","pos":[-11.756,0,-16.18],"lit":false,"deposited":0},{"id":"L5","pos":[-19.021,0,6.18],"lit":false,"deposited":0}],"shades":[{"id":"S1","pos":[23.875,0,-2.442],"state":"chase"},{"id":"S2","pos":[-13.19,0,20.05],"state":"chase"},{"id":"S3","pos":[-14.329,0,-19.253],"state":"chase"}],"motes_active":20}
{"type":"event","tick":1,"name":"deposit","data":{"lantern_id":"L1","amount":3,"deposited":3}}
{"type":"event","tick":1,"name":"lantern_lit","data":{"lantern_id":"L1"}}
{"type":"end","ticks":10,"state":"won","score":635}
```
