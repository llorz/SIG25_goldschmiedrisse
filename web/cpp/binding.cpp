#include "Bezier.h"
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
  emscripten::val bla = a[0];
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

EMSCRIPTEN_BINDINGS(utils) {
  function("bezier_intersections", &intersect_beziers),
      function("bezier_intersections_with_symmetry",
               &intersect_beziers_with_symmetry);
}