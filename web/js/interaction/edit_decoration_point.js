import { params } from "../state/params";
import { EditMode, set_control_points_visibility, set_edit_mode } from "../state/state";
import { clear_all_intersection_points } from "../view/add_face_mode";
import { Curve } from "../view/curve";
import { update_intersections } from "../view/intersections";
import { scene } from "../view/visual";
import { clear_selected_obj, selected_obj } from "./mouse";
import * as THREE from "three";

let sphere_geom = new THREE.SphereGeometry(0.01);
let control_point_material = new THREE.MeshBasicMaterial({ color: 0x6a0dad });

/** @type {Curve} */
let edited_curve = null;

let t_before_edit, height_before_edit;

/** @type {THREE.Object3D} */
let edit_point = null;

export function edit_decoration_point() {
  if (!selected_obj || !selected_obj.type == "unit_curve")
    return;
  edited_curve = selected_obj.userData;
  set_edit_mode(EditMode.edit_decoration_point);
  clear_all_intersection_points();
  params.control_points_visible = false;
  set_control_points_visibility(false);
  clear_selected_obj();

  t_before_edit = edited_curve.decoration_t;
  height_before_edit = edited_curve.decoration_height;

  if (edited_curve.decoration_t == 0) {
    edited_curve.decoration_t = edited_curve.prc_t * 0.5;
    edited_curve.decoration_height = edited_curve.decoration_t * edited_curve.arc_curve.length();
  }

  edit_point = new THREE.Mesh(sphere_geom, control_point_material);
  edit_point.position.copy(edited_curve.arc_curve.getPoint(edited_curve.decoration_t));
  edit_point.position.y = edited_curve.decoration_height;
  edit_point.type = "decoration_point";
  scene.add(edit_point);

  edited_curve.update_curve();
}

function exit_mode() {
  set_edit_mode(EditMode.none);
  params.control_points_visible = true;
  set_control_points_visibility(true);
  update_intersections();
}

export function move_decoration_point(ray_cast) {
  if (!edited_curve)
    return;
  // Construct the intersection plane.
  let t = edited_curve.decoration_t;
  let plane = new THREE.Plane();
  let pt = edited_curve.arc_curve.getPoint(t);
  let normal = edited_curve.arc_curve.getNormal(t);
  let tangent = edited_curve.arc_curve.getTangent(t);
  plane.setFromNormalAndCoplanarPoint(normal, pt);
  let intersection = new THREE.Vector3();
  ray_cast.ray.intersectPlane(plane, intersection);

  // Change in arc length param.
  let y = intersection.y;
  intersection.y = 0;
  let ds = (intersection.sub(pt)).dot(tangent);
  edited_curve.decoration_t += ds / edited_curve.arc_curve.length();
  edited_curve.decoration_height = y;
  edit_point.position.copy(edited_curve.arc_curve.getPoint(edited_curve.decoration_t));
  edit_point.position.y = edited_curve.decoration_height;

  edited_curve.update_curve();
}

export function cancel_edit_decoration_point() {
  if (!edited_curve)
    return;
  edited_curve.decoration_t = t_before_edit;
  edited_curve.decoration_height = height_before_edit;
  edited_curve.update_curve();
  edited_curve = null;
  scene.remove(edit_point);
  edit_point = null;
  exit_mode();
}

export function delete_decoration_point() {
  if (!edited_curve)
    return;
  edited_curve.decoration_t = 0;
  edited_curve.update_curve();
  edited_curve = null;
  scene.remove(edit_point);
  edit_point = null;
  exit_mode();
}

export function accept_edit_decoration_point() {
  if (!edited_curve)
    return;
  edited_curve.update_curve();
  edited_curve = null;
  scene.remove(edit_point);
  edit_point = null;
  exit_mode();
}