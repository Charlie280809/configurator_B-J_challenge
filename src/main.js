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
scene.background = null;

const app = document.getElementById('app');
const getAppAspect = () => {
    if (!app || app.clientHeight === 0) return window.innerWidth / window.innerHeight;
    return app.clientWidth / app.clientHeight;
};

const camera = new THREE.PerspectiveCamera(75, getAppAspect(), 0.1, 1000);
camera.position.set(0, 0.5, 2);
scene.add(camera);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.8;

if (app) {
    app.appendChild(renderer.domElement);
    renderer.setSize(app.clientWidth, app.clientHeight);
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
    sizes.width = app?.clientWidth ?? window.innerWidth;
    sizes.height = app?.clientHeight ?? window.innerHeight;
    camera.aspect = getAppAspect();
    camera.updateProjectionMatrix();
    if (app) {
        renderer.setSize(app.clientWidth, app.clientHeight);
    }
    // renderer.setSize(sizes.width, sizes.height);
});

// Light setup
const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Load static SVG background
const gltfLoader = new GLTFLoader(loadingManager);
const textureLoader = new THREE.TextureLoader(loadingManager);
// textureLoader.load('/environment/background.svg', (texture) => {
//     texture.colorSpace = THREE.SRGBColorSpace;
//     scene.background = texture;
// });

// Load model
let icecreamModel;
gltfLoader.load('/models/icecream.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(0.6, 0.6, 0.6);
    model.position.set(0, -0.8, 0);

    model.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            if(child.name === 'Cup'){
                child.material = new THREE.MeshStandardMaterial({
                    color: 0xB0D7EF,
                    metalness: 0.1,
                    roughness: 0.8,
                });
            }
            if(child.name === 'Ice'){
                child.material = new THREE.MeshStandardMaterial({
                    color: 0xA3A3A3,
                    metalness: 0.1,
                    roughness: 0.8,
                });
            }
            if(child.name.includes('Sprinkle')){
                child.material = new THREE.MeshStandardMaterial({
                    color: 0xff69b4,
                    metalness: 0.1,
                    roughness: 0.8,
                });
            }
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

// Simple UI hooks
const nameInput = document.getElementById('nameInput');
const addressInput = document.getElementById('addressInput');
const flavorSelect = document.getElementById('flavorSelect');
const toppingsSelect = document.getElementById('toppingsSelect');
const sauceSelect = document.getElementById('sauceSelect');
const submitButton = document.getElementById('submit-order');
const feedback = document.getElementById('confirmationMessage');
const priceEl = document.getElementById('price');

const flavorColors = {
    vanille: 0xf4e5c3,
    chocolate: 0x5b3a29,
    strawberry: 0xf08aa3,
    'cookie-dough': 0xd8b48a,
};

function updatePrice() {
    let total = 0;
    // const toppingsCount = toppingsSelect ? toppingsSelect.selectedOptions.length : 0;

    if (flavorSelect && flavorSelect.value) total += 4.5;
    if(toppingsSelect && toppingsSelect.value) total += 1.0;
    if (sauceSelect && sauceSelect.value) total += 0.5;
    // total += toppingsCount * 0.4;

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

function updateConfirmation() {
    if (!feedback) return;

    const nameValue = nameInput ? nameInput.value.trim() : '';
    const flavorValue = flavorSelect ? flavorSelect.options[flavorSelect.selectedIndex]?.textContent || '' : '';

    if (!nameValue || !addressInput?.value.trim()) {
        feedback.textContent = 'Vul je naam en adres in om je bestelling te plaatsen.';
        return;
    }

    feedback.textContent = `${nameValue}, jouw ${flavorValue.toLowerCase()} is klaar om besteld te worden.`;
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

if (addressInput) {
    addressInput.addEventListener('input', updateConfirmation);
}

if (submitButton) {
    submitButton.addEventListener('click', (event) => {
        event.preventDefault();
        updateConfirmation();
        if (feedback && nameInput?.value.trim() && addressInput?.value.trim() && flavorSelect?.value) {
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