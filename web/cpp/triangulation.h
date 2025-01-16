#pragma once
#include <Eigen/Eigen>
#include <tuple>

Eigen::Matrix<double, 2, 3>
find_plane(const Eigen::MatrixXd &V);

std::tuple<Eigen::MatrixXd, Eigen::MatrixXi, Eigen::MatrixXd>
triangulate_polygon(const Eigen::MatrixXd &V);