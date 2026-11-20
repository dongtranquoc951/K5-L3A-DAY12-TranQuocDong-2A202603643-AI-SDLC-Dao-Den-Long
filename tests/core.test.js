import test from 'node:test';
import assert from 'node:assert/strict';
import { GameCore } from '../src/core/game.js';

test('GameCore initializes and ticks deterministically', () => {
  const game = new GameCore();
  assert.equal(game.currentTick, 0);
  const state = game.step();
  assert.equal(state.tick, 1);
  assert.equal(state.status, 'running');
});
