p_t % time step of the intersecting point
        p_label



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

mycolor = lines(100);

                    % plot self-intersections
%             if isempty(obj.p_t)
%                 pts = obj.unit_controlledCurve.anchor;
%                 label = obj.unit_controlledCurve.anchor_label(:);
%             else
%                 pts = [obj.unit_controlledCurve.anchor;
%                     obj.unit_controlledCurve.fittedCurve(obj.p_t)];
%                 pts % debug
%                 label = [obj.unit_controlledCurve.anchor_label(:); obj.p_label(:)];
%             end
%             scatter(pts(:,1), pts(:,2),100, mycolor(label+1,:),'filled');
