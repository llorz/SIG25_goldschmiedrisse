import * as THREE from 'three';
import { centroid } from './objutils';

export function frameObject(camera, controls, obj) {
  let box = new THREE.Box3().setFromObject(obj);
  let center = centroid(obj);
  let size = box.getSize(new THREE.Vector3());
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