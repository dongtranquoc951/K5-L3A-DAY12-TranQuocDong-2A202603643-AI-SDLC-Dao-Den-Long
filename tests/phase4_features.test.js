import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { addLeaderboardEntry, getLeaderboard, exportLeaderboard } from '../src/core/leaderboard.js';
import { runHeadless } from '../src/headless.js';
import { runSoak } from '../src/soak.js';
import { runBenchmark } from '../src/benchmark.js';

test('Phase 4 Feature: Leaderboard adds, sorts by score desc and keeps top 10', () => {
  // Clear any existing test data
  const lbFile = 'data/leaderboard.json';
  if (fs.existsSync(lbFile)) fs.unlinkSync(lbFile);

  const testLbPath = 'tests/out_lb_test.json';

  addLeaderboardEntry({ name: 'Player_A', score: 300, nights_won: 2, seed: 10 });
  addLeaderboardEntry({ name: 'Player_B', score: 950, nights_won: 3, seed: 20 });
  addLeaderboardEntry({ name: 'Player_C', score: 500, nights_won: 2, seed: 30 });

  exportLeaderboard(testLbPath);
  assert.ok(fs.existsSync(testLbPath), 'Exported leaderboard file must exist');

  const content = JSON.parse(fs.readFileSync(testLbPath, 'utf-8'));
  fs.unlinkSync(testLbPath);

  assert.ok(Array.isArray(content.entries));
  assert.equal(content.entries.length, 3);
  assert.equal(content.entries[0].name, 'Player_B');
  assert.equal(content.entries[0].score, 950);
  assert.equal(content.entries[1].score, 500);
  assert.equal(content.entries[2].score, 300);
});

test('Phase 4 Feature: CLI --export-leaderboard exports valid JSON structure', () => {
  const exportPath = 'tests/out_cli_leaderboard.json';
  runHeadless(['--export-leaderboard', exportPath]);

  assert.ok(fs.existsSync(exportPath), 'CLI export file must exist');
  const parsed = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));
  fs.unlinkSync(exportPath);

  assert.ok(Array.isArray(parsed.entries), 'Must contain "entries" array');
});

test('Phase 4 Feature: Soak test runs 10 nights without crash and memory stays within 1.2x', () => {
  const soakOut = 'tests/out_soak_verify.json';
  const res = runSoak(['--seed', '100', '--nights', '10', '--out', soakOut]);

  assert.ok(fs.existsSync(soakOut));
  const data = JSON.parse(fs.readFileSync(soakOut, 'utf-8'));
  fs.unlinkSync(soakOut);

  assert.equal(data.nights, 10);
  assert.equal(data.crashes, 0);
  assert.equal(data.results.length, 10);
  assert.ok(data.mem_end_mb <= 1.2 * data.mem_start_mb + 15, 'Memory growth must be bounded');
});

test('Phase 4 Feature: Benchmark mode runs and outputs contract v1.3 metrics exceeding thresholds', () => {
  const benchOut = 'tests/out_bench_verify.json';
  const res = runBenchmark(['--seed', '42', '--duration', '1', '--out', benchOut]);

  assert.ok(fs.existsSync(benchOut));
  const data = JSON.parse(fs.readFileSync(benchOut, 'utf-8'));
  fs.unlinkSync(benchOut);

  assert.equal(data.contract_version, '1.3');
  assert.ok(data.avg_fps >= 60, `avg_fps was ${data.avg_fps}, expected >= 60`);
  assert.ok(data.p1_low_fps >= 30, `p1_low_fps was ${data.p1_low_fps}, expected >= 30`);
  assert.ok(data.load_ms <= 10000, `load_ms was ${data.load_ms}, expected <= 10000`);
  assert.equal(data.vsync_off, true);
});
