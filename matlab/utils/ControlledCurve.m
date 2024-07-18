classdef ControlledCurve
    % like the pen tool in illustrator
    % we can fit a curve based on the input anchor points
    % only take two points

    properties
        anchor
        anchor_label
        anchor_constraints % two points per anchor to specify the left/right curvatures
        fittedCurve
        fittedCurveTangent
        rasterizedCurve
    end

    methods
        function obj = ControlledCurve(anchor, anchor_constraints, anchor_label)
            obj.anchor = anchor;
            obj.anchor_constraints = anchor_constraints;
            obj.anchor_label = anchor_label;
            obj = obj.fit_the_curve();
        end


        function obj = fit_the_curve(obj)
            if isempty(obj.anchor_constraints)
                % basically we get line segments
                obj.fittedCurve = @(t) obj.anchor(1,:) + t'*(obj.anchor(2,:) - obj.anchor(1,:));
                obj.fittedCurveTangent = obj.anchor(2,:) - obj.anchor(1,:);
            else
                [obj.fittedCurve, obj.fittedCurveTangent] = fit_bezier_curve(obj.anchor(1,:), obj.anchor(2,:), obj.anchor_constraints(1,:), obj.anchor_constraints(2,:));
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



        % need to update the curve
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



