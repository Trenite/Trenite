const commando = require("discord.js-commando");
const fetch = require("node-fetch");

module.exports = class JokeCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "joke",
			memberName: "joke",
			aliases: [],
			group: "fun",
			description: "Sends a dad-joke",
			examples: ["joke"],
			clientPermissions: ["SEND_MESSAGES"],
		});
	}
	async requestDadJoke(url) {
		let re = await fetch(url, {
			headers: {
				"User-Agent": "My Library(https://github.com/xNaCly/Discord-Bots)",
				Accept: "application/json",
			},
		});
		return re.json();
	}

	async run(msg, args) {
		var { client, guild } = msg;
		let joke = await this.requestDadJoke("https://icanhazdadjoke.com");
		let url = "https://icanhazdadjoke.com/j/" + joke.id;
		msg.reply(joke.joke, {
			embed: {
				url,
			},
		});
	}
};
