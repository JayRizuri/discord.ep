'use strict';

const Base = require('./base'),
  ActionsManager = require('./actions/ActionsManager'),
  BotVoiceManager = require('./voice/BotVoiceManager'),
  WebSocketManager = require('./websocket/WebSocketManager'),
  { Error, TypeError, RangeError } = require('../errors'),
  BaseGuildEmojiManager = require('../managers/BaseGuildEmojiManager'),
  ChannelManager = require('../managers/ChannelManager'),
  GuildManager = require('../managers/GuildManager'),
  UserManager = require('../managers/UserManager'),
  ShardBotUtil = require('../sharding/ShardBotUtil'),
  ClientApplication = require('../structures/botApplication'),
  GuildPreview = require('../structures/GuildPreview'),
  GuildTemplate = require('../structures/GuildTemplate'),
  Invite = require('../structures/Invite'),
  VoiceRegion = require('../structures/VoiceRegion'),
  Webhook = require('../structures/Webhook'),
  Collection = require('../utils/Collection'), // imma just yoink collections from discord.js because they are super usefull
  { Events, browser, DefaultOptions } = require('../util/constant'),
  DataResolver = require('../utils/DataResolver'),
  Intents = require('../utils/Intents'),
  Permissions = require('../utils/Perms'),
  Structures = require('../utils/Structures');

class Client extends Base {
  constructor(options = {}) {
    super(Object.assign({ _tokenType: 'Bot' }, options));
    let data = process.env;
    try {
      data = require('worker_threads').workerData || data;
    } catch {
    }

    if (this.options.shards === DefaultOptions.shards && 'SHARDS' in data) {
      this.options.shards = JSON.parse(data.SHARDS);
    }

    if (this.options.shardCount === DefaultOptions.shardCount) {
      if ('SHARD_COUNT' in data) {
        this.options.shardCount = Number(data.SHARD_COUNT);
      } else if (Array.isArray(this.options.shards)) {
        this.options.shardCount = this.options.shards.length;
      }
    }

    const typeofShards = typeof this.options.shards;

    if (typeofShards === 'undefined' && typeof this.options.shardCount === 'number') this.options.shards = Array.from({ length: this.options.shardCount }, (_, i) => i);

    if (typeofShards === 'number') this.options.shards = [this.options.shards];

    if (Array.isArray(this.options.shards)) this.options.shards = [
        ...new Set(
          this.options.shards.filter(item => !isNaN(item) && item >= 0 && item < Infinity && item === (item | 0)),
        ),
      ];

    this._validateOptions();
    this.ws = new WebSocketManager(this);
    this.actions = new ActionsManager(this);
    this.voice = !browser ? new BotVoiceManager(this) : null;
    this.shard =
      !browser && process.env.SHARDING_MANAGER
        ? ShardClientUtil.singleton(this, process.env.SHARDING_MANAGER_MODE)
        : null;
    this.users = new UserManager(this);
    this.guilds = new GuildManager(this);
    this.channels = new ChannelManager(this);

    const BotPresence = Structures.get('BotPresence');
    this.presence = new BotPresence(this, options.presence);

    Object.defineProperty(this, 'token', { writable: true });
    if (!browser && !this.token && 'DISCORD_TOKEN' in process.env) {
      this.token = process.env.DISCORD_TOKEN;
    } else {
      this.token = null;
    }
    
    this.readyAt = null;

    if (this.options.messageSweepInterval > 0) {
      this.setInterval(this.sweepMessages.bind(this), this.options.messageSweepInterval * 1000);
    }
  }
  get emojis() {
    const emojis = new BaseGuildEmojiManager(this);
    for (const guild of this.guilds.cache.values()) {
      if (guild.available) for (const emoji of guild.emojis.cache.values()) emojis.cache.set(emoji.id, emoji);
    }
    return emojis;
  }
  get readyTimestamp() {
    return this.readyAt ? this.readyAt.getTime() : null;
  }
  get uptime() {
    return this.readyAt ? Date.now() - this.readyAt : null;
  }
  async login(token = this.token) {
    if (!token || typeof token !== 'string') throw new Error('TOKEN_INVALID');
    this.token = token = token.replace(/^(Bot|Bearer)\s*/i, '');
    this.emit(
      Events.DEBUG,
      `Provided token: ${token
        .split('.')
        .map((val, i) => (i > 1 ? val.replace(/./g, '*') : val))
        .join('.')}`,
    );

    if (this.options.presence) {
      this.options.ws.presence = await this.presence._parse(this.options.presence);
    }

    this.emit(Events.DEBUG, 'connecting to the gateway...');

    try {
      await this.ws.connect();
      return this.token;
    } catch (error) {
      this.destroy();
      throw error;
    }
  }
  logout() {
    super.logout();
    this.ws.logout();
    this.token = null;
  }
  getInvite(invite) {
    const code = DataResolver.resolveInviteCode(invite);
    return this.api
      .invites(code)
      .get({ query: { with_counts: true } })
      .then(data => new Invite(this, data));
  }
  getGuildTemplate(template) {
    const code = DataResolver.resolveGuildTemplateCode(template);
    return this.api.guilds
      .templates(code)
      .get()
      .then(data => new GuildTemplate(this, data));
  }
  getWebhook(id, token) {
    return this.api
      .webhooks(id, token)
      .get()
      .then(data => new Webhook(this, data));
  }
  getVoiceRegions() {
    return this.api.voice.regions.get().then(res => {
      const regions = new Collection();
      for (const region of res) regions.set(region.id, new VoiceRegion(region));
      return regions;
    });
  }
  sweepMessages(lifetime = this.options.messageCacheLifetime) {
    if (typeof lifetime !== 'number' || isNaN(lifetime)) {
      throw new TypeError('INVALID_TYPE', 'lifetime', 'number');
    }
    if (lifetime <= 0) {
      this.emit(Events.DEBUG, "Didn't sweep messages - lifetime is unlimited");
      return -1;
    }

    const lifetimeMs = lifetime * 1000,
      now = Date.now();
    let channels = 0,
      messages = 0;

    for (const channel of this.channels.cache.values()) {
      if (!channel.messages) continue;
      channels++;

      messages += channel.messages.cache.sweep(
        message => now - (message.editedTimestamp || message.createdTimestamp) > lifetimeMs,
      );
    }

    this.emit(
      Events.DEBUG,
      `Swept ${messages} messages older than ${lifetime} seconds in ${channels} text-based channels`,
    );
    return messages;
  }
  getApplication() {
    return this.api.oauth2
      .applications('@me')
      .get()
      .then(app => new BotApplication(this, app));
  }
  getGuildPreview(guild) {
    const id = this.guilds.resolveID(guild);
    if (!id) throw new TypeError('INVALID_TYPE', 'guild', 'GuildResolvable');
    return this.api
      .guilds(id)
      .preview.get()
      .then(data => new GuildPreview(this, data));
  }
  async createInvite(options = {}) {
    if (typeof options !== 'object') throw new TypeError('INVALID_TYPE', 'options', 'object', true);
    const application = await this.fetchApplication();
    const query = new URLSearchParams({
      client_id: application.id,
      scope: 'bot',
    });
    if (options.permissions) {
      const permissions = Permissions.resolve(options.permissions);
      if (permissions) query.set('permissions', permissions);
    }
    if (options.disableGuildSelect) query.set('disable_guild_select', true);
    if (options.guild) {
      const guildID = this.guilds.resolveID(options.guild);
      if (!guildID) throw new TypeError('INVALID_TYPE', 'options.guild', 'GuildResolvable');
      query.set('guild_id', guildID);
    }

    return `${this.options.http.api}${this.api.oauth2.authorize}?${query}`;
  }

  toJSON() {
    return super.toJSON({
      readyAt: false,
    });
  }
  evaluate(script) {
    return eval(script);
  }
  validateOptions(options = this.options) {
    if (typeof options.ws.intents !== 'undefined') options.ws.intents = Intents.resolve(options.ws.intents);
    if (typeof options.shardCount !== 'number' || isNaN(options.shardCount) || options.shardCount < 1) throw new TypeError('BOT_INVALID_OPTION', 'shardCount', 'a number greater than or equal to 1');
    if (options.shards && !(options.shards === 'auto' || Array.isArray(options.shards))) throw new TypeError('BOT_INVALID_OPTION', 'shards', "'auto', a number or array of numbers");
    if (options.shards && !options.shards.length) throw new RangeError('BOT_INVALID_PROVIDED_SHARDS');
    if (typeof options.messageCacheMaxSize !== 'number' || isNaN(options.messageCacheMaxSize)) throw new TypeError('BOT_INVALID_OPTION', 'messageCacheMaxSize', 'a number');
    if (typeof options.messageCacheLifetime !== 'number' || isNaN(options.messageCacheLifetime)) throw new TypeError('BOT_INVALID_OPTION', 'The messageCacheLifetime', 'a number');
    if (typeof options.messageSweepInterval !== 'number' || isNaN(options.messageSweepInterval)) throw new TypeError('BOT_INVALID_OPTION', 'messageSweepInterval', 'a number');
    if (typeof options.messageEditHistoryMaxSize !== 'number' || isNaN(options.messageEditHistoryMaxSize) || options.messageEditHistoryMaxSize < -1) throw new TypeError('BOT_INVALID_OPTION', 'messageEditHistoryMaxSize', 'a number greater than or equal to -1');
    if (typeof options.fetchAllMembers !== 'boolean') throw new TypeError('BOT_INVALID_OPTION', 'fetchAllMembers', 'a boolean');
    if (typeof options.disableMentions !== 'string') throw new TypeError('BOT_INVALID_OPTION', 'disableMentions', 'a string');
    if (!Array.isArray(options.partials)) throw new TypeError('CLIENT_INVALID_OPTION', 'partials', 'an Array');
    if (typeof options.restWsBridgeTimeout !== 'number' || isNaN(options.restWsBridgeTimeout)) throw new TypeError('BOT_INVALID_OPTION', 'restWsBridgeTimeout', 'a number');
    if (typeof options.restRequestTimeout !== 'number' || isNaN(options.restRequestTimeout)) throw new TypeError('BOT_INVALID_OPTION', 'restRequestTimeout', 'a number');
    if (typeof options.restSweepInterval !== 'number' || isNaN(options.restSweepInterval)) throw new TypeError('BOT_INVALID_OPTION', 'restSweepInterval', 'a number');
    if (typeof options.retryLimit !== 'number' || isNaN(options.retryLimit)) throw new TypeError('BOT_INVALID_OPTION', 'retryLimit', 'a number');
  }
}

module.exports = Client;
