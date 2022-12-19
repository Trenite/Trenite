const commando = require("discord.js-commando");

module.exports = class TodoCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "todo",
			memberName: "todo",
			aliases: ["todos"],
			group: "setup",
			description: "Creates a TODO Message with checkmarks",
			examples: ["todo"],
			guildOnly: true,
			userPermissions: ["MANAGE_MESSAGES"],
			clientPermissions: ["SEND_MESSAGES", "ADD_REACTIONS"],
			args: [
				{
					key: "todo",
					prompt: "Write all your todos in every line",
					type: "string",
					wait: 120,
				},
			],
		});

		this.client.once(
			"providerReady",
			(() => {
				this.client.guilds.cache.forEach(this.fetch.bind(this));
			}).bind(this)
		);
	}

	async createMessage(guild, idOrTodos) {
		var list = [];
		if (typeof idOrTodos === "string") {
			var todos = await this.client.provider.get(guild, "todos");
			var todo = todos.find((todo) => todo.msg === idOrTodos);
			if (!todo) return;
			list = todo.list;
		} else {
			list = idOrTodos;
		}

		var leadingZero = false;
		if (list.length > 9) {
			leadingZero = true;
		}

		var index = 1;
		list = list
			.sort((a, b) => a.value.toLowerCase().localeCompare(b.value.toLowerCase()))
			.sort((a, b) => b.checked - a.checked);

		list = list.map((todo) => {
			var i = index;
			var { value, checked } = todo;
			value = value.trim();
			if (leadingZero && i < 10) {
				i = "0" + i;
			}
			i += ". ";

			if (checked) {
				value = "✅  " + value;
			} else {
				value = "❌  " + value;
			}

			var s = i + value;
			index++;
			return s;
		});

		var text =
			"```\n" +
			list.join("\n") +
			"\n```" +
			`\n**React with:**\n✅ to **complete** a Todo\n❌ to **uncheck** a Todo\n🗑️ to **delete** a Todo\n🔧 to **access** the settings\n🆕 to **add** a new Todo\n✏️ to **edit** a Todo\n\n`;

		return await commando.createMessage(guild, text, {
			title: "Todo",
		});
	}

	async fetch(guild) {
		var client = guild.client;
		try {
			var todos = await this.getTodos(guild);
			if (!todos) return;
			var botId = this.client.user.id;

			todos.forEach(async (todo) => {
				var { msg, channel } = todo;

				channel = guild.channels.resolve(channel);
				try {
					msg = await channel.messages.fetch(msg);
				} catch (error) {
					console.error(error);
					return;
				}

				var collector = msg.createReactionCollector((reaction, user) => {
					return ["✅", "❌", "🗑️", "🔧", "🆕", "✏️"].includes(reaction.emoji.name) && user.id != botId;
				}, {});

				collector.on("collect", this.onReaction.bind(this, { guild, msg, channel, client }));
			});
		} catch (error) {
			client.emit("error", error);
		}
	}

	async onReaction({ guild, msg, channel, client }, reaction, user) {
		const member = guild.member(user);
		reaction.users.remove(user);
		var todos = client.provider.get(guild, "todos") || [];
		var t = todos.find((to) => to.msg === msg.id);
		if (!t) return;
		var list = t.list;

		if (
			t.roles.length > 0 &&
			!t.roles.find((role) => member.roles.cache.find((r) => r.id === role.id)) &&
			!member.hasPermission("ADMINISTRATOR")
		) {
			member.send("You don't have permissions to change the todo", {
				title: "Todo: Error",
			});
			return;
		}

		if (reaction.emoji.name === "🆕") {
			var edit = await this.createMessage(guild, msg.id);
			edit.embed.description += "\n";
			edit.embed.fields = [{ name: "Add: ", value: "Enter a new Todo!" }];
			try {
				msg.edit("", edit);
				var collected = await channel
					.awaitMessages((m) => m.author.id === user.id, {
						errors: ["time"],
						max: 1,
						time: 60000,
					})
					.catch((e) => {
						throw "Timeout 30secs: You didn't enter the new text";
					});

				collected = collected.first();
				collected.delete();

				list.push({ value: collected.cleanContent, checked: false });

				this.client.provider.set(guild, "todos", todos);

				msg.edit("", await this.createMessage(guild, msg.id));
			} catch (error) {
				var edit = await this.createMessage(guild, msg.id);
				edit.embed.description += "\n";
				edit.embed.fields = [{ name: "Error: ", value: "You didn't entered a Todo!" }];
				msg.edit("", edit).catch((e) => {});
				setTimeout(async () => {
					msg.edit("", await this.createMessage(guild, msg.id)).catch((e) => {});
				}, 4000);
			}
			return;
		}

		if (reaction.emoji.name === "🔧") {
			var roles = t.roles.map((role) => guild.roles.fetch(role).name);
			var text;
			if (roles.length <= 0) {
				text = "Currently everyone can edit the Todo";
			} else {
				text = "Currentyl only " + roles.join(",") + " can edit the Todo";
			}

			try {
				await msg.edit("Enter the Roles who have access to change the Todo\n" + text, {
					title: "Todo: Settings",
				});
				try {
					var collected = await channel.awaitMessages((m) => m.author.id === user.id, {
						errors: ["time"],
						max: 1,
						time: 60000,
					});
				} catch (error) {
					throw "Timeout 60secs: You didn't enter any role";
				}
				collected = collected.first();
				collected.delete();
				var text;
				if (collected.mentions.roles.size <= 0) {
					t.roles = [];
					text = "Successfully removed permission for Todo";
				} else {
					t.roles = collected.mentions.roles.map((role) => role.id);
					text =
						"Successfully changed the permission roles to: " +
						collected.mentions.roles.map((role) => role.name).join(", ");
				}

				msg.edit(text, { title: "Todo: Settings" });

				setTimeout(async () => {
					msg.edit("", await this.createMessage(guild, msg.id)).catch((e) => {});
				}, 4000);
			} catch (error) {
				msg.edit(error + "!", {
					title: "Todo: Settings",
				}).catch((e) => {});
				setTimeout(async () => {
					await msg.edit("", this.createMessage(guild, msg.id)).catch((e) => {});
				}, 4000);
			}

			this.client.provider.set(guild, "todos", todos);

			return;
		}

		var edit = await this.createMessage(guild, msg.id);
		edit.embed.description += "\n";
		edit.embed.fields = [{ name: "Manipulate: ", value: "Enter the Todo number to manipulate it!" }];
		msg.edit("", edit).catch((e) => {});

		try {
			var collected = await channel
				.awaitMessages((m) => m.author.id === user.id, {
					errors: ["time"],
					max: 1,
					time: 30000,
				})
				.catch((e) => {
					throw "Timeout 30secs: You didn't enter a number";
				});

			collected = collected.first();
			collected.delete();
			var number = parseInt(collected.cleanContent);

			if (isNaN(number)) {
				throw "not a number";
			}

			number--;
			var entry = list[number];

			if (!entry) {
				throw "Todo not found";
			}

			switch (reaction.emoji.name) {
				case "✅":
					entry.checked = true;
					break;
				case "✏️":
					var edit = await this.createMessage(guild, msg.id);
					edit.embed.description += "\n";
					edit.embed.fields = [
						{
							name: "Manipulate: ",
							value: "Enter the new Text!",
						},
					];
					msg.edit("", edit);
					collected = await channel
						.awaitMessages((m) => m.author.id === user.id, {
							errors: ["time"],
							max: 1,
							time: 60000,
						})
						.catch((e) => {
							throw "Timeout 30secs: You didn't enter the new text";
						});

					collected = collected.first();
					collected.delete();

					entry.value = collected.cleanContent;

					break;
				case "❌":
					entry.checked = false;
					break;
				case "🗑️":
					list.splice(number, 1);
					break;
			}

			this.client.provider.set(guild, "todos", todos);

			msg.edit("", await this.createMessage(guild, msg.id));
		} catch (error) {
			var edit = await this.createMessage(guild, msg.id);
			edit.embed.description += "\n";
			edit.embed.fields = [{ name: "Error: ", value: error + "!\n" }];
			msg.edit("", edit).catch((e) => {});
			setTimeout(async () => {
				msg.edit("", await this.createMessage(guild, msg.id)).catch((e) => {});
			}, 4000);
		}
	}

	error(e) {
		return this.client.emit("error", e);
	}

	async getTodos(guild) {
		var todos = await this.client.provider.get(guild, "todos");
		var result = [];

		if (todos) {
			for (var todo of todos) {
				var { channel, msg } = todo;

				channel = guild.channels.resolve(channel);
				if (channel) {
					try {
						msg = await channel.messages.fetch(msg);
					} catch (error) {
						msg = undefined;
					}
					if (msg) {
						result.push(todo);
					} else {
						todos.splice(
							todos.findIndex((t) => t === todo),
							1
						);
					}
				}
			}
			this.client.provider.set(guild, "todos", todos);
		}

		return result;
	}

	async run(msg, args) {
		const { guild, channel } = msg;
		var todos = this.client.provider.get(guild, "todos") || [];
		var list = args.todo.split("\n").filter((todo) => todo.trim().length > 0);
		list = list.map((entry) => {
			return { checked: false, value: entry };
		});

		var toSend = await this.createMessage(guild, list);

		if (!toSend) return;
		if (toSend.embed.description.length > 2048) {
			msg.reply("Too many ToDo's!\nMaximum size of 2048 characters");
			return;
		}

		var answer = await msg.reply(toSend);
		todos.push({ msg: answer.id, channel: channel.id, list, roles: [] });
		this.client.provider.set(guild, "todos", todos);
		this.fetch(guild);

		answer.pin().then((pin) => {
			var msgs = pin.channel.messages.cache.filter((msg) => msg.type === "PINS_ADD");
			if (msgs.size > 0 && msgs.last()) {
				msgs.last().delete();
			}
		});

		await answer.react("✅");
		await answer.react("❌");
		await answer.react("🗑️");
		await answer.react("🔧"); // what permissions to modify
		await answer.react("🆕");
		await answer.react("✏️");
	}
};

// 1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣8️⃣9️⃣🔟
// say cmd, edit reaction with permissions
