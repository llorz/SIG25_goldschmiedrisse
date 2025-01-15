import * as THREE from 'three';
import { ArcCurve } from './arc_curve';
import { get_level_height, set_level_height } from '../state/state';
import { Curve } from '../view/curve';
import { clamp11 } from '../utils/math_funcs';
import { get_reflection_mat, get_rotation_mat } from '../utils/intersect';

export class DecorationArcCurve extends THREE.Curve {

  /**
   * 
   */
  constructor(height_arc_curve, arc_curve) {
    super();

    /** @type {ArcCurve} */
    this.arc_curve = arc_curve;
    /** @type {ArcCurve} */
    this.height_arc_curve = height_arc_curve;
  }

  getPoint(t, optionalTarget = new THREE.Vector3()) {
    let point = optionalTarget;
    let pt = this.height_arc_curve.getPoint(t);
    point = this.arc_curve.getPoint(pt.x / this.arc_curve.length());
    point.y = pt.z;
    return point;
  }
}