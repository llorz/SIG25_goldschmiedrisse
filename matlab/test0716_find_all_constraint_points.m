clc; clear; clf;
addpath("utils/");

%% test 1
anchor = [-0.3, -0.2;
    0.45, -0.5;
    0.5, -0.1];
anchor_label = [0,1,2];
anchor_constraints = [];

rotational_symmetry = 3;
reflectional_symmetry = true;
reflection_point = 1;
unit_controlledCurve = ControlledCurve(anchor, anchor_constraints, anchor_label);


uc = UnitCurve(unit_controlledCurve , ...
    rotational_symmetry, reflection_point, reflectional_symmetry);
%% test 2
p1 = [-0.5, 0];
p2 = [0, -0.6];
p3 = [0, 0.3];

anchor = [p1; p2] ;
anchor_label = [0,1];
anchor_constraints = [0, -0.05; -0.05, 0];
uc = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
    3, true,2);

%% find all replicas
% all_controlledCurve = uc.all_controlledCurve;
% uc1 = uc.unit_controlledCurve;
% p_intersect = []; p_label = [];
% 
% for ii = 1:length(all_controlledCurve)
%     uc2 = all_controlledCurve(ii);
%     [tmp_p_intersect, tmp_p_label] = find_intersections_controlled_curves(uc1, uc2);
%     p_intersect = [p_intersect; tmp_p_intersect];
%     p_label = [p_label(:); tmp_p_label(:)];
% end
% % get all intersections with its replicas
% 
% 
cs = CurveStructure();
cs.add_unit_curve(uc);


figure(4); clf;
cs.plot_2D_projection;

%%
figure(5);clf;
cs.plot_3D_structure();