function [bezier_curve, bezier_tangent] = fit_bezier_curve( ...
    p_start, ... % position of the starting point
    p_end, ... % position of the end point
    t_start, ... % tangent vector at p_start
    t_end, ... % tangent vector at p_end
    ifplot) % plot the curve for debugging

if nargin < 3 || isempty(t_start)
    t_start = [0,0.5];
end

if nargin < 4 || isempty(t_end)
    t_end = [-0.5,0];
end

if nargin < 5
    ifplot = false;
end

c1 = p_start + t_start;
c2 = p_end + t_end;

% Define the Bézier curve function
bezier_curve = @(t) ((1-t).^3 .* p_start' + 3*(1-t).^2 .* t .* c1' + 3*(1-t) .* t.^2 .* c2' + t.^3 .* p_end')';

% Define the derivative of the Bézier curve function
bezier_tangent = @(t) ( ...
    3 * (1-t).^2 .* (c1' - p_start') + ...
    6 * (1-t) .* t .* (c2' - c1') + ...
    3 * t.^2 .* (p_end' - c2') ...
);

if ifplot
    % Evaluate the Bézier curve
    t = linspace(0, 1, 100);
    curve_points = bezier_curve(t);
    hold on;
    plot(curve_points(:, 1), curve_points(:,2), 'b-', 'LineWidth', 2); % Bézier curve
    plot([p_start(1), c1(1), c2(1), p_end(1)], [p_start(2), c1(2), c2(2), p_end(2)], 'ro-'); % Control points
    quiver(p_start(1), p_start(2), t_start(1), t_start(2), 0.1, 'r', 'LineWidth', 1.5); % Tangent at P0
    quiver(p_end(1), p_end(2), t_end(1), t_end(2), 0.1, 'r', 'LineWidth', 1.5); % Tangent at P3
    legend('Bézier Curve', 'Control Points', 'Location', 'Best');
    title('Cubic Bézier Curve with Tangency Constraints');
    xlabel('x');
    ylabel('y');
    axis equal;
    grid on;
end

end