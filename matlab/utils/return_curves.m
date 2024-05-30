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
end