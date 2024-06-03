function [t, s] = find_intersections_2d(p1, p2, p3, p4)
  % Solve p1 + t(p2 - p1) == p3 + s(p4 - p3).
  [t, s] = unpack([p1(:) - p2(:), p4(:) - p3(:)] \ (p1(:) - p3(:)));
end

function varargout = unpack(x)
  varargout = num2cell(x);
end
  