import { Pane } from "tweakpane";
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';
import { set_mode, Mode, camera2d } from "./visual.js";

import { params } from "../state/state.js";

export let pane = new Pane({
  title: "Menu",
  expanded: true,
  // container: document.getElementById("menumenu"),
});
pane.registerPlugin(EssentialsPlugin);



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
    set_mode(Mode.top_view);
    set_top_view_visibility(false);
  } else {
    set_mode(Mode.side_view);
    set_top_view_visibility(true);
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
    camera2d.position.set(0, 1, 0);
  } else {
    camera2d.position.set(0, 0, 1);
    camera2d.up.set(0, 0, 1);
    camera2d.right
    camera2d.lookAt(new THREE.Vector3(0, 0, 0));
  }
});
top_view_options.push(ortho_view);
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
});

new_curve_options_folder.addBinding(params, 'reflection_symmetry', {
  label: 'Reflection Symmetry',
});