#include "Polynomial.h"

static int output_poly_dim(const Polynomial &p1, const Polynomial &p2) {
  if (p1.coefs.rows() == p2.coefs.rows() && p1.coefs.rows() > 1) {
    return 1;
  }
  return std::max(p1.coefs.rows(), p2.coefs.rows());
}

Polynomial operator*(const Polynomial &p1, const Polynomial &p2) {
  Polynomial res;
  res.coefs = Eigen::MatrixXd::Zero(output_poly_dim(p1, p2),
                              p1.coefs.cols() + p2.coefs.cols() - 1);
  for (int i = 0; i < p1.coefs.cols(); i++) {
    for (int j = 0; j < p2.coefs.cols(); j++) {
      if (p1.coefs.rows() == p2.coefs.rows()) {
        res.coefs.col(i + j) += p1.coefs.col(i).transpose() * p2.coefs.col(j);
      } else if (p1.coefs.rows() == 1) {
        res.coefs.col(i + j) += p2.coefs.col(j) * p1.coefs(i);
      } else if (p2.coefs.rows() == 1) {
        res.coefs.col(i + j) += p1.coefs.col(i) * p2.coefs(j);
      }
    }
  }
  return res;
}

Polynomial Polynomial::dot(const Polynomial &p2) {
  Polynomial res;
  res.coefs = (Eigen::MatrixXd::Zero(1, coefs.cols() + p2.coefs.cols() - 1));
  for (int i = 0; i < coefs.cols(); i++)
    for (int j = 0; j < p2.coefs.cols(); j++)
      res.coefs(i + j) += coefs.col(i).transpose() * p2.coefs.col(j);
  return res;
}

Polynomial operator+(const Polynomial &p1, const Polynomial &p2) {
  Polynomial res;
  res.coefs = Eigen::MatrixXd::Zero(std::max(p1.coefs.rows(), p2.coefs.rows()),
                                    std::max(p1.coefs.cols(), p2.coefs.cols()));
  res.coefs.block(0, 0, p1.coefs.rows(), p1.coefs.cols()) = p1.coefs;
  res.coefs.block(0, 0, p2.coefs.rows(), p2.coefs.cols()) += p2.coefs;
  return res;
}
Polynomial operator-(const Polynomial &p1, const Polynomial &p2) {
  Polynomial res;
  res.coefs = Eigen::MatrixXd::Zero(std::max(p1.coefs.rows(), p2.coefs.rows()),
                                    std::max(p1.coefs.cols(), p2.coefs.cols()));
  res.coefs.block(0, 0, p1.coefs.rows(), p1.coefs.cols()) = p1.coefs;
  res.coefs.block(0, 0, p2.coefs.rows(), p2.coefs.cols()) -= p2.coefs;
  return res;
}

Polynomial operator*(const Polynomial &p1, const Eigen::VectorXd &p2) {
  Polynomial res;
  res.coefs = Eigen::MatrixXd(p2.size(), p1.coefs.cols());
  for (int i = 0; i < p1.coefs.cols(); i++) {
    res.coefs.col(i) = p2 * p1.coefs.col(i);
  }
  return res;
}
Polynomial pow(const Polynomial &p, int n) {
  if (n == 0)
    return Polynomial(1);
  if (n == 1)
    return p;
  Polynomial res = p;
  for (int i = 1; i < n; i++) {
    res = res * p;
  }
  return res;
}

std::ostream &operator<<(std::ostream &s, const Polynomial &p) {
  for (int i = p.coefs.cols() - 1; i >= 0; i--) {
    if (p.coefs.rows() > 1) {
      s << "(";
      for (int j = 0; j < p.coefs.rows(); j++) {
        s << p.coefs(j, i) << " ";
      }
      s << ")";
    } else {
      if (i == p.coefs.cols() - 1 && abs(p.coefs(0, i) + 1) < 1e-6)
        s << "-";
      else if (i == 0 || abs(abs(p.coefs(0, i)) - 1) > 1e-6)
        s << ((i == p.coefs.cols() - 1) ? p.coefs(0, i)
                                        : std::abs(p.coefs(0, i)));
    }
    if (i >= 1)
      s << "x";
    if (i >= 2)
      s << "^" << i;
    if (i > 0) {
      if (p.coefs.rows() > 1 || p.coefs(0, i - 1) > 0)
        s << " + ";
      else
        s << " - ";
    }
  }
  return s;
}

Eigen::VectorXd Polynomial::at(double t) {
  Eigen::VectorXd res = Eigen::VectorXd::Zero(coefs.rows());
  double pow = 1;
  for (int i = 0; i < coefs.cols(); i++, pow *= t) {
    res += coefs.col(i) * pow;
  }
  return res;
}

std::complex<double> Polynomial::at(std::complex<double> t) {
  std::complex<double> res = 0;
  std::complex<double> pow = 1;
  for (int i = 0; i < coefs.cols(); i++, pow *= t) {
    res += coefs(i) * pow;
  }
  return res;
}

Eigen::VectorXcd Polynomial::roots() {
  Eigen::VectorXcd res(coefs.cols() - 1);
  Eigen::VectorXd roots_error =
      Eigen::VectorXd::Constant(coefs.cols() - 1, 1000);
  res(0) = std::complex<double>(0.1, 0.2);
  for (int i = 1; i < res.size(); i++)
    res(i) = res(i - 1) * std::complex<double>(0, 2 * M_PI / res.size());
  int current_root = 0;
  int i = 0;
  for (; i < 1000 && roots_error.maxCoeff() > 1e-6; i++) {
    auto val = at(res(current_root)) / coefs(coefs.cols() - 1);
    roots_error(current_root) = std::abs(val);
    std::complex<double> denom(1, 0);
    for (int j = 0; j < res.size(); j++)
      if (j != current_root)
        denom *= res(current_root) - res(j);

    res(current_root) -= val / denom;

    current_root = (current_root + 1) % res.size();
  }
  return res;
}

Polynomial Polynomial::pow(int n) {
  if (n == 0)
    return Polynomial(1);
  if (n == 1)
    return *this;
  Polynomial res = *this;
  for (int i = 1; i < n; i++) {
    res = res * *this;
  }
  return res;
}

Polynomial Polynomial::dx() {
  Polynomial res;
  res.coefs = Eigen::MatrixXd::Zero(coefs.rows(), coefs.cols() - 1);
  for (int i = 0; i < coefs.cols() - 1; i++) {
    res.coefs.col(i) = coefs.col(i + 1) * (i + 1);
  }
  return res;
}

Eigen::VectorXd Polynomial::real_roots() {
  std::vector<double> real_roots;
  auto all_roots = roots();
  for (int i = 0; i < all_roots.size(); i++) {
    if (abs(all_roots(i).imag()) < 1e-6)
      real_roots.push_back(all_roots(i).real());
  }
  return Eigen::Map<Eigen::VectorXd>(real_roots.data(), real_roots.size());
}