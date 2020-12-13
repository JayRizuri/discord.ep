require('setimmediate');
const EventEmitter = require('events');
const RESTManager = require('../rest/RESTManager');
const { DefaultOptions } = require('../utils/Constants');
const Util = require('../utils/Util');

/**
 * The base class for all clients.
 * @extends {EventEmitter}
 */
class BaseClient extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.timeouts = new Set();
    this.intervals = new Set();
    this.immediates = new Set();
    this.options = Util.mergeDefault(DefaultOptions, options);
    this.rest = new RESTManager(this, options._tokenType);
  }
  get api() {
    return this.rest.api;
  }
  logout() {
    for (const t of this.timeouts) this.clearTimeout(t);
    for (const i of this.intervals) this.clearInterval(i);
    for (const i of this.immediates) this.clearImmediate(i);
    this.timeouts.clear();
    this.intervals.clear();
    this.immediates.clear();
  }
  setTimeout(fn, delay, ...args) {
    const timeout = setTimeout(() => {
      fn(...args);
      this.timeouts.delete(timeout);
    }, delay);
    this.timeouts.add(timeout);
    return timeout;
  }
  clearTimeout(timeout) {
    clearTimeout(timeout);
    this.timeouts.delete(timeout);
  }
  setInterval(fn, delay, ...args) {
    const interval = setInterval(fn, delay, ...args);
    this.intervals.add(interval);
    return interval;
  }

  /**
   * Clears an interval.
   * @param {Timeout} interval Interval to cancel
   */
  clearInterval(interval) {
    clearInterval(interval);
    this.intervals.delete(interval);
  }
  setImmediate(fn, ...args) {
    const immediate = setImmediate(fn, ...args);
    this.immediates.add(immediate);
    return immediate;
  }
  clearImmediate(immediate) {
    clearImmediate(immediate);
    this.immediates.delete(immediate);
  }
  incrementMaxListeners() {
    const maxListeners = this.getMaxListeners();
    if (maxListeners !== 0) this.setMaxListeners(maxListeners + 1);
  }
  decrementMaxListeners() {
    const maxListeners = this.getMaxListeners();
    if (maxListeners !== 0) this.setMaxListeners(maxListeners - 1);
  }

  toJSON(...props) {
    return Util.flatten(this, { domain: false }, ...props);
  }
}

module.exports = BaseClient;
