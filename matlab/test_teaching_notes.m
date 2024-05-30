clc; clear; clf;
addpath("utils/");


%%
anchor = [-1, 0; ...
   0.7, -0.7];
anchor_label = [0, 1]; 
uc1 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
    4, true);

%%
anchor = [-1, 0; ...
   0.7, -0.7];
anchor_label = [1,0];
uc2 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
    4, true);

%%
anchor = [-0.8, 0;
    0, -0.5];
anchor_label = [0,1];
uc3 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
    4, true);
%%
anchor = [-0.8, 0;
    0, -0.5];
anchor_label = [1,0];
uc4 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
    4, true);

%%
anchor = [-0.8, 0;
    -0.1, -0.5;
    0.1, -0.4];
anchor_label = [0,1,1];
uc5 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
    4, true);

%%
anchor = [-0.5, 0;
    -0.1, -0.8;
    0.1, -0.6];
anchor_label = [0,1,1];
uc6 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
    4, true);
%%
anchor = [-0.6, 0;
    -0.3, -0.6;
    0.1, -0.3];
anchor_label = [0,1,1];
uc7 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
    4, true);
%%
anchor = [-0.5, 0;
    0.3, -0.45;
    0.32, -0.2];
anchor_label = [0,1,1];
uc8 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
    4, true);

%%
anchor = [-0.3, -0.2;
    0.45, -0.5;
    0.5, -0.1];
anchor_label = [0,1,1];
uc9 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
    3, true);

figure(2);
uc = [uc1; uc2; uc3; uc4; uc5; uc6; uc7; uc8; uc9];
figure(1); clf;
for ii = 1:length(uc)
    subplot(2,5,ii);  plot(uc(ii));
end
%%
anchor = [-1, 0; ...
   0.7, -0.7];
anchor_label = [1, 0]; 
uc1 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
    2, true);


anchor = [-0.8, 0;
    -0.1, -0.5;
    0.1, -0.4];
anchor_label = [0,1,1];
uc2 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
    2, true);

cs = CurveStructure();
% cs.add_unit_curve(uc1);
cs.add_unit_curve(uc2);
figure(1); clf;
cs.plot_2D_projection();

