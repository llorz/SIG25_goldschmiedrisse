classdef CurveStructure < handle
  %CURVESTRUCTURE Construct a 3d curve structure
  % from the given set of unit curves (representing
  % top-view projection of the structure).
  
  properties
    unit_curves = [];
  end
  
  methods
    function obj = CurveStructure()
      
    end
    
    function obj = add_unit_curve(obj,curve)
      obj.unit_curves = [obj.unit_curves, curve];
    end
    
    
    function [] = plot_2D_projection(obj)
        for ii = 1:length(obj.unit_curves)
            plot(obj.unit_curves(ii)); hold on;
        end
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
    
  end
end

