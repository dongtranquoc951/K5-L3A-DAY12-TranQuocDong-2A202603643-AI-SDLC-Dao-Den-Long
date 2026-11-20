// Mulberry32 deterministic 32-bit pseudo-random number generator
export class PRNG {
  constructor(seed = 12345) {
    this.s = Math.floor(Number(seed)) >>> 0;
  }

  // Returns float in [0, 1)
  next() {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Returns integer in [min, max] inclusive
  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Returns float in [min, max)
  nextFloat(min, max) {
    return min + (max - min) * this.next();
  }
}
