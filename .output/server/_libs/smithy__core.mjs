import { S as SMITHY_CONTEXT_KEY, A as AlgorithmId, I as IniSectionType, E as EndpointURLScheme } from "./smithy__types.mjs";
import { Buffer } from "node:buffer";
import { ReadStream, lstatSync, fstatSync } from "node:fs";
import { readFile as readFile$1 } from "node:fs/promises";
import { createHash, getRandomValues, createHmac } from "node:crypto";
import { sep, join } from "node:path";
import process from "node:process";
import { homedir } from "node:os";
import { Readable, Writable } from "node:stream";
import * as zlib from "node:zlib";
const isStreamingPayload = (request) => request?.body instanceof Readable || typeof ReadableStream !== "undefined" && request?.body instanceof ReadableStream;
const getAllAliases = (name, aliases) => {
  const _aliases = [];
  if (name) {
    _aliases.push(name);
  }
  if (aliases) {
    for (const alias of aliases) {
      _aliases.push(alias);
    }
  }
  return _aliases;
};
const getMiddlewareNameWithAliases = (name, aliases) => {
  return `${name || "anonymous"}${aliases && aliases.length > 0 ? ` (a.k.a. ${aliases.join(",")})` : ""}`;
};
const constructStack = () => {
  let absoluteEntries = [];
  let relativeEntries = [];
  let identifyOnResolve = false;
  const entriesNameSet = /* @__PURE__ */ new Set();
  const sort = (entries) => entries.sort((a, b) => stepWeights[b.step] - stepWeights[a.step] || priorityWeights[b.priority || "normal"] - priorityWeights[a.priority || "normal"]);
  const removeByName = (toRemove) => {
    let isRemoved = false;
    const filterCb = (entry) => {
      const aliases = getAllAliases(entry.name, entry.aliases);
      if (aliases.includes(toRemove)) {
        isRemoved = true;
        for (const alias of aliases) {
          entriesNameSet.delete(alias);
        }
        return false;
      }
      return true;
    };
    absoluteEntries = absoluteEntries.filter(filterCb);
    relativeEntries = relativeEntries.filter(filterCb);
    return isRemoved;
  };
  const removeByReference = (toRemove) => {
    let isRemoved = false;
    const filterCb = (entry) => {
      if (entry.middleware === toRemove) {
        isRemoved = true;
        for (const alias of getAllAliases(entry.name, entry.aliases)) {
          entriesNameSet.delete(alias);
        }
        return false;
      }
      return true;
    };
    absoluteEntries = absoluteEntries.filter(filterCb);
    relativeEntries = relativeEntries.filter(filterCb);
    return isRemoved;
  };
  const cloneTo = (toStack) => {
    absoluteEntries.forEach((entry) => {
      toStack.add(entry.middleware, { ...entry });
    });
    relativeEntries.forEach((entry) => {
      toStack.addRelativeTo(entry.middleware, { ...entry });
    });
    toStack.identifyOnResolve?.(stack.identifyOnResolve());
    return toStack;
  };
  const expandRelativeMiddlewareList = (from) => {
    const expandedMiddlewareList = [];
    from.before.forEach((entry) => {
      if (entry.before.length === 0 && entry.after.length === 0) {
        expandedMiddlewareList.push(entry);
      } else {
        expandedMiddlewareList.push(...expandRelativeMiddlewareList(entry));
      }
    });
    expandedMiddlewareList.push(from);
    from.after.reverse().forEach((entry) => {
      if (entry.before.length === 0 && entry.after.length === 0) {
        expandedMiddlewareList.push(entry);
      } else {
        expandedMiddlewareList.push(...expandRelativeMiddlewareList(entry));
      }
    });
    return expandedMiddlewareList;
  };
  const getMiddlewareList = (debug = false) => {
    const normalizedAbsoluteEntries = [];
    const normalizedRelativeEntries = [];
    const normalizedEntriesNameMap = {};
    absoluteEntries.forEach((entry) => {
      const normalizedEntry = {
        ...entry,
        before: [],
        after: []
      };
      for (const alias of getAllAliases(normalizedEntry.name, normalizedEntry.aliases)) {
        normalizedEntriesNameMap[alias] = normalizedEntry;
      }
      normalizedAbsoluteEntries.push(normalizedEntry);
    });
    relativeEntries.forEach((entry) => {
      const normalizedEntry = {
        ...entry,
        before: [],
        after: []
      };
      for (const alias of getAllAliases(normalizedEntry.name, normalizedEntry.aliases)) {
        normalizedEntriesNameMap[alias] = normalizedEntry;
      }
      normalizedRelativeEntries.push(normalizedEntry);
    });
    normalizedRelativeEntries.forEach((entry) => {
      if (entry.toMiddleware) {
        const toMiddleware = normalizedEntriesNameMap[entry.toMiddleware];
        if (toMiddleware === void 0) {
          if (debug) {
            return;
          }
          throw new Error(`${entry.toMiddleware} is not found when adding ${getMiddlewareNameWithAliases(entry.name, entry.aliases)} middleware ${entry.relation} ${entry.toMiddleware}`);
        }
        if (entry.relation === "after") {
          toMiddleware.after.push(entry);
        }
        if (entry.relation === "before") {
          toMiddleware.before.push(entry);
        }
      }
    });
    const mainChain = sort(normalizedAbsoluteEntries).map(expandRelativeMiddlewareList).reduce((wholeList, expandedMiddlewareList) => {
      wholeList.push(...expandedMiddlewareList);
      return wholeList;
    }, []);
    return mainChain;
  };
  const stack = {
    add: (middleware, options = {}) => {
      const { name, override, aliases: _aliases } = options;
      const entry = {
        step: "initialize",
        priority: "normal",
        middleware,
        ...options
      };
      const aliases = getAllAliases(name, _aliases);
      if (aliases.length > 0) {
        if (aliases.some((alias) => entriesNameSet.has(alias))) {
          if (!override)
            throw new Error(`Duplicate middleware name '${getMiddlewareNameWithAliases(name, _aliases)}'`);
          for (const alias of aliases) {
            const toOverrideIndex = absoluteEntries.findIndex((entry2) => entry2.name === alias || entry2.aliases?.some((a) => a === alias));
            if (toOverrideIndex === -1) {
              continue;
            }
            const toOverride = absoluteEntries[toOverrideIndex];
            if (toOverride.step !== entry.step || entry.priority !== toOverride.priority) {
              throw new Error(`"${getMiddlewareNameWithAliases(toOverride.name, toOverride.aliases)}" middleware with ${toOverride.priority} priority in ${toOverride.step} step cannot be overridden by "${getMiddlewareNameWithAliases(name, _aliases)}" middleware with ${entry.priority} priority in ${entry.step} step.`);
            }
            absoluteEntries.splice(toOverrideIndex, 1);
          }
        }
        for (const alias of aliases) {
          entriesNameSet.add(alias);
        }
      }
      absoluteEntries.push(entry);
    },
    addRelativeTo: (middleware, options) => {
      const { name, override, aliases: _aliases } = options;
      const entry = {
        middleware,
        ...options
      };
      const aliases = getAllAliases(name, _aliases);
      if (aliases.length > 0) {
        if (aliases.some((alias) => entriesNameSet.has(alias))) {
          if (!override)
            throw new Error(`Duplicate middleware name '${getMiddlewareNameWithAliases(name, _aliases)}'`);
          for (const alias of aliases) {
            const toOverrideIndex = relativeEntries.findIndex((entry2) => entry2.name === alias || entry2.aliases?.some((a) => a === alias));
            if (toOverrideIndex === -1) {
              continue;
            }
            const toOverride = relativeEntries[toOverrideIndex];
            if (toOverride.toMiddleware !== entry.toMiddleware || toOverride.relation !== entry.relation) {
              throw new Error(`"${getMiddlewareNameWithAliases(toOverride.name, toOverride.aliases)}" middleware ${toOverride.relation} "${toOverride.toMiddleware}" middleware cannot be overridden by "${getMiddlewareNameWithAliases(name, _aliases)}" middleware ${entry.relation} "${entry.toMiddleware}" middleware.`);
            }
            relativeEntries.splice(toOverrideIndex, 1);
          }
        }
        for (const alias of aliases) {
          entriesNameSet.add(alias);
        }
      }
      relativeEntries.push(entry);
    },
    clone: () => cloneTo(constructStack()),
    use: (plugin) => {
      plugin.applyToStack(stack);
    },
    remove: (toRemove) => {
      if (typeof toRemove === "string")
        return removeByName(toRemove);
      else
        return removeByReference(toRemove);
    },
    removeByTag: (toRemove) => {
      let isRemoved = false;
      const filterCb = (entry) => {
        const { tags, name, aliases: _aliases } = entry;
        if (tags && tags.includes(toRemove)) {
          const aliases = getAllAliases(name, _aliases);
          for (const alias of aliases) {
            entriesNameSet.delete(alias);
          }
          isRemoved = true;
          return false;
        }
        return true;
      };
      absoluteEntries = absoluteEntries.filter(filterCb);
      relativeEntries = relativeEntries.filter(filterCb);
      return isRemoved;
    },
    concat: (from) => {
      const cloned = cloneTo(constructStack());
      cloned.use(from);
      cloned.identifyOnResolve(identifyOnResolve || cloned.identifyOnResolve() || (from.identifyOnResolve?.() ?? false));
      return cloned;
    },
    applyToStack: cloneTo,
    identify: () => {
      return getMiddlewareList(true).map((mw) => {
        const step = mw.step ?? mw.relation + " " + mw.toMiddleware;
        return getMiddlewareNameWithAliases(mw.name, mw.aliases) + " - " + step;
      });
    },
    identifyOnResolve(toggle) {
      if (typeof toggle === "boolean")
        identifyOnResolve = toggle;
      return identifyOnResolve;
    },
    resolve: (handler, context) => {
      for (const middleware of getMiddlewareList().map((entry) => entry.middleware).reverse()) {
        handler = middleware(handler, context);
      }
      if (identifyOnResolve) {
        console.log(stack.identify());
      }
      return handler;
    }
  };
  return stack;
};
const stepWeights = {
  initialize: 5,
  serialize: 4,
  build: 3,
  finalizeRequest: 2,
  deserialize: 1
};
const priorityWeights = {
  high: 3,
  normal: 2,
  low: 1
};
const getSmithyContext = (context) => context[SMITHY_CONTEXT_KEY] || (context[SMITHY_CONTEXT_KEY] = {});
class HttpRequest {
  method;
  protocol;
  hostname;
  port;
  path;
  query;
  headers;
  username;
  password;
  fragment;
  body;
  constructor(options) {
    this.method = options.method || "GET";
    this.hostname = options.hostname || "localhost";
    this.port = options.port;
    this.query = options.query || {};
    this.headers = options.headers || {};
    this.body = options.body;
    this.protocol = options.protocol ? options.protocol.slice(-1) !== ":" ? `${options.protocol}:` : options.protocol : "https:";
    this.path = options.path ? options.path.charAt(0) !== "/" ? `/${options.path}` : options.path : "/";
    this.username = options.username;
    this.password = options.password;
    this.fragment = options.fragment;
  }
  static clone(request) {
    const cloned = new HttpRequest({
      ...request,
      headers: { ...request.headers }
    });
    if (cloned.query) {
      cloned.query = cloneQuery(cloned.query);
    }
    return cloned;
  }
  static isInstance(request) {
    if (!request) {
      return false;
    }
    const req = request;
    return "method" in req && "protocol" in req && "hostname" in req && "path" in req && typeof req["query"] === "object" && typeof req["headers"] === "object";
  }
  clone() {
    return HttpRequest.clone(this);
  }
}
function cloneQuery(query) {
  return Object.keys(query).reduce((carry, paramName) => {
    const param = query[paramName];
    return {
      ...carry,
      [paramName]: Array.isArray(param) ? [...param] : param
    };
  }, {});
}
class HttpResponse {
  statusCode;
  reason;
  headers;
  body;
  constructor(options) {
    this.statusCode = options.statusCode;
    this.reason = options.reason;
    this.headers = options.headers || {};
    this.body = options.body;
  }
  static isInstance(response) {
    if (!response)
      return false;
    const resp = response;
    return typeof resp.statusCode === "number" && typeof resp.headers === "object";
  }
}
const VALID_HOST_LABEL_REGEX = new RegExp(`^(?!.*-$)(?!-)[a-zA-Z0-9-]{1,63}$`);
const isValidHostLabel = (value, allowSubDomains = false) => {
  if (!allowSubDomains) {
    return VALID_HOST_LABEL_REGEX.test(value);
  }
  const labels = value.split(".");
  for (const label of labels) {
    if (!isValidHostLabel(label)) {
      return false;
    }
  }
  return true;
};
function isValidHostname(hostname) {
  const hostPattern = /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/;
  return hostPattern.test(hostname);
}
const normalizeProvider$1 = (input) => {
  if (typeof input === "function")
    return input;
  const promisified = Promise.resolve(input);
  return () => promisified;
};
function parseQueryString(querystring) {
  const query = {};
  querystring = querystring.replace(/^\?/, "");
  if (querystring) {
    for (const pair of querystring.split("&")) {
      let [key, value = null] = pair.split("=");
      key = decodeURIComponent(key);
      if (value) {
        value = decodeURIComponent(value);
      }
      if (!(key in query)) {
        query[key] = value;
      } else if (Array.isArray(query[key])) {
        query[key].push(value);
      } else {
        query[key] = [query[key], value];
      }
    }
  }
  return query;
}
const parseUrl = (url) => {
  if (typeof url === "string") {
    return parseUrl(new URL(url));
  }
  const { hostname, pathname, port, protocol, search } = url;
  let query;
  if (search) {
    query = parseQueryString(search);
  }
  return {
    hostname,
    port: port ? parseInt(port) : void 0,
    protocol,
    path: pathname,
    query
  };
};
const toEndpointV1 = (endpoint) => {
  if (typeof endpoint === "object") {
    if ("url" in endpoint) {
      const v1Endpoint = parseUrl(endpoint.url);
      if (endpoint.headers) {
        v1Endpoint.headers = {};
        for (const name in endpoint.headers) {
          v1Endpoint.headers[name.toLowerCase()] = endpoint.headers[name].join(", ");
        }
      }
      return v1Endpoint;
    }
    return endpoint;
  }
  return parseUrl(endpoint);
};
class Client {
  config;
  middlewareStack = constructStack();
  initConfig;
  handlers;
  constructor(config) {
    this.config = config;
    const { protocol, protocolSettings } = config;
    if (protocolSettings) {
      if (typeof protocol === "function") {
        config.protocol = new protocol(protocolSettings);
      }
    }
  }
  send(command, optionsOrCb, cb) {
    const options = typeof optionsOrCb !== "function" ? optionsOrCb : void 0;
    const callback = typeof optionsOrCb === "function" ? optionsOrCb : cb;
    const useHandlerCache = options === void 0 && this.config.cacheMiddleware === true;
    let handler;
    if (useHandlerCache) {
      if (!this.handlers) {
        this.handlers = /* @__PURE__ */ new WeakMap();
      }
      const handlers = this.handlers;
      if (handlers.has(command.constructor)) {
        handler = handlers.get(command.constructor);
      } else {
        handler = command.resolveMiddleware(this.middlewareStack, this.config, options);
        handlers.set(command.constructor, handler);
      }
    } else {
      delete this.handlers;
      handler = command.resolveMiddleware(this.middlewareStack, this.config, options);
    }
    if (callback) {
      handler(command).then((result) => callback(null, result.output), (err) => callback(err)).catch(() => {
      });
    } else {
      return handler(command).then((result) => result.output);
    }
  }
  destroy() {
    this.config?.requestHandler?.destroy?.();
    delete this.handlers;
  }
}
const deref = (schemaRef) => {
  if (typeof schemaRef === "function") {
    return schemaRef();
  }
  return schemaRef;
};
const operation = (namespace, name, traits, input, output) => ({
  name,
  namespace,
  traits,
  input,
  output
});
const schemaDeserializationMiddleware = (config) => (next, context) => async (args) => {
  const { response } = await next(args);
  const { operationSchema } = getSmithyContext(context);
  const [, ns, n, t, i, o] = operationSchema ?? [];
  try {
    const parsed = await config.protocol.deserializeResponse(operation(ns, n, t, i, o), {
      ...config,
      ...context
    }, response);
    return {
      response,
      output: parsed
    };
  } catch (error) {
    Object.defineProperty(error, "$response", {
      value: response,
      enumerable: false,
      writable: false,
      configurable: false
    });
    if (!("$metadata" in error)) {
      const hint = `Deserialization error: to see the raw response, inspect the hidden field {error}.$response on this object.`;
      try {
        error.message += "\n  " + hint;
      } catch (ignored) {
        if (!context.logger || context.logger?.constructor?.name === "NoOpLogger") {
          console.warn(hint);
        } else {
          context.logger?.warn?.(hint);
        }
      }
      if (typeof error.$responseBodyText !== "undefined") {
        if (error.$response) {
          error.$response.body = error.$responseBodyText;
        }
      }
      try {
        if (HttpResponse.isInstance(response)) {
          const { headers = {}, statusCode } = response;
          const headerEntries = Object.entries(headers);
          error.$metadata = {
            httpStatusCode: statusCode,
            requestId: findHeader(/^x-[\w-]+-request-?id$/, headerEntries),
            extendedRequestId: findHeader(/^x-[\w-]+-id-2$/, headerEntries),
            cfId: findHeader(/^x-[\w-]+-cf-id$/, headerEntries)
          };
        }
      } catch (ignored) {
      }
    }
    throw error;
  }
};
const findHeader = (pattern, headers) => {
  return (headers.find(([k]) => {
    return k.match(pattern);
  }) || [void 0, void 0])[1];
};
const schemaSerializationMiddleware = (config) => (next, context) => async (args) => {
  const { operationSchema } = getSmithyContext(context);
  const [, ns, n, t, i, o] = operationSchema ?? [];
  const endpoint = context.endpointV2 ? async () => toEndpointV1(context.endpointV2) : config.endpoint;
  const request = await config.protocol.serializeRequest(operation(ns, n, t, i, o), args.input, {
    ...config,
    ...context,
    endpoint
  });
  return next({
    ...args,
    request
  });
};
const deserializerMiddlewareOption = {
  name: "deserializerMiddleware",
  step: "deserialize",
  tags: ["DESERIALIZER"],
  override: true
};
const serializerMiddlewareOption$1 = {
  name: "serializerMiddleware",
  step: "serialize",
  tags: ["SERIALIZER"],
  override: true
};
function getSchemaSerdePlugin(config) {
  return {
    applyToStack: (commandStack) => {
      commandStack.add(schemaSerializationMiddleware(config), serializerMiddlewareOption$1);
      commandStack.add(schemaDeserializationMiddleware(config), deserializerMiddlewareOption);
      config.protocol.setSerdeContext(config);
    }
  };
}
const traitsCache = [];
function translateTraits(indicator) {
  if (typeof indicator === "object") {
    return indicator;
  }
  indicator = indicator | 0;
  if (traitsCache[indicator]) {
    return traitsCache[indicator];
  }
  const traits = {};
  let i = 0;
  for (const trait of [
    "httpLabel",
    "idempotent",
    "idempotencyToken",
    "sensitive",
    "httpPayload",
    "httpResponseCode",
    "httpQueryParams"
  ]) {
    if ((indicator >> i++ & 1) === 1) {
      traits[trait] = 1;
    }
  }
  return traitsCache[indicator] = traits;
}
const anno = {
  it: /* @__PURE__ */ Symbol.for("@smithy/nor-struct-it"),
  ns: /* @__PURE__ */ Symbol.for("@smithy/ns")
};
const simpleSchemaCacheN = [];
const simpleSchemaCacheS = {};
class NormalizedSchema {
  ref;
  memberName;
  static symbol = /* @__PURE__ */ Symbol.for("@smithy/nor");
  symbol = NormalizedSchema.symbol;
  name;
  schema;
  _isMemberSchema;
  traits;
  memberTraits;
  normalizedTraits;
  constructor(ref, memberName) {
    this.ref = ref;
    this.memberName = memberName;
    const traitStack = [];
    let _ref = ref;
    let schema = ref;
    this._isMemberSchema = false;
    while (isMemberSchema(_ref)) {
      traitStack.push(_ref[1]);
      _ref = _ref[0];
      schema = deref(_ref);
      this._isMemberSchema = true;
    }
    if (traitStack.length > 0) {
      this.memberTraits = {};
      for (let i = traitStack.length - 1; i >= 0; --i) {
        const traitSet = traitStack[i];
        Object.assign(this.memberTraits, translateTraits(traitSet));
      }
    } else {
      this.memberTraits = 0;
    }
    if (schema instanceof NormalizedSchema) {
      const computedMemberTraits = this.memberTraits;
      Object.assign(this, schema);
      this.memberTraits = Object.assign({}, computedMemberTraits, schema.getMemberTraits(), this.getMemberTraits());
      this.normalizedTraits = void 0;
      this.memberName = memberName ?? schema.memberName;
      return;
    }
    this.schema = deref(schema);
    if (isStaticSchema(this.schema)) {
      this.name = `${this.schema[1]}#${this.schema[2]}`;
      this.traits = this.schema[3];
    } else {
      this.name = this.memberName ?? String(schema);
      this.traits = 0;
    }
    if (this._isMemberSchema && !memberName) {
      throw new Error(`@smithy/core/schema - NormalizedSchema member init ${this.getName(true)} missing member name.`);
    }
  }
  static [Symbol.hasInstance](lhs) {
    const isPrototype = this.prototype.isPrototypeOf(lhs);
    if (!isPrototype && typeof lhs === "object" && lhs !== null) {
      const ns = lhs;
      return ns.symbol === this.symbol;
    }
    return isPrototype;
  }
  static of(ref) {
    const keyAble = typeof ref === "function" || typeof ref === "object" && ref !== null;
    if (typeof ref === "number") {
      if (simpleSchemaCacheN[ref]) {
        return simpleSchemaCacheN[ref];
      }
    } else if (typeof ref === "string") {
      if (simpleSchemaCacheS[ref]) {
        return simpleSchemaCacheS[ref];
      }
    } else if (keyAble) {
      if (ref[anno.ns]) {
        return ref[anno.ns];
      }
    }
    const sc = deref(ref);
    if (sc instanceof NormalizedSchema) {
      return sc;
    }
    if (isMemberSchema(sc)) {
      const [ns2, traits] = sc;
      if (ns2 instanceof NormalizedSchema) {
        Object.assign(ns2.getMergedTraits(), translateTraits(traits));
        return ns2;
      }
      throw new Error(`@smithy/core/schema - may not init unwrapped member schema=${JSON.stringify(ref, null, 2)}.`);
    }
    const ns = new NormalizedSchema(sc);
    if (keyAble) {
      return ref[anno.ns] = ns;
    }
    if (typeof sc === "string") {
      return simpleSchemaCacheS[sc] = ns;
    }
    if (typeof sc === "number") {
      return simpleSchemaCacheN[sc] = ns;
    }
    return ns;
  }
  getSchema() {
    const sc = this.schema;
    if (Array.isArray(sc) && sc[0] === 0) {
      return sc[4];
    }
    return sc;
  }
  getName(withNamespace = false) {
    const { name } = this;
    const short = !withNamespace && name && name.includes("#");
    return short ? name.split("#")[1] : name || void 0;
  }
  getMemberName() {
    return this.memberName;
  }
  isMemberSchema() {
    return this._isMemberSchema;
  }
  isListSchema() {
    const sc = this.getSchema();
    return typeof sc === "number" ? sc >= 64 && sc < 128 : sc[0] === 1;
  }
  isMapSchema() {
    const sc = this.getSchema();
    return typeof sc === "number" ? sc >= 128 && sc <= 255 : sc[0] === 2;
  }
  isStructSchema() {
    const sc = this.getSchema();
    if (typeof sc !== "object") {
      return false;
    }
    const id = sc[0];
    return id === 3 || id === -3 || id === 4;
  }
  isUnionSchema() {
    const sc = this.getSchema();
    if (typeof sc !== "object") {
      return false;
    }
    return sc[0] === 4;
  }
  isBlobSchema() {
    const sc = this.getSchema();
    return sc === 21 || sc === 42;
  }
  isTimestampSchema() {
    const sc = this.getSchema();
    return typeof sc === "number" && sc >= 4 && sc <= 7;
  }
  isUnitSchema() {
    return this.getSchema() === "unit";
  }
  isDocumentSchema() {
    return this.getSchema() === 15;
  }
  isStringSchema() {
    return this.getSchema() === 0;
  }
  isBooleanSchema() {
    return this.getSchema() === 2;
  }
  isNumericSchema() {
    return this.getSchema() === 1;
  }
  isBigIntegerSchema() {
    return this.getSchema() === 17;
  }
  isBigDecimalSchema() {
    return this.getSchema() === 19;
  }
  isStreaming() {
    const { streaming } = this.getMergedTraits();
    return !!streaming || this.getSchema() === 42;
  }
  isIdempotencyToken() {
    return !!this.getMergedTraits().idempotencyToken;
  }
  getMergedTraits() {
    return this.normalizedTraits ?? (this.normalizedTraits = {
      ...this.getOwnTraits(),
      ...this.getMemberTraits()
    });
  }
  getMemberTraits() {
    return translateTraits(this.memberTraits);
  }
  getOwnTraits() {
    return translateTraits(this.traits);
  }
  getKeySchema() {
    const [isDoc, isMap] = [this.isDocumentSchema(), this.isMapSchema()];
    if (!isDoc && !isMap) {
      throw new Error(`@smithy/core/schema - cannot get key for non-map: ${this.getName(true)}`);
    }
    const schema = this.getSchema();
    const memberSchema = isDoc ? 15 : schema[4] ?? 0;
    return member([memberSchema, 0], "key");
  }
  getValueSchema() {
    const sc = this.getSchema();
    const [isDoc, isMap, isList] = [this.isDocumentSchema(), this.isMapSchema(), this.isListSchema()];
    const memberSchema = typeof sc === "number" ? 63 & sc : sc && typeof sc === "object" && (isMap || isList) ? sc[3 + sc[0]] : isDoc ? 15 : void 0;
    if (memberSchema != null) {
      return member([memberSchema, 0], isMap ? "value" : "member");
    }
    throw new Error(`@smithy/core/schema - ${this.getName(true)} has no value member.`);
  }
  getMemberSchema(memberName) {
    const struct = this.getSchema();
    if (this.isStructSchema() && struct[4].includes(memberName)) {
      const i = struct[4].indexOf(memberName);
      const memberSchema = struct[5][i];
      return member(isMemberSchema(memberSchema) ? memberSchema : [memberSchema, 0], memberName);
    }
    if (this.isDocumentSchema()) {
      return member([15, 0], memberName);
    }
    throw new Error(`@smithy/core/schema - ${this.getName(true)} has no member=${memberName}.`);
  }
  getMemberSchemas() {
    const buffer = {};
    try {
      for (const [k, v] of this.structIterator()) {
        buffer[k] = v;
      }
    } catch (ignored) {
    }
    return buffer;
  }
  getEventStreamMember() {
    if (this.isStructSchema()) {
      for (const [memberName, memberSchema] of this.structIterator()) {
        if (memberSchema.isStreaming() && memberSchema.isStructSchema()) {
          return memberName;
        }
      }
    }
    return "";
  }
  *structIterator() {
    if (this.isUnitSchema()) {
      return;
    }
    if (!this.isStructSchema()) {
      throw new Error("@smithy/core/schema - cannot iterate non-struct schema.");
    }
    const struct = this.getSchema();
    const z = struct[4].length;
    let it = struct[anno.it];
    if (it && z === it.length) {
      yield* it;
      return;
    }
    it = Array(z);
    for (let i = 0; i < z; ++i) {
      const k = struct[4][i];
      const v = member([struct[5][i], 0], k);
      yield it[i] = [k, v];
    }
    struct[anno.it] = it;
  }
}
function member(memberSchema, memberName) {
  if (memberSchema instanceof NormalizedSchema) {
    return Object.assign(memberSchema, {
      memberName,
      _isMemberSchema: true
    });
  }
  const internalCtorAccess = NormalizedSchema;
  return new internalCtorAccess(memberSchema, memberName);
}
const isMemberSchema = (sc) => Array.isArray(sc) && sc.length === 2;
const isStaticSchema = (sc) => Array.isArray(sc) && sc.length >= 5;
class TypeRegistry {
  namespace;
  schemas;
  exceptions;
  static registries = /* @__PURE__ */ new Map();
  constructor(namespace, schemas = /* @__PURE__ */ new Map(), exceptions = /* @__PURE__ */ new Map()) {
    this.namespace = namespace;
    this.schemas = schemas;
    this.exceptions = exceptions;
  }
  static for(namespace) {
    if (!TypeRegistry.registries.has(namespace)) {
      TypeRegistry.registries.set(namespace, new TypeRegistry(namespace));
    }
    return TypeRegistry.registries.get(namespace);
  }
  copyFrom(other) {
    const { schemas, exceptions } = this;
    for (const [k, v] of other.schemas) {
      if (!schemas.has(k)) {
        schemas.set(k, v);
      }
    }
    for (const [k, v] of other.exceptions) {
      if (!exceptions.has(k)) {
        exceptions.set(k, v);
      }
    }
  }
  register(shapeId, schema) {
    const qualifiedName = this.normalizeShapeId(shapeId);
    for (const r of [this, TypeRegistry.for(qualifiedName.split("#")[0])]) {
      r.schemas.set(qualifiedName, schema);
    }
  }
  getSchema(shapeId) {
    const id = this.normalizeShapeId(shapeId);
    if (!this.schemas.has(id)) {
      if (!shapeId.includes("#")) {
        const suffix = "#" + shapeId;
        const candidates = [];
        for (const [shapeId2, schema] of this.schemas.entries()) {
          if (shapeId2.endsWith(suffix)) {
            candidates.push(schema);
          }
        }
        if (candidates.length === 1) {
          return candidates[0];
        }
      }
      throw new Error(`@smithy/core/schema - schema not found for ${id}`);
    }
    return this.schemas.get(id);
  }
  registerError(es, ctor) {
    const $error = es;
    const ns = $error[1];
    for (const r of [this, TypeRegistry.for(ns)]) {
      r.schemas.set(ns + "#" + $error[2], $error);
      r.exceptions.set($error, ctor);
    }
  }
  getErrorCtor(es) {
    const $error = es;
    if (this.exceptions.has($error)) {
      return this.exceptions.get($error);
    }
    const registry = TypeRegistry.for($error[1]);
    return registry.exceptions.get($error);
  }
  getBaseException() {
    for (const exceptionKey of this.exceptions.keys()) {
      if (Array.isArray(exceptionKey)) {
        const [, ns, name] = exceptionKey;
        const id = ns + "#" + name;
        if (id.startsWith("smithy.ts.sdk.synthetic.") && id.endsWith("ServiceException")) {
          return exceptionKey;
        }
      }
    }
    return void 0;
  }
  find(predicate) {
    for (const schema of this.schemas.values()) {
      if (predicate(schema)) {
        return schema;
      }
    }
    return void 0;
  }
  clear() {
    this.schemas.clear();
    this.exceptions.clear();
  }
  normalizeShapeId(shapeId) {
    if (shapeId.includes("#")) {
      return shapeId;
    }
    return this.namespace + "#" + shapeId;
  }
}
const SENSITIVE_STRING = "***SensitiveInformation***";
function schemaLogFilter(schema, data) {
  if (data == null) {
    return data;
  }
  const ns = NormalizedSchema.of(schema);
  if (ns.getMergedTraits().sensitive) {
    return SENSITIVE_STRING;
  }
  if (ns.isListSchema()) {
    const isSensitive = !!ns.getValueSchema().getMergedTraits().sensitive;
    if (isSensitive) {
      return SENSITIVE_STRING;
    }
  } else if (ns.isMapSchema()) {
    const isSensitive = !!ns.getKeySchema().getMergedTraits().sensitive || !!ns.getValueSchema().getMergedTraits().sensitive;
    if (isSensitive) {
      return SENSITIVE_STRING;
    }
  } else if (ns.isStructSchema() && typeof data === "object") {
    const object = data;
    const newObject = {};
    for (const [member2, memberNs] of ns.structIterator()) {
      if (object[member2] != null) {
        newObject[member2] = schemaLogFilter(memberNs, object[member2]);
      }
    }
    return newObject;
  }
  return data;
}
class Command {
  middlewareStack = constructStack();
  schema;
  static classBuilder() {
    return new ClassBuilder();
  }
  resolveMiddlewareWithContext(clientStack, configuration, options, { middlewareFn, clientName, commandName, inputFilterSensitiveLog, outputFilterSensitiveLog, smithyContext, additionalContext, CommandCtor }) {
    for (const mw of middlewareFn.bind(this)(CommandCtor, clientStack, configuration, options)) {
      this.middlewareStack.use(mw);
    }
    const stack = clientStack.concat(this.middlewareStack);
    const { logger: logger2 } = configuration;
    const handlerExecutionContext = {
      logger: logger2,
      clientName,
      commandName,
      inputFilterSensitiveLog,
      outputFilterSensitiveLog,
      [SMITHY_CONTEXT_KEY]: {
        commandInstance: this,
        ...smithyContext
      },
      ...additionalContext
    };
    const { requestHandler } = configuration;
    let requestOptions = options ?? {};
    if (smithyContext.eventStream) {
      requestOptions = {
        isEventStream: true,
        ...requestOptions
      };
    }
    return stack.resolve((request) => requestHandler.handle(request.request, requestOptions), handlerExecutionContext);
  }
}
class ClassBuilder {
  _init = () => {
  };
  _ep = {};
  _middlewareFn = () => [];
  _commandName = "";
  _clientName = "";
  _additionalContext = {};
  _smithyContext = {};
  _inputFilterSensitiveLog = void 0;
  _outputFilterSensitiveLog = void 0;
  _serializer = null;
  _deserializer = null;
  _operationSchema;
  init(cb) {
    this._init = cb;
  }
  ep(endpointParameterInstructions) {
    this._ep = endpointParameterInstructions;
    return this;
  }
  m(middlewareSupplier) {
    this._middlewareFn = middlewareSupplier;
    return this;
  }
  s(service, operation2, smithyContext = {}) {
    this._smithyContext = {
      service,
      operation: operation2,
      ...smithyContext
    };
    return this;
  }
  c(additionalContext = {}) {
    this._additionalContext = additionalContext;
    return this;
  }
  n(clientName, commandName) {
    this._clientName = clientName;
    this._commandName = commandName;
    return this;
  }
  f(inputFilter = (_) => _, outputFilter = (_) => _) {
    this._inputFilterSensitiveLog = inputFilter;
    this._outputFilterSensitiveLog = outputFilter;
    return this;
  }
  ser(serializer) {
    this._serializer = serializer;
    return this;
  }
  de(deserializer) {
    this._deserializer = deserializer;
    return this;
  }
  sc(operation2) {
    this._operationSchema = operation2;
    this._smithyContext.operationSchema = operation2;
    return this;
  }
  build() {
    const closure = this;
    let CommandRef;
    return CommandRef = class extends Command {
      input;
      static getEndpointParameterInstructions() {
        return closure._ep;
      }
      constructor(...[input]) {
        super();
        this.input = input ?? {};
        closure._init(this);
        this.schema = closure._operationSchema;
      }
      resolveMiddleware(stack, configuration, options) {
        const op = closure._operationSchema;
        const input = op?.[4] ?? op?.input;
        const output = op?.[5] ?? op?.output;
        return this.resolveMiddlewareWithContext(stack, configuration, options, {
          CommandCtor: CommandRef,
          middlewareFn: closure._middlewareFn,
          clientName: closure._clientName,
          commandName: closure._commandName,
          inputFilterSensitiveLog: closure._inputFilterSensitiveLog ?? (op ? schemaLogFilter.bind(null, input) : (_) => _),
          outputFilterSensitiveLog: closure._outputFilterSensitiveLog ?? (op ? schemaLogFilter.bind(null, output) : (_) => _),
          smithyContext: closure._smithyContext,
          additionalContext: closure._additionalContext
        });
      }
      serialize = closure._serializer;
      deserialize = closure._deserializer;
    };
  }
}
class ServiceException extends Error {
  $fault;
  $response;
  $retryable;
  $metadata;
  constructor(options) {
    super(options.message);
    Object.setPrototypeOf(this, Object.getPrototypeOf(this).constructor.prototype);
    this.name = options.name;
    this.$fault = options.$fault;
    this.$metadata = options.$metadata;
  }
  static isInstance(value) {
    if (!value)
      return false;
    const candidate = value;
    return ServiceException.prototype.isPrototypeOf(candidate) || Boolean(candidate.$fault) && Boolean(candidate.$metadata) && (candidate.$fault === "client" || candidate.$fault === "server");
  }
  static [Symbol.hasInstance](instance) {
    if (!instance)
      return false;
    const candidate = instance;
    if (this === ServiceException) {
      return ServiceException.isInstance(instance);
    }
    if (ServiceException.isInstance(instance)) {
      if (candidate.name && this.name) {
        return this.prototype.isPrototypeOf(instance) || candidate.name === this.name;
      }
      return this.prototype.isPrototypeOf(instance);
    }
    return false;
  }
}
const decorateServiceException = (exception, additions = {}) => {
  Object.entries(additions).filter(([, v]) => v !== void 0).forEach(([k, v]) => {
    if (exception[k] == void 0 || exception[k] === "") {
      exception[k] = v;
    }
  });
  const message = exception.message || exception.Message || "UnknownError";
  exception.message = message;
  delete exception.Message;
  return exception;
};
const loadConfigsForDefaultMode = (mode) => {
  switch (mode) {
    case "standard":
      return {
        retryMode: "standard",
        connectionTimeout: 3100
      };
    case "in-region":
      return {
        retryMode: "standard",
        connectionTimeout: 1100
      };
    case "cross-region":
      return {
        retryMode: "standard",
        connectionTimeout: 3100
      };
    case "mobile":
      return {
        retryMode: "standard",
        connectionTimeout: 3e4
      };
    default:
      return {};
  }
};
let warningEmitted = false;
const emitWarningIfUnsupportedVersion = (version) => {
  if (version && !warningEmitted && parseInt(version.substring(1, version.indexOf("."))) < 16) {
    warningEmitted = true;
  }
};
const knownAlgorithms = Object.values(AlgorithmId);
const getChecksumConfiguration = (runtimeConfig) => {
  const checksumAlgorithms = [];
  for (const id in AlgorithmId) {
    const algorithmId = AlgorithmId[id];
    if (runtimeConfig[algorithmId] === void 0) {
      continue;
    }
    checksumAlgorithms.push({
      algorithmId: () => algorithmId,
      checksumConstructor: () => runtimeConfig[algorithmId]
    });
  }
  for (const [id, ChecksumCtor] of Object.entries(runtimeConfig.checksumAlgorithms ?? {})) {
    checksumAlgorithms.push({
      algorithmId: () => id,
      checksumConstructor: () => ChecksumCtor
    });
  }
  return {
    addChecksumAlgorithm(algo) {
      runtimeConfig.checksumAlgorithms = runtimeConfig.checksumAlgorithms ?? {};
      const id = algo.algorithmId();
      const ctor = algo.checksumConstructor();
      if (knownAlgorithms.includes(id)) {
        runtimeConfig.checksumAlgorithms[id.toUpperCase()] = ctor;
      } else {
        runtimeConfig.checksumAlgorithms[id] = ctor;
      }
      checksumAlgorithms.push(algo);
    },
    checksumAlgorithms() {
      return checksumAlgorithms;
    }
  };
};
const resolveChecksumRuntimeConfig = (clientConfig) => {
  const runtimeConfig = {};
  clientConfig.checksumAlgorithms().forEach((checksumAlgorithm) => {
    const id = checksumAlgorithm.algorithmId();
    if (knownAlgorithms.includes(id)) {
      runtimeConfig[id] = checksumAlgorithm.checksumConstructor();
    }
  });
  return runtimeConfig;
};
const getRetryConfiguration = (runtimeConfig) => {
  return {
    setRetryStrategy(retryStrategy) {
      runtimeConfig.retryStrategy = retryStrategy;
    },
    retryStrategy() {
      return runtimeConfig.retryStrategy;
    }
  };
};
const resolveRetryRuntimeConfig = (retryStrategyConfiguration) => {
  const runtimeConfig = {};
  runtimeConfig.retryStrategy = retryStrategyConfiguration.retryStrategy();
  return runtimeConfig;
};
const getDefaultExtensionConfiguration = (runtimeConfig) => {
  return Object.assign(getChecksumConfiguration(runtimeConfig), getRetryConfiguration(runtimeConfig));
};
const resolveDefaultRuntimeConfig = (config) => {
  return Object.assign(resolveChecksumRuntimeConfig(config), resolveRetryRuntimeConfig(config));
};
const getValueFromTextNode = (obj) => {
  const textNodeName = "#text";
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key][textNodeName] !== void 0) {
      obj[key] = obj[key][textNodeName];
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      obj[key] = getValueFromTextNode(obj[key]);
    }
  }
  return obj;
};
class NoOpLogger {
  trace() {
  }
  debug() {
  }
  info() {
  }
  warn() {
  }
  error() {
  }
}
function makeBuilder(common, service, name, ep) {
  return function makeCommand(added, plugins, op, $, smithyContext = {}) {
    const epMerged = Object.assign({}, common, added);
    return Command.classBuilder().ep(epMerged).m(function(CommandCtor, clientStack, config, options) {
      const list = plugins.call(this, CommandCtor, clientStack, config, options);
      list.unshift(ep(config, CommandCtor.getEndpointParameterInstructions()));
      return list;
    }).s(service, op, smithyContext).n(name, op.charAt(0).toUpperCase() + op.slice(1) + "Command").sc($).build();
  };
}
const isArrayBuffer = (arg) => typeof ArrayBuffer === "function" && arg instanceof ArrayBuffer || Object.prototype.toString.call(arg) === "[object ArrayBuffer]";
const fromArrayBuffer = (input, offset = 0, length = input.byteLength - offset) => {
  if (!isArrayBuffer(input)) {
    throw new TypeError(`The "input" argument must be ArrayBuffer. Received type ${typeof input} (${input})`);
  }
  return Buffer.from(input, offset, length);
};
const fromString = (input, encoding) => {
  if (typeof input !== "string") {
    throw new TypeError(`The "input" argument must be of type string. Received type ${typeof input} (${input})`);
  }
  return encoding ? Buffer.from(input, encoding) : Buffer.from(input);
};
const BASE64_REGEX = /^[A-Za-z0-9+/]*={0,2}$/;
const fromBase64 = (input) => {
  if (input.length * 3 % 4 !== 0) {
    throw new TypeError(`Incorrect padding on base64 string.`);
  }
  if (!BASE64_REGEX.exec(input)) {
    throw new TypeError(`Invalid base64 string.`);
  }
  const buffer = fromString(input, "base64");
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
};
const fromUtf8$1 = (input) => {
  const buf = fromString(input, "utf8");
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength / Uint8Array.BYTES_PER_ELEMENT);
};
const toBase64$1 = (_input) => {
  let input;
  if (typeof _input === "string") {
    input = fromUtf8$1(_input);
  } else {
    input = _input;
  }
  if (typeof input !== "object" || typeof input.byteOffset !== "number" || typeof input.byteLength !== "number") {
    throw new Error("@smithy/util-base64: toBase64 encoder function only accepts string | Uint8Array.");
  }
  return fromArrayBuffer(input.buffer, input.byteOffset, input.byteLength).toString("base64");
};
function bindUint8ArrayBlobAdapter(toUtf82, fromUtf82, toBase642, fromBase642) {
  return class Uint8ArrayBlobAdapter2 extends Uint8Array {
    static fromString(source, encoding = "utf-8") {
      if (typeof source === "string") {
        if (encoding === "base64") {
          return Uint8ArrayBlobAdapter2.mutate(fromBase642(source));
        }
        return Uint8ArrayBlobAdapter2.mutate(fromUtf82(source));
      }
      throw new Error(`Unsupported conversion from ${typeof source} to Uint8ArrayBlobAdapter.`);
    }
    static mutate(source) {
      Object.setPrototypeOf(source, Uint8ArrayBlobAdapter2.prototype);
      return source;
    }
    transformToString(encoding = "utf-8") {
      if (encoding === "base64") {
        return toBase642(this);
      }
      return toUtf82(this);
    }
  };
}
const toUtf8$1 = (input) => {
  if (typeof input === "string") {
    return input;
  }
  if (typeof input !== "object" || typeof input.byteOffset !== "number" || typeof input.byteLength !== "number") {
    throw new Error("@smithy/util-utf8: toUtf8 encoder function only accepts string | Uint8Array.");
  }
  return fromArrayBuffer(input.buffer, input.byteOffset, input.byteLength).toString("utf8");
};
const decimalToHex = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
function bindV4(getRandomValues2) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return () => crypto.randomUUID();
  }
  return () => {
    const rnds = new Uint8Array(16);
    getRandomValues2(rnds);
    rnds[6] = rnds[6] & 15 | 64;
    rnds[8] = rnds[8] & 63 | 128;
    return decimalToHex[rnds[0]] + decimalToHex[rnds[1]] + decimalToHex[rnds[2]] + decimalToHex[rnds[3]] + "-" + decimalToHex[rnds[4]] + decimalToHex[rnds[5]] + "-" + decimalToHex[rnds[6]] + decimalToHex[rnds[7]] + "-" + decimalToHex[rnds[8]] + decimalToHex[rnds[9]] + "-" + decimalToHex[rnds[10]] + decimalToHex[rnds[11]] + decimalToHex[rnds[12]] + decimalToHex[rnds[13]] + decimalToHex[rnds[14]] + decimalToHex[rnds[15]];
  };
}
const expectNumber = (value) => {
  if (value === null || value === void 0) {
    return void 0;
  }
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    if (!Number.isNaN(parsed)) {
      if (String(parsed) !== String(value)) {
        logger.warn(stackTraceWarning(`Expected number but observed string: ${value}`));
      }
      return parsed;
    }
  }
  if (typeof value === "number") {
    return value;
  }
  throw new TypeError(`Expected number, got ${typeof value}: ${value}`);
};
const MAX_FLOAT = Math.ceil(2 ** 127 * (2 - 2 ** -23));
const expectFloat32 = (value) => {
  const expected = expectNumber(value);
  if (expected !== void 0 && !Number.isNaN(expected) && expected !== Infinity && expected !== -Infinity) {
    if (Math.abs(expected) > MAX_FLOAT) {
      throw new TypeError(`Expected 32-bit float, got ${value}`);
    }
  }
  return expected;
};
const expectLong = (value) => {
  if (value === null || value === void 0) {
    return void 0;
  }
  if (Number.isInteger(value) && !Number.isNaN(value)) {
    return value;
  }
  throw new TypeError(`Expected integer, got ${typeof value}: ${value}`);
};
const expectShort = (value) => expectSizedInt(value, 16);
const expectByte = (value) => expectSizedInt(value, 8);
const expectSizedInt = (value, size) => {
  const expected = expectLong(value);
  if (expected !== void 0 && castInt(expected, size) !== expected) {
    throw new TypeError(`Expected ${size}-bit integer, got ${value}`);
  }
  return expected;
};
const castInt = (value, size) => {
  switch (size) {
    case 32:
      return Int32Array.of(value)[0];
    case 16:
      return Int16Array.of(value)[0];
    case 8:
      return Int8Array.of(value)[0];
  }
};
const strictParseDouble = (value) => {
  if (typeof value == "string") {
    return expectNumber(parseNumber(value));
  }
  return expectNumber(value);
};
const strictParseFloat32 = (value) => {
  if (typeof value == "string") {
    return expectFloat32(parseNumber(value));
  }
  return expectFloat32(value);
};
const NUMBER_REGEX = /(-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)|(-?Infinity)|(NaN)/g;
const parseNumber = (value) => {
  const matches = value.match(NUMBER_REGEX);
  if (matches === null || matches[0].length !== value.length) {
    throw new TypeError(`Expected real number, got implicit NaN`);
  }
  return parseFloat(value);
};
const strictParseShort = (value) => {
  if (typeof value === "string") {
    return expectShort(parseNumber(value));
  }
  return expectShort(value);
};
const strictParseByte = (value) => {
  if (typeof value === "string") {
    return expectByte(parseNumber(value));
  }
  return expectByte(value);
};
const stackTraceWarning = (message) => {
  return String(new TypeError(message).stack || message).split("\n").slice(0, 5).filter((s) => !s.includes("stackTraceWarning")).join("\n");
};
const logger = {
  warn: console.warn
};
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function dateToUtcString(date2) {
  const year2 = date2.getUTCFullYear();
  const month = date2.getUTCMonth();
  const dayOfWeek = date2.getUTCDay();
  const dayOfMonthInt = date2.getUTCDate();
  const hoursInt = date2.getUTCHours();
  const minutesInt = date2.getUTCMinutes();
  const secondsInt = date2.getUTCSeconds();
  const dayOfMonthString = dayOfMonthInt < 10 ? `0${dayOfMonthInt}` : `${dayOfMonthInt}`;
  const hoursString = hoursInt < 10 ? `0${hoursInt}` : `${hoursInt}`;
  const minutesString = minutesInt < 10 ? `0${minutesInt}` : `${minutesInt}`;
  const secondsString = secondsInt < 10 ? `0${secondsInt}` : `${secondsInt}`;
  return `${DAYS[dayOfWeek]}, ${dayOfMonthString} ${MONTHS[month]} ${year2} ${hoursString}:${minutesString}:${secondsString} GMT`;
}
const RFC3339 = new RegExp(/^(\d{4})-(\d{2})-(\d{2})[tT](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?[zZ]$/);
const parseRfc3339DateTime = (value) => {
  if (value === null || value === void 0) {
    return void 0;
  }
  if (typeof value !== "string") {
    throw new TypeError("RFC-3339 date-times must be expressed as strings");
  }
  const match = RFC3339.exec(value);
  if (!match) {
    throw new TypeError("Invalid RFC-3339 date-time value");
  }
  const [_, yearStr, monthStr, dayStr, hours, minutes, seconds, fractionalMilliseconds] = match;
  const year2 = strictParseShort(stripLeadingZeroes(yearStr));
  const month = parseDateValue(monthStr, "month", 1, 12);
  const day = parseDateValue(dayStr, "day", 1, 31);
  return buildDate(year2, month, day, { hours, minutes, seconds, fractionalMilliseconds });
};
const RFC3339_WITH_OFFSET$1 = new RegExp(/^(\d{4})-(\d{2})-(\d{2})[tT](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(([-+]\d{2}:\d{2})|[zZ])$/);
const parseRfc3339DateTimeWithOffset = (value) => {
  if (value === null || value === void 0) {
    return void 0;
  }
  if (typeof value !== "string") {
    throw new TypeError("RFC-3339 date-times must be expressed as strings");
  }
  const match = RFC3339_WITH_OFFSET$1.exec(value);
  if (!match) {
    throw new TypeError("Invalid RFC-3339 date-time value");
  }
  const [_, yearStr, monthStr, dayStr, hours, minutes, seconds, fractionalMilliseconds, offsetStr] = match;
  const year2 = strictParseShort(stripLeadingZeroes(yearStr));
  const month = parseDateValue(monthStr, "month", 1, 12);
  const day = parseDateValue(dayStr, "day", 1, 31);
  const date2 = buildDate(year2, month, day, { hours, minutes, seconds, fractionalMilliseconds });
  if (offsetStr.toUpperCase() != "Z") {
    date2.setTime(date2.getTime() - parseOffsetToMilliseconds(offsetStr));
  }
  return date2;
};
const IMF_FIXDATE$1 = new RegExp(/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\d{2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d{1,2}):(\d{2}):(\d{2})(?:\.(\d+))? GMT$/);
const RFC_850_DATE$1 = new RegExp(/^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (\d{2})-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{2}) (\d{1,2}):(\d{2}):(\d{2})(?:\.(\d+))? GMT$/);
const ASC_TIME$1 = new RegExp(/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ( [1-9]|\d{2}) (\d{1,2}):(\d{2}):(\d{2})(?:\.(\d+))? (\d{4})$/);
const parseRfc7231DateTime = (value) => {
  if (value === null || value === void 0) {
    return void 0;
  }
  if (typeof value !== "string") {
    throw new TypeError("RFC-7231 date-times must be expressed as strings");
  }
  let match = IMF_FIXDATE$1.exec(value);
  if (match) {
    const [_, dayStr, monthStr, yearStr, hours, minutes, seconds, fractionalMilliseconds] = match;
    return buildDate(strictParseShort(stripLeadingZeroes(yearStr)), parseMonthByShortName(monthStr), parseDateValue(dayStr, "day", 1, 31), { hours, minutes, seconds, fractionalMilliseconds });
  }
  match = RFC_850_DATE$1.exec(value);
  if (match) {
    const [_, dayStr, monthStr, yearStr, hours, minutes, seconds, fractionalMilliseconds] = match;
    return adjustRfc850Year(buildDate(parseTwoDigitYear(yearStr), parseMonthByShortName(monthStr), parseDateValue(dayStr, "day", 1, 31), {
      hours,
      minutes,
      seconds,
      fractionalMilliseconds
    }));
  }
  match = ASC_TIME$1.exec(value);
  if (match) {
    const [_, monthStr, dayStr, hours, minutes, seconds, fractionalMilliseconds, yearStr] = match;
    return buildDate(strictParseShort(stripLeadingZeroes(yearStr)), parseMonthByShortName(monthStr), parseDateValue(dayStr.trimLeft(), "day", 1, 31), { hours, minutes, seconds, fractionalMilliseconds });
  }
  throw new TypeError("Invalid RFC-7231 date-time value");
};
const parseEpochTimestamp = (value) => {
  if (value === null || value === void 0) {
    return void 0;
  }
  let valueAsDouble;
  if (typeof value === "number") {
    valueAsDouble = value;
  } else if (typeof value === "string") {
    valueAsDouble = strictParseDouble(value);
  } else if (typeof value === "object" && value.tag === 1) {
    valueAsDouble = value.value;
  } else {
    throw new TypeError("Epoch timestamps must be expressed as floating point numbers or their string representation");
  }
  if (Number.isNaN(valueAsDouble) || valueAsDouble === Infinity || valueAsDouble === -Infinity) {
    throw new TypeError("Epoch timestamps must be valid, non-Infinite, non-NaN numerics");
  }
  return new Date(Math.round(valueAsDouble * 1e3));
};
const buildDate = (year2, month, day, time2) => {
  const adjustedMonth = month - 1;
  validateDayOfMonth(year2, adjustedMonth, day);
  return new Date(Date.UTC(year2, adjustedMonth, day, parseDateValue(time2.hours, "hour", 0, 23), parseDateValue(time2.minutes, "minute", 0, 59), parseDateValue(time2.seconds, "seconds", 0, 60), parseMilliseconds(time2.fractionalMilliseconds)));
};
const parseTwoDigitYear = (value) => {
  const thisYear = (/* @__PURE__ */ new Date()).getUTCFullYear();
  const valueInThisCentury = Math.floor(thisYear / 100) * 100 + strictParseShort(stripLeadingZeroes(value));
  if (valueInThisCentury < thisYear) {
    return valueInThisCentury + 100;
  }
  return valueInThisCentury;
};
const FIFTY_YEARS_IN_MILLIS = 50 * 365 * 24 * 60 * 60 * 1e3;
const adjustRfc850Year = (input) => {
  if (input.getTime() - (/* @__PURE__ */ new Date()).getTime() > FIFTY_YEARS_IN_MILLIS) {
    return new Date(Date.UTC(input.getUTCFullYear() - 100, input.getUTCMonth(), input.getUTCDate(), input.getUTCHours(), input.getUTCMinutes(), input.getUTCSeconds(), input.getUTCMilliseconds()));
  }
  return input;
};
const parseMonthByShortName = (value) => {
  const monthIdx = MONTHS.indexOf(value);
  if (monthIdx < 0) {
    throw new TypeError(`Invalid month: ${value}`);
  }
  return monthIdx + 1;
};
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const validateDayOfMonth = (year2, month, day) => {
  let maxDays = DAYS_IN_MONTH[month];
  if (month === 1 && isLeapYear(year2)) {
    maxDays = 29;
  }
  if (day > maxDays) {
    throw new TypeError(`Invalid day for ${MONTHS[month]} in ${year2}: ${day}`);
  }
};
const isLeapYear = (year2) => {
  return year2 % 4 === 0 && (year2 % 100 !== 0 || year2 % 400 === 0);
};
const parseDateValue = (value, type, lower, upper) => {
  const dateVal = strictParseByte(stripLeadingZeroes(value));
  if (dateVal < lower || dateVal > upper) {
    throw new TypeError(`${type} must be between ${lower} and ${upper}, inclusive`);
  }
  return dateVal;
};
const parseMilliseconds = (value) => {
  if (value === null || value === void 0) {
    return 0;
  }
  return strictParseFloat32("0." + value) * 1e3;
};
const parseOffsetToMilliseconds = (value) => {
  const directionStr = value[0];
  let direction = 1;
  if (directionStr == "+") {
    direction = 1;
  } else if (directionStr == "-") {
    direction = -1;
  } else {
    throw new TypeError(`Offset direction, ${directionStr}, must be "+" or "-"`);
  }
  const hour = Number(value.substring(1, 3));
  const minute = Number(value.substring(4, 6));
  return direction * (hour * 60 + minute) * 60 * 1e3;
};
const stripLeadingZeroes = (value) => {
  let idx = 0;
  while (idx < value.length - 1 && value.charAt(idx) === "0") {
    idx++;
  }
  if (idx === 0) {
    return value;
  }
  return value.slice(idx);
};
const LazyJsonString = function LazyJsonString2(val) {
  const str = Object.assign(new String(val), {
    deserializeJSON() {
      return JSON.parse(String(val));
    },
    toString() {
      return String(val);
    },
    toJSON() {
      return String(val);
    }
  });
  return str;
};
LazyJsonString.from = (object) => {
  if (object && typeof object === "object" && (object instanceof LazyJsonString || "deserializeJSON" in object)) {
    return object;
  } else if (typeof object === "string" || Object.getPrototypeOf(object) === String.prototype) {
    return LazyJsonString(String(object));
  }
  return LazyJsonString(JSON.stringify(object));
};
LazyJsonString.fromObject = LazyJsonString.from;
function quoteHeader(part) {
  if (part.includes(",") || part.includes('"')) {
    part = `"${part.replace(/"/g, '\\"')}"`;
  }
  return part;
}
const ddd = `(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)(?:[ne|u?r]?s?day)?`;
const mmm = `(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)`;
const time = `(\\d?\\d):(\\d{2}):(\\d{2})(?:\\.(\\d+))?`;
const date = `(\\d?\\d)`;
const year = `(\\d{4})`;
const RFC3339_WITH_OFFSET = new RegExp(/^(\d{4})-(\d\d)-(\d\d)[tT](\d\d):(\d\d):(\d\d)(\.(\d+))?(([-+]\d\d:\d\d)|[zZ])$/);
const IMF_FIXDATE = new RegExp(`^${ddd}, ${date} ${mmm} ${year} ${time} GMT$`);
const RFC_850_DATE = new RegExp(`^${ddd}, ${date}-${mmm}-(\\d\\d) ${time} GMT$`);
const ASC_TIME = new RegExp(`^${ddd} ${mmm} ( [1-9]|\\d\\d) ${time} ${year}$`);
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const _parseEpochTimestamp = (value) => {
  if (value == null) {
    return void 0;
  }
  let num = NaN;
  if (typeof value === "number") {
    num = value;
  } else if (typeof value === "string") {
    if (!/^-?\d*\.?\d+$/.test(value)) {
      throw new TypeError(`parseEpochTimestamp - numeric string invalid.`);
    }
    num = Number.parseFloat(value);
  } else if (typeof value === "object" && value.tag === 1) {
    num = value.value;
  }
  if (isNaN(num) || Math.abs(num) === Infinity) {
    throw new TypeError("Epoch timestamps must be valid finite numbers.");
  }
  return new Date(Math.round(num * 1e3));
};
const _parseRfc3339DateTimeWithOffset = (value) => {
  if (value == null) {
    return void 0;
  }
  if (typeof value !== "string") {
    throw new TypeError("RFC3339 timestamps must be strings");
  }
  const matches = RFC3339_WITH_OFFSET.exec(value);
  if (!matches) {
    throw new TypeError(`Invalid RFC3339 timestamp format ${value}`);
  }
  const [, yearStr, monthStr, dayStr, hours, minutes, seconds, , ms, offsetStr] = matches;
  range(monthStr, 1, 12);
  range(dayStr, 1, 31);
  range(hours, 0, 23);
  range(minutes, 0, 59);
  range(seconds, 0, 60);
  const date2 = new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, Number(dayStr), Number(hours), Number(minutes), Number(seconds), Number(ms) ? Math.round(parseFloat(`0.${ms}`) * 1e3) : 0));
  date2.setUTCFullYear(Number(yearStr));
  if (offsetStr.toUpperCase() != "Z") {
    const [, sign, offsetH, offsetM] = /([+-])(\d\d):(\d\d)/.exec(offsetStr) || [void 0, "+", 0, 0];
    const scalar = sign === "-" ? 1 : -1;
    date2.setTime(date2.getTime() + scalar * (Number(offsetH) * 60 * 60 * 1e3 + Number(offsetM) * 60 * 1e3));
  }
  return date2;
};
const _parseRfc7231DateTime = (value) => {
  if (value == null) {
    return void 0;
  }
  if (typeof value !== "string") {
    throw new TypeError("RFC7231 timestamps must be strings.");
  }
  let day;
  let month;
  let year2;
  let hour;
  let minute;
  let second;
  let fraction;
  let matches;
  if (matches = IMF_FIXDATE.exec(value)) {
    [, day, month, year2, hour, minute, second, fraction] = matches;
  } else if (matches = RFC_850_DATE.exec(value)) {
    [, day, month, year2, hour, minute, second, fraction] = matches;
    year2 = (Number(year2) + 1900).toString();
  } else if (matches = ASC_TIME.exec(value)) {
    [, month, day, hour, minute, second, fraction, year2] = matches;
  }
  if (year2 && second) {
    const timestamp = Date.UTC(Number(year2), months.indexOf(month), Number(day), Number(hour), Number(minute), Number(second), fraction ? Math.round(parseFloat(`0.${fraction}`) * 1e3) : 0);
    range(day, 1, 31);
    range(hour, 0, 23);
    range(minute, 0, 59);
    range(second, 0, 60);
    const date2 = new Date(timestamp);
    date2.setUTCFullYear(Number(year2));
    return date2;
  }
  throw new TypeError(`Invalid RFC7231 date-time value ${value}.`);
};
function range(v, min, max) {
  const _v = Number(v);
  if (_v < min || _v > max) {
    throw new Error(`Value ${_v} out of range [${min}, ${max}]`);
  }
}
function splitEvery(value, delimiter, numDelimiters) {
  if (!Number.isInteger(numDelimiters)) {
    throw new Error("Invalid number of delimiters (" + numDelimiters + ") for splitEvery.");
  }
  const segments = value.split(delimiter);
  const compoundSegments = [];
  let currentSegment = "";
  for (let i = 0; i < segments.length; i++) {
    if (currentSegment === "") {
      currentSegment = segments[i];
    } else {
      currentSegment += delimiter + segments[i];
    }
    if ((i + 1) % numDelimiters === 0) {
      compoundSegments.push(currentSegment);
      currentSegment = "";
    }
  }
  if (currentSegment !== "") {
    compoundSegments.push(currentSegment);
  }
  return compoundSegments;
}
const splitHeader = (value) => {
  const z = value.length;
  const values = [];
  let withinQuotes = false;
  let prevChar = void 0;
  let anchor = 0;
  for (let i = 0; i < z; ++i) {
    const char = value[i];
    switch (char) {
      case `"`:
        if (prevChar !== "\\") {
          withinQuotes = !withinQuotes;
        }
        break;
      case ",":
        if (!withinQuotes) {
          values.push(value.slice(anchor, i));
          anchor = i + 1;
        }
        break;
    }
    prevChar = char;
  }
  values.push(value.slice(anchor));
  return values.map((v) => {
    v = v.trim();
    const z2 = v.length;
    if (z2 < 2) {
      return v;
    }
    if (v[0] === `"` && v[z2 - 1] === `"`) {
      v = v.slice(1, z2 - 1);
    }
    return v.replace(/\\"/g, '"');
  });
};
const format = /^-?((0|[1-9]\d*)(\.\d+)?|\.\d+)([eE][+-]?\d+)?$/;
class NumericValue {
  string;
  type;
  constructor(string, type) {
    this.string = string;
    this.type = type;
    if (!format.test(string)) {
      throw new Error(`@smithy/core/serde - NumericValue string must conform to the Smithy bigDecimal format. Received: "${string}"`);
    }
  }
  toString() {
    return this.string;
  }
  static [Symbol.hasInstance](object) {
    if (!object || typeof object !== "object") {
      return false;
    }
    const _nv = object;
    return NumericValue.prototype.isPrototypeOf(object) || _nv.type === "bigDecimal" && format.test(_nv.string);
  }
}
const SHORT_TO_HEX = {};
const HEX_TO_SHORT = {};
for (let i = 0; i < 256; i++) {
  let encodedByte = i.toString(16).toLowerCase();
  if (encodedByte.length === 1) {
    encodedByte = `0${encodedByte}`;
  }
  SHORT_TO_HEX[i] = encodedByte;
  HEX_TO_SHORT[encodedByte] = i;
}
function fromHex(encoded) {
  if (encoded.length % 2 !== 0) {
    throw new Error("Hex encoded strings must have an even number length");
  }
  const out = new Uint8Array(encoded.length / 2);
  for (let i = 0; i < encoded.length; i += 2) {
    const encodedByte = encoded.slice(i, i + 2).toLowerCase();
    if (encodedByte in HEX_TO_SHORT) {
      out[i / 2] = HEX_TO_SHORT[encodedByte];
    } else {
      throw new Error(`Cannot decode unrecognized sequence ${encodedByte} as hexadecimal`);
    }
  }
  return out;
}
function toHex(bytes) {
  let out = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    out += SHORT_TO_HEX[bytes[i]];
  }
  return out;
}
const calculateBodyLength = (body) => {
  if (!body) {
    return 0;
  }
  if (typeof body === "string") {
    return Buffer.byteLength(body);
  } else if (typeof body.byteLength === "number") {
    return body.byteLength;
  } else if (typeof body.size === "number") {
    return body.size;
  } else if (typeof body.start === "number" && typeof body.end === "number") {
    return body.end + 1 - body.start;
  } else if (body instanceof ReadStream) {
    if (body.path != null) {
      return lstatSync(body.path).size;
    } else if (typeof body.fd === "number") {
      return fstatSync(body.fd).size;
    }
  }
  throw new Error(`Body Length computation failed for ${body}`);
};
const toUint8Array = (data) => {
  if (data instanceof Uint8Array) {
    return data;
  }
  if (typeof data === "string") {
    return fromUtf8$1(data);
  }
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength / Uint8Array.BYTES_PER_ELEMENT);
  }
  return new Uint8Array(data);
};
function concatBytes(arrays, length) {
  if (length === void 0) {
    length = 0;
    for (const bytes of arrays) {
      length += bytes.byteLength;
    }
  }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const buf of arrays) {
    result.set(buf, offset);
    offset += buf.byteLength;
  }
  return result;
}
class ProviderError extends Error {
  name = "ProviderError";
  tryNextLink;
  constructor(message, options = true) {
    let logger2;
    let tryNextLink = true;
    if (typeof options === "boolean") {
      logger2 = void 0;
      tryNextLink = options;
    } else if (options != null && typeof options === "object") {
      logger2 = options.logger;
      tryNextLink = options.tryNextLink ?? true;
    }
    super(message);
    this.tryNextLink = tryNextLink;
    Object.setPrototypeOf(this, ProviderError.prototype);
    logger2?.debug?.(`@smithy/property-provider ${tryNextLink ? "->" : "(!)"} ${message}`);
  }
  static from(error, options = true) {
    return Object.assign(new this(error.message, options), error);
  }
}
class CredentialsProviderError extends ProviderError {
  name = "CredentialsProviderError";
  constructor(message, options = true) {
    super(message, options);
    Object.setPrototypeOf(this, CredentialsProviderError.prototype);
  }
}
class TokenProviderError extends ProviderError {
  name = "TokenProviderError";
  constructor(message, options = true) {
    super(message, options);
    Object.setPrototypeOf(this, TokenProviderError.prototype);
  }
}
const chain = (...providers) => async () => {
  if (providers.length === 0) {
    throw new ProviderError("No providers in chain");
  }
  let lastProviderError;
  for (const provider of providers) {
    try {
      const credentials = await provider();
      return credentials;
    } catch (err) {
      lastProviderError = err;
      if (err?.tryNextLink) {
        continue;
      }
      throw err;
    }
  }
  throw lastProviderError;
};
const fromValue = (staticValue) => () => Promise.resolve(staticValue);
const memoize = (provider, isExpired, requiresRefresh) => {
  let resolved;
  let pending;
  let hasResult;
  let isConstant = false;
  const coalesceProvider = async () => {
    if (!pending) {
      pending = provider();
    }
    try {
      resolved = await pending;
      hasResult = true;
      isConstant = false;
    } finally {
      pending = void 0;
    }
    return resolved;
  };
  {
    return async (options) => {
      if (!hasResult || options?.forceRefresh) {
        resolved = await coalesceProvider();
      }
      return resolved;
    };
  }
};
const booleanSelector = (obj, key, type) => {
  if (!(key in obj))
    return void 0;
  if (obj[key] === "true")
    return true;
  if (obj[key] === "false")
    return false;
  throw new Error(`Cannot load ${type} "${key}". Expected "true" or "false", got ${obj[key]}.`);
};
var SelectorType;
(function(SelectorType2) {
  SelectorType2["ENV"] = "env";
  SelectorType2["CONFIG"] = "shared config entry";
})(SelectorType || (SelectorType = {}));
const homeDirCache = {};
const getHomeDirCacheKey = () => {
  if (process && process.geteuid) {
    return `${process.geteuid()}`;
  }
  return "DEFAULT";
};
const getHomeDir = () => {
  const { HOME, USERPROFILE, HOMEPATH, HOMEDRIVE = `C:${sep}` } = process.env;
  if (HOME)
    return HOME;
  if (USERPROFILE)
    return USERPROFILE;
  if (HOMEPATH)
    return `${HOMEDRIVE}${HOMEPATH}`;
  const homeDirCacheKey = getHomeDirCacheKey();
  if (!homeDirCache[homeDirCacheKey])
    homeDirCache[homeDirCacheKey] = homedir();
  return homeDirCache[homeDirCacheKey];
};
const ENV_PROFILE = "AWS_PROFILE";
const DEFAULT_PROFILE = "default";
const getProfileName = (init) => init.profile || process.env[ENV_PROFILE] || DEFAULT_PROFILE;
const getSSOTokenFilepath = (id) => {
  const hasher = createHash("sha1");
  const cacheName = hasher.update(id).digest("hex");
  return join(getHomeDir(), ".aws", "sso", "cache", `${cacheName}.json`);
};
const tokenIntercept = {};
const getSSOTokenFromFile = async (id) => {
  if (tokenIntercept[id]) {
    return tokenIntercept[id];
  }
  const ssoTokenFilepath = getSSOTokenFilepath(id);
  const ssoTokenText = await readFile$1(ssoTokenFilepath, "utf8");
  return JSON.parse(ssoTokenText);
};
const CONFIG_PREFIX_SEPARATOR = ".";
const getConfigData = (data) => Object.entries(data).filter(([key]) => {
  const indexOfSeparator = key.indexOf(CONFIG_PREFIX_SEPARATOR);
  if (indexOfSeparator === -1) {
    return false;
  }
  return Object.values(IniSectionType).includes(key.substring(0, indexOfSeparator));
}).reduce((acc, [key, value]) => {
  const indexOfSeparator = key.indexOf(CONFIG_PREFIX_SEPARATOR);
  const updatedKey = key.substring(0, indexOfSeparator) === IniSectionType.PROFILE ? key.substring(indexOfSeparator + 1) : key;
  acc[updatedKey] = value;
  return acc;
}, {
  ...data.default && { default: data.default }
});
const ENV_CONFIG_PATH = "AWS_CONFIG_FILE";
const getConfigFilepath = () => process.env[ENV_CONFIG_PATH] || join(getHomeDir(), ".aws", "config");
const ENV_CREDENTIALS_PATH = "AWS_SHARED_CREDENTIALS_FILE";
const getCredentialsFilepath = () => process.env[ENV_CREDENTIALS_PATH] || join(getHomeDir(), ".aws", "credentials");
const prefixKeyRegex = /^([\w-]+)\s(["'])?([\w-@+.%:/]+)\2$/;
const profileNameBlockList = ["__proto__", "profile __proto__"];
const parseIni = (iniData) => {
  const map = {};
  let currentSection;
  let currentSubSection;
  for (const iniLine of iniData.split(/\r?\n/)) {
    const trimmedLine = iniLine.split(/(^|\s)[;#]/)[0].trim();
    const isSection = trimmedLine[0] === "[" && trimmedLine[trimmedLine.length - 1] === "]";
    if (isSection) {
      currentSection = void 0;
      currentSubSection = void 0;
      const sectionName = trimmedLine.substring(1, trimmedLine.length - 1);
      const matches = prefixKeyRegex.exec(sectionName);
      if (matches) {
        const [, prefix, , name] = matches;
        if (Object.values(IniSectionType).includes(prefix)) {
          currentSection = [prefix, name].join(CONFIG_PREFIX_SEPARATOR);
        }
      } else {
        currentSection = sectionName;
      }
      if (profileNameBlockList.includes(sectionName)) {
        throw new Error(`Found invalid profile name "${sectionName}"`);
      }
    } else if (currentSection) {
      const indexOfEqualsSign = trimmedLine.indexOf("=");
      if (![0, -1].includes(indexOfEqualsSign)) {
        const [name, value] = [
          trimmedLine.substring(0, indexOfEqualsSign).trim(),
          trimmedLine.substring(indexOfEqualsSign + 1).trim()
        ];
        if (value === "") {
          currentSubSection = name;
        } else {
          if (currentSubSection && iniLine.trimStart() === iniLine) {
            currentSubSection = void 0;
          }
          map[currentSection] = map[currentSection] || {};
          const key = currentSubSection ? [currentSubSection, name].join(CONFIG_PREFIX_SEPARATOR) : name;
          map[currentSection][key] = value;
        }
      }
    }
  }
  return map;
};
const filePromises = {};
const fileIntercept = {};
const readFile = (path, options) => {
  if (fileIntercept[path] !== void 0) {
    return fileIntercept[path];
  }
  if (!filePromises[path] || options?.ignoreCache) {
    filePromises[path] = readFile$1(path, "utf8");
  }
  return filePromises[path];
};
const swallowError$1 = () => ({});
const loadSharedConfigFiles = async (init = {}) => {
  const { filepath = getCredentialsFilepath(), configFilepath = getConfigFilepath() } = init;
  const homeDir = getHomeDir();
  const relativeHomeDirPrefix = "~/";
  let resolvedFilepath = filepath;
  if (filepath.startsWith(relativeHomeDirPrefix)) {
    resolvedFilepath = join(homeDir, filepath.slice(2));
  }
  let resolvedConfigFilepath = configFilepath;
  if (configFilepath.startsWith(relativeHomeDirPrefix)) {
    resolvedConfigFilepath = join(homeDir, configFilepath.slice(2));
  }
  const parsedFiles = await Promise.all([
    readFile(resolvedConfigFilepath, {
      ignoreCache: init.ignoreCache
    }).then(parseIni).then(getConfigData).catch(swallowError$1),
    readFile(resolvedFilepath, {
      ignoreCache: init.ignoreCache
    }).then(parseIni).catch(swallowError$1)
  ]);
  return {
    configFile: parsedFiles[0],
    credentialsFile: parsedFiles[1]
  };
};
const getSsoSessionData = (data) => Object.entries(data).filter(([key]) => key.startsWith(IniSectionType.SSO_SESSION + CONFIG_PREFIX_SEPARATOR)).reduce((acc, [key, value]) => ({ ...acc, [key.substring(key.indexOf(CONFIG_PREFIX_SEPARATOR) + 1)]: value }), {});
const swallowError = () => ({});
const loadSsoSessionData = async (init = {}) => readFile(init.configFilepath ?? getConfigFilepath()).then(parseIni).then(getSsoSessionData).catch(swallowError);
const mergeConfigFiles = (...files) => {
  const merged = {};
  for (const file of files) {
    for (const [key, values] of Object.entries(file)) {
      if (merged[key] !== void 0) {
        Object.assign(merged[key], values);
      } else {
        merged[key] = values;
      }
    }
  }
  return merged;
};
const parseKnownFiles = async (init) => {
  const parsedFiles = await loadSharedConfigFiles(init);
  return mergeConfigFiles(parsedFiles.configFile, parsedFiles.credentialsFile);
};
const externalDataInterceptor = {
  getFileRecord() {
    return fileIntercept;
  },
  interceptFile(path, contents) {
    fileIntercept[path] = Promise.resolve(contents);
  },
  getTokenRecord() {
    return tokenIntercept;
  },
  interceptToken(id, contents) {
    tokenIntercept[id] = contents;
  }
};
function getSelectorName(functionString) {
  try {
    const constants = new Set(Array.from(functionString.match(/([A-Z_]){3,}/g) ?? []));
    constants.delete("CONFIG");
    constants.delete("CONFIG_PREFIX_SEPARATOR");
    constants.delete("ENV");
    return [...constants].join(", ");
  } catch (ignored) {
    return functionString;
  }
}
const fromEnv = (envVarSelector, options) => async () => {
  try {
    const config = envVarSelector(process.env, options);
    if (config === void 0) {
      throw new Error();
    }
    return config;
  } catch (e) {
    throw new CredentialsProviderError(e.message || `Not found in ENV: ${getSelectorName(envVarSelector.toString())}`, { logger: options?.logger });
  }
};
const fromSharedConfigFiles = (configSelector, { preferredFile = "config", ...init } = {}) => async () => {
  const profile = getProfileName(init);
  const { configFile, credentialsFile } = await loadSharedConfigFiles(init);
  const profileFromCredentials = credentialsFile[profile] || {};
  const profileFromConfig = configFile[profile] || {};
  const mergedProfile = preferredFile === "config" ? { ...profileFromCredentials, ...profileFromConfig } : { ...profileFromConfig, ...profileFromCredentials };
  try {
    const cfgFile = preferredFile === "config" ? configFile : credentialsFile;
    const configValue = configSelector(mergedProfile, cfgFile);
    if (configValue === void 0) {
      throw new Error();
    }
    return configValue;
  } catch (e) {
    throw new CredentialsProviderError(e.message || `Not found in config files w/ profile [${profile}]: ${getSelectorName(configSelector.toString())}`, { logger: init.logger });
  }
};
const isFunction = (func) => typeof func === "function";
const fromStatic = (defaultValue) => isFunction(defaultValue) ? async () => await defaultValue() : fromValue(defaultValue);
const loadConfig = ({ environmentVariableSelector, configFileSelector, default: defaultValue }, configuration = {}) => {
  const { signingName, logger: logger2 } = configuration;
  const envOptions = { signingName, logger: logger2 };
  return memoize(chain(fromEnv(environmentVariableSelector, envOptions), fromSharedConfigFiles(configFileSelector, configuration), fromStatic(defaultValue)));
};
const ENV_USE_DUALSTACK_ENDPOINT = "AWS_USE_DUALSTACK_ENDPOINT";
const CONFIG_USE_DUALSTACK_ENDPOINT = "use_dualstack_endpoint";
const NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS = {
  environmentVariableSelector: (env) => booleanSelector(env, ENV_USE_DUALSTACK_ENDPOINT, SelectorType.ENV),
  configFileSelector: (profile) => booleanSelector(profile, CONFIG_USE_DUALSTACK_ENDPOINT, SelectorType.CONFIG),
  default: false
};
const ENV_USE_FIPS_ENDPOINT = "AWS_USE_FIPS_ENDPOINT";
const CONFIG_USE_FIPS_ENDPOINT = "use_fips_endpoint";
const NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS = {
  environmentVariableSelector: (env) => booleanSelector(env, ENV_USE_FIPS_ENDPOINT, SelectorType.ENV),
  configFileSelector: (profile) => booleanSelector(profile, CONFIG_USE_FIPS_ENDPOINT, SelectorType.CONFIG),
  default: false
};
const AWS_EXECUTION_ENV = "AWS_EXECUTION_ENV";
const AWS_REGION_ENV = "AWS_REGION";
const AWS_DEFAULT_REGION_ENV = "AWS_DEFAULT_REGION";
const ENV_IMDS_DISABLED = "AWS_EC2_METADATA_DISABLED";
const DEFAULTS_MODE_OPTIONS = ["in-region", "cross-region", "mobile", "standard", "legacy"];
const IMDS_REGION_PATH = "/latest/meta-data/placement/region";
const IMDS_TOKEN_PATH = "/latest/api/token";
const X_AWS_EC2_METADATA_TOKEN = "x-aws-ec2-metadata-token";
const X_AWS_EC2_METADATA_TOKEN_TTL = "x-aws-ec2-metadata-token-ttl-seconds";
const TIMEOUT_MS = 1e3;
const NEG_CACHE_TTL_MS = 6e4;
let negativeCacheUntil = 0;
const getInstanceMetadataRegion = async () => {
  if (process.env[ENV_IMDS_DISABLED]) {
    return void 0;
  }
  if (Date.now() < negativeCacheUntil) {
    return void 0;
  }
  try {
    const endpoint = resolveImdsEndpoint();
    const token = (await imdsRequest({
      ...endpoint,
      path: IMDS_TOKEN_PATH,
      method: "PUT",
      headers: {
        [X_AWS_EC2_METADATA_TOKEN_TTL]: "21600"
      }
    })).toString();
    const region = (await imdsRequest({
      ...endpoint,
      path: IMDS_REGION_PATH,
      method: "GET",
      headers: {
        [X_AWS_EC2_METADATA_TOKEN]: token
      }
    })).toString().trim();
    return region || cacheNegativeAndReturnUndefined();
  } catch {
    return cacheNegativeAndReturnUndefined();
  }
};
const cacheNegativeAndReturnUndefined = () => {
  negativeCacheUntil = Date.now() + NEG_CACHE_TTL_MS;
  return void 0;
};
const resolveImdsEndpoint = () => {
  const envEndpoint = process.env.AWS_EC2_METADATA_SERVICE_ENDPOINT;
  if (envEndpoint) {
    const url = new URL(envEndpoint);
    return {
      hostname: url.hostname.replace(/^\[(.+)]$/, "$1"),
      port: url.port ? Number(url.port) : void 0
    };
  }
  if (process.env.AWS_EC2_METADATA_SERVICE_ENDPOINT_MODE === "IPv6") {
    return { hostname: "fd00:ec2::254" };
  }
  return { hostname: "169.254.169.254" };
};
const imdsRequest = async (options) => {
  const { request } = await import("node:http");
  return new Promise((resolve, reject) => {
    const req = request({
      hostname: options.hostname,
      port: options.port,
      path: options.path,
      method: options.method,
      headers: options.headers,
      timeout: TIMEOUT_MS,
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    req.on("error", (err) => {
      reject(err);
      req.destroy();
    });
    req.on("timeout", () => {
      reject(new Error("TimeoutError from instance metadata service"));
      req.destroy();
    });
    req.on("response", (res) => {
      const { statusCode = 400 } = res;
      if (statusCode < 200 || statusCode >= 300) {
        reject(Object.assign(new Error("Error response received from instance metadata service"), { statusCode }));
        req.destroy();
        return;
      }
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        resolve(Buffer.concat(chunks));
        req.destroy();
      });
    });
    req.end();
  });
};
const REGION_ENV_NAME = "AWS_REGION";
const REGION_INI_NAME = "region";
const NODE_REGION_CONFIG_OPTIONS = {
  environmentVariableSelector: (env) => env[REGION_ENV_NAME],
  configFileSelector: (profile) => profile[REGION_INI_NAME],
  default: async () => {
    const region = await getInstanceMetadataRegion();
    if (region) {
      return region;
    }
    throw new Error("Region is missing");
  }
};
const NODE_REGION_CONFIG_FILE_OPTIONS = {
  preferredFile: "credentials"
};
const validRegions = /* @__PURE__ */ new Set();
const checkRegion = (region, check = isValidHostLabel) => {
  if (!validRegions.has(region) && !check(region)) {
    if (region === "*") {
      console.warn(`@smithy/config-resolver WARN - Please use the caller region instead of "*". See "sigv4a" in https://github.com/aws/aws-sdk-js-v3/blob/main/supplemental-docs/CLIENTS.md.`);
    } else {
      throw new Error(`Region not accepted: region="${region}" is not a valid hostname component.`);
    }
  } else {
    validRegions.add(region);
  }
};
const isFipsRegion = (region) => typeof region === "string" && (region.startsWith("fips-") || region.endsWith("-fips"));
const getRealRegion = (region) => isFipsRegion(region) ? ["fips-aws-global", "aws-fips"].includes(region) ? "us-east-1" : region.replace(/fips-(dkr-|prod-)?|-fips/, "") : region;
const resolveRegionConfig = (input) => {
  const { region, useFipsEndpoint } = input;
  if (!region) {
    throw new Error("Region is missing");
  }
  return Object.assign(input, {
    region: async () => {
      const providedRegion = typeof region === "function" ? await region() : region;
      const realRegion = getRealRegion(providedRegion);
      checkRegion(realRegion);
      return realRegion;
    },
    useFipsEndpoint: async () => {
      const providedRegion = typeof region === "string" ? region : await region();
      if (isFipsRegion(providedRegion)) {
        return true;
      }
      return typeof useFipsEndpoint !== "function" ? Promise.resolve(!!useFipsEndpoint) : useFipsEndpoint();
    }
  });
};
const AWS_DEFAULTS_MODE_ENV = "AWS_DEFAULTS_MODE";
const AWS_DEFAULTS_MODE_CONFIG = "defaults_mode";
const NODE_DEFAULTS_MODE_CONFIG_OPTIONS = {
  environmentVariableSelector: (env) => {
    return env[AWS_DEFAULTS_MODE_ENV];
  },
  configFileSelector: (profile) => {
    return profile[AWS_DEFAULTS_MODE_CONFIG];
  },
  default: "legacy"
};
const resolveDefaultsModeConfig = ({ region = loadConfig(NODE_REGION_CONFIG_OPTIONS), defaultsMode = loadConfig(NODE_DEFAULTS_MODE_CONFIG_OPTIONS) } = {}) => memoize(async () => {
  const mode = typeof defaultsMode === "function" ? await defaultsMode() : defaultsMode;
  switch (mode?.toLowerCase()) {
    case "auto":
      return resolveNodeDefaultsModeAuto(region);
    case "in-region":
    case "cross-region":
    case "mobile":
    case "standard":
    case "legacy":
      return Promise.resolve(mode?.toLocaleLowerCase());
    case void 0:
      return Promise.resolve("legacy");
    default:
      throw new Error(`Invalid parameter for "defaultsMode", expect ${DEFAULTS_MODE_OPTIONS.join(", ")}, got ${mode}`);
  }
});
const resolveNodeDefaultsModeAuto = async (clientRegion) => {
  if (clientRegion) {
    const resolvedRegion = typeof clientRegion === "function" ? await clientRegion() : clientRegion;
    const inferredRegion = await inferPhysicalRegion();
    if (!inferredRegion) {
      return "standard";
    }
    if (resolvedRegion === inferredRegion) {
      return "in-region";
    } else {
      return "cross-region";
    }
  }
  return "standard";
};
const inferPhysicalRegion = async () => {
  if (process.env[AWS_EXECUTION_ENV] && (process.env[AWS_REGION_ENV] || process.env[AWS_DEFAULT_REGION_ENV])) {
    return process.env[AWS_REGION_ENV] ?? process.env[AWS_DEFAULT_REGION_ENV];
  }
  return getInstanceMetadataRegion();
};
const ENV_ENDPOINT_URL = "AWS_ENDPOINT_URL";
const CONFIG_ENDPOINT_URL = "endpoint_url";
const getEndpointUrlConfig = (serviceId) => ({
  environmentVariableSelector: (env) => {
    const serviceSuffixParts = serviceId.split(" ").map((w) => w.toUpperCase());
    const serviceEndpointUrl = env[[ENV_ENDPOINT_URL, ...serviceSuffixParts].join("_")];
    if (serviceEndpointUrl)
      return serviceEndpointUrl;
    const endpointUrl = env[ENV_ENDPOINT_URL];
    if (endpointUrl)
      return endpointUrl;
    return void 0;
  },
  configFileSelector: (profile, config) => {
    if (profile.services) {
      const servicesSectionKey = ["services", profile.services].join(CONFIG_PREFIX_SEPARATOR);
      if (!config || !config[servicesSectionKey]) {
        throw new Error(`The services section "${profile.services}" specified in the profile is not present in the shared configuration file.`);
      }
      const servicesSection = config[servicesSectionKey];
      const servicePrefixParts = serviceId.split(" ").map((w) => w.toLowerCase());
      const endpointUrl2 = servicesSection[[servicePrefixParts.join("_"), CONFIG_ENDPOINT_URL].join(CONFIG_PREFIX_SEPARATOR)];
      if (endpointUrl2)
        return endpointUrl2;
    }
    const endpointUrl = profile[CONFIG_ENDPOINT_URL];
    if (endpointUrl)
      return endpointUrl;
    return void 0;
  },
  default: void 0
});
const ENV_IGNORE_CONFIGURED_ENDPOINT_URLS = "AWS_IGNORE_CONFIGURED_ENDPOINT_URLS";
const CONFIG_IGNORE_CONFIGURED_ENDPOINT_URLS = "ignore_configured_endpoint_urls";
const ignoreConfiguredEndpointUrlsConfigSelectors = {
  environmentVariableSelector: (env) => booleanSelector(env, ENV_IGNORE_CONFIGURED_ENDPOINT_URLS, SelectorType.ENV),
  configFileSelector: (profile) => booleanSelector(profile, CONFIG_IGNORE_CONFIGURED_ENDPOINT_URLS, SelectorType.CONFIG),
  default: false
};
const getEndpointFromConfig = async (serviceId) => {
  const ignore = await loadConfig(ignoreConfiguredEndpointUrlsConfigSelectors)();
  if (ignore) {
    return void 0;
  }
  return loadConfig(getEndpointUrlConfig(serviceId ?? ""))();
};
const resolveParamsForS3 = async (endpointParams) => {
  const bucket = endpointParams?.Bucket || "";
  if (typeof endpointParams.Bucket === "string") {
    endpointParams.Bucket = bucket.replace(/#/g, encodeURIComponent("#")).replace(/\?/g, encodeURIComponent("?"));
  }
  if (isArnBucketName(bucket)) {
    if (endpointParams.ForcePathStyle === true) {
      throw new Error("Path-style addressing cannot be used with ARN buckets");
    }
  } else if (!isDnsCompatibleBucketName(bucket) || bucket.indexOf(".") !== -1 && !String(endpointParams.Endpoint).startsWith("http:") || bucket.toLowerCase() !== bucket || bucket.length < 3) {
    endpointParams.ForcePathStyle = true;
  }
  if (endpointParams.DisableMultiRegionAccessPoints) {
    endpointParams.disableMultiRegionAccessPoints = true;
    endpointParams.DisableMRAP = true;
  }
  return endpointParams;
};
const DOMAIN_PATTERN = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/;
const IP_ADDRESS_PATTERN = /(\d+\.){3}\d+/;
const DOTS_PATTERN = /\.\./;
const isDnsCompatibleBucketName = (bucketName) => DOMAIN_PATTERN.test(bucketName) && !IP_ADDRESS_PATTERN.test(bucketName) && !DOTS_PATTERN.test(bucketName);
const isArnBucketName = (bucketName) => {
  const [arn, partition, service, , , bucket] = bucketName.split(":");
  const isArn = arn === "arn" && bucketName.split(":").length >= 6;
  const isValidArn = Boolean(isArn && partition && service && bucket);
  if (isArn && !isValidArn) {
    throw new Error(`Invalid ARN: ${bucketName} was an invalid ARN.`);
  }
  return isValidArn;
};
const createConfigValueProvider = (configKey, canonicalEndpointParamKey, config, isClientContextParam = false) => {
  const configProvider = async () => {
    let configValue;
    if (isClientContextParam) {
      const clientContextParams = config.clientContextParams;
      const nestedValue = clientContextParams?.[configKey];
      configValue = nestedValue ?? config[configKey] ?? config[canonicalEndpointParamKey];
    } else {
      configValue = config[configKey] ?? config[canonicalEndpointParamKey];
    }
    if (typeof configValue === "function") {
      return configValue();
    }
    return configValue;
  };
  if (configKey === "credentialScope" || canonicalEndpointParamKey === "CredentialScope") {
    return async () => {
      const credentials = typeof config.credentials === "function" ? await config.credentials() : config.credentials;
      const configValue = credentials?.credentialScope ?? credentials?.CredentialScope;
      return configValue;
    };
  }
  if (configKey === "accountId" || canonicalEndpointParamKey === "AccountId") {
    return async () => {
      const credentials = typeof config.credentials === "function" ? await config.credentials() : config.credentials;
      const configValue = credentials?.accountId ?? credentials?.AccountId;
      return configValue;
    };
  }
  if (configKey === "endpoint" || canonicalEndpointParamKey === "endpoint") {
    return async () => {
      if (config.isCustomEndpoint === false) {
        return void 0;
      }
      const endpoint = await configProvider();
      if (endpoint && typeof endpoint === "object") {
        if ("url" in endpoint) {
          return endpoint.url.href;
        }
        if ("hostname" in endpoint) {
          const { protocol, hostname, port, path } = endpoint;
          return `${protocol}//${hostname}${port ? ":" + port : ""}${path}`;
        }
      }
      return endpoint;
    };
  }
  return configProvider;
};
function bindGetEndpointFromInstructions(getEndpointFromConfig2) {
  return async (commandInput, instructionsSupplier, clientConfig, context) => {
    if (!clientConfig.isCustomEndpoint && !clientConfig.ignoreConfiguredEndpointUrls) {
      let endpointFromConfig;
      if (clientConfig.serviceConfiguredEndpoint) {
        endpointFromConfig = await clientConfig.serviceConfiguredEndpoint();
      } else {
        endpointFromConfig = await getEndpointFromConfig2(clientConfig.serviceId);
      }
      if (endpointFromConfig) {
        clientConfig.endpoint = () => Promise.resolve(toEndpointV1(endpointFromConfig));
        clientConfig.isCustomEndpoint = true;
        context?.logger?.debug?.(`@smithy/core/endpoints - resolved endpoint from config: ${endpointFromConfig}`);
      }
    }
    const endpointParams = await resolveParams(commandInput, instructionsSupplier, clientConfig);
    if (typeof clientConfig.endpointProvider !== "function") {
      throw new Error("config.endpointProvider is not set.");
    }
    const endpoint = clientConfig.endpointProvider(endpointParams, context);
    if (clientConfig.isCustomEndpoint && clientConfig.endpoint) {
      const customEndpoint = await clientConfig.endpoint();
      if (customEndpoint?.headers) {
        endpoint.headers ??= {};
        for (const [name, value] of Object.entries(customEndpoint.headers)) {
          endpoint.headers[name] = Array.isArray(value) ? value : [value];
        }
      }
    }
    return endpoint;
  };
}
const resolveParams = async (commandInput, instructionsSupplier, clientConfig) => {
  const endpointParams = {};
  const instructions = instructionsSupplier?.getEndpointParameterInstructions?.() || {};
  for (const [name, instruction] of Object.entries(instructions)) {
    switch (instruction.type) {
      case "staticContextParams":
        endpointParams[name] = instruction.value;
        break;
      case "contextParams":
        endpointParams[name] = commandInput[instruction.name];
        break;
      case "clientContextParams":
      case "builtInParams":
        endpointParams[name] = await createConfigValueProvider(instruction.name, name, clientConfig, instruction.type !== "builtInParams")();
        break;
      case "operationContextParams":
        endpointParams[name] = instruction.get(commandInput);
        break;
      default:
        throw new Error("Unrecognized endpoint parameter instruction: " + JSON.stringify(instruction));
    }
  }
  if (Object.keys(instructions).length === 0) {
    Object.assign(endpointParams, clientConfig);
  }
  if (String(clientConfig.serviceId).toLowerCase() === "s3") {
    await resolveParamsForS3(endpointParams);
  }
  return endpointParams;
};
function setFeature(context, feature, value) {
  if (!context.__smithy_context) {
    context.__smithy_context = { features: {} };
  } else if (!context.__smithy_context.features) {
    context.__smithy_context.features = {};
  }
  context.__smithy_context.features[feature] = value;
}
function bindEndpointMiddleware(getEndpointFromConfig2) {
  const getEndpointFromInstructions = bindGetEndpointFromInstructions(getEndpointFromConfig2);
  return ({ config, instructions }) => {
    return (next, context) => async (args) => {
      if (config.isCustomEndpoint) {
        setFeature(context, "ENDPOINT_OVERRIDE", "N");
      }
      const endpoint = await getEndpointFromInstructions(args.input, {
        getEndpointParameterInstructions() {
          return instructions;
        }
      }, { ...config }, context);
      context.endpointV2 = endpoint;
      context.authSchemes = endpoint.properties?.authSchemes;
      const authScheme = context.authSchemes?.[0];
      if (authScheme) {
        context["signing_region"] = authScheme.signingRegion;
        context["signing_service"] = authScheme.signingName;
        const smithyContext = getSmithyContext(context);
        const httpAuthOption = smithyContext?.selectedHttpAuthScheme?.httpAuthOption;
        if (httpAuthOption) {
          httpAuthOption.signingProperties = Object.assign(httpAuthOption.signingProperties || {}, {
            signing_region: authScheme.signingRegion,
            signingRegion: authScheme.signingRegion,
            signing_service: authScheme.signingName,
            signingName: authScheme.signingName,
            signingRegionSet: authScheme.signingRegionSet
          }, authScheme.properties);
        }
      }
      return next({
        ...args
      });
    };
  };
}
const serializerMiddlewareOption = {
  name: "serializerMiddleware"
};
const endpointMiddlewareOptions = {
  step: "serialize",
  tags: ["ENDPOINT_PARAMETERS", "ENDPOINT_V2", "ENDPOINT"],
  name: "endpointV2Middleware",
  override: true,
  relation: "before",
  toMiddleware: serializerMiddlewareOption.name
};
function bindGetEndpointPlugin(getEndpointFromConfig2) {
  const endpointMiddleware = bindEndpointMiddleware(getEndpointFromConfig2);
  return (config, instructions) => ({
    applyToStack: (clientStack) => {
      clientStack.addRelativeTo(endpointMiddleware({
        config,
        instructions
      }), endpointMiddlewareOptions);
    }
  });
}
function bindResolveEndpointConfig(getEndpointFromConfig2) {
  return (input) => {
    const tls = input.tls ?? true;
    const { endpoint, useDualstackEndpoint, useFipsEndpoint } = input;
    const customEndpointProvider = endpoint != null ? async () => toEndpointV1(await normalizeProvider$1(endpoint)()) : void 0;
    const isCustomEndpoint = !!endpoint;
    const resolvedConfig = Object.assign(input, {
      endpoint: customEndpointProvider,
      tls,
      isCustomEndpoint,
      useDualstackEndpoint: normalizeProvider$1(useDualstackEndpoint ?? false),
      useFipsEndpoint: normalizeProvider$1(useFipsEndpoint ?? false),
      ignoreConfiguredEndpointUrls: !!input.ignoreConfiguredEndpointUrls
    });
    let configuredEndpointPromise = void 0;
    resolvedConfig.serviceConfiguredEndpoint = async () => {
      if (input.serviceId && !configuredEndpointPromise) {
        configuredEndpointPromise = getEndpointFromConfig2(input.serviceId);
      }
      return configuredEndpointPromise;
    };
    return resolvedConfig;
  };
}
class BinaryDecisionDiagram {
  nodes;
  root;
  conditions;
  results;
  constructor(bdd, root, conditions, results) {
    this.nodes = bdd;
    this.root = root;
    this.conditions = conditions;
    this.results = results;
  }
  static from(bdd, root, conditions, results) {
    return new BinaryDecisionDiagram(bdd, root, conditions, results);
  }
}
class EndpointCache {
  capacity;
  data = /* @__PURE__ */ new Map();
  parameters = [];
  constructor({ size, params }) {
    this.capacity = size ?? 50;
    if (params) {
      this.parameters = params;
    }
  }
  get(endpointParams, resolver) {
    const key = this.hash(endpointParams);
    if (key === false) {
      return resolver();
    }
    if (!this.data.has(key)) {
      if (this.data.size > this.capacity + 10) {
        const keys = this.data.keys();
        let i = 0;
        while (true) {
          const { value, done } = keys.next();
          this.data.delete(value);
          if (done || ++i > 10) {
            break;
          }
        }
      }
      this.data.set(key, resolver());
    }
    return this.data.get(key);
  }
  size() {
    return this.data.size;
  }
  hash(endpointParams) {
    let buffer = "";
    const { parameters } = this;
    if (parameters.length === 0) {
      return false;
    }
    for (const param of parameters) {
      const val = String(endpointParams[param] ?? "");
      if (val.includes("|;")) {
        return false;
      }
      buffer += val + "|;";
    }
    return buffer;
  }
}
class EndpointError extends Error {
  constructor(message) {
    super(message);
    this.name = "EndpointError";
  }
}
const debugId = "endpoints";
function toDebugString(input) {
  if (typeof input !== "object" || input == null) {
    return input;
  }
  if ("ref" in input) {
    return `$${toDebugString(input.ref)}`;
  }
  if ("fn" in input) {
    return `${input.fn}(${(input.argv || []).map(toDebugString).join(", ")})`;
  }
  return JSON.stringify(input, null, 2);
}
const customEndpointFunctions = {};
const booleanEquals = (value1, value2) => value1 === value2;
function coalesce(...args) {
  for (const arg of args) {
    if (arg != null) {
      return arg;
    }
  }
  return void 0;
}
const getAttrPathList = (path) => {
  const parts = path.split(".");
  const pathList = [];
  for (const part of parts) {
    const squareBracketIndex = part.indexOf("[");
    if (squareBracketIndex !== -1) {
      if (part.indexOf("]") !== part.length - 1) {
        throw new EndpointError(`Path: '${path}' does not end with ']'`);
      }
      const arrayIndex = part.slice(squareBracketIndex + 1, -1);
      if (Number.isNaN(parseInt(arrayIndex))) {
        throw new EndpointError(`Invalid array index: '${arrayIndex}' in path: '${path}'`);
      }
      if (squareBracketIndex !== 0) {
        pathList.push(part.slice(0, squareBracketIndex));
      }
      pathList.push(arrayIndex);
    } else {
      pathList.push(part);
    }
  }
  return pathList;
};
const getAttr = (value, path) => getAttrPathList(path).reduce((acc, index2) => {
  if (typeof acc !== "object") {
    throw new EndpointError(`Index '${index2}' in '${path}' not found in '${JSON.stringify(value)}'`);
  } else if (Array.isArray(acc)) {
    const i = parseInt(index2);
    return acc[i < 0 ? acc.length + i : i];
  }
  return acc[index2];
}, value);
const isSet = (value) => value != null;
function ite(condition, trueValue, falseValue) {
  return condition ? trueValue : falseValue;
}
const not = (value) => !value;
const IP_V4_REGEX = new RegExp(`^(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}$`);
const isIpAddress = (value) => IP_V4_REGEX.test(value) || value.startsWith("[") && value.endsWith("]");
const DEFAULT_PORTS = {
  [EndpointURLScheme.HTTP]: 80,
  [EndpointURLScheme.HTTPS]: 443
};
const parseURL = (value) => {
  const whatwgURL = (() => {
    try {
      if (value instanceof URL) {
        return value;
      }
      if (typeof value === "object" && "hostname" in value) {
        const { hostname: hostname2, port, protocol: protocol2 = "", path = "", query = {} } = value;
        const url = new URL(`${protocol2}//${hostname2}${port ? `:${port}` : ""}${path}`);
        url.search = Object.entries(query).map(([k, v]) => `${k}=${v}`).join("&");
        return url;
      }
      return new URL(value);
    } catch (ignored) {
      return null;
    }
  })();
  if (!whatwgURL) {
    console.error(`Unable to parse ${JSON.stringify(value)} as a whatwg URL.`);
    return null;
  }
  const urlString = whatwgURL.href;
  const { host, hostname, pathname, protocol, search } = whatwgURL;
  if (search) {
    return null;
  }
  const scheme = protocol.slice(0, -1);
  if (!Object.values(EndpointURLScheme).includes(scheme)) {
    return null;
  }
  const isIp = isIpAddress(hostname);
  const inputContainsDefaultPort = urlString.includes(`${host}:${DEFAULT_PORTS[scheme]}`) || typeof value === "string" && value.includes(`${host}:${DEFAULT_PORTS[scheme]}`);
  const authority = `${host}${inputContainsDefaultPort ? `:${DEFAULT_PORTS[scheme]}` : ``}`;
  return {
    scheme,
    authority,
    path: pathname,
    normalizedPath: pathname.endsWith("/") ? pathname : `${pathname}/`,
    isIp
  };
};
function split(value, delimiter, limit) {
  if (limit === 1) {
    return [value];
  }
  if (value === "") {
    return [""];
  }
  const parts = value.split(delimiter);
  if (limit === 0) {
    return parts;
  }
  return parts.slice(0, limit - 1).concat(parts.slice(1).join(delimiter));
}
const stringEquals = (value1, value2) => value1 === value2;
const substring = (input, start, stop, reverse) => {
  if (input == null || start >= stop || input.length < stop || /[^\u0000-\u007f]/.test(input)) {
    return null;
  }
  if (!reverse) {
    return input.substring(start, stop);
  }
  return input.substring(input.length - stop, input.length - start);
};
const uriEncode = (value) => encodeURIComponent(value).replace(/[!*'()]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
const endpointFunctions = {
  booleanEquals,
  coalesce,
  getAttr,
  isSet,
  isValidHostLabel,
  ite,
  not,
  parseURL,
  split,
  stringEquals,
  substring,
  uriEncode
};
const evaluateTemplate = (template, options) => {
  const evaluatedTemplateArr = [];
  const { referenceRecord, endpointParams } = options;
  let currentIndex = 0;
  while (currentIndex < template.length) {
    const openingBraceIndex = template.indexOf("{", currentIndex);
    if (openingBraceIndex === -1) {
      evaluatedTemplateArr.push(template.slice(currentIndex));
      break;
    }
    evaluatedTemplateArr.push(template.slice(currentIndex, openingBraceIndex));
    const closingBraceIndex = template.indexOf("}", openingBraceIndex);
    if (closingBraceIndex === -1) {
      evaluatedTemplateArr.push(template.slice(openingBraceIndex));
      break;
    }
    if (template[openingBraceIndex + 1] === "{" && template[closingBraceIndex + 1] === "}") {
      evaluatedTemplateArr.push(template.slice(openingBraceIndex + 1, closingBraceIndex));
      currentIndex = closingBraceIndex + 2;
    }
    const parameterName = template.substring(openingBraceIndex + 1, closingBraceIndex);
    if (parameterName.includes("#")) {
      const [refName, attrName] = parameterName.split("#");
      evaluatedTemplateArr.push(getAttr(referenceRecord[refName] ?? endpointParams[refName], attrName));
    } else {
      evaluatedTemplateArr.push(referenceRecord[parameterName] ?? endpointParams[parameterName]);
    }
    currentIndex = closingBraceIndex + 1;
  }
  return evaluatedTemplateArr.join("");
};
const getReferenceValue = ({ ref }, options) => {
  return options.referenceRecord[ref] ?? options.endpointParams[ref];
};
const evaluateExpression = (obj, keyName, options) => {
  if (typeof obj === "string") {
    return evaluateTemplate(obj, options);
  } else if (obj["fn"]) {
    return group$1.callFunction(obj, options);
  } else if (obj["ref"]) {
    return getReferenceValue(obj, options);
  }
  throw new EndpointError(`'${keyName}': ${String(obj)} is not a string, function or reference.`);
};
const callFunction = ({ fn, argv }, options) => {
  const evaluatedArgs = Array(argv.length);
  for (let i = 0; i < evaluatedArgs.length; ++i) {
    const arg = argv[i];
    if (typeof arg === "boolean" || typeof arg === "number") {
      evaluatedArgs[i] = arg;
    } else {
      evaluatedArgs[i] = group$1.evaluateExpression(arg, "arg", options);
    }
  }
  const namespaceSeparatorIndex = fn.indexOf(".");
  if (namespaceSeparatorIndex !== -1) {
    const namespaceFunctions = customEndpointFunctions[fn.slice(0, namespaceSeparatorIndex)];
    const customFunction = namespaceFunctions?.[fn.slice(namespaceSeparatorIndex + 1)];
    if (typeof customFunction === "function") {
      return customFunction(...evaluatedArgs);
    }
  }
  const callable = endpointFunctions[fn];
  if (typeof callable === "function") {
    return callable(...evaluatedArgs);
  }
  throw new Error(`function ${fn} not loaded in endpointFunctions.`);
};
const group$1 = {
  evaluateExpression,
  callFunction
};
const evaluateCondition = (condition, options) => {
  const { assign } = condition;
  if (assign && assign in options.referenceRecord) {
    throw new EndpointError(`'${assign}' is already defined in Reference Record.`);
  }
  const value = callFunction(condition, options);
  options.logger?.debug?.(`${debugId} evaluateCondition: ${toDebugString(condition)} = ${toDebugString(value)}`);
  const result = value === "" ? true : !!value;
  if (assign != null) {
    return { result, toAssign: { name: assign, value } };
  }
  return { result };
};
const getEndpointHeaders = (headers, options) => Object.entries(headers ?? {}).reduce((acc, [headerKey, headerVal]) => {
  acc[headerKey] = headerVal.map((headerValEntry) => {
    const processedExpr = evaluateExpression(headerValEntry, "Header value entry", options);
    if (typeof processedExpr !== "string") {
      throw new EndpointError(`Header '${headerKey}' value '${processedExpr}' is not a string`);
    }
    return processedExpr;
  });
  return acc;
}, {});
const getEndpointProperties = (properties, options) => Object.entries(properties).reduce((acc, [propertyKey, propertyVal]) => {
  acc[propertyKey] = group.getEndpointProperty(propertyVal, options);
  return acc;
}, {});
const getEndpointProperty = (property, options) => {
  if (Array.isArray(property)) {
    return property.map((propertyEntry) => getEndpointProperty(propertyEntry, options));
  }
  switch (typeof property) {
    case "string":
      return evaluateTemplate(property, options);
    case "object":
      if (property === null) {
        throw new EndpointError(`Unexpected endpoint property: ${property}`);
      }
      return group.getEndpointProperties(property, options);
    case "boolean":
      return property;
    default:
      throw new EndpointError(`Unexpected endpoint property type: ${typeof property}`);
  }
};
const group = {
  getEndpointProperty,
  getEndpointProperties
};
const getEndpointUrl = (endpointUrl, options) => {
  const expression = evaluateExpression(endpointUrl, "Endpoint URL", options);
  if (typeof expression === "string") {
    try {
      return new URL(expression);
    } catch (error) {
      console.error(`Failed to construct URL with ${expression}`, error);
      throw error;
    }
  }
  throw new EndpointError(`Endpoint URL must be a string, got ${typeof expression}`);
};
const RESULT = 1e8;
const decideEndpoint = (bdd, options) => {
  const { nodes, root, results, conditions } = bdd;
  let ref = root;
  const referenceRecord = {};
  const closure = {
    referenceRecord,
    endpointParams: options.endpointParams,
    logger: options.logger
  };
  while (ref !== 1 && ref !== -1 && ref < RESULT) {
    const node_i = 3 * (Math.abs(ref) - 1);
    const [condition_i, highRef, lowRef] = [nodes[node_i], nodes[node_i + 1], nodes[node_i + 2]];
    const [fn, argv, assign] = conditions[condition_i];
    const evaluation = evaluateCondition({ fn, assign, argv }, closure);
    if (evaluation.toAssign) {
      const { name, value } = evaluation.toAssign;
      referenceRecord[name] = value;
    }
    ref = ref >= 0 === evaluation.result ? highRef : lowRef;
  }
  if (ref >= RESULT) {
    const result = results[ref - RESULT];
    if (result[0] === -1) {
      const [, errorExpression] = result;
      throw new EndpointError(evaluateExpression(errorExpression, "Error", closure));
    }
    const [url, properties, headers] = result;
    return {
      url: getEndpointUrl(url, closure),
      properties: getEndpointProperties(properties, closure),
      headers: getEndpointHeaders(headers ?? {}, closure)
    };
  }
  throw new EndpointError(`No matching endpoint.`);
};
const resolveEndpointConfig = bindResolveEndpointConfig(getEndpointFromConfig);
const getEndpointPlugin = bindGetEndpointPlugin(getEndpointFromConfig);
const isReadableStream = (stream) => typeof ReadableStream === "function" && (stream?.constructor?.name === ReadableStream.name || stream instanceof ReadableStream);
const isBlob = (blob) => {
  return typeof Blob === "function" && (blob?.constructor?.name === Blob.name || blob instanceof Blob);
};
const fromUtf8 = (input) => new TextEncoder().encode(input);
const chars = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/`;
Object.entries(chars).reduce((acc, [i, c]) => {
  acc[c] = Number(i);
  return acc;
}, {});
const alphabetByValue = chars.split("");
const bitsPerLetter = 6;
const bitsPerByte = 8;
const maxLetterValue = 63;
function toBase64(_input) {
  let input;
  if (typeof _input === "string") {
    input = fromUtf8(_input);
  } else {
    input = _input;
  }
  const isArrayLike = typeof input === "object" && typeof input.length === "number";
  const isUint8Array = typeof input === "object" && typeof input.byteOffset === "number" && typeof input.byteLength === "number";
  if (!isArrayLike && !isUint8Array) {
    throw new Error("@smithy/util-base64: toBase64 encoder function only accepts string | Uint8Array.");
  }
  let str = "";
  for (let i = 0; i < input.length; i += 3) {
    let bits = 0;
    let bitLength = 0;
    for (let j = i, limit = Math.min(i + 3, input.length); j < limit; j++) {
      bits |= input[j] << (limit - j - 1) * bitsPerByte;
      bitLength += bitsPerByte;
    }
    const bitClusterCount = Math.ceil(bitLength / bitsPerLetter);
    bits <<= bitClusterCount * bitsPerLetter - bitLength;
    for (let k = 1; k <= bitClusterCount; k++) {
      const offset = (bitClusterCount - k) * bitsPerLetter;
      str += alphabetByValue[(bits & maxLetterValue << offset) >> offset];
    }
    str += "==".slice(0, 4 - bitClusterCount);
  }
  return str;
}
const getAwsChunkedEncodingStream$1 = (readableStream, options) => {
  const { base64Encoder, bodyLengthChecker, checksumAlgorithmFn, checksumLocationName, streamHasher } = options;
  const checksumRequired = base64Encoder !== void 0 && bodyLengthChecker !== void 0 && checksumAlgorithmFn !== void 0 && checksumLocationName !== void 0 && streamHasher !== void 0;
  const digest = checksumRequired ? streamHasher(checksumAlgorithmFn, readableStream) : void 0;
  const reader = readableStream.getReader();
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await reader.read();
      if (done) {
        controller.enqueue(`0\r
`);
        if (checksumRequired) {
          const checksum = base64Encoder(await digest);
          controller.enqueue(`${checksumLocationName}:${checksum}\r
`);
          controller.enqueue(`\r
`);
        }
        controller.close();
      } else {
        controller.enqueue(`${(bodyLengthChecker(value) || 0).toString(16)}\r
${value}\r
`);
      }
    }
  });
};
function getAwsChunkedEncodingStream(stream, options) {
  const readable = stream;
  const readableStream = stream;
  if (isReadableStream(readableStream)) {
    return getAwsChunkedEncodingStream$1(readableStream, options);
  }
  const { base64Encoder, bodyLengthChecker, checksumAlgorithmFn, checksumLocationName, streamHasher } = options;
  const checksumRequired = base64Encoder !== void 0 && checksumAlgorithmFn !== void 0 && checksumLocationName !== void 0 && streamHasher !== void 0;
  const digest = checksumRequired ? streamHasher(checksumAlgorithmFn, readable) : void 0;
  const awsChunkedEncodingStream = new Readable({
    read: () => {
    }
  });
  readable.on("data", (data) => {
    const length = bodyLengthChecker(data) || 0;
    if (length === 0) {
      return;
    }
    awsChunkedEncodingStream.push(`${length.toString(16)}\r
`);
    awsChunkedEncodingStream.push(data);
    awsChunkedEncodingStream.push("\r\n");
  });
  readable.on("end", async () => {
    awsChunkedEncodingStream.push(`0\r
`);
    if (checksumRequired) {
      const checksum = base64Encoder(await digest);
      awsChunkedEncodingStream.push(`${checksumLocationName}:${checksum}\r
`);
      awsChunkedEncodingStream.push(`\r
`);
    }
    awsChunkedEncodingStream.push(null);
  });
  return awsChunkedEncodingStream;
}
const toUtf8 = (input) => {
  if (typeof input === "string") {
    return input;
  }
  if (typeof input !== "object" || typeof input.byteOffset !== "number" || typeof input.byteLength !== "number") {
    throw new Error("@smithy/util-utf8: toUtf8 encoder function only accepts string | Uint8Array.");
  }
  return new TextDecoder("utf-8").decode(input);
};
const streamCollector$1 = async (stream) => {
  if (isBlob(stream)) {
    return collectBlob(stream);
  }
  return collectReadableStream(stream);
};
async function collectBlob(blob) {
  return blob.arrayBuffer().then((ab) => new Uint8Array(ab));
}
async function collectReadableStream(stream) {
  const chunks = [];
  const reader = stream.getReader();
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (value) {
      chunks.push(value);
      length += value.length;
    }
    if (done) {
      break;
    }
  }
  return concatBytes(chunks, length);
}
const ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED$1 = "The stream has already been transformed.";
const sdkStreamMixin$1 = (stream) => {
  if (!isBlobInstance(stream) && !isReadableStream(stream)) {
    const name = stream?.__proto__?.constructor?.name || stream;
    throw new Error(`Unexpected stream implementation, expect Blob or ReadableStream, got ${name}`);
  }
  let transformed = false;
  const transformToByteArray = async () => {
    if (transformed) {
      throw new Error(ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED$1);
    }
    transformed = true;
    return await streamCollector$1(stream);
  };
  const blobToWebStream = (blob) => {
    if (typeof blob.stream !== "function") {
      throw new Error("Cannot transform payload Blob to web stream. Please make sure the Blob.stream() is polyfilled.\nIf you are using React Native, this API is not yet supported, see: https://react-native.canny.io/feature-requests/p/fetch-streaming-body");
    }
    return blob.stream();
  };
  return Object.assign(stream, {
    transformToByteArray,
    transformToString: async (encoding) => {
      const buf = await transformToByteArray();
      if (encoding === "base64") {
        return toBase64(buf);
      } else if (encoding === "hex") {
        return toHex(buf);
      } else if (encoding === void 0 || encoding === "utf8" || encoding === "utf-8") {
        return toUtf8(buf);
      } else if (typeof TextDecoder === "function") {
        return new TextDecoder(encoding).decode(buf);
      } else {
        throw new Error("TextDecoder is not available, please make sure polyfill is provided.");
      }
    },
    transformToWebStream: () => {
      if (transformed) {
        throw new Error(ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED$1);
      }
      transformed = true;
      if (isBlobInstance(stream)) {
        return blobToWebStream(stream);
      } else if (isReadableStream(stream)) {
        return stream;
      } else {
        throw new Error(`Cannot transform payload to web stream, got ${stream}`);
      }
    }
  });
};
const isBlobInstance = (stream) => typeof Blob === "function" && stream instanceof Blob;
const streamCollector = (stream) => {
  if (isBlob(stream)) {
    return collectBlob(stream);
  }
  if (isReadableStream(stream)) {
    return collectReadableStream(stream);
  }
  return new Promise((resolve, reject) => {
    const collector = new Collector();
    const nodeStream = stream;
    nodeStream.pipe(collector);
    nodeStream.on("error", (err) => {
      collector.end();
      reject(err);
    });
    collector.on("error", reject);
    collector.on("finish", function() {
      const bytes = concatBytes(this.bufferedBytes);
      resolve(bytes);
    });
  });
};
class Collector extends Writable {
  bufferedBytes = [];
  _write(chunk, encoding, callback) {
    this.bufferedBytes.push(chunk);
    callback();
  }
}
const ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED = "The stream has already been transformed.";
const sdkStreamMixin = (stream) => {
  if (!(stream instanceof Readable)) {
    try {
      return sdkStreamMixin$1(stream);
    } catch (ignored) {
      const name = stream?.__proto__?.constructor?.name || stream;
      throw new Error(`Unexpected stream implementation, expect Stream.Readable instance, got ${name}`);
    }
  }
  let transformed = false;
  const transformToByteArray = async () => {
    if (transformed) {
      throw new Error(ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED);
    }
    transformed = true;
    return await streamCollector(stream);
  };
  return Object.assign(stream, {
    transformToByteArray,
    transformToString: async (encoding) => {
      const buf = await transformToByteArray();
      if (encoding === void 0 || Buffer.isEncoding(encoding)) {
        return fromArrayBuffer(buf.buffer, buf.byteOffset, buf.byteLength).toString(encoding);
      } else {
        const decoder = new TextDecoder(encoding);
        return decoder.decode(buf);
      }
    },
    transformToWebStream: () => {
      if (transformed) {
        throw new Error(ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED);
      }
      if (stream.readableFlowing !== null) {
        throw new Error("The stream has been consumed by other callbacks.");
      }
      if (typeof Readable.toWeb !== "function") {
        throw new Error("Readable.toWeb() is not supported. Please ensure a polyfill is available.");
      }
      transformed = true;
      return Readable.toWeb(stream);
    }
  });
};
class Uint8ArrayBlobAdapter extends bindUint8ArrayBlobAdapter(toUtf8$1, fromUtf8$1, toBase64$1, fromBase64) {
}
const _getRandomValues = getRandomValues;
const v4 = bindV4(_getRandomValues);
const generateIdempotencyToken = v4;
const collectBody = async (streamBody = new Uint8Array(), context) => {
  if (streamBody instanceof Uint8Array) {
    return Uint8ArrayBlobAdapter.mutate(streamBody);
  }
  if (!streamBody) {
    return Uint8ArrayBlobAdapter.mutate(new Uint8Array());
  }
  const fromContext = context.streamCollector(streamBody);
  return Uint8ArrayBlobAdapter.mutate(await fromContext);
};
function extendedEncodeURIComponent(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
    return "%" + c.charCodeAt(0).toString(16).toUpperCase();
  });
}
class SerdeContext {
  serdeContext;
  setSerdeContext(serdeContext) {
    this.serdeContext = serdeContext;
  }
}
class HttpProtocol extends SerdeContext {
  options;
  compositeErrorRegistry;
  constructor(options) {
    super();
    this.options = options;
    this.compositeErrorRegistry = TypeRegistry.for(options.defaultNamespace);
    for (const etr of options.errorTypeRegistries ?? []) {
      this.compositeErrorRegistry.copyFrom(etr);
    }
  }
  getRequestType() {
    return HttpRequest;
  }
  getResponseType() {
    return HttpResponse;
  }
  setSerdeContext(serdeContext) {
    this.serdeContext = serdeContext;
    this.serializer.setSerdeContext(serdeContext);
    this.deserializer.setSerdeContext(serdeContext);
    if (this.getPayloadCodec()) {
      this.getPayloadCodec().setSerdeContext(serdeContext);
    }
  }
  updateServiceEndpoint(request, endpoint) {
    if ("url" in endpoint) {
      request.protocol = endpoint.url.protocol;
      request.hostname = endpoint.url.hostname;
      request.port = endpoint.url.port ? Number(endpoint.url.port) : void 0;
      request.path = endpoint.url.pathname;
      request.fragment = endpoint.url.hash || void 0;
      request.username = endpoint.url.username || void 0;
      request.password = endpoint.url.password || void 0;
      if (!request.query) {
        request.query = {};
      }
      for (const [k, v] of endpoint.url.searchParams.entries()) {
        request.query[k] = v;
      }
      if (endpoint.headers) {
        for (const name in endpoint.headers) {
          request.headers[name] = endpoint.headers[name].join(", ");
        }
      }
      return request;
    } else {
      request.protocol = endpoint.protocol;
      request.hostname = endpoint.hostname;
      request.port = endpoint.port ? Number(endpoint.port) : void 0;
      request.path = endpoint.path;
      request.query = {
        ...endpoint.query
      };
      if (endpoint.headers) {
        for (const name in endpoint.headers) {
          request.headers[name] = endpoint.headers[name];
        }
      }
      return request;
    }
  }
  setHostPrefix(request, operationSchema, input) {
    if (this.serdeContext?.disableHostPrefix) {
      return;
    }
    const inputNs = NormalizedSchema.of(operationSchema.input);
    const opTraits = translateTraits(operationSchema.traits ?? {});
    if (opTraits.endpoint) {
      let hostPrefix = opTraits.endpoint?.[0];
      if (typeof hostPrefix === "string") {
        for (const [name, member2] of inputNs.structIterator()) {
          if (!member2.getMergedTraits().hostLabel) {
            continue;
          }
          const replacement = input[name];
          if (typeof replacement !== "string") {
            throw new Error(`@smithy/core/schema - ${name} in input must be a string as hostLabel.`);
          }
          hostPrefix = hostPrefix.replace(`{${name}}`, replacement);
        }
        request.hostname = hostPrefix + request.hostname;
        if (!isValidHostname(request.hostname)) {
          throw new Error(`[${request.hostname}] is not a valid hostname.`);
        }
      }
    }
  }
  deserializeMetadata(output) {
    return {
      httpStatusCode: output.statusCode,
      requestId: output.headers["x-amzn-requestid"] ?? output.headers["x-amzn-request-id"] ?? output.headers["x-amz-request-id"],
      extendedRequestId: output.headers["x-amz-id-2"],
      cfId: output.headers["x-amz-cf-id"]
    };
  }
  async serializeEventStream({ eventStream, requestSchema, initialRequest }) {
    const eventStreamSerde = await this.loadEventStreamCapability();
    return eventStreamSerde.serializeEventStream({
      eventStream,
      requestSchema,
      initialRequest
    });
  }
  async deserializeEventStream({ response, responseSchema, initialResponseContainer }) {
    const eventStreamSerde = await this.loadEventStreamCapability();
    return eventStreamSerde.deserializeEventStream({
      response,
      responseSchema,
      initialResponseContainer
    });
  }
  async loadEventStreamCapability() {
    const { EventStreamSerde: EventStreamSerde2, eventStreamSerdeProvider: eventStreamSerdeProvider2 } = await Promise.resolve().then(function() {
      return index;
    });
    const marshaller = this.resolveEventStreamMarshaller(eventStreamSerdeProvider2);
    return new EventStreamSerde2({
      marshaller,
      serializer: this.serializer,
      deserializer: this.deserializer,
      serdeContext: this.serdeContext,
      defaultContentType: this.getDefaultContentType(),
      compositeErrorRegistry: this.compositeErrorRegistry
    });
  }
  resolveEventStreamMarshaller(importedProvider) {
    const context = this.serdeContext;
    if (context.eventStreamMarshaller) {
      return context.eventStreamMarshaller;
    }
    return importedProvider(this.serdeContext);
  }
  getDefaultContentType() {
    throw new Error(`@smithy/core/protocols - ${this.constructor.name} getDefaultContentType() implementation missing.`);
  }
  async deserializeHttpMessage(schema, context, response, arg4, arg5) {
    return [];
  }
  getEventStreamMarshaller() {
    const context = this.serdeContext;
    if (!context.eventStreamMarshaller) {
      throw new Error("@smithy/core - HttpProtocol: eventStreamMarshaller missing in serdeContext.");
    }
    return context.eventStreamMarshaller;
  }
}
class HttpBindingProtocol extends HttpProtocol {
  async serializeRequest(operationSchema, _input, context) {
    const input = _input && typeof _input === "object" ? _input : {};
    const serializer = this.serializer;
    const query = {};
    const headers = {};
    const endpoint = await context.endpoint();
    const ns = NormalizedSchema.of(operationSchema?.input);
    const payloadMemberNames = [];
    const payloadMemberSchemas = [];
    let hasNonHttpBindingMember = false;
    let payload;
    const request = new HttpRequest({
      protocol: "",
      hostname: "",
      port: void 0,
      path: "",
      fragment: void 0,
      query,
      headers,
      body: void 0
    });
    if (endpoint) {
      this.updateServiceEndpoint(request, endpoint);
      this.setHostPrefix(request, operationSchema, input);
      const opTraits = translateTraits(operationSchema.traits);
      if (opTraits.http) {
        request.method = opTraits.http[0];
        const [path, search] = opTraits.http[1].split("?");
        if (request.path == "/") {
          request.path = path;
        } else {
          request.path += path;
        }
        const traitSearchParams = new URLSearchParams(search ?? "");
        for (const [key, value] of traitSearchParams) {
          query[key] = value;
        }
      }
    }
    for (const [memberName, memberNs] of ns.structIterator()) {
      const memberTraits = memberNs.getMergedTraits() ?? {};
      const inputMemberValue = input[memberName];
      if (inputMemberValue == null && !memberNs.isIdempotencyToken()) {
        if (memberTraits.httpLabel) {
          if (request.path.includes(`{${memberName}+}`) || request.path.includes(`{${memberName}}`)) {
            throw new Error(`No value provided for input HTTP label: ${memberName}.`);
          }
        }
        continue;
      }
      if (memberTraits.httpPayload) {
        const isStreaming = memberNs.isStreaming();
        if (isStreaming) {
          const isEventStream = memberNs.isStructSchema();
          if (isEventStream) {
            if (input[memberName]) {
              payload = await this.serializeEventStream({
                eventStream: input[memberName],
                requestSchema: ns
              });
            }
          } else {
            payload = inputMemberValue;
          }
        } else {
          serializer.write(memberNs, inputMemberValue);
          payload = serializer.flush();
        }
      } else if (memberTraits.httpLabel) {
        serializer.write(memberNs, inputMemberValue);
        const replacement = serializer.flush();
        if (request.path.includes(`{${memberName}+}`)) {
          request.path = request.path.replace(`{${memberName}+}`, replacement.split("/").map(extendedEncodeURIComponent).join("/"));
        } else if (request.path.includes(`{${memberName}}`)) {
          request.path = request.path.replace(`{${memberName}}`, extendedEncodeURIComponent(replacement));
        }
      } else if (memberTraits.httpHeader) {
        serializer.write(memberNs, inputMemberValue);
        headers[memberTraits.httpHeader.toLowerCase()] = String(serializer.flush());
      } else if (typeof memberTraits.httpPrefixHeaders === "string") {
        for (const key in inputMemberValue) {
          const val = inputMemberValue[key];
          const amalgam = memberTraits.httpPrefixHeaders + key;
          serializer.write([memberNs.getValueSchema(), { httpHeader: amalgam }], val);
          headers[amalgam.toLowerCase()] = serializer.flush();
        }
      } else if (memberTraits.httpQuery || memberTraits.httpQueryParams) {
        this.serializeQuery(memberNs, inputMemberValue, query);
      } else {
        hasNonHttpBindingMember = true;
        payloadMemberNames.push(memberName);
        payloadMemberSchemas.push(memberNs);
      }
    }
    if (hasNonHttpBindingMember && input) {
      const [namespace, name] = (ns.getName(true) ?? "#Unknown").split("#");
      const requiredMembers = ns.getSchema()[6];
      const payloadSchema = [
        3,
        namespace,
        name,
        ns.getMergedTraits(),
        payloadMemberNames,
        payloadMemberSchemas,
        void 0
      ];
      if (requiredMembers) {
        payloadSchema[6] = requiredMembers;
      } else {
        payloadSchema.pop();
      }
      serializer.write(payloadSchema, input);
      payload = serializer.flush();
    }
    request.headers = headers;
    request.query = query;
    request.body = payload;
    return request;
  }
  serializeQuery(ns, data, query) {
    const serializer = this.serializer;
    const traits = ns.getMergedTraits();
    if (traits.httpQueryParams) {
      for (const key in data) {
        if (!(key in query)) {
          const val = data[key];
          const valueSchema = ns.getValueSchema();
          Object.assign(valueSchema.getMergedTraits(), {
            ...traits,
            httpQuery: key,
            httpQueryParams: void 0
          });
          this.serializeQuery(valueSchema, val, query);
        }
      }
      return;
    }
    if (ns.isListSchema()) {
      const sparse = !!ns.getMergedTraits().sparse;
      const buffer = [];
      for (const item of data) {
        serializer.write([ns.getValueSchema(), traits], item);
        const serializable = serializer.flush();
        if (sparse || serializable !== void 0) {
          buffer.push(serializable);
        }
      }
      query[traits.httpQuery] = buffer;
    } else {
      serializer.write([ns, traits], data);
      query[traits.httpQuery] = serializer.flush();
    }
  }
  async deserializeResponse(operationSchema, context, response) {
    const deserializer = this.deserializer;
    const ns = NormalizedSchema.of(operationSchema.output);
    const dataObject = {};
    if (response.statusCode >= 300) {
      const bytes = await collectBody(response.body, context);
      if (bytes.byteLength > 0) {
        Object.assign(dataObject, await deserializer.read(15, bytes));
      }
      await this.handleError(operationSchema, context, response, dataObject, this.deserializeMetadata(response));
      throw new Error("@smithy/core/protocols - HTTP Protocol error handler failed to throw.");
    }
    for (const header in response.headers) {
      const value = response.headers[header];
      delete response.headers[header];
      response.headers[header.toLowerCase()] = value;
    }
    const nonHttpBindingMembers = await this.deserializeHttpMessage(ns, context, response, dataObject);
    if (nonHttpBindingMembers.length) {
      const bytes = await collectBody(response.body, context);
      if (bytes.byteLength > 0) {
        const dataFromBody = await deserializer.read(ns, bytes);
        for (const member2 of nonHttpBindingMembers) {
          if (dataFromBody[member2] != null) {
            dataObject[member2] = dataFromBody[member2];
          }
        }
      }
    } else if (nonHttpBindingMembers.discardResponseBody) {
      await collectBody(response.body, context);
    }
    dataObject.$metadata = this.deserializeMetadata(response);
    return dataObject;
  }
  async deserializeHttpMessage(schema, context, response, arg4, arg5) {
    let dataObject;
    if (arg4 instanceof Set) {
      dataObject = arg5;
    } else {
      dataObject = arg4;
    }
    let discardResponseBody = true;
    const deserializer = this.deserializer;
    const ns = NormalizedSchema.of(schema);
    const nonHttpBindingMembers = [];
    for (const [memberName, memberSchema] of ns.structIterator()) {
      const memberTraits = memberSchema.getMemberTraits();
      if (memberTraits.httpPayload) {
        discardResponseBody = false;
        const isStreaming = memberSchema.isStreaming();
        if (isStreaming) {
          const isEventStream = memberSchema.isStructSchema();
          if (isEventStream) {
            dataObject[memberName] = await this.deserializeEventStream({
              response,
              responseSchema: ns
            });
          } else {
            dataObject[memberName] = sdkStreamMixin(response.body);
          }
        } else if (response.body) {
          const bytes = await collectBody(response.body, context);
          if (bytes.byteLength > 0) {
            dataObject[memberName] = await deserializer.read(memberSchema, bytes);
          }
        }
      } else if (memberTraits.httpHeader) {
        const key = String(memberTraits.httpHeader).toLowerCase();
        const value = response.headers[key];
        if (null != value) {
          if (memberSchema.isListSchema()) {
            const headerListValueSchema = memberSchema.getValueSchema();
            headerListValueSchema.getMergedTraits().httpHeader = key;
            let sections;
            if (headerListValueSchema.isTimestampSchema() && headerListValueSchema.getSchema() === 4) {
              sections = splitEvery(value, ",", 2);
            } else {
              sections = splitHeader(value);
            }
            const list = [];
            for (const section of sections) {
              list.push(await deserializer.read(headerListValueSchema, section.trim()));
            }
            dataObject[memberName] = list;
          } else {
            dataObject[memberName] = await deserializer.read(memberSchema, value);
          }
        }
      } else if (memberTraits.httpPrefixHeaders !== void 0) {
        dataObject[memberName] = {};
        for (const header in response.headers) {
          if (header.startsWith(memberTraits.httpPrefixHeaders)) {
            const value = response.headers[header];
            const valueSchema = memberSchema.getValueSchema();
            valueSchema.getMergedTraits().httpHeader = header;
            dataObject[memberName][header.slice(memberTraits.httpPrefixHeaders.length)] = await deserializer.read(valueSchema, value);
          }
        }
      } else if (memberTraits.httpResponseCode) {
        dataObject[memberName] = response.statusCode;
      } else {
        nonHttpBindingMembers.push(memberName);
      }
    }
    nonHttpBindingMembers.discardResponseBody = discardResponseBody;
    return nonHttpBindingMembers;
  }
}
class RpcProtocol extends HttpProtocol {
  async serializeRequest(operationSchema, _input, context) {
    const serializer = this.serializer;
    const query = {};
    const headers = {};
    const endpoint = await context.endpoint();
    const ns = NormalizedSchema.of(operationSchema?.input);
    const schema = ns.getSchema();
    let payload;
    const input = _input && typeof _input === "object" ? _input : {};
    const request = new HttpRequest({
      protocol: "",
      hostname: "",
      port: void 0,
      path: "/",
      fragment: void 0,
      query,
      headers,
      body: void 0
    });
    if (endpoint) {
      this.updateServiceEndpoint(request, endpoint);
      this.setHostPrefix(request, operationSchema, input);
    }
    if (input) {
      const eventStreamMember = ns.getEventStreamMember();
      if (eventStreamMember) {
        if (input[eventStreamMember]) {
          const initialRequest = {};
          for (const [memberName] of ns.structIterator()) {
            if (memberName !== eventStreamMember && input[memberName] != null) {
              initialRequest[memberName] = input[memberName];
            }
          }
          payload = await this.serializeEventStream({
            eventStream: input[eventStreamMember],
            requestSchema: ns,
            initialRequest
          });
        }
      } else {
        serializer.write(schema, input);
        payload = serializer.flush();
      }
    }
    request.headers = Object.assign(request.headers, headers);
    request.query = query;
    request.body = payload;
    request.method = "POST";
    return request;
  }
  async deserializeResponse(operationSchema, context, response) {
    const deserializer = this.deserializer;
    const ns = NormalizedSchema.of(operationSchema.output);
    const dataObject = {};
    if (response.statusCode >= 300) {
      const bytes = await collectBody(response.body, context);
      if (bytes.byteLength > 0) {
        Object.assign(dataObject, await deserializer.read(15, bytes));
      }
      await this.handleError(operationSchema, context, response, dataObject, this.deserializeMetadata(response));
      throw new Error("@smithy/core/protocols - RPC Protocol error handler failed to throw.");
    }
    for (const header in response.headers) {
      const value = response.headers[header];
      delete response.headers[header];
      response.headers[header.toLowerCase()] = value;
    }
    const eventStreamMember = ns.getEventStreamMember();
    if (eventStreamMember) {
      dataObject[eventStreamMember] = await this.deserializeEventStream({
        response,
        responseSchema: ns,
        initialResponseContainer: dataObject
      });
    } else {
      const bytes = await collectBody(response.body, context);
      if (bytes.byteLength > 0) {
        Object.assign(dataObject, await deserializer.read(ns, bytes));
      }
    }
    dataObject.$metadata = this.deserializeMetadata(response);
    return dataObject;
  }
}
function determineTimestampFormat(ns, settings) {
  if (settings.timestampFormat.useTrait) {
    if (ns.isTimestampSchema() && (ns.getSchema() === 5 || ns.getSchema() === 6 || ns.getSchema() === 7)) {
      return ns.getSchema();
    }
  }
  const { httpLabel, httpPrefixHeaders, httpHeader, httpQuery } = ns.getMergedTraits();
  const bindingFormat = settings.httpBindings ? typeof httpPrefixHeaders === "string" || Boolean(httpHeader) ? 6 : Boolean(httpQuery) || Boolean(httpLabel) ? 5 : void 0 : void 0;
  return bindingFormat ?? settings.timestampFormat.default;
}
class FromStringShapeDeserializer extends SerdeContext {
  settings;
  constructor(settings) {
    super();
    this.settings = settings;
  }
  read(_schema, data) {
    const ns = NormalizedSchema.of(_schema);
    if (ns.isListSchema()) {
      return splitHeader(data).map((item) => this.read(ns.getValueSchema(), item));
    }
    if (ns.isBlobSchema()) {
      return (this.serdeContext?.base64Decoder ?? fromBase64)(data);
    }
    if (ns.isTimestampSchema()) {
      const format2 = determineTimestampFormat(ns, this.settings);
      switch (format2) {
        case 5:
          return _parseRfc3339DateTimeWithOffset(data);
        case 6:
          return _parseRfc7231DateTime(data);
        case 7:
          return _parseEpochTimestamp(data);
        default:
          console.warn("Missing timestamp format, parsing value with Date constructor:", data);
          return new Date(data);
      }
    }
    if (ns.isStringSchema()) {
      const mediaType = ns.getMergedTraits().mediaType;
      let intermediateValue = data;
      if (mediaType) {
        if (ns.getMergedTraits().httpHeader) {
          intermediateValue = this.base64ToUtf8(intermediateValue);
        }
        const isJson = mediaType === "application/json" || mediaType.endsWith("+json");
        if (isJson) {
          intermediateValue = LazyJsonString.from(intermediateValue);
        }
        return intermediateValue;
      }
    }
    if (ns.isNumericSchema()) {
      return Number(data);
    }
    if (ns.isBigIntegerSchema()) {
      return BigInt(data);
    }
    if (ns.isBigDecimalSchema()) {
      return new NumericValue(data, "bigDecimal");
    }
    if (ns.isBooleanSchema()) {
      return String(data).toLowerCase() === "true";
    }
    return data;
  }
  base64ToUtf8(base64String) {
    return (this.serdeContext?.utf8Encoder ?? toUtf8$1)((this.serdeContext?.base64Decoder ?? fromBase64)(base64String));
  }
}
class HttpInterceptingShapeDeserializer extends SerdeContext {
  codecDeserializer;
  stringDeserializer;
  constructor(codecDeserializer, codecSettings) {
    super();
    this.codecDeserializer = codecDeserializer;
    this.stringDeserializer = new FromStringShapeDeserializer(codecSettings);
  }
  setSerdeContext(serdeContext) {
    this.stringDeserializer.setSerdeContext(serdeContext);
    this.codecDeserializer.setSerdeContext(serdeContext);
    this.serdeContext = serdeContext;
  }
  read(schema, data) {
    const ns = NormalizedSchema.of(schema);
    const traits = ns.getMergedTraits();
    const toString = this.serdeContext?.utf8Encoder ?? toUtf8$1;
    if (traits.httpHeader || traits.httpResponseCode) {
      return this.stringDeserializer.read(ns, toString(data));
    }
    if (traits.httpPayload) {
      if (ns.isBlobSchema()) {
        const toBytes = this.serdeContext?.utf8Decoder ?? fromUtf8$1;
        if (typeof data === "string") {
          return toBytes(data);
        }
        return data;
      } else if (ns.isStringSchema()) {
        if ("byteLength" in data) {
          return toString(data);
        }
        return data;
      }
    }
    return this.codecDeserializer.read(ns, data);
  }
}
class ToStringShapeSerializer extends SerdeContext {
  settings;
  stringBuffer = "";
  constructor(settings) {
    super();
    this.settings = settings;
  }
  write(schema, value) {
    const ns = NormalizedSchema.of(schema);
    switch (typeof value) {
      case "object":
        if (value === null) {
          this.stringBuffer = "null";
          return;
        }
        if (ns.isTimestampSchema()) {
          if (!(value instanceof Date)) {
            throw new Error(`@smithy/core/protocols - received non-Date value ${value} when schema expected Date in ${ns.getName(true)}`);
          }
          const format2 = determineTimestampFormat(ns, this.settings);
          switch (format2) {
            case 5:
              this.stringBuffer = value.toISOString().replace(".000Z", "Z");
              break;
            case 6:
              this.stringBuffer = dateToUtcString(value);
              break;
            case 7:
              this.stringBuffer = String(value.getTime() / 1e3);
              break;
            default:
              console.warn("Missing timestamp format, using epoch seconds", value);
              this.stringBuffer = String(value.getTime() / 1e3);
          }
          return;
        }
        if (ns.isBlobSchema() && "byteLength" in value) {
          this.stringBuffer = (this.serdeContext?.base64Encoder ?? toBase64$1)(value);
          return;
        }
        if (ns.isListSchema() && Array.isArray(value)) {
          let buffer = "";
          for (const item of value) {
            this.write([ns.getValueSchema(), ns.getMergedTraits()], item);
            const headerItem = this.flush();
            const serialized = ns.getValueSchema().isTimestampSchema() ? headerItem : quoteHeader(headerItem);
            if (buffer !== "") {
              buffer += ", ";
            }
            buffer += serialized;
          }
          this.stringBuffer = buffer;
          return;
        }
        this.stringBuffer = JSON.stringify(value, null, 2);
        break;
      case "string":
        const mediaType = ns.getMergedTraits().mediaType;
        let intermediateValue = value;
        if (mediaType) {
          const isJson = mediaType === "application/json" || mediaType.endsWith("+json");
          if (isJson) {
            intermediateValue = LazyJsonString.from(intermediateValue);
          }
          if (ns.getMergedTraits().httpHeader) {
            this.stringBuffer = (this.serdeContext?.base64Encoder ?? toBase64$1)(intermediateValue.toString());
            return;
          }
        }
        this.stringBuffer = value;
        break;
      default:
        if (ns.isIdempotencyToken()) {
          this.stringBuffer = generateIdempotencyToken();
        } else {
          this.stringBuffer = String(value);
        }
    }
  }
  flush() {
    const buffer = this.stringBuffer;
    this.stringBuffer = "";
    return buffer;
  }
}
class HttpInterceptingShapeSerializer {
  codecSerializer;
  stringSerializer;
  buffer;
  constructor(codecSerializer, codecSettings, stringSerializer = new ToStringShapeSerializer(codecSettings)) {
    this.codecSerializer = codecSerializer;
    this.stringSerializer = stringSerializer;
  }
  setSerdeContext(serdeContext) {
    this.codecSerializer.setSerdeContext(serdeContext);
    this.stringSerializer.setSerdeContext(serdeContext);
  }
  write(schema, value) {
    const ns = NormalizedSchema.of(schema);
    const traits = ns.getMergedTraits();
    if (traits.httpHeader || traits.httpLabel || traits.httpQuery) {
      this.stringSerializer.write(ns, value);
      this.buffer = this.stringSerializer.flush();
      return;
    }
    return this.codecSerializer.write(ns, value);
  }
  flush() {
    if (this.buffer !== void 0) {
      const buffer = this.buffer;
      this.buffer = void 0;
      return buffer;
    }
    return this.codecSerializer.flush();
  }
}
const getHttpHandlerExtensionConfiguration = (runtimeConfig) => {
  if (runtimeConfig.logger && runtimeConfig.logger.constructor?.name !== "NoOpLogger") {
    runtimeConfig.requestHandler?.updateHttpClientConfig?.(/* @__PURE__ */ Symbol.for("logger"), runtimeConfig.logger);
  }
  return {
    setHttpHandler(handler) {
      runtimeConfig.requestHandler = handler;
    },
    httpHandler() {
      return runtimeConfig.requestHandler;
    },
    updateHttpClientConfig(key, value) {
      runtimeConfig.requestHandler?.updateHttpClientConfig(key, value);
    },
    httpHandlerConfigs() {
      return runtimeConfig.requestHandler.httpHandlerConfigs();
    }
  };
};
const resolveHttpHandlerRuntimeConfig = (httpHandlerExtensionConfiguration) => {
  return {
    requestHandler: httpHandlerExtensionConfiguration.httpHandler()
  };
};
const CONTENT_LENGTH_HEADER = "content-length";
function contentLengthMiddleware(bodyLengthChecker) {
  return (next) => async (args) => {
    const request = args.request;
    if (HttpRequest.isInstance(request)) {
      const { body, headers } = request;
      if (body && Object.keys(headers).map((str) => str.toLowerCase()).indexOf(CONTENT_LENGTH_HEADER) === -1) {
        try {
          const length = bodyLengthChecker(body);
          if (length != null) {
            request.headers = {
              ...request.headers,
              [CONTENT_LENGTH_HEADER]: String(length)
            };
          }
        } catch (ignored) {
        }
      }
    }
    return next({
      ...args,
      request
    });
  };
}
const contentLengthMiddlewareOptions = {
  step: "build",
  tags: ["SET_CONTENT_LENGTH", "CONTENT_LENGTH"],
  name: "contentLengthMiddleware",
  override: true
};
const getContentLengthPlugin = (options) => ({
  applyToStack: (clientStack) => {
    clientStack.add(contentLengthMiddleware(options.bodyLengthChecker), contentLengthMiddlewareOptions);
  }
});
const escapeUri = (uri) => encodeURIComponent(uri).replace(/[!'()*]/g, hexEncode);
const hexEncode = (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`;
function buildQueryString(query) {
  const parts = [];
  for (let key of Object.keys(query).sort()) {
    const value = query[key];
    key = escapeUri(key);
    if (Array.isArray(value)) {
      for (let i = 0, iLen = value.length; i < iLen; i++) {
        parts.push(`${key}=${escapeUri(value[i])}`);
      }
    } else {
      let qsEntry = key;
      if (value || typeof value === "string") {
        qsEntry += `=${escapeUri(value)}`;
      }
      parts.push(qsEntry);
    }
  }
  return parts.join("&");
}
const THROTTLING_ERROR_CODES = [
  "BandwidthLimitExceeded",
  "EC2ThrottledException",
  "LimitExceededException",
  "PriorRequestNotComplete",
  "ProvisionedThroughputExceededException",
  "RequestLimitExceeded",
  "RequestThrottled",
  "RequestThrottledException",
  "SlowDown",
  "ThrottledException",
  "Throttling",
  "ThrottlingException",
  "TooManyRequestsException",
  "TransactionInProgressException"
];
const TRANSIENT_ERROR_CODES = ["TimeoutError", "RequestTimeout", "RequestTimeoutException"];
const TRANSIENT_ERROR_STATUS_CODES = [500, 502, 503, 504];
const NODEJS_TIMEOUT_ERROR_CODES = ["ECONNRESET", "ECONNREFUSED", "EPIPE", "ETIMEDOUT"];
const NODEJS_NETWORK_ERROR_CODES = ["EHOSTUNREACH", "ENETUNREACH", "ENOTFOUND", "EAI_AGAIN"];
const isRetryableByTrait = (error) => error?.$retryable !== void 0;
const isClockSkewCorrectedError = (error) => error.$metadata?.clockSkewCorrected;
const isBrowserNetworkError = (error) => {
  const errorMessages = /* @__PURE__ */ new Set([
    "Failed to fetch",
    "NetworkError when attempting to fetch resource",
    "The Internet connection appears to be offline",
    "Load failed",
    "Network request failed"
  ]);
  const isValid = error && error instanceof TypeError;
  if (!isValid) {
    return false;
  }
  return errorMessages.has(error.message);
};
const isThrottlingError = (error) => error.$metadata?.httpStatusCode === 429 || THROTTLING_ERROR_CODES.includes(error.name) || error.$retryable?.throttling == true;
const isTransientError = (error, depth = 0) => isRetryableByTrait(error) || isClockSkewCorrectedError(error) || error.name === "InvalidSignatureException" && error.message?.includes("Signature expired") || TRANSIENT_ERROR_CODES.includes(error.name) || NODEJS_TIMEOUT_ERROR_CODES.includes(error?.code || "") || NODEJS_NETWORK_ERROR_CODES.includes(error?.code || "") || TRANSIENT_ERROR_STATUS_CODES.includes(error.$metadata?.httpStatusCode || 0) || isBrowserNetworkError(error) || isNodeJsHttp2TransientError(error) || error.cause !== void 0 && depth <= 10 && isTransientError(error.cause, depth + 1);
const isServerError = (error) => {
  if (error.$metadata?.httpStatusCode !== void 0) {
    const statusCode = error.$metadata.httpStatusCode;
    if (500 <= statusCode && statusCode <= 599 && !isTransientError(error)) {
      return true;
    }
    return false;
  }
  return false;
};
function isNodeJsHttp2TransientError(error) {
  return error.code === "ERR_HTTP2_STREAM_ERROR" && error.message.includes("NGHTTP2_REFUSED_STREAM");
}
const MAXIMUM_RETRY_DELAY = 20 * 1e3;
const INITIAL_RETRY_TOKENS = 500;
const NO_RETRY_INCREMENT = 1;
const INVOCATION_ID_HEADER = "amz-sdk-invocation-id";
const REQUEST_HEADER = "amz-sdk-request";
function parseRetryAfterHeader(response, logger2) {
  if (!HttpResponse.isInstance(response)) {
    return;
  }
  for (const header of Object.keys(response.headers)) {
    const h = header.toLowerCase();
    if (h === "retry-after") {
      const retryAfter = response.headers[header];
      let retryAfterSeconds = NaN;
      if (retryAfter.endsWith("GMT")) {
        try {
          const date2 = parseRfc7231DateTime(retryAfter);
          retryAfterSeconds = (date2.getTime() - Date.now()) / 1e3;
        } catch (e) {
          logger2?.trace?.("Failed to parse retry-after header");
          logger2?.trace?.(e);
        }
      } else if (retryAfter.match(/ GMT, ((\d+)|(\d+\.\d+))$/)) {
        retryAfterSeconds = Number(retryAfter.match(/ GMT, ([\d.]+)$/)?.[1]);
      } else if (retryAfter.match(/^((\d+)|(\d+\.\d+))$/)) {
        retryAfterSeconds = Number(retryAfter);
      } else if (Date.parse(retryAfter) >= Date.now()) {
        retryAfterSeconds = (Date.parse(retryAfter) - Date.now()) / 1e3;
      }
      if (isNaN(retryAfterSeconds)) {
        return;
      }
      return new Date(Date.now() + retryAfterSeconds * 1e3);
    } else if (h === "x-amz-retry-after") {
      const v = response.headers[header];
      const backoffMilliseconds = Number(v);
      if (isNaN(backoffMilliseconds)) {
        logger2?.trace?.(`Failed to parse x-amz-retry-after=${v}`);
        return;
      }
      return new Date(Date.now() + backoffMilliseconds);
    }
  }
}
const asSdkError = (error) => {
  if (error instanceof Error)
    return error;
  if (error instanceof Object)
    return Object.assign(new Error(), error);
  if (typeof error === "string")
    return new Error(error);
  return new Error(`AWS SDK error wrapper for ${error}`);
};
function bindRetryMiddleware(isStreamingPayload2) {
  return (options) => (next, context) => async (args) => {
    let retryStrategy = await options.retryStrategy();
    const maxAttempts = await options.maxAttempts();
    if (isRetryStrategyV2(retryStrategy)) {
      retryStrategy = retryStrategy;
      let retryToken = await retryStrategy.acquireInitialRetryToken((context["partition_id"] ?? "") + (context.__retryLongPoll ? ":longpoll" : ""));
      let lastError = new Error();
      let attempts = 0;
      let totalRetryDelay = 0;
      const { request } = args;
      const isRequest = HttpRequest.isInstance(request);
      if (isRequest) {
        request.headers[INVOCATION_ID_HEADER] = v4();
      }
      while (true) {
        try {
          if (isRequest) {
            request.headers[REQUEST_HEADER] = `attempt=${attempts + 1}; max=${maxAttempts}`;
          }
          const { response, output } = await next(args);
          retryStrategy.recordSuccess(retryToken);
          output.$metadata.attempts = attempts + 1;
          output.$metadata.totalRetryDelay = totalRetryDelay;
          return { response, output };
        } catch (e) {
          const retryErrorInfo = getRetryErrorInfo(e, options.logger);
          lastError = asSdkError(e);
          if (isRequest && isStreamingPayload2(request)) {
            (context.logger instanceof NoOpLogger ? console : context.logger)?.warn("An error was encountered in a non-retryable streaming request.");
            throw lastError;
          }
          try {
            retryToken = await retryStrategy.refreshRetryTokenForRetry(retryToken, retryErrorInfo);
          } catch (ignoredRefreshError) {
            if (!lastError.$metadata) {
              lastError.$metadata = {};
            }
            lastError.$metadata.attempts = attempts + 1;
            lastError.$metadata.totalRetryDelay = totalRetryDelay;
            throw lastError;
          }
          attempts = retryToken.getRetryCount();
          const delay = retryToken.getRetryDelay();
          totalRetryDelay += (retryToken?.$retryLog?.acquisitionDelay ?? 0) + delay;
          if (delay > 0) {
            await cooldown(delay);
          }
        }
      }
    } else {
      retryStrategy = retryStrategy;
      if (retryStrategy?.mode) {
        context.userAgent = [...context.userAgent || [], ["cfg/retry-mode", retryStrategy.mode]];
      }
      return retryStrategy.retry(next, args);
    }
  };
}
const cooldown = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const isRetryStrategyV2 = (retryStrategy) => typeof retryStrategy.acquireInitialRetryToken !== "undefined" && typeof retryStrategy.refreshRetryTokenForRetry !== "undefined" && typeof retryStrategy.recordSuccess !== "undefined";
const getRetryErrorInfo = (error, logger2) => {
  const errorInfo = {
    error,
    errorType: getRetryErrorType(error)
  };
  const retryAfterHint = parseRetryAfterHeader(error.$response, logger2);
  if (retryAfterHint) {
    errorInfo.retryAfterHint = retryAfterHint;
  }
  return errorInfo;
};
const getRetryErrorType = (error) => {
  if (isThrottlingError(error))
    return "THROTTLING";
  if (isTransientError(error))
    return "TRANSIENT";
  if (isServerError(error))
    return "SERVER_ERROR";
  return "CLIENT_ERROR";
};
const retryMiddlewareOptions = {
  name: "retryMiddleware",
  tags: ["RETRY"],
  step: "finalizeRequest",
  priority: "high",
  override: true
};
function bindGetRetryPlugin(isStreamingPayload2) {
  const retryMiddleware = bindRetryMiddleware(isStreamingPayload2);
  return (options) => ({
    applyToStack: (clientStack) => {
      clientStack.add(retryMiddleware(options), retryMiddlewareOptions);
    }
  });
}
class DefaultRateLimiter {
  static setTimeoutFn = (fn, delay) => setTimeout(fn, delay);
  beta;
  minCapacity;
  minFillRate;
  scaleConstant;
  smooth;
  enabled = false;
  availableTokens = 0;
  lastMaxRate = 0;
  measuredTxRate = 0;
  requestCount = 0;
  fillRate;
  lastThrottleTime;
  lastTimestamp = 0;
  lastTxRateBucket;
  maxCapacity;
  timeWindow = 0;
  constructor(options) {
    this.beta = options?.beta ?? 0.7;
    this.minCapacity = options?.minCapacity ?? 1;
    this.minFillRate = options?.minFillRate ?? 0.5;
    this.scaleConstant = options?.scaleConstant ?? 0.4;
    this.smooth = options?.smooth ?? 0.8;
    this.lastThrottleTime = this.getCurrentTimeInSeconds();
    this.lastTxRateBucket = Math.floor(this.getCurrentTimeInSeconds());
    this.fillRate = this.minFillRate;
    this.maxCapacity = this.minCapacity;
  }
  async getSendToken() {
    return this.acquireTokenBucket(1);
  }
  updateClientSendingRate(response) {
    let calculatedRate;
    this.updateMeasuredRate();
    const retryErrorInfo = response;
    const isThrottling = retryErrorInfo?.errorType === "THROTTLING" || isThrottlingError(retryErrorInfo?.error ?? response);
    if (isThrottling) {
      const rateToUse = !this.enabled ? this.measuredTxRate : Math.min(this.measuredTxRate, this.fillRate);
      this.lastMaxRate = rateToUse;
      this.calculateTimeWindow();
      this.lastThrottleTime = this.getCurrentTimeInSeconds();
      calculatedRate = this.cubicThrottle(rateToUse);
      this.enableTokenBucket();
    } else {
      this.calculateTimeWindow();
      calculatedRate = this.cubicSuccess(this.getCurrentTimeInSeconds());
    }
    const newRate = Math.min(calculatedRate, 2 * this.measuredTxRate);
    this.updateTokenBucketRate(newRate);
  }
  getCurrentTimeInSeconds() {
    return Date.now() / 1e3;
  }
  async acquireTokenBucket(amount) {
    if (!this.enabled) {
      return;
    }
    this.refillTokenBucket();
    while (amount > this.availableTokens) {
      const delay = (amount - this.availableTokens) / this.fillRate * 1e3;
      await new Promise((resolve) => DefaultRateLimiter.setTimeoutFn(resolve, delay));
      this.refillTokenBucket();
    }
    this.availableTokens = this.availableTokens - amount;
  }
  refillTokenBucket() {
    const timestamp = this.getCurrentTimeInSeconds();
    if (!this.lastTimestamp) {
      this.lastTimestamp = timestamp;
      return;
    }
    const fillAmount = (timestamp - this.lastTimestamp) * this.fillRate;
    this.availableTokens = Math.min(this.maxCapacity, this.availableTokens + fillAmount);
    this.lastTimestamp = timestamp;
  }
  calculateTimeWindow() {
    this.timeWindow = this.getPrecise(Math.pow(this.lastMaxRate * (1 - this.beta) / this.scaleConstant, 1 / 3));
  }
  cubicThrottle(rateToUse) {
    return this.getPrecise(rateToUse * this.beta);
  }
  cubicSuccess(timestamp) {
    return this.getPrecise(this.scaleConstant * Math.pow(timestamp - this.lastThrottleTime - this.timeWindow, 3) + this.lastMaxRate);
  }
  enableTokenBucket() {
    this.enabled = true;
  }
  updateTokenBucketRate(newRate) {
    this.refillTokenBucket();
    this.fillRate = Math.max(newRate, this.minFillRate);
    this.maxCapacity = Math.max(newRate, this.minCapacity);
    this.availableTokens = Math.min(this.availableTokens, this.maxCapacity);
  }
  updateMeasuredRate() {
    const t = this.getCurrentTimeInSeconds();
    const timeBucket = Math.floor(t * 2) / 2;
    this.requestCount++;
    if (timeBucket > this.lastTxRateBucket) {
      const currentRate = this.requestCount / (timeBucket - this.lastTxRateBucket);
      this.measuredTxRate = this.getPrecise(currentRate * this.smooth + this.measuredTxRate * (1 - this.smooth));
      this.requestCount = 0;
      this.lastTxRateBucket = timeBucket;
    }
  }
  getPrecise(num) {
    return parseFloat(num.toFixed(8));
  }
}
class Retry {
  static v2026 = typeof process !== "undefined" && process.env?.SMITHY_NEW_RETRIES_2026 === "true";
  static delay() {
    return Retry.v2026 ? 50 : 100;
  }
  static throttlingDelay() {
    return Retry.v2026 ? 1e3 : 500;
  }
  static cost() {
    return Retry.v2026 ? 14 : 5;
  }
  static throttlingCost() {
    return Retry.v2026 ? 5 : 10;
  }
  static modifiedCostType() {
    return Retry.v2026 ? "THROTTLING" : "TRANSIENT";
  }
}
class DefaultRetryBackoffStrategy {
  x = Retry.delay();
  computeNextBackoffDelay(i) {
    const b = Math.random();
    const r = 2;
    const t_i = b * Math.min(this.x * r ** i, MAXIMUM_RETRY_DELAY);
    return Math.floor(t_i);
  }
  setDelayBase(delay) {
    this.x = delay;
  }
}
class DefaultRetryToken {
  delay;
  count;
  cost;
  longPoll;
  $retryLog = {
    acquisitionDelay: 0
  };
  constructor(delay, count, cost, longPoll) {
    this.delay = delay;
    this.count = count;
    this.cost = cost;
    this.longPoll = longPoll;
  }
  getRetryCount() {
    return this.count;
  }
  getRetryDelay() {
    return Math.min(MAXIMUM_RETRY_DELAY, this.delay);
  }
  getRetryCost() {
    return this.cost;
  }
  isLongPoll() {
    return this.longPoll;
  }
}
var RETRY_MODES;
(function(RETRY_MODES2) {
  RETRY_MODES2["STANDARD"] = "standard";
  RETRY_MODES2["ADAPTIVE"] = "adaptive";
})(RETRY_MODES || (RETRY_MODES = {}));
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_RETRY_MODE = RETRY_MODES.STANDARD;
const refusal = {
  incompatible: 1,
  attempts: 2,
  capacity: 3
};
class StandardRetryStrategy {
  mode = RETRY_MODES.STANDARD;
  retryBackoffStrategy;
  capacity = INITIAL_RETRY_TOKENS;
  maxAttemptsProvider;
  baseDelay;
  constructor(arg1) {
    if (typeof arg1 === "number") {
      this.maxAttemptsProvider = async () => arg1;
    } else if (typeof arg1 === "function") {
      this.maxAttemptsProvider = arg1;
    } else if (arg1 && typeof arg1 === "object") {
      this.maxAttemptsProvider = async () => arg1.maxAttempts;
      this.baseDelay = arg1.baseDelay;
      this.retryBackoffStrategy = arg1.backoff;
    }
    this.maxAttemptsProvider ??= async () => DEFAULT_MAX_ATTEMPTS;
    this.baseDelay ??= Retry.delay();
    this.retryBackoffStrategy ??= new DefaultRetryBackoffStrategy();
  }
  async acquireInitialRetryToken(retryTokenScope) {
    return new DefaultRetryToken(Retry.delay(), 0, void 0, Retry.v2026 && retryTokenScope.includes(":longpoll"));
  }
  async refreshRetryTokenForRetry(token, errorInfo) {
    const maxAttempts = await this.getMaxAttempts();
    const retryCode = this.retryCode(token, errorInfo, maxAttempts);
    const shouldRetry = retryCode === 0;
    const isLongPoll = token.isLongPoll?.();
    if (shouldRetry || isLongPoll) {
      const errorType = errorInfo.errorType;
      this.retryBackoffStrategy.setDelayBase(errorType === "THROTTLING" ? Retry.throttlingDelay() : this.baseDelay);
      const delayFromErrorType = this.retryBackoffStrategy.computeNextBackoffDelay(token.getRetryCount());
      let retryDelay = delayFromErrorType;
      if (errorInfo.retryAfterHint instanceof Date) {
        retryDelay = Math.max(delayFromErrorType, Math.min(errorInfo.retryAfterHint.getTime() - Date.now(), delayFromErrorType + 5e3));
      }
      if (!shouldRetry) {
        const longPollBackoff = Retry.v2026 && retryCode === refusal.capacity && isLongPoll ? retryDelay : 0;
        if (longPollBackoff > 0) {
          await new Promise((r) => setTimeout(r, longPollBackoff));
        }
      } else {
        const capacityCost = this.getCapacityCost(errorType);
        this.capacity -= capacityCost;
        const nextToken = new DefaultRetryToken(0, token.getRetryCount() + 1, capacityCost, token.isLongPoll?.() ?? false);
        await new Promise((r) => setTimeout(r, retryDelay));
        nextToken.$retryLog.acquisitionDelay = retryDelay;
        return nextToken;
      }
    }
    throw new Error("No retry token available");
  }
  recordSuccess(token) {
    this.capacity = Math.min(INITIAL_RETRY_TOKENS, this.capacity + (token.getRetryCost() ?? NO_RETRY_INCREMENT));
  }
  getCapacity() {
    return this.capacity;
  }
  async maxAttempts() {
    return this.maxAttemptsProvider();
  }
  async getMaxAttempts() {
    try {
      return await this.maxAttemptsProvider();
    } catch (ignored) {
      console.warn(`Max attempts provider could not resolve. Using default of ${DEFAULT_MAX_ATTEMPTS}`);
      return DEFAULT_MAX_ATTEMPTS;
    }
  }
  retryCode(tokenToRenew, errorInfo, maxAttempts) {
    const attempts = tokenToRenew.getRetryCount() + 1;
    const retryableStatus = this.isRetryableError(errorInfo.errorType) ? 0 : refusal.incompatible;
    const attemptStatus = attempts < maxAttempts ? 0 : refusal.attempts;
    const capacityStatus = this.capacity >= this.getCapacityCost(errorInfo.errorType) ? 0 : refusal.capacity;
    return retryableStatus || attemptStatus || capacityStatus;
  }
  getCapacityCost(errorType) {
    return errorType === Retry.modifiedCostType() ? Retry.throttlingCost() : Retry.cost();
  }
  isRetryableError(errorType) {
    return errorType === "THROTTLING" || errorType === "TRANSIENT";
  }
}
class AdaptiveRetryStrategy {
  mode = RETRY_MODES.ADAPTIVE;
  rateLimiter;
  standardRetryStrategy;
  constructor(maxAttemptsProvider, options) {
    const { rateLimiter } = options ?? {};
    this.rateLimiter = rateLimiter ?? new DefaultRateLimiter();
    this.standardRetryStrategy = options ? new StandardRetryStrategy({
      maxAttempts: typeof maxAttemptsProvider === "number" ? maxAttemptsProvider : 3,
      ...options
    }) : new StandardRetryStrategy(maxAttemptsProvider);
  }
  async acquireInitialRetryToken(retryTokenScope) {
    const token = await this.standardRetryStrategy.acquireInitialRetryToken(retryTokenScope);
    await this.rateLimiter.getSendToken();
    return token;
  }
  async refreshRetryTokenForRetry(tokenToRenew, errorInfo) {
    this.rateLimiter.updateClientSendingRate(errorInfo);
    const token = await this.standardRetryStrategy.refreshRetryTokenForRetry(tokenToRenew, errorInfo);
    await this.rateLimiter.getSendToken();
    return token;
  }
  recordSuccess(token) {
    this.rateLimiter.updateClientSendingRate({});
    this.standardRetryStrategy.recordSuccess(token);
  }
  async maxAttemptsProvider() {
    return this.standardRetryStrategy.maxAttempts();
  }
}
const ENV_MAX_ATTEMPTS = "AWS_MAX_ATTEMPTS";
const CONFIG_MAX_ATTEMPTS = "max_attempts";
const NODE_MAX_ATTEMPT_CONFIG_OPTIONS = {
  environmentVariableSelector: (env) => {
    const value = env[ENV_MAX_ATTEMPTS];
    if (!value)
      return void 0;
    const maxAttempt = parseInt(value);
    if (Number.isNaN(maxAttempt)) {
      throw new Error(`Environment variable ${ENV_MAX_ATTEMPTS} mast be a number, got "${value}"`);
    }
    return maxAttempt;
  },
  configFileSelector: (profile) => {
    const value = profile[CONFIG_MAX_ATTEMPTS];
    if (!value)
      return void 0;
    const maxAttempt = parseInt(value);
    if (Number.isNaN(maxAttempt)) {
      throw new Error(`Shared config file entry ${CONFIG_MAX_ATTEMPTS} mast be a number, got "${value}"`);
    }
    return maxAttempt;
  },
  default: DEFAULT_MAX_ATTEMPTS
};
const resolveRetryConfig = (input, defaults) => {
  const { retryStrategy, retryMode } = input;
  const { defaultMaxAttempts = DEFAULT_MAX_ATTEMPTS, defaultBaseDelay = Retry.delay() } = {};
  const maxAttemptsProvider = normalizeProvider$1(input.maxAttempts ?? defaultMaxAttempts);
  let controller = retryStrategy ? Promise.resolve(retryStrategy) : void 0;
  const getDefault = async () => {
    const maxAttempts = await maxAttemptsProvider();
    const adaptive = await normalizeProvider$1(retryMode)() === RETRY_MODES.ADAPTIVE;
    if (adaptive) {
      return new AdaptiveRetryStrategy(maxAttemptsProvider, {
        maxAttempts,
        baseDelay: defaultBaseDelay
      });
    }
    return new StandardRetryStrategy({
      maxAttempts,
      baseDelay: defaultBaseDelay
    });
  };
  return Object.assign(input, {
    maxAttempts: maxAttemptsProvider,
    retryStrategy: () => controller ??= getDefault()
  });
};
const ENV_RETRY_MODE = "AWS_RETRY_MODE";
const CONFIG_RETRY_MODE = "retry_mode";
const NODE_RETRY_MODE_CONFIG_OPTIONS = {
  environmentVariableSelector: (env) => env[ENV_RETRY_MODE],
  configFileSelector: (profile) => profile[CONFIG_RETRY_MODE],
  default: DEFAULT_RETRY_MODE
};
const getRetryPlugin = bindGetRetryPlugin(isStreamingPayload);
const resolveAuthOptions = (candidateAuthOptions, authSchemePreference) => {
  if (!authSchemePreference || authSchemePreference.length === 0) {
    return candidateAuthOptions;
  }
  const preferredAuthOptions = [];
  for (const preferredSchemeName of authSchemePreference) {
    for (const candidateAuthOption of candidateAuthOptions) {
      const candidateAuthSchemeName = candidateAuthOption.schemeId.split("#")[1];
      if (candidateAuthSchemeName === preferredSchemeName) {
        preferredAuthOptions.push(candidateAuthOption);
      }
    }
  }
  for (const candidateAuthOption of candidateAuthOptions) {
    if (!preferredAuthOptions.find(({ schemeId }) => schemeId === candidateAuthOption.schemeId)) {
      preferredAuthOptions.push(candidateAuthOption);
    }
  }
  return preferredAuthOptions;
};
function convertHttpAuthSchemesToMap(httpAuthSchemes) {
  const map = /* @__PURE__ */ new Map();
  for (const scheme of httpAuthSchemes) {
    map.set(scheme.schemeId, scheme);
  }
  return map;
}
const httpAuthSchemeMiddleware = (config, mwOptions) => (next, context) => async (args) => {
  const options = config.httpAuthSchemeProvider(await mwOptions.httpAuthSchemeParametersProvider(config, context, args.input));
  const authSchemePreference = config.authSchemePreference ? await config.authSchemePreference() : [];
  const resolvedOptions = resolveAuthOptions(options, authSchemePreference);
  const authSchemes = convertHttpAuthSchemesToMap(config.httpAuthSchemes);
  const smithyContext = getSmithyContext(context);
  const failureReasons = [];
  for (const option of resolvedOptions) {
    const scheme = authSchemes.get(option.schemeId);
    if (!scheme) {
      failureReasons.push(`HttpAuthScheme \`${option.schemeId}\` was not enabled for this service.`);
      continue;
    }
    const identityProvider = scheme.identityProvider(await mwOptions.identityProviderConfigProvider(config));
    if (!identityProvider) {
      failureReasons.push(`HttpAuthScheme \`${option.schemeId}\` did not have an IdentityProvider configured.`);
      continue;
    }
    const { identityProperties = {}, signingProperties = {} } = option.propertiesExtractor?.(config, context) || {};
    option.identityProperties = Object.assign(option.identityProperties || {}, identityProperties);
    option.signingProperties = Object.assign(option.signingProperties || {}, signingProperties);
    smithyContext.selectedHttpAuthScheme = {
      httpAuthOption: option,
      identity: await identityProvider(option.identityProperties),
      signer: scheme.signer
    };
    break;
  }
  if (!smithyContext.selectedHttpAuthScheme) {
    throw new Error(failureReasons.join("\n"));
  }
  return next(args);
};
const httpAuthSchemeEndpointRuleSetMiddlewareOptions = {
  step: "serialize",
  tags: ["HTTP_AUTH_SCHEME"],
  name: "httpAuthSchemeMiddleware",
  override: true,
  relation: "before",
  toMiddleware: "endpointV2Middleware"
};
const getHttpAuthSchemeEndpointRuleSetPlugin = (config, { httpAuthSchemeParametersProvider, identityProviderConfigProvider }) => ({
  applyToStack: (clientStack) => {
    clientStack.addRelativeTo(httpAuthSchemeMiddleware(config, {
      httpAuthSchemeParametersProvider,
      identityProviderConfigProvider
    }), httpAuthSchemeEndpointRuleSetMiddlewareOptions);
  }
});
const defaultErrorHandler = (signingProperties) => (error) => {
  throw error;
};
const defaultSuccessHandler = (httpResponse, signingProperties) => {
};
const httpSigningMiddleware = (config) => (next, context) => async (args) => {
  if (!HttpRequest.isInstance(args.request)) {
    return next(args);
  }
  const smithyContext = getSmithyContext(context);
  const scheme = smithyContext.selectedHttpAuthScheme;
  if (!scheme) {
    throw new Error(`No HttpAuthScheme was selected: unable to sign request`);
  }
  const { httpAuthOption: { signingProperties = {} }, identity, signer } = scheme;
  const output = await next({
    ...args,
    request: await signer.sign(args.request, identity, signingProperties)
  }).catch((signer.errorHandler || defaultErrorHandler)(signingProperties));
  (signer.successHandler || defaultSuccessHandler)(output.response, signingProperties);
  return output;
};
const httpSigningMiddlewareOptions = {
  step: "finalizeRequest",
  tags: ["HTTP_SIGNING"],
  name: "httpSigningMiddleware",
  aliases: ["apiKeyMiddleware", "tokenMiddleware", "awsAuthMiddleware"],
  override: true,
  relation: "after",
  toMiddleware: "retryMiddleware"
};
const getHttpSigningPlugin = (config) => ({
  applyToStack: (clientStack) => {
    clientStack.addRelativeTo(httpSigningMiddleware(), httpSigningMiddlewareOptions);
  }
});
const normalizeProvider = (input) => {
  if (typeof input === "function")
    return input;
  const promisified = Promise.resolve(input);
  return () => promisified;
};
class DefaultIdentityProviderConfig {
  authSchemes = /* @__PURE__ */ new Map();
  constructor(config) {
    for (const key in config) {
      const value = config[key];
      if (value !== void 0) {
        this.authSchemes.set(key, value);
      }
    }
  }
  getIdentityProvider(schemeId) {
    return this.authSchemes.get(schemeId);
  }
}
class NoAuthSigner {
  async sign(httpRequest, identity, signingProperties) {
    return httpRequest;
  }
}
const createIsIdentityExpiredFunction = (expirationMs) => function isIdentityExpired2(identity) {
  return doesIdentityRequireRefresh(identity) && identity.expiration.getTime() - Date.now() < expirationMs;
};
const EXPIRATION_MS = 3e5;
const isIdentityExpired = createIsIdentityExpiredFunction(EXPIRATION_MS);
const doesIdentityRequireRefresh = (identity) => identity.expiration !== void 0;
const memoizeIdentityProvider = (provider, isExpired, requiresRefresh) => {
  if (provider === void 0) {
    return void 0;
  }
  const normalizedProvider = typeof provider !== "function" ? async () => Promise.resolve(provider) : provider;
  let resolved;
  let pending;
  let hasResult;
  let isConstant = false;
  const coalesceProvider = async (options) => {
    if (!pending) {
      pending = normalizedProvider(options);
    }
    try {
      resolved = await pending;
      hasResult = true;
      isConstant = false;
    } finally {
      pending = void 0;
    }
    return resolved;
  };
  if (isExpired === void 0) {
    return async (options) => {
      if (!hasResult || options?.forceRefresh) {
        resolved = await coalesceProvider(options);
      }
      return resolved;
    };
  }
  return async (options) => {
    if (!hasResult || options?.forceRefresh) {
      resolved = await coalesceProvider(options);
    }
    if (isConstant) {
      return resolved;
    }
    if (!requiresRefresh(resolved)) {
      isConstant = true;
      return resolved;
    }
    if (isExpired(resolved)) {
      await coalesceProvider(options);
      return resolved;
    }
    return resolved;
  };
};
class HashCalculator extends Writable {
  hash;
  constructor(hash, options) {
    super(options);
    this.hash = hash;
  }
  _write(chunk, encoding, callback) {
    try {
      this.hash.update(toUint8Array(chunk));
    } catch (err) {
      return callback(err);
    }
    callback();
  }
}
const readableStreamHasher = (hashCtor, readableStream) => {
  if (readableStream.readableFlowing !== null) {
    throw new Error("Unable to calculate hash for flowing readable stream");
  }
  const hash = new hashCtor();
  const hashCalculator = new HashCalculator(hash);
  readableStream.pipe(hashCalculator);
  return new Promise((resolve, reject) => {
    readableStream.on("error", (err) => {
      hashCalculator.end();
      reject(err);
    });
    hashCalculator.on("error", reject);
    hashCalculator.on("finish", () => {
      hash.digest().then(resolve).catch(reject);
    });
  });
};
class Md5Js {
  digestLength = 16;
  state = Uint32Array.from(INIT$1);
  writeBuffer = new DataView(new ArrayBuffer(64));
  bufferLength = 0;
  bytesHashed = 0;
  update(sourceData) {
    const data = toUint8Array(sourceData);
    let pos = 0;
    let len = data.byteLength;
    this.bytesHashed += len;
    while (len > 0) {
      this.writeBuffer.setUint8(this.bufferLength++, data[pos++]);
      --len;
      if (this.bufferLength === 64) {
        compress(this.state, this.writeBuffer);
        this.bufferLength = 0;
      }
    }
  }
  async digest() {
    const state = Uint32Array.from(this.state);
    const buf = new DataView(this.writeBuffer.buffer.slice(0));
    let bufLen = this.bufferLength;
    const bits = this.bytesHashed * 8;
    buf.setUint8(bufLen++, 128);
    if (this.bufferLength % 64 >= 56) {
      for (let i = bufLen; i < 64; ++i) {
        buf.setUint8(i, 0);
      }
      compress(state, buf);
      bufLen = 0;
    }
    for (let i = bufLen; i < 56; ++i) {
      buf.setUint8(i, 0);
    }
    buf.setUint32(56, bits >>> 0, true);
    buf.setUint32(60, Math.floor(bits / 2 ** 32), true);
    compress(state, buf);
    const out = new Uint8Array(16);
    const view = new DataView(out.buffer);
    for (let i = 0; i < 4; ++i) {
      view.setUint32(i * 4, state[i], true);
    }
    return out;
  }
  reset() {
    this.state.set(INIT$1);
    this.writeBuffer = new DataView(new ArrayBuffer(64));
    this.bufferLength = 0;
    this.bytesHashed = 0;
  }
}
const INIT$1 = [1732584193, 4023233417, 2562383102, 271733878];
const M = 4294967295;
const S = Uint8Array.of(7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21);
const T = Array.from({ length: 64 }, (_, i) => Math.abs(Math.sin(i + 1)) * 2 ** 32 >>> 0);
function compress(state, block) {
  let a = state[0], b = state[1], c = state[2], d = state[3];
  for (let i = 0; i < 64; ++i) {
    let f, g;
    if (i < 16) {
      f = b & c | ~b & d;
      g = i;
    } else if (i < 32) {
      f = d & b | c & ~d;
      g = (5 * i + 1) % 16;
    } else if (i < 48) {
      f = b ^ c ^ d;
      g = (3 * i + 5) % 16;
    } else {
      f = c ^ (b | ~d);
      g = 7 * i % 16;
    }
    const x = block.getUint32(g * 4, true);
    const tmp = d;
    d = c;
    c = b;
    const s = S[(i >> 4) * 4 + (i & 3)];
    const sum = (a + f & M) + (x + T[i] & M) & M;
    b = b + ((sum << s | sum >>> 32 - s) >>> 0) & M;
    a = tmp;
  }
  state[0] = state[0] + a & M;
  state[1] = state[1] + b & M;
  state[2] = state[2] + c & M;
  state[3] = state[3] + d & M;
}
const hasNativeCrypto$1 = (() => {
  try {
    createHash("md5");
    return true;
  } catch {
    return false;
  }
})();
const Md5Node = hasNativeCrypto$1 ? buildNativeClass$2() : Md5Js;
function buildNativeClass$2() {
  return class Md5Node {
    digestLength = 16;
    hash = createHash("md5");
    update(data) {
      this.hash.update(toUint8Array(data));
    }
    async digest() {
      const buf = this.hash.copy().digest();
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    }
    reset() {
      this.hash = createHash("md5");
    }
  };
}
const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; ++i) {
  let c = i;
  for (let j = 0; j < 8; ++j) {
    c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
  }
  CRC32_TABLE[i] = c >>> 0;
}
const ONES = 4294967295;
class Crc32Js {
  digestLength = 4;
  checksum = ONES;
  update(data) {
    for (let i = 0; i < data.length; ++i) {
      this.checksum = this.checksum >>> 8 ^ CRC32_TABLE[(this.checksum ^ data[i]) & 255];
    }
  }
  digestSync() {
    return (this.checksum ^ ONES) >>> 0;
  }
  async digest() {
    const value = this.digestSync();
    const out = new Uint8Array(4);
    new DataView(out.buffer).setUint32(0, value, false);
    return out;
  }
  reset() {
    this.checksum = ONES;
  }
}
const zlibCrc32 = typeof zlib.crc32 === "function" ? zlib.crc32 : void 0;
const Crc32Node = zlibCrc32 ? buildNativeClass$1(zlibCrc32) : Crc32Js;
function buildNativeClass$1(nativeCrc32) {
  return class Crc32Node {
    digestLength = 4;
    value = 0;
    update(data) {
      this.value = nativeCrc32(data, this.value);
    }
    digestSync() {
      return this.value >>> 0;
    }
    async digest() {
      const out = new Uint8Array(4);
      new DataView(out.buffer).setUint32(0, this.digestSync(), false);
      return out;
    }
    reset() {
      this.value = 0;
    }
  };
}
const BLOCK = 64;
const DIGEST_LENGTH = 32;
const MAX_HASHABLE_LENGTH = 2 ** 53 - 1;
class Sha256Js {
  digestLength = DIGEST_LENGTH;
  state = Int32Array.from(INIT);
  w;
  buffer = new Uint8Array(64);
  bufferLength = 0;
  bytesHashed = 0;
  finished = false;
  inner;
  outer;
  constructor(secret) {
    if (secret) {
      const key = Sha256Js.normalizeKey(secret);
      this.inner = new Sha256Js();
      this.outer = new Sha256Js();
      const { inner, outer } = this;
      const pad = new Uint8Array(BLOCK * 2);
      for (let i = 0; i < BLOCK; ++i) {
        pad[i] = 54 ^ key[i];
        pad[i + BLOCK] = 92 ^ key[i];
      }
      inner.update(pad.subarray(0, BLOCK));
      outer.update(pad.subarray(BLOCK));
    }
  }
  update(data) {
    if (this.finished) {
      throw new Error("Attempted to update an already finished HMAC.");
    }
    if (this.inner) {
      this.inner.update(data);
      return;
    }
    const chunk = toUint8Array(data);
    let position = 0;
    let { byteLength } = chunk;
    this.bytesHashed += byteLength;
    if (this.bytesHashed * 8 > MAX_HASHABLE_LENGTH) {
      throw new Error("Cannot hash more than 2^53 - 1 bits");
    }
    while (byteLength > 0) {
      this.buffer[this.bufferLength++] = chunk[position++];
      byteLength--;
      if (this.bufferLength === BLOCK) {
        this.hashBuffer();
        this.bufferLength = 0;
      }
    }
  }
  async digest() {
    const { inner, outer } = this;
    if (inner && outer) {
      if (this.finished) {
        throw new Error("Attempted to digest an already finished HMAC.");
      }
      this.finished = true;
      const innerDigest = inner.digestSync();
      outer.update(innerDigest);
      return outer.digestSync();
    }
    return this.digestSync();
  }
  reset() {
    this.state = Int32Array.from(INIT);
    this.buffer = new Uint8Array(64);
    this.bufferLength = 0;
    this.bytesHashed = 0;
  }
  digestSync() {
    const state = this.state.slice();
    const buffer = this.buffer.slice();
    let bufferLength = this.bufferLength;
    const bitsHashed = this.bytesHashed * 8;
    const bufferView = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    bufferView.setUint8(bufferLength++, 128);
    if ((bufferLength - 1) % BLOCK >= BLOCK - 8) {
      for (let i = bufferLength; i < BLOCK; ++i) {
        bufferView.setUint8(i, 0);
      }
      this.hashBufferWith(state, buffer);
      bufferLength = 0;
    }
    for (let i = bufferLength; i < BLOCK - 8; ++i) {
      bufferView.setUint8(i, 0);
    }
    bufferView.setUint32(BLOCK - 8, Math.floor(bitsHashed / 4294967296), false);
    bufferView.setUint32(BLOCK - 4, bitsHashed, false);
    this.hashBufferWith(state, buffer);
    const out = new Uint8Array(DIGEST_LENGTH);
    for (let i = 0; i < 8; ++i) {
      out[i * 4] = state[i] >>> 24 & 255;
      out[i * 4 + 1] = state[i] >>> 16 & 255;
      out[i * 4 + 2] = state[i] >>> 8 & 255;
      out[i * 4 + 3] = state[i] >>> 0 & 255;
    }
    return out;
  }
  static normalizeKey(secret) {
    const key = toUint8Array(secret);
    if (key.byteLength > BLOCK) {
      const h = new Sha256Js();
      h.update(key);
      const out = h.digestSync();
      const padded = new Uint8Array(BLOCK);
      padded.set(out);
      return padded;
    }
    if (key.byteLength < BLOCK) {
      const padded = new Uint8Array(BLOCK);
      padded.set(key);
      return padded;
    }
    return key;
  }
  hashBuffer() {
    this.hashBufferWith(this.state, this.buffer);
  }
  hashBufferWith(state, buffer) {
    const w = this.w ??= new Int32Array(64);
    let s0 = state[0], s1 = state[1], s2 = state[2], s3 = state[3], s4 = state[4], s5 = state[5], s6 = state[6], s7 = state[7];
    for (let i = 0; i < BLOCK; ++i) {
      if (i < 16) {
        w[i] = (buffer[i * 4] & 255) << 24 | (buffer[i * 4 + 1] & 255) << 16 | (buffer[i * 4 + 2] & 255) << 8 | buffer[i * 4 + 3] & 255;
      } else {
        let u = w[i - 2];
        const t12 = (u >>> 17 | u << 15) ^ (u >>> 19 | u << 13) ^ u >>> 10;
        u = w[i - 15];
        const t22 = (u >>> 7 | u << 25) ^ (u >>> 18 | u << 14) ^ u >>> 3;
        w[i] = (t12 + w[i - 7] | 0) + (t22 + w[i - 16] | 0);
      }
      const t1 = (((s4 >>> 6 | s4 << 26) ^ (s4 >>> 11 | s4 << 21) ^ (s4 >>> 25 | s4 << 7)) + (s4 & s5 ^ ~s4 & s6) | 0) + (s7 + (K[i] + w[i] | 0) | 0) | 0;
      const t2 = ((s0 >>> 2 | s0 << 30) ^ (s0 >>> 13 | s0 << 19) ^ (s0 >>> 22 | s0 << 10)) + (s0 & s1 ^ s0 & s2 ^ s1 & s2) | 0;
      s7 = s6;
      s6 = s5;
      s5 = s4;
      s4 = s3 + t1 | 0;
      s3 = s2;
      s2 = s1;
      s1 = s0;
      s0 = t1 + t2 | 0;
    }
    state[0] += s0;
    state[1] += s1;
    state[2] += s2;
    state[3] += s3;
    state[4] += s4;
    state[5] += s5;
    state[6] += s6;
    state[7] += s7;
  }
}
const INIT = new Int32Array([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]);
const K = new Int32Array([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
const hasNativeCrypto = (() => {
  try {
    createHash("sha256");
    return true;
  } catch {
    return false;
  }
})();
const Sha256Node = hasNativeCrypto ? buildNativeClass() : Sha256Js;
function buildNativeClass() {
  return class Sha256Node {
    digestLength = 32;
    secret;
    hash;
    isHmac;
    finished = false;
    constructor(secret) {
      this.secret = secret;
      this.isHmac = !!secret;
      this.hash = this.createHash();
    }
    update(data) {
      if (this.finished) {
        throw new Error("Attempted to update an already finished hash.");
      }
      this.hash.update(data);
    }
    async digest() {
      let buf;
      if (this.isHmac) {
        this.finished = true;
        buf = this.hash.digest();
      } else {
        buf = this.hash.copy().digest();
      }
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    }
    reset() {
      this.hash = this.createHash();
      this.finished = false;
    }
    createHash() {
      return this.secret ? createHmac("sha256", toBuffer(this.secret)) : createHash("sha256");
    }
  };
}
function toBuffer(data) {
  if (typeof data === "string") {
    return data;
  }
  if (ArrayBuffer.isView(data)) {
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  }
  return Buffer.from(data);
}
class Int64 {
  bytes;
  constructor(bytes) {
    this.bytes = bytes;
    if (bytes.byteLength !== 8) {
      throw new Error("Int64 buffers must be exactly 8 bytes");
    }
  }
  static fromNumber(number) {
    if (number > 9223372036854776e3 || number < -9223372036854776e3) {
      throw new Error(`${number} is too large (or, if negative, too small) to represent as an Int64`);
    }
    const bytes = new Uint8Array(8);
    for (let i = 7, remaining = Math.abs(Math.round(number)); i > -1 && remaining > 0; i--, remaining /= 256) {
      bytes[i] = remaining;
    }
    if (number < 0) {
      negate(bytes);
    }
    return new Int64(bytes);
  }
  valueOf() {
    const bytes = this.bytes.slice(0);
    const negative = bytes[0] & 128;
    if (negative) {
      negate(bytes);
    }
    return parseInt(toHex(bytes), 16) * (negative ? -1 : 1);
  }
  toString() {
    return String(this.valueOf());
  }
}
function negate(bytes) {
  for (let i = 0; i < 8; i++) {
    bytes[i] ^= 255;
  }
  for (let i = 7; i > -1; i--) {
    bytes[i]++;
    if (bytes[i] !== 0)
      break;
  }
}
class HeaderMarshaller {
  toUtf8;
  fromUtf8;
  constructor(toUtf82, fromUtf82) {
    this.toUtf8 = toUtf82;
    this.fromUtf8 = fromUtf82;
  }
  format(headers) {
    const chunks = [];
    for (const headerName of Object.keys(headers)) {
      const bytes = this.fromUtf8(headerName);
      chunks.push(Uint8Array.from([bytes.byteLength]), bytes, this.formatHeaderValue(headers[headerName]));
    }
    const out = new Uint8Array(chunks.reduce((carry, bytes) => carry + bytes.byteLength, 0));
    let position = 0;
    for (const chunk of chunks) {
      out.set(chunk, position);
      position += chunk.byteLength;
    }
    return out;
  }
  formatHeaderValue(header) {
    switch (header.type) {
      case "boolean":
        return Uint8Array.from([header.value ? 0 : 1]);
      case "byte":
        return Uint8Array.from([2, header.value]);
      case "short":
        const shortView = new DataView(new ArrayBuffer(3));
        shortView.setUint8(0, 3);
        shortView.setInt16(1, header.value, false);
        return new Uint8Array(shortView.buffer);
      case "integer":
        const intView = new DataView(new ArrayBuffer(5));
        intView.setUint8(0, 4);
        intView.setInt32(1, header.value, false);
        return new Uint8Array(intView.buffer);
      case "long":
        const longBytes = new Uint8Array(9);
        longBytes[0] = 5;
        longBytes.set(header.value.bytes, 1);
        return longBytes;
      case "binary":
        const binView = new DataView(new ArrayBuffer(3 + header.value.byteLength));
        binView.setUint8(0, 6);
        binView.setUint16(1, header.value.byteLength, false);
        const binBytes = new Uint8Array(binView.buffer);
        binBytes.set(header.value, 3);
        return binBytes;
      case "string":
        const utf8Bytes = this.fromUtf8(header.value);
        const strView = new DataView(new ArrayBuffer(3 + utf8Bytes.byteLength));
        strView.setUint8(0, 7);
        strView.setUint16(1, utf8Bytes.byteLength, false);
        const strBytes = new Uint8Array(strView.buffer);
        strBytes.set(utf8Bytes, 3);
        return strBytes;
      case "timestamp":
        const tsBytes = new Uint8Array(9);
        tsBytes[0] = 8;
        tsBytes.set(Int64.fromNumber(header.value.valueOf()).bytes, 1);
        return tsBytes;
      case "uuid":
        if (!UUID_PATTERN.test(header.value)) {
          throw new Error(`Invalid UUID received: ${header.value}`);
        }
        const uuidBytes = new Uint8Array(17);
        uuidBytes[0] = 9;
        uuidBytes.set(fromHex(header.value.replace(/-/g, "")), 1);
        return uuidBytes;
    }
  }
  parse(headers) {
    const out = {};
    let position = 0;
    while (position < headers.byteLength) {
      const nameLength = headers.getUint8(position++);
      const name = this.toUtf8(new Uint8Array(headers.buffer, headers.byteOffset + position, nameLength));
      position += nameLength;
      switch (headers.getUint8(position++)) {
        case 0:
          out[name] = {
            type: BOOLEAN_TAG,
            value: true
          };
          break;
        case 1:
          out[name] = {
            type: BOOLEAN_TAG,
            value: false
          };
          break;
        case 2:
          out[name] = {
            type: BYTE_TAG,
            value: headers.getInt8(position++)
          };
          break;
        case 3:
          out[name] = {
            type: SHORT_TAG,
            value: headers.getInt16(position, false)
          };
          position += 2;
          break;
        case 4:
          out[name] = {
            type: INT_TAG,
            value: headers.getInt32(position, false)
          };
          position += 4;
          break;
        case 5:
          out[name] = {
            type: LONG_TAG,
            value: new Int64(new Uint8Array(headers.buffer, headers.byteOffset + position, 8))
          };
          position += 8;
          break;
        case 6:
          const binaryLength = headers.getUint16(position, false);
          position += 2;
          out[name] = {
            type: BINARY_TAG,
            value: new Uint8Array(headers.buffer, headers.byteOffset + position, binaryLength)
          };
          position += binaryLength;
          break;
        case 7:
          const stringLength = headers.getUint16(position, false);
          position += 2;
          out[name] = {
            type: STRING_TAG,
            value: this.toUtf8(new Uint8Array(headers.buffer, headers.byteOffset + position, stringLength))
          };
          position += stringLength;
          break;
        case 8:
          out[name] = {
            type: TIMESTAMP_TAG,
            value: new Date(new Int64(new Uint8Array(headers.buffer, headers.byteOffset + position, 8)).valueOf())
          };
          position += 8;
          break;
        case 9:
          const uuidBytes = new Uint8Array(headers.buffer, headers.byteOffset + position, 16);
          position += 16;
          out[name] = {
            type: UUID_TAG,
            value: `${toHex(uuidBytes.subarray(0, 4))}-${toHex(uuidBytes.subarray(4, 6))}-${toHex(uuidBytes.subarray(6, 8))}-${toHex(uuidBytes.subarray(8, 10))}-${toHex(uuidBytes.subarray(10))}`
          };
          break;
        default:
          throw new Error(`Unrecognized header type tag`);
      }
    }
    return out;
  }
}
var HEADER_VALUE_TYPE;
(function(HEADER_VALUE_TYPE2) {
  HEADER_VALUE_TYPE2[HEADER_VALUE_TYPE2["boolTrue"] = 0] = "boolTrue";
  HEADER_VALUE_TYPE2[HEADER_VALUE_TYPE2["boolFalse"] = 1] = "boolFalse";
  HEADER_VALUE_TYPE2[HEADER_VALUE_TYPE2["byte"] = 2] = "byte";
  HEADER_VALUE_TYPE2[HEADER_VALUE_TYPE2["short"] = 3] = "short";
  HEADER_VALUE_TYPE2[HEADER_VALUE_TYPE2["integer"] = 4] = "integer";
  HEADER_VALUE_TYPE2[HEADER_VALUE_TYPE2["long"] = 5] = "long";
  HEADER_VALUE_TYPE2[HEADER_VALUE_TYPE2["byteArray"] = 6] = "byteArray";
  HEADER_VALUE_TYPE2[HEADER_VALUE_TYPE2["string"] = 7] = "string";
  HEADER_VALUE_TYPE2[HEADER_VALUE_TYPE2["timestamp"] = 8] = "timestamp";
  HEADER_VALUE_TYPE2[HEADER_VALUE_TYPE2["uuid"] = 9] = "uuid";
})(HEADER_VALUE_TYPE || (HEADER_VALUE_TYPE = {}));
const BOOLEAN_TAG = "boolean";
const BYTE_TAG = "byte";
const SHORT_TAG = "short";
const INT_TAG = "integer";
const LONG_TAG = "long";
const BINARY_TAG = "binary";
const STRING_TAG = "string";
const TIMESTAMP_TAG = "timestamp";
const UUID_TAG = "uuid";
const UUID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const PRELUDE_MEMBER_LENGTH = 4;
const PRELUDE_LENGTH = PRELUDE_MEMBER_LENGTH * 2;
const CHECKSUM_LENGTH = 4;
const MINIMUM_MESSAGE_LENGTH = PRELUDE_LENGTH + CHECKSUM_LENGTH * 2;
function splitMessage({ byteLength, byteOffset, buffer }) {
  if (byteLength < MINIMUM_MESSAGE_LENGTH) {
    throw new Error("Provided message too short to accommodate event stream message overhead");
  }
  const view = new DataView(buffer, byteOffset, byteLength);
  const messageLength = view.getUint32(0, false);
  if (byteLength !== messageLength) {
    throw new Error("Reported message length does not match received message length");
  }
  const headerLength = view.getUint32(PRELUDE_MEMBER_LENGTH, false);
  const expectedPreludeChecksum = view.getUint32(PRELUDE_LENGTH, false);
  const expectedMessageChecksum = view.getUint32(byteLength - CHECKSUM_LENGTH, false);
  const checksummer = new Crc32Node();
  checksummer.update(new Uint8Array(buffer, byteOffset, PRELUDE_LENGTH));
  if (expectedPreludeChecksum !== checksummer.digestSync()) {
    throw new Error(`The prelude checksum specified in the message (${expectedPreludeChecksum}) does not match the calculated CRC32 checksum (${checksummer.digestSync()})`);
  }
  checksummer.update(new Uint8Array(buffer, byteOffset + PRELUDE_LENGTH, byteLength - (PRELUDE_LENGTH + CHECKSUM_LENGTH)));
  if (expectedMessageChecksum !== checksummer.digestSync()) {
    throw new Error(`The message checksum (${checksummer.digestSync()}) did not match the expected value of ${expectedMessageChecksum}`);
  }
  return {
    headers: new DataView(buffer, byteOffset + PRELUDE_LENGTH + CHECKSUM_LENGTH, headerLength),
    body: new Uint8Array(buffer, byteOffset + PRELUDE_LENGTH + CHECKSUM_LENGTH + headerLength, messageLength - headerLength - (PRELUDE_LENGTH + CHECKSUM_LENGTH + CHECKSUM_LENGTH))
  };
}
class EventStreamCodec {
  headerMarshaller;
  messageBuffer;
  isEndOfStream;
  constructor(toUtf82, fromUtf82) {
    this.headerMarshaller = new HeaderMarshaller(toUtf82, fromUtf82);
    this.messageBuffer = [];
    this.isEndOfStream = false;
  }
  feed(message) {
    this.messageBuffer.push(this.decode(message));
  }
  endOfStream() {
    this.isEndOfStream = true;
  }
  getMessage() {
    const message = this.messageBuffer.pop();
    const isEndOfStream = this.isEndOfStream;
    return {
      getMessage() {
        return message;
      },
      isEndOfStream() {
        return isEndOfStream;
      }
    };
  }
  getAvailableMessages() {
    const messages = this.messageBuffer;
    this.messageBuffer = [];
    const isEndOfStream = this.isEndOfStream;
    return {
      getMessages() {
        return messages;
      },
      isEndOfStream() {
        return isEndOfStream;
      }
    };
  }
  encode({ headers: rawHeaders, body }) {
    const headers = this.headerMarshaller.format(rawHeaders);
    const length = headers.byteLength + body.byteLength + 16;
    const out = new Uint8Array(length);
    const view = new DataView(out.buffer, out.byteOffset, out.byteLength);
    const checksum = new Crc32Node();
    view.setUint32(0, length, false);
    view.setUint32(4, headers.byteLength, false);
    checksum.update(out.subarray(0, 8));
    view.setUint32(8, checksum.digestSync(), false);
    out.set(headers, 12);
    out.set(body, headers.byteLength + 12);
    checksum.update(out.subarray(8, length - 4));
    view.setUint32(length - 4, checksum.digestSync(), false);
    return out;
  }
  decode(message) {
    const { headers, body } = splitMessage(message);
    return { headers: this.headerMarshaller.parse(headers), body };
  }
  formatHeaders(rawHeaders) {
    return this.headerMarshaller.format(rawHeaders);
  }
}
class MessageDecoderStream {
  options;
  constructor(options) {
    this.options = options;
  }
  [Symbol.asyncIterator]() {
    return this.asyncIterator();
  }
  async *asyncIterator() {
    for await (const bytes of this.options.inputStream) {
      const decoded = this.options.decoder.decode(bytes);
      yield decoded;
    }
  }
}
class MessageEncoderStream {
  options;
  constructor(options) {
    this.options = options;
  }
  [Symbol.asyncIterator]() {
    return this.asyncIterator();
  }
  async *asyncIterator() {
    for await (const msg of this.options.messageStream) {
      const encoded = this.options.encoder.encode(msg);
      yield encoded;
    }
    if (this.options.includeEndFrame) {
      yield new Uint8Array(0);
    }
  }
}
class SmithyMessageDecoderStream {
  options;
  constructor(options) {
    this.options = options;
  }
  [Symbol.asyncIterator]() {
    return this.asyncIterator();
  }
  async *asyncIterator() {
    for await (const message of this.options.messageStream) {
      const deserialized = await this.options.deserializer(message);
      if (deserialized === void 0)
        continue;
      yield deserialized;
    }
  }
}
class SmithyMessageEncoderStream {
  options;
  constructor(options) {
    this.options = options;
  }
  [Symbol.asyncIterator]() {
    return this.asyncIterator();
  }
  async *asyncIterator() {
    for await (const chunk of this.options.inputStream) {
      const payloadBuf = this.options.serializer(chunk);
      yield payloadBuf;
    }
  }
}
function getChunkedStream(source) {
  let currentMessageTotalLength = 0;
  let currentMessagePendingLength = 0;
  let currentMessage = null;
  let messageLengthBuffer = null;
  const allocateMessage = (size) => {
    if (typeof size !== "number") {
      throw new Error("Attempted to allocate an event message where size was not a number: " + size);
    }
    currentMessageTotalLength = size;
    currentMessagePendingLength = 4;
    currentMessage = new Uint8Array(size);
    const currentMessageView = new DataView(currentMessage.buffer);
    currentMessageView.setUint32(0, size, false);
  };
  const iterator = async function* () {
    const sourceIterator = source[Symbol.asyncIterator]();
    while (true) {
      const { value, done } = await sourceIterator.next();
      if (done) {
        if (!currentMessageTotalLength) {
          return;
        } else if (currentMessageTotalLength === currentMessagePendingLength) {
          yield currentMessage;
        } else {
          throw new Error("Truncated event message received.");
        }
        return;
      }
      const chunkLength = value.length;
      let currentOffset = 0;
      while (currentOffset < chunkLength) {
        if (!currentMessage) {
          const bytesRemaining = chunkLength - currentOffset;
          if (!messageLengthBuffer) {
            messageLengthBuffer = new Uint8Array(4);
          }
          const numBytesForTotal = Math.min(4 - currentMessagePendingLength, bytesRemaining);
          messageLengthBuffer.set(value.slice(currentOffset, currentOffset + numBytesForTotal), currentMessagePendingLength);
          currentMessagePendingLength += numBytesForTotal;
          currentOffset += numBytesForTotal;
          if (currentMessagePendingLength < 4) {
            break;
          }
          allocateMessage(new DataView(messageLengthBuffer.buffer).getUint32(0, false));
          messageLengthBuffer = null;
        }
        const numBytesToWrite = Math.min(currentMessageTotalLength - currentMessagePendingLength, chunkLength - currentOffset);
        currentMessage.set(value.slice(currentOffset, currentOffset + numBytesToWrite), currentMessagePendingLength);
        currentMessagePendingLength += numBytesToWrite;
        currentOffset += numBytesToWrite;
        if (currentMessageTotalLength && currentMessageTotalLength === currentMessagePendingLength) {
          yield currentMessage;
          currentMessage = null;
          currentMessageTotalLength = 0;
          currentMessagePendingLength = 0;
        }
      }
    }
  };
  return {
    [Symbol.asyncIterator]: iterator
  };
}
function getMessageUnmarshaller(deserializer, toUtf82) {
  return async function(message) {
    const { value: messageType } = message.headers[":message-type"];
    if (messageType === "error") {
      const unmodeledError = new Error(message.headers[":error-message"].value || "UnknownError");
      unmodeledError.name = message.headers[":error-code"].value;
      throw unmodeledError;
    } else if (messageType === "exception") {
      const code = message.headers[":exception-type"].value;
      const exception = { [code]: message };
      const deserializedException = await deserializer(exception);
      if (deserializedException.$unknown) {
        const error = new Error(toUtf82(message.body));
        error.name = code;
        throw error;
      }
      throw deserializedException[code];
    } else if (messageType === "event") {
      const event = {
        [message.headers[":event-type"].value]: message
      };
      const deserialized = await deserializer(event);
      if (deserialized.$unknown)
        return;
      return deserialized;
    } else {
      throw Error(`Unrecognizable event type: ${message.headers[":event-type"].value}`);
    }
  };
}
let EventStreamMarshaller$1 = class EventStreamMarshaller {
  eventStreamCodec;
  utfEncoder;
  constructor({ utf8Encoder, utf8Decoder }) {
    this.eventStreamCodec = new EventStreamCodec(utf8Encoder, utf8Decoder);
    this.utfEncoder = utf8Encoder;
  }
  deserialize(body, deserializer) {
    const inputStream = getChunkedStream(body);
    return new SmithyMessageDecoderStream({
      messageStream: new MessageDecoderStream({ inputStream, decoder: this.eventStreamCodec }),
      deserializer: getMessageUnmarshaller(deserializer, this.utfEncoder)
    });
  }
  serialize(inputStream, serializer) {
    return new MessageEncoderStream({
      messageStream: new SmithyMessageEncoderStream({ inputStream, serializer }),
      encoder: this.eventStreamCodec,
      includeEndFrame: true
    });
  }
};
class EventStreamMarshaller2 {
  universalMarshaller;
  constructor({ utf8Encoder, utf8Decoder }) {
    this.universalMarshaller = new EventStreamMarshaller$1({
      utf8Decoder,
      utf8Encoder
    });
  }
  deserialize(body, deserializer) {
    const bodyIterable = typeof body[Symbol.asyncIterator] === "function" ? body : readableToIterable(body);
    return this.universalMarshaller.deserialize(bodyIterable, deserializer);
  }
  serialize(input, serializer) {
    return Readable.from(this.universalMarshaller.serialize(input, serializer));
  }
}
const eventStreamSerdeProvider = (options) => new EventStreamMarshaller2(options);
async function* readableToIterable(readStream) {
  let streamEnded = false;
  let generationEnded = false;
  const records = new Array();
  readStream.on("error", (err) => {
    if (!streamEnded) {
      streamEnded = true;
    }
    if (err) {
      throw err;
    }
  });
  readStream.on("data", (data) => {
    records.push(data);
  });
  readStream.on("end", () => {
    streamEnded = true;
  });
  while (!generationEnded) {
    const value = await new Promise((resolve) => setTimeout(() => resolve(records.shift()), 0));
    if (value) {
      yield value;
    }
    generationEnded = streamEnded && records.length === 0;
  }
}
const resolveEventStreamSerdeConfig = (input) => Object.assign(input, {
  eventStreamMarshaller: input.eventStreamSerdeProvider(input)
});
class EventStreamSerde {
  marshaller;
  serializer;
  deserializer;
  serdeContext;
  defaultContentType;
  compositeErrorRegistry;
  constructor({ marshaller, serializer, deserializer, serdeContext, defaultContentType, compositeErrorRegistry }) {
    this.marshaller = marshaller;
    this.serializer = serializer;
    this.deserializer = deserializer;
    this.serdeContext = serdeContext;
    this.defaultContentType = defaultContentType;
    this.compositeErrorRegistry = compositeErrorRegistry;
  }
  async serializeEventStream({ eventStream, requestSchema, initialRequest, initialMessageType }) {
    const marshaller = this.marshaller;
    const eventStreamMember = requestSchema.getEventStreamMember();
    const unionSchema = requestSchema.getMemberSchema(eventStreamMember);
    const serializer = this.serializer;
    const defaultContentType = this.defaultContentType;
    const initialRequestMarker = /* @__PURE__ */ Symbol("initialRequestMarker");
    const eventStreamIterable = {
      async *[Symbol.asyncIterator]() {
        if (initialRequest) {
          const headers = {
            ":event-type": { type: "string", value: initialMessageType ?? "initial-request" },
            ":message-type": { type: "string", value: "event" },
            ":content-type": { type: "string", value: defaultContentType }
          };
          serializer.write(requestSchema, initialRequest);
          const body = serializer.flush();
          yield {
            [initialRequestMarker]: true,
            headers,
            body
          };
        }
        for await (const page of eventStream) {
          yield page;
        }
      }
    };
    return marshaller.serialize(eventStreamIterable, (event) => {
      if (event[initialRequestMarker]) {
        return {
          headers: event.headers,
          body: event.body
        };
      }
      let unionMember = "";
      for (const key in event) {
        if (key !== "__type") {
          unionMember = key;
          break;
        }
      }
      const { additionalHeaders, body, eventType, explicitPayloadContentType } = this.writeEventBody(unionMember, unionSchema, event);
      const headers = {
        ":event-type": { type: "string", value: eventType },
        ":message-type": { type: "string", value: "event" },
        ":content-type": { type: "string", value: explicitPayloadContentType ?? defaultContentType },
        ...additionalHeaders
      };
      return {
        headers,
        body
      };
    });
  }
  async deserializeEventStream({ response, responseSchema, initialResponseContainer, initialMessageType }) {
    const marshaller = this.marshaller;
    const eventStreamMember = responseSchema.getEventStreamMember();
    const unionSchema = responseSchema.getMemberSchema(eventStreamMember);
    const memberSchemas = unionSchema.getMemberSchemas();
    const initialResponseMarker = /* @__PURE__ */ Symbol("initialResponseMarker");
    const asyncIterable = marshaller.deserialize(response.body, async (event) => {
      let unionMember = "";
      for (const key in event) {
        if (key !== "__type") {
          unionMember = key;
          break;
        }
      }
      const body = event[unionMember].body;
      if (unionMember === (initialMessageType ?? "initial-response")) {
        const dataObject = await this.deserializer.read(responseSchema, body);
        delete dataObject[eventStreamMember];
        return {
          [initialResponseMarker]: true,
          ...dataObject
        };
      } else if (unionMember in memberSchemas) {
        const eventStreamSchema = memberSchemas[unionMember];
        if (eventStreamSchema.isStructSchema()) {
          const out = {};
          let hasBindings = false;
          for (const [name, member2] of eventStreamSchema.structIterator()) {
            const { eventHeader, eventPayload } = member2.getMergedTraits();
            hasBindings = hasBindings || Boolean(eventHeader || eventPayload);
            if (eventPayload) {
              if (member2.isBlobSchema()) {
                out[name] = body;
              } else if (member2.isStringSchema()) {
                out[name] = (this.serdeContext?.utf8Encoder ?? toUtf8$1)(body);
              } else if (member2.isStructSchema()) {
                out[name] = await this.deserializer.read(member2, body);
              }
            } else if (eventHeader) {
              const value = event[unionMember].headers[name]?.value;
              if (value != null) {
                if (member2.isNumericSchema()) {
                  if (value && typeof value === "object" && "bytes" in value) {
                    out[name] = BigInt(value.toString());
                  } else {
                    out[name] = Number(value);
                  }
                } else {
                  out[name] = value;
                }
              }
            }
          }
          return {
            [unionMember]: await this.readEventMember(eventStreamSchema, body, hasBindings, out)
          };
        }
        return {
          [unionMember]: await this.deserializer.read(eventStreamSchema, body)
        };
      } else {
        return {
          $unknown: event
        };
      }
    });
    const asyncIterator = asyncIterable[Symbol.asyncIterator]();
    const firstEvent = await asyncIterator.next();
    if (firstEvent.done) {
      return asyncIterable;
    }
    if (firstEvent.value?.[initialResponseMarker]) {
      if (!responseSchema) {
        throw new Error("@smithy::core/protocols - initial-response event encountered in event stream but no response schema given.");
      }
      for (const key in firstEvent.value) {
        initialResponseContainer[key] = firstEvent.value[key];
      }
    }
    return {
      async *[Symbol.asyncIterator]() {
        if (!firstEvent?.value?.[initialResponseMarker]) {
          yield firstEvent.value;
        }
        while (true) {
          const { done, value } = await asyncIterator.next();
          if (done) {
            break;
          }
          yield value;
        }
      }
    };
  }
  async readEventMember(eventStreamSchema, body, hasBindings, out) {
    let ErrCtor;
    const staticStructuralSchema = eventStreamSchema.getSchema();
    if (Array.isArray(staticStructuralSchema) && staticStructuralSchema[0] === -3) {
      const namespace = staticStructuralSchema[1];
      const nsRegistry = TypeRegistry.for(namespace);
      this.compositeErrorRegistry?.copyFrom(nsRegistry);
      ErrCtor = (this.compositeErrorRegistry ?? nsRegistry)?.getErrorCtor(staticStructuralSchema);
    }
    const dataObject = hasBindings ? out : body.byteLength === 0 ? {} : await this.deserializer.read(eventStreamSchema, body);
    if (ErrCtor) {
      const message = dataObject.message ?? dataObject.Message ?? "Unknown";
      const metadata = {};
      const $fault = eventStreamSchema.getMergedTraits().error;
      if ($fault) {
        metadata.$fault = $fault;
      }
      return Object.assign(new ErrCtor({}), metadata, {
        message
      }, dataObject);
    }
    return dataObject;
  }
  writeEventBody(unionMember, unionSchema, event) {
    const serializer = this.serializer;
    let eventType = unionMember;
    let explicitPayloadMember = null;
    let explicitPayloadContentType;
    const isKnownSchema = (() => {
      const struct = unionSchema.getSchema();
      return struct[4].includes(unionMember);
    })();
    const additionalHeaders = {};
    if (!isKnownSchema) {
      const [type, value] = event[unionMember];
      eventType = type;
      serializer.write(15, value);
    } else {
      const eventSchema = unionSchema.getMemberSchema(unionMember);
      if (eventSchema.isStructSchema()) {
        for (const [memberName, memberSchema] of eventSchema.structIterator()) {
          const { eventHeader, eventPayload } = memberSchema.getMergedTraits();
          if (eventPayload) {
            explicitPayloadMember = memberName;
          } else if (eventHeader) {
            const value = event[unionMember][memberName];
            let type = "binary";
            if (memberSchema.isNumericSchema()) {
              if ((-2) ** 31 <= value && value <= 2 ** 31 - 1) {
                type = "integer";
              } else {
                type = "long";
              }
            } else if (memberSchema.isTimestampSchema()) {
              type = "timestamp";
            } else if (memberSchema.isStringSchema()) {
              type = "string";
            } else if (memberSchema.isBooleanSchema()) {
              type = "boolean";
            }
            if (value != null) {
              additionalHeaders[memberName] = {
                type,
                value
              };
              delete event[unionMember][memberName];
            }
          }
        }
        if (explicitPayloadMember !== null) {
          const payloadSchema = eventSchema.getMemberSchema(explicitPayloadMember);
          if (payloadSchema.isBlobSchema()) {
            explicitPayloadContentType = "application/octet-stream";
          } else if (payloadSchema.isStringSchema()) {
            explicitPayloadContentType = "text/plain";
          }
          serializer.write(payloadSchema, event[unionMember][explicitPayloadMember]);
        } else {
          serializer.write(eventSchema, event[unionMember]);
        }
      } else if (eventSchema.isUnitSchema()) {
        serializer.write(eventSchema, {});
      } else {
        throw new Error("@smithy/core/event-streams - non-struct member not supported in event stream union.");
      }
    }
    const messageSerialization = serializer.flush() ?? new Uint8Array();
    const body = typeof messageSerialization === "string" ? (this.serdeContext?.utf8Decoder ?? fromUtf8$1)(messageSerialization) : messageSerialization;
    return {
      body,
      eventType,
      explicitPayloadContentType,
      additionalHeaders
    };
  }
}
const index = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  EventStreamCodec,
  EventStreamMarshaller: EventStreamMarshaller2,
  EventStreamSerde,
  HeaderMarshaller,
  Int64,
  MessageDecoderStream,
  MessageEncoderStream,
  SmithyMessageDecoderStream,
  SmithyMessageEncoderStream,
  UniversalEventStreamMarshaller: EventStreamMarshaller$1,
  eventStreamSerdeProvider,
  getChunkedStream,
  getMessageUnmarshaller,
  resolveEventStreamSerdeConfig
}, Symbol.toStringTag, { value: "Module" }));
export {
  makeBuilder as $,
  extendedEncodeURIComponent as A,
  RpcProtocol as B,
  deref as C,
  HttpResponse as D,
  memoizeIdentityProvider as E,
  FromStringShapeDeserializer as F,
  doesIdentityRequireRefresh as G,
  HttpRequest as H,
  isIdentityExpired as I,
  booleanSelector as J,
  httpSigningMiddlewareOptions as K,
  LazyJsonString as L,
  getSmithyContext as M,
  NODE_REGION_CONFIG_FILE_OPTIONS as N,
  fromUtf8$1 as O,
  ProviderError as P,
  fromHex as Q,
  Retry as R,
  SelectorType as S,
  TypeRegistry as T,
  toHex as U,
  escapeUri as V,
  isArrayBuffer as W,
  BinaryDecisionDiagram as X,
  EndpointCache as Y,
  decideEndpoint as Z,
  resolveParams as _,
  normalizeProvider as a,
  getEndpointPlugin as a0,
  ServiceException as a1,
  parseUrl as a2,
  Sha256Node as a3,
  sdkStreamMixin as a4,
  Md5Node as a5,
  NoOpLogger as a6,
  getAwsChunkedEncodingStream as a7,
  emitWarningIfUnsupportedVersion as a8,
  resolveDefaultsModeConfig as a9,
  chain as aA,
  ENV_PROFILE as aB,
  buildQueryString as aC,
  parseRfc3339DateTime as aD,
  getSSOTokenFromFile as aE,
  getProfileName as aF,
  parseKnownFiles as aG,
  loadSsoSessionData as aH,
  TokenProviderError as aI,
  getSSOTokenFilepath as aJ,
  externalDataInterceptor as aK,
  NoAuthSigner as aL,
  Command as aM,
  readableStreamHasher as aa,
  streamCollector as ab,
  eventStreamSerdeProvider as ac,
  calculateBodyLength as ad,
  loadConfigsForDefaultMode as ae,
  NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS as af,
  NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS as ag,
  NODE_RETRY_MODE_CONFIG_OPTIONS as ah,
  DEFAULT_RETRY_MODE as ai,
  NODE_MAX_ATTEMPT_CONFIG_OPTIONS as aj,
  getDefaultExtensionConfiguration as ak,
  getHttpHandlerExtensionConfiguration as al,
  resolveDefaultRuntimeConfig as am,
  resolveHttpHandlerRuntimeConfig as an,
  Client as ao,
  resolveRetryConfig as ap,
  resolveRegionConfig as aq,
  resolveEndpointConfig as ar,
  resolveEventStreamSerdeConfig as as,
  getSchemaSerdePlugin as at,
  getRetryPlugin as au,
  getContentLengthPlugin as av,
  getHttpAuthSchemeEndpointRuleSetPlugin as aw,
  getHttpSigningPlugin as ax,
  DefaultIdentityProviderConfig as ay,
  CredentialsProviderError as az,
  RETRY_MODES as b,
  isIpAddress as c,
  customEndpointFunctions as d,
  NODE_REGION_CONFIG_OPTIONS as e,
  decorateServiceException as f,
  NormalizedSchema as g,
  NumericValue as h,
  isValidHostLabel as i,
  collectBody as j,
  toUtf8$1 as k,
  loadConfig as l,
  fromBase64 as m,
  normalizeProvider$1 as n,
  determineTimestampFormat as o,
  parseEpochTimestamp as p,
  parseRfc7231DateTime as q,
  parseRfc3339DateTimeWithOffset as r,
  generateIdempotencyToken as s,
  toUint8Array as t,
  toBase64$1 as u,
  dateToUtcString as v,
  HttpBindingProtocol as w,
  HttpInterceptingShapeSerializer as x,
  HttpInterceptingShapeDeserializer as y,
  getValueFromTextNode as z
};
