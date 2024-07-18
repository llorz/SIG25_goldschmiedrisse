classdef UnitCurve
    %unit curve in the 2D drawing

    properties
        unit_controlledCurve;
        rotational_symmetry;
        reflection_symmetry;
        reflection_point;
        all_controlledCurve;
        p_t % time step of the intersecting point
        p_label
    end

    methods
        function obj = UnitCurve(controlledCurve, sym, ref_sym, reflect_pid)
            obj.unit_controlledCurve = controlledCurve;
            obj.rotational_symmetry = sym;
            obj.reflection_symmetry = ref_sym;
            if nargin < 4
                reflect_pid = controlledCurve.return_ground_pid();
            end
            if length(reflect_pid) == 1 && reflect_pid <= size(controlledCurve.anchor,1)
                obj.reflection_point = controlledCurve.anchor(reflect_pid, :)';
            elseif length(reflect_pid) == 2
                obj.reflection_point = reflect_pid;
            end

            obj = obj.complete_curves_wrt_symmetry();
            obj = obj.find_self_intersections();

        end

        function mat = get_rotation_mat(obj, rot_rep)
            ang = 2 * pi / obj.rotational_symmetry;
            mat = [cos(ang), -sin(ang);sin(ang), cos(ang)]^rot_rep;
        end

        function ref_mat = get_reflection_mat(obj)
            p = reshape(obj.reflection_point,[],1);
            p = p/norm(p);
            ref_mat = 2 * (p * p') - eye(2);
        end


        function obj = complete_curves_wrt_symmetry(obj)

            ini_curve = obj.unit_controlledCurve;
            all_curves = [];

            if obj.reflection_symmetry
                ref_mat = obj.get_reflection_mat();
            end

            for ii = obj.rotational_symmetry:-1:1 % the first one in all_curves is the unit
                mat = obj.get_rotation_mat(ii);
                if isempty(ini_curve.anchor_constraints)
                    rotated_curve = ControlledCurve(ini_curve.anchor * mat', ...
                        [], ini_curve.anchor_label);
                else
                    rotated_curve = ControlledCurve(ini_curve.anchor * mat', ...
                        ini_curve.anchor_constraints * mat', ini_curve.anchor_label);
                end
                all_curves = [all_curves; rotated_curve];

                if obj.reflection_symmetry
                    if isempty(ini_curve.anchor_constraints)
                        reflected_curve = ControlledCurve(ini_curve.anchor *  ref_mat' * mat', ...
                            [], ini_curve.anchor_label);
                    else
                        reflected_curve = ControlledCurve(ini_curve.anchor *  ref_mat' * mat', ...
                            ini_curve.anchor_constraints * ref_mat' * mat', ini_curve.anchor_label);
                    end
                    all_curves = [all_curves; reflected_curve];
                end
            end
            obj.all_controlledCurve = all_curves;
        end

        function obj = find_self_intersections(obj)

            pts_t = []; label = [];

            uc1 = obj.all_controlledCurve(1);
            for ii = 2:length(obj.all_controlledCurve)
                uc2 = obj.all_controlledCurve(ii);
                [tmp_t, tmp_p_label] = find_intersections_controlled_curves(uc1, uc2);
                if ~isempty(tmp_t)
                    pts_t = [pts_t; tmp_t];
                    label = [label(:); tmp_p_label(:)];
                end
            end
            obj.p_t = pts_t;
            obj.p_label = label;
        end


        function [] = plot(obj, unit_col)
            if nargin < 2
                unit_col = [1,0,0];
            end
            mycolor = lines(100);
            all_curves = obj.all_controlledCurve;
            plot(all_curves(1), unit_col); hold on;
            for ii = 2:length(all_curves)
                plot(all_curves(ii)); hold on;
            end

            if isempty(obj.p_t)
                pts = obj.unit_controlledCurve.anchor;
                label = obj.unit_controlledCurve.anchor_label(:);
            else
                pts = [obj.unit_controlledCurve.anchor;
                    obj.unit_controlledCurve.fittedCurve(obj.p_t)];
                label = [obj.unit_controlledCurve.anchor_label(:); obj.p_label(:)];
            end
            scatter(pts(:,1), pts(:,2),100, mycolor(label+1,:),'filled');

            axis equal; axis off;
        end

    end
end


