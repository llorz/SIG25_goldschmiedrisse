import "./view/visual.js";
import "./interaction/mouse.js";
import "./view/gui.js";
import "./interaction/keyboard.js";
import "./native/native.js"

import * as THREE from 'three';

window.THREE = THREE;

import * as VIEWER from './view/visual.js';
import * as STATE from './state/state.js';
window.VIEWER = VIEWER;
window.STATE = STATE;