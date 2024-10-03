#pragma once

#include "Bezier.h"
#include <emscripten/bind.h>

struct Face {
  struct Vertex {
    double t;
    int symmetry; // 2 * rot_sym + ref_sym. => rot_sym = symmetry / 2, ref_sym =
                  // symmetry % 2
  };
  std::vector<Vertex> vertices;
};
struct GraphFaces {
  std::vector<Face> faces;
  Bezier bezier;
};

GraphFaces build_graph(emscripten::val bezier, int symmetry,
                       emscripten::val ref_symmetry);

/**
 * @brief Represents an intersection of 'this_curve_index' with
 * 'other_curve_index' at ('t', 'other_t').
 */
struct RealIntersection {
  double t;
  int this_curve_index;
  // Jump to 'other_curve_index' at 'other_t'.
  double other_t;
  int other_curve_index;
  // Continue going up or down (from 'other_t').
  bool direction;
  // The rotation symmetry of the other curve.
  int other_rot_sym;
  // The reflection symmetry of the other curve.
  bool other_ref_sym;
  bool this_ref_sym;

  bool operator<(const RealIntersection &o) const { return t < o.t; }
};

struct IntersectionsGraph {
  std::vector<std::vector<RealIntersection>> intersections;
};

IntersectionsGraph
get_real_intersections(const std::vector<MultiBezier> &beziers);

struct MultiFace {
  struct Vertex {
    RealIntersection intersection;
    int rotation;
    bool reflection;
  };
  struct Edge {
    int curve;
    int index;
    int dir;
    bool operator<(const Edge &o) const {
      return curve < o.curve || (curve == o.curve && index < o.index) ||
             (curve == o.curve && index == o.index && dir < o.dir);
    }
  };
  std::vector<Vertex> vertices;
};

struct MultiGraphFaces {
  std::vector<MultiFace> faces;
  std::vector<MultiBezier> bezier;
};

MultiGraphFaces build_multi_graph(const std::vector<MultiBezier> &beziers,
                                  int rot_sym);

std::tuple<Eigen::MatrixXd, Eigen::MatrixXi, Eigen::MatrixXd>
build_face(const MultiGraphFaces &graph, int i);