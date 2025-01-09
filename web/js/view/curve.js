import * as THREE from 'three';

import { scene } from './visual';
import { BezierSegmentsCurve, bezy } from '../geom/bezier_segments_curve';
import { sync_module } from '../native/native';
import { get_level_bottom, reconstruct_biarcs, reconstruct_curves } from '../state/state';
import { BiArcCurve } from '../geom/biarc_curve';
import { ArcCurve } from '../geom/arc_curve';
import { update_intersections } from './intersections';

const sphere_geom = new THREE.SphereGeometry(0.013, 32, 32);
const intersection_sphere_geometry = new THREE.SphereGeometry(0.01);
const curve_material = new THREE.MeshBasicMaterial({ color: 0x0 });
let intersection_material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const tangent_line_material = new THREE.MeshBasicMaterial({ color: 0x00aa00 });
let main_curve_material = new THREE.MeshLambertMaterial({ color: 0xff0000, side: THREE.DoubleSide });
let symmetry_curve_material = new THREE.MeshLambertMaterial({
  color: 0x000000, side: THREE.DoubleSide,
  opacity: 0.2, transparent: true
});
let symmetry_reflection_curve_material = new THREE.MeshLambertMaterial({
  color: 0x000000, side: THREE.DoubleSide,
  opacity: 0.2, transparent: true
});

export class Curve {
  constructor(rot_symmetry, ref_symmetry, level = 0) {
    /** @type {THREE.Vector3[]} Control points for the bezier curve. */
    this.control_points = [];
    // Labels for the control points (ground = 0, top = 1, middle = 2).
    this.point_labels = [];

    // Three js visualization stuff.
    this.three_curves = [];
    this.three_control_points = [];
    this.three_control_points_lines = [];
    this.three_intersections = [];
    /** @type{number} N rotation symmetry */
    this.rotation_symmetry = rot_symmetry;
    /** @type{boolean | THREE.Vector3} */
    this.ref_symmetry_point = ref_symmetry;
    this.level = level;

    this.arc_curve = null;
  }

  get_bezy_curve() {
    if (this.arc_curve === null) {
      this.arc_curve = new ArcCurve(this.control_points);
    }
    return this.arc_curve;
  }

  add_control_point(loc) {
    loc.y = get_level_bottom(this.level);
    this.control_points.push(loc);
    let mesh = new THREE.Mesh(sphere_geom, curve_material);
    mesh.position.copy(loc);
    mesh.type = "control_point";
    mesh.userData = this;
    this.three_control_points.push(mesh);
    scene.add(mesh);
  }

  init(start_loc) {
    for (let i = 0; i < 3; i++)
      this.add_control_point(start_loc);
    this.arc_curve = new ArcCurve(this.control_points);
    if (!!this.ref_symmetry_point && typeof this.ref_symmetry_point == "boolean") {
      this.ref_symmetry_point = new THREE.Vector3();
      this.ref_symmetry_point.copy(this.control_points[0]);
    }
    // By default first point is a ground point.
    this.point_labels.push(0);
    // And the second is a top point.
    this.point_labels.push(1);
  }

  set_control_point_pos(idx, new_loc) {
    this.control_points[idx] = new_loc;
    this.three_control_points[idx].position.copy(new_loc);
  }

  move_control_point(three_point_mesh, new_loc) {
    let idx = this.three_control_points.indexOf(three_point_mesh);
    if (idx == 0) {
      // Also change reflection point.
      this.ref_symmetry_point.copy(new_loc);
    }
    this.set_control_point_pos(idx, new_loc);
    this.update_curve();
  }

  move_last_point(new_loc) {
    let n = this.control_points.length;
    this.set_control_point_pos(n - 1, new_loc);
    // let prev_pos = this.control_points[n - 4];
    // this.set_control_point_pos(n - 2,
    //   new THREE.Vector3(prev_pos.x * 0.2 + new_loc.x * 0.8, 0, prev_pos.z * 0.2 + new_loc.z * 0.8));
    // this.set_control_point_pos(n - 3,
    //   new THREE.Vector3(prev_pos.x * 0.8 + new_loc.x * 0.2, 0, prev_pos.z * 0.8 + new_loc.z * 0.2));

    let prev_pos = this.control_points[n - 3];
    this.set_control_point_pos(n - 2,
      new THREE.Vector3(prev_pos.x * 0.8 + new_loc.x * 0.2, 0, prev_pos.z * 0.8 + new_loc.z * 0.2));
    // this.set_control_point_pos(n - 3,
    //   new THREE.Vector3(prev_pos.x * 0.8 + new_loc.x * 0.2, 0, prev_pos.z * 0.8 + new_loc.z * 0.2));

    this.update_curve();
  }

  add_new_segment(loc) {
    for (let i = 0; i < 3; i++)
      this.add_control_point(loc);

    if (this.point_labels[this.point_labels.length - 1] == 2) {
      this.point_labels.push(1);
    } else {
      this.point_labels.push(2);
    }

    this.update_curve();
  }

  abort_last_segment() {
    let n = this.control_points.length;
    this.control_points.splice(n - 3, 3);
    scene.remove(this.three_control_points[n - 1]);
    scene.remove(this.three_control_points[n - 2]);
    scene.remove(this.three_control_points[n - 3]);
    this.three_control_points.splice(n - 3, 3);
    this.point_labels.splice(this.point_labels.length - 1, 1);
    this.update_curve();
  }

  closest_point(loc) {
    let p = sync_module.closest_point(this.get_bezy_curve().points, loc, this.rotation_symmetry, this.ref_symmetry_point);
    let closest_p = new THREE.Vector3();
    closest_p.set(p[0], 0, p[1]);

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
    this.three_curves.length = 0;
    this.get_bezy_curve().setPoints(this.control_points);
    let curve_points = this.control_points.length * 32;
    let tube_geom = new THREE.TubeGeometry(this.arc_curve, curve_points, 0.005, 8, false);
    for (let i = 0; i < this.rotation_symmetry; i++) {
      let tube = new THREE.Mesh(tube_geom,
        i == 0 ? main_curve_material : symmetry_curve_material);
      tube.type = i == 0? "unit_curve" : "ns_line";
      tube.userData = this;

      tube.rotateY((2 * Math.PI / this.rotation_symmetry) * i);
      tube.translateY(get_level_bottom(this.level));
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
        tube.translateY(get_level_bottom(this.level));
        this.three_curves.push(tube);
        scene.add(tube);
      }
    }

    // Add lines showing the tangent at each control point.
    for (let p of this.three_control_points_lines) {
      p.geometry.dispose();
      scene.remove(p);
    }
    this.three_control_points_lines.length = 0;

    for (let i = 0; i < this.control_points.length - 1; i += 3) {
      let p = this.control_points[i];
      let p2 = this.control_points[i + 1];
      let p3 = this.control_points[i + 2];
      // let p4 = this.control_points[i + 3];
      let line1 = new THREE.LineCurve(p, p2);
      // let line2 = new THREE.LineCurve(p3, p4);
      let mesh1 = new THREE.Mesh(new THREE.TubeGeometry(line1, 16, 0.005, 8, false), tangent_line_material);
      // let mesh2 = new THREE.Mesh(new THREE.TubeGeometry(line2, 16, 0.005, 8, false), tangent_line_material);
      mesh1.type = "ns_line";
      // mesh2.type = "ns_line";
      mesh1.translateY(0.001);
      // mesh2.translateY(0.001);
      scene.add(mesh1);
      // scene.add(mesh2);
      this.three_control_points_lines.push(mesh1);
      // this.three_control_points_lines.push(mesh2);
    }

    // this.show_intersections();
    update_intersections();
    // this.show_self_sym_intersections();
    reconstruct_biarcs();
    // reconstruct_curves();
  }

  self_sym_intersections() {
    let p0 = this.arc_curve.getPoint(0);
    let p1 = this.arc_curve.getPoint(1);
    let intersections_t = [];
    for (let i = 1; i < 200; i++) {
      let t = i / 200;
      let p = this.arc_curve.getPoint(t);
      // Skip points too close to the endpoints.
      if (p1.distanceTo(p) < 1e-1 || p0.distanceTo(p) < 1e-1 ||
        (intersections_t.length > 0 && this.arc_curve.getPoint(intersections_t[intersections_t.length - 1]).distanceTo(p) < 1e-1))
        continue;
      let rot_mat = this.get_rotation_mat();
      let accum_rot_mat = new THREE.Matrix4().identity();
      let ref_mat = (!!this.ref_symmetry_point ? this.get_reflection_mat() : null);
      for (let rot = 0; rot < this.rotation_symmetry; rot++) {
        if (rot > 0) {
          let p_r = p.clone().applyMatrix4(accum_rot_mat);
          if (p_r.distanceTo(p) < 1e-2)
            intersections_t.push(t);
        }
        if (!!ref_mat) {
          let p_ref = p.clone().applyMatrix4(ref_mat).applyMatrix4(accum_rot_mat);
          if (p_ref.distanceTo(p) < 1e-2)
            intersections_t.push(t);
        }
        accum_rot_mat.multiply(rot_mat);
      }
    }
    return intersections_t;
  }

  show_self_sym_intersections() {
    for (let inter of this.three_intersections) {
      inter.geometry.dispose();
      scene.remove(inter);
    }
    let intersections = this.self_sym_intersections();
    for (let inter of intersections) {
      let sphere = new THREE.Mesh(intersection_sphere_geometry, intersection_material);
      sphere.type = "ns_point";
      let p = this.arc_curve.getPoint(inter);
      sphere.position.set(p.x, p.y, p.z);
      scene.add(sphere);
      this.three_intersections.push(sphere);
    }
  }

  show_bezier_intersections() {
    for (let inter of this.three_intersections) {
      inter.geometry.dispose();
      scene.remove(inter);
    }
    this.three_intersections.length = 0;
    let intersections = sync_module.bezier_intersections_with_symmetry(
      this.arc_curve.points, this.arc_curve.points, this.rotation_symmetry, this.ref_symmetry_point);
    for (let inter of intersections) {
      let sphere = new THREE.Mesh(intersection_sphere_geometry, intersection_material);
      sphere.type = "ns_point";
      let p = bezy(inter[0], this.arc_curve.points[0], this.arc_curve.points[1], this.arc_curve.points[2], this.arc_curve.points[3]);
      sphere.position.set(p.x, p.y, p.z);
      scene.add(sphere);
      this.three_intersections.push(sphere);
    }
  }

  destroy() {
    for (let curve of this.three_curves) {
      curve.geometry.dispose();
      scene.remove(curve);
    }
    this.three_curves.length = 0;
    for (let inter of this.three_intersections) {
      inter.geometry.dispose();
      scene.remove(inter);
    }
    this.three_intersections.length = 0;
    for (let p of this.three_control_points_lines) {
      p.geometry.dispose();
      scene.remove(p);
    }
    this.three_control_points_lines.length = 0;
    for (let p of this.three_control_points) {
      scene.remove(p);
    }
    this.three_control_points.length = 0;
  }

  set_control_points_visibility(is_visible) {
    for (let p of this.three_control_points) {
      p.visible = is_visible;
    }
    for (let p of this.three_control_points_lines) {
      p.visible = is_visible;
    }
  }

  set_visibility(visibility) {
    for (let curve of this.three_curves) {
      curve.visible = visibility;
    }
    for (let p of this.three_control_points) {
      p.visible = visibility;
    }
    for (let p of this.three_control_points_lines) {
      p.visible = visibility;
    }
  }
}