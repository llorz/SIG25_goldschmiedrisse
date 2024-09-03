classdef CurveStructure < handle
    %CURVESTRUCTURE Construct a 3d curve structure
    % from the given set of unit curves (representing
    % top-view projection of the structure).

    properties
        unit_curves = [];
        name
        % 3D position for each control point
        controlPts

        % labels for each control point
        % 0 - ground point
        % 1 - peak point
        % 2 - free end for decoration purpose
        % 3 - 2D intersection between one curve and its replica (they will
        % intersect with each other in 3D as well)
        % 4 - 2D intersection between two different curves (not necessarily
        % intersect with each other in 3D; user can decide
        controlPts_label

        % a list of curves
        % pid: point ID from controlPts
        % constr_2d: the tangent constraints for each vertex in 2D (top view)
        % constr_3d: the tangent constraints in 3D
        % fitted_curve and its tangent
        % curve_length
        curves

        height
    end

    methods
        function obj = CurveStructure(name)
            if nargin < 1
                name = '';
            end
            obj.name = name;
            obj.controlPts = [];
            obj.controlPts_label = [];
            obj.curves = [];
            obj.height = 1.4;
        end




        function obj = add_unit_curve(obj,curve)
            obj.unit_curves = [obj.unit_curves, curve];
            obj.height = max(obj.height, ...
                norm(curve.unit_controlledCurve.anchor(1,:) - ...
                curve.unit_controlledCurve.anchor(2,:)));
            uid = length(obj.unit_curves);

            if size(curve.unit_controlledCurve,2) < 3
                % initialize the height by label
                anchor = [curve.unit_controlledCurve.anchor, zeros(2,1)];
                % peak point
                anchor(curve.unit_controlledCurve.anchor_label == 1, 3) = obj.height;
                % free end
                anchor(curve.unit_controlledCurve.anchor_label == 2, 3) = obj.height/3;
            else
                % input already put the height information
                anchor = curve.unit_controlledCurve.anchor;
            end

            if isempty(obj.controlPts)
                obj.controlPts = anchor;
                pid1 = 1;
                pid2 = 2;
            else
                % add anchor points to control points
                [pid1, obj.controlPts] = return_pid(anchor(1,:), obj.controlPts);
                [pid2, obj.controlPts] = return_pid(anchor(2,:), obj.controlPts);
            end

            % update the control points labels
            label = nan(size(obj.controlPts,1),1);
            label(1:length(obj.controlPts_label)) = obj.controlPts_label;
            label(pid1) = curve.unit_controlledCurve.anchor_label(1);
            label(pid2) = curve.unit_controlledCurve.anchor_label(2);
            obj.controlPts_label = label;

            c_init = struct();
            c_init.rotational_symmetry = curve.rotational_symmetry;
            c_init.reflection_symmetry = curve.reflection_symmetry;
            c_init.reflection_point = curve.reflection_point;
            c_init.uid = uid; % unit curve id

            if ~isempty(curve.p_t)

                [~,idx] = sort(curve.p_t);
                curve.p_t = curve.p_t(idx);
                curve.p_label = curve.p_label(idx);

                constr_2d = curve.unit_controlledCurve.anchor_constraints;
%                                 constr_3d = obj.height/2*[
%                                     initialize_constr_3d(label(pid1));
%                                     initialize_constr_3d(label(pid2));
%                                     ];

                constr_3d = obj.height/2*initialize_constr_3d_seg([label(pid1); label(pid2)]);


                % original curve
                bc_2d = [obj.controlPts([pid1, pid2],1:2); constr_2d];
                tmp = [[0;1], obj.controlPts([pid1, pid2], 3)];
                bc_3d = [tmp; constr_3d];

                [splited_curve_2d, t_range] = split_bezier_curve(bc_2d, curve.p_t, false);
                splited_curve_3d = split_bezier_curve(bc_3d, curve.p_t, false);

                % find 3D positions of the intersecting points
                c2d_ori = cell2mat( ...
                    arrayfun(fit_bezier_curve(bc_2d), ...
                    curve.p_t', 'UniformOutput', false)' ...
                    );
                c3d_ori = cell2mat( ...
                    arrayfun(fit_bezier_curve(bc_3d), ...
                    curve.p_t', 'UniformOutput', false)' ...
                    );
                obj.controlPts = [obj.controlPts;...
                    c2d_ori, c3d_ori(:,2)];
                obj.controlPts_label = [obj.controlPts_label(:); curve.p_label];


                for ii = 1:length(splited_curve_2d)
                    c2d = splited_curve_2d{ii};
                    c3d = splited_curve_3d{ii};

                    p1 = [c2d(1,:), c3d(1,2)];
                    p2 = [c2d(2,:), c3d(2,2)];
                    p1_id = return_pid(p1, obj.controlPts);
                    p2_id = return_pid(p2, obj.controlPts);

                    c = c_init;
                    c.pid = [p1_id, p2_id];
                    c.t_range = [t_range(ii), t_range(ii+1)];
                    if size(c2d,1) == 4
                        c.constr_2d = c2d(3:4,:);
                    else
                        c.constr_2d = 0.2*[c2d(2,:) - c2d(1,:);
                            c2d(1,:) - c2d(2,:)];
                    end

                    if size(c3d,1) == 4
                        c.constr_3d = c3d(3:4,:);
                    else
                        c.constr_3d = 0.2*[c3d(2,:) - c3d(1,:);
                            c3d(1,:) - c3d(2,:)];
                    end


                    c.fittedCurve = fit_one_3d_curve(obj.controlPts(c.pid, :), ...
                        c.constr_2d, ...
                        c.constr_3d);

                    c.fittedCurveTangent = fit_one_3d_curve_tangent( ...
                        obj.controlPts(c.pid, :), ...
                        c.constr_2d, ...
                        c.constr_3d);

                    c.curve_length = compute_curve_length(c.fittedCurve);
                    obj.curves = [obj.curves; c];

                end

            else % there is no intersection
                c = c_init;
                c.t_range = [0,1];
                c.pid = [pid1, pid2];
                c.constr_2d = curve.unit_controlledCurve.anchor_constraints;
                c.constr_3d = []; % TODO: need to check here

                c.fittedCurve = fit_one_3d_curve(obj.controlPts(c.pid, :), ...
                    c.constr_2d, ...
                    c.constr_3d);

                c.fittedCurveTangent = fit_one_3d_curve_tangent( ...
                    obj.controlPts(c.pid, :), ...
                    c.constr_2d, ...
                    c.constr_3d);

                c.curve_length = compute_curve_length(c.fittedCurve);
                obj.curves = [obj.curves; c];

            end
        end

        function curve_length = return_unit_curve_length(obj, uid)
            if uid > length(obj.unit_curves)
                error('ERROR: exceed the number of unit curves')
            end

            % find the curves belong to this unit curve
            cids = [obj.curves.uid] == uid;
            curve_length = sum([obj.curves(cids).curve_length]);
        end

        function [pos, info] = sample_unit_curve(obj, uid, num_samples)
            if nargin < 3, num_samples = 100; end
            cids = find([obj.curves.uid] == uid);

            % make sure the sub-curves are sorted w.r.t. unit curve
            tmp = cell2mat({obj.curves(cids).t_range}');
            [~,idx] = sort(tmp(:,2));
            cids = cids(idx);

            pos = [] ;
            info = [];
            t = linspace(0,1,num_samples);
            for cid = reshape(cids, 1, [])
                pos = [pos;
                    obj.curves(cid).fittedCurve(t)];
                info = [info;
                    repmat(cid, length(t),1), t(:)];
            end
        end

        function [pos, pos_info] = uniform_sample_unit_curve(obj, uid, num_samples)
            if nargin < 3, num_samples = 7; end
            [x, info] = obj.sample_unit_curve(uid);
            xs = x(1:end-1,:);
            xe = x(2:end,:);
            cum_length = cumsum(sqrt(sum((xe - xs).^2,2)));
            pid = zeros(num_samples, 1);
            for ii = 1:num_samples
                pid(ii) = find(cum_length > cum_length(end)*ii/(num_samples+1),1);
            end
            pos = x(pid,:);
            pos_info = info(pid, :);
        end


        function n_3d = compute_normal_of_3D_curve(obj, cid, t)
            curve = obj.curves(cid);
            if det(curve.constr_2d) < 1e-9 %line segment
                tangent_2d = curve.constr_2d(1,:);
            else
                uc_2d = ControlledCurve( ...
                    obj.controlPts(curve.pid,1:2), ...
                    curve.constr_2d,...
                    []);
                tangent_2d = uc_2d(t);
            end
            tangent_2d = reshape( ...
                tangent_2d/norm(tangent_2d), ...
                1,[]);

            n_3d = cross([tangent_2d, 0], [0,0,1]);
        end


        function [] = plot_curves(obj,params)
            if nargin < 2, params = load_parameters(); end
            params.plane_height = obj.height;

            for ii = 1:length(obj.curves)
                curve = obj.curves(ii);

                Pos3D = obj.controlPts(curve.pid, :);
                constr_2d = curve.constr_2d;
                constr_3d = curve.constr_3d;
                pts = plot_curve_from_projections( ...
                    Pos3D, ...
                    constr_2d, ...
                    constr_3d, ...
                    params); hold on;

                all_P = compute_all_replicas(pts, ...
                    curve.rotational_symmetry, ...
                    curve.reflection_symmetry, ...
                    curve.reflection_point);

                all_P = all_P(:);
                for jj = 2:length(all_P)
                    p = all_P{jj};
                    plot3(p(:,1), p(:,2), p(:,3), ...
                        'Color', 'k', ...
                        'LineWidth',params.size_line);

                    if params.ifplot.projection
                        plot3(p(:,1), p(:,2), -params.project_offset*ones(size(p,1),1), ... ...
                            'Color', [0.5,0.5,0.5], ...
                            'LineWidth',params.size_line);
                    end
                end
            end


            if params.ifplot.decoration
                for jj = 1:length(obj.unit_curves)

                    % smaple the decorations
                    [pos, pos_info] = obj.uniform_sample_unit_curve(jj);


                    % for each sample, find the decoration plane
                    rect = [];
                    for ii = 1:size(pos,1)
                        p = pos(ii,:);
                        cid = pos_info(ii,1);
                        t = pos_info(ii,2);
                        n = obj.compute_normal_of_3D_curve(cid, t);
                        v = obj.curves(cid).fittedCurveTangent(t);
                        u = cross(n,v); u = u/norm(u);

                        rect_new = p + params.size_decor*[1,1;
                            1,-1;
                            -1,-1;
                            -1,1]*[u; n];
                        rect = [rect; rect_new];
                    end


                    all_P = compute_all_replicas(rect, ...
                        obj.unit_curves(jj).rotational_symmetry, ...
                        obj.unit_curves(jj).reflection_symmetry, ...
                        obj.unit_curves(jj).reflection_point);
                    all_P = all_P(:);

                    for kk = 1%:length(all_P)
                        p = all_P{kk};
                        for ii = 1:4:size(p,1)
                            fill3(p(ii:ii+3,1), p(ii:ii+3,2), p(ii:ii+3,3), ...
                                params.col_decor,...
                                'FaceAlpha',params.alpha_decor, ...
                                'EdgeColor',params.col_decor,'LineWidth',2);
                        end
                    end



                    %                     all_P = compute_all_replicas(pos, ...
                    %                         obj.unit_curves(jj).rotational_symmetry, ...
                    %                         obj.unit_curves(jj).reflection_symmetry, ...
                    %                         obj.unit_curves(jj).reflection_point);
                    %                     all_P = all_P(:);
                    %
                    %                     for kk = 1:length(all_P)
                    %                         p = all_P{kk};
                    %                         scatter3(p(:,1), p(:,2), p(:,3), ...
                    %                             params.size_point/2, ...
                    %                             params.col_decor, ...
                    %                             'filled');
                    %                     end
                end
            end

        end

    end
end


function [pid, P_new] = return_pid(pos, P)

[id, dis] = knnsearch(P(:, 1:length(pos)), pos);
if dis < 1e-6
    pid = id; P_new = P;
else

    P_new = [P; pos];
    pid = size(P_new, 1);
end

end

function t = initialize_constr_3d(label)
if label == 0
    t = [0, 1];
elseif label == 1
    t = [0, -2];
elseif label == 2
    t = [0.5,-0.5];
    t = [-1,0];

else % need to check
    t = [0,0];
end
end

function t = initialize_constr_3d_seg(labels)
t = zeros(2,2);
if isempty(find(labels == 2,1))
    if ~isempty(find(labels == 0, 1))
        t(labels == 0, :) = [0,1];
    end
    if ~isempty(find(labels == 1, 1))
        t(labels == 1, :) = [0,-2];
    end
else
    if ~isempty(find(labels == 1, 1))
        t(labels == 1, :) = [0,-0.8];
    end
    if ~isempty(find(labels == 2, 1))
        t(labels == 2, :) = [-0.5,0];
    end
end
end



function func = fit_one_3d_curve(Pos3D, constr_2d, constr_3d)
func = @(t)  tmp_fit_one_3d_curve(Pos3D, constr_2d, constr_3d, t);
end


% it is quite dumb I think
function p = tmp_fit_one_3d_curve(Pos3D, constr_2d, constr_3d, t)
uc_2d = ControlledCurve(Pos3D(:,1:2), ...
    constr_2d,...
    []);
uc_height = ControlledCurve([[0;1], Pos3D(:, 3)], ...
    constr_3d,...
    []);

x = uc_2d.fittedCurve(t);
y = uc_height.fittedCurve(t);
p = [x, y(:,2)];
end


function func = fit_one_3d_curve_tangent(Pos3D, constr_2d, constr_3d)
func = @(t)  tmp_fit_one_3d_curve_tangent(Pos3D, constr_2d, constr_3d, t);
end

% it is quite dumb I think
function tangent = tmp_fit_one_3d_curve_tangent(Pos3D, constr_2d, constr_3d, t)
uc_2d = ControlledCurve(Pos3D(:,1:2), ...
    constr_2d,...
    []);
uc_height = ControlledCurve([[0;1], Pos3D(:, 3)], ...
    constr_3d,...
    []);

x = uc_2d.fittedCurve(t);
y = uc_height.fittedCurve(t);
p = [x, y(:,2)];

curve_2d_len = compute_curve_length(uc_2d.fittedCurve, 100);
tx = uc_2d.fittedCurveTangent(t);
ty = uc_height.fittedCurveTangent(t);
u = [tx(:); 0];
u = u/norm(u)*curve_2d_len;
v = [0;0;1];
tangent = ty(1)*u + ty(2)*v;
tangent = reshape(tangent,1,[]);
end

function curve_length = compute_curve_length(func, num_samples)
if nargin < 2, num_samples = 100; end
t = linspace(0,1,num_samples);
x = func(t);
xs = x(1:end-1,:);
xe = x(2:end,:);
curve_length = sum(sqrt(sum((xe - xs).^2,2)));
end




