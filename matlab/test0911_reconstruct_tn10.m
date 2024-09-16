clc; clear; clf;
addpath("utils/");
addpath('utils_gp/');

filepath = '../data_2D_drawings/';
name = 'tn-10';
cs = read_2D_drawings([filepath, name, '.uc']);
cs = rescale_curve_structure(cs, 1.5);
cs.prepare_control_points();

% add variations
cs.controlPts(cs.curves(5).pid, 3) = cs.controlPts(cs.curves(5).pid, 3) + 0.3;
% cs.curves(5).constr_3d(2,:) = [1,0];
% cs.curves(4).constr_3d(2,:) = [1,-0.2];
% cs.curves(5).constr_3d(1,:) = [1,0];


figure(6); clf
cs.plot_curves(); axis off;

num_subdivision = 4;
all_F = {};
all_V = {};
num_lap = 2;
e1 = 1e-4;
%%  find the first face
obj = cs;

all_space_curves = [];

all_rot = [1,1,0;
    5,0,0;
    6,0,0;
    8,0,0;
    9,0,0;
    10,0,0;];

for ii = 1:size(all_rot,1)
    tmp = all_rot(ii,:);
    curve = obj.curves(tmp(1));

    ang = 2 * pi / curve.rotational_symmetry;
    rot_mat = [cos(ang), -sin(ang);sin(ang), cos(ang)];

    if tmp(3)
        p = reshape(curve.reflection_axis,[],1);
        p = p/norm(p);
        ref_mat = 2 * (p * p') - eye(2);
        mat = rot_mat^tmp(2)*ref_mat;
    else
        mat = rot_mat^tmp(2);
    end


    sc = SpaceCurve( obj.controlPts(curve.pid, :), ...
        curve.constr_2d, ...
        curve.constr_3d);
    sc_new = rotate_space_curve(sc, mat);

    all_space_curves = [all_space_curves, sc_new];
end

% use the endpoints to create triangulation
X = [];
figure(2); clf;
for ii = 1:length(all_space_curves)
    all_space_curves(ii).plot(); hold on;
    p = all_space_curves(ii).fittedCurve(0);
    scatter3(p(1), p(2), p(3),100, 'filled');
    X = [X; p];
    p = all_space_curves(ii).fittedCurve(1);
    scatter3(p(1), p(2), p(3),100, 'filled');

    X = [X; p];
end

axis equal;

X = uniquetol(X, e1,'ByRows',true);
T = delaunay(X(:,1:2));
% manually remove the wrong faces
% T(2,:) = [];
T = [1,2,6; 2,5,6];

[V,F] = midPointUpsample(X,T,num_subdivision);

figure(3); clf;
trimesh(T, X(:,1), X(:,2)); hold on
for i = 1:size(X,1)
    text(X(i,1), X(i,2),num2str(i))
end
trimesh(F, V(:,1), V(:,2), V(:,3));
axis equal; axis off
%%
% for boundary vertices try to find their 3d positions


S = construct_mesh(V, F);
vid_boundary = find_boundary_vertex(S);
% snap the boundary vertices to the curves
for vid = reshape(vid_boundary, 1, [])

    for cid = 1:length(all_space_curves)
        sc = all_space_curves(cid);


        p1 = sc.fittedCurve(0);
        p2 = sc.fittedCurve(1);
        p3 = V(vid,1:2);
        flag = isPointOnLineSegment(p1, p2, p3);
        if flag
            t = norm(p3 - p1(1:2)) / norm(p2(1:2) - p1(1:2));
            V(vid, :) = sc.fittedCurve(t);

        end
    end
end
% run Laplacian
V_new = V;
vid_var = setdiff(1:size(V,1), vid_boundary);

for k = 1:num_lap
    L = cotLaplacian(V_new, F);
    V_fix = V_new(vid_boundary, :);

    L_fix = L(:, vid_boundary);
    L_var = L(:, vid_var);

    V_var = -(L_var \ L_fix*V_fix);
    V_new(vid_var, :) = full(V_var);
end

all_F{end+1} = F;
all_V{end+1} = V_new;

 all_F{end+1} = F;
    all_V{end+1} = all_V{end}*diag([1,-1,1]);

ang = 2 * pi / curve.rotational_symmetry;
rot_mat = [cos(ang), -sin(ang);sin(ang), cos(ang)];
for ii = 1:curve.rotational_symmetry-1
    all_F{end+1} = F;
    all_V{end+1} = [V_new(:,1:2)*rot_mat^ii, V_new(:,3)];


    all_F{end+1} = F;
    all_V{end+1} = all_V{end}*diag([1,-1,1]);
    

end


%% plot all faces:
figure(3); clf;
cs.plot_curves(); axis off; hold on;
for ii = 1:length(all_F)
    F = all_F{ii};
    V = all_V{ii};

    trimesh(F, V(:,1), V(:,2), V(:,3),'FaceColor',[1,0,0],...
        'EdgeColor','none','FaceAlpha',0.2);
    axis equal; axis off
end

return
%%
F_out = all_F{1};
V_out = all_V{1};

for ii = 2:length(all_F)
    V_tmp = [V_out; all_V{ii}];

    V_tmp = uniquetol(V_tmp,e1,'ByRows',true);
    idx1 = knnsearch(V_tmp, V_out);
    idx2 = knnsearch(V_tmp, all_V{ii});
    F_out = [idx1(F_out); idx2(all_F{ii})];
    V_out = V_tmp;
end
%% apply laplacian editing

figure(3); clf;
% cs.plot_curves(); axis off;
trimesh(F_out, V_out(:,1), V_out(:,2), V_out(:,3),'FaceColor',[1,0,0],...
    'EdgeColor','k','FaceAlpha',0.2);
axis equal; axis off
%%
writeOBJ('./local/tn-5.obj',V_out, F_out)
%%

figure(4); clf;

sc.plot(); hold on;
scatter(V(vid,1), V(vid,2));



return
%% code use to find the curves to select
obj = cs;
params = load_parameters();



cid = [5,9,10,6,8];
cid = 5;


figure(6); clf
cs.plot_curves(); axis off;

for ii = cid
    curve = obj.curves(ii);


    Pos3D = obj.controlPts(curve.pid, :);
    constr_2d = curve.constr_2d;
    constr_3d = curve.constr_3d;
    pts = plot_curve_from_projections( ...
        Pos3D, ...
        constr_2d, ...
        constr_3d, ...
        params); hold on;

    % plot the 3D curve (rasterized)
    plot3(pts(:,1), pts(:,2), pts(:,3), ...
        'Color',[1,0,0], ...
        'LineWidth',params.size_line);
    axis equal; hold on
end


%% find all curves

all_rot = [1,1,0;
    5,0,0;
    6,0,0;
    8,0,0;
    9,0,0;
    10,0,0;];

% figure(1); clf;
% cs.plot_curves(); axis off; hold on;

for ii = 1:size(all_rot,1)
    tmp = all_rot(ii,:);
    curve = obj.curves(tmp(1));

    ang = 2 * pi / curve.rotational_symmetry;
    rot_mat = [cos(ang), -sin(ang);sin(ang), cos(ang)];
    if tmp(3)
        p = reshape(curve.reflection_axis,[],1);
        p = p/norm(p);
        ref_mat = 2 * (p * p') - eye(2);

        mat = rot_mat^tmp(2)*ref_mat;
    else
        mat = rot_mat^tmp(2);
    end


    sc = SpaceCurve( obj.controlPts(curve.pid, :), ...
        curve.constr_2d, ...
        curve.constr_3d);
    sc_new = rotate_space_curve(sc, mat);

    % sc.plot(); hold on;
    sc_new.plot(); hold on;
    axis equal;
end