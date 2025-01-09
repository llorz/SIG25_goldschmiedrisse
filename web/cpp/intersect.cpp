#include "intersect.h"
#include "Bezier.h"
#include "conversions.h"

using namespace emscripten;

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

struct Line {
  Eigen::Vector2d p0, p1;
};

Eigen::Vector2d intersect_lines(const Line &la, const Line &lb) {
  Eigen::Matrix2d A;
  A << la.p1 - la.p0, lb.p0 - lb.p1;
  Eigen::Vector2d b = lb.p0 - la.p0;
  return A.inverse() * b;
}

inline Line js_to_line(emscripten::val js_line) {
  Line line;
  line.p0.x() = js_line[0]["x"].as<double>();
  line.p0.y() = js_line[0]["y"].as<double>();
  line.p1.x() = js_line[2]["x"].as<double>();
  line.p1.y() = js_line[2]["y"].as<double>();
  return line;
}

emscripten::val intersect_lines_with_symmetry(emscripten::val a,
                                              emscripten::val b, int symmetry,
                                              emscripten::val ref_symmetry) {
  Line line_a = js_to_line(a), line_b = js_to_line(b);
  Eigen::Vector2d ref_point(0, 0);
  std::string ref_type = ref_symmetry.typeOf().as<std::string>();
  if (ref_type == "object") {
    ref_point = js_to_point(ref_symmetry).normalized();
  }
  Eigen::Matrix2d ref_mat =
      2 * ref_point * ref_point.transpose() - Eigen::Matrix2d::Identity();

  emscripten::val res = val::global("Array").new_();
  auto fill_intersections = [&](const Line &other) {
    auto intersections = intersect_lines(line_a, other);
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