function [t, s, flag1, flag2] = find_intersections_2d(p1, p2, p3, p4, eps)

if nargin < 5, eps = 1e-8/norm(p2-p1); end

  % Solve p1 + t(p2 - p1) == p3 + s(p4 - p3).
  [t, s] = unpack([p1(:) - p2(:), p4(:) - p3(:)] \ (p1(:) - p3(:)));

  if t > 0 && t < 1 && s > 0 && s < 1
      flag2 = 1; % if two line segments intersect
      if norm(s-t) < eps
          flag1 = 1;  % intersect at the same time
      else
          flag1 = 0; 
      end
  else
      flag2 = 0; % two line segments do not intersect
      flag1 = 0;
  end

end

function varargout = unpack(x)
  varargout = num2cell(x);
end
  