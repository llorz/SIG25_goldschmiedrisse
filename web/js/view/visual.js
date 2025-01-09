import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { Mode, mode } from '../state/state';
import { params } from '../state/params';
// import px from './environment_maps/less_fancy_church/nx.png';
// import ny from './environment_maps/less_fancy_church/ny.png';
// import pz from './environment_maps/less_fancy_church/nz.png';
// import nx from './environment_maps/less_fancy_church/px.png';
// import py from './environment_maps/less_fancy_church/py.png';
// import nz from './environment_maps/less_fancy_church/pz.png';

import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { get_rotation_mat } from '../utils/intersect';


let canvas = document.getElementById("canvas");
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
let w = canvas.width, h = canvas.height;
export let aspect_ratio = w / h;

// Init threejs stuff.
export let scene = new THREE.Scene();
export let renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  powerPreference: "high-performance",
  antialias: false,
  stencil: false,
  depth: false

});
renderer.setSize(w, h);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0xffffff, 1);

// Lights.
const light = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(light);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.4);
directionalLight.position.set(100, 100, 100);
scene.add(directionalLight);
const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.4);
directionalLight2.position.set(0, 0, -1);
scene.add(directionalLight2);
const directionalLight3 = new THREE.DirectionalLight(0xffffff, 1.4);
directionalLight3.position.set(1, 0, 0);
scene.add(directionalLight3);
const directionalLight4 = new THREE.DirectionalLight(0xffffff, 1.4);
directionalLight4.position.set(-1, 0, 0);
scene.add(directionalLight4);

// const cubeTextureLoader = new THREE.CubeTextureLoader()
// const environmentMap = cubeTextureLoader.load([
//   px,
//   nx,
//   py,
//   ny,
//   pz,
//   nz,
// ]);


// Cameras.
export let camera3d = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera3d.position.y = 1.3;
export let camera2d = new THREE.OrthographicCamera(-aspect_ratio, aspect_ratio, 1, -1, -2, 1000);
function init_orth_camera() {
  if (aspect_ratio > 1) {
    camera2d.left = -aspect_ratio;
    camera2d.right = aspect_ratio;
    camera2d.top = 1;
    camera2d.bottom = -1;
  } else {
    camera2d.left = -1;
    camera2d.right = 1;
    camera2d.top = 1 / aspect_ratio;
    camera2d.bottom = -1 / aspect_ratio;
  }
  camera2d.position.y = 1;
}
init_orth_camera();

// Init composer and render pass.
const composer = new EffectComposer(renderer);
// SSAO.
const ssaoPass = new SSAOPass(scene, camera3d, w, h);
ssaoPass.kernelRadius = 16;
ssaoPass.minDistance = 0.005;
ssaoPass.maxDistance = 0.1;
composer.addPass(ssaoPass);
// Render.
const renderPass = new RenderPass(scene, camera2d);
composer.addPass(renderPass);

export const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera2d);
outlinePass.edgeThickness = 3.0;
outlinePass.edgeStrength = 5.0;
outlinePass.edgeGlow = 0.0;
outlinePass.visibleEdgeColor = new THREE.Color(0xffb15d);
outlinePass.hiddenEdgeColor = new THREE.Color(0xffb15d);
outlinePass.overlayMaterial.blending = THREE.CustomBlending;
composer.addPass(outlinePass);
// Another one for selected object.
export const selectedOutlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera2d);
selectedOutlinePass.edgeThickness = 3.0;
selectedOutlinePass.edgeStrength = 5.0;
selectedOutlinePass.edgeGlow = 0.0;
selectedOutlinePass.visibleEdgeColor = new THREE.Color(0xffa71b);
selectedOutlinePass.hiddenEdgeColor = new THREE.Color(0xffa71b);
selectedOutlinePass.overlayMaterial.blending = THREE.CustomBlending;
composer.addPass(selectedOutlinePass);
// Output pass.
const outputPass = new OutputPass();
composer.addPass(outputPass);

const pixelRatio = renderer.getPixelRatio();
const fxaaPass = new ShaderPass(FXAAShader);
fxaaPass.uniforms['resolution'].value.set(
  1 / (canvas.offsetWidth * pixelRatio),
  1 / (canvas.offsetHeight * pixelRatio));
composer.addPass(fxaaPass);


// Controls.
let controls_enabled = true;
export function disable_controls() { controls_enabled = false; }
export function enable_controls() { controls_enabled = true; }
export let controls = new OrbitControls(camera3d, renderer.domElement);
controls.enableDamping = true;
export let top_view_controls = new MapControls(camera2d, renderer.domElement);

export let get_active_camera = () => mode === Mode.orthographic ? camera2d : camera3d;

let center_circle = new THREE.Mesh(
  new THREE.CircleGeometry(0.01),
  new THREE.MeshBasicMaterial({ color: 0x0000ff, side: THREE.DoubleSide }));
center_circle.name = "center_circle";
center_circle.rotateX(Math.PI / 2);
scene.add(center_circle);

let designing_area = new THREE.Mesh(
  new THREE.CircleGeometry(1, 64),
  new THREE.MeshBasicMaterial({ color: 0xeb9090, side: THREE.DoubleSide, opacity: 0.3, transparent: true }));
designing_area.name = "designing_area";
designing_area.rotateX(Math.PI / 2);
designing_area.position.y = -1e-3;
scene.add(designing_area);
let rotation_symmetry_lines = [];

export function set_designing_area_height(height) {
  designing_area.position.y = height - 1e-3;
  for (let line of rotation_symmetry_lines) {
    line.position.y = height;
  }
}
export function update_rotation_symmetry_lines(rotation_symmetry) {
  for (let line of rotation_symmetry_lines) {
    scene.remove(line);
    line.geometry.dispose();
  }
  let rotation_line_geometry = new LineGeometry();
  rotation_line_geometry.setPositions([0, 0, 0, 0, 0, -1]);
  let rotation_line_material = new LineMaterial({
    color: 0x7777ff,
    linewidth: 5,
    opacity: 1.0,
  });
  let line = new Line2(rotation_line_geometry, rotation_line_material);
  line.type = "ns_line";
  for (let i = 0; i < rotation_symmetry; i++) {
    rotation_symmetry_lines.push(line);
    scene.add(line);
    line = line.clone().rotateY((2 * Math.PI / rotation_symmetry));
    line.type = "ns_line";
  }
}
update_rotation_symmetry_lines(params.rotation_symmetry);

requestAnimationFrame(animate);
function animate() {
  if (mode === Mode.orthographic) {
    scene.background = null;
    controls.enabled = false;
    top_view_controls.enabled = controls_enabled;
    top_view_controls.update();
    renderPass.camera = camera2d;
    outlinePass.renderCamera = camera2d;
    selectedOutlinePass.renderCamera = camera2d;
    // renderer.render(scene, camera2d);
  } else {
    // scene.background = environmentMap;
    top_view_controls.enabled = false;
    controls.enabled = controls_enabled;
    controls.update();
    renderPass.camera = camera3d;
    outlinePass.renderCamera = camera3d;
    selectedOutlinePass.renderCamera = camera3d;
    // renderer.render(scene, camera3d);
  }
  composer.render();
  requestAnimationFrame(animate);
}

