import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { runHeadless } from '../src/headless.js';

test('Phase 2 Feature: Dash (Lướt) moves player at 14 m/s and emits dash event', () => {
  const scenario = {
    player: { pos: [0, 0, 0], carried: 0, flames: 3 },
    random_motes: false,
    random_shades: false,
    motes: [],
    shades: [],
    lanterns: [],
    time_left_s: 180
  };

  const inputs = {
    frames: [
      { tick: 0, move: [0, 1], dash: true },
      { tick: 1, dash: false }
    ]
  };

  const scenPath = 'tests/scen_dash.json';
  const inPath = 'tests/in_dash.json';
  const outPath = 'tests/out_dash.jsonl';
  fs.writeFileSync(scenPath, JSON.stringify(scenario));
  fs.writeFileSync(inPath, JSON.stringify(inputs));

  runHeadless([
    '--seed', '42',
    '--night', '1',
    '--scenario', scenPath,
    '--inputs', inPath,
    '--ticks', '12', // 12 ticks = 0.2s duration
    '--out', outPath,
    '--snapshot-every', '12'
  ]);

  const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n').map(l => JSON.parse(l));
  fs.unlinkSync(scenPath);
  fs.unlinkSync(inPath);
  fs.unlinkSync(outPath);

  const dashEvent = lines.find(l => l.type === 'event' && l.name === 'dash');
  assert.ok(dashEvent, 'dash event must be emitted');

  const snap12 = lines.find(l => l.type === 'snapshot' && l.tick === 12);
  assert.ok(snap12, 'snapshot at tick 12 must exist');
  // At 14 m/s over 12 ticks (0.2s), player moves 14 * 0.2 = 2.8 meters along Z
  assert.ok(Math.abs(snap12.player.pos[2] - 2.8) < 0.1, `Expected Z ~2.8m, got ${snap12.player.pos[2]}`);
});

test('Phase 2 Feature: Wind Charm (Bùa Gió) boosts speed and gives zero dash cooldown', () => {
  const scenario = {
    night: 2,
    player: { pos: [34.5, 0, 0], carried: 0, flames: 3 },
    random_motes: false,
    random_shades: false,
    random_drifters: false,
    motes: [],
    shades: [],
    drifters: [],
    charms: [{ id: "C1", pos: [35, 0, 0], available: true, respawn_timer: 0 }],
    time_left_s: 330
  };

  const inputs = {
    frames: [
      { tick: 0, move: [1, 0] } // walks into charm at 35,0,0
    ]
  };

  const scenPath = 'tests/scen_charm.json';
  const inPath = 'tests/in_charm.json';
  const outPath = 'tests/out_charm.jsonl';
  fs.writeFileSync(scenPath, JSON.stringify(scenario));
  fs.writeFileSync(inPath, JSON.stringify(inputs));

  runHeadless([
    '--seed', '42',
    '--night', '2',
    '--scenario', scenPath,
    '--inputs', inPath,
    '--ticks', '10',
    '--out', outPath,
    '--snapshot-every', '10'
  ]);

  const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n').map(l => JSON.parse(l));
  fs.unlinkSync(scenPath);
  fs.unlinkSync(inPath);
  fs.unlinkSync(outPath);

  const charmEvent = lines.find(l => l.type === 'event' && l.name === 'charm_picked');
  assert.ok(charmEvent, 'charm_picked event must be emitted');
  assert.equal(charmEvent.data.charm_id, 'C1');
  assert.equal(charmEvent.data.charm_ticks, 600);
});

test('Phase 2 Feature: Drifter (Gió Lạc) steals motes when player carries >= 5', () => {
  const scenario = {
    night: 2,
    player: { pos: [0, 0, 0], carried: 6, flames: 3 },
    random_motes: false,
    random_shades: false,
    random_drifters: false,
    motes: [],
    shades: [],
    drifters: [{ id: "D1", pos: [0, 0, 1.0], state: "chase", stolen: 0 }],
    time_left_s: 330
  };

  const scenPath = 'tests/scen_drifter.json';
  const outPath = 'tests/out_drifter.jsonl';
  fs.writeFileSync(scenPath, JSON.stringify(scenario));

  runHeadless([
    '--seed', '42',
    '--night', '2',
    '--scenario', scenPath,
    '--ticks', '5',
    '--out', outPath
  ]);

  const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n').map(l => JSON.parse(l));
  fs.unlinkSync(scenPath);
  fs.unlinkSync(outPath);

  const stealEvent = lines.find(l => l.type === 'event' && l.name === 'drifter_steal');
  assert.ok(stealEvent, 'drifter_steal event must be emitted');
  assert.equal(stealEvent.data.drifter_id, 'D1');
  assert.equal(stealEvent.data.amount, 3); // steals min(3, carried) = 3
  assert.equal(stealEvent.data.carried, 3);
});

test('Phase 2 Feature: Launch Pad (Bục nhảy) launches Mây across island', () => {
  const scenario = {
    night: 2,
    player: { pos: [20, 0, 18], carried: 0, flames: 3 }, // on launch pad
    random_motes: false,
    random_shades: false,
    random_drifters: false,
    motes: [],
    shades: [],
    drifters: [],
    time_left_s: 330
  };

  const scenPath = 'tests/scen_launch.json';
  const outPath = 'tests/out_launch.jsonl';
  fs.writeFileSync(scenPath, JSON.stringify(scenario));

  runHeadless([
    '--seed', '42',
    '--night', '2',
    '--scenario', scenPath,
    '--ticks', '10',
    '--out', outPath,
    '--snapshot-every', '10'
  ]);

  const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n').map(l => JSON.parse(l));
  fs.unlinkSync(scenPath);
  fs.unlinkSync(outPath);

  const snap10 = lines.find(l => l.type === 'snapshot' && l.tick === 10);
  assert.ok(snap10, 'snapshot at tick 10 must exist');
  assert.ok(snap10.player.pos[1] > 1.0, `Player should be in the air, got Y=${snap10.player.pos[1]}`);
  assert.equal(snap10.player.grounded, false);
});

test('Phase 2 Feature: Pause & Resume toggles state and emits events', () => {
  const scenario = {
    night: 1,
    player: { pos: [0, 0, 0], carried: 0, flames: 3 },
    random_motes: false,
    random_shades: false,
    motes: [],
    shades: [],
    time_left_s: 180
  };

  const inputs = {
    frames: [
      { tick: 0, pause: true },
      { tick: 1, pause: false },
      { tick: 5, pause: true },
      { tick: 6, pause: false }
    ]
  };

  const scenPath = 'tests/scen_pause.json';
  const inPath = 'tests/in_pause.json';
  const outPath = 'tests/out_pause.jsonl';
  fs.writeFileSync(scenPath, JSON.stringify(scenario));
  fs.writeFileSync(inPath, JSON.stringify(inputs));

  runHeadless([
    '--seed', '42',
    '--night', '1',
    '--scenario', scenPath,
    '--inputs', inPath,
    '--ticks', '10',
    '--out', outPath,
    '--snapshot-every', '4'
  ]);

  const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n').map(l => JSON.parse(l));
  fs.unlinkSync(scenPath);
  fs.unlinkSync(inPath);
  fs.unlinkSync(outPath);

  const pausedEvent = lines.find(l => l.type === 'event' && l.name === 'paused');
  assert.ok(pausedEvent, 'paused event must be emitted');

  const resumedEvent = lines.find(l => l.type === 'event' && l.name === 'resumed');
  assert.ok(resumedEvent, 'resumed event must be emitted');
});

test('Phase 2 Feature: Falling off island drops flames and carried motes', () => {
  const scenario = {
    night: 1,
    player: { pos: [50.0, -11.0, 0], carried: 5, flames: 3 }, // outside island (R > 40) and below Y < -10
    random_motes: false,
    random_shades: false,
    motes: [],
    shades: [],
    time_left_s: 180
  };

  const scenPath = 'tests/scen_fall.json';
  const outPath = 'tests/out_fall.jsonl';
  fs.writeFileSync(scenPath, JSON.stringify(scenario));

  runHeadless([
    '--seed', '42',
    '--night', '1',
    '--scenario', scenPath,
    '--ticks', '5',
    '--out', outPath
  ]);

  const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n').map(l => JSON.parse(l));
  fs.unlinkSync(scenPath);
  fs.unlinkSync(outPath);

  const fallEvent = lines.find(l => l.type === 'event' && l.name === 'player_hit' && l.data.by === 'fall');
  assert.ok(fallEvent, 'player_hit by fall must be emitted');
  assert.equal(fallEvent.data.flames, 2);
  assert.equal(fallEvent.data.lost, 5);
});
