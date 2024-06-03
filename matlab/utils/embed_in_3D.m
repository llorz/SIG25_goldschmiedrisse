function updated_curves = embed_in_3D(unit_curves)
updated_curves = [];
for i = 1 : length(unit_curves)
  intersections = calculate_intersections(unit_curves(i));
  intersections = sortrows(intersections, [1, 2]);
  [a, b] = calc_beziers(unit_curves(i), intersections);
  updated_curves = [updated_curves, @() rasterize_3d_curve(unit_curves(i).unit_controlledCurve.anchor, a, b)];
end
end

function y = rasterize_3d_curve(pts, indices, bezier_coefs)
  num = size(pts, 1);
  t = linspace(0, 1, 100);
  y = [];
  for ii = 1 : size(indices, 1)
      p1 = pts(indices(ii, 1), :);
      p2 = pts(indices(ii, 2), :);
      rast_pts = eval_cubic_bezier(t, bezier_coefs(ii, :));
      s = rast_pts(:, 1);
      y = [y; (1-s)*p1 + s*p2, rast_pts(:, 2)];
  end
end
  

function [indices, bezier_coefs] = calc_beziers(curve, intersections)
  ind = 1;
  n_anchors = size(curve.unit_controlledCurve.anchor, 1);
  bezier_coefs = [];
  indices = [];
  for i = 2 : n_anchors
    ts = [0];
    while (ind <= size(intersections, 1)) && (intersections(ind, 1) == i - 1)
      ts = [ts; intersections(ind, 2)];
      ind = ind + 1;
    end
    ts = [ts; 1];
    bezier_coefs = [bezier_coefs; fit_height(ts, curve.unit_controlledCurve.anchor_label(i-1), ...
      curve.unit_controlledCurve.anchor_label(i))];
    indices = [indices; repmat([i-1, i], [size(ts, 1) - 1, 1])];
  end
end


function res = calculate_repeat_intersections(curve, mat)
% Check whether there's an intersection between pts
% and mat * pts.
res = [];
for i = 1 : size(curve.unit_controlledCurve.anchor, 1) - 1
  p1 = curve.unit_controlledCurve.anchor(i, :)';
  p2 = curve.unit_controlledCurve.anchor(i + 1, :)';
  p1_new = mat * p1;
  p2_new = mat * p2;
  % Check if the line segments intersect (at the same time).
  t = (p2_new - p2) ./ (p1 - p2 - p1_new + p2_new);
  if (norm(t(1) - t(2)) < 1e-6) && (t(1) >= 0) && (t(1) <= 1) && norm(t(1)) > 1e-6 && norm(t(1)-1) > 1e-6
    res = [res; i, t(1), p1' + t(1) * (p2' - p1')];
  end
end
end

function res = calculate_intersections(curve)
res = [];
ref_mat = curve.get_reflection_mat();
rot_mat = curve.get_rotation_mat(1);
for i = 1 : curve.rotational_symmetry
  mat = rot_mat^i;
  res = [res; calculate_repeat_intersections(curve, mat)];
  if curve.reflection_symmetry
    mat = mat * ref_mat;
    res = [res; calculate_repeat_intersections(curve, mat)];
  end
end
end