/**
 * WebGL Three.js Scene Architecture Reference
 * Code Scaffold :: UI Primitives & Micro-Interactions v4
 * -------------------------------------------------------
 * Complete bootstrapped 3D scene with GLTF loading,
 * OrbitControls, resize handling, and full SPA disposal.
 * Requires: three (npm install three)
 */

import * as THREE from "three";
import { GLTFLoader }    from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader }   from "three/examples/jsm/loaders/DRACOLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export class SceneController {
  constructor(canvas, options = {}) {
    const {
      fov            = 45,
      near           = 0.1,
      far            = 1000,
      background     = null,
      powerPreference = "low-power",
      pixelRatioMax  = 2,
    } = options;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: !background, powerPreference });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioMax));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;

    // Scene
    this.scene = new THREE.Scene();
    if (background) this.scene.background = new THREE.Color(background);

    // Camera
    this.camera = new THREE.PerspectiveCamera(fov, canvas.clientWidth / canvas.clientHeight, near, far);
    this.camera.position.set(0, 1.5, 4);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(3, 5, 3);
    key.castShadow = true;
    this.scene.add(ambient, key);

    // Resize
    this._onResize = this._onResize.bind(this);
    window.addEventListener("resize", this._onResize);

    // Intersection observer to pause when off-screen
    this._rafId = null;
    this._paused = false;
    this._io = new IntersectionObserver((entries) => {
      this._paused = !entries[0].isIntersecting;
    });
    this._io.observe(canvas);

    // Start loop
    this._animate();
  }

  // ─── GLTF Loading ──────────────────────────────────────────────────────

  loadGLTF(url, onLoaded, dracoPath = "/draco/") {
    const draco = new DRACOLoader();
    draco.setDecoderPath(dracoPath);

    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
    loader.load(url, (gltf) => {
      this.scene.add(gltf.scene);
      onLoaded && onLoaded(gltf);
    }, undefined, (err) => console.error("[SceneController] GLTF load error:", err));
  }

  // ─── Render Loop ───────────────────────────────────────────────────────

  _animate() {
    this._rafId = requestAnimationFrame(() => this._animate());
    if (this._paused) return;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  // ─── Resize Handler ────────────────────────────────────────────────────

  _onResize() {
    const { clientWidth: w, clientHeight: h } = this.renderer.domElement;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  // ─── SPA Disposal ──────────────────────────────────────────────────────

  dispose() {
    cancelAnimationFrame(this._rafId);
    window.removeEventListener("resize", this._onResize);
    this._io.disconnect();
    this.controls.dispose();

    this.scene.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.geometry.dispose();
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((mat) => {
        Object.values(mat).forEach((val) => {
          if (val && typeof val.dispose === "function") val.dispose();
        });
        mat.dispose();
      });
    });

    this.renderer.dispose();
  }
}

// ─── Usage Example ─────────────────────────────────────────────────────────
//
// const scene = new SceneController(document.querySelector("#cs-canvas"), {
//   background: "#0f172a",
//   powerPreference: "low-power",
// });
//
// scene.loadGLTF("/models/product.glb", (gltf) => {
//   gltf.scene.position.set(0, 0, 0);
// });
//
// // On component unmount:
// scene.dispose();
