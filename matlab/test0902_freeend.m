%%
anchor =  [
    -0.3000   -0.6000;
    0.1000   -0.3000];

anchor_label = [1,2];


uc1 = UnitCurve( ...
    ControlledCurve(anchor, [], anchor_label), ...
    4, true, [-0.6,0]);


anchor =  [
    -0.6000   0;
    -0.3   -0.6];

anchor_label = [0,1];

uc2 = UnitCurve( ...
    ControlledCurve(anchor, [], anchor_label), ...
    4, true, [-0.6,0]);


figure(2); clf;
subplot(1,2,1)
uc1.plot(); hold on;
subplot(1,2,2)
uc2.plot();
%%
cs = CurveStructure('',2);
cs.add_unit_curve(uc1);
cs.add_unit_curve(uc2);
cs.prepare_control_points();

figure(3); clf;
cs.plot_curves(); axis off;


cs_new = cs;
cs_new.curves(4).constr_3d(2,:) = [-1,0];
pid = cs_new.curves(4).pid(2);
cs_new.controlPts(pid,3) = cs.controlPts(pid,3) - 0.25;
cs_new.curves(5).constr_3d(1,:) = [-1,0.4];

figure(4); clf;
cs_new.plot_curves(); axis off;
%%
cs.compute_normal_of_3D_curve
%% find the intersection among all replicas of the two unit curves
cc1 = uc1.all_controlledCurve(1);
cc2 = uc2.all_controlledCurve(8);

[t,s,flag1,flag2] = find_intersections_2d_bezier(cc1.fittedCurve, cc2.fittedCurve);
x = cc1.fittedCurve(t);


subplot(1,2,1)
uc1.plot(); hold on;
scatter(x(1), x(2),'filled')
uc2.plot();
scatter(cs.controlPts(:,1), cs.controlPts(:,2), 'filled')
subplot(1,2,2)
uc2.plot();
%%
res = find_intersection_unit_curves(uc2, uc2);
%%
cs = CurveStructure();
cs.add_unit_curve(uc1);
cs.add_unit_curve(uc2);
cs.prepare_control_points();

%%
clf;
cs.plot_curves()

%% add intersection points as control points
% obj.prepare_control_points()
uc_id = 1;
curve = cs.unit_curves(uc_id);
[bc_2d, bc_3d] = cs.reconstruct_one_unit_curve(uc_id);
pid = find(intersection_point(:,1) == uc_id);

[~, idx] = sort(intersection_point(pid, 2));
p_t = intersection_point(pid(idx), 2);
%%
% split the curve
[splited_curve_2d, t_range] = split_bezier_curve(bc_2d, p_t, false);
splited_curve_3d = split_bezier_curve(bc_3d, p_t, false);


