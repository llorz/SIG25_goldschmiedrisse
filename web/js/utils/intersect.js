import * as THREE from 'three';

export function line_line_intersect(p1, d1, p2, d2) {
  let denom = d1.x * d2.y - d2.x * d1.y;
  if (Math.abs(denom) < 1e-5) {
    return null;
  }
  let t = (d2.y * (p1.x - p2.x) - d2.x * (p1.y - p2.y)) / denom;
  let u = (d1.y * (p1.x - p2.x) - d1.x * (p1.y - p2.y)) / denom;
  // if (t > 1 || t < 0 || u > 1 || u < 0) { return null; }
  return new THREE.Vector2(p1.x + t * d1.x, p1.y + t * d1.y);
}

export function line_line_segment_intersect(p1, d1, p2, d2) {
  let denom = d1.x * d2.y - d2.x * d1.y;
  if (Math.abs(denom) < 1e-5) {
    return null;
  }
  let t = (d2.y * (p1.x - p2.x) - d2.x * (p1.y - p2.y)) / denom;
  let u = (d1.y * (p1.x - p2.x) - d1.x * (p1.y - p2.y)) / denom;
  if (t > 1 || t < 0 || u > 1 || u < 0) { return null; }
  return new THREE.Vector2(p1.x + t * d1.x, p1.y + t * d1.y);
}