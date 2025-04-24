import "./state/state.js";
import "./view/visual.js";
import "./interaction/mouse.js";
import "./view/gui.js";
import "./interaction/keyboard.js";
import "./native/native.js"
import { BiArcCurve } from "./geom/biarc_curve.js";

import * as THREE from 'three';

window.THREE = THREE;

import * as STATE from './state/state.js';
import * as VIEWER from './view/visual.js';
window.VIEWER = VIEWER;
window.STATE = STATE;

export function show_help() {

  let help_stuff = document.getElementById("help");
  if (help_stuff.style.width == "0px" || help_stuff.style.width == "") {
    document.getElementById("help").style.visibility = "visible";
    document.getElementById("help").style.width = "40vw"
    document.getElementById("help").style.height = "60vh"
    return;
  }
  help_stuff.style.width = "0px"
  help_stuff.style.height = "0px"

}

document.getElementById("help_icon").onclick = show_help;