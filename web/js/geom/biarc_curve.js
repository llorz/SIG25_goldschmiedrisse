import * as THREE from 'three';

export class BiArcCurve extends THREE.Curve {
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
    /** @type {THREE.Vector2} Center of the second circle. */
    this.cb = new THREE.Vector2();
    /** @type {number} Radius of the second circle. */
    this.rb = 0;

    this.initialize();
  }

  initialize() {
    let A = this.points[0];
    let ta = this.points[1].clone().sub(A);
    let B = this.points[3];
    let tb = this.points[2].clone().sub(B);
    let da = new THREE.Vector2(-ta.y, ta.x).normalize();
    let AB = B.clone().sub(A).normalize();

    let count = 0;
    if (ta.x * AB.y - ta.y * AB.x < 0) {
      count++;
      da.negate();
    }
    let db = new THREE.Vector2(-tb.y, tb.x).normalize();
    if (tb.x * AB.y - tb.y * AB.x > 0) {
      count++;
      db.negate();
    }
    let t_s = tb.length() / ta.length();

    let coefs = [-2 * t_s * (db.dot(da) + (count % 2 == 0? 1 : -1)),
    2 * (A.dot(da) - B.dot(da)) + 2 * t_s * (B.dot(db) - A.dot(db)),
    A.dot(A) + B.dot(B) - 2 * A.dot(B)];

    let delta = coefs[1] * coefs[1] - 4 * coefs[0] * coefs[2];
    // Assuming opposite directions (coefs[0] is positive), and correct
    // assumption about the side of the circle center.
    let t;
    if (Math.abs(coefs[0]) > 1e-5)
      t = (-coefs[1] +(coefs[0] > 0? 1 : -1) *  Math.sqrt(delta)) / (2 * coefs[0]);
    else if (Math.abs(coefs[1]) > 1e-5)
      t = -coefs[2] / coefs[1];
    else {
      this.ca = A;
      this.cb = B;
      this.ra = 0;
      this.rb = 0;
      return;
    }

    let s = t_s * t;
    this.ra = t;
    this.rb = s;
    this.ca = A.clone().add(da.multiplyScalar(t));
    this.cb = B.clone().add(db.multiplyScalar(s));
    this.intersection = this.ca.clone().add(this.cb.clone().sub(this.ca).normalize().multiplyScalar(this.ra));
    this.angle_a_0 = Math.atan2(A.y - this.ca.y, A.x - this.ca.x);
    this.angle_a_1 = Math.atan2(this.intersection.y - this.ca.y, this.intersection.x - this.ca.x);
    
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

    this.angle_b_0 = Math.atan2(B.y - this.cb.y, B.x - this.cb.x);
    this.angle_b_1 = Math.atan2(this.intersection.y - this.cb.y, this.intersection.x - this.cb.x);

    let Bcb = B.clone().sub(this.cb);
    if (Bcb.x * tb.y - Bcb.y * tb.x > 0) {
      // Going anti-clockwise.
      if (this.angle_b_1 < this.angle_b_0) {
        this.angle_b_1 += 2 * Math.PI;
      }
    } else {
      // Going clockwise.
      if (this.angle_b_1 > this.angle_b_0) {
        this.angle_b_1 -= 2 * Math.PI;
      }
    }

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
    if (this.ra == 0 && this.rb == 0) {
      point.set(this.ca.x * (1 - t) + this.cb.x * t,
        0, this.ca.y * (1 - t) + this.cb.y * t);
      return point;
    }

    if (t < 0.5) {
      let tt = t * 2;
      let angle = this.angle_a_0 * (1 - tt) + this.angle_a_1 * tt;
      point.set(this.ca.x + this.ra * Math.cos(angle),
        0, this.ca.y + this.ra * Math.sin(angle));
    } else {
      let tt = (t - 0.5) * 2;
      let angle = this.angle_b_1 * (1 - tt) + this.angle_b_0 * tt;
      point.set(this.cb.x + this.rb * Math.cos(angle),
        0, this.cb.y + this.rb * Math.sin(angle));
    }
    return point;
  }
}