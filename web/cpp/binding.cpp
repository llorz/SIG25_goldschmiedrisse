#include "Bezier.h"
#include "conversions.h"
#include "triangulation.h"
#include <chrono>
#include "mc_flow.h"
#include <igl/per_vertex_normals.h>
#include <emscripten/bind.h>
#include <iostream>

using namespace emscripten;

Bezier js_to_bezier(emscripten::val js_bezier) {
  Bezier bezier;
  for (int i = 0; i < 4; i++) {
    bezier.points(i, 0) = js_bezier[i]["x"].as<double>();
    bezier.points(i, 1) = js_bezier[i]["z"].as<double>();
  }
  return bezier;
}

std::vector<Bezier> js_to_beziers(emscripten::val js_bezier) {
  std::vector<Bezier> res;
  int len = js_bezier["length"].as<unsigned>();
  for (int i = 0; i < len - 1; i += 3) {
    Bezier bezier;
    for (int j = 0; j < 4; j++) {
      bezier.points(j, 0) = js_bezier[i + j]["x"].as<double>();
      bezier.points(j, 1) = js_bezier[i + j]["y"].as<double>();
    }
    res.push_back(bezier);
  }
  return res;
}

template <typename T> std::vector<T> to_array(emscripten::val js_array) {
  std::vector<T> res;
  int len = js_array["length"].as<unsigned>();
  for (int i = 0; i < len; i++) {
    res.push_back(js_array[i].as<T>());
  }
  return res;
}

Eigen::Vector2d js_to_point(val js_point) {
  return Eigen::Vector2d(js_point["x"].as<double>(),
                         js_point["z"].as<double>());
}

Eigen::Matrix2d get_ref_mat(val ref_symmetry) {
  Eigen::Vector2d ref_point(0, 0);
  std::string ref_type = ref_symmetry.typeOf().as<std::string>();
  if (ref_type == "object") {
    ref_point = js_to_point(ref_symmetry).normalized();
  }
  if (ref_point.norm() == 0) {
    return Eigen::Matrix2d::Zero();
  }
  Eigen::Matrix2d ref_mat =
      2 * ref_point * ref_point.transpose() - Eigen::Matrix2d::Identity();
  return ref_mat;
}

struct SymIntersection {
  double t;
  int sum;

  bool operator<(const SymIntersection &o) const { return t < o.t; }
};

std::vector<SymIntersection> get_sym_intersections(val bezier, int symmetry,
                                                   val ref_symmetry) {
  Bezier bezi = js_to_bezier(bezier);
  auto ref_mat = get_ref_mat(ref_symmetry);
  bool has_ref_symmetry = ref_mat.norm() > 0;
  std::vector<SymIntersection> sym_inters;

  auto fill_intersections = [&](const Bezier &other, int sym) {
    auto intersections = find_intersections(bezi, other);
    for (auto [t1, t2] : intersections) {
      if (std::abs(t1 - t2) > 1e-2) {
        continue;
      }
      sym_inters.emplace_back(t1, sym);
    }
    if ((bezi.points.row(0) - other.points.row(0)).norm() < 1e-2)
      sym_inters.emplace_back(0, sym);
    if ((bezi.points.row(3) - other.points.row(3)).norm() < 1e-2)
      sym_inters.emplace_back(1, sym);
  };

  // Go over all the symmetries, find intersections.
  for (int i = 0; i < symmetry; i++) {
    Eigen::Matrix2d rot_mat =
        Eigen::Rotation2D<double>(2.0 * i * M_PI / symmetry).toRotationMatrix();
    Bezier bb(bezi.points * rot_mat);
    if (i > 0)
      fill_intersections(bb, i * 2);
    if (has_ref_symmetry) {
      Eigen::Matrix2d mat = ref_mat.transpose() * rot_mat;
      bb.points = bezi.points * mat;
      fill_intersections(bb, i * 2 + 1);
    }
  }

  std::sort(sym_inters.begin(), sym_inters.end());
  return sym_inters;
}

struct Face {
  struct Vertex {
    double t;
    int symmetry; // 2 * rot_sym + ref_sym. => rot_sym = symmetry / 2, ref_sym =
                  // symmetry % 2
  };
  std::vector<Vertex> vertices;
};
struct GraphFaces {
  std::vector<Face> faces;
  Bezier bezier;
};

GraphFaces build_graph(emscripten::val bezier, int symmetry, val ref_symmetry) {
  Bezier bezi = js_to_bezier(bezier);
  auto ref_mat = get_ref_mat(ref_symmetry);
  GraphFaces graph;
  graph.bezier = bezi;
  auto sym_inters = get_sym_intersections(bezier, symmetry, ref_symmetry);
  for (int i = 0; i < sym_inters.size() - 1; i++) {
    Face face;
    face.vertices.emplace_back(sym_inters[i].t, 0);
    int cur_index = i;
    int dir = 1;
    bool add_face = true;
    while (cur_index >= 0 && cur_index < sym_inters.size()) {
      int next_index = cur_index + dir;
      // std::cout << "Cur index: " << cur_index << ", next index: " <<
      // next_index << std::endl;
      if (next_index < 0 || next_index >= sym_inters.size()) {
        add_face = false;
        break;
      }

      int sym1 = face.vertices.back().symmetry;
      int rot1 = sym1 / 2;
      int ref1 = sym1 % 2;
      auto [t1, sym2] = sym_inters[next_index];
      int rot2 = sym2 / 2;
      int ref2 = sym2 % 2;
      if (ref1 == 1) {
        face.vertices.emplace_back(
            t1, ((rot1 - rot2 + symmetry) % symmetry) * 2 + (ref1 + ref2) % 2);
      } else {
        face.vertices.emplace_back(t1, ((rot1 + rot2) % symmetry) * 2 +
                                           (ref1 + ref2) % 2);
      }
      // std::cout << "t1: " << t1 << ", sym2: " << sym2 << ", current sym : "<<
      // face.vertices.back().symmetry << std::endl;
      if (ref1 % 2 == 0) {
        dir *= -1;
      }

      cur_index = next_index;
      if (cur_index == i && face.vertices.back().symmetry == 0) {
        break;
      }
    }
    if (add_face) {
      graph.faces.emplace_back(std::move(face));
    }
  }
  return graph;
}

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

Eigen::Vector3d get_point(double t, const std::vector<Bezier> &height_beziers,
                          const Bezier &flat_bezier,
                          const std::vector<double> &accum_len) {
  int seg_idx = 1;
  for (; seg_idx < accum_len.size() && t > accum_len[seg_idx]; seg_idx++)
    ;
  double seg_t = (t - accum_len[seg_idx - 1]) /
                 (accum_len[seg_idx] - accum_len[seg_idx - 1]);
  Eigen::Vector2d pt = height_beziers[seg_idx - 1].at(seg_t);
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

    for (int j = 0; j < 10; j++) {
      double t = t1 + (t2 - t1) * j / 10.0;
      auto pt = get_point(t, height_beziers, flat_bezier, accum_len);
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
    std::cout << "Face: " << std::endl;
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

val intersect_beziers(emscripten::val a, emscripten::val b) {
  emscripten::val bla = a[0];
  Bezier bezier_a = js_to_bezier(a), bezier_b = js_to_bezier(b);
  auto intersections = find_intersections(bezier_a, bezier_b);
  emscripten::val res = val::global("Array").new_();
  for (auto [t1, t2] : intersections) {
    val t12 = val::global("Array").new_();
    t12.call<void>("push", t1);
    t12.call<void>("push", t2);
    res.call<void>("push", t12);
  }
  return res;
}

val intersect_beziers_with_symmetry(emscripten::val a, emscripten::val b,
                                    int symmetry, val ref_symmetry) {
  Bezier bezier_a = js_to_bezier(a), bezier_b = js_to_bezier(b);
  // Extract reflection point.
  Eigen::Vector2d ref_point(0, 0);
  std::string ref_type = ref_symmetry.typeOf().as<std::string>();
  if (ref_type == "object") {
    ref_point = js_to_point(ref_symmetry).normalized();
  }
  Eigen::Matrix2d ref_mat =
      2 * ref_point * ref_point.transpose() - Eigen::Matrix2d::Identity();

  emscripten::val res = val::global("Array").new_();
  auto fill_intersections = [&](const Bezier &other) {
    auto intersections = find_intersections(bezier_a, other);
    for (auto [t1, t2] : intersections) {
      val t12 = val::global("Array").new_();
      t12.call<void>("push", t1);
      t12.call<void>("push", t2);
      res.call<void>("push", t12);
    }
  };

  for (int i = 0; i < symmetry; i++) {
    Eigen::Matrix2d rot_mat =
        Eigen::Rotation2D<double>(2.0 * i * M_PI / symmetry).toRotationMatrix();
    if (i == 0 && (bezier_a.points - bezier_b.points).norm() < 1e-4)
      continue;
    Bezier bb(bezier_b.points * rot_mat);
    fill_intersections(bb);
    if (ref_point.norm() > 1e-6) {
      Eigen::Matrix2d mat = ref_mat.transpose() * rot_mat;
      bb.points = bezier_b.points * mat;
      fill_intersections(bb);
    }
  }
  return res;
}

emscripten::val closest_point(emscripten::val bezier, emscripten::val point,
                              int symmetry, val ref_symmetry) {
  Bezier bezi = js_to_bezier(bezier);
  Eigen::Vector2d p = js_to_point(point);
  double closest_point_t = bezi.closest_point_t(p);
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
    double t = curve.closest_point_t(p);
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
  function("bezier_intersections", &intersect_beziers),
      function("bezier_intersections_with_symmetry",
               &intersect_beziers_with_symmetry),
      function("closest_point", &closest_point),
      function("find_t_for_x", &find_t_for_x),
      function("build_faces", &test_stuff);
}