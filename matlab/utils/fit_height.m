function bezier_curves = fit_height( ...
  t_vals, ...
  start_height, ...
  end_height, ...
  start_tangent, ...
  end_tangent, ...
  ifplot)

  if nargin < 2 || isempty(start_height)
    start_height = 0;
  end
  if nargin < 3 || isempty(end_height)
    end_height = 2;
  end
  if nargin < 4 || isempty(start_tangent)
    tangent_len = abs(end_height - start_height) / 4;
    if end_height > start_height
      start_tangent = [0, 1] * tangent_len;
    else
      start_tangent = [0, -1] * tangent_len;
    end
  end
  if nargin < 5 || isempty(end_tangent)
    if mod(size(t_vals, 1), 2) == 0
      end_tangent = [1, 0];
    else
      tangent_len = abs(end_height - start_height) / 4;
      if end_height > start_height
        end_tangent = [0, 1] * tangent_len;
      else
        end_tangent = [0, -1] * tangent_len;
      end
    end
  end
  if nargin < 6
    ifplot = false;
  end

  if (length(t_vals) == 2)
    bezier_curves = zeros(1, 8);
    bezier_curves(1, 1:2) = [t_vals(1), start_height];
    bezier_curves(1, 3:4) = bezier_curves(1, 1:2) + start_tangent;

    bezier_curves(1, 7:8) = [t_vals(2), end_height];
    bezier_curves(1, 5:6) = bezier_curves(1, 7:8) - end_tangent;
    return;
  end
  if length(t_vals) ~= 3
    error('TODO: Fit more than 3 points');
  end
  bezier_curves = zeros(size(t_vals, 1) - 1, 8);
  % Hardcode for 3 control_points.
  bezier_curves(1, 1:2) = [t_vals(1), start_height];
  bezier_curves(1, 3:4) = bezier_curves(1, 1:2) + start_tangent;

  bezier_curves(2, 7:8) = [t_vals(3), end_height];
  bezier_curves(2, 5:6) = bezier_curves(2, 7:8) - end_tangent;

  vec = bezier_curves(2, 5:6) - bezier_curves(1, 3:4);
  inflection_pt = bezier_curves(1, 3:4) + vec * t_vals(2);
  bezier_curves(1, 7:8) = inflection_pt;
  bezier_curves(2, 1:2) = inflection_pt;
  % Zero second derivative at the inflection point.
  bezier_curves(1, 5:6) = (inflection_pt + bezier_curves(1, 3:4)) / 2;
  bezier_curves(2, 3:4) = (inflection_pt + bezier_curves(2, 5:6)) / 2;
  
  if ifplot
    t = linspace(0, 1, 100);
    pts = eval_cubic_bezier(t, bezier_curves(1, :));
    plot(pts(:, 1), pts(:, 2), 'b-', 'LineWidth', 2); hold on;
    pts = eval_cubic_bezier(t, bezier_curves(2, :));
    plot(pts(:, 1), pts(:, 2), 'b-', 'LineWidth', 2);
  end



end
