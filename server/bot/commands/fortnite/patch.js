const { Command } = require("discord.js-commando");
const BOATS = require("boats.js");
const Boats = new BOATS(
	"mnCSzBMNCJjxRUlQ5TNYHlv9maaeqka0wVeHsElZymhMm0iBQAtyPBHSmUK6tL3F5VIR0KVZEyuOGUiuSB1jRTCNq9RXZJCnu4yl48FHw280p1rq9HjIGS4lrlfE7mOdKm0rV728RTNnlNFRbLab2nndiBh"
);

const fetch = require("node-fetch");
module.exports = class dBoatsCommand extends Command {
	constructor(client) {
		super(client, {
			name: "fn-patch",
			memberName: "fn-patch",
			aliases: ["fortnite-patch", "fortnitepatch", "fnpatch"],
			group: "fortnite",
			description: "Patches all fortnite discord members",
			examples: ["fn-patch @verified"],
			devOnly: true,
			clientPermissions: ["SEND_MESSAGES", "MANAGE_MESSAGES"],
			args: [
				{
					type: "role",
					key: "role",
					prompt: "What is the role?",
					validate: (text, msg) => {
						if (text === "disabled") {
							return true;
						} else if (msg.client.registry.types.get("role").parse(text, msg)) {
							return true;
						}

						return false;
					},
				},
			],
		});
		this.client.once(
			"providerReady",
			(() => {
				this.patch.bind(this)();
			}).bind(this)
		);
	}

	async patch() {
		this.client.setInterval(
			async function () {
				const client = this.client;
				this.client.guilds.cache.forEach(async (guild) => {
					var users1 = await this.client.provider.get(guild, "users");
					const epicGames = client.epicGames;
					if (!users1) return;

					guild.members.cache.forEach(async (user) => {
						users1 = await users1.find((user2) => user2.id === user.id);
						if (!users1) return;
						if (user.permissions.has("ADMINISTRATOR")) return;
						const account = await epicGames.getProfile(users1.fn_id);
						const { id, displayName } = account;
						const member = await guild.members.cache.find((user1) => user1.id === user.id);
						await member.setNickname(displayName);
					});
				});
			}.bind(this),
			10800000
		);
	}
	// }
	async run(msg, args) {
		var { client, guild } = msg;
		var role = args.role;

		if (role === "disabled") {
			role = null;
		}
		var roles = this.client.provider.get(guild, "nicknameroles");
		if (!roles) roles = [];
		roles.push(role.id);
		this.client.provider.set(guild, "nicknameroles", roles);
	}
};
