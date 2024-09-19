#pragma once

#include <emscripten/bind.h>

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