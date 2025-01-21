import { params } from "../state/params";


export function compute_rmf(curve, options = {}) {
  let rmf = [{
    t: 0,
    tangent: curve.getTangent(0),
    normal: curve.getPoint(0).normalize(),
    binormal: new THREE.Vector3()
  }];
  rmf[0].normal.y = 0;
  rmf[0].normal.normalize();
  rmf[0].binormal.crossVectors(rmf[0].tangent, rmf[0].normal);

  if (options.init_frame) {
    rmf[0].normal = options.init_frame.normal;
    rmf[0].binormal.crossVectors(rmf[0].tangent, rmf[0].normal);
    rmf[0].binormal.normalize();
    rmf[0].normal.crossVectors(rmf[0].binormal, rmf[0].tangent);
  }

  let resolution = (options.resolution ? options.resolution : 100);

  for (let i = 0; i < resolution - 1; i++) {
    let t_i = i / (resolution - 1);
    let t_ip1 = (i + 1) / (resolution - 1);
    let x_i = curve.getPoint(t_i);
    let x_ip1 = curve.getPoint(t_ip1);
    // First reflection.
    let v_1 = x_ip1.clone().sub(x_i).normalize();
    let n_i = rmf[i].normal;
    // Reflect n_i and t_I through the plane perpendicular to v_1.
    let n_il = n_i.clone().sub(v_1.clone().multiplyScalar(2 * n_i.dot(v_1)));
    let t_il = rmf[i].tangent.clone().sub(v_1.clone().multiplyScalar(2 * rmf[i].tangent.dot(v_1)));

    // Second reflection.
    let tang_p1 = curve.getTangent(t_ip1);
    let v_2 = tang_p1.clone().sub(t_il).normalize();
    let n_ip1 = n_il.clone().sub(v_2.clone().multiplyScalar(2 * n_il.dot(v_2)));
    let bin_ip1 = new THREE.Vector3();
    bin_ip1.crossVectors(tang_p1, n_ip1);
    rmf.push({ t: t_ip1, tangent: tang_p1, normal: n_ip1, binormal: bin_ip1 });
  }

  // Calculate minimal twist to get the correct normal in the end.
  let target_normal = curve.getPoint(1);
  target_normal.y = 0;
  target_normal.normalize();

  let ang = Math.atan2(target_normal.dot(rmf[resolution - 1].binormal),
    target_normal.dot(rmf[resolution - 1].normal));
  // Rotate the normal and binormal at each frame by ang / resolution.
  for (let i = 1; i < resolution; i++) {
    let q = new THREE.Quaternion();
    q.setFromAxisAngle(rmf[i].tangent, (i / (resolution - 1)) * ang);
    rmf[i].normal.applyQuaternion(q);
    rmf[i].binormal.applyQuaternion(q);
  }
  return rmf;
}

export function get_rmf_frame(curve, rmf, t) {
  let resolution = rmf.length;
  let l = Math.floor(t * (resolution - 1));
  let r = Math.min(l + 1, resolution - 1);
  let tt = (r != l ? ((t - rmf[l].t) / (rmf[r].t - rmf[l].t)) : 0);
  let tangent = rmf[l].tangent.clone().multiplyScalar(1 - tt).add(rmf[r].tangent.clone().multiplyScalar(tt));
  let normal = rmf[l].normal.clone().multiplyScalar(1 - tt).add(rmf[r].normal.clone().multiplyScalar(tt));
  let binormal = rmf[l].binormal.clone().multiplyScalar(1 - tt).add(rmf[r].binormal.clone().multiplyScalar(tt));
  return {
    position: curve.getPoint(t),
    tangent: tangent, normal: normal, binormal: binormal
  };
}

export function sweep_geom_along_curve(geom, curve, use_rmf) {
  let rmf = null;
  if (curve.rmf && curve.rmf.length > 0) {
    rmf = curve.rmf;
  } else {
    rmf = compute_rmf(curve, 100);
  }

  let get_simple_frame = (t) => {
    let pos = curve.getPoint(t);
    let tangent = curve.getTangent(t);
    let normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
    normal.normalize();
    let binormal = new THREE.Vector3();
    binormal.crossVectors(tangent, normal);
    return { position: pos, tangent: tangent, normal: normal, binormal: binormal };
  }

  let orig_flat_point = curve.getPoint(0);
  orig_flat_point = new THREE.Vector2(orig_flat_point.x, orig_flat_point.z);
  let orig_flat_len = orig_flat_point.length();
  orig_flat_point.normalize();
  let end_flat_point = curve.getPoint(1);
  end_flat_point = new THREE.Vector2(end_flat_point.x, end_flat_point.z);
  let end_flat_point_len = end_flat_point.length();
  end_flat_point.normalize();
  // As long as points remain on this side, don't change them. 
  // When they change side - project them on the line connecting the origin to the end point.
  let orig_side = end_flat_point.y * orig_flat_point.x - end_flat_point.x * orig_flat_point.y;

  let v = new THREE.Vector3();
  let size_x = geom.boundingBox.getSize(new THREE.Vector3()).x;
  for (let i = 0, l = geom.attributes.position.count; i < l; i++) {
    v.fromBufferAttribute(geom.attributes.position, i);
    let t = v.x / size_x;
    let frame = use_rmf ? get_rmf_frame(curve, rmf, t) : get_simple_frame(t);
    let p = frame.position, n = frame.normal, b = frame.binormal;

    let x = p.x + n.x * v.z + b.x * v.y,
      y = p.y + n.y * v.z + b.y * v.y,
      z = p.z + n.z * v.z + b.z * v.y;

    let cube_diag = (1 / Math.sqrt(2)) * params.tube_radius;

    if (params.cut_intersections && Math.abs(orig_side) > 1e-2) {
      let side = end_flat_point.y * x - end_flat_point.x * z;
      if (side * orig_side <= 0) {
        let line = end_flat_point;
        let proj = line.clone().multiplyScalar(Math.min(end_flat_point_len + cube_diag,
          x * line.x + z * line.y));
        x = proj.x;
        z = proj.y;
      }
      if /** Hacky to avoid cutting intersection if there's a decoration curve */
        (!curve.curve || !curve.curve.decoration_t) {
        side = orig_flat_point.y * x - orig_flat_point.x * z;
        if (side * orig_side >= 0) {
          let line = orig_flat_point;
          let proj = line.clone().multiplyScalar(
            Math.min(orig_flat_len + cube_diag, x * line.x + z * line.y));
          x = proj.x;
          z = proj.y;
        }
      }

    }

    geom.attributes.position.setXYZ(i, x, y, z);
  }
  geom.computeVertexNormals();
  return geom;
}