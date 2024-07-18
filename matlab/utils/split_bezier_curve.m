function [split1_cont, split2_cont] = split_bezier_curve(bz_ori, t_split, ifplot)

if nargin < 3, ifplot = false; end

p_start = bz_ori(1,:);
p_end = bz_ori(2,:);
t_start = bz_ori(3,:);
t_end = bz_ori(4,:);



% Compute control points based on tangents
c1 = p_start + t_start;
c2 = p_end + t_end;

% Compute the intermediate points
A = (1 - t_split) * p_start + t_split * c1;
B = (1 - t_split) * c1 + t_split * c2;
C = (1 - t_split) * c2 + t_split * p_end;
D = (1 - t_split) * A + t_split * B;
E = (1 - t_split) * B + t_split * C;
% This is the point on the curve at t_split
p_split = (1 - t_split) * D + t_split * E;

% points + tanget for the first split
split1_cont = [p_start; p_split; A - p_start; D - p_split];
split2_cont = [p_split; p_end; E - p_split; C - p_end];

if ifplot
    bc_ori = fit_bezier_curve(p_start, p_end, t_start, t_end);
    bc_split1 = fit_bezier_curve(p_start,  p_split, A - p_start, D - p_split, false);
    bc_split2 = fit_bezier_curve(p_split, p_end, E - p_split, C - p_end, false);

    t_values = linspace(0, 1, 100);
    curve_points = arrayfun(bc_ori, t_values, 'UniformOutput', false);
    curve_points = cell2mat(curve_points');

    curve_points1 = arrayfun(bc_split1, t_values,'UniformOutput',false);
    curve_points1 = cell2mat(curve_points1');

    curve_points2 = arrayfun(bc_split2, t_values,'UniformOutput',false);
    curve_points2 = cell2mat(curve_points2');



    figure(11); clf;
    plot(curve_points(:, 1), curve_points(:, 2), 'k', 'LineWidth', 10); hold on;
    plot(curve_points1(:, 1), curve_points1(:, 2), 'g-', 'LineWidth', 2);hold on;
    plot(curve_points2(:, 1), curve_points2(:, 2), 'r-', 'LineWidth', 2);
    legend('original', 'split1', 'split2')
end

end