import * as THREE from 'three';
import { ArcCurve } from './arc_curve';
import { get_level_height, set_level_height } from '../state/state';
import { Curve } from '../view/curve';
import { clamp11 } from '../utils/math_funcs';
import { get_reflection_mat, get_rotation_mat } from '../utils/intersect';

export class ReconstructedBiArcCurve extends THREE.Curve {

  /**
   * 
   * @param {Curve} curve 
   */
  constructor(curve, arc_curve = null) {
    super();

    /** @type {ArcCurve} */
    this.arc_curve = curve.arc_curve;
    if (arc_curve != null) {
      this.arc_curve = arc_curve;
    }
    /** @type {Curve} */
    this.curve = curve;
    this.rotation_symmetry = curve.rotation_symmetry;
    this.ref_symmetry_point = curve.ref_symmetry_point;
    this.level = curve.level;
    /** @type {number} */
    this.top_height;
    /** @type {number} */
    this.middle_height;
    this.set_top_height(curve.height);
  }

  get_sym_curve(rot, ref = false) {
    let mat = get_rotation_mat(this.rotation_symmetry, rot);
    if (ref) {
      mat.multiply(get_reflection_mat(this.ref_symmetry_point));
    }
    return new ReconstructedBiArcCurve(this.curve, this.arc_curve.apply_3d_transformation(mat));
  }

  get_bottom_height() {
    if (this.curve.decoration_t == 0) {
      return this.prev_level_height();
    }
    return this.curve.decoration_height;
  }
  get_middle_height() {
    let t = (this.curve.prc_t - this.curve.decoration_t) / (1 - this.curve.decoration_t);
    return this.get_bottom_height() * (1 - t) + t * this.top_height;
  }
  get_top_height_from_middle(middle) {
    let t = (this.curve.prc_t - this.curve.decoration_t) / (1 - this.curve.decoration_t);
    return (middle - this.get_bottom_height() * (1 - t)) / t;
  }

  compute_biarc() {
    let flat_curve_len = this.arc_curve.length();
    let middle_height = this.get_middle_height();
    let p0 = new THREE.Vector2(flat_curve_len * this.curve.decoration_t, this.get_bottom_height());
    let p_mid = new THREE.Vector2(flat_curve_len * this.curve.prc_t, middle_height);
    let p_top = new THREE.Vector2(flat_curve_len, this.top_height);

    let l1 = p_mid.clone().sub(p0).normalize();
    let l1_rot = new THREE.Vector2(-l1.y, l1.x);
    let l1_p = (p0.clone().add(p_mid)).multiplyScalar(0.5);
    // Find intersection with y = p0.y (l1_p + t * l1_rot).y == p0.y.
    let t1 = (p0.y - l1_p.y) / l1_rot.y;
    // Center of the first arc.
    this.ca = l1_p.clone().add(l1_rot.clone().multiplyScalar(t1));
    this.ra = p_mid.clone().sub(this.ca).length();
    this.max_angle = p_mid.clone().sub(this.ca).angle();
    this.arca_len = this.ra * Math.abs(this.max_angle - Math.PI);

    let l2 = p_top.clone().sub(p_mid).normalize();
    let l2_rot = new THREE.Vector2(-l2.y, l2.x);
    let l2_p = (p_mid.clone().add(p_top)).multiplyScalar(0.5);
    // Find intersection with y = p_top.y (l2_p + t * l2_rot).y == p_top.y.
    let t2 = (this.top_height - l2_p.y) / l2_rot.y;
    // Center of the second arc.
    this.cb = l2_p.clone().add(l2_rot.clone().multiplyScalar(t2));
    this.rb = p_mid.clone().sub(this.cb).length();
    this.min_angle = p_mid.clone().sub(this.cb).angle();
    this.arcb_len = this.rb * Math.abs(this.min_angle - 2 * Math.PI);

    this.len = this.arca_len + this.arcb_len;
    this.rmf = [];
  }

  prev_level_height() {
    return get_level_height(this.level - 1);
  }

  set_top_height(height) {
    this.top_height = height;
    this.curve.height = height;
    // set_level_height(this.level, this.top_height);
    let t = this.curve.prc_t;
    this.middle_height = this.get_middle_height();
    this.compute_biarc();
  }

  set_middle_height(height) {
    this.middle_height = height;
    let t = this.curve.prc_t;
    this.top_height = this.get_top_height_from_middle(height);
    this.curve.height = this.top_height
    this.compute_biarc();
  }

  /**
   * Returns the 't' parameter for which the arc_curve parameter is x.
   * @param {number} x 
   */
  get_t_for_x(x) {
    let target_x = x * this.arc_curve.length();
    let x_arca = this.ca.x + this.ra * Math.cos(this.max_angle);
    if (target_x <= x_arca) {
      let target_ang = Math.acos(clamp11((target_x - this.ca.x) / this.ra));
      let tt = (target_ang - Math.PI) / (this.max_angle - Math.PI);
      return tt * this.arca_len / this.len;
    }
    let target_ang = 2 * Math.PI - Math.acos(clamp11((target_x - this.cb.x) / this.rb));
    let tt = (target_ang - this.min_angle) / (2 * Math.PI - this.min_angle);
    let s = this.arca_len + tt * this.arcb_len;
    return s / this.len;
  }

  get_arc_b_y_for_x(x) {
    let target_x = this.arc_curve.length() - x;
    // Solve for y in the equation (x-cb.x)^2 + (y-cb.y)^2 = rb^2.
    let a = 1, b = -2 * this.cb.y, c = (target_x - this.cb.x) ** 2 + this.cb.y ** 2 - this.rb ** 2;
    let delta = b * b - 4 * a * c;
    let y = (-b - Math.sqrt(Math.max(delta, 0))) / (2 * a);

    let b2 = -2 * this.cb.x;
    let c2 = (y - this.cb.y) ** 2 + this.cb.x ** 2 - this.rb ** 2;
    let x1 = (-b2 - Math.sqrt(Math.max(b2 * b2 - 4 * c2, 0))) / 2;
    let x2 = (-b2 + Math.sqrt(Math.max(b2 * b2 - 4 * c2, 0))) / 2;
    let closest_x;
    if (Math.abs(x1 - target_x) < Math.abs(x2 - target_x)) {
      closest_x = x1;
    } else {
      closest_x = x2;
    }
    return [this.arc_curve.length() - closest_x, y];
  }

  getPoint(t, optionalTarget = new THREE.Vector3()) {
    let point = optionalTarget;
    let s = t * this.len;
    if (s < this.arca_len) {
      let tt = (s / this.arca_len);
      let angle = Math.PI * (1 - tt) + this.max_angle * tt;
      let x = this.ca.x + this.ra * Math.cos(angle);
      let y = this.ca.y + this.ra * Math.sin(angle);
      // x is the arclength of the flat curve.
      this.arc_curve.getPoint(x / this.arc_curve.length(), point);
      point.y = y;
    } else {
      let tt = ((s - this.arca_len) / this.arcb_len);
      let angle = this.min_angle * (1 - tt) + 2 * Math.PI * tt;
      let x = this.cb.x + this.rb * Math.cos(angle);
      let y = this.cb.y + this.rb * Math.sin(angle);
      // x is the arclength of the flat curve.
      this.arc_curve.getPoint(x / this.arc_curve.length(), point);
      point.y = y;
    }

    return point;
  }

  getTangent(t, optionalTarget = new THREE.Vector3()) {
    let tangent = optionalTarget;
    let s = t * this.len;
    let x, y, x_t, y_t, x_tt, y_tt;
    if (s < this.arca_len) {
      let tt = (s / this.arca_len);
      let angle = Math.PI * (1 - tt) + this.max_angle * tt;
      let sgn = this.max_angle > Math.PI ? 1 : -1;
      x = this.ca.x + this.ra * Math.cos(angle);
      y = this.ca.y + this.ra * Math.sin(angle);
      x_t = -sgn * this.ra * Math.sin(angle);
      y_t = sgn * this.ra * Math.cos(angle);
    } else {
      let tt = ((s - this.arca_len) / this.arcb_len);
      let angle = this.min_angle * (1 - tt) + 2 * Math.PI * tt;
      let sgn = this.min_angle > 2 * Math.PI ? -1 : 1;
      x = this.cb.x + this.rb * Math.cos(angle);
      y = this.cb.y + this.rb * Math.sin(angle);
      x_t = -sgn * this.rb * Math.sin(angle);
      y_t = sgn * this.rb * Math.cos(angle);
    }
    let arc_curve_len = this.arc_curve.length();
    // Tangent at t.
    tangent = this.arc_curve.d_dt(x / arc_curve_len);
    tangent.x = tangent.x * x_t / arc_curve_len;
    tangent.z = tangent.z * x_t / arc_curve_len;
    tangent.y = y_t;
    tangent.normalize();

    return tangent;
  }

  compute_rmf(resolution = 100) {
    this.rmf = [{
      t: 0,
      tangent: this.getTangent(0),
      normal: this.getPoint(0).normalize(),
      binormal: new THREE.Vector3()
    }];
    // this.rmf[0].normal.x = -this.rmf[0].tangent.z;
    // this.rmf[0].normal.z = this.rmf[0].tangent.x;
    this.rmf[0].normal.y = 0;
    this.rmf[0].normal.normalize();
    this.rmf[0].binormal.crossVectors(this.rmf[0].tangent, this.rmf[0].normal);
    for (let i = 0; i < resolution - 1; i++) {
      let t_i = i / (resolution - 1);
      let t_ip1 = (i + 1) / (resolution - 1);
      let x_i = this.getPoint(t_i);
      let x_ip1 = this.getPoint(t_ip1);
      // First reflection.
      let v_1 = x_ip1.clone().sub(x_i).normalize();
      let n_i = this.rmf[i].normal;
      // Reflect n_i and t_I through the plane perpendicular to v_1.
      let n_il = n_i.clone().sub(v_1.clone().multiplyScalar(2 * n_i.dot(v_1)));
      let t_il = this.rmf[i].tangent.clone().sub(v_1.clone().multiplyScalar(2 * this.rmf[i].tangent.dot(v_1)));

      // Second reflection.
      let tang_p1 = this.getTangent(t_ip1);
      let v_2 = tang_p1.clone().sub(t_il).normalize();
      let n_ip1 = n_il.clone().sub(v_2.clone().multiplyScalar(2 * n_il.dot(v_2)));
      let bin_ip1 = new THREE.Vector3();
      bin_ip1.crossVectors(tang_p1, n_ip1);
      this.rmf.push({ t: t_ip1, tangent: tang_p1, normal: n_ip1, binormal: bin_ip1 });
    }

    // Calculate minimal twist to get the correct normal in the end.
    let target_normal = this.getPoint(1);
    target_normal.y = 0;
    target_normal.normalize();

    let ang = Math.atan2(target_normal.dot(this.rmf[resolution - 1].binormal),
      target_normal.dot(this.rmf[resolution - 1].normal));
    // Rotate the normal and binormal at each frame by ang / resolution.
    for (let i = 1; i < resolution; i++) {
      let q = new THREE.Quaternion();
      q.setFromAxisAngle(this.rmf[i].tangent, (i / (resolution - 1)) * ang);
      this.rmf[i].normal.applyQuaternion(q);
      this.rmf[i].binormal.applyQuaternion(q);
    }

    this.rmf_resoluion = resolution;
  }

  get_rmf_frame(t) {
    if (this.rmf.length == 0) {
      this.compute_rmf();
    }
    // Binary search for the frame.
    // let l = 0;
    // let r = this.rmf.length - 1;
    // while (r - l > 1) {
    //   let m = Math.floor((l + r) / 2);
    //   if (this.rmf[m].t <= t) {
    //     l = m;
    //   } else {
    //     r = m;
    //   }
    // }
    let l = Math.floor(t * (this.rmf_resoluion - 1));
    let r = Math.min(l + 1, this.rmf_resoluion - 1);
    let tt = (t - this.rmf[l].t) / (this.rmf[r].t - this.rmf[l].t);
    let tangent = this.rmf[l].tangent.clone().multiplyScalar(1 - tt).add(this.rmf[r].tangent.clone().multiplyScalar(tt));
    let normal = this.rmf[l].normal.clone().multiplyScalar(1 - tt).add(this.rmf[r].normal.clone().multiplyScalar(tt));
    let binormal = this.rmf[l].binormal.clone().multiplyScalar(1 - tt).add(this.rmf[r].binormal.clone().multiplyScalar(tt));
    return {
      position: this.getPoint(t),
      tangent: tangent, normal: normal, binormal: binormal
    };
  }

  getFrame(t) {
    let s = t * this.len;
    let x, y, x_t, y_t, x_tt, y_tt;
    if (s < this.arca_len) {
      let tt = (s / this.arca_len);
      let angle = Math.PI * (1 - tt) + this.max_angle * tt;
      let sgn = this.max_angle > Math.PI ? 1 : -1;
      x = this.ca.x + this.ra * Math.cos(angle);
      y = this.ca.y + this.ra * Math.sin(angle);
      x_t = -sgn * this.ra * Math.sin(angle);
      y_t = sgn * this.ra * Math.cos(angle);
    } else {
      let tt = ((s - this.arca_len) / this.arcb_len);
      let angle = this.min_angle * (1 - tt) + 2 * Math.PI * tt;
      let sgn = this.min_angle > Math.PI ? -1 : 1;
      x = this.cb.x + this.rb * Math.cos(angle);
      y = this.cb.y + this.rb * Math.sin(angle);
      x_t = -sgn * this.rb * Math.sin(angle);
      y_t = sgn * this.rb * Math.cos(angle);
    }
    // Point at t.
    let arc_curve_len = this.arc_curve.length();
    let flat_point = this.arc_curve.getPoint(x / arc_curve_len);
    flat_point.y = y;
    // Tangent at t.
    let tangent = this.arc_curve.d_dt(x / arc_curve_len);
    tangent.x = tangent.x * x_t / arc_curve_len;
    tangent.z = tangent.z * x_t / arc_curve_len;
    tangent.y = y_t;
    tangent.normalize();
    // Normal at t.
    let normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
    normal.normalize();
    // Binormal at t.
    let binormal = new THREE.Vector3();
    binormal.crossVectors(tangent, normal);
    normal.crossVectors(binormal, tangent);

    return {
      position: flat_point,
      tangent: tangent,
      normal: normal,
      binormal: binormal,
    };
  }

}