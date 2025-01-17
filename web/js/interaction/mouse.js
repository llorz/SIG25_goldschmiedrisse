import { TransformControls } from 'three/addons/controls/TransformControls.js';

import { camera2d, get_active_camera, scene, selectedOutlinePass } from '../view/visual.js';
import { outlinePass } from '../view/visual.js';
import { curves, finish_curve, get_level_bottom, mode, Mode, recon_curves, reconstruct_biarcs } from '../state/state.js';
import { disable_controls, enable_controls } from '../view/visual.js';

import { edit_mode, EditMode, set_edit_mode, pending_curve, add_curve } from '../state/state.js';

import * as THREE from 'three';
import { Curve } from '../view/curve.js';
import { closest_rotation_line, get_snapping_point } from '../utils/snapping.js';
import { add_new_face_vertex, remove_new_face_vertex } from '../view/add_face_mode.js';
import { move_decoration_point } from './edit_decoration_point.js';
import { move_layer_height } from './change_layer_height.js';
import { move_prc_point } from './set_prc.js';
import { move_vertical_line_top } from './add_vertical_line.js';
import { edit_background_image_scale, init_scale } from './scale_background_image.js';

let non_selectable_objects_names = ["center_circle", "designing_area", "background_image"];
let non_selectable_types = ["ns_line", "ns_point", "reconstructed_surface"];

let plane_y0 = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

function is_selectable(obj) {
  return !!obj && (non_selectable_types.indexOf(obj.type) == -1
    && non_selectable_objects_names.indexOf(obj.name) == -1)
    && obj.visible;
}

export const ray_cast = new THREE.Raycaster();

let point_down_location = new THREE.Vector2();
export let selected_obj = null;
export function clear_selected_obj() {
  selected_obj = null;
  selectedOutlinePass.selectedObjects = [];
}
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
    } else if (selected_obj.type == "intersection_point") {
      curves[selected_obj.userData.i1].prc_t = selected_obj.userData.t1;
      recon_curves[selected_obj.userData.i1].curve.set_middle_height(
        recon_curves[selected_obj.userData.i1].curve.middle_height);

      curves[selected_obj.userData.i2].prc_t = selected_obj.userData.t2;
      recon_curves[selected_obj.userData.i2].curve.set_middle_height(
        recon_curves[selected_obj.userData.i1].curve.middle_height);
      reconstruct_biarcs();
    }
    return;
  }
  if (edit_mode == EditMode.new_face) {
    let obj = find_selected(point_down_location, false);
    if (obj && obj.type == "intersection_point") {
      let ind = selectedOutlinePass.selectedObjects.indexOf(obj);
      if (ind != -1) {
        selectedOutlinePass.selectedObjects.splice(ind, 1);
        remove_new_face_vertex(obj.userData);
      } else {
        add_new_face_vertex(obj.userData);
        selectedOutlinePass.selectedObjects.push(obj);
      }
    }
  } else if (edit_mode == EditMode.edit_decoration_point) {
    let obj = find_selected(point_down_location, false);
    if (obj && obj.type == "decoration_point") {
      disable_controls();
      selected_obj = obj;
    }
  } else if (edit_mode == EditMode.edit_prc_point) {
    let obj = find_selected(point_down_location, false);
    if (obj && obj.type == "prc_point") {
      disable_controls();
      selected_obj = obj;
    }
  } else if (edit_mode == EditMode.edit_vertical_line_top) {
    let obj = find_selected(point_down_location, false);
    if (obj && obj.type == "vertical_line_top") {
      disable_controls();
      selected_obj = obj;
    }
  } else if (edit_mode == EditMode.change_layer_bottom) {
    let obj = find_selected(point_down_location, false);
    if (obj && obj.type == "layer_bottom") {
      disable_controls();
      selected_obj = obj;
    }
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
  } else if (selected_obj && selected_obj.type == "unit_curve") {

  } else if (!deselect_obj
    && loc.distanceTo(point_down_location) < 0.02
    && mode == Mode.orthographic
    && Math.abs(ray_cast.ray.direction.x) < 1e-4 && Math.abs(ray_cast.ray.direction.z) < 1e-4) {
    let flat_point = new THREE.Vector3();
    let intersection_plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -get_level_bottom());
    ray_cast.ray.intersectPlane(intersection_plane, flat_point);
    // let closest = closest_rotation_line(flat_point);
    // if (flat_point.distanceTo(closest) < 0.02) {
    //   flat_point = closest;
    // }
    let closest = get_snapping_point(flat_point, pending_curve);
    if (closest) {
      flat_point = closest;
    }
    if (edit_mode == EditMode.none) {
      add_curve(flat_point);
    } else if (edit_mode == EditMode.new_curve) {
      pending_curve.add_new_segment(flat_point);
      if (pending_curve.control_points.length > 6)
        finish_curve();
    }
  } else if (edit_mode == EditMode.edit_decoration_point) {
    if (current_select != selected_obj) {
      selected_obj = null;
      selectedOutlinePass.selectedObjects = [];
    }
  } else if (edit_mode == EditMode.edit_prc_point ||
    edit_mode == EditMode.edit_vertical_line_top ||
    edit_mode == EditMode.change_layer_bottom
  ) {
    selected_obj = null;
    selectedOutlinePass.selectedObjects = [];
  }
};

canvas.onpointermove = (e) => {
  let pointer_location = get_pointer_location(e);
  if (edit_mode == EditMode.start_scale_background_image) {
    let flat_point = new THREE.Vector3();
  ray_cast.setFromCamera(pointer_location, get_active_camera());
  let intersection_plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  ray_cast.ray.intersectPlane(intersection_plane, flat_point);
    init_scale(flat_point);
    return;
  } else if (edit_mode == EditMode.scale_background_image) {
    ray_cast.setFromCamera(pointer_location, get_active_camera());
    edit_background_image_scale(ray_cast);
  }

  if (!is_mouse_down) {
    let intersections = find_intersections(pointer_location);
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
  ray_cast.setFromCamera(pointer_location, get_active_camera());
  let intersection_plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -get_level_bottom());
  ray_cast.ray.intersectPlane(intersection_plane, flat_point);

  if (edit_mode == EditMode.new_curve) {
    // Add new point in a curve.
    let closest = get_snapping_point(flat_point, pending_curve);
    if (closest) {
      flat_point = closest;
    }
    pending_curve.move_last_point(flat_point);
  } else if (edit_mode == EditMode.move_control_point
    && selected_obj && selected_obj.type == "control_point") {
    // Move a control point.
    if (mode == Mode.perspective) {
      let intersection_plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -get_level_bottom());
      ray_cast.ray.intersectPlane(intersection_plane, flat_point);
    }
    let closest = get_snapping_point(flat_point, selected_obj.userData);
    if (closest) {
      flat_point = closest;
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
    // reconstruct_surfaces();
  } else if (edit_mode == EditMode.move_tangent_control_point
    // && mode == Mode.perspective
    && selected_obj && selected_obj.type == "tangent_control_point") {
    // Move a tangent control point.
    let plane = new THREE.Plane();
    let n = selected_obj.userData.getControlPointNormal(selected_obj);
    plane.setFromNormalAndCoplanarPoint(n, selected_obj.position);
    ray_cast.ray.intersectPlane(plane, flat_point);
    selected_obj.userData.move_tangent_control_point(selected_obj, flat_point);
  } else if (edit_mode == EditMode.edit_decoration_point && selected_obj) {
    move_decoration_point(ray_cast);
  } else if (edit_mode == EditMode.edit_prc_point && selected_obj) {
    move_prc_point(ray_cast);
  } else if (edit_mode == EditMode.edit_vertical_line_top && selected_obj) {
    move_vertical_line_top(ray_cast);
  } else if (edit_mode == EditMode.change_layer_bottom && selected_obj) {
    move_layer_height(ray_cast);
  }
};