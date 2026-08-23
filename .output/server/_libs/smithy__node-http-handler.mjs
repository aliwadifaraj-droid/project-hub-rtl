import node_https from "node:https";
import { Buffer } from "node:buffer";
import { Readable } from "node:stream";
import { aC as buildQueryString, D as HttpResponse } from "./smithy__core.mjs";

function buildAbortError(abortSignal) {
  const reason = abortSignal && typeof abortSignal === "object" && "reason" in abortSignal ? abortSignal.reason : void 0;
  if (reason) {
    if (reason instanceof Error) {
      const abortError3 = new Error("Request aborted");
      abortError3.name = "AbortError";
      abortError3.cause = reason;
      return abortError3;
    }
    const abortError2 = new Error(String(reason));
    abortError2.name = "AbortError";
    return abortError2;
  }
  const abortError = new Error("Request aborted");
  abortError.name = "AbortError";
  return abortError;
}
const NODEJS_TIMEOUT_ERROR_CODES = ["ECONNRESET", "EPIPE", "ETIMEDOUT"];
const getTransformedHeaders = (headers) => {
  const transformedHeaders = {};
  for (const name in headers) {
    const headerValues = headers[name];
    transformedHeaders[name] = Array.isArray(headerValues) ? headerValues.join(",") : headerValues;
  }
  return transformedHeaders;
};
const timing = {
  setTimeout: (cb, ms) => setTimeout(cb, ms),
  clearTimeout: (timeoutId) => clearTimeout(timeoutId)
};
const DEFER_EVENT_LISTENER_TIME$2 = 1e3;
const setConnectionTimeout = (request, reject, timeoutInMs = 0) => {
  if (!timeoutInMs) {
    return -1;
  }
  const registerTimeout = (offset) => {
    const timeoutId = timing.setTimeout(() => {
      request.destroy();
      reject(Object.assign(new Error(`@smithy/node-http-handler - the request socket did not establish a connection with the server within the configured timeout of ${timeoutInMs} ms.`), {
        name: "TimeoutError"
      }));
    }, timeoutInMs - offset);
    const doWithSocket = (socket) => {
      if (socket?.connecting) {
        socket.on("connect", () => {
          timing.clearTimeout(timeoutId);
        });
      } else {
        timing.clearTimeout(timeoutId);
      }
    };
    if (request.socket) {
      doWithSocket(request.socket);
    } else {
      request.on("socket", doWithSocket);
    }
  };
  if (timeoutInMs < 2e3) {
    registerTimeout(0);
    return 0;
  }
  return timing.setTimeout(registerTimeout.bind(null, DEFER_EVENT_LISTENER_TIME$2), DEFER_EVENT_LISTENER_TIME$2);
};
const setRequestTimeout = (req, reject, timeoutInMs = 0, throwOnRequestTimeout, logger) => {
  if (timeoutInMs) {
    return timing.setTimeout(() => {
      let msg = `@smithy/node-http-handler - [${throwOnRequestTimeout ? "ERROR" : "WARN"}] a request has exceeded the configured ${timeoutInMs} ms requestTimeout.`;
      if (throwOnRequestTimeout) {
        const error = Object.assign(new Error(msg), {
          name: "TimeoutError",
          code: "ETIMEDOUT"
        });
        req.destroy(error);
        reject(error);
      } else {
        msg += ` Init client requestHandler with throwOnRequestTimeout=true to turn this into an error.`;
        logger?.warn?.(msg);
      }
    }, timeoutInMs);
  }
  return -1;
};
const DEFER_EVENT_LISTENER_TIME$1 = 3e3;
const setSocketKeepAlive = (request, { keepAlive, keepAliveMsecs }, deferTimeMs = DEFER_EVENT_LISTENER_TIME$1) => {
  if (keepAlive !== true) {
    return -1;
  }
  const registerListener = () => {
    if (request.socket) {
      request.socket.setKeepAlive(keepAlive, keepAliveMsecs || 0);
    } else {
      request.on("socket", (socket) => {
        socket.setKeepAlive(keepAlive, keepAliveMsecs || 0);
      });
    }
  };
  if (deferTimeMs === 0) {
    registerListener();
    return 0;
  }
  return timing.setTimeout(registerListener, deferTimeMs);
};
const DEFER_EVENT_LISTENER_TIME = 3e3;
const setSocketTimeout = (request, reject, timeoutInMs = 0) => {
  const registerTimeout = (offset) => {
    const timeout = timeoutInMs - offset;
    const onTimeout = () => {
      request.destroy();
      reject(Object.assign(new Error(`@smithy/node-http-handler - the request socket timed out after ${timeoutInMs} ms of inactivity (configured by client requestHandler).`), { name: "TimeoutError" }));
    };
    if (request.socket) {
      request.socket.setTimeout(timeout, onTimeout);
      request.on("close", () => request.socket?.removeListener("timeout", onTimeout));
    } else {
      request.setTimeout(timeout, onTimeout);
    }
  };
  if (0 < timeoutInMs && timeoutInMs < 6e3) {
    registerTimeout(0);
    return 0;
  }
  return timing.setTimeout(registerTimeout.bind(null, timeoutInMs === 0 ? 0 : DEFER_EVENT_LISTENER_TIME), DEFER_EVENT_LISTENER_TIME);
};
const MIN_WAIT_TIME = 6e3;
async function writeRequestBody(httpRequest, request, maxContinueTimeoutMs = MIN_WAIT_TIME, externalAgent = false) {
  const headers = request.headers;
  const expect = headers ? headers.Expect || headers.expect : void 0;
  let timeoutId = -1;
  let sendBody = true;
  if (!externalAgent && expect === "100-continue") {
    sendBody = await Promise.race([
      new Promise((resolve) => {
        timeoutId = Number(timing.setTimeout(() => resolve(true), Math.max(MIN_WAIT_TIME, maxContinueTimeoutMs)));
      }),
      new Promise((resolve) => {
        httpRequest.on("continue", () => {
          timing.clearTimeout(timeoutId);
          resolve(true);
        });
        httpRequest.on("response", () => {
          timing.clearTimeout(timeoutId);
          resolve(false);
        });
        httpRequest.on("error", () => {
          timing.clearTimeout(timeoutId);
          resolve(false);
        });
      })
    ]);
  }
  if (sendBody) {
    writeBody(httpRequest, request.body);
  }
}
function writeBody(httpRequest, body) {
  if (body instanceof Readable) {
    body.pipe(httpRequest);
    return;
  }
  if (body) {
    const isBuffer = Buffer.isBuffer(body);
    const isString = typeof body === "string";
    if (isBuffer || isString) {
      if (isBuffer && body.byteLength === 0) {
        httpRequest.end();
      } else {
        httpRequest.end(body);
      }
      return;
    }
    const uint8 = body;
    if (typeof uint8 === "object" && uint8.buffer && typeof uint8.byteOffset === "number" && typeof uint8.byteLength === "number") {
      httpRequest.end(Buffer.from(uint8.buffer, uint8.byteOffset, uint8.byteLength));
      return;
    }
    httpRequest.end(Buffer.from(body));
    return;
  }
  httpRequest.end();
}
let hAgent = void 0;
let hRequest = void 0;
class NodeHttpHandler {
  config;
  configProvider;
  socketWarningTimestamp = 0;
  externalAgent = false;
  metadata = { handlerProtocol: "http/1.1" };
  static create(instanceOrOptions) {
    if (typeof instanceOrOptions?.handle === "function") {
      return instanceOrOptions;
    }
    return new NodeHttpHandler(instanceOrOptions);
  }
  static checkSocketUsage(agent, socketWarningTimestamp, logger = console) {
    const { sockets, requests, maxSockets } = agent;
    if (typeof maxSockets !== "number" || maxSockets === Infinity) {
      return socketWarningTimestamp;
    }
    const interval = 15e3;
    if (Date.now() - interval < socketWarningTimestamp) {
      return socketWarningTimestamp;
    }
    if (sockets && requests) {
      for (const origin in sockets) {
        const socketsInUse = sockets[origin]?.length ?? 0;
        const requestsEnqueued = requests[origin]?.length ?? 0;
        if (socketsInUse >= maxSockets && requestsEnqueued >= 2 * maxSockets) {
          logger?.warn?.(`@smithy/node-http-handler:WARN - socket usage at capacity=${socketsInUse} and ${requestsEnqueued} additional requests are enqueued.
See https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/node-configuring-maxsockets.html
or increase socketAcquisitionWarningTimeout=(millis) in the NodeHttpHandler config.`);
          return Date.now();
        }
      }
    }
    return socketWarningTimestamp;
  }
  constructor(options) {
    this.configProvider = new Promise((resolve, reject) => {
      if (typeof options === "function") {
        options().then((_options) => {
          resolve(this.resolveDefaultConfig(_options));
        }).catch(reject);
      } else {
        resolve(this.resolveDefaultConfig(options));
      }
    });
  }
  destroy() {
    this.config?.httpAgent?.destroy();
    this.config?.httpsAgent?.destroy();
  }
  async handle(request, { abortSignal, requestTimeout } = {}) {
    if (!this.config) {
      this.config = await this.configProvider;
    }
    const config = this.config;
    const logger = config.logger;
    const isSSL = request.protocol === "https:";
    if (!isSSL && !this.config.httpAgent) {
      this.config.httpAgent = await this.config.httpAgentProvider();
    }
    return new Promise((_resolve, _reject) => {
      let writeRequestBodyPromise = void 0;
      let socketWarningTimeoutId = -1;
      let connectionTimeoutId = -1;
      let requestTimeoutId = -1;
      let socketTimeoutId = -1;
      let keepAliveTimeoutId = -1;
      const clearTimeouts = () => {
        timing.clearTimeout(socketWarningTimeoutId);
        timing.clearTimeout(connectionTimeoutId);
        timing.clearTimeout(requestTimeoutId);
        timing.clearTimeout(socketTimeoutId);
        timing.clearTimeout(keepAliveTimeoutId);
      };
      const resolve = async (arg) => {
        await writeRequestBodyPromise;
        clearTimeouts();
        _resolve(arg);
      };
      const reject = async (arg) => {
        await writeRequestBodyPromise;
        clearTimeouts();
        _reject(arg);
      };
      if (abortSignal?.aborted) {
        const abortError = buildAbortError(abortSignal);
        reject(abortError);
        return;
      }
      const headers = request.headers;
      const expectContinue = headers ? (headers.Expect ?? headers.expect) === "100-continue" : false;
      let agent = isSSL ? config.httpsAgent : config.httpAgent;
      if (expectContinue && !this.externalAgent) {
        agent = new (isSSL ? node_https.Agent : hAgent)({
          keepAlive: false,
          maxSockets: Infinity
        });
      }
      socketWarningTimeoutId = timing.setTimeout(() => {
        this.socketWarningTimestamp = NodeHttpHandler.checkSocketUsage(agent, this.socketWarningTimestamp, logger);
      }, config.socketAcquisitionWarningTimeout ?? (config.requestTimeout ?? 2e3) + (config.connectionTimeout ?? 1e3));
      const queryString = request.query ? buildQueryString(request.query) : "";
      let auth = void 0;
      if (request.username != null || request.password != null) {
        const username = request.username ?? "";
        const password = request.password ?? "";
        auth = `${username}:${password}`;
      }
      let path = request.path;
      if (queryString) {
        path += `?${queryString}`;
      }
      if (request.fragment) {
        path += `#${request.fragment}`;
      }
      let hostname = request.hostname ?? "";
      if (hostname[0] === "[" && hostname.endsWith("]")) {
        hostname = request.hostname.slice(1, -1);
      } else {
        hostname = request.hostname;
      }
      const nodeHttpsOptions = {
        headers: request.headers,
        host: hostname,
        method: request.method,
        path,
        port: request.port,
        agent,
        auth
      };
      const requestFunc = isSSL ? node_https.request : hRequest;
      const req = requestFunc(nodeHttpsOptions, (res) => {
        const httpResponse = new HttpResponse({
          statusCode: res.statusCode || -1,
          reason: res.statusMessage,
          headers: getTransformedHeaders(res.headers),
          body: res
        });
        resolve({ response: httpResponse });
      });
      req.on("error", (err) => {
        if (NODEJS_TIMEOUT_ERROR_CODES.includes(err.code)) {
          reject(Object.assign(err, { name: "TimeoutError" }));
        } else {
          reject(err);
        }
      });
      if (abortSignal) {
        const onAbort = () => {
          req.destroy();
          const abortError = buildAbortError(abortSignal);
          reject(abortError);
        };
        if (typeof abortSignal.addEventListener === "function") {
          const signal = abortSignal;
          signal.addEventListener("abort", onAbort, { once: true });
          req.once("close", () => signal.removeEventListener("abort", onAbort));
        } else {
          abortSignal.onabort = onAbort;
        }
      }
      const effectiveRequestTimeout = requestTimeout ?? config.requestTimeout;
      connectionTimeoutId = setConnectionTimeout(req, reject, config.connectionTimeout);
      requestTimeoutId = setRequestTimeout(req, reject, effectiveRequestTimeout, config.throwOnRequestTimeout, logger ?? console);
      socketTimeoutId = setSocketTimeout(req, reject, config.socketTimeout);
      const httpAgent = nodeHttpsOptions.agent;
      if (typeof httpAgent === "object" && "keepAlive" in httpAgent) {
        keepAliveTimeoutId = setSocketKeepAlive(req, {
          keepAlive: httpAgent.keepAlive,
          keepAliveMsecs: httpAgent.keepAliveMsecs
        });
      }
      writeRequestBodyPromise = writeRequestBody(req, request, effectiveRequestTimeout, this.externalAgent).catch((e) => {
        clearTimeouts();
        return _reject(e);
      });
    });
  }
  updateHttpClientConfig(key, value) {
    this.config = void 0;
    this.configProvider = this.configProvider.then((config) => {
      if (key === /* @__PURE__ */ Symbol.for("logger")) {
        return {
          ...config,
          logger: config.logger ?? value
        };
      }
      return {
        ...config,
        [key]: value
      };
    });
  }
  httpHandlerConfigs() {
    return this.config ?? {};
  }
  resolveDefaultConfig(options) {
    const { requestTimeout, connectionTimeout, socketTimeout, socketAcquisitionWarningTimeout, httpAgent, httpsAgent, throwOnRequestTimeout, logger } = options || {};
    const keepAlive = true;
    const maxSockets = 50;
    return {
      connectionTimeout,
      requestTimeout,
      socketTimeout,
      socketAcquisitionWarningTimeout,
      throwOnRequestTimeout,
      httpAgentProvider: async () => {
        const node_http = await import("node:http");
        const { Agent, request } = node_http.default ?? node_http;
        hRequest = request;
        hAgent = Agent;
        if (httpAgent instanceof hAgent || typeof httpAgent?.destroy === "function") {
          this.externalAgent = true;
          return httpAgent;
        }
        return new hAgent({ keepAlive, maxSockets, ...httpAgent });
      },
      httpsAgent: (() => {
        if (httpsAgent instanceof node_https.Agent || typeof httpsAgent?.destroy === "function") {
          this.externalAgent = true;
          return httpsAgent;
        }
        return new node_https.Agent({ keepAlive, maxSockets, ...httpsAgent });
      })(),
      logger
    };
  }
}
export {
  NodeHttpHandler as N
};
