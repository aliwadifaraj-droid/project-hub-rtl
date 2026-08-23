import { n as normalizeProvider, t as toUint8Array } from "./smithy__core.mjs";
import { Buffer } from "node:buffer";
import { createHash, createHmac } from "node:crypto";
const RequestChecksumCalculation = {
  WHEN_SUPPORTED: "WHEN_SUPPORTED",
  WHEN_REQUIRED: "WHEN_REQUIRED"
};
const DEFAULT_REQUEST_CHECKSUM_CALCULATION = RequestChecksumCalculation.WHEN_SUPPORTED;
const ResponseChecksumValidation = {
  WHEN_SUPPORTED: "WHEN_SUPPORTED",
  WHEN_REQUIRED: "WHEN_REQUIRED"
};
const DEFAULT_RESPONSE_CHECKSUM_VALIDATION = RequestChecksumCalculation.WHEN_SUPPORTED;
var ChecksumAlgorithm;
(function(ChecksumAlgorithm2) {
  ChecksumAlgorithm2["MD5"] = "MD5";
  ChecksumAlgorithm2["CRC32"] = "CRC32";
  ChecksumAlgorithm2["CRC32C"] = "CRC32C";
  ChecksumAlgorithm2["CRC64NVME"] = "CRC64NVME";
  ChecksumAlgorithm2["SHA1"] = "SHA1";
  ChecksumAlgorithm2["SHA256"] = "SHA256";
})(ChecksumAlgorithm || (ChecksumAlgorithm = {}));
var ChecksumLocation;
(function(ChecksumLocation2) {
  ChecksumLocation2["HEADER"] = "header";
  ChecksumLocation2["TRAILER"] = "trailer";
})(ChecksumLocation || (ChecksumLocation = {}));
ChecksumAlgorithm.CRC32;
var SelectorType;
(function(SelectorType2) {
  SelectorType2["ENV"] = "env";
  SelectorType2["CONFIG"] = "shared config entry";
})(SelectorType || (SelectorType = {}));
const stringUnionSelector = (obj, key, union, type) => {
  if (!(key in obj))
    return void 0;
  const value = obj[key].toUpperCase();
  if (!Object.values(union).includes(value)) {
    throw new TypeError(`Cannot load ${type} '${key}'. Expected one of ${Object.values(union)}, got '${obj[key]}'.`);
  }
  return value;
};
const ENV_REQUEST_CHECKSUM_CALCULATION = "AWS_REQUEST_CHECKSUM_CALCULATION";
const CONFIG_REQUEST_CHECKSUM_CALCULATION = "request_checksum_calculation";
const NODE_REQUEST_CHECKSUM_CALCULATION_CONFIG_OPTIONS = {
  environmentVariableSelector: (env) => stringUnionSelector(env, ENV_REQUEST_CHECKSUM_CALCULATION, RequestChecksumCalculation, SelectorType.ENV),
  configFileSelector: (profile) => stringUnionSelector(profile, CONFIG_REQUEST_CHECKSUM_CALCULATION, RequestChecksumCalculation, SelectorType.CONFIG),
  default: DEFAULT_REQUEST_CHECKSUM_CALCULATION
};
const ENV_RESPONSE_CHECKSUM_VALIDATION = "AWS_RESPONSE_CHECKSUM_VALIDATION";
const CONFIG_RESPONSE_CHECKSUM_VALIDATION = "response_checksum_validation";
const NODE_RESPONSE_CHECKSUM_VALIDATION_CONFIG_OPTIONS = {
  environmentVariableSelector: (env) => stringUnionSelector(env, ENV_RESPONSE_CHECKSUM_VALIDATION, ResponseChecksumValidation, SelectorType.ENV),
  configFileSelector: (profile) => stringUnionSelector(profile, CONFIG_RESPONSE_CHECKSUM_VALIDATION, ResponseChecksumValidation, SelectorType.CONFIG),
  default: DEFAULT_RESPONSE_CHECKSUM_VALIDATION
};
const resolveFlexibleChecksumsConfig = (input) => {
  const { requestChecksumCalculation, responseChecksumValidation, requestStreamBufferSize } = input;
  return Object.assign(input, {
    requestChecksumCalculation: normalizeProvider(requestChecksumCalculation ?? DEFAULT_REQUEST_CHECKSUM_CALCULATION),
    responseChecksumValidation: normalizeProvider(responseChecksumValidation ?? DEFAULT_RESPONSE_CHECKSUM_VALIDATION),
    requestStreamBufferSize: Number(requestStreamBufferSize ?? 0),
    checksumAlgorithms: input.checksumAlgorithms ?? {}
  });
};
const BLOCK = 64;
const DIGEST_LENGTH = 20;
const INIT = new Int32Array([1732584193, 4023233417, 2562383102, 271733878, 3285377520]);
const K = new Int32Array([1518500249, 1859775393, 2400959708, 3395469782]);
class Sha1Js {
  digestLength = DIGEST_LENGTH;
  state = Int32Array.from(INIT);
  w;
  buffer = new Uint8Array(BLOCK);
  bufferLength = 0;
  bytesHashed = 0;
  finished = false;
  inner;
  outer;
  constructor(secret) {
    if (secret) {
      const key = Sha1Js.normalizeKey(secret);
      this.inner = new Sha1Js();
      this.outer = new Sha1Js();
      const pad = new Uint8Array(BLOCK * 2);
      for (let i = 0; i < BLOCK; ++i) {
        pad[i] = 54 ^ key[i];
        pad[i + BLOCK] = 92 ^ key[i];
      }
      this.inner.update(pad.subarray(0, BLOCK));
      this.outer.update(pad.subarray(BLOCK));
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
    let pos = 0;
    let { length } = data;
    this.bytesHashed += length;
    if (this.bufferLength > 0) {
      while (length > 0 && this.bufferLength < BLOCK) {
        this.buffer[this.bufferLength++] = data[pos++];
        --length;
      }
      if (this.bufferLength === BLOCK) {
        this.hashBuffer(this.buffer, 0);
        this.bufferLength = 0;
      }
    }
    while (length >= BLOCK) {
      this.hashBuffer(data, pos);
      pos += BLOCK;
      length -= BLOCK;
    }
    while (length > 0) {
      this.buffer[this.bufferLength++] = data[pos++];
      --length;
    }
  }
  async digest() {
    if (this.inner && this.outer) {
      if (this.finished) {
        throw new Error("Attempted to digest an already finished HMAC.");
      }
      this.finished = true;
      const innerDigest = this.inner.digestSync();
      this.outer.update(innerDigest);
      return this.outer.digestSync();
    }
    return this.digestSync();
  }
  reset() {
    this.state = Int32Array.from(INIT);
    this.buffer = new Uint8Array(BLOCK);
    this.bufferLength = 0;
    this.bytesHashed = 0;
  }
  digestSync() {
    const state = this.state.slice();
    const buffer = this.buffer.slice();
    let bufferLength = this.bufferLength;
    const bitsHi = this.bytesHashed / 536870912 | 0;
    const bitsLo = this.bytesHashed << 3;
    buffer[bufferLength++] = 128;
    if (bufferLength > BLOCK - 8) {
      for (let i = bufferLength; i < BLOCK; ++i) {
        buffer[i] = 0;
      }
      this.hashBufferWith(state, buffer, 0);
      bufferLength = 0;
    }
    for (let i = bufferLength; i < BLOCK - 8; ++i) {
      buffer[i] = 0;
    }
    const v = new DataView(buffer.buffer, buffer.byteOffset, BLOCK);
    v.setUint32(BLOCK - 8, bitsHi, false);
    v.setUint32(BLOCK - 4, bitsLo, false);
    this.hashBufferWith(state, buffer, 0);
    const out = new Uint8Array(DIGEST_LENGTH);
    out[0] = state[0] >>> 24 & 255;
    out[1] = state[0] >>> 16 & 255;
    out[2] = state[0] >>> 8 & 255;
    out[3] = state[0] & 255;
    out[4] = state[1] >>> 24 & 255;
    out[5] = state[1] >>> 16 & 255;
    out[6] = state[1] >>> 8 & 255;
    out[7] = state[1] & 255;
    out[8] = state[2] >>> 24 & 255;
    out[9] = state[2] >>> 16 & 255;
    out[10] = state[2] >>> 8 & 255;
    out[11] = state[2] & 255;
    out[12] = state[3] >>> 24 & 255;
    out[13] = state[3] >>> 16 & 255;
    out[14] = state[3] >>> 8 & 255;
    out[15] = state[3] & 255;
    out[16] = state[4] >>> 24 & 255;
    out[17] = state[4] >>> 16 & 255;
    out[18] = state[4] >>> 8 & 255;
    out[19] = state[4] & 255;
    return out;
  }
  static normalizeKey(secret) {
    const key = toUint8Array(secret);
    if (key.byteLength > BLOCK) {
      const h = new Sha1Js();
      h.update(key);
      const digest = h.digestSync();
      const padded2 = new Uint8Array(BLOCK);
      padded2.set(digest);
      return padded2;
    }
    const padded = new Uint8Array(BLOCK);
    padded.set(key);
    return padded;
  }
  hashBuffer(data, offset) {
    this.hashBufferWith(this.state, data, offset);
  }
  hashBufferWith(state, data, offset) {
    const w = this.w ??= new Int32Array(80);
    let s0 = state[0], s1 = state[1], s2 = state[2], s3 = state[3], s4 = state[4];
    for (let t = 0; t < 16; ++t) {
      w[t] = (data[offset + t * 4] & 255) << 24 | (data[offset + t * 4 + 1] & 255) << 16 | (data[offset + t * 4 + 2] & 255) << 8 | data[offset + t * 4 + 3] & 255;
    }
    for (let t = 16; t < 80; ++t) {
      const x = w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16];
      w[t] = x << 1 | x >>> 31;
    }
    for (let t = 0; t < 80; ++t) {
      const r = t < 20 ? 0 : t < 40 ? 1 : t < 60 ? 2 : 3;
      const temp = ((s0 << 5 | s0 >>> 27) + (r === 0 ? s1 & s2 ^ ~s1 & s3 : r === 2 ? s1 & s2 ^ s1 & s3 ^ s2 & s3 : s1 ^ s2 ^ s3) | 0) + (s4 + (K[r] + w[t] | 0) | 0) | 0;
      s4 = s3;
      s3 = s2;
      s2 = s1 << 30 | s1 >>> 2;
      s1 = s0;
      s0 = temp;
    }
    state[0] = state[0] + s0 | 0;
    state[1] = state[1] + s1 | 0;
    state[2] = state[2] + s2 | 0;
    state[3] = state[3] + s3 | 0;
    state[4] = state[4] + s4 | 0;
  }
}
const hasNativeCrypto = (() => {
  try {
    createHash("sha1");
    return true;
  } catch {
    return false;
  }
})();
const Sha1Node = hasNativeCrypto ? buildNativeClass() : Sha1Js;
function buildNativeClass() {
  return class Sha1Node {
    digestLength = 20;
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
      return this.secret ? createHmac("sha1", toBuffer(this.secret)) : createHash("sha1");
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
export {
  NODE_RESPONSE_CHECKSUM_VALIDATION_CONFIG_OPTIONS as N,
  Sha1Node as S,
  NODE_REQUEST_CHECKSUM_CALCULATION_CONFIG_OPTIONS as a,
  resolveFlexibleChecksumsConfig as r
};
