import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { runHeadless } from '../src/headless.js';

test('Determinism Test: Same seed and inputs produce byte-identical JSONL output', () => {
  const out1 = 'tests/out_det_1.jsonl';
  const out2 = 'tests/out_det_2.jsonl';

  runHeadless([
    '--seed', '999',
    '--night', '1',
    '--scenario', 'tests/fixtures/scenario_basic.json',
    '--inputs', 'tests/fixtures/inputs_walk.json',
    '--ticks', '60',
    '--out', out1,
    '--snapshot-every', '10'
  ]);

  runHeadless([
    '--seed', '999',
    '--night', '1',
    '--scenario', 'tests/fixtures/scenario_basic.json',
    '--inputs', 'tests/fixtures/inputs_walk.json',
    '--ticks', '60',
    '--out', out2,
    '--snapshot-every', '10'
  ]);

  const content1 = fs.readFileSync(out1, 'utf-8');
  const content2 = fs.readFileSync(out2, 'utf-8');

  fs.unlinkSync(out1);
  fs.unlinkSync(out2);

  assert.equal(content1, content2, 'Output JSONL must be 100% byte-for-byte identical across runs');
});
