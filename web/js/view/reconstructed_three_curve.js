import * as THREE from 'three';

import { scene } from './visual';

import { ReconstructedBezierCurve } from '../geom/reconstructed_bezier_curve';

let main_curve_material = new THREE.MeshLambertMaterial({ color: 0xff00ff, side: THREE.DoubleSide });
let symmetry_curve_material = new THREE.MeshLambertMaterial({
  color: 0x00ff00, side: THREE.DoubleSide,
  opacity: 0.6, transparent: true
});
let symmetry_reflection_curve_material = new THREE.MeshLambertMaterial({
  color: 0x00ffaa, side: THREE.DoubleSide,
  opacity: 0.6, transparent: true
});


export class ReconstructedCurve {
  constructor(points, rot_symmetry, ref_symmetry) {
    this.rotation_symmetry = rot_symmetry;
    this.reflection_symmetry = ref_symmetry;

    this.recon_bezy_curve = new ReconstructedBezierCurve(points);
    this.points = points;

    this.three_curves = [];
  }

  get_rotation_mat() {
    let mat = new THREE.Matrix4();
    mat.makeRotationY(2 * Math.PI / this.rotation_symmetry);
    return mat;
  }
  get_reflection_mat() {
    let x = this.points[0].x, y = this.points[0].y, z = this.points[0].z;
    let norm = Math.sqrt(x * x + y * y + z * z);
    x /= norm; y /= norm; z /= norm;
    let mat = new THREE.Matrix4().set
      (2 * x * x - 1, 2 * x * y, 2 * x * z, 0,
        0, 1, 0, 0,
        2 * z * x, 2 * z * y, 2 * z * z - 1, 0,
        0, 0, 0, 1);
    return mat;
  }

  update_curve() {
    for (let curve of this.three_curves) {
      curve.geometry.dispose();
      scene.remove(curve);
    }

    let curve_points = this.points.length * 16;
    let tube_geom = new THREE.TubeGeometry(this.recon_bezy_curve, curve_points, 0.003, 8, false);
    let ref_mat = this.get_reflection_mat();
    for (let i = 0; i < this.rotation_symmetry; i++) {
      let tube = new THREE.Mesh(tube_geom,
        i == 0 ? main_curve_material : symmetry_curve_material);
      tube.type = "ns_line";
      tube.rotateY((2 * Math.PI / this.rotation_symmetry) * i);
      this.three_curves.push(tube);
      scene.add(tube);
    }
    if (this.reflection_symmetry) {
      for (let i = 0; i < this.rotation_symmetry; i++) {
        let tube = new THREE.Mesh(tube_geom, symmetry_reflection_curve_material);
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
  }
}