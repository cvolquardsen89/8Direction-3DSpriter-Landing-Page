import * as THREE from './vendor/three/build/three.module.js';
import { OrbitControls } from './vendor/three/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from './vendor/three/examples/jsm/loaders/FBXLoader.js';

const MODEL_URL = 'assets/uploads/Pistol Run.fbx';

function setMessage(container, message) {
    container.innerHTML = '';
    const el = document.createElement('div');
    el.className = 'model-viewer-message';
    el.textContent = message;
    container.appendChild(el);
}

function fitCameraToObject(camera, object, controls) {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxSize = Math.max(size.x, size.y, size.z);
    const fitHeightDistance = maxSize / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)));
    const fitWidthDistance = fitHeightDistance / camera.aspect;
    const distance = 1.2 * Math.max(fitHeightDistance, fitWidthDistance);

    const direction = new THREE.Vector3(1, 0.9, 1).normalize();
    camera.position.copy(center).add(direction.multiplyScalar(distance));
    camera.near = Math.max(distance / 100, 0.01);
    camera.far = Math.max(distance * 100, 1000);
    camera.updateProjectionMatrix();

    if (controls) {
        controls.target.copy(center);
        controls.update();
    }
}

function normalizeObject(object) {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxSize = Math.max(size.x, size.y, size.z);
    if (maxSize > 0) {
        const scale = 1 / maxSize;
        object.scale.multiplyScalar(scale);
    }

    object.position.sub(center);
}

async function initViewer(container) {
    if (!container) return;

    setMessage(container, 'Loading Pistol Run.fbx…');

    const modelUrlEncoded = encodeURI(MODEL_URL);
    try {
        const head = await fetch(modelUrlEncoded, { method: 'HEAD' });
        if (!head.ok) {
            setMessage(container, `Could not fetch ${MODEL_URL} (HTTP ${head.status}).\n\nConfirm the file is at assets/uploads/ and refresh.`);
            return;
        }
    } catch (e) {
        setMessage(container, `Could not reach ${MODEL_URL}.\n\nMake sure you're using the local server preview (${window.location.origin}/) and refresh.`);
        return;
    }

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 0.5;
    controls.maxDistance = 10;

    const hemi = new THREE.HemisphereLight(0xffffff, 0x1a1f3a, 1.0);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(2, 4, 3);
    scene.add(dir);

    let mixer = null;
    const clock = new THREE.Clock();

    function resize() {
        const rect = container.getBoundingClientRect();
        const width = Math.max(1, Math.floor(rect.width));
        const height = Math.max(1, Math.floor(rect.height));
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
    }

    const onResize = () => resize();
    window.addEventListener('resize', onResize);
    resize();

    const loader = new FBXLoader();
    loader.load(
        modelUrlEncoded,
        (object) => {
            normalizeObject(object);
            scene.add(object);

            if (object.animations && object.animations.length > 0) {
                mixer = new THREE.AnimationMixer(object);
                const action = mixer.clipAction(object.animations[0]);
                action.play();
            }

            fitCameraToObject(camera, object, controls);
        },
        undefined,
        (err) => {
            const details = (err && (err.message || err.type)) ? `\n\nDetails: ${err.message || err.type}` : '';
            setMessage(container, `Three.js could not parse ${MODEL_URL}.${details}`);
        }
    );

    function animate() {
        const dt = clock.getDelta();
        if (mixer) mixer.update(dt);
        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    animate();

    // Cleanup if page is navigated away
    window.addEventListener('beforeunload', () => {
        window.removeEventListener('resize', onResize);
        controls.dispose();
        renderer.dispose();
    });
}

initViewer(document.getElementById('model-viewer'));
