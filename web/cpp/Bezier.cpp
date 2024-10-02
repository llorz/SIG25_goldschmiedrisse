#include "Bezier.h"
#include "Polynomial.h"
#include <optional>

const Polynomial p1 = POLY(1 - x).pow(3), p2 = POLY(3 * x) * POLY(1 - x).pow(2),
                 p3 = 3 * POLY(1 - x) * POLY(x).pow(2), p4 = POLY(x).pow(3);

Eigen::AlignedBox2d Bezier::bbox(double threshold) const {
  return Eigen::AlignedBox2d(points.colwise().minCoeff().array() - threshold,
                             points.colwise().maxCoeff().array() + threshold);
}

Eigen::Vector2d Bezier::at(double t) const {
  return Eigen::RowVector4d(std::pow(1 - t, 3), 3 * t * std::pow(1 - t, 2),
                            3 * std::pow(t, 2) * (1 - t), std::pow(t, 3)) *
         points;
}

Eigen::Vector2d Bezier::tangent(double t) const {
  double omt = 1 - t;
  return Eigen::RowVector4d(-3 * omt * omt, 3 * omt * omt - 6 * t * omt,
                            6 * t * omt - 3 * t * t, 3 * std::pow(t, 2)) *
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

bool interval_contain(double p, const Bezier &a, double threshold) {
  return p >= a.min_t - threshold && p <= a.max_t + threshold;
}

bool intervals_contain(const std::vector<std::pair<double, double>> &res,
                       const Bezier &a, const Bezier &b, double threshold) {
  for (auto &p : res) {
    if (interval_contain(p.first, a, threshold) ||
        interval_contain(p.second, b, threshold)) {
      return true;
    }
  }
  return false;
}

void check_endpoints_for_intersection(
    const Bezier &a, const Bezier &b,
    std::vector<std::pair<double, double>> &res) {
  auto inter = b.closest_point_t(a.points.row(0));
  if (inter.second < 1e-2) {
    res.push_back({0, inter.first});
  }
  inter = b.closest_point_t(a.points.row(3));
  if (inter.second < 1e-2) {
    res.push_back({1, inter.first});
  }
  // TODO: Check for endpoints of b.
}

std::vector<std::pair<double, double>>
find_intersections(const Bezier &a, const Bezier &b, double param_threshold,
                   double same_inter_threshold,
                   double bbox_intersection_threshold) {
  std::vector<std::pair<double, double>> res;
  check_endpoints_for_intersection(a, b, res);

  std::stack<std::pair<Bezier, Bezier>> beziers;
  beziers.push({a, b});
  while (!beziers.empty()) {
    auto [left, right] = beziers.top();
    beziers.pop();
    if (left.max_t - left.min_t < param_threshold) {
      // if (left.bbox().diagonal().norm() < bbox_intersection_threshold) {
      // TODO: add back?
      // if (std::abs(left.min_t - 1) < 1e-1 && std::abs(right.min_t - 1) < 1e-1
      // ||
      //     std::abs(left.min_t) < 1e-1 && std::abs(right.min_t) < 1e-1)
      //   continue;
      bool add_res = !intervals_contain(res, left, right, same_inter_threshold);
      // for (auto [lt, rt] : res) {
      // if (std::abs(lt - left.min_t) < same_inter_threshold ||
      //     std::abs(lt - left.max_t) < same_inter_threshold ||
      //     std::abs(rt - right.min_t) < same_inter_threshold ||
      //     std::abs(rt - right.max_t) < same_inter_threshold ||
      // Make the following checks only if it's the same curve?
      // (std::abs(lt - right.min_t) < same_inter_threshold) ||
      // (std::abs(lt - right.max_t) < same_inter_threshold)) {
      // for (auto r : res) {
      //   if (interval_intersect(r, left, same_inter_threshold) ||
      //       interval_intersect(r, right, same_inter_threshold)) {
      //     add_res = false;
      //     break;
      //   }
      // }
      if (add_res)
        res.push_back({left.min_t, right.min_t});
      continue;
    }

    auto [left_left, left_right] = left.subdivide();
    auto [right_left, right_right] = right.subdivide();
    if (left_left.bbox(bbox_intersection_threshold)
            .intersects(right_left.bbox(bbox_intersection_threshold)) &&
        !intervals_contain(res, left_left, right_left, same_inter_threshold)) {
      beziers.push({left_left, right_left});
    }

    if (left_left.bbox(bbox_intersection_threshold)
            .intersects(right_right.bbox(bbox_intersection_threshold)) &&
        !intervals_contain(res, left_left, right_right, same_inter_threshold))
      beziers.push({left_left, right_right});

    if (left_right.bbox(bbox_intersection_threshold)
            .intersects(right_left.bbox(bbox_intersection_threshold)) &&
        !intervals_contain(res, left_right, right_left, same_inter_threshold))
      beziers.push({left_right, right_left});

    if (left_right.bbox(bbox_intersection_threshold)
            .intersects(right_right.bbox(bbox_intersection_threshold)) &&
        !intervals_contain(res, left_right, right_right, same_inter_threshold))
      beziers.push({left_right, right_right});
  }
  return res;
}

std::pair<double, double>
Bezier::closest_point_t(const Eigen::Vector2d &point) const {
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
  return {min_t, min_dist};
}

Polynomial &Bezier::get_polynomial() {
  if (!polynomial.has_value()) {
    polynomial = std::optional<Polynomial>(
        p1 * points.row(0).transpose() + p2 * points.row(1).transpose() +
        p3 * points.row(2).transpose() + p4 * points.row(3).transpose());
  }
  return polynomial.value();
}

double Bezier::t_for_x(double x) const {
  // Check whether x is at the endpoints.
  if (std::abs(x - points(0, 0)) < 1e-3) {
    return 0.0;
  } else if (std::abs(x - points(3, 0)) < 1e-3) {
    return 1.0;
  }
  // Otherwise solve the inverse equation (P(t) = x).
  Polynomial poly = p1 * points(0, 0) + p2 * points(1, 0) + p3 * points(2, 0) +
                    p4 * points(3, 0);
  auto eq = poly - x;
  auto roots = eq.real_roots();
  for (auto root : roots) {
    if (root < 0 || root > 1)
      continue;
    return root;
  }
  return -1.0;
}

Eigen::Vector2d SplitBezier::at(double t) const {
  int seg_idx = 1;
  for (; seg_idx < ts.size() && t > ts[seg_idx]; seg_idx++)
    ;
  double seg_t = (t - ts[seg_idx - 1]) / (ts[seg_idx] - ts[seg_idx - 1]);
  return beziers[seg_idx - 1].at(seg_t);
}

Eigen::Vector2d SplitBezier::tangent(double t) const {
  int seg_idx = 1;
  for (; seg_idx < ts.size() && t > ts[seg_idx]; seg_idx++)
    ;
  double seg_t = (t - ts[seg_idx - 1]) / (ts[seg_idx] - ts[seg_idx - 1]);
  return beziers[seg_idx - 1].tangent(seg_t);
}

std::pair<double, int> SplitBezier::global_t_to_local_t(double t) const {
  int seg_idx = 1;
  // Assuming t is in ts range.
  for (; seg_idx < ts.size() && t > ts[seg_idx]; seg_idx++)
    ;
  double seg_t = (t - ts[seg_idx - 1]) / (ts[seg_idx] - ts[seg_idx - 1]);
  return {seg_t, seg_idx - 1};
}

double SplitBezier::local_t_to_global_t(double local_t, int i) const {
  return local_t * (ts[i + 1] - ts[i]) + ts[i];
}

double SplitBezier::t_for_x(double x) const {
  for (int i = 0; i < beziers.size(); i++) {
    double t = beziers[i].t_for_x(x);
    if (t >= 0.0 && t <= 1.0)
      return local_t_to_global_t(t, i);
  }
  return -1.0;
}

Eigen::Vector2d SplitBezier::x_to_point(double x) const {
  for (int i = 0; i < beziers.size(); i++) {
    double t = beziers[i].t_for_x(x);
    if (t >= 0.0 && t <= 1.0)
      return beziers[i].at(t);
  }
  return Eigen::Vector2d(0, 0);
}

Eigen::Vector3d MultiBezier::at(double t) const {
  Eigen::Vector2d p = height_bezier.at(t);
  Eigen::Vector2d p2 = plane_bezier.at(p.x());
  return Eigen::Vector3d(p2.x(), p.y(), p2.y());
}

Eigen::Vector3d MultiBezier::tangent(double t,
                                     const Eigen::Matrix2d &mat) const {
  Eigen::Vector2d p = height_bezier.at(t);
  Eigen::Vector2d tan1 = height_bezier.tangent(t);
  Eigen::Vector2d tan2 = mat.transpose() * plane_bezier.tangent(p.x());
  return Eigen::Vector3d(tan2.x() * tan1.x(), tan1.y(), tan2.y() * tan1.x());
}

double MultiBezier::height_t_for_plane_bezier_t(double t) const {
  return height_bezier.t_for_x(t);
}