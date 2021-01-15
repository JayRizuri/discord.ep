const AllowedImageFormats = ["webp", "png", "jpg", "jpeg", "gif"];

const AllowedImageSizes = Array.from({ length: 9 }, (e, i) => 2 ** (i + 4));
function getImageUrl(root, { format = "webp", size } = {}) {
	if (format && !AllowedImageFormats.includes(format))
		throw new Error("IMAGE_FORMAT", format);
	if (size && !AllowedImageSizes.includes(size))
		throw new RangeError("IMAGE_SIZE", size);
	return `${root}.${format}${size ? `?size=${size}` : ""}`;
}
exports.DefaultClientOptions = {
	shardCount: 1,
	retryLimit: 1,
	presence: {},
	ws: {
		large_threshold: 50,
		compress: false,
		properties: {
			$os: process.platform,
			$browser: "discord.js",
			$device: "discord.js"
		},
		version: 6
	},
	http: {
		version: 7,
		api: "https://discord.com/api",
		cdn: "https://cdn.discordapp.com",
		invite: "https://discord.gg",
		template: "https://discord.new"
	}
};

exports.endpoints = {
	cdn(root) {
		return {
			Emoji: (emojiID, format = "png") =>
				`${root}/emojis/${emojiID}.${format}`,

			Asset: (name) => `${root}/assets/${name}`,

			DefaultAvatar: (discriminator) =>
				`${root}/embed/avatars/${discriminator}.png`,
			Avatar: (
				userID,
				hash,
				format = "webp",
				size,
				dynamic = false
			) => {
				if (dynamic)
					format = hash.startsWith("a_")
						? "gif"
						: format;
				return getImageUrl(
					`${root}/avatars/${userID}/${hash}`,
					{ format, size }
				);
			},

			Banner: (guildID, hash, format = "webp", size) =>
				getImageUrl(
					`${root}/banners/${guildID}/${hash}`,
					{ format, size }
				),
			Icon: (
				guildID,
				hash,
				format = "webp",
				size,
				dynamic = false
			) => {
				if (dynamic)
					format = hash.startsWith("a_")
						? "gif"
						: format;
				return getImageUrl(
					`${root}/icons/${guildID}/${hash}`,
					{ format, size }
				);
			},

			AppIcon: (
				clientID,
				hash,
				{ format = "webp", size } = {}
			) =>
				getImageUrl(
					`${root}/app-icons/${clientID}/${hash}`,
					{ size, format }
				),
			AppAsset: (
				clientID,
				hash,
				{ format = "webp", size } = {}
			) =>
				getImageUrl(
					`${root}/app-assets/${clientID}/${hash}`,
					{ size, format }
				),

			GDMIcon: (channelID, hash, format = "webp", size) =>
				getImageUrl(
					`${root}/channel-icons/${channelID}/${hash}`,
					{ size, format }
				),

			Splash: (guildID, hash, format = "webp", size) =>
				getImageUrl(
					`${root}/splashes/${guildID}/${hash}`,
					{ size, format }
				),
			DiscoverySplash: (
				guildID,
				hash,
				format = "webp",
				size
			) =>
				getImageUrl(
					`${root}/discovery-splashes/${guildID}/${hash}`,
					{ size, format }
				),

			TeamIcon: (
				teamID,
				hash,
				{ format = "webp", size } = {}
			) =>
				getImageUrl(
					`${root}/team-icons/${teamID}/${hash}`,
					{ size, format }
				)
		};
	},
	invite: (root, code) => `${root}/${code}`,
	gateway: "/gateway/bot"
};
