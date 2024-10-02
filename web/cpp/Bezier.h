#pragma once

#include "Polynomial.h"
#include <Eigen/Eigen>
#include <optional>
#include <vector>

struct Bezier {
  Eigen::Matrix<double, 4, 2> points;
  double min_t = 0.0, max_t = 1.0;
  std::optional<Polynomial> polynomial;

  inline double half_t() const { return (min_t + max_t) / 2.0; }

  Eigen::AlignedBox2d bbox(double threshold = 0) const;

  Eigen::Vector2d at(double t) const;
  Eigen::Vector2d tangent(double t) const;

  std::pair<Bezier, Bezier> subdivide();

  // Returns 't' and min_distance.
  std::pair<double, double> closest_point_t(const Eigen::Vector2d &point) const;

  Polynomial &get_polynomial();

  double t_for_x(double x) const;
};

struct SplitBezier {
  std::vector<Bezier> beziers;
  std::vector<double> ts;

  SplitBezier(const std::vector<Bezier> &beziers, const std::vector<double> &ts)
      : beziers(beziers), ts(ts) {}
  SplitBezier(const std::vector<Bezier> &beziers) : beziers(beziers) {
    ts.push_back(0.0);
    for (int i = 0; i < beziers.size(); i++) {
      ts.push_back(i + 1.0);
    }
  }
  SplitBezier(const Bezier &bezier) {
    beziers.push_back(bezier);
    ts.push_back(0.0);
    ts.push_back(1.0);
  }

  int size() const { return beziers.size(); }

  const Bezier &operator[](int i) const { return beziers[i]; }

  Eigen::Vector2d at(double t) const;
  Eigen::Vector2d tangent(double t) const;

  // Returns the local t (in [0, 1]) and the index of the Bezier.
  std::pair<double, int> global_t_to_local_t(double global_t) const;
  double local_t_to_global_t(double local_t, int i) const;
  double t_for_x(double x) const;
  Eigen::Vector2d x_to_point(double x) const;
};

struct MultiBezier {
  SplitBezier height_bezier;
  SplitBezier plane_bezier;
  int rotation_symmetry;
  Eigen::Vector2d ref_point = Eigen::Vector2d(0, 0);

  Eigen::Vector3d at(double t) const;
  Eigen::Vector3d
  tangent(double t,
          const Eigen::Matrix2d &mat = Eigen::Matrix2d::Identity()) const;

  double height_t_for_plane_bezier_t(double t) const;
};

std::vector<std::pair<double, double>> find_intersections(
    const Bezier &a, const Bezier &b, double param_threshold = 1e-4,
    double same_inter_threshold = 5e-2, double bbox_intersection_threshold = 0);
