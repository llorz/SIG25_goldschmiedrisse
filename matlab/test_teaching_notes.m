clc; clear; clf;
addpath("utils/");
%%
group1 = {'tn-3', 'tn-4', 'tn-3.v1', 'tn-4.v1', 'tn-7', 'tn-9', 'U.XI.16', 'U.XI.21'};

num = ceil(length(group1)/2);
figure(3); clf;
for ii = 1:length(group1)
    subplot(2,num,ii); 
    cs = return_curves(group1{ii});
    cs.plot_2D_projection();
end

%%
anchor = [0, -0.4; ...
   0.8, 0];
anchor_label = [0,1]; 
uc1 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
    2, true);


anchor = [-0.5, 0;
    -0.3, -0.5;
    0.1, -0.2];
anchor_label = [0,1,1];
uc2 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
    2, true);

cs = CurveStructure();
cs.add_unit_curve(uc1);
cs.add_unit_curve(uc2);
figure(2); clf;
cs.plot_2D_projection();


%%
cs = return_curves('tn-9');
figure(2); clf; 
cs.plot_2D_projection();