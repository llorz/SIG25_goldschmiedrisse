cs = CurveStructure();
ang = 2*pi / 8;
rot = [cos(ang), -sin(ang); sin(ang), cos(ang)];
c = UnitCurve([-1, 0; ...
    (rot^3 * [-1;0])']);
cs.add_unit_curve(c);
%%
lift = true;
figure(1);
cs.plot(lift);
view([90,0])
%%
clear all; clc;

ang = 2*pi / 8;
rot = [cos(ang), -sin(ang); sin(ang), cos(ang)];
anchor = [-1, 0; ...
    (rot^3 * [-1;0])'];
anchor_label = [0, 1];
cc = ControlledCurve(anchor, [], anchor_label);
figure(1); clf
plot(cc)

%%
uc = UnitCurve(cc, 4, true);
figure(1); clf;
plot(uc);
axis equal;
% axis square;