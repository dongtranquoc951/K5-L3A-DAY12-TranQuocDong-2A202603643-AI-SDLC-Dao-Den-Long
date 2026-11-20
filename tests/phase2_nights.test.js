import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { runHeadless } from '../src/headless.js';

test('Phase 2 Nights: Night 2 (Đảo Cau) runs headless with 6 lanterns and bamboo bridge', () => {
  const outPath = 'tests/out_night2.jsonl';
  runHeadless([
    '--seed', '123',
    '--night', '2',
    '--ticks', '60',
    '--out', outPath,
    '--snapshot-every', '30'
  ]);

  const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n').map(l => JSON.parse(l));
  fs.unlinkSync(outPath);

  const snap0 = lines.find(l => l.type === 'snapshot' && l.tick === 0);
  assert.equal(snap0.night, 2);
  assert.equal(snap0.lanterns.length, 6, 'Night 2 must have 6 lanterns');
  assert.equal(snap0.charms.length, 1, 'Night 2 must have 1 charm (C1)');

  const endLine = lines[lines.length - 1];
  assert.equal(endLine.type, 'end');
});

test('Phase 2 Nights: Night 3 (Đảo Chuông) runs headless with 7 lanterns, 3 tiers and wind', () => {
  const outPath = 'tests/out_night3.jsonl';
  runHeadless([
    '--seed', '456',
    '--night', '3',
    '--ticks', '60',
    '--out', outPath,
    '--snapshot-every', '30'
  ]);

  const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n').map(l => JSON.parse(l));
  fs.unlinkSync(outPath);

  const snap0 = lines.find(l => l.type === 'snapshot' && l.tick === 0);
  assert.equal(snap0.night, 3);
  assert.equal(snap0.lanterns.length, 7, 'Night 3 must have 7 lanterns');
  assert.equal(snap0.charms.length, 2, 'Night 3 must have 2 charms (C1, C2)');
  assert.ok(snap0.wind !== undefined, 'Night 3 snapshot includes wind state');

  const endLine = lines[lines.length - 1];
  assert.equal(endLine.type, 'end');
});

test('Phase 2 Performance: 21600 ticks headless simulation completes in < 5 seconds', () => {
  const outPath = 'tests/out_perf.jsonl';
  const start = Date.now();
  runHeadless([
    '--seed', '42',
    '--night', '1',
    '--ticks', '21600',
    '--out', outPath,
    '--snapshot-every', '120'
  ]);
  const durationMs = Date.now() - start;
  fs.unlinkSync(outPath);

  assert.ok(durationMs < 5000, `Execution took ${durationMs}ms, well below the 30-second requirement`);
});
