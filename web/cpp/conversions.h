#pragma once

#include "Bezier.h"
#include <emscripten/bind.h>

#include <Eigen/Eigen>
using namespace emscripten;


template <typename T> std::vector<T> to_array(emscripten::val js_array) {
  std::vector<T> res;
  int len = js_array["length"].as<unsigned>();
  for (int i = 0; i < len; i++) {
    res.push_back(js_array[i].as<T>());
  }
  return res;
} 

template <typename EigType>
Eigen::MatrixXd to_eig_mat(const std::vector<EigType> &vec) {
  Eigen::MatrixXd res(vec.size(), vec[0].size());
  for (int i = 0; i < vec.size(); i++) {
    res.row(i) = vec[i];
  }
  return res;
}

inline emscripten::val eig_to_js_array(const Eigen::MatrixXd &mat) {
  const Eigen::MatrixXd &matt = mat.transpose();
  val view{typed_memory_view(matt.size(), matt.data())};
  auto result = val::global("Float32Array").new_(matt.size());
  result.call<void>("set", view);
  return result;
}
inline emscripten::val eig_to_js_array(const Eigen::MatrixXi &mat) {
  const Eigen::MatrixXi &matt = mat.transpose();
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
      if (js_bezier[i + j]["isVector2"].as<bool>())
        bezier.points(j, 1) = js_bezier[i + j]["y"].as<double>();
      else
        bezier.points(j, 1) = js_bezier[i + j]["z"].as<double>();
    }
    res.push_back(bezier);
  }
  return res;
}

inline Eigen::Vector2d js_to_point(val js_point) {
  return Eigen::Vector2d(js_point["x"].as<double>(),
                         js_point["z"].as<double>());
}

inline Eigen::Vector2d get_ref_point(val ref_symmetry) {
  Eigen::Vector2d ref_point(0, 0);
  std::string ref_type = ref_symmetry.typeOf().as<std::string>();
  if (ref_type == "object") {
    ref_point = js_to_point(ref_symmetry).normalized();
  }
  return ref_point;
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

inline Eigen::Matrix2d get_ref_mat(const Eigen::Vector2d &ref_point) {
  Eigen::Matrix2d ref_mat =
      2 * ref_point * ref_point.transpose() - Eigen::Matrix2d::Identity();
  return ref_mat;
}

inline MultiBezier js_to_multibezier(emscripten::val recon_curve) {
  auto ref_point = get_ref_point(recon_curve["ref_symmetry_point"]);
  int symmetry = recon_curve["rotation_symmetry"].as<int>();
  auto js_bezy = recon_curve["recon_bezy_curve"];

  auto bz = js_to_beziers(js_bezy["height_points"]);
  auto flat_bz = js_to_beziers(js_bezy["points"]);
  auto accum_len = to_array<double>(js_bezy["accumulated_seg_lengths"]);
  return MultiBezier(SplitBezier(bz, accum_len), SplitBezier(flat_bz), symmetry,
                     ref_point);
}

inline std::vector<MultiBezier>
js_to_multibeziers(emscripten::val recon_curves) {
  int len = recon_curves["length"].as<unsigned>();
  std::vector<MultiBezier> res;
  for (int i = 0; i < len; i++) {
    auto bezi = js_to_multibezier(recon_curves[i]);
    auto ref_point = bezi.ref_point;
    bezi.ref_point.setZero();
    res.push_back(bezi);
    if (ref_point.norm() > 0) {
      auto ref_mat = get_ref_mat(ref_point);
      for (auto& bez : bezi.plane_bezier.beziers) {
        bez.points = (bez.points * ref_mat.transpose()).eval();
      }
      res.push_back(bezi);
    }
  }
  return res;
}