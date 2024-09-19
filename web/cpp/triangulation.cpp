#include "triangulation.h"
#include <igl/triangle/triangulate.h>
#include <iostream>

Eigen::Matrix<double, 2, 3>
find_plane(const Eigen::MatrixXd &V) {
  Eigen::MatrixXd centered = V;
  centered.rowwise() -= centered.colwise().mean();
  Eigen::Matrix3d C = centered.transpose() * centered;
  Eigen::SelfAdjointEigenSolver<Eigen::Matrix3d> eig(C);
  Eigen::Vector3d n = eig.eigenvectors().col(0);
  Eigen::Vector3d arbitrary =
      n.x() == 0 ? Eigen::Vector3d(1, 0, 0) : Eigen::Vector3d(0, 1, 0);
  Eigen::Vector3d a = n.cross(arbitrary).normalized();
  Eigen::Vector3d b = n.cross(a).normalized();

  Eigen::Matrix<double, 2, 3> res;
  res.row(0) = a;
  res.row(1) = b;

  return res;
}

std::tuple<Eigen::MatrixXd, Eigen::MatrixXi>
triangulate_polygon(const Eigen::MatrixXd &V) {
  auto centroid = V.colwise().mean();
  auto mat = find_plane(V);
Eigen::MatrixXd proj = (V.rowwise() - centroid) * mat.transpose();

  int size = V.rows();
  Eigen::MatrixXi E(size, 2);
  for (int i = 0; i < size; i++) {
    E(i, 0) = i;
    E(i, 1) = (i + 1) % size;
  }
  Eigen::MatrixXd H;
  Eigen::MatrixXd out_v;
  Eigen::MatrixXi out_f;
  igl::triangle::triangulate(proj, E, H, "a0.003qY", out_v, out_f);
  Eigen::MatrixXd out_v3d = out_v * mat;
  out_v3d.rowwise() += centroid;
  return std::make_tuple(out_v3d, out_f);
}