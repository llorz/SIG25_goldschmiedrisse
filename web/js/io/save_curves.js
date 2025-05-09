
import { curves, layers_bottom } from "../state/state";
import { Curve } from "../view/curve";
import * as THREE from "three";


// Example:
/*
numCurves	1
unitCurve	2	4	1
reflectionPoint	-1.000000	0.000000
ptPos	-1.000000000000	0.000000000000
ptLab	0
ptPos	0.700000000000	-0.700000000000
ptLab	1

*/

export function save_curves(curves) {
  let txt = "";
  txt += `numCurves ${curves.length}\n`;
  for (let curve of curves) {
    let ref_sym = (!!curve.ref_symmetry_point) ? 1 : 0;
    txt += `unitCurve ${curve.control_points.length} ${curve.rotation_symmetry} ${ref_sym}\n`;
    if (ref_sym) {
      txt += `reflectionPoint ${curve.ref_symmetry_point.x} ${curve.ref_symmetry_point.z}\n`;
    }
    for (let i = 0; i < curve.control_points.length; i++) {
      let pt = curve.control_points[i];
      if (i % 3 == 0) {
        txt += `ptPos ${pt.x} ${pt.z}\n`;
      } else {
        txt += `ptTangent ${pt.x} ${pt.z}\n`;
      }
    }
    for (let pt_label of curve.point_labels) {
      txt += `ptLab ${pt_label}\n`;
    }
  }
  return txt;
}

export function save_state() {
  let txt = "";
  txt += `numCurves ${curves.length}\n`;
  for (let curve of curves) {
    let ref_sym = (!!curve.ref_symmetry_point) ? 1 : 0;
    txt += `unitCurve ${curve.rotation_symmetry} ${ref_sym}\n`;
    if (ref_sym) {
      txt += `reflectionPoint ${curve.ref_symmetry_point.x} ${curve.ref_symmetry_point.z}\n`;
      txt += `ref_symmetry_type ${curve.ref_symmetry_type}\n`;
    }
    for (let i = 0; i < curve.control_points.length; i++) {
      let pt = curve.control_points[i];
      txt += `ptPos ${pt.x} ${pt.z}\n`;
    }
    txt += 'level ' + curve.level + '\n';
    txt += 'height ' + curve.height + '\n';
    txt += 'prc_t ' + curve.prc_t + '\n';
    txt +='decoration_t ' + curve.decoration_t + '\n';
    txt += 'decoration_height ' + curve.decoration_height + '\n';
    txt += 'vertical_line_top ' + curve.vertical_line_top + '\n';

  }
  for (let layer of layers_bottom) {
    txt += 'layer_bottom ' + layer + '\n';
  }
  return txt;
}