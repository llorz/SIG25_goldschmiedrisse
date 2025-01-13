

export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

export function clamp01(val) {
  return clamp(val, 0, 1);
}

export function clamp11(val) {
  return clamp(val, -1, 1);
}

export function clamp0(val) {
  return Math.max(val, 0);
}