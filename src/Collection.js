const BaseCollection = require('@discordjs/collection'),
  Util = require('./client/Utils');

class Collection extends BaseCollection {
  toJSON() {
    return this.map(e => (typeof e.toJSON === 'function' ? e.toJSON() : Util.flatten(e)));
  }
}

module.exports = Collection;
