import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { gsap } from "gsap";
import { LEVELS, levelObjects } from "./game-model.mjs";

// Interactive game geometry, generated and warmed once; no downloaded model or texture.
export async function createGameStage(
  host,
  { labelFor, onProgress, onContextLost, reduced = false },
) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.4));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#f3f2fa");
  scene.fog = new THREE.Fog("#f3f2fa", 24, 55);
  const camera = new THREE.OrthographicCamera(-9, 9, 5, -5, 0.1, 70);
  camera.position.set(0, 12, 12);
  camera.lookAt(0, 0, 0);
  const hemi = new THREE.HemisphereLight("#ffffff", "#b1a1db", 3);
  scene.add(hemi);
  const key = new THREE.DirectionalLight("#fff5eb", 3.1);
  key.position.set(-4, 10, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, {
    left: -10,
    right: 10,
    top: 8,
    bottom: -8,
  });
  key.shadow.bias = -0.0005;
  scene.add(key);
  const rim = new THREE.DirectionalLight("#a994ff", 1.2);
  rim.position.set(6, 5, -7);
  scene.add(rim);
  const makeMat = (color) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.07 });
  const materials = {
    purple: makeMat("#3012b5"),
    orange: makeMat("#ff603d"),
    white: makeMat("#ffffff"),
    pale: makeMat("#ddd5f7"),
    green: makeMat("#36b894"),
    ink: makeMat("#202035"),
  };
  const geometry = {
    packet: new RoundedBoxGeometry(0.86, 0.86, 0.86, 3, 0.13),
    band: new THREE.BoxGeometry(0.88, 0.12, 0.88),
    tile: new RoundedBoxGeometry(1.32, 0.2, 1.32, 2, 0.12),
    platform: new RoundedBoxGeometry(16.7, 0.4, 8, 4, 0.3),
    ring: new THREE.TorusGeometry(0.55, 0.055, 8, 48),
    orb: new THREE.SphereGeometry(0.1, 8, 6),
    avatar: new RoundedBoxGeometry(0.76, 0.9, 0.76, 3, 0.2),
    eye: new THREE.SphereGeometry(0.065, 8, 6),
  };
  onProgress(0.45, "Preparando peças, portais e movimentos");
  const board = new THREE.Mesh(geometry.platform, materials.white);
  board.position.y = -0.4;
  board.receiveShadow = true;
  scene.add(board);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.ShadowMaterial({ opacity: 0.13 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.63;
  ground.receiveShadow = true;
  scene.add(ground);
  const accent = new THREE.Mesh(
    new THREE.TorusGeometry(9, 0.018, 5, 96),
    materials.pale,
  );
  accent.rotation.x = -Math.PI / 2;
  accent.scale.z = 0.65;
  accent.position.y = -0.59;
  scene.add(accent);
  const actors = new THREE.Group();
  scene.add(actors);
  const bits = new THREE.InstancedMesh(geometry.orb, materials.orange, 36);
  bits.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(bits);
  const bitData = Array.from({ length: 36 }, (_, i) => ({
    x: 0,
    y: -5,
    z: 0,
    vx: Math.sin(i * 2.4) * 2.4,
    vy: 2 + (i % 5) * 0.35,
    vz: Math.cos(i * 2.4) * 2.4,
    age: 9,
  }));
  const dummy = new THREE.Object3D(),
    project = new THREE.Vector3(),
    raycaster = new THREE.Raycaster(),
    dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.65),
    hit = new THREE.Vector3();
  const objects = new Map(),
    homes = new Map(),
    timelines = new Set(),
    pending = new Set();
  let config,
    state,
    levelIndex = 0,
    selected = null,
    dragged = null,
    disposed = false,
    paused = false,
    frame = 0,
    last = performance.now(),
    elapsed = 0,
    mx = 0,
    qualityTicks = 0,
    qualityStart = performance.now();
  const size = () => {
    const w = host.clientWidth || 1000,
      h = host.clientHeight || 500;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    const view = aspect < 1.3 ? 10.5 : 9.6;
    camera.left = -view;
    camera.right = view;
    camera.top = view / aspect;
    camera.bottom = -view / aspect;
    camera.updateProjectionMatrix();
  };
  const resize = new ResizeObserver(size);
  resize.observe(host);
  size();
  function addPacket(item) {
    const group = new THREE.Group();
    const mat =
      item.type === "ack" || item.fresh ? materials.orange : materials.purple;
    const body = new THREE.Mesh(
      item.type === "player" ? geometry.avatar : geometry.packet,
      mat,
    );
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    if (item.type === "player")
      for (const x of [-0.17, 0.17]) {
        const eye = new THREE.Mesh(geometry.eye, materials.white);
        eye.position.set(x, 0.15, 0.39);
        group.add(eye);
      }
    else {
      const band = new THREE.Mesh(geometry.band, materials.white);
      group.add(band);
      group.rotation.y = 0.15;
    }
    group.position.set(item.x, 0.64, item.z);
    group.userData = { item, baseY: 0.64 };
    actors.add(group);
    objects.set(item.id, group);
    homes.set(item.id, group.position.clone());
    return group;
  }
  function addTarget(item) {
    const group = new THREE.Group();
    group.position.set(item.x, -0.08, item.z);
    group.userData = { item, baseY: -0.08 };
    const tile = new THREE.Mesh(geometry.tile, materials.pale);
    tile.receiveShadow = true;
    group.add(tile);
    const ring = new THREE.Mesh(
      geometry.ring,
      item.live ? materials.orange : materials.purple,
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.14;
    group.add(ring);
    const fill = new THREE.Mesh(geometry.packet, materials.green);
    fill.scale.setScalar(0.65);
    fill.position.y = 0.38;
    fill.visible = !!item.filled;
    fill.castShadow = true;
    group.add(fill);
    group.userData.fill = fill;
    actors.add(group);
    objects.set(item.id, group);
    homes.set(item.id, group.position.clone());
    return group;
  }
  function configure(index, next) {
    // Shared buffers/materials survive phase changes; only the small actor groups change.
    for (const t of timelines) t.kill();
    timelines.clear();
    for (const resolve of pending) resolve(false);
    pending.clear();
    actors.clear();
    objects.clear();
    homes.clear();
    selected = null;
    dragged = null;
    levelIndex = index;
    state = next;
    config = levelObjects(index, next);
    config.tokens.forEach(addPacket);
    config.targets.forEach(addTarget);
    for (const item of config.tokens)
      if (next.done.includes(item.id)) {
        objects.get(item.id).visible = false;
        const dest = config.targets.find(
          (t) => t.number === item.number && !t.filled,
        );
        if (dest) objects.get(dest.id).userData.fill.visible = true;
      }
    if (LEVELS[index].kind === "move") {
      const echo = new THREE.Mesh(geometry.avatar, materials.pale);
      echo.position.set(
        (next.echo || next.player).x,
        0.36,
        (next.echo || next.player).z + 0.35,
      );
      echo.scale.setScalar(0.85);
      echo.castShadow = true;
      actors.add(echo);
      objects.set("echo", echo);
    }
  }
  const pop = (where) => {
    if (reduced) return;
    for (const [i, b] of bitData.entries()) {
      b.x = where.x;
      b.y = where.y;
      b.z = where.z;
      b.age = -i * 0.005;
      b.vy = 2 + (i % 5) * 0.35;
    }
  };
  function timeline(build) {
    return new Promise((resolve) => {
      if (disposed) {
        resolve(false);
        return;
      }
      pending.add(resolve);
      const t = gsap.timeline({
        paused: true,
        onComplete: () => {
          timelines.delete(t);
          pending.delete(resolve);
          resolve(true);
        },
      });
      timelines.add(t);
      build(t);
      if (paused) t.pause();
      else t.play();
    });
  }
  async function animate(visual) {
    if (visual.move) {
      const player = objects.get("player"),
        echo = objects.get("echo");
      await timeline((t) => {
        t.to(player.position, {
          x: visual.player.x,
          z: visual.player.z,
          duration: reduced ? 0.01 : 0.16,
          ease: "power2.out",
        });
        if (echo && !visual.loss)
          t.to(
            echo.position,
            {
              x: visual.player.x,
              z: visual.player.z + 0.35,
              duration: reduced ? 0.01 : 0.16,
            },
            "<",
          );
      });
      return;
    }
    if (visual.deliver) {
      pop(new THREE.Vector3(4, 1, 0));
      return timeline((t) =>
        t.to(board.scale, {
          y: 1.12,
          duration: reduced ? 0.01 : 0.16,
          yoyo: true,
          repeat: 1,
        }),
      );
    }
    const actor = objects.get(visual.id),
      dest = objects.get(visual.target);
    if (!actor || !dest) return;
    const end = dest.position.clone();
    end.y = 0.65;
    await timeline((t) => {
      t.to(actor.position, {
        x: (actor.position.x + end.x) / 2,
        y: visual.loss ? 1 : 1.8,
        z: (actor.position.z + end.z) / 2,
        duration: reduced ? 0.01 : 0.3,
        ease: "power1.out",
      });
      if (visual.loss) {
        t.to(actor.position, { y: -1.8, duration: reduced ? 0.01 : 0.25 });
        t.to(
          actor.scale,
          { x: 0, y: 0, z: 0, duration: reduced ? 0.01 : 0.2 },
          "<",
        );
      } else
        t.to(actor.position, {
          x: end.x,
          y: end.y,
          z: end.z,
          duration: reduced ? 0.01 : 0.3,
          ease: "power2.inOut",
        });
      t.call(() => {
        actor.visible = false;
        if (!visual.loss) {
          dest.userData.fill.visible = true;
          pop(end);
        }
      });
      if (visual.confirm) {
        const ack = new THREE.Mesh(geometry.orb, materials.green);
        ack.scale.setScalar(2.2);
        ack.position.copy(end);
        actors.add(ack);
        const home = homes.get(visual.id);
        t.to(ack.position, {
          x: home.x,
          y: home.y,
          z: home.z,
          duration: reduced ? 0.01 : 0.36,
          ease: "power1.inOut",
        }).call(() => actors.remove(ack));
      }
    });
  }
  function select(id) {
    selected = id;
    for (const [key, obj] of objects)
      if (obj.userData?.item?.type !== "target")
        obj.scale.setScalar(key === id ? 1.1 : 1);
  }
  function drag(id, clientX, clientY) {
    const actor = objects.get(id);
    if (!actor) return;
    dragged = id;
    const rect = host.getBoundingClientRect();
    raycaster.setFromCamera(
      new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        (-(clientY - rect.top) / rect.height) * 2 + 1,
      ),
      camera,
    );
    if (raycaster.ray.intersectPlane(dragPlane, hit)) {
      actor.position.x = Math.max(-7, Math.min(7, hit.x));
      actor.position.z = Math.max(-3.3, Math.min(3.3, hit.z));
      actor.position.y = 0.85;
    }
  }
  function drop(id) {
    const actor = objects.get(id);
    dragged = null;
    if (!actor) return null;
    let nearest = null,
      distance = 1.35;
    for (const dest of config.targets) {
      const d = Math.hypot(
        actor.position.x - dest.x,
        actor.position.z - dest.z,
      );
      if (d < distance) {
        nearest = dest.id;
        distance = d;
      }
    }
    return nearest;
  }
  function snap(id) {
    const obj = objects.get(id),
      home = homes.get(id);
    dragged = null;
    if (obj && home) {
      gsap.killTweensOf(obj.position);
      obj.position.copy(home);
    }
    select(null);
  }
  function render(now) {
    if (disposed || paused) return;
    const dt = Math.min(0.04, (now - last) / 1000);
    last = now;
    elapsed += dt;
    camera.position.x = THREE.MathUtils.lerp(
      camera.position.x,
      reduced ? 0 : mx * 0.45,
      0.03,
    );
    camera.lookAt(0, 0, 0);
    for (const [id, obj] of objects) {
      const item = obj.userData?.item;
      if (!item) continue;
      if (
        item.type !== "target" &&
        item.type !== "player" &&
        obj.visible &&
        !dragged &&
        !timelines.size
      )
        obj.position.y =
          0.64 + (reduced ? 0 : Math.sin(elapsed * 1.5 + item.z) * 0.065);
      const label = labelFor(id);
      if (label) {
        project.copy(obj.position);
        project.y += item.type === "target" ? -0.05 : 0.66;
        project.project(camera);
        label.style.transform = `translate(-50%,-50%) translate(${(project.x * 0.5 + 0.5) * host.clientWidth}px,${(-project.y * 0.5 + 0.5) * host.clientHeight}px)`;
        label.style.visibility = obj.visible ? "visible" : "hidden";
      }
    }
    for (let i = 0; i < bitData.length; i++) {
      const b = bitData[i];
      b.age += dt;
      if (b.age >= 0 && b.age < 0.75) {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.vy -= dt * 6;
        b.z += b.vz * dt;
        dummy.position.set(b.x, b.y, b.z);
        dummy.scale.setScalar(Math.max(0, 1 - b.age / 0.75));
      } else {
        dummy.position.set(0, -9, 0);
        dummy.scale.setScalar(0);
      }
      dummy.updateMatrix();
      bits.setMatrixAt(i, dummy.matrix);
    }
    bits.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
    qualityTicks++;
    if (qualityTicks === 90 && now - qualityStart > 5000) {
      renderer.setPixelRatio(1);
      key.shadow.mapSize.set(512, 512);
      key.shadow.needsUpdate = true;
    }
    frame = requestAnimationFrame(render);
  }
  const move = (e) => {
    const rect = host.getBoundingClientRect();
    mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  };
  host.addEventListener("pointermove", move);
  const lost = (e) => {
    e.preventDefault();
    pause(true);
    onContextLost?.();
  };
  renderer.domElement.addEventListener("webglcontextlost", lost);
  function pause(value) {
    paused = value;
    for (const t of timelines) value ? t.pause() : t.resume();
    cancelAnimationFrame(frame);
    if (!value && !disposed) {
      last = performance.now();
      frame = requestAnimationFrame(render);
    }
  }
  configure(0, { index: 0, done: [], round: 0, player: { x: -4, z: 2 } });
  // Warm all shader/material variants before exposing any playable phase.
  const warm = new THREE.Mesh(geometry.avatar, materials.orange);
  warm.position.set(0, -20, 0);
  scene.add(warm);
  onProgress(0.66, "Preparando iluminação e efeitos");
  if (renderer.compileAsync) await renderer.compileAsync(scene, camera);
  else renderer.compile(scene, camera);
  renderer.render(scene, camera);
  scene.remove(warm);
  onProgress(0.94, "Finalizando o ambiente");
  await new Promise((resolve) => requestAnimationFrame(resolve));
  if (!disposed) {
    last = performance.now();
    frame = requestAnimationFrame(render);
  }
  return {
    configure,
    animate,
    select,
    drag,
    drop,
    snap,
    pause,
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      host.removeEventListener("pointermove", move);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      for (const t of timelines) t.kill();
      for (const resolve of pending) resolve(false);
      pending.clear();
      for (const g of Object.values(geometry)) g.dispose();
      for (const m of Object.values(materials)) m.dispose();
      accent.geometry.dispose();
      ground.geometry.dispose();
      ground.material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
