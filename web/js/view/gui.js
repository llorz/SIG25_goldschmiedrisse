import { Pane } from "tweakpane";
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';
import { set_mode, Mode } from "./visual.js";

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
    title: x == 0 ? 'Top View' : 'Perspective',
    value: x == 0 ? 'Top View' : 'Perspective',
  }),
  label: 'View',
}).on('change', (ev) => {
  if (ev.value == "Top View") {
    set_mode(Mode.top_view);
    set_top_view_visibility(false);
  } else {
    set_mode(Mode.side_view);
    set_top_view_visibility(true);
  }
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
});

new_curve_options_folder.addBinding(params, 'reflection_symmetry', {
  label: 'Reflection Symmetry',
});