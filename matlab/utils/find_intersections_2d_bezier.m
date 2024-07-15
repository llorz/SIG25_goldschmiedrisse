function [t,s,flag1, flag2] = find_intersections_2d_bezier(c1_func, c2_func, eps)
if nargin < 3, eps = 1e-6/norm(c1_func(0)- c1_func(1)); end

[t0, s0, ~, tmp_flag2] = find_intersections_2d( ...
    c1_func(0), c1_func(1), ...
    c2_func(0), c2_func(1), eps);

if tmp_flag2 % two curves intersect with each other

    func = @(x) sum((c1_func(x(1)) - c2_func(x(2))).^2);


    %     x = fmincon(func, [t0; s0], [], [], [], [], [0; 0], [1; 1]);

    x = fminunc(func, [t0; s0]);

    t = x(1);
    s = x(2);

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

else
    % two line segments (connecting the control points) do not intersect
    % the curves themselves do not intersect as well.
    t = NaN;
    s = NaN;
    flag1 = 0;
    flag2 = 0;
end


end