import process from "node:process";
import { Buffer } from "node:buffer";
import { setImmediate, clearImmediate } from "node:timers";
import { g as getAugmentedNamespace } from "./react.mjs";
import { EventEmitter } from "node:events";
import { Readable } from "node:stream";
if (!("global" in globalThis)) {
  globalThis.global = globalThis;
}
const originalProcess = globalThis["process"];
globalThis.process = originalProcess ? new Proxy(originalProcess, { get(target, prop, receiver) {
  if (Reflect.has(target, prop)) {
    return Reflect.get(target, prop, receiver);
  }
  return Reflect.get(process, prop, receiver);
} }) : process;
if (!globalThis.Buffer) {
  globalThis.Buffer = Buffer;
}
if (!globalThis.setImmediate) {
  globalThis.setImmediate = setImmediate;
}
if (!globalThis.clearImmediate) {
  globalThis.clearImmediate = clearImmediate;
}
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = () => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  };
  return Object.assign(fn, { __unenv__: true });
}
const _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
const _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
const _supportedEntryTypes = [
  "event",
  "mark",
  "measure",
  "resource"
];
class _PerformanceEntry {
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
}
class _PerformanceMark extends _PerformanceEntry {
  entryType = "mark";
}
class _PerformanceMeasure extends _PerformanceEntry {
  entryType = "measure";
}
class _PerformanceResourceTiming extends _PerformanceEntry {
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
}
class _PerformanceObserver {
  __unenv__ = true;
  static supportedEntryTypes = _supportedEntryTypes;
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw /* @__PURE__ */ createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw /* @__PURE__ */ createNotImplementedError("PerformanceObserver.observe");
  }
}
class _PerformanceObserverEntryList {
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
}
class _Performance {
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new _PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new _PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  toJSON() {
    return this;
  }
  addEventListener(type, listener, options) {
    throw /* @__PURE__ */ createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw /* @__PURE__ */ createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw /* @__PURE__ */ createNotImplementedError("Performance.dispatchEvent");
  }
}
const PerformanceEntry = globalThis.PerformanceEntry || _PerformanceEntry;
const PerformanceMark = globalThis.PerformanceMark || _PerformanceMark;
const PerformanceMeasure = globalThis.PerformanceMeasure || _PerformanceMeasure;
const PerformanceResourceTiming = globalThis.PerformanceResourceTiming || _PerformanceResourceTiming;
const PerformanceObserver = globalThis.PerformanceObserver || _PerformanceObserver;
const Performance = globalThis.Performance || _Performance;
const PerformanceObserverEntryList = globalThis.PerformanceObserverEntryList || _PerformanceObserverEntryList;
const performance$1 = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new _Performance();
globalThis.performance ||= performance$1;
globalThis.Performance ||= Performance;
globalThis.PerformanceEntry ||= PerformanceEntry;
globalThis.PerformanceMark ||= PerformanceMark;
globalThis.PerformanceMeasure ||= PerformanceMeasure;
globalThis.PerformanceObserver ||= PerformanceObserver;
globalThis.PerformanceObserverEntryList ||= PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming ||= PerformanceResourceTiming;
const performance = globalThis.performance;
const global = globalThis;
class ReadStream {
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
}
class WriteStream {
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env) {
    return 1;
  }
  hasColors(count, env) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
}
const isatty = function() {
  return false;
};
const tty = {
  ReadStream,
  WriteStream,
  isatty
};
const tty$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ReadStream,
  WriteStream,
  default: tty,
  isatty
}, Symbol.toStringTag, { value: "Module" }));
const require$$0$2 = /* @__PURE__ */ getAugmentedNamespace(tty$1);
const exec = /* @__PURE__ */ notImplemented("child_process.exec");
class BroadcastChannel {
  name = "";
  onmessage = (message) => {
  };
  onmessageerror = (message) => {
  };
  close() {
  }
  postMessage(message) {
  }
  ref() {
    return this;
  }
  unref() {
    return this;
  }
}
class MessagePort extends EventEmitter {
  close() {
  }
  postMessage(value, transferList) {
  }
  ref() {
  }
  unref() {
  }
  start() {
  }
  addEventListener(type, listener) {
    this.on(type, listener);
  }
  removeEventListener(type, listener) {
    this.off(type, listener);
  }
  dispatchEvent(event) {
    return this.emit(event.type, event);
  }
}
class MessageChannel {
  port1 = new MessagePort();
  port2 = new MessagePort();
}
class Worker extends EventEmitter {
  stdin = null;
  stdout = new Readable();
  stderr = new Readable();
  threadId = 0;
  performance = { eventLoopUtilization: () => ({
    idle: 0,
    active: 0,
    utilization: 0
  }) };
  postMessage(_value, _transferList) {
  }
  postMessageToThread(_threadId, _value, _transferList, _timeout) {
    return Promise.resolve();
  }
  ref() {
  }
  unref() {
  }
  terminate() {
    return Promise.resolve(0);
  }
  getHeapSnapshot() {
    return Promise.resolve(new Readable());
  }
}
const _environmentData = /* @__PURE__ */ new Map();
const getEnvironmentData = function getEnvironmentData2(key) {
  return _environmentData.get(key);
};
const setEnvironmentData = function setEnvironmentData2(key, value) {
  _environmentData.set(key, value);
};
const isMainThread = true;
const isMarkedAsUntransferable = () => false;
const markAsUntransferable = function markAsUntransferable2(value) {
};
const markAsUncloneable = () => {
};
const moveMessagePortToContext = () => new MessagePort();
const parentPort = null;
const receiveMessageOnPort = () => void 0;
const SHARE_ENV = /* @__PURE__ */ Symbol.for("nodejs.worker_threads.SHARE_ENV");
const resourceLimits = {};
const threadId = 0;
const workerData = null;
const postMessageToThread = /* @__PURE__ */ notImplemented("worker_threads.postMessageToThread");
const isInternalThread = false;
const worker_threads = {
  BroadcastChannel,
  MessageChannel,
  MessagePort,
  Worker,
  SHARE_ENV,
  getEnvironmentData,
  isMainThread,
  isMarkedAsUntransferable,
  markAsUntransferable,
  markAsUncloneable,
  moveMessagePortToContext,
  parentPort,
  receiveMessageOnPort,
  resourceLimits,
  setEnvironmentData,
  postMessageToThread,
  threadId,
  workerData,
  isInternalThread
};
const worker_threads$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  BroadcastChannel,
  MessageChannel,
  MessagePort,
  SHARE_ENV,
  Worker,
  default: worker_threads,
  getEnvironmentData,
  isInternalThread,
  isMainThread,
  isMarkedAsUntransferable,
  markAsUncloneable,
  markAsUntransferable,
  moveMessagePortToContext,
  parentPort,
  postMessageToThread,
  receiveMessageOnPort,
  resourceLimits,
  setEnvironmentData,
  threadId,
  workerData
}, Symbol.toStringTag, { value: "Module" }));
const require$$0$1 = /* @__PURE__ */ getAugmentedNamespace(worker_threads$1);
const maxInt = 2147483647;
const base = 36;
const tMin = 1;
const tMax = 26;
const skew = 38;
const damp = 700;
const initialBias = 72;
const initialN = 128;
const delimiter = "-";
const regexPunycode = /^xn--/;
const regexNonASCII = /[^\0-\u007F]/;
const regexSeparators = /[.\u3002\uFF0E\uFF61]/g;
const errors = {
  overflow: "Overflow: input needs wider integers to process",
  "not-basic": "Illegal input >= 0x80 (not a basic code point)",
  "invalid-input": "Invalid input"
};
const baseMinusTMin = base - tMin;
const floor = Math.floor;
const stringFromCharCode = String.fromCharCode;
function error(type) {
  throw new RangeError(errors[type]);
}
function map(array, callback) {
  const result = [];
  let length = array.length;
  while (length--) {
    result[length] = callback(array[length]);
  }
  return result;
}
function mapDomain(domain, callback) {
  const parts = domain.split("@");
  let result = "";
  if (parts.length > 1) {
    result = parts[0] + "@";
    domain = parts[1];
  }
  domain = domain.replace(regexSeparators, ".");
  const labels = domain.split(".");
  const encoded = map(labels, callback).join(".");
  return result + encoded;
}
function ucs2decode(string) {
  const output = [];
  let counter = 0;
  const length = string.length;
  while (counter < length) {
    const value = string.charCodeAt(counter++);
    if (value >= 55296 && value <= 56319 && counter < length) {
      const extra = string.charCodeAt(counter++);
      if ((extra & 64512) == 56320) {
        output.push(((value & 1023) << 10) + (extra & 1023) + 65536);
      } else {
        output.push(value);
        counter--;
      }
    } else {
      output.push(value);
    }
  }
  return output;
}
const ucs2encode = (codePoints) => String.fromCodePoint(...codePoints);
const basicToDigit = function(codePoint) {
  if (codePoint >= 48 && codePoint < 58) {
    return 26 + (codePoint - 48);
  }
  if (codePoint >= 65 && codePoint < 91) {
    return codePoint - 65;
  }
  if (codePoint >= 97 && codePoint < 123) {
    return codePoint - 97;
  }
  return base;
};
const digitToBasic = function(digit, flag) {
  return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
};
const adapt = function(delta, numPoints, firstTime) {
  let k = 0;
  delta = firstTime ? floor(delta / damp) : delta >> 1;
  delta += floor(delta / numPoints);
  for (; delta > baseMinusTMin * tMax >> 1; k += base) {
    delta = floor(delta / baseMinusTMin);
  }
  return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
};
const decode = function(input) {
  const output = [];
  const inputLength = input.length;
  let i = 0;
  let n = initialN;
  let bias = initialBias;
  let basic = input.lastIndexOf(delimiter);
  if (basic < 0) {
    basic = 0;
  }
  for (let j = 0; j < basic; ++j) {
    if (input.charCodeAt(j) >= 128) {
      error("not-basic");
    }
    output.push(input.charCodeAt(j));
  }
  for (let index = basic > 0 ? basic + 1 : 0; index < inputLength; ) {
    const oldi = i;
    for (let w = 1, k = base; ; k += base) {
      if (index >= inputLength) {
        error("invalid-input");
      }
      const digit = basicToDigit(input.charCodeAt(index++));
      if (digit >= base) {
        error("invalid-input");
      }
      if (digit > floor((maxInt - i) / w)) {
        error("overflow");
      }
      i += digit * w;
      const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
      if (digit < t) {
        break;
      }
      const baseMinusT = base - t;
      if (w > floor(maxInt / baseMinusT)) {
        error("overflow");
      }
      w *= baseMinusT;
    }
    const out = output.length + 1;
    bias = adapt(i - oldi, out, oldi === 0);
    if (floor(i / out) > maxInt - n) {
      error("overflow");
    }
    n += floor(i / out);
    i %= out;
    output.splice(i++, 0, n);
  }
  return String.fromCodePoint(...output);
};
const encode = function(_input) {
  const output = [];
  const input = ucs2decode(_input);
  const inputLength = input.length;
  let n = initialN;
  let delta = 0;
  let bias = initialBias;
  for (const currentValue of input) {
    if (currentValue < 128) {
      output.push(stringFromCharCode(currentValue));
    }
  }
  const basicLength = output.length;
  let handledCPCount = basicLength;
  if (basicLength) {
    output.push(delimiter);
  }
  while (handledCPCount < inputLength) {
    let m = maxInt;
    for (const currentValue of input) {
      if (currentValue >= n && currentValue < m) {
        m = currentValue;
      }
    }
    const handledCPCountPlusOne = handledCPCount + 1;
    if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
      error("overflow");
    }
    delta += (m - n) * handledCPCountPlusOne;
    n = m;
    for (const currentValue of input) {
      if (currentValue < n && ++delta > maxInt) {
        error("overflow");
      }
      if (currentValue === n) {
        let q = delta;
        for (let k = base; ; k += base) {
          const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
          if (q < t) {
            break;
          }
          const qMinusT = q - t;
          const baseMinusT = base - t;
          output.push(stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0)));
          q = floor(qMinusT / baseMinusT);
        }
        output.push(stringFromCharCode(digitToBasic(q, 0)));
        bias = adapt(delta, handledCPCountPlusOne, handledCPCount === basicLength);
        delta = 0;
        ++handledCPCount;
      }
    }
    ++delta;
    ++n;
  }
  return output.join("");
};
const toUnicode = function(input) {
  return mapDomain(input, function(string) {
    return regexPunycode.test(string) ? decode(string.slice(4).toLowerCase()) : string;
  });
};
const toASCII = function(input) {
  return mapDomain(input, function(string) {
    return regexNonASCII.test(string) ? "xn--" + encode(string) : string;
  });
};
const version = "2.3.1";
const ucs2 = {
  decode: ucs2decode,
  encode: ucs2encode
};
const punycode$1 = {
  version,
  ucs2,
  decode,
  encode,
  toASCII,
  toUnicode
};
const punycode = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  decode,
  default: punycode$1,
  encode,
  toASCII,
  toUnicode,
  ucs2,
  version
}, Symbol.toStringTag, { value: "Module" }));
const require$$0 = /* @__PURE__ */ getAugmentedNamespace(punycode);
export {
  require$$0$1 as a,
  require$$0 as b,
  exec as e,
  global as g,
  performance as p,
  require$$0$2 as r
};
