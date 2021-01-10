exports.DefaultClientOptions = {
  shardCount: 1,
  retryLimit: 1,
  presence: {},
  ws: {
    large_threshold: 50,
    compress: false,
    properties: {
      $os: browser ? 'browser' : process.platform,
      $browser: 'discord.js',
      $device: 'discord.js',
    },
    version: 6,
  },
  http: {
    version: 7,
    api: 'https://discord.com/api',
    cdn: 'https://cdn.discordapp.com',
    invite: 'https://discord.gg',
    template: 'https://discord.new',
  },
};
