import { J as booleanSelector, S as SelectorType, H as HttpRequest, K as httpSigningMiddlewareOptions, M as getSmithyContext, D as HttpResponse, g as NormalizedSchema } from "./smithy__core.mjs";
import { s as setFeature, v as validate, A as AwsRestXmlProtocol } from "./aws-sdk__core.mjs";
import { Buffer } from "node:buffer";
import { Readable } from "node:stream";
const regionRedirectEndpointMiddleware = (config) => {
  return (next, context) => async (args) => {
    const originalRegion = await config.region();
    const regionProviderRef = config.region;
    let unlock = () => {
    };
    if (context.__s3RegionRedirect) {
      Object.defineProperty(config, "region", {
        writable: false,
        value: async () => {
          return context.__s3RegionRedirect;
        }
      });
      unlock = () => Object.defineProperty(config, "region", {
        writable: true,
        value: regionProviderRef
      });
    }
    try {
      const result = await next(args);
      if (context.__s3RegionRedirect) {
        unlock();
        const region = await config.region();
        if (originalRegion !== region) {
          throw new Error("Region was not restored following S3 region redirect.");
        }
      }
      return result;
    } catch (e) {
      unlock();
      throw e;
    }
  };
};
const regionRedirectEndpointMiddlewareOptions = {
  tags: ["REGION_REDIRECT", "S3"],
  name: "regionRedirectEndpointMiddleware",
  override: true,
  relation: "before",
  toMiddleware: "endpointV2Middleware"
};
function regionRedirectMiddleware(clientConfig) {
  return (next, context) => async (args) => {
    try {
      return await next(args);
    } catch (err) {
      if (clientConfig.followRegionRedirects) {
        const statusCode = err?.$metadata?.httpStatusCode;
        const isHeadBucket = context.commandName === "HeadBucketCommand";
        const bucketRegionHeader = err?.$response?.headers?.["x-amz-bucket-region"];
        if (bucketRegionHeader) {
          if (statusCode === 301 || statusCode === 400 && (err?.name === "IllegalLocationConstraintException" || isHeadBucket)) {
            try {
              const actualRegion = bucketRegionHeader;
              context.logger?.debug(`Redirecting from ${await clientConfig.region()} to ${actualRegion}`);
              context.__s3RegionRedirect = actualRegion;
            } catch (e) {
              throw new Error("Region redirect failed: " + e);
            }
            return next(args);
          }
        }
      }
      throw err;
    }
  };
}
const regionRedirectMiddlewareOptions = {
  step: "initialize",
  tags: ["REGION_REDIRECT", "S3"],
  name: "regionRedirectMiddleware",
  override: true
};
const getRegionRedirectMiddlewarePlugin = (clientConfig) => ({
  applyToStack: (clientStack) => {
    clientStack.add(regionRedirectMiddleware(clientConfig), regionRedirectMiddlewareOptions);
    clientStack.addRelativeTo(regionRedirectEndpointMiddleware(clientConfig), regionRedirectEndpointMiddlewareOptions);
  }
});
class S3ExpressIdentityCache {
  data;
  lastPurgeTime = Date.now();
  static EXPIRED_CREDENTIAL_PURGE_INTERVAL_MS = 3e4;
  constructor(data = {}) {
    this.data = data;
  }
  get(key) {
    const entry = this.data[key];
    if (!entry) {
      return;
    }
    return entry;
  }
  set(key, entry) {
    this.data[key] = entry;
    return entry;
  }
  delete(key) {
    delete this.data[key];
  }
  async purgeExpired() {
    const now = Date.now();
    if (this.lastPurgeTime + S3ExpressIdentityCache.EXPIRED_CREDENTIAL_PURGE_INTERVAL_MS > now) {
      return;
    }
    for (const key in this.data) {
      const entry = this.data[key];
      if (!entry.isRefreshing) {
        const credential = await entry.identity;
        if (credential.expiration) {
          if (credential.expiration.getTime() < now) {
            delete this.data[key];
          }
        }
      }
    }
  }
}
class S3ExpressIdentityCacheEntry {
  _identity;
  isRefreshing;
  accessed;
  constructor(_identity, isRefreshing = false, accessed = Date.now()) {
    this._identity = _identity;
    this.isRefreshing = isRefreshing;
    this.accessed = accessed;
  }
  get identity() {
    this.accessed = Date.now();
    return this._identity;
  }
}
class S3ExpressIdentityProviderImpl {
  createSessionFn;
  cache;
  static REFRESH_WINDOW_MS = 6e4;
  constructor(createSessionFn, cache = new S3ExpressIdentityCache()) {
    this.createSessionFn = createSessionFn;
    this.cache = cache;
  }
  async getS3ExpressIdentity(awsIdentity, identityProperties) {
    const key = identityProperties.Bucket;
    const { cache } = this;
    const entry = cache.get(key);
    if (entry) {
      return entry.identity.then((identity) => {
        const isExpired = (identity.expiration?.getTime() ?? 0) < Date.now();
        if (isExpired) {
          return cache.set(key, new S3ExpressIdentityCacheEntry(this.getIdentity(key))).identity;
        }
        const isExpiringSoon = (identity.expiration?.getTime() ?? 0) < Date.now() + S3ExpressIdentityProviderImpl.REFRESH_WINDOW_MS;
        if (isExpiringSoon && !entry.isRefreshing) {
          entry.isRefreshing = true;
          this.getIdentity(key).then((id) => {
            cache.set(key, new S3ExpressIdentityCacheEntry(Promise.resolve(id)));
          });
        }
        return identity;
      });
    }
    return cache.set(key, new S3ExpressIdentityCacheEntry(this.getIdentity(key))).identity;
  }
  async getIdentity(key) {
    await this.cache.purgeExpired().catch((error) => {
      console.warn("Error while clearing expired entries in S3ExpressIdentityCache: \n" + error);
    });
    const session = await this.createSessionFn(key);
    if (!session.Credentials?.AccessKeyId || !session.Credentials?.SecretAccessKey) {
      throw new Error("s3#createSession response credential missing AccessKeyId or SecretAccessKey.");
    }
    const identity = {
      accessKeyId: session.Credentials.AccessKeyId,
      secretAccessKey: session.Credentials.SecretAccessKey,
      sessionToken: session.Credentials.SessionToken,
      expiration: session.Credentials.Expiration ? new Date(session.Credentials.Expiration) : void 0
    };
    return identity;
  }
}
const resolveS3Config = (input, { session }) => {
  const [s3ClientProvider, CreateSessionCommandCtor] = session;
  const { forcePathStyle, useAccelerateEndpoint, disableMultiregionAccessPoints, followRegionRedirects, s3ExpressIdentityProvider, bucketEndpoint, expectContinueHeader } = input;
  return Object.assign(input, {
    forcePathStyle: forcePathStyle ?? false,
    useAccelerateEndpoint: useAccelerateEndpoint ?? false,
    disableMultiregionAccessPoints: disableMultiregionAccessPoints ?? false,
    followRegionRedirects: followRegionRedirects ?? false,
    s3ExpressIdentityProvider: s3ExpressIdentityProvider ?? new S3ExpressIdentityProviderImpl(async (key) => s3ClientProvider().send(new CreateSessionCommandCtor({
      Bucket: key
    }))),
    bucketEndpoint: bucketEndpoint ?? false,
    expectContinueHeader: expectContinueHeader ?? 2097152
  });
};
const S3_EXPRESS_BUCKET_TYPE = "Directory";
const S3_EXPRESS_BACKEND = "S3Express";
const S3_EXPRESS_AUTH_SCHEME = "sigv4-s3express";
const SESSION_TOKEN_QUERY_PARAM = "X-Amz-S3session-Token";
const SESSION_TOKEN_HEADER = SESSION_TOKEN_QUERY_PARAM.toLowerCase();
const NODE_DISABLE_S3_EXPRESS_SESSION_AUTH_ENV_NAME = "AWS_S3_DISABLE_EXPRESS_SESSION_AUTH";
const NODE_DISABLE_S3_EXPRESS_SESSION_AUTH_INI_NAME = "s3_disable_express_session_auth";
const NODE_DISABLE_S3_EXPRESS_SESSION_AUTH_OPTIONS = {
  environmentVariableSelector: (env) => booleanSelector(env, NODE_DISABLE_S3_EXPRESS_SESSION_AUTH_ENV_NAME, SelectorType.ENV),
  configFileSelector: (profile) => booleanSelector(profile, NODE_DISABLE_S3_EXPRESS_SESSION_AUTH_INI_NAME, SelectorType.CONFIG),
  default: false
};
const s3ExpressMiddleware = (options) => {
  return (next, context) => async (args) => {
    if (context.endpointV2) {
      const endpoint = context.endpointV2;
      const isS3ExpressAuth = endpoint.properties?.authSchemes?.[0]?.name === S3_EXPRESS_AUTH_SCHEME;
      const isS3ExpressBucket = endpoint.properties?.backend === S3_EXPRESS_BACKEND || endpoint.properties?.bucketType === S3_EXPRESS_BUCKET_TYPE;
      if (isS3ExpressBucket) {
        setFeature(context, "S3_EXPRESS_BUCKET", "J");
        context.isS3ExpressBucket = true;
      }
      if (isS3ExpressAuth) {
        const requestBucket = args.input.Bucket;
        if (requestBucket) {
          const s3ExpressIdentity = await options.s3ExpressIdentityProvider.getS3ExpressIdentity(await options.credentials(), {
            Bucket: requestBucket
          });
          context.s3ExpressIdentity = s3ExpressIdentity;
          if (HttpRequest.isInstance(args.request) && s3ExpressIdentity.sessionToken) {
            args.request.headers[SESSION_TOKEN_HEADER] = s3ExpressIdentity.sessionToken;
          }
        }
      }
    }
    return next(args);
  };
};
const s3ExpressMiddlewareOptions = {
  name: "s3ExpressMiddleware",
  step: "build",
  tags: ["S3", "S3_EXPRESS"],
  override: true
};
const getS3ExpressPlugin = (options) => ({
  applyToStack: (clientStack) => {
    clientStack.add(s3ExpressMiddleware(options), s3ExpressMiddlewareOptions);
  }
});
const signS3Express = async (s3ExpressIdentity, signingOptions, request, sigV4MultiRegionSigner) => {
  const signedRequest = await sigV4MultiRegionSigner.signWithCredentials(request, s3ExpressIdentity, {});
  if (signedRequest.headers["X-Amz-Security-Token"] || signedRequest.headers["x-amz-security-token"]) {
    throw new Error("X-Amz-Security-Token must not be set for s3-express requests.");
  }
  return signedRequest;
};
const defaultErrorHandler = (signingProperties) => (error) => {
  throw error;
};
const defaultSuccessHandler = (httpResponse, signingProperties) => {
};
const s3ExpressHttpSigningMiddleware = (config) => (next, context) => async (args) => {
  if (!HttpRequest.isInstance(args.request)) {
    return next(args);
  }
  const smithyContext = getSmithyContext(context);
  const scheme = smithyContext.selectedHttpAuthScheme;
  if (!scheme) {
    throw new Error(`No HttpAuthScheme was selected: unable to sign request`);
  }
  const { httpAuthOption: { signingProperties = {} }, identity, signer } = scheme;
  let request;
  if (context.s3ExpressIdentity) {
    request = await signS3Express(context.s3ExpressIdentity, signingProperties, args.request, await config.signer());
  } else {
    request = await signer.sign(args.request, identity, signingProperties);
  }
  const output = await next({
    ...args,
    request
  }).catch((signer.errorHandler || defaultErrorHandler)(signingProperties));
  (signer.successHandler || defaultSuccessHandler)(output.response, signingProperties);
  return output;
};
const getS3ExpressHttpSigningPlugin = (config) => ({
  applyToStack: (clientStack) => {
    clientStack.addRelativeTo(s3ExpressHttpSigningMiddleware(config), httpSigningMiddlewareOptions);
  }
});
function toStream(bytes) {
  return Readable.from(Buffer.from(bytes));
}
const THROW_IF_EMPTY_BODY = {
  CopyObjectCommand: true,
  UploadPartCopyCommand: true,
  CompleteMultipartUploadCommand: true
};
const throw200ExceptionsMiddleware = (config) => (next, context) => async (args) => {
  const result = await next(args);
  const { response } = result;
  if (!HttpResponse.isInstance(response)) {
    return result;
  }
  const { statusCode, body } = response;
  if (statusCode < 200 || statusCode >= 300) {
    return result;
  }
  const bodyBytes = await collectBody(body, config);
  response.body = toStream(bodyBytes);
  if (bodyBytes.length === 0 && THROW_IF_EMPTY_BODY[context.commandName]) {
    const err = new Error("S3 aborted request");
    err.$metadata = {
      httpStatusCode: 503
    };
    err.name = "InternalError";
    throw err;
  }
  const bodyStringTail = config.utf8Encoder(bodyBytes.subarray(bodyBytes.length - 16));
  if (bodyStringTail && bodyStringTail.endsWith("</Error>")) {
    response.statusCode = 503;
  }
  return result;
};
const collectBody = (streamBody = new Uint8Array(), context) => {
  if (streamBody instanceof Uint8Array) {
    return Promise.resolve(streamBody);
  }
  return context.streamCollector(streamBody) || Promise.resolve(new Uint8Array());
};
const throw200ExceptionsMiddlewareOptions = {
  relation: "after",
  toMiddleware: "deserializerMiddleware",
  tags: ["THROW_200_EXCEPTIONS", "S3"],
  name: "throw200ExceptionsMiddleware",
  override: true
};
const getThrow200ExceptionsPlugin = (config) => ({
  applyToStack: (clientStack) => {
    clientStack.addRelativeTo(throw200ExceptionsMiddleware(config), throw200ExceptionsMiddlewareOptions);
  }
});
function bucketEndpointMiddleware(options) {
  return (next, context) => async (args) => {
    if (options.bucketEndpoint) {
      const endpoint = context.endpointV2;
      if (endpoint) {
        const bucket = args.input.Bucket;
        if (typeof bucket === "string") {
          try {
            const bucketEndpointUrl = new URL(bucket);
            context.endpointV2 = {
              ...endpoint,
              url: bucketEndpointUrl
            };
          } catch (e) {
            const warning = `@aws-sdk/middleware-sdk-s3: bucketEndpoint=true was set but Bucket=${bucket} could not be parsed as URL.`;
            if (context.logger?.constructor?.name === "NoOpLogger") {
              console.warn(warning);
            } else {
              context.logger?.warn?.(warning);
            }
            throw e;
          }
        }
      }
    }
    return next(args);
  };
}
const bucketEndpointMiddlewareOptions = {
  name: "bucketEndpointMiddleware",
  override: true,
  relation: "after",
  toMiddleware: "endpointV2Middleware"
};
function validateBucketNameMiddleware({ bucketEndpoint }) {
  return (next) => async (args) => {
    const { input: { Bucket } } = args;
    if (!bucketEndpoint && typeof Bucket === "string" && !validate(Bucket) && Bucket.indexOf("/") >= 0) {
      const err = new Error(`Bucket name shouldn't contain '/', received '${Bucket}'`);
      err.name = "InvalidBucketName";
      throw err;
    }
    return next({ ...args });
  };
}
const validateBucketNameMiddlewareOptions = {
  step: "initialize",
  tags: ["VALIDATE_BUCKET_NAME"],
  name: "validateBucketNameMiddleware",
  override: true
};
const getValidateBucketNamePlugin = (options) => ({
  applyToStack: (clientStack) => {
    clientStack.add(validateBucketNameMiddleware(options), validateBucketNameMiddlewareOptions);
    clientStack.addRelativeTo(bucketEndpointMiddleware(options), bucketEndpointMiddlewareOptions);
  }
});
class S3RestXmlProtocol extends AwsRestXmlProtocol {
  async serializeRequest(operationSchema, input, context) {
    const request = await super.serializeRequest(operationSchema, input, context);
    const ns = NormalizedSchema.of(operationSchema.input);
    const staticStructureSchema = ns.getSchema();
    let bucketMemberIndex = 0;
    const requiredMemberCount = staticStructureSchema[6] ?? 0;
    if (input && typeof input === "object") {
      for (const [memberName, memberNs] of ns.structIterator()) {
        if (++bucketMemberIndex > requiredMemberCount) {
          break;
        }
        if (memberName === "Bucket") {
          if (!input.Bucket && memberNs.getMergedTraits().httpLabel) {
            throw new Error(`No value provided for input HTTP label: Bucket.`);
          }
          break;
        }
      }
    }
    return request;
  }
}
const NODE_USE_ARN_REGION_ENV_NAME = "AWS_S3_USE_ARN_REGION";
const NODE_USE_ARN_REGION_INI_NAME = "s3_use_arn_region";
const NODE_USE_ARN_REGION_CONFIG_OPTIONS = {
  environmentVariableSelector: (env) => booleanSelector(env, NODE_USE_ARN_REGION_ENV_NAME, SelectorType.ENV),
  configFileSelector: (profile) => booleanSelector(profile, NODE_USE_ARN_REGION_INI_NAME, SelectorType.CONFIG),
  default: void 0
};
function addExpectContinueMiddleware(options) {
  return (next) => async (args) => {
    const { request } = args;
    if (options.expectContinueHeader !== false && HttpRequest.isInstance(request) && request.body && options.runtime === "node" && options.requestHandler?.constructor?.name !== "FetchHttpHandler") {
      let sendHeader = true;
      if (typeof options.expectContinueHeader === "number") {
        try {
          const bodyLength = Number(request.headers?.["content-length"]) ?? options.bodyLengthChecker?.(request.body) ?? Infinity;
          sendHeader = bodyLength >= options.expectContinueHeader;
        } catch (e) {
        }
      } else {
        sendHeader = !!options.expectContinueHeader;
      }
      if (sendHeader) {
        request.headers.Expect = "100-continue";
      }
    }
    return next({
      ...args,
      request
    });
  };
}
const addExpectContinueMiddlewareOptions = {
  step: "build",
  tags: ["SET_EXPECT_HEADER", "EXPECT_HEADER"],
  name: "addExpectContinueMiddleware",
  override: true
};
const getAddExpectContinuePlugin = (options) => ({
  applyToStack: (clientStack) => {
    clientStack.add(addExpectContinueMiddleware(options), addExpectContinueMiddlewareOptions);
  }
});
export {
  NODE_USE_ARN_REGION_CONFIG_OPTIONS as N,
  S3RestXmlProtocol as S,
  NODE_DISABLE_S3_EXPRESS_SESSION_AUTH_OPTIONS as a,
  getValidateBucketNamePlugin as b,
  getAddExpectContinuePlugin as c,
  getRegionRedirectMiddlewarePlugin as d,
  getS3ExpressPlugin as e,
  getS3ExpressHttpSigningPlugin as f,
  getThrow200ExceptionsPlugin as g,
  resolveS3Config as r
};
