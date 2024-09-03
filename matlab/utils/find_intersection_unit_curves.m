function res = find_intersection_unit_curves(uc1, uc2)
cc1 = uc1.all_controlledCurve(1);

res = [];
for ii = 1:length(uc2.all_controlledCurve)
    cc2 = uc2.all_controlledCurve(ii);

    [t,s,flag1,flag2] = find_intersections_2d_bezier(cc1.fittedCurve, cc2.fittedCurve);

    if flag2 % intersect
        res(end+1, :) = [t, s, flag1];
    end
end
end
