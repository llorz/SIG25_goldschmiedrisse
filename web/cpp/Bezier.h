#pragma once

#include <Eigen/Eigen>
#include <vector>

struct Bezier {
  Eigen::Matrix<double, 4, 2> points;
  double min_t = 0.0, max_t = 1.0;
  inline double half_t() const { return (min_t + max_t) / 2.0; }

  Eigen::AlignedBox2d bbox() const;

  Eigen::VectorXd at(double t) const;

  std::pair<Bezier, Bezier> subdivide();
};

std::vector<std::pair<double, double>>
find_intersections(const Bezier &a, const Bezier &b,
                   double param_threshold = 1e-2);