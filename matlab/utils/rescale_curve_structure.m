function cs_new = rescale_curve_structure(cs, a)
num = length(cs.unit_curves);
cs_new = CurveStructure(cs.name);
for i = 1:num
    uc = cs.unit_curves(i);
    cc = uc.unit_controlledCurve;
    anchor = cc.anchor/a;
    anchor_constraints = cc.anchor_constraints/a;
    anchor_label = cc.anchor_label;
 
    uc_new = UnitCurve(ControlledCurve(anchor, anchor_constraints, anchor_label), ...
        uc.rotational_symmetry, ...
        uc.reflection_symmetry, ...
        uc.reflection_point);
    cs_new.add_unit_curve(uc_new);
end

end