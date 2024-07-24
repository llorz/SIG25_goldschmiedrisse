classdef ControlledCurve
    % like the pen tool in illustrator
    % we can fit a curve based on the input anchor points

    properties
        anchor
        anchor_label
        anchor_constraints % two points per anchor to specify the left/right curvatures
        num_anchor
        fittedCurve
        rasterizedCurve
    end

    methods
        function obj = ControlledCurve(anchor, anchor_constraints, anchor_label)
            obj.anchor = anchor;
            obj.anchor_constraints = anchor_constraints;
            obj.anchor_label = anchor_label;
            obj.num_anchor = size(obj.anchor,1);
            obj = obj.fit_the_curve();

            if isempty(anchor_constraints)
                obj = obj.rasterize_the_curve();
            end
        end


        function obj = fit_the_curve(obj)
            if isempty(obj.anchor_constraints)
                % basically we get line segments
                obj.fittedCurve = @(t)line_segments_with_arc_length(obj.anchor, t);
            else
               if size(obj.anchor,1)  == 2
                   obj.fittedCurve = fit_bezier_curve(obj.anchor(1,:), obj.anchor(2,:), obj.anchor_constraints(1,:), obj.anchor_constraints(2,:));
               else
                   % todo: not clear how to parameterize using arc length
               end
            end
        end


        function obj = rasterize_the_curve(obj,num_samples)
            if isempty(obj.anchor_constraints)
                obj.rasterizedCurve = obj.anchor;
            else
                t = linspace(0, 1, num_samples);
                obj.rasterizedCurve = obj.fittedCurve(t);
            end
        end

        function pid = return_ground_pid(obj)
            pid = find(obj.anchor_label == 0);
        end

        function p = return_ground_point(obj)
            p = obj.anchor(obj.return_ground_pid(), :);
        end

        function [] = plot(obj, rgbcol)
            if nargin < 2
                rgbcol = [0,0,0];
            end
            if isempty(obj.rasterizedCurve)
                obj = obj.rasterize_the_curve(100);
            end
            plot(obj.rasterizedCurve(:,1), obj.rasterizedCurve(:,2),'Color', rgbcol, LineStyle='-', LineWidth=2); hold on;
            mycolor = lines(10);
            pts = obj.return_ground_point();
            if ~isempty(pts)
                scatter(pts(:,1), pts(:,2),100,repmat(mycolor(1,:), size(pts,1),1), 'filled');
            end
   
        end
    end
end


% parametrize the connected line segments using acr length t
function y = line_segments_with_arc_length(pts,t)
num = size(pts, 1);
seg_length = zeros(num-1,1);
for i = 1:num-1
    p1 = pts(i, :);
    p2 = pts(i+1, :);
    seg_length(i) = norm(p2 - p1);
end

total_length = sum(seg_length);
ratio = [0; cumsum(seg_length) / total_length];

y = zeros(length(t), size(pts,2));
for ii = 1:length(t)
    curr_t = t(ii);
    idx = find(ratio > curr_t-1e-12, 1);
    p1 = pts(idx-1, :);
    p2 = pts(idx,:);
    s = t - ratio(idx-1);
    y(ii, :) = (1-s).*p1 + s.*p2;
end

end




function bezier_curve = fit_bezier_curve(p_start, p_end, t_start, t_end)
c1 = p_start + t_start;
c2 = p_end + t_end;

bezier_curve = @(t) ((1-t).^3 .* p_start' + 3*(1-t).^2 .* t .* c1' + 3*(1-t) .* t.^2 .* c2' + t.^3 .* p_end')';

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