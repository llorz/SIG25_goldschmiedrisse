import * as THREE from 'three';
import { EditMode, get_all_real_intersections, recon_curves, recon_surfaces, set_control_points_visibility, set_edit_mode } from '../state/state';
import { params } from '../state/params';
import { scene } from './visual';
import { analytic_curves_intersection, get_rotation_mat } from '../utils/intersect';
import { ReconstructedBiArcCurve } from '../geom/reconstructed_biarc_curve';
import { sync_module } from '../native/native';

const surface_material = new THREE.MeshStandardMaterial({
  side: THREE.DoubleSide,
  color: 0xbde0fe,
  opacity: 0.8,
  transparent: true,
  roughness: 0.9,
  metalness: 0.1,
  // wireframe: true,
});

const sphere_geom = new THREE.SphereGeometry(0.01, 32, 32);
let control_point_material = new THREE.MeshBasicMaterial({ color: 0x33ee33 });

let all_intersection_points = [];

/** @type {ReconstructedBiArcCurve[]} */
let all_curves_with_symmetries = [];
function get_all_cruves_with_symmetries() {
  all_curves_with_symmetries.length = 0;
  for (let recon_curve of recon_curves) {
    for (let rot = 0; rot < recon_curve.rotation_symmetry; rot++) {
      all_curves_with_symmetries.push(recon_curve.curve.get_sym_curve(rot));
      if (recon_curve.ref_symmetry_point) {
        all_curves_with_symmetries.push(recon_curve.curve.get_sym_curve(rot, true));
      }
    }
  }
}

class SymCurveIntersection {
  /**
   * 
   * @param {ReconstructedBiArcCurve} curve1 
   * @param {number} t1 
   * @param {ReconstructedBiArcCurve} curve2 
   * @param {number} t2 
   */
  constructor(curve1, t1, curve2, t2) {
    this.curve1 = curve1;
    this.t1 = t1;
    this.curve2 = curve2;
    this.t2 = t2;
  }
};
/** @type {SymCurveIntersection[]} */
let new_face_verts = [];

function get_all_real_inters_with_symmetries() {
  let inters = [];
  for (let i = 0; i < all_curves_with_symmetries.length; i++) {
    let curve1 = all_curves_with_symmetries[i];
    for (let j = i + 1; j < all_curves_with_symmetries.length; j++) {
      let curve2 = all_curves_with_symmetries[j];
      let res = curve1.arc_curve.intersect(curve2.arc_curve);
      for (let inter of res) {
        let t1 = curve1.get_t_for_x(inter[0]);
        let t2 = curve2.get_t_for_x(inter[1]);
        if (curve1.getPoint(t1).distanceTo(curve2.getPoint(t2)) > 1e-3)
          continue;

        inters.push(new SymCurveIntersection(curve1, t1, curve2, t2));
      }
    }
  }
  return inters;
}

export function init_add_new_face() {
  set_edit_mode(EditMode.new_face);
  clear_all_intersection_points();
  params.control_points_visible = false;
  set_control_points_visibility(false);
  new_face_verts.length = 0;
  get_all_cruves_with_symmetries();
  let inters = get_all_real_inters_with_symmetries();
  // let inters = get_all_real_intersections();
  for (let inter of inters) {
    let sphere = new THREE.Mesh(sphere_geom, control_point_material);
    let pos = inter.curve1.getPoint(inter.t1);
    sphere.type = "intersection_point";
    sphere.position.copy(pos);
    sphere.userData = inter;
    all_intersection_points.push(sphere);
    scene.add(sphere);
  }
}

export function add_new_face_vertex(inter) {
  new_face_verts.push(inter);
}
export function remove_new_face_vertex(inter) {
  let i = new_face_verts.indexOf(inter);
  if (i != -1) {
    new_face_verts.splice(i, 1);
  }
}

export function abort_new_face() {
  set_edit_mode(EditMode.none);
  clear_all_intersection_points();
  params.control_points_visible = true;
  set_control_points_visibility(true);
}

function build_polygon() {
  let polygon = [];
  for (let i = 0; i < new_face_verts.length; i++) {
    let vert = new_face_verts[i];
    let next_vert = new_face_verts[(i + 1) % new_face_verts.length];
    let curve, t1, t2;
    if (vert.curve1 == next_vert.curve1) {
      curve = vert.curve1;
      t1 = vert.t1;
      t2 = next_vert.t1;
    } else if (vert.curve1 == next_vert.curve2) {
      curve = vert.curve1;
      t1 = vert.t1;
      t2 = next_vert.t2;
    } else if (vert.curve2 == next_vert.curve1) {
      curve = vert.curve2;
      t1 = vert.t2;
      t2 = next_vert.t1;
    } else if (vert.curve2 == next_vert.curve2) {
      curve = vert.curve2;
      t1 = vert.t2;
      t2 = next_vert.t2;
    } else {
      console.info("Could not find shared curve.");
      return [];
    }
    for (let k = 0; k < 20; k++) {
      let t = t1 + (t2 - t1) * k / 20;
      polygon.push(curve.getPoint(t));
    }
  }
  return polygon;
}

export function finish_face() {
  set_edit_mode(EditMode.none);
  clear_all_intersection_points();
  params.control_points_visible = true;
  set_control_points_visibility(true);
  let poly = build_polygon();
  if (poly.length == 0) return;

  let res = sync_module.calculate_minimal_surface(poly);
  let [verts, faces, normals] = res;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  const indices = Array.from(faces);
  geometry.setIndex(indices);
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  let rot_sym = new_face_verts[0].curve1.rotation_symmetry;
  for (let i = 0; i < rot_sym; i++) {
    let recon_surface = new THREE.Mesh(geometry, surface_material);
    recon_surface.type = "reconstructed_surface";
    recon_surface.applyMatrix4(get_rotation_mat(rot_sym, i));
    scene.add(recon_surface);
    recon_surfaces.push(recon_surface);
  }
}

export function clear_all_intersection_points() {
  for (let sphere of all_intersection_points) {
    scene.remove(sphere);
    sphere.geometry.dispose();
  }
  all_intersection_points.length = 0;
}