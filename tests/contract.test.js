import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
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
  assert.ok(endLine.score >= 20, 'Score should reflect collected motes');
});

test('Scenario Deposit: Player deposits carried motes into lantern and lights it', () => {
  const outPath = 'tests/out_deposit.jsonl';
  runHeadless([
    '--seed', '100',
    '--night', '1',
    '--scenario', 'tests/fixtures/scenario_deposit.json',
    '--inputs', 'tests/fixtures/inputs_deposit.json',
    '--ticks', '5',
    '--out', outPath,
    '--snapshot-every', '5'
  ]);

  const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n').map(l => JSON.parse(l));
  fs.unlinkSync(outPath);

  const depositEvent = lines.find(l => l.type === 'event' && l.name === 'deposit');
  assert.ok(depositEvent, 'Deposit event must be emitted');
  assert.equal(depositEvent.data.lantern_id, 'L1');
  assert.equal(depositEvent.data.amount, 3);
  assert.equal(depositEvent.data.deposited, 3);

  const litEvent = lines.find(l => l.type === 'event' && l.name === 'lantern_lit');
  assert.ok(litEvent, 'Lantern lit event must be emitted when fully deposited');
  assert.equal(litEvent.data.lantern_id, 'L1');
});

test('Scenario Pulse: Player pulses to stun and push nearby shade', () => {
  const outPath = 'tests/out_pulse.jsonl';
  runHeadless([
    '--seed', '100',
    '--night', '1',
    '--scenario', 'tests/fixtures/scenario_pulse.json',
    '--inputs', 'tests/fixtures/inputs_pulse.json',
    '--ticks', '5',
    '--out', outPath,
    '--snapshot-every', '5'
  ]);

  const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n').map(l => JSON.parse(l));
  fs.unlinkSync(outPath);

  const pulseEvent = lines.find(l => l.type === 'event' && l.name === 'pulse');
  assert.ok(pulseEvent, 'Pulse event must be emitted');
  assert.deepEqual(pulseEvent.data.stunned_ids, ['S1']);

  const endLine = lines[lines.length - 1];
  assert.ok(endLine.score >= 20, 'Stunning shade should award score');
});
