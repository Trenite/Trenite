const SocketIO = require("socket.io");
var jwt = require("jsonwebtoken");

module.exports = (api) => {
	var { http, app } = api;
	const io = require("socket.io")(http, {
		path: "/api/gateway",
		serveClient: false,
	});

	const botSubscriptions = new Map();
	const guildSubscriptions = new Map();

	async function sendToAdmins(subs, guild, ...args) {
		if (!subs) subs = [];

		for (const socket of subs) {
			var user = socket.user.id;
			var member = guild.members.resolve(user);
			if (!member) continue;
			if (!member.hasPermission("ADMINISTRATOR")) continue;
			socket.emit.apply(socket, args);
		}
	}

	function clearSockets(arr, socket) {
		arr.forEach((list, key) => {
			arr[key] = list.filter((x) => x !== socket);
		});
	}

	api.on("GUILD_CREATE", async (bot, guild) => {
		guild.added = true;
		sendToAdmins(botSubscriptions.get(bot.user.id), guild, "GUILD_CREATE", guild);
	});

	api.on("GUILD_DELETE", async (bot, guild) => {
		guild.added = false;
		sendToAdmins(botSubscriptions.get(bot.user.id), guild, "GUILD_DELETE", guild);
	});

	api.on("GUILD_UPDATE", async (bot, guild) => {
		sendToAdmins(botSubscriptions.get(bot.user.id), guild, "GUILD_UPDATE", guild);
	});

	var guildEvents = [
		"CHANNEL_CREATE",
		"CHANNEL_DELETE",
		"CHANNEL_UPDATE",
		"EMOJI_CREATE",
		"EMOJI_DELETE",
		"EMOJI_UPDATE",
		"ROLE_CREATE",
		"ROLE_DELETE",
		"ROLE_UPDATE",
	];

	for (const event of guildEvents) {
		const test = event;
		api.on(event, async (guild, ...args) => {
			if (!guild) return;
			sendToAdmins.apply(this, [guildSubscriptions.get(guild.id), guild, test, ...args]);
		});
	}

	io.use(function (socket, next) {
		try {
			if (socket.request && socket.request.headers.cookie) {
				var token = socket.request.headers.cookie.split("; ").find((x) => x.includes("token"));
				if (!token) throw new Error("Authentication error");
				token = token.replace("token=", "");

				jwt.verify(token, api.config.server.jwtSecret, function (err, decoded) {
					if (err) throw new Error("Authentication error");
					socket.token = token;
					socket.user = decoded;
					next();
				});
			} else {
				throw new Error("Authentication error");
			}
		} catch (error) {
			socket.disconnect(true);
		}
	}).on("connection", function (socket) {
		socket.on("SUBSCRIBE_BOT", (id) => {
			try {
				var bot = api.server.bots.getBot({ id });
				var owner = bot.config.discord.owner;
				owner = owner.find((x) => x === socket.user.id);
				if (!owner && !bot.trenite) return;
				if (!botSubscriptions.has(id)) botSubscriptions.set(id, []);
				if (botSubscriptions.get(id).find((x) => x === socket)) return;

				botSubscriptions.get(id).push(socket);
			} catch (error) {}
		});

		socket.on("UNSUBSCRIBE_BOT", (id) => {
			try {
				if (!botSubscriptions.has(id)) botSubscriptions.set(id, []);
				var sock = botSubscriptions.get(id).findIndex((x) => x === socket);
				if (sock === -1) return;

				botSubscriptions.get(id).splice(sock, 1);
			} catch (error) {}
		});

		socket.on("SUBSCRIBE_GUILD", (id) => {
			try {
				var guild;
				api.server.bots.bots.find((x) =>
					x.Client.guilds.cache.find((g) => {
						if (g.id === id) {
							guild = g;
							return true;
						}
					})
				);
				if (!guild) return;
				var member = guild.members.resolve(socket.user.id);
				if (!member) return;
				if (!member.hasPermission("ADMINISTRATOR")) return;
				if (!guildSubscriptions.has(id)) guildSubscriptions.set(id, []);
				if (guildSubscriptions.get(id).find((x) => x === socket)) return;

				guildSubscriptions.get(id).push(socket);
			} catch (error) {}
		});

		socket.on("UNSUBSCRIBE_GUILD", (id) => {
			try {
				if (!guildSubscriptions.has(id)) guildSubscriptions.set(id, []);
				var sock = guildSubscriptions.get(id).findIndex((x) => x === socket);
				if (sock === -1) return;

				guildSubscriptions.get(id).splice(sock, 1);
			} catch (error) {}
		});

		socket.on("disconnect", () => {
			clearSockets(botSubscriptions);
			clearSockets(guildSubscriptions);
		});
	});
};
