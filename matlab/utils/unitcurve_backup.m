anchor = curve.unit_controlledCurve.anchor;
            height = norm(anchor(1,:) - anchor(2,:));
            a = obj.weight_curly*height;


            if isempty(obj.controlPts)
                % initialize the height to zero
                obj.controlPts = [anchor, zeros(2,1)];
                obj.controlPts_label = [curve.unit_controlledCurve.anchor_label];
                % set height of the peak point
                obj.controlPts(obj.controlPts_label == 1) = height;
                pid1 = 1; % vtxID of the anchors in controlPts
                pid2 = 2;
            else
                pid1 = 1; 
                pid2 = 2;
                
            end

            if ~isempty(curve.p_t)
                % add the intersecting point to the control points
                obj.controlPts(end+1, :) = [curve.unit_controlledCurve.fittedCurve(curve.p_t), curve.p_t*height];
                num = size(obj.controlPts,1);

                % split the original curve into two
                if isempty(curve.unit_controlledCurve.anchor_constraints)
                    % input curve is a line segment

                    % curve1: first anchor <-> intersecting point
                    c1 = struct();
                    c1.pid = [pid1,num];
                    c1.constr_2d = []; % for line segments no tangent constraints


                    % curve2: intersecting point <-> second anchor
                    c2 = struct();
                    c2.pid = [num, pid2];
                    c2.constr_2d = [];

                    % initialize the tangents for the height curve
                    if obj.controlPts_label(pid1) == 0 && obj.controlPts_label(pid2) == 1
                        c1.constr_3d = [0,a;
                            -a, 0];
                        c2.constr_3d = [a,0;
                            0, -a];
                    end

                    if obj.controlPts_label(pid1) == 1 && obj.controlPts_label(pid2) == 0
                        c1.constr_3d = [0,-a;
                            a, 0];
                        c2.constr_3d = [-a,0;
                            0, a];
                    end


                    obj.curves = [obj.curves; c1; c2];

                    

                else % there is no intersection
                    c = struc();
                    c.pid = [pid1, pid2];
                    c.constr_2d = curve.unit_controlledCurve.anchor_constraints;
                    c.constr_3d = []; % TODO: need to check here
                    obj.curves = [obj.curves; c];
                end

            else

            end