function [] = write_2D_drawings(filename, cs)
fid = fopen(filename,'w');
fprintf(fid, 'numCurves\t%d\n',length(cs.unit_curves));
for ii = 1:length(cs.unit_curves)
    uc = cs.unit_curves(ii);
    cc = uc.unit_controlledCurve;
    np = size(cc.anchor,1);
    fprintf(fid, 'unitCurve\t%d\t%d\t%d\t%d\n', np, ...
        uc.rotational_symmetry, uc.reflection_symmetry, uc.reflection_pid);
    for jj = 1:np
        fprintf(fid, 'ptPos\t%f\t%f\n', cc.anchor(jj,1), cc.anchor(jj,2));
        if ~isempty(cc.anchor_constraints)
            fprintf(fid, 'ptTan\t%f\t%f\n', cc.anchor_constraints(jj,1), cc.anchor_constraints(jj,2));
        end
        fprintf(fid, 'ptLab\t%d\n', cc.anchor_label(jj));
    end
end
fclose(fid);
end