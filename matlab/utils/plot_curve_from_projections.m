function [p] = plot_curve_from_projections(Pos3D, ...
    constr_2d, ...
    constr_3d, ...
    params)

if nargin < 4, params = load_parameters(); end


uc_2d = ControlledCurve(Pos3D(:,1:2), ...
    constr_2d,...
    []);
uc_height = ControlledCurve([[0;1], Pos3D(:, 3)], ...
    constr_3d,...
    []);

t = linspace(0,1,params.num_samples);
x = uc_2d.fittedCurve(t);
y = uc_height.fittedCurve(t);
p = [x, y(:,2)];
cp = [p(1,:); p(end,:)];

if params.ifplot.curve
    % plot the 3D curve (rasterized)
    plot3(p(:,1), p(:,2), p(:,3), ...
        'Color',params.col_curve, ...
        'LineWidth',params.size_line);
    axis equal; hold on


    if params.ifplot.projection
        % plot the 2D projection (rasterized);
        plot3(p(:,1), ...
            p(:,2), ...
            -params.project_offset*ones(params.num_samples,1), ...
            'Color', params.col_curve, ...
            'LineStyle',params.linestyle_2D, ...
            'LineWidth', params.size_line);

    end

    % compute curve length
    xs = x(1:end-1,:);
    xe = x(2:end,:);
    curve_2d_len = sum(sqrt(sum((xe - xs).^2,2)));



    % plot the curve plane
    x1 = [x, zeros(size(x,1),1)];
    x2 = [x, params.plane_height*ones(size(x,1),1)];
    for jj = 1:size(x1,1) - 1
        rect = [x1(jj:jj+1,:);
            x2(jj+1:-1:jj,:)];
        fill3(rect(:,1), rect(:,2), rect(:,3), ...
            params.col_plane, ...
            'FaceAlpha', params.alpha_plane, ...
            'EdgeColor','none');  hold on;
    end

    if params.ifplot.projection
        % plot the floor plane
        bb = params.floor_size;
        rect = [bb,bb; bb,-bb; -bb,-bb; -bb, bb];
        fill3(rect(:,1), rect(:,2), -params.project_offset*ones(4,1),...
            params.col_floor, ...
            'FaceAlpha', params.alpha_plane, ...
            'EdgeColor','none');  hold on;
    end

    if params.ifplot.intersection
        % plot control points in 3D
        scatter3(cp(:,1), cp(:,2), cp(:,3), ...
            params.size_point, params.col_point,'filled');
    end

    if params.ifplot.handles
        % plot control handles on 3D
        for kk = 1:2
            p_start = Pos3D(kk, :);
            u = [constr_2d(kk,:),0];
            u = u/norm(u);
            u = u*curve_2d_len;

            if constr_2d(kk,:)*(Pos3D(2,1:2)-Pos3D(1,1:2))' < 0
                u = -u;
            end

            v = [0,0,1];
            t_start = constr_3d(kk,1)*u + constr_3d(kk,2)*v;
            p_end = p_start + t_start;
            handle = [p_start; p_end];
            plot3(handle(:,1), handle(:,2), handle(:,3), ...
                'Color', params.col_handle(kk,:), ...
                'LineWidth',params.size_handle)
            scatter3(p_end(1), p_end(2), p_end(3), ...
                params.size_point*0.8, params.col_handle(kk,:), 'filled')
        end

    end

    if params.ifplot.intersection
        % plot control points in 2D
        scatter3(cp(:,1), ...
            cp(:,2), ...
            -params.project_offset*ones(size(cp,1),1), ...
            params.size_point, params.col_point,'filled');
    end

    if params.ifplot.handles
        % plot control handles on 2D projection
        for kk = 1:2
            p_start = Pos3D(kk, 1:2);
            t_start = constr_2d(kk,:);
            p_end = p_start + t_start;
            handle = [p_start; p_end];
            plot3(handle(:,1), handle(:,2), -params.project_offset*ones(2,1), ...
                'Color', params.col_handle(kk,:), ...
                'LineWidth',params.size_handle)
            scatter3(p_end(1), p_end(2), -params.project_offset, ...
                params.size_point*0.8, params.col_handle(kk,:), 'filled')
        end
    end
end

end