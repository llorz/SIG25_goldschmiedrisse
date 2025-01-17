import * as THREE from 'three';
import { clear_all_surfaces, EditMode, get_all_real_intersections, recon_curves, recon_surfaces, set_control_points_visibility, set_edit_mode } from '../state/state';
import { params } from '../state/params';
import { scene } from './visual';
import { analytic_curves_intersection, get_rotation_mat } from '../utils/intersect';
import { ReconstructedBiArcCurve } from '../geom/reconstructed_biarc_curve';
import { sync_module } from '../native/native';
import { ArcCurve } from '../geom/arc_curve';

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

class MergedIntersection {
  constructor() {
    this.intersections = [];
  }

  get_point() {
    if (this.intersections.length == 0) return null;
    return this.intersections[0].curve.getPoint(this.intersections[0].t);
  }

  is_same(p) {
    if (this.intersections.length == 0) return false;
    return this.get_point().distanceTo(p) < 1e-3;
  }

  add_intersection(curve, t) {
    this.intersections.push({ curve: curve, t: t });
  }
};

function merge_intersections(inters) {
  let merged = [];
  for (let inter of inters) {
    let found = false;
    let p = inter.curve1.getPoint(inter.t1);
    for (let m of merged) {
      if (m.is_same(p)) {
        m.add_intersection(inter.curve1, inter.t1);
        m.add_intersection(inter.curve2, inter.t2);
        found = true;
        break;
      }
    }
    if (!found) {
      let m = new MergedIntersection();
      m.add_intersection(inter.curve1, inter.t1);
      m.add_intersection(inter.curve2, inter.t2);
      merged.push(m);
    }
  }
  return merged;
}

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
  let inters = merge_intersections(get_all_real_inters_with_symmetries());
  // let inters = get_all_real_intersections();
  for (let inter of inters) {
    let sphere = new THREE.Mesh(sphere_geom, control_point_material);
    // let pos = inter.curve1.getPoint(inter.t1);
    let pos = inter.intersections[0].curve.getPoint(inter.intersections[0].t);
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

function build_polygon(poly_verts) {
  let find_common_intersection = (v1, v2) => {
    for (let inter1 of v1.intersections) {
      for (let inter2 of v2.intersections) {
        if (inter1.curve == inter2.curve) {
          return { curve: inter1.curve, t1: inter1.t, t2: inter2.t };
        }
      }
    }
    return null;
  };
  let polygon = [];
  let fixed = [];
  for (let i = 0; i < poly_verts.length; i++) {
    let vert = poly_verts[i];
    let next_vert = poly_verts[(i + 1) % poly_verts.length];
    let common = find_common_intersection(vert, next_vert);
    if (!common) {
      // console.log("No common intersection found");
      // return [];
      // Linearly interpolate between the points.
      let pt1 = vert.get_point();
      let height = pt1.y;
      pt1 = new THREE.Vector2(pt1.x, pt1.z);
      let tan1 = new THREE.Vector2(-pt1.y, pt1.x);
      let pt2 = next_vert.get_point();
      pt2 = new THREE.Vector2(pt2.x, pt2.z);
      if (tan1.dot(pt2.clone().sub(pt1)) < 0) {
        tan1.negate();
      }
      let arc = new ArcCurve([pt1, pt1.clone().add(tan1), pt2]);
      for (let k = 0; k < 20; k++) {
        let t = k / 20;
        let pt = arc.getPoint(t);
        fixed.push(polygon.length);
        // let pt1 = vert.get_point();
        // let pt2 = next_vert.get_point();
        // polygon.push(pt1.lerp(pt2, t));
        polygon.push(new THREE.Vector3(pt.x, height, pt.z));
      }
      continue;
    }
    let curve = common.curve;
    let t1 = common.t1, t2 = common.t2;
    for (let k = 0; k < 20; k++) {
      let t = t1 + (t2 - t1) * k / 20;
      fixed.push(polygon.length);
      polygon.push(curve.getPoint(t));
    }
  }
  return [polygon, fixed];
}

export function finish_face() {
  set_edit_mode(EditMode.none);
  clear_all_intersection_points();
  params.control_points_visible = true;
  set_control_points_visibility(true);
  let [poly, fixed] = build_polygon(new_face_verts);
  if (poly.length == 0) return;

  let res = sync_module.calculate_minimal_surface(poly, fixed);
  let [verts, faces, normals, uv] = res;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  const indices = Array.from(faces);
  geometry.setIndex(indices);
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  let rot_sym = new_face_verts[0].intersections[0].curve.rotation_symmetry;
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

/**
 * 
 * @param {MergedIntersection[]} intersections 
 */
function sort_intersections(intersections) {
  let curves_inters = new Map();
  for (let merged_intersection of intersections) {
    for (let inter of merged_intersection.intersections) {
      if (!curves_inters.has(inter.curve)) {
        curves_inters.set(inter.curve, [{ t: inter.t, inter: merged_intersection }]);
      } else {
        curves_inters.get(inter.curve).push({ t: inter.t, inter: merged_intersection });
      }
    }
  }
  for (let [curve, inters] of curves_inters) {
    inters.sort((a, b) => a.t - b.t);
  }
  return curves_inters;
}

function next_curve_and_dir(sorted, curve, curve_inter, dir) {
  let other_curve, other_curve_t;
  if (curve_inter.inter.intersections.length == 2) {
    if (curve_inter.inter.intersections[0].curve == curve) {
      other_curve = curve_inter.inter.intersections[1].curve;
      other_curve_t = curve_inter.inter.intersections[1].t;
    } else {
      other_curve = curve_inter.inter.intersections[0].curve;
      other_curve_t = curve_inter.inter.intersections[0].t;
    }
  }
  if (!other_curve) {
    console.info("No other curve found");
  }
  let pt = curve.getPoint(curve_inter.t).normalize();
  pt.y = 0;
  /** @type {THREE.Vector3} */
  let curve_tan = curve.getTangent(curve_inter.t - dir * 1e-3).normalize();
  /** @type {THREE.Vector3} */
  let other_curve_tan = other_curve.getTangent(other_curve_t).normalize();

  // If the cross points out of the cylinder, we need to switch direction to go
  // left.
  let ind = sorted.get(other_curve).findIndex(x => x.inter == curve_inter.inter);
  if (curve_tan.cross(other_curve_tan).dot(pt) > 0) {
    dir = -dir;
  }
  return { curve: other_curve, dir: dir, ind: ind };

}

function trace_face(sorted, curve, i, used_segments, start_dir = 1) {
  let curve_inter = sorted.get(curve)[i];
  let face_verts = [curve_inter.inter];
  let tmp_used_segs = [];

  let dir = start_dir;
  let ind = i;
  let finished_face = false;
  while (1) {
    ind += dir;
    if (ind < 0 || ind >= sorted.get(curve).length) {
      if (face_verts.length > 1 &&
        Math.abs(face_verts[0].get_point().y - face_verts[face_verts.length - 1].get_point().y) < 1e-3) {
          // Change to true to do bottom and top faces.
        finished_face = false;
      }
      break;
    }
    // Check if the segment was already used.
    if (used_segments.has(curve_inter)) {
      let used_dir_set = used_segments.get(curve_inter);
      if (used_dir_set.has(dir)) {
        // A face was already built with this segment
        break;
      }
    }
    tmp_used_segs.push({ inter: curve_inter, dir: dir });

    curve_inter = sorted.get(curve)[ind];
    if (face_verts[0] == curve_inter.inter) {
      // Done, traced a full loop.
      finished_face = true;
      break;
    }
    face_verts.push(curve_inter.inter);
    // Determine the next curve and direction.
    let res = next_curve_and_dir(sorted, curve, curve_inter, dir);
    curve = res.curve;
    dir = res.dir;
    ind = res.ind;
    curve_inter = sorted.get(curve)[ind];
  }
  if (finished_face) {
    for (let seg of tmp_used_segs) {
      if (!used_segments.has(seg.inter)) {
        used_segments.set(seg.inter, new Set());
      }
      used_segments.get(seg.inter).add(seg.dir);
    }
    return face_verts;
  } else {
    console.info("Did not finish face");
    console.info(face_verts);
    return [];
  }
}

function add_face(poly, fixed) {
  let res = sync_module.calculate_minimal_surface(poly, fixed);
  let [verts, faces, normals] = res;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  const indices = Array.from(faces);
  geometry.setIndex(indices);
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  let recon_surface = new THREE.Mesh(geometry, surface_material);
  recon_surface.type = "reconstructed_surface";
  scene.add(recon_surface);
  recon_surfaces.push(recon_surface);
}

export function find_all_faces() {
  clear_all_surfaces();
  get_all_cruves_with_symmetries();
  let inters = merge_intersections(get_all_real_inters_with_symmetries());
  let sorted = sort_intersections(inters);
  let used_segments = new Map();

  for (let curve of all_curves_with_symmetries) {
    for (let i = 0, l = sorted.get(curve).length; i < l; i++) {
      let poly_verts = trace_face(sorted, curve, i, used_segments, 1);
      if (poly_verts.length > 0) {
        let [poly, fixed] = build_polygon(poly_verts);
        add_face(poly, fixed);
      }
      poly_verts = trace_face(sorted, curve, i, used_segments, -1);
      if (poly_verts.length > 0) {
        let [poly, fixed] = build_polygon(poly_verts);
        add_face(poly, fixed);
      }
    }
  }
}