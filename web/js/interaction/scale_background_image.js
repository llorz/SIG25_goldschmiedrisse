import { background_image_plane, EditMode, set_edit_mode } from "../state/state";



let start_pt = null;
let start_scale = null;

export function init_scale(pt) {
  start_pt = pt;
  start_scale = background_image_plane.scale.clone();
  set_edit_mode(EditMode.scale_background_image);
}

export function edit_background_image_scale(ray_cast) {
  if (!start_pt)
    return;
  let plane = new THREE.Plane();
  plane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0));
  let intersection = new THREE.Vector3();
  ray_cast.ray.intersectPlane(plane, intersection);

  let scale = start_scale.clone();
  let scale_x = intersection.x / start_pt.x;
  let scale_y = intersection.z / start_pt.z;
  let max_scale = Math.max(scale_x, scale_y);
  scale.x *= max_scale;
  scale.y *= max_scale;
  background_image_plane.scale.copy(scale);
}

export function cancel_scale() {
  if (!start_pt)
    return;
  background_image_plane.scale.copy(start_scale);
  start_pt = null;
  start_scale = null;
  set_edit_mode(EditMode.none);
}

export function accept_scale() {
  start_pt = null;
  start_scale = null;
  set_edit_mode(EditMode.none);
}