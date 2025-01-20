import * as THREE from "three";
import { params } from "../state/params";
import { curves } from "../state/state";
import { get_reflection_mat, get_rotation_mat } from "./intersect";

export function closest_rotation_line(p) {
  let rot_sym = params.rotation_symmetry;
  if (params.rotation_symmetry % 2 == 0) {
    rot_sym *= 2;
  }
  let angle = Math.atan2(p.z, p.x);
  let rot = Math.round((angle - Math.PI / 2) / (2 * Math.PI / rot_sym));
  let len = Math.sqrt(p.x * p.x + p.z * p.z);
  let closest_ang = rot * 2 * Math.PI / rot_sym + Math.PI / 2;
  let closest_p = new THREE.Vector3(len * Math.cos(closest_ang), p.y, len * Math.sin(closest_ang));

  let angle2 = Math.atan2(-p.z, -p.x);
  let rot2 = Math.round((angle2 - Math.PI / 2) / (2 * Math.PI / rot_sym));
  let closest_ang2 = rot2 * 2 * Math.PI / rot_sym + Math.PI / 2;
  let closest_p2 = new THREE.Vector3(len * Math.cos(closest_ang2 + Math.PI), p.y, len * Math.sin(closest_ang2 + Math.PI));
  if (closest_p.distanceTo(p) < closest_p2.distanceTo(p)) {
    return closest_p;
  }
  return closest_p2;
}

export function closest_control_point(p, skip_curve) {
  let flat_p = new THREE.Vector3(p.x, 0,  p.z);
  let closest_dist = 1e9, closest_point = null;
  let check_and_update = (cp) => {
    let dist = flat_p.distanceTo(cp);
    if (dist < closest_dist) {
      closest_dist = dist;
      closest_point = new THREE.Vector3(cp.x, p.y, cp.z);
    }
  };
  for (let curve of curves) {
    if (curve == skip_curve) {
      continue;
    }
    let ref_mat = get_reflection_mat(curve.ref_symmetry_point);
    for (let rot = 0; rot < curve.rotation_symmetry; rot++) {
      let rot_mat = get_rotation_mat(curve.rotation_symmetry, rot);
      // First control point.
      let cp0 = new THREE.Vector3(curve.control_points[0].x, 0, curve.control_points[0].z);
      check_and_update(cp0.clone().applyMatrix4(rot_mat));
      check_and_update(cp0.clone().applyMatrix4(ref_mat).applyMatrix4(rot_mat));

      let cp1 = new THREE.Vector3(curve.control_points[2].x, 0, curve.control_points[2].z);
      check_and_update(cp1.clone().applyMatrix4(rot_mat));
      check_and_update(cp1.clone().applyMatrix4(ref_mat).applyMatrix4(rot_mat));
    }
  }
  return closest_point;
}

export function get_snapping_point(p, skip_curve = null, eps = 0.02) {
  if (Math.sqrt(p.x * p.x + p.z * p.z) < eps) {
    return new THREE.Vector3(0, p.y, 0);
  }
  let closest_p = closest_control_point(p, skip_curve);
  if (!!closest_p && closest_p.distanceTo(p) < eps) {
    return closest_p;
  }
  let closest_control_line_point = closest_rotation_line(p);
  if (closest_control_line_point.distanceTo(p) < eps) {
    return closest_control_line_point;
  }
  return null;
}