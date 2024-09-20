import { Curve } from "../geom/curve";
import { load_curves } from "../io/load_curves";
import { ReconstructedSurface } from "../view/reconstructed_surface";
import { ReconstructedCurve } from "../view/reconstructed_three_curve";
import { camera2d, enable_controls } from "../view/visual";

export let params = {
  view: "Ortho",
  ortho_view: "Top view",
  rotation_symmetry: 4,
  reflection_symmetry: true,
  control_points_visible: true,
  reconstructed_surfaces_visible: true,
  surface_color: "0xbde0fe",
  save_curve_name: "tmp_unit_curve",
};

export let curves = [];
export let recon_curves = [];
export let recon_surfaces = [];

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

/** @type {Curve} */
export let pending_curve = null;
export function add_curve(loc) {
  pending_curve = new Curve(params.rotation_symmetry, params.reflection_symmetry);
  pending_curve.init(loc);
  curves.push(pending_curve);
  set_edit_mode(EditMode.new_curve);
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
  for (let curve of recon_curves) {
    recon_surfaces.push(new ReconstructedSurface(curve));
    recon_surfaces[recon_surfaces.length - 1].calculate_and_show();
    recon_surfaces[recon_surfaces.length - 1].set_visibility(params.reconstructed_surfaces_visible);
  }
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

export function set_reconstructed_surface_visibility(is_visible) {
  for (let surface of recon_surfaces) {
    surface.set_visibility(is_visible);
  }
}

export function set_mode(m) {
  mode = m;
  set_control_points_visibility(params.control_points_visible);
}