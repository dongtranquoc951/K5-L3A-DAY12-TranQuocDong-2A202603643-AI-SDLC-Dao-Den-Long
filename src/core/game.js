export class GameCore {
  constructor(options = {}) {
    this.tickRate = options.tickRate || 60;
    this.currentTick = 0;
    this.entities = [];
  }

  step() {
    this.currentTick += 1;
    return {
      tick: this.currentTick,
      status: 'running'
    };
  }
}
