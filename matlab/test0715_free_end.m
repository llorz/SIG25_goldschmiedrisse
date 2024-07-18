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
anchor = [0.8, 0;
    0, 0.6];
anchor_label = [0,1];
anchor_constr = [0, 0.5; 0.5,0];
% anchor_constr = [];
uc3 = UnitCurve(ControlledCurve(anchor, anchor_constr, anchor_label), ...
    4, true);
cs = CurveStructure('');
cs.add_unit_curve(uc3);

plane_height = 1;
project_offset = 0.1;
col_curve = [0,0,0];
col_plane = [162,210,255]/255;
col_point = [239,35,60]/255;
alpha_plane = 0.2;
size_line = 2;
size_point = 50;
num_samples = 100;



figure(7); clf;
for i = 1:length(cs.curves)
    curve = cs.curves(i);
    uc_2d = ControlledCurve(cs.controlPts(curve.pid,1:2), ...
        curve.constr_2d,...
        cs.controlPts_label(curve.pid));
    uc_height = ControlledCurve([[0;1], cs.controlPts(curve.pid, 3)], ...
        curve.constr_3d,...
        cs.controlPts_label(curve.pid));

    t = linspace(0,1,num_samples);
    x = uc_2d.fittedCurve(t);
    y = uc_height.fittedCurve(t);
    p = [x, y(:,2)];

    % plot the 3D curve (rasterized)
    plot3(p(:,1), p(:,2), p(:,3),'Color',col_curve, 'LineWidth',size_line); axis equal; hold on

    % plot the 2D projection (rasterized);
    plot3(p(:,1), p(:,2), -project_offset*ones(num_samples,1), 'Color', col_curve, 'LineStyle','--', 'LineWidth', size_line);

    % plot the curve plane
    x1 = [x, zeros(size(x,1),1)];
    x2 = [x, plane_height*ones(size(x,1),1)];
    for jj = 1:size(x1,1) - 1
        rect = [x1(jj:jj+1,:);
            x2(jj+1:-1:jj,:)];
        fill3(rect(:,1), rect(:,2), rect(:,3),col_plane, 'FaceAlpha', alpha_plane,'EdgeColor','none');  hold on;
    end

    % plot the control points
    cp = [p(1,:); p(end,:)];
    scatter3(cp(:,1), cp(:,2), cp(:,3),size_point, col_point,'filled');

    % plot the constraint
    

    
end

axis on;
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
