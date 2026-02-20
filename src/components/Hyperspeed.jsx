import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { BloomEffect, EffectComposer, EffectPass, RenderPass, SMAAEffect } from 'postprocessing';

const PRESET_FIVE = {
    distortion: 'turbulentDistortion',
    length: 400,
    roadWidth: 9,
    islandWidth: 2,
    lanesPerRoad: 3,
    fov: 90,
    fovSpeedUp: 150,
    speedUp: 2,
    carLightsFade: 0.4,
    totalSideLightSticks: 20,
    lightPairsPerRoadWay: 40,
    shoulderLinesWidthPercentage: 0.05,
    brokenLinesWidthPercentage: 0.1,
    brokenLinesLengthPercentage: 0.5,
    lightStickWidth: [0.12, 0.5],
    lightStickHeight: [1.3, 1.7],
    movingAwaySpeed: [60, 80],
    movingCloserSpeed: [-120, -160],
    carLightsLength: [400 * 0.03, 400 * 0.2],
    carLightsRadius: [0.05, 0.14],
    carWidthPercentage: [0.3, 0.5],
    carShiftX: [-0.8, 0.8],
    carFloorSeparation: [0, 5],
    colors: {
        roadColor: 0x080808,
        islandColor: 0x0a0a0a,
        background: 0x000000,
        shoulderLines: 0x131318,
        brokenLines: 0x131318,
        leftCars: [0xdc5b20, 0xdca320, 0xdc2020],
        rightCars: [0x334bf7, 0xe5e6ed, 0xbfc6f3],
        sticks: 0xc5e8eb
    }
};

let nsin = val => Math.sin(val) * 0.5 + 0.5;

const turbulentUniforms = {
    uFreq: { value: new THREE.Vector4(4, 8, 8, 1) },
    uAmp: { value: new THREE.Vector4(25, 5, 10, 10) }
};

const DISTORTIONS = {
    turbulentDistortion: {
        uniforms: turbulentUniforms,
        getDistortion: `
          uniform vec4 uFreq;
          uniform vec4 uAmp;
          float nsin(float val){ return sin(val) * 0.5 + 0.5; }
          #define PI 3.14159265358979
          float getDistortionX(float progress){
            return (
              cos(PI * progress * uFreq.r + uTime) * uAmp.r +
              pow(cos(PI * progress * uFreq.g + uTime * (uFreq.g / uFreq.r)), 2.) * uAmp.g
            );
          }
          float getDistortionY(float progress){
            return (
              -nsin(PI * progress * uFreq.b + uTime) * uAmp.b +
              -pow(nsin(PI * progress * uFreq.a + uTime / (uFreq.b / uFreq.a)), 5.) * uAmp.a
            );
          }
          vec3 getDistortion(float progress){
            return vec3(
              getDistortionX(progress) - getDistortionX(0.0125),
              getDistortionY(progress) - getDistortionY(0.0125),
              0.
            );
          }
        `,
        getJS: (progress, time) => {
            const uFreq = turbulentUniforms.uFreq.value;
            const uAmp = turbulentUniforms.uAmp.value;
            const getX = p => Math.cos(Math.PI * p * uFreq.x + time) * uAmp.x + Math.pow(Math.cos(Math.PI * p * uFreq.y + time * (uFreq.y / uFreq.x)), 2) * uAmp.y;
            const getY = p => -nsin(Math.PI * p * uFreq.z + time) * uAmp.z - Math.pow(nsin(Math.PI * p * uFreq.w + time / (uFreq.z / uFreq.w)), 5) * uAmp.w;
            let distortion = new THREE.Vector3(getX(progress) - getX(progress + 0.007), getY(progress) - getY(progress + 0.007), 0);
            return distortion.multiply(new THREE.Vector3(-2, -5, 0)).add(new THREE.Vector3(0, 0, -10));
        }
    }
};

const vertexShader = `
#define USE_FOG
${Object.keys(turbulentUniforms).map(key => `uniform ${turbulentUniforms[key].value instanceof THREE.Vector4 ? 'vec4' : turbulentUniforms[key].value instanceof THREE.Vector2 ? 'vec2' : 'float'} ${key};`).join('\n')}
uniform float uTime;
attribute vec4 aColor;
attribute float aAlpha;
attribute float aRotation;
varying vec4 vColor;
varying float vFog;
varying vec2 vUv;
varying float vAlpha;
${DISTORTIONS.turbulentDistortion.getDistortion}
void main() {
  vec4 transformed = vec4(position.xy, 0., 1.);
  vUv = uv;
  vColor = aColor;
  vAlpha = aAlpha;
  vFog = 1. - smoothstep(0., 1., position.z / 1000.);
  gl_Position = projectionMatrix * modelViewMatrix * transformed;
}
`;

function createRoadMesh(options) {
    const geo = new THREE.PlaneGeometry(options.roadWidth + options.islandWidth + 2, options.length, 1, 50);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: options.colors.roadColor });
    return new THREE.Mesh(geo, mat);
}

class SimpleApp {
    constructor(container, options) {
        this.options = options;
        this.container = container;
        this.disposed = false;
        this.clock = new THREE.Clock();
        this.timeOffset = 0;

        this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
        this.renderer.setSize(container.offsetWidth, container.offsetHeight, false);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        container.appendChild(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera(options.fov, container.offsetWidth / container.offsetHeight, 0.1, 10000);
        this.camera.position.set(0, 8, -5);

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(options.colors.background, options.length * 0.2, options.length * 500);
        this.scene.background = new THREE.Color(options.colors.background);

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.composer.addPass(new EffectPass(this.camera, new BloomEffect({ luminanceThreshold: 0.2, resolutionScale: 0.75 })));

        this._buildScene();
        this.tick = this.tick.bind(this);
        this._resizeBound = this._onResize.bind(this);
        window.addEventListener('resize', this._resizeBound);
    }

    _buildScene() {
        const opts = this.options;
        const road = new THREE.Mesh(
            new THREE.PlaneGeometry(opts.roadWidth, opts.length, 1, 100),
            new THREE.MeshBasicMaterial({ color: opts.colors.roadColor })
        );
        road.rotation.x = -Math.PI / 2;
        this.scene.add(road);

        const island = new THREE.Mesh(
            new THREE.PlaneGeometry(opts.islandWidth, opts.length, 1, 100),
            new THREE.MeshBasicMaterial({ color: opts.colors.islandColor })
        );
        island.rotation.x = -Math.PI / 2;
        this.scene.add(island);

        this._lights = [];
        const totalLights = opts.lightPairsPerRoadWay * 2;

        for (let i = 0; i < totalLights; i++) {
            const isLeft = i % 2 === 0;
            const colors = isLeft ? opts.colors.leftCars : opts.colors.rightCars;
            const color = new THREE.Color(colors[Math.floor(Math.random() * colors.length)]);
            const geo = new THREE.PlaneGeometry(opts.carLightsRadius[0] * 2, opts.carLightsLength[0]);
            const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 });
            const mesh = new THREE.Mesh(geo, mat);
            const side = isLeft ? -1 : 1;
            const lane = Math.floor(Math.random() * opts.lanesPerRoad);
            const laneWidth = opts.roadWidth / opts.lanesPerRoad;
            mesh.position.set(
                side * (opts.islandWidth / 2 + (lane + 0.5) * laneWidth),
                0.05,
                Math.random() * opts.length - opts.length / 2
            );
            mesh.rotation.x = -Math.PI / 2;
            mesh.userData = {
                isLeft,
                speed: isLeft
                    ? opts.movingAwaySpeed[0] + Math.random() * (opts.movingAwaySpeed[1] - opts.movingAwaySpeed[0])
                    : opts.movingCloserSpeed[0] + Math.random() * (opts.movingCloserSpeed[1] - opts.movingCloserSpeed[0]),
                baseZ: mesh.position.z
            };
            this.scene.add(mesh);
            this._lights.push(mesh);
        }

        for (let i = 0; i < opts.totalSideLightSticks; i++) {
            const geo = new THREE.BoxGeometry(0.05, opts.lightStickHeight[0], 0.1);
            const mat = new THREE.MeshBasicMaterial({ color: opts.colors.sticks });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(-(opts.roadWidth / 2 + opts.islandWidth + 0.5), 0.5, (i / opts.totalSideLightSticks) * opts.length - opts.length / 2);
            this.scene.add(mesh);
        }
    }

    _onResize() {
        const w = this.container.offsetWidth, h = this.container.offsetHeight;
        this.renderer.setSize(w, h, false);
        this.composer.setSize(w, h);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
    }

    tick() {
        if (this.disposed) return;
        requestAnimationFrame(this.tick);
        const delta = this.clock.getDelta();
        const time = this.clock.elapsedTime + this.timeOffset;

        this._lights.forEach(m => {
            m.position.z += m.userData.speed * delta;
            const half = this.options.length / 2;
            if (m.position.z > half) m.position.z -= this.options.length;
            if (m.position.z < -half) m.position.z += this.options.length;
        });

        if (this.options.distortion?.getJS) {
            const d = this.options.distortion.getJS(0.025, time);
            this.camera.lookAt(new THREE.Vector3(
                this.camera.position.x + d.x,
                this.camera.position.y + d.y,
                this.camera.position.z + d.z
            ));
        }

        this.composer.render(delta);
    }

    dispose() {
        this.disposed = true;
        this.renderer.dispose();
        this.composer.dispose();
        window.removeEventListener('resize', this._resizeBound);
        if (this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
    }
}

const Hyperspeed = ({ effectOptions = {} }) => {
    const containerRef = useRef(null);
    const appRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const opts = { ...PRESET_FIVE, ...effectOptions };
        opts.distortion = DISTORTIONS[opts.distortion] || DISTORTIONS.turbulentDistortion;

        const app = new SimpleApp(container, opts);
        appRef.current = app;
        app.tick();

        return () => {
            app.dispose();
            appRef.current = null;
        };
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 0,
                pointerEvents: 'none',
                opacity: 0.35,
            }}
        />
    );
};

export default Hyperspeed;
