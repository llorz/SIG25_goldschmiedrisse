import * as THREE from "three";

import { params } from "../state/params";
import { EditMode, get_available_layer_heights, get_level_bottom, set_control_points_visibility, set_edit_mode, set_level_bottom, udpated_layer_bottom } from "../state/state";
import { clear_all_intersection_points } from "../view/add_face_mode";
import { scene, set_designing_area_height } from "../view/visual";
import { clear_intersections, update_intersections } from "../view/intersections";

let sphere_geom = new THREE.SphereGeometry(0.02);
let control_point_material = new THREE.MeshBasicMaterial({ color: 0xF3752B });

/** @type {THREE.Object3D} */
let edit_point = null;

let layer_height_before_edit = 0;
let snap_heights = [];


export function closest_snap_height(height) {
  let closest = snap_heights[0];
  let min_dist = Math.abs(closest - height);
  for (let h of snap_heights) {
    let dist = Math.abs(h - height);
    if (dist < min_dist) {
      min_dist = dist;
      closest = h;
    }
  }
  return closest;
}

export function start_changing_height() {
  set_edit_mode(EditMode.change_layer_bottom);
  clear_intersections();
  params.control_points_visible = false;
  set_control_points_visibility(false);

  snap_heights = get_available_layer_heights();

  edit_point = new THREE.Mesh(sphere_geom, control_point_material);
  layer_height_before_edit = get_level_bottom(params.current_level);
  edit_point.position.set(0, layer_height_before_edit, 0);
  edit_point.type = "layer_bottom";
  scene.add(edit_point);
}

function exit_mode() {
  set_edit_mode(EditMode.none);
  params.control_points_visible = true;
  set_control_points_visibility(true);
  scene.remove(edit_point);
  edit_point = null;
  update_intersections();
  set_designing_area_height(get_level_bottom(params.current_level));
  udpated_layer_bottom(params.current_level);
}

export function cancel_height_change() {
  set_level_bottom(params.current_level, layer_height_before_edit);
  exit_mode();
}

export function accept_height_change() {
  exit_mode();
}

export function move_layer_height(ray_cast) {
  let plane = new THREE.Plane();
  let pt = new THREE.Vector3(0,0,0);
  let normal = ray_cast.ray.direction.clone();
  normal.y = 0;
  normal.normalize();
  plane.setFromNormalAndCoplanarPoint(normal, pt);

  let intersection = new THREE.Vector3();
  ray_cast.ray.intersectPlane(plane, intersection);

  let new_height = closest_snap_height(intersection.y);

  if (Math.abs(new_height - intersection.y) > 0.05) {
    new_height = intersection.y;
  }
  set_level_bottom(params.current_level, new_height);
  edit_point.position.y = new_height;
  set_designing_area_height(new_height);
  udpated_layer_bottom(params.current_level);
}