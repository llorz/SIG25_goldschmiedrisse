import { params } from "../state/params";
import { curves, EditMode, get_level_bottom, recon_curves, set_control_points_visibility, set_edit_mode, udpated_layer_bottom } from "../state/state";
import { clamp01 } from "../utils/math_funcs";
import { clear_all_intersection_points } from "../view/add_face_mode";
import { Curve } from "../view/curve";
import { clear_intersections, update_intersections } from "../view/intersections";
import { ReconstructedThreeBiArcCurve } from "../view/reconstructed_three_biarc_curve";
import { scene, set_designing_area_height } from "../view/visual";
import { clear_selected_obj, selected_obj } from "./mouse";
import * as THREE from "three";

let sphere_geom = new THREE.SphereGeometry(0.01);
let control_point_material = new THREE.MeshBasicMaterial({ color: 0x6a0dad });


/** @type {Curve} */
let edited_curve = null;
/** @type {ReconstructedThreeBiArcCurve} */
let edited_recon_curve = null;

let height_before_edit;

/** @type {THREE.Object3D} */
let edit_point = null;



export function edit_vertical_line_top() {
  if (!selected_obj || !selected_obj.type == "unit_curve")
    return;
  // A bit hacky but whatever.
  edited_curve = selected_obj.userData;
  let curve_ind = curves.indexOf(edited_curve);
  edited_recon_curve = recon_curves[curve_ind];

  set_edit_mode(EditMode.edit_vertical_line_top);
  clear_intersections();
  params.control_points_visible = false;
  set_control_points_visibility(false);
  clear_selected_obj();

  if (edited_curve.vertical_line_top == 0) {
    edited_curve.vertical_line_top = edited_curve.height;
  }
  height_before_edit = edited_curve.vertical_line_top;

  edit_point = new THREE.Mesh(sphere_geom, control_point_material);
  edit_point.position.copy(edited_curve.arc_curve.getPoint(1));
  edit_point.position.y = height_before_edit;
  edit_point.type = "vertical_line_top";
  scene.add(edit_point);

  edited_curve.update_curve();
}


function exit_mode() {
  set_edit_mode(EditMode.none);
  params.control_points_visible = true;
  set_control_points_visibility(true);
  scene.remove(edit_point);
  edit_point = null;
  update_intersections();
  set_designing_area_height(get_level_bottom(params.current_level));
}

export function cancel_edit_vertical_line_top() {
  if (!edited_curve)
    return;
  edited_curve.vertical_line_top = height_before_edit;
  edited_curve.update_curve();
  edited_curve = null;
  scene.remove(edit_point);
  edit_point = null;
  exit_mode();
}

export function remove_vertical_line() {
  edited_curve.vertical_line_top = 0;
  edited_curve.update_curve();
  edited_curve = null;
  scene.remove(edit_point);
  edit_point = null;
  exit_mode();
}

export function move_vertical_line_top(ray_cast) {
  if (!edited_curve)
    return;
  // Construct the intersection plane.
  let plane = new THREE.Plane();
  let pt = edited_curve.arc_curve.getPoint(1);
  let normal = ray_cast.ray.direction.clone();
  normal.y = 0;
  normal.normalize();
  plane.setFromNormalAndCoplanarPoint(normal, pt);
  let intersection = new THREE.Vector3();
  ray_cast.ray.intersectPlane(plane, intersection);

  // Change in arc length param.
  let y = intersection.y;
  edited_curve.vertical_line_top = y;
  edit_point.position.y = y;

  edited_curve.update_curve();
}

export function accept_edit_vertical_line_top() {
  if (!edited_curve)
    return;
  edited_curve.update_curve();
  edited_curve = null;
  edited_recon_curve = null;
  scene.remove(edit_point);
  edit_point = null;
  exit_mode();
}
