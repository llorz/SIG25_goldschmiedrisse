#include "Bezier.h"
#include "conversions.h"
#include "mc_flow.h"
#include "structure.h"
#include "triangulation.h"
#include "intersect.h"
#include <chrono>
#include <emscripten/bind.h>
#include <igl/per_vertex_normals.h>
#include <iostream>

using namespace emscripten;

double find_t_in_height_bezier(double x, const std::vector<Bezier> &beziers,
                               const std::vector<double> &accum_len) {
  for (int i = 0; i < beziers.size(); i++) {
    if (std::abs(beziers[i].points(0, 0) - x) < 1e-2) {
      return accum_len[i];
    } else if (std::abs(beziers[i].points(3, 0) - x) < 1e-2) {
      return accum_len[i + 1];
    }
  }
  return -1;
}

Eigen::Vector3d get_point(double t, const SplitBezier &mb,
                          const Bezier &flat_bezier) {
  Eigen::Vector2d pt = mb.at(t);
  Eigen::Vector2d flat_pt = flat_bezier.at(pt.x());
  return Eigen::Vector3d(flat_pt.x(), pt.y(), flat_pt.y());
}

std::vector<Eigen::Vector3d>
get_face_points(const Face &face, const std::vector<Bezier> &height_beziers,
                const Bezier &flat_bezier, const std::vector<double> &accum_len,
                int symmetry, const Eigen::Matrix2d &ref_mat) {
  std::vector<Eigen::Vector3d> res;
  for (int i = 0; i < face.vertices.size() - 1; i++) {
    auto &vi = face.vertices[i];
    auto vip1 = face.vertices[(i + 1) % face.vertices.size()];
    double t1 = find_t_in_height_bezier(vi.t, height_beziers, accum_len);
    double t2 = find_t_in_height_bezier(vip1.t, height_beziers, accum_len);

    int rot_sym = vi.symmetry / 2;
    int ref_sym = vi.symmetry % 2;
    Eigen::Matrix2d rot_mat =
        Eigen::Rotation2D<double>(2.0 * rot_sym * M_PI / symmetry)
            .toRotationMatrix();
    Eigen::Matrix2d mat =
        ref_sym == 1 ? (ref_mat.transpose() * rot_mat).eval() : rot_mat;
    mat.transposeInPlace();

    SplitBezier mb(height_beziers, accum_len);
    for (int j = 0; j < 10; j++) {
      double t = t1 + (t2 - t1) * j / 10.0;
      auto pt = get_point(t, mb, flat_bezier);
      Eigen::Vector2d flat_point(pt.x(), pt.z());
      Eigen::Vector2d rot = mat * flat_point;
      res.emplace_back(Eigen::Vector3d(rot.x(), pt.y(), rot.y()));
    }
  }
  return res;
}

val test_stuff(emscripten::val curve, int symmetry, val ref_symmetry) {
  auto graph = build_graph(curve["points"], symmetry, ref_symmetry);
  auto ref_mat = get_ref_mat(ref_symmetry);
  auto bz = js_to_beziers(curve["height_points"]);
  auto accum_len = to_array<double>(curve["accumulated_seg_lengths"]);
  emscripten::val all_faces = val::global("Array").new_();
  for (auto &face : graph.faces) {
    auto resa =
        get_face_points(face, bz, graph.bezier, accum_len, symmetry, ref_mat);
    Eigen::MatrixXd bla(resa.size(), 3);
    for (int i = 0; i < resa.size(); i++) {
      bla.row(i) = resa[i];
    }

    auto [V, F] = triangulate_polygon(bla);
    set_boundary_verts(bla, F, V);
    V = run_mc_iteration(V, F);

    emscripten::val res = val::global("Array").new_();
    Eigen::MatrixXd N;
    igl::per_vertex_normals(V, F, N);

    res.call<void>("push", eig_to_js_array(V));
    res.call<void>("push", eig_to_js_array(F));
    res.call<void>("push", eig_to_js_array(N));
    all_faces.call<void>("push", res);
  }
  return all_faces;
}

val test_stuff_v2(emscripten::val curve) {
  auto bezi_vec = js_to_multibeziers(curve);
  emscripten::val all_faces = val::global("Array").new_();
  if (bezi_vec.empty()) {
    return all_faces;
  }
  auto graph = build_multi_graph(bezi_vec, bezi_vec[0].rotation_symmetry);

  
  for (int i = 0; i< graph.faces.size(); i++) {
    auto [V, F, N] = build_face(graph, i);
    emscripten::val res = val::global("Array").new_();
    res.call<void>("push", eig_to_js_array(V));
    res.call<void>("push", eig_to_js_array(F));
    res.call<void>("push", eig_to_js_array(N));
    all_faces.call<void>("push", res);
  }
  return all_faces;
}

emscripten::val closest_point(emscripten::val bezier, emscripten::val point,
                              int symmetry, val ref_symmetry) {
  Bezier bezi = js_to_bezier(bezier);
  Eigen::Vector2d p = js_to_point(point);
  double closest_point_t = bezi.closest_point_t(p).first;
  // Extract reflection point.
  Eigen::Vector2d ref_point(0, 0);
  std::string ref_type = ref_symmetry.typeOf().as<std::string>();
  if (ref_type == "object") {
    ref_point = js_to_point(ref_symmetry).normalized();
  }
  Eigen::Matrix2d ref_mat =
      2 * ref_point * ref_point.transpose() - Eigen::Matrix2d::Identity();
  double min_dist = 1000.0;
  Eigen::Vector2d sym_cp;
  auto find_and_update_closest_point = [&](const Bezier &curve,
                                           const Eigen::Matrix2d &mat,
                                           bool moving_last_point) {
    double t = curve.closest_point_t(p).first;
    Eigen::Vector2d cp = curve.at(t);
    if (std::abs(closest_point_t - t) < 1e-2) {
      Eigen::Vector2d kernel =
          (mat.transpose() - Eigen::Matrix2d::Identity()).fullPivLu().kernel();
      cp = kernel.dot(cp) * kernel;
    }
    double dist = (cp - p).norm();
    if (dist < min_dist) {
      min_dist = dist;
      sym_cp = cp;
    }
  };
  Bezier bb;
  for (int i = 0; i < symmetry; i++) {
    Eigen::Matrix2d rot =
        Eigen::Rotation2D<double>(2.0 * i * M_PI / symmetry).toRotationMatrix();
    if (ref_point.norm() > 1e-6) {
      Eigen::Matrix2d mat = ref_mat.transpose() * rot;
      bb.points = bezi.points * mat;
      find_and_update_closest_point(bb, mat, true);
    }
    if (i > 0) {
      bb.points = bezi.points * rot;
      find_and_update_closest_point(bb, rot, false);
    }
  }
  val res = val::global("Array").new_();
  res.call<void>("push", sym_cp.x());
  res.call<void>("push", sym_cp.y());
  return res;
}

val find_t_for_x(val bezier, val xs) {
  Bezier bezi = js_to_bezier(bezier);
  emscripten::val res = val::global("Array").new_();
  auto nxs = xs["length"].as<unsigned>();
  for (int i = 0; i < nxs; i++) {
    double x = xs[i].as<double>();
    double t = bezi.t_for_x(x);
    res.call<void>("push", t);
  }
  return res;
}

EMSCRIPTEN_BINDINGS(utils) {
  function("bezier_intersections_with_symmetry",
           &intersect_beziers_with_symmetry),
      function("closest_point", &closest_point),
      function("find_t_for_x", &find_t_for_x),
      function("build_faces", &test_stuff),
      function("build_faces_v2", &test_stuff_v2);
}