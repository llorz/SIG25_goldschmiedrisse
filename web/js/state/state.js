import * as THREE from 'three';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';

import { Curve } from "../view/curve";
import { load_curves } from "../io/load_curves";
import { sync_module } from "../native/native";
import { ReconstructedSurface } from "../view/reconstructed_surface";
import { ReconstructedCurve } from "../view/reconstructed_three_curve";
import { camera2d, enable_controls, scene, set_designing_area_height, update_rotation_symmetry_lines } from "../view/visual";
import { ReconstructedBiArcCurve } from "../geom/reconstructed_biarc_curve";
import { ReconstructedThreeBiArcCurve } from "../view/reconstructed_three_biarc_curve";
import { analytic_curves_intersection, analytic_self_intersection } from "../utils/intersect";
import { params } from "./params";
import { clear_selected_obj, selected_obj } from "../interaction/mouse";
import { show_intersections_at_level, update_intersections } from "../view/intersections";
import { level_controller } from "../view/gui";

/** @type {Curve[]} */
export let curves = [];
// The height of each curve.
/** @type {ReconstructedThreeBiArcCurve[]} */
export let recon_curves = [];
// Vertical lines to fill the gap between the curve top and the level top.
export let filling_curves = [];
export let recon_surfaces = [];

export function max_level() {
  let max = 0;
  for (let curve of curves) {
    max = Math.max(max, curve.level);
  }
  return max;
}

export function get_level_height(level) {
  if (level < 0) {
    return 0;
  }
  let height = 0;
  for (let i = 0; i < curves.length; i++) {
    if (curves[i].level == level) {
      height = Math.max(height, curves[i].height);
    }
  }
  if (height == 0)
    return get_level_height(level - 1) + 1;
  return height;
}

export let levels_height = [1];
export function set_level_height(level, height) {
  levels_height[level] = height;
}
export function get_level_bottom(level = params.current_level) {
  return get_level_height(level - 1);
}

export let EditMode = {
  none: "none",
  new_curve: "new_curve",
  edit_curve: "edit_curve",
  move_control_point: "move_control_point",
  move_height_control_point: "move_height_control_point",
  move_tangent_control_point: "move_tangent_control_point",
  new_face: "new_face",
};
export let edit_mode = EditMode.none;
export function set_edit_mode(m) { edit_mode = m; }

export let Mode = {
  orthographic: "top_view",
  perspective: "side_view",
};
export let mode = Mode.orthographic;

export class RealIntersection {
  /**
   * 
   * @param {ReconstructedThreeBiArcCurve} curve1 
   * @param {ReconstructedThreeBiArcCurve} curve2 
   * @param {number} t1 
   * @param {number} t2 
   */
  constructor(curve1, curve2, t1, t2) {
    this.curve1 = curve1;
    this.curve2 = curve2;
    this.t1 = t1;
    this.t2 = t2;
  }
};
export function get_all_real_intersections() {
  let inters = [];
  for (let i = 0; i < curves.length; i++) {
    let self_inters = analytic_self_intersection(curves[i], true);
    for (let inter of self_inters) {
      let t = inter.t;
      inters.push(new RealIntersection(recon_curves[i], recon_curves[i], t, t));
    }

    for (let j = i + 1; j < curves.length; j++) {
      if (curves[i].level != curves[j].level) continue;
      let res = analytic_curves_intersection(curves[i], curves[j], true);
      for (let [t1, t2] of res) {
        if (recon_curves[i].curve.getPoint(t1).distanceTo(recon_curves[j].curve.getPoint(t2)) < 1e-3)
          inters.push(new RealIntersection(recon_curves[i], recon_curves[j], t1, t2));
      }
    }
  }
  return inters;
}

export class Intersection {
  /**
   * 
   * @param {Curve} curve1 
   * @param {Curve} curve2 
   * @param {number} t1 
   * @param {number} t2 
   */
  constructor(curve1, curve2, t1, t2, i1, i2, level) {
    this.curve1 = curve1;
    this.curve2 = curve2;
    this.t1 = t1;
    this.t2 = t2;
    this.i1 = i1;
    this.i2 = i2;
    this.level = level;
  }
};
/** @type {Intersection[]} */
export let intersections = [];

export function find_intersections() {
  intersections.length = 0;

  let closest_t = [...new Array(curves.length)].map(() => -2);
  for (let i = 0; i < curves.length; i++) {
    // Find self intersections.
    let self_inters = analytic_self_intersection(curves[i]);
    for (let inter of self_inters) {
      let t = inter.t;
      intersections.push(new Intersection(curves[i], curves[i], t, t, i, i, curves[i].level));
      if (Math.abs(t - curves[i].prc_t) < Math.abs(closest_t[i] - curves[i].prc_t)) {
        closest_t[i] = t;
      }
    }

    // Find intersections with other curves.
    for (let j = i + 1; j < curves.length; j++) {
      if (curves[i].level != curves[j].level) continue;
      let res = analytic_curves_intersection(curves[i], curves[j]);
      for (let [t1, t2] of res) {
        intersections.push(new Intersection(curves[i], curves[j], t1, t2, i, j, curves[i].level));
        if (Math.abs(t1 - curves[i].prc_t) < Math.abs(closest_t[i] - curves[i].prc_t)) {
          closest_t[i] = t1;
        }
        if (Math.abs(t2 - curves[j].prc_t) < Math.abs(closest_t[j] - curves[j].prc_t)) {
          closest_t[j] = t2;
        }
      }
    }
  }

  // Update prc_t.
  for (let i = 0; i < curves.length; i++) {
    if (closest_t[i] >= 0) {
      curves[i].prc_t = closest_t[i];
    } else {
      curves[i].prc_t = 0.5;
    }
  }
}

/** @type {Curve} */
export let pending_curve = null;
export function add_curve(loc) {
  pending_curve = new Curve(params.rotation_symmetry, params.reflection_symmetry, params.current_level);
  pending_curve.init(loc);
  curves.push(pending_curve);
  set_edit_mode(EditMode.new_curve);
}
export function delete_selected_curve() {
  if (!selected_obj || !selected_obj.type == "unit_curve")
    return;
  let curve = selected_obj.userData;
  clear_selected_obj();
  curves.splice(curves.indexOf(curve), 1);
  curve.destroy();
  update_intersections();
  reconstruct_biarcs();
}

export function add_level() {
  let new_level = max_level() + 1;
  level_controller.controller.valueController.sliderController.props.set('max', new_level);
  level_controller.controller.valueController.value.rawValue = new_level;
  reconstruct_biarcs();
}

export function update_current_level() {
  set_designing_area_height(get_level_height(params.current_level - 1));
  for (let curve of curves) {
    if (curve.level != params.current_level) {
      curve.set_visibility(false);
    } else {
      curve.set_visibility(true);
    }
  }
  for (let recon_curve of recon_curves) {
    if (recon_curve.curve.level != params.current_level) {
      recon_curve.set_control_points_visibility(false);
    } else {
      recon_curve.set_control_points_visibility(true);
    }
  }
  show_intersections_at_level(params.current_level);
}

export function reconstruct_biarcs() {
  for (let curve of recon_curves) {
    curve.destroy();
  }
  recon_curves.length = 0;
  for (let i = 0; i < curves.length; i++) {
    let recon_biarc = new ReconstructedBiArcCurve(curves[i]);
    let recon_three_curve = new ReconstructedThreeBiArcCurve(recon_biarc);
    recon_three_curve.update_curve();
    recon_curves.push(recon_three_curve);
  }
}

export function updated_height(last_top_height, new_top_height, last_mid_height, new_mid_height) {
  for (let recon_three_curve of recon_curves) {
    if (Math.abs(recon_three_curve.curve.top_height - last_top_height) < 1e-3) {
      recon_three_curve.curve.set_top_height(new_top_height);
    } else if (Math.abs(recon_three_curve.curve.middle_height - last_mid_height) < 1e-3) {
      recon_three_curve.curve.set_middle_height(new_mid_height);
    }
  }
  for (let recon_three_curve of recon_curves) {
    recon_three_curve.curve.compute_biarc();
    recon_three_curve.update_curve();
  }
}

export function reconstruct_curves() {
  for (let curve of recon_curves) {
    curve.destroy();
  }
  recon_curves.length = 0;
  for (let surface of recon_surfaces) {
    surface.destroy();
  }
  recon_surfaces.length = 0;

  for (let curve of curves) {
    recon_curves.push(new ReconstructedCurve(curve.control_points, curve.rotation_symmetry, curve.ref_symmetry_point,
      curve.point_labels));
    recon_curves[recon_curves.length - 1].calc_control_points();
    recon_curves[recon_curves.length - 1].update_curve();
  }
  set_control_points_visibility(params.control_points_visible);
}

export function reconstruct_surfaces() {
  for (let surface of recon_surfaces) {
    surface.destroy();
  }
  recon_surfaces.length = 0;
  recon_surfaces.push(new ReconstructedSurface(recon_curves));
  recon_surfaces[recon_surfaces.length - 1].calculate_and_show();
  recon_surfaces[recon_surfaces.length - 1].set_visibility(params.reconstructed_surfaces_visible);
  // for (let curve of recon_curves) {
  //   recon_surfaces.push(new ReconstructedSurface(curve));
  //   recon_surfaces[recon_surfaces.length - 1].calculate_and_show();
  //   recon_surfaces[recon_surfaces.length - 1].set_visibility(params.reconstructed_surfaces_visible);
  // }
}

export function finish_curve() {
  if (pending_curve.control_points.length <= 4) {
    curves.splice(curves.indexOf(pending_curve), 1);
    pending_curve.destroy();
    pending_curve = null;
    set_edit_mode(EditMode.none);
    reconstruct_curves();
    return;
  }
  pending_curve.abort_last_segment();
  pending_curve = null;
  set_edit_mode(EditMode.none);
}

export function clear_all() {
  for (let curve of curves) {
    curve.destroy();
  }
  curves.length = 0;
  for (let curve of recon_curves) {
    curve.destroy();
  }
  recon_curves.length = 0;
  for (let surface of recon_surfaces) {
    surface.destroy();
  }
  recon_surfaces.length = 0;
  set_edit_mode(EditMode.none);
}

export function load_from_curves_file(txt) {
  clear_all();
  curves = load_curves(txt);
  reconstruct_curves();
}

export function set_control_points_visibility(is_visible) {
  for (let curve of curves) {
    curve.set_control_points_visibility(is_visible && curve.level == params.current_level);
  }
  for (let curve of recon_curves) {
    curve.set_control_points_visibility(is_visible && curve.curve.level == params.current_level);
  }
  // if (mode == Mode.orthographic) {
  //   if (Math.abs(camera2d.position.y - 1) < 0.01) {
  //     for (let curve of recon_curves) {
  //       curve.set_control_points_visibility(false);
  //     }
  //   } else {
  //     for (let curve of curves) {
  //       curve.set_control_points_visibility(false);
  //     }
  //   }
  // }
}

export function set_biarc_visibility(is_visible) {
  for (let curve of recon_curves) {
    curve.set_visibility(is_visible);
  }
}

export function set_reconstructed_surface_visibility(is_visible) {
  for (let surface of recon_surfaces) {
    surface.set_visibility(is_visible);
  }
}

export function set_mode(m) {
  mode = m;
  set_control_points_visibility(params.control_points_visible);
}

export function refresh() {
  for (let curve of curves) {
    curve.draw_curve();
  }
  for (let recon_three_curve of recon_curves) {
    recon_three_curve.curve.compute_biarc();
    recon_three_curve.update_curve();
  }
  set_designing_area_height(get_level_bottom(params.current_level));
  show_intersections_at_level(params.current_level);
}

export function export_recon_obj() {
  let tmp_scene = new THREE.Scene();
  for (let recon_curve of recon_curves) {
    for (let obj of recon_curve.three_curves) {
      tmp_scene.add(obj.clone());
    }
  }
  const exporter = new OBJExporter();
  const data = exporter.parse(tmp_scene);
  const blob = new Blob([data], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'exported.obj';
  link.click();
}