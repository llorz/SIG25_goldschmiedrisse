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
%% find the intersection among all replicas of the two unit curves
cc1 = uc1.all_controlledCurve(1);
cc2 = uc2.all_controlledCurve(8);

[t,s,flag1,flag2] = find_intersections_2d_bezier(cc1.fittedCurve, cc2.fittedCurve);
x = cc1.fittedCurve(t);


subplot(1,2,1)
uc1.plot(); hold on;
scatter(x(1), x(2),'filled')
uc2.plot();
scatter(obj.controlPts(:,1), obj.controlPts(:,2), 'filled')
subplot(1,2,2)
uc2.plot();
%%
res = find_intersection_unit_curves(uc2, uc2);
%%
obj = CurveStructure();
obj.add_unit_curve(uc1);
obj.add_unit_curve(uc2);
[intersection_info, intersection_point] = obj.find_intersections();
obj.prepare_control_points()
%% add intersection points as control points
% obj.prepare_control_points()
uc_id = 1;

[bc_2d, bc_3d] = obj.reconstruct_one_unit_curve(uc_id);

% % original curve
% curve = obj.unit_curves(uc_id);
% pid1 = knnsearch(obj.controlPts(:,1:2), curve.unit_controlledCurve.anchor(1,:));
% pid2 = knnsearch(obj.controlPts(:,1:2), curve.unit_controlledCurve.anchor(2,:));
% constr_2d = curve.unit_controlledCurve.anchor_constraints;
% constr_3d = obj.height/2*obj.initialize_constr_3d_seg( ...
%     [obj.controlPts_label(pid1); obj.controlPts_label(pid2)]);
% 
% % floor projection curve: 2D pos + constraints
% bc_2d = [obj.controlPts([pid1, pid2],1:2); constr_2d];
% % side projection curve: [curve-length param, height] + constraints
% tmp = [[0;1], obj.controlPts([pid1, pid2], 3)];
% bc_3d = [tmp; constr_3d];


% find the intersection
pid = find(intersection_point(:,1) == uc_id);
[~, idx] = sort(intersection_point(pid, 2));
p_t = intersection_point(pid(idx), 2);
p_label = intersection_point(pid(idx), 3);


% find 3D positions of the intersecting points
c2d_ori = cell2mat( ...
    arrayfun(fit_bezier_curve(bc_2d), ...
    p_t', 'UniformOutput', false)' ...
    );
c3d_ori = cell2mat( ...
    arrayfun(fit_bezier_curve(bc_3d), ...
    p_t', 'UniformOutput', false)' ...
    );
p_pos = [c2d_ori, c3d_ori(:,2)];

% add to control points
obj.controlPts = [obj.controlPts; p_pos];
% a bit dumb here
obj.controlPts_label = [obj.controlPts_label; 4 - p_label]; 

%%
% split the curve
[splited_curve_2d, t_range] = split_bezier_curve(bc_2d, p_t, false);
splited_curve_3d = split_bezier_curve(bc_3d, p_t, false);