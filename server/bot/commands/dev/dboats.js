const { Command } = require("discord.js-commando");
const BOATS = require("boats.js");
const Boats = new BOATS(
	"mnCSzBMNCJjxRUlQ5TNYHlv9maaeqka0wVeHsElZymhMm0iBQAtyPBHSmUK6tL3F5VIR0KVZEyuOGUiuSB1jRTCNq9RXZJCnu4yl48FHw280p1rq9HjIGS4lrlfE7mOdKm0rV728RTNnlNFRbLab2nndiBh"
);
// const DBL = require("dblapi.js");
// const dbl = new DBL(
// 	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OTU3NzUxNjE1MDgxNjg2NiIsImJvdCI6dHJ1ZSwiaWF0IjoxNTkyOTA2OTgxfQ.Ar4wWhS8_0JrnbEET9dyzvcpYLk-gGFrfM0j7wLiDoM",
// 	this.client
// );
const fetch = require("node-fetch");
module.exports = class dBoatsCommand extends Command {
	constructor(client) {
		super(client, {
			name: "dboats",
			memberName: "filter",
			aliases: [],
			group: "dev",
			description: "Discord Boats",
			examples: ["dboats"],
			devOnly: true,
			clientPermissions: ["SEND_MESSAGES", "MANAGE_MESSAGES"],
		});

		this.client.once(
			"providerReady",
			(() => {
				this.statusupdate.bind(this)();
			}).bind(this)
		);
	}

	async statusupdate() {
		this.client.setInterval(
			async function () {
				if (!this.client.production) return;
				if (!this.client.meltic) return;
				const data = {
					guilds: this.client.guilds.cache.size,
					users: this.client.users.cache.size,
				};
				// dbl.postStats(this.client.guilds.cache.size);
				Boats.postStats(this.client.guilds.cache.size, "689577516150816866");
			}.bind(this),
			1000 * 60 * 50
		);
	}

	async run(msg, args) {
		var { client, guild } = msg;
	}
};
