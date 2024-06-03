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
                % todo: make it curly
            end
        end


        function obj = rasterize_the_curve(obj,num_samples)
            if isempty(obj.anchor_constraints)
                obj.rasterizedCurve = [obj.anchor, zeros(size(obj.anchor,1),1)];
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

        function [] = plot(obj)
            plot3(obj.rasterizedCurve(:,1), obj.rasterizedCurve(:,2), obj.rasterizedCurve(:,3), 'black', LineStyle='-', LineWidth=2); hold on;
            view([0,90]);
            mycolor = lines(10);
            l = unique(obj.anchor_label);
            for i = 1
                pts = obj.anchor(obj.anchor_label == l(i), :);
                scatter(pts(:,1), pts(:,2),60,repmat(mycolor(i,:), size(pts,1),1), 'filled');
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

