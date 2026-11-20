export const DEFAULT_TUNING = {
  player_speed: 6.0,
  carry_capacity: 5,
  lantern_cost: 3,
  lantern_count_night1: 5,
  pickup_radius: 1.5,
  interact_radius: 2.5,
  pulse_cost: 1,
  pulse_radius: 5.0,
  night1_duration_s: 180,
  flames: 3,
  invuln_s: 2.0,
  hit_drop_ratio: 0.5,
  pulse_stun_s: 3.0,
  pulse_push_m: 4.0,
  pulse_cooldown_s: 1.0,
  safe_radius: 4.0,
  shade_speed: 3.5,
  shade_hit_radius: 1.0,
  fall_enabled: false,
  score: {
    per_mote: 10,
    per_lantern: 100,
    per_stun: 20,
    per_second_left: 5,
    per_flame_left: 50
  }
};

export const DEFAULT_LANTERNS_NIGHT1 = [
  { id: "L1", pos: [0.0, 0.0, 20.0], lit: false, deposited: 0 },
  { id: "L2", pos: [19.021, 0.0, 6.18], lit: false, deposited: 0 },
  { id: "L3", pos: [11.756, 0.0, -16.18], lit: false, deposited: 0 },
  { id: "L4", pos: [-11.756, 0.0, -16.18], lit: false, deposited: 0 },
  { id: "L5", pos: [-19.021, 0.0, 6.18], lit: false, deposited: 0 }
];
