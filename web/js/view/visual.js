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
import { curves, Mode, mode } from '../state/state';
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

let rotation_line_material = new LineMaterial({
  color: 0xccccff,
  linewidth: 5,
  opacity: 1.0,
});
let rotation_line_material_2 = new LineMaterial({
  color: 0xccccff,
  linewidth: 5,
  opacity: 0.3,
  transparent: true,
});

// Design canvas.
let canvas = document.getElementById("canvas");
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
let w = canvas.width, h = canvas.height;
export let aspect_ratio = w / h;

// Top view canvas.
let top_view_canvas = document.getElementById("top_view_canvas");
top_view_canvas.width = top_view_canvas.clientWidth;
top_view_canvas.height = top_view_canvas.clientHeight;
let top_view_w = top_view_canvas.width, top_view_h = top_view_canvas.height;
let top_view_aspect_ratio = top_view_w / top_view_h;
// Front view canvas.
let front_view_canvas = document.getElementById("front_view_canvas");
front_view_canvas.width = front_view_canvas.clientWidth;
front_view_canvas.height = front_view_canvas.clientHeight;
let front_view_w = front_view_canvas.width, front_view_h = front_view_canvas.height;
let front_view_aspect_ratio = front_view_w / front_view_h;


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
let top_view_renderer = new THREE.WebGLRenderer({
  canvas: top_view_canvas,
  powerPreference: "high-performance",
  antialias: true,
});
top_view_renderer.setSize(top_view_w, top_view_h);
top_view_renderer.setPixelRatio(window.devicePixelRatio);
top_view_renderer.setClearColor(0xffffff, 1);
let front_view_renderer = new THREE.WebGLRenderer({
  canvas: front_view_canvas,
  powerPreference: "high-performance",
  antialias: true,
});
front_view_renderer.setSize(front_view_w, front_view_h);
front_view_renderer.setPixelRatio(window.devicePixelRatio);
front_view_renderer.setClearColor(0xffffff, 1);

export function set_viewer_theme() {
  if (params.theme == "Light") {
    renderer.setClearColor(0xffffff, 1);
    top_view_renderer.setClearColor(0xffffff, 1);
    front_view_renderer.setClearColor(0xffffff, 1);
  } else {
    renderer.setClearColor(0x0a0a0a, 1);
    top_view_renderer.setClearColor(0x0a0a0a, 1);
    front_view_renderer.setClearColor(0x0a0a0a, 1);
  }
}
set_viewer_theme();

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
function update_orth_camera_aspect(cam, aspect_ratio) {
  if (aspect_ratio > 1) {
    cam.left = -aspect_ratio;
    cam.right = aspect_ratio;
    cam.top = 1;
    cam.bottom = -1;
  } else {
    cam.left = -1;
    cam.right = 1;
    cam.top = 1 / aspect_ratio;
    cam.bottom = -1 / aspect_ratio;
  }
}
function init_orth_camera(aspect_ratio) {
  let cam = new THREE.OrthographicCamera(-aspect_ratio, aspect_ratio, 1, -1, -2, 1000);
  update_orth_camera_aspect(cam, aspect_ratio);
  cam.position.y = 100;
  return cam;
}
export let camera2d = init_orth_camera(aspect_ratio);
let top_view_cam = init_orth_camera(top_view_aspect_ratio);
let front_view_cam = init_orth_camera(front_view_aspect_ratio);
front_view_cam.position.set(0, 0, 1);
front_view_cam.up.set(0, 0, 1);

// Init composer and render pass.
const composer = new EffectComposer(renderer);
// SSAO.
// const ssaoPass = new SSAOPass(scene, camera3d, w, h);
// ssaoPass.kernelRadius = 16;
// ssaoPass.minDistance = 0.005;
// ssaoPass.maxDistance = 0.1;
// composer.addPass(ssaoPass);
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
fxaaPass.material.uniforms['resolution'].value.set(
  1 / (canvas.offsetWidth * pixelRatio),
  1 / (canvas.offsetHeight * pixelRatio));
composer.addPass(fxaaPass);

// Controls.
let controls_enabled = true;
export function disable_controls() { controls_enabled = false; }
export function enable_controls() { controls_enabled = true; }
export let controls = new OrbitControls(camera3d, renderer.domElement);
controls.enableDamping = true;
export let orth_camera_controls = new MapControls(camera2d, renderer.domElement);
export let top_view_controls = new MapControls(top_view_cam, top_view_renderer.domElement);
export let front_view_controls = new MapControls(front_view_cam, front_view_renderer.domElement);

export let get_active_camera = () => mode === Mode.orthographic ? camera2d : camera3d;

export let designing_area = new THREE.Mesh(
  new THREE.CircleGeometry(1, 64),
  new THREE.MeshBasicMaterial({
    // color: 0xeb9090, 
    color: 0xffccd5,
    side: THREE.DoubleSide, opacity: 0.3, transparent: true
  }));
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
export function set_design_area_visibility(visible) {
  designing_area.visible = visible;
  for (let line of rotation_symmetry_lines) {
    line.visible = visible;
  }
}
export function update_rotation_symmetry_lines(rotation_symmetry) {
  for (let line of rotation_symmetry_lines) {
    scene.remove(line);
    line.geometry.dispose();
  }
  let rotation_line_geometry = new LineGeometry();
  rotation_line_geometry.setPositions([0, 0, 0, 0, 0, -1]);
  let line = new Line2(rotation_line_geometry, rotation_line_material);
  line.type = "ns_line";
  for (let i = 0; i < rotation_symmetry; i++) {
    rotation_symmetry_lines.push(line);
    scene.add(line);
    if (rotation_symmetry % 2 == 0) {
      let line2 = line.clone().rotateY(Math.PI / rotation_symmetry);
      line2.material = rotation_line_material_2;
      line2.type = "ns_line";
      rotation_symmetry_lines.push(line2);
      scene.add(line2);
    } else {
      let line2 = line.clone().rotateY(Math.PI);
      line2.material = rotation_line_material_2;
      line2.type = "ns_line";
      rotation_symmetry_lines.push(line2);
      scene.add(line2);
    }
    line = line.clone().rotateY((2 * Math.PI / rotation_symmetry));
    line.type = "ns_line";
  }
}
update_rotation_symmetry_lines(params.rotation_symmetry);

requestAnimationFrame(animate);
function resizeCanvasToDisplaySize(renderer, cam2d, cam3d) {
  const canvas = renderer.domElement;
  // look up the size the canvas is being displayed
  const width = canvas.parentElement.clientWidth;
  const height = canvas.parentElement.clientHeight;

  if (canvas.width !== width || canvas.height !== height) {
    renderer.setSize(width, height, true);
    if (cam2d) {
      update_orth_camera_aspect(cam2d, width / height);
      cam2d.updateProjectionMatrix();
    }
    if (cam3d) {
      cam3d.aspect = width / height;
      cam3d.updateProjectionMatrix();
    }
  }
}

function animate() {
  resizeCanvasToDisplaySize(renderer, camera2d, camera3d);
  if (params.preview_mode == "Preview") {
    resizeCanvasToDisplaySize(top_view_renderer, top_view_cam, null);
    resizeCanvasToDisplaySize(front_view_renderer, front_view_cam, null);
  }
  if (mode === Mode.orthographic) {
    scene.background = null;
    controls.enabled = false;
    orth_camera_controls.enabled = controls_enabled;
    orth_camera_controls.update();
    renderPass.camera = camera2d;
    outlinePass.renderCamera = camera2d;
    selectedOutlinePass.renderCamera = camera2d;
    // renderer.render(scene, camera2d);
  } else {
    // scene.background = environmentMap;
    orth_camera_controls.enabled = false;
    controls.enabled = controls_enabled;
    controls.update();
    renderPass.camera = camera3d;
    outlinePass.renderCamera = camera3d;
    selectedOutlinePass.renderCamera = camera3d;
    // renderer.render(scene, camera3d);
  }
  composer.render();
  if (params.preview_mode == "Preview") {
    top_view_renderer.render(scene, top_view_cam);
    front_view_renderer.render(scene, front_view_cam);
  }
  requestAnimationFrame(animate);
}

export function update_front_view_cam() {
  let top_height = 0;
  for (let curve of curves) {
    top_height = Math.max(top_height, curve.height);
  }
  let max_width = 0.01;
  for (let curve of curves) {
    max_width = Math.max(max_width, curve.max_width());
  }
  front_view_cam.position.set(0, top_height / 2, 1);
  front_view_cam.up.set(0, 0, 1);
  front_view_cam.zoom = Math.min(2 / top_height, 1 / max_width);
  front_view_controls.target.set(0, top_height / 2, 0);
}

let sweep_plane_geom = new THREE.PlaneGeometry(100, 0.1, 100 * 20, 1);
sweep_plane_geom.computeBoundingBox();
var size = new THREE.Vector3();
sweep_plane_geom.boundingBox.getSize(size);
sweep_plane_geom.translate(-sweep_plane_geom.boundingBox.min.x, -sweep_plane_geom.boundingBox.min.y,// - size.y / 2,
  -sweep_plane_geom.boundingBox.min.z - size.z / 2);


// scene.add(new THREE.Mesh(sweep_plane_geom, new THREE.MeshBasicMaterial({ color: 0x0000ff, side: THREE.DoubleSide })));

// let cylinder_geom = new THREE.CylinderGeometry(0.1, 0.1, 10, 32, 100, true);
// cylinder_geom.rotateZ(Math.PI / 2);
// scene.add(new THREE.Mesh(cylinder_geom, new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide })));