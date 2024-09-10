import { Curve } from "../geom/curve";
import { enable_controls } from "../view/visual";

export let params = {
  view: "Top View",
  rotation_symmetry: 6,
  reflection_symmetry: false,
};

export let curves = [];
export let recon_curves = [];

export let EditMode = {
  none: "none",
  new_curve: "new_curve",
  edit_curve: "edit_curve",
  move_control_point: "move_control_point",
};
export let edit_mode = EditMode.none;
export function set_edit_mode(m) { edit_mode = m; }

/** @type {Curve} */
export let pending_curve = null;
export function add_curve(loc) {
  pending_curve = new Curve(params.rotation_symmetry, params.reflection_symmetry);
  pending_curve.init(loc);
  curves.push(pending_curve);
  set_edit_mode(EditMode.new_curve);
}
export function finish_curve() {
  if (pending_curve.control_points.length <= 4) {
    curves.splice(curves.indexOf(pending_curve), 1);
    pending_curve.destroy();
    pending_curve = null;
    set_edit_mode(EditMode.none);
    return;
  }
  pending_curve.abort_last_segment();
  pending_curve = null;
  set_edit_mode(EditMode.none);
}