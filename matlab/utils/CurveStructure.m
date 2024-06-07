classdef CurveStructure < handle
    %CURVESTRUCTURE Construct a 3d curve structure
    % from the given set of unit curves (representing
    % top-view projection of the structure).

    properties
        unit_curves = [];
        name
    end

    methods
        function obj = CurveStructure(name)
            if nargin < 1
                name = '';
            end
            obj.name = name;
        end


        function obj = add_unit_curve(obj,curve)
            obj.unit_curves = [obj.unit_curves, curve];
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

