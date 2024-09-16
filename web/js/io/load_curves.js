
import { Curve } from "../geom/curve";
import * as THREE from "three";

/**
 * Return the last element of an array.
 *
 * @template T
 * @param {T[]} arr - The array.
 * @return {T} - The last element of the array.
 */
function last(arr) {
  return arr[arr.length - 1];
}

function parse_point(pt) {
  return new THREE.Vector3(parseFloat(pt[0]), 0, parseFloat(pt[1]));
}

/**
 * @param {string} txt - The string to parse.
 * @return {Array<Curve>} - An array of Curve objects.
 */
export function load_curves(txt) {
  /** @type {Array<Curve>} */
  let curves = [];
  txt.split(/[\r\n]+/g).forEach((line) => {
    let parts = line.split(/\s+/);
    if (line.startsWith("numCurves")) { }
    else if (line.startsWith("unitCurve")) {
      let curve = new Curve(parseInt(parts[2]),
        parseInt(parts[3]) == 1);
      curves.push(curve);
    } else if (line.startsWith("reflectionPoint")) {
      curves[curves.length - 1].ref_symmetry_point = parse_point(parts.slice(1));
      // Control points.
    } else if (line.startsWith("ptPos")) {
      let curve = last(curves);
      let pt = parse_point(parts.slice(1));
      if (curve.control_points.length == 0) {
        curve.add_control_point(pt);
      } else if (curve.control_points.length % 3 == 1) {
        // Add tangent points.
        let last_pt = last(curve.control_points);
        curve.add_control_point(last_pt.clone().lerp(pt, 0.2));
        curve.add_control_point(last_pt.clone().lerp(pt, 0.8));
        curve.add_control_point(pt);
      } else if (curve.control_points.length % 3 == 2) {
        let last_pt = last(curve.control_points);
        curve.add_control_point(last_pt.clone().lerp(pt, 0.8));
        curve.add_control_point(pt);
      }
      // Control point tangent.
    } else if (line.startsWith("ptTangent")) {
      let curve = last(curves);
      let pt = parse_point(parts.slice(1));
      curve.add_control_point(pt);
    } else if (line.startsWith("ptLab")) {
      last(curves).point_labels.push(parseInt(parts[1]));
    }
  });

  for (let curve of curves) {
    curve.update_curve();
  }
  return curves;
}