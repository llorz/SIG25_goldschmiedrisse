classdef SpaceCurve
    properties
        Pos3D % 2-by-3; 3D positions of the two endpoints
        tangent_floor % 2-by-2; 2D tangent vectors on the floor projection
        tangent_side % 2-by-2; 2D tangent vectors on the side/height projection
        fittedCurve
    end


    methods
        function obj = SpaceCurve(Pos3D, tangent_floor, tangent_side)
            obj.Pos3D = Pos3D;
            obj.tangent_floor = tangent_floor;
            obj.tangent_side = tangent_side;
            obj.fittedCurve = @(t) obj.return_3D_position(t);
        end


        function p = return_3D_position(obj, t)
            uc_2d = ControlledCurve(obj.Pos3D(:,1:2), ...
                obj.tangent_floor,...
                []);
            uc_height = ControlledCurve([[0;1], obj.Pos3D(:, 3)], ...
                obj.tangent_side,...
                []);

            x = uc_2d.fittedCurve(t);
            y = uc_height.fittedCurve(t);
            p = [x, y(:,2)];
        end


        function pos = sample_curve(obj, num_samples)
            if nargin < 2, num_samples = 100; end
            t = linspace(0,1,num_samples);
            pos = obj.fittedCurve(t);
        end


        function samples = plot(obj, num_samples)
            if nargin < 2, num_samples = 100; end
            samples = obj.sample_curve(num_samples);
            plot3(samples(:,1), samples(:,2), samples(:,3),...
                'LineWidth',5,'Color',[1,0,0]);
        end



        
    end

end