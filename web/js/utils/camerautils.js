import * as THREE from 'three';
import { curves } from '../state/state';

export function frameObject(camera, controls, obj, height, center) {
  let box = new THREE.Box3().setFromObject(obj);
  let size = box.getSize(new THREE.Vector3());
  size.y = height;
  const maxSize = Math.max(size.x, size.y, size.z);
  const fitHeightDistance = maxSize / (2 * Math.atan(Math.PI * camera.fov / 360));
  const fitWidthDistance = fitHeightDistance / camera.aspect;
  const distance = 1.2 * Math.max(fitHeightDistance, fitWidthDistance);
  const direction = controls.target.clone().sub(camera.position).normalize().multiplyScalar(distance);
  controls.maxDistance = distance * 10;
  controls.target.copy(center);
  camera.near = distance / 100;
  camera.far = distance * 100;
  camera.updateProjectionMatrix();
  camera.position.copy(controls.target).sub(direction);
  controls.update();
}

export function frame_curves_ortho_cam(camera, controls) {
  let top_height = 0;
  for (let curve of curves) {
    top_height = Math.max(top_height, curve.height);
  }
  let max_width = 0.01;
  for (let curve of curves) {
    max_width = Math.max(max_width, curve.max_width());
  }
  camera.position.set(0, top_height / 2, 1);
  camera.up.set(0, 0, 1);
  camera.zoom = Math.min(2 / top_height, 1 / max_width);
  controls.target.set(0, top_height / 2, 0);
  controls.update();
}