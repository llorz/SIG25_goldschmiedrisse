function [p_intersect, p_label] = find_intersections_controlled_curves(cc1, cc2, eps)

if nargin < 3, eps = 1e-9; end

p_intersect = []; % find all intersection points
p_label = [];
% label = 3; means they intersect at the same time
% label = 4; means they intersect at different time step

if norm(cc1.anchor-cc2.anchor) < eps
    return % two curves are the same (maybe :)
else
    if isempty(cc1.anchor_constraints) % controlled curves are line segments
        num_pts = size(cc1.anchor,1); % can be more than two vertices
        for ii = 1:num_pts-1
            p1 = cc1.anchor(ii,:);
            p2 = cc1.anchor(ii+1,:);

            p3 = cc2.anchor(ii,:);
            p4 = cc2.anchor(ii+1,:);

            [t, s, flag1, flag2] = find_intersections_2d(p1, p2, p3, p4, eps);

            if flag2
                p_intersect(end+1,:) = t;
                if flag1
                    p_label(end+1) = 3;
                else
                    p_label(end+1) = 4;
                end
            end
        end
    else % controlled curves are curved
        c1_func = cc1.fittedCurve;
        c2_func = cc2.fittedCurve;
        [t, s, flag1, flag2] = find_intersections_2d_bezier(c1_func, c2_func, eps);

        if flag2
            p_intersect(end+1,:) = t;
            if flag1
                p_label(end+1) = 3;
            else
                p_label(end+1) = 4;
            end
        end
    end
end



end