import * as THREE from 'three';

import { scene } from '../view/visual';
import { BezierSegmentsCurve, bezy } from './bezier_segments_curve';
import { sync_module } from '../native/native';

const sphere_geom = new THREE.SphereGeometry(0.013, 32, 32);
const curve_material = new THREE.MeshBasicMaterial({ color: 0x0 });
let intersection_material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const tangent_line_material = new THREE.MeshBasicMaterial({ color: 0x00aa00 });
let main_curve_material = new THREE.MeshLambertMaterial({ color: 0xff00ff, side: THREE.DoubleSide });
let symmetry_curve_material = new THREE.MeshLambertMaterial({
  color: 0x00ff00, side: THREE.DoubleSide,
  opacity: 0.2, transparent: true
});
let symmetry_reflection_curve_material = new THREE.MeshLambertMaterial({
  color: 0x00ffaa, side: THREE.DoubleSide,
  opacity: 0.2, transparent: true
});

export class Curve {
  constructor(rot_symmetry, ref_symmetry) {
    this.control_points = [];
    this.three_curves = [];
    this.three_control_points = [];
    this.three_control_points_lines = [];
    this.rotation_symmetry = rot_symmetry;
    this.reflection_symmetry = ref_symmetry;

    this.three_intersections = [];
    this.bezy_curve = null;
  }

  add_control_point(loc) {
    this.control_points.push(loc);
    let mesh = new THREE.Mesh(sphere_geom, new THREE.MeshBasicMaterial({ color: 0x0 }));
    mesh.position.copy(loc);
    mesh.type = "control_point";
    mesh.userData = this;
    this.three_control_points.push(mesh);
    scene.add(mesh);
  }

  init(start_loc) {
    for (let i = 0; i < 4; i++)
      this.add_control_point(start_loc);
    this.bezy_curve = new BezierSegmentsCurve(this.control_points);
  }

  set_control_point_pos(idx, new_loc) {
    this.control_points[idx] = new_loc;
    this.three_control_points[idx].position.copy(new_loc);
  }

  move_control_point(three_point_mesh, new_loc) {
    let idx = this.three_control_points.indexOf(three_point_mesh);
    this.set_control_point_pos(idx, new_loc);
    this.update_curve();
  }

  move_last_point(new_loc) {
    let n = this.control_points.length;
    this.set_control_point_pos(n - 1, new_loc);
    let prev_pos = this.control_points[n - 4];
    this.set_control_point_pos(n - 2,
      new THREE.Vector3(prev_pos.x * 0.2 + new_loc.x * 0.8, 0, prev_pos.z * 0.2 + new_loc.z * 0.8));
    this.set_control_point_pos(n - 3,
      new THREE.Vector3(prev_pos.x * 0.8 + new_loc.x * 0.2, 0, prev_pos.z * 0.8 + new_loc.z * 0.2));

    this.update_curve();
  }

  add_new_segment(loc) {
    for (let i = 0; i < 3; i++)
      this.add_control_point(loc);

    this.update_curve();
  }

  abort_last_segment() {
    let n = this.control_points.length;
    this.control_points.splice(n - 3, 3);
    scene.remove(this.three_control_points[n - 1]);
    scene.remove(this.three_control_points[n - 2]);
    scene.remove(this.three_control_points[n - 3]);
    this.update_curve();
  }

  closest_point(loc) {
    let ref_mat = this.get_reflection_mat();
    let rot_mat = this.get_rotation_mat();
    let min_dist = 1000;
    let closest_p = new THREE.Vector3();
    for (let t = 0.0; t < 1.0; t += 0.01) {
      let p = this.bezy_curve.getPoint(t);
      let dist = p.distanceTo(loc);
      if (dist < min_dist && t < 0.9) {
        min_dist = dist;
        closest_p.set(p.x, p.y, p.z);
      }
      let p_rot = p.clone();
      let p_ref_rot = p.clone().applyMatrix4(ref_mat);
      for (let i = 0; i < this.rotation_symmetry - 1; i++) {
        p_rot.applyMatrix4(rot_mat);
        let dist = p_rot.distanceTo(loc);
        if (dist < min_dist) {
          min_dist = dist;
          closest_p.set(p_rot.x, p_rot.y, p_rot.z);
        }
      }
    }

    return closest_p;
  }

  /**
   * Returns a 4x4 matrix that reflects a 3D point across the plane
   * perpendicular to the first control point.
   *
   * This matrix is used to generate the reflections of the curve
   * necessary to implement rotational symmetry.
   *
   * @return {THREE.Matrix4} - The reflection matrix.
   */
  get_reflection_mat() {
    let x = this.control_points[0].x, y = this.control_points[0].y, z = this.control_points[0].z;
    let norm = Math.sqrt(x * x + y * y + z * z);
    x /= norm; y /= norm; z /= norm;
    let mat = new THREE.Matrix4().set
      (2 * x * x - 1, 2 * x * y, 2 * x * z, 0,
        2 * y * x, 2 * y * y - 1, 2 * y * z, 0,
        2 * z * x, 2 * z * y, 2 * z * z - 1, 0,
        0, 0, 0, 1);
    return mat;
  }
  /**
   * Returns a 4x4 matrix that rotates a 3D point by 1 unit of rotation symmetry
   * around the y-axis.
   *
   * @return {THREE.Matrix4} - The rotation matrix.
   */
  get_rotation_mat() {
    let mat = new THREE.Matrix4();
    mat.makeRotationY(2 * Math.PI / this.rotation_symmetry);
    return mat;
  }
  update_curve() {
    for (let curve of this.three_curves) {
      curve.geometry.dispose();
      scene.remove(curve);
    }
    this.bezy_curve = new BezierSegmentsCurve(this.control_points);
    let curve_points = this.control_points.length * 16;
    let tube_geom = new THREE.TubeGeometry(this.bezy_curve, curve_points, 0.005, 8, false);
    let ref_mat = this.get_reflection_mat();
    for (let i = 0; i < this.rotation_symmetry; i++) {
      let tube = new THREE.Mesh(tube_geom,
        i == 0 ? main_curve_material : symmetry_curve_material);
      tube.rotateY((2 * Math.PI / this.rotation_symmetry) * i);
      this.three_curves.push(tube);
      scene.add(tube);
    }
    if (this.reflection_symmetry) {
      for (let i = 0; i < this.rotation_symmetry; i++) {
        let tube = new THREE.Mesh(tube_geom, symmetry_reflection_curve_material);
        tube.applyMatrix4(ref_mat);
        tube.rotateY((2 * Math.PI / this.rotation_symmetry) * i);
        this.three_curves.push(tube);
        scene.add(tube);
      }
    }

    // Add lines showing the tangent at each control point.
    for (let p of this.three_control_points_lines) {
      p.geometry.dispose();
      scene.remove(p);
    }
    this.three_control_points_lines = [];

    for (let i = 0; i < this.control_points.length - 1; i += 3) {
      let p = this.control_points[i];
      let p2 = this.control_points[i + 1];
      let p3 = this.control_points[i + 2];
      let p4 = this.control_points[i + 3];
      let line1 = new THREE.LineCurve(p, p2);
      let line2 = new THREE.LineCurve(p3, p4);
      let mesh1 = new THREE.Mesh(new THREE.TubeGeometry(line1, 16, 0.005, 8, false), tangent_line_material);
      let mesh2 = new THREE.Mesh(new THREE.TubeGeometry(line2, 16, 0.005, 8, false), tangent_line_material);
      mesh1.translateY(0.001);
      mesh2.translateY(0.001);
      scene.add(mesh1);
      scene.add(mesh2);
      this.three_control_points_lines.push(mesh1);
      this.three_control_points_lines.push(mesh2);
    }

    this.show_intersections();
  }

  show_intersections() {
    for (let inter of this.three_intersections) {
      inter.geometry.dispose();
      scene.remove(inter);
    }
    let intersections = sync_module.bezier_intersections_with_symmetry(this.bezy_curve.points.slice(0, 4), this.bezy_curve.points.slice(0, 4), this.rotation_symmetry);
    for (let inter of intersections) {
      let sphere = new THREE.Mesh(new THREE.SphereGeometry(0.01), intersection_material);
      let p = bezy(inter[0], this.bezy_curve.points[0], this.bezy_curve.points[1], this.bezy_curve.points[2], this.bezy_curve.points[3]);
      sphere.position.set(p.x, p.y, p.z);
      scene.add(sphere);
      this.three_intersections.push(sphere);
    }
  }

  destroy() {
    scene.remove(this.three_curve)
    for (let control_point of this.three_control_points) {
      control_point.material.dispose();
      scene.remove(control_point);
    }
  }
}