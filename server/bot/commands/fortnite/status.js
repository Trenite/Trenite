const commando = require("discord.js-commando");
const fetch = require("node-fetch");

module.exports = class FortniteStatusCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "fn-status",
			memberName: "fn-status",
			aliases: ["fortnite-status", "fnstatus", "fortnitestatus"],
			group: "fortnite",
			description: "Info about the Fortnite Server Status",
			examples: ["fn-status"],
			guildOnly: true,
			clientPermissions: ["SEND_MESSAGES"],
		});
	}

	async requeststatus(status_url) {
		let r = await fetch(status_url);
		//[
		// 	{
		// 	  serviceInstanceId: 'fortnite',
		// 	  status: 'UP',
		// 	  message: 'Down for maintenance',
		// 	  maintenanceUri: null,
		// 	  overrideCatalogIds: [ 'a7f138b2e51945ffbfdacc1af0541053' ],
		// 	  allowedActions: [],
		// 	  banned: false,
		// 	  launcherInfoDTO: {
		// 		appName: 'Fortnite',
		// 		catalogItemId: '4fe75bbc5a674f4f9b356b5c90567da5',
		// 		namespace: 'fn'
		// 	  }
		// 	}
		// ]
		let response = await r.json();
		let status = response[0].status;
		let extrainfo = response[0].message;
		return status;
	}

	async run(msg, args) {
		var { client, guild } = msg;
		var x = await this.requeststatus(
			"https://lightswitch-public-service-prod06.ol.epicgames.com/lightswitch/api/service/bulk/status?serviceId=Fortnite"
		);
		msg.reply("The Fortnite Servers are currently: `" + x + "`");
	}
};
