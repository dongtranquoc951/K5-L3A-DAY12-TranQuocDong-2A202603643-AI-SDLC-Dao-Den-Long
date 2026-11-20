#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { IslandEngine } from './core/engine.js';
import { PRNG } from './core/prng.js';

function parseArgs(args) {
  const parsed = {
    seed: 7,
    nights: 10,
    out: 'soak.json'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--seed' && i + 1 < args.length) {
      parsed.seed = parseInt(args[++i], 10);
    } else if (arg === '--nights' && i + 1 < args.length) {
      parsed.nights = parseInt(args[++i], 10);
    } else if (arg === '--out' && i + 1 < args.length) {
      parsed.out = args[++i];
    }
  }

  return parsed;
}

export function runSoak(rawArgs = process.argv.slice(2)) {
  const opts = parseArgs(rawArgs);
  const startTime = performance.now();

  let memStartMb = 0;
  let crashes = 0;
  const results = [];

  let engine = null;

  for (let n = 0; n < opts.nights; n++) {
    try {
      const nightNum = (n % 3) + 1; // 1 -> 2 -> 3 -> 1 ...
      const nightSeed = opts.seed + n;
      const inputPrng = new PRNG(nightSeed * 1000 + 7);

      engine = new IslandEngine({
        seed: nightSeed,
        night: nightNum
      });

      if (n === 0) {
        if (global.gc) global.gc();
        memStartMb = Math.round(process.memoryUsage().rss / (1024 * 1024));
      }

      let currentMove = [0, 0];
      const maxTicks = Math.round(engine.duration_s * 60);

      while (engine.state === 'playing' && engine.tick < maxTicks) {
        // Every 30 ticks pick new direction
        if (engine.tick % 30 === 0) {
          const angle = inputPrng.nextFloat(0, 2 * Math.PI);
          currentMove = [Math.cos(angle), Math.sin(angle)];
        }

        const jump = inputPrng.next() < 0.05;
        const dash = inputPrng.next() < 0.03;
        const pulse = inputPrng.next() < 0.02;
        const interact = inputPrng.next() < 0.10;

        engine.setInput({
          move: currentMove,
          cam_yaw_deg: 0,
          jump: jump,
          dash: dash,
          pulse: pulse,
          interact: interact,
          pause: false
        });

        engine.step();
      }

      results.push(engine.state);
    } catch (err) {
      crashes += 1;
      results.push('error');
      console.error(`Error during night ${n + 1}:`, err);
    }
  }

  if (global.gc) global.gc();
  const memEndMb = Math.round(process.memoryUsage().rss / (1024 * 1024));
  const durationS = Math.round(((performance.now() - startTime) / 1000) * 10) / 10;

  const output = {
    nights: opts.nights,
    crashes: crashes,
    results: results,
    mem_start_mb: memStartMb,
    mem_end_mb: memEndMb,
    duration_s: durationS
  };

  const resolvedOut = path.resolve(opts.out);
  const dir = path.dirname(resolvedOut);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(resolvedOut, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`Soak test completed in ${durationS}s: ${opts.nights} nights, crashes=${crashes}, mem: ${memStartMb}MB -> ${memEndMb}MB`);
  return output;
}

if (process.argv[1] && process.argv[1].endsWith('soak.js')) {
  runSoak();
}
