#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { IslandEngine } from './core/engine.js';

function parseArgs(args) {
  const parsed = {
    seed: 42,
    night: 1,
    scenario: null,
    inputs: null,
    ticks: 120,
    out: null,
    snapshot_every: 10
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--seed' && i + 1 < args.length) {
      parsed.seed = parseInt(args[++i], 10);
    } else if (arg === '--night' && i + 1 < args.length) {
      parsed.night = parseInt(args[++i], 10);
    } else if (arg === '--scenario' && i + 1 < args.length) {
      parsed.scenario = args[++i];
    } else if (arg === '--inputs' && i + 1 < args.length) {
      parsed.inputs = args[++i];
    } else if (arg === '--ticks' && i + 1 < args.length) {
      parsed.ticks = parseInt(args[++i], 10);
    } else if (arg === '--out' && i + 1 < args.length) {
      parsed.out = args[++i];
    } else if (arg === '--snapshot-every' && i + 1 < args.length) {
      parsed.snapshot_every = parseInt(args[++i], 10);
    }
  }

  return parsed;
}

export function runHeadless(rawArgs) {
  const options = parseArgs(rawArgs);

  if (!options.out) {
    console.error('Error: --out <file.jsonl> is required.');
    process.exit(1);
  }

  let scenarioData = null;
  if (options.scenario) {
    try {
      const content = fs.readFileSync(path.resolve(options.scenario), 'utf-8');
      scenarioData = JSON.parse(content);
    } catch (err) {
      console.error(`Error parsing scenario file: ${err.message}`);
      process.exit(2);
    }
  }

  let inputsData = null;
  let framesByTick = new Map();
  if (options.inputs) {
    try {
      const content = fs.readFileSync(path.resolve(options.inputs), 'utf-8');
      inputsData = JSON.parse(content);
      if (!inputsData || !Array.isArray(inputsData.frames)) {
        throw new Error('inputs file must have a "frames" array.');
      }

      let lastTick = -1;
      for (const frame of inputsData.frames) {
        if (typeof frame.tick !== 'number' || frame.tick <= lastTick) {
          throw new Error(`Frame ticks must be strictly increasing. Found tick ${frame.tick} after ${lastTick}.`);
        }
        lastTick = frame.tick;
        framesByTick.set(frame.tick, frame);
      }
    } catch (err) {
      console.error(`Error parsing inputs file: ${err.message}`);
      process.exit(2);
    }
  }

  const engine = new IslandEngine({
    seed: options.seed,
    night: options.night,
    scenario: scenarioData
  });

  const outputLines = [];

  // Snapshot at tick 0 (before step 0)
  outputLines.push(JSON.stringify(engine.getSnapshot()));

  const totalTicks = options.ticks;
  for (let k = 0; k < totalTicks; k++) {
    // If input frame exists for this tick k, apply it
    if (framesByTick.has(k)) {
      engine.setInput(framesByTick.get(k));
    }

    const events = engine.step();
    for (const ev of events) {
      outputLines.push(JSON.stringify(ev));
    }

    if (engine.tick % options.snapshot_every === 0) {
      outputLines.push(JSON.stringify(engine.getSnapshot()));
    }

    if (engine.state !== 'playing' && engine.state !== 'paused') {
      break;
    }
  }

  // End line (mandatory)
  const endLine = {
    type: 'end',
    ticks: engine.tick,
    state: engine.state,
    score: engine.score
  };
  outputLines.push(JSON.stringify(endLine));

  // Ensure output directory exists and write
  const outPath = path.resolve(options.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, outputLines.join('\n') + '\n', 'utf-8');

  return endLine;
}

// Run CLI directly if invoked from command line
if (process.argv[1] && process.argv[1].endsWith('headless.js')) {
  try {
    runHeadless(process.argv.slice(2));
    process.exit(0);
  } catch (err) {
    console.error(`Fatal headless error: ${err.message}`);
    process.exit(1);
  }
}
