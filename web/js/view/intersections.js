import * as THREE from 'three';

import { scene } from './visual';
import { curves, edit_mode, EditMode, find_intersections, get_level_bottom, intersections } from '../state/state';
import { params } from '../state/params';

let intersection_material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const intersection_sphere_geometry = new THREE.SphereGeometry(0.014);

let intersection_meshes = [];

export function update_intersections() {
  find_intersections();
  clear_intersections();
  for (let intersection of intersections) {
    let sphere = new THREE.Mesh(intersection_sphere_geometry, intersection_material);
    sphere.type = "intersection_point";
    sphere.userData = intersection;
    let p = intersection.curve1.arc_curve.getPoint(intersection.t1);
    p.y = get_level_bottom(intersection.level);
    sphere.position.set(p.x, p.y, p.z);
    scene.add(sphere);
    intersection_meshes.push(sphere);
  }
  show_intersections_at_level(params.current_level);
}

export function clear_intersections() {
  for (let mesh of intersection_meshes) {
    scene.remove(mesh);
    mesh.geometry.dispose();
  }
  intersection_meshes = [];
}

export function show_intersections_at_level(level) {
  let level_bottom = get_level_bottom(level);
  for (let mesh of intersection_meshes) {
    mesh.position.y = level_bottom;
    mesh.visible = (mesh.userData.level == level && params.preview_mode != 'Preview' && 
      edit_mode != EditMode.change_layer_bottom);
  }
}