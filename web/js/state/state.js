import * as THREE from 'three';

import { Curve } from "../view/curve";
import { load_curves, load_state } from "../io/load_curves";
import { sync_module } from "../native/native";
import { ReconstructedSurface } from "../view/reconstructed_surface";
import { ReconstructedCurve } from "../view/reconstructed_three_curve";
import { camera2d, designing_area, enable_controls, scene, set_designing_area_height, update_rotation_symmetry_lines } from "../view/visual";
import { ReconstructedBiArcCurve } from "../geom/reconstructed_biarc_curve";
import { ReconstructedThreeBiArcCurve } from "../view/reconstructed_three_biarc_curve";
import { analytic_curves_intersection, analytic_self_intersection, get_rotation_mat } from "../utils/intersect";
import { params } from "./params";
import { clear_selected_obj, selected_obj } from "../interaction/mouse";
import { show_intersections_at_level, update_intersections } from "../view/intersections";
import { level_controller } from "../view/gui";
import { OBJExporter } from '../io/OBJExporter';

/** @type {Curve[]} */
export let curves = [];

/** @type {Curve} curve currently being added */
export let pending_curve = null;

// The height of each curve.
/** @type {ReconstructedThreeBiArcCurve[]} */
export let recon_curves = [];
// Vertical lines to fill the gap between the curve top and the level top.
export let filling_curves = [];
export let recon_surfaces = [];

// The bottom height of each layer.
export let layers_bottom = [0];
export function reset_layer_bottom(max_level = 1) {
  layers_bottom = [...new Array(max_level + 1)].map(x => 0);
}

/** @type {THREE.Mesh} */
export let background_image_plane = null;
export let background_image = null;

export function load_background_image(file) {
  if (background_image_plane) {
    scene.remove(background_image_plane);
    background_image_plane.geometry.dispose();
    background_image_plane.material.dispose();
  }
  if (background_image) {
    background_image.dispose();
  }
  let texture = new THREE.TextureLoader().load(URL.createObjectURL(file), function () {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);

    let width = texture.image.width;
    let height = texture.image.height;
    let aspect = width / height;

    let geometry = new THREE.PlaneGeometry(width, height);
    if (width > height) {
      geometry.scale(2 / height, 2 / height, 1);
    } else {
      geometry.scale(2 / width, 2 / width, 1);
    }
    let material = new THREE.MeshBasicMaterial({ map: texture });
    background_image_plane = new THREE.Mesh(geometry, material);
    background_image_plane.rotation.x = -Math.PI / 2;
    background_image_plane.position.y = -0.01;
    background_image_plane.name = "background_image";
    background_image_plane.material.side = THREE.DoubleSide;
    background_image_plane.material.transparent = true;
    background_image_plane.material.opacity = 1.0;
    scene.add(background_image_plane);
    background_image = texture;
  });
  designing_area.visible = false;

}

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
    return get_level_bottom(level) + 1;
  return height;
}

export let levels_height = [1];
export function set_level_height(level, height) {
  levels_height[level] = height;
}
export function get_level_bottom(level = params.current_level) {
  return level < layers_bottom.length ? layers_bottom[level] : get_level_height(level - 1);
}
export function set_level_bottom(level, bottom) {
  // if (level < layers_bottom.length) {
  //   layers_bottom[level] = bottom;
  // }
  // layers_bottom.push(bottom);
  let diff = bottom - layers_bottom[level];
  for (let i = level; i < layers_bottom.length; i++) {
    layers_bottom[i] += diff;
  }
  for (let curve of curves) {
    if (curve.level >= level) {
      curve.height += diff;
    }
  }
}

export let EditMode = {
  none: "none",
  new_curve: "new_curve",
  edit_curve: "edit_curve",
  move_control_point: "move_control_point",
  move_height_control_point: "move_height_control_point",
  move_tangent_control_point: "move_tangent_control_point",
  new_face: "new_face",
  edit_decoration_point: "edit_decoration_point",
  change_layer_bottom: "change_layer_bottom",
  edit_prc_point: "edit_prc_point",
  edit_vertical_line_top: "edit_vertical_line_top",
  start_scale_background_image: "start_scale_background_image",
  scale_background_image: "scale_background_image",
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
      let t = recon_curves[i].curve.get_t_for_x(inter.t);
      inters.push(new RealIntersection(recon_curves[i], recon_curves[i], t, t));
    }

    for (let j = i + 1; j < curves.length; j++) {
      if (curves[i].level != curves[j].level) continue;
      let res = analytic_curves_intersection(curves[i], curves[j], true);
      for (let inter of res) {
        let t1 = recon_curves[i].curve.get_t_for_x(inter[0]);
        let t2 = recon_curves[j].curve.get_t_for_x(inter[1]);
        if (recon_curves[i].curve.getPoint(t1).distanceTo(recon_curves[j].curve.getPoint(t2)) < 1e-3)
          inters.push(new RealIntersection(recon_curves[i], recon_curves[j], t1, t2));
      }
    }
  }
  return inters;
}

export function get_all_feature_points() {
  let inters = get_all_real_intersections();
  let feature_points = [];
  for (let inter of inters) {
    let pt = inter.curve1.curve.getPoint(inter.t1);
    let rot_sym = inter.curve1.rotation_symmetry;
    for (let rot = 0; rot < rot_sym; rot++) {
      feature_points.push({
        pt: pt.clone().applyMatrix4(get_rotation_mat(rot_sym, rot)),
        level: inter.curve1.curve.level
      });
    }
  }
  for (let i = 0; i < curves.length; i++) {
    let pt = recon_curves[i].curve.getPoint(0);
    let pt1 = recon_curves[i].curve.getPoint(1);
    let rot_sym = recon_curves[i].rotation_symmetry;
    for (let rot = 0; rot < rot_sym; rot++) {
      feature_points.push({
        pt: pt.clone().applyMatrix4(get_rotation_mat(rot_sym, rot)),
        level: recon_curves[i].curve.level
      });
      feature_points.push({
        pt: pt1.clone().applyMatrix4(get_rotation_mat(rot_sym, rot)),
        level: recon_curves[i].curve.level
      });
    }
  }
  return feature_points;
}

export function update_supporting_pillars() {
  let feature_points = get_all_feature_points();
  for (let curve of curves) {
    if (curve.level == 0) continue;
    let highest = 0;
    curve.supporting_pillar_point = null;
    for (let feature_pt of feature_points) {
      if (feature_pt.level >= curve.level) continue;
      if (Math.abs((curve.control_points[0].x - feature_pt.pt.x) ** 2 +
        (curve.control_points[0].z - feature_pt.pt.z) ** 2) < 1e-3 &&
        feature_pt.pt.y >= highest) {
        curve.supporting_pillar_point = feature_pt.pt;
        highest = feature_pt.pt.y;
      }
    }
    curve.supporting_pillar_point = new THREE.Vector3(
      curve.control_points[0].x, highest, curve.control_points[0].z);
  }
}

export function get_available_layer_heights() {
  let available_layer_heights = [0];
  for (let curve of curves) {
    available_layer_heights.push(curve.height);
  }
  let intersections = get_all_real_intersections();
  for (let inter of intersections) {
    available_layer_heights.push(inter.curve1.curve.getPoint(inter.t1).y);
  }
  // Remove duplicates.
  available_layer_heights = available_layer_heights.filter((v, i, a) => a.indexOf(v) === i);
  // Sort.
  available_layer_heights.sort((a, b) => a - b);
  return available_layer_heights;
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
          // closest_t[i] = t1;
        }
        if (Math.abs(t2 - curves[j].prc_t) < Math.abs(closest_t[j] - curves[j].prc_t)) {
          // closest_t[j] = t2;
        }
      }
    }
  }

  // Update prc_t.
  for (let i = 0; i < curves.length; i++) {
    if (edit_mode != EditMode.new_curve || curves[i] != pending_curve) {
      continue;
    }
    if (closest_t[i] >= 0) {
      curves[i].prc_t = closest_t[i];
    } else {
      curves[i].prc_t = 0.5;
    }
  }
}


export function add_curve(loc) {
  pending_curve = new Curve(params.rotation_symmetry, params.reflection_symmetry, params.current_level);
  pending_curve.init(loc);
  curves.push(pending_curve);
  set_edit_mode(EditMode.new_curve);
}
export function delete_selected_curve(selected_obj) {
  if (!selected_obj || !selected_obj.type == "unit_curve")
    return;
  let curve = selected_obj.userData;
  clear_selected_obj();
  let ind = curves.indexOf(curve);
  curves.splice(ind, 1);
  curve.destroy();
  if (ind < recon_curves.length) {
    recon_curves[ind].destroy();
    recon_curves.splice(ind, 1);
  }
  update_intersections();
}

export function add_level() {
  let new_level = max_level() + 1;
  level_controller.controller.valueController.sliderController.props.set('max', new_level);
  level_controller.controller.valueController.value.rawValue = new_level;
  let max_height = 0;
  for (let curve of curves) {
    max_height = Math.max(max_height, curve.height);
  }
  layers_bottom.push(max_height);
}

export function update_current_level() {
  set_designing_area_height(get_level_bottom(params.current_level));
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

export function reconstruct_biarcs(curve = null) {
  let ind = curves.indexOf(curve);
  if (ind == -1) {
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
  } else {
    if (ind < recon_curves.length)
      recon_curves[ind].destroy();
    let recon_biarc = new ReconstructedBiArcCurve(curve);
    let recon_three_curve = new ReconstructedThreeBiArcCurve(recon_biarc);
    recon_three_curve.update_curve();
    if (ind < recon_curves.length)
      recon_curves[ind] = recon_three_curve;
    else
      recon_curves.push(recon_three_curve);
  }
  update_supporting_pillars();
}

export function udpated_layer_bottom(level, bottom) {
  for (let recon_three_curve of recon_curves) {
    if (recon_three_curve.curve.level == level) {
      recon_three_curve.curve.curve.draw_curve();
    }
    recon_three_curve.curve.compute_biarc();
    recon_three_curve.update_curve();
  }
  update_supporting_pillars();
}

export function updated_height(last_top_height, last_mid_height, curve) {
  let new_top_height = curve.top_height;
  let new_mid_height = curve.middle_height;
  for (let recon_three_curve of recon_curves) {
    if (recon_three_curve.curve == curve) continue;
    if (Math.abs(recon_three_curve.curve.top_height - last_top_height) < 1e-3) {
      recon_three_curve.curve.set_top_height(new_top_height);
      recon_three_curve.update_curve();
    } else if (Math.abs(recon_three_curve.curve.middle_height - last_mid_height) < 1e-3) {
      recon_three_curve.curve.set_middle_height(new_mid_height);
      recon_three_curve.update_curve();
    }
  }
  // The bottom might have changed, update the curves in the next level.
  for (let recon_three_curve of recon_curves) {
    if (recon_three_curve.curve.level == curve.level + 1) {
      recon_three_curve.curve.compute_biarc();
      recon_three_curve.update_curve();
    }
  }
}

export function finish_curve() {
  if (pending_curve.control_points.length <= 3) {
    delete_selected_curve(pending_curve.three_curves[0]);
    pending_curve = null;
    set_edit_mode(EditMode.none);
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
    surface.geometry.dispose();
    scene.remove(surface);
  }
  recon_surfaces.length = 0;
  set_edit_mode(EditMode.none);
}

export function clear_all_surfaces() {
  for (let surface of recon_surfaces) {
    surface.geometry.dispose();
    scene.remove(surface);
  }
  recon_surfaces.length = 0;
}

export function load_from_curves_file(txt) {
  clear_all();
  load_state(txt);
  level_controller.controller.valueController.sliderController.props.set('max', max_level());
  level_controller.controller.valueController.value.rawValue = 0;
  reconstruct_biarcs();
  update_supporting_pillars();
  update_current_level();
  refresh();
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
  update_intersections();
  for (let curve of curves) {
    if (params.preview_mode == 'Design' && curve.level == params.current_level) {
      curve.draw_curve();
      curve.set_visibility(true);
    } else {
      curve.set_visibility(false);
    }
  }
  for (let recon_three_curve of recon_curves) {
    recon_three_curve.curve.compute_biarc();
    recon_three_curve.update_curve();
  }
  set_designing_area_height(get_level_bottom(params.current_level));
}

export function export_recon_obj() {
  let tmp_scene = new THREE.Scene();
  let group1 = new THREE.Group();
  for (let recon_curve of recon_curves) {
    for (let obj of recon_curve.three_curves) {
      group1.add(obj.clone());
    }
  }
  tmp_scene.add(group1);
  let group2 = new THREE.Group();
  for (let recon_surface of recon_surfaces) {
    group2.add(recon_surface.clone());
  }
  tmp_scene.add(group2);
  const exporter = new OBJExporter();
  const data = exporter.parse(tmp_scene);
  const blob = new Blob([data], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'exported.obj';
  link.click();
}