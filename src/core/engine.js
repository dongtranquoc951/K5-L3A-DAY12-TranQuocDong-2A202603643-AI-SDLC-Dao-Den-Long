import { DEFAULT_TUNING, DEFAULT_LANTERNS_NIGHT1 } from './config.js';
import { PRNG } from './prng.js';

export function round3(val) {
  return Math.round((Number(val) + Number.EPSILON) * 1000) / 1000;
}

export function distXZ(p1, p2) {
  const dx = p1[0] - p2[0];
  const dz = p1[2] - p2[2];
  return Math.hypot(dx, dz);
}

export class IslandEngine {
  constructor(options = {}) {
    this.seed = options.seed !== undefined ? options.seed : 42;
    this.prng = new PRNG(this.seed);
    this.tuning = { ...DEFAULT_TUNING, ...(options.tuning || {}) };
    this.tuning.score = { ...DEFAULT_TUNING.score, ...(options.tuning?.score || {}) };

    this.tick = 0;
    this.sim_tick = 0;
    this.state = 'playing'; // 'playing' | 'won' | 'lost'
    this.score = 0;

    this.duration_s = this.tuning.night1_duration_s;
    this.time_left_s = this.duration_s;

    // Player state
    this.player = {
      pos: [0.0, 0.0, 0.0],
      flames: this.tuning.flames,
      carried: 0,
      invuln_timer: 0,
      pulse_cooldown_timer: 0
    };

    // Input state
    this.currentInput = {
      move: [0, 0],
      cam_yaw_deg: 0,
      jump: false,
      interact: false,
      pulse: false
    };
    this.prevInput = { ...this.currentInput };

    // Lanterns
    this.lanterns = DEFAULT_LANTERNS_NIGHT1.map(l => ({ ...l, pos: [...l.pos] }));

    // Entities
    this.motes = [];
    this.shades = [];

    this.random_motes = true;
    this.random_shades = true;
    this.moteIdCounter = 1;
    this.shadeIdCounter = 1;

    // Event queue for the current tick
    this.events = [];

    // Apply scenario if provided
    if (options.scenario) {
      this.applyScenario(options.scenario);
    } else {
      this.initDefaultEntities();
    }
  }

  initDefaultEntities() {
    // Generate initial motes scattered across round island (radius up to 25m)
    for (let i = 0; i < 20; i++) {
      const angle = this.prng.nextFloat(0, Math.PI * 2);
      const r = this.prng.nextFloat(3, 26);
      this.motes.push({
        id: `M${this.moteIdCounter++}`,
        pos: [r * Math.cos(angle), 0.0, r * Math.sin(angle)]
      });
    }

    // Generate initial shades on outer island (radius 22-28m)
    for (let i = 0; i < 3; i++) {
      const angle = (i * (Math.PI * 2) / 3) + this.prng.nextFloat(-0.2, 0.2);
      const r = 24.0;
      this.shades.push({
        id: `S${this.shadeIdCounter++}`,
        pos: [r * Math.cos(angle), 0.0, r * Math.sin(angle)],
        state: 'chase',
        stun_timer: 0
      });
    }
  }

  applyScenario(scenario) {
    if (scenario.time_left_s !== undefined) {
      this.duration_s = scenario.time_left_s;
      this.time_left_s = scenario.time_left_s;
    }

    if (scenario.player) {
      if (scenario.player.pos) this.player.pos = [...scenario.player.pos];
      if (scenario.player.carried !== undefined) this.player.carried = scenario.player.carried;
      if (scenario.player.flames !== undefined) this.player.flames = scenario.player.flames;
    }

    if (scenario.random_motes !== undefined) {
      this.random_motes = Boolean(scenario.random_motes);
    }
    if (scenario.random_shades !== undefined) {
      this.random_shades = Boolean(scenario.random_shades);
    }

    if (scenario.lanterns && Array.isArray(scenario.lanterns)) {
      for (const item of scenario.lanterns) {
        const existing = this.lanterns.find(l => l.id === item.id);
        if (existing) {
          if (item.pos) existing.pos = [...item.pos];
          if (item.lit !== undefined) existing.lit = Boolean(item.lit);
          if (item.deposited !== undefined) existing.deposited = item.deposited;
        } else {
          this.lanterns.push({
            id: item.id,
            pos: item.pos ? [...item.pos] : [0, 0, 0],
            lit: Boolean(item.lit),
            deposited: item.deposited || 0
          });
        }
      }
    }

    if (scenario.motes !== undefined && Array.isArray(scenario.motes)) {
      this.motes = scenario.motes.map((m, idx) => {
        if (Array.isArray(m)) {
          return { id: `M${idx + 1}`, pos: [...m] };
        }
        return { id: m.id || `M${idx + 1}`, pos: [...m.pos] };
      });
      this.moteIdCounter = this.motes.length + 1;
    }

    if (scenario.shades !== undefined && Array.isArray(scenario.shades)) {
      this.shades = scenario.shades.map((s, idx) => ({
        id: s.id || `S${idx + 1}`,
        pos: [...s.pos],
        state: s.state || 'chase',
        stun_timer: s.stun_timer || 0
      }));
      this.shadeIdCounter = this.shades.length + 1;
    }
  }

  setInput(newInput) {
    this.prevInput = { ...this.currentInput };
    this.currentInput = { ...this.currentInput, ...newInput };
  }

  step() {
    if (this.state !== 'playing') {
      return [];
    }

    this.events = [];
    const stepTick = this.tick + 1;

    // 1. Process Player Movement
    const [rawX, rawZ] = this.currentInput.move || [0, 0];
    const len = Math.hypot(rawX, rawZ);
    let normX = 0;
    let normZ = 0;
    if (len > 0) {
      const scale = len > 1 ? 1 / len : 1;
      normX = rawX * scale;
      normZ = rawZ * scale;
    }

    // World transformation with cam_yaw_deg
    const yawRad = ((this.currentInput.cam_yaw_deg || 0) * Math.PI) / 180.0;
    const cosYaw = Math.cos(yawRad);
    const sinYaw = Math.sin(yawRad);
    const worldMoveX = normX * cosYaw + normZ * sinYaw;
    const worldMoveZ = -normX * sinYaw + normZ * cosYaw;

    const moveStep = this.tuning.player_speed / 60.0;
    this.player.pos[0] += worldMoveX * moveStep;
    this.player.pos[2] += worldMoveZ * moveStep;

    // Circular island boundary check (radius 30m)
    const islandRadius = 30.0;
    const playerDist = Math.hypot(this.player.pos[0], this.player.pos[2]);
    if (playerDist > islandRadius) {
      if (this.tuning.fall_enabled) {
        this.player.flames = 0;
        this.state = 'lost';
        this.events.push({
          type: 'event',
          tick: stepTick,
          name: 'player_hit',
          data: { by: 'fall', flames: 0, dropped: this.player.carried }
        });
        this.events.push({
          type: 'event',
          tick: stepTick,
          name: 'game_over',
          data: { result: 'lost', reason: 'no_flames' }
        });
        this.tick = stepTick;
        this.sim_tick = stepTick;
        return this.events;
      } else {
        // Clamp to island boundary
        this.player.pos[0] = (this.player.pos[0] / playerDist) * islandRadius;
        this.player.pos[2] = (this.player.pos[2] / playerDist) * islandRadius;
      }
    }

    // 2. Decrement Timers
    if (this.player.invuln_timer > 0) this.player.invuln_timer -= 1;
    if (this.player.pulse_cooldown_timer > 0) this.player.pulse_cooldown_timer -= 1;

    // 3. Mote Pickups
    if (this.player.carried < this.tuning.carry_capacity) {
      for (let i = this.motes.length - 1; i >= 0; i--) {
        const mote = this.motes[i];
        if (distXZ(this.player.pos, mote.pos) <= this.tuning.pickup_radius) {
          this.motes.splice(i, 1);
          this.player.carried += 1;
          this.score += this.tuning.score.per_mote;
          this.events.push({
            type: 'event',
            tick: stepTick,
            name: 'mote_picked',
            data: { carried: this.player.carried }
          });
          if (this.player.carried >= this.tuning.carry_capacity) {
            break;
          }
        }
      }
    }

    // 4. Lantern Deposit Interaction (Edge trigger false -> true)
    const interactEdge = Boolean(this.currentInput.interact && !this.prevInput.interact);
    if (interactEdge && this.player.carried > 0) {
      // Find unlit lantern within interact_radius
      let targetLantern = null;
      let minDist = Infinity;
      for (const lantern of this.lanterns) {
        if (!lantern.lit) {
          const d = distXZ(this.player.pos, lantern.pos);
          if (d <= this.tuning.interact_radius && d < minDist) {
            minDist = d;
            targetLantern = lantern;
          }
        }
      }

      if (targetLantern) {
        const needed = this.tuning.lantern_cost - targetLantern.deposited;
        const depositAmount = Math.min(this.player.carried, needed);
        this.player.carried -= depositAmount;
        targetLantern.deposited += depositAmount;

        this.events.push({
          type: 'event',
          tick: stepTick,
          name: 'deposit',
          data: {
            lantern_id: targetLantern.id,
            amount: depositAmount,
            deposited: targetLantern.deposited
          }
        });

        if (targetLantern.deposited >= this.tuning.lantern_cost) {
          targetLantern.lit = true;
          this.score += this.tuning.score.per_lantern;
          this.events.push({
            type: 'event',
            tick: stepTick,
            name: 'lantern_lit',
            data: { lantern_id: targetLantern.id }
          });

          // Check if all lanterns are lit
          const allLit = this.lanterns.every(l => l.lit);
          if (allLit) {
            this.state = 'won';
            const secondsLeft = Math.max(0, Math.floor(this.time_left_s));
            this.score += secondsLeft * this.tuning.score.per_second_left;
            this.score += this.player.flames * this.tuning.score.per_flame_left;
            this.events.push({
              type: 'event',
              tick: stepTick,
              name: 'game_over',
              data: { result: 'won', reason: 'all_lit' }
            });
            this.tick = stepTick;
            this.sim_tick = stepTick;
            return this.events;
          }
        }
      }
    }

    // 5. Pulse (Tỏa sáng) Interaction (Edge trigger false -> true)
    const pulseEdge = Boolean(this.currentInput.pulse && !this.prevInput.pulse);
    if (pulseEdge && this.player.pulse_cooldown_timer <= 0 && this.player.carried >= this.tuning.pulse_cost) {
      this.player.carried -= this.tuning.pulse_cost;
      this.player.pulse_cooldown_timer = Math.round(this.tuning.pulse_cooldown_s * 60);

      const stunnedIds = [];
      for (const shade of this.shades) {
        const d = distXZ(this.player.pos, shade.pos);
        if (d <= this.tuning.pulse_radius) {
          shade.state = 'stunned';
          shade.stun_timer = Math.round(this.tuning.pulse_stun_s * 60);

          // Push shade away by pulse_push_m
          const dx = shade.pos[0] - this.player.pos[0];
          const dz = shade.pos[2] - this.player.pos[2];
          const dist = Math.hypot(dx, dz);
          if (dist > 0.001) {
            shade.pos[0] += (dx / dist) * this.tuning.pulse_push_m;
            shade.pos[2] += (dz / dist) * this.tuning.pulse_push_m;
          } else {
            shade.pos[0] += this.tuning.pulse_push_m;
          }

          this.score += this.tuning.score.per_stun;
          stunnedIds.push(shade.id);
        }
      }

      this.events.push({
        type: 'event',
        tick: stepTick,
        name: 'pulse',
        data: { stunned_ids: stunnedIds }
      });
    }

    // 6. Update Shades (Bóng Mực)
    const shadeMoveStep = this.tuning.shade_speed / 60.0;
    for (const shade of this.shades) {
      if (shade.state === 'stunned') {
        shade.stun_timer -= 1;
        if (shade.stun_timer <= 0) {
          shade.state = 'chase';
        }
      } else if (shade.state === 'chase') {
        const dx = this.player.pos[0] - shade.pos[0];
        const dz = this.player.pos[2] - shade.pos[2];
        const dist = Math.hypot(dx, dz);

        if (dist > 0.001) {
          let nextX = shade.pos[0] + (dx / dist) * shadeMoveStep;
          let nextZ = shade.pos[2] + (dz / dist) * shadeMoveStep;

          // Safe radius check: lit lanterns repel shades
          let insideSafe = false;
          for (const lantern of this.lanterns) {
            if (lantern.lit) {
              const dLantern = Math.hypot(nextX - lantern.pos[0], nextZ - lantern.pos[2]);
              if (dLantern < this.tuning.safe_radius) {
                insideSafe = true;
                // Push shade back outside safe radius
                const repelX = nextX - lantern.pos[0];
                const repelZ = nextZ - lantern.pos[2];
                const repelDist = Math.hypot(repelX, repelZ);
                if (repelDist > 0.001) {
                  nextX = lantern.pos[0] + (repelX / repelDist) * this.tuning.safe_radius;
                  nextZ = lantern.pos[2] + (repelZ / repelDist) * this.tuning.safe_radius;
                }
              }
            }
          }

          shade.pos[0] = nextX;
          shade.pos[2] = nextZ;
        }

        // Check if shade hits player
        if (distXZ(shade.pos, this.player.pos) <= this.tuning.shade_hit_radius && this.player.invuln_timer <= 0) {
          const dropped = Math.floor(this.player.carried * this.tuning.hit_drop_ratio);
          this.player.carried -= dropped;
          this.player.flames -= 1;
          this.player.invuln_timer = Math.round(this.tuning.invuln_s * 60);

          this.events.push({
            type: 'event',
            tick: stepTick,
            name: 'player_hit',
            data: { by: 'shade', flames: this.player.flames, dropped: dropped }
          });

          if (this.player.flames <= 0) {
            this.state = 'lost';
            this.events.push({
              type: 'event',
              tick: stepTick,
              name: 'game_over',
              data: { result: 'lost', reason: 'no_flames' }
            });
            this.tick = stepTick;
            this.sim_tick = stepTick;
            return this.events;
          }
        }
      }
    }

    // 7. Time Progression
    this.tick = stepTick;
    this.sim_tick = stepTick;
    this.time_left_s = Math.max(0, this.duration_s - (this.tick / 60.0));

    if (this.time_left_s <= 0 && this.state === 'playing') {
      this.state = 'lost';
      this.events.push({
        type: 'event',
        tick: this.tick,
        name: 'game_over',
        data: { result: 'lost', reason: 'dawn' }
      });
    }

    return this.events;
  }

  getSnapshot() {
    return {
      type: 'snapshot',
      tick: this.tick,
      sim_tick: this.sim_tick,
      state: this.state,
      time_left_s: round3(this.time_left_s),
      score: this.score,
      player: {
        pos: [round3(this.player.pos[0]), round3(this.player.pos[1]), round3(this.player.pos[2])],
        flames: this.player.flames,
        carried: this.player.carried
      },
      lanterns: this.lanterns.map(l => ({
        id: l.id,
        pos: [round3(l.pos[0]), round3(l.pos[1]), round3(l.pos[2])],
        lit: l.lit,
        deposited: l.deposited
      })),
      shades: this.shades.map(s => ({
        id: s.id,
        pos: [round3(s.pos[0]), round3(s.pos[1]), round3(s.pos[2])],
        state: s.state
      })),
      motes_active: this.motes.length
    };
  }
}
