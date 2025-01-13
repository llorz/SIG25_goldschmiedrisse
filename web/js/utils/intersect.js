import * as THREE from 'three';
import { Curve } from '../view/curve';
import { ArcCurve } from '../geom/arc_curve';
import { clamp0, clamp01 } from './math_funcs';
import { ReconstructedBiArcCurve } from '../geom/reconstructed_biarc_curve';

const eps = 1e-3;

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
  if (t > 1 + eps || t < -eps || u > 1 + eps || u < -eps) { return []; }
  // return new THREE.Vector2(p1.x + t * d1.x, p1.y + t * d1.y);
  return [[clamp01(t), clamp01(u)]];
}

export class Arc {
  constructor(center, radius, angle_0, angle_1) {
    this.center = center;
    this.radius = radius;
    this.angle_0 = angle_0;
    this.angle_1 = angle_1;
  }

  find_t_for_point(p) {
    let eps = 1e-3;
    // ang(t) = angle_0 * (1-t) + angle_1 * t
    // p(t) = center + radius * [cos(ang(t)), sin(ang(t))].

    let angle = Math.atan2(p.y - this.center.y, p.x - this.center.x);
    if (angle < this.angle_0 && angle < this.angle_1) {
      angle += 2 * Math.PI;
    } else if (angle > this.angle_0 && angle > this.angle_1) {
      angle -= 2 * Math.PI;
    }
    let t = clamp01((angle - this.angle_0) / (this.angle_1 - this.angle_0));
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
  if (center_dist > arc1.radius + arc2.radius + eps) {
    return [];
  }
  let cos_ang = (arc2.radius * arc2.radius - arc1.radius * arc1.radius - center_dist * center_dist) /
    (-2 * arc1.radius * center_dist);
  let sin_ang = Math.sqrt(clamp0(1 - cos_ang * cos_ang));

  let p1 = new THREE.Vector2(center_vec.x * cos_ang - center_vec.y * sin_ang,
    center_vec.x * sin_ang + center_vec.y * cos_ang).normalize()
    .multiplyScalar(arc1.radius).add(arc1.center);
  let p2 = new THREE.Vector2(center_vec.x * cos_ang + center_vec.y * sin_ang,
    -center_vec.x * sin_ang + center_vec.y * cos_ang).normalize()
    .multiplyScalar(arc1.radius).add(arc1.center);

  let res = [];
  let t1 = arc1.find_t_for_point(p1), s1 = arc2.find_t_for_point(p1);
  if (t1 >= -eps && t1 <= 1 + eps && s1 >= -eps && s1 <= 1 + eps) {
    res.push([clamp01(t1), clamp01(s1)]);
  }
  let t2 = arc1.find_t_for_point(p2), s2 = arc2.find_t_for_point(p2);
  if (t2 >= -eps && t2 <= 1 + eps && s2 >= -eps && s2 <= 1 + eps) {
    res.push([clamp01(t2), clamp01(s2)]);
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
  if (h.length() > arc.radius + eps) {
    return [];
  }
  let seg_len = Math.sqrt(clamp0(arc.radius * arc.radius - h.lengthSq()));
  let p = arc.center.clone().add(h);
  // Two possible intersection points.
  let inter1 = p.clone().add(d.clone().normalize().multiplyScalar(seg_len));
  let inter2 = p.clone().sub(d.clone().normalize().multiplyScalar(seg_len));

  let t1 = (inter1.clone().sub(p1).dot(d)) / d.lengthSq(), s1 = arc.find_t_for_point(inter1);
  let t2 = (inter2.clone().sub(p1).dot(d)) / d.lengthSq(), s2 = arc.find_t_for_point(inter2);
  let res = [];
  if (t1 >= -eps && t1 <= 1 + eps && s1 >= -eps && s1 <= 1 + eps) {
    res.push([clamp01(t1), clamp01(s1)]);
  }
  if (t2 >= -eps && t2 <= 1 + eps && s2 >= -eps && s2 <= 1 + eps) {
    res.push([clamp01(t2), clamp01(s2)]);
  }
  return res;
}

export function get_reflection_mat(ref_symmetry_point) {
  let x = ref_symmetry_point.x, y = 0, //ref_symmetry_point.y,
    z = ref_symmetry_point.z;
  let norm = Math.sqrt(x * x + y * y + z * z);
  x /= norm; y /= norm; z /= norm;
  let mat = new THREE.Matrix4().set
    (2 * x * x - 1, 2 * x * y, 2 * x * z, 0,
      2 * y * x, 2 * y * y - 1, 2 * y * z, 0,
      2 * z * x, 2 * z * y, 2 * z * z - 1, 0,
      0, 0, 0, 1);
  return mat;
}

export function get_rotation_mat(rotation_symmetry, rot = 1) {
  let mat = new THREE.Matrix4();
  mat.makeRotationY(rot * 2 * Math.PI / rotation_symmetry);
  return mat;
}

function not_endpoint(t) {
  return t > 1e-2 && t < 1 - 1e-2;
}

/**
 * 
 * @param {Curve} curve 
 */
export function analytic_self_intersection(curve, include_endpoints = false) {
  let rot_mat = get_rotation_mat(curve.rotation_symmetry);
  let accum_rot_mat = new THREE.Matrix4().identity();
  let ref_mat = (!!curve.ref_symmetry_point ?
    get_reflection_mat(curve.ref_symmetry_point) : null);

  let intersections_t = [];
  for (let rot = 0; rot < curve.rotation_symmetry; rot++) {
    if (rot > 0) {
      let other_arc_curve = curve.arc_curve.apply_3d_transformation(accum_rot_mat);
      let inters = curve.arc_curve.intersect(other_arc_curve);
      for (let inter of inters) {
        if ((include_endpoints || not_endpoint(inter[0]))
          && Math.abs(inter[0] - inter[1]) < 1e-2)
          intersections_t.push({ t: inter[0], rot: rot, ref: false });
      }
    }
    if (!!ref_mat) {
      let other_arc_curve = curve.arc_curve.apply_3d_transformation(accum_rot_mat.clone().multiply(ref_mat));
      let inters = curve.arc_curve.intersect(other_arc_curve);
      for (let inter of inters) {
        if ((include_endpoints || not_endpoint(inter[0]))
          && Math.abs(inter[0] - inter[1]) < 1e-2)
          intersections_t.push({ t: inter[0], rot: rot, ref: true });
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
export function analytic_curves_intersection(curve1, curve2, include_endpoints = false) {
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
    if ((include_endpoints || (not_endpoint(t1) && not_endpoint(t2)))
      && !intersection_exists(inter)) {
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