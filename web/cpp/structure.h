#pragma once

#include <emscripten/bind.h>
#include "Bezier.h"

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

GraphFaces build_graph(emscripten::val bezier, int symmetry, emscripten::val ref_symmetry);