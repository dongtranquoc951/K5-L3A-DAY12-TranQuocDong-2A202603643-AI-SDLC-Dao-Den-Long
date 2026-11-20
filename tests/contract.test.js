import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { runHeadless } from '../src/headless.js';

test('Scenario Basic: Player moves and collects motes', () => {
  const outPath = 'tests/out_mote.jsonl';
  runHeadless([
    '--seed', '100',
    '--night', '1',
    '--scenario', 'tests/fixtures/scenario_basic.json',
    '--inputs', 'tests/fixtures/inputs_walk.json',
    '--ticks', '35',
    '--out', outPath,
    '--snapshot-every', '10'
  ]);

  const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n').map(l => JSON.parse(l));
  fs.unlinkSync(outPath);

  // Check that mote_picked events occurred
  const pickEvents = lines.filter(l => l.type === 'event' && l.name === 'mote_picked');
  assert.ok(pickEvents.length >= 2, 'Should pick up multiple motes');
  assert.equal(pickEvents[0].data.carried, 1);
  assert.equal(pickEvents[1].data.carried, 2);

  const endLine = lines[lines.length - 1];
  assert.equal(endLine.type, 'end');
  assert.equal(endLine.state, 'playing');
  // Note: Per Ticket-02 standardized scoring, picking up does not add score (+10 is awarded on deposit).
  assert.equal(endLine.score, 0, 'Score is 0 until motes are deposited into lantern');
});

test('Scenario Deposit: Player deposits carried motes into lantern and lights it', () => {
  // Ticket-02 requires 10 motes to fully light a lantern (previously 3 in Phase 1).
  const scenario = {
    player: { pos: [0, 0, 1.0], carried: 10, flames: 3 },
    random_motes: false,
    random_shades: false,
    motes: [],
    shades: [],
    lanterns: [
      { id: "L1", pos: [0, 0, 2.0], deposited: 0, lit: false }
    ],
    time_left_s: 180
  };

  const scenPath = 'tests/scen_dep_10.json';
  const outPath = 'tests/out_deposit.jsonl';
  fs.writeFileSync(scenPath, JSON.stringify(scenario));

  runHeadless([
    '--seed', '100',
    '--night', '1',
    '--scenario', scenPath,
    '--inputs', 'tests/fixtures/inputs_deposit.json',
    '--ticks', '5',
    '--out', outPath,
    '--snapshot-every', '5'
  ]);

  const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n').map(l => JSON.parse(l));
  fs.unlinkSync(scenPath);
  fs.unlinkSync(outPath);

  const depositEvent = lines.find(l => l.type === 'event' && l.name === 'deposit');
  assert.ok(depositEvent, 'Deposit event must be emitted');
  assert.equal(depositEvent.data.lantern_id, 'L1');
  assert.equal(depositEvent.data.amount, 10);
  assert.equal(depositEvent.data.deposited, 10);

  const litEvent = lines.find(l => l.type === 'event' && l.name === 'lantern_lit');
  assert.ok(litEvent, 'Lantern lit event must be emitted when fully deposited (10/10)');
  assert.equal(litEvent.data.lantern_id, 'L1');

  const endLine = lines[lines.length - 1];
  // Phase 3 scoring: 10 motes deposited * 5 = 50, + 100 per first light = 150
  assert.equal(endLine.score, 150);
});

test('Scenario Pulse: Player pulses with >= 3 motes to stun and push nearby shade', () => {
  // Ticket-02 requires 3 motes to pulse (previously 1 in Phase 1).
  const scenario = {
    player: { pos: [0, 0, 0], carried: 3, flames: 3 },
    random_motes: false,
    random_shades: false,
    motes: [],
    shades: [
      { id: "S1", pos: [0, 0, 3.0] }
    ],
    lanterns: [],
    time_left_s: 180
  };

  const scenPath = 'tests/scen_pulse_3.json';
  const outPath = 'tests/out_pulse.jsonl';
  fs.writeFileSync(scenPath, JSON.stringify(scenario));

  runHeadless([
    '--seed', '100',
    '--night', '1',
    '--scenario', scenPath,
    '--inputs', 'tests/fixtures/inputs_pulse.json',
    '--ticks', '5',
    '--out', outPath,
    '--snapshot-every', '5'
  ]);

  const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n').map(l => JSON.parse(l));
  fs.unlinkSync(scenPath);
  fs.unlinkSync(outPath);

  const pulseEvent = lines.find(l => l.type === 'event' && l.name === 'pulse');
  assert.ok(pulseEvent, 'Pulse event must be emitted when player has >= 3 motes');
  assert.deepEqual(pulseEvent.data.stunned_ids, ['S1']);

  const endLine = lines[lines.length - 1];
  // Ticket-02 awards +5 per shade hit by pulse (previously 20 in Phase 1)
  assert.equal(endLine.score, 5, 'Stunning shade awards +5 score per Ticket-02');
});
