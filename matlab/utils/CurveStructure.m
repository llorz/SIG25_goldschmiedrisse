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
                % add the intersecting point to the control points
                obj.controlPts(end+1, :) = [curve.unit_controlledCurve.fittedCurve(curve.p_t), curve.p_t*height];
                obj.controlPts_label(end+1) = curve.p_label;
                num = size(obj.controlPts,1);

                % split the original curve into two
                %
                % input curve is a line segment

                % curve1: first anchor <-> intersecting point
                c1 = c_init;
                c1.pid = [pid1,num];

                % curve2: intersecting point <-> second anchor
                c2 = c_init;
                c2.pid = [num, pid2];

                if isempty(curve.unit_controlledCurve.anchor_constraints)
                    p1 = obj.controlPts(pid1,1:2);
                    p2 = obj.controlPts(pid2,1:2);
                    pmid = obj.controlPts(num, 1:2);
                    % use line segment directions as tangent
                    c1.constr_2d = 0.2*[pmid-p1;
                        p1-pmid];
                    c2.constr_2d = 0.2*[p2-pmid;
                        pmid-p2];
                else
                    bz_cont = [curve.unit_controlledCurve.anchor;
                        curve.unit_controlledCurve.anchor_constraints];
                    [split1_cont, split2_cont] = split_bezier_curve(bz_cont, curve.p_t, true);
                    c1.constr_2d = split1_cont(3:4,:);
                    c2.constr_2d = split2_cont(3:4,:);
                end

                p = obj.controlPts;
                % initialize the tangents for the height curve
                if obj.controlPts_label(pid1) == 0 && obj.controlPts_label(pid2) == 1
                    c1.constr_3d = [0, 2*a;
                        -a, 0];

                    c2.constr_3d = [a, 0;
                        0, -a];
                end

                if obj.controlPts_label(pid1) == 1 && obj.controlPts_label(pid2) == 0
                    c1.constr_3d = [0,-a;
                        a, 0];
                    c2.constr_3d = [-a,0;
                        0, 2];
                end


                obj.curves = [obj.curves; c1; c2];

                %                 else
                %
                %                 end


            else % there is no intersection
                c = c_init;
                c.pid = [pid1, pid2];
                c.constr_2d = curve.unit_controlledCurve.anchor_constraints;
                c.constr_3d = []; % TODO: need to check here
                obj.curves = [obj.curves; c];
            end

        end


        function [] = plot_curves(obj)
            % parameters
            plane_height = 1;
            project_offset = 0.1;
            col_curve = [0,0,0];
            col_plane = [162,210,255]/255;
            col_point = [239,35,60]/255;
            alpha_plane = 0.2;
            size_line = 2;
            size_point = 50;
            num_samples = 100;





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

