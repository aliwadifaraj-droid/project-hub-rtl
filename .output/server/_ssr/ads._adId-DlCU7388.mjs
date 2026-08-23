import { j as jsxRuntimeExports } from "../_libs/react.mjs";

const SplitErrorComponent = ({
  error
}) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid min-h-screen place-items-center p-6 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-destructive", children: error.message }) });
export {
  SplitErrorComponent as errorComponent
};
