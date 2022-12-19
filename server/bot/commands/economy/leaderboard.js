const commando = require("discord.js-commando");
const fetch = require("node-fetch");
const { UserFlags } = require("discord.js");
const { MessageEmbed } = require("discord.js");

module.exports = class LeadCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "leaderboard",
			memberName: "leaderboard",
			aliases: ["eco-leaderboard", "topten", "top-ten", "top-10", "top10", "leaderboard-eco"],
			group: "economy",
			description: "shows the economy leaderboard",
			examples: ["leaderboard"],
			clientPermissions: ["SEND_MESSAGES"],
		});
	}

	async run(msg, args) {
		var { client, guild } = msg;

		const currency = client.provider.get(guild, `currency`) || "coins";
		var balance = (await this.client.provider.get(guild, "users")) || [];

		async function getLeaderboard(page, per_page) {
			var users = client.provider.get(guild, "users") || [];
			users = users.filter((x) => x.balance);
			const resp = users.sort((a, b) => (b.balance || 0) - (a.balance || 0));
			var page = page || 1,
				per_page = per_page || 5,
				offset = (page - 1) * per_page,
				paginatedItems = resp.slice(offset).slice(0, per_page),
				total_pages = Math.ceil(resp.length / per_page);

			const cringelength = users
				.map((x) => client.users.resolve(x.id))
				.sort((a, b) => {
					try {
						return b.username.length - a.username.length;
					} catch (error) {
						return 0;
					}
				});

			var longestUsername = cringelength[0].username.length;

			var leaderboardMessage = "```\n";
			for (var i in paginatedItems) {
				let id = resp[i].id;
				let name = "-";

				try {
					const user = await client.users.fetch(id);
					name = user.username;
					for (var j = name.length; j < longestUsername; j++) {
						name += " ";
					}
				} catch (e) {
					console.error("leaderboard", e);
				}
				leaderboardMessage += `${name} » ${resp[i].balance} ${currency}\n`;
			}

			let end = {
				page: page,
				per_page: per_page,
				pre_page: page - 1 ? page - 1 : null,
				next_page: total_pages > page ? page + 1 : null,
				total: resp.length,
				total_pages: total_pages,
				data: paginatedItems,
				message: leaderboardMessage,
			};

			const topembed = new MessageEmbed().setTitle("🏆  Top 10").setDescription(leaderboardMessage);

			return msg.reply(leaderboardMessage, { title: "Top 10 🏆" });
		}
		getLeaderboard(1, 10);
	}
};
