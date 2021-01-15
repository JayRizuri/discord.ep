require("setimmediate");
const eventEmitter = require("events"),
  { DefaultClientOptions } = require("../constants"),
  Utils = require("./Utils"),
  Manager = require("../rest/Manager");

class Base extends eventEmitter {
  constructor(options) {
    super();
    if (typeof options === "undefined") options = {};
    this.options = options;
    this._timeouts = new Set();
    this._intervals = new Set();
    this._immediates = new Set();
    this.options = Utils.mergeDefault(DefaultClientOptions, options);
    this.rest = new Manager(this);
  }
  get api() {
    return this.rest.api;
  }
  logout() {
    for (const t of this._timeouts) this.clearTimeout(t);
    for (const i of this._intervals) this.clearInterval(i);
    for (const i of this._immediates) this.clearImmediate(i);
    this._timeouts.clear();
    this._intervals.clear();
    this._immediates.clear();
  }

  setTimeout(fn, delay, ...args) {
    const timeout = setTimeout(() => {
      fn(...args);
      this._timeouts.delete(timeout);
    }, delay);
    this._timeouts.add(timeout);
    return timeout;
  }
  clearTimeout(timeout) {
    clearTimeout(timeout);
    this._timeouts.delete(timeout);
  }

  setInterval(fn, delay, ...args) {
    const interval = setInterval(fn, delay, ...args);
    this._intervals.add(interval);
    return interval;
  }
  clearInterval(interval) {
    clearInterval(interval);
    this._intervals.delete(interval);
  }
  setImmediate(fn, ...args) {
    const immediate = setImmediate(fn, ...args);
    this._immediates.add(immediate);
    return immediate;
  }
  clearImmediate(immediate) {
    clearImmediate(immediate);
    this._immediates.delete(immediate);
  }

  increaseMaxListeners() {
    const maxListeners = this.getMaxListeners();
    if (maxListeners !== 0) this.setMaxListeners(maxListeners + 1);
  }
  decreaseMaxListeners() {
    const maxListeners = this.getMaxListeners();
    if (maxListeners !== 0) this.setMaxListeners(maxListeners - 1);
  }
  json(...props) {
    return Utils.flatten(
      this,
      {
        domain: false
      },
      ...props
    );
  }
}
module.exports = Base;
