import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const sceneHost = document.getElementById('scene');
const speedControl = document.getElementById('speedControl');
const starControl = document.getElementById('starControl');
const distanceValue = document.getElementById('distanceValue');
const speedValue = document.getElementById('speedValue');
const starValue = document.getElementById('starValue');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(sceneHost.clientWidth, sceneHost.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
sceneHost.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, sceneHost.clientWidth / sceneHost.clientHeight, 0.1, 1000);
camera.position.set(0, 9, 30);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.04;
controls.minDistance = 2.45;
controls.maxDistance = 70;
controls.enablePan = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.24;

const earthGroup = new THREE.Group();
earthGroup.rotation.z = -0.18;
scene.add(earthGroup);
const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg');
const normalTexture = textureLoader.load('https://threejs.org/examples/textures/planets/earth_normal_2048.jpg');
const specularTexture = textureLoader.load('https://threejs.org/examples/textures/planets/earth_specular_2048.jpg');
const cloudTexture = textureLoader.load('https://threejs.org/examples/textures/planets/earth_clouds_1024.png');
earthTexture.colorSpace = THREE.SRGBColorSpace;
const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 96), new THREE.MeshPhongMaterial({ map: earthTexture, normalMap: normalTexture, normalScale: new THREE.Vector2(0.65, 0.65), specularMap: specularTexture, specular: new THREE.Color(0x5f7382), shininess: 16 }));
earthGroup.add(earth);
const clouds = new THREE.Mesh(new THREE.SphereGeometry(1.012, 96, 96), new THREE.MeshPhongMaterial({ map: cloudTexture, transparent: true, opacity: 0.68, depthWrite: false }));
earthGroup.add(clouds);
const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.065, 96, 96), new THREE.ShaderMaterial({ transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, uniforms: { glowColor: { value: new THREE.Color(0x45a9ff) } }, vertexShader: 'varying vec3 vNormal; void main(){vNormal=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}', fragmentShader: 'varying vec3 vNormal; void main(){float intensity=pow(0.72-dot(vNormal,vec3(0.0,0.0,1.0)),2.2); gl_FragColor=vec4(0.16,0.57,1.0,intensity*0.72);}' }));
earthGroup.add(atmosphere);
const cityGroup = new THREE.Group();
earthGroup.add(cityGroup);
const buildingMaterials = [
  new THREE.MeshStandardMaterial({ color: 0x8799a0, roughness: 0.82 }),
  new THREE.MeshStandardMaterial({ color: 0xc28d62, roughness: 0.78 }),
  new THREE.MeshStandardMaterial({ color: 0x65777f, roughness: 0.86 })
];
const windowMaterial = new THREE.MeshBasicMaterial({ color: 0xffc979, transparent: true, opacity: 0.78 });
const buildingGeometry = new THREE.BoxGeometry(0.012, 1, 0.012);

function addCity(name, latitude, longitude, width, depth) {
  const centerLat = THREE.MathUtils.degToRad(latitude);
  const centerLon = THREE.MathUtils.degToRad(longitude);
  for (let row = 0; row < depth; row += 1) {
    for (let column = 0; column < width; column += 1) {
      const lat = centerLat + (row - depth / 2) * 0.009;
      const lon = centerLon + (column - width / 2) * 0.012;
      const normal = new THREE.Vector3(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)).normalize();
      const height = 0.018 + Math.random() * 0.055;
      const building = new THREE.Mesh(buildingGeometry, buildingMaterials[Math.floor(Math.random() * buildingMaterials.length)]);
      building.scale.set(0.7 + Math.random() * 1.8, height, 0.7 + Math.random() * 1.8);
      building.position.copy(normal).multiplyScalar(1.012 + height / 2);
      building.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      cityGroup.add(building);
      if (Math.random() > 0.82) {
        const window = new THREE.Mesh(new THREE.BoxGeometry(0.003, height * 0.22, 0.003), windowMaterial);
        window.position.copy(normal).multiplyScalar(1.014 + height * 0.58);
        window.quaternion.copy(building.quaternion);
        cityGroup.add(window);
      }
    }
  }
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 320;
  labelCanvas.height = 64;
  const labelContext = labelCanvas.getContext('2d');
  labelContext.fillStyle = '#fff0df';
  labelContext.font = '500 26px DM Mono';
  labelContext.fillText(name.toUpperCase(), 8, 38);
  const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(labelCanvas), transparent: true, depthTest: true }));
  const labelNormal = new THREE.Vector3(Math.cos(centerLat) * Math.sin(centerLon), Math.sin(centerLat), Math.cos(centerLat) * Math.cos(centerLon)).normalize();
  label.position.copy(labelNormal).multiplyScalar(1.105);
  label.scale.set(0.52, 0.105, 1);
  cityGroup.add(label);
}

[
  ['Delhi', 28.6, 77.2, 18, 12], ['New York', 40.7, -74, 20, 13], ['London', 51.5, -0.1, 18, 11], ['Tokyo', 35.7, 139.7, 22, 13],
  ['Sao Paulo', -23.5, -46.6, 20, 12], ['Singapore', 1.3, 103.8, 18, 10], ['Shanghai', 31.2, 121.4, 22, 13], ['Dubai', 25.2, 55.3, 16, 10],
  ['Mexico City', 19.4, -99.1, 18, 12], ['Los Angeles', 34, -118.2, 18, 11], ['Paris', 48.8, 2.3, 16, 10], ['Sydney', -33.9, 151.2, 16, 10]
].forEach(([name, latitude, longitude, width, depth]) => addCity(name, latitude, longitude, width, depth));
cityGroup.visible = false;

const starPositions = new Float32Array(16000 * 3);
for (let index = 0; index < starPositions.length; index += 3) {
  const radius = 55 + Math.random() * 95;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  starPositions[index] = radius * Math.sin(phi) * Math.cos(theta);
  starPositions[index + 1] = radius * Math.cos(phi);
  starPositions[index + 2] = radius * Math.sin(phi) * Math.sin(theta);
}
const starsGeometry = new THREE.BufferGeometry();
starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: 0xd8e8ff, size: 0.12, sizeAttenuation: true, transparent: true, opacity: 0.82 }));
scene.add(stars);
const galaxy = new THREE.Mesh(new THREE.PlaneGeometry(150, 35), new THREE.MeshBasicMaterial({ color: 0x3e5e87, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
galaxy.rotation.set(0.55, -0.2, -0.28);
scene.add(galaxy);
scene.add(new THREE.AmbientLight(0x35506e, 0.26));
const sun = new THREE.DirectionalLight(0xfff2dc, 2.6);
sun.position.set(-3, 1.8, 4);
scene.add(sun);
const grid = new THREE.Mesh(new THREE.SphereGeometry(1.09, 32, 16), new THREE.MeshBasicMaterial({ color: 0x73b7e8, wireframe: true, transparent: true, opacity: 0.055 }));
earthGroup.add(grid);
earthGroup.position.x = 5.3;

const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(1.35, 64, 64), new THREE.MeshBasicMaterial({ color: 0xffb13b }));
scene.add(sunMesh);
const sunGlow = new THREE.Mesh(new THREE.SphereGeometry(1.7, 48, 48), new THREE.MeshBasicMaterial({ color: 0xff8b24, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending }));
scene.add(sunGlow);
const pointSun = new THREE.PointLight(0xffd6a0, 5, 100);
scene.add(pointSun);

function addOrbit(radius) {
  const points = [];
  for (let index = 0; index <= 128; index += 1) {
    const angle = (index / 128) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
  }
  const orbit = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0x8da9b6, transparent: true, opacity: 0.18 }));
  scene.add(orbit);
}

function addMoon(parent, radius, distance, color, speed) {
  const moon = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 24), new THREE.MeshStandardMaterial({ color, roughness: 0.9 }));
  const orbit = new THREE.Group();
  orbit.add(moon);
  moon.position.x = distance;
  parent.add(orbit);
  return { orbit, speed };
}

function addPlanet(name, radius, orbitRadius, color, speed, tilt = 0) {
  addOrbit(orbitRadius);
  const planet = new THREE.Mesh(new THREE.SphereGeometry(radius, 40, 40), new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0.03 }));
  planet.rotation.z = tilt;
  scene.add(planet);
  return { name, planet, orbitRadius, angle: Math.random() * Math.PI * 2, speed, moons: [] };
}

const planets = [
  addPlanet('Mercury', 0.18, 2.3, 0xa99581, 0.020),
  addPlanet('Venus', 0.30, 3.4, 0xd8a36f, 0.015, 0.04),
  { name: 'Earth', planet: earthGroup, orbitRadius: 5.3, angle: 0, speed: 0.010, moons: [] },
  addPlanet('Mars', 0.28, 7.1, 0xb86148, 0.008, 0.10),
  addPlanet('Jupiter', 0.78, 9.7, 0xc9986d, 0.005),
  addPlanet('Saturn', 0.67, 12.8, 0xd3b68e, 0.003, 0.10),
  addPlanet('Uranus', 0.48, 15.3, 0x79c7cc, 0.002),
  addPlanet('Neptune', 0.46, 17.8, 0x416fc0, 0.0015),
  addPlanet('Pluto', 0.14, 21, 0xbaa58e, 0.0008, 0.30)
];
const saturn = planets.find((planet) => planet.name === 'Saturn').planet;
const saturnRing = new THREE.Mesh(new THREE.RingGeometry(0.82, 1.3, 64), new THREE.MeshBasicMaterial({ color: 0xd0b48d, transparent: true, opacity: 0.65, side: THREE.DoubleSide }));
saturnRing.rotation.x = Math.PI / 2.4;
saturn.add(saturnRing);
const earthPlanet = planets.find((planet) => planet.name === 'Earth');
earthPlanet.moons.push(addMoon(earthGroup, 0.22, 1.55, 0xb8b7b1, 0.035));
const earthMoonOrbit = earthPlanet.moons[0].orbit;
planets.find((planet) => planet.name === 'Mars').moons.push(addMoon(planets.find((planet) => planet.name === 'Mars').planet, 0.08, 0.55, 0xa99e96, 0.05), addMoon(planets.find((planet) => planet.name === 'Mars').planet, 0.055, 0.75, 0x827a77, 0.035));
const jupiter = planets.find((planet) => planet.name === 'Jupiter');
jupiter.moons.push(addMoon(jupiter.planet, 0.12, 1.1, 0xd8c8a2, 0.034), addMoon(jupiter.planet, 0.11, 1.45, 0xb8c4bf, 0.025), addMoon(jupiter.planet, 0.16, 1.82, 0xd4c09e, 0.019), addMoon(jupiter.planet, 0.14, 2.2, 0xc0b08e, 0.013));
planets.find((planet) => planet.name === 'Saturn').moons.push(addMoon(saturn, 0.13, 1.65, 0xd0b984, 0.016));
planets.find((planet) => planet.name === 'Neptune').moons.push(addMoon(planets.find((planet) => planet.name === 'Neptune').planet, 0.14, 1.2, 0xaeb4c1, 0.012));
const asteroidPositions = new Float32Array(1800 * 3);
for (let index = 0; index < asteroidPositions.length; index += 3) {
  const radius = 8.0 + Math.random() * 1.2;
  const angle = Math.random() * Math.PI * 2;
  asteroidPositions[index] = Math.cos(angle) * radius;
  asteroidPositions[index + 1] = (Math.random() - 0.5) * 0.12;
  asteroidPositions[index + 2] = Math.sin(angle) * radius;
}
const asteroidGeometry = new THREE.BufferGeometry();
asteroidGeometry.setAttribute('position', new THREE.BufferAttribute(asteroidPositions, 3));
const asteroids = new THREE.Points(asteroidGeometry, new THREE.PointsMaterial({ color: 0x987f6b, size: 0.035, transparent: true, opacity: 0.8 }));
scene.add(asteroids);
const comet = addPlanet('Comet', 0.08, 24, 0xcde8ff, 0.0005);
const cometTail = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.8, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0x9ddcff, transparent: true, opacity: 0.32, side: THREE.DoubleSide }));
cometTail.rotation.z = -Math.PI / 2;
comet.planet.add(cometTail);
let surfaceMode = false;

function updateDistance() {
  distanceValue.textContent = `${(30 / camera.position.distanceTo(controls.target)).toFixed(2)}×`;
}
speedControl.addEventListener('input', () => {
  controls.autoRotateSpeed = Number(speedControl.value) * 0.7;
  speedValue.textContent = `${Number(speedControl.value).toFixed(2)}×`;
});
starControl.addEventListener('input', () => {
  const labels = ['LOW', 'MED', 'HIGH'];
  stars.material.opacity = 0.32 + Number(starControl.value) * 0.25;
  starValue.textContent = labels[Number(starControl.value)];
});
controls.addEventListener('change', updateDistance);
document.getElementById('cloudToggle').addEventListener('click', (event) => {
  const button = event.currentTarget;
  button.classList.toggle('is-on');
  button.setAttribute('aria-pressed', button.classList.contains('is-on'));
  clouds.visible = button.classList.contains('is-on');
});
document.getElementById('gridToggle').addEventListener('click', (event) => {
  const button = event.currentTarget;
  button.classList.toggle('is-on');
  button.setAttribute('aria-pressed', button.classList.contains('is-on'));
  grid.visible = button.classList.contains('is-on');
});
document.getElementById('resetButton').addEventListener('click', () => {
  surfaceMode = false;
  document.body.classList.remove('surface-mode');
  clouds.material.opacity = 0.68;
  cityGroup.visible = false;
  controls.minDistance = 2.45;
  earthMoonOrbit.visible = true;
  planets.forEach((body) => { body.planet.visible = true; });
  sunMesh.visible = true;
  sunGlow.visible = true;
  asteroids.visible = true;
  document.getElementById('surfaceButton').textContent = 'Explore cities & homes ⌖';
  controls.autoRotate = true;
  camera.position.set(0, 9, 30);
  controls.target.set(0, 0, 0);
  controls.update();
  updateDistance();
});
document.getElementById('surfaceButton').addEventListener('click', (event) => {
  surfaceMode = !surfaceMode;
  document.body.classList.toggle('surface-mode', surfaceMode);
  cityGroup.visible = surfaceMode;
  earthMoonOrbit.visible = !surfaceMode;
  planets.forEach((body) => { if (body.name !== 'Earth') body.planet.visible = !surfaceMode; });
  sunMesh.visible = !surfaceMode;
  sunGlow.visible = !surfaceMode;
  asteroids.visible = !surfaceMode;
  controls.autoRotate = !surfaceMode;
  if (surfaceMode) {
    earthPlanet.angle = 0;
    earthGroup.position.set(5.3, 0, 0);
    controls.minDistance = 1.18;
    clouds.material.opacity = 0.16;
    const londonLatitude = THREE.MathUtils.degToRad(51.5);
    const londonLongitude = THREE.MathUtils.degToRad(-0.1);
    const londonNormal = new THREE.Vector3(Math.cos(londonLatitude) * Math.sin(londonLongitude), Math.sin(londonLatitude), Math.cos(londonLatitude) * Math.cos(londonLongitude));
    camera.position.copy(earthGroup.position).add(londonNormal.multiplyScalar(1.72));
    controls.target.set(5.3, 0, 0);
    event.currentTarget.innerHTML = 'Return to solar system <span>↗</span>';
  } else {
    controls.minDistance = 2.45;
    clouds.material.opacity = 0.68;
    camera.position.set(0, 9, 30);
    controls.target.set(0, 0, 0);
    event.currentTarget.innerHTML = 'Explore cities &amp; homes <span>⌖</span>';
  }
  controls.update();
  updateDistance();
});
const aboutModal = document.getElementById('aboutModal');
document.getElementById('aboutButton').addEventListener('click', () => { aboutModal.hidden = false; });
document.getElementById('closeAbout').addEventListener('click', () => { aboutModal.hidden = true; });
aboutModal.addEventListener('click', (event) => { if (event.target === aboutModal) aboutModal.hidden = true; });

function animate() {
  requestAnimationFrame(animate);
  const simulationSpeed = Number(speedControl.value);
  earth.rotation.y += simulationSpeed * 0.0008;
  clouds.rotation.y += Number(speedControl.value) * 0.00105;
  planets.forEach((body) => {
    if (body.name !== 'Earth') {
      body.angle += body.speed * simulationSpeed;
      body.planet.position.set(Math.cos(body.angle) * body.orbitRadius, 0, Math.sin(body.angle) * body.orbitRadius);
      body.planet.rotation.y += simulationSpeed * 0.002;
    } else if (!surfaceMode) {
      body.angle += body.speed * simulationSpeed;
      body.planet.position.set(Math.cos(body.angle) * body.orbitRadius, 0, Math.sin(body.angle) * body.orbitRadius);
    }
    body.moons.forEach((moon) => { moon.orbit.rotation.y += moon.speed * simulationSpeed; });
  });
  sunMesh.rotation.y += simulationSpeed * 0.0007;
  sunGlow.scale.setScalar(1 + Math.sin(Date.now() * 0.0012) * 0.025);
  stars.rotation.y += 0.000025;
  controls.update();
  renderer.render(scene, camera);
}
window.addEventListener('resize', () => {
  const width = sceneHost.clientWidth;
  const height = sceneHost.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});
updateDistance();
animate();
