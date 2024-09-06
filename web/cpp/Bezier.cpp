#include "Bezier.h"

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