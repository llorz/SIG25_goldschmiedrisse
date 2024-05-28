classdef UnitCurve
  %UNTITLED2 Summary of this class goes here
  %   Detailed explanation goes here
  
  properties
    points;
    rotational_symmetry;
    reflection_symmetry;
  end
  
  methods
    function obj = UnitCurve(points, sym, ref_sym)
      arguments
        points (:, 2) double
        sym = 4
        ref_sym = true
      end
      obj.points = points;
      obj.rotational_symmetry = sym;
      obj.reflection_symmetry = ref_sym;
    end
    
    function res = calculate_repeat_intersections(obj, mat)
      % Check whether there's an intersection between pts
      % and mat * pts.
      res = [];
      for i = 1 : size(obj.points, 1) - 1
        p1 = obj.points(i, :)';
        p2 = obj.points(i + 1, :)';
        p1_new = mat * p1;
        p2_new = mat * p2;
        % Check if the line segments intersect (at the same time).
        t = (p2_new - p2) ./ (p1 - p2 - p1_new + p2_new);
        if (norm(t(1) - t(2)) < 1e-6) && (t(1) >= 0) && (t(1) <= 1)
          res = [res; t(1), i];
        end
      end
    end
    
    function res = calculate_intersections(obj)
      res = [];
      for i = 1 : obj.rotational_symmetry
        mat = obj.get_transformation_mat(i, false);
        res = [res; obj.calculate_repeat_intersections(mat)];
        if obj.reflection_symmetry
          mat = obj.get_transformation_mat(i, true);
          res = [res; obj.calculate_repeat_intersections(mat)];
        end
      end
    end
    
    
    function mat = get_transformation_mat(obj, rot_rep, reflected)
      ang = 2 * pi / obj.rotational_symmetry;
      mat = [cos(ang), -sin(ang);sin(ang), cos(ang)]^rot_rep;
      if ~reflected
        return;
      end
      p1 = normc(obj.points(1,:)');
      ref_mat = eye(2) - 2 * (p1 * p1');
      mat = mat * ref_mat;
    end
    
    function coefs = get_lift_poly_coefficients(obj)
      res = calculate_intersections(obj);
      t = res(1);
      A = [
        % f(1) = 1.
        1, 1, 1;
        % f'(1) = 0.
        2, 3, 4;
        % f''(t) = 0.
        2, 6*t, 12*t^2;
        ];
      b = [1; 0; 0];
      coefs = [A \ b];
    end
    
  end
end

