const commando = require("discord.js-commando");
var EventEmitter = require("events").EventEmitter;
const mongoose = require("mongoose");

module.exports = class VerifyCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "fn-verify",
			memberName: "fn-verify",
			aliases: ["fnverify", "fortnite-verify", "fortniteverify"],
			group: "fortnite",
			description: "connects a discord account with a fortnite account",
			examples: ["verify"],
			clientPermissions: ["SEND_MESSAGES"],
			guildOnly: true,
			devOnly: false,
			userPermissions: ["ADMINISTRATOR"],
		});
		this.emoji = "🔴";
		this.events = new EventEmitter();
		this.client.once(
			"providerReady",
			(() => {
				this.client.guilds.cache.forEach(this.fetch.bind(this));
			}).bind(this)
		);
		this.currentVerifications = new Map();
	}

	createmsg(guild, content) {
		return commando.createMessage(guild, content, {
			title: "Meltic Fortnite Verify",
		});
	}

	async fetch(guild) {
		try {
			this.updateMembers();
		} catch (error) {}
		try {
			var verifyMsg = await this.client.provider.get(guild, "verifyMsg");
			var verifyChannel = await this.client.provider.get(
				guild,
				"verifyChannel"
			);
			if (!verifyMsg && !verifyChannel) return;

			verifyChannel = guild.channels.resolve(verifyChannel);
			if (!verifyChannel) return;

			verifyMsg = await verifyChannel.messages.fetch(verifyMsg);
			if (!verifyMsg) return;

			const filter = (reaction, user) => {
				return reaction.emoji.name === "🔴";
			};
			const collector = verifyMsg.createReactionCollector(filter, {});
			collector.on("collect", async (reaction, user) => {
				if (user.bot) return;
				reaction.users.remove(user);
				if (this.currentVerifications.get(user.id)) {
					return user.send(
						this.createmsg(
							guild,
							"You cannot start a new verification process while you are in one"
						)
					);
				}
				this.currentVerifications.set(user.id, true);
				try {
					await this.onVerifyReaction.call(
						this,
						verifyChannel,
						reaction,
						user
					);
				} catch (error) {
					console.error(error);
				}
				this.currentVerifications.delete(user.id, true);
			});
		} catch (error) {}
	}

	async alreadyVerified({ dbuser, user, guild, reaction }) {
		try {
			if (dbuser.blocked === true)
				return user.send(
					this.createmsg(guild, "You are blocked on this server.")
				);

			var alreadylinked = await user.send(
				this.createmsg(
					guild,
					"You are already linked on this server. If you want to unlink please click on the reaction: ✅"
				)
			);

			await alreadylinked.react("✅");
			const filter = (reaction, u) => {
				return reaction.emoji.name === "✅" && u === user;
			};
			var collected = await alreadylinked.awaitReactions(filter, {
				errors: ["time"],
				max: 1,
				time: 1000 * 60,
			});
			var user = collected.first().users.cache.last();

			var users = await this.client.provider.get(guild, "fn-users");
			users = users.filter((user2) => user2.id !== user.id);
			await this.client.provider.set(guild, "fn-users", users);
			user.send(this.createmsg(guild, "You are unlinked."));
		} catch (error) {
			// reaction timeout
			if (alreadylinked) alreadylinked.delete();
		}
	}
	async updateMembers() {}
	/*	this.client.guilds.cache.forEach(async (guild) => {
			//	setInterval(
			//	async function () {
			var users = this.client.provider.get(guild, "fn-users");
			if (!users) return;
			var role = await this.getRole(guild);
			//	console.log(role);

			var interval = 1000 * 60 * 60; //* 60;
			var step = interval / users.length;
			console.log(step);
			setInterval(() => {
				guild.members.cache.forEach((member, index) => {
					setTimeout(() => {
						// update nickname + roles
						c;
						var user = users.find((x) => x.id === member.id);
						if (!user) return;
						if (user.blocked) return;

						member.roles.add(role);
					}, step * index);
				});
			}, interval);
			//	}.bind(this),
			//	1000 * 10
			//	);
		});
	}*/
	async getRole(guild) {
		return this.client.getRole(guild, "Meltic FN Verify", {
			name: "Meltic FN Verify",
			position: 0,
		});
	}
	async onVerifyReaction(verifyChannel, reaction, user) {
		const { guild } = verifyChannel;
		var lang = this.lang;
		const epicGames = this.client.bot.botmanager.fnbot;

		let textfilter = (m) => m.author.id == user.id;
		var users = await this.client.provider.get(guild, "fn-users");
		if (!users) users = [];
		var dbuser = users.find((u) => u.id === user.id);
		if (dbuser)
			return this.alreadyVerified({ dbuser, user, guild, reaction });

		try {
			var verifydm = await user.send(
				this.createmsg(guild, "Please send you Epic Games name")
			);
		} catch (error) {
			var msg = await verifyChannel.send(
				this.createmsg(`${user} Your DM isn't open.`)
			);
			await msg.delete(10000);
			this.client.log(`${user}'s dm is closed. Error on Verify`);
			return;
		}
		try {
			do {
				var epicgamesnamemessage = await verifydm.channel.awaitMessages(
					textfilter,
					{
						errors: ["time"],
						max: 1,
						time: 1000 * 120,
					}
				);

				epicgamesnamemessage = epicgamesnamemessage.first();

				let epicname = epicgamesnamemessage.content;
				console.log(epicGames);
				var account = await epicGames.getProfile(epicname);
				if (!account) {
					user.send(
						this.createmsg(
							guild,
							"Your account wasn't found.\nTry again."
						)
					);
				}
			} while (!account);
			// do while loop, try again if account wasn't found, timeout if the user doesn't answer

			var { id, name } = account;
			var fnuser = users.find((user2) => user2.fn_id === id);
			if (fnuser && fnuser.blocked === true) {
				return user
					.send(
						this.createmsg(guild, "You are blocked on this server.")
					)
					.catch(() => {});
			}

			var declined = true;
			while (declined) {
				try {
					await epicGames.addFriend(id);

					await user.send(
						this.createmsg(
							guild,
							"You should receive a friend request in fortnite from ``" +
								epicGames.user.displayName +
								"``"
						)
					);
				} catch (error) {
					await user.send(
						this.createmsg(
							guild,
							"You had already get a fa from ``" +
								epicGames.user.displayName +
								"``"
						)
					);
				}

				if (!(await epicGames.friends.get(id))) {
					var anyEvent = await Promise.race([
						epicGames.waitForEvent(
							`friend#${id}:request:decline`,
							120000
						),
						epicGames.waitForEvent(`friend#${id}:added`, 120000),
					]);
					if (anyEvent.status === "DECLINED") {
						var reAdd = await user.send(
							this.createmsg(
								guild,
								`You declined the friend request, make sure to disable "auto-decline mode"`
							)
						);
						declined = true;
						await reAdd.react("🔄");
						await reAdd.awaitReactions((_, u) => u.id === user.id, {
							max: 1,
						});
					}
				} else {
					declined = false;
				}
			}

			var code = Math.floor(Math.random() * 9000 + 1000);

			epicGames.sendFriendMessage(
				id,
				"Your Meltic verification code is: " + code
			);

			const codedm = await user.send(
				this.createmsg(
					guild,
					"Friend request accepted!\nPlease send the verification code, that we send you in your Epic Games DM"
				)
			);

			var codeanswer;
			var trys = 0;

			do {
				codeanswer = await codedm.channel.awaitMessages(textfilter, {
					errors: ["time"],
					max: 1,
					time: 1000 * 120,
				});

				codeanswer = codeanswer.first();
				codeanswer = codeanswer.content;

				if (trys++ >= 3)
					return user.send(
						this.createmsg(
							guild,
							"Verification aborted\n.Rate limit, code tried too often"
						)
					);

				if (codeanswer != code)
					user.send(
						this.createmsg(
							guild,
							"You provided a wrong code, try again!"
						)
					);
			} while (codeanswer != code);

			user.send(
				this.createmsg(
					guild,
					"Successfully verified. No futher steps to do."
				)
			);
			epicGames.removeFriend(id);

			var globaluser = {
				fn_id: id,
				id: user.id,
				guild: guild.id,
				blocked: false,
			};

			var globalusers = this.client.provider.get("global", "fn-users");
			if (!globalusers) globalusers = [];

			users.push({ ...globaluser, elo: 0 });
			globalusers.push(globaluser);

			this.client.provider.set(guild, "fn-users", users);
			this.client.provider.set("global", "fn-users", globalusers);
			var role = await this.getRole(guild);
			console.log(role);
			var member = await guild.members.fetch(user.id);
			member.roles.add(role);
		} catch (error) {
			if (id) epicGames.removeFriend(id);
			this.client.emit("error", error);

			return user.send(
				this.createmsg(guild, "Timeout exceeded on verify")
			);
		}
	}

	async run(msg, args) {
		const { author, guild, client, channel } = msg;

		var verifyMsg = await this.client.provider.get(guild, "verifyMsg");
		var verifyChannel = await this.client.provider.get(
			guild,
			"verifyChannel"
		);

		if (verifyMsg && verifyChannel) {
			verifyChannel = guild.channels.resolve(verifyChannel);
			if (verifyChannel) {
				verifyChannel.messages
					.fetch(verifyMsg)
					.then((verifyMsg) => {
						verifyMsg.delete();
					})
					.catch(() => {});
			}
		}

		var verify = await msg.reply(
			this.createmsg(
				guild,
				"Please react to link your fortnite account with discord"
			)
		);
		verify.react(this.emoji);

		this.client.provider.set(guild, "verifyMsg", verify.id);
		this.client.provider.set(guild, "verifyChannel", channel.id);

		this.fetch(guild);
	}
};
