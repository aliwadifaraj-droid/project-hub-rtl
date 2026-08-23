import { P as Pu, h as html } from "./prettier.mjs";
import { c as convert } from "./html-to-text.mjs";
import { j as jsxRuntimeExports, r as reactExports, R as React } from "./react.mjs";
function getHtmlNode(path) {
  const topNode = path.node;
  if (topNode) return topNode;
  return path.stack?.[path.stack.length - 1];
}
function recursivelyMapDoc(doc, callback) {
  if (Array.isArray(doc)) return doc.map((innerDoc) => recursivelyMapDoc(innerDoc, callback));
  if (typeof doc === "object") {
    if (doc.type === "line") return callback(doc.soft ? "" : " ");
    if (doc.type === "group") return {
      ...doc,
      contents: recursivelyMapDoc(doc.contents, callback),
      expandedStates: recursivelyMapDoc(doc.expandedStates, callback)
    };
    if ("contents" in doc) return {
      ...doc,
      contents: recursivelyMapDoc(doc.contents, callback)
    };
    if ("parts" in doc) return {
      ...doc,
      parts: recursivelyMapDoc(doc.parts, callback)
    };
    if (doc.type === "if-break") return {
      ...doc,
      breakContents: recursivelyMapDoc(doc.breakContents, callback),
      flatContents: recursivelyMapDoc(doc.flatContents, callback)
    };
    const nextDoc = { ...doc };
    for (const [key, value] of Object.entries(nextDoc)) if (value && typeof value === "object") nextDoc[key] = recursivelyMapDoc(value, callback);
    return nextDoc;
  }
  return callback(doc);
}
const modifiedHtml = { ...html };
if (modifiedHtml.printers) {
  const previousPrint = modifiedHtml.printers.html.print;
  modifiedHtml.printers.html.print = (path, options, print, args) => {
    const node = getHtmlNode(path);
    const rawPrintingResult = previousPrint(path, options, print, args);
    if (node?.type === "ieConditionalComment" || node?.kind === "ieConditionalComment") return recursivelyMapDoc(rawPrintingResult, (doc) => {
      if (typeof doc === "object" && doc.type === "line") return doc.soft ? "" : " ";
      return doc;
    });
    return rawPrintingResult;
  };
}
const defaults = {
  endOfLine: "lf",
  tabWidth: 2,
  plugins: [modifiedHtml],
  bracketSameLine: true,
  parser: "html"
};
const pretty = (str, options = {}) => {
  return Pu(str.replaceAll("\0", ""), {
    ...defaults,
    ...options
  });
};
const plainTextSelectors = [
  {
    selector: "img",
    format: "skip"
  },
  {
    selector: "[data-skip-in-text=true]",
    format: "skip"
  },
  {
    selector: "a",
    options: {
      linkBrackets: false,
      hideLinkHrefIfSameAsText: true
    }
  }
];
function toPlainText(html$1, options) {
  return convert(html$1, {
    wordwrap: false,
    ...options,
    selectors: [...plainTextSelectors, ...options?.selectors ?? []]
  });
}
function createErrorBoundary(reject) {
  if (!React.Component) return (props) => /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: props.children });
  return class ErrorBoundary extends React.Component {
    componentDidCatch(error) {
      reject(error);
    }
    render() {
      return this.props.children;
    }
  };
}
const decoder = new TextDecoder("utf-8");
const readStream = async (stream) => {
  const chunks = [];
  const writableStream = new WritableStream({
    write(chunk) {
      chunks.push(chunk);
    },
    abort(reason) {
      throw new Error("Stream aborted", { cause: { reason } });
    }
  });
  await stream.pipeTo(writableStream);
  let length = 0;
  chunks.forEach((item) => {
    length += item.length;
  });
  const mergedChunks = new Uint8Array(length);
  let offset = 0;
  chunks.forEach((item) => {
    mergedChunks.set(item, offset);
    offset += item.length;
  });
  return decoder.decode(mergedChunks);
};
const importReactDom = () => {
  return import("./react-dom.mjs").then(function(n) {
    return n.s;
  }).catch(() => import("./react-dom.mjs").then(function(n) {
    return n.s;
  }));
};
const render = async (element, options) => {
  const reactDOMServer = await importReactDom().then((m) => {
    if ("default" in m) return m.default;
    return m;
  });
  const html$1 = await new Promise((resolve, reject) => {
    const ErrorBoundary = createErrorBoundary(reject);
    reactDOMServer.renderToReadableStream(/* @__PURE__ */ jsxRuntimeExports.jsx(ErrorBoundary, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { children: element }) }), {
      onError(error) {
        reject(error);
      },
      progressiveChunkSize: Number.POSITIVE_INFINITY
    }).then(async (stream) => {
      await stream.allReady;
      return readStream(stream);
    }).then(resolve).catch(reject);
  });
  if (options?.plainText) return toPlainText(html$1, options.htmlToTextOptions);
  const document = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">${html$1.replace(/<!DOCTYPE.*?>/, "")}`;
  if (options?.pretty) return pretty(document);
  return document;
};
export {
  render as r
};
