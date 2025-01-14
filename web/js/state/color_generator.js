
import * as THREE from 'three';

const colors = 
[0xc05292, 0x836bc0, 0x85c459, 0xfbae24];
const color_materials = colors.map(c => new THREE.MeshStandardMaterial({color: c}));

export function get_curve_color_material(i) {
  return color_materials[i % colors.length];
}

export function get_curve_color(i) {
  return colors[i % colors.length];
}

function rand(min, max) {
  return parseInt(Math.random() * (max-min+1), 10) + min;
}

export function get_random_color() {
  var h = rand(1, 360); // color hue between 1 and 360
  var s = rand(30, 100); // saturation 30-100%
  var l = rand(30, 70); // lightness 30-70%
  return 'hsl(' + h + ',' + s + '%,' + l + '%)';
}