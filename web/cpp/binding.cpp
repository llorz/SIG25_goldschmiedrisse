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
                                    int symmetry) {
  Bezier bezier_a = js_to_bezier(a), bezier_b = js_to_bezier(b);
  emscripten::val res = val::global("Array").new_();
  for (int i = 0; i < symmetry; i++) {
    if (i == 0 && (bezier_a.points - bezier_b.points).norm() < 1e-4)
      continue;
    Eigen::Rotation2D<double> rot(2.0 * i * M_PI / symmetry);
    Bezier bb = bezier_b;
    bb.points = bezier_b.points * rot.toRotationMatrix();
    auto intersections = find_intersections(bezier_a, bb);
    for (auto [t1, t2] : intersections) {
      val t12 = val::global("Array").new_();
      t12.call<void>("push", t1);
      t12.call<void>("push", t2);
      res.call<void>("push", t12);
    }
  }
  return res;
}

emscripten::val closest_point(emscripten::val bezier, emscripten::val point, int symmetry) {
  Bezier bezi = js_to_bezier(bezier);
  Eigen::Vector2d p = js_to_point(point);
  double min_dist = 1000.0;
  Eigen::Vector2d sym_cp;
  for (int i = 1; i < symmetry; i++) {
    Eigen::Rotation2D<double> rot(2.0 * i * M_PI / symmetry);
    Bezier bb = bezi;
    bb.points = bezi.points * rot.toRotationMatrix();
    double t = bb.closest_point_t(p);
    Eigen::Vector2d cp = bb.at(t);
    double dist = (cp - p).norm();
    if (dist < min_dist) {
      min_dist = dist;
      sym_cp = cp;
    }
  }
  val res = val::global("Array").new_();
  res.call<void>("push", sym_cp.x());
  res.call<void>("push", sym_cp.y());
  return res;
}

EMSCRIPTEN_BINDINGS(utils) {
  function("bezier_intersections", &intersect_beziers),
      function("bezier_intersections_with_symmetry",
               &intersect_beziers_with_symmetry),
      function("closest_point", &closest_point);
}