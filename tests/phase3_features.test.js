import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { runHeadless } from '../src/headless.js';

test('Phase 3 Feature: Fuel Decay & lantern_out event', () => {
  // Lantern with small amount of fuel drains out to 0 and turns off
  const scenario = {
    player: { pos: [0, 0, 0], carried: 0, flames: 3 },
    random_motes: false,
    random_shades: false,
    motes: [],
    shades: [],
    lanterns: [
      { id: "L1", pos: [10, 0, 10], deposited: 10, lit: true, fuel: 0.05, ever_lit: false }
    ],
    time_left_s: 100
  };

  const scenPath = 'tests/scen_p3_decay.json';
  const outPath = 'tests/out_p3_decay.jsonl';
  fs.writeFileSync(scenPath, JSON.stringify(scenario));

  runHeadless([
    '--seed', '123',
    '--night', '1',
    '--scenario', scenPath,
    '--ticks', '6',
    '--out', outPath
  ]);

  const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n').map(l => JSON.parse(l));
  fs.unlinkSync(scenPath);
  fs.unlinkSync(outPath);

  const outEvent = lines.find(l => l.type === 'event' && l.name === 'lantern_out');
  assert.ok(outEvent, 'lantern_out event must be emitted when fuel reaches 0');
  assert.equal(outEvent.data.lantern_id, 'L1');
});

test('Phase 3 Feature: Refueling lit lantern adds fuel and awards +5 per mote', () => {
  // L1 is lit with 81 fuel (needs 2 motes to reach 100 after 1 tick decay).
  // Player carries 5 motes within 2m and interacts.
  const scenario = {
    player: { pos: [0, 0, 1.0], carried: 5, flames: 3 },
    random_motes: false,
    random_shades: false,
    motes: [],
    shades: [],
    lanterns: [
      { id: "L1", pos: [0, 0, 2.0], deposited: 10, lit: true, fuel: 81.0, ever_lit: true }
    ],
    time_left_s: 100
  };

  const scenPath = 'tests/scen_p3_refuel.json';
  const outPath = 'tests/out_p3_refuel.jsonl';
  fs.writeFileSync(scenPath, JSON.stringify(scenario));

  runHeadless([
    '--seed', '123',
    '--night', '1',
    '--scenario', scenPath,
    '--inputs', 'tests/fixtures/inputs_deposit.json',
    '--ticks', '5',
    '--out', outPath
  ]);

  const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n').map(l => JSON.parse(l));
  fs.unlinkSync(scenPath);
  fs.unlinkSync(outPath);

  const refuelEv = lines.find(l => l.type === 'event' && l.name === 'refuel');
  assert.ok(refuelEv, 'refuel event must be emitted');
  assert.equal(refuelEv.data.lantern_id, 'L1');
  assert.equal(refuelEv.data.amount, 2);
  assert.ok(refuelEv.data.fuel >= 99.0, 'Lantern should be refueled to 100');

  const endLine = lines[lines.length - 1];
  // 2 motes * 5 pts = 10 pts
  assert.equal(endLine.score, 10);
});

test('Phase 3 Feature: Relighting ever-lit lantern requires only 5 motes and awards +40', () => {
  // L1 was previously lit (ever_lit: true), currently unlit.
  // Player has 5 motes.
  const scenario = {
    player: { pos: [0, 0, 1.0], carried: 5, flames: 3 },
    random_motes: false,
    random_shades: false,
    motes: [],
    shades: [],
    lanterns: [
      { id: "L1", pos: [0, 0, 2.0], deposited: 0, lit: false, fuel: 0, ever_lit: true }
    ],
    time_left_s: 100
  };

  const scenPath = 'tests/scen_p3_relight.json';
  const outPath = 'tests/out_p3_relight.jsonl';
  fs.writeFileSync(scenPath, JSON.stringify(scenario));

  runHeadless([
    '--seed', '123',
    '--night', '1',
    '--scenario', scenPath,
    '--inputs', 'tests/fixtures/inputs_deposit.json',
    '--ticks', '5',
    '--out', outPath
  ]);

  const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n').map(l => JSON.parse(l));
  fs.unlinkSync(scenPath);
  fs.unlinkSync(outPath);

  const litEv = lines.find(l => l.type === 'event' && l.name === 'lantern_lit');
  assert.ok(litEv, 'lantern_lit event must be emitted');
  assert.equal(litEv.data.lantern_id, 'L1');
  assert.equal(litEv.data.relight, true);

  const endLine = lines[lines.length - 1];
  // 5 motes * 5 pts = 25 pts + 40 relight = 65 pts
  assert.equal(endLine.score, 65);
});

test('Phase 3 Feature: Shade enters drain state on weak lantern (fuel < 30) and emits fuel_drain event', () => {
  // Player is far away (25m), so shade targets weak lantern (L1 fuel = 25) and enters drain
  const scenario = {
    player: { pos: [0, 0, 25.0], carried: 0, flames: 3 },
    random_motes: false,
    random_shades: false,
    motes: [],
    shades: [
      { id: "S1", pos: [0, 0, 1.8], state: "wander" }
    ],
    lanterns: [
      { id: "L1", pos: [0, 0, 2.0], deposited: 10, lit: true, fuel: 25.0, ever_lit: true }
    ],
    time_left_s: 100
  };

  const scenPath = 'tests/scen_p3_drain.json';
  const outPath = 'tests/out_p3_drain.jsonl';
  fs.writeFileSync(scenPath, JSON.stringify(scenario));

  runHeadless([
    '--seed', '123',
    '--night', '1',
    '--scenario', scenPath,
    '--ticks', '65',
    '--out', outPath
  ]);

  const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n').map(l => JSON.parse(l));
  fs.unlinkSync(scenPath);
  fs.unlinkSync(outPath);

  // Verify fuel_drain event at tick 60
  const drainEv = lines.find(l => l.type === 'event' && l.name === 'fuel_drain');
  assert.ok(drainEv, 'fuel_drain event must be emitted at tick 60');
  assert.equal(drainEv.data.lantern_id, 'L1');
  assert.equal(drainEv.data.shade_id, 'S1');
});

test('Phase 3 Feature: Pulse stunning a draining shade awards +15 score', () => {
  // Player has 3 motes, pulses shade which is currently draining L1
  const scenario = {
    player: { pos: [0, 0, 0.5], carried: 3, flames: 3 },
    random_motes: false,
    random_shades: false,
    motes: [],
    shades: [
      { id: "S1", pos: [0, 0, 2.0], state: "drain", target_lantern_id: "L1" }
    ],
    lanterns: [
      { id: "L1", pos: [0, 0, 2.0], deposited: 10, lit: true, fuel: 25.0, ever_lit: true }
    ],
    time_left_s: 100
  };

  const scenPath = 'tests/scen_p3_stun.json';
  const outPath = 'tests/out_p3_stun.jsonl';
  fs.writeFileSync(scenPath, JSON.stringify(scenario));

  const inputs = {
    frames: [
      { tick: 0, pulse: true }
    ]
  };
  const inpPath = 'tests/fixtures/inputs_p3_stun.json';
  fs.writeFileSync(inpPath, JSON.stringify(inputs));

  runHeadless([
    '--seed', '123',
    '--night', '1',
    '--scenario', scenPath,
    '--inputs', inpPath,
    '--ticks', '5',
    '--out', outPath
  ]);

  const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n').map(l => JSON.parse(l));
  fs.unlinkSync(scenPath);
  fs.unlinkSync(inpPath);
  fs.unlinkSync(outPath);

  const pulseEv = lines.find(l => l.type === 'event' && l.name === 'pulse');
  assert.ok(pulseEv, 'pulse event must be emitted');
  assert.deepEqual(pulseEv.data.stunned_ids, ['S1']);

  const endLine = lines[lines.length - 1];
  assert.equal(endLine.score, 15, 'Stunning a draining shade awards +15 score');
});

test('Phase 3 Feature: Progressive carry capacity increases with successful lights', () => {
  // Initial capacity is 10; after lighting L1 it should become 12.
  const scenario = {
    player: { pos: [0, 0, 1.0], carried: 10, flames: 3 },
    random_motes: false,
    random_shades: false,
    motes: [],
    shades: [],
    lanterns: [
      { id: "L1", pos: [0, 0, 2.0], deposited: 0, lit: false }
    ],
    time_left_s: 100
  };

  const scenPath = 'tests/scen_p3_cap.json';
  const outPath = 'tests/out_p3_cap.jsonl';
  fs.writeFileSync(scenPath, JSON.stringify(scenario));

  runHeadless([
    '--seed', '123',
    '--night', '1',
    '--scenario', scenPath,
    '--inputs', 'tests/fixtures/inputs_deposit.json',
    '--ticks', '5',
    '--snapshot-every', '5',
    '--out', outPath
  ]);

  const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n').map(l => JSON.parse(l));
  fs.unlinkSync(scenPath);
  fs.unlinkSync(outPath);

  const snapshot = lines.find(l => l.type === 'snapshot' && l.tick === 5);
  assert.ok(snapshot, 'snapshot at tick 5 must exist');
  assert.equal(snapshot.player.capacity, 12, 'Capacity should increase to 12 after lighting 1 lantern');
});

test('Phase 3 Feature: Dawn Loss triggers if < 60% lanterns are lit at dawn', () => {
  // Night 1 has 5 lanterns, only 1 is lit at dawn. Result should be lost (reason: dawn).
  const scenario = {
    player: { pos: [0, 0, 0], carried: 0, flames: 3 },
    random_motes: false,
    random_shades: false,
    motes: [],
    shades: [],
    lanterns: [
      { id: "L1", pos: [10, 0, 10], deposited: 10, lit: true, fuel: 80 },
      { id: "L2", pos: [20, 0, 20], deposited: 0, lit: false },
      { id: "L3", pos: [30, 0, 30], deposited: 0, lit: false },
      { id: "L4", pos: [-10, 0, -10], deposited: 0, lit: false },
      { id: "L5", pos: [-20, 0, -20], deposited: 0, lit: false }
    ],
    time_left_s: 0.1 // 6 ticks to dawn
  };

  const scenPath = 'tests/scen_p3_dawn_loss.json';
  const outPath = 'tests/out_p3_dawn_loss.jsonl';
  fs.writeFileSync(scenPath, JSON.stringify(scenario));

  runHeadless([
    '--seed', '123',
    '--night', '1',
    '--scenario', scenPath,
    '--ticks', '10',
    '--out', outPath
  ]);

  const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n').map(l => JSON.parse(l));
  fs.unlinkSync(scenPath);
  fs.unlinkSync(outPath);

  const gameOver = lines.find(l => l.type === 'event' && l.name === 'game_over');
  assert.ok(gameOver, 'game_over event must be emitted at dawn');
  assert.equal(gameOver.data.result, 'lost');
  assert.equal(gameOver.data.reason, 'dawn');

  const endLine = lines[lines.length - 1];
  assert.equal(endLine.type, 'end');
  assert.equal(endLine.state, 'lost');
});

test('Phase 3 Performance: 14400 ticks (1 full Night) headless simulation completes in <= 30 seconds', () => {
  const outPath = 'tests/out_p3_perf.jsonl';
  const start = performance.now();

  runHeadless([
    '--seed', '2026',
    '--night', '1',
    '--ticks', '14400',
    '--out', outPath
  ]);

  const elapsedMs = performance.now() - start;
  if (fs.existsSync(outPath)) fs.unlinkSync(outPath);

  assert.ok(elapsedMs < 30000, `Simulation took ${elapsedMs.toFixed(1)}ms, should be < 30000ms`);
});
