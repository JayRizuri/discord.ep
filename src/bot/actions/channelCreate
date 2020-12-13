'use strict';

const Action = require('./Action');
const { Events } = require('../../util/constant');

class ChannelCreateAction extends Action {
  handle(data) {
    const bot = this.bot,
      existing = bot.channels.cache.has(data.id),
      channel = bot.channels.add(data);
    if (!existing && channel) bot.emit(Events.CHANNEL_CREATE, channel);
    return { channel };
  }
}

module.exports = ChannelCreateAction;
