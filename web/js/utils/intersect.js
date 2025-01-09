import * as THREE from 'three';
import { Curve } from '../view/curve';
import { ArcCurve } from '../geom/arc_curve';

export function line_line_intersect(p1, d1, p2, d2) {
  let denom = -d1.x * d2.y + d2.x * d1.y;
  if (Math.abs(denom) < 1e-5) {
    return null;
  }
  let t = (d2.y * (p1.x - p2.x) - d2.x * (p1.y - p2.y)) / denom;
  let u = (d1.y * (p1.x - p2.x) - d1.x * (p1.y - p2.y)) / denom;
  // if (t > 1 || t < 0 || u > 1 || u < 0) { return null; }
  return [t, u];
}

export function line_line_segment_intersect(p1, d1, p2, d2) {
  let denom = -d1.x * d2.y + d2.x * d1.y;
  if (Math.abs(denom) < 1e-5) {
    return [];
  }
  let t = (d2.y * (p1.x - p2.x) - d2.x * (p1.y - p2.y)) / denom;
  let u = (d1.y * (p1.x - p2.x) - d1.x * (p1.y - p2.y)) / denom;
  if (t > 1 || t < 0 || u > 1 || u < 0) { return []; }
  // return new THREE.Vector2(p1.x + t * d1.x, p1.y + t * d1.y);
  return [[t, u]];
}

export class Arc {
  constructor(center, radius, angle_0, angle_1) {
    this.center = center;
    this.radius = radius;
    this.angle_0 = angle_0;
    this.angle_1 = angle_1;
  }

  find_t_for_point(p) {
    // ang(t) = angle_0 * (1-t) + angle_1 * t
    // p(t) = center + radius * [cos(ang(t)), sin(ang(t))].

    let angle = Math.atan2(p.y - this.center.y, p.x - this.center.x);
    if (angle < this.angle_0 && angle < this.angle_1) {
      angle += 2 * Math.PI;
    } else if (angle > this.angle_0 && angle > this.angle_1) {
      angle -= 2 * Math.PI;
    }
    let t = (angle - this.angle_0) / (this.angle_1 - this.angle_0);
    return t;
  }
}

/**
 * @param {Arc} arc1 
 * @param {Arc} arc2 
 */
export function arc_arc_intersect(arc1, arc2) {
  let center_vec = arc2.center.clone().sub(arc1.center);
  let center_dist = arc1.center.distanceTo(arc2.center);
  if (center_dist > arc1.radius + arc2.radius) {
    return [];
  }
  let cos_ang = (arc2.radius * arc2.radius - arc1.radius * arc1.radius - center_dist * center_dist) /
    (-2 * arc1.radius * center_dist);
  let sin_ang = Math.sqrt(1 - cos_ang * cos_ang);

  let p1 = new THREE.Vector2(center_vec.x * cos_ang - center_vec.y * sin_ang,
    center_vec.x * sin_ang + center_vec.y * cos_ang).normalize()
    .multiplyScalar(arc1.radius).add(arc1.center);
  let p2 = new THREE.Vector2(center_vec.x * cos_ang + center_vec.y * sin_ang,
    -center_vec.x * sin_ang + center_vec.y * cos_ang).normalize()
    .multiplyScalar(arc1.radius).add(arc1.center);

  let res = [];
  let t1 = arc1.find_t_for_point(p1), s1 = arc2.find_t_for_point(p1);
  if (t1 >= 0 && t1 <= 1 && s1 >= 0 && s1 <= 1) {
    res.push([t1, s1]);
  }
  let t2 = arc1.find_t_for_point(p2), s2 = arc2.find_t_for_point(p2);
  if (t2 >= 0 && t2 <= 1 && s2 >= 0 && s2 <= 1) {
    res.push([t2, s2]);
  }
  return res;
}

/**
 * 
 * @param {THREE.Vector2} p1 
 * @param {THREE.Vector2} p2 
 * @param {Arc} arc 
 */
export function line_segment_arc_intersection(p1, p2, arc) {
  let d = p2.clone().sub(p1);
  let normal = new THREE.Vector2(-d.y, d.x).normalize();
  let p1_center = p1.clone().sub(arc.center);
  let h = normal.clone().multiplyScalar(p1_center.dot(normal));
  if (h.length() > arc.radius) {
    return [];
  }
  let seg_len = Math.sqrt(arc.radius * arc.radius - h.lengthSq());
  let p = arc.center.clone().add(h);
  // Two possible intersection points.
  let inter1 = p.clone().add(d.clone().normalize().multiplyScalar(seg_len));
  let inter2 = p.clone().sub(d.clone().normalize().multiplyScalar(seg_len));

  let t1 = (inter1.clone().sub(p1).dot(d)) / d.lengthSq(), s1 = arc.find_t_for_point(inter1);
  let t2 = (inter2.clone().sub(p1).dot(d)) / d.lengthSq(), s2 = arc.find_t_for_point(inter2);
  let res = [];
  if (t1 >= 0 && t1 <= 1 && s1 >= 0 && s1 <= 1) {
    res.push([t1, s1]);
  }
  if (t2 >= 0 && t2 <= 1 && s2 >= 0 && s2 <= 1) {
    res.push([t2, s2]);
  }
  return res;
}

export function get_reflection_mat(ref_symmetry_point) {
  let x = ref_symmetry_point.x, y = ref_symmetry_point.y, z = ref_symmetry_point.z;
  let norm = Math.sqrt(x * x + y * y + z * z);
  x /= norm; y /= norm; z /= norm;
  let mat = new THREE.Matrix4().set
    (2 * x * x - 1, 2 * x * y, 2 * x * z, 0,
      2 * y * x, 2 * y * y - 1, 2 * y * z, 0,
      2 * z * x, 2 * z * y, 2 * z * z - 1, 0,
      0, 0, 0, 1);
  return mat;
}

export function get_rotation_mat(rotation_symmetry) {
  let mat = new THREE.Matrix4();
  mat.makeRotationY(2 * Math.PI / rotation_symmetry);
  return mat;
}

/**
 * 
 * @param {Curve} curve 
 * @param {*} resolution 
 * @returns 
 */
export function self_sym_intersections(curve, resolution = 200) {
  let rotation_symmetry = curve.rotation_symmetry;
  let ref_symmetry_point = curve.ref_symmetry_point;

  let p0 = curve.arc_curve.getPoint(0);
  let p1 = curve.arc_curve.getPoint(1);
  let intersections_t = [];
  for (let i = 1; i < resolution; i++) {
    let t = i / resolution;
    let p = curve.arc_curve.getPoint(t);
    // Skip points too close to the endpoints.
    if (p1.distanceTo(p) < 1e-1 || p0.distanceTo(p) < 1e-1 ||
      (intersections_t.length > 0 &&
        curve.arc_curve.getPoint(intersections_t[intersections_t.length - 1]).distanceTo(p) < 1e-1))
      continue;
    let rot_mat = get_rotation_mat(rotation_symmetry);
    let accum_rot_mat = new THREE.Matrix4().identity();
    let ref_mat = (!!ref_symmetry_point ? get_reflection_mat(ref_symmetry_point) : null);
    for (let rot = 0; rot < rotation_symmetry; rot++) {
      if (rot > 0) {
        let p_r = p.clone().applyMatrix4(accum_rot_mat);
        if (p_r.distanceTo(p) < 1e-2)
          intersections_t.push(t);
      }
      if (!!ref_mat) {
        let p_ref = p.clone().applyMatrix4(ref_mat).applyMatrix4(accum_rot_mat);
        if (p_ref.distanceTo(p) < 1e-2)
          intersections_t.push(t);
      }
      accum_rot_mat.multiply(rot_mat);
    }
  }
  return intersections_t;
}

/**
 * 
 * @param {Curve} curve1 
 * @param {Curve} curve2 
 * @param {number} resolution 
 * @returns 
 */
export function curves_intersection(curve1, curve2, resolution = 100) {
  let intersections_t = [];
  let rot_mat1 = get_rotation_mat(curve1.rotation_symmetry);
  let rot_mat2 = get_rotation_mat(curve2.rotation_symmetry);
  let ref_mat1 = get_reflection_mat(curve1.ref_symmetry_point);
  let ref_mat2 = get_reflection_mat(curve2.ref_symmetry_point);

  for (let i = 1; i < resolution; i++) {
    let t = i / resolution;
    if (intersections_t.length > 0 && Math.abs(t - intersections_t[intersections_t.length - 1][0]) < 1e-1)
      continue;
    let p = curve1.arc_curve.getPoint(t);
    let ref_p1 = p.clone().applyMatrix4(ref_mat1);
    let found_for_t = false;
    for (let j = 1; j < resolution && !found_for_t; j++) {
      let t2 = j / resolution;
      let p2 = curve2.arc_curve.getPoint(t2);
      let ref_p2 = p2.clone().applyMatrix4(ref_mat2);
      // Check all rotations of the curves.
      for (let r1 = 0; r1 < curve1.rotation_symmetry && !found_for_t; r1++) {
        for (let r2 = 0; r2 < curve2.rotation_symmetry && !found_for_t; r2++) {
          // Check if the points are close to each other.
          if (p.distanceTo(p2) < 1e-2) {
            // ref_p1.distanceTo(p2) < 1e-2 ||
            // ref_p1.distanceTo(ref_p2) < 1e-2 ||
            // p.distanceTo(ref_p2) < 1e-2) {
            intersections_t.push([t, t2]);
            found_for_t = true;
            continue;
          }
          p2.applyMatrix4(rot_mat2);
          ref_p2.applyMatrix4(rot_mat2);
        }
        p.applyMatrix4(rot_mat1);
        ref_p1.applyMatrix4(rot_mat1);
      }

    }
  }
  return intersections_t;
}

function not_endpoint(t) {
  return t > 1e-2 && t < 1 - 1e-2;
}

/**
 * 
 * @param {Curve} curve 
 */
export function analytic_self_intersection(curve) {
  let rot_mat = get_rotation_mat(curve.rotation_symmetry);
  let accum_rot_mat = new THREE.Matrix4().identity();
  let ref_mat = (!!curve.ref_symmetry_point ?
    get_reflection_mat(curve.ref_symmetry_point) : null);

  let intersections_t = [];
  for (let rot = 0; rot < curve.rotation_symmetry; rot++) {
    if (rot > 0) {
      // let pts = curve.arc_curve.apply_3d_transformation(accum_rot_mat);
      // let other_arc_curve = new ArcCurve(pts);
      let other_arc_curve = curve.arc_curve.apply_3d_transformation(accum_rot_mat);
      let inters = curve.arc_curve.intersect(other_arc_curve);
      for (let inter of inters) {
        if (not_endpoint(inter[0]) && Math.abs(inter[0] - inter[1]) < 1e-2)
          intersections_t.push(inter[0]);
      }
    }
    if (!!ref_mat) {
      // let pts = curve.arc_curve.points.map(p =>
      //   new THREE.Vector3(p.x, 0, p.y).applyMatrix4(ref_mat).applyMatrix4(accum_rot_mat));
      // let other_arc_curve = new ArcCurve(pts);
      let other_arc_curve = curve.arc_curve.apply_3d_transformation(accum_rot_mat.clone().multiply(ref_mat));
      let inters = curve.arc_curve.intersect(other_arc_curve);
      for (let inter of inters) {
        if (not_endpoint(inter[0]) && Math.abs(inter[0] - inter[1]) < 1e-2)
          intersections_t.push(inter[0]);
      }
    }
    accum_rot_mat.multiply(rot_mat);
  }
  return intersections_t;
}

/**
 * 
 * @param {Curve} curve1 
 * @param {Curve} curve2 
 * @param {number} resolution 
 * @returns 
 */
export function analytic_curves_intersection(curve1, curve2) {
  let intersections_t = [];
  let rot_mat1 = get_rotation_mat(curve1.rotation_symmetry);
  let rot_mat2 = get_rotation_mat(curve2.rotation_symmetry);
  let ref_mat1 = get_reflection_mat(curve1.ref_symmetry_point);
  let ref_mat2 = get_reflection_mat(curve2.ref_symmetry_point);
  let accum_rot_mat1 = new THREE.Matrix4().identity();

  let intersection_exists = (inter) => {
    for (let prev_inter of intersections_t) {
      if (Math.abs(prev_inter[0] - inter[0]) < 1e-3) return true;
    }
    return false;
  };
  let maybe_add_intersection = (inter) => {
    let t1 = inter[0], t2 = inter[1];
    if (not_endpoint(t1) && not_endpoint(t2) && !intersection_exists(inter)) {
      intersections_t.push([t1, t2]);
    }
  };
  let maybe_add_intersections = (inters) => {
    for (let inter of inters) {
      maybe_add_intersection(inter);
    }
  }

  for (let r1 = 0; r1 < curve1.rotation_symmetry; r1++) {
    let accum_rot_mat2 = new THREE.Matrix4().identity();
    for (let r2 = 0; r2 < curve2.rotation_symmetry; r2++) {
      let c1 = curve1.arc_curve.apply_3d_transformation(accum_rot_mat1);
      let c1_ref = curve1.arc_curve.apply_3d_transformation(accum_rot_mat1.clone().multiply(ref_mat1));
      let c2 = curve2.arc_curve.apply_3d_transformation(accum_rot_mat2);
      let c2_ref = curve2.arc_curve.apply_3d_transformation(accum_rot_mat2.clone().multiply(ref_mat2));
      maybe_add_intersections(c1.intersect(c2));
      maybe_add_intersections(c1.intersect(c2_ref));
      maybe_add_intersections(c1_ref.intersect(c2));
      maybe_add_intersections(c1_ref.intersect(c2_ref));
      accum_rot_mat2.multiply(rot_mat2);
    }
    accum_rot_mat1.multiply(rot_mat1);
  }

  return intersections_t;
}