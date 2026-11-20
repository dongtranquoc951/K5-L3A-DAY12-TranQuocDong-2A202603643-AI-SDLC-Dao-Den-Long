import { DEFAULT_TUNING, NIGHT1_MAP, NIGHT2_MAP, NIGHT3_MAP } from './config.js';
import { PRNG } from './prng.js';

export function round1(val) {
  return Math.round((Number(val) + Number.EPSILON) * 10) / 10;
}

export function round3(val) {
  return Math.round((Number(val) + Number.EPSILON) * 1000) / 1000;
}

export function distXZ(p1, p2) {
  const dx = p1[0] - p2[0];
  const dz = p1[2] - p2[2];
  return Math.hypot(dx, dz);
}

export function dist3D(p1, p2) {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  const dz = p1[2] - p2[2];
  return Math.hypot(dx, dy, dz);
}

export class IslandEngine {
  constructor(options = {}) {
    this.seed = options.seed !== undefined ? options.seed : 42;
    this.prng = new PRNG(this.seed);
    this.night = options.night !== undefined ? Number(options.night) : 1;
    this.tuning = { ...DEFAULT_TUNING, ...(options.tuning || {}) };
    this.tuning.score = { ...DEFAULT_TUNING.score, ...(options.tuning?.score || {}) };

    this.tick = 0;
    this.sim_tick = 0;
    this.state = 'playing'; // 'playing' | 'paused' | 'won' | 'lost'
    this.is_paused = false;
    this.score = 0;

    // Night duration
    if (this.night === 1) this.duration_s = this.tuning.night1_duration_s;
    else if (this.night === 2) this.duration_s = this.tuning.night2_duration_s;
    else this.duration_s = this.tuning.night3_duration_s;
    this.time_left_s = this.duration_s;

    // Player state
    this.player = {
      pos: [0.0, 0.0, 0.0],
      vel: [0.0, 0.0, 0.0],
      facing_deg: 0.0, // 0 deg is +Z
      grounded: true,
      flames: this.tuning.flames,
      carried: 0,
      capacity: 10,
      successful_lights: 0,
      invuln_timer: 0,
      dash_timer: 0,
      dash_dir: [0.0, 1.0],
      dash_cd_timer: 0,
      pulse_cd_timer: 0,
      charm_timer: 0,
      launch_active: false,
      fall_respawn_timer: 0
    };

    // Input state
    this.currentInput = {
      move: [0, 0],
      cam_yaw_deg: 0,
      jump: false,
      interact: false,
      pulse: false,
      dash: false,
      pause: false
    };
    this.prevInput = { ...this.currentInput };

    // Wind system
    this.wind = { active: false, dir_deg: 0.0 };
    this.wind_enabled = (this.night === 3);

    // Map configuration
    this.initMapData();

    // Entities
    this.motes = [];
    this.shades = [];
    this.drifters = [];
    // this.charms initialized in initMapData()

    this.random_motes = true;
    this.random_shades = true;
    this.random_drifters = true;
    this.moteIdCounter = 1;
    this.shadeIdCounter = 1;
    this.drifterIdCounter = 1;

    // Event queue for the current tick
    this.events = [];

    // Apply scenario if provided
    if (options.scenario) {
      this.applyScenario(options.scenario);
    } else {
      this.initDefaultEntities();
    }
  }

  initMapData() {
    const makeLantern = (l) => ({
      ...l,
      pos: [...l.pos],
      lit: Boolean(l.lit),
      deposited: l.deposited || 0,
      fuel: l.lit ? 100.0 : 0.0,
      ever_lit: Boolean(l.ever_lit),
      relit_count: 0
    });

    if (this.night === 1) {
      this.map = NIGHT1_MAP;
      this.lanterns = NIGHT1_MAP.lanterns.map(makeLantern);
      this.charms = [];
    } else if (this.night === 2) {
      this.map = NIGHT2_MAP;
      this.lanterns = NIGHT2_MAP.lanterns.map(makeLantern);
      this.charms = NIGHT2_MAP.charms.map(c => ({ ...c, pos: [...c.pos] }));
    } else {
      this.map = NIGHT3_MAP;
      this.lanterns = NIGHT3_MAP.lanterns.map(makeLantern);
      this.charms = NIGHT3_MAP.charms.map(c => ({ ...c, pos: [...c.pos] }));
    }
  }

  initDefaultEntities() {
    const spawnPoints = this.map.mote_spawn_points;
    const shuffled = [...spawnPoints].sort(() => this.prng.next() - 0.5);
    const count = Math.min(20, shuffled.length);
    for (let i = 0; i < count; i++) {
      this.motes.push({
        id: `M${this.moteIdCounter++}`,
        pos: [...shuffled[i]],
        kind: 'random',
        ttl: 0
      });
    }
  }

  applyScenario(scenario) {
    if (scenario.night !== undefined) {
      this.night = Number(scenario.night);
      this.initMapData();
    }

    if (scenario.time_left_s !== undefined) {
      this.duration_s = scenario.time_left_s;
      this.time_left_s = scenario.time_left_s;
    }

    if (scenario.wind_enabled !== undefined) {
      this.wind_enabled = Boolean(scenario.wind_enabled);
    }

    if (scenario.player) {
      const p = scenario.player;
      if (p.pos) this.player.pos = [...p.pos];
      if (p.vel) this.player.vel = [...p.vel];
      if (p.grounded !== undefined) this.player.grounded = Boolean(p.grounded);
      if (p.carried !== undefined) this.player.carried = p.carried;
      if (p.flames !== undefined) this.player.flames = p.flames;
      if (p.successful_lights !== undefined) {
        this.player.successful_lights = p.successful_lights;
        this.player.capacity = Math.min(20, 10 + 2 * this.player.successful_lights);
      }
      if (p.invuln_ticks !== undefined) this.player.invuln_timer = p.invuln_ticks;
      if (p.dash_cd_ticks !== undefined) this.player.dash_cd_timer = p.dash_cd_ticks;
      if (p.pulse_cd_ticks !== undefined) this.player.pulse_cd_timer = p.pulse_cd_ticks;
      if (p.charm_ticks !== undefined) this.player.charm_timer = p.charm_ticks;
    }

    if (scenario.random_motes !== undefined) this.random_motes = Boolean(scenario.random_motes);
    if (scenario.random_shades !== undefined) this.random_shades = Boolean(scenario.random_shades);
    if (scenario.random_drifters !== undefined) this.random_drifters = Boolean(scenario.random_drifters);

    if (scenario.lanterns && Array.isArray(scenario.lanterns)) {
      for (const item of scenario.lanterns) {
        let existing = this.lanterns.find(l => l.id === item.id);
        if (!existing) {
          existing = {
            id: item.id,
            pos: item.pos ? [...item.pos] : [0, 0, 0],
            lit: false,
            deposited: 0,
            fuel: 0.0,
            ever_lit: false,
            relit_count: 0
          };
          this.lanterns.push(existing);
        }

        if (item.pos) existing.pos = [...item.pos];
        if (item.lit !== undefined) existing.lit = Boolean(item.lit);
        if (item.ever_lit !== undefined) existing.ever_lit = Boolean(item.ever_lit);
        if (item.relit_count !== undefined) existing.relit_count = item.relit_count;
        if (item.deposited !== undefined) existing.deposited = item.deposited;

        if (item.fuel !== undefined) {
          existing.fuel = Number(item.fuel);
        } else if (existing.lit) {
          existing.fuel = 100.0;
        } else {
          existing.fuel = 0.0;
        }
      }
    }

    if (scenario.motes !== undefined && Array.isArray(scenario.motes)) {
      this.motes = scenario.motes.map((m, idx) => {
        if (Array.isArray(m)) {
          return { id: `M${idx + 1}`, pos: [...m], kind: 'random', ttl: 0 };
        }
        return {
          id: m.id || `M${idx + 1}`,
          pos: [...m.pos],
          kind: m.kind || 'random',
          ttl: m.ttl || 0
        };
      });
      this.moteIdCounter = this.motes.length + 1;
    }

    if (scenario.shades !== undefined && Array.isArray(scenario.shades)) {
      this.shades = scenario.shades.map((s, idx) => ({
        id: s.id || `S${idx + 1}`,
        pos: [...s.pos],
        state: s.state || 'wander',
        state_ticks_left: s.state_ticks_left || 0,
        target_lantern_id: s.target_lantern_id || null,
        recoil_dir: [0, 0],
        push_ticks_left: 0,
        push_dir: [0, 0]
      }));
      this.shadeIdCounter = this.shades.length + 1;
    }

    if (scenario.drifters !== undefined && Array.isArray(scenario.drifters)) {
      this.drifters = scenario.drifters.map((d, idx) => ({
        id: d.id || `D${idx + 1}`,
        pos: [...d.pos],
        state: d.state || 'idle',
        stolen: d.stolen || 0,
        flee_timer: d.flee_timer || 0
      }));
      this.drifterIdCounter = this.drifters.length + 1;
    }

    if (scenario.charms !== undefined && Array.isArray(scenario.charms)) {
      this.charms = scenario.charms.map((c, idx) => ({
        id: c.id || `C${idx + 1}`,
        pos: c.pos ? [...c.pos] : [0, 0, 0],
        available: c.available !== undefined ? Boolean(c.available) : true,
        respawn_timer: c.respawn_timer || 0
      }));
    }
  }

  setInput(newInput) {
    this.prevInput = { ...this.currentInput };
    this.currentInput = { ...this.currentInput, ...newInput };
  }

  getGroundHeight(x, z) {
    if (this.night === 1) {
      const r = Math.hypot(x, z);
      return r <= 40.0 ? 0.0 : -999.0;
    }

    if (this.night === 2) {
      const dA = Math.hypot(x, z);
      if (dA <= 28.0) return 0.0;
      const dB = Math.hypot(x - 70.0, z);
      if (dB <= 28.0) return 0.0;
      if (x >= 26.0 && x <= 44.0 && z >= -2.0 && z <= 2.0) return 0.0;
      return -999.0;
    }

    if (this.night === 3) {
      const r = Math.hypot(x, z);
      if (r > 45.0) return -999.0;
      if (r <= 2.0) return 6.0;
      if (r <= 8.0) return 6.0;

      for (const rampAngle of [30, 150]) {
        const rad = (rampAngle * Math.PI) / 180.0;
        const rampDirX = Math.cos(rad);
        const rampDirZ = Math.sin(rad);
        const projAlong = x * rampDirX + z * rampDirZ;
        const projPerp = Math.abs(-x * rampDirZ + z * rampDirX);

        if (projPerp <= 1.5 && projAlong >= 24.0 && projAlong <= 30.0) {
          const t = (30.0 - projAlong) / 6.0;
          return t * 3.0;
        }
      }

      if (r >= 12.0 && r <= 24.0 && z > 0.0) return 3.0;
      return 0.0;
    }

    return 0.0;
  }

  step() {
    this.events = [];
    const stepTick = this.tick + 1;

    // Emits night_start at tick 1
    if (this.tick === 0) {
      this.events.push({
        type: 'event',
        tick: 1,
        name: 'night_start',
        data: { night: this.night }
      });
    }

    // 1. Process Input & Pause
    const pauseEdge = Boolean(this.currentInput.pause && !this.prevInput.pause);
    if (pauseEdge) {
      this.is_paused = !this.is_paused;
      this.state = this.is_paused ? 'paused' : 'playing';
      this.events.push({
        type: 'event',
        tick: stepTick,
        name: this.is_paused ? 'paused' : 'resumed',
        data: {}
      });
    }

    if (this.is_paused) {
      this.tick = stepTick;
      return this.events;
    }

    if (this.state !== 'playing') {
      this.tick = stepTick;
      return this.events;
    }

    // 2. Decrement Counters & Fuel Processing
    this.sim_tick += 1;
    this.time_left_s = Math.max(0, this.duration_s - (this.sim_tick / 60.0));

    if (this.player.dash_timer > 0) this.player.dash_timer -= 1;
    if (this.player.dash_cd_timer > 0) this.player.dash_cd_timer -= 1;
    if (this.player.pulse_cd_timer > 0) this.player.pulse_cd_timer -= 1;
    if (this.player.invuln_timer > 0) this.player.invuln_timer -= 1;
    if (this.player.charm_timer > 0) this.player.charm_timer -= 1;

    // Charm respawn
    for (const c of this.charms) {
      if (!c.available) {
        c.respawn_timer -= 1;
        if (c.respawn_timer <= 0) c.available = true;
      }
    }

    // Dropped motes TTL
    for (let i = this.motes.length - 1; i >= 0; i--) {
      const m = this.motes[i];
      if (m.kind === 'dropped') {
        m.ttl -= 1;
        if (m.ttl <= 0) this.motes.splice(i, 1);
      }
    }

    // Falling wait respawn
    if (this.player.fall_respawn_timer > 0) {
      this.player.fall_respawn_timer -= 1;
      if (this.player.fall_respawn_timer <= 0) {
        this.player.pos = [0.0, 0.0, 0.0];
        this.player.vel = [0.0, 0.0, 0.0];
        this.player.grounded = true;
        this.player.invuln_timer = 90;
      }
      this.tick = stepTick;
      return this.events;
    }

    // Fuel Decay & Shade Drain (Ticket-03)
    const dt = 1 / 60.0;
    for (const lantern of this.lanterns) {
      if (lantern.lit) {
        // Natural decay: 1.0 unit/second
        let drainAmount = this.tuning.fuel_decay_per_s * dt;

        // Count shades currently draining this lantern
        for (const shade of this.shades) {
          if (shade.state === 'drain' && shade.target_lantern_id === lantern.id) {
            drainAmount += this.tuning.drain_per_s * dt;

            // Log fuel_drain event every 60 ticks while draining
            if (this.sim_tick % 60 === 0) {
              this.events.push({
                type: 'event',
                tick: stepTick,
                name: 'fuel_drain',
                data: {
                  lantern_id: lantern.id,
                  shade_id: shade.id,
                  fuel: round1(Math.max(0, lantern.fuel - drainAmount))
                }
              });
            }
          }
        }

        lantern.fuel = Math.max(0, lantern.fuel - drainAmount);

        // Out of fuel check
        if (lantern.fuel <= 0.0) {
          lantern.fuel = 0.0;
          lantern.lit = false;
          lantern.deposited = 0;
          lantern.ever_lit = true;
          this.events.push({
            type: 'event',
            tick: stepTick,
            name: 'lantern_out',
            data: { lantern_id: lantern.id }
          });
        }
      }
    }

    // Wind logic for Night 3
    if (this.wind_enabled) {
      const windCycle = this.sim_tick % 1800;
      if (windCycle >= 1500) {
        this.wind.active = true;
        if (windCycle === 1500) {
          this.wind.dir_deg = this.prng.nextFloat(0, 360);
        }
      } else {
        this.wind.active = false;
      }
    }

    // 3. Move Player (Jump, Dash, Launch Pads, Wind, Gravity)
    const [rawX, rawZ] = this.currentInput.move || [0, 0];
    const moveLen = Math.hypot(rawX, rawZ);
    let normX = 0;
    let normZ = 0;
    if (moveLen > 0) {
      const s = moveLen > 1 ? 1 / moveLen : 1;
      normX = rawX * s;
      normZ = rawZ * s;
    }

    const yawRad = ((this.currentInput.cam_yaw_deg || 0) * Math.PI) / 180.0;
    const cosYaw = Math.cos(yawRad);
    const sinYaw = Math.sin(yawRad);
    const worldMoveX = normX * cosYaw + normZ * sinYaw;
    const worldMoveZ = -normX * sinYaw + normZ * cosYaw;

    if (moveLen > 0) {
      this.player.facing_deg = (Math.atan2(worldMoveX, worldMoveZ) * 180.0) / Math.PI;
    }

    // Handle Dash
    const dashEdge = Boolean(this.currentInput.dash && !this.prevInput.dash);
    const hasCharm = this.player.charm_timer > 0;
    if (dashEdge && this.player.dash_timer <= 0 && (this.player.dash_cd_timer <= 0 || hasCharm)) {
      this.player.dash_timer = 12;
      this.player.dash_cd_timer = hasCharm ? 0 : 90;

      if (moveLen > 0) {
        this.player.dash_dir = [worldMoveX, worldMoveZ];
      } else {
        const faceRad = (this.player.facing_deg * Math.PI) / 180.0;
        this.player.dash_dir = [Math.sin(faceRad), Math.cos(faceRad)];
      }

      this.events.push({
        type: 'event',
        tick: stepTick,
        name: 'dash',
        data: {}
      });
    }

    // Handle Jump
    const jumpEdge = Boolean(this.currentInput.jump && !this.prevInput.jump);
    if (jumpEdge && this.player.grounded) {
      this.player.vel[1] = this.tuning.jump_velocity;
      this.player.grounded = false;
    }

    const baseSpeed = hasCharm ? 7.2 : this.tuning.player_speed;
    const prevX = this.player.pos[0];
    const prevY = this.player.pos[1];
    const prevZ = this.player.pos[2];

    if (this.player.dash_timer > 0) {
      this.player.vel[0] = this.player.dash_dir[0] * this.tuning.dash_speed;
      this.player.vel[2] = this.player.dash_dir[1] * this.tuning.dash_speed;
      this.player.vel[1] = 0.0;
      this.player.pos[0] += this.player.vel[0] * dt;
      this.player.pos[2] += this.player.vel[2] * dt;
    } else {
      if (this.player.launch_active) {
        this.player.pos[0] += this.player.vel[0] * dt;
        this.player.pos[2] += this.player.vel[2] * dt;
      } else {
        this.player.vel[0] = worldMoveX * baseSpeed;
        this.player.vel[2] = worldMoveZ * baseSpeed;
        this.player.pos[0] += this.player.vel[0] * dt;
        this.player.pos[2] += this.player.vel[2] * dt;
      }

      if (this.wind.active) {
        const windRad = (this.wind.dir_deg * Math.PI) / 180.0;
        this.player.pos[0] += Math.cos(windRad) * (2.0 * dt);
        this.player.pos[2] += Math.sin(windRad) * (2.0 * dt);
      }

      if (!this.player.grounded) {
        this.player.vel[1] += this.tuning.gravity * dt;
        this.player.pos[1] += this.player.vel[1] * dt;
      }
    }

    // Ground & Cliff Collision
    const groundY = this.getGroundHeight(this.player.pos[0], this.player.pos[2]);
    if (groundY > -500.0) {
      if (groundY > prevY + 0.6 && this.night === 3 && !this.player.launch_active && this.player.pos[1] < groundY) {
        this.player.pos[0] = prevX;
        this.player.pos[2] = prevZ;
        this.player.vel[0] = 0.0;
        this.player.vel[2] = 0.0;
      } else if (this.player.pos[1] <= groundY) {
        this.player.pos[1] = groundY;
        this.player.vel[1] = 0.0;
        this.player.grounded = true;
        this.player.launch_active = false;
      } else if (this.player.grounded && Math.abs(this.player.pos[1] - groundY) <= 0.4) {
        this.player.pos[1] = groundY;
        this.player.vel[1] = 0.0;
      } else {
        this.player.grounded = false;
      }
    } else {
      this.player.grounded = false;
    }

    // Launch Pads
    if (this.map.launchPads && this.player.grounded) {
      for (const pad of this.map.launchPads) {
        if (distXZ(this.player.pos, pad.pos) <= pad.radius) {
          this.player.vel[1] = pad.vy;
          this.player.grounded = false;
          this.player.launch_active = true;

          if (pad.targetCenter) {
            const dx = pad.targetCenter[0] - pad.pos[0];
            const dz = pad.targetCenter[2] - pad.pos[2];
            const d = Math.hypot(dx, dz);
            this.player.vel[0] = (dx / d) * pad.vh;
            this.player.vel[2] = (dz / d) * pad.vh;
          } else if (pad.dir) {
            this.player.vel[0] = pad.dir[0] * pad.vh;
            this.player.vel[2] = pad.dir[1] * pad.vh;
          }
          break;
        }
      }
    }

    // Fall off island (Y < -10)
    if (this.player.pos[1] < -10.0) {
      const lostMotes = this.player.carried;
      this.player.carried = 0;
      this.player.flames -= 1;

      this.events.push({
        type: 'event',
        tick: stepTick,
        name: 'player_hit',
        data: { by: 'fall', flames: this.player.flames, dropped: 0, lost: lostMotes }
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
        return this.events;
      } else {
        this.player.fall_respawn_timer = 60;
        this.tick = stepTick;
        return this.events;
      }
    }

    // 4. Pickup Motes & Charms
    for (const c of this.charms) {
      if (c.available && distXZ(this.player.pos, c.pos) <= this.tuning.pickup_radius) {
        const dy = Math.abs(this.player.pos[1] - c.pos[1]);
        if (dy <= this.tuning.pickup_height_max) {
          c.available = false;
          c.respawn_timer = 2700;
          this.player.charm_timer = 600;
          this.events.push({
            type: 'event',
            tick: stepTick,
            name: 'charm_picked',
            data: { charm_id: c.id, charm_ticks: 600 }
          });
        }
      }
    }

    if (this.player.carried < this.player.capacity) {
      for (let i = this.motes.length - 1; i >= 0; i--) {
        const m = this.motes[i];
        if (distXZ(this.player.pos, m.pos) <= this.tuning.pickup_radius) {
          const dy = Math.abs(this.player.pos[1] - m.pos[1]);
          if (dy <= this.tuning.pickup_height_max) {
            this.motes.splice(i, 1);
            this.player.carried += 1;
            this.events.push({
              type: 'event',
              tick: stepTick,
              name: 'mote_picked',
              data: { carried: this.player.carried }
            });
            if (this.player.carried >= this.player.capacity) break;
          }
        }
      }
    }

    // 5. Interact with Lanterns (Light / Relight / Refuel)
    const interactEdge = Boolean(this.currentInput.interact && !this.prevInput.interact);
    if (interactEdge && this.player.carried > 0) {
      // Find eligible lanterns: unlit OR (lit and fuel < 100)
      let targetLantern = null;
      let minDist = Infinity;

      for (const lantern of this.lanterns) {
        const canAccept = !lantern.lit || (lantern.lit && lantern.fuel < 100.0);
        if (canAccept) {
          const d = distXZ(this.player.pos, lantern.pos);
          if (d <= this.tuning.interact_radius) {
            if (d < minDist || (Math.abs(d - minDist) < 0.001 && lantern.id < targetLantern.id)) {
              minDist = d;
              targetLantern = lantern;
            }
          }
        }
      }

      if (targetLantern) {
        if (!targetLantern.lit) {
          // Case A: Lighting or Relighting
          const cost = targetLantern.ever_lit ? this.tuning.relight_cost : this.tuning.lantern_cost;
          const needed = cost - targetLantern.deposited;
          const depositAmount = Math.min(this.player.carried, needed);

          this.player.carried -= depositAmount;
          targetLantern.deposited += depositAmount;
          this.score += depositAmount * this.tuning.score.per_mote_deposited;

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

          if (targetLantern.deposited >= cost) {
            const isRelight = Boolean(targetLantern.ever_lit);
            targetLantern.lit = true;
            targetLantern.fuel = 100.0;
            targetLantern.ever_lit = true;

            if (isRelight) {
              targetLantern.relit_count += 1;
              this.score += this.tuning.score.per_relight;
            } else {
              this.score += this.tuning.score.per_first_light;
            }

            this.player.successful_lights += 1;
            this.player.capacity = Math.min(this.tuning.capacity_max, 10 + 2 * this.player.successful_lights);

            this.events.push({
              type: 'event',
              tick: stepTick,
              name: 'lantern_lit',
              data: { lantern_id: targetLantern.id, relight: isRelight }
            });
          }
        } else {
          // Case B: Refuel (Châm dầu)
          const neededMotes = Math.ceil((100.0 - targetLantern.fuel) / this.tuning.fuel_per_mote);
          const used = Math.min(this.player.carried, neededMotes);

          if (used > 0) {
            this.player.carried -= used;
            targetLantern.fuel = Math.min(100.0, targetLantern.fuel + used * this.tuning.fuel_per_mote);
            this.score += used * this.tuning.score.per_mote_deposited;

            this.events.push({
              type: 'event',
              tick: stepTick,
              name: 'refuel',
              data: {
                lantern_id: targetLantern.id,
                amount: used,
                fuel: round1(targetLantern.fuel)
              }
            });

            // Push shades out if refueled to >= 30
            if (targetLantern.fuel >= this.tuning.low_fuel_threshold) {
              for (const shade of this.shades) {
                if (distXZ(shade.pos, targetLantern.pos) < this.tuning.safe_radius) {
                  const dx = shade.pos[0] - targetLantern.pos[0];
                  const dz = shade.pos[2] - targetLantern.pos[2];
                  const dist = Math.hypot(dx, dz);
                  if (dist > 0.001) {
                    shade.pos[0] = targetLantern.pos[0] + (dx / dist) * this.tuning.safe_radius;
                    shade.pos[2] = targetLantern.pos[2] + (dz / dist) * this.tuning.safe_radius;
                  }
                }
              }
            }
          }
        }
      }
    }

    // 6. Update Safe Zones
    for (const shade of this.shades) {
      for (const lantern of this.lanterns) {
        if (lantern.lit && lantern.fuel >= this.tuning.low_fuel_threshold) {
          const d = distXZ(shade.pos, lantern.pos);
          if (d < this.tuning.safe_radius) {
            const dx = shade.pos[0] - lantern.pos[0];
            const dz = shade.pos[2] - lantern.pos[2];
            const dist = Math.hypot(dx, dz);
            if (dist > 0.001) {
              shade.pos[0] = lantern.pos[0] + (dx / dist) * this.tuning.safe_radius;
              shade.pos[2] = lantern.pos[2] + (dz / dist) * this.tuning.safe_radius;
            } else {
              shade.pos[0] = lantern.pos[0] + this.tuning.safe_radius;
            }
          }
        }
      }
    }

    // 7. Pulse (Tỏa Sáng)
    const pulseEdge = Boolean(this.currentInput.pulse && !this.prevInput.pulse);
    if (pulseEdge && this.player.pulse_cd_timer <= 0 && this.player.carried >= this.tuning.pulse_cost) {
      this.player.carried -= this.tuning.pulse_cost;
      this.player.pulse_cd_timer = Math.round(this.tuning.pulse_cooldown_s * 60);

      const pulseCenter = [this.player.pos[0], this.player.pos[1] + 0.8, this.player.pos[2]];
      const stunnedIds = [];

      for (const shade of this.shades) {
        const d3d = dist3D(pulseCenter, shade.pos);
        if (d3d <= this.tuning.pulse_radius) {
          const wasDraining = (shade.state === 'drain');
          shade.state = 'stunned';
          shade.state_ticks_left = 120;
          shade.push_ticks_left = 15;

          const dx = shade.pos[0] - this.player.pos[0];
          const dz = shade.pos[2] - this.player.pos[2];
          const dist = Math.hypot(dx, dz);
          shade.push_dir = dist > 0.001 ? [dx / dist, dz / dist] : [1.0, 0.0];

          // Score: +15 if was draining, else +5
          this.score += wasDraining ? this.tuning.score.per_stun_drain : this.tuning.score.per_stun;
          stunnedIds.push(shade.id);
        }
      }

      for (const d of this.drifters) {
        if (dist3D(pulseCenter, d.pos) <= this.tuning.pulse_radius) {
          if (d.state === 'chase') {
            d.state = 'flee';
            d.flee_timer = 240;
          } else if (d.state === 'flee' && d.stolen > 0) {
            for (let i = 0; i < d.stolen; i++) {
              this.motes.push({
                id: `M${this.moteIdCounter++}`,
                pos: [...d.pos],
                kind: 'dropped',
                ttl: 480
              });
            }
            this.events.push({
              type: 'event',
              tick: stepTick,
              name: 'drifter_drop',
              data: { drifter_id: d.id, amount: d.stolen }
            });
            d.stolen = 0;
            d.flee_timer = 120;
          }
        }
      }

      this.events.push({
        type: 'event',
        tick: stepTick,
        name: 'pulse',
        data: { stunned_ids: stunnedIds }
      });
    }

    // 8. Move Shades & Drifters
    const shadeSpeed = (this.night === 3 ? this.tuning.shade_speed_night3 : this.tuning.shade_speed) * dt;

    for (const shade of this.shades) {
      if (shade.state === 'stunned') {
        shade.state_ticks_left -= 1;
        if (shade.push_ticks_left && shade.push_ticks_left > 0) {
          shade.push_ticks_left -= 1;
          shade.pos[0] += shade.push_dir[0] * (this.tuning.pulse_push_m / 15.0);
          shade.pos[2] += shade.push_dir[1] * (this.tuning.pulse_push_m / 15.0);
        }
        if (shade.state_ticks_left <= 0) {
          shade.state = 'wander';
        }
      } else if (shade.state === 'drain') {
        // Transition from drain:
        // 1) chase if Mây within 6m
        if (distXZ(shade.pos, this.player.pos) <= 6.0) {
          shade.state = 'chase';
        } else {
          // Check target lantern
          const target = this.lanterns.find(l => l.id === shade.target_lantern_id);
          if (!target || !target.lit || target.fuel >= this.tuning.low_fuel_threshold || distXZ(shade.pos, target.pos) > 2.0) {
            shade.state = 'wander';
            shade.target_lantern_id = null;
          }
        }
      } else if (shade.state === 'recoil') {
        shade.state_ticks_left -= 1;
        shade.pos[0] += shade.recoil_dir[0] * (2.0 / 60.0);
        shade.pos[2] += shade.recoil_dir[1] * (2.0 / 60.0);
        if (shade.state_ticks_left <= 0) {
          shade.state = 'chase';
        }
      } else if (shade.state === 'chase') {
        const dx = this.player.pos[0] - shade.pos[0];
        const dz = this.player.pos[2] - shade.pos[2];
        const dist = Math.hypot(dx, dz);
        if (dist > this.tuning.shade_lose_radius) {
          shade.state = 'wander';
        } else if (dist > 0.001) {
          shade.pos[0] += (dx / dist) * shadeSpeed;
          shade.pos[2] += (dz / dist) * shadeSpeed;
        }
      } else if (shade.state === 'wander' || shade.state === 'spawning') {
        const dPlayer = distXZ(shade.pos, this.player.pos);
        if (dPlayer <= this.tuning.shade_detect_radius) {
          shade.state = 'chase';
        } else {
          // In wander: seek weak lit lantern (fuel < 30) or unlit lantern
          let target = null;
          let minDist = Infinity;

          // Prefer lit lanterns with fuel < 30
          for (const l of this.lanterns) {
            if (l.lit && l.fuel < this.tuning.low_fuel_threshold) {
              const d = distXZ(shade.pos, l.pos);
              if (d < minDist || (Math.abs(d - minDist) < 0.001 && l.id < target?.id)) {
                minDist = d;
                target = l;
              }
            }
          }

          // If no weak lit lantern, move towards closest unlit lantern
          if (!target) {
            minDist = Infinity;
            for (const l of this.lanterns) {
              if (!l.lit) {
                const d = distXZ(shade.pos, l.pos);
                if (d < minDist || (Math.abs(d - minDist) < 0.001 && l.id < target?.id)) {
                  minDist = d;
                  target = l;
                }
              }
            }
          }

          if (target) {
            shade.target_lantern_id = target.id;
            const dx = target.pos[0] - shade.pos[0];
            const dz = target.pos[2] - shade.pos[2];
            const d = Math.hypot(dx, dz);

            if (target.lit && target.fuel < this.tuning.low_fuel_threshold && d <= 2.0) {
              shade.state = 'drain';
            } else if (d > 0.001) {
              shade.pos[0] += (dx / d) * shadeSpeed;
              shade.pos[2] += (dz / d) * shadeSpeed;
            }
          }
        }
      }
    }

    // Move Drifters (Gió Lạc)
    for (let i = this.drifters.length - 1; i >= 0; i--) {
      const d = this.drifters[i];
      if (d.state === 'flee') {
        d.flee_timer -= 1;
        const dx = d.pos[0] - this.player.pos[0];
        const dz = d.pos[2] - this.player.pos[2];
        const dist = Math.hypot(dx, dz);
        if (dist > 0.001) {
          d.pos[0] += (dx / dist) * (7.0 * dt);
          d.pos[2] += (dz / dist) * (7.0 * dt);
        }
        if (d.flee_timer <= 0) {
          this.drifters.splice(i, 1);
        }
      } else if (d.state === 'chase') {
        const dx = this.player.pos[0] - d.pos[0];
        const dz = this.player.pos[2] - d.pos[2];
        const dist = Math.hypot(dx, dz);
        if (this.player.carried < 5 || dist > 15.0) {
          d.state = 'idle';
        } else if (dist > 0.001) {
          d.pos[0] += (dx / dist) * (7.0 * dt);
          d.pos[2] += (dz / dist) * (7.0 * dt);
        }
      } else if (d.state === 'idle') {
        const dist = distXZ(d.pos, this.player.pos);
        if (this.player.carried >= 5 && dist <= 15.0) {
          d.state = 'chase';
        }
      }
    }

    // 9. Contact (Gió Lạc steals first, then Shades inflict hit)
    for (const d of this.drifters) {
      if (d.state === 'chase' && distXZ(d.pos, this.player.pos) <= 1.2) {
        const stealAmount = Math.min(3, this.player.carried);
        this.player.carried -= stealAmount;
        d.stolen = stealAmount;
        d.state = 'flee';
        d.flee_timer = 240;
        this.events.push({
          type: 'event',
          tick: stepTick,
          name: 'drifter_steal',
          data: { drifter_id: d.id, amount: stealAmount, carried: this.player.carried }
        });
      }
    }

    const sortedShades = [...this.shades].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
    let flameLostThisTick = false;

    for (const shade of sortedShades) {
      if (shade.state === 'chase') {
        const dXZ = distXZ(shade.pos, this.player.pos);
        const dY = Math.abs(shade.pos[1] - this.player.pos[1]);
        if (dXZ <= this.tuning.shade_hit_radius && dY <= 1.5) {
          if (this.player.invuln_timer <= 0 && !flameLostThisTick) {
            flameLostThisTick = true;
            this.player.flames -= 1;
            const dropCount = Math.floor(this.player.carried * this.tuning.hit_drop_ratio);
            this.player.carried -= dropCount;
            this.player.invuln_timer = 90;

            for (let i = 0; i < dropCount; i++) {
              const a = this.prng.nextFloat(0, Math.PI * 2);
              const r = this.prng.nextFloat(1.5, 2.5);
              this.motes.push({
                id: `M${this.moteIdCounter++}`,
                pos: [this.player.pos[0] + r * Math.cos(a), this.player.pos[1], this.player.pos[2] + r * Math.sin(a)],
                kind: 'dropped',
                ttl: 480
              });
            }

            this.events.push({
              type: 'event',
              tick: stepTick,
              name: 'player_hit',
              data: { by: 'shade', flames: this.player.flames, dropped: dropCount }
            });

            shade.state = 'recoil';
            shade.state_ticks_left = 60;
            const dx = shade.pos[0] - this.player.pos[0];
            const dz = shade.pos[2] - this.player.pos[2];
            const d = Math.hypot(dx, dz);
            shade.recoil_dir = d > 0.001 ? [dx / d, dz / d] : [1.0, 0.0];

            if (this.player.flames <= 0) {
              this.state = 'lost';
              this.events.push({
                type: 'event',
                tick: stepTick,
                name: 'game_over',
                data: { result: 'lost', reason: 'no_flames' }
              });
              this.tick = stepTick;
              return this.events;
            }
          }
        }
      }
    }

    // 10. Spawning Schedule
    if (this.random_motes && this.sim_tick % 240 === 0 && this.motes.length < 30) {
      const spawnPoints = this.map.mote_spawn_points;
      const occupied = new Set(this.motes.map(m => `${round3(m.pos[0])},${round3(m.pos[2])}`));
      const available = spawnPoints.filter(p => !occupied.has(`${round3(p[0])},${round3(p[2])}`));
      if (available.length > 0) {
        const chosen = available[this.prng.nextInt(0, available.length - 1)];
        this.motes.push({
          id: `M${this.moteIdCounter++}`,
          pos: [...chosen],
          kind: 'random',
          ttl: 0
        });
      }
    }

    if (this.random_shades) {
      const maxShades = this.night === 1 ? 6 : (this.night === 2 ? 8 : 10);
      const spawnInterval = this.night === 1 ? 480 : (this.night === 2 ? 420 : 360);
      let shouldSpawn = 0;

      if (this.sim_tick === 300) {
        shouldSpawn = 2;
      } else if (this.sim_tick > 300 && (this.sim_tick - 300) % spawnInterval === 0) {
        shouldSpawn = 1;
      }

      if (shouldSpawn > 0 && this.shades.length < maxShades) {
        const availablePoints = this.map.shade_spawn_points.filter(p => distXZ(p, this.player.pos) >= 15.0);
        for (let i = 0; i < shouldSpawn && this.shades.length < maxShades; i++) {
          if (availablePoints.length > 0) {
            const pt = availablePoints[this.prng.nextInt(0, availablePoints.length - 1)];
            const newShade = {
              id: `S${this.shadeIdCounter++}`,
              pos: [...pt],
              state: 'spawning',
              state_ticks_left: 60,
              target_lantern_id: null,
              recoil_dir: [0, 0],
              push_ticks_left: 0,
              push_dir: [0, 0]
            };
            this.shades.push(newShade);
            this.events.push({
              type: 'event',
              tick: stepTick,
              name: 'shade_spawned',
              data: { id: newShade.id }
            });
          }
        }
      }
    }

    if (this.random_drifters && (this.night === 2 || this.night === 3)) {
      if (this.sim_tick % 1200 === 0 && this.drifters.length < 2) {
        const spawnPoints = this.map.shade_spawn_points;
        const pt = spawnPoints[this.prng.nextInt(0, spawnPoints.length - 1)];
        this.drifters.push({
          id: `D${this.drifterIdCounter++}`,
          pos: [pt[0], 1.5, pt[2]],
          state: 'idle',
          stolen: 0,
          flee_timer: 0
        });
      }
    }

    // 11. Win / Loss Check (Ticket-03)
    if (this.player.flames <= 0) {
      this.state = 'lost';
      this.events.push({
        type: 'event',
        tick: stepTick,
        name: 'game_over',
        data: { result: 'lost', reason: 'no_flames' }
      });
    } else if (this.time_left_s <= 0 && this.state === 'playing') {
      const litLanterns = this.lanterns.filter(l => l.lit);
      const needed = Math.ceil(this.tuning.win_ratio * this.lanterns.length);

      if (litLanterns.length >= needed) {
        this.state = 'won';
        // Scoring at dawn: +50 per lit lantern + floor(fuel) + 50 per remaining flame
        for (const l of litLanterns) {
          this.score += this.tuning.score.per_lit_lantern_base + Math.floor(l.fuel);
        }
        this.score += this.player.flames * this.tuning.score.per_flame_left;

        this.events.push({
          type: 'event',
          tick: stepTick,
          name: 'game_over',
          data: { result: 'won', reason: 'dawn_survived' }
        });
      } else {
        this.state = 'lost';
        this.events.push({
          type: 'event',
          tick: stepTick,
          name: 'game_over',
          data: { result: 'lost', reason: 'dawn' }
        });
      }
    }

    this.tick = stepTick;
    return this.events;
  }

  getSnapshot() {
    return {
      type: 'snapshot',
      tick: this.tick,
      sim_tick: this.sim_tick,
      night: this.night,
      state: this.state,
      time_left_s: round3(this.time_left_s),
      score: this.score,
      wind: {
        active: Boolean(this.wind.active),
        dir_deg: round3(this.wind.dir_deg || 0.0)
      },
      player: {
        pos: [round3(this.player.pos[0]), round3(this.player.pos[1]), round3(this.player.pos[2])],
        vel: [round3(this.player.vel[0]), round3(this.player.vel[1]), round3(this.player.vel[2])],
        grounded: this.player.grounded,
        flames: this.player.flames,
        carried: this.player.carried,
        capacity: this.player.capacity,
        invuln: this.player.invuln_timer > 0,
        dash_cd_s: round3(Math.max(0, this.player.dash_cd_timer / 60.0)),
        pulse_cd_s: round3(Math.max(0, this.player.pulse_cd_timer / 60.0)),
        charm_s: round3(Math.max(0, this.player.charm_timer / 60.0))
      },
      lanterns: this.lanterns.map(l => ({
        id: l.id,
        pos: [round3(l.pos[0]), round3(l.pos[1]), round3(l.pos[2])],
        lit: l.lit,
        deposited: l.deposited,
        fuel: l.lit ? round1(l.fuel) : 0.0,
        ever_lit: Boolean(l.ever_lit),
        relit_count: l.relit_count || 0
      })),
      shades: this.shades.map(s => ({
        id: s.id,
        pos: [round3(s.pos[0]), round3(s.pos[1]), round3(s.pos[2])],
        state: s.state
      })),
      drifters: this.drifters.map(d => ({
        id: d.id,
        pos: [round3(d.pos[0]), round3(d.pos[1]), round3(d.pos[2])],
        state: d.state,
        stolen: d.stolen
      })),
      charms: this.charms.map(c => ({
        id: c.id,
        available: c.available,
        respawn_s: round3(Math.max(0, c.respawn_timer / 60.0))
      })),
      motes: this.motes.map(m => ({
        id: m.id,
        pos: [round3(m.pos[0]), round3(m.pos[1]), round3(m.pos[2])],
        kind: m.kind,
        ttl_s: round3(Math.max(0, (m.ttl || 0) / 60.0))
      })),
      motes_active: this.motes.length
    };
  }
}
