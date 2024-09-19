#pragma  once
#include <Eigen/Eigen>

Eigen::MatrixXd run_mc_iteration(const Eigen::MatrixXd &V, const Eigen::MatrixXi &F, int n_iter = 1);

void set_boundary_verts(const Eigen::MatrixXd& poly, const Eigen::MatrixXi &F, Eigen::MatrixXd& V);