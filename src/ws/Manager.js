const EventEmitter = require("events"),
  WebSocketShard = require("./Shard"),
  PacketHandlers = require("./handlers"),
  Collection = require("@discord.js/collections"),
  { Events, ShardEvents, Status, WSCodes, WSEvents } = require("../Constants"),
  Utils = require("../client/Utils"),
  BeforeReadyWhitelist = [WSEvents.READY, WSEvents.RESUMED],
  UNRECOVERABLE_CLOSE_CODES = Object.keys(WSCodes).slice(1).map(Number),
  UNRESUMABLE_CLOSE_CODES = [1000, 4006, 4007];

class WebSocketManager extends EventEmitter {
  constructor(client) {
    super();
    Object.defineProperty(this, "client", { value: client });
    this.gateway = null;
    this.totalShards = this.client.options.shards.length;
    this.shards = new Collection();
    Object.defineProperty(this, "packetQueue", { value: [] });
    this.status = Status.IDLE;
    this.destroyed = false;
    this.reconnecting = false;
    this.sessionStartLimit = null;
  }
  get ping() {
    const sum = this.shards.reduce((a, b) => a + b.ping, 0);
    return sum / this.shards.size;
  }
  debug(message, shard) {
    this.client.emit(
      Events.DEBUG,
      `[WS => ${shard ? `Shard ${shard.id}` : "Manager"}] ${message}`
    );
  }
  async connect() {
    const invalidToken = new DJSError(WSCodes[4004]),
      {
        url: gatewayURL,
        shards: recommendedShards,
        session_start_limit: sessionStartLimit
      } = await this.client.api.gateway.bot.get().catch((error) => {
        throw error.httpStatus === 401 ? invalidToken : error;
      });

    this.sessionStartLimit = sessionStartLimit;

    const { total, remaining, reset_after } = sessionStartLimit;
    this.debug(`Fetched Gateway Information
			URL: ${gatewayURL}`);
    this.debug(`Session Information
			Total: ${total}
			Remaining: ${remaining}`);

    this.gateway = `${gatewayURL}/`;

    let { shards } = this.client.options;

    if (shards === "auto") {
      this.debug(`Using recommended shard count(${recommendedShards})`);
      this.totalShards = this.client.options.shardCount = recommendedShards;
      shards = this.client.options.shards = Array.from(
        {
          length: recommendedShards
        },
        (_, i) => i
      );
    }
    this.totalShards = shards.length;
    this.debug(`Spawning shards: ${shards.join(", ")}`);
    this.shardQueue = new Set(shards.map((id) => new WebSocketShard(this, id)));
    await this._handleSessionLimit(remaining, reset_after);
    return this.spawnShards();
  }

  async spawnShards() {
    if (!this.shardQueue.size) return false;

    const [shard] = this.shardQueue;
    this.shardQueue.delete(shard);
    if (!shard.eventsAttached) {
      shard.on(ShardEvents.ALL_READY, (unavailableGuilds) => {
        this.client.emit(Events.SHARD_READY, shard.id, unavailableGuilds);
        if (!this.shardQueue.size) this.reconnecting = false;
        this.checkShardsReady();
      });
      shard.on(ShardEvents.CLOSE, (event) => {
        if (
          event.code === 1000
            ? this.destroyed
            : UNRECOVERABLE_CLOSE_CODES.includes(event.code)
        ) {
          this.client.emit(Events.SHARD_DISCONNECT, event, shard.id);
          this.debug(WSCodes[event.code], shard);
          return;
        }
        if (UNRESUMABLE_CLOSE_CODES.includes(event.code))
          shard.sessionID = null;

        this.client.emit(Events.SHARD_RECONNECTING, shard.id);
        this.shardQueue.add(shard);
        if (shard.sessionID) {
          this.debug(
            `Session ID present, attempting to immediately reconnect...`,
            shard
          );
          this.reconnect(true);
        } else {
          shard.destroy({ reset: true, emit: false, log: false });
          this.reconnect();
        }
      });
      shard.on(ShardEvents.INVALID_SESSION, () => {
        this.client.emit(Events.SHARD_RECONNECTING, shard.id);
      });
      shard.on(ShardEvents.DESTROYED, () => {
        this.debug(
          "Shard was destroyed but there was no WebSocket connection! Reconnecting...",
          shard
        );
        this.client.emit(Events.SHARD_RECONNECTING, shard.id);
        this.shardQueue.add(shard);
        this.reconnect();
      });
      shard.eventsAttached = true;
    }
    this.shards.set(shard.id, shard);
    try {
      await shard.connect();
    } catch (error) {
      if (error && error.code && UNRECOVERABLE_CLOSE_CODES.includes(error.code))
        throw new DJSError(WSCodes[error.code]);
      else if (!error || error.code) {
        this.debug("Failed to connect to the gateway, requeueing...", shard);
        this.shardQueue.add(shard);
      } else {
        throw error;
      }
    }
    if (this.shardQueue.size) {
      this.debug(
        `Shard Queue Size: ${this.shardQueue.size}; continuing in 5 seconds...`
      );
      await Util.delayFor(5000);
      await this._handleSessionLimit();
      return this.createShards();
    }
    return true;
  }

  async reconnect(skipLimit) {
    if (typeof skipLimit == "undefined") skipLimit = false;
    if (this.reconnecting || this.status !== Status.READY) return false;
    this.reconnecting = true;
    try {
      if (!skipLimit) await this._handleSessionLimit();
      await this.createShards();
    } catch (error) {
      this.debug(`Couldn't reconnect to the gateway. ${error}`);
      if (error.httpStatus !== 401) {
        this.debug(`Possible network error occurred. Retrying in 5s...`);
        await Util.delayFor(5000);
        this.reconnecting = false;
        return this.reconnect();
      }
      if (this.client.listenerCount(Events.INVALIDATED)) {
        this.client.emit(Events.INVALIDATED);
        this.destroy();
      } else this.client.destroy();
    } finally {
      this.reconnecting = false;
    }
    return true;
  }

  broadcast(packet) {
    for (const shard of this.shards.values()) shard.send(packet);
  }

  destroy() {
    if (this.destroyed) return;
    this.debug(
      `Manager was destroyed by:\n${new Error("MANAGER_DESTROYED").stack}`
    );
    this.destroyed = true;
    this.shardQueue.clear();
    for (const shard of this.shards.values())
      shard.destroy({ closeCode: 1000, reset: true, emit: false, log: false });
  }
  async _handleSessionLimit(remaining, resetAfter) {
    if (typeof remaining === "undefined" && typeof resetAfter === "undefined") {
      const { session_start_limit } = await this.client.api.gateway.bot.get();
      this.sessionStartLimit = session_start_limit;
      remaining = session_start_limit.remaining;
      resetAfter = session_start_limit.reset_after;
      this.debug(`Session Information
				Total: ${session_start_limit.total}
				Remaining: ${remaining}`);
    }
    if (!remaining) {
      this.debug(
        `Exceeded identify threshold. Will attempt a connection in ${resetAfter}ms`
      );
      await Util.delayFor(resetAfter);
    }
  }
  handlePacket(packet, shard) {
    if (packet && this.status !== Status.READY)
      if (!BeforeReadyWhitelist.includes(packet.t)) {
        this.packetQueue.push({ packet, shard });
        return false;
      }
    if (this.packetQueue.length) {
      const item = this.packetQueue.shift();
      this.client.setImmediate(() => {
        this.handlePacket(item.packet, item.shard);
      });
    }
    if (packet && PacketHandlers[packet.t])
      PacketHandlers[packet.t](this.client, packet, shard);
    return true;
  }

  async checkShardsReady() {
    if (this.status === Status.READY) return;
    if (
      this.shards.size !== this.totalShards ||
      this.shards.some((s) => s.status !== Status.READY)
    )
      return;
    this.status = Status.NEARLY;
    if (this.client.options.fetchAllMembers)
      try {
        const promises = this.client.guilds.cache.map((guild) => {
          if (guild.available) return guild.members.fetch();
          return Promise.resolve();
        });
        await Promise.all(promises);
      } catch (err) {
        this.debug(
          `Failed to fetch all members before ready! ${err}\n${err.stack}`
        );
      }
    this.triggerClientReady();
  }
  triggerClientReady() {
    this.status = Status.READY;
    this.client.readyAt = new Date();
    this.client.emit(Events.CLIENT_READY);
    this.handlePacket();
  }
}
module.exports = WebSocketManager;
