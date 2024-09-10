#include "Bezier.h"
#include "Polynomial.h"

const Polynomial p1 = POLY(1 - x).pow(3), p2 = POLY(3 * x) * POLY(1 - x).pow(2),
                 p3 = 3 * POLY(1 - x) * POLY(x).pow(2), p4 = POLY(x).pow(3);

Eigen::AlignedBox2d Bezier::bbox() const {
  return Eigen::AlignedBox2d(points.colwise().minCoeff(),
                             points.colwise().maxCoeff());
}

Eigen::VectorXd Bezier::at(double t) const {
  return Eigen::RowVector4d(std::pow(1 - t, 3), 3 * t * std::pow(1 - t, 2),
                            3 * std::pow(t, 2) * (1 - t), std::pow(t, 3)) *
         points;
}

std::pair<Bezier, Bezier> Bezier::subdivide() {
  Eigen::MatrixXd left(points.rows(), points.cols());
  auto E = ((points.row(0) + points.row(1)) / 2.0).eval();
  auto F = ((points.row(1) + points.row(2)) / 2.0).eval();
  auto G = ((points.row(2) + points.row(3)) / 2.0).eval();
  auto H = ((E + F) / 2).eval();
  auto J = ((F + G) / 2.0).eval();
  auto K = ((H + J) / 2.0).eval();
  left << points.row(0), E, H, K;

  Eigen::MatrixXd right(points.rows(), points.cols());
  right << K, J, G, points.row(3);

  return {Bezier(left, min_t, half_t()), Bezier(right, half_t(), max_t)};
}

std::vector<std::pair<double, double>>
find_intersections(const Bezier &a, const Bezier &b, double param_threshold) {
  std::vector<std::pair<double, double>> res;
  if (!a.bbox().intersects(b.bbox()))
    return res;
  std::stack<std::pair<Bezier, Bezier>> beziers;
  beziers.push({a, b});
  while (!beziers.empty()) {
    auto [left, right] = beziers.top();
    beziers.pop();
    if (left.max_t - left.min_t < param_threshold) {
      bool add_res = true;
      for (auto [lt, rt] : res) {
        if (std::abs(lt - left.min_t) < param_threshold ||
            std::abs(lt - left.max_t) < param_threshold ||
            std::abs(rt - right.min_t) < param_threshold ||
            std::abs(rt - right.max_t) < param_threshold) {
          add_res = false;
          break;
        }
      }
      if (add_res)
        res.push_back({left.min_t, right.min_t});
      continue;
    }

    auto [left_left, left_right] = left.subdivide();
    auto [right_left, right_right] = right.subdivide();
    if (left_left.bbox().intersects(right_left.bbox()))
      beziers.push({left_left, right_left});

    if (left_left.bbox().intersects(right_right.bbox()))
      beziers.push({left_left, right_right});

    if (left_right.bbox().intersects(right_left.bbox()))
      beziers.push({left_right, right_left});

    if (left_right.bbox().intersects(right_right.bbox()))
      beziers.push({left_right, right_right});
  }
  return res;
}

double Bezier::closest_point_t(const Eigen::Vector2d &point) const {
  // Build equation.
  Polynomial poly =
      p1 * points.row(0).transpose() + p2 * points.row(1).transpose() +
      p3 * points.row(2).transpose() + p4 * points.row(3).transpose();
  Polynomial eq = (poly - point).dot(poly.dx()); // == 0
  auto roots = eq.real_roots();

  // Check endpoints.
  double min_dist = (point - points.row(0).transpose()).norm(), min_t = 0.0;
  if ((point - points.row(3).transpose()).norm() < min_dist) {
    min_dist = (point - points.row(3).transpose()).norm();
    min_t = 1.0;
  }
  // Check each of the roots.
  for (int i = 0; i < roots.size(); i++) {
    double root = roots(i);
    if (root < 0.0 || root > 1.0)
      continue;
    double dist = (point - poly.at(root)).norm();
    if (dist < min_dist) {
      min_dist = dist;
      min_t = root;
    }
  }
  return min_t;
}