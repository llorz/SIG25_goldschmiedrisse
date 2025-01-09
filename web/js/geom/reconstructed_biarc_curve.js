import * as THREE from 'three';
import { ArcCurve } from './arc_curve';
import { get_level_height, set_level_height } from '../state/state';
import { Curve } from '../view/curve';

export class ReconstructedBiArcCurve extends THREE.Curve {

  /**
   * 
   * @param {Curve} curve 
   */
  constructor(curve) {
    super();

    /** @type {ArcCurve} */
    this.arc_curve = curve.arc_curve;
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

  compute_biarc() {
    let flat_curve_len = this.arc_curve.length();
    let middle_height = this.prev_level_height() * (1 - this.curve.prc_t) + this.curve.prc_t * this.top_height;
    let p0 = new THREE.Vector2(0, this.prev_level_height());
    let p_mid = new THREE.Vector2(flat_curve_len * this.curve.prc_t, middle_height);
    let p_top = new THREE.Vector2(flat_curve_len, this.top_height);

    let l1 = p_mid.clone().sub(p0).normalize();
    let l1_rot = new THREE.Vector2(-l1.y, l1.x);
    let l1_p = (p0.clone().add(p_mid)).multiplyScalar(0.5);
    // Find intersection with y = prev_level_height() (l1_p + t * l1_rot).y == prev_level_height().
    let t1 = (this.prev_level_height() - l1_p.y) / l1_rot.y;
    // Center of the first arc.
    this.ca = l1_p.clone().add(l1_rot.clone().multiplyScalar(t1));
    this.ra = p_mid.clone().sub(this.ca).length();
    this.max_angle = p_mid.clone().sub(this.ca).angle();
    this.arca_len = this.ra * Math.abs(this.max_angle - Math.PI);

    let l2 = p_top.clone().sub(p_mid).normalize();
    let l2_rot = new THREE.Vector2(-l2.y, l2.x);
    let l2_p = (p_mid.clone().add(p_top)).multiplyScalar(0.5);
    // Find intersection with y = this.top_height (l2_p + t * l2_rot).y == this.top_height.
    let t2 = (this.top_height - l2_p.y) / l2_rot.y;
    // Center of the second arc.
    this.cb = l2_p.clone().add(l2_rot.clone().multiplyScalar(t2));
    this.rb = p_mid.clone().sub(this.cb).length();
    this.min_angle = p_mid.clone().sub(this.cb).angle();
    this.arcb_len = this.rb * Math.abs(this.min_angle - 2 * Math.PI);

    this.len = this.arca_len + this.arcb_len;
  }

  prev_level_height() {
    return get_level_height(this.level - 1);
  }

  set_top_height(height) {
    this.top_height = height;
    this.curve.height = height;
    // set_level_height(this.level, this.top_height);
    let t = this.curve.prc_t;
    this.middle_height = this.prev_level_height() * (1 - t) + t * this.top_height;
    this.compute_biarc();
  }

  set_middle_height(height) {
    this.middle_height = height;
    let t = this.curve.prc_t;
    this.top_height = (this.middle_height - this.prev_level_height() * (1 - t)) / t;
    this.curve.height = this.top_height
    // set_level_height(this.level, this.top_height);
    this.compute_biarc();
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

  getFrame(t) {
    let s = t * this.len;
    let x, y, x_t, y_t, x_tt, y_tt;
    if (s < this.arca_len) {
      let tt = (s / this.arca_len);
      let angle = Math.PI * (1 - tt) + this.max_angle * tt;
      x = this.ca.x + this.ra * Math.cos(angle);
      y = this.ca.y + this.ra * Math.sin(angle);
      x_t = -this.ra * Math.sin(angle);
      y_t = this.ra * Math.cos(angle);
      x_tt = -this.ra * Math.cos(angle);
      y_tt = -this.ra * Math.sin(angle);
    } else {
      let tt = ((s - this.arca_len) / this.arcb_len);
      let angle = this.min_angle * (1 - tt) + 2 * Math.PI * tt;
      x = this.cb.x + this.rb * Math.cos(angle);
      y = this.cb.y + this.rb * Math.sin(angle);
      x_t = -this.rb * Math.sin(angle);
      y_t = this.rb * Math.cos(angle);
      x_tt = -this.rb * Math.cos(angle);
      y_tt = -this.rb * Math.sin(angle);
    }
    // Point at t.
    let arc_curve_len = this.arc_curve.length();
    let flat_point = this.arc_curve.getPoint(x / arc_curve_len);
    flat_point.y = y;
    // Tangent at t.
    let tangent = this.arc_curve.getTangent(x / arc_curve_len);
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
      normal: binormal,
      binormal: normal
    };
  }

}