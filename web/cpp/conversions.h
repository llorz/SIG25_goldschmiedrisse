#pragma once

#include <emscripten/bind.h>
#include "Bezier.h"

#include <Eigen/Eigen>
using namespace emscripten;

inline emscripten::val eig_to_js_array(const Eigen::MatrixXd& mat) {
  const Eigen::MatrixXd& matt = mat.transpose();
  val view{typed_memory_view(matt.size(), matt.data())};
  auto result = val::global("Float32Array").new_(matt.size());
  result.call<void>("set", view);
  return result;
}
inline emscripten::val eig_to_js_array(const Eigen::MatrixXi& mat) {
  const Eigen::MatrixXi& matt = mat.transpose();
  val view{typed_memory_view(matt.size(), matt.data())};
  auto result = val::global("Int32Array").new_(matt.size());
  result.call<void>("set", view);
  return result;
}

inline Bezier js_to_bezier(emscripten::val js_bezier) {
  Bezier bezier;
  for (int i = 0; i < 4; i++) {
    bezier.points(i, 0) = js_bezier[i]["x"].as<double>();
    bezier.points(i, 1) = js_bezier[i]["z"].as<double>();
  }
  return bezier;
}

inline std::vector<Bezier> js_to_beziers(emscripten::val js_bezier) {
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


inline Eigen::Vector2d js_to_point(val js_point) {
  return Eigen::Vector2d(js_point["x"].as<double>(),
                         js_point["z"].as<double>());
}

inline Eigen::Matrix2d get_ref_mat(val ref_symmetry) {
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