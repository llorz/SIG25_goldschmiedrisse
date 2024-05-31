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
                scatter(pts(:,1), pts(:,2),60,repmat(mycolor(1,:), size(pts,1),1), 'filled');
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
    idx = find(ratio > curr_t, 1);
    p1 = pts(idx-1, :);
    p2 = pts(idx,:);
    s = t - ratio(idx-1);
    y(ii, :) = (1-s)*p1 + s*p2;
end

end




function bezier_curve = fit_bezier_curve(p_start, p_end, t_start, t_end)
c1 = p_start + t_start;
c2 = p_end + t_end;

bezier_curve = @(t) ((1-t).^3 .* p_start' + 3*(1-t).^2 .* t .* c1' + 3*(1-t) .* t.^2 .* c2' + t.^3 .* p_end')';

end

