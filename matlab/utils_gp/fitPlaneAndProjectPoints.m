function [X_proj, planeNormal, planePoint] = fitPlaneAndProjectPoints(X)
    % X is an Nx3 matrix where each row is a 3D point (x, y, z)
    
    % Compute the centroid of the point cloud
    centroid = mean(X, 1);
    
    % Center the points by subtracting the centroid
    X_centered = X - centroid;
    
    % Perform Singular Value Decomposition (SVD)
    [~, ~, V] = svd(X_centered, 'econ');
    
    % The normal to the best fitting plane is the last column of V
    planeNormal = V(:, end);
    
    % The point on the plane is the centroid of the points
    planePoint = centroid;
    
    % Project points onto the plane
    X_proj = X - (X_centered * planeNormal) * planeNormal';

end

