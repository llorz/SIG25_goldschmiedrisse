function all_P = compute_all_replicas(pts, ...
    rotational_symmetry, ...
    reflection_symmetry, ...
    reflection_point)

all_P = cell(rotational_symmetry, reflection_symmetry+1);

if ~isempty(reflection_point)
    p = reshape(reflection_point,[],1);
    p = p/norm(p);
    ref_mat = 2 * (p * p') - eye(2);
else
    ref_mat = eye(2);
end

ang = 2 * pi / rotational_symmetry;
rot_mat = [cos(ang), -sin(ang);sin(ang), cos(ang)];

power_idx = rotational_symmetry:-1:1;
for ii = 1:rotational_symmetry
    mat = rot_mat^power_idx(ii);
    rot_pts = [pts(:, 1:2) * mat', pts(:, 3)];
    all_P{ii,1} = rot_pts;
    if reflection_symmetry
        mat = mat * ref_mat;
        rot_pts = [pts(:, 1:2) * mat', pts(:, 3)];
        all_P{ii,2} = rot_pts;
    end
end
end