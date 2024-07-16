function [p_intersect, p_label] = find_intersections_controlled_curves(uc1, uc2)

p_intersect = []; % find all intersection points
p_label = [];
% label = 3; means they intersect at the same time
% label = 4; means they intersect at different time step

if norm(uc1.anchor-uc2.anchor) < 1e-12
    return % two curves are the same (maybe :)
else
    if isempty(uc1.anchor_constraints) % controlled curves are line segments
        num_pts = size(uc1.anchor,1); % can be more than two vertices
        for ii = 1:num_pts-1
            p1 = uc1.anchor(ii,:);
            p2 = uc1.anchor(ii+1,:);

            p3 = uc2.anchor(ii,:);
            p4 = uc2.anchor(ii+1,:);

            [t, ~, flag1, flag2] = find_intersections_2d(p1, p2, p3, p4);

            if flag2
                p_intersect(end+1,:) = p1 + t*(p2-p1);
                if flag1
                    p_label(end+1) = 3;
                else
                    p_label(end+1) = 4;
                end
            end
        end
    else % controlled curves are curved
        c1_func = uc1.fittedCurve;
        c2_func = uc2.fittedCurve;
        [t, s, flag1, flag2] = find_intersections_2d_bezier(c1_func, c2_func);

        if flag2
            p_intersect(end+1,:) = c1_func(t);
            if flag1
                p_label(end+1) = 3;
            else
                p_label(end+1) = 4;
            end
        end
    end
end



end