function cs = return_curves(name)
if strcmpi(name, 'tn-1')
    anchor = [-1, 0; ...
        0.7, -0.7];
    anchor_label = [0, 1];
    uc1 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        4, true);
    cs = CurveStructure(name);
    cs.add_unit_curve(uc1);
    return;
end

if strcmpi(name, 'tn-2')
    anchor = [-1, 0; ...
        0.7, -0.7];
    anchor_label = [1,0];
    uc2 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        4, true);
    cs = CurveStructure(name);
    cs.add_unit_curve(uc2);
    return;
end

if strcmpi(name, 'tn-3')
    anchor = [-0.8, 0;
        0, -0.5];
    anchor_label = [0,1];
    uc3 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        4, true);
    cs = CurveStructure(name);
    cs.add_unit_curve(uc3);
    return;
end

if strcmpi(name, 'tn-3.v1')
    anchor = [-0.8, 0;
        -0.1, -0.5;
        0.1, -0.4];
    anchor_label = [0,1,1];
    uc5 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        4, true);
    cs = CurveStructure(name);
    cs.add_unit_curve(uc5);
    return;
end

if strcmpi(name, 'tn-4.v1')
    anchor = [-0.5, 0;
        -0.1, -0.8;
        0.1, -0.6];
    anchor_label = [0,1,1];
    uc6 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        4, true);
    cs = CurveStructure(name);
    cs.add_unit_curve(uc6);
    return;
end


if strcmpi(name, 'tn-4')
    anchor = [-0.8, 0;
        0, -0.5];
    anchor_label = [1,0];
    uc4 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        4, true);
    cs = CurveStructure(name);
    cs.add_unit_curve(uc4);
    return;
end

if strcmpi(name, 'tn-5')
    p1 = [-0.5, 0.5];
    p2 = [0.8, 0.3];

    anchor = [-p2; ...
        p1;
        p2];
    anchor_label = [1,0,1];

    uc1 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        2, false);

    anchor(:,1) = -anchor(:,1);
    uc2 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        2, false);
    cs = CurveStructure(name);
    cs.add_unit_curve(uc1);
    cs.add_unit_curve(uc2);
    return
end

if strcmpi(name, 'tn-6')

    p1 = [-0.5, 0.5];
    p2 = [0.2,0.8];

    anchor = [-p2; ...
        p1;
        p2];
    anchor_label = [1,0,1];

    uc1 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        2, false);

    anchor(:,1) = -anchor(:,1);
    uc2 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        2, false);

    cs = CurveStructure(name);
    cs.add_unit_curve(uc1);
    cs.add_unit_curve(uc2);
    return
end


if strcmpi(name, 'tn-7')
    anchor = [0, -0.4; ...
        0.8, 0];
    anchor_label = [0,1];
    uc1 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        2, true);


    anchor = [-0.5, 0;
        -0.1, -0.8;
        0.1, -0.6];
    anchor_label = [0,1,1];
    uc2 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        2, true);

    cs = CurveStructure(name);
    cs.add_unit_curve(uc1);
    cs.add_unit_curve(uc2);
    return
end

if strcmpi(name, 'tn-8')
    anchor = [-0.3, -0.2;
        0.45, -0.5;
        0.5, -0.1];
    anchor_label = [0,1,1];
    uc8 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        3, true);
    cs = CurveStructure(name);
    cs.add_unit_curve(uc8);
    return
end

if strcmpi(name, 'tn-9')
    anchor = [-0.6, 0;
        -0.3, -0.6;
        0.1, -0.3];
    anchor_label = [0,1,1];
    uc9 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        4, true);
    cs = CurveStructure(name);
    cs.add_unit_curve(uc9);
    return
end

if strcmpi(name, 'tn-10')
    h = 1.7;
    t = 0.5;
    p1 = [0,-h]; % intersection at y axis
    p2 = [h/sqrt(3), 0]; % intersection at x axis
    p3 = [h*sqrt(3)/4, -h/4]; % intersection with the refelection axis

    p = (1-t)*p1 + t*p2; % pick anothr point on p1--p2

    anchor = [-sqrt(3)/2, -0.5;
        p;
        p3];
    anchor_label = [0,1,1];

    uc = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        3, true);
    cs = CurveStructure(name);
    cs.add_unit_curve(uc);
    return
end

if strcmpi(name, 'tn-11')

    p1 = [-0.2, -0.3];
    p2 = [0.5, 0];
    t = 0.45;



    p3 = (1-t)*p1 + t*p2;
    anchor = [p1; p3; p2];
    anchor_label = [1,0,1];
    reflect_pid = 3;
    uc1 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        2, true, reflect_pid);


    p4 = [-0.35, 0];
    anchor = [p4; p1];
    anchor_label = [0,1];
    uc2 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        2, true);

    cs = CurveStructure(name);
    cs.add_unit_curve(uc1);
    cs.add_unit_curve(uc2);
end


if strcmpi(name, 'tn-12')
    anchor = [0,-1;
        1,0];
    anchor_label = [0,1];
    uc = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        6, true);
    cs = CurveStructure(name);
    cs.add_unit_curve(uc);
    return

end

if strcmpi(name, 'u.xi.21')
    anchor = [-0.5, 0;
        0.3, -0.45;
        0.32, -0.2];
    anchor_label = [0,1,1];
    uc = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        4, true);
    cs = CurveStructure(name);
    cs.add_unit_curve(uc);
    return
end



if strcmpi(name, 'u.xi.16')
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

    cs = CurveStructure(name);
    cs.add_unit_curve(uc1);
    cs.add_unit_curve(uc2);
    return
end


if strcmpi(name, 'u.xi.16.v1')
    anchor = [0, -0.4; ...
        0.8, -0.1;
        0.6,0.1];
    anchor_label = [0,1,1];
    uc1 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        2, true);


    anchor = [-0.5, 0;
        -0.3, -0.5;
        0.1, -0.2];
    anchor_label = [0,1,1];
    uc2 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        2, true);

    cs = CurveStructure(name);
    cs.add_unit_curve(uc1);
    cs.add_unit_curve(uc2);
    return
end

if strcmpi(name, 'u.xi.15')
    p1 = [0.5, 0.2];
    p2 = [0.2, -0.5];

    anchor = [-p2; ...
        p1;
        p2];
    anchor_label = [1,0,1];

    uc1 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        2, false);

    anchor(:,1) = -anchor(:,1);
    uc2 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        2, false);

    p3 = [1,0];
    anchor = [p3; p1;];
    anchor_label = [0,1];
    uc3 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        2, true);

    cs = CurveStructure(name);
    cs.add_unit_curve(uc1);
    cs.add_unit_curve(uc2);
    cs.add_unit_curve(uc3);
    return
end

if strcmpi(name, 'u.xi.26')
    p1 = [-1,0];
    p2 = [-0.6, -0.9];

    anchor = [p1; p2];
    anchor_label = [0,1];

    uc1 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        4, true);

    p3 = [0.4, -0.4];
    anchor = [p3; p2];
    anchor_label = [0,1];
    uc2 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        4, true);

    cs = CurveStructure(name);
    cs.add_unit_curve(uc1);
    cs.add_unit_curve(uc2);
    return
end


if strcmpi(name, 'u.xi.23')
    anchor = [-0.1,-0.6;
        -1, -1;
        0.5,-1.5;
        -0.4,-0.55];
    anchor_label = [1,0,1,1];
    uc1 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        4, true);
    cs = CurveStructure(name);
    cs.add_unit_curve(uc1);
    return
end

if strcmpi(name, 'u.xi.32')
    anchor = [-1, -1;
        0.7,-1.5;
        0.7,-0.5];
    anchor_label = [0,1,1];
    uc1 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        4, true);
    cs = CurveStructure(name);
    cs.add_unit_curve(uc1);
    return
end

if strcmpi(name, 'u.xi.31.s')
    p1 = [0,1];
    p2 = [-0.6,0.2];
    p3 = [-0.35, -0.35];

    anchor = [p1; p2];
    anchor_label = [0,1];
    uc1 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        4, true);

    anchor = [p3; p2];
    anchor_label = [0,1];
    uc2 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        4, true);


    cs = CurveStructure(name);
    cs.add_unit_curve(uc1);
    cs.add_unit_curve(uc2);

    return;
end


if strcmpi(name, 'u.xi.31')
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


    cs = CurveStructure(name);
    cs.add_unit_curve(uc1);
    cs.add_unit_curve(uc2);
end



if strcmpi(name, 'u.xi.33.s')
    p1 = [0,1];
    p2 = [0.95,0.4];
    p3 = [0.7, 0];

    anchor = [p1; p2];
    anchor_label = [0,1];
    uc1 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        4, true);

    anchor = [p3; p2];
    anchor_label = [0,1];
    uc2 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        4, true);


    cs = CurveStructure(name);
    cs.add_unit_curve(uc1);
    cs.add_unit_curve(uc2);

    return;
end

if strcmpi(name, 'u.xi.33')
    p1 = [0,1];
    p2 = [0.95,0.4];
    p3 = [0.7, 0];

    anchor = [p1; p2];
    anchor_label = [0,1];
    anchor_constraints = [0.1, -0.2; -0.5,0];
    uc1 = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
        4, true);

    anchor = [p3; p2];
    anchor_label = [0,1];
    anchor_constraints = [0.1, 0; 0,-0.2];
    uc2 = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
        4, true);


    cs = CurveStructure(name);
    cs.add_unit_curve(uc1);
    cs.add_unit_curve(uc2);
end


if strcmpi(name, 'u.xi.19')
    p1 = [0,1];
    p2 = [0.7,0.7];
    p3 = [0.5,0.5];
    t4 = [0.5,1.2];

    anchor = [p1; p2];
    anchor_label = [0,1];
    uc1 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        4, true);

    anchor = [p3; t4; p1];
    anchor_label = [0,1,1];
    uc2 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        4, true);


    cs = CurveStructure(name);
    cs.add_unit_curve(uc1);
    cs.add_unit_curve(uc2);
    return
end

if strcmpi(name, 'u.xi.27')
    a = 0.55;
    p1 = [-0.2,1];
    p2 = [-0.9,0.32];
    p3 = [-a,-a];

    t3_reflect = [a, -a];
    t4 = [a,0.3];

    anchor = [p1; p2; p3];
    anchor_label = [0,1,1];
    uc1 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        4, false);

    anchor = [t3_reflect; t4; p1];
    anchor_label = [0,1,1];
    uc2 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        4, false);


    cs = CurveStructure(name);
    cs.add_unit_curve(uc1);
    cs.add_unit_curve(uc2);
    return

end




if strcmpi(name, 'u.xi.35')
    p1 = [0,1];
    p2 = [sqrt(3)/2, -0.5];
    p3 = [1.8,-0.8];
    h = 3;
    p4 = [0.4,h+0.2];
    p5 = [0,h];
    p6 = [3*sqrt(3)/2, 3/2];
    p7 = [1, h-0.2];


    anchor = [p1; p2];
    anchor_label = [1,1];
    anchor_constraints = [];
    uc1 = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
        3, false);


    anchor = [p5; p6];
    anchor_constraints = [0,-1; -0.8, 0];
    anchor_label = [0,1];
    uc2 = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
        3, true);



    anchor = [p1;p3;];
    anchor_label = [1,1];
    anchor_constraints = [1,0; 0,1;];
    uc3 = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
        3, false);


    anchor = [p3; p4];
    anchor_label = [1,1];
    anchor_constraints = [0,2; 0.2,0];
    uc4 = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
        3, false);


    anchor = [p5; p7];
    anchor_label = [1,1];
    anchor_constraints = [0.2,0; -0.2,0.2];
    uc5 = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
        3, false);


    cs = CurveStructure(name);
    cs.add_unit_curve(uc1);
    cs.add_unit_curve(uc2);
    cs.add_unit_curve(uc3);
    cs.add_unit_curve(uc4);
    cs.add_unit_curve(uc5);
    return;

end

if strcmpi(name, 'u.xi.20')
    p1 = [-0.15,1.1];

    p2 = [1,0.6];
    p3 = [0.7, 0];
    p4 = [0, 0.5];
    p5 = [1.2, 0];
    p6 = [1,0.18];

    figure(4); clf;
    p = [p1; p2; p3];
    scatter(p(:, 1), p(:, 2),'filled');

    anchor = [p1; p2];
    anchor_label = [1,1];
    anchor_constraints = [0.1, -0.2; -0.5,0];
    uc1 = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
        4, true, [0,1]);

    anchor = [p3; p2];
    anchor_label = [0,1];
    anchor_constraints = [0.1, 0; 0,-0.2];
    uc2 = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
        4, true,1);

    anchor = [p3; p4];
    anchor_label = [0,1];
    uc3 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        4, true);


    anchor = [p5; p6];
    anchor_label = [0,1];
    anchor_constraints = [-0.01, 0; 0.01, -0.1];
    uc4 = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
        4, true,1);

    cs = CurveStructure(name);
    cs.add_unit_curve(uc1);
    cs.add_unit_curve(uc2);
    cs.add_unit_curve(uc3);
    cs.add_unit_curve(uc4);
    return
end

if strcmpi(name, 'u.xi.18')
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


    cs = CurveStructure(name);
    cs.add_unit_curve(uc1);
    cs.add_unit_curve(uc2);
    return
end

if strcmpi(name, 'u.xi.37')
    p1 = [0, -0.6];
    p2 = [-0.8, 0];
    t = [0, 0.1];



    anchor = [-p1; -p2] - t;
    anchor_label = [0,1];
    uc1 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        3, true,1);


    anchor = [p1; p2] - t;
    anchor_label = [0,1];
    uc2 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        3, true,1);

    cs = CurveStructure(name);
    cs.add_unit_curve(uc1);
    cs.add_unit_curve(uc2);
    return
end

if strcmpi(name, 'u.xi.25')
    p1 = [-0.5, 0];
    p2 = [0, -0.6];
    p3 = [0, 0.3];

    anchor = [p1; p2] ;
    anchor_label = [0,1];
    anchor_constraints = [0, -0.05; -0.05, 0];
    uc1 = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
        3, true,2);


    anchor = [p1; p3];
    anchor_label = [1,0];
    anchor_constraints = [0, 0.05; -0.05, 0];
    uc2 = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
        3, true, 2);



    cs = CurveStructure(name);
    cs.add_unit_curve(uc1);
    cs.add_unit_curve(uc2);
    return
end

if strcmpi(name, 'u.xi.34')
    p1 = [0,0.9];
    p2 = [0.7,0];
    p3 = [0.4, 0.5];
    p4 = [-0.8, 0.4];
    p5 = -p3;
    p6 = [0.9,0];

    anchor = [p1; p2];
    anchor_label = [1,0];
    anchor_constraints = [ 0, -0.3; -0.3, 0];
    uc1 = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
        2, true);

    anchor = [p3; p4];
    anchor_label = [0,1];
    anchor_constraints = [-0.5, 0.5;  0.1, 0.1];
    uc2 = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
        2, true, [0,1]);

    anchor = [p4; p5];
    anchor_label = [1,1];
    anchor_constraints = [0.3, 0;  0, 0.1];
    uc3 = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
        2, true, [0,1]);


    anchor = [p6; p3];
    anchor_label = [1,1];
    uc4 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        2, true, [0,1]);

    cs = CurveStructure(name);
    cs.add_unit_curve(uc1);
    cs.add_unit_curve(uc2);
    cs.add_unit_curve(uc3);
    cs.add_unit_curve(uc4);
    return;
end

if strcmpi(name, 'u.xi.22')
    p1 = [0.4, 0.4];
    p2 = [0,1];
    p3 = [1,0];
    p4 = [1.3, -0.6];
    p5 = [0,-1.1];

    p6 = [2.5,0];
    p7 = [1.8,0];
    p8 = [1.3,0.4];

    a = 0.25;
    anchor = [p1; p2];
    anchor_label = [0,1];
    anchor_constraints = [ -0.1, a; a, 0];
    uc1 = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
        4, false);


    anchor = [p1; p3];
    anchor_label = [0,1];
    anchor_constraints = [ 0.1, -a; -a, 0];
    uc2 = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
        4, false);

    anchor = [0,0; p1];
    anchor_label = [1,1];
    uc3 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        4, false);

    anchor = [p1; p4];
    anchor_label = [0,1];
    anchor_constraints = [ 0, -0.5; -0.5, 0];
    uc4 = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
        4, true);


    anchor = [p5; p4];
    anchor_label = [0,1];
    anchor_constraints = [ 0.4, 0;0, -0.2];
    uc5 = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
        4, true);


    anchor = [p1; p6];
    anchor_label = [0,0];
    anchor_constraints = [];
    uc6 = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
        2, true,2);

    anchor = [p7; p8];
    anchor_label = [1,1];
    anchor_constraints = [];
    uc7 = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
        2, true,1);


    cs = CurveStructure(name);
    cs.add_unit_curve(uc1);
    cs.add_unit_curve(uc2);
    cs.add_unit_curve(uc3);
    cs.add_unit_curve(uc4);
    cs.add_unit_curve(uc5);
    cs.add_unit_curve(uc6);
    cs.add_unit_curve(uc7);
    return
end

if strcmpi(name, 'u.xi.29')
    p1 = [0,-a];
    p2 = [1.1,-0.6];
    p3 = [sqrt(2)/2, sqrt(2)/2] * a;


    anchor = [p1; p2];
    anchor_label = [0,1];
    anchor_constraints = [ 0.1, -0.1; -0.2, -0.4];
    uc1 = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
        8, false);

    anchor = [p3; p2];
    anchor_label = [0,1];
    anchor_constraints = [ -0.2, -0.4; -0.4,0.2];
    uc2 = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
        8, false);

    cs = CurveStructure(name);
    cs.add_unit_curve(uc1);
    cs.add_unit_curve(uc2);
    return
end

if strcmpi(name, 'u.xi.28')
    a = 1;
    p1 = [0,a];
    p2 = [-1.3,a];
    p3 = [-1.7,-0.2];
    p4 = [-0.2,-1.2];
    p5 = [sqrt(2), -sqrt(2)]*a/2;


    anchor = [p1; p2;p3;p4;p5];
    anchor_label = [0,1,0,1,0];
    anchor_constraints = [ ];
    uc1 = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
        4, true,1);
    cs = CurveStructure(name);
    cs.add_unit_curve(uc1);
    return;
end

end