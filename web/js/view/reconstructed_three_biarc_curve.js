import * as THREE from 'three';

import { get_active_camera, scene } from './visual';

import { ReconstructedBiArcCurve } from '../geom/reconstructed_biarc_curve';
import { params } from '../state/params';
import { curves, get_level_bottom, get_level_height, mode, updated_height } from '../state/state';
import { get_curve_color, get_curve_color_material } from '../state/color_generator';
import { DecorationArcCurve } from '../geom/decoration_arc_curve';
import { ArcCurve } from '../geom/arc_curve';
import { compute_rmf, sweep_geom_along_curve } from '../geom/rmf';

let sweep_plane_geom =// new THREE.BoxGeometry(100, 0.1, 0.002, 500, 4, 3);
  new THREE.PlaneGeometry(100, 0.1, 200, 1);
sweep_plane_geom.computeBoundingBox();
var size = new THREE.Vector3();
sweep_plane_geom.boundingBox.getSize(size);
sweep_plane_geom.translate(-sweep_plane_geom.boundingBox.min.x, -sweep_plane_geom.boundingBox.min.y - size.y / 2,
  -sweep_plane_geom.boundingBox.min.z - size.z / 2);

let cylinder_geom = new THREE.CylinderGeometry(0.007, 0.007, 10, 32, 200, true);
cylinder_geom.rotateZ(Math.PI / 2);
cylinder_geom.computeBoundingBox();
let size_cyl = new THREE.Vector3();
cylinder_geom.boundingBox.getSize(size_cyl);
cylinder_geom.translate(-cylinder_geom.boundingBox.min.x, -cylinder_geom.boundingBox.min.y - size_cyl.y / 2,
  -cylinder_geom.boundingBox.min.z - size_cyl.z / 2);

let cylinder_geom2 = new THREE.CylinderGeometry(0.01, 0.01, 10, 32, 200, true);
cylinder_geom2.rotateZ(Math.PI / 2);
cylinder_geom2.computeBoundingBox();
let size_cyl2 = new THREE.Vector3();
cylinder_geom2.boundingBox.getSize(size_cyl2);
cylinder_geom2.translate(-cylinder_geom2.boundingBox.min.x, -cylinder_geom2.boundingBox.min.y - size_cyl2.y / 2,
  -cylinder_geom2.boundingBox.min.z - size_cyl2.z / 2);
cylinder_geom2.translate(0, -size.y / 2, 0);

let cylinder_geom3 = cylinder_geom2.clone();
cylinder_geom3.translate(0, size.y, 0);


const sweep_plane_material = new THREE.MeshStandardMaterial({
  // color: 0x3456ff,
  // color: 0xa2d2ff,

  // color: 0xffd670,
  // color: 0xffea00,

  color: 0xffd166,
  side: THREE.DoubleSide,
  metalness: 0.2, roughness: 0.8
});

const tangent_line_material = new THREE.MeshBasicMaterial({ color: 0x00aa00 });
const sphere_geom = new THREE.SphereGeometry(0.01, 32, 32);
let control_point_material = new THREE.MeshBasicMaterial({ color: 0x0 });
let main_curve_material = new THREE.MeshLambertMaterial({ color: 0xff0000, side: THREE.DoubleSide });
// let symmetry_curve_material = new THREE.MeshLambertMaterial({
//   color: 0x000000, side: THREE.DoubleSide,
//   opacity: 0.6, transparent: true
// });
let symmetry_curve_material = new THREE.MeshStandardMaterial({
  // color: 0xFFD700, 
  color: 0xc77dff,
  // color: 0xA1662F,
  side: THREE.DoubleSide,
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

export function set_wire_frame() {
  symmetry_curve_material.wireframe = params.tube_wireframe;
  main_curve_material.wireframe = params.tube_wireframe;
}

export class ReconstructedThreeBiArcCurve {
  constructor(curve) {
    /** @type {ReconstructedBiArcCurve} */
    this.curve = curve;

    this.decoration_curve = this.get_decoration_curve();

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

  get_decoration_curve() {
    if (this.curve.curve.decoration_t == 0) return null;
    let flat_arc = this.curve.curve.arc_curve;
    let bottom_height = get_level_bottom(this.curve.level);
    let height_arc_curve = new ArcCurve([new THREE.Vector2(0, bottom_height),
    new THREE.Vector2(0, 1),
    new THREE.Vector2(this.curve.curve.decoration_t * flat_arc.length(), bottom_height + this.curve.curve.decoration_height)]);
    let curve = new DecorationArcCurve(height_arc_curve, flat_arc);
    curve.rmf = compute_rmf(curve);
    return curve;
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
    let last_mid_height = this.curve.middle_height;
    let last_top_height = this.curve.top_height;
    if (idx == 0) {
      this.curve.set_middle_height(new_loc.y);
    } else if (idx == 1) {
      this.curve.set_top_height(new_loc.y);
    }
    this.update_curve();
    updated_height(last_top_height, last_mid_height, this.curve);
  }

  sweep_geom(orig_geom, geom = orig_geom.clone()) {
    let v = new THREE.Vector3();
    let size_x = orig_geom.boundingBox.getSize(new THREE.Vector3()).x;
    for (let i = 0, l = orig_geom.attributes.position.count; i < l; i++) {
      v.fromBufferAttribute(orig_geom.attributes.position, i);
      let t = v.x / (size_x + 1e-2);
      let frame = params.use_rmf ? this.curve.get_rmf_frame(t) : this.curve.getFrame(t);
      let new_v = frame.position.clone().add(frame.normal.clone().multiplyScalar(v.z)).add(frame.binormal.clone().multiplyScalar(v.y));
      geom.attributes.position.setXYZ(i, new_v.x, new_v.y, new_v.z);
    }
    geom.computeVertexNormals();
    return geom;
  }

  get_sweep_cube_geom() {
    let sweep_cube_geom = new THREE.BoxGeometry(10, params.tube_radius, params.tube_radius, 200, 1, 1);
    sweep_cube_geom.computeBoundingBox();
    let size_cube = new THREE.Vector3();
    sweep_cube_geom.boundingBox.getSize(size_cube);
    sweep_cube_geom.translate(-sweep_cube_geom.boundingBox.min.x, -sweep_cube_geom.boundingBox.min.y - size_cube.y / 2,
      -sweep_cube_geom.boundingBox.min.z - size_cube.z / 2);
    return sweep_cube_geom;
  }

  get_sweep_cylinder_geom() {
    let cylinder_geom = new THREE.CylinderGeometry(params.tube_radius, params.tube_radius, 10,
      params.tube_circular_segments, params.tube_height_segments, false);
    cylinder_geom.rotateZ(Math.PI / 2);
    cylinder_geom.computeBoundingBox();
    let size_cyl = new THREE.Vector3();
    cylinder_geom.boundingBox.getSize(size_cyl);
    cylinder_geom.translate(-cylinder_geom.boundingBox.min.x, -cylinder_geom.boundingBox.min.y - size_cyl.y / 2,
      -cylinder_geom.boundingBox.min.z - size_cyl.z / 2);
    return cylinder_geom;
  }

  get_sweep_geom() {
    if (params.biarcs_visualization == 'cube') {
      return this.get_sweep_cube_geom();
    }
    return this.get_sweep_cylinder_geom();
  }

  get_sweep_object() {
    let obj = new THREE.Group();
    if (params.biarcs_visualization != 'ribbon') {
      // let geom = this.get_sweep_cylinder_geom();
      let geom = this.get_sweep_geom();
      if (this.decoration_curve) {
        this.curve.rmf = compute_rmf(this.curve,
          { init_frame: this.decoration_curve.rmf[this.decoration_curve.rmf.length - 1] });
      }
      obj.add(new THREE.Mesh(sweep_geom_along_curve(geom, this.curve, params.use_rmf),
        symmetry_curve_material));
      // obj.add(new THREE.Mesh(this.sweep_geom(geom, geom), symmetry_curve_material));
      // obj.add(new THREE.Mesh(
      //   new THREE.TubeGeometry(this.curve, params.tube_height_segments, params.tube_radius, params.tube_circular_segments, false), symmetry_curve_material));
    } else if (params.biarcs_visualization == 'ribbon') {
      obj.add(new THREE.Mesh(this.sweep_geom(cylinder_geom3), symmetry_curve_material));
      obj.add(new THREE.Mesh(this.sweep_geom(sweep_plane_geom), sweep_plane_material));
      obj.add(new THREE.Mesh(this.sweep_geom(cylinder_geom2), symmetry_curve_material));
    }
    return obj;
  }
  get_main_material() {
    if (params.biarcs_visualization == 'colorful') {
      return get_curve_color_material(curves.indexOf(this.curve.curve));
    }
    return main_curve_material;
  }
  get_sym_material(i) {
    if (params.biarcs_visualization == 'colorful') {
      // return get_curve_color_material(i);
      return get_curve_color_material(curves.indexOf(this.curve.curve));
    }
    return symmetry_curve_material;
  }

  update_top_decoration_curves() {
    let tv_curve = this.curve.curve;
    if (tv_curve.control_points.length < 5 ||
      tv_curve.control_points[4].distanceTo(tv_curve.control_points[2]) < 1e-3) return;
    let flat_arc_curve = new ArcCurve(tv_curve.control_points.slice(2, 5));

    // let end_x = Math.max(1 - (flat_arc_curve.length() / tv_curve.arc_curve.length()), tv_curve.prc_t);
    // target_len <= flat_arc_curve.length()
    // let target_len = (1 - end_x) * tv_curve.arc_curve.length();
    // let end_t = this.curve.get_t_for_x(end_x);
    // let pt = this.curve.getPoint(end_t);

    let top_pt = this.curve.getPoint(1);
    let [x, y] = this.curve.get_arc_b_y_for_x(flat_arc_curve.length());
    let height_arc_curve = new ArcCurve([new THREE.Vector2(0, top_pt.y),
    new THREE.Vector2(0, top_pt.y - 1.0), new THREE.Vector2(x, y)]);

    // let tube = new THREE.Mesh(new THREE.TubeGeometry(new DecorationArcCurve(height_arc_curve, flat_arc_curve), 32, params.tube_radius, 8, false),
    //   symmetry_curve_material);
    let geom = sweep_geom_along_curve(this.get_sweep_geom(), new DecorationArcCurve(height_arc_curve, flat_arc_curve), params.use_rmf);
    let tube = new THREE.Mesh(geom, symmetry_curve_material);
    tube.type = "ns_line";
    for (let i = 0; i < this.rotation_symmetry; i++) {
      let filling_tube_clone = tube.clone();
      if (params.biarcs_visualization == 'colorful') {
        filling_tube_clone.material = i == 0 ? this.get_main_material() : this.get_sym_material(i);
      }
      filling_tube_clone.rotateY((2 * Math.PI / this.rotation_symmetry) * i);
      this.three_curves.push(filling_tube_clone);
      scene.add(filling_tube_clone);
    }

    if (!!this.ref_symmetry_point) {
      let ref_mat = this.get_reflection_mat(this.ref_symmetry_point);
      for (let i = 0; i < this.rotation_symmetry; i++) {
        let filling_tube_clone = tube.clone();
        filling_tube_clone.material = this.get_sym_material(i);
        filling_tube_clone.applyMatrix4(ref_mat);
        filling_tube_clone.rotateY((2 * Math.PI / this.rotation_symmetry) * i);
        this.three_curves.push(filling_tube_clone);
        scene.add(filling_tube_clone);
      }
    }
  }

  update_decoration_curves() {
    if (!this.decoration_curve) return;
    // let tube = new THREE.Mesh(new THREE.TubeGeometry(this.decoration_curve, 32, params.tube_radius, 8, false),
    // symmetry_curve_material);
    let geom = sweep_geom_along_curve(this.get_sweep_geom(), this.decoration_curve, params.use_rmf);
    let tube = new THREE.Mesh(geom, symmetry_curve_material);
    tube.type = "ns_line";
    for (let i = 0; i < this.rotation_symmetry; i++) {
      let filling_tube_clone = tube.clone();
      if (params.biarcs_visualization == 'colorful') {
        filling_tube_clone.material = i == 0 ? this.get_main_material() : this.get_sym_material(i);
      }
      filling_tube_clone.rotateY((2 * Math.PI / this.rotation_symmetry) * i);
      this.three_curves.push(filling_tube_clone);
      scene.add(filling_tube_clone);
    }

    if (!!this.ref_symmetry_point) {
      let ref_mat = this.get_reflection_mat(this.ref_symmetry_point);
      for (let i = 0; i < this.rotation_symmetry; i++) {
        let filling_tube_clone = tube.clone();
        filling_tube_clone.material = this.get_sym_material(i);
        filling_tube_clone.applyMatrix4(ref_mat);
        filling_tube_clone.rotateY((2 * Math.PI / this.rotation_symmetry) * i);
        this.three_curves.push(filling_tube_clone);
        scene.add(filling_tube_clone);
      }
    }
  }

  update_supporting_pillar() {
    let sup_point = this.curve.curve.supporting_pillar_point;
    let first_pt = this.curve.getPoint(0);
    if (!sup_point ||
      Math.abs(sup_point.distanceTo(first_pt)) < 1e-2) return;

    let line_curve = new THREE.LineCurve3(sup_point, first_pt);
    // let filling_tube = new THREE.Mesh(new THREE.TubeGeometry(line_curve, 32, params.tube_radius, 8, false), symmetry_curve_material);
    let geom = sweep_geom_along_curve(this.get_sweep_geom(), line_curve, params.use_rmf);
    let filling_tube = new THREE.Mesh(geom, symmetry_curve_material);
    for (let i = 0; i < this.rotation_symmetry; i++) {
      let filling_tube_clone = filling_tube.clone();
      if (params.biarcs_visualization == 'colorful') {
        filling_tube_clone.material = i == 0 ? this.get_main_material() : this.get_sym_material(i);
      }
      filling_tube_clone.type = "ns_line";
      filling_tube_clone.rotateY((2 * Math.PI / this.rotation_symmetry) * i);
      this.three_curves.push(filling_tube_clone);
      scene.add(filling_tube_clone);
    }
    // if (!!this.ref_symmetry_point) {
    //   let ref_mat = this.get_reflection_mat(this.ref_symmetry_point);
    //   for (let i = 0; i < this.rotation_symmetry; i++) {
    //     let filling_tube_clone = filling_tube.clone();
    //     filling_tube_clone.material = this.get_sym_material(i);
    //     filling_tube_clone.applyMatrix4(ref_mat);
    //     filling_tube_clone.rotateY((2 * Math.PI / this.rotation_symmetry) * i);
    //     this.three_curves.push(filling_tube_clone);
    //     scene.add(filling_tube_clone);
    //   }
    // }
  }

  update_vertical_lines() {
    if (this.curve.curve.vertical_line_top == 0) return;
    let last_pt = this.curve.getPoint(1);
    let top_pt = last_pt.clone();
    top_pt.y = this.curve.curve.vertical_line_top;

    let line_curve = new THREE.LineCurve3(last_pt, top_pt);
    let filling_tube = new THREE.Mesh(new THREE.TubeGeometry(line_curve, 32, params.tube_radius, 8, false), symmetry_curve_material);
    for (let i = 0; i < this.rotation_symmetry; i++) {
      let filling_tube_clone = filling_tube.clone();
      filling_tube_clone.type = "ns_line";
      if (params.biarcs_visualization == 'colorful') {
        filling_tube_clone.material = i == 0 ? this.get_main_material() : this.get_sym_material(i);
      }
      filling_tube_clone.rotateY((2 * Math.PI / this.rotation_symmetry) * i);
      this.three_curves.push(filling_tube_clone);
      scene.add(filling_tube_clone);
    }
  }

  update_curve() {
    for (let group of this.three_curves) {
      for (let curve of group.children) {
        curve.geometry.dispose();
      }
      scene.remove(group);
    }
    this.three_curves.length = 0;

    // Update control points position.
    this.control_points[0].position.copy(this.curve.getPoint(this.curve.arca_len / this.curve.len));
    this.control_points[1].position.copy(this.curve.getPoint(1));

    this.update_supporting_pillar();
    this.update_decoration_curves();
    this.update_top_decoration_curves();
    this.update_vertical_lines();

    let filling_tube = null;
    // Uncomment to add filling tube.
    // let level_height = get_level_height(this.curve.curve.level);
    // if (Math.abs(this.curve.curve.height - level_height) > 1e-3) {
    //   let curve_top = this.curve.getPoint(1);
    //   let line_curve = new THREE.LineCurve3(curve_top, new THREE.Vector3(curve_top.x, level_height, curve_top.z));
    //   filling_tube = new THREE.Mesh(new THREE.TubeGeometry(line_curve, 32, params.tube_radius, 8, false), symmetry_curve_material);
    // }

    let orig_tube = this.get_sweep_object();
    for (let i = 0; i < this.rotation_symmetry; i++) {
      let tube = orig_tube.clone();
      for (let obj of tube.children) {
        if (params.biarcs_visualization == 'colorful')
          obj.material = i == 0 ? this.get_main_material() : this.get_sym_material(i);
        obj.type = "ns_line";
      }
      tube.type = "ns_line";
      tube.rotateY((2 * Math.PI / this.rotation_symmetry) * i);
      this.three_curves.push(tube);
      scene.add(tube);
      if (!!filling_tube) {
        let filling_tube_clone = filling_tube.clone();
        if (params.biarcs_visualization == 'colorful') {
          filling_tube_clone.material = i == 0 ? this.get_main_material() : this.get_sym_material(i);
        }
        filling_tube_clone.rotateY((2 * Math.PI / this.rotation_symmetry) * i);
        filling_tube_clone.type = "ns_line";
        this.three_curves.push(filling_tube_clone);
        scene.add(filling_tube_clone);
      }
    }
    if (!!this.ref_symmetry_point) {
      let ref_mat = this.get_reflection_mat(this.ref_symmetry_point);
      for (let i = 0; i < this.rotation_symmetry; i++) {
        let tube = orig_tube.clone();
        for (let obj of tube.children) {
          if (params.biarcs_visualization == 'colorful')
            obj.material = i == 0 ? this.get_main_material() : this.get_sym_material(i);
          obj.type = "ns_line";
        }
        tube.type = "ns_line";
        tube.applyMatrix4(ref_mat);
        tube.rotateY((2 * Math.PI / this.rotation_symmetry) * i);
        this.three_curves.push(tube);
        scene.add(tube);
        if (!!filling_tube) {
          let filling_tube_clone = filling_tube.clone();
          filling_tube_clone.material = this.get_sym_material(i);
          filling_tube_clone.applyMatrix4(ref_mat);
          filling_tube_clone.rotateY((2 * Math.PI / this.rotation_symmetry) * i);
          this.three_curves.push(filling_tube_clone);
          scene.add(filling_tube_clone);
        }
      }
    }

    this.set_visibility(params.reconstructed_biarc_visible);
    this.set_control_points_visibility(
      Math.abs(Math.abs(get_active_camera().getWorldDirection(new THREE.Vector3()).y) - 1) > 1e-3);
  }

  destroy() {
    for (let group of this.three_curves) {
      for (let curve of group.children) {
        curve.geometry.dispose();
      }
      scene.remove(group);
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
    visibility = visibility && params.reconstructed_biarc_visible;
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
    let is_camera_not_vertical = mode == "side_view" ||
      Math.abs(Math.abs(get_active_camera().getWorldDirection(new THREE.Vector3()).y) - 1) > 1e-3;
    for (let cp of this.control_points) {
      cp.visible = is_camera_not_vertical && is_visible && params.control_points_visible && params.reconstructed_biarc_visible;
    }
  }
}