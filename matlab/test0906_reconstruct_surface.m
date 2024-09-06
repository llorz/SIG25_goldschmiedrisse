clc; clear; clf;
addpath("utils/");

filepath = '../data_2D_drawings/';
name = 'tn-1';
cs = read_2D_drawings([filepath, name, '.uc']);
cs = rescale_curve_structure(cs, 1.5);
cs.prepare_control_points();

figure(6); clf
cs.plot_curves(); axis off;
%%
obj = cs;

all_space_curves = [];
for cid = 4:5
    curve = obj.curves(cid);
    sc = SpaceCurve( obj.controlPts(curve.pid, :), ...
        curve.constr_2d, ...
        curve.constr_3d);
    all_space_curves = [all_space_curves, sc];
end

all_rot = [3,2,1;
    3,1,0;
    4,3,1;
    5,3,1;];

for ii = 1:size(all_rot,1)
    tmp = all_rot(ii,:);
    curve = obj.curves(tmp(1));

    ang = 2 * pi / curve.rotational_symmetry;
    rot_mat = [cos(ang), -sin(ang);sin(ang), cos(ang)];
    p = reshape(curve.reflection_axis,[],1);
    p = p/norm(p);
    ref_mat = 2 * (p * p') - eye(2);
    if tmp(3)
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

%%
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

X = uniquetol(X,1e-5,'ByRows',true);
T = delaunay(X(:,1:2));
T([1,6],:) = [];


[V,F] = midPointUpsample(X,T,3);

figure(3); clf;
trimesh(T, X(:,1), X(:,2))
trimesh(F, V(:,1), V(:,2), V(:,3));
axis equal; axis off

%% for boundary vertices try to find their 3d positions

addpath('utils_gp/');
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
%%
V_new = V;
vid_var = setdiff(1:size(V,1), vid_boundary);

for k = 1:10
L = cotLaplacian(V_new, F);
V_fix = V_new(vid_boundary, :);

L_fix = L(:, vid_boundary);
L_var = L(:, vid_var);

V_var = -(L_var \ L_fix*V_fix);
V_new(vid_var, :) = full(V_var);
end

%% apply laplacian editing

figure(3); clf;
cs.plot_curves(); axis off;
trimesh(F, V_new(:,1), V_new(:,2), V_new(:,3),'FaceColor',[1,0,0],...
    'EdgeColor','none','FaceAlpha',0.8);
axis equal; axis off
%%

figure(4); clf;

sc.plot(); hold on;
scatter(V(vid,1), V(vid,2));



return
%% code use to find the curves to select
obj = cs;
params = load_parameters();

cid = 4:5

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
all_rot = [3,2,1;
    3,1,0;
    4,3,1;
    5,3,1;];

figure(1); clf;
cs.plot_curves(); axis off; hold on;

for ii = 1:size(all_rot,1)
    tmp = all_rot(ii,:);
    curve = obj.curves(tmp(1));

    ang = 2 * pi / curve.rotational_symmetry;
    rot_mat = [cos(ang), -sin(ang);sin(ang), cos(ang)];
    p = reshape(curve.reflection_axis,[],1);
    p = p/norm(p);
    ref_mat = 2 * (p * p') - eye(2);
    if tmp(3)
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