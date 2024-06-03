function [updated_curves, b] = calculate_constrained_points(unit_curves)
updated_curves = [];
for i = 1 : length(unit_curves)
  intersections = calculate_intersections(unit_curves(i));
  intersections = sortrows(intersections, [1, 2]);
  anchors = unit_curves(i).unit_controlledCurve.anchor;
  [a, b] = merge_points(anchors, intersections);
  a

  new_curve = unit_curves(i);
  new_curve.unit_controlledCurve.anchor = a;
  t = linspace(0, 1, 100);
  new_curve.unit_controlledCurve.rasterizedCurve = line_segments_with_arc_length(a, b);
  % new_curve.plot();
  updated_curves = a;
end
end

function y = line_segments_with_arc_length(pts, bezier_coefs)
  num = size(pts, 1);
  t = linspace(0, 1, 100);
  y = [];
  for ii = 1:num - 1
      p1 = pts(1, :);
      p2 = pts(2 + 1,:);
      rast_pts = eval_cubic_bezier(t, bezier_coefs(ii, :));
      % plot(rast_pts(:, 1), rast_pts(:, 2), 'black', LineStyle='-', LineWidth=2); hold on;
      % s = mod(rast_pts(:, 1), 1);
      % s(end) = 1;
      s = rast_pts(:, 1);
      y = [y; (1-s)*p1 + s*p2, rast_pts(:, 2)];
  end
  plot3(y(:,1), y(:,2), y(:,3), 'black', LineStyle='-', LineWidth=2); hold on;
  end
  

function [new_anchors, bezier_coefs] = merge_points(anchor, intersections)
% Merge the points in the anchor and intersections.
j = 1;
new_anchors = anchor(1, :);
ts = [0];
for i = 2 : size(anchor, 1)
  while (j <= size(intersections, 1)) && (intersections(j, 1) == i - 1)
    % Add the new anchor point.
    new_anchors = [new_anchors; intersections(j, 3:4)];
    ts = [ts; intersections(j, 2)];
    j = j + 1;
  end
  
  new_anchors = [new_anchors; anchor(i, :)];
  ts = [ts; 1];
end

top_height = 1;
tanget_height = 0.2;
P0 = [0, 0];
P1 = [0, tanget_height];
Pend = [1, top_height];
Pendm1 = [1, top_height - tanget_height-0.2];
vec = Pendm1 - P1;
% P2 = P1 + vec / 4;
% P3 = P2 + vec / 4;
% P4 = P3 + vec / 4;
% bezier_coefs = [P0, P1, P2, P3; ...
% P3, P4, Pendm1, Pend];
P3 = vec * ts(2) + P1;
P2 = (P3 + P1) / 2;
P4 = (Pendm1 + P3) / 2;
bezier_coefs = [P0, P1, P2, P3; ...
P3, P4, Pendm1, Pend];

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