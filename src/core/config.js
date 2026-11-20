export const DEFAULT_TUNING = {
  player_speed: 6.0,
  jump_velocity: 7.0,
  gravity: -20.0,
  dash_speed: 14.0,
  dash_duration_s: 0.2,   // 12 ticks
  dash_cooldown_s: 1.5,   // 90 ticks
  carry_capacity: 10,
  capacity_max: 20,
  lantern_cost: 10,
  relight_cost: 5,
  fuel_max: 100,
  fuel_decay_per_s: 1.0,
  fuel_per_mote: 10,
  drain_per_s: 5,
  low_fuel_threshold: 30,
  win_ratio: 0.6,
  lantern_count_night1: 5,
  lantern_count_night2: 6,
  lantern_count_night3: 7,
  pickup_radius: 1.0,
  pickup_height_max: 1.5,
  interact_radius: 2.0,
  pulse_cost: 3,
  pulse_radius: 5.0,
  pulse_cooldown_s: 3.0,  // 180 ticks
  pulse_stun_s: 2.0,      // 120 ticks (15 ticks push 4m)
  pulse_push_m: 4.0,
  safe_radius: 6.0,
  shade_speed: 4.0,
  shade_speed_night3: 4.5,
  shade_hit_radius: 1.0,
  shade_detect_radius: 12.0,
  shade_lose_radius: 18.0,
  flames: 3,
  invuln_s: 1.5,          // 90 ticks
  hit_drop_ratio: 0.5,
  fall_enabled: true,
  night1_duration_s: 240,
  night2_duration_s: 270,
  night3_duration_s: 300,
  score: {
    per_mote_deposited: 5,
    per_first_light: 100,
    per_relight: 40,
    per_stun: 5,
    per_stun_drain: 15,
    per_lit_lantern_base: 50,
    per_flame_left: 50
  }
};

// Night 1 Maps & Data
export const NIGHT1_MAP = {
  radius: 40.0,
  player_start: [0.0, 0.0, 0.0],
  lanterns: [
    { id: "L1", pos: [0.0, 0.0, 25.0], lit: false, deposited: 0 },
    { id: "L2", pos: [23.8, 0.0, 7.7], lit: false, deposited: 0 },
    { id: "L3", pos: [14.7, 0.0, -20.2], lit: false, deposited: 0 },
    { id: "L4", pos: [-14.7, 0.0, -20.2], lit: false, deposited: 0 },
    { id: "L5", pos: [-23.8, 0.0, 7.7], lit: false, deposited: 0 }
  ],
  mote_spawn_points: (() => {
    const pts = [];
    // 8 points on R=12m (every 45 deg)
    for (let i = 0; i < 8; i++) {
      const a = (i * 45 * Math.PI) / 180;
      pts.push([12.0 * Math.cos(a), 0.0, 12.0 * Math.sin(a)]);
    }
    // 16 points on R=33m (every 22.5 deg)
    for (let i = 0; i < 16; i++) {
      const a = (i * 22.5 * Math.PI) / 180;
      pts.push([33.0 * Math.cos(a), 0.0, 33.0 * Math.sin(a)]);
    }
    return pts;
  })(),
  shade_spawn_points: (() => {
    const pts = [];
    // 12 points on R=37m (15, 45, ...)
    for (let i = 0; i < 12; i++) {
      const a = ((15 + i * 30) * Math.PI) / 180;
      pts.push([37.0 * Math.cos(a), 0.0, 37.0 * Math.sin(a)]);
    }
    return pts;
  })()
};

// Night 2 Maps & Data
export const NIGHT2_MAP = {
  islandA: { center: [0, 0, 0], radius: 28.0 },
  islandB: { center: [70, 0, 0], radius: 28.0 },
  bridge: { xMin: 26.0, xMax: 44.0, zMin: -2.0, zMax: 2.0 },
  launchPads: [
    { pos: [20.0, 0.0, 18.0], radius: 1.0, targetCenter: [70.0, 0.0, 0.0], vy: 14.0, vh: 24.0 },
    { pos: [50.0, 0.0, -18.0], radius: 1.0, targetCenter: [0.0, 0.0, 0.0], vy: 14.0, vh: 24.0 }
  ],
  charms: [
    { id: "C1", pos: [35.0, 0.0, 0.0], available: true, respawn_timer: 0 }
  ],
  lanterns: [
    { id: "L1", pos: [0.0, 0.0, 20.0], lit: false, deposited: 0 },
    { id: "L2", pos: [17.0, 0.0, -10.0], lit: false, deposited: 0 },
    { id: "L3", pos: [-17.0, 0.0, -10.0], lit: false, deposited: 0 },
    { id: "L4", pos: [70.0, 0.0, 20.0], lit: false, deposited: 0 },
    { id: "L5", pos: [87.0, 0.0, -10.0], lit: false, deposited: 0 },
    { id: "L6", pos: [53.0, 0.0, -10.0], lit: false, deposited: 0 }
  ],
  mote_spawn_points: (() => {
    const pts = [];
    const centers = [[0, 0, 0], [70, 0, 0]];
    for (const c of centers) {
      // 4 on R=10m (0, 90, 180, 270)
      for (let i = 0; i < 4; i++) {
        const a = (i * 90 * Math.PI) / 180;
        pts.push([c[0] + 10.0 * Math.cos(a), 0.0, c[2] + 10.0 * Math.sin(a)]);
      }
      // 8 on R=22m (every 45)
      for (let i = 0; i < 8; i++) {
        const a = (i * 45 * Math.PI) / 180;
        pts.push([c[0] + 22.0 * Math.cos(a), 0.0, c[2] + 22.0 * Math.sin(a)]);
      }
    }
    return pts;
  })(),
  shade_spawn_points: (() => {
    const pts = [];
    const centers = [[0, 0, 0], [70, 0, 0]];
    for (const c of centers) {
      // 8 on R=26m (22.5, 67.5, ...)
      for (let i = 0; i < 8; i++) {
        const a = ((22.5 + i * 45) * Math.PI) / 180;
        pts.push([c[0] + 26.0 * Math.cos(a), 0.0, c[2] + 26.0 * Math.sin(a)]);
      }
    }
    return pts;
  })()
};

// Night 3 Maps & Data
export const NIGHT3_MAP = {
  radius: 45.0,
  tiers: [
    { level: 0, y: 0.0, rMax: 45.0 },
    { level: 1, y: 3.0, rMin: 12.0, rMax: 24.0, zPosOnly: true },
    { level: 2, y: 6.0, rMax: 8.0 }
  ],
  bellTower: { center: [0, 6, 0], radius: 2.0, height: 8.0 },
  launchPads: [
    { pos: [0.0, 3.0, 13.0], radius: 1.0, dir: [0, -1], vy: 12.0, vh: 8.0 } // target tier 2
  ],
  ramps: [
    { angle_deg: 30, width: 3.0, rFoot: 30.0, rTop: 24.0, yFoot: 0.0, yTop: 3.0 },
    { angle_deg: 150, width: 3.0, rFoot: 30.0, rTop: 24.0, yFoot: 0.0, yTop: 3.0 }
  ],
  charms: [
    { id: "C1", pos: [30.0, 0.0, 25.0], available: true, respawn_timer: 0 },
    { id: "C2", pos: [-30.0, 0.0, 25.0], available: true, respawn_timer: 0 }
  ],
  lanterns: [
    { id: "L1", pos: [0.0, 6.0, 6.0], lit: false, deposited: 0 },
    { id: "L2", pos: [18.0, 3.0, 10.0], lit: false, deposited: 0 },
    { id: "L3", pos: [-18.0, 3.0, 10.0], lit: false, deposited: 0 },
    { id: "L4", pos: [35.0, 0.0, -10.0], lit: false, deposited: 0 },
    { id: "L5", pos: [-35.0, 0.0, -10.0], lit: false, deposited: 0 },
    { id: "L6", pos: [20.0, 0.0, -35.0], lit: false, deposited: 0 },
    { id: "L7", pos: [-20.0, 0.0, -35.0], lit: false, deposited: 0 }
  ],
  mote_spawn_points: (() => {
    const pts = [];
    // Tier 0: 18 on R=34m (every 20 deg from 0)
    for (let i = 0; i < 18; i++) {
      const a = (i * 20 * Math.PI) / 180;
      pts.push([34.0 * Math.cos(a), 0.0, 34.0 * Math.sin(a)]);
    }
    // Tier 1: 8 on R=18m (20, 40, ..., 160)
    for (let i = 0; i < 8; i++) {
      const a = ((20 + i * 20) * Math.PI) / 180;
      pts.push([18.0 * Math.cos(a), 3.0, 18.0 * Math.sin(a)]);
    }
    // Tier 2: 4 on R=5m (45, 135, 225, 315)
    for (const deg of [45, 135, 225, 315]) {
      const a = (deg * Math.PI) / 180;
      pts.push([5.0 * Math.cos(a), 6.0, 5.0 * Math.sin(a)]);
    }
    return pts;
  })(),
  shade_spawn_points: (() => {
    const pts = [];
    // 16 on R=43m (every 22.5 deg)
    for (let i = 0; i < 16; i++) {
      const a = (i * 22.5 * Math.PI) / 180;
      pts.push([43.0 * Math.cos(a), 0.0, 43.0 * Math.sin(a)]);
    }
    return pts;
  })()
};
