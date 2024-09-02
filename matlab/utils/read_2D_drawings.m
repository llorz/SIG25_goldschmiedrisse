function cs = read_2D_drawings(filename)
fid = fopen(filename,'r');
numCurves = fscanf(fid, 'numCurves\t%d\n', 1);

cs = CurveStructure(get_name(filename));

for ii = 1:numCurves
    curve = fscanf(fid, 'unitCurve\t%d\t%d\t%d\t%d\n', 4);
    np = curve(1);
    rotational_symmetry = curve(2);
    reflection_symmetry = curve(3);
    if reflection_symmetry
        reflection_point = fscanf(fid, 'reflectionPoint\t%f\t%f\n', 2);
    else
        reflection_point = [];
    end

    anchor = zeros(np, 2);
    anchor_constraints = zeros(np, 2);
    anchor_label = zeros(np, 1);

    for jj = 1:np
        anchor(jj, :) = fscanf(fid, 'ptPos\t%f\t%f\n', 2)';
        if ~feof(fid)
            line = fgetl(fid);
            if startsWith(line, 'ptTan')
                anchor_constraints(jj, :) = sscanf(line, 'ptTan\t%f\t%f')';
                anchor_label(jj) = fscanf(fid, 'ptLab\t%d\n', 1);
            else
                anchor_constraints = [];
                anchor_label(jj) = sscanf(line, 'ptLab\t%d\n', 1);
            end
        end
    end

    if size(anchor,1) == 2
        cc = ControlledCurve(anchor, anchor_constraints, anchor_label);
        uc = UnitCurve(cc, rotational_symmetry, reflection_symmetry, reflection_point);
        cs.add_unit_curve(uc);
    else

        for kk = 1:size(anchor,1)-1
            if isempty(anchor_constraints)
                cc = ControlledCurve(anchor(kk:kk+1,:), [], anchor_label(kk:kk+1));
            else
                cc = ControlledCurve(anchor(kk:kk+1,:), anchor_constraints(kk:kk+1,:), anchor_label(kk:kk+1));
            end
            uc = UnitCurve(cc, rotational_symmetry, reflection_symmetry, reflection_point);
            cs.add_unit_curve(uc);
        end
    end
end
fclose(fid);
end


function name = get_name(str)
pattern = '(?<=/)[^/]+(?=\.uc)';

matches = regexp(str, pattern, 'match');

if ~isempty(matches)
    name = matches{1};
else
    name = 'tmp';
end
end