import * as THREE from 'three';

/**
 * Computes a point on a cubic bezier curve given a parameter t
 * @param {number} t - The parameter of the bezier curve, between 0 and 1
 * @param {THREE.Vector3} p0 - The starting point of the curve
 * @param {THREE.Vector3} p1 - The first control point
 * @param {THREE.Vector3} p2 - The second control point
 * @param {THREE.Vector3} p3 - The ending point of the curve
 * @returns {THREE.Vector3} The point on the curve at parameter t
 */
export function bezy(t, p0, p1, p2, p3) {
  let t2 = t * t;
  let t3 = t2 * t;
  let m0 = 1 - 3 * t + 3 * t2 - t3;
  let m1 = 3 * t - 6 * t2 + 3 * t3;
  let m2 = 3 * t2 - 3 * t3;
  let m3 = t3;
  let x = m0 * p0.x + m1 * p1.x + m2 * p2.x + m3 * p3.x;
  let y = m0 * p0.y + m1 * p1.y + m2 * p2.y + m3 * p3.y;
  let z = m0 * p0.z + m1 * p1.z + m2 * p2.z + m3 * p3.z;
  return new THREE.Vector3(x, y, z);
}

export class BezierSegmentsCurve extends THREE.Curve {
  constructor(points) {
    super();
    this.points = points;
    this.accumulated_seg_lengths = this.approximate_segment_lengths();
  }

  approximate_segment_lengths() {
    let approx_seg_lengths = [0];
    for (let i = 0; i < this.points.length - 1; i += 3) {
      let p0 = this.points[i];
      let p1 = this.points[i + 1];
      let p2 = this.points[i + 2];
      let p3 = this.points[i + 3];
      let len = p0.distanceTo(p1) + p1.distanceTo(p2) + p2.distanceTo(p3);
      approx_seg_lengths.push(len +
        (approx_seg_lengths.length == 0
          ? 0 : approx_seg_lengths[approx_seg_lengths.length - 1]));
    }
    for (let i = 0; i < approx_seg_lengths.length; i++) {
      approx_seg_lengths[i] /= approx_seg_lengths[approx_seg_lengths.length - 1];
    }
    return approx_seg_lengths;
  }

  getPoint(t, optionalTarget = new THREE.Vector3()) {
    let point = optionalTarget;
    let seg_idx = 1;
    for (; seg_idx < this.accumulated_seg_lengths.length
      && t > this.accumulated_seg_lengths[seg_idx]; seg_idx++) { }


    let seg_t = (t - this.accumulated_seg_lengths[seg_idx - 1]) /
      (this.accumulated_seg_lengths[seg_idx] - this.accumulated_seg_lengths[seg_idx - 1]);


    let p0 = this.points[(seg_idx - 1) * 3];
    let p1 = this.points[(seg_idx - 1) * 3 + 1];
    let p2 = this.points[(seg_idx - 1) * 3 + 2];
    let p3 = this.points[(seg_idx - 1) * 3 + 3];
    // Compute bezier point.
    point = bezy(seg_t, p0, p1, p2, p3);
    return point;
  }
}