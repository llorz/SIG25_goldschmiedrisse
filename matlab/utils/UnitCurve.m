classdef UnitCurve
    %UNTITLED2 Summary of this class goes here
    %   Detailed explanation goes here

    properties
        unit_controlledCurve;
        rotational_symmetry;
        reflection_symmetry;
        all_controlledCurve;
    end

    methods
        function obj = UnitCurve(controlledCurve, sym, ref_sym)
            obj.unit_controlledCurve = controlledCurve;
            obj.rotational_symmetry = sym;
            obj.reflection_symmetry = ref_sym;
            obj = obj.complete_curves_wrt_symmetry();
        end

        function mat = get_rotation_mat(obj, rot_rep)
            ang = 2 * pi / obj.rotational_symmetry;
            mat = [cos(ang), -sin(ang);sin(ang), cos(ang)]^rot_rep;
        end

        function ref_mat = get_reflection_mat(obj)
            p = obj.unit_controlledCurve.return_ground_point()';
            p = p/norm(p);
            ref_mat = 2 * (p * p') - eye(2);
        end


        function obj = complete_curves_wrt_symmetry(obj)

            ini_curve = obj.unit_controlledCurve;
            all_curves = [];

            if obj.reflection_symmetry
                ref_mat = obj.get_reflection_mat();
            end

            for ii = 1:obj.rotational_symmetry
                mat = obj.get_rotation_mat(ii);
                rotated_curve = ControlledCurve(ini_curve.anchor * mat', ...
                    ini_curve.anchor_constraints, ini_curve.anchor_label);
                all_curves = [all_curves; rotated_curve];
                if obj.reflection_symmetry
                    reflected_curve = ControlledCurve(ini_curve.anchor *  ref_mat' * mat', ...
                        ini_curve.anchor_constraints, ini_curve.anchor_label);
                    all_curves = [all_curves; reflected_curve];
                end
            end
            obj.all_controlledCurve = all_curves;
        end



        function [] = plot(obj)
            all_curves = obj.all_controlledCurve;
            for ii = 1:length(all_curves)
                plot(all_curves(ii)); hold on;
            end
            axis equal; axis off;
        end

    end
end


