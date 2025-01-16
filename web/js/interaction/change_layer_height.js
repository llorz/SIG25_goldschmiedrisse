import * as THREE from "three";

import { params } from "../state/params";
import { EditMode, get_level_bottom, set_control_points_visibility, set_edit_mode, set_level_bottom } from "../state/state";
import { clear_all_intersection_points } from "../view/add_face_mode";
import { scene } from "../view/visual";
import { clear_intersections, update_intersections } from "../view/intersections";

let sphere_geom = new THREE.SphereGeometry(0.04);
let control_point_material = new THREE.MeshBasicMaterial({ color: 0xF3752B });

/** @type {THREE.Object3D} */
let edit_point = null;

let layer_height_before_edit = 0;

export function start_changing_height() {
  set_edit_mode(EditMode.change_layer_bottom);
  clear_intersections();
  params.control_points_visible = false;
  set_control_points_visibility(false);

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
}

export function cancel_height_change() {
  set_level_bottom(params.current_level, layer_height_before_edit);
  exit_mode();
}