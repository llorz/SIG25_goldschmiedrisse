import * as THREE from 'three';

import { scene } from './visual';

import { ReconstructedBezierCurve } from '../geom/reconstructed_bezier_curve';
import { sync_module } from '../native/native';

const tangent_line_material = new THREE.MeshBasicMaterial({ color: 0x00aa00 });
const sphere_geom = new THREE.SphereGeometry(0.01, 32, 32);
let control_point_material = new THREE.MeshBasicMaterial({ color: 0x0 });
let main_curve_material = new THREE.MeshLambertMaterial({ color: 0xff00ff, side: THREE.DoubleSide });
let symmetry_curve_material = new THREE.MeshLambertMaterial({
  color: 0x00ff00, side: THREE.DoubleSide,
  opacity: 0.6, transparent: true
});
let symmetry_reflection_curve_material = new THREE.MeshLambertMaterial({
  color: 0x00ffaa, side: THREE.DoubleSide,
  opacity: 0.6, transparent: true
});

function last_elem(arr) {
  return arr[arr.length - 1];
}

export class ReconstructedCurve {
  constructor(points, rot_symmetry, ref_symmetry) {
    this.rotation_symmetry = rot_symmetry;
    this.ref_symmetry_point = ref_symmetry;

    this.recon_bezy_curve = new ReconstructedBezierCurve(points);
    this.points = points;
    this.control_points = [];
    this.control_points_tangent = [];
    this.tangent_points_base_index = [];
    this.tangent_lines = [];

    this.three_curves = [];
  }

  get_rotation_mat() {
    let mat = new THREE.Matrix4();
    mat.makeRotationY(2 * Math.PI / this.rotation_symmetry);
    return mat;
  }
  get_reflection_mat() {
    let x = this.ref_symmetry_point.x, y = this.ref_symmetry_point.y, z = this.ref_symmetry_point.z;
    let norm = Math.sqrt(x * x + y * y + z * z);
    x /= norm; y /= norm; z /= norm;
    let mat = new THREE.Matrix4().set
      (2 * x * x - 1, 2 * x * y, 2 * x * z, 0,
        0, 1, 0, 0,
        2 * z * x, 2 * z * y, 2 * z * z - 1, 0,
        0, 0, 0, 1);
    return mat;
  }

  calc_control_points() {
    let intersections = sync_module.bezier_intersections_with_symmetry(
      this.points, this.points, this.rotation_symmetry, this.ref_symmetry_point);
    intersections = intersections.map(x => x[0]);
    intersections.sort();
    let height_pts = this.recon_bezy_curve.height_points.map(pt => new THREE.Vector3(pt.x, 0, pt.y));
    let ts = sync_module.find_t_for_x(height_pts, intersections);
    this.recon_bezy_curve.height_points = this.recon_bezy_curve.split(ts,
      [...new Array(ts.length)].map(x => 0));
    this.recon_bezy_curve.accumulated_seg_lengths = this.recon_bezy_curve.approximate_segment_lengths();

    this.control_points = [new THREE.Mesh(sphere_geom, control_point_material)];
    this.control_points[0].position.copy(this.recon_bezy_curve.points[0]);
    this.control_points_tangent = ["dummy"];
    this.tangent_points_base_index = ["dummy"];

    for (let i = 0; i < this.recon_bezy_curve.height_points.length - 1; i += 3) {
      let p1 = this.recon_bezy_curve.height_points[i];
      let gp1 = this.recon_bezy_curve.getGroundProjectedPoint(p1.x);
      let tan1 = this.recon_bezy_curve.getGroundTangent(p1.x);
      let tan1_norm = tan1.length();
      tan1 = tan1.divideScalar(tan1_norm * tan1_norm);
      let p2 = this.recon_bezy_curve.height_points[i + 1];
      let p3 = this.recon_bezy_curve.height_points[i + 2];
      let p4 = this.recon_bezy_curve.height_points[i + 3];
      let gp4 = this.recon_bezy_curve.getGroundProjectedPoint(p4.x);
      let tan4 = this.recon_bezy_curve.getGroundTangent(p4.x);
      let tan4_norm = tan4.length();
      tan4 = tan4.divideScalar(tan4_norm * tan4_norm);

      // First tangent.
      let sphere_p2 = new THREE.Mesh(sphere_geom, control_point_material);
      sphere_p2.type = "tangent_control_point";
      sphere_p2.userData = this;
      let pos = tan1.clone().normalize()
        .multiplyScalar((tan1_norm) * (p2.x - p1.x)).add(new THREE.Vector3(0, p2.y, 0)).add(gp1);
      sphere_p2.position.set(pos.x, pos.y, pos.z);
      this.control_points.push(sphere_p2);
      this.control_points_tangent.push(tan1);
      this.tangent_points_base_index.push(this.control_points_tangent.length - 2);
      scene.add(sphere_p2);
      // Second tangent.
      let sphere_p3 = new THREE.Mesh(sphere_geom, control_point_material);
      sphere_p3.type = "tangent_control_point";
      sphere_p3.userData = this;
      let pos2 = tan4.clone().normalize()
        .multiplyScalar(tan4_norm * (p3.x - p4.x)).add(new THREE.Vector3(0, p3.y, 0)).add(gp4);
      sphere_p3.position.set(pos2.x, pos2.y, pos2.z);
      this.control_points.push(sphere_p3);
      this.control_points_tangent.push(tan4);
      this.tangent_points_base_index.push(this.control_points_tangent.length);
      scene.add(sphere_p3);
      // Last point.
      let sphere_p4 = new THREE.Mesh(sphere_geom, control_point_material);
      sphere_p4.type = "height_control_point";
      sphere_p4.userData = this;
      sphere_p4.position.set(gp4.x, p4.y, gp4.z);
      this.control_points.push(sphere_p4);
      scene.add(sphere_p4);
      this.control_points_tangent.push(tan4);
      this.tangent_points_base_index.push(this.control_points_tangent.length - 1);
    }
  }

  move_control_point(three_point_mesh, new_loc) {
    let idx = this.control_points.indexOf(three_point_mesh);
    three_point_mesh.position.y = new_loc.y;
    this.recon_bezy_curve.height_points[idx].y = new_loc.y;
    this.update_curve();
  }

  move_tangent_control_point(three_point_mesh, new_loc) {
    let idx = this.control_points.indexOf(three_point_mesh);
    three_point_mesh.position.copy(new_loc);
    this.recon_bezy_curve.height_points[idx].y = new_loc.y;
    let base_point_index = this.tangent_points_base_index[idx];
    let offset = new_loc.clone().sub(this.control_points[base_point_index].position);
    let proj_offset = offset.dot(this.control_points_tangent[idx]);
    this.recon_bezy_curve.height_points[idx].x = proj_offset + this.recon_bezy_curve.height_points[base_point_index].x;
    this.update_curve();
  }

  getControlPointNormal(obj) {
    let idx = this.control_points.indexOf(obj);
    return this.control_points_tangent[idx].clone().cross(new THREE.Vector3(0, 1, 0));
  }

  update_curve() {
    for (let curve of this.three_curves) {
      curve.geometry.dispose();
      scene.remove(curve);
    }
    this.three_curves.length = 0;

    let curve_points = this.points.length * 16;
    let tube_geom = new THREE.TubeGeometry(this.recon_bezy_curve, curve_points, 0.003, 8, false);
    for (let i = 0; i < this.rotation_symmetry; i++) {
      let tube = new THREE.Mesh(tube_geom,
        i == 0 ? main_curve_material : symmetry_curve_material);
      tube.type = "ns_line";
      tube.rotateY((2 * Math.PI / this.rotation_symmetry) * i);
      this.three_curves.push(tube);
      scene.add(tube);
    }
    if (!!this.ref_symmetry_point) {
      let ref_mat = this.get_reflection_mat();
      for (let i = 0; i < this.rotation_symmetry; i++) {
        let tube = new THREE.Mesh(tube_geom, symmetry_reflection_curve_material);
        tube.type = "ns_line";
        tube.applyMatrix4(ref_mat);
        tube.rotateY((2 * Math.PI / this.rotation_symmetry) * i);
        this.three_curves.push(tube);
        scene.add(tube);
      }
    }

    // Update tangent lines.
    for (let tl of this.tangent_lines) {
      tl.geometry.dispose();
      scene.remove(tl);
    }
    this.tangent_lines.length = 0;
    for (let i = 0; i < this.control_points.length - 1; i += 3) {
      let p = this.control_points[i];
      let p2 = this.control_points[i + 1];
      let p3 = this.control_points[i + 2];
      let p4 = this.control_points[i + 3];
      let line1 = new THREE.LineCurve(p.position, p2.position);
      let line2 = new THREE.LineCurve(p3.position, p4.position);
      let mesh1 = new THREE.Mesh(new THREE.TubeGeometry(line1, 16, 0.003, 8, false), tangent_line_material);
      let mesh2 = new THREE.Mesh(new THREE.TubeGeometry(line2, 16, 0.003, 8, false), tangent_line_material);
      mesh1.type = "ns_line";
      mesh2.type = "ns_line";
      scene.add(mesh1);
      scene.add(mesh2);
      this.tangent_lines.push(mesh1);
      this.tangent_lines.push(mesh2);
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

  set_control_points_visibility(is_visible) {
    for (let p of this.control_points) {
      p.visible = is_visible;
    }
    for (let p of this.tangent_lines) {
      p.visible = is_visible;
    }
  }
}