import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';

// Loader
const loadingManager = new THREE.LoadingManager(() => {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;

    gsap.to(preloader, {
        opacity: 0,
        duration: 1,
        onComplete: () => {
            preloader.style.display = 'none';
        }
    });
});

// Scene & Camera setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf6f0e8);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 8);
scene.add(camera);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.8;

const app = document.getElementById('app');
if (app) {
    app.appendChild(renderer.domElement);
}

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
};

// Responsive design
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
});

// Light setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Load static SVG background
const gltfLoader = new GLTFLoader(loadingManager);
const textureLoader = new THREE.TextureLoader(loadingManager);
textureLoader.load('/environment/background.svg', (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    scene.background = texture;
});

// Load model
let icecreamModel;
gltfLoader.load('/models/Ice Cream.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(1.55, 1.55, 1.55);
    model.position.set(0, -1.1, 0);

    model.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    icecreamModel = model;
    scene.add(model);
});

function moveCamera(pos) {
    gsap.to(camera.position, {
        x: pos.x,
        y: pos.y,
        z: pos.z,
        duration: 0.6,
        ease: 'power2.out',
        onUpdate: () => controls.update()
    });
}

const cameraPos = {
    default: { x: 0, y: 2, z: 8 },
    name: { x: 0, y: 1.4, z: 4 },
    flavor: { x: 0.2, y: 1.2, z: 3.2 },
};

// Simple UI hooks
const nameInput = document.getElementById('nameInput');
const addressInput = document.getElementById('addressInput');
const flavorSelect = document.getElementById('flavorSelect');
const toppingsSelect = document.getElementById('toppingsSelect');
const sauceSelect = document.getElementById('sauceSelect');
const containerSelect = document.getElementById('containerSelect');
const submitButton = document.getElementById('submit-order');
const feedback = document.getElementById('confirmationMessage');
const priceEl = document.getElementById('price');

const flavorColors = {
    vanille: 0xf4e5c3,
    chocolate: 0x5b3a29,
    strawberry: 0xf08aa3,
    'cookie-dough': 0xd8b48a,
    caramel: 0xc9894b,
};

const containerHeights = {
    cone: -1.15,
    cup: -1.0,
};

function updatePrice() {
    let total = 0;
    const toppingsCount = toppingsSelect ? toppingsSelect.selectedOptions.length : 0;

    if (flavorSelect && flavorSelect.value) total += 4.5;
    if (containerSelect && containerSelect.value === 'cone') total += 0.75;
    if (containerSelect && containerSelect.value === 'cup') total += 0.5;
    if (sauceSelect && sauceSelect.value) total += 0.5;
    total += toppingsCount * 0.4;

    if (priceEl) {
        priceEl.textContent = `€ ${total.toFixed(2).replace('.', ',')}`;
    }
}

function updateModelAppearance() {
    if (!icecreamModel || !flavorSelect) return;

    const flavor = flavorSelect.value;
    const color = flavorColors[flavor];

    icecreamModel.traverse((child) => {
        if (!child.isMesh || !child.material || !color) return;
        if (child.name && child.name.toLowerCase().includes('ice')) {
            child.material = child.material.clone();
            child.material.color = new THREE.Color(color);
        }
    });
}

function updateContainer() {
    if (!icecreamModel || !containerSelect) return;
    icecreamModel.position.y = containerHeights[containerSelect.value] ?? -1.1;
}

function updateConfirmation() {
    if (!feedback) return;

    const nameValue = nameInput ? nameInput.value.trim() : '';
    const flavorValue = flavorSelect ? flavorSelect.options[flavorSelect.selectedIndex]?.textContent || '' : '';
    const containerValue = containerSelect ? containerSelect.options[containerSelect.selectedIndex]?.textContent || '' : '';

    if (!nameValue || !addressInput?.value.trim()) {
        feedback.textContent = 'Vul je naam en adres in om je bestelling te plaatsen.';
        return;
    }

    feedback.textContent = `${nameValue}, jouw ${flavorValue.toLowerCase()} in een ${containerValue.toLowerCase()} is klaar om besteld te worden.`;
}

if (nameInput) {
    nameInput.addEventListener('focus', () => moveCamera(cameraPos.name));
    nameInput.addEventListener('blur', () => moveCamera(cameraPos.default));
}

if (flavorSelect) {
    flavorSelect.addEventListener('focus', () => moveCamera(cameraPos.flavor));
    flavorSelect.addEventListener('blur', () => moveCamera(cameraPos.default));
    flavorSelect.addEventListener('change', () => {
        updateModelAppearance();
        updatePrice();
    });
}

if (toppingsSelect) {
    toppingsSelect.addEventListener('change', updatePrice);
}

if (sauceSelect) {
    sauceSelect.addEventListener('change', updatePrice);
}

if (containerSelect) {
    containerSelect.addEventListener('change', () => {
        updateContainer();
        updatePrice();
    });
}

if (addressInput) {
    addressInput.addEventListener('input', updateConfirmation);
}

if (submitButton) {
    submitButton.addEventListener('click', (event) => {
        event.preventDefault();
        updateConfirmation();
        if (feedback && nameInput?.value.trim() && addressInput?.value.trim() && flavorSelect?.value && containerSelect?.value) {
            feedback.textContent = `${nameInput.value.trim()}, je bestelling is ontvangen. We bezorgen naar ${addressInput.value.trim()}.`;
        }
    });
}

updatePrice();

// Animation loop
function animationLoop() {
    if (icecreamModel) {
        icecreamModel.rotation.y += 0.003;
    }

    controls.update();
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animationLoop);