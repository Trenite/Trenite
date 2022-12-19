const commando = require('discord.js-commando');
const fetch = require('node-fetch');

module.exports = class MotivationCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: 'motivation',
			memberName: 'motivation',
			aliases: [],
			group: 'fun',
			description: 'Sends a motivate Quote',
			examples: ['motivation'],
			clientPermissions: ['SEND_MESSAGES'],
		});
	}
	async requestMotivation(url) {
		let r = await fetch(url);
		r = await r.json();
		return r.affirmation;
	}

	async run(msg, args) {
		var { client, guild } = msg;
		let aff = await this.requestMotivation('https://www.affirmations.dev/');
		msg.reply(aff);
	}
};
