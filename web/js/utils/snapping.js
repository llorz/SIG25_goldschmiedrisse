import { params } from "../state/params";

export function closest_rotation_line(p) {
  let rot_sym = params.rotation_symmetry;
  if (params.rotation_symmetry % 2 == 0) {
    rot_sym *= 2;
  }
  let angle = Math.atan2(p.z, p.x);
  let rot = Math.round((angle - Math.PI / 2) / (2 * Math.PI / rot_sym));
  let len = Math.sqrt(p.x * p.x + p.z * p.z);
  let closest_ang = rot * 2 * Math.PI / rot_sym + Math.PI / 2;
  let closest_p = new THREE.Vector3(len * Math.cos(closest_ang), p.y, len * Math.sin(closest_ang));

  let angle2 = Math.atan2(-p.z, -p.x);
  let rot2 = Math.round((angle2 - Math.PI / 2) / (2 * Math.PI / rot_sym));
  let closest_ang2 = rot2 * 2 * Math.PI / rot_sym + Math.PI / 2;
  let closest_p2 = new THREE.Vector3(len * Math.cos(closest_ang2+Math.PI), p.y, len * Math.sin(closest_ang2+Math.PI));
  if (closest_p.distanceTo(p) < closest_p2.distanceTo(p)) {
    return closest_p;
  }
  return closest_p2;
}