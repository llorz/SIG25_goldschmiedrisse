
#include "structure.h"
#include "Bezier.h"
#include "conversions.h"
#include "mc_flow.h"
#include "triangulation.h"
#include <igl/per_vertex_normals.h>

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
      std::cout << "Cur index: " << cur_index << ", next index: " << next_index
                << std::endl;
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
      std::cout << "t1: " << t1 << ", sym2: " << sym2
                << ", current sym : " << face.vertices.back().symmetry;
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
        std::cout << "(" << face.vertices[j].t << ", "
                  << face.vertices[j].symmetry << "), ";
      }
      std::cout << std::endl;
      graph.faces.emplace_back(std::move(face));
    } else {
      std::cout << "Skipping face" << std::endl;
    }
  }
  return graph;
}

bool get_direction(const MultiBezier &a, const MultiBezier &b, double hta,
                   double htb, const Eigen::Matrix2d &mat) {
  if (std::abs(hta) < 1e-2) {
    hta += 2e-2;
  } else if (std::fmod(hta, 1.0) < 1e-2) {
    hta -= 2e-2;
  }
  Eigen::Vector3d p = a.at(hta);
  p(1) = 0.0;
  // Find basis orthogonal to p.
  Eigen::Matrix<double, 2, 3> basis;
  basis.row(0) << 0, 1, 0;
  basis.row(1) = basis.row(0).cross(p).normalized();

  Eigen::Vector2d tan1 = basis * a.tangent(hta);
  Eigen::Vector2d tan2 = basis * b.tangent(htb, mat);
  return tan1.x() * tan2.y() - tan1.y() * tan2.x() > 0;
}

void add_intersections(const MultiBezier &a, const MultiBezier &b, int inda,
                       int indb, IntersectionsGraph &graph) {
  // Assume A and B have the same symmetry and A can simply be fixed.
  bool has_ref_symmetry = a.ref_point.norm() > 0;
  bool same_curve = &a == &b;
  auto ref_mat = get_ref_mat(a.ref_point);

  auto fill_intersections = [&](int ba, int bb, int rot_sym, bool ref_sym) {
    Eigen::Matrix2d rot_mat =
        Eigen::Rotation2D<double>(2.0 * rot_sym * M_PI / b.rotation_symmetry)
            .toRotationMatrix();

    // Rotate the points of the other bezier.
    Bezier bezi = b.plane_bezier[bb];
    Eigen::Matrix2d mat =
        (ref_sym ? (ref_mat.transpose() * rot_mat).eval() : rot_mat);
    bezi.points = bezi.points * mat;
    // Find intersection.
    auto intersections = find_intersections(a.plane_bezier[ba], bezi);
    for (auto [t1, t2] : intersections) {
      t1 += ba;
      t2 += bb;
      // Check whether they are real.
      double hta = a.height_bezier.t_for_x(t1),
             htb = b.height_bezier.t_for_x(t2);
      auto pa = a.height_bezier.at(hta), pb = b.height_bezier.at(htb);
      if (std::abs(pa.y() - pb.y()) > 1e-2)
        continue;

      // Fill the intersection.
      graph.intersections[inda].emplace_back(hta, inda, htb, indb,
                                             get_direction(a, b, hta, htb, mat),
                                             rot_sym, ref_sym);
      if (inda != indb) {
        // TODO: Add the other curve.
      }
    }
  };

  for (int i = 0; i < b.rotation_symmetry; i++) {

    for (int ba = 0; ba < a.plane_bezier.size(); ba++) {
      for (int bb = 0; bb < b.plane_bezier.size(); bb++) {
        if (!same_curve || i > 0)
          fill_intersections(ba, bb, i, false);
        if (has_ref_symmetry)
          fill_intersections(ba, bb, i, true);
      }
    }
  }
}

IntersectionsGraph
get_real_intersections(const std::vector<MultiBezier> &beziers) {
  IntersectionsGraph graph;
  graph.intersections.resize(beziers.size());
  for (int i = 0; i < beziers.size(); i++)
    for (int j = i; j < beziers.size(); j++)
      add_intersections(beziers[i], beziers[j], i, j, graph);
  for (int i = 0; i < graph.intersections.size(); i++) {
    std::sort(graph.intersections[i].begin(), graph.intersections[i].end(),
              [](const auto &a, const auto &b) { return a.t < b.t; });
    std::cout << "Intersections for " << i << ": ";
    for (auto &inter : graph.intersections[i]) {
      std::cout << "(" << inter.t << ", dir: " << inter.direction
                << ", rot: " << inter.other_rot_sym
                << ", ref: " << inter.other_ref_sym << "), ";
    }
    std::cout << std::endl;
  }
  return graph;
}

int get_new_rotation(int rotation, bool reflection,
                     const RealIntersection &inter, int sym) {
  if (reflection) {
    return (sym + rotation - inter.other_rot_sym) % sym;
  }
  return (rotation + inter.other_rot_sym) % sym;
}

int get_new_direction(int direction, bool reflection,
                      const RealIntersection &inter) {
  // Change direction if inter.dir is true.
  // reflection flips it (change if it's false).
  // TODO: refactor later after verifying it's correct.
  if (reflection) {
    if (inter.direction) {
      return direction;
    } else {
      return direction * -1;
    }
  }
  if (inter.direction) {
    return direction * -1;
  }
  return direction;
}

int get_intersection_index(const std::vector<RealIntersection> &intersections,
                           double t) {
  for (int i = 0; i < intersections.size(); i++) {
    if (std::abs(intersections[i].t - t) < 1e-2) {
      return i;
    }
  }
  return -1;
}

void trace_face(const IntersectionsGraph &graph, int curve, int start_index,
                int rot_sym, MultiGraphFaces &faces) {
  MultiFace face;
  face.vertices.emplace_back(graph.intersections[curve][start_index], 0, false);
  int cur_curve = curve, cur_index = start_index, rotation = 0, dir = 1;
  bool reflection = false;

  std::cout << "Tracing face: " << curve << ", " << start_index << std::endl;
  std::cout << "(curve: " << cur_curve << ", index: " << cur_index
            << ", rotation: " << rotation << ", dir: " << dir
            << ", reflection: " << reflection << ")" << std::endl;

  int iter = 0;
  while (cur_index >= 0 && cur_index < graph.intersections[curve].size() &&
         iter++ < 100) {
    cur_index += dir;
    if (cur_index < 0 || cur_index >= graph.intersections[cur_curve].size()) {
      // No face was found.
      std::cout << "No face found." << std::endl;
      break;
    }
    const auto &next_inter = graph.intersections[cur_curve][cur_index];
    // Update the rotation, direction and reflection.
    dir = get_new_direction(dir, reflection, next_inter);
    rotation = get_new_rotation(rotation, reflection, next_inter, rot_sym);
    reflection ^= next_inter.other_ref_sym;
    cur_curve = next_inter.other_curve_index;
    cur_index = get_intersection_index(graph.intersections[cur_curve],
                                       next_inter.other_t);
    std::cout << "(curve: " << cur_curve << ", index: " << cur_index
              << ", rotation: " << rotation << ", dir: " << dir
              << ", reflection: " << reflection << ")" << std::endl;
    face.vertices.emplace_back(graph.intersections[cur_curve][cur_index],
                               rotation, reflection);
    if (cur_curve == curve && cur_index == start_index && rotation == 0) {
      faces.faces.emplace_back(face);
      return;
    }
  }
}

MultiGraphFaces build_multi_graph(const std::vector<MultiBezier> &beziers,
                                  int rot_sym) {
  IntersectionsGraph inter_graph = get_real_intersections(beziers);
  MultiGraphFaces graph;
  for (int curve = 0; curve < inter_graph.intersections.size(); curve++) {
    for (int i = 0; i < inter_graph.intersections[curve].size() - 1; i++) {
      trace_face(inter_graph, curve, i, rot_sym, graph);
    }
  }
  graph.bezier = beziers;
  return graph;
}

Eigen::MatrixXd get_face_points(const MultiGraphFaces &graph, int i) {
  const auto &face = graph.faces[i];
  std::vector<Eigen::Vector3d> res;
  for (int i = 0; i < face.vertices.size() - 1; i++) {
    const auto &vi = face.vertices[i];
    const auto &vip1 = face.vertices[i + 1];
    double t1 = vi.intersection.t;
    double t2 = vip1.intersection.other_t;
    const auto &bezier = graph.bezier[vi.intersection.this_curve_index];
    int symmetry = bezier.rotation_symmetry;

    Eigen::Matrix2d rot_mat =
        Eigen::Rotation2D<double>(2.0 * vi.rotation * M_PI / symmetry)
            .toRotationMatrix();
    Eigen::Matrix2d ref_mat = vi.reflection ? get_ref_mat(bezier.ref_point)
                                            : Eigen::Matrix2d::Identity();
                                            
    Eigen::Matrix2d mat = rot_mat.transpose() * ref_mat;
    for (int j = 0; j < 10; j++) {
      double t = t1 + (t2 - t1) * j / 10.0;
      auto pt = bezier.at(t);
      Eigen::Vector2d flat_point(pt.x(), pt.z());
      Eigen::Vector2d rot = mat * flat_point;
      res.emplace_back(Eigen::Vector3d(rot.x(), pt.y(), rot.y()));
    }
  }
  return to_eig_mat(res);
}

std::tuple<Eigen::MatrixXd, Eigen::MatrixXi, Eigen::MatrixXd>
build_face(const MultiGraphFaces &graph, int i) {
  const auto &face = graph.faces[i];
  auto bla = get_face_points(graph, i);
  auto [V, F] = triangulate_polygon(bla);
  set_boundary_verts(bla, F, V);
  V = run_mc_iteration(V, F);
  V = run_mc_iteration(V, F);
  Eigen::MatrixXd N;
  igl::per_vertex_normals(V, F, N);
  return std::make_tuple(V, F, N);
}