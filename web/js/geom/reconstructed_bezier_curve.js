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
  if (p0.isVector3) {
    let z = m0 * p0.z + m1 * p1.z + m2 * p2.z + m3 * p3.z;
    return new THREE.Vector3(x, y, z);
  }
  return new THREE.Vector2(x, y);
}

export class ReconstructedBezierCurve extends THREE.Curve {
  constructor(points, height_points) {
    super();
    this.points = points;
    this.height_points = height_points;
    if (this.height_points.length == 0) {
      this.height_points = this.estimate_height_points();
    }
    this.accumulated_seg_lengths = this.approximate_segment_lengths();
  }

  estimate_height_points() {
    let height_points = [new THREE.Vector2(0, 0), new THREE.Vector2(0, 0.3),
    new THREE.Vector2(1, 0.7), new THREE.Vector2(1, 1)];
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
    let h0 = this.height_points[(seg_idx - 1) * 3];
    let h1 = this.height_points[(seg_idx - 1) * 3 + 1];
    let h2 = this.height_points[(seg_idx - 1) * 3 + 2];
    let h3 = this.height_points[(seg_idx - 1) * 3 + 3];
    // Compute bezier point.
    let height_point = bezy(seg_t, h0, h1, h2, h3);
    let top_view_point = bezy(height_point.x, p0, p1, p2, p3);
    point.set(top_view_point.x, height_point.y, top_view_point.y);
    return point;
  }

  /**
   * Split a single cubic Bezier segment at a given parameter value `t`
   * into two segments.
   *
   * @param {Array<THREE.Vector3>} pts - an array of 4 points, representing
   *   the cubic Bezier segment to be split.
   * @param {number} t - the parameter value at which to split.
   * @return {Array<THREE.Vector3>} - an array of two cubic Bezier segments.
   */
  split_bezier_at(pts, t) {
    let A = pts[0], B = pts[1], C = pts[2], D = pts[3];
    let E = A.clone().lerp(B, t);
    let F = B.clone().lerp(C, t);
    let G = C.clone().lerp(D, t);
    let H = E.clone().lerp(F, t);
    let J = F.clone().lerp(G, t);
    let K = H.clone().lerp(J, t);
    return [A, E, H, K, J, G, D];
  }

  /**
   * Split the curve at the given parameter values and indices.
   */
  split(ts, indices) {
    let new_points = [];
    let cur_split = 0;
    for (let i = 0; i * 3 < this.points.length - 1; i++) {
      // If there's no split of the current bezier, just copy the points.
      if (cur_split >= indices.length || i < indices[cur_split]) {
        new_points.push(this.points[i * 3]);
        new_points.push(this.points[i * 3 + 1]);
        new_points.push(this.points[i * 3 + 2]);
        continue;
      }
      // Split the bezier (potentially multiple times).
      let pts = this.points.slice(i * 3, i * 3 + 4);
      let last_t = 0.0;
      while (cur_split < indices.length && i == indices[cur_split]) {
        let t = ts[cur_split];
        pts = this.split_bezier_at(pts, (t - last_t) / (1.0 - last_t));
        new_points = new_points.concat(pts.splice(0, 3));
        last_t = t;
        cur_split++;
      }
      new_points = new_points.concat(pts.slice(0, 3));
    }
    new_points.push(this.points[this.points.length - 1]);
    return new BezierSegmentsCurve(new_points);
  }
}