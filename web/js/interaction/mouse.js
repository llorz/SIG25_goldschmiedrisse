import { TransformControls } from 'three/addons/controls/TransformControls.js';

import { camera2d, get_active_camera, scene, selectedOutlinePass } from '../view/visual.js';
import { outlinePass } from '../view/visual.js';
import { mode, Mode, reconstruct_surfaces } from '../state/state.js';
import { disable_controls, enable_controls } from '../view/visual.js';

import { edit_mode, EditMode, set_edit_mode, pending_curve, add_curve } from '../state/state.js';

import * as THREE from 'three';
import { Curve } from '../geom/curve.js';

let non_selectable_objects_names = ["center_circle", "designing_area"];
let non_selectable_types = ["ns_line", "ns_point", "reconstructed_surface"];

let plane_y0 = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

function is_selectable(obj) {
  return !!obj && (non_selectable_types.indexOf(obj.type) == -1
    && non_selectable_objects_names.indexOf(obj.name) == -1)
    && obj.visible;
}

const ray_cast = new THREE.Raycaster();

let point_down_location = new THREE.Vector2();
let selected_obj = null;
let deselect_obj = false;
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

function find_selected(pointer_location, print_stuff) {
  let intersections = find_intersections(point_down_location);
  // Check for selection.
  for (let intersection of intersections) {
    if (!is_selectable(intersection.object)) {
      continue;
    }
    return intersection.object;
  }
  return null;
}

canvas.onpointerdown = (e) => {
  point_down_location = get_pointer_location(e);
  is_mouse_down = true;
  deselect_obj = false;
  // Check for selection.
  if (edit_mode == EditMode.none) {
    selected_obj = find_selected(point_down_location, false);
    if (selected_obj) {
      outlinePass.selectedObjects = [];
      selectedOutlinePass.selectedObjects = [selected_obj];
    } else {
      if (selectedOutlinePass.selectedObjects.length > 0) {
        deselect_obj = true;
      }
      outlinePass.selectedObjects = [];
      selectedOutlinePass.selectedObjects = [];
    }
  }
  // Object was selected, nothing to do.
  if (selected_obj) {
    disable_controls();
    if (selected_obj.type == "control_point") {
      set_edit_mode(EditMode.move_control_point);
    } else if (selected_obj.type == "height_control_point") {
      set_edit_mode(EditMode.move_height_control_point);
    } else if (selected_obj.type == "tangent_control_point") {
      set_edit_mode(EditMode.move_tangent_control_point);
    }
    return;
  }
};
canvas.onpointerup = (e) => {
  let loc = get_pointer_location(e);
  is_mouse_down = false;
  let current_select = find_selected(loc, true);
  enable_controls();
  // Stop moving control points.
  if (edit_mode == EditMode.move_control_point
    || edit_mode == EditMode.move_height_control_point
    || edit_mode == EditMode.move_tangent_control_point) {
    set_edit_mode(EditMode.none);
    if (current_select != selected_obj) {
      selected_obj = null;
      selectedOutlinePass.selectedObjects = [];
    }
  } else if (!deselect_obj
    && loc.distanceTo(point_down_location) < 0.02
    && mode == Mode.orthographic
    && Math.abs(ray_cast.ray.direction.x) < 1e-4 && Math.abs(ray_cast.ray.direction.z) < 1e-4) {
    let flat_point = new THREE.Vector3();
    ray_cast.ray.intersectPlane(plane_y0, flat_point);
    if (edit_mode == EditMode.none) {
      add_curve(flat_point);
    } else if (edit_mode == EditMode.new_curve) {
      pending_curve.add_new_segment(flat_point);
    }
  }
};

canvas.onpointermove = (e) => {
  let pointer_location = get_pointer_location(e);
  let intersections = find_intersections(pointer_location);
  if (!is_mouse_down) {
    // Highlight the hovered object.
    outlinePass.selectedObjects = [];
    for (let intersection of intersections) {
      if (is_selectable(intersection.object)) {
        outlinePass.selectedObjects = [intersection.object];
        break;
      }
    }
  }

  let flat_point = new THREE.Vector3();
  ray_cast.ray.intersectPlane(plane_y0, flat_point);

  if (edit_mode == EditMode.new_curve) {
    // Add new point in a curve.
    let p = pending_curve.closest_point(flat_point);
    if (p.distanceTo(flat_point) < 0.02) {
      flat_point = p;
    }
    pending_curve.move_last_point(flat_point);
  } else if (edit_mode == EditMode.move_control_point
    && selected_obj && selected_obj.type == "control_point") {
    // Move a control point.
    if (mode == Mode.perspective) {
      ray_cast.ray.intersectPlane(plane_y0, flat_point);
    }
    let p = selected_obj.userData.closest_point(flat_point);
    if (p.distanceTo(flat_point) < 0.02) {
      flat_point = p;
    }
    selected_obj.userData.move_control_point(selected_obj, flat_point);
  } else if (edit_mode == EditMode.move_height_control_point
    // && mode == Mode.perspective
    && selected_obj && selected_obj.type == "height_control_point") {
    // Move a height control point.
    let plane = new THREE.Plane();
    plane.setFromNormalAndCoplanarPoint(ray_cast.ray.direction, selected_obj.position);
    ray_cast.ray.intersectPlane(plane, flat_point);
    selected_obj.userData.move_control_point(selected_obj, flat_point);
    reconstruct_surfaces();
  } else if (edit_mode == EditMode.move_tangent_control_point
    // && mode == Mode.perspective
    && selected_obj && selected_obj.type == "tangent_control_point") {
    // Move a tangent control point.
    let plane = new THREE.Plane();
    let n = selected_obj.userData.getControlPointNormal(selected_obj);
    plane.setFromNormalAndCoplanarPoint(n, selected_obj.position);
    ray_cast.ray.intersectPlane(plane, flat_point);
    selected_obj.userData.move_tangent_control_point(selected_obj, flat_point);
    reconstruct_surfaces();
  }


};