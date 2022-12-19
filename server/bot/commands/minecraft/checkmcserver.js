const { Command } = require("discord.js-commando");
const { Discord } = require("discord.js");
const fetch = require("node-fetch");

module.exports = class McServerCommand extends Command {
	constructor(client) {
		super(client, {
			name: "mc-server", //lowercase
			memberName: "mc-server", //lowercase
			aliases: ["mcserver", "checkmcserver"],
			group: "minecraft", // [dev, fortnite, fun, mod, audio, util, media, bot]
			description: "Check the status of a minecraft server",
			examples: ["checkmcserver gommehd.net"],
			userPermissions: ["SEND_MESSAGES"],
			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			// if no args, delete the args object COMPLETLY
			args: [
				{
					key: "search",
					prompt: "Which Minecraft server you mean?",
					type: "string",
				},
			],
		});
	}

	async run(msg, args) {
		var { search } = args;
		const res = await fetch(`https://mcapi.us/server/status?ip=${search}`);
		if (!res) return message.reply(`Your server is not reachable.. 🚫`);
		const body = await res.json();
		if (body.status === "error") {
			return msg.reply("You provided an invalid IP.\n Error: ``" + body.error + "``");
		}

		msg.reply({
			title: `Server Information of ${search}`,
			embed: {
				fields: [
					{
						name: "Players",
						value: `${body.players.now}/${body.players.max} Players`,
					},
					{
						name: "Status",
						value: body.online ? "Online ✅" : "Offline ⛔️",
					},
					{
						name: "Version",
						value: `${body.server.name}`,
					},
					{
						name: "MOTD",
						value: `${body.motd ? body.motd.replace("§", "") : "-"}`,
					},
				],
			},
		});
	}
};
