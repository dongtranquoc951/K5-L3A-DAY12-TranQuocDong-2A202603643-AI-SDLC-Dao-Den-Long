import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { runHeadless } from '../src/headless.js';

test('Win Condition: Surviving until dawn with >= 60% lit lanterns triggers game_over won dawn_survived', () => {
  // Phase 3 Contract v1.2: Win is checked when time expires (dawn).
  // Night 1 has 5 lanterns, ceil(0.6 * 5) = 3 lit lanterns required to survive.
  const scenario = {
    player: { pos: [0, 0, 1.0], carried: 10, flames: 3 },
    random_motes: false,
    random_shades: false,
    motes: [],
    shades: [],
    lanterns: [
      { id: "L1", pos: [0, 0, 2.0], deposited: 0, lit: false },
      { id: "L2", pos: [10, 0, 10], deposited: 10, lit: true, fuel: 80 },
      { id: "L3", pos: [10, 0, -10], deposited: 10, lit: true, fuel: 80 },
      { id: "L4", pos: [-10, 0, -10], deposited: 10, lit: true, fuel: 80 },
      { id: "L5", pos: [-10, 0, 10], deposited: 0, lit: false }
    ],
    time_left_s: 0.1 // 6 ticks to dawn
  };

  const scenPath = 'tests/scen_win.json';
  const outPath = 'tests/out_win.jsonl';
  fs.writeFileSync(scenPath, JSON.stringify(scenario));

  runHeadless([
    '--seed', '42',
    '--night', '1',
    '--scenario', scenPath,
    '--inputs', 'tests/fixtures/inputs_deposit.json',
    '--ticks', '10',
    '--out', outPath
  ]);

  const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n').map(l => JSON.parse(l));
  fs.unlinkSync(scenPath);
  fs.unlinkSync(outPath);

  const gameOver = lines.find(l => l.type === 'event' && l.name === 'game_over');
  assert.ok(gameOver, 'game_over event must be emitted');
  assert.equal(gameOver.data.result, 'won');
  assert.equal(gameOver.data.reason, 'dawn_survived');

  const endLine = lines[lines.length - 1];
  assert.equal(endLine.type, 'end');
  assert.equal(endLine.state, 'won');
  // Score: 10 deposited * 5 = 50, + 100 first light L1 = 150.
  // Dawn bonus: for each lit lantern (4 lanterns: L1, L2, L3, L4), 50 + floor(fuel), plus 3 * 50 for flames left.
  assert.ok(endLine.score >= 500, 'Score includes base actions and dawn bonus for lit lanterns and flames');
});

test('Loss Condition: Shade damage reduces flames to 0 triggers game_over lost no_flames', () => {
  const scenario = {
    player: { pos: [0, 0, 0], carried: 0, flames: 1 },
    random_motes: false,
    random_shades: false,
    motes: [],
    shades: [
      { id: "S1", pos: [0, 0, 0.5], state: "chase" }
    ],
    lanterns: [],
    time_left_s: 100
  };

  const scenPath = 'tests/scen_loss.json';
  const outPath = 'tests/out_loss.jsonl';
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

  const hitEvent = lines.find(l => l.type === 'event' && l.name === 'player_hit');
  assert.ok(hitEvent, 'player_hit event must be emitted');
  assert.equal(hitEvent.data.flames, 0);

  const gameOver = lines.find(l => l.type === 'event' && l.name === 'game_over');
  assert.ok(gameOver, 'game_over event must be emitted');
  assert.equal(gameOver.data.result, 'lost');
  assert.equal(gameOver.data.reason, 'no_flames');

  const endLine = lines[lines.length - 1];
  assert.equal(endLine.state, 'lost');
});

test('Loss Condition: Time running out triggers game_over lost dawn', () => {
  const scenario = {
    player: { pos: [0, 0, 0], carried: 0, flames: 3 },
    random_motes: false,
    random_shades: false,
    motes: [],
    shades: [],
    lanterns: [],
    time_left_s: 0.1 // 6 ticks
  };

  const scenPath = 'tests/scen_dawn.json';
  const outPath = 'tests/out_dawn.jsonl';
  fs.writeFileSync(scenPath, JSON.stringify(scenario));

  runHeadless([
    '--seed', '42',
    '--night', '1',
    '--scenario', scenPath,
    '--ticks', '10',
    '--out', outPath
  ]);

  const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n').map(l => JSON.parse(l));
  fs.unlinkSync(scenPath);
  fs.unlinkSync(outPath);

  const gameOver = lines.find(l => l.type === 'event' && l.name === 'game_over');
  assert.ok(gameOver, 'game_over event must be emitted when dawn arrives');
  assert.equal(gameOver.data.result, 'lost');
  assert.equal(gameOver.data.reason, 'dawn');

  const endLine = lines[lines.length - 1];
  assert.equal(endLine.state, 'lost');
});
