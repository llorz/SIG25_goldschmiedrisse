import * as THREE from 'three';

import { scene } from './visual';
import { BezierSegmentsCurve, bezy } from '../geom/bezier_segments_curve';
import { sync_module } from '../native/native';
import { curves, edit_mode, get_level_bottom, get_level_height, reconstruct_biarcs } from '../state/state';
import { BiArcCurve } from '../geom/biarc_curve';
import { ArcCurve } from '../geom/arc_curve';
import { update_intersections } from './intersections';
import { params } from '../state/params';
import { get_curve_color, get_curve_color_material, get_random_color } from '../state/color_generator';

const sphere_geom = new THREE.SphereGeometry(0.02, 32, 32);
const intersection_sphere_geometry = new THREE.SphereGeometry(0.01);
const curve_material = new THREE.MeshBasicMaterial({ color: 0x0 });
let intersection_material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const tangent_line_material = new THREE.MeshStandardMaterial({ color: 0x77ff77 });
let main_curve_material = new THREE.MeshStandardMaterial({ color: 0xff7777, side: THREE.DoubleSide });
let symmetry_curve_material = new THREE.MeshStandardMaterial({
  color: 0x7a7a7a, side: THREE.DoubleSide,
  opacity: 1.0, transparent: true
});
let symmetry_reflection_curve_material = new THREE.MeshLambertMaterial({
  color: 0xeeeeee, side: THREE.DoubleSide,
  opacity: 1.0, transparent: true
});

export class Curve {
  constructor(rot_symmetry, ref_symmetry, level = 0) {
    /** @type {THREE.Vector3[]} Control points for the bezier curve. */
    this.control_points = [];

    // Three js visualization stuff.
    this.three_curves = [];
    this.three_control_points = [];
    this.three_control_points_lines = [];
    this.three_intersections = [];
    /** @type{number} N rotation symmetry */
    this.rotation_symmetry = rot_symmetry;
    /** @type{boolean | THREE.Vector3} */
    this.ref_symmetry_point = null;
    this.ref_symmetry_type = ref_symmetry;
    this.level = level;

    this.height = get_level_height(level);
    this.prc_t = 0.5;

    // Decoration at the bottom of the curve.
    this.decoration_t = 0;
    this.decoration_height = 0;

    /** @type{THREE.Vector3?} */
    this.supporting_pillar_point = null;

    /** @type{number} height of the vertical line, 0 - no vertical line */
    this.vertical_line_top = 0;

    // Decoration at the top of the curve.

    this.arc_curve = null;
  }

  max_width() {
    let min_x = Infinity, max_x = -Infinity;
    for (let curve of this.three_curves) {
      if (!curve.visible) {
        continue;
      }
      let box = new THREE.Box3().setFromObject(curve);
      min_x = Math.min(min_x, box.min.x);
      max_x = Math.max(max_x, box.max.x);
    }
    return Math.max(max_x, -min_x);
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
    if (!this.ref_symmetry_point) {
      if (this.ref_symmetry_type == "first point" || this.ref_symmetry_type == "last point") {
        this.ref_symmetry_point = new THREE.Vector3();
        this.ref_symmetry_point.copy(this.control_points[0]);
      } else if (this.ref_symmetry_type == "y axis") {
        this.ref_symmetry_point = new THREE.Vector3(0, 0, 1);
      }
    }
  }

  set_control_point_pos(idx, new_loc) {
    this.control_points[idx] = new_loc;
    this.three_control_points[idx].position.copy(new_loc);
  }

  move_control_point(three_point_mesh, new_loc) {
    let idx = this.three_control_points.indexOf(three_point_mesh);
    if (idx == 0 && this.ref_symmetry_type == "first point") {
      // Also change reflection point.
      this.ref_symmetry_point.copy(new_loc);
    } else if (idx == 2 && this.ref_symmetry_type == "last point") {
      // Also change reflection point.
      this.ref_symmetry_point.copy(new_loc);
    }
    this.set_control_point_pos(idx, new_loc);
    this.update_curve();
  }

  move_last_point(new_loc) {
    let n = this.control_points.length;
    this.set_control_point_pos(n - 1, new_loc);
    let prev_pos = this.control_points[n - 3];
    this.set_control_point_pos(n - 2,
      prev_pos.clone().lerp(new_loc, 0.2));

    if (this.ref_symmetry_type == "last point") {
      this.ref_symmetry_point.copy(this.control_points[n - 1]);
    }

    this.update_curve();
  }

  add_new_segment(loc) {
    for (let i = 0; i < 2; i++)
      this.add_control_point(loc);

    this.update_curve();
  }

  abort_last_segment() {
    let n = this.control_points.length;
    this.control_points.splice(n - 2, 2);
    scene.remove(this.three_control_points[n - 1]);
    scene.remove(this.three_control_points[n - 2]);
    this.three_control_points.splice(n - 2, 2);
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
    this.draw_curve();

    update_intersections();
    reconstruct_biarcs(this);
  }

  get_main_material() {
    if (params.biarcs_visualization == 'colorful') {
      return get_curve_color_material(curves.indexOf(this));
    }
    return main_curve_material;
  }
  get_sym_material(i) {
    if (params.biarcs_visualization == 'colorful') {
      return get_curve_color_material(curves.indexOf(this));
      // return get_curve_color_material(i);
    }
    return symmetry_curve_material;
  }

  update_control_points_height() {
    let bottom = get_level_bottom(this.level);
    for (let i = 0; i < this.control_points.length; i++) {
      let p = this.control_points[i];
      p.y = bottom;
      this.three_control_points[i].position.y = bottom;
    }
    this.arc_curve.setPoints(this.control_points);
  }

  draw_decoration_curve() {
    if (this.control_points.length < 5 || this.control_points[4].distanceTo(this.control_points[2]) < 1e-3)
      return;

    let level_bottom = get_level_bottom(this.level);
    let arc = new ArcCurve(this.control_points.slice(2, 5));
    let tube_geom = new THREE.TubeGeometry(arc, 50, params.flat_curve_radius, 8, false);
    for (let i = 0; i < this.rotation_symmetry; i++) {
      let tube = new THREE.Mesh(tube_geom,
        i == 0 ? this.get_main_material() : this.get_sym_material(i));
      tube.type = i == 0 ? "unit_curve" : "ns_line";
      tube.userData = this;

      tube.rotateY((2 * Math.PI / this.rotation_symmetry) * i);
      tube.translateY(level_bottom);
      this.three_curves.push(tube);
      scene.add(tube);
    }
    if (!!this.ref_symmetry_point) {
      let ref_mat = this.get_reflection_mat();
      for (let i = 0; i < this.rotation_symmetry; i++) {
        let tube = new THREE.Mesh(tube_geom, this.get_sym_material(i));
        tube.type = "ns_line";
        tube.applyMatrix4(ref_mat);
        tube.rotateY((2 * Math.PI / this.rotation_symmetry) * i);
        tube.translateY(level_bottom);
        this.three_curves.push(tube);
        scene.add(tube);
      }
    }
  }

  draw_curve() {
    this.update_control_points_height();
    for (let curve of this.three_curves) {
      curve.geometry.dispose();
      scene.remove(curve);
    }
    let level_bottom = get_level_bottom(this.level);
    this.three_curves.length = 0;
    // Create a new one, don't set points.
    this.arc_curve = new ArcCurve(this.control_points);
    let curve_points = 50;
    let tube_geom = new THREE.TubeGeometry(this.arc_curve, curve_points, params.flat_curve_radius, 8, false);
    for (let i = 0; i < this.rotation_symmetry; i++) {
      let tube = new THREE.Mesh(tube_geom,
        i == 0 ? this.get_main_material() : this.get_sym_material(i));
      tube.type = i == 0 ? "unit_curve" : "ns_line";
      tube.userData = this;

      tube.rotateY((2 * Math.PI / this.rotation_symmetry) * i);
      tube.translateY(level_bottom);
      this.three_curves.push(tube);
      scene.add(tube);
    }
    if (!!this.ref_symmetry_point) {
      let ref_mat = this.get_reflection_mat();
      for (let i = 0; i < this.rotation_symmetry; i++) {
        let tube = new THREE.Mesh(tube_geom, this.get_sym_material(i));
        tube.type = "ns_line";
        tube.applyMatrix4(ref_mat);
        tube.rotateY((2 * Math.PI / this.rotation_symmetry) * i);
        tube.translateY(level_bottom);
        this.three_curves.push(tube);
        scene.add(tube);
      }
    }
    this.draw_decoration_curve();

    // Add lines showing the tangent at each control point.
    for (let p of this.three_control_points_lines) {
      p.geometry.dispose();
      scene.remove(p);
    }
    this.three_control_points_lines.length = 0;

    let p = this.control_points[0];
    let p2 = this.control_points[1];
    let line1 = new THREE.LineCurve(p, p2);
    let mesh1 = new THREE.Mesh(new THREE.TubeGeometry(line1, 16, params.flat_curve_radius, 8, false), tangent_line_material);
    mesh1.type = "ns_line";
    mesh1.translateY(0.001);
    scene.add(mesh1);
    this.three_control_points_lines.push(mesh1);


    if (this.control_points.length > 3) {
      let p3 = this.control_points[2];
      let p4 = this.control_points[3];
      let line2 = new THREE.LineCurve(p3, p4);
      let mesh2 = new THREE.Mesh(new THREE.TubeGeometry(line2, 16, params.flat_curve_radius, 8, false), tangent_line_material);
      mesh2.type = "ns_line";
      mesh2.translateY(0.001);
      scene.add(mesh2);
      this.three_control_points_lines.push(mesh2);
    }

    this.set_visibility(params.preview_mode != 'Preview' && this.level == params.current_level && edit_mode != 'change_layer_bottom');
    this.set_control_points_visibility(params.control_points_visible);
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
      p.visible = is_visible && this.three_curves[0].visible && params.preview_mode != 'Preview'
    }
    for (let p of this.three_control_points_lines) {
      p.visible = is_visible && this.three_curves[0].visible && params.preview_mode != 'Preview'
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