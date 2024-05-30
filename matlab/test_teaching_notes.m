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
anchor = [-0.3, -0.1;
    0.5, -0.45;
    0.6, -0.2];
anchor_label = [0,1,1];
uc9 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
    1, false);
%%
p0 = [-0.3, -0.1];
p = p0'/norm(p0);
ref_mat = 2 * (p * p') - eye(2);

p1 = anchor;
p2 = (p1-p0)*ref_mat'+p0;
p2 = p1*ref_mat';

figure(2); clf
plot(p1(:,1), p1(:,2)); hold on;
plot(p2(:,1), p2(:,2));
axis equal;
plot([-0.3;0],[-0.1;0])
%%
uc = [uc1; uc2; uc3; uc4; uc5; uc6; uc7; uc8; uc9];
figure(1); clf;
for ii = 1:length(uc)
    subplot(2,5,ii);  plot(uc(ii));
end
