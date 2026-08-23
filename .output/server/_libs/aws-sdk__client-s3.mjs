import { X as BinaryDecisionDiagram, Y as EndpointCache, Z as decideEndpoint, d as customEndpointFunctions, n as normalizeProvider, M as getSmithyContext, _ as resolveParams, $ as makeBuilder, a0 as getEndpointPlugin, a1 as ServiceException, T as TypeRegistry, k as toUtf8, O as fromUtf8, a2 as parseUrl, a3 as Sha256Node, a4 as sdkStreamMixin, a5 as Md5Node, a6 as NoOpLogger, a7 as getAwsChunkedEncodingStream, u as toBase64, m as fromBase64, a8 as emitWarningIfUnsupportedVersion, a9 as resolveDefaultsModeConfig, aa as readableStreamHasher, ab as streamCollector, ac as eventStreamSerdeProvider, ad as calculateBodyLength, l as loadConfig, ae as loadConfigsForDefaultMode, af as NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS, ag as NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS, ah as NODE_RETRY_MODE_CONFIG_OPTIONS, ai as DEFAULT_RETRY_MODE, N as NODE_REGION_CONFIG_FILE_OPTIONS, e as NODE_REGION_CONFIG_OPTIONS, aj as NODE_MAX_ATTEMPT_CONFIG_OPTIONS, ak as getDefaultExtensionConfiguration, al as getHttpHandlerExtensionConfiguration, am as resolveDefaultRuntimeConfig, an as resolveHttpHandlerRuntimeConfig, ao as Client, ap as resolveRetryConfig, aq as resolveRegionConfig, ar as resolveEndpointConfig, as as resolveEventStreamSerdeConfig, at as getSchemaSerdePlugin, au as getRetryPlugin, av as getContentLengthPlugin, aw as getHttpAuthSchemeEndpointRuleSetPlugin, ax as getHttpSigningPlugin, ay as DefaultIdentityProviderConfig } from "./smithy__core.mjs";
import { a as awsEndpointFunctions, r as resolveAwsSdkSigV4Config, b as resolveAwsSdkSigV4AConfig, c as AwsSdkSigV4Signer, d as AwsSdkSigV4ASigner, e as emitWarningIfUnsupportedVersion$1, f as createDefaultUserAgentProvider, N as NODE_APP_ID_CONFIG_OPTIONS, g as NODE_SIGV4A_CONFIG_OPTIONS, h as NODE_AUTH_SCHEME_PREFERENCE_OPTIONS, i as getAwsRegionExtensionConfiguration, j as resolveAwsRegionExtensionConfiguration, k as resolveUserAgentConfig, l as getUserAgentPlugin, m as getHostHeaderPlugin, n as getLoggerPlugin, o as getRecursionDetectionPlugin, p as resolveHostHeaderConfig } from "./aws-sdk__core.mjs";
import { S as SignatureV4MultiRegion } from "./@aws-sdk/signature-v4-multi-region+[...].mjs";
import process from "node:process";

import { S as Sha1Node, N as NODE_RESPONSE_CHECKSUM_VALIDATION_CONFIG_OPTIONS, a as NODE_REQUEST_CHECKSUM_CALCULATION_CONFIG_OPTIONS, r as resolveFlexibleChecksumsConfig } from "./aws-sdk__checksums.mjs";
import { g as getThrow200ExceptionsPlugin, S as S3RestXmlProtocol, N as NODE_USE_ARN_REGION_CONFIG_OPTIONS, a as NODE_DISABLE_S3_EXPRESS_SESSION_AUTH_OPTIONS, r as resolveS3Config, b as getValidateBucketNamePlugin, c as getAddExpectContinuePlugin, d as getRegionRedirectMiddlewarePlugin, e as getS3ExpressPlugin, f as getS3ExpressHttpSigningPlugin } from "./aws-sdk__middleware-sdk-s3.mjs";
import { d as defaultProvider } from "./@aws-sdk/credential-provider-node+[...].mjs";
import { N as NodeHttpHandler } from "./smithy__node-http-handler.mjs";
const aw = "ref", ax = "argv", ay = "backend", az = "authSchemes", aA = "disableDoubleEncoding", aB = "signingName", aC = "signingRegion", aD = "signingRegionSet";
const a = -1, b = true, c = false, d = "isSet", e = "booleanEquals", f = "stringEquals", g = "coalesce", h = "substring", i = "", j = "aws.partition", k = "partitionResult", l = "accessPointSuffix", m = "regionPrefix", n = (n2) => "outpostId_ssa_" + n2 + i, o = "hardwareType", p = "ite", q = "isValidHostLabel", s = "sigv4", t = "aws.isVirtualHostableS3Bucket", u = "url", v = "getAttr", w = "bucketArn", x = "--", y = "arnType", z = "accesspoint", A = (n2) => "accessPointName_ssa_" + n2 + i, B = "s3-object-lambda", C = "s3-outposts", D = "bucketPartition", E = "us-east-1", F = "outpostType", G = "name", H = "s3", I = "{url#scheme}://{Bucket}.{url#authority}{url#path}", J = "{url#scheme}://{url#authority}{url#path}", K = "{url#scheme}://{url#authority}{url#normalizedPath}{Bucket}", L = "https://{Bucket}.s3-accelerate.{partitionResult#dnsSuffix}", M = "https://{Bucket}.s3.{partitionResult#dnsSuffix}", N = (n2) => "{url#scheme}://{accessPointName_ssa_" + n2 + "}-{bucketArn#accountId}.{url#authority}{url#path}", O = (n2) => "Invalid ARN: The access point name may only contain a-z, A-Z, 0-9 and `-`. Found: `{accessPointName_ssa_" + n2 + "}`", P = "sigv4a", Q = "{url#scheme}://{url#authority}{url#normalizedPath}{uri_encoded_bucket}", R = "https://s3.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", S = "https://s3.{partitionResult#dnsSuffix}", T = { [aw]: "UseFIPS" }, U = { [aw]: "UseDualStack" }, V = { [aw]: "Bucket" }, W = { "fn": v, [ax]: [{ [aw]: k }, G] }, X = { [aw]: u }, Y = { [aw]: "Region" }, Z = { [aw]: w }, aa = { [aw]: y }, ab = { [aw]: "accessPointName_ssa_1" }, ac = { "fn": v, [ax]: [Z, "region"] }, ad = { [aw]: o }, ae = { "fn": v, [ax]: [Z, "service"] }, af = { "fn": v, [ax]: [Z, "accountId"] }, ag = { [ay]: "S3Express", [az]: [{ [aA]: true, [G]: "{_s3e_auth}", [aB]: "s3express", [aC]: "{Region}" }] }, ah = { [ay]: "S3Express", [az]: [{ [aA]: true, [G]: s, [aB]: "s3express", [aC]: "{Region}" }] }, ai = { [az]: [{ [aA]: true, [G]: P, [aB]: C, [aD]: ["*"] }, { [aA]: true, [G]: s, [aB]: C, [aC]: "{Region}" }] }, aj = { [az]: [{ [aA]: true, [G]: s, [aB]: H, [aC]: E }] }, ak = { [az]: [{ [aA]: true, [G]: s, [aB]: H, [aC]: "{Region}" }] }, al = { [az]: [{ [aA]: true, [G]: s, [aB]: B, [aC]: "{bucketArn#region}" }] }, am = { [az]: [{ [aA]: true, [G]: s, [aB]: H, [aC]: "{bucketArn#region}" }] }, an = { [az]: [{ [aA]: true, [G]: P, [aB]: C, [aD]: ["*"] }, { [aA]: true, [G]: s, [aB]: C, [aC]: "{bucketArn#region}" }] }, ao = { [az]: [{ [aA]: true, [G]: s, [aB]: B, [aC]: "{Region}" }] }, ap = [Y], aq = [{ [aw]: "Endpoint" }], as = [V], at = [V, 0, 7, true], au = [Z, "resourceId[1]"], av = ["*"];
const _data = {
  conditions: [
    [d, ap],
    [e, [{ [aw]: "Accelerate" }, b]],
    [e, [T, b]],
    [e, [U, b]],
    [d, aq],
    [d, as],
    [f, [{ fn: g, [ax]: [{ fn: h, [ax]: [V, 0, 6, b] }, i] }, "--x-s3"]],
    [f, [{ fn: g, [ax]: [{ fn: h, [ax]: at }, i] }, "--xa-s3"]],
    [j, ap, k],
    [h, at, l],
    [f, [{ [aw]: l }, "--op-s3"]],
    [h, [V, 8, 12, b], m],
    [h, [V, 32, 49, b], n(2)],
    [h, [V, 49, 50, b], o],
    [e, [{ [aw]: "ForcePathStyle" }, b]],
    [f, [W, "aws-cn"]],
    [p, [U, ".dualstack", i], "_s3e_ds"],
    [q, [{ [aw]: n(2) }, c]],
    [p, [T, "-fips", i], "_s3e_fips"],
    [p, [{ fn: g, [ax]: [{ [aw]: "DisableS3ExpressSessionAuth" }, c] }, s, "sigv4-s3express"], "_s3e_auth"],
    [t, [V, c]],
    ["parseURL", aq, u],
    [e, [{ fn: g, [ax]: [{ [aw]: "UseS3ExpressControlEndpoint" }, c] }, b]],
    [t, [V, b]],
    [f, [{ fn: v, [ax]: [X, "scheme"] }, "http"]],
    [q, [Y, c]],
    ["aws.parseArn", as, w],
    [v, [{ fn: "split", [ax]: [V, x, 0] }, "[-2]"], "s3expressAvailabilityZoneId"],
    [f, [{ fn: g, [ax]: [{ fn: h, [ax]: [V, 0, 4, c] }, i] }, "arn:"]],
    [f, [{ fn: g, [ax]: [{ fn: h, [ax]: [V, 16, 18, b] }, i] }, x]],
    [e, [{ fn: v, [ax]: [X, "isIp"] }, b]],
    [f, [{ fn: g, [ax]: [{ fn: h, [ax]: [V, 21, 23, b] }, i] }, x]],
    [f, [{ fn: g, [ax]: [{ fn: h, [ax]: [V, 27, 29, b] }, i] }, x]],
    [f, [{ [aw]: m }, "beta"]],
    ["uriEncode", as, "uri_encoded_bucket"],
    [q, [Y, b]],
    [e, [{ fn: g, [ax]: [{ [aw]: "UseObjectLambdaEndpoint" }, c] }, b]],
    [v, [Z, "resourceId[0]"], y],
    [f, [aa, i]],
    [f, [aa, z]],
    [v, au, A(1)],
    [f, [ab, i]],
    [f, [ac, i]],
    [f, [{ fn: g, [ax]: [{ fn: h, [ax]: [V, 14, 16, b] }, i] }, x]],
    [f, [ad, "e"]],
    [f, [ad, "o"]],
    [f, [Y, "aws-global"]],
    [f, [{ fn: g, [ax]: [{ fn: h, [ax]: [V, 19, 21, b] }, i] }, x]],
    [f, [ae, B]],
    [e, [{ fn: g, [ax]: [{ [aw]: "DisableAccessPoints" }, c] }, b]],
    [f, [ae, C]],
    [j, [ac], D],
    [q, [ab, b]],
    [f, [{ fn: g, [ax]: [{ fn: h, [ax]: [V, 26, 28, b] }, i] }, x]],
    [f, [{ fn: g, [ax]: [{ fn: h, [ax]: [V, 15, 17, b] }, i] }, x]],
    [v, [Z, "resourceId[4]"]],
    [f, [{ fn: g, [ax]: [{ fn: h, [ax]: [V, 20, 22, b] }, i] }, x]],
    [e, [{ [aw]: "UseGlobalEndpoint" }, b]],
    [f, [Y, E]],
    [v, au, n(1)],
    [e, [{ fn: g, [ax]: [{ [aw]: "UseArnRegion" }, b] }, b]],
    [q, [{ [aw]: n(1) }, c]],
    [v, [Z, "resourceId[2]"], F],
    [f, [Y, ac]],
    [f, [{ fn: v, [ax]: [{ [aw]: D }, G] }, W]],
    [e, [{ [aw]: "DisableMultiRegionAccessPoints" }, b]],
    [q, [ac, b]],
    [f, [{ fn: v, [ax]: [Z, "partition"] }, W]],
    [f, [af, i]],
    [f, [ae, H]],
    [q, [af, c]],
    [v, [Z, "resourceId[3]"], A(2)],
    [q, [ab, c]],
    [f, [{ [aw]: F }, z]],
    [q, [{ [aw]: A(2) }, c]]
  ],
  results: [
    [a],
    [a, "Accelerate cannot be used with FIPS"],
    [a, "Cannot set dual-stack in combination with a custom endpoint."],
    [a, "A custom endpoint cannot be combined with FIPS"],
    [a, "A custom endpoint cannot be combined with S3 Accelerate"],
    [a, "Partition does not support FIPS"],
    [a, "S3Express does not support S3 Accelerate."],
    ["{url#scheme}://{url#authority}/{uri_encoded_bucket}{url#path}", ag],
    [I, ag],
    [a, "S3Express bucket name is not a valid virtual hostable name."],
    ["https://s3express-control{_s3e_fips}{_s3e_ds}.{Region}.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", ah],
    ["https://{Bucket}.s3express{_s3e_fips}-{s3expressAvailabilityZoneId}{_s3e_ds}.{Region}.{partitionResult#dnsSuffix}", ag],
    [a, "Unrecognized S3Express bucket name format."],
    [J, ag],
    ["https://s3express-control{_s3e_fips}{_s3e_ds}.{Region}.{partitionResult#dnsSuffix}", ah],
    [a, "Expected a endpoint to be specified but no endpoint was found"],
    ["https://{Bucket}.ec2.{url#authority}", ai],
    ["https://{Bucket}.ec2.s3-outposts.{Region}.{partitionResult#dnsSuffix}", ai],
    ["https://{Bucket}.op-{outpostId_ssa_2}.{url#authority}", ai],
    ["https://{Bucket}.op-{outpostId_ssa_2}.s3-outposts.{Region}.{partitionResult#dnsSuffix}", ai],
    [a, 'Unrecognized hardware type: "Expected hardware type o or e but got {hardwareType}"'],
    [a, "Invalid Outposts Bucket alias - it must be a valid bucket name."],
    [a, "Invalid ARN: The outpost Id must only contain a-z, A-Z, 0-9 and `-`."],
    [a, "Custom endpoint `{Endpoint}` was not a valid URI"],
    [a, "S3 Accelerate cannot be used in this region"],
    ["https://{Bucket}.s3-fips.dualstack.us-east-1.{partitionResult#dnsSuffix}", aj],
    ["https://{Bucket}.s3-fips.dualstack.{Region}.{partitionResult#dnsSuffix}", ak],
    ["https://{Bucket}.s3-fips.us-east-1.{partitionResult#dnsSuffix}", aj],
    ["https://{Bucket}.s3-fips.{Region}.{partitionResult#dnsSuffix}", ak],
    ["https://{Bucket}.s3-accelerate.dualstack.us-east-1.{partitionResult#dnsSuffix}", aj],
    ["https://{Bucket}.s3-accelerate.dualstack.{partitionResult#dnsSuffix}", ak],
    ["https://{Bucket}.s3.dualstack.us-east-1.{partitionResult#dnsSuffix}", aj],
    ["https://{Bucket}.s3.dualstack.{Region}.{partitionResult#dnsSuffix}", ak],
    [K, aj],
    [I, aj],
    [K, ak],
    [I, ak],
    [L, aj],
    [L, ak],
    [M, aj],
    [M, ak],
    ["https://{Bucket}.s3.{Region}.{partitionResult#dnsSuffix}", ak],
    [a, "Invalid region: region was not a valid DNS name."],
    [a, "S3 Object Lambda does not support Dual-stack"],
    [a, "S3 Object Lambda does not support S3 Accelerate"],
    [a, "Access points are not supported for this operation"],
    [a, "Invalid configuration: region from ARN `{bucketArn#region}` does not match client region `{Region}` and UseArnRegion is `false`"],
    [a, "Invalid ARN: Missing account id"],
    [N(1), al],
    ["https://{accessPointName_ssa_1}-{bucketArn#accountId}.s3-object-lambda-fips.{bucketArn#region}.{bucketPartition#dnsSuffix}", al],
    ["https://{accessPointName_ssa_1}-{bucketArn#accountId}.s3-object-lambda.{bucketArn#region}.{bucketPartition#dnsSuffix}", al],
    [a, O(1)],
    [a, "Invalid ARN: The account id may only contain a-z, A-Z, 0-9 and `-`. Found: `{bucketArn#accountId}`"],
    [a, "Invalid region in ARN: `{bucketArn#region}` (invalid DNS name)"],
    [a, "Client was configured for partition `{partitionResult#name}` but ARN (`{Bucket}`) has `{bucketPartition#name}`"],
    [a, "Invalid ARN: The ARN may only contain a single resource component after `accesspoint`."],
    [a, "Invalid ARN: bucket ARN is missing a region"],
    [a, "Invalid ARN: Expected a resource of the format `accesspoint:<accesspoint name>` but no name was provided"],
    [a, "Invalid ARN: Object Lambda ARNs only support `accesspoint` arn types, but found: `{arnType}`"],
    [a, "Access Points do not support S3 Accelerate"],
    ["https://{accessPointName_ssa_1}-{bucketArn#accountId}.s3-accesspoint-fips.dualstack.{bucketArn#region}.{bucketPartition#dnsSuffix}", am],
    ["https://{accessPointName_ssa_1}-{bucketArn#accountId}.s3-accesspoint-fips.{bucketArn#region}.{bucketPartition#dnsSuffix}", am],
    ["https://{accessPointName_ssa_1}-{bucketArn#accountId}.s3-accesspoint.dualstack.{bucketArn#region}.{bucketPartition#dnsSuffix}", am],
    [N(1), am],
    ["https://{accessPointName_ssa_1}-{bucketArn#accountId}.s3-accesspoint.{bucketArn#region}.{bucketPartition#dnsSuffix}", am],
    [a, "Invalid ARN: The ARN was not for the S3 service, found: {bucketArn#service}"],
    [a, "S3 MRAP does not support dual-stack"],
    [a, "S3 MRAP does not support FIPS"],
    [a, "S3 MRAP does not support S3 Accelerate"],
    [a, "Invalid configuration: Multi-Region Access Point ARNs are disabled."],
    ["https://{accessPointName_ssa_1}.accesspoint.s3-global.{partitionResult#dnsSuffix}", { [az]: [{ [aA]: b, name: P, [aB]: H, [aD]: av }] }],
    [a, "Client was configured for partition `{partitionResult#name}` but bucket referred to partition `{bucketArn#partition}`"],
    [a, "Invalid Access Point Name"],
    [a, "S3 Outposts does not support Dual-stack"],
    [a, "S3 Outposts does not support FIPS"],
    [a, "S3 Outposts does not support S3 Accelerate"],
    [a, "Invalid Arn: Outpost Access Point ARN contains sub resources"],
    ["https://{accessPointName_ssa_2}-{bucketArn#accountId}.{outpostId_ssa_1}.{url#authority}", an],
    ["https://{accessPointName_ssa_2}-{bucketArn#accountId}.{outpostId_ssa_1}.s3-outposts.{bucketArn#region}.{bucketPartition#dnsSuffix}", an],
    [a, O(2)],
    [a, "Expected an outpost type `accesspoint`, found {outpostType}"],
    [a, "Invalid ARN: expected an access point name"],
    [a, "Invalid ARN: Expected a 4-component resource"],
    [a, "Invalid ARN: The outpost Id may only contain a-z, A-Z, 0-9 and `-`. Found: `{outpostId_ssa_1}`"],
    [a, "Invalid ARN: The Outpost Id was not set"],
    [a, "Invalid ARN: Unrecognized format: {Bucket} (type: {arnType})"],
    [a, "Invalid ARN: No ARN type specified"],
    [a, "Invalid ARN: `{Bucket}` was not a valid ARN"],
    [a, "Path-style addressing cannot be used with ARN buckets"],
    ["https://s3-fips.dualstack.us-east-1.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", aj],
    ["https://s3-fips.dualstack.{Region}.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", ak],
    ["https://s3-fips.us-east-1.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", aj],
    ["https://s3-fips.{Region}.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", ak],
    ["https://s3.dualstack.us-east-1.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", aj],
    ["https://s3.dualstack.{Region}.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", ak],
    [Q, aj],
    [Q, ak],
    [R, aj],
    [R, ak],
    ["https://s3.{Region}.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", ak],
    [a, "Path-style addressing cannot be used with S3 Accelerate"],
    [J, ao],
    ["https://s3-object-lambda-fips.{Region}.{partitionResult#dnsSuffix}", ao],
    ["https://s3-object-lambda.{Region}.{partitionResult#dnsSuffix}", ao],
    ["https://s3-fips.dualstack.us-east-1.{partitionResult#dnsSuffix}", aj],
    ["https://s3-fips.dualstack.{Region}.{partitionResult#dnsSuffix}", ak],
    ["https://s3-fips.us-east-1.{partitionResult#dnsSuffix}", aj],
    ["https://s3-fips.{Region}.{partitionResult#dnsSuffix}", ak],
    ["https://s3.dualstack.us-east-1.{partitionResult#dnsSuffix}", aj],
    ["https://s3.dualstack.{Region}.{partitionResult#dnsSuffix}", ak],
    [J, aj],
    [J, ak],
    [S, aj],
    [S, ak],
    ["https://s3.{Region}.{partitionResult#dnsSuffix}", ak],
    [a, "A region must be set when sending requests to S3."]
  ]
};
const root = 2;
const r = 1e8;
const nodes = new Int32Array([
  -1,
  1,
  -1,
  0,
  3,
  r + 115,
  1,
  424,
  4,
  2,
  272,
  5,
  3,
  233,
  6,
  4,
  85,
  7,
  5,
  15,
  8,
  8,
  9,
  r + 115,
  16,
  10,
  13,
  18,
  11,
  13,
  19,
  12,
  13,
  22,
  r + 14,
  13,
  35,
  14,
  r + 42,
  36,
  r + 103,
  435,
  6,
  271,
  16,
  7,
  270,
  17,
  8,
  19,
  18,
  14,
  501,
  106,
  9,
  20,
  24,
  10,
  21,
  24,
  11,
  22,
  24,
  12,
  23,
  24,
  13,
  547,
  24,
  14,
  77,
  25,
  20,
  73,
  26,
  26,
  27,
  78,
  37,
  28,
  r + 86,
  38,
  r + 86,
  29,
  39,
  47,
  30,
  48,
  r + 58,
  31,
  50,
  32,
  r + 85,
  51,
  33,
  136,
  55,
  r + 76,
  34,
  59,
  35,
  r + 84,
  60,
  39,
  36,
  61,
  37,
  r + 83,
  62,
  38,
  146,
  63,
  41,
  r + 46,
  61,
  40,
  r + 83,
  62,
  41,
  150,
  64,
  42,
  r + 54,
  66,
  43,
  r + 53,
  70,
  44,
  r + 52,
  71,
  45,
  r + 81,
  73,
  46,
  r + 80,
  74,
  r + 78,
  r + 79,
  40,
  48,
  r + 57,
  41,
  r + 57,
  49,
  42,
  185,
  50,
  48,
  62,
  51,
  49,
  r + 45,
  52,
  51,
  53,
  526,
  60,
  56,
  54,
  62,
  r + 55,
  55,
  63,
  57,
  r + 46,
  62,
  r + 55,
  57,
  64,
  58,
  r + 54,
  66,
  59,
  r + 53,
  69,
  60,
  r + 65,
  70,
  61,
  r + 52,
  72,
  r + 64,
  r + 51,
  49,
  r + 45,
  63,
  51,
  64,
  526,
  60,
  67,
  65,
  62,
  r + 55,
  66,
  63,
  68,
  r + 46,
  62,
  r + 55,
  68,
  64,
  69,
  r + 54,
  66,
  70,
  r + 53,
  68,
  r + 47,
  71,
  70,
  72,
  r + 52,
  72,
  r + 50,
  r + 51,
  25,
  74,
  r + 42,
  46,
  r + 39,
  75,
  57,
  76,
  r + 41,
  58,
  r + 40,
  r + 41,
  26,
  r + 88,
  78,
  28,
  r + 87,
  79,
  34,
  82,
  80,
  35,
  81,
  545,
  36,
  r + 103,
  r + 115,
  46,
  r + 97,
  83,
  57,
  84,
  r + 99,
  58,
  r + 98,
  r + 99,
  5,
  101,
  86,
  8,
  87,
  r + 115,
  16,
  88,
  89,
  18,
  91,
  89,
  19,
  90,
  92,
  21,
  97,
  95,
  19,
  93,
  92,
  21,
  98,
  95,
  21,
  97,
  94,
  22,
  r + 14,
  95,
  35,
  96,
  r + 42,
  36,
  r + 103,
  r + 42,
  22,
  r + 13,
  98,
  35,
  99,
  r + 42,
  36,
  r + 101,
  100,
  46,
  r + 110,
  r + 111,
  6,
  214,
  102,
  7,
  208,
  103,
  8,
  119,
  104,
  14,
  118,
  105,
  21,
  106,
  r + 23,
  26,
  107,
  502,
  37,
  108,
  r + 86,
  38,
  r + 86,
  109,
  39,
  112,
  110,
  48,
  r + 58,
  111,
  50,
  136,
  r + 85,
  40,
  113,
  r + 57,
  41,
  r + 57,
  114,
  42,
  115,
  500,
  48,
  r + 56,
  116,
  52,
  117,
  r + 72,
  65,
  r + 69,
  r + 72,
  21,
  501,
  r + 23,
  9,
  120,
  124,
  10,
  121,
  124,
  11,
  122,
  124,
  12,
  123,
  124,
  13,
  202,
  124,
  14,
  195,
  125,
  20,
  190,
  126,
  21,
  127,
  r + 23,
  23,
  128,
  129,
  24,
  189,
  129,
  26,
  130,
  197,
  37,
  131,
  r + 86,
  38,
  r + 86,
  132,
  39,
  159,
  133,
  48,
  r + 58,
  134,
  50,
  135,
  r + 85,
  51,
  141,
  136,
  55,
  r + 76,
  137,
  59,
  138,
  r + 84,
  60,
  r + 83,
  139,
  61,
  140,
  r + 83,
  63,
  r + 83,
  r + 46,
  55,
  r + 76,
  142,
  59,
  143,
  r + 84,
  60,
  148,
  144,
  61,
  145,
  r + 83,
  62,
  147,
  146,
  63,
  150,
  r + 46,
  63,
  153,
  r + 46,
  61,
  149,
  r + 83,
  62,
  153,
  150,
  64,
  151,
  r + 54,
  66,
  152,
  r + 53,
  70,
  r + 82,
  r + 52,
  64,
  154,
  r + 54,
  66,
  155,
  r + 53,
  70,
  156,
  r + 52,
  71,
  157,
  r + 81,
  73,
  158,
  r + 80,
  74,
  r + 77,
  r + 79,
  40,
  160,
  r + 57,
  41,
  r + 57,
  161,
  42,
  185,
  162,
  48,
  174,
  163,
  49,
  r + 45,
  164,
  51,
  165,
  526,
  60,
  168,
  166,
  62,
  r + 55,
  167,
  63,
  169,
  r + 46,
  62,
  r + 55,
  169,
  64,
  170,
  r + 54,
  66,
  171,
  r + 53,
  69,
  172,
  r + 65,
  70,
  173,
  r + 52,
  72,
  r + 63,
  r + 51,
  49,
  r + 45,
  175,
  51,
  176,
  526,
  60,
  179,
  177,
  62,
  r + 55,
  178,
  63,
  180,
  r + 46,
  62,
  r + 55,
  180,
  64,
  181,
  r + 54,
  66,
  182,
  r + 53,
  68,
  r + 47,
  183,
  70,
  184,
  r + 52,
  72,
  r + 48,
  r + 51,
  48,
  r + 56,
  186,
  52,
  187,
  r + 72,
  65,
  r + 69,
  188,
  67,
  r + 70,
  r + 71,
  25,
  r + 36,
  r + 42,
  21,
  191,
  r + 23,
  25,
  192,
  r + 42,
  30,
  194,
  193,
  46,
  r + 34,
  r + 36,
  46,
  r + 33,
  r + 35,
  21,
  196,
  r + 23,
  26,
  r + 88,
  197,
  28,
  r + 87,
  198,
  34,
  201,
  199,
  35,
  200,
  545,
  36,
  r + 101,
  r + 115,
  46,
  r + 95,
  r + 96,
  17,
  203,
  r + 22,
  20,
  204,
  r + 21,
  21,
  205,
  550,
  33,
  206,
  550,
  44,
  r + 16,
  207,
  45,
  r + 18,
  r + 20,
  8,
  209,
  215,
  16,
  210,
  220,
  18,
  211,
  220,
  19,
  212,
  224,
  20,
  213,
  227,
  21,
  231,
  401,
  8,
  218,
  215,
  19,
  216,
  r + 9,
  20,
  217,
  227,
  21,
  231,
  r + 9,
  16,
  219,
  220,
  18,
  223,
  220,
  19,
  221,
  224,
  20,
  222,
  227,
  21,
  231,
  r + 12,
  19,
  226,
  224,
  20,
  225,
  r + 9,
  21,
  r + 9,
  r + 12,
  20,
  230,
  227,
  21,
  228,
  r + 9,
  30,
  229,
  r + 9,
  34,
  r + 7,
  r + 9,
  21,
  231,
  415,
  30,
  232,
  r + 8,
  34,
  r + 7,
  r + 8,
  4,
  r + 2,
  234,
  5,
  235,
  480,
  6,
  271,
  236,
  7,
  270,
  237,
  8,
  238,
  491,
  9,
  239,
  243,
  10,
  240,
  243,
  11,
  241,
  243,
  12,
  242,
  243,
  13,
  547,
  243,
  14,
  266,
  244,
  20,
  264,
  245,
  26,
  246,
  267,
  37,
  247,
  r + 86,
  38,
  r + 86,
  248,
  39,
  249,
  518,
  40,
  250,
  r + 57,
  41,
  r + 57,
  251,
  42,
  538,
  252,
  48,
  r + 43,
  253,
  49,
  r + 45,
  254,
  51,
  255,
  526,
  60,
  258,
  256,
  62,
  r + 55,
  257,
  63,
  259,
  r + 46,
  62,
  r + 55,
  259,
  64,
  260,
  r + 54,
  66,
  261,
  r + 53,
  69,
  262,
  r + 65,
  70,
  263,
  r + 52,
  72,
  r + 62,
  r + 51,
  25,
  265,
  r + 42,
  46,
  r + 31,
  r + 32,
  26,
  r + 88,
  267,
  28,
  r + 87,
  268,
  34,
  269,
  544,
  46,
  r + 93,
  r + 94,
  8,
  397,
  r + 9,
  8,
  407,
  r + 9,
  3,
  346,
  273,
  4,
  r + 3,
  274,
  5,
  284,
  275,
  8,
  276,
  r + 115,
  15,
  r + 5,
  277,
  16,
  278,
  281,
  18,
  279,
  281,
  19,
  280,
  281,
  22,
  r + 14,
  281,
  35,
  282,
  r + 42,
  36,
  r + 102,
  283,
  46,
  r + 106,
  r + 107,
  6,
  405,
  285,
  7,
  395,
  286,
  8,
  295,
  287,
  14,
  501,
  288,
  26,
  289,
  502,
  37,
  290,
  r + 86,
  38,
  r + 86,
  291,
  39,
  292,
  307,
  40,
  293,
  r + 57,
  41,
  r + 57,
  294,
  42,
  335,
  500,
  9,
  296,
  300,
  10,
  297,
  300,
  11,
  298,
  300,
  12,
  299,
  300,
  13,
  394,
  300,
  14,
  339,
  301,
  15,
  r + 5,
  302,
  20,
  337,
  303,
  26,
  304,
  341,
  37,
  305,
  r + 86,
  38,
  r + 86,
  306,
  39,
  309,
  307,
  48,
  r + 58,
  308,
  50,
  r + 74,
  r + 85,
  40,
  310,
  r + 57,
  41,
  r + 57,
  311,
  42,
  335,
  312,
  48,
  324,
  313,
  49,
  r + 45,
  314,
  51,
  315,
  526,
  60,
  318,
  316,
  62,
  r + 55,
  317,
  63,
  319,
  r + 46,
  62,
  r + 55,
  319,
  64,
  320,
  r + 54,
  66,
  321,
  r + 53,
  69,
  322,
  r + 65,
  70,
  323,
  r + 52,
  72,
  r + 61,
  r + 51,
  49,
  r + 45,
  325,
  51,
  326,
  526,
  60,
  329,
  327,
  62,
  r + 55,
  328,
  63,
  330,
  r + 46,
  62,
  r + 55,
  330,
  64,
  331,
  r + 54,
  66,
  332,
  r + 53,
  68,
  r + 47,
  333,
  70,
  334,
  r + 52,
  72,
  r + 49,
  r + 51,
  48,
  r + 56,
  336,
  52,
  r + 67,
  r + 72,
  25,
  338,
  r + 42,
  46,
  r + 27,
  r + 28,
  15,
  r + 5,
  340,
  26,
  r + 88,
  341,
  28,
  r + 87,
  342,
  34,
  345,
  343,
  35,
  344,
  545,
  36,
  r + 102,
  r + 115,
  46,
  r + 91,
  r + 92,
  4,
  r + 2,
  347,
  5,
  357,
  348,
  8,
  349,
  r + 115,
  15,
  r + 5,
  350,
  16,
  351,
  354,
  18,
  352,
  354,
  19,
  353,
  354,
  22,
  r + 14,
  354,
  35,
  355,
  r + 42,
  36,
  r + 43,
  356,
  46,
  r + 104,
  r + 105,
  6,
  405,
  358,
  7,
  395,
  359,
  8,
  360,
  491,
  9,
  361,
  365,
  10,
  362,
  365,
  11,
  363,
  365,
  12,
  364,
  365,
  13,
  394,
  365,
  14,
  389,
  366,
  15,
  r + 5,
  367,
  20,
  387,
  368,
  26,
  369,
  391,
  37,
  370,
  r + 86,
  38,
  r + 86,
  371,
  39,
  372,
  518,
  40,
  373,
  r + 57,
  41,
  r + 57,
  374,
  42,
  538,
  375,
  48,
  r + 43,
  376,
  49,
  r + 45,
  377,
  51,
  378,
  526,
  60,
  381,
  379,
  62,
  r + 55,
  380,
  63,
  382,
  r + 46,
  62,
  r + 55,
  382,
  64,
  383,
  r + 54,
  66,
  384,
  r + 53,
  69,
  385,
  r + 65,
  70,
  386,
  r + 52,
  72,
  r + 60,
  r + 51,
  25,
  388,
  r + 42,
  46,
  r + 25,
  r + 26,
  15,
  r + 5,
  390,
  26,
  r + 88,
  391,
  28,
  r + 87,
  392,
  34,
  393,
  544,
  46,
  r + 89,
  r + 90,
  15,
  r + 5,
  547,
  8,
  396,
  r + 9,
  15,
  r + 5,
  397,
  16,
  398,
  410,
  18,
  399,
  410,
  19,
  400,
  410,
  20,
  401,
  r + 9,
  27,
  402,
  r + 12,
  29,
  r + 11,
  403,
  31,
  r + 11,
  404,
  32,
  r + 11,
  422,
  8,
  406,
  r + 9,
  15,
  r + 5,
  407,
  16,
  408,
  410,
  18,
  409,
  410,
  19,
  411,
  410,
  20,
  r + 12,
  r + 9,
  20,
  414,
  412,
  22,
  413,
  r + 9,
  34,
  r + 10,
  r + 9,
  22,
  416,
  415,
  27,
  419,
  r + 12,
  27,
  418,
  417,
  34,
  r + 10,
  r + 12,
  34,
  r + 10,
  419,
  43,
  r + 11,
  420,
  47,
  r + 11,
  421,
  53,
  r + 11,
  422,
  54,
  r + 11,
  423,
  56,
  r + 11,
  r + 12,
  2,
  r + 1,
  425,
  3,
  478,
  426,
  4,
  r + 4,
  427,
  5,
  438,
  428,
  8,
  429,
  r + 115,
  16,
  430,
  433,
  18,
  431,
  433,
  19,
  432,
  433,
  22,
  r + 14,
  433,
  35,
  434,
  r + 42,
  36,
  r + 44,
  435,
  46,
  r + 112,
  436,
  57,
  437,
  r + 114,
  58,
  r + 113,
  r + 114,
  6,
  r + 6,
  439,
  7,
  r + 6,
  440,
  8,
  450,
  441,
  14,
  501,
  442,
  26,
  443,
  502,
  37,
  444,
  r + 86,
  38,
  r + 86,
  445,
  39,
  446,
  465,
  40,
  447,
  r + 57,
  41,
  r + 57,
  448,
  42,
  471,
  449,
  48,
  r + 44,
  500,
  9,
  451,
  455,
  10,
  452,
  455,
  11,
  453,
  455,
  12,
  454,
  455,
  13,
  547,
  455,
  14,
  473,
  456,
  15,
  460,
  457,
  20,
  458,
  461,
  25,
  459,
  r + 42,
  46,
  r + 37,
  r + 38,
  20,
  540,
  461,
  26,
  462,
  474,
  37,
  463,
  r + 86,
  38,
  r + 86,
  464,
  39,
  467,
  465,
  48,
  r + 58,
  466,
  50,
  r + 75,
  r + 85,
  40,
  468,
  r + 57,
  41,
  r + 57,
  469,
  42,
  471,
  470,
  48,
  r + 44,
  524,
  48,
  r + 44,
  472,
  52,
  r + 68,
  r + 72,
  26,
  r + 88,
  474,
  28,
  r + 87,
  475,
  34,
  r + 100,
  476,
  35,
  477,
  545,
  36,
  r + 44,
  r + 115,
  4,
  r + 2,
  479,
  5,
  488,
  480,
  8,
  481,
  r + 115,
  16,
  482,
  485,
  18,
  483,
  485,
  19,
  484,
  485,
  22,
  r + 14,
  485,
  35,
  486,
  r + 42,
  36,
  r + 43,
  487,
  46,
  r + 108,
  r + 109,
  6,
  r + 6,
  489,
  7,
  r + 6,
  490,
  8,
  503,
  491,
  14,
  501,
  492,
  26,
  493,
  502,
  37,
  494,
  r + 86,
  38,
  r + 86,
  495,
  39,
  496,
  518,
  40,
  497,
  r + 57,
  41,
  r + 57,
  498,
  42,
  538,
  499,
  48,
  r + 43,
  500,
  49,
  r + 45,
  526,
  26,
  r + 88,
  502,
  28,
  r + 87,
  r + 115,
  9,
  504,
  508,
  10,
  505,
  508,
  11,
  506,
  508,
  12,
  507,
  508,
  13,
  547,
  508,
  14,
  541,
  509,
  15,
  513,
  510,
  20,
  511,
  514,
  25,
  512,
  r + 42,
  46,
  r + 29,
  r + 30,
  20,
  540,
  514,
  26,
  515,
  542,
  37,
  516,
  r + 86,
  38,
  r + 86,
  517,
  39,
  520,
  518,
  48,
  r + 58,
  519,
  50,
  r + 73,
  r + 85,
  40,
  521,
  r + 57,
  41,
  r + 57,
  522,
  42,
  538,
  523,
  48,
  r + 43,
  524,
  49,
  r + 45,
  525,
  51,
  529,
  526,
  60,
  r + 55,
  527,
  62,
  r + 55,
  528,
  63,
  r + 55,
  r + 46,
  60,
  532,
  530,
  62,
  r + 55,
  531,
  63,
  533,
  r + 46,
  62,
  r + 55,
  533,
  64,
  534,
  r + 54,
  66,
  535,
  r + 53,
  69,
  536,
  r + 65,
  70,
  537,
  r + 52,
  72,
  r + 59,
  r + 51,
  48,
  r + 43,
  539,
  52,
  r + 66,
  r + 72,
  25,
  r + 24,
  r + 42,
  26,
  r + 88,
  542,
  28,
  r + 87,
  543,
  34,
  r + 100,
  544,
  35,
  546,
  545,
  36,
  r + 42,
  r + 115,
  36,
  r + 43,
  r + 115,
  17,
  548,
  r + 22,
  20,
  549,
  r + 21,
  33,
  552,
  550,
  44,
  r + 17,
  551,
  45,
  r + 19,
  r + 20,
  44,
  r + 15,
  553,
  45,
  r + 15,
  r + 20
]);
const bdd = BinaryDecisionDiagram.from(nodes, root, _data.conditions, _data.results);
const cache = new EndpointCache({
  size: 50,
  params: [
    "Accelerate",
    "Bucket",
    "DisableAccessPoints",
    "DisableMultiRegionAccessPoints",
    "DisableS3ExpressSessionAuth",
    "Endpoint",
    "ForcePathStyle",
    "Region",
    "UseArnRegion",
    "UseDualStack",
    "UseFIPS",
    "UseGlobalEndpoint",
    "UseObjectLambdaEndpoint",
    "UseS3ExpressControlEndpoint"
  ]
});
const defaultEndpointResolver = (endpointParams, context = {}) => {
  return cache.get(endpointParams, () => decideEndpoint(bdd, {
    endpointParams,
    logger: context.logger
  }));
};
customEndpointFunctions.aws = awsEndpointFunctions;
const createEndpointRuleSetHttpAuthSchemeParametersProvider = (defaultHttpAuthSchemeParametersProvider) => async (config, context, input) => {
  if (!input) {
    throw new Error("Could not find `input` for `defaultEndpointRuleSetHttpAuthSchemeParametersProvider`");
  }
  const defaultParameters = await defaultHttpAuthSchemeParametersProvider(config, context, input);
  const instructionsFn = getSmithyContext(context)?.commandInstance?.constructor?.getEndpointParameterInstructions;
  if (!instructionsFn) {
    throw new Error(`getEndpointParameterInstructions() is not defined on '${context.commandName}'`);
  }
  const endpointParameters = await resolveParams(input, { getEndpointParameterInstructions: instructionsFn }, config);
  return Object.assign(defaultParameters, endpointParameters);
};
const _defaultS3HttpAuthSchemeParametersProvider = async (config, context, input) => {
  return {
    operation: getSmithyContext(context).operation,
    region: await normalizeProvider(config.region)() || (() => {
      throw new Error("expected `region` to be configured for `aws.auth#sigv4`");
    })()
  };
};
const defaultS3HttpAuthSchemeParametersProvider = createEndpointRuleSetHttpAuthSchemeParametersProvider(_defaultS3HttpAuthSchemeParametersProvider);
function createAwsAuthSigv4HttpAuthOption(authParameters) {
  return {
    schemeId: "aws.auth#sigv4",
    signingProperties: {
      name: "s3",
      region: authParameters.region
    },
    propertiesExtractor: (config, context) => ({
      signingProperties: {
        config,
        context
      }
    })
  };
}
function createAwsAuthSigv4aHttpAuthOption(authParameters) {
  return {
    schemeId: "aws.auth#sigv4a",
    signingProperties: {
      name: "s3",
      region: authParameters.region
    },
    propertiesExtractor: (config, context) => ({
      signingProperties: {
        config,
        context
      }
    })
  };
}
const createEndpointRuleSetHttpAuthSchemeProvider = (defaultEndpointResolver2, defaultHttpAuthSchemeResolver, createHttpAuthOptionFunctions) => {
  const endpointRuleSetHttpAuthSchemeProvider = (authParameters) => {
    const endpoint = defaultEndpointResolver2(authParameters);
    const authSchemes = endpoint.properties?.authSchemes;
    if (!authSchemes) {
      return defaultHttpAuthSchemeResolver(authParameters);
    }
    const options = [];
    for (const scheme of authSchemes) {
      const { name: resolvedName, properties = {}, ...rest } = scheme;
      const name = resolvedName.toLowerCase();
      if (resolvedName !== name) {
        console.warn(`HttpAuthScheme has been normalized with lowercasing: '${resolvedName}' to '${name}'`);
      }
      let schemeId;
      if (name === "sigv4a") {
        schemeId = "aws.auth#sigv4a";
        const sigv4Present = authSchemes.find((s2) => {
          const name2 = s2.name.toLowerCase();
          return name2 !== "sigv4a" && name2.startsWith("sigv4");
        });
        if (SignatureV4MultiRegion.sigv4aDependency() === "none" && sigv4Present) {
          continue;
        }
      } else if (name.startsWith("sigv4")) {
        schemeId = "aws.auth#sigv4";
      } else {
        throw new Error(`Unknown HttpAuthScheme found in '@smithy.rules#endpointRuleSet': '${name}'`);
      }
      const createOption = createHttpAuthOptionFunctions[schemeId];
      if (!createOption) {
        throw new Error(`Could not find HttpAuthOption create function for '${schemeId}'`);
      }
      const option = createOption(authParameters);
      option.schemeId = schemeId;
      option.signingProperties = { ...option.signingProperties || {}, ...rest, ...properties };
      options.push(option);
    }
    return options;
  };
  return endpointRuleSetHttpAuthSchemeProvider;
};
const _defaultS3HttpAuthSchemeProvider = (authParameters) => {
  const options = [];
  switch (authParameters.operation) {
    default: {
      options.push(createAwsAuthSigv4HttpAuthOption(authParameters));
      options.push(createAwsAuthSigv4aHttpAuthOption(authParameters));
    }
  }
  return options;
};
const defaultS3HttpAuthSchemeProvider = createEndpointRuleSetHttpAuthSchemeProvider(defaultEndpointResolver, _defaultS3HttpAuthSchemeProvider, {
  "aws.auth#sigv4": createAwsAuthSigv4HttpAuthOption,
  "aws.auth#sigv4a": createAwsAuthSigv4aHttpAuthOption
});
const resolveHttpAuthSchemeConfig = (config) => {
  const config_0 = resolveAwsSdkSigV4Config(config);
  const config_1 = resolveAwsSdkSigV4AConfig(config_0);
  return Object.assign(config_1, {
    authSchemePreference: normalizeProvider(config.authSchemePreference ?? [])
  });
};
const resolveClientEndpointParameters = (options) => {
  return Object.assign(options, {
    useFipsEndpoint: options.useFipsEndpoint ?? false,
    useDualstackEndpoint: options.useDualstackEndpoint ?? false,
    forcePathStyle: options.forcePathStyle ?? false,
    useAccelerateEndpoint: options.useAccelerateEndpoint ?? false,
    useGlobalEndpoint: options.useGlobalEndpoint ?? false,
    disableMultiregionAccessPoints: options.disableMultiregionAccessPoints ?? false,
    defaultSigningName: "s3",
    clientContextParams: options.clientContextParams ?? {}
  });
};
const commonParams = {
  ForcePathStyle: { type: "clientContextParams", name: "forcePathStyle" },
  UseArnRegion: { type: "clientContextParams", name: "useArnRegion" },
  DisableMultiRegionAccessPoints: { type: "clientContextParams", name: "disableMultiregionAccessPoints" },
  Accelerate: { type: "clientContextParams", name: "useAccelerateEndpoint" },
  DisableS3ExpressSessionAuth: { type: "clientContextParams", name: "disableS3ExpressSessionAuth" },
  UseGlobalEndpoint: { type: "builtInParams", name: "useGlobalEndpoint" },
  UseFIPS: { type: "builtInParams", name: "useFipsEndpoint" },
  Endpoint: { type: "builtInParams", name: "endpoint" },
  Region: { type: "builtInParams", name: "region" },
  UseDualStack: { type: "builtInParams", name: "useDualstackEndpoint" }
};
const command = makeBuilder(commonParams, "AmazonS3", "S3Client", getEndpointPlugin);
const _ep4 = {
  DisableS3ExpressSessionAuth: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
};
const _ep8 = {
  Bucket: { type: "contextParams", name: "Bucket" },
  Prefix: { type: "contextParams", name: "Prefix" }
};
const _mw0 = (Command, cs, config, o2) => [
  getThrow200ExceptionsPlugin(config)
];
class S3ServiceException extends ServiceException {
  constructor(options) {
    super(options);
    Object.setPrototypeOf(this, S3ServiceException.prototype);
  }
}
class NoSuchUpload extends S3ServiceException {
  name = "NoSuchUpload";
  $fault = "client";
  constructor(opts) {
    super({
      name: "NoSuchUpload",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, NoSuchUpload.prototype);
  }
}
class AccessDenied extends S3ServiceException {
  name = "AccessDenied";
  $fault = "client";
  constructor(opts) {
    super({
      name: "AccessDenied",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, AccessDenied.prototype);
  }
}
class ObjectNotInActiveTierError extends S3ServiceException {
  name = "ObjectNotInActiveTierError";
  $fault = "client";
  constructor(opts) {
    super({
      name: "ObjectNotInActiveTierError",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, ObjectNotInActiveTierError.prototype);
  }
}
class BucketAlreadyExists extends S3ServiceException {
  name = "BucketAlreadyExists";
  $fault = "client";
  constructor(opts) {
    super({
      name: "BucketAlreadyExists",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, BucketAlreadyExists.prototype);
  }
}
class BucketAlreadyOwnedByYou extends S3ServiceException {
  name = "BucketAlreadyOwnedByYou";
  $fault = "client";
  constructor(opts) {
    super({
      name: "BucketAlreadyOwnedByYou",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, BucketAlreadyOwnedByYou.prototype);
  }
}
class NoSuchBucket extends S3ServiceException {
  name = "NoSuchBucket";
  $fault = "client";
  constructor(opts) {
    super({
      name: "NoSuchBucket",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, NoSuchBucket.prototype);
  }
}
class NoSuchKey extends S3ServiceException {
  name = "NoSuchKey";
  $fault = "client";
  constructor(opts) {
    super({
      name: "NoSuchKey",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, NoSuchKey.prototype);
  }
}
class InvalidObjectState extends S3ServiceException {
  name = "InvalidObjectState";
  $fault = "client";
  StorageClass;
  AccessTier;
  constructor(opts) {
    super({
      name: "InvalidObjectState",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, InvalidObjectState.prototype);
    this.StorageClass = opts.StorageClass;
    this.AccessTier = opts.AccessTier;
  }
}
class NoSuchAnnotation extends S3ServiceException {
  name = "NoSuchAnnotation";
  $fault = "client";
  constructor(opts) {
    super({
      name: "NoSuchAnnotation",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, NoSuchAnnotation.prototype);
  }
}
class NotFound extends S3ServiceException {
  name = "NotFound";
  $fault = "client";
  constructor(opts) {
    super({
      name: "NotFound",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, NotFound.prototype);
  }
}
class InvalidPrefix extends S3ServiceException {
  name = "InvalidPrefix";
  $fault = "client";
  constructor(opts) {
    super({
      name: "InvalidPrefix",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, InvalidPrefix.prototype);
  }
}
class EncryptionTypeMismatch extends S3ServiceException {
  name = "EncryptionTypeMismatch";
  $fault = "client";
  constructor(opts) {
    super({
      name: "EncryptionTypeMismatch",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, EncryptionTypeMismatch.prototype);
  }
}
class InvalidRequest extends S3ServiceException {
  name = "InvalidRequest";
  $fault = "client";
  constructor(opts) {
    super({
      name: "InvalidRequest",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, InvalidRequest.prototype);
  }
}
class InvalidWriteOffset extends S3ServiceException {
  name = "InvalidWriteOffset";
  $fault = "client";
  constructor(opts) {
    super({
      name: "InvalidWriteOffset",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, InvalidWriteOffset.prototype);
  }
}
class TooManyParts extends S3ServiceException {
  name = "TooManyParts";
  $fault = "client";
  constructor(opts) {
    super({
      name: "TooManyParts",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, TooManyParts.prototype);
  }
}
class AnnotationLimitExceeded extends S3ServiceException {
  name = "AnnotationLimitExceeded";
  $fault = "client";
  constructor(opts) {
    super({
      name: "AnnotationLimitExceeded",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, AnnotationLimitExceeded.prototype);
  }
}
class AnnotationNameTooLong extends S3ServiceException {
  name = "AnnotationNameTooLong";
  $fault = "client";
  constructor(opts) {
    super({
      name: "AnnotationNameTooLong",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, AnnotationNameTooLong.prototype);
  }
}
class InvalidAnnotationName extends S3ServiceException {
  name = "InvalidAnnotationName";
  $fault = "client";
  constructor(opts) {
    super({
      name: "InvalidAnnotationName",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, InvalidAnnotationName.prototype);
  }
}
class UnsupportedMediaType extends S3ServiceException {
  name = "UnsupportedMediaType";
  $fault = "client";
  constructor(opts) {
    super({
      name: "UnsupportedMediaType",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, UnsupportedMediaType.prototype);
  }
}
class IdempotencyParameterMismatch extends S3ServiceException {
  name = "IdempotencyParameterMismatch";
  $fault = "client";
  constructor(opts) {
    super({
      name: "IdempotencyParameterMismatch",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, IdempotencyParameterMismatch.prototype);
  }
}
class ObjectAlreadyInActiveTierError extends S3ServiceException {
  name = "ObjectAlreadyInActiveTierError";
  $fault = "client";
  constructor(opts) {
    super({
      name: "ObjectAlreadyInActiveTierError",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, ObjectAlreadyInActiveTierError.prototype);
  }
}
const _AD = "AccessDenied";
const _AKI = "AccessKeyId";
const _ALE = "AnnotationLimitExceeded";
const _ANTL = "AnnotationNameTooLong";
const _AT = "AccessTier";
const _B = "Bucket";
const _BAE = "BucketAlreadyExists";
const _BAOBY = "BucketAlreadyOwnedByYou";
const _BKE = "BucketKeyEnabled";
const _CA = "ChecksumAlgorithm";
const _CP = "CommonPrefix";
const _CPL = "CommonPrefixList";
const _CPom = "CommonPrefixes";
const _CSO = "CreateSessionOutput";
const _CSR = "CreateSessionResult";
const _CSRr = "CreateSessionRequest";
const _CSr = "CreateSession";
const _CT = "ChecksumType";
const _CTon = "ContinuationToken";
const _Con = "Contents";
const _Cr = "Credentials";
const _DN = "DisplayName";
const _Deli = "Delimiter";
const _EBO = "ExpectedBucketOwner";
const _ET = "ETag";
const _ETM = "EncryptionTypeMismatch";
const _ETnc = "EncodingType";
const _Ex = "Expiration";
const _FO = "FetchOwner";
const _IAN = "InvalidAnnotationName";
const _ID = "ID";
const _IOS = "InvalidObjectState";
const _IP = "InvalidPrefix";
const _IPM = "IdempotencyParameterMismatch";
const _IR = "InvalidRequest";
const _IRIP = "IsRestoreInProgress";
const _IT = "IsTruncated";
const _IWO = "InvalidWriteOffset";
const _K = "Key";
const _KC = "KeyCount";
const _LBRi = "ListBucketResult";
const _LM = "LastModified";
const _LOV = "ListObjectsV2";
const _LOVO = "ListObjectsV2Output";
const _LOVR = "ListObjectsV2Request";
const _MK = "MaxKeys";
const _N = "Name";
const _NCT = "NextContinuationToken";
const _NF = "NotFound";
const _NSA = "NoSuchAnnotation";
const _NSB = "NoSuchBucket";
const _NSK = "NoSuchKey";
const _NSU = "NoSuchUpload";
const _O = "Owner";
const _OAIATE = "ObjectAlreadyInActiveTierError";
const _OLb = "ObjectList";
const _ONIATE = "ObjectNotInActiveTierError";
const _OOA = "OptionalObjectAttributes";
const _Obj = "Object";
const _P = "Prefix";
const _RC = "RequestCharged";
const _RED = "RestoreExpiryDate";
const _RP = "RequestPayer";
const _RSe = "RestoreStatus";
const _SA = "StartAfter";
const _SAK = "SecretAccessKey";
const _SC = "StorageClass";
const _SCV = "SessionCredentialValue";
const _SCe = "SessionCredentials";
const _SM = "SessionMode";
const _SSE = "ServerSideEncryption";
const _SSEKMSEC = "SSEKMSEncryptionContext";
const _SSEKMSKI = "SSEKMSKeyId";
const _ST = "SessionToken";
const _Si = "Size";
const _TMP = "TooManyParts";
const _UMT = "UnsupportedMediaType";
const _c = "client";
const _ct = "continuation-token";
const _d = "delimiter";
const _e = "error";
const _et = "encoding-type";
const _fo = "fetch-owner";
const _h = "http";
const _hE = "httpError";
const _hH = "httpHeader";
const _hQ = "httpQuery";
const _mk = "max-keys";
const _p = "prefix";
const _s = "smithy.ts.sdk.synthetic.com.amazonaws.s3";
const _sa = "start-after";
const _xF = "xmlFlattened";
const _xN = "xmlName";
const _xacsm = "x-amz-create-session-mode";
const _xaebo = "x-amz-expected-bucket-owner";
const _xaooa = "x-amz-optional-object-attributes";
const _xarc = "x-amz-request-charged";
const _xarp = "x-amz-request-payer";
const _xasse = "x-amz-server-side-encryption";
const _xasseakki = "x-amz-server-side-encryption-aws-kms-key-id";
const _xassebke = "x-amz-server-side-encryption-bucket-key-enabled";
const _xassec = "x-amz-server-side-encryption-context";
const n0 = "com.amazonaws.s3";
const _s_registry = TypeRegistry.for(_s);
var S3ServiceException$ = [-3, _s, "S3ServiceException", 0, [], []];
_s_registry.registerError(S3ServiceException$, S3ServiceException);
const n0_registry = TypeRegistry.for(n0);
var AccessDenied$ = [
  -3,
  n0,
  _AD,
  { [_e]: _c, [_hE]: 403 },
  [],
  []
];
n0_registry.registerError(AccessDenied$, AccessDenied);
var AnnotationLimitExceeded$ = [
  -3,
  n0,
  _ALE,
  { [_e]: _c, [_hE]: 400 },
  [],
  []
];
n0_registry.registerError(AnnotationLimitExceeded$, AnnotationLimitExceeded);
var AnnotationNameTooLong$ = [
  -3,
  n0,
  _ANTL,
  { [_e]: _c, [_hE]: 400 },
  [],
  []
];
n0_registry.registerError(AnnotationNameTooLong$, AnnotationNameTooLong);
var BucketAlreadyExists$ = [
  -3,
  n0,
  _BAE,
  { [_e]: _c, [_hE]: 409 },
  [],
  []
];
n0_registry.registerError(BucketAlreadyExists$, BucketAlreadyExists);
var BucketAlreadyOwnedByYou$ = [
  -3,
  n0,
  _BAOBY,
  { [_e]: _c, [_hE]: 409 },
  [],
  []
];
n0_registry.registerError(BucketAlreadyOwnedByYou$, BucketAlreadyOwnedByYou);
var EncryptionTypeMismatch$ = [
  -3,
  n0,
  _ETM,
  { [_e]: _c, [_hE]: 400 },
  [],
  []
];
n0_registry.registerError(EncryptionTypeMismatch$, EncryptionTypeMismatch);
var IdempotencyParameterMismatch$ = [
  -3,
  n0,
  _IPM,
  { [_e]: _c, [_hE]: 400 },
  [],
  []
];
n0_registry.registerError(IdempotencyParameterMismatch$, IdempotencyParameterMismatch);
var InvalidAnnotationName$ = [
  -3,
  n0,
  _IAN,
  { [_e]: _c, [_hE]: 400 },
  [],
  []
];
n0_registry.registerError(InvalidAnnotationName$, InvalidAnnotationName);
var InvalidObjectState$ = [
  -3,
  n0,
  _IOS,
  { [_e]: _c, [_hE]: 403 },
  [_SC, _AT],
  [0, 0]
];
n0_registry.registerError(InvalidObjectState$, InvalidObjectState);
var InvalidPrefix$ = [
  -3,
  n0,
  _IP,
  { [_e]: _c, [_hE]: 400 },
  [],
  []
];
n0_registry.registerError(InvalidPrefix$, InvalidPrefix);
var InvalidRequest$ = [
  -3,
  n0,
  _IR,
  { [_e]: _c, [_hE]: 400 },
  [],
  []
];
n0_registry.registerError(InvalidRequest$, InvalidRequest);
var InvalidWriteOffset$ = [
  -3,
  n0,
  _IWO,
  { [_e]: _c, [_hE]: 400 },
  [],
  []
];
n0_registry.registerError(InvalidWriteOffset$, InvalidWriteOffset);
var NoSuchAnnotation$ = [
  -3,
  n0,
  _NSA,
  { [_e]: _c, [_hE]: 404 },
  [],
  []
];
n0_registry.registerError(NoSuchAnnotation$, NoSuchAnnotation);
var NoSuchBucket$ = [
  -3,
  n0,
  _NSB,
  { [_e]: _c, [_hE]: 404 },
  [],
  []
];
n0_registry.registerError(NoSuchBucket$, NoSuchBucket);
var NoSuchKey$ = [
  -3,
  n0,
  _NSK,
  { [_e]: _c, [_hE]: 404 },
  [],
  []
];
n0_registry.registerError(NoSuchKey$, NoSuchKey);
var NoSuchUpload$ = [
  -3,
  n0,
  _NSU,
  { [_e]: _c, [_hE]: 404 },
  [],
  []
];
n0_registry.registerError(NoSuchUpload$, NoSuchUpload);
var NotFound$ = [
  -3,
  n0,
  _NF,
  { [_e]: _c },
  [],
  []
];
n0_registry.registerError(NotFound$, NotFound);
var ObjectAlreadyInActiveTierError$ = [
  -3,
  n0,
  _OAIATE,
  { [_e]: _c, [_hE]: 403 },
  [],
  []
];
n0_registry.registerError(ObjectAlreadyInActiveTierError$, ObjectAlreadyInActiveTierError);
var ObjectNotInActiveTierError$ = [
  -3,
  n0,
  _ONIATE,
  { [_e]: _c, [_hE]: 403 },
  [],
  []
];
n0_registry.registerError(ObjectNotInActiveTierError$, ObjectNotInActiveTierError);
var TooManyParts$ = [
  -3,
  n0,
  _TMP,
  { [_e]: _c, [_hE]: 400 },
  [],
  []
];
n0_registry.registerError(TooManyParts$, TooManyParts);
var UnsupportedMediaType$ = [
  -3,
  n0,
  _UMT,
  { [_e]: _c, [_hE]: 415 },
  [],
  []
];
n0_registry.registerError(UnsupportedMediaType$, UnsupportedMediaType);
const errorTypeRegistries = [
  _s_registry,
  n0_registry
];
var SessionCredentialValue = [0, n0, _SCV, 8, 0];
var SSEKMSEncryptionContext = [0, n0, _SSEKMSEC, 8, 0];
var SSEKMSKeyId = [0, n0, _SSEKMSKI, 8, 0];
var CommonPrefix$ = [
  3,
  n0,
  _CP,
  0,
  [_P],
  [0]
];
var CreateSessionOutput$ = [
  3,
  n0,
  _CSO,
  { [_xN]: _CSR },
  [_Cr, _SSE, _SSEKMSKI, _SSEKMSEC, _BKE],
  [[() => SessionCredentials$, { [_xN]: _Cr }], [0, { [_hH]: _xasse }], [() => SSEKMSKeyId, { [_hH]: _xasseakki }], [() => SSEKMSEncryptionContext, { [_hH]: _xassec }], [2, { [_hH]: _xassebke }]],
  1
];
var CreateSessionRequest$ = [
  3,
  n0,
  _CSRr,
  0,
  [_B, _SM, _SSE, _SSEKMSKI, _SSEKMSEC, _BKE],
  [[0, 1], [0, { [_hH]: _xacsm }], [0, { [_hH]: _xasse }], [() => SSEKMSKeyId, { [_hH]: _xasseakki }], [() => SSEKMSEncryptionContext, { [_hH]: _xassec }], [2, { [_hH]: _xassebke }]],
  1
];
var ListObjectsV2Output$ = [
  3,
  n0,
  _LOVO,
  { [_xN]: _LBRi },
  [_IT, _Con, _N, _P, _Deli, _MK, _CPom, _ETnc, _KC, _CTon, _NCT, _SA, _RC],
  [2, [() => ObjectList, { [_xF]: 1 }], 0, 0, 0, 1, [() => CommonPrefixList, { [_xF]: 1 }], 0, 1, 0, 0, 0, [0, { [_hH]: _xarc }]]
];
var ListObjectsV2Request$ = [
  3,
  n0,
  _LOVR,
  0,
  [_B, _Deli, _ETnc, _MK, _P, _CTon, _FO, _SA, _RP, _EBO, _OOA],
  [[0, 1], [0, { [_hQ]: _d }], [0, { [_hQ]: _et }], [1, { [_hQ]: _mk }], [0, { [_hQ]: _p }], [0, { [_hQ]: _ct }], [2, { [_hQ]: _fo }], [0, { [_hQ]: _sa }], [0, { [_hH]: _xarp }], [0, { [_hH]: _xaebo }], [64 | 0, { [_hH]: _xaooa }]],
  1
];
var _Object$ = [
  3,
  n0,
  _Obj,
  0,
  [_K, _LM, _ET, _CA, _CT, _Si, _SC, _O, _RSe],
  [0, 4, 0, [64 | 0, { [_xF]: 1 }], 0, 1, 0, () => Owner$, () => RestoreStatus$]
];
var Owner$ = [
  3,
  n0,
  _O,
  0,
  [_DN, _ID],
  [0, 0]
];
var RestoreStatus$ = [
  3,
  n0,
  _RSe,
  0,
  [_IRIP, _RED],
  [2, 4]
];
var SessionCredentials$ = [
  3,
  n0,
  _SCe,
  0,
  [_AKI, _SAK, _ST, _Ex],
  [[0, { [_xN]: _AKI }], [() => SessionCredentialValue, { [_xN]: _SAK }], [() => SessionCredentialValue, { [_xN]: _ST }], [4, { [_xN]: _Ex }]],
  4
];
var CommonPrefixList = [
  1,
  n0,
  _CPL,
  0,
  () => CommonPrefix$
];
var ObjectList = [
  1,
  n0,
  _OLb,
  0,
  [
    () => _Object$,
    0
  ]
];
var CreateSession$ = [
  9,
  n0,
  _CSr,
  { [_h]: ["GET", "/?session", 200] },
  () => CreateSessionRequest$,
  () => CreateSessionOutput$
];
var ListObjectsV2$ = [
  9,
  n0,
  _LOV,
  { [_h]: ["GET", "/?list-type=2", 200] },
  () => ListObjectsV2Request$,
  () => ListObjectsV2Output$
];
class CreateSessionCommand extends command(_ep4, _mw0, "CreateSession", CreateSession$) {
}
const version = "3.1111.0";
const packageInfo = {
  version
};
const getRuntimeConfig$1 = (config) => {
  return {
    apiVersion: "2006-03-01",
    base64Decoder: config?.base64Decoder ?? fromBase64,
    base64Encoder: config?.base64Encoder ?? toBase64,
    disableHostPrefix: config?.disableHostPrefix ?? false,
    endpointProvider: config?.endpointProvider ?? defaultEndpointResolver,
    extensions: config?.extensions ?? [],
    getAwsChunkedEncodingStream: config?.getAwsChunkedEncodingStream ?? getAwsChunkedEncodingStream,
    httpAuthSchemeProvider: config?.httpAuthSchemeProvider ?? defaultS3HttpAuthSchemeProvider,
    httpAuthSchemes: config?.httpAuthSchemes ?? [
      {
        schemeId: "aws.auth#sigv4",
        identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4"),
        signer: new AwsSdkSigV4Signer()
      },
      {
        schemeId: "aws.auth#sigv4a",
        identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4a"),
        signer: new AwsSdkSigV4ASigner()
      }
    ],
    logger: config?.logger ?? new NoOpLogger(),
    md5: config?.md5 ?? Md5Node,
    protocol: config?.protocol ?? S3RestXmlProtocol,
    protocolSettings: config?.protocolSettings ?? {
      defaultNamespace: "com.amazonaws.s3",
      errorTypeRegistries,
      xmlNamespace: "http://s3.amazonaws.com/doc/2006-03-01/",
      version: "2006-03-01",
      serviceTarget: "AmazonS3"
    },
    sdkStreamMixin: config?.sdkStreamMixin ?? sdkStreamMixin,
    serviceId: config?.serviceId ?? "S3",
    sha1: config?.sha1 ?? Sha1Node,
    sha256: config?.sha256 ?? Sha256Node,
    signerConstructor: config?.signerConstructor ?? SignatureV4MultiRegion,
    signingEscapePath: config?.signingEscapePath ?? false,
    urlParser: config?.urlParser ?? parseUrl,
    useArnRegion: config?.useArnRegion ?? void 0,
    utf8Decoder: config?.utf8Decoder ?? fromUtf8,
    utf8Encoder: config?.utf8Encoder ?? toUtf8
  };
};
const getRuntimeConfig = (config) => {
  emitWarningIfUnsupportedVersion(process.version);
  const defaultsMode = resolveDefaultsModeConfig(config);
  const defaultConfigProvider = () => defaultsMode().then(loadConfigsForDefaultMode);
  const clientSharedValues = getRuntimeConfig$1(config);
  emitWarningIfUnsupportedVersion$1(process.version);
  const loaderConfig = {
    profile: config?.profile,
    logger: clientSharedValues.logger
  };
  return {
    ...clientSharedValues,
    ...config,
    runtime: "node",
    defaultsMode,
    authSchemePreference: config?.authSchemePreference ?? loadConfig(NODE_AUTH_SCHEME_PREFERENCE_OPTIONS, loaderConfig),
    bodyLengthChecker: config?.bodyLengthChecker ?? calculateBodyLength,
    credentialDefaultProvider: config?.credentialDefaultProvider ?? defaultProvider,
    defaultUserAgentProvider: config?.defaultUserAgentProvider ?? createDefaultUserAgentProvider({ serviceId: clientSharedValues.serviceId, clientVersion: packageInfo.version }),
    disableS3ExpressSessionAuth: config?.disableS3ExpressSessionAuth ?? loadConfig(NODE_DISABLE_S3_EXPRESS_SESSION_AUTH_OPTIONS, loaderConfig),
    eventStreamSerdeProvider: config?.eventStreamSerdeProvider ?? eventStreamSerdeProvider,
    maxAttempts: config?.maxAttempts ?? loadConfig(NODE_MAX_ATTEMPT_CONFIG_OPTIONS, config),
    region: config?.region ?? loadConfig(NODE_REGION_CONFIG_OPTIONS, { ...NODE_REGION_CONFIG_FILE_OPTIONS, ...loaderConfig }),
    requestChecksumCalculation: config?.requestChecksumCalculation ?? loadConfig(NODE_REQUEST_CHECKSUM_CALCULATION_CONFIG_OPTIONS, loaderConfig),
    requestHandler: NodeHttpHandler.create(config?.requestHandler ?? defaultConfigProvider),
    responseChecksumValidation: config?.responseChecksumValidation ?? loadConfig(NODE_RESPONSE_CHECKSUM_VALIDATION_CONFIG_OPTIONS, loaderConfig),
    retryMode: config?.retryMode ?? loadConfig({
      ...NODE_RETRY_MODE_CONFIG_OPTIONS,
      default: async () => (await defaultConfigProvider()).retryMode || DEFAULT_RETRY_MODE
    }, config),
    sigv4aSigningRegionSet: config?.sigv4aSigningRegionSet ?? loadConfig(NODE_SIGV4A_CONFIG_OPTIONS, loaderConfig),
    streamCollector: config?.streamCollector ?? streamCollector,
    streamHasher: config?.streamHasher ?? readableStreamHasher,
    useArnRegion: config?.useArnRegion ?? loadConfig(NODE_USE_ARN_REGION_CONFIG_OPTIONS, loaderConfig),
    useDualstackEndpoint: config?.useDualstackEndpoint ?? loadConfig(NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS, loaderConfig),
    useFipsEndpoint: config?.useFipsEndpoint ?? loadConfig(NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS, loaderConfig),
    userAgentAppId: config?.userAgentAppId ?? loadConfig(NODE_APP_ID_CONFIG_OPTIONS, loaderConfig)
  };
};
const getHttpAuthExtensionConfiguration = (runtimeConfig) => {
  const _httpAuthSchemes = runtimeConfig.httpAuthSchemes;
  let _httpAuthSchemeProvider = runtimeConfig.httpAuthSchemeProvider;
  let _credentials = runtimeConfig.credentials;
  return {
    setHttpAuthScheme(httpAuthScheme) {
      const index = _httpAuthSchemes.findIndex((scheme) => scheme.schemeId === httpAuthScheme.schemeId);
      if (index === -1) {
        _httpAuthSchemes.push(httpAuthScheme);
      } else {
        _httpAuthSchemes.splice(index, 1, httpAuthScheme);
      }
    },
    httpAuthSchemes() {
      return _httpAuthSchemes;
    },
    setHttpAuthSchemeProvider(httpAuthSchemeProvider) {
      _httpAuthSchemeProvider = httpAuthSchemeProvider;
    },
    httpAuthSchemeProvider() {
      return _httpAuthSchemeProvider;
    },
    setCredentials(credentials) {
      _credentials = credentials;
    },
    credentials() {
      return _credentials;
    }
  };
};
const resolveHttpAuthRuntimeConfig = (config) => {
  return {
    httpAuthSchemes: config.httpAuthSchemes(),
    httpAuthSchemeProvider: config.httpAuthSchemeProvider(),
    credentials: config.credentials()
  };
};
const resolveRuntimeExtensions = (runtimeConfig, extensions) => {
  const extensionConfiguration = Object.assign(getAwsRegionExtensionConfiguration(runtimeConfig), getDefaultExtensionConfiguration(runtimeConfig), getHttpHandlerExtensionConfiguration(runtimeConfig), getHttpAuthExtensionConfiguration(runtimeConfig));
  extensions.forEach((extension) => extension.configure(extensionConfiguration));
  return Object.assign(runtimeConfig, resolveAwsRegionExtensionConfiguration(extensionConfiguration), resolveDefaultRuntimeConfig(extensionConfiguration), resolveHttpHandlerRuntimeConfig(extensionConfiguration), resolveHttpAuthRuntimeConfig(extensionConfiguration));
};
class S3Client extends Client {
  config;
  constructor(...[configuration]) {
    const _config_0 = getRuntimeConfig(configuration || {});
    super(_config_0);
    this.initConfig = _config_0;
    const _config_1 = resolveClientEndpointParameters(_config_0);
    const _config_2 = resolveUserAgentConfig(_config_1);
    const _config_3 = resolveFlexibleChecksumsConfig(_config_2);
    const _config_4 = resolveRetryConfig(_config_3);
    const _config_5 = resolveRegionConfig(_config_4);
    const _config_6 = resolveHostHeaderConfig(_config_5);
    const _config_7 = resolveEndpointConfig(_config_6);
    const _config_8 = resolveEventStreamSerdeConfig(_config_7);
    const _config_9 = resolveHttpAuthSchemeConfig(_config_8);
    const _config_10 = resolveS3Config(_config_9, { session: [() => this, CreateSessionCommand] });
    const _config_11 = resolveRuntimeExtensions(_config_10, configuration?.extensions || []);
    this.config = _config_11;
    this.middlewareStack.use(getSchemaSerdePlugin(this.config));
    this.middlewareStack.use(getUserAgentPlugin(this.config));
    this.middlewareStack.use(getRetryPlugin(this.config));
    this.middlewareStack.use(getContentLengthPlugin(this.config));
    this.middlewareStack.use(getHostHeaderPlugin(this.config));
    this.middlewareStack.use(getLoggerPlugin(this.config));
    this.middlewareStack.use(getRecursionDetectionPlugin(this.config));
    this.middlewareStack.use(getHttpAuthSchemeEndpointRuleSetPlugin(this.config, {
      httpAuthSchemeParametersProvider: defaultS3HttpAuthSchemeParametersProvider,
      identityProviderConfigProvider: async (config) => new DefaultIdentityProviderConfig({
        "aws.auth#sigv4": config.credentials,
        "aws.auth#sigv4a": config.credentials
      })
    }));
    this.middlewareStack.use(getHttpSigningPlugin(this.config));
    this.middlewareStack.use(getValidateBucketNamePlugin(this.config));
    this.middlewareStack.use(getAddExpectContinuePlugin(this.config));
    this.middlewareStack.use(getRegionRedirectMiddlewarePlugin(this.config));
    this.middlewareStack.use(getS3ExpressPlugin(this.config));
    this.middlewareStack.use(getS3ExpressHttpSigningPlugin(this.config));
  }
  destroy() {
    super.destroy();
  }
}
class ListObjectsV2Command extends command(_ep8, _mw0, "ListObjectsV2", ListObjectsV2$) {
}
export {
  ListObjectsV2Command as L,
  S3Client as S
};
