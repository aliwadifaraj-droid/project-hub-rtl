import process, { versions, env } from "node:process";
import { R as Retry, H as HttpRequest, a as normalizeProvider, b as RETRY_MODES, i as isValidHostLabel, c as isIpAddress, d as customEndpointFunctions, l as loadConfig, N as NODE_REGION_CONFIG_FILE_OPTIONS, e as NODE_REGION_CONFIG_OPTIONS, T as TypeRegistry, f as decorateServiceException, g as NormalizedSchema, h as NumericValue, j as collectBody, k as toUtf8, m as fromBase64, L as LazyJsonString, o as determineTimestampFormat, p as parseEpochTimestamp, q as parseRfc7231DateTime, r as parseRfc3339DateTimeWithOffset, s as generateIdempotencyToken, u as toBase64, v as dateToUtcString, w as HttpBindingProtocol, x as HttpInterceptingShapeSerializer, y as HttpInterceptingShapeDeserializer, F as FromStringShapeDeserializer, z as getValueFromTextNode, A as extendedEncodeURIComponent, B as RpcProtocol, C as deref, D as HttpResponse, P as ProviderError, E as memoizeIdentityProvider, G as doesIdentityRequireRefresh, I as isIdentityExpired, J as booleanSelector, S as SelectorType } from "./smithy__core.mjs";
import { I as InvokeStore } from "./aws__lambda-invoke-store.mjs";
import { platform, release } from "node:os";
import { Buffer } from "node:buffer";

import { p as parseXML, X as XmlNode, a as XmlText } from "./aws-sdk__xml-builder.mjs";
import { S as SignatureV4 } from "./smithy__signature-v4.mjs";
const state = {
  warningEmitted: false
};
const emitWarningIfUnsupportedVersion = (version) => {
  if (version && !state.warningEmitted) {
    if (process.env.AWS_SDK_JS_NODE_VERSION_SUPPORT_WARNING_DISABLED === "true") {
      state.warningEmitted = true;
      return;
    }
    const userMajorVersion = parseInt(version.substring(1, version.indexOf(".")));
    const vv = 22;
    if (userMajorVersion < vv) {
      state.warningEmitted = true;
      process.emitWarning(`NodeVersionSupportWarning: The AWS SDK for JavaScript (v3)
versions published after the first week of January 2027
will require node >=${vv}. You are running node ${version}.

To continue receiving updates to AWS services, bug fixes,
and security updates please upgrade to node >=${vv}.

More information can be found at: https://a.co/c895JFp`);
    }
  }
};
function setCredentialFeature(credentials, feature, value) {
  if (!credentials.$source) {
    credentials.$source = {};
  }
  credentials.$source[feature] = value;
  return credentials;
}
Retry.v2026 ||= typeof process === "object" && process.env?.AWS_NEW_RETRIES_2026 === "true";
function setFeature(context, feature, value) {
  if (!context.__aws_sdk_context) {
    context.__aws_sdk_context = {
      features: {}
    };
  } else if (!context.__aws_sdk_context.features) {
    context.__aws_sdk_context.features = {};
  }
  context.__aws_sdk_context.features[feature] = value;
}
function resolveHostHeaderConfig(input) {
  return input;
}
const hostHeaderMiddleware = (options) => (next) => async (args) => {
  if (!HttpRequest.isInstance(args.request))
    return next(args);
  const { request } = args;
  const { handlerProtocol = "" } = options.requestHandler.metadata || {};
  if (handlerProtocol.indexOf("h2") >= 0 && !request.headers[":authority"]) {
    delete request.headers["host"];
    request.headers[":authority"] = request.hostname + (request.port ? ":" + request.port : "");
  } else if (!request.headers["host"]) {
    let host = request.hostname;
    if (request.port != null)
      host += `:${request.port}`;
    request.headers["host"] = host;
  }
  return next(args);
};
const hostHeaderMiddlewareOptions = {
  name: "hostHeaderMiddleware",
  step: "build",
  priority: "low",
  tags: ["HOST"],
  override: true
};
const getHostHeaderPlugin = (options) => ({
  applyToStack: (clientStack) => {
    clientStack.add(hostHeaderMiddleware(options), hostHeaderMiddlewareOptions);
  }
});
const loggerMiddleware = () => (next, context) => async (args) => {
  try {
    const response = await next(args);
    const { clientName, commandName, logger, dynamoDbDocumentClientOptions = {} } = context;
    const { overrideInputFilterSensitiveLog, overrideOutputFilterSensitiveLog } = dynamoDbDocumentClientOptions;
    const inputFilterSensitiveLog = overrideInputFilterSensitiveLog ?? context.inputFilterSensitiveLog;
    const outputFilterSensitiveLog = overrideOutputFilterSensitiveLog ?? context.outputFilterSensitiveLog;
    const { $metadata, ...outputWithoutMetadata } = response.output;
    logger?.info?.({
      clientName,
      commandName,
      input: inputFilterSensitiveLog(args.input),
      output: outputFilterSensitiveLog(outputWithoutMetadata),
      metadata: $metadata
    });
    return response;
  } catch (error) {
    const { clientName, commandName, logger, dynamoDbDocumentClientOptions = {} } = context;
    const { overrideInputFilterSensitiveLog } = dynamoDbDocumentClientOptions;
    const inputFilterSensitiveLog = overrideInputFilterSensitiveLog ?? context.inputFilterSensitiveLog;
    logger?.error?.({
      clientName,
      commandName,
      input: inputFilterSensitiveLog(args.input),
      error,
      metadata: error.$metadata
    });
    throw error;
  }
};
const loggerMiddlewareOptions = {
  name: "loggerMiddleware",
  tags: ["LOGGER"],
  step: "initialize",
  override: true
};
const getLoggerPlugin = (options) => ({
  applyToStack: (clientStack) => {
    clientStack.add(loggerMiddleware(), loggerMiddlewareOptions);
  }
});
const recursionDetectionMiddlewareOptions = {
  step: "build",
  tags: ["RECURSION_DETECTION", "TRACE_CONTEXT_PROPAGATION"],
  name: "recursionDetectionMiddleware",
  override: true,
  priority: "low"
};
const AWS_LAMBDA_FUNCTION_NAME = "AWS_LAMBDA_FUNCTION_NAME";
const _X_AMZN_TRACE_ID = "_X_AMZN_TRACE_ID";
const X_AMZN_TRACE_ID = "X-Amzn-Trace-Id";
const TRACEPARENT = "traceparent";
const TRACESTATE = "tracestate";
const BAGGAGE = "baggage";
const recursionDetectionMiddleware = () => (next) => async (args) => {
  const { request } = args;
  if (!HttpRequest.isInstance(request)) {
    return next(args);
  }
  let invokeStore;
  {
    const traceIdHeader = Object.keys(request.headers ?? {}).find((h) => h.toLowerCase() === X_AMZN_TRACE_ID.toLowerCase()) ?? X_AMZN_TRACE_ID;
    if (!request.headers.hasOwnProperty(traceIdHeader)) {
      const functionName = process.env[AWS_LAMBDA_FUNCTION_NAME];
      const traceIdFromEnv = process.env[_X_AMZN_TRACE_ID];
      invokeStore ??= await InvokeStore.getInstanceAsync();
      const traceIdFromInvokeStore = invokeStore?.getXRayTraceId();
      const traceId = traceIdFromInvokeStore ?? traceIdFromEnv;
      const nonEmptyString = (str) => typeof str === "string" && str.length > 0;
      if (nonEmptyString(functionName) && nonEmptyString(traceId)) {
        request.headers[X_AMZN_TRACE_ID] = traceId;
      }
    }
  }
  {
    sanitizeTraceHeaders(request.headers);
    const existingTraceparent = request.headers[TRACEPARENT];
    if (!existingTraceparent) {
      const traceparent = (invokeStore ??= await InvokeStore.getInstanceAsync())?.getTraceparent?.();
      if (traceparent) {
        request.headers[TRACEPARENT] = traceparent;
        const tracestate = invokeStore?.getTracestate?.();
        if (tracestate) {
          request.headers[TRACESTATE] = tracestate;
        }
        const baggage = invokeStore?.getBaggage?.();
        if (baggage) {
          request.headers[BAGGAGE] = baggage;
        }
      }
    }
  }
  return next(args);
};
function sanitizeTraceHeaders(headers) {
  for (const header of Object.keys(headers)) {
    const lower = header.toLowerCase();
    if (header !== lower && (lower === TRACEPARENT || lower === TRACESTATE || lower === BAGGAGE)) {
      headers[lower] = headers[header];
      delete headers[header];
    }
  }
}
const getRecursionDetectionPlugin = (options) => ({
  applyToStack: (clientStack) => {
    clientStack.add(recursionDetectionMiddleware(), recursionDetectionMiddlewareOptions);
  }
});
const DEFAULT_UA_APP_ID = void 0;
function isValidUserAgentAppId(appId) {
  if (appId === void 0) {
    return true;
  }
  return typeof appId === "string" && appId.length <= 50;
}
function resolveUserAgentConfig(input) {
  const normalizedAppIdProvider = normalizeProvider(input.userAgentAppId ?? DEFAULT_UA_APP_ID);
  const { customUserAgent } = input;
  return Object.assign(input, {
    customUserAgent: typeof customUserAgent === "string" ? [[customUserAgent]] : customUserAgent,
    userAgentAppId: async () => {
      const appId = await normalizedAppIdProvider();
      if (!isValidUserAgentAppId(appId)) {
        const logger = input.logger?.constructor?.name === "NoOpLogger" || !input.logger ? console : input.logger;
        if (typeof appId !== "string") {
          logger?.warn("userAgentAppId must be a string or undefined.");
        } else if (appId.length > 50) {
          logger?.warn("The provided userAgentAppId exceeds the maximum length of 50 characters.");
        }
      }
      return appId;
    }
  });
}
const partitionsInfo = {
  "partitions": [
    {
      "id": "aws",
      "outputs": {
        "dnsSuffix": "amazonaws.com",
        "dualStackDnsSuffix": "api.aws",
        "implicitGlobalRegion": "us-east-1",
        "name": "aws",
        "supportsDualStack": true,
        "supportsFIPS": true
      },
      "regionRegex": "^(us|eu|ap|sa|ca|me|af|il|mx)\\-\\w+\\-\\d+$",
      "regions": {
        "af-south-1": {
          "description": "Africa (Cape Town)"
        },
        "ap-east-1": {
          "description": "Asia Pacific (Hong Kong)"
        },
        "ap-east-2": {
          "description": "Asia Pacific (Taipei)"
        },
        "ap-northeast-1": {
          "description": "Asia Pacific (Tokyo)"
        },
        "ap-northeast-2": {
          "description": "Asia Pacific (Seoul)"
        },
        "ap-northeast-3": {
          "description": "Asia Pacific (Osaka)"
        },
        "ap-south-1": {
          "description": "Asia Pacific (Mumbai)"
        },
        "ap-south-2": {
          "description": "Asia Pacific (Hyderabad)"
        },
        "ap-southeast-1": {
          "description": "Asia Pacific (Singapore)"
        },
        "ap-southeast-2": {
          "description": "Asia Pacific (Sydney)"
        },
        "ap-southeast-3": {
          "description": "Asia Pacific (Jakarta)"
        },
        "ap-southeast-4": {
          "description": "Asia Pacific (Melbourne)"
        },
        "ap-southeast-5": {
          "description": "Asia Pacific (Malaysia)"
        },
        "ap-southeast-6": {
          "description": "Asia Pacific (New Zealand)"
        },
        "ap-southeast-7": {
          "description": "Asia Pacific (Thailand)"
        },
        "aws-global": {
          "description": "aws global region"
        },
        "ca-central-1": {
          "description": "Canada (Central)"
        },
        "ca-west-1": {
          "description": "Canada West (Calgary)"
        },
        "eu-central-1": {
          "description": "Europe (Frankfurt)"
        },
        "eu-central-2": {
          "description": "Europe (Zurich)"
        },
        "eu-north-1": {
          "description": "Europe (Stockholm)"
        },
        "eu-south-1": {
          "description": "Europe (Milan)"
        },
        "eu-south-2": {
          "description": "Europe (Spain)"
        },
        "eu-west-1": {
          "description": "Europe (Ireland)"
        },
        "eu-west-2": {
          "description": "Europe (London)"
        },
        "eu-west-3": {
          "description": "Europe (Paris)"
        },
        "il-central-1": {
          "description": "Israel (Tel Aviv)"
        },
        "me-central-1": {
          "description": "Middle East (UAE)"
        },
        "me-south-1": {
          "description": "Middle East (Bahrain)"
        },
        "mx-central-1": {
          "description": "Mexico (Central)"
        },
        "sa-east-1": {
          "description": "South America (Sao Paulo)"
        },
        "us-east-1": {
          "description": "US East (N. Virginia)"
        },
        "us-east-2": {
          "description": "US East (Ohio)"
        },
        "us-west-1": {
          "description": "US West (N. California)"
        },
        "us-west-2": {
          "description": "US West (Oregon)"
        }
      }
    },
    {
      "id": "aws-cn",
      "outputs": {
        "dnsSuffix": "amazonaws.com.cn",
        "dualStackDnsSuffix": "api.amazonwebservices.com.cn",
        "implicitGlobalRegion": "cn-northwest-1",
        "name": "aws-cn",
        "supportsDualStack": true,
        "supportsFIPS": true
      },
      "regionRegex": "^cn\\-\\w+\\-\\d+$",
      "regions": {
        "aws-cn-global": {
          "description": "aws-cn global region"
        },
        "cn-north-1": {
          "description": "China (Beijing)"
        },
        "cn-northwest-1": {
          "description": "China (Ningxia)"
        }
      }
    },
    {
      "id": "aws-eusc",
      "outputs": {
        "dnsSuffix": "amazonaws.eu",
        "dualStackDnsSuffix": "api.amazonwebservices.eu",
        "implicitGlobalRegion": "eusc-de-east-1",
        "name": "aws-eusc",
        "supportsDualStack": true,
        "supportsFIPS": true
      },
      "regionRegex": "^eusc\\-(de)\\-\\w+\\-\\d+$",
      "regions": {
        "eusc-de-east-1": {
          "description": "AWS European Sovereign Cloud (Germany)"
        }
      }
    },
    {
      "id": "aws-iso",
      "outputs": {
        "dnsSuffix": "c2s.ic.gov",
        "dualStackDnsSuffix": "api.aws.ic.gov",
        "implicitGlobalRegion": "us-iso-east-1",
        "name": "aws-iso",
        "supportsDualStack": true,
        "supportsFIPS": true
      },
      "regionRegex": "^us\\-iso\\-\\w+\\-\\d+$",
      "regions": {
        "aws-iso-global": {
          "description": "aws-iso global region"
        },
        "us-iso-east-1": {
          "description": "US ISO East"
        },
        "us-iso-west-1": {
          "description": "US ISO WEST"
        }
      }
    },
    {
      "id": "aws-iso-b",
      "outputs": {
        "dnsSuffix": "sc2s.sgov.gov",
        "dualStackDnsSuffix": "api.aws.scloud",
        "implicitGlobalRegion": "us-isob-east-1",
        "name": "aws-iso-b",
        "supportsDualStack": true,
        "supportsFIPS": true
      },
      "regionRegex": "^us\\-isob\\-\\w+\\-\\d+$",
      "regions": {
        "aws-iso-b-global": {
          "description": "aws-iso-b global region"
        },
        "us-isob-east-1": {
          "description": "US ISOB East (Ohio)"
        },
        "us-isob-west-1": {
          "description": "US ISOB West"
        }
      }
    },
    {
      "id": "aws-iso-e",
      "outputs": {
        "dnsSuffix": "cloud.adc-e.uk",
        "dualStackDnsSuffix": "api.cloud-aws.adc-e.uk",
        "implicitGlobalRegion": "eu-isoe-west-1",
        "name": "aws-iso-e",
        "supportsDualStack": true,
        "supportsFIPS": true
      },
      "regionRegex": "^eu\\-isoe\\-\\w+\\-\\d+$",
      "regions": {
        "aws-iso-e-global": {
          "description": "aws-iso-e global region"
        },
        "eu-isoe-west-1": {
          "description": "EU ISOE West"
        }
      }
    },
    {
      "id": "aws-iso-f",
      "outputs": {
        "dnsSuffix": "csp.hci.ic.gov",
        "dualStackDnsSuffix": "api.aws.hci.ic.gov",
        "implicitGlobalRegion": "us-isof-south-1",
        "name": "aws-iso-f",
        "supportsDualStack": true,
        "supportsFIPS": true
      },
      "regionRegex": "^us\\-isof\\-\\w+\\-\\d+$",
      "regions": {
        "aws-iso-f-global": {
          "description": "aws-iso-f global region"
        },
        "us-isof-east-1": {
          "description": "US ISOF EAST"
        },
        "us-isof-south-1": {
          "description": "US ISOF SOUTH"
        }
      }
    },
    {
      "id": "aws-us-gov",
      "outputs": {
        "dnsSuffix": "amazonaws.com",
        "dualStackDnsSuffix": "api.aws",
        "implicitGlobalRegion": "us-gov-west-1",
        "name": "aws-us-gov",
        "supportsDualStack": true,
        "supportsFIPS": true
      },
      "regionRegex": "^us\\-gov\\-\\w+\\-\\d+$",
      "regions": {
        "aws-us-gov-global": {
          "description": "aws-us-gov global region"
        },
        "us-gov-east-1": {
          "description": "AWS GovCloud (US-East)"
        },
        "us-gov-west-1": {
          "description": "AWS GovCloud (US-West)"
        }
      }
    }
  ]
};
let selectedPartitionsInfo = partitionsInfo;
const partition = (value) => {
  const { partitions } = selectedPartitionsInfo;
  for (const partition2 of partitions) {
    const { regions, outputs } = partition2;
    for (const [region, regionData] of Object.entries(regions)) {
      if (region === value) {
        return {
          ...outputs,
          ...regionData
        };
      }
    }
  }
  for (const partition2 of partitions) {
    const { regionRegex, outputs } = partition2;
    if (new RegExp(regionRegex).test(value)) {
      return {
        ...outputs
      };
    }
  }
  const DEFAULT_PARTITION = partitions.find((partition2) => partition2.id === "aws");
  if (!DEFAULT_PARTITION) {
    throw new Error("Provided region was not found in the partition array or regex, and default partition with id 'aws' doesn't exist.");
  }
  return {
    ...DEFAULT_PARTITION.outputs
  };
};
const ACCOUNT_ID_ENDPOINT_REGEX = /\d{12}\.ddb/;
async function checkFeatures(context, config, args) {
  const request = args.request;
  if (request?.headers?.["smithy-protocol"] === "rpc-v2-cbor") {
    setFeature(context, "PROTOCOL_RPC_V2_CBOR", "M");
  }
  if (typeof config.retryStrategy === "function") {
    const retryStrategy = await config.retryStrategy();
    if (typeof retryStrategy.mode === "string") {
      switch (retryStrategy.mode) {
        case RETRY_MODES.ADAPTIVE:
          setFeature(context, "RETRY_MODE_ADAPTIVE", "F");
          break;
        case RETRY_MODES.STANDARD:
          setFeature(context, "RETRY_MODE_STANDARD", "E");
          break;
      }
    }
  }
  if (typeof config.accountIdEndpointMode === "function") {
    const endpointV2 = context.endpointV2;
    if (String(endpointV2?.url?.hostname).match(ACCOUNT_ID_ENDPOINT_REGEX)) {
      setFeature(context, "ACCOUNT_ID_ENDPOINT", "O");
    }
    switch (await config.accountIdEndpointMode?.()) {
      case "disabled":
        setFeature(context, "ACCOUNT_ID_MODE_DISABLED", "Q");
        break;
      case "preferred":
        setFeature(context, "ACCOUNT_ID_MODE_PREFERRED", "P");
        break;
      case "required":
        setFeature(context, "ACCOUNT_ID_MODE_REQUIRED", "R");
        break;
    }
  }
  const identity = context.__smithy_context?.selectedHttpAuthScheme?.identity;
  if (identity?.$source) {
    const credentials = identity;
    if (credentials.accountId) {
      setFeature(context, "RESOLVED_ACCOUNT_ID", "T");
    }
    for (const [key, value] of Object.entries(credentials.$source ?? {})) {
      setFeature(context, key, value);
    }
  }
}
const USER_AGENT = "user-agent";
const X_AMZ_USER_AGENT = "x-amz-user-agent";
const SPACE = " ";
const UA_NAME_SEPARATOR = "/";
const UA_NAME_ESCAPE_REGEX = /[^!$%&'*+\-.^_`|~\w]/g;
const UA_VALUE_ESCAPE_REGEX = /[^!$%&'*+\-.^_`|~\w#]/g;
const UA_ESCAPE_CHAR = "-";
const BYTE_LIMIT = 1024;
function encodeFeatures(features) {
  let buffer = "";
  for (const key in features) {
    const val = features[key];
    if (buffer.length + val.length + 1 <= BYTE_LIMIT) {
      if (buffer.length) {
        buffer += "," + val;
      } else {
        buffer += val;
      }
      continue;
    }
    break;
  }
  return buffer;
}
const userAgentMiddleware = (options) => (next, context) => async (args) => {
  const { request } = args;
  if (!HttpRequest.isInstance(request)) {
    return next(args);
  }
  const { headers } = request;
  const userAgent = context?.userAgent?.map(escapeUserAgent) || [];
  const defaultUserAgent = (await options.defaultUserAgentProvider()).map(escapeUserAgent);
  await checkFeatures(context, options, args);
  const awsContext = context;
  defaultUserAgent.push(`m/${encodeFeatures(Object.assign({}, context.__smithy_context?.features, awsContext.__aws_sdk_context?.features))}`);
  const customUserAgent = options?.customUserAgent?.map(escapeUserAgent) || [];
  const appId = await options.userAgentAppId();
  if (appId) {
    defaultUserAgent.push(escapeUserAgent([`app`, `${appId}`]));
  }
  const sdkUserAgentValue = [].concat([...defaultUserAgent, ...userAgent, ...customUserAgent]).join(SPACE);
  const normalUAValue = [
    ...defaultUserAgent.filter((section) => section.startsWith("aws-sdk-")),
    ...customUserAgent
  ].join(SPACE);
  if (options.runtime !== "browser") {
    if (normalUAValue) {
      headers[X_AMZ_USER_AGENT] = headers[X_AMZ_USER_AGENT] ? `${headers[USER_AGENT]} ${normalUAValue}` : normalUAValue;
    }
    headers[USER_AGENT] = sdkUserAgentValue;
  } else {
    headers[X_AMZ_USER_AGENT] = sdkUserAgentValue;
  }
  return next({
    ...args,
    request
  });
};
const escapeUserAgent = (userAgentPair) => {
  const name = userAgentPair[0].split(UA_NAME_SEPARATOR).map((part) => part.replace(UA_NAME_ESCAPE_REGEX, UA_ESCAPE_CHAR)).join(UA_NAME_SEPARATOR);
  const version = userAgentPair[1]?.replace(UA_VALUE_ESCAPE_REGEX, UA_ESCAPE_CHAR);
  const prefixSeparatorIndex = name.indexOf(UA_NAME_SEPARATOR);
  const prefix = name.substring(0, prefixSeparatorIndex);
  let uaName = name.substring(prefixSeparatorIndex + 1);
  if (prefix === "api") {
    uaName = uaName.toLowerCase();
  }
  return [prefix, uaName, version].filter((item) => item && item.length > 0).reduce((acc, item, index) => {
    switch (index) {
      case 0:
        return item;
      case 1:
        return `${acc}/${item}`;
      default:
        return `${acc}#${item}`;
    }
  }, "");
};
const getUserAgentMiddlewareOptions = {
  name: "getUserAgentMiddleware",
  step: "build",
  priority: "low",
  tags: ["SET_USER_AGENT", "USER_AGENT"],
  override: true
};
const getUserAgentPlugin = (config) => ({
  applyToStack: (clientStack) => {
    clientStack.add(userAgentMiddleware(config), getUserAgentMiddlewareOptions);
  }
});
const getRuntimeUserAgentPair = () => {
  const runtimesToCheck = ["deno", "bun", "llrt"];
  for (const runtime of runtimesToCheck) {
    if (versions[runtime]) {
      return [`md/${runtime}`, versions[runtime]];
    }
  }
  return ["md/nodejs", versions.node];
};
const isCrtAvailable = () => {
  return null;
};
const createDefaultUserAgentProvider = ({ serviceId, clientVersion }) => {
  const runtimeUserAgentPair = getRuntimeUserAgentPair();
  return async (config) => {
    const sections = [
      ["aws-sdk-js", clientVersion],
      ["ua", "2.1"],
      [`os/${platform()}`, release()],
      ["lang/js"],
      runtimeUserAgentPair
    ];
    const crtAvailable = isCrtAvailable();
    if (crtAvailable) {
      sections.push(crtAvailable);
    }
    if (serviceId) {
      sections.push([`api/${serviceId}`, clientVersion]);
    }
    if (env.AWS_EXECUTION_ENV) {
      sections.push([`exec-env/${env.AWS_EXECUTION_ENV}`]);
    }
    const appId = await config?.userAgentAppId?.();
    const resolvedUserAgent = appId ? [...sections, [`app/${appId}`]] : [...sections];
    return resolvedUserAgent;
  };
};
const UA_APP_ID_ENV_NAME = "AWS_SDK_UA_APP_ID";
const UA_APP_ID_INI_NAME = "sdk_ua_app_id";
const UA_APP_ID_INI_NAME_DEPRECATED = "sdk-ua-app-id";
const NODE_APP_ID_CONFIG_OPTIONS = {
  environmentVariableSelector: (env2) => env2[UA_APP_ID_ENV_NAME],
  configFileSelector: (profile) => profile[UA_APP_ID_INI_NAME] ?? profile[UA_APP_ID_INI_NAME_DEPRECATED],
  default: DEFAULT_UA_APP_ID
};
const isVirtualHostableS3Bucket = (value, allowSubDomains = false) => {
  if (allowSubDomains) {
    for (const label of value.split(".")) {
      if (!isVirtualHostableS3Bucket(label)) {
        return false;
      }
    }
    return true;
  }
  if (!isValidHostLabel(value)) {
    return false;
  }
  if (value.length < 3 || value.length > 63) {
    return false;
  }
  if (value !== value.toLowerCase()) {
    return false;
  }
  if (isIpAddress(value)) {
    return false;
  }
  return true;
};
const ARN_DELIMITER = ":";
const RESOURCE_DELIMITER = "/";
const parseArn = (value) => {
  const segments = value.split(ARN_DELIMITER);
  if (segments.length < 6)
    return null;
  const [arn, partition2, service, region, accountId, ...resourcePath] = segments;
  if (arn !== "arn" || partition2 === "" || service === "" || resourcePath.join(ARN_DELIMITER) === "")
    return null;
  const resourceId = resourcePath.map((resource) => resource.split(RESOURCE_DELIMITER)).flat();
  return {
    partition: partition2,
    service,
    region,
    accountId,
    resourceId
  };
};
const awsEndpointFunctions = {
  isVirtualHostableS3Bucket,
  parseArn,
  partition
};
customEndpointFunctions.aws = awsEndpointFunctions;
function stsRegionDefaultResolver(loaderConfig = {}) {
  return loadConfig({
    ...NODE_REGION_CONFIG_OPTIONS,
    async default() {
      {
        console.warn("@aws-sdk - WARN - default STS region of us-east-1 used. See @aws-sdk/credential-providers README and set a region explicitly.");
      }
      return "us-east-1";
    }
  }, { ...NODE_REGION_CONFIG_FILE_OPTIONS, ...loaderConfig });
}
const getAwsRegionExtensionConfiguration = (runtimeConfig) => {
  return {
    setRegion(region) {
      runtimeConfig.region = region;
    },
    region() {
      return runtimeConfig.region;
    }
  };
};
const resolveAwsRegionExtensionConfiguration = (awsRegionExtensionConfiguration) => {
  return {
    region: awsRegionExtensionConfiguration.region()
  };
};
const validate = (str) => typeof str === "string" && str.indexOf("arn:") === 0 && str.split(":").length >= 6;
class ProtocolLib {
  queryCompat;
  errorRegistry;
  constructor(queryCompat = false) {
    this.queryCompat = queryCompat;
  }
  resolveRestContentType(defaultContentType, inputSchema) {
    const members = inputSchema.getMemberSchemas();
    const httpPayloadMember = Object.values(members).find((m) => {
      return !!m.getMergedTraits().httpPayload;
    });
    if (httpPayloadMember) {
      const mediaType = httpPayloadMember.getMergedTraits().mediaType;
      if (mediaType) {
        return mediaType;
      } else if (httpPayloadMember.isStringSchema()) {
        return "text/plain";
      } else if (httpPayloadMember.isBlobSchema()) {
        return "application/octet-stream";
      } else {
        return defaultContentType;
      }
    } else if (!inputSchema.isUnitSchema()) {
      const hasBody = Object.values(members).find((m) => {
        const { httpQuery, httpQueryParams, httpHeader, httpLabel, httpPrefixHeaders } = m.getMergedTraits();
        const noPrefixHeaders = httpPrefixHeaders === void 0;
        return !httpQuery && !httpQueryParams && !httpHeader && !httpLabel && noPrefixHeaders;
      });
      if (hasBody) {
        return defaultContentType;
      }
    }
  }
  async getErrorSchemaOrThrowBaseException(errorIdentifier, defaultNamespace, response, dataObject, metadata, getErrorSchema) {
    let errorName = errorIdentifier;
    if (errorIdentifier.includes("#")) {
      [, errorName] = errorIdentifier.split("#");
    }
    const errorMetadata = {
      $metadata: metadata,
      $fault: response.statusCode < 500 ? "client" : "server"
    };
    if (!this.errorRegistry) {
      throw new Error("@aws-sdk/core/protocols - error handler not initialized.");
    }
    try {
      const errorSchema = getErrorSchema?.(this.errorRegistry, errorName) ?? this.errorRegistry.getSchema(errorIdentifier);
      return { errorSchema, errorMetadata };
    } catch (e) {
      dataObject.message = dataObject.message ?? dataObject.Message ?? "UnknownError";
      const synthetic = this.errorRegistry;
      const baseExceptionSchema = synthetic.getBaseException();
      if (baseExceptionSchema) {
        const ErrorCtor = synthetic.getErrorCtor(baseExceptionSchema) ?? Error;
        throw this.decorateServiceException(Object.assign(new ErrorCtor({ name: errorName }), errorMetadata), dataObject);
      }
      const d = dataObject;
      const message = d?.message ?? d?.Message ?? d?.Error?.Message ?? d?.Error?.message;
      throw this.decorateServiceException(Object.assign(new Error(message), {
        name: errorName
      }, errorMetadata), dataObject);
    }
  }
  compose(composite, errorIdentifier, defaultNamespace) {
    let namespace = defaultNamespace;
    if (errorIdentifier.includes("#")) {
      [namespace] = errorIdentifier.split("#");
    }
    const staticRegistry = TypeRegistry.for(namespace);
    const defaultSyntheticRegistry = TypeRegistry.for("smithy.ts.sdk.synthetic." + defaultNamespace);
    composite.copyFrom(staticRegistry);
    composite.copyFrom(defaultSyntheticRegistry);
    this.errorRegistry = composite;
  }
  decorateServiceException(exception, additions = {}) {
    if (this.queryCompat) {
      const msg = exception.Message ?? additions.Message;
      const error = decorateServiceException(exception, additions);
      if (msg) {
        error.message = msg;
      }
      const errorObj = error.Error ?? {};
      errorObj.Type = error.Error?.Type;
      errorObj.Code = error.Error?.Code;
      errorObj.Message = error.Error?.message ?? error.Error?.Message ?? msg;
      error.Error = errorObj;
      const reqId = error.$metadata.requestId;
      if (reqId) {
        error.RequestId = reqId;
      }
      return error;
    }
    return decorateServiceException(exception, additions);
  }
  setQueryCompatError(output, response) {
    const queryErrorHeader = response.headers?.["x-amzn-query-error"];
    if (output !== void 0 && queryErrorHeader != null) {
      const [Code, Type] = queryErrorHeader.split(";");
      const keys = Object.keys(output);
      const Error2 = {
        Code,
        Type
      };
      output.Code = Code;
      output.Type = Type;
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        Error2[k === "message" ? "Message" : k] = output[k];
      }
      delete Error2.__type;
      output.Error = Error2;
    }
  }
  queryCompatOutput(queryCompatErrorData, errorData) {
    if (queryCompatErrorData.Error) {
      errorData.Error = queryCompatErrorData.Error;
    }
    if (queryCompatErrorData.Type) {
      errorData.Type = queryCompatErrorData.Type;
    }
    if (queryCompatErrorData.Code) {
      errorData.Code = queryCompatErrorData.Code;
    }
  }
  findQueryCompatibleError(registry, errorName) {
    try {
      return registry.getSchema(errorName);
    } catch (e) {
      return registry.find((schema) => NormalizedSchema.of(schema).getMergedTraits().awsQueryError?.[0] === errorName);
    }
  }
}
class SerdeContextConfig {
  serdeContext;
  setSerdeContext(serdeContext) {
    this.serdeContext = serdeContext;
  }
}
class UnionSerde {
  from;
  to;
  keys;
  constructor(from, to) {
    this.from = from;
    this.to = to;
    const keys = Object.keys(this.from);
    const set = new Set(keys);
    set.delete("__type");
    this.keys = set;
  }
  mark(key) {
    this.keys.delete(key);
  }
  hasUnknown() {
    return this.keys.size === 1 && Object.keys(this.to).length === 0;
  }
  writeUnknown() {
    if (this.hasUnknown()) {
      const k = this.keys.values().next().value;
      const v = this.from[k];
      this.to.$unknown = [k, v];
    }
  }
}
let canParseBuffer;
function detectBufferParsing() {
  if (canParseBuffer === void 0) {
    try {
      if (typeof Buffer !== "function") {
        canParseBuffer = false;
      } else {
        const result = JSON.parse(Buffer.from([123, 125]));
        canParseBuffer = result !== null && typeof result === "object";
      }
    } catch {
      canParseBuffer = false;
    }
  }
  return canParseBuffer;
}
function jsonReviver(key, value, context) {
  if (context?.source) {
    const numericString = context.source;
    if (typeof value === "number") {
      const inSafeRange = value <= Number.MAX_SAFE_INTEGER && value >= Number.MIN_SAFE_INTEGER;
      if (inSafeRange) {
        if (isRepresentable(numericString, value)) {
          return value;
        }
        return new NumericValue(numericString, "bigDecimal");
      } else {
        if (isFractionalBigNumeric(numericString)) {
          return new NumericValue(numericString, "bigDecimal");
        }
        if (/[eE]/.test(numericString)) {
          return expandExponentToBigInt(numericString);
        }
        return BigInt(numericString);
      }
    }
  }
  return value;
}
function isFractionalBigNumeric(s) {
  const dotIndex = s.indexOf(".");
  if (dotIndex === -1) {
    return false;
  }
  const eIndex = s.search(/[eE]/);
  if (eIndex === -1) {
    return true;
  }
  const fracDigits = eIndex - dotIndex - 1;
  const exp = parseInt(s.slice(eIndex + 1), 10);
  return exp < fracDigits;
}
function isRepresentable(numericString, value) {
  if (numericString === String(value)) {
    return true;
  }
  if (Object.is(value, -0)) {
    return true;
  }
  if (/[eE]/.test(numericString)) {
    return expandToDecimal(numericString) === expandToDecimal(String(value));
  }
  const normalized = numericString.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  const canonical = String(value);
  if (normalized === canonical) {
    return true;
  }
  if (/[eE]/.test(canonical)) {
    return normalized === expandToDecimal(canonical);
  }
  return false;
}
function expandToDecimal(s) {
  const negative = s.startsWith("-");
  const abs = negative ? s.slice(1) : s;
  const eIndex = abs.search(/[eE]/);
  let result;
  if (eIndex === -1) {
    result = abs;
  } else {
    const exp = parseInt(abs.slice(eIndex + 1), 10);
    const mantissa = abs.slice(0, eIndex);
    const dotIndex = mantissa.indexOf(".");
    let digits;
    let intLen;
    if (dotIndex === -1) {
      digits = mantissa;
      intLen = mantissa.length;
    } else {
      digits = mantissa.slice(0, dotIndex) + mantissa.slice(dotIndex + 1);
      intLen = dotIndex;
    }
    digits = digits.replace(/0+$/, "") || "0";
    const newDotPos = intLen + exp;
    if (digits === "0") {
      result = "0";
    } else if (newDotPos <= 0) {
      result = "0." + "0".repeat(-newDotPos) + digits;
    } else if (newDotPos >= digits.length) {
      result = digits + "0".repeat(newDotPos - digits.length);
    } else {
      result = digits.slice(0, newDotPos) + "." + digits.slice(newDotPos);
    }
  }
  if (result.includes(".")) {
    result = result.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }
  return (negative ? "-" : "") + result;
}
function expandExponentToBigInt(s) {
  const eIndex = s.search(/[eE]/);
  const exp = parseInt(s.slice(eIndex + 1), 10);
  const negative = s.startsWith("-");
  const mantissa = s.slice(negative ? 1 : 0, eIndex);
  const dotIndex = mantissa.indexOf(".");
  let digits;
  let shift;
  if (dotIndex === -1) {
    digits = mantissa;
    shift = exp;
  } else {
    digits = mantissa.slice(0, dotIndex) + mantissa.slice(dotIndex + 1);
    const fracDigits = mantissa.length - dotIndex - 1;
    shift = exp - fracDigits;
  }
  digits = digits.replace(/0+$/, "") || "0";
  const result = BigInt(digits) * 10n ** BigInt(shift + (mantissa.replace(".", "").length - digits.length));
  return negative ? -result : result;
}
const REVIVER_SYMBOL = /* @__PURE__ */ Symbol.for("@aws-sdk/reviver");
function needsReviver(schema) {
  const ns = NormalizedSchema.of(schema);
  const raw = ns.getSchema();
  if (Array.isArray(raw) && ns.isStructSchema()) {
    if (REVIVER_SYMBOL in raw) {
      return raw[REVIVER_SYMBOL];
    }
    const result = _check(ns, /* @__PURE__ */ new Set());
    raw[REVIVER_SYMBOL] = result;
    return result;
  }
  return _check(ns, /* @__PURE__ */ new Set());
}
function _check(ns, seen) {
  const raw = ns.getSchema();
  if (seen.has(raw)) {
    return false;
  }
  seen.add(raw);
  if (ns.isBigIntegerSchema() || ns.isBigDecimalSchema()) {
    return true;
  }
  if (ns.isStructSchema()) {
    for (const [, memberSchema] of ns.structIterator()) {
      if (_check(memberSchema, seen)) {
        return true;
      }
    }
  } else if (ns.isListSchema() || ns.isMapSchema()) {
    if (_check(ns.getValueSchema(), seen)) {
      return true;
    }
  } else if (ns.isDocumentSchema()) {
    return true;
  }
  return false;
}
const collectBodyString = (streamBody, context) => collectBody(streamBody, context).then((body) => (context?.utf8Encoder ?? toUtf8)(body));
async function parseJsonBody(streamBody, context, schema) {
  let parsingInput;
  if (detectBufferParsing() && typeof streamBody?.[Symbol.asyncIterator] === "function") {
    const buffer = await collectBody(streamBody, context);
    if (typeof Buffer === "function") {
      if (Buffer.isBuffer(buffer)) {
        parsingInput = buffer;
      } else {
        parsingInput = Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      }
    }
  }
  if (!parsingInput) {
    parsingInput = await collectBodyString(streamBody, context);
  }
  if (parsingInput.length === 0) {
    return {};
  }
  const reviver = schema && needsReviver(schema) ? jsonReviver : void 0;
  try {
    return JSON.parse(parsingInput, reviver);
  } catch (e) {
    if (e?.name === "SyntaxError") {
      Object.defineProperty(e, "$responseBodyText", {
        value: typeof parsingInput === "string" ? parsingInput : parsingInput.toString("utf8")
      });
    }
    throw e;
  }
}
const findKey = (object, key) => Object.keys(object).find((k) => k.toLowerCase() === key.toLowerCase());
const sanitizeErrorCode = (rawValue) => {
  let cleanValue = rawValue;
  if (typeof cleanValue === "number") {
    cleanValue = cleanValue.toString();
  }
  if (cleanValue.indexOf(",") >= 0) {
    cleanValue = cleanValue.split(",")[0];
  }
  if (cleanValue.indexOf(":") >= 0) {
    cleanValue = cleanValue.split(":")[0];
  }
  if (cleanValue.indexOf("#") >= 0) {
    cleanValue = cleanValue.split("#")[1];
  }
  return cleanValue;
};
const loadRestJsonErrorCode = (output, data) => {
  return loadErrorCode(output, data, ["header", "code", "type"]);
};
const loadErrorCode = ({ headers }, data, order) => {
  while (order.length > 0) {
    const location = order.shift();
    switch (location) {
      case "header":
        const headerKey = findKey(headers ?? {}, "x-amzn-errortype");
        if (headerKey !== void 0) {
          return sanitizeErrorCode(headers[headerKey]);
        }
        break;
      case "code":
        const codeKey = findKey(data ?? {}, "code");
        if (codeKey && data[codeKey] !== void 0) {
          return sanitizeErrorCode(data[codeKey]);
        }
        break;
      case "type":
        if (data?.__type !== void 0) {
          return sanitizeErrorCode(data.__type);
        }
        break;
    }
  }
};
function writeKey(obj) {
  Object.defineProperty(obj, "__proto__", { value: void 0, writable: true, enumerable: true, configurable: true });
}
class JsonShapeDeserializer2 extends SerdeContextConfig {
  settings;
  constructor(settings) {
    super();
    this.settings = settings;
  }
  async read(schema, data) {
    const reviver = needsReviver(schema) ? jsonReviver : void 0;
    let parsed;
    if (typeof data === "string") {
      if (data.length === 0) {
        return {};
      }
      parsed = JSON.parse(data, reviver);
    } else if (data instanceof Uint8Array && detectBufferParsing()) {
      if (data.byteLength === 0) {
        return {};
      }
      const buf = Buffer.isBuffer(data) ? data : Buffer.from(data.buffer, data.byteOffset, data.byteLength);
      parsed = JSON.parse(buf, reviver);
    } else {
      parsed = await parseJsonBody(data, this.serdeContext, schema);
    }
    return this._read(schema, parsed);
  }
  readObject(schema, data) {
    return this._read(schema, data);
  }
  _read(schema, value) {
    const isObject = value !== null && typeof value === "object";
    const ns = NormalizedSchema.of(schema);
    if (isObject) {
      if (ns.isStructSchema()) {
        return this._readStruct(ns, value);
      }
      if (Array.isArray(value) && ns.isListSchema()) {
        const listMember = ns.getValueSchema();
        if (this.needsTransform(listMember)) {
          for (let i = 0; i < value.length; ++i) {
            value[i] = this._read(listMember, value[i]);
          }
        }
        return value;
      }
      if (ns.isMapSchema()) {
        const mapMember = ns.getValueSchema();
        const map = value;
        if (this.needsTransform(mapMember)) {
          for (const k in map) {
            if (k === "__proto__") {
              writeKey(map);
            }
            map[k] = this._read(mapMember, map[k]);
          }
        }
        return map;
      }
    }
    if (ns.isBlobSchema() && typeof value === "string") {
      return fromBase64(value);
    }
    const mediaType = ns.getMergedTraits().mediaType;
    if (ns.isStringSchema() && typeof value === "string" && mediaType) {
      const isJson = mediaType === "application/json" || mediaType.endsWith("+json");
      if (isJson) {
        return LazyJsonString.from(value);
      }
      return value;
    }
    if (ns.isTimestampSchema() && value != null) {
      const format = determineTimestampFormat(ns, this.settings);
      switch (format) {
        case 5:
          return parseRfc3339DateTimeWithOffset(value);
        case 6:
          return parseRfc7231DateTime(value);
        case 7:
          return parseEpochTimestamp(value);
        default:
          console.warn("Missing timestamp format, parsing value with Date constructor:", value);
          return new Date(value);
      }
    }
    if (ns.isBigIntegerSchema() && (typeof value === "number" || typeof value === "string")) {
      return BigInt(value);
    }
    if (ns.isBigDecimalSchema() && value != void 0) {
      if (value instanceof NumericValue) {
        return value;
      }
      const untyped = value;
      if (untyped.type === "bigDecimal" && "string" in untyped) {
        return new NumericValue(untyped.string, untyped.type);
      }
      return new NumericValue(String(value), "bigDecimal");
    }
    if (ns.isNumericSchema() && typeof value === "string") {
      switch (value) {
        case "Infinity":
          return Infinity;
        case "-Infinity":
          return -Infinity;
        case "NaN":
          return NaN;
      }
      return value;
    }
    if (ns.isDocumentSchema()) {
      if (isObject) {
        if (Array.isArray(value)) {
          for (let i = 0; i < value.length; ++i) {
            const v = value[i];
            if (!(v instanceof NumericValue)) {
              value[i] = this._read(ns, v);
            }
          }
        } else {
          const doc = value;
          for (const k in doc) {
            if (k === "__proto__") {
              writeKey(doc);
            }
            const v = doc[k];
            if (!(v instanceof NumericValue)) {
              doc[k] = this._read(ns, v);
            }
          }
        }
      }
    }
    return value;
  }
  _readStruct(ns, record) {
    const union = ns.isUnionSchema();
    const out = {};
    let nameMap;
    const hasType = typeof record.__type === "string";
    const { jsonName } = this.settings;
    if (jsonName && hasType) {
      nameMap = {};
    }
    let unionSerde;
    if (union) {
      unionSerde = new UnionSerde(record, out);
    }
    for (const [memberName, memberSchema] of ns.structIterator()) {
      let fromKey = memberName;
      if (jsonName) {
        fromKey = memberSchema.getMergedTraits().jsonName ?? fromKey;
        if (hasType) {
          nameMap[fromKey] = memberName;
        }
      }
      if (union) {
        unionSerde.mark(fromKey);
      }
      if (record[fromKey] != null) {
        out[memberName] = this._read(memberSchema, record[fromKey]);
      }
    }
    if (union) {
      unionSerde.writeUnknown();
    } else if (hasType) {
      for (const k in record) {
        const v = record[k];
        const t = jsonName ? nameMap[k] ?? k : k;
        if (!(t in out)) {
          out[t] = v;
        }
      }
    }
    return out;
  }
  needsTransform(ns) {
    if (ns.isBlobSchema() || ns.isTimestampSchema() || ns.isBigIntegerSchema() || ns.isBigDecimalSchema()) {
      return true;
    }
    if (ns.isDocumentSchema() || ns.isStructSchema() || ns.isListSchema() || ns.isMapSchema()) {
      return true;
    }
    if (ns.isStringSchema() && ns.getMergedTraits().mediaType) {
      return true;
    }
    return false;
  }
}
class JsonBytesStringAdapter extends Uint8Array {
  string = null;
  static allocUnsafe(bytes) {
    if (typeof Buffer === "function") {
      const buffer = Buffer.allocUnsafe(bytes);
      return new JsonBytesStringAdapter(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    }
    return new JsonBytesStringAdapter(bytes);
  }
  toString() {
    return this.s();
  }
  valueOf() {
    return this.s();
  }
  includes(searchString, position) {
    if (typeof searchString === "string") {
      return this.s().includes(searchString, position);
    }
    return Uint8Array.prototype.includes.call(this, searchString, position);
  }
  indexOf(searchString, position) {
    if (typeof searchString === "string") {
      return this.s().indexOf(searchString, position);
    }
    return Uint8Array.prototype.indexOf.call(this, searchString, position);
  }
  lastIndexOf(searchString, position) {
    if (typeof searchString === "string") {
      return this.s().lastIndexOf(searchString, position);
    }
    const fn = Uint8Array.prototype.lastIndexOf;
    if (position !== void 0) {
      return fn.call(this, searchString, position);
    }
    return fn.call(this, searchString);
  }
  startsWith(searchString, position) {
    return this.s().startsWith(searchString, position);
  }
  endsWith(searchString, endPosition) {
    return this.s().endsWith(searchString, endPosition);
  }
  match(regexp) {
    return this.s().match(regexp);
  }
  replace(searchValue, replaceValue) {
    return this.s().replace(searchValue, replaceValue);
  }
  search(regexp) {
    return this.s().search(regexp);
  }
  split(separator, limit) {
    return this.s().split(separator, limit);
  }
  substring(start, end) {
    return this.s().substring(start, end);
  }
  trim() {
    return this.s().trim();
  }
  trimStart() {
    return this.s().trimStart();
  }
  trimEnd() {
    return this.s().trimEnd();
  }
  charAt(pos) {
    return this.s().charAt(pos);
  }
  charCodeAt(index) {
    return this.s().charCodeAt(index);
  }
  padStart(maxLength, fillString) {
    return this.s().padStart(maxLength, fillString);
  }
  padEnd(maxLength, fillString) {
    return this.s().padEnd(maxLength, fillString);
  }
  repeat(count) {
    return this.s().repeat(count);
  }
  toUpperCase() {
    return this.s().toUpperCase();
  }
  toLowerCase() {
    return this.s().toLowerCase();
  }
  s() {
    if (this.string == null) {
      const n = Date.now();
      if (n > warned + 6e4) {
        console.warn("@aws-sdk/core/protocols - WARN - JsonCodec2: you have called a string method on a Uint8Array request body. It has been automatically converted to string. In a future version this will throw an error.");
        warned = n;
      }
      this.string = toUtf8(this);
    }
    return this.string;
  }
}
var warned = 0;
const encoder = new TextEncoder();
const OPEN_BRACE = 123;
const CLOSE_BRACE = 125;
const OPEN_BRACKET = 91;
const CLOSE_BRACKET = 93;
const QUOTE = 34;
const COLON = 58;
const COMMA = 44;
const BACKSLASH = 92;
const TRUE = new Uint8Array([116, 114, 117, 101]);
const FALSE = new Uint8Array([102, 97, 108, 115, 101]);
const NULL = new Uint8Array([110, 117, 108, 108]);
const ESCAPE_TABLE = new Array(128).fill(null);
ESCAPE_TABLE[8] = "b";
ESCAPE_TABLE[9] = "t";
ESCAPE_TABLE[10] = "n";
ESCAPE_TABLE[12] = "f";
ESCAPE_TABLE[13] = "r";
ESCAPE_TABLE[34] = '"';
ESCAPE_TABLE[92] = "\\";
for (let i = 0; i < 32; i++) {
  if (ESCAPE_TABLE[i] === null) {
    ESCAPE_TABLE[i] = "u00" + i.toString(16).padStart(2, "0");
  }
}
const INITIAL_BUFFER_SIZE = 2048;
function alloc(size) {
  return JsonBytesStringAdapter.allocUnsafe(size);
}
class JsonShapeSerializer2 extends SerdeContextConfig {
  settings;
  json;
  i = 0;
  rootSchema;
  rawValue;
  passthrough = false;
  constructor(settings) {
    super();
    this.settings = settings;
    this.json = alloc(INITIAL_BUFFER_SIZE);
  }
  write(schema, value) {
    this.i = 0;
    this.rawValue = value;
    this.rootSchema = NormalizedSchema.of(schema);
    this.passthrough = this.rootSchema.isBlobSchema() || this.rootSchema.isStringSchema();
    if (!this.passthrough) {
      this.writeValue(this.rootSchema, value, void 0);
    }
  }
  writeDiscriminatedDocument(schema, value) {
    this.i = 0;
    this.rootSchema = NormalizedSchema.of(schema);
    const ns = this.rootSchema;
    if (ns.isStructSchema() && value != null && typeof value === "object") {
      this.writeValue(ns, value, void 0);
      const prefix = `"__type":"${ns.getName(true) ?? "Unknown"}",`;
      const z = prefix.length;
      this.ensure(z);
      this.json.copyWithin(1 + z, 1, this.i);
      encoder.encodeInto(prefix, this.json.subarray(1));
      this.i += z;
    } else {
      this.writeValue(ns, value, void 0);
    }
  }
  flush() {
    this.rootSchema = void 0;
    const finalPosition = this.i;
    this.i = 0;
    const raw = this.rawValue;
    this.rawValue = void 0;
    if (finalPosition === 0) {
      return raw;
    }
    const result = this.json.subarray(0, finalPosition);
    this.json = alloc(INITIAL_BUFFER_SIZE);
    return result;
  }
  ensure(byteCount) {
    const { i, json } = this;
    if (i + byteCount > json.length) {
      let newSize = json.length * 2;
      while (newSize < i + byteCount) {
        newSize *= 2;
      }
      const next = alloc(newSize);
      next.set(this.json);
      this.json = next;
    }
  }
  writeAscii(s) {
    const z = s.length;
    this.ensure(z);
    let { i, json } = this;
    for (let j = 0; j < z; ++j) {
      json[i] = s.charCodeAt(j);
      i += 1;
    }
    this.i = i;
  }
  writeAsciiQuoted(s) {
    const z = s.length;
    this.ensure(z + 4);
    let { json, i } = this;
    json[i++] = QUOTE;
    for (let j = 0; j < z; ++j) {
      json[i++] = s.charCodeAt(j);
    }
    json[i++] = QUOTE;
    this.i = i;
  }
  writeJsonString(s) {
    this.ensure(s.length * 3 + 2);
    this.json[this.i++] = QUOTE;
    const z = s.length;
    for (let j = 0; j < z; ++j) {
      const c = s.charCodeAt(j);
      if (c > 34 && c < 92) {
        this.json[this.i++] = c;
      } else if (c < 128) {
        const esc = ESCAPE_TABLE[c];
        if (esc !== null) {
          this.ensure(esc.length + 1);
          this.json[this.i++] = BACKSLASH;
          for (let k = 0; k < esc.length; k++) {
            this.json[this.i++] = esc.charCodeAt(k);
          }
        } else {
          this.json[this.i++] = c;
        }
      } else if (c >= 55296 && c <= 56319) {
        const next = j + 1 < z ? s.charCodeAt(j + 1) : 0;
        if (next >= 56320 && next <= 57343) {
          this.ensure(4);
          const { written } = encoder.encodeInto(s.substring(j, j + 2), this.json.subarray(this.i));
          this.i += written;
          ++j;
        } else {
          this.ensure(6);
          this.writeUnicodeEscape(c);
        }
      } else if (c >= 56320 && c <= 57343) {
        this.ensure(6);
        this.writeUnicodeEscape(c);
      } else {
        let { i, json } = this;
        if (c < 2048) {
          json[i++] = 192 | c >> 6;
          json[i++] = 128 | c & 63;
        } else {
          json[i++] = 224 | c >> 12;
          json[i++] = 128 | c >> 6 & 63;
          json[i++] = 128 | c & 63;
        }
        this.i = i;
      }
    }
    this.json[this.i++] = QUOTE;
  }
  writeUnicodeEscape(code) {
    let { json, i } = this;
    json[i++] = BACKSLASH;
    json[i++] = 117;
    const hex = code.toString(16).padStart(4, "0");
    for (let j = 0; j < 4; ++j) {
      json[i++] = hex.charCodeAt(j);
    }
    this.i = i;
  }
  static B64 = (() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    const table = new Uint8Array(64);
    for (let i = 0; i < 64; ++i) {
      table[i] = chars.charCodeAt(i);
    }
    return table;
  })();
  writeBase64(data) {
    const b64Len = Math.ceil(data.length / 3) * 4;
    this.ensure(b64Len + 2);
    const json = this.json;
    const B64 = JsonShapeSerializer2.B64;
    let i = this.i;
    json[i++] = QUOTE;
    const len = data.length;
    const remainder = len % 3;
    const mainLen = len - remainder;
    for (let j = 0; j < mainLen; j += 3) {
      const a = data[j];
      const b = data[j + 1];
      const c = data[j + 2];
      json[i++] = B64[a >> 2];
      json[i++] = B64[(a & 3) << 4 | b >> 4];
      json[i++] = B64[(b & 15) << 2 | c >> 6];
      json[i++] = B64[c & 63];
    }
    if (remainder === 2) {
      const a = data[mainLen];
      const b = data[mainLen + 1];
      json[i++] = B64[a >> 2];
      json[i++] = B64[(a & 3) << 4 | b >> 4];
      json[i++] = B64[(b & 15) << 2];
      json[i++] = 61;
    } else if (remainder === 1) {
      const a = data[mainLen];
      json[i++] = B64[a >> 2];
      json[i++] = B64[(a & 3) << 4];
      json[i++] = 61;
      json[i++] = 61;
    }
    json[i++] = QUOTE;
    this.i = i;
  }
  writeValue(schema, value, container) {
    if (value == null) {
      if (container?.isStructSchema()) {
        if (value === void 0) {
          const ns2 = NormalizedSchema.of(schema);
          if (ns2.isIdempotencyToken()) {
            this.writeAsciiQuoted(generateIdempotencyToken());
            return;
          }
        }
        return;
      }
      this.ensure(4);
      this.json.set(NULL, this.i);
      this.i += 4;
      return;
    }
    const ns = NormalizedSchema.of(schema);
    const isObject = typeof value === "object";
    if (ns.isStringSchema()) {
      const mediaType = ns.getMergedTraits().mediaType;
      if (mediaType) {
        const isJson = mediaType === "application/json" || mediaType.endsWith("+json");
        if (isJson) {
          this.writeJsonString(LazyJsonString.from(value).toString());
          return;
        }
      }
    }
    if (isObject) {
      if (ns.isStructSchema()) {
        this.writeStruct(ns, value);
        return;
      }
      if (Array.isArray(value) && (ns.isListSchema() || ns.isDocumentSchema())) {
        this.writeList(ns, value, ns.isDocumentSchema());
        return;
      }
      if (ns.isMapSchema()) {
        this.writeMap(ns, value, false);
        return;
      }
      if (value instanceof Uint8Array && (ns.isBlobSchema() || ns.isDocumentSchema())) {
        this.writeBase64(value);
        return;
      }
      if (value instanceof Date && (ns.isTimestampSchema() || ns.isDocumentSchema())) {
        this.writeTimestamp(ns, value);
        return;
      }
      if (value instanceof NumericValue) {
        this.writeAscii(value.string);
        return;
      }
      if (ns.isDocumentSchema()) {
        if (Array.isArray(value)) {
          this.writeList(ns, value, true);
        } else {
          this.writeMap(ns, value, true);
        }
        return;
      }
      const json = JSON.stringify(value);
      this.writeAscii(json);
      return;
    }
    if (typeof value === "string") {
      if (ns.isBlobSchema()) {
        const b64 = (this.serdeContext?.base64Encoder ?? toBase64)(value);
        this.writeAsciiQuoted(b64);
        return;
      }
      this.writeJsonString(value);
      return;
    }
    if (typeof value === "number") {
      if (Math.abs(value) === Infinity || Number.isNaN(value)) {
        this.writeAsciiQuoted(String(value));
        return;
      }
      const numStr = String(value);
      this.writeAscii(numStr);
      return;
    }
    if (typeof value === "boolean") {
      this.ensure(5);
      let { i, json } = this;
      if (value) {
        json.set(TRUE, i);
        i += 4;
      } else {
        json.set(FALSE, i);
        i += 5;
      }
      this.i = i;
      return;
    }
    if (typeof value === "bigint") {
      this.writeAscii(value.toString());
      return;
    }
    this.writeAscii(String(value));
  }
  writeStruct(ns, value) {
    this.ensure(2);
    this.json[this.i++] = OPEN_BRACE;
    let wroteAny = false;
    const hasType = typeof value.__type === "string";
    let writtenKeys;
    if (hasType) {
      writtenKeys = /* @__PURE__ */ new Set();
    }
    for (const [memberName, memberSchema] of ns.structIterator()) {
      const item = value[memberName];
      if (item == null && !memberSchema.isIdempotencyToken()) {
        continue;
      }
      if (wroteAny) {
        this.ensure(1);
        this.json[this.i++] = COMMA;
      }
      wroteAny = true;
      const targetKey = this.settings.jsonName ? memberSchema.getMergedTraits().jsonName ?? memberName : memberName;
      if (writtenKeys) {
        writtenKeys.add(memberName);
        writtenKeys.add(targetKey);
      }
      this.writeAsciiQuoted(targetKey);
      this.json[this.i++] = COLON;
      this.writeValue(memberSchema, item, ns);
    }
    if (!wroteAny && ns.isUnionSchema()) {
      const { $unknown } = value;
      if (Array.isArray($unknown)) {
        const [k, v] = $unknown;
        this.writeAsciiQuoted(k);
        this.ensure(1);
        this.json[this.i++] = COLON;
        this.writeValue(15, v, ns);
      }
    } else if (hasType) {
      for (const k in value) {
        if (writtenKeys.has(k)) {
          continue;
        }
        writtenKeys.add(k);
        const v = value[k];
        if (wroteAny) {
          this.ensure(1);
          this.json[this.i++] = COMMA;
        }
        wroteAny = true;
        this.writeAsciiQuoted(k);
        this.ensure(1);
        this.json[this.i++] = COLON;
        this.writeValue(15, v, void 0);
      }
    }
    this.ensure(1);
    this.json[this.i++] = CLOSE_BRACE;
  }
  writeList(ns, value, isDocument) {
    const sparse = !!ns.getMergedTraits().sparse;
    const valueSchema = ns.getValueSchema();
    if (!isDocument) {
      if (valueSchema.isStringSchema() || valueSchema.isNumericSchema() || valueSchema.isBooleanSchema()) {
        let hasSpecials = false;
        for (let i = 0; i < value.length; ++i) {
          const v = value[i];
          if (Number.isNaN(v) || v === Infinity || v === -Infinity || v == null && !sparse) {
            hasSpecials = true;
            break;
          }
        }
        let json;
        if (!hasSpecials) {
          json = JSON.stringify(value);
        } else {
          const out = [];
          for (let i = 0; i < value.length; ++i) {
            const v = value[i];
            if (v == null && !sparse)
              continue;
            if (Number.isNaN(v) || v === Infinity || v === -Infinity) {
              out.push(String(v));
            } else {
              out.push(v);
            }
          }
          json = JSON.stringify(out);
        }
        this.ensure(json.length * 3);
        this.i += encoder.encodeInto(json, this.json.subarray(this.i)).written;
        return;
      }
    }
    this.ensure(2);
    this.json[this.i++] = OPEN_BRACKET;
    let wroteFirstItem = false;
    for (let i = 0; i < value.length; ++i) {
      const item = value[i];
      if (isDocument ? item === void 0 : item == null && !sparse) {
        continue;
      }
      if (wroteFirstItem) {
        this.ensure(1);
        this.json[this.i++] = COMMA;
      }
      this.writeValue(valueSchema, item, void 0);
      wroteFirstItem = true;
    }
    this.ensure(1);
    this.json[this.i++] = CLOSE_BRACKET;
  }
  writeMap(ns, value, isDocument) {
    const sparse = !!ns.getMergedTraits().sparse;
    const valueSchema = ns.getValueSchema();
    if (!isDocument) {
      if (valueSchema.isStringSchema() || valueSchema.isNumericSchema() || valueSchema.isBooleanSchema()) {
        let modifications;
        for (const k in value) {
          const v = value[k];
          if (Number.isNaN(v) || v === Infinity || v === -Infinity) {
            (modifications ??= {})[k] = v;
            value[k] = String(v);
          } else if (v === null && !sparse) {
            (modifications ??= {})[k] = null;
            value[k] = void 0;
          }
        }
        const json = JSON.stringify(value);
        if (modifications) {
          Object.assign(value, modifications);
        }
        this.ensure(json.length * 3);
        this.i += encoder.encodeInto(json, this.json.subarray(this.i)).written;
        return;
      }
    }
    this.ensure(2);
    this.json[this.i++] = OPEN_BRACE;
    let first = true;
    for (const k in value) {
      const v = value[k];
      if (isDocument ? v === void 0 : v == null && !sparse) {
        continue;
      }
      if (!first) {
        this.ensure(1);
        this.json[this.i++] = COMMA;
      }
      first = false;
      this.writeJsonString(k);
      this.ensure(1);
      this.json[this.i++] = COLON;
      this.writeValue(valueSchema, v, void 0);
    }
    this.ensure(1);
    this.json[this.i++] = CLOSE_BRACE;
  }
  writeTimestamp(ns, value) {
    const format = determineTimestampFormat(ns, this.settings);
    switch (format) {
      case 5: {
        const iso = value.toISOString().replace(".000Z", "Z");
        this.writeAsciiQuoted(iso);
        return;
      }
      case 6: {
        this.writeAsciiQuoted(dateToUtcString(value));
        return;
      }
      case 7: {
        const epochSecs = String(value.getTime() / 1e3);
        this.writeAscii(epochSecs);
        return;
      }
      default: {
        const epochSecs = String(value.getTime() / 1e3);
        this.writeAscii(epochSecs);
        return;
      }
    }
  }
}
class JsonCodec2 extends SerdeContextConfig {
  settings;
  constructor(settings) {
    super();
    this.settings = settings;
  }
  createSerializer() {
    const serializer = new JsonShapeSerializer2(this.settings);
    serializer.setSerdeContext(this.serdeContext);
    return serializer;
  }
  createDeserializer() {
    const deserializer = new JsonShapeDeserializer2(this.settings);
    deserializer.setSerdeContext(this.serdeContext);
    return deserializer;
  }
}
class AwsRestJsonProtocol extends HttpBindingProtocol {
  serializer;
  deserializer;
  codec;
  mixin = new ProtocolLib();
  constructor({ defaultNamespace, errorTypeRegistries, jsonCodec }) {
    super({
      defaultNamespace,
      errorTypeRegistries
    });
    const settings = {
      timestampFormat: {
        useTrait: true,
        default: 7
      },
      httpBindings: true,
      jsonName: true
    };
    this.codec = jsonCodec ?? new JsonCodec2(settings);
    this.serializer = new HttpInterceptingShapeSerializer(this.codec.createSerializer(), settings);
    this.deserializer = new HttpInterceptingShapeDeserializer(this.codec.createDeserializer(), settings);
  }
  getShapeId() {
    return "aws.protocols#restJson1";
  }
  getPayloadCodec() {
    return this.codec;
  }
  setSerdeContext(serdeContext) {
    this.codec.setSerdeContext(serdeContext);
    super.setSerdeContext(serdeContext);
  }
  async serializeRequest(operationSchema, input, context) {
    const request = await super.serializeRequest(operationSchema, input, context);
    const inputSchema = NormalizedSchema.of(operationSchema.input);
    if (!request.headers["content-type"]) {
      const contentType = this.mixin.resolveRestContentType(this.getDefaultContentType(), inputSchema);
      if (contentType) {
        request.headers["content-type"] = contentType;
      }
    }
    if (request.body == null && request.headers["content-type"] === this.getDefaultContentType()) {
      request.body = "{}";
    }
    return request;
  }
  async deserializeResponse(operationSchema, context, response) {
    const output = await super.deserializeResponse(operationSchema, context, response);
    const outputSchema = NormalizedSchema.of(operationSchema.output);
    for (const [name, member] of outputSchema.structIterator()) {
      if (member.getMemberTraits().httpPayload && !(name in output)) {
        output[name] = null;
      }
    }
    return output;
  }
  async handleError(operationSchema, context, response, dataObject, metadata) {
    const errorIdentifier = loadRestJsonErrorCode(response, dataObject) ?? "Unknown";
    this.mixin.compose(this.compositeErrorRegistry, errorIdentifier, this.options.defaultNamespace);
    const { errorSchema, errorMetadata } = await this.mixin.getErrorSchemaOrThrowBaseException(errorIdentifier, this.options.defaultNamespace, response, dataObject, metadata);
    const ns = NormalizedSchema.of(errorSchema);
    const message = dataObject.message ?? dataObject.Message ?? "UnknownError";
    const ErrorCtor = this.compositeErrorRegistry.getErrorCtor(errorSchema) ?? Error;
    const exception = new ErrorCtor({});
    await this.deserializeHttpMessage(errorSchema, context, response, dataObject);
    const output = {};
    const errorDeserializer = this.codec.createDeserializer();
    for (const [name, member] of ns.structIterator()) {
      const target = member.getMergedTraits().jsonName ?? name;
      output[name] = errorDeserializer.readObject(member, dataObject[target]);
    }
    throw this.mixin.decorateServiceException(Object.assign(exception, errorMetadata, {
      $fault: ns.getMergedTraits().error,
      message
    }, output), dataObject);
  }
  getDefaultContentType() {
    return "application/json";
  }
}
class XmlShapeDeserializer extends SerdeContextConfig {
  settings;
  stringDeserializer;
  constructor(settings) {
    super();
    this.settings = settings;
    this.stringDeserializer = new FromStringShapeDeserializer(settings);
  }
  setSerdeContext(serdeContext) {
    this.serdeContext = serdeContext;
    this.stringDeserializer.setSerdeContext(serdeContext);
  }
  read(schema, bytes, key) {
    const ns = NormalizedSchema.of(schema);
    const memberSchemas = ns.getMemberSchemas();
    const isEventPayload = ns.isStructSchema() && ns.isMemberSchema() && !!Object.values(memberSchemas).find((memberNs) => {
      return !!memberNs.getMemberTraits().eventPayload;
    });
    if (isEventPayload) {
      const output = {};
      const memberName = Object.keys(memberSchemas)[0];
      const eventMemberSchema = memberSchemas[memberName];
      if (eventMemberSchema.isBlobSchema()) {
        output[memberName] = bytes;
      } else {
        output[memberName] = this.read(memberSchemas[memberName], bytes);
      }
      return output;
    }
    const xmlString = (this.serdeContext?.utf8Encoder ?? toUtf8)(bytes);
    const parsedObject = this.parseXml(xmlString);
    return this.readSchema(schema, key ? parsedObject[key] : parsedObject);
  }
  readSchema(_schema, value) {
    const ns = NormalizedSchema.of(_schema);
    if (ns.isUnitSchema()) {
      return;
    }
    const traits = ns.getMergedTraits();
    if (ns.isListSchema() && !Array.isArray(value)) {
      return this.readSchema(ns, [value]);
    }
    if (value == null) {
      return value;
    }
    if (typeof value === "object") {
      const flat = !!traits.xmlFlattened;
      if (ns.isListSchema()) {
        const listValue = ns.getValueSchema();
        const buffer2 = [];
        const sourceKey = listValue.getMergedTraits().xmlName ?? "member";
        const source = flat ? value : (value[0] ?? value)[sourceKey];
        if (source == null) {
          return buffer2;
        }
        const sourceArray = Array.isArray(source) ? source : [source];
        for (const v of sourceArray) {
          buffer2.push(this.readSchema(listValue, v));
        }
        return buffer2;
      }
      const buffer = {};
      if (ns.isMapSchema()) {
        const keyNs = ns.getKeySchema();
        const memberNs = ns.getValueSchema();
        let entries;
        if (flat) {
          entries = Array.isArray(value) ? value : [value];
        } else {
          entries = Array.isArray(value.entry) ? value.entry : [value.entry];
        }
        const keyProperty = keyNs.getMergedTraits().xmlName ?? "key";
        const valueProperty = memberNs.getMergedTraits().xmlName ?? "value";
        for (const entry of entries) {
          const key = entry[keyProperty];
          const value2 = entry[valueProperty];
          if (key === "__proto__") {
            writeKey(buffer);
          }
          buffer[key] = this.readSchema(memberNs, value2);
        }
        return buffer;
      }
      if (ns.isStructSchema()) {
        const union = ns.isUnionSchema();
        let unionSerde;
        if (union) {
          unionSerde = new UnionSerde(value, buffer);
        }
        for (const [memberName, memberSchema] of ns.structIterator()) {
          const memberTraits = memberSchema.getMergedTraits();
          const xmlObjectKey = !memberTraits.httpPayload ? memberSchema.getMemberTraits().xmlName ?? memberName : memberTraits.xmlName ?? memberSchema.getName();
          if (union) {
            unionSerde.mark(xmlObjectKey);
          }
          if (value[xmlObjectKey] != null) {
            buffer[memberName] = this.readSchema(memberSchema, value[xmlObjectKey]);
          }
        }
        if (union) {
          unionSerde.writeUnknown();
        }
        return buffer;
      }
      if (ns.isDocumentSchema()) {
        return value;
      }
      throw new Error(`@aws-sdk/core/protocols - xml deserializer unhandled schema type for ${ns.getName(true)}`);
    }
    if (ns.isListSchema()) {
      return [];
    }
    if (ns.isMapSchema() || ns.isStructSchema()) {
      return {};
    }
    return this.stringDeserializer.read(ns, value);
  }
  parseXml(xml) {
    if (xml.length) {
      let parsedObj;
      try {
        parsedObj = parseXML(xml);
      } catch (e) {
        if (e && typeof e === "object") {
          Object.defineProperty(e, "$responseBodyText", {
            value: xml
          });
        }
        throw e;
      }
      const textNodeName = "#text";
      const key = Object.keys(parsedObj)[0];
      const parsedObjToReturn = parsedObj[key];
      if (parsedObjToReturn[textNodeName]) {
        parsedObjToReturn[key] = parsedObjToReturn[textNodeName];
        delete parsedObjToReturn[textNodeName];
      }
      return getValueFromTextNode(parsedObjToReturn);
    }
    return {};
  }
}
class QueryShapeSerializer extends SerdeContextConfig {
  settings;
  buffer;
  constructor(settings) {
    super();
    this.settings = settings;
  }
  write(schema, value, prefix = "") {
    if (this.buffer === void 0) {
      this.buffer = "";
    }
    const ns = NormalizedSchema.of(schema);
    if (prefix && !prefix.endsWith(".")) {
      prefix += ".";
    }
    if (ns.isBlobSchema()) {
      if (typeof value === "string" || value instanceof Uint8Array) {
        this.writeKey(prefix);
        this.writeValue((this.serdeContext?.base64Encoder ?? toBase64)(value));
      }
    } else if (ns.isBooleanSchema() || ns.isNumericSchema() || ns.isStringSchema()) {
      if (value != null) {
        this.writeKey(prefix);
        this.writeValue(String(value));
      } else if (ns.isIdempotencyToken()) {
        this.writeKey(prefix);
        this.writeValue(generateIdempotencyToken());
      }
    } else if (ns.isBigIntegerSchema()) {
      if (value != null) {
        this.writeKey(prefix);
        this.writeValue(String(value));
      }
    } else if (ns.isBigDecimalSchema()) {
      if (value != null) {
        this.writeKey(prefix);
        this.writeValue(value instanceof NumericValue ? value.string : String(value));
      }
    } else if (ns.isTimestampSchema()) {
      if (value instanceof Date) {
        this.writeKey(prefix);
        const format = determineTimestampFormat(ns, this.settings);
        switch (format) {
          case 5:
            this.writeValue(value.toISOString().replace(".000Z", "Z"));
            break;
          case 6:
            this.writeValue(dateToUtcString(value));
            break;
          case 7:
            this.writeValue(String(value.getTime() / 1e3));
            break;
        }
      }
    } else if (ns.isDocumentSchema()) {
      if (Array.isArray(value)) {
        this.write(64 | 15, value, prefix);
      } else if (value instanceof Date) {
        this.write(4, value, prefix);
      } else if (value instanceof Uint8Array) {
        this.write(21, value, prefix);
      } else if (value && typeof value === "object") {
        this.write(128 | 15, value, prefix);
      } else {
        this.writeKey(prefix);
        this.writeValue(String(value));
      }
    } else if (ns.isListSchema()) {
      if (Array.isArray(value)) {
        if (value.length === 0) {
          if (this.settings.serializeEmptyLists) {
            this.writeKey(prefix);
            this.writeValue("");
          }
        } else {
          const member = ns.getValueSchema();
          const flat = this.settings.flattenLists || ns.getMergedTraits().xmlFlattened;
          let i = 1;
          for (const item of value) {
            if (item == null) {
              continue;
            }
            const traits = member.getMergedTraits();
            const suffix = this.getKey("member", traits.xmlName, traits.ec2QueryName);
            const key = flat ? `${prefix}${i}` : `${prefix}${suffix}.${i}`;
            this.write(member, item, key);
            ++i;
          }
        }
      }
    } else if (ns.isMapSchema()) {
      if (value && typeof value === "object") {
        const keySchema = ns.getKeySchema();
        const memberSchema = ns.getValueSchema();
        const flat = ns.getMergedTraits().xmlFlattened;
        let i = 1;
        for (const k in value) {
          const v = value[k];
          if (v == null) {
            continue;
          }
          const keyTraits = keySchema.getMergedTraits();
          const keySuffix = this.getKey("key", keyTraits.xmlName, keyTraits.ec2QueryName);
          const key = flat ? `${prefix}${i}.${keySuffix}` : `${prefix}entry.${i}.${keySuffix}`;
          const valTraits = memberSchema.getMergedTraits();
          const valueSuffix = this.getKey("value", valTraits.xmlName, valTraits.ec2QueryName);
          const valueKey = flat ? `${prefix}${i}.${valueSuffix}` : `${prefix}entry.${i}.${valueSuffix}`;
          this.write(keySchema, k, key);
          this.write(memberSchema, v, valueKey);
          ++i;
        }
      }
    } else if (ns.isStructSchema()) {
      if (value && typeof value === "object") {
        let didWriteMember = false;
        for (const [memberName, member] of ns.structIterator()) {
          if (value[memberName] == null && !member.isIdempotencyToken()) {
            continue;
          }
          const traits = member.getMergedTraits();
          const suffix = this.getKey(memberName, traits.xmlName, traits.ec2QueryName, "struct");
          const key = `${prefix}${suffix}`;
          this.write(member, value[memberName], key);
          didWriteMember = true;
        }
        if (!didWriteMember && ns.isUnionSchema()) {
          const { $unknown } = value;
          if (Array.isArray($unknown)) {
            const [k, v] = $unknown;
            const key = `${prefix}${k}`;
            this.write(15, v, key);
          }
        }
      }
    } else if (ns.isUnitSchema()) ;
    else {
      throw new Error(`@aws-sdk/core/protocols - QuerySerializer unrecognized schema type ${ns.getName(true)}`);
    }
  }
  flush() {
    if (this.buffer === void 0) {
      throw new Error("@aws-sdk/core/protocols - QuerySerializer cannot flush with nothing written to buffer.");
    }
    const str = this.buffer;
    delete this.buffer;
    return str;
  }
  getKey(memberName, xmlName, ec2QueryName, keySource) {
    const { ec2, capitalizeKeys } = this.settings;
    if (ec2 && ec2QueryName) {
      return ec2QueryName;
    }
    const key = xmlName ?? memberName;
    if (capitalizeKeys && keySource === "struct") {
      return key[0].toUpperCase() + key.slice(1);
    }
    return key;
  }
  writeKey(key) {
    if (key.endsWith(".")) {
      key = key.slice(0, key.length - 1);
    }
    this.buffer += `&${extendedEncodeURIComponent(key)}=`;
  }
  writeValue(value) {
    this.buffer += extendedEncodeURIComponent(value);
  }
}
class AwsQueryProtocol extends RpcProtocol {
  options;
  serializer;
  deserializer;
  mixin = new ProtocolLib();
  constructor(options) {
    super({
      defaultNamespace: options.defaultNamespace,
      errorTypeRegistries: options.errorTypeRegistries
    });
    this.options = options;
    const settings = {
      timestampFormat: {
        useTrait: true,
        default: 5
      },
      httpBindings: false,
      xmlNamespace: options.xmlNamespace,
      serviceNamespace: options.defaultNamespace,
      serializeEmptyLists: true
    };
    this.serializer = new QueryShapeSerializer(settings);
    this.deserializer = new XmlShapeDeserializer(settings);
  }
  getShapeId() {
    return "aws.protocols#awsQuery";
  }
  setSerdeContext(serdeContext) {
    this.serializer.setSerdeContext(serdeContext);
    this.deserializer.setSerdeContext(serdeContext);
  }
  getPayloadCodec() {
    throw new Error("AWSQuery protocol has no payload codec.");
  }
  async serializeRequest(operationSchema, input, context) {
    const request = await super.serializeRequest(operationSchema, input, context);
    if (!request.path.endsWith("/")) {
      request.path += "/";
    }
    request.headers["content-type"] = "application/x-www-form-urlencoded";
    if (deref(operationSchema.input) === "unit" || !request.body) {
      request.body = "";
    }
    const action = operationSchema.name.split("#")[1] ?? operationSchema.name;
    request.body = `Action=${action}&Version=${this.options.version}` + request.body;
    if (request.body.endsWith("&")) {
      request.body = request.body.slice(-1);
    }
    return request;
  }
  async deserializeResponse(operationSchema, context, response) {
    const deserializer = this.deserializer;
    const ns = NormalizedSchema.of(operationSchema.output);
    const dataObject = {};
    if (response.statusCode >= 300) {
      const bytes2 = await collectBody(response.body, context);
      if (bytes2.byteLength > 0) {
        Object.assign(dataObject, await deserializer.read(15, bytes2));
      }
      await this.handleError(operationSchema, context, response, dataObject, this.deserializeMetadata(response));
    }
    for (const header in response.headers) {
      const value = response.headers[header];
      delete response.headers[header];
      response.headers[header.toLowerCase()] = value;
    }
    const shortName = operationSchema.name.split("#")[1] ?? operationSchema.name;
    const awsQueryResultKey = ns.isStructSchema() && this.useNestedResult() ? shortName + "Result" : void 0;
    const bytes = await collectBody(response.body, context);
    if (bytes.byteLength > 0) {
      Object.assign(dataObject, await deserializer.read(ns, bytes, awsQueryResultKey));
    }
    dataObject.$metadata = this.deserializeMetadata(response);
    return dataObject;
  }
  useNestedResult() {
    return true;
  }
  async handleError(operationSchema, context, response, dataObject, metadata) {
    const errorIdentifier = this.loadQueryErrorCode(response, dataObject) ?? "Unknown";
    this.mixin.compose(this.compositeErrorRegistry, errorIdentifier, this.options.defaultNamespace);
    const errorData = this.loadQueryError(dataObject) ?? {};
    const message = this.loadQueryErrorMessage(dataObject);
    errorData.message = message;
    errorData.Error = {
      Type: errorData.Type,
      Code: errorData.Code,
      Message: message
    };
    const { errorSchema, errorMetadata } = await this.mixin.getErrorSchemaOrThrowBaseException(errorIdentifier, this.options.defaultNamespace, response, errorData, metadata, this.mixin.findQueryCompatibleError);
    const ns = NormalizedSchema.of(errorSchema);
    const ErrorCtor = this.compositeErrorRegistry.getErrorCtor(errorSchema) ?? Error;
    const exception = new ErrorCtor({});
    const output = {
      Type: errorData.Error.Type,
      Code: errorData.Error.Code,
      Error: errorData.Error
    };
    for (const [name, member] of ns.structIterator()) {
      const target = member.getMergedTraits().xmlName ?? name;
      const value = errorData[target] ?? dataObject[target];
      output[name] = this.deserializer.readSchema(member, value);
    }
    throw this.mixin.decorateServiceException(Object.assign(exception, errorMetadata, {
      $fault: ns.getMergedTraits().error,
      message
    }, output), dataObject);
  }
  loadQueryErrorCode(output, data) {
    const code = (data.Errors?.[0]?.Error ?? data.Errors?.Error ?? data.Error)?.Code;
    if (code !== void 0) {
      return code;
    }
    if (output.statusCode == 404) {
      return "NotFound";
    }
  }
  loadQueryError(data) {
    return data.Errors?.[0]?.Error ?? data.Errors?.Error ?? data.Error;
  }
  loadQueryErrorMessage(data) {
    const errorData = this.loadQueryError(data);
    return errorData?.message ?? errorData?.Message ?? data.message ?? data.Message ?? "Unknown";
  }
  getDefaultContentType() {
    return "application/x-www-form-urlencoded";
  }
}
const loadRestXmlErrorCode = (output, data) => {
  if (data?.Error?.Code !== void 0) {
    return data.Error.Code;
  }
  if (data?.Code !== void 0) {
    return data.Code;
  }
  if (output.statusCode == 404) {
    return "NotFound";
  }
};
class XmlShapeSerializer extends SerdeContextConfig {
  settings;
  stringBuffer;
  byteBuffer;
  buffer;
  constructor(settings) {
    super();
    this.settings = settings;
  }
  write(schema, value) {
    const ns = NormalizedSchema.of(schema);
    if (ns.isStringSchema() && typeof value === "string") {
      this.stringBuffer = value;
    } else if (ns.isBlobSchema()) {
      this.byteBuffer = "byteLength" in value ? value : (this.serdeContext?.base64Decoder ?? fromBase64)(value);
    } else {
      this.buffer = this.writeStruct(ns, value, void 0);
      const traits = ns.getMergedTraits();
      if (traits.httpPayload && !traits.xmlName) {
        this.buffer.withName(ns.getName());
      }
    }
  }
  flush() {
    if (this.byteBuffer !== void 0) {
      const bytes = this.byteBuffer;
      delete this.byteBuffer;
      return bytes;
    }
    if (this.stringBuffer !== void 0) {
      const str = this.stringBuffer;
      delete this.stringBuffer;
      return str;
    }
    const buffer = this.buffer;
    if (this.settings.xmlNamespace) {
      if (!buffer?.attributes?.["xmlns"]) {
        buffer.addAttribute("xmlns", this.settings.xmlNamespace);
      }
    }
    delete this.buffer;
    return buffer.toString();
  }
  writeStruct(ns, value, parentXmlns) {
    const traits = ns.getMergedTraits();
    const name = ns.isMemberSchema() && !traits.httpPayload ? ns.getMemberTraits().xmlName ?? ns.getMemberName() : traits.xmlName ?? ns.getName();
    if (!name || !ns.isStructSchema()) {
      throw new Error(`@aws-sdk/core/protocols - xml serializer, cannot write struct with empty name or non-struct, schema=${ns.getName(true)}.`);
    }
    const structXmlNode = XmlNode.of(name);
    const [xmlnsAttr, xmlns] = this.getXmlnsAttribute(ns, parentXmlns);
    for (const [memberName, memberSchema] of ns.structIterator()) {
      const val = value[memberName];
      if (val != null || memberSchema.isIdempotencyToken()) {
        if (memberSchema.getMergedTraits().xmlAttribute) {
          structXmlNode.addAttribute(memberSchema.getMergedTraits().xmlName ?? memberName, this.writeSimple(memberSchema, val));
          continue;
        }
        if (memberSchema.isListSchema()) {
          this.writeList(memberSchema, val, structXmlNode, xmlns);
        } else if (memberSchema.isMapSchema()) {
          this.writeMap(memberSchema, val, structXmlNode, xmlns);
        } else if (memberSchema.isStructSchema()) {
          structXmlNode.addChildNode(this.writeStruct(memberSchema, val, xmlns));
        } else {
          const memberNode = XmlNode.of(memberSchema.getMergedTraits().xmlName ?? memberSchema.getMemberName());
          this.writeSimpleInto(memberSchema, val, memberNode, xmlns);
          structXmlNode.addChildNode(memberNode);
        }
      }
    }
    const { $unknown } = value;
    if ($unknown && ns.isUnionSchema() && Array.isArray($unknown) && Object.keys(value).length === 1) {
      const [k, v] = $unknown;
      const node = XmlNode.of(k);
      if (typeof v !== "string") {
        if (value instanceof XmlNode || value instanceof XmlText) {
          structXmlNode.addChildNode(value);
        } else {
          throw new Error(`@aws-sdk - $unknown union member in XML requires value of type string, @aws-sdk/xml-builder::XmlNode or XmlText.`);
        }
      }
      this.writeSimpleInto(0, v, node, xmlns);
      structXmlNode.addChildNode(node);
    }
    if (xmlns) {
      structXmlNode.addAttribute(xmlnsAttr, xmlns);
    }
    return structXmlNode;
  }
  writeList(listMember, array, container, parentXmlns) {
    if (!listMember.isMemberSchema()) {
      throw new Error(`@aws-sdk/core/protocols - xml serializer, cannot write non-member list: ${listMember.getName(true)}`);
    }
    const listTraits = listMember.getMergedTraits();
    const listValueSchema = listMember.getValueSchema();
    const listValueTraits = listValueSchema.getMergedTraits();
    const sparse = !!listValueTraits.sparse;
    const flat = !!listTraits.xmlFlattened;
    const [xmlnsAttr, xmlns] = this.getXmlnsAttribute(listMember, parentXmlns);
    const writeItem = (container2, value) => {
      if (listValueSchema.isListSchema()) {
        this.writeList(listValueSchema, Array.isArray(value) ? value : [value], container2, xmlns);
      } else if (listValueSchema.isMapSchema()) {
        this.writeMap(listValueSchema, value, container2, xmlns);
      } else if (listValueSchema.isStructSchema()) {
        const struct = this.writeStruct(listValueSchema, value, xmlns);
        container2.addChildNode(struct.withName(flat ? listTraits.xmlName ?? listMember.getMemberName() : listValueTraits.xmlName ?? "member"));
      } else {
        const listItemNode = XmlNode.of(flat ? listTraits.xmlName ?? listMember.getMemberName() : listValueTraits.xmlName ?? "member");
        this.writeSimpleInto(listValueSchema, value, listItemNode, xmlns);
        container2.addChildNode(listItemNode);
      }
    };
    if (flat) {
      for (const value of array) {
        if (sparse || value != null) {
          writeItem(container, value);
        }
      }
    } else {
      const listNode = XmlNode.of(listTraits.xmlName ?? listMember.getMemberName());
      if (xmlns) {
        listNode.addAttribute(xmlnsAttr, xmlns);
      }
      for (const value of array) {
        if (sparse || value != null) {
          writeItem(listNode, value);
        }
      }
      container.addChildNode(listNode);
    }
  }
  writeMap(mapMember, map, container, parentXmlns, containerIsMap = false) {
    if (!mapMember.isMemberSchema()) {
      throw new Error(`@aws-sdk/core/protocols - xml serializer, cannot write non-member map: ${mapMember.getName(true)}`);
    }
    const mapTraits = mapMember.getMergedTraits();
    const mapKeySchema = mapMember.getKeySchema();
    const mapKeyTraits = mapKeySchema.getMergedTraits();
    const keyTag = mapKeyTraits.xmlName ?? "key";
    const mapValueSchema = mapMember.getValueSchema();
    const mapValueTraits = mapValueSchema.getMergedTraits();
    const valueTag = mapValueTraits.xmlName ?? "value";
    const sparse = !!mapValueTraits.sparse;
    const flat = !!mapTraits.xmlFlattened;
    const [xmlnsAttr, xmlns] = this.getXmlnsAttribute(mapMember, parentXmlns);
    const addKeyValue = (entry, key, val) => {
      const keyNode = XmlNode.of(keyTag, key);
      const [keyXmlnsAttr, keyXmlns] = this.getXmlnsAttribute(mapKeySchema, xmlns);
      if (keyXmlns) {
        keyNode.addAttribute(keyXmlnsAttr, keyXmlns);
      }
      entry.addChildNode(keyNode);
      let valueNode = XmlNode.of(valueTag);
      if (mapValueSchema.isListSchema()) {
        this.writeList(mapValueSchema, val, valueNode, xmlns);
      } else if (mapValueSchema.isMapSchema()) {
        this.writeMap(mapValueSchema, val, valueNode, xmlns, true);
      } else if (mapValueSchema.isStructSchema()) {
        valueNode = this.writeStruct(mapValueSchema, val, xmlns);
      } else {
        this.writeSimpleInto(mapValueSchema, val, valueNode, xmlns);
      }
      entry.addChildNode(valueNode);
    };
    if (flat) {
      for (const key in map) {
        const val = map[key];
        if (sparse || val != null) {
          const entry = XmlNode.of(mapTraits.xmlName ?? mapMember.getMemberName());
          addKeyValue(entry, key, val);
          container.addChildNode(entry);
        }
      }
    } else {
      let mapNode;
      if (!containerIsMap) {
        mapNode = XmlNode.of(mapTraits.xmlName ?? mapMember.getMemberName());
        if (xmlns) {
          mapNode.addAttribute(xmlnsAttr, xmlns);
        }
        container.addChildNode(mapNode);
      }
      for (const key in map) {
        const val = map[key];
        if (sparse || val != null) {
          const entry = XmlNode.of("entry");
          addKeyValue(entry, key, val);
          (containerIsMap ? container : mapNode).addChildNode(entry);
        }
      }
    }
  }
  writeSimple(_schema, value) {
    if (null === value) {
      throw new Error("@aws-sdk/core/protocols - (XML serializer) cannot write null value.");
    }
    const ns = NormalizedSchema.of(_schema);
    let nodeContents = null;
    if (value && typeof value === "object") {
      if (ns.isBlobSchema()) {
        nodeContents = (this.serdeContext?.base64Encoder ?? toBase64)(value);
      } else if (ns.isTimestampSchema() && value instanceof Date) {
        const format = determineTimestampFormat(ns, this.settings);
        switch (format) {
          case 5:
            nodeContents = value.toISOString().replace(".000Z", "Z");
            break;
          case 6:
            nodeContents = dateToUtcString(value);
            break;
          case 7:
            nodeContents = String(value.getTime() / 1e3);
            break;
          default:
            console.warn("Missing timestamp format, using http date", value);
            nodeContents = dateToUtcString(value);
            break;
        }
      } else if (ns.isBigDecimalSchema() && value) {
        if (value instanceof NumericValue) {
          return value.string;
        }
        return String(value);
      } else if (ns.isMapSchema() || ns.isListSchema()) {
        throw new Error("@aws-sdk/core/protocols - xml serializer, cannot call _write() on List/Map schema, call writeList or writeMap() instead.");
      } else {
        throw new Error(`@aws-sdk/core/protocols - xml serializer, unhandled schema type for object value and schema: ${ns.getName(true)}`);
      }
    }
    if (ns.isBooleanSchema() || ns.isNumericSchema() || ns.isBigIntegerSchema() || ns.isBigDecimalSchema()) {
      nodeContents = String(value);
    }
    if (ns.isStringSchema()) {
      if (value === void 0 && ns.isIdempotencyToken()) {
        nodeContents = generateIdempotencyToken();
      } else {
        nodeContents = String(value);
      }
    }
    if (nodeContents === null) {
      throw new Error(`Unhandled schema-value pair ${ns.getName(true)}=${value}`);
    }
    return nodeContents;
  }
  writeSimpleInto(_schema, value, into, parentXmlns) {
    const nodeContents = this.writeSimple(_schema, value);
    const ns = NormalizedSchema.of(_schema);
    const content = new XmlText(nodeContents);
    const [xmlnsAttr, xmlns] = this.getXmlnsAttribute(ns, parentXmlns);
    if (xmlns) {
      into.addAttribute(xmlnsAttr, xmlns);
    }
    into.addChildNode(content);
  }
  getXmlnsAttribute(ns, parentXmlns) {
    const traits = ns.getMergedTraits();
    const [prefix, xmlns] = traits.xmlNamespace ?? [];
    if (xmlns && xmlns !== parentXmlns) {
      return [prefix ? `xmlns:${prefix}` : "xmlns", xmlns];
    }
    return [void 0, void 0];
  }
}
class XmlCodec extends SerdeContextConfig {
  settings;
  constructor(settings) {
    super();
    this.settings = settings;
  }
  createSerializer() {
    const serializer = new XmlShapeSerializer(this.settings);
    serializer.setSerdeContext(this.serdeContext);
    return serializer;
  }
  createDeserializer() {
    const deserializer = new XmlShapeDeserializer(this.settings);
    deserializer.setSerdeContext(this.serdeContext);
    return deserializer;
  }
}
class AwsRestXmlProtocol extends HttpBindingProtocol {
  codec;
  serializer;
  deserializer;
  mixin = new ProtocolLib();
  constructor(options) {
    super(options);
    const settings = {
      timestampFormat: {
        useTrait: true,
        default: 5
      },
      httpBindings: true,
      xmlNamespace: options.xmlNamespace,
      serviceNamespace: options.defaultNamespace
    };
    this.codec = new XmlCodec(settings);
    this.serializer = new HttpInterceptingShapeSerializer(this.codec.createSerializer(), settings);
    this.deserializer = new HttpInterceptingShapeDeserializer(this.codec.createDeserializer(), settings);
  }
  getPayloadCodec() {
    return this.codec;
  }
  getShapeId() {
    return "aws.protocols#restXml";
  }
  async serializeRequest(operationSchema, input, context) {
    const request = await super.serializeRequest(operationSchema, input, context);
    const inputSchema = NormalizedSchema.of(operationSchema.input);
    if (!request.headers["content-type"]) {
      const contentType = this.mixin.resolveRestContentType(this.getDefaultContentType(), inputSchema);
      if (contentType) {
        request.headers["content-type"] = contentType;
      }
    }
    if (typeof request.body === "string" && request.headers["content-type"] === this.getDefaultContentType() && !request.body.startsWith("<?xml ") && !this.hasUnstructuredPayloadBinding(inputSchema)) {
      request.body = '<?xml version="1.0" encoding="UTF-8"?>' + request.body;
    }
    return request;
  }
  async deserializeResponse(operationSchema, context, response) {
    return super.deserializeResponse(operationSchema, context, response);
  }
  async handleError(operationSchema, context, response, dataObject, metadata) {
    const errorIdentifier = loadRestXmlErrorCode(response, dataObject) ?? "Unknown";
    this.mixin.compose(this.compositeErrorRegistry, errorIdentifier, this.options.defaultNamespace);
    if (dataObject.Error && typeof dataObject.Error === "object") {
      for (const key of Object.keys(dataObject.Error)) {
        dataObject[key] = dataObject.Error[key];
        if (key.toLowerCase() === "message") {
          dataObject.message = dataObject.Error[key];
        }
      }
    }
    if (dataObject.RequestId && !metadata.requestId) {
      metadata.requestId = dataObject.RequestId;
    }
    const { errorSchema, errorMetadata } = await this.mixin.getErrorSchemaOrThrowBaseException(errorIdentifier, this.options.defaultNamespace, response, dataObject, metadata);
    const ns = NormalizedSchema.of(errorSchema);
    const message = dataObject.Error?.message ?? dataObject.Error?.Message ?? dataObject.message ?? dataObject.Message ?? "UnknownError";
    const ErrorCtor = this.compositeErrorRegistry.getErrorCtor(errorSchema) ?? Error;
    const exception = new ErrorCtor({});
    await this.deserializeHttpMessage(errorSchema, context, response, dataObject);
    const output = {};
    const errorDeserializer = this.codec.createDeserializer();
    for (const [name, member] of ns.structIterator()) {
      const target = member.getMergedTraits().xmlName ?? name;
      const value = dataObject.Error?.[target] ?? dataObject[target];
      output[name] = errorDeserializer.readSchema(member, value);
    }
    throw this.mixin.decorateServiceException(Object.assign(exception, errorMetadata, {
      $fault: ns.getMergedTraits().error,
      message
    }, output), dataObject);
  }
  getDefaultContentType() {
    return "application/xml";
  }
  hasUnstructuredPayloadBinding(ns) {
    for (const [, member] of ns.structIterator()) {
      if (member.getMergedTraits().httpPayload) {
        return !(member.isStructSchema() || member.isMapSchema() || member.isListSchema());
      }
    }
    return false;
  }
}
const getDateHeader = (response) => HttpResponse.isInstance(response) ? response.headers?.date ?? response.headers?.Date : void 0;
const getAgeHeader = (response) => HttpResponse.isInstance(response) ? response.headers?.age ?? response.headers?.Age : void 0;
const getSkewCorrectedDate = (systemClockOffset) => new Date(Date.now() + systemClockOffset);
const getUpdatedSystemClockOffset = (clockTime, currentSystemClockOffset, timeRequestSent, ageHeader) => {
  if (ageHeader !== void 0) {
    return currentSystemClockOffset;
  }
  const serverTime = Date.parse(clockTime);
  const timeResponseReceived = Date.now();
  if (timeRequestSent !== void 0 && timeResponseReceived - timeRequestSent > 9e5) {
    return currentSystemClockOffset;
  }
  const candidateSkew = timeRequestSent !== void 0 ? serverTime - (timeRequestSent + timeResponseReceived) / 2 : serverTime - timeResponseReceived;
  return candidateSkew;
};
const throwSigningPropertyError = (name, property) => {
  if (!property) {
    throw new Error(`Property \`${name}\` is not resolved for AWS SDK SigV4Auth`);
  }
  return property;
};
const validateSigningProperties = async (signingProperties) => {
  const context = throwSigningPropertyError("context", signingProperties.context);
  const config = throwSigningPropertyError("config", signingProperties.config);
  const authScheme = context.endpointV2?.properties?.authSchemes?.[0];
  const signerFunction = throwSigningPropertyError("signer", config.signer);
  const signer = await signerFunction(authScheme);
  const signingRegion = signingProperties?.signingRegion;
  const signingRegionSet = signingProperties?.signingRegionSet;
  const signingName = signingProperties?.signingName;
  return {
    config,
    signer,
    signingRegion,
    signingRegionSet,
    signingName
  };
};
class AwsSdkSigV4Signer {
  async sign(httpRequest, identity, signingProperties) {
    if (!HttpRequest.isInstance(httpRequest)) {
      throw new Error("The request is not an instance of `HttpRequest` and cannot be signed");
    }
    const validatedProps = await validateSigningProperties(signingProperties);
    const { config, signer } = validatedProps;
    let { signingRegion, signingName } = validatedProps;
    const handlerExecutionContext = signingProperties.context;
    if (handlerExecutionContext?.authSchemes?.length ?? 0 > 1) {
      const [first, second] = handlerExecutionContext.authSchemes;
      if (first?.name === "sigv4a" && second?.name === "sigv4") {
        signingRegion = second?.signingRegion ?? signingRegion;
        signingName = second?.signingName ?? signingName;
      }
    }
    const noSkewCorrection = await config.disableClockSkewCorrection?.() === true;
    signingProperties._disableClockSkewCorrection = noSkewCorrection;
    if (!noSkewCorrection) {
      signingProperties._preRequestSystemClockOffset = config.systemClockOffset;
      signingProperties._requestSentAt = Date.now();
    }
    const signedRequest = await signer.sign(httpRequest, {
      signingDate: noSkewCorrection ? /* @__PURE__ */ new Date() : getSkewCorrectedDate(config.systemClockOffset),
      signingRegion,
      signingService: signingName
    });
    return signedRequest;
  }
  errorHandler(signingProperties) {
    return (error) => {
      const errorException = error;
      if (!signingProperties._disableClockSkewCorrection) {
        const serverTime = errorException.ServerTime ?? getDateHeader(errorException.$response);
        if (serverTime) {
          const config = throwSigningPropertyError("config", signingProperties.config);
          const preRequestOffset = signingProperties._preRequestSystemClockOffset;
          const timeRequestSent = signingProperties._requestSentAt;
          const ageHeader = getAgeHeader(errorException.$response);
          const newOffset = getUpdatedSystemClockOffset(serverTime, config.systemClockOffset, timeRequestSent, ageHeader);
          config.systemClockOffset = newOffset;
          const skewExceedsThreshold = Math.abs(newOffset) >= 24e4;
          const isLocalCorrection = newOffset !== preRequestOffset;
          const isConcurrentCorrection = preRequestOffset !== void 0 && preRequestOffset !== newOffset;
          if (skewExceedsThreshold && (isLocalCorrection || isConcurrentCorrection) && errorException.$metadata) {
            errorException.$metadata.clockSkewCorrected = true;
          }
        }
      }
      throw error;
    };
  }
  successHandler(httpResponse, signingProperties) {
    if (signingProperties._disableClockSkewCorrection) {
      return;
    }
    const dateHeader = getDateHeader(httpResponse);
    if (dateHeader) {
      const config = throwSigningPropertyError("config", signingProperties.config);
      const timeRequestSent = signingProperties._requestSentAt;
      const ageHeader = getAgeHeader(httpResponse);
      config.systemClockOffset = getUpdatedSystemClockOffset(dateHeader, config.systemClockOffset, timeRequestSent, ageHeader);
    }
  }
}
class AwsSdkSigV4ASigner extends AwsSdkSigV4Signer {
  async sign(httpRequest, identity, signingProperties) {
    if (!HttpRequest.isInstance(httpRequest)) {
      throw new Error("The request is not an instance of `HttpRequest` and cannot be signed");
    }
    const { config, signer, signingRegion, signingRegionSet, signingName } = await validateSigningProperties(signingProperties);
    const configResolvedSigningRegionSet = await config.sigv4aSigningRegionSet?.();
    const multiRegionOverride = (configResolvedSigningRegionSet ?? signingRegionSet ?? [signingRegion]).join(",");
    const noSkewCorrection = await config.disableClockSkewCorrection?.() === true;
    signingProperties._disableClockSkewCorrection = noSkewCorrection;
    if (!noSkewCorrection) {
      signingProperties._preRequestSystemClockOffset = config.systemClockOffset;
      signingProperties._requestSentAt = Date.now();
    }
    const signedRequest = await signer.sign(httpRequest, {
      signingDate: noSkewCorrection ? /* @__PURE__ */ new Date() : getSkewCorrectedDate(config.systemClockOffset),
      signingRegion: multiRegionOverride,
      signingService: signingName
    });
    return signedRequest;
  }
}
const getArrayForCommaSeparatedString = (str) => typeof str === "string" && str.length > 0 ? str.split(",").map((item) => item.trim()) : [];
const getBearerTokenEnvKey = (signingName) => `AWS_BEARER_TOKEN_${signingName.replace(/[\s-]/g, "_").toUpperCase()}`;
const NODE_AUTH_SCHEME_PREFERENCE_ENV_KEY = "AWS_AUTH_SCHEME_PREFERENCE";
const NODE_AUTH_SCHEME_PREFERENCE_CONFIG_KEY = "auth_scheme_preference";
const NODE_AUTH_SCHEME_PREFERENCE_OPTIONS = {
  environmentVariableSelector: (env2, options) => {
    if (options?.signingName) {
      const bearerTokenKey = getBearerTokenEnvKey(options.signingName);
      if (bearerTokenKey in env2)
        return ["httpBearerAuth"];
    }
    if (!(NODE_AUTH_SCHEME_PREFERENCE_ENV_KEY in env2))
      return void 0;
    return getArrayForCommaSeparatedString(env2[NODE_AUTH_SCHEME_PREFERENCE_ENV_KEY]);
  },
  configFileSelector: (profile) => {
    if (!(NODE_AUTH_SCHEME_PREFERENCE_CONFIG_KEY in profile))
      return void 0;
    return getArrayForCommaSeparatedString(profile[NODE_AUTH_SCHEME_PREFERENCE_CONFIG_KEY]);
  },
  default: []
};
const resolveAwsSdkSigV4AConfig = (config) => {
  config.sigv4aSigningRegionSet = normalizeProvider(config.sigv4aSigningRegionSet);
  return config;
};
const NODE_SIGV4A_CONFIG_OPTIONS = {
  environmentVariableSelector(env2) {
    if (env2.AWS_SIGV4A_SIGNING_REGION_SET) {
      return env2.AWS_SIGV4A_SIGNING_REGION_SET.split(",").map((_) => _.trim());
    }
    throw new ProviderError("AWS_SIGV4A_SIGNING_REGION_SET not set in env.", {
      tryNextLink: true
    });
  },
  configFileSelector(profile) {
    if (profile.sigv4a_signing_region_set) {
      return (profile.sigv4a_signing_region_set ?? "").split(",").map((_) => _.trim());
    }
    throw new ProviderError("sigv4a_signing_region_set not set in profile.", {
      tryNextLink: true
    });
  },
  default: void 0
};
const bindResolveAwsSdkSigV4Config = (defaultDisableClockSkewCorrection) => (config) => {
  let inputCredentials = config.credentials;
  let isUserSupplied = !!config.credentials;
  let resolvedCredentials = void 0;
  Object.defineProperty(config, "credentials", {
    set(credentials) {
      if (credentials && credentials !== inputCredentials && credentials !== resolvedCredentials) {
        isUserSupplied = true;
      }
      inputCredentials = credentials;
      const memoizedProvider = normalizeCredentialProvider(config, {
        credentials: inputCredentials,
        credentialDefaultProvider: config.credentialDefaultProvider
      });
      const boundProvider = bindCallerConfig(config, memoizedProvider);
      if (isUserSupplied && !boundProvider.attributed) {
        const isCredentialObject = typeof inputCredentials === "object" && inputCredentials !== null;
        resolvedCredentials = async (options) => {
          const creds = await boundProvider(options);
          const attributedCreds = creds;
          if (isCredentialObject && (!attributedCreds.$source || Object.keys(attributedCreds.$source).length === 0)) {
            return setCredentialFeature(attributedCreds, "CREDENTIALS_CODE", "e");
          }
          return attributedCreds;
        };
        resolvedCredentials.memoized = boundProvider.memoized;
        resolvedCredentials.configBound = boundProvider.configBound;
        resolvedCredentials.attributed = true;
      } else {
        resolvedCredentials = boundProvider;
      }
    },
    get() {
      return resolvedCredentials;
    },
    enumerable: true,
    configurable: true
  });
  config.credentials = inputCredentials;
  const { signingEscapePath = true, systemClockOffset = config.systemClockOffset || 0, sha256 } = config;
  let signer;
  if (config.signer) {
    signer = normalizeProvider(config.signer);
  } else if (config.regionInfoProvider) {
    signer = () => normalizeProvider(config.region)().then(async (region) => [
      await config.regionInfoProvider(region, {
        useFipsEndpoint: await config.useFipsEndpoint(),
        useDualstackEndpoint: await config.useDualstackEndpoint()
      }) || {},
      region
    ]).then(([regionInfo, region]) => {
      const { signingRegion, signingService } = regionInfo;
      config.signingRegion = config.signingRegion || signingRegion || region;
      config.signingName = config.signingName || signingService || config.serviceId;
      const params = {
        ...config,
        credentials: config.credentials,
        region: config.signingRegion,
        service: config.signingName,
        sha256,
        uriEscapePath: signingEscapePath
      };
      const SignerCtor = config.signerConstructor || SignatureV4;
      return new SignerCtor(params);
    });
  } else {
    signer = async (authScheme) => {
      authScheme = Object.assign({}, {
        name: "sigv4",
        signingName: config.signingName || config.defaultSigningName,
        signingRegion: await normalizeProvider(config.region)(),
        properties: {}
      }, authScheme);
      const signingRegion = authScheme.signingRegion;
      const signingService = authScheme.signingName;
      config.signingRegion = config.signingRegion || signingRegion;
      config.signingName = config.signingName || signingService || config.serviceId;
      const params = {
        ...config,
        credentials: config.credentials,
        region: config.signingRegion,
        service: config.signingName,
        sha256,
        uriEscapePath: signingEscapePath
      };
      const SignerCtor = config.signerConstructor || SignatureV4;
      return new SignerCtor(params);
    };
  }
  const resolvedConfig = Object.assign(config, {
    systemClockOffset,
    signingEscapePath,
    signer,
    disableClockSkewCorrection: normalizeProvider(config.disableClockSkewCorrection ?? defaultDisableClockSkewCorrection)
  });
  return resolvedConfig;
};
function normalizeCredentialProvider(config, { credentials, credentialDefaultProvider }) {
  let credentialsProvider;
  if (credentials) {
    if (!credentials?.memoized) {
      credentialsProvider = memoizeIdentityProvider(credentials, isIdentityExpired, doesIdentityRequireRefresh);
    } else {
      credentialsProvider = credentials;
    }
  } else {
    if (credentialDefaultProvider) {
      credentialsProvider = normalizeProvider(credentialDefaultProvider(Object.assign({}, config, {
        parentClientConfig: config
      })));
    } else {
      credentialsProvider = async () => {
        throw new Error("@aws-sdk/core::resolveAwsSdkSigV4Config - `credentials` not provided and no credentialDefaultProvider was configured.");
      };
    }
  }
  credentialsProvider.memoized = true;
  return credentialsProvider;
}
function bindCallerConfig(config, credentialsProvider) {
  if (credentialsProvider.configBound) {
    return credentialsProvider;
  }
  const fn = async (options) => credentialsProvider({ ...options, callerClientConfig: config });
  fn.memoized = credentialsProvider.memoized;
  fn.configBound = true;
  return fn;
}
const ENV_DISABLE_CLOCK_SKEW_CORRECTION = "AWS_DISABLE_CLOCK_SKEW_CORRECTION";
const CONFIG_DISABLE_CLOCK_SKEW_CORRECTION = "disable_clock_skew_correction";
const NODE_DISABLE_CLOCK_SKEW_CORRECTION_CONFIG_OPTIONS = {
  environmentVariableSelector: (env2) => booleanSelector(env2, ENV_DISABLE_CLOCK_SKEW_CORRECTION, SelectorType.ENV),
  configFileSelector: (profile) => booleanSelector(profile, CONFIG_DISABLE_CLOCK_SKEW_CORRECTION, SelectorType.CONFIG),
  default: false
};
const DEFAULT_DISABLE_CLOCK_SKEW_CORRECTION = loadConfig(NODE_DISABLE_CLOCK_SKEW_CORRECTION_CONFIG_OPTIONS);
const resolveAwsSdkSigV4Config = bindResolveAwsSdkSigV4Config(DEFAULT_DISABLE_CLOCK_SKEW_CORRECTION);
export {
  AwsRestXmlProtocol as A,
  NODE_APP_ID_CONFIG_OPTIONS as N,
  awsEndpointFunctions as a,
  resolveAwsSdkSigV4AConfig as b,
  AwsSdkSigV4Signer as c,
  AwsSdkSigV4ASigner as d,
  emitWarningIfUnsupportedVersion as e,
  createDefaultUserAgentProvider as f,
  NODE_SIGV4A_CONFIG_OPTIONS as g,
  NODE_AUTH_SCHEME_PREFERENCE_OPTIONS as h,
  getAwsRegionExtensionConfiguration as i,
  resolveAwsRegionExtensionConfiguration as j,
  resolveUserAgentConfig as k,
  getUserAgentPlugin as l,
  getHostHeaderPlugin as m,
  getLoggerPlugin as n,
  getRecursionDetectionPlugin as o,
  resolveHostHeaderConfig as p,
  setCredentialFeature as q,
  resolveAwsSdkSigV4Config as r,
  setFeature as s,
  AwsRestJsonProtocol as t,
  AwsQueryProtocol as u,
  validate as v,
  stsRegionDefaultResolver as w
};
