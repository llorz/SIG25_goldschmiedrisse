import { TransformControls } from 'three/addons/controls/TransformControls.js';

import { get_active_camera, scene } from '../view/visual.js';
import { outlinePass, mode, Mode } from '../view/visual.js';
import { disable_controls, enable_controls } from '../view/visual.js';

import { edit_mode, EditMode, set_edit_mode, pending_curve, add_curve } from '../state/state.js';

import * as THREE from 'three';
import { Curve } from '../geom/curve.js';

let non_selectable_objects_names = ["center_circle", "designing_area"];

const ray_cast = new THREE.Raycaster();

let point_down_location = new THREE.Vector2();
let selected_obj = null;
let is_mouse_down = false;
const canvas = document.getElementById("canvas");

function get_pointer_location(event) {
  let rect = canvas.getBoundingClientRect();
  let x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  let y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  return new THREE.Vector2(x, y);
}

function find_intersections(pointer_location) {
  ray_cast.setFromCamera(pointer_location, get_active_camera());
  return ray_cast.intersectObjects(scene.children);
}

canvas.onpointerdown = (e) => {
  point_down_location = get_pointer_location(e);
  is_mouse_down = true;
  let intersections = find_intersections(point_down_location);
  // Check for selection.
  if (edit_mode == EditMode.none) {
    selected_obj = null;
    for (let intersection of intersections) {
      if (non_selectable_objects_names.indexOf(intersection.object.name) != -1)
        continue;
      selected_obj = intersection.object;
      outlinePass.selectedObjects = [selected_obj];
      break;
    }
  }
  // Object was selected, nothing to do.
  if (selected_obj) {
    disable_controls();
    if (selected_obj.type == "control_point" && edit_mode == EditMode.none && mode == Mode.top_view) {
      set_edit_mode(EditMode.move_control_point);
    }
    return;
  }

  let flat_point = new THREE.Vector3(ray_cast.ray.origin.x, 0, ray_cast.ray.origin.z);
  if (mode == Mode.top_view) {
    if (edit_mode == EditMode.none) {
      add_curve(flat_point);
    } else if (edit_mode == EditMode.new_curve) {
      pending_curve.add_new_segment(flat_point);
    }
  }
};
canvas.onpointerup = (e) => {
  is_mouse_down = false;
  enable_controls();
  if (edit_mode == EditMode.move_control_point) {
    set_edit_mode(EditMode.none);
    selected_obj = null;
  }
};
canvas.onpointermove = (e) => {
  let pointer_location = get_pointer_location(e);
  let intersections = find_intersections(pointer_location);
  if (!is_mouse_down) {
    // Highlight the hovered object.
    outlinePass.selectedObjects = [];
    if (intersections.length > 0) {
      if (non_selectable_objects_names.indexOf(intersections[0].object.name) == -1) {
        outlinePass.selectedObjects = [intersections[0].object];
      }
    }
  }

  let flat_point = new THREE.Vector3(ray_cast.ray.origin.x, 0, ray_cast.ray.origin.z);

  if (edit_mode == EditMode.new_curve) {
    let p = pending_curve.closest_point(flat_point);
    if (p.distanceTo(flat_point) < 0.02) {
      flat_point = p;
    }
    pending_curve.move_last_point(flat_point);
  } else if (edit_mode == EditMode.move_control_point
    && selected_obj && selected_obj.type == "control_point") {
    let p = selected_obj.userData.closest_point(flat_point);
    if (p.distanceTo(flat_point) < 0.02) {
      flat_point = p;
    }
    selected_obj.userData.move_control_point(selected_obj, flat_point);
  }

};