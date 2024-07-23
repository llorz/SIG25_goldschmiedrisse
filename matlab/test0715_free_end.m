clc; clear; clf;
addpath("utils/");
%%
anchor = [-0.3, -0.2;
    0.45, -0.5;
    0.5, -0.1];
anchor_label = [0,1,2];
uc1 = UnitCurve(ControlledCurve(anchor(1:2,:), [], anchor_label(1:2)), ...
    3, true, anchor(1,:));
uc2 = UnitCurve(ControlledCurve(anchor(2:3,:), [], anchor_label(2:3)), ...
    3, true, anchor(1,:));

cs = CurveStructure('tn-8');
cs.add_unit_curve(uc1);
% cs.add_unit_curve(uc2);


%%
p1 = [0,-0.6];
p2 = [-sqrt(3)/2, 0.5];
p3 = [-1.3,-1.2];

anchor = [p1; p3];
anchor_label = [0,1];
uc1 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
    3, true);

anchor = [p2; p3];
anchor_label = [0,1];
uc2 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
    3, true);


cs = CurveStructure('u.xi.18');
%     cs.add_unit_curve(uc1);
cs.add_unit_curve(uc2);
%%
anchor = [-1, 0;
    0.7,0.7];

anchor_label = [0,1];
anchor_constr = [0, 0.5; 0.5,0];
anchor_constr = [];
uc3 = UnitCurve(ControlledCurve(anchor, anchor_constr, anchor_label), ...
    4, true);
cs = CurveStructure('');
cs.add_unit_curve(uc3);

figure(11); clf;
cs.plot_curves();
legend off; axis off;

%%
params = load_parameters();


figure(7); clf;
for i = 1:length(cs.curves)
    curve = cs.curves(i);
    
    Pos3D = cs.controlPts(curve.pid, :);
    PosLabel = cs.controlPts_label(curve.pid);
    constr_2d = curve.constr_2d;
    constr_3d = curve.constr_3d;
    
   
    plot_curve_from_projections(Pos3D, constr_2d, constr_3d, ...
        params, true);

end

axis on; axis equal;
%%

figure(4); clf;
cs.plot_2D_projection;


figure(5);clf;
cs.plot_3D_structure();
%% estimate height with free end
ground_height = 0;
peak_height = norm(anchor(2,:) - anchor(1,:));

P = [anchor; uc.p_intersect];
label = [anchor_label(:); uc.p_label(:)];

P_new = [P, zeros(size(P,1),1)];

P_new(label == 0,3) = ground_height;
P_new(label == 1,3) = ground_height + peak_height;

a = 0.3*peak_height;

s = 0.5;

p_start = [0,0];
p_end = [s,s];
t_start = [0,a];
t_end = [-a, 0];

figure(6); clf;
[c1, c1_tangent] = fit_bezier_curve(p_start, p_end, t_start, t_end, true);
hold on;


p_start = [s,s];
p_end = [1,1];
t_start = [a,0];
t_end = [0, -a];

figure(6);
[c2, c2_tangent] = fit_bezier_curve(p_start, p_end, t_start, t_end, true);
