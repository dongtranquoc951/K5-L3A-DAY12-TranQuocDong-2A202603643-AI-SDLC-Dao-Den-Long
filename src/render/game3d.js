import { IslandEngine, distXZ } from '../core/engine.js';
import { SoundFX } from './audio.js';

/* global THREE */

export class Game3D {
  constructor(container, night = 1) {
    this.container = container;
    this.night = night;
    this.sound = new SoundFX();

    // Load settings from localStorage
    const savedVol = localStorage.getItem('dao_den_long_vol');
    if (savedVol !== null) this.sound.setVolume(parseFloat(savedVol));

    const savedSens = localStorage.getItem('dao_den_long_sens');
    this.mouseSensitivity = savedSens !== null ? parseFloat(savedSens) : 1.0;

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

    // Camera angles
    this.camYawDeg = 0;       // 0 deg looks along +Z
    this.camPitchDeg = 24;    // degrees above ground
    this.camDistance = 14.0;  // distance to player
    this.isMouseDown = false;
    this.prevMouseX = 0;
    this.prevMouseY = 0;

    this.pulseWaves = [];
    this.lanternEmbers = [];
    this.lastCountdownSec = -1;

    this.initScene();
    this.initEntities();
    this.bindEvents();
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.tickInterval = 1000 / 60;
  }

  setSensitivity(val) {
    this.mouseSensitivity = Math.max(0.2, Math.min(3.0, val));
    localStorage.setItem('dao_den_long_sens', this.mouseSensitivity.toString());
  }

  setVolume(val) {
    this.sound.setVolume(val);
    localStorage.setItem('dao_den_long_vol', val.toString());
  }

  initScene() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    // Bảng màu chuẩn: Trời đêm / sương (#0E1430 / #1B2350)
    this.scene.background = new THREE.Color(0x0e1430);
    this.scene.fog = new THREE.FogExp2(0x1b2350, 0.018);

    this.camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 300);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Ánh sáng môi trường ban đầu
    this.ambientLight = new THREE.AmbientLight(0x2f3d6b, 0.28);
    this.scene.add(this.ambientLight);

    // Ánh trăng dịu mát từ trên cao
    this.moonLight = new THREE.DirectionalLight(0x8fa3b8, 0.85);
    this.moonLight.position.set(30, 60, -30);
    this.moonLight.castShadow = true;
    this.moonLight.shadow.mapSize.width = 1024;
    this.moonLight.shadow.mapSize.height = 1024;
    this.moonLight.shadow.camera.near = 10;
    this.moonLight.shadow.camera.far = 160;
    const d = 45;
    this.moonLight.shadow.camera.left = -d;
    this.moonLight.shadow.camera.right = d;
    this.moonLight.shadow.camera.top = d;
    this.moonLight.shadow.camera.bottom = -d;
    this.moonLight.shadow.bias = -0.001;
    this.scene.add(this.moonLight);

    // Bầu trời ngàn sao lấp lánh (Starfield)
    this.createStarfield();

    // Dựng bản đồ theo Đêm 1, 2, 3
    this.createMapTerrain();
  }

  createStarfield() {
    const starCount = 1200;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 180 + Math.random() * 40;
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 15; // Upper dome
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xfff6c2,
      size: 0.9,
      transparent: true,
      opacity: 0.85
    });
    this.starPoints = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starPoints);
  }

  createMapTerrain() {
    const terrainGroup = new THREE.Group();

    // Biển mây bồng bềnh cuộn trôi: #12384A
    this.cloudLayers = [];
    for (let i = 0; i < 3; i++) {
      const cloudGeo = new THREE.PlaneGeometry(400, 400, 16, 16);
      const cloudMat = new THREE.MeshLambertMaterial({
        color: 0x12384a,
        transparent: true,
        opacity: 0.7 - i * 0.15
      });
      const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
      cloudMesh.rotation.x = -Math.PI / 2;
      cloudMesh.position.y = -12 - i * 4;
      terrainGroup.add(cloudMesh);
      this.cloudLayers.push(cloudMesh);
    }

    // Cỏ: #2F5D50 | Cát/Đá: #C9B48A | Gỗ: #6B4A2F
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x2f5d50,
      roughness: 0.8,
      metalness: 0.1
    });
    const cliffMat = new THREE.MeshStandardMaterial({
      color: 0x1a232f,
      roughness: 0.9,
      metalness: 0.2
    });
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x6b4a2f,
      roughness: 0.7
    });

    if (this.night === 1) {
      // Đêm 1 — Đảo Bến: tròn tâm (0,0,0), bán kính 40m
      const topGeo = new THREE.CylinderGeometry(40, 40.5, 2.5, 64);
      const topMesh = new THREE.Mesh(topGeo, grassMat);
      topMesh.position.y = -1.25;
      topMesh.receiveShadow = true;
      terrainGroup.add(topMesh);

      // Mép đá cổ quanh đảo
      const rimGeo = new THREE.TorusGeometry(40.2, 0.6, 8, 64);
      const rimMat = new THREE.MeshLambertMaterial({ color: 0x3d4b5c });
      const rimMesh = new THREE.Mesh(rimGeo, rimMat);
      rimMesh.rotation.x = Math.PI / 2;
      rimMesh.position.y = 0.05;
      terrainGroup.add(rimMesh);

      const baseGeo = new THREE.CylinderGeometry(40.5, 16, 18, 64);
      const baseMesh = new THREE.Mesh(baseGeo, cliffMat);
      baseMesh.position.y = -11.5;
      terrainGroup.add(baseMesh);

    } else if (this.night === 2) {
      // Đêm 2 — Đảo Cau: 2 đảo tròn R=28m (A: 0,0,0 & B: 70,0,0) + Cầu tre
      for (const cx of [0, 70]) {
        const topGeo = new THREE.CylinderGeometry(28, 28.5, 2.5, 48);
        const topMesh = new THREE.Mesh(topGeo, grassMat);
        topMesh.position.set(cx, -1.25, 0);
        topMesh.receiveShadow = true;
        terrainGroup.add(topMesh);

        const baseGeo = new THREE.CylinderGeometry(28.5, 10, 18, 48);
        const baseMesh = new THREE.Mesh(baseGeo, cliffMat);
        baseMesh.position.set(cx, -11.5, 0);
        terrainGroup.add(baseMesh);
      }

      // Cầu tre: x in [26, 44], z in [-2, 2]
      const bridgeGeo = new THREE.BoxGeometry(18, 0.4, 4);
      const bridgeMesh = new THREE.Mesh(bridgeGeo, woodMat);
      bridgeMesh.position.set(35, -0.2, 0);
      bridgeMesh.receiveShadow = true;
      terrainGroup.add(bridgeMesh);

      // Các thanh dầm tre chống cầu
      for (let bx = 28; bx <= 42; bx += 3.5) {
        const strutGeo = new THREE.CylinderGeometry(0.12, 0.12, 10, 8);
        const strut = new THREE.Mesh(strutGeo, woodMat);
        strut.position.set(bx, -5, 0);
        terrainGroup.add(strut);
      }

      // 2 Bục nhảy: R=1m tại (20,0,18) và (50,0,-18)
      for (const pos of [[20, 0.06, 18], [50, 0.06, -18]]) {
        const padGeo = new THREE.CylinderGeometry(1.0, 1.2, 0.15, 24);
        const padMat = new THREE.MeshStandardMaterial({
          color: 0xf2c14e,
          emissive: 0x8a6020,
          roughness: 0.4
        });
        const padMesh = new THREE.Mesh(padGeo, padMat);
        padMesh.position.set(...pos);
        terrainGroup.add(padMesh);
      }

    } else if (this.night === 3) {
      // Đêm 3 — Đảo Chuông: tròn R=45m, 3 tầng (0m, 3m, 6m)
      // Tầng 0 (Y=0, R=45m)
      const t0Geo = new THREE.CylinderGeometry(45, 45.5, 2.5, 64);
      const t0Mesh = new THREE.Mesh(t0Geo, grassMat);
      t0Mesh.position.y = -1.25;
      t0Mesh.receiveShadow = true;
      terrainGroup.add(t0Mesh);

      // Tầng 1 (Y=3, R in [12, 24] nửa z > 0)
      const t1Geo = new THREE.CylinderGeometry(24, 24, 3, 48, 1, false, 0, Math.PI);
      const t1Mesh = new THREE.Mesh(t1Geo, grassMat);
      t1Mesh.position.y = 1.5;
      t1Mesh.receiveShadow = true;
      terrainGroup.add(t1Mesh);

      // Tầng 2 (Y=6, R=8m)
      const t2Geo = new THREE.CylinderGeometry(8, 8, 3, 32);
      const t2Mesh = new THREE.Mesh(t2Geo, grassMat);
      t2Mesh.position.y = 4.5;
      t2Mesh.receiveShadow = true;
      terrainGroup.add(t2Mesh);

      // Tháp chuông cổ ở tâm tầng 2: hình trụ R=2m, cao 8m
      const towerGeo = new THREE.CylinderGeometry(2, 2.4, 8, 20);
      const towerMat = new THREE.MeshStandardMaterial({ color: 0x5b5f6e, roughness: 0.9 });
      const towerMesh = new THREE.Mesh(towerGeo, towerMat);
      towerMesh.position.set(0, 10, 0);
      towerMesh.castShadow = true;
      terrainGroup.add(towerMesh);

      // Mái chùa chuông
      const roofGeo = new THREE.ConeGeometry(3.5, 2.0, 8);
      const roofMat = new THREE.MeshStandardMaterial({ color: 0xc8102e, roughness: 0.6 });
      const roofMesh = new THREE.Mesh(roofGeo, roofMat);
      roofMesh.position.set(0, 15, 0);
      terrainGroup.add(roofMesh);

      // Bục nhảy tầng 1 tại (0, 3, 13)
      const padGeo = new THREE.CylinderGeometry(1.0, 1.2, 0.15, 24);
      const padMat = new THREE.MeshStandardMaterial({
        color: 0xf2c14e,
        emissive: 0x8a6020,
        roughness: 0.4
      });
      const padMesh = new THREE.Mesh(padGeo, padMat);
      padMesh.position.set(0, 3.08, 13);
      terrainGroup.add(padMesh);
    }

    this.scene.add(terrainGroup);
  }

  initEntities() {
    // 1. Mây (Áo Mây #E8E2D0, Khăn Mây #C8102E, Nón lá #C9B48A)
    this.playerGroup = new THREE.Group();

    // Thân áo Mây
    const bodyGeo = new THREE.CylinderGeometry(0.32, 0.45, 1.1, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe8e2d0, roughness: 0.7 });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.55;
    bodyMesh.castShadow = true;
    this.playerGroup.add(bodyMesh);

    // Khăn quàng đỏ (#C8102E)
    const scarfGeo = new THREE.TorusGeometry(0.34, 0.09, 8, 16);
    const scarfMat = new THREE.MeshStandardMaterial({ color: 0xc8102e, roughness: 0.5 });
    const scarfMesh = new THREE.Mesh(scarfGeo, scarfMat);
    scarfMesh.rotation.x = Math.PI / 2;
    scarfMesh.position.y = 1.05;
    this.playerGroup.add(scarfMesh);

    // Nón lá Việt Nam (#C9B48A)
    const hatGeo = new THREE.ConeGeometry(0.8, 0.35, 24);
    const hatMat = new THREE.MeshStandardMaterial({ color: 0xc9b48a, roughness: 0.8 });
    const hatMesh = new THREE.Mesh(hatGeo, hatMat);
    hatMesh.position.y = 1.38;
    hatMesh.castShadow = true;
    this.playerGroup.add(hatMesh);

    // Đèn bão nhỏ treo bên hông
    const miniLanternGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.22, 8);
    this.miniLanternMat = new THREE.MeshBasicMaterial({ color: 0xffb347 });
    this.miniLanternMesh = new THREE.Mesh(miniLanternGeo, this.miniLanternMat);
    this.miniLanternMesh.position.set(0.38, 0.8, 0.15);
    this.playerGroup.add(this.miniLanternMesh);

    // Ánh sáng ấm từ Mây
    this.playerLight = new THREE.PointLight(0xffb347, 1.2, 8);
    this.playerLight.position.set(0, 1.0, 0);
    this.playerGroup.add(this.playerLight);

    this.scene.add(this.playerGroup);

    // 2. Đèn Lồng Lớn (Traditional Octagonal Lanterns)
    this.lanternMeshes = [];
    this.engine.lanterns.forEach(lanternData => {
      const g = new THREE.Group();
      g.position.set(lanternData.pos[0], lanternData.pos[1], lanternData.pos[2]);

      // Cột gỗ (#6B4A2F)
      const poleGeo = new THREE.CylinderGeometry(0.12, 0.18, 3.4, 12);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 0.8 });
      const poleMesh = new THREE.Mesh(poleGeo, poleMat);
      poleMesh.position.y = 1.7;
      poleMesh.castShadow = true;
      g.add(poleMesh);

      // Khung lồng đèn 8 cạnh
      const frameGeo = new THREE.CylinderGeometry(0.7, 0.55, 1.3, 8);
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x3d2716, roughness: 0.6 });
      const frameMesh = new THREE.Mesh(frameGeo, frameMat);
      frameMesh.position.y = 2.6;
      frameMesh.castShadow = true;
      g.add(frameMesh);

      // Chao đèn lụa phát sáng
      const bulbGeo = new THREE.SphereGeometry(0.48, 16, 16);
      const bulbMat = new THREE.MeshStandardMaterial({
        color: 0x5b5f6e,
        emissive: 0x221105,
        roughness: 0.3
      });
      const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
      bulbMesh.position.y = 2.6;
      g.add(bulbMesh);

      // Vòng sáng hào quang
      const haloGeo = new THREE.SphereGeometry(0.75, 12, 12);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0xffe9b0,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.position.y = 2.6;
      haloMesh.visible = false;
      g.add(haloMesh);

      // Nguồn sáng điểm ấm áp
      const light = new THREE.PointLight(0xffb347, 0.2, 18);
      light.position.set(0, 2.7, 0);
      light.castShadow = true;
      light.shadow.bias = -0.002;
      g.add(light);

      this.scene.add(g);
      this.lanternMeshes.push({
        id: lanternData.id,
        group: g,
        bulb: bulbMesh,
        halo: haloMesh,
        light: light
      });
    });

    // 3. Motes (Đom đóm: lõi #FFF6C2, quầng #FFE58A)
    this.moteMeshMap = new Map();
    this.moteCoreGeo = new THREE.SphereGeometry(0.12, 12, 12);
    this.moteGlowGeo = new THREE.SphereGeometry(0.28, 8, 8);
    this.moteCoreMat = new THREE.MeshBasicMaterial({ color: 0xfff6c2 });
    this.moteGlowMat = new THREE.MeshBasicMaterial({
      color: 0xffe58a,
      transparent: true,
      opacity: 0.35
    });

    // 4. Bóng Mực (thân #120A1A, viền tím #7A3CFF, choáng #3A3450)
    this.shadeMeshMap = new Map();
    this.shadeGeo = new THREE.SphereGeometry(0.68, 16, 16);
    this.shadeMat = new THREE.MeshStandardMaterial({
      color: 0x120a1a,
      emissive: 0x2d1045,
      roughness: 0.5
    });
    this.shadeStunMat = new THREE.MeshStandardMaterial({
      color: 0x3a3450,
      emissive: 0x472e6b,
      roughness: 0.8
    });

    // 5. Gió Lạc (Drifters: dải lụa #8FA3B8)
    this.drifterMeshMap = new Map();
    this.drifterGeo = new THREE.CylinderGeometry(0.18, 0.04, 1.8, 12);
    this.drifterMat = new THREE.MeshStandardMaterial({
      color: 0x8fa3b8,
      emissive: 0x334455,
      roughness: 0.4
    });

    // 6. Bùa Gió (Charms: #C8102E viền #F2C14E)
    this.charmMeshMap = new Map();
    this.charmGeo = new THREE.BoxGeometry(0.6, 0.8, 0.08);
    this.charmMat = new THREE.MeshStandardMaterial({
      color: 0xc8102e,
      emissive: 0x660814,
      roughness: 0.4
    });
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

    // Mouse drag controls for smooth 3D camera look
    this.container.addEventListener('mousedown', e => {
      this.isMouseDown = true;
      this.prevMouseX = e.clientX;
      this.prevMouseY = e.clientY;
      this.sound.init();
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    window.addEventListener('mousemove', e => {
      if (this.isMouseDown) {
        const deltaX = e.clientX - this.prevMouseX;
        const deltaY = e.clientY - this.prevMouseY;
        this.prevMouseX = e.clientX;
        this.prevMouseY = e.clientY;

        // Rotate yaw & pitch
        this.camYawDeg += deltaX * 0.3 * this.mouseSensitivity;
        this.camPitchDeg = Math.max(8, Math.min(65, this.camPitchDeg - deltaY * 0.2 * this.mouseSensitivity));
      }
    });

    // Mouse wheel zoom
    window.addEventListener('wheel', e => {
      this.camDistance = Math.max(7.0, Math.min(24.0, this.camDistance + e.deltaY * 0.015));
    }, { passive: true });

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

    // Movement relative to camera: W moves forward, S moves back, D right, A left
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
    const geo = new THREE.RingGeometry(0.5, 1.2, 36);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffb347,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(this.engine.player.pos[0], this.engine.player.pos[1] + 0.15, this.engine.player.pos[2]);
    this.scene.add(mesh);

    this.pulseWaves.push({ mesh, radius: 1.0, opacity: 0.95 });
  }

  updateVisuals(time) {
    // 1. Player Position & Orientation
    this.playerGroup.position.set(
      this.engine.player.pos[0],
      this.engine.player.pos[1],
      this.engine.player.pos[2]
    );

    // Subtle breathing / running bob
    const isMoving = Math.hypot(this.engine.player.vel[0], this.engine.player.vel[2]) > 0.1;
    if (isMoving && this.engine.player.grounded) {
      this.playerGroup.position.y += Math.abs(Math.sin(time * 0.015)) * 0.08;
    }

    const rad = (this.engine.player.facing_deg * Math.PI) / 180.0;
    this.playerGroup.rotation.y = rad;

    // Mini lantern swings with movement
    if (this.miniLanternMesh) {
      this.miniLanternMesh.rotation.z = Math.sin(time * 0.008) * 0.2;
    }

    // Player personal light glows brighter with carried motes
    this.playerLight.intensity = 1.0 + this.engine.player.carried * 0.25;

    // Ánh sáng môi trường tăng theo tiến độ: cường độ = 0.15 + 0.55 * (đèn sáng / tổng đèn)
    const litCount = this.engine.lanterns.filter(l => l.lit).length;
    const progress = litCount / this.engine.lanterns.length;
    this.ambientLight.intensity = 0.15 + 0.55 * progress;

    // 2. Camera Positioning: Placed behind Mây and looking forward in camera view direction
    const yawRad = (this.camYawDeg * Math.PI) / 180.0;
    const pitchRad = (this.camPitchDeg * Math.PI) / 180.0;
    const dist = this.camDistance;

    // Camera sits behind Mây (opposite to yaw direction)
    const offsetX = -Math.sin(yawRad) * Math.cos(pitchRad) * dist;
    const offsetZ = -Math.cos(yawRad) * Math.cos(pitchRad) * dist;
    const offsetY = Math.sin(pitchRad) * dist + 1.5;

    const targetCamX = this.engine.player.pos[0] + offsetX;
    const targetCamY = this.engine.player.pos[1] + offsetY;
    const targetCamZ = this.engine.player.pos[2] + offsetZ;

    this.camera.position.x += (targetCamX - this.camera.position.x) * 0.12;
    this.camera.position.y += (targetCamY - this.camera.position.y) * 0.12;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.12;

    this.camera.lookAt(
      this.engine.player.pos[0],
      this.engine.player.pos[1] + 1.2,
      this.engine.player.pos[2]
    );

    // 3. Clouds drift slowly
    if (this.cloudLayers) {
      this.cloudLayers.forEach((cl, i) => {
        cl.rotation.z = time * 0.0001 * (i % 2 === 0 ? 1 : -1);
      });
    }

    // 4. Lanterns
    this.engine.lanterns.forEach(lanternData => {
      const found = this.lanternMeshes.find(m => m.id === lanternData.id);
      if (found) {
        if (lanternData.lit) {
          found.bulb.material.color.setHex(0xffb347);
          found.bulb.material.emissive.setHex(0xffaa22);
          found.light.color.setHex(0xffb347);
          found.light.intensity = 3.6 + Math.sin(time * 0.005 + lanternData.id.charCodeAt(1)) * 0.4;
          found.halo.visible = true;
        } else {
          const ratio = lanternData.deposited / this.engine.tuning.lantern_cost;
          found.bulb.material.color.setHex(ratio > 0 ? 0x995511 : 0x5b5f6e);
          found.bulb.material.emissive.setHex(ratio > 0 ? 0x442205 : 0x000000);
          found.light.intensity = 0.2 + ratio * 1.2;
          found.halo.visible = false;
        }
      }
    });

    // 5. Motes (Core + Aura Glow)
    const curMoteIds = new Set(this.engine.motes.map(m => m.id));
    for (const [id, grp] of this.moteMeshMap.entries()) {
      if (!curMoteIds.has(id)) {
        this.scene.remove(grp);
        this.moteMeshMap.delete(id);
      }
    }
    this.engine.motes.forEach(m => {
      let grp = this.moteMeshMap.get(m.id);
      if (!grp) {
        grp = new THREE.Group();
        const core = new THREE.Mesh(this.moteCoreGeo, this.moteCoreMat);
        const glow = new THREE.Mesh(this.moteGlowGeo, this.moteGlowMat);
        grp.add(core);
        grp.add(glow);
        this.scene.add(grp);
        this.moteMeshMap.set(m.id, grp);
      }
      const bob = Math.sin(time * 0.004 + (m.pos[0] + m.pos[2])) * 0.22 + 0.45;
      grp.position.set(m.pos[0], m.pos[1] + bob, m.pos[2]);
    });

    // 6. Shades
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
      mesh.scale.setScalar(s.state === 'stunned' ? 0.85 : 1.0 + Math.sin(time * 0.008) * 0.05);
    });

    // 7. Drifters (Gió Lạc)
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
      mesh.position.set(d.pos[0], d.pos[1] + Math.sin(time * 0.006) * 0.3, d.pos[2]);
      mesh.rotation.z = Math.sin(time * 0.01) * 0.35;
    });

    // 8. Charms (Bùa Gió)
    for (const c of this.engine.charms) {
      let mesh = this.charmMeshMap.get(c.id);
      if (!mesh) {
        mesh = new THREE.Mesh(this.charmGeo, this.charmMat);
        this.scene.add(mesh);
        this.charmMeshMap.set(c.id, mesh);
      }
      mesh.visible = c.available;
      mesh.position.set(c.pos[0], c.pos[1] + 0.6 + Math.sin(time * 0.004) * 0.1, c.pos[2]);
      mesh.rotation.y = time * 0.002;
    }

    // 9. Pulse Waves
    for (let i = this.pulseWaves.length - 1; i >= 0; i--) {
      const pw = this.pulseWaves[i];
      pw.radius += 0.32;
      pw.opacity -= 0.035;
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
