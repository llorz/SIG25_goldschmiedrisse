
#include "structure.h"
#include "conversions.h"
#include "Bezier.h"

struct SymIntersection {
  double t;
  int sum;

  bool operator<(const SymIntersection &o) const { return t < o.t; }
};

std::vector<SymIntersection> get_sym_intersections(val bezier, int symmetry,
                                                   val ref_symmetry) {
  Bezier bezi = js_to_bezier(bezier);
  auto ref_mat = get_ref_mat(ref_symmetry);
  bool has_ref_symmetry = ref_mat.norm() > 0;
  std::vector<SymIntersection> sym_inters;

  auto fill_intersections = [&](const Bezier &other, int sym) {
    auto intersections = find_intersections(bezi, other);
    for (auto [t1, t2] : intersections) {
      if (std::abs(t1 - t2) > 1e-2) {
        continue;
      }
      sym_inters.emplace_back(t1, sym);
    }
    if ((bezi.points.row(0) - other.points.row(0)).norm() < 1e-2)
      sym_inters.emplace_back(0, sym);
    if ((bezi.points.row(3) - other.points.row(3)).norm() < 1e-2)
      sym_inters.emplace_back(1, sym);
  };

  // Go over all the symmetries, find intersections.
  for (int i = 0; i < symmetry; i++) {
    Eigen::Matrix2d rot_mat =
        Eigen::Rotation2D<double>(2.0 * i * M_PI / symmetry).toRotationMatrix();
    Bezier bb(bezi.points * rot_mat);
    if (i > 0)
      fill_intersections(bb, i * 2);
    if (has_ref_symmetry) {
      Eigen::Matrix2d mat = ref_mat.transpose() * rot_mat;
      bb.points = bezi.points * mat;
      fill_intersections(bb, i * 2 + 1);
    }
  }

  std::sort(sym_inters.begin(), sym_inters.end());
  return sym_inters;
}

GraphFaces build_graph(emscripten::val bezier, int symmetry, val ref_symmetry) {
  Bezier bezi = js_to_bezier(bezier);
  auto ref_mat = get_ref_mat(ref_symmetry);
  GraphFaces graph;
  graph.bezier = bezi;
  auto sym_inters = get_sym_intersections(bezier, symmetry, ref_symmetry);
  for (int i = 0; i < sym_inters.size() - 1; i++) {
    Face face;
    face.vertices.emplace_back(sym_inters[i].t, 0);
    int cur_index = i;
    int dir = 1;
    bool add_face = true;
    while (cur_index >= 0 && cur_index < sym_inters.size()) {
      int next_index = cur_index + dir;
      std::cout << "Cur index: " << cur_index << ", next index: " <<
      next_index << std::endl;
      if (next_index < 0 || next_index >= sym_inters.size()) {
        add_face = false;
        break;
      }

      int sym1 = face.vertices.back().symmetry;
      int rot1 = sym1 / 2;
      int ref1 = sym1 % 2;
      auto [t1, sym2] = sym_inters[next_index];
      int rot2 = sym2 / 2;
      int ref2 = sym2 % 2;
      if (ref1 == 1) {
        face.vertices.emplace_back(
            t1, ((rot1 - rot2 + symmetry) % symmetry) * 2 + (ref1 + ref2) % 2);
      } else {
        face.vertices.emplace_back(t1, ((rot1 + rot2) % symmetry) * 2 +
                                           (ref1 + ref2) % 2);
      }
      std::cout << "t1: " << t1 << ", sym2: " << sym2 << ", current sym : "<<
      face.vertices.back().symmetry;
      if (ref1 % 2 == 0) {
        dir *= -1;
      }
      std::cout << ", next dir: " << dir << std::endl;

      cur_index = next_index;
      if (cur_index == i && face.vertices.back().symmetry == 0) {
        break;
      }
    }
    if (add_face) {
      std::cout << "Adding face: ";
      for (int j = 0; j < face.vertices.size() - 1; j++) {
        std::cout << "(" << face.vertices[j].t << ", " << face.vertices[j].symmetry << "), ";
      }
      std::cout << std::endl;
      graph.faces.emplace_back(std::move(face));
    } else {
      std::cout << "Skipping face" << std::endl;
    }
  }
  return graph;
}