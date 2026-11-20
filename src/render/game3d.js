import { IslandEngine, distXZ } from '../core/engine.js';
import { SoundFX } from './audio.js';

/* global THREE */

export class Game3D {
  constructor(container, night = 1) {
    this.container = container;
    this.night = night;
    this.sound = new SoundFX();
    this.engine = new IslandEngine({
      seed: Math.floor(Math.random() * 10000),
      night: this.night
    });

    this.keys = {
      KeyW: false, KeyS: false, KeyA: false, KeyD: false,
      ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
      Space: false, KeyE: false, KeyQ: false, KeyF: false,
      ShiftLeft: false, KeyC: false, Escape: false, KeyP: false
    };

    this.camYawDeg = 0;
    this.pulseWaves = [];
    this.lastCountdownSec = -1;

    this.initScene();
    this.initEntities();
    this.bindEvents();
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.tickInterval = 1000 / 60;
  }

  initScene() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    // Bảng màu chuẩn: Trời đêm / sương (#0E1430 / #1B2350)
    this.scene.background = new THREE.Color(0x0e1430);
    this.scene.fog = new THREE.FogExp2(0x1b2350, 0.02);

    this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 200);
    this.camera.position.set(0, 10, 16);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // Ánh sáng môi trường ban đầu
    this.ambientLight = new THREE.AmbientLight(0x2f3d6b, 0.25);
    this.scene.add(this.ambientLight);

    const dirLight = new THREE.DirectionalLight(0x7a91c9, 0.7);
    dirLight.position.set(20, 50, 20);
    this.scene.add(dirLight);

    // Dựng bản đồ theo Đêm 1, 2, 3
    this.createMapTerrain();
  }

  createMapTerrain() {
    const terrainGroup = new THREE.Group();

    // Biển mây: #12384A
    const cloudGeo = new THREE.PlaneGeometry(500, 500);
    const cloudMat = new THREE.MeshBasicMaterial({ color: 0x12384a, transparent: true, opacity: 0.85 });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    cloudMesh.rotation.x = -Math.PI / 2;
    cloudMesh.position.y = -14;
    terrainGroup.add(cloudMesh);

    // Cỏ: #2F5D50 | Cát: #C9B48A | Gỗ: #6B4A2F
    const grassMat = new THREE.MeshLambertMaterial({ color: 0x2f5d50 });
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x6b4a2f });
    const rockMat = new THREE.MeshLambertMaterial({ color: 0x1e2733 });

    if (this.night === 1) {
      // Đêm 1 — Đảo Bến: tròn tâm (0,0,0), bán kính 40m
      const topGeo = new THREE.CylinderGeometry(40, 40.5, 2, 64);
      const topMesh = new THREE.Mesh(topGeo, grassMat);
      topMesh.position.y = -1;
      terrainGroup.add(topMesh);

      const baseGeo = new THREE.CylinderGeometry(40.5, 18, 16, 64);
      const baseMesh = new THREE.Mesh(baseGeo, rockMat);
      baseMesh.position.y = -10;
      terrainGroup.add(baseMesh);

    } else if (this.night === 2) {
      // Đêm 2 — Đảo Cau: 2 đảo tròn R=28m (A: 0,0,0 & B: 70,0,0) + Cầu tre
      for (const cx of [0, 70]) {
        const topGeo = new THREE.CylinderGeometry(28, 28.5, 2, 48);
        const topMesh = new THREE.Mesh(topGeo, grassMat);
        topMesh.position.set(cx, -1, 0);
        terrainGroup.add(topMesh);

        const baseGeo = new THREE.CylinderGeometry(28.5, 12, 16, 48);
        const baseMesh = new THREE.Mesh(baseGeo, rockMat);
        baseMesh.position.set(cx, -10, 0);
        terrainGroup.add(baseMesh);
      }

      // Cầu tre: x in [26, 44], z in [-2, 2]
      const bridgeGeo = new THREE.BoxGeometry(18, 0.4, 4);
      const bridgeMesh = new THREE.Mesh(bridgeGeo, woodMat);
      bridgeMesh.position.set(35, -0.2, 0);
      terrainGroup.add(bridgeMesh);

      // 2 Bục nhảy: R=1m tại (20,0,18) và (50,0,-18)
      for (const pos of [[20, 0.05, 18], [50, 0.05, -18]]) {
        const padGeo = new THREE.CylinderGeometry(1, 1, 0.1, 24);
        const padMat = new THREE.MeshLambertMaterial({ color: 0xf2c14e });
        const padMesh = new THREE.Mesh(padGeo, padMat);
        padMesh.position.set(...pos);
        terrainGroup.add(padMesh);
      }

    } else if (this.night === 3) {
      // Đêm 3 — Đảo Chuông: tròn R=45m, 3 tầng (0m, 3m, 6m)
      // Tầng 0 (Y=0, R=45m)
      const t0Geo = new THREE.CylinderGeometry(45, 45.5, 2, 64);
      const t0Mesh = new THREE.Mesh(t0Geo, grassMat);
      t0Mesh.position.y = -1;
      terrainGroup.add(t0Mesh);

      // Tầng 1 (Y=3, R in [12, 24] nửa z > 0)
      const t1Geo = new THREE.CylinderGeometry(24, 24, 3, 48, 1, false, 0, Math.PI);
      const t1Mesh = new THREE.Mesh(t1Geo, grassMat);
      t1Mesh.position.y = 1.5;
      terrainGroup.add(t1Mesh);

      // Tầng 2 (Y=6, R=8m)
      const t2Geo = new THREE.CylinderGeometry(8, 8, 3, 32);
      const t2Mesh = new THREE.Mesh(t2Geo, grassMat);
      t2Mesh.position.y = 4.5;
      terrainGroup.add(t2Mesh);

      // Tháp chuông ở tâm tầng 2: hình trụ R=2m, cao 8m
      const towerGeo = new THREE.CylinderGeometry(2, 2.2, 8, 20);
      const towerMat = new THREE.MeshLambertMaterial({ color: 0x5b5f6e });
      const towerMesh = new THREE.Mesh(towerGeo, towerMat);
      towerMesh.position.set(0, 10, 0);
      terrainGroup.add(towerMesh);

      // Bục nhảy tầng 1 tại (0, 3, 13)
      const padGeo = new THREE.CylinderGeometry(1, 1, 0.1, 24);
      const padMat = new THREE.MeshLambertMaterial({ color: 0xf2c14e });
      const padMesh = new THREE.Mesh(padGeo, padMat);
      padMesh.position.set(0, 3.05, 13);
      terrainGroup.add(padMesh);
    }

    this.scene.add(terrainGroup);
  }

  initEntities() {
    // 1. Mây (Áo Mây #E8E2D0, Khăn Mây #C8102E, Nón lá #C9B48A)
    this.playerGroup = new THREE.Group();

    const bodyGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.2, 16);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xe8e2d0 });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.6;
    this.playerGroup.add(bodyMesh);

    const scarfGeo = new THREE.TorusGeometry(0.36, 0.08, 8, 16);
    const scarfMat = new THREE.MeshLambertMaterial({ color: 0xc8102e });
    const scarfMesh = new THREE.Mesh(scarfGeo, scarfMat);
    scarfMesh.rotation.x = Math.PI / 2;
    scarfMesh.position.y = 1.1;
    this.playerGroup.add(scarfMesh);

    const hatGeo = new THREE.ConeGeometry(0.75, 0.35, 24);
    const hatMat = new THREE.MeshLambertMaterial({ color: 0xc9b48a });
    const hatMesh = new THREE.Mesh(hatGeo, hatMat);
    hatMesh.position.y = 1.45;
    this.playerGroup.add(hatMesh);

    this.playerLight = new THREE.PointLight(0xffb347, 1.0, 8);
    this.playerLight.position.set(0, 1.2, 0);
    this.playerGroup.add(this.playerLight);

    this.scene.add(this.playerGroup);

    // 2. Đèn Lồng
    this.lanternMeshes = [];
    this.engine.lanterns.forEach(lanternData => {
      const g = new THREE.Group();
      g.position.set(lanternData.pos[0], lanternData.pos[1], lanternData.pos[2]);

      const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 3.2, 12);
      const poleMat = new THREE.MeshLambertMaterial({ color: 0x6b4a2f });
      const poleMesh = new THREE.Mesh(poleGeo, poleMat);
      poleMesh.position.y = 1.6;
      g.add(poleMesh);

      const bulbGeo = new THREE.SphereGeometry(0.5, 16, 16);
      const bulbMat = new THREE.MeshBasicMaterial({ color: 0x5b5f6e });
      const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
      bulbMesh.position.y = 2.4;
      g.add(bulbMesh);

      const light = new THREE.PointLight(0xffb347, 0.2, 16);
      light.position.set(0, 2.5, 0);
      g.add(light);

      this.scene.add(g);
      this.lanternMeshes.push({ id: lanternData.id, group: g, bulb: bulbMesh, light: light });
    });

    // 3. Motes (Đom đóm: lõi #FFF6C2, quầng #FFE58A)
    this.moteMeshMap = new Map();
    this.moteGeo = new THREE.SphereGeometry(0.16, 12, 12);
    this.moteMat = new THREE.MeshBasicMaterial({ color: 0xfff6c2 });

    // 4. Bóng Mực (thân #120A1A, choáng #3A3450)
    this.shadeMeshMap = new Map();
    this.shadeGeo = new THREE.SphereGeometry(0.65, 16, 16);
    this.shadeMat = new THREE.MeshLambertMaterial({ color: 0x120a1a });
    this.shadeStunMat = new THREE.MeshLambertMaterial({ color: 0x3a3450 });

    // 5. Gió Lạc (Drifters: #8FA3B8)
    this.drifterMeshMap = new Map();
    this.drifterGeo = new THREE.CylinderGeometry(0.2, 0.05, 1.8, 12);
    this.drifterMat = new THREE.MeshLambertMaterial({ color: 0x8fa3b8 });

    // 6. Bùa Gió (Charms: #C8102E viền #F2C14E)
    this.charmMeshMap = new Map();
    this.charmGeo = new THREE.BoxGeometry(0.6, 0.8, 0.1);
    this.charmMat = new THREE.MeshLambertMaterial({ color: 0xc8102e });
  }

  bindEvents() {
    window.addEventListener('keydown', e => {
      if (this.keys.hasOwnProperty(e.code)) {
        this.keys[e.code] = true;
        this.sound.init();
      }
    });

    window.addEventListener('keyup', e => {
      if (this.keys.hasOwnProperty(e.code)) {
        this.keys[e.code] = false;
      }
    });

    window.addEventListener('resize', () => {
      const width = this.container.clientWidth || window.innerWidth;
      const height = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
  }

  gatherInput() {
    let rawX = 0;
    let rawZ = 0;

    if (this.keys.KeyW || this.keys.ArrowUp) rawZ += 1;
    if (this.keys.KeyS || this.keys.ArrowDown) rawZ -= 1;
    if (this.keys.KeyD || this.keys.ArrowRight) rawX += 1;
    if (this.keys.KeyA || this.keys.ArrowLeft) rawX -= 1;

    const jump = Boolean(this.keys.Space);
    const interact = Boolean(this.keys.KeyE);
    const pulse = Boolean(this.keys.KeyQ || this.keys.KeyF);
    const dash = Boolean(this.keys.ShiftLeft || this.keys.KeyC);
    const pause = Boolean(this.keys.Escape || this.keys.KeyP);

    return {
      move: [rawX, rawZ],
      cam_yaw_deg: this.camYawDeg,
      jump: jump,
      interact: interact,
      pulse: pulse,
      dash: dash,
      pause: pause
    };
  }

  updateEngine() {
    const input = this.gatherInput();
    this.engine.setInput(input);
    const events = this.engine.step();

    for (const ev of events) {
      if (ev.name === 'mote_picked') {
        this.sound.playMoteChime();
      } else if (ev.name === 'dash') {
        this.sound.playDashSound();
      } else if (ev.name === 'pulse') {
        this.sound.playPulseSound();
        this.triggerPulseWave();
      } else if (ev.name === 'lantern_lit') {
        this.sound.playLanternLitSound();
      } else if (ev.name === 'player_hit') {
        this.sound.playHitSound();
      } else if (ev.name === 'charm_picked') {
        this.sound.playCharmSound();
      }
    }

    // 10s countdown beep
    const sec = Math.ceil(this.engine.time_left_s);
    if (sec <= 10 && sec > 0 && sec !== this.lastCountdownSec) {
      this.lastCountdownSec = sec;
      this.sound.playCountdownBeep();
    }
  }

  triggerPulseWave() {
    const geo = new THREE.RingGeometry(0.5, 1.0, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffb347,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(this.engine.player.pos[0], this.engine.player.pos[1] + 0.1, this.engine.player.pos[2]);
    this.scene.add(mesh);

    this.pulseWaves.push({ mesh, radius: 1.0, opacity: 0.9 });
  }

  updateVisuals(time) {
    // 1. Player
    this.playerGroup.position.set(
      this.engine.player.pos[0],
      this.engine.player.pos[1],
      this.engine.player.pos[2]
    );

    const rad = (this.engine.player.facing_deg * Math.PI) / 180.0;
    this.playerGroup.rotation.y = rad;

    // Ánh sáng môi trường tăng theo tiến độ: cường độ = 0.15 + 0.55 * (đèn sáng / tổng đèn)
    const litCount = this.engine.lanterns.filter(l => l.lit).length;
    const progress = litCount / this.engine.lanterns.length;
    this.ambientLight.intensity = 0.15 + 0.55 * progress;

    // 2. Camera follow
    const targetCamX = this.engine.player.pos[0];
    const targetCamZ = this.engine.player.pos[2] + 12;
    const targetCamY = this.engine.player.pos[1] + 8;
    this.camera.position.x += (targetCamX - this.camera.position.x) * 0.08;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.08;
    this.camera.position.y += (targetCamY - this.camera.position.y) * 0.08;
    this.camera.lookAt(this.engine.player.pos[0], this.engine.player.pos[1] + 1.2, this.engine.player.pos[2]);

    // 3. Lanterns
    this.engine.lanterns.forEach(lanternData => {
      const found = this.lanternMeshes.find(m => m.id === lanternData.id);
      if (found) {
        if (lanternData.lit) {
          found.bulb.material.color.setHex(0xffb347);
          found.light.color.setHex(0xffb347);
          found.light.intensity = 3.5;
        } else {
          const ratio = lanternData.deposited / this.engine.tuning.lantern_cost;
          found.bulb.material.color.setHex(ratio > 0 ? 0x8a6020 : 0x5b5f6e);
          found.light.intensity = 0.2 + ratio * 1.0;
        }
      }
    });

    // 4. Motes
    const curMoteIds = new Set(this.engine.motes.map(m => m.id));
    for (const [id, mesh] of this.moteMeshMap.entries()) {
      if (!curMoteIds.has(id)) {
        this.scene.remove(mesh);
        this.moteMeshMap.delete(id);
      }
    }
    this.engine.motes.forEach(m => {
      let mesh = this.moteMeshMap.get(m.id);
      if (!mesh) {
        mesh = new THREE.Mesh(this.moteGeo, this.moteMat);
        this.scene.add(mesh);
        this.moteMeshMap.set(m.id, mesh);
      }
      const bob = Math.sin(time * 0.005 + (m.pos[0] + m.pos[2])) * 0.2 + 0.4;
      mesh.position.set(m.pos[0], m.pos[1] + bob, m.pos[2]);
    });

    // 5. Shades
    const curShadeIds = new Set(this.engine.shades.map(s => s.id));
    for (const [id, mesh] of this.shadeMeshMap.entries()) {
      if (!curShadeIds.has(id)) {
        this.scene.remove(mesh);
        this.shadeMeshMap.delete(id);
      }
    }
    this.engine.shades.forEach(s => {
      let mesh = this.shadeMeshMap.get(s.id);
      if (!mesh) {
        mesh = new THREE.Mesh(this.shadeGeo, this.shadeMat);
        this.scene.add(mesh);
        this.shadeMeshMap.set(s.id, mesh);
      }
      mesh.position.set(s.pos[0], s.pos[1] + 0.7, s.pos[2]);
      mesh.material = s.state === 'stunned' ? this.shadeStunMat : this.shadeMat;
    });

    // 6. Drifters (Gió Lạc)
    const curDrifterIds = new Set(this.engine.drifters.map(d => d.id));
    for (const [id, mesh] of this.drifterMeshMap.entries()) {
      if (!curDrifterIds.has(id)) {
        this.scene.remove(mesh);
        this.drifterMeshMap.delete(id);
      }
    }
    this.engine.drifters.forEach(d => {
      let mesh = this.drifterMeshMap.get(d.id);
      if (!mesh) {
        mesh = new THREE.Mesh(this.drifterGeo, this.drifterMat);
        this.scene.add(mesh);
        this.drifterMeshMap.set(d.id, mesh);
      }
      mesh.position.set(d.pos[0], d.pos[1], d.pos[2]);
      mesh.rotation.z = Math.sin(time * 0.01) * 0.3;
    });

    // 7. Charms (Bùa Gió)
    for (const c of this.engine.charms) {
      let mesh = this.charmMeshMap.get(c.id);
      if (!mesh) {
        mesh = new THREE.Mesh(this.charmGeo, this.charmMat);
        this.scene.add(mesh);
        this.charmMeshMap.set(c.id, mesh);
      }
      mesh.visible = c.available;
      mesh.position.set(c.pos[0], c.pos[1] + 0.5, c.pos[2]);
      mesh.rotation.y = time * 0.002;
    }

    // 8. Pulse Waves
    for (let i = this.pulseWaves.length - 1; i >= 0; i--) {
      const pw = this.pulseWaves[i];
      pw.radius += 0.25;
      pw.opacity -= 0.03;
      pw.mesh.scale.set(pw.radius, pw.radius, 1);
      pw.mesh.material.opacity = Math.max(0, pw.opacity);
      if (pw.opacity <= 0) {
        this.scene.remove(pw.mesh);
        this.pulseWaves.splice(i, 1);
      }
    }
  }

  renderLoop(time) {
    const delta = time - this.lastTime;
    this.lastTime = time;
    this.accumulator += delta;

    while (this.accumulator >= this.tickInterval) {
      if (this.engine.state === 'playing') {
        this.updateEngine();
      }
      this.accumulator -= this.tickInterval;
    }

    this.updateVisuals(time);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(t => this.renderLoop(t));
  }

  start() {
    requestAnimationFrame(t => {
      this.lastTime = t;
      this.renderLoop(t);
    });
  }

  restart(night = this.night) {
    this.night = night;
    this.engine = new IslandEngine({
      seed: Math.floor(Math.random() * 10000),
      night: this.night
    });
  }
}
