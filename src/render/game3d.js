import { IslandEngine, distXZ } from '../core/engine.js';
import { SoundFX } from './audio.js';

/* global THREE */

export class Game3D {
  constructor(container) {
    this.container = container;
    this.sound = new SoundFX();
    this.engine = new IslandEngine({ seed: Math.floor(Math.random() * 10000) });

    this.keys = {
      KeyW: false,
      KeyS: false,
      KeyA: false,
      KeyD: false,
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      Space: false,
      KeyE: false,
      KeyQ: false,
      KeyF: false
    };

    this.prevInput = { interact: false, pulse: false };
    this.camYawDeg = 0;
    this.pulseWaves = [];

    this.initScene();
    this.initEntities();
    this.bindEvents();
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.tickInterval = 1000 / 60; // 60 Hz
  }

  initScene() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0c1a);
    this.scene.fog = new THREE.FogExp2(0x0e1124, 0.025);

    this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 200);
    this.camera.position.set(0, 10, 16);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // Ambient night moonlight
    this.ambientLight = new THREE.AmbientLight(0x2a3558, 0.7);
    this.scene.add(this.ambientLight);

    // Overhead directional moonlight
    const dirLight = new THREE.DirectionalLight(0x6e88c7, 0.8);
    dirLight.position.set(20, 40, 20);
    this.scene.add(dirLight);

    // Build the round island: Đảo Bến (radius 30m)
    this.createIsland();
  }

  createIsland() {
    const islandGroup = new THREE.Group();

    // Top grassy surface
    const topGeo = new THREE.CylinderGeometry(30, 30.5, 2, 48);
    const topMat = new THREE.MeshLambertMaterial({ color: 0x1d3a2e });
    const topMesh = new THREE.Mesh(topGeo, topMat);
    topMesh.position.y = -1;
    islandGroup.add(topMesh);

    // Island base cliff / rock
    const baseGeo = new THREE.CylinderGeometry(30.5, 12, 14, 48);
    const baseMat = new THREE.MeshLambertMaterial({ color: 0x131a24 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -9;
    islandGroup.add(baseMesh);

    // Cloud sea layer below island
    const cloudGeo = new THREE.PlaneGeometry(300, 300);
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0x090d1f,
      transparent: true,
      opacity: 0.8
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    cloudMesh.rotation.x = -Math.PI / 2;
    cloudMesh.position.y = -14;
    islandGroup.add(cloudMesh);

    // Central ancient stone seal
    const sealGeo = new THREE.CylinderGeometry(3, 3, 0.1, 24);
    const sealMat = new THREE.MeshLambertMaterial({ color: 0x2e3c4e });
    const sealMesh = new THREE.Mesh(sealGeo, sealMat);
    sealMesh.position.y = 0.05;
    islandGroup.add(sealMesh);

    this.scene.add(islandGroup);
  }

  initEntities() {
    // 1. Player (Mây)
    this.playerGroup = new THREE.Group();

    // Body
    const bodyGeo = new THREE.CapsuleGeometry
      ? new THREE.CapsuleGeometry(0.35, 0.7, 8, 16)
      : new THREE.CylinderGeometry(0.35, 0.35, 1.2, 12);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x4a78a6 });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.7;
    this.playerGroup.add(bodyMesh);

    // Conical hat (Nón Lá)
    const hatGeo = new THREE.ConeGeometry(0.7, 0.35, 20);
    const hatMat = new THREE.MeshLambertMaterial({ color: 0xbf9b60 });
    const hatMesh = new THREE.Mesh(hatGeo, hatMat);
    hatMesh.position.y = 1.45;
    this.playerGroup.add(hatMesh);

    // Small hanging lantern on Mây's staff / hat
    const miniLanternGeo = new THREE.SphereGeometry(0.12, 10, 10);
    this.miniLanternMat = new THREE.MeshBasicMaterial({ color: 0xffaa33 });
    const miniLanternMesh = new THREE.Mesh(miniLanternGeo, this.miniLanternMat);
    miniLanternMesh.position.set(0.4, 1.1, 0.2);
    this.playerGroup.add(miniLanternMesh);

    // Player personal warm light
    this.playerLight = new THREE.PointLight(0xff9922, 1.2, 7);
    this.playerLight.position.set(0, 1.2, 0);
    this.playerGroup.add(this.playerLight);

    this.scene.add(this.playerGroup);

    // 2. 5 Large Lanterns
    this.lanternMeshes = [];
    this.lanternLights = [];

    this.engine.lanterns.forEach(lanternData => {
      const lanternGroup = new THREE.Group();
      lanternGroup.position.set(lanternData.pos[0], 0, lanternData.pos[2]);

      // Wooden pole
      const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 3.2, 12);
      const poleMat = new THREE.MeshLambertMaterial({ color: 0x3d2716 });
      const poleMesh = new THREE.Mesh(poleGeo, poleMat);
      poleMesh.position.y = 1.6;
      lanternGroup.add(poleMesh);

      // Large Lantern Sphere / Octagon
      const cageGeo = new THREE.CylinderGeometry(0.7, 0.6, 1.2, 8);
      const cageMat = new THREE.MeshLambertMaterial({
        color: 0x221a14,
        wireframe: false
      });
      const cageMesh = new THREE.Mesh(cageGeo, cageMat);
      cageMesh.position.y = 2.4;
      lanternGroup.add(cageMesh);

      // Inner lantern light bulb
      const bulbGeo = new THREE.SphereGeometry(0.45, 16, 16);
      const bulbMat = new THREE.MeshBasicMaterial({
        color: lanternData.lit ? 0xff9900 : 0x221105
      });
      const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
      bulbMesh.position.y = 2.4;
      lanternGroup.add(bulbMesh);

      // Point Light
      const pLight = new THREE.PointLight(0xff9922, lanternData.lit ? 3.5 : 0.2, 16);
      pLight.position.set(0, 2.5, 0);
      lanternGroup.add(pLight);

      this.scene.add(lanternGroup);
      this.lanternMeshes.push({ id: lanternData.id, group: lanternGroup, bulb: bulbMesh, light: pLight });
    });

    // 3. Motes (Đom đóm)
    this.moteMeshMap = new Map();
    this.moteGeo = new THREE.SphereGeometry(0.15, 10, 10);
    this.moteMat = new THREE.MeshBasicMaterial({ color: 0xffea55 });

    // 4. Shades (Bóng Mực)
    this.shadeMeshMap = new Map();
    this.shadeGeo = new THREE.SphereGeometry(0.65, 14, 14);
    this.shadeMat = new THREE.MeshLambertMaterial({ color: 0x160524 });
    this.shadeStunMat = new THREE.MeshLambertMaterial({ color: 0x472e6b });
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

    const interact = Boolean(this.keys.KeyE);
    const pulse = Boolean(this.keys.KeyQ || this.keys.KeyF);

    return {
      move: [rawX, rawZ],
      cam_yaw_deg: this.camYawDeg,
      interact: interact,
      pulse: pulse
    };
  }

  updateEngine() {
    const input = this.gatherInput();
    this.engine.setInput(input);
    const events = this.engine.step();

    // Trigger visual and audio effects from events
    for (const ev of events) {
      if (ev.name === 'mote_picked') {
        this.sound.playMoteChime();
      } else if (ev.name === 'pulse') {
        this.sound.playPulseSound();
        this.triggerPulseWave();
      } else if (ev.name === 'lantern_lit') {
        this.sound.playLanternLitSound();
      } else if (ev.name === 'player_hit') {
        this.sound.playHitSound();
      }
    }

    this.prevInput = { interact: input.interact, pulse: input.pulse };
  }

  triggerPulseWave() {
    const geo = new THREE.RingGeometry(0.5, 1.0, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffaa22,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(this.engine.player.pos[0], 0.1, this.engine.player.pos[2]);
    this.scene.add(mesh);

    this.pulseWaves.push({ mesh, radius: 1.0, opacity: 0.9 });
  }

  updateVisuals(time) {
    // 1. Update Player Position & Rotation
    this.playerGroup.position.set(
      this.engine.player.pos[0],
      this.engine.player.pos[1],
      this.engine.player.pos[2]
    );

    // Make player face movement direction
    const [rawX, rawZ] = this.engine.currentInput.move;
    if (rawX !== 0 || rawZ !== 0) {
      const angle = Math.atan2(rawX, rawZ);
      this.playerGroup.rotation.y = angle;
    }

    // Flicker mini lantern
    const flicker = 1.0 + Math.sin(time * 0.01) * 0.2;
    this.playerLight.intensity = (1.0 + this.engine.player.carried * 0.4) * flicker;

    // 2. Camera follow (smooth 3rd-person)
    const targetCamX = this.engine.player.pos[0];
    const targetCamZ = this.engine.player.pos[2] + 12;
    this.camera.position.x += (targetCamX - this.camera.position.x) * 0.08;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.08;
    this.camera.position.y = 9;
    this.camera.lookAt(this.engine.player.pos[0], 1.2, this.engine.player.pos[2]);

    // 3. Update Lanterns
    this.engine.lanterns.forEach(lanternData => {
      const found = this.lanternMeshes.find(m => m.id === lanternData.id);
      if (found) {
        if (lanternData.lit) {
          found.bulb.material.color.setHex(0xffaa22);
          found.light.color.setHex(0xff9911);
          found.light.intensity = 3.5 + Math.sin(time * 0.005 + lanternData.id.charCodeAt(1)) * 0.4;
        } else {
          // Glow partially based on deposited amount
          const progress = lanternData.deposited / this.engine.tuning.lantern_cost;
          found.bulb.material.color.setHex(progress > 0 ? 0x774411 : 0x221105);
          found.light.intensity = 0.2 + progress * 1.0;
        }
      }
    });

    // 4. Update Motes (Đom đóm)
    const currentMoteIds = new Set(this.engine.motes.map(m => m.id));
    // Remove picked motes
    for (const [id, mesh] of this.moteMeshMap.entries()) {
      if (!currentMoteIds.has(id)) {
        this.scene.remove(mesh);
        this.moteMeshMap.delete(id);
      }
    }
    // Add/update active motes
    this.engine.motes.forEach(moteData => {
      let mesh = this.moteMeshMap.get(moteData.id);
      if (!mesh) {
        mesh = new THREE.Mesh(this.moteGeo, this.moteMat);
        this.scene.add(mesh);
        this.moteMeshMap.set(moteData.id, mesh);
      }
      const bobbing = Math.sin(time * 0.004 + Number(moteData.id.replace('M', ''))) * 0.3 + 0.6;
      mesh.position.set(moteData.pos[0], bobbing, moteData.pos[2]);
    });

    // 5. Update Shades (Bóng Mực)
    const currentShadeIds = new Set(this.engine.shades.map(s => s.id));
    for (const [id, mesh] of this.shadeMeshMap.entries()) {
      if (!currentShadeIds.has(id)) {
        this.scene.remove(mesh);
        this.shadeMeshMap.delete(id);
      }
    }
    this.engine.shades.forEach(shadeData => {
      let mesh = this.shadeMeshMap.get(shadeData.id);
      if (!mesh) {
        mesh = new THREE.Mesh(this.shadeGeo, this.shadeMat);
        this.scene.add(mesh);
        this.shadeMeshMap.set(shadeData.id, mesh);
      }
      mesh.position.set(shadeData.pos[0], 0.7, shadeData.pos[2]);
      if (shadeData.state === 'stunned') {
        mesh.material = this.shadeStunMat;
        mesh.scale.set(0.8, 0.8, 0.8);
      } else {
        mesh.material = this.shadeMat;
        mesh.scale.set(1.0, 1.0, 1.0);
      }
    });

    // 6. Update Pulse Waves
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

  restart() {
    // Reset engine
    this.engine = new IslandEngine({ seed: Math.floor(Math.random() * 10000) });
    // Reset visual lights
    this.engine.lanterns.forEach(lanternData => {
      const found = this.lanternMeshes.find(m => m.id === lanternData.id);
      if (found) {
        found.bulb.material.color.setHex(0x221105);
        found.light.color.setHex(0xff9922);
        found.light.intensity = 0.2;
      }
    });
  }
}
