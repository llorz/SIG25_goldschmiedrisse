import { Pane } from "tweakpane";
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';
import { camera2d, scene, orth_camera_controls, update_rotation_symmetry_lines, set_design_area_visibility, update_front_view_cam, set_viewer_theme, update_orbit_controls_target_and_pos, designing_area, set_side_view, set_top_view } from "./visual.js";
import { add_level, curves, export_recon_obj, load_background_image, load_from_curves_file, recon_curves, refresh, set_biarc_visibility, set_control_points_visibility, set_edit_mode, set_mode, set_reconstructed_surface_visibility } from "../state/state.js";
import { params } from "../state/params.js";
import { Quaternion, Vector3 } from "three";
import { Mode, mode } from "../state/state.js";
import { save_curves, save_state } from "../io/save_curves.js";
import { sync_module } from "../native/native.js";

import * as THREE from "three";
import { find_all_faces, init_add_new_face, reconstructed_surface_material } from "./add_face_mode.js";
import { ribbon_surface_material, set_wire_frame, updated_color } from "./reconstructed_three_biarc_curve.js";
import { frame_curves_ortho_cam } from "../utils/camerautils.js";

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

export let view_controller = pane.addBinding(params, 'view', {
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
window.view_controller = view_controller;

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
    set_top_view();
  } else {
    set_side_view();
  }
  set_control_points_visibility(params.control_points_visible);
});
top_view_options.push(ortho_view);

let frame_cam_button = pane.addButton({
  title: 'Frame object',
  hidden: true,
}).on('click', (ev) => {
  update_orbit_controls_target_and_pos();
});
side_view_options.push(frame_cam_button);

let view_options_folder = pane.addFolder({
  title: "Show",
  expanded: false
});

// view_options_folder.addBinding(params, 'theme', {
//   view: 'radiogrid',
//   groupName: 'theme',
//   size: [2, 1],
//   cells: (x, y) => ({
//     title: x == 0 ? 'Light' : 'Dark',
//     value: x == 0 ? 'Light' : 'Dark',
//   }),
//   label: 'Camera',
// }).on('change', (ev) => {
//   if (ev.value == "Light") {
//     params.theme = 'Light';
//   } else {
//     params.theme = 'Dark';
//   }
//   set_viewer_theme();
// })
// ;
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
  title: "View parameters",
  expanded: false
});
surface_params.addBinding(params, "curves_color", {
  view: 'color',
  label: 'Curves color'
}).on('change', (ev) => {
  updated_color(ev.value);
});
surface_params.addBinding(params, "surface_color", {
  view: 'color',
  label: 'Surface Color'
}).on('change', (ev) => {
  reconstructed_surface_material.color.set(ev.value);
  ribbon_surface_material.color.set(ev.value);
});
surface_params.addBinding(params, "use_rmf", {
  label: 'Use RMF'
}).on('change', (ev) => {
  refresh();
});
surface_params.addBinding(params, "cut_intersections", {
  label: 'Cut intersections'
}).on('change', (ev) => {
  refresh();
});
surface_params.addBlade({
  view: 'list',
  label: 'Biarc visualization',
  options: [{ text: 'tube', value: 'tube' }, { text: 'cube', value: 'cube' }, { text: 'ribbon', value: 'ribbon' },
  { text: 'colorful', value: 'colorful' },
  ],
  value: 'cube',
}).on('change', (ev) => {
  params.biarcs_visualization = ev.value;
  refresh();
});

surface_params.addBlade({
  view: 'slider',
  label: 'Tube radius',
  min: 0.001,
  max: 0.1,
  value: params.tube_radius,
}).on('change', (ev) => {
  params.tube_radius = ev.value;
  refresh();
});
surface_params.addBlade({
  view: 'slider',
  label: 'Ribbon width',
  min: 0.02,
  max: 0.5,
  value: params.ribbon_width,
}).on('change', (ev) => {
  params.ribbon_width = ev.value;
  refresh();
});
surface_params.addBinding(params, 'tube_height_segments', {
  label: 'Height segments',
  step: 1,
  min: 30,
  max: 1000,
}).on('change', (ev) => {
  params.tube_height_segments = ev.value;
  refresh();
});
surface_params.addBinding(params, 'tube_circular_segments', {
  label: 'Circular segments',
  step: 1,
  min: 3,
  max: 100,
}).on('change', (ev) => {
  params.tube_circular_segments = ev.value;
  refresh();
});
surface_params.addBinding(params, 'tube_wireframe', {
  label: 'Wireframe',
}).on('change', (ev) => {
  params.tube_wireframe = ev.value;
  set_wire_frame();
  reconstructed_surface_material.wireframe = ev.value;
  reconstructed_surface_material.needsUpdate = true;
  refresh();
});

surface_params.addButton({
  title: 'Add face',
}).on('click', (ev) => {
  init_add_new_face();
});

surface_params.addButton({
  title: 'Construct all faces',
}).on('click', (ev) => {
  find_all_faces();
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
  max: 20,
}).on('change', (ev) => {
  update_rotation_symmetry_lines(ev.value);
});

new_curve_options_folder.addBlade({
  view: 'list',
  label: 'Reflection sym',
  options: [{ text: 'first point', value: 'first point' }, { text: 'last point', value: 'last point' },
  { text: 'y axis', value: 'y axis' },
  { text: 'none', value: 'none' },
  ],
  value: 'first point',
}).on('change', (ev) => {
  params.reflection_symmetry = ev.value;
});

pane.addButton({
  title: 'add layer',
}).on('click', (ev) => {
  add_level();
  // update_current_level();
  refresh();
});
export let level_controller = pane.addBinding(params, 'current_level', {
  label: 'Level',
  step: 1,
  min: 0,
  max: 0,
}).on('change', (ev) => {
  // update_current_level();
  refresh();
});


/*******************************************************************************************/

left_menu = new Pane({
  title: "Load/save",
  expanded: true,
  container: document.getElementById("left_menu"),
});
left_menu.registerPlugin(EssentialsPlugin);

const curves_in_file = ["tn-1", "tn-2", "tn-3", "tn-4", "tn-5", "tn-6", "tn-7", "tn-8",
  "tn-9", "tn-10", "tn-11", "tn-12", "3d_scan"];
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
  // Set the focus back on the body.
  document.activeElement.blur();
});
left_menu.addButton({
  title: 'Load from file',
}).on('click', ev => {
  // Show a dialog for choosing a file.
  var input = document.createElement("input");
  input.type = "file";
  input.click();
  input.onchange = (e) => {
    var file = e.target.files[0];
    var reader = new FileReader();
    reader.onload = function (e) {
      load_from_curves_file(e.target.result);
    };
    reader.readAsText(file);
    // Set the focus back on the body.
    document.activeElement.blur();
  };
});
left_menu.addButton({
  title: 'Load background image',
}).on('click', ev => {
  // Show a dialog for choosing a file.
  var input = document.createElement("input");
  input.type = "file";
  input.click();
  input.onchange = (e) => {
    var file = e.target.files[0];
    load_background_image(file);
    // Set the focus back on the body.
    document.activeElement.blur();
    // var reader = new FileReader();
    // reader.onload = function (e) {
    //   load_from_curves_file(e.target.result);
    // };
    // reader.readAsDataURL(file);
  };
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
  // let saved_curves_names = localStorage.getItem("saved_curves_names");
  // if (!saved_curves_names)
  //   saved_curves_names = params.save_curve_name;
  // else {
  //   if (saved_curves_names.split(",").indexOf(params.save_curve_name) < 0) {
  //     saved_curves_names += "," + params.save_curve_name;
  //   }
  // }
  // localStorage.setItem("saved_curves_names", saved_curves_names);
  let text = save_state();
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = params.save_curve_name + '.uc';
  link.click();
  // localStorage.setItem(params.save_curve_name, text);
  // let api_state = curve_list.exportState();
  // let options = get_curves_list();
  // api_state.options = options;
  // curve_list.importState(api_state);
});

left_menu.addButton({
  title: "Export OBJ",
}).on('click', (ev) => {
  export_recon_obj();
});

