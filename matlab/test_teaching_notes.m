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
t1 = [1,0];
t2 = [0.6, 1.2];
anchor = [t1; t2];
anchor_label = [0,1];
uc1 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
    8, false);

anchor = [t3_reflect; t4; t1];
anchor_label = [0,1,1];
uc2 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
    4, false);


cs = CurveStructure();
cs.add_unit_curve(uc1);
% cs.add_unit_curve(uc2);

figure(3); clf;
cs.plot_2D_projection();
axis on; grid on;
%%
cs = return_curves('U.XI.27');
figure(4); clf;
cs.plot_2D_projection();