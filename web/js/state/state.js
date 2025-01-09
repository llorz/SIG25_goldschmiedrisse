import { Curve } from "../view/curve";
import { load_curves } from "../io/load_curves";
import { sync_module } from "../native/native";
import { ReconstructedSurface } from "../view/reconstructed_surface";
import { ReconstructedCurve } from "../view/reconstructed_three_curve";
import { camera2d, enable_controls, set_designing_area_height, update_rotation_symmetry_lines } from "../view/visual";
import { ReconstructedBiArcCurve } from "../geom/reconstructed_biarc_curve";
import { ReconstructedThreeBiArcCurve } from "../view/reconstructed_three_biarc_curve";
import { analytic_curves_intersection, analytic_self_intersection, curves_intersection, self_sym_intersections } from "../utils/intersect";
import { params } from "./params";
import { clear_selected_obj, selected_obj } from "../interaction/mouse";
import { show_intersections_at_level, update_intersections } from "../view/intersections";
import { level_controller } from "../view/gui";

/** @type {Curve[]} */
export let curves = [];
export let recon_curves = [];
export let recon_surfaces = [];
export let levels_height = [1];
export function set_level_height(level, height) {
  levels_height[level] = height;
}
export function get_level_bottom(level = params.current_level) {
  return params.current_level == 0 ? 0 : levels_height[level - 1];
}

export let EditMode = {
  none: "none",
  new_curve: "new_curve",
  edit_curve: "edit_curve",
  move_control_point: "move_control_point",
  move_height_control_point: "move_height_control_point",
  move_tangent_control_point: "move_tangent_control_point",
};
export let edit_mode = EditMode.none;
export function set_edit_mode(m) { edit_mode = m; }

export let Mode = {
  orthographic: "top_view",
  perspective: "side_view",
};
export let mode = Mode.orthographic;

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
export let prc_t = [];

export function find_intersections() {
  intersections.length = 0;
  // Add missing prc_t.
  for (let i = prc_t.length; i < curves.length; i++) {
    prc_t.push(0.5);
  }

  let closest_t = [...new Array(curves.length)].map(() => -2);
  for (let i = 0; i < curves.length; i++) {
    // Find self intersections.
    let self_inters = analytic_self_intersection(curves[i]);
    for (let t of self_inters) {
      intersections.push(new Intersection(curves[i], curves[i], t, t, i, i, curves[i].level));
      if (Math.abs(t - prc_t[i]) < Math.abs(closest_t[i] - prc_t[i])) {
        closest_t[i] = t;
      }
    }

    // Find intersections with other curves.
    for (let j = i + 1; j < curves.length; j++) {
      if (curves[i].level != curves[j].level) continue;
      let res = analytic_curves_intersection(curves[i], curves[j]);
      for (let [t1, t2] of res) {
        intersections.push(new Intersection(curves[i], curves[j], t1, t2, i, j, curves[i].level));
        if (Math.abs(t1 - prc_t[i]) < Math.abs(closest_t[i] - prc_t[i])) {
          closest_t[i] = t1;
        }
        if (Math.abs(t2 - prc_t[j]) < Math.abs(closest_t[j] - prc_t[j])) {
          closest_t[j] = t2;
        }
      }
    }
  }

  // Update prc_t.
  for (let i = 0; i < curves.length; i++) {
    if (closest_t[i] >= 0) {
      prc_t[i] = closest_t[i];
    } else {
      prc_t[i] = 0.5;
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
  let top_level = levels_height.length - 1;
  // for (let curve of curves) {
  //   if (curve.level == top_level) {
  //     let new_curve = new Curve(curve.rotation_symmetry, curve.control_points[curve.control_points.length - 1], curve.level + 1);
  //     new_curve.control_points = [...curve.control_points].reverse();
  //     new_curve.get_bezy_curve();
  //     curves.push(new_curve);
  //   }
  // }
  levels_height.push(levels_height[top_level] + 1);
  level_controller.controller.valueController.sliderController.props.set('max', levels_height.length - 1);
  level_controller.controller.valueController.value.rawValue = levels_height.length - 1;
  reconstruct_biarcs();
}

export function update_current_level() {
  set_designing_area_height(params.current_level == 0 ? 0 : levels_height[params.current_level - 1]);
  for (let curve of curves) {
    if (curve.level != params.current_level) {
      curve.set_visibility(false);
    } else {
      curve.set_visibility(true);
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
    let recon_biarc = new ReconstructedBiArcCurve(curves[i].arc_curve, curves[i].rotation_symmetry, curves[i].ref_symmetry_point, curves[i].level, prc_t[i]);
    let recon_three_curve = new ReconstructedThreeBiArcCurve(recon_biarc);
    recon_three_curve.update_curve();
    recon_curves.push(recon_three_curve);
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
    // if (curve.control_points.length > 4) continue;
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
    curve.set_control_points_visibility(is_visible);
  }
  for (let curve of recon_curves) {
    curve.set_control_points_visibility(is_visible);
  }
  if (mode == Mode.orthographic) {
    if (Math.abs(camera2d.position.y - 1) < 0.01) {
      for (let curve of recon_curves) {
        curve.set_control_points_visibility(false);
      }
    } else {
      for (let curve of curves) {
        curve.set_control_points_visibility(false);
      }
    }
  }
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