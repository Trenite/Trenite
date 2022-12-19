const fetch = require("node-fetch");
const { Command } = require("discord.js-commando");
const headers = { Authorization: "b2346891-c7a3c2c7-b8409ec1-5c721c54" };
module.exports = class LocationCommand extends Command {
	constructor(client) {
		super(client, {
			name: "fn-location", //lowercase
			memberName: "fn-location", //lowercase
			aliases: [
				"fn-random-location",
				"fn-randomlocation",
				"fn-location-random",
				"fn-locationrandom",
				"fn-list-location",
				"fn-listlocation",
				"fn-locationlist",
				"fn-location-list",
				"fortnite-random-location",
				"fortnite-randomlocation",
				"fortnite-location-random",
				"fortnite-locationrandom",
				"fortnite-list-location",
				"fortnite-listlocation",
				"fortnite-locationlist",
				"fortnite-location-list",
				"fortnite-location",
			],
			group: "fortnite", // [dev, fortnite, fun, mod, music, util]
			description: "Send the current tournaments.",
			examples: ["fn-tournaments"],

			clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			args: [
				{
					key: "angabe",
					prompt:
						"Write ``random`` to get a random location or write ``list`` to see als Locations on the current fortnite map.",
					type: "string",
					validate: (text, msg) => {
						if (text === "list") {
							return true;
						} else if (text === "random") {
							return true;
						} else {
							return false;
						}
					},
				},
			],
		});
		this.locations = __dirname + "/../../ressources/fortnite/news/";
		this.client.on("ready", async () => {
			this.getJson();
		});
	}
	async getJson() {
		var interval = this.client.setInterval(
			async function () {
				try {
				} catch (error) {
					console.error("random-spot", error);
				}
			}.bind(this),
			60 * 1000 * 10
		);
	}
	async getRandom(msg) {
		var location = await fetch("https://fortniteapi.io/game/poi?lang=en", {
			method: "GET",
			headers: headers,
		});
		location = await location.json();
		if (!location.result) throw "Map locations not found";

		location = location.list;

		location = await location[Math.floor(Math.random() * location.length)];
		msg.reply(location.name, {
			embed: {
				image: { url: location.images.length ? location.images[0].url : "" },
			},
		});
	}
	async list(msg) {
		var location = await fetch("https://fortniteapi.io/game/poi?lang=en", {
			method: "GET",
			headers: headers,
		});
		location = await location.json();
		if (!location.result) throw "Map locations not found";

		location = location.list;
		msg.reply(
			location.map((locations) => locations.name),
			{
				embed: {
					image: {
						url: "https://media.fortniteapi.io/images/map.png?showPOI=true",
					},
				},
			}
		);
	}
	async run(msg, args) {
		var { client, guild } = msg;
		var angabe = args.angabe;
		if (angabe === "random") return this.getRandom(msg);
		if (angabe === "list") return this.list(msg);
		else {
		}
	}
};
