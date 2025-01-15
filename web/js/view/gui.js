import { Pane } from "tweakpane";
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';
import { camera2d, scene, orth_camera_controls, update_rotation_symmetry_lines, set_design_area_visibility, update_front_view_cam } from "./visual.js";
import { add_level, curves, export_recon_obj, load_from_curves_file, recon_curves, reconstruct_surfaces, refresh, set_biarc_visibility, set_control_points_visibility, set_edit_mode, set_mode, set_reconstructed_surface_visibility, update_current_level } from "../state/state.js";
import { params } from "../state/params.js";
import { Quaternion, Vector3 } from "three";
import { Mode, mode } from "../state/state.js";
import { save_curves, save_state } from "../io/save_curves.js";
import { sync_module } from "../native/native.js";

import * as THREE from "three";
import { surface_material } from "./reconstructed_surface.js";
import { init_add_new_face } from "./add_face_mode.js";

export let pane = new Pane({
  title: "Menu",
  expanded: true,
});
pane.registerPlugin(EssentialsPlugin);
export let left_menu;


let top_view_options = [], side_view_options = [];
function set_top_view_visibility(hidden) {
  for (let option of top_view_options) {
    option.hidden = hidden
  }
  for (let option of side_view_options) {
    option.hidden = !hidden
  }
}

pane.addBinding(params, 'view', {
  view: 'radiogrid',
  groupName: 'view',
  size: [2, 1],
  cells: (x, y) => ({
    title: x == 0 ? 'Ortho' : 'Perspective',
    value: x == 0 ? 'Ortho' : 'Perspective',
  }),
  label: 'Camera',
}).on('change', (ev) => {
  if (ev.value == "Ortho") {
    set_mode(Mode.orthographic);
    set_top_view_visibility(false);
  } else {
    set_mode(Mode.perspective);
    set_top_view_visibility(true);
  }
});

pane.addBinding(params, 'preview_mode', {
  view: 'radiogrid',
  groupName: 'preview_mode',
  size: [2, 1],
  cells: (x, y) => ({
    title: x == 0 ? 'Design' : 'Preview',
    value: x == 0 ? 'Design' : 'Preview',
  }),
  label: 'Mode',
}).on('change', (ev) => {
  if (ev.value == "Design") {
    document.getElementById("preview_area").style.display = "none";
    left_menu.hidden = false;
    set_design_area_visibility(true);
    refresh();
  } else {
    document.getElementById("preview_area").style.display = "flex";
    left_menu.hidden = true;
    set_design_area_visibility(false);
    update_front_view_cam();
    refresh();
  }
});

let ortho_view = pane.addBlade({
  view: 'buttongrid',
  groupName: 'ortho_view',
  size: [2, 1],
  cells: (x, y) => ({
    title: [
      ['Top view', 'Side view'],
    ][y][x],
  }),
  label: 'View',
}).on('click', (ev) => {
  if (ev.index[0] == 0) {
    camera2d.position.set(0, 100, 0);
    camera2d.up.set(0, 1, 0);
    orth_camera_controls.target.set(0, 0, 0);
    orth_camera_controls._quat = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(0, 1, 0));
    orth_camera_controls._quatInverse = orth_camera_controls._quat.clone().invert();
  } else {
    camera2d.position.set(0, 0, 1);
    camera2d.up.set(0, 0, 1);
    orth_camera_controls.target.set(0, 0, 0);
    orth_camera_controls._quat = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), new Vector3(0, 1, 0));
    orth_camera_controls._quatInverse = orth_camera_controls._quat.clone().invert();
  }
  set_control_points_visibility(params.control_points_visible);
});
top_view_options.push(ortho_view);

let view_options_folder = pane.addFolder({
  title: "Show",
  expanded: true
});
view_options_folder.addBinding(params, 'control_points_visible', {
  label: 'Control points',
}).on('change', (ev) => {
  set_control_points_visibility(ev.value);
});

view_options_folder.addBinding(params, 'reconstructed_biarc_visible', {
  label: 'Biarcs',
}).on('change', (ev) => {
  set_biarc_visibility(ev.value);
});

view_options_folder.addBinding(params, 'reconstructed_surfaces_visible', {
  label: 'Surface',
}).on('change', (ev) => {
  set_reconstructed_surface_visibility(ev.value);
});


view_options_folder.addBlade({
  view: 'separator',
});

let surface_params = pane.addFolder({
  title: "Surface parameters",
  expanded: true
});
surface_params.addBinding(params, "surface_color", {
  view: 'color',
  label: 'Surface Color'
}).on('change', (ev) => {
  surface_material.color.set(ev.value);
});
surface_params.addBinding(params, "use_rmf", {
  label: 'Use RMF'
}).on('change', (ev) => {
  refresh();
});
surface_params.addBlade({
  view: 'list',
  label: 'Biarc visualization',
  options: [{ text: 'tube', value: 'tube' }, { text: 'ribbon', value: 'ribbon' },
  { text: 'colorful', value: 'colorful' },
  ],
  value: 'tube',
}).on('change', (ev) => {
  params.biarcs_visualization = ev.value;
  refresh();
});

pane.addBlade({
  view: 'slider',
  label: 'Tube radius',
  min: 0.001,
  max: 0.04,
  value: 0.007,
}).on('change', (ev) => {
  params.tube_radius = ev.value;
  refresh();
});

let new_curve_options_folder = pane.addFolder({
  title: "New curve options",
  expanded: true
});
top_view_options.push(new_curve_options_folder);
// Top view options.
new_curve_options_folder.addBinding(params, 'rotation_symmetry', {
  label: 'Rotation Symmetry',
  step: 1,
  min: 1,
  max: 10,
}).on('change', (ev) => {
  update_rotation_symmetry_lines(ev.value);
});

new_curve_options_folder.addBlade({
  view: 'list',
  label: 'Reflection sym',
  options: [{ text: 'first point', value: 'first point' }, { text: 'last point', value: 'last point' },
  { text: 'none', value: 'none' },
  ],
  value: 'first point',
}).on('change', (ev) => {
  params.reflection_symmetry = ev.value;
});

pane.addButton({
  title: 'add level',
}).on('click', (ev) => {
  add_level();
  update_current_level();
});
export let level_controller = pane.addBinding(params, 'current_level', {
  label: 'Level',
  step: 1,
  min: 0,
  max: 0,
}).on('change', (ev) => {
  update_current_level();
});


pane.addButton({
  title: 'Add face',
}).on('click', (ev) => {
  init_add_new_face();
});


/*******************************************************************************************/

left_menu = new Pane({
  title: "Load/save",
  expanded: true,
  container: document.getElementById("left_menu"),
});
left_menu.registerPlugin(EssentialsPlugin);

const curves_in_file = ["tn-1", "tn-2", "tn-3", "tn-4", "tn-7", "tn-12", "two_curves"];
function get_saved_curves_names() {
  let saved_curves_names = localStorage.getItem("saved_curves_names");
  if (!saved_curves_names) {
    return [];
  }
  return saved_curves_names.split(",");
}
function get_curves_list() {
  let lst = [];
  for (let curve of curves_in_file) {
    lst.push({ text: curve, value: curve });
  }
  let saved_curves_names = localStorage.getItem("saved_curves_names");
  if (!!saved_curves_names) {
    for (let curve of saved_curves_names.split(",")) {
      lst.push({ text: curve, value: curve });
    }
  }
  return lst;
}

let curve_list = left_menu.addBlade({
  view: 'list',
  label: 'curves',
  options: get_curves_list(),
  value: 'tn-1',
});
let button = left_menu.addButton({
  title: 'Load',
}).on('click', (ev) => {
  let is_saved_curve = get_saved_curves_names().indexOf(curve_list.value) >= 0;
  if (!is_saved_curve)
    fetch("data/" + curve_list.value + ".uc").then(res => res.text()).then(text => load_from_curves_file(text));
  else
    load_from_curves_file(localStorage.getItem(curve_list.value));
});
left_menu.addButton({
  title: 'Delete',
}).on('click', (ev) => {
  let names = get_saved_curves_names();
  let idx = names.indexOf(curve_list.value);
  if (idx >= 0) {
    names.splice(idx, 1);
    localStorage.setItem("saved_curves_names", names.join(","));
    localStorage.removeItem(curve_list.value);
    let api_state = curve_list.exportState();
    let options = get_curves_list();
    api_state.options = options;
    curve_list.importState(api_state);
  }
});
left_menu.addBlade({
  view: 'separator',
});

left_menu.addBinding(params, 'save_curve_name', {
  label: 'Name',
});
left_menu.addButton({
  title: 'Save',
}).on('click', (ev) => {
  let saved_curves_names = localStorage.getItem("saved_curves_names");
  if (!saved_curves_names)
    saved_curves_names = params.save_curve_name;
  else {
    if (saved_curves_names.split(",").indexOf(params.save_curve_name) < 0) {
      saved_curves_names += "," + params.save_curve_name;
    }
  }
  localStorage.setItem("saved_curves_names", saved_curves_names);
  let text = save_state();
  localStorage.setItem(params.save_curve_name, text);
  let api_state = curve_list.exportState();
  let options = get_curves_list();
  api_state.options = options;
  curve_list.importState(api_state);
});

left_menu.addButton({
  title: 'Test',
}).on('click', (ev) => {
  reconstruct_surfaces();
});


left_menu.addButton({
  title: "Export OBJ",
}).on('click', (ev) => {
  export_recon_obj();
});

