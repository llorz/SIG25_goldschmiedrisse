import * as THREE from 'three';
import { scene } from './visual';
import { sync_module } from '../native/native';

export const surface_material = new THREE.MeshStandardMaterial({
  side: THREE.DoubleSide,
  color: 0xbde0fe,
  opacity: 0.8,
  transparent: true,
  roughness: 0.9,
  metalness: 0.1,
  // wireframe: true,
});

export class ReconstructedSurface {

  constructor(recon_curve) {
    this.recon_curve = recon_curve;
    this.three_surfaces = [];
  }

  calculate_and_show() {
    let res = sync_module.build_faces(
      this.recon_curve.recon_bezy_curve, this.recon_curve.rotation_symmetry, this.recon_curve.ref_symmetry_point);
    for (let face of res) {
      let [verts, faces, normals] = face;
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      const indices = Array.from(faces);
      geometry.setIndex(indices);
      geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
      let recon_surface = new THREE.Mesh(geometry, surface_material);
      recon_surface.type = "reconstructed_surface";
      this.three_surfaces.push(recon_surface);
      scene.add(recon_surface);
      for (let i = 1; i < this.recon_curve.rotation_symmetry; i++) {
        let mat = new THREE.Matrix4();
        mat.makeRotationY(2 * Math.PI / this.recon_curve.rotation_symmetry * i);
        let surf = recon_surface.clone();
        surf.applyMatrix4(mat);
        surf.type = "reconstructed_surface";
        this.three_surfaces.push(surf);
        scene.add(surf);
      }
    }
  }

  set_visibility(visibility) {
    for (let surface of this.three_surfaces) {
      surface.visible = visibility;
    }
  }

  destroy() {
    for (let surface of this.three_surfaces) {
      surface.geometry.dispose();
      scene.remove(surface);
    }
    this.three_surfaces.length = 0;
  }

};