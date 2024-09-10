#pragma once

#include <Eigen/Eigen>
#include <iostream>
#include <complex>
#include <type_traits>

#define POLY(poly)                                                             \
  [] {                                                                         \
    Polynomial x(1, 0), x2(1, 0, 0), x3(1, 0, 0, 0);                    \
    return poly;                                                               \
  }()

template <typename T> Eigen::MatrixXd gather_coefs(const T &t) {
  if constexpr (std::is_same_v<T, double> || std::is_same_v<T, int>) {
    Eigen::MatrixXd res(1, 1);
    res(0) = t;
    return res;
  } else {
    return t;
  }
}

template <typename T, typename... Args>
Eigen::MatrixXd gather_coefs(const T &t, Args... args) {
  Eigen::MatrixXd res = gather_coefs(args...);
  res.conservativeResize(res.rows(), res.cols() + 1);
  res(res.cols() - 1) = t;
  return res;
}

struct Polynomial {

  Polynomial() {}
  template <typename... Args> Polynomial(Args... args) {
    coefs = gather_coefs(args...);
  }

  Polynomial dot(const Polynomial &other);
  Polynomial pow(int n);

  Eigen::VectorXd at(double t);
  std::complex<double> at(std::complex<double> t);

  Eigen::VectorXcd roots();
  Eigen::VectorXd real_roots();

  Polynomial dx();

  // Each col is a point coefficient for some power.
  // The first col is x^0.
  Eigen::MatrixXd coefs = Eigen::MatrixXd::Zero(1, 1);
};
std::ostream &operator<<(std::ostream &s, const Polynomial &p);
Polynomial operator*(const Polynomial &p1, const Polynomial &p2);
// Polynomial operator*(const Polynomial &p1, const Eigen::VectorXd &p2);
Polynomial operator+(const Polynomial &p1, const Polynomial &p2);
Polynomial operator-(const Polynomial &p1, const Polynomial &p2);
Polynomial pow(const Polynomial &p, int n);
