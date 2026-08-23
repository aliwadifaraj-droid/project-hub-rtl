import { g as getDefaultExportFromCjs } from "./react.mjs";
var promiseLimit$1;
var hasRequiredPromiseLimit;
function requirePromiseLimit() {
  if (hasRequiredPromiseLimit) return promiseLimit$1;
  hasRequiredPromiseLimit = 1;
  function limiter(count) {
    var outstanding = 0;
    var jobs = [];
    function remove() {
      outstanding--;
      if (outstanding < count) {
        dequeue();
      }
    }
    function dequeue() {
      var job = jobs.shift();
      semaphore.queue = jobs.length;
      if (job) {
        run(job.fn).then(job.resolve).catch(job.reject);
      }
    }
    function queue(fn) {
      return new Promise(function(resolve, reject) {
        jobs.push({ fn, resolve, reject });
        semaphore.queue = jobs.length;
      });
    }
    function run(fn) {
      outstanding++;
      try {
        return Promise.resolve(fn()).then(function(result) {
          remove();
          return result;
        }, function(error) {
          remove();
          throw error;
        });
      } catch (err) {
        remove();
        return Promise.reject(err);
      }
    }
    var semaphore = function(fn) {
      if (outstanding >= count) {
        return queue(fn);
      } else {
        return run(fn);
      }
    };
    return semaphore;
  }
  function map(items, mapper) {
    var failed = false;
    var limit = this;
    return Promise.all(items.map(function() {
      var args = arguments;
      return limit(function() {
        if (!failed) {
          return mapper.apply(void 0, args).catch(function(e) {
            failed = true;
            throw e;
          });
        }
      });
    }));
  }
  function addExtras(fn) {
    fn.queue = 0;
    fn.map = map;
    return fn;
  }
  promiseLimit$1 = function(count) {
    if (count) {
      return addExtras(limiter(count));
    } else {
      return addExtras(function(fn) {
        return fn();
      });
    }
  };
  return promiseLimit$1;
}
var promiseLimitExports = requirePromiseLimit();
const promiseLimit = /* @__PURE__ */ getDefaultExportFromCjs(promiseLimitExports);
export {
  promiseLimit as p
};
