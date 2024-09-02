%%
anchor =  [
    -0.3000   -0.6000;
    0.1000   -0.3000];
anchor_label = [1,2];

uc = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
    4, true, [-0.6,0]);


cs = CurveStructure();
cs.add_unit_curve(uc);

figure(6); clf;
cs.plot_curves();


Pos3D = [anchor, [1;0.4]];
constr_3d = [0,-0.5; -0.5,0];
constr_2d = [];


uc_2d = ControlledCurve(Pos3D(:,1:2), ...
    constr_2d,...
    []);
uc_height = ControlledCurve([[0;1], Pos3D(:, 3)], ...
    constr_3d,...
    []);
t = linspace(0,1,100);
x = uc_2d.fittedCurve(t);
y = uc_height.fittedCurve(t);
p = [x, y(:,2)];

figure(3); clf
plot3(p(:,1), p(:,2), p(:,3));

q = uc_height.fittedCurve(t);
plot(q(:,1), q(:,2));
%%
fit_bezier_curve()