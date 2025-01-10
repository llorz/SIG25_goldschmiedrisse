import * as THREE from 'three';
import { Arc, arc_arc_intersect, line_line_segment_intersect, line_segment_arc_intersection } from '../utils/intersect';

export class ArcCurve extends THREE.Curve {
  constructor(points) {
    super();
    /** @type {THREE.Vector2[]} Control points for the biarc. */
    this.points = [];
    if (points[0].isVector2) {
      this.points = points;
    } else {
      this.points = points.map(p => new THREE.Vector2(p.x, p.z));
    }

    /** @type {THREE.Vector2} Center of the first circle. */
    this.ca = new THREE.Vector2();
    /** @type {number} Radius of the first circle. */
    this.ra = 0;

    this.initialize();
  }

  apply_3d_transformation(mat) {
    return new ArcCurve(this.points.map(p => new THREE.Vector3(p.x, 0, p.y).applyMatrix4(mat)));
  }

  initialize() {
    let A = this.points[0];
    let ta = this.points[1].clone().sub(A);
    let B = this.points[2];
    let AB = B.clone().sub(A);
    let da = new THREE.Vector2(-ta.y, ta.x).normalize();

    if (ta.x * AB.y - ta.y * AB.x < 0) {
      da.negate();
    }
    let AB_len = AB.length();
    let cos_theta = da.dot(AB) / AB_len;
    if (Math.abs(cos_theta) < 1e-2) {
      this.ra = 0;
      this.ca = A;
    } else {
      this.ra = AB_len / (2 * cos_theta);
      this.ca = A.clone().add(da.clone().multiplyScalar(this.ra));
    }

    this.angle_a_0 = Math.atan2(A.y - this.ca.y, A.x - this.ca.x);
    this.angle_a_1 = Math.atan2(B.y - this.ca.y, B.x - this.ca.x);

    let Aca = A.clone().sub(this.ca);
    if (Aca.x * ta.y - Aca.y * ta.x > 0) {
      // Going anti-clockwise.
      if (this.angle_a_1 < this.angle_a_0) {
        this.angle_a_1 += 2 * Math.PI;
      }
    } else {
      // Going clockwise.
      if (this.angle_a_1 > this.angle_a_0) {
        this.angle_a_1 -= 2 * Math.PI;
      }
    }

  }

  /**
   * @param {ArcCurve} other 
   */
  intersect(other) {
    if (this.ra == 0) {
      if (other.ra == 0) {
        return line_line_segment_intersect(this.points[0], this.points[2].clone().sub(this.points[0]),
          other.points[0], other.points[2].clone().sub(other.points[0]));
      } else {
        return line_segment_arc_intersection(this.points[0], this.points[2], new Arc(other.ca, other.ra, other.angle_a_0, other.angle_a_1));
      }
    } else {
      if (other.ra == 0) {
        return other.intersect(this).map(p => p.reverse());
      }
    }
    return arc_arc_intersect(new Arc(this.ca, this.ra, this.angle_a_0, this.angle_a_1),
      new Arc(other.ca, other.ra, other.angle_a_0, other.angle_a_1));
  }

  length() {
    if (this.ra == 0) {
      return this.points[0].distanceTo(this.points[2]);
    }
    return this.ra * Math.abs(this.angle_a_1 - this.angle_a_0);
  }

  setPoints(points) {
    if (points[0].isVector2) {
      this.points = points;
    } else {
      this.points = points.map(p => new THREE.Vector2(p.x, p.z));
    }
    this.initialize();
  }

  getPoint(t, optionalTarget = new THREE.Vector3()) {
    let point = optionalTarget;
    // If the biarc is a straight line (infinitely large circles).
    if (this.ra == 0) {
      point.set(this.points[0].x * (1 - t) + this.points[2].x * t,
        0, this.points[0].y * (1 - t) + this.points[2].y * t);
      return point;
    }

    let angle = this.angle_a_0 * (1 - t) + this.angle_a_1 * t;
    point.set(this.ca.x + this.ra * Math.cos(angle),
      0, this.ca.y + this.ra * Math.sin(angle));
    return point;
  }

  d_dt(t) {
    if (this.ra == 0) {
      return new THREE.Vector3(this.points[2].x - this.points[0].x, 0, this.points[2].y - this.points[0].y); 
    }

    let angle = this.angle_a_0 * (1 - t) + this.angle_a_1 * t;
    return new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle)).multiplyScalar(this.ra).multiplyScalar(this.angle_a_1 - this.angle_a_0);
  }

  getTangent(t, optionalTarget = new THREE.Vector3()) {
    let tangent = optionalTarget;
    if (this.ra == 0) {
      tangent.set(this.points[2].x - this.points[0].x, 0, this.points[2].y - this.points[0].y).normalize();
      return tangent;
    }

    let angle = this.angle_a_0 * (1 - t) + this.angle_a_1 * t;
    tangent.set(-Math.sin(angle), 0, Math.cos(angle)).normalize();

    return tangent;
  }
}