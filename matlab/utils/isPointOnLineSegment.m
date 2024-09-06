function isOnSegment = isPointOnLineSegment(A, B, C)
    % A, B, and C are 1x2 vectors representing the points [x, y]
    
    % Extract coordinates
    Ax = A(1); Ay = A(2);
    Bx = B(1); By = B(2);
    Cx = C(1); Cy = C(2);
    
    % Check if C is collinear with A and B
    % This can be checked using the area of the triangle formed by A, B, C.
    % If the area is 0, the points are collinear.
    collinear = abs((By - Ay) * (Cx - Ax) - (Cy - Ay) * (Bx - Ax)) < 1e-6;
    
    if ~collinear
        isOnSegment = false;
        return;
    end
    
    % Check if C lies within the bounding box of A and B
    withinXBounds = (Cx >= min(Ax, Bx)) && (Cx <= max(Ax, Bx));
    withinYBounds = (Cy >= min(Ay, By)) && (Cy <= max(Ay, By));
    
    isOnSegment = withinXBounds && withinYBounds;
end

