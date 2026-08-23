var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
function clamp(value, [min, max]) {
  return Math.min(max, Math.max(min, value));
}
__name(clamp, "clamp");
export {
  clamp as c
};
