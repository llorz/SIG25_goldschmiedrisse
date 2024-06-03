function res = eval_cubic_bezier(t, coefs)
  if size(coefs, 1) == 1
    coefs = reshape(coefs, 2, 4)';
  end
  res = zeros(length(t), 2);
  for i = 1 : length(t)
    res(i, :) = coefs(1, :) * (1 - t(i))^3 + ...
      3 * coefs(2, :) * t(i) * (1 - t(i))^2 + ...
      3 * coefs(3, :) * t(i)^2 * (1 - t(i)) + ...
      coefs(4, :) * t(i)^3;
  end
end