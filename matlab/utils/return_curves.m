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
    t1 = [-0.5, 0.5];
    t2 = [0.8, 0.3];

    anchor = [-t2; ...
        t1;
        t2];
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

    t1 = [-0.5, 0.5];
    t2 = [0.2,0.8];

    anchor = [-t2; ...
        t1;
        t2];
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
    t1 = [0.5, 0.2];
    t2 = [0.2, -0.5];

    anchor = [-t2; ...
        t1;
        t2];
    anchor_label = [1,0,1];

    uc1 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        2, false);

    anchor(:,1) = -anchor(:,1);
    uc2 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        2, false);

    t3 = [1,0];
    anchor = [t3; t1;];
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
    t1 = [-1,0];
    t2 = [-0.6, -0.9];

    anchor = [t1; t2];
    anchor_label = [0,1];

    uc1 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        4, true);

    t3 = [0.4, -0.4];
    anchor = [t3; t2];
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
    t1 = [0,1];
    t2 = [-0.6,0.2];
    t3 = [-0.35, -0.35];

    anchor = [t1; t2];
    anchor_label = [0,1];
    uc1 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        4, true);

    anchor = [t3; t2];
    anchor_label = [0,1];
    uc2 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        4, true);


    cs = CurveStructure(name);
    cs.add_unit_curve(uc1);
    cs.add_unit_curve(uc2);

    return;
end

if strcmpi(name, 'u.xi.33.s')
    t1 = [0,1];
    t2 = [0.95,0.4];
    t3 = [0.7, 0];

    anchor = [t1; t2];
    anchor_label = [0,1];
    uc1 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        4, true);

    anchor = [t3; t2];
    anchor_label = [0,1];
    uc2 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        4, true);


    cs = CurveStructure(name);
    cs.add_unit_curve(uc1);
    cs.add_unit_curve(uc2);

    return;
end

if strcmpi(name, 'u.xi.19')
    t1 = [0,1];
    t2 = [0.7,0.7];
    t3 = [0.5,0.5];
    t4 = [0.5,1.2];

    anchor = [t1; t2];
    anchor_label = [0,1];
    uc1 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        4, true);

    anchor = [t3; t4; t1];
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
    t1 = [-0.2,1];
    t2 = [-0.9,0.32];
    t3 = [-a,-a];

    t3_reflect = [a, -a];
    t4 = [a,0.3];

    anchor = [t1; t2; t3];
    anchor_label = [0,1,1];
    uc1 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        4, false);

    anchor = [t3_reflect; t4; t1];
    anchor_label = [0,1,1];
    uc2 = UnitCurve(ControlledCurve(anchor, [], anchor_label), ...
        4, false);


    cs = CurveStructure(name);
    cs.add_unit_curve(uc1);
    cs.add_unit_curve(uc2);
    return

end

end