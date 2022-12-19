const commando = require("discord.js-commando");

module.exports = class ServerInfoCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "server-info",
			memberName: "serverinfo",
			aliases: ["info-server", "guild-info"],
			autoAliases: true,
			group: "info",
			description: "info about the current server",
			examples: ["$serverinfo"],
			clientPermissions: ["SEND_MESSAGES"],
			guildOnly: true,
			clientPermissions: ["SEND_MESSAGES"],
		});
	}

	async run(msg, args) {
		var { client, guild } = msg;
		var prem = client.allUsers.get(guild.id, "premium");
		if (!prem) {
			prem = "No";
		}
		function adminString() {
			let adminString = "";
			guild.members.cache.forEach((x) => {
				if (x.hasPermission("ADMINISTRATOR")) {
					if (x.user.bot) {
						adminString += `\n <@${x.user.id}> [BOT]`;
						return;
					} else {
						adminString += `\n <@${x.user.id}>`;
					}
				} else {
					return;
				}
			});
			return adminString;
		}
		function roleString() {
			let roleString = "";
			guild.roles.cache.forEach((x) => {
				if (x.name === "@everyone") {
					return;
				}
				roleString += `\n <@&${x.id}> [${x.members.size}]`;
			});
			return roleString;
		}

		function getEmojiList() {
			var temp = guild.emojis.cache
				.map((emoji) => emoji)
				.join("")
				.slice(0, 1024);
			temp.slice(0, temp.lastIndexOf(" "));
			return temp;
		}

		function getVanityURL() {
			let vanityString = "-";
			guild
				.fetchVanityCode()
				.then((code) => {
					vanityString = `Vanity URL: https://discord.gg/${code}`;
				})
				.catch();
			console.log(vanityString);
			return vanityString;
		}

		function getRegion() {
			let regionString = "";
			if (guild.region == "US West".toLocaleLowerCase()) {
				regionString = "US West 🇺🇸";
			} else if (guild.region == "US East".toLocaleLowerCase()) {
				regionString = "US East 🇺🇸";
			} else if (guild.region == "US Central".toLocaleLowerCase()) {
				regionString = "US Central 🇺🇸";
			} else if (guild.region == "US South".toLocaleLowerCase()) {
				regionString = "US South 🇺🇸";
			} else if (guild.region == "Singapore".toLocaleLowerCase()) {
				regionString = "Singapore 🇸🇬";
			} else if (guild.region == "South Africa".toLocaleLowerCase()) {
				regionString = "South Africa 🇿🇦";
			} else if (guild.region == "Sydney".toLocaleLowerCase()) {
				regionString = "Sydney 🇦🇺";
			} else if (guild.region == "Europe".toLocaleLowerCase()) {
				regionString = "Europe 🇪🇺";
			} else if (guild.region == "Brazil".toLocaleLowerCase()) {
				regionString = "Brazil 🇧🇷";
			} else if (guild.region == "Hong Kong".toLocaleLowerCase()) {
				regionString = "Hong Kong 🇯🇵";
			} else if (guild.region == "Russia".toLocaleLowerCase()) {
				regionString = "Russia 🇷🇺";
			} else if (guild.region == "Japan".toLocaleLowerCase()) {
				regionString = "Japan 🇯🇵";
			} else if (guild.region == "India".toLocaleLowerCase()) {
				regionString = "India 🇮🇳";
			} else if (guild.region == "Dubai".toLocaleLowerCase()) {
				regionString = "Dubai 🇦🇪";
			} else if (guild.region == "Amsterdam".toLocaleLowerCase()) {
				regionString = "Amsterdam 🇳🇱";
			} else if (guild.region == "Frankfurt".toLocaleLowerCase()) {
				regionString = "Frankfurt 🇩🇪";
			} else if (guild.region == "Central Europe".toLocaleLowerCase()) {
				regionString = "Central Europe 🇪🇺";
			} else if (guild.region == "Western Europe".toLocaleLowerCase()) {
				regionString = "Western Europe 🇪🇺";
			} else if (guild.region == "London".toLocaleLowerCase()) {
				regionString = "London 🏴󠁧󠁢󠁥󠁮󠁧󠁿";
			}
			return regionString;
		}

		var url = guild.iconURL({ dynamic: true, format: "jpg", size: 2048 });

		msg.reply({
			title: "Info about " + guild.name,
			embed: {
				url,
				thumbnail: {
					url,
				},
				fields: [
					{
						name: "Name:",
						value: guild.name,
						inline: true,
					},
					{ name: "ID:", value: guild.id, inline: true },
					{
						name: "Owner <:owner:747049964844220466>",
						value: `<@${guild.owner.user.id}>`,
						inline: true,
					},
					{
						name: "Created At: ",
						value: guild.createdAt.toLocaleDateString(),
						inline: true,
					},
					{
						name: "Humans:",
						value: `${
							guild.members.cache.filter((u) => !u.user.bot).size
						} (${Math.floor(
							(guild.members.cache.filter((u) => !u.user.bot).size /
								guild.members.cache.size) *
								100
						)}%)`,
						inline: true,
					},
					{
						name: "Bots",
						value: `${guild.members.cache.filter((u) => u.user.bot).size} (${Math.floor(
							(guild.members.cache.filter((u) => u.user.bot).size /
								guild.members.cache.size) *
								100
						)}%)`,
						inline: true,
					},
					{
						name: "Boosts <:boost:747042326773366795>",
						value: guild.premiumSubscriptionCount,
						inline: true,
					},
					{
						name: "Meltic Premium <:trenite:722867599637086279>",
						value: prem,
						inline: true,
					},
					{ name: "Region ", value: getRegion(), inline: true },
					{ name: "Admins ", value: adminString().slice(0, 1020), inline: true },
					{ name: "Vanity URL ", value: getVanityURL(), inline: true },
				],
			},
		});
	}
};
