#include "mc_flow.h"
#include <igl/boundary_loop.h>
#include <igl/cotmatrix.h>
#include <igl/massmatrix.h>
#include <igl/slice.h>

std::vector<int> get_boundary_verts(const Eigen::MatrixXi &F) {
  std::vector<int> L;
  igl::boundary_loop(F, L);
  return L;
}

std::vector<int> get_unknowns(const Eigen::MatrixXd &V,
                              const std::vector<int> &boundary_verts) {
  std::set<int> boundary_set(boundary_verts.begin(), boundary_verts.end());
  std::vector<int> unknowns;
  for (int i = 0; i < V.rows(); i++) {
    if (!boundary_set.count(i)) {
      unknowns.push_back(i);
    }
  }
  return unknowns;
}

Eigen::MatrixXd run_mc_iteration(const Eigen::MatrixXd &V,
                                 const Eigen::MatrixXi &F,
                                 const std::vector<int> &fixed, int n_iter) {
  Eigen::SparseMatrix<double> L, M;
  igl::cotmatrix(V, F, L);
  igl::massmatrix(V, F, igl::MASSMATRIX_TYPE_VORONOI, M);

  // Solve (I - tM^{-1} * L) x_{n+1} = x_n
  // (M - t L)x_{n+1} = M x_n

  Eigen::SparseMatrix<double> A = M - 0.1 * L;

  auto boundary_verts = get_boundary_verts(F);
  std::cout << "boundary verts size: " << boundary_verts.size() << std::endl;
  std::vector<int> constrain_all_bdry_inidces;
  if (fixed.size() == 0 || fixed.size() == boundary_verts.size()) {
    constrain_all_bdry_inidces = std::vector<int>{0, 1, 2};
  } else {
    constrain_all_bdry_inidces = std::vector<int>{1};
  }

  Eigen::MatrixXd res = V;
  {
    Eigen::VectorXi eig_known(boundary_verts.size());
    int index = 0;
    for (auto &b : boundary_verts) {
      eig_known(index++) = b;
    }
    auto unknowns = get_unknowns(V, boundary_verts);
    Eigen::VectorXi eig_unknown =
        Eigen::Map<Eigen::VectorXi>(unknowns.data(), unknowns.size());

    Eigen::SparseMatrix<double> A_unknown, A_known;
    igl::slice(A, eig_unknown, eig_unknown, A_unknown);
    igl::slice(A, eig_unknown, eig_known, A_known);

    Eigen::MatrixXd Mv = M * V;
    Eigen::SimplicialLDLT<Eigen::SparseMatrix<double>> solver(A_unknown);
    Eigen::MatrixXd sol =
        solver.solve(Mv(eig_unknown, constrain_all_bdry_inidces) -
                     A_known * V(eig_known, constrain_all_bdry_inidces));

    res(eig_unknown, constrain_all_bdry_inidces) = sol;
  }
  // Allow x & z move freely.
  if (constrain_all_bdry_inidces.size() < 3) {
    Eigen::VectorXi eig_known(fixed.size());
    int index = 0;
    for (auto &b : fixed) {
      eig_known(index++) = b;
    }
    auto unknowns = get_unknowns(V, fixed);
    Eigen::VectorXi eig_unknown =
        Eigen::Map<Eigen::VectorXi>(unknowns.data(), unknowns.size());

    Eigen::SparseMatrix<double> A_unknown, A_known;
    igl::slice(A, eig_unknown, eig_unknown, A_unknown);
    igl::slice(A, eig_unknown, eig_known, A_known);

    Eigen::MatrixXd Mv = M * V;
    Eigen::SimplicialLDLT<Eigen::SparseMatrix<double>> solver(A_unknown);
    Eigen::MatrixXd sol =
        solver.solve(Mv(eig_unknown, std::vector<int>{0, 2}) -
                     A_known * V(eig_known, std::vector<int>{0, 2}));

    res(eig_unknown, std::vector<int>{0, 2}) = sol;
  }

  return res;
}

void set_boundary_verts(const Eigen::MatrixXd &poly, const Eigen::MatrixXi &F,
                        Eigen::MatrixXd &V) {
  // std::vector<int> boundary_verts = get_boundary_verts(F);
  V(Eigen::seq(0, poly.rows() - 1), Eigen::all) = poly;
}