const discord = require("discord.js"),
	commando = require("discord.js-commando"),
	path = require("path"),
	extend = require("./extension"),
	Fortnite = require("./extra/fortnitebr.js"),
	fs = require("fs").promises,
	dotenv = require("dotenv"),
	mongoose = require("mongoose"),
	languages = require("./language/");

dotenv.config({ path: path.join(__dirname, ".env") });
extend({ commando, discord });
global.commando = commando;
global.discord = discord;

class Bot {
	/**
	 * @param {Object} props
	 * @param {String} props.token The Bot token
	 */
	constructor(botmanager, config) {
		var server = botmanager.server;
		this.config = config;
		this.id = this.config.discord.client_id;
		if (!this.config.discord.token) return new Error("No Token provided");

		this.botmanager = botmanager;
		this.server = server;
		this.api = server.api;
		this.production = server.production;
		this.client_id = this.config.discord.client_id;
	}

	async start() {
		await this.mongodbConnect();
		await this.discord();
		return this;
	}

	async mongodbConnect() {
		this.mongodb = this.server.db.connection;
		this.provider = this.botmanager.provider;
		this.allUsers = this.botmanager.allUsers;
	}

	async discord() {
		var prefix = this.config.discord.prefix;
		this.Client = new commando.Client({
			owner: this.config.discord.owner,
			dev: this.config.discord.dev,
			commandPrefix: prefix,
			fetchAllMembers: false,
			restTimeOffset: 0,
			http: {
				version: this.config.discord.version,
				api: this.config.discord.api,
			},
			partials: ["MESSAGE", "CHANNEL", "REACTION"],
			ws: {
				intents: [
					"GUILDS",
					"GUILD_BANS",
					"GUILD_EMOJIS",
					"GUILD_INTEGRATIONS",
					"GUILD_WEBHOOKS",
					"GUILD_INVITES",
					"GUILD_VOICE_STATES",
					"GUILD_MESSAGES",
					"GUILD_MESSAGE_REACTIONS",
					"DIRECT_MESSAGES",
					"DIRECT_MESSAGE_REACTIONS",
				],
			},
			presence: {
				status: "online",
				activity: {
					name: prefix + "help | STARTING ...",
					type: "WATCHING",
					url: `https://${this.config.api.domain}`,
				},
			},
		});

		this.Client.discord = discord;
		this.Client.server = this.api;
		this.Client.bot = this;
		this.Client.production = this.production;
		this.Client.mongodb = this.mongodb;
		this.Client.config = this.config;
		this.Client.lang = languages;
		this.Client.en = languages.english;

		this.Client.setMaxListeners(20)
			.registry.registerDefaultTypes()
			.registerDefaultEvents()
			.registerTypesIn(path.join(__dirname, "types"))
			.registerGroups([
				["fortnite", "<:fortnite:701439383194304552> • Fortnite"],
				["setup", "🛠️ • Setup"],
				["mod", "🔧 • Moderator"],
				["util", "🔨 • Utility"],
				["economy", "💸 • Economy"],
				["bot", "🤖 • Bot"],
				["dev", "<:dev:701441426608750623> • Dev"],
				["fun", "<:babyYoda:701439832571772971> • Fun"],
				["audio", "<:audio:701440678999228528> • Audio"],
				["minecraft", "<:mc:724531600880041996> • Minecraft"],
				["media", "<:media:713446290909823061> • Media"],
				["coc", "<:coc:724586607486828564> • Clash of Clans"],
				["info", "ℹ️ • Info"],
				["stats", "📊 • Stats"],
				//["games", "<:gaming:727555225963200623> • Games"],
				["nsfw", "🍆 • NSFW"],
			])
			.registerEventsIn(path.join(__dirname, "events"))
			.registerDefaultCommands({
				help: false,
				unknownCommand: false,
				enable: false,
				disable: false,
				groups: false,
				load: false,
				unload: false,
				reload: true,
			})
			.registerCommandsIn({
				dirname: path.join(__dirname, "commands"),
				filter: /^([^\.]((?!test\.).)*)\.js$/m,
			});

		this.Client.login(this.config.discord.token).catch((e) => {
			this.Client.emit("invalidated");
		});

		this.Client.provider = this.provider;
		this.Client.allUsers = this.allUsers;

		if (this.id === "759425764394795008" || this.id === "759439765073428500") {
			global.Client = this.Client;
			global.meltic = this;
			this.Client.meltic = true;
			this.meltic = true;
		}

		return new Promise((resolve) => {
			this.Client.once("ready", async () => {
				this.Client.guilds.cache.forEach((guild) => {
					var prefix = this.Client.provider.get(guild, "prefix");
					var language = this.Client.provider.get(guild, "language") || "english";
					if (prefix) guild.commandPrefix = prefix;
					if (language) guild.lang = languages[language];
				});
				this.Client.emit("providerReady");
				resolve();
			});
		});
	}

	async stop({ restart }) {
		if (this.Client) {
			if (restart) {
				await this.Client.user.setPresence({
					status: "dnd",
					activity: {
						name: "RESTARTING",
						type: "WATCHING",
					},
				});
				// set presence before restart, to keep uptime high
			} else {
				await this.Client.user.setPresence({
					status: "invisible",
				});
			}
			// await this.fnbot.logout().catch((e) => {});
			return this.Client.destroy(); // after 30secs the connection will be forced closed
		}
	}
}

module.exports = Bot;
