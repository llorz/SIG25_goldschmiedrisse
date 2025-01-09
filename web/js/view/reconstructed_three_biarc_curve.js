import * as THREE from 'three';

import { scene } from './visual';

import { ReconstructedBiArcCurve } from '../geom/reconstructed_biarc_curve';
import { sync_module } from '../native/native';
import { get_reflection_mat } from '../utils/intersect';
import { params } from '../state/params';

let sweep_plane_geom = new THREE.PlaneGeometry(100, 0.1, 100 * 20, 1);
sweep_plane_geom.computeBoundingBox();
var size = new THREE.Vector3();
sweep_plane_geom.boundingBox.getSize(size);
sweep_plane_geom.translate(-sweep_plane_geom.boundingBox.min.x, -sweep_plane_geom.boundingBox.min.y - size.y / 2, -sweep_plane_geom.boundingBox.min.z - size.z / 2);

const sweep_plane_material = new THREE.MeshStandardMaterial({ color: 0x0099ff, side: THREE.DoubleSide })

const tangent_line_material = new THREE.MeshBasicMaterial({ color: 0x00aa00 });
const sphere_geom = new THREE.SphereGeometry(0.01, 32, 32);
let control_point_material = new THREE.MeshBasicMaterial({ color: 0x0 });
let main_curve_material = new THREE.MeshLambertMaterial({ color: 0xff0000, side: THREE.DoubleSide });
// let symmetry_curve_material = new THREE.MeshLambertMaterial({
//   color: 0x000000, side: THREE.DoubleSide,
//   opacity: 0.6, transparent: true
// });
let symmetry_curve_material = new THREE.MeshStandardMaterial({
  color: 0xFFD700, side: THREE.DoubleSide,
  opacity: 1., transparent: true,
  // metalness: 0.6, roughness: 0.3, reflectivity: 0.5, clearcoat: 0.5, clearcoatRoughness: 0.5,
});
let symmetry_reflection_curve_material = new THREE.MeshStandardMaterial({
  color: 0xFFD700, side: THREE.DoubleSide,
  opacity: 1., transparent: true,
  // metalness: 0.6, roughness: 0.3, reflectivity: 0.5, clearcoat: 0.5, clearcoatRoughness: 0.5
});
// let symmetry_reflection_curve_material = new THREE.MeshLambertMaterial({
//   color: 0x000000, side: THREE.DoubleSide,
//   opacity: 0.6, transparent: true
// });

function last_elem(arr) {
  return arr[arr.length - 1];
}

export class ReconstructedThreeBiArcCurve {
  constructor(curve) {
    /** @type {ReconstructedBiArcCurve} */
    this.curve = curve;
    this.ref_symmetry_point = this.curve.ref_symmetry_point;
    this.rotation_symmetry = this.curve.rotation_symmetry;
    this.level = this.curve.level;

    this.control_points = [];
    this.control_points_tangent = [];
    this.tangent_points_base_index = [];
    this.tangent_lines = [];

    this.three_curves = [];
    this.create_control_points();
  }

  get_reflection_mat() {
    let x = this.ref_symmetry_point.x, y = 0, z = this.ref_symmetry_point.z;
    let norm = Math.sqrt(x * x + y * y + z * z);
    x /= norm; y /= norm; z /= norm;
    let mat = new THREE.Matrix4().set
      (2 * x * x - 1, 2 * x * y, 2 * x * z, 0,
        0, 1, 0, 0,
        2 * z * x, 2 * z * y, 2 * z * z - 1, 0,
        0, 0, 0, 1);
    return mat;
  }

  create_control_points() {
    let cp1 = new THREE.Mesh(sphere_geom, control_point_material);
    cp1.type = "height_control_point";
    cp1.userData = this;

    cp1.position.copy(this.curve.getPoint(this.curve.arca_len / this.curve.len));
    this.control_points.push(cp1);
    scene.add(cp1);

    let cp2 = new THREE.Mesh(sphere_geom, control_point_material);
    cp2.type = "height_control_point";
    cp2.userData = this;
    cp2.position.copy(this.curve.getPoint(1));
    this.control_points.push(cp2);
    scene.add(cp2);
  }

  move_control_point(three_point_mesh, new_loc) {
    let idx = this.control_points.indexOf(three_point_mesh);
    if (idx == -1) return;
    if (idx == 0) {
      this.curve.set_middle_height(new_loc.y);
    } else if (idx == 1) {
      this.curve.set_top_height(new_loc.y);
    }
    this.control_points[0].position.y = this.curve.middle_height;
    this.control_points[1].position.y = this.curve.top_height;
    this.update_curve();
  }

  sweep_plane() {
    let geom = sweep_plane_geom.clone();
    let v = new THREE.Vector3();
    for (let i = 0, l = geom.attributes.position.count; i < l; i++) {
      v.fromBufferAttribute(geom.attributes.position, i);
      let t = v.x / size.x;
      let frame = this.curve.getFrame(t);
      let new_v = frame.position.clone().add(frame.normal.clone().multiplyScalar(v.z)).add(frame.binormal.clone().multiplyScalar(v.y));
      geom.attributes.position.setXYZ(i, new_v.x, new_v.y, new_v.z);
    }
    geom.computeVertexNormals();
    return geom;
  }

  update_curve() {
    for (let curve of this.three_curves) {
      curve.geometry.dispose();
      scene.remove(curve);
    }
    this.three_curves.length = 0;

    let curve_points = 64;//this.points.length * 32;
    let tube_geom =// this.sweep_plane(); 
    new THREE.TubeGeometry(this.curve, curve_points, 0.005, 8, false);
    for (let i = 0; i < this.rotation_symmetry; i++) {
      let tube = new THREE.Mesh(tube_geom,
        // i == 0 ? sweep_plane_material : sweep_plane_material);
        i == 0 ? main_curve_material : symmetry_curve_material);
      tube.type = "ns_line";
      tube.rotateY((2 * Math.PI / this.rotation_symmetry) * i);
      this.three_curves.push(tube);
      scene.add(tube);
    }
    if (!!this.ref_symmetry_point) {
      let ref_mat = this.get_reflection_mat(this.ref_symmetry_point);
      for (let i = 0; i < this.rotation_symmetry; i++) {
        let tube = new THREE.Mesh(tube_geom, 
          // sweep_plane_material);
          symmetry_reflection_curve_material);
        tube.type = "ns_line";
        tube.applyMatrix4(ref_mat);
        tube.rotateY((2 * Math.PI / this.rotation_symmetry) * i);
        this.three_curves.push(tube);
        scene.add(tube);
      }
    }
  }

  destroy() {
    for (let curve of this.three_curves) {
      curve.geometry.dispose();
      scene.remove(curve);
    }
    this.three_curves.length = 0;
    for (let cp of this.control_points) {
      scene.remove(cp);
    }
    this.control_points.length = 0;
    for (let tl of this.tangent_lines) {
      tl.geometry.dispose();
      scene.remove(tl);
    }
    this.tangent_lines.length = 0;
  }

  set_visibility(visibility) {
    for (let curve of this.three_curves) {
      curve.visible = visibility;
    }
    for (let cp of this.control_points) {
      cp.visible = visibility && params.control_points_visible;
    }
    for (let tl of this.tangent_lines) {
      tl.visible = visibility;
    }
  }

  set_control_points_visibility(is_visible) {
    for (let cp of this.control_points) {
      cp.visible = is_visible && params.control_points_visible;
    }
  }
}