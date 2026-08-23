import { r as reactExports } from "./react.mjs";
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
function usePrevious(value) {
  const ref = reactExports.useRef({ value, previous: value });
  return reactExports.useMemo(() => {
    if (ref.current.value !== value) {
      ref.current.previous = ref.current.value;
      ref.current.value = value;
    }
    return ref.current.previous;
  }, [value]);
}
__name(usePrevious, "usePrevious");
export {
  usePrevious as u
};
