cs = CurveStructure();
ang = 2*pi / 8;
rot = [cos(ang), -sin(ang); sin(ang), cos(ang)];
c = UnitCurve([-1, 0; ...
    (rot^3 * [-1;0])']);
cs.add_unit_curve(c);
%%
lift = true;
cs.plot(lift);

%%

