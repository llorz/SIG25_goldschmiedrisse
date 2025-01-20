
import { curves, layers_bottom, reset_layer_bottom, update_supporting_pillars } from "../state/state";
import { Curve } from "../view/curve";
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
      last(curves).ref_symmetry_point = parse_point(parts.slice(1));
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
      } else {
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

export function load_state(txt) {
  curves.length = 0;
  layers_bottom.length = 0;
  txt.split(/[\r\n]+/g).forEach((line) => {
    let parts = line.split(/\s+/);
    if (line.startsWith("numCurves")) { }
    else if (line.startsWith("unitCurve")) {
      let curve = new Curve(parseInt(parts[1]),
        parseInt(parts[2]) == 1);
      curves.push(curve);
    } else if (line.startsWith("reflectionPoint")) {
      last(curves).ref_symmetry_point = parse_point(parts.slice(1));
      // Control points.
    } else if (line.startsWith("ref_symmetry_type")) {
      last(curves).ref_symmetry_type = parts.slice(1, parts.length).join(' ');
    } else if (line.startsWith("ptPos")) {
      let curve = last(curves);
      let pt = parse_point(parts.slice(1));
      curve.add_control_point(pt);
    } else if (line.startsWith("level")) {
      last(curves).level = parseFloat(parts[1]);
    } else if (line.startsWith("height")) {
      last(curves).height = parseFloat(parts[1]);
    } else if (line.startsWith("prc_t")) {
      last(curves).prc_t = parseFloat(parts[1]);
    } else if (line.startsWith("decoration_t")) {
      last(curves).decoration_t = parseFloat(parts[1]);
    } else if (line.startsWith("decoration_height")) {
      last(curves).decoration_height = parseFloat(parts[1]);
    } else if (line.startsWith("layer_bottom")) {
      layers_bottom.push(parseFloat(parts[1]));
    } else if (line.startsWith("vertical_line_top")) {
      last(curves).vertical_line_top = parseFloat(parts[1]);
    }
  });
  for (let curve of curves) {
    curve.get_bezy_curve();
  }

  if (layers_bottom.length == 0) {
    layers_bottom.push(0);
    let max_level_height = new Map();
    let max_level = 0;
    // Find max height of each level.
    for (let curve of curves) {
      if (max_level_height.has(curve.level)) {
        max_level_height.set(curve.level,
          Math.max(max_level_height.get(curve.level), curve.height));
      } else {
        max_level_height.set(curve.level, curve.height);
      }
      max_level = Math.max(max_level, curve.level);
    }
    // Initialize the layers bottom height.
    reset_layer_bottom(max_level);
    for (let i = 1; i <= max_level; i++) {
      layers_bottom[i] = max_level_height.get(i - 1);
    }
  }
}