clc; clear; clf;
addpath("utils/");
%% plot all examples in the teaching notes
figure(1); clf;
for ii = 1:12
    subplot(2, 6, ii);
    cs = return_curves(['tn-',num2str(ii)]);
    cs.plot_2D_projection();
end
%%
group1 = {'tn-3', 'tn-4', 'tn-3.v1', 'tn-4.v1', ...
    'tn-7', 'tn-9', 'U.XI.16', 'U.XI.21',...
    'U.XI.16.v1'};

num = ceil(length(group1)/2);
figure(2); clf;
for ii = 1:length(group1)
    subplot(2,num,ii);
    cs = return_curves(group1{ii});
    cs.plot_2D_projection();
end


%%
p1 = [0,0.9];
p2 = [-0.7,0.2];
t1 = [-0.4,0];
t2 = [0,0.2];

p3 = [-0.35, -0.35];

anchor = [p1; p2];
anchor_label = [0,1];
anchor_constraints = [t1; t2];

uc1 = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
    4, true);

anchor = [p3; p2];
anchor_label = [0,1];
anchor_constraints = [0, 0.6;
    0, 0];
uc2 = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
    4, true);


cs = CurveStructure();
cs.add_unit_curve(uc1);
cs.add_unit_curve(uc2);


figure(3); clf;
cs.plot_2D_projection();
axis on; grid on;
%%
cs = return_curves('U.XI.31');
figure(4); clf;
cs.plot_2D_projection();