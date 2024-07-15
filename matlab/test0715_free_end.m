clc; clear; clf;
addpath("utils/");
%%
anchor = [-0.3, -0.2;
    0.45, -0.5;
    0.5, -0.1];
anchor_label = [0,1,1];
uc8 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
    3, true);
cs = CurveStructure('tn-8');
cs.add_unit_curve(uc8);


figure(4); clf;
cs.plot_2D_projection;


figure(5);clf;
cs.plot_3D_structure();

%%
figure(5); clf;
p1 = [2,0];
p2 = [0,2];
t1 = [0,1];
t2 = [1,0];

c1 = fit_bezier_curve(p1,p2,t1,t2,true);

p4 = [2,2];
p3 = [0,0];
t4 = [-1,0];
t3 = [0,1];

c2 = fit_bezier_curve(p3,p4,t3,t4,true);

[t,s,flag1, flag2] = find_intersections_2d_bezier(c1, c2);

p = c1(t);
scatter(p(1),p(2))
