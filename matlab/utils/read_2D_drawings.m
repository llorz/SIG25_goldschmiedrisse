function cs = read_2D_drawings(filename)
    fid = fopen(filename,'r'); 
    numCurves = fscanf(fid, 'numCurves\t%d\n', 1);

    cs = CurveStructure(get_name(filename));

    for ii = 1:numCurves
        curve = fscanf(fid, 'unitCurve\t%d\t%d\t%d\t%d\n', 4);
        np = curve(1);
        rotational_symmetry = curve(2);
        reflection_symmetry = curve(3);
        reflection_pid = curve(4);
        
        anchor = zeros(np, 2);
        anchor_constraints = [];
        anchor_label = zeros(np, 1);
        
        for jj = 1:np
            anchor(jj, :) = fscanf(fid, 'ptPos\t%f\t%f\n', 2)';
            if ~feof(fid)
                line = fgetl(fid);
                if startsWith(line, 'ptTan')
                    anchor_constraints(jj, :) = sscanf(line, 'ptTan\t%f\t%f')';
                    anchor_label(jj) = fscanf(fid, 'ptLab\t%d\n', 1);
                else
                    anchor_label(jj) = sscanf(line, 'ptLab\t%d\n', 1);
                end
            end
        end
        cc = ControlledCurve(anchor, anchor_constraints, anchor_label);
        uc = UnitCurve(cc, rotational_symmetry, reflection_symmetry, reflection_pid);
        cs.add_unit_curve(uc);
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