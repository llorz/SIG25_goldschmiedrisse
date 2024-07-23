function splited_curve = split_bezier_curve(bz_ori, in_t_split, ifplot)

if nargin < 3, ifplot = false; end

if ~isequal(in_t_split, sort(in_t_split))
    error('Error: the t_spilt is not sorted');
end


num_t = length(in_t_split);

splited_curve = cell(num_t+1, 1);

for ii = 1:num_t
    if ii == 1
        bz_split2 = bz_ori;
        t_prev = 0;
        len = 1;
    else
        t_prev = in_t_split(ii-1);
        len = 1 - t_prev;
    end
    t_split = (in_t_split(ii) - t_prev)/len;
    [bz_split1, bz_split2] = split_curve_into_two(bz_split2, t_split);

    splited_curve{ii} = bz_split1;
end
% add the last segment
splited_curve{num_t+1} = bz_split2;


if ifplot

    t_values = linspace(0, 1, 100);

    curve_points = cell2mat( ...
        arrayfun(fit_bezier_curve(bz_ori), ...
        t_values, 'UniformOutput', false)' ...
        );

    plot(curve_points(:, 1), curve_points(:, 2), 'k', 'LineWidth', 10); hold on;

    for ii = 1:length(splited_curve)
        curve_points = cell2mat( ...
            arrayfun(fit_bezier_curve(splited_curve{ii}), ...
            t_values, 'UniformOutput', false)' ...
            );
        plot(curve_points(:, 1), curve_points(:, 2), 'LineWidth', 2); hold on;
    end
end


end


function [bz_split1, bz_split2] = split_curve_into_two(bz_ori, t_split)
p_start = bz_ori(1,:);
p_end = bz_ori(2,:);
if size(bz_ori,1) == 4

    t_start = bz_ori(3,:);
    t_end = bz_ori(4,:);
else
    t_start = [0,0];
    t_end = [0,0];
end

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

bz_split1 = [p_start; p_split; A - p_start; D - p_split];
bz_split2 = [p_split; p_end; E - p_split; C - p_end];

end