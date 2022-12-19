const commando = require("discord.js-commando");
const fetch = require("node-fetch");
const myconfig = require("../../../../config.json");

module.exports = class NasaCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "nasa",
			memberName: "nasa",
			aliases: [],
			group: "fun",
			description: "Sends nasa's astronomy picture of the day",
			examples: ["nasa"],
			clientPermissions: ["SEND_MESSAGES"],
		});
	}
	async requestNASA(url) {
		url += "?api_key=" + myconfig.infos.nasa;
		let re = await fetch(url);
		return re.json();
	}

	async run(msg, args) {
		var { client, guild } = msg;
		let req = await this.requestNASA("https://api.nasa.gov/planetary/apod");
		let url = req.url;

		msg.reply({
			embed: {
				author: {
					icon_url: client.user.displayAvatarURL,
					name: req.date + " | " + client.user.tag,
					url: url,
				},
				description: req.title,
				image: {
					url: url,
				},
			},
		});
	}
};
