#include "Bezier.h"
#include <chrono>
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

Eigen::Vector2d js_to_point(val js_point) {
  return Eigen::Vector2d(js_point["x"].as<double>(),
                         js_point["z"].as<double>());
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
                                    int symmetry,
                                    val ref_symmetry) {
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
      function("find_t_for_x", &find_t_for_x);
}