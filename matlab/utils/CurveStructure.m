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
        curves

        weight_curly
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
            obj.weight_curly = 0.3;

        end


        function obj = add_unit_curve(obj,curve)
            obj.unit_curves = [obj.unit_curves, curve];
            anchor = curve.unit_controlledCurve.anchor;
            height = norm(anchor(1,:) - anchor(2,:));
            a = obj.weight_curly*height;
            c_init = struct();
            c_init.rotational_symmetry = curve.rotational_symmetry;
            c_init.reflection_symmetry = curve.reflection_symmetry;
            c_init.reflection_point = curve.reflection_point;

            if isempty(obj.controlPts)
                % initialize the height to zero
                obj.controlPts = [anchor, zeros(2,1)];
                obj.controlPts_label = [curve.unit_controlledCurve.anchor_label];
                % set height of the peak point
                obj.controlPts(obj.controlPts_label == 1,3) = height;
                pid1 = 1; % vtxID of the anchors in controlPts
                pid2 = 2;
            else
                pid1 = 1;
                pid2 = 2;

            end
            if ~isempty(curve.p_t)

                [~,idx] = sort(curve.p_t);
                curve.p_t = curve.p_t(idx);
                curve.p_label = curve.p_label(idx);

                constr_2d = curve.unit_controlledCurve.anchor_constraints;
                constr_3d = [0, 0.5*height; 0,-0.75*height];

                % original curve
                bc_2d = [obj.controlPts([pid1, pid2],1:2); constr_2d];
                tmp = [[0;1], obj.controlPts([pid1, pid2], 3)];
                bc_3d = [tmp; constr_3d];

                splited_curve_2d = split_bezier_curve(bc_2d, curve.p_t, false);
                splited_curve_3d = split_bezier_curve(bc_3d, curve.p_t, false);

                for ii = 1:length(splited_curve_2d)
                    c2d = splited_curve_2d{ii};
                    c3d = splited_curve_3d{ii};

                    p1 = [c2d(1,:), c3d(1,2)];
                    p2 = [c2d(2,:), c3d(2,2)];
                    [p1_id, obj.controlPts] = return_pid(p1, obj.controlPts);
                    [p2_id, obj.controlPts] = return_pid(p2, obj.controlPts);

                    c = c_init;
                    c.pid = [p1_id, p2_id];

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

                    obj.curves = [obj.curves; c];

                end

            else % there is no intersection
                c = c_init;
                c.pid = [pid1, pid2];
                c.constr_2d = curve.unit_controlledCurve.anchor_constraints;
                c.constr_3d = []; % TODO: need to check here
                obj.curves = [obj.curves; c];
            end
        end




        function [] = plot_curves(obj,params)
            if nargin < 2, params = load_parameters(); end

            for ii = 1:length(obj.curves)
                curve = obj.curves(ii);

                Pos3D = obj.controlPts(curve.pid, :);
                constr_2d = curve.constr_2d;
                constr_3d = curve.constr_3d;
                pts = plot_curve_from_projections(Pos3D, constr_2d, constr_3d, ...
                    params, true); hold on;

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

                    plot3(p(:,1), p(:,2), -params.project_offset*ones(size(p,1),1), ... ...
                        'Color', [0.5,0.5,0.5], ...
                        'LineWidth',params.size_line);
                end
            end
        end


        function [] = plot_2D_projection(obj)
            mycolor = lines(10);
            notes = [obj.name, ' : '];
            for ii = 1:length(obj.unit_curves)
                uc = obj.unit_curves(ii);
                plot(uc, mycolor(ii+1,:)); hold on;
                notes = [notes, ...
                    sprintf('%s{%f %f %f}{%s %d %s %d, %d}%s', '\color[rgb]', ...
                    mycolor(ii+1,:), ...
                    'uc', ...
                    ii, '(', ...
                    uc.rotational_symmetry, ...
                    uc.reflection_symmetry, '); ')];
            end
            title(notes, 'Interpreter','tex');
        end

        function [] = plot_3D_structure(obj)
            mycolor = lines(10);
            notes = [obj.name, ' : '];
            for ii = 1:length(obj.unit_curves)
                uc = obj.unit_curves(ii);
                curve_3d = embed_in_3D(uc);
                pts = curve_3d();
                ref_mat = uc.get_reflection_mat();
                rot_mat = uc.get_rotation_mat(1);
                for i = 1 : uc.rotational_symmetry
                    mat = rot_mat^i;
                    rot_pts = [pts(:, 1:2) * mat', pts(:, 3)];
                    plot3(rot_pts(:, 1), rot_pts(:, 2), rot_pts(:, 3), 'Color', mycolor(ii+1,:),'LineWidth',2); hold on;
                    if uc.reflection_symmetry
                        mat = mat * ref_mat;
                        rot_pts = [pts(:, 1:2) * mat', pts(:, 3)];
                        plot3(rot_pts(:, 1), rot_pts(:, 2), rot_pts(:, 3), 'Color', mycolor(ii+1,:), 'LineWidth',2);
                    end
                end
            end
            axis equal; axis off;
        end



        function obj = plot(obj, lifted)
            if ~exist('lifted', 'var')
                lifted = false;
            end

            axis equal;
            hold on;
            for i = 1 : length(obj.unit_curves)
                rot_sym = obj.unit_curves(i).rotational_symmetry;
                ang = 2 * pi / rot_sym;
                rot_mat = [cos(ang), -sin(ang);sin(ang), cos(ang)];
                %         p1 = normc(obj.unit_curves(i).points(1,:)');
                p1 = obj.unit_curves(i).points(1,:)';
                p1 = p1/norm(p1);
                ref_mat = eye(2) - 2 * (p1 * p1');

                % Calculate intersections.
                intersections = obj.unit_curves(i).calculate_intersections();
                pts1 = obj.unit_curves(i).points(intersections(:,2),:)';
                pts2 = obj.unit_curves(i).points(intersections(:,2) + 1,:)';
                intersection_points = pts1 + (pts2 - pts1) .* intersections(:,1)';

                orig_points = obj.unit_curves(i).points';
                if lifted
                    coefs = obj.unit_curves(i).get_lift_poly_coefficients();
                    t = linspace(0, 1, 100);
                    y = coefs(1) * t.^2 + coefs(2) * t.^3 + coefs(3) * t.^4;
                    orig_points = orig_points(:,1) * y + orig_points(:, 2) * (1 - y);
                else
                    t = zeros(1, size(orig_points, 2));
                end

                for j = 0 : rot_sym - 1
                    pts = (rot_mat^j) * orig_points;
                    plot3(pts(1,:), pts(2,:), t);
                    scatter3(pts(1,1), pts(2,1), 0);
                    % Draw reflection if reflection symmetry is enabled.
                    if obj.unit_curves(i).reflection_symmetry
                        pts = (rot_mat^j) * ref_mat * orig_points;

                        plot3(pts(1,:), pts(2,:), t);
                    end

                    % Draw the intersections.
                    inter = (rot_mat^j) * intersection_points;
                    scatter3(inter(1,:), inter(2,:), zeros(size(inter(2,:))),'filled');
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

