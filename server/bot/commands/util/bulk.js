const Commando = require("discord.js-commando");
const { stripIndents } = require("common-tags");
const { Permissions } = require("discord.js");

module.exports = class BulkCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: "bulk", //lowercase
			memberName: "bulk", //lowercase
			aliases: ["query", "roleall", "allrole", "nickall"],
			group: "util", // [dev, fortnite, fun, mod, audio, util, media]
			description: "Edit, Manage, Delete multiple Users, Roles, Channels, Messages",
			examples: [
				"USER joinedDate > today AND avatar = null DO kick",
				"CHANNEL category = #Information OR category = null",
				"ROLE permissions.administrator",
				"MESSAGE channel = #general AND content contains spam is fun",
			],
			userPermissions: ["ADMINISTRATOR"],
			clientPermissions: ["ADMINISTRATOR"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			guildOnly: true,
			// if no args, delete the args object COMPLETLY
		});
	}

	help() {
		return {
			embed: {
				description: stripIndents`Edit, Manage, Delete multiple Users, Roles, Channels, Messages
				This is a custom query language to do bulk actions
				The Syntax:`,
				fields: [
					{
						name: "First you write what type you want to manipulate:",
						value: "**USER, CHANNEL, ROLE, MESSAGE**",
					},
					{
						name: "Examples:",
						value: stripIndents`\`\`\`
						USER joinedDate
						CHANNEL category
						ROLE permissions.administrator
						MESSAGE channel
						\`\`\``,
					},
					{
						name: "Then you can filter your selection with the corresponding type Property:",
						value: stripIndents`
						**UserProperties** = @all, joinedDate, permissions, booster, presence, voice, username, avatar, bot, roles, createdDate

						**ChannelProperties** = @all, name, id, createdDate, category, position, type

						**RoleProperties** = @all, color, createdDate, position, permissions, id, name

						**MessageProperties** = @all, author, channel, content, date, edited, id, pinned


						You can specify **sub properties** with a dot after it e.g: 
						property.subproperty
						permissions.administrator
						presence.status
						voice.channel

						**Permissions** = administrator, create_instant_invite, kick_members, ban_members, manage_channels, manage_guild, add_reactions, view_audit_log, priority_speaker, stream, view_channel, send_messages, send_tts_messages, manage_messages, embed_links, attach_files, read_message_history, mention_everyone, use_external_emojis, view_guild_insights, connect, speak, mute_members, deafen_members, move_members, use_vad, change_nickname, manage_nicknames, manage_roles, manage_webhooks, manage_emojis
						
						**Voice** = channel, deaf, mute, streaming
						
						**Presence** = status, game_name
						Possible values for **status**: online, idle, dnd, offline
						
						If you want to check if a user has a role:
						\`\`\`
						USER roles = @Admin
						\`\`\``,
					},
					{
						name: "You can check the property with the following **Arithmetic operators**:",
						value: stripIndents`
						**<** _(test if the property is less than the number you specified)_
						**>** _(test if the property is greater than the number you specified)_
						**=** _(test if the property is the number/text you specified)_
						**contains** _(test if the property contains the text you specified)_`,
					},
					{
						name: "You can check multiple properties with the following **Logical operators**:",
						value: stripIndents`
						**AND** _(Check if all conditions are fulfilled)_
						**OR** _(Check if any condition is fulfilled)_`,
					},
					{
						name: "Examples:",
						value: stripIndents`\`\`\`
						USER joinedDate > today AND presence.status = online

						CHANNEL category = #Information OR category = null

						ROLE permissions.administrator 

						MESSAGE channel = #general AND content contains spam is fun
						\`\`\`(If you don't specify logical operators: ROLE permissions.administrator, it will check only if it exists)
						`,
					},
					{
						name: "At the end you can specify the corresponding type action with: **DO [action]**\n",
						value: stripIndents`
						**UserActions** = ban, send(message), kick, mute, unmute, verify, warn, setNickname(name), addRole(role), removeRole(role), moveChannel(channel), disconnect

						**ChannelActions** = delete, clone, setName(name), setParent(channel), setPosition(position), setTopic(topic), setNSFW(nsfw)

						**RoleActions** = delete, clone, setName(name), setColor(color), setHoist(hoist), setPosition(position)

						**MessageActions** = delete, pin, unpin, react(emoji), _And all **UserActions** for the message author_
						`,
					},
					{
						name: "Action parameters",
						value: stripIndents`If a action has **parameters**, recognizable by the **brackets: ()**
						You can pass parameters by simply writing the value after the action
						`,
					},
					{
						name: "Examples:",
						value: stripIndents`\`\`\`
						USER joinedDate > today AND presence.status = online DO send Hi user_name, you are the winner of our Giveaway on guild_name

						USER joinedDate > today AND avatar = null DO kick

						USER roles = null DO addRole @visitor

						CHANNEL category = #Information OR category = null DO delete

						ROLE permissions.administrator DO setHoist yes

						MESSAGE channel = #general AND content contains spam is fun DO delete
						\`\`\``,
					},
					{
						name: "**Constants**:",
						value: stripIndents`
						**today** (will be replaced with the current day)
						**now** (will be replaced with the current time)
						**@user** (will be replaced with the user id)
						**@role** (will be replaced with the role id)
						**#channel** (will be replaced with the channel id, if you want to specify categorys/voice channels, you need to write their #categoryName I'll try to figure out the right channel)
						**null** (check if the property is undefined/empty/null)
						`,
					},
				],
			},
		};
	}

	getAndsOrs(properties) {
		if (!properties || typeof properties !== "object") throw "properties must be an array";
		var ands = [""];
		var ors = [""];

		function getType() {
			if (lastType === "ands") return ands;
			if (lastType === "ors") return ors;
		}

		var lastType = "ands";

		properties.forEach((prop) => {
			if (prop === "OR") {
				lastType = "ors";
				ors.push("");
				return;
			}
			if (prop === "AND") {
				lastType = "ands";
				ands.push("");
				return;
			}
			var typeArr = getType();
			typeArr[typeArr.length - 1] += " " + prop;
		});
		if (ands[0] && ors[0]) {
			throw "Unfortunately for now only one Logical operator (AND, OR) is supported";
		}
		if (ands[0]) ors = [];
		if (ors[0]) ands = [];
		ors = ors.map((x) => x.trim());
		ands = ands.map((x) => x.trim());
		return { ands, ors };
	}

	resolveProperty(prop, object) {
		try {
			var subproperties = prop.toLowerCase().split(".");
			var subproperty = object;
			for (const subprop of subproperties) {
				subproperty = subproperty[subprop.toLowerCase()];
			}
			return subproperty;
		} catch (error) {
			return null;
		}
	}

	checkProp(query, entry) {
		if (!query || typeof query !== "string") throw "You need to specify a query";

		const operators = ["<", ">", "=", "contains", "includes", "exists"];
		const args = query.split(" ");
		const prop = args[0];

		const property = this.resolveProperty(prop, entry);
		if (property === undefined) {
			throw `Invalid Property: ${prop}\nAvailable properties ${Object.keys(entry).join(", ")}`;
		}

		var check = false;
		var operator = args[1];
		if (!operator) operator = "exists";
		if (!operators.includes(operator)) {
			throw `Invalid operator: ${operator}\nAvailable operators:: ${operators.join(", ")}`;
		}

		var value = args
			.slice(2)
			.join(" ")
			.replace(/<[#@]&?/g, "")
			.replace(">", "");

		if (["true", "t", "yes", "y", "on", "enable", "enabled"].includes(value)) {
			value = true;
		} else if (["false", "f", "no", "n", "off", "disable", "disabled"].includes(value)) {
			value = false;
		}

		const propertyNumber = Number(property);
		const valueNumber = Number(value);

		if (operator == "<" || operator == ">") {
			if (isNaN(propertyNumber)) {
				throw `If you want to compare with (<, >) ${property} needs to be a valid number`;
			}
			if (isNaN(valueNumber)) {
				throw `If you want to compare with (<, >) ${value} needs to be a valid number`;
			}
		}
		if (value === "null") value = null;

		switch (operator) {
			case "=":
				if (typeof property === "object" && Array.isArray(property)) {
					if (value === null) {
						check = property.length === 0;
					} else {
						check = property.find((x) => x === value);
					}
					break;
				}
				check = property == value;
				break;
			case "<":
				check = propertyNumber < valueNumber;
				break;
			case ">":
				check = propertyNumber > valueNumber;
				break;
			case "contains":
			case "includes":
				check = property.toString().toLowerCase().includes(value.toLowerCase());
				break;
			case "exists":
				check = !!property;
				break;
		}

		return check;
	}

	async doProp(query, entry) {
		if (!query || typeof query !== "string") throw "You need to specify a query";

		const args = query.split(" ");
		const prop = args[0];
		var argument = args
			.slice(1)
			.join(" ")
			.replace(/<[#@]&?/g, "")
			.replace(">", "");

		if (["true", "t", "yes", "y", "on", "enable", "enabled"].includes(argument)) {
			argument = true;
		} else if (["false", "f", "no", "n", "off", "disable", "disabled"].includes(argument)) {
			argument = false;
		} else if (argument === "") {
			argument = undefined;
		} else if (argument === "null") {
			argument = null;
		}

		const property = this.resolveProperty(prop, entry);
		if (property == null || prop.includes("self")) {
			throw `Invalid Action: ${prop}\nAvailable actions: ${Object.keys(entry).join(", ")}`;
		}

		return await property.call(entry.self, argument);
	}

	mapPermissions(perms) {
		var permissions = {};
		Object.keys(discord.Permissions.FLAGS).forEach((p) => {
			if (perms.has(p)) {
				permissions[p.toLowerCase()] = true;
			} else {
				permissions[p.toLowerCase()] = false;
			}
		});
		return permissions;
	}

	async customQueryLanguage(query, msg) {
		if (!query || typeof query !== "string") throw "You need to specify a query";
		if (!msg || !msg instanceof Commando.CommandoMessage) throw "You need to specify a message";
		const { guild, client } = msg;
		const { members, channels, roles } = guild;

		const args = query.split(" ");
		const type = args[0].toLowerCase();
		const types = ["user", "channel", "role", "message"];

		if (!types.includes(type)) {
			throw `Invalid type: ${type}\nPossible types: ${types.join(", ")}`;
		}

		var indexDO = args.indexOf("DO");
		if (indexDO === -1) throw "You need to specify a action with: DO";

		const properties = args.slice(1, indexDO);
		const { ands, ors } = this.getAndsOrs(properties);

		const filter = (entry) => {
			if (ands.length) {
				for (const and of ands) {
					if (!this.checkProp(and, entry)) {
						return false;
					}
				}
				return true;
			} else if (ors.length) {
				for (const or of ors) {
					if (this.checkProp(or, entry)) {
						return true;
					}
				}
				return false;
			}
		};

		switch (type) {
			case "user":
				var { mapSelectionFunction, mapDoFunction } = this.typeUser;
				var selection = members.cache.array();
				break;
			case "channel":
				var { mapSelectionFunction, mapDoFunction } = this.typeChannel;
				var selection = channels.cache.array();
				break;
			case "role":
				var { mapSelectionFunction, mapDoFunction } = this.typeRole;
				var selection = roles.cache.array();
				break;
			case "message":
				var { mapSelectionFunction, mapDoFunction } = this.typeMessage;
				var channel = ands.find((x) => x.split(" ")[0] === "channel");
				var selection = [];
				if (!channel) {
					var textChannels = channels.cache.filter((c) => c.type === "text");
					var question = await msg.reply(
						`You didn't specify any channel\nDo you really want to continue and fetch the last 100 messages of ${textChannels.size} channels?\nThis will take approximately ${textChannels.size} seconds`
					);
					question.react("✅");
					question.react("❌");
					var reaction = await question
						.awaitReactions((r, user) => ["✅", "❌"].includes(r.emoji.name) && user.id === msg.author.id, {
							errors: ["time"],
							max: 1,
							time: 1000 * 60,
						})
						.catch((e) => {
							throw "Timeout for reaction exceeded";
						});
					reaction = reaction.first();
					question.reactions.removeAll();
					if (reaction.emoji.name === "✅") {
						question.edit(
							`Fetching ~ ${100 * textChannels.size} messages in ${textChannels.size} channels`,
							{ title: "Query" }
						);
						var start = Date.now();
						selection = await Promise.all(
							textChannels.map(async (channel) => {
								return await channel.messages.fetch({ limit: 100 }, false);
							})
						);
						selection = selection.map((x) => x.array()).flat();
						var seconds = (Date.now() - start) / 1000;
						question.edit(`Fetched ${selection.length} messages in ${seconds} seconds`, { title: "Query" });
					} else if (reaction.emoji.name === "❌") {
						throw "Aborting Query";
					}
				} else {
					channel = channel.split(" ")[2].replace("<#", "").replace(">", "");
					if (!channel) throw "Invalid operator";
					channel = await client.channels.fetch(channel);
					if (!channel) throw "Channel not found";
					if (channel.type !== "text") throw "Not a text channel";
					selection = await channel.messages.fetch({ limit: 100 }, false);
				}

				break;
		}

		var entries = selection.map(mapSelectionFunction.bind(this)).filter(filter);

		var question = await msg.reply({ content: `Do you really want to modify ${entries.length} ${type}s?` });
		question.react("✅");
		question.react("❌");
		var reaction = await question
			.awaitReactions((r, user) => ["✅", "❌"].includes(r.emoji.name) && user.id === msg.author.id, {
				errors: ["time"],
				max: 1,
				time: 1000 * 60,
			})
			.catch((e) => {
				throw "Timeout for reaction exceeded";
			});
		reaction = reaction.first();
		if (reaction.emoji.name === "✅") {
			reaction.remove();
			var DO = args.slice(indexDO + 1).join(" ");
			var success = 0;
			var errors = [];
			var aborted = false;

			var collector = question.createReactionCollector(
				(r, user) => "❌" === r.emoji.name && user.id === msg.author.id,
				{ max: 1 }
			);

			collector.on("collect", () => {
				aborted = true;
				collector.stop();
			});

			var interval = setInterval(() => {
				var err = errors.length ? "```" + errors[0].toString() + "```" : "";
				question.edit(
					`Query executing with **${errors.length} errors** and **${success} successful** of **${entries.length} total** actions${err}
					Be aware that the bot can only execute **two action every 1 second**
					React with ❌ to abort the query`,
					{
						title: "Query",
						embed: {
							author: {
								name: "Executing",
								icon_url: this.client.savedEmojis.searching.url,
							},
						},
					}
				);
			}, 1000 * 2);

			for (const entry of entries.map(mapDoFunction.bind(this))) {
				if (aborted) {
					clearInterval(interval);
					break;
				}
				// await new Promise((res) => setTimeout(res, 1000));
				try {
					await this.doProp(DO, entry);
					success++;
				} catch (error) {
					errors.push(error);
				}
			}

			clearInterval(interval);
			collector.stop();
			question.reactions.removeAll();

			question.edit(
				`Query executed with **${errors.length} errors** and **${success} successful** executions
				${errors.length ? "```" + errors[0].toString() + "```" : ""}`,
				{
					title: aborted ? "Query aborted" : "Query",
					embed: {
						author: {
							name: aborted ? "Aborted" : "Executed",
							icon_url: this.client.savedEmojis.success.url,
						},
					},
				}
			);
		} else if (reaction.emoji.name === "❌") {
			question.reactions.removeAll();
			question.edit("Aborting Query", { title: "Bulk" });
		}
	}

	async run(msg, args) {
		var { client, guild, content, channel, author, member } = msg;
		msg.reply(this.help());
		msg.reply(
			"**Interactive mode enabled**, you can now test the bulk command without you having to enter the command.\nEnter ``cancel`` to **exit** interactive mode.\nThis mode will automatically be canceled in 10 minutes"
		);
		var content = "";
		while (true) {
			var collected = await channel
				.awaitMessages((msg) => msg.author.id === author.id, {
					errors: ["time"],
					max: 1,
					time: 1000 * 60 * 10,
				})
				.catch((e) => {
					throw "Interactive mode timeout exceeded";
				});
			collected = collected.first();
			content = collected.content;
			if (["quit", "cancel", "exit", `${guild.commandPrefix}bulk`].includes(content)) {
				if (content.includes("bulk")) {
					msg.reply("Interactive mode of the previous bulk message quit");
					break;
				}
				msg.reply("Interactive mode quit");
				break;
			}

			await this.customQueryLanguage(content, msg).catch((e) => {
				msg.reply(e.toString(), {
					author: { name: "Error", icon_url: client.savedEmojis.error.url },
					footer: null,
				});
			});
		}
	}

	typeUser = {
		mapSelectionFunction(m) {
			const { bot, avatar, username, createdAt: createdDate } = m.user;
			if (m.voice) {
				var { mute, channel, deaf, streaming } = m.voice;
				if (channel) channel = this.typeChannel.mapSelectionFunction(channel);
				var voice = {
					mute,
					channel,
					deaf,
					streaming,
				};
			} else {
				var voice = null;
			}

			const game_name = m.presence.activities.length ? m.presence.activities[0].name : null;
			const { status } = m.presence;
			const presence = { status, game_name };
			const rolesId = m.roles.cache
				.array()
				.map((role) => role.id)
				.filter((x) => x !== m.guild.roles.everyone.id);
			const permissions = this.mapPermissions(m.permissions);

			return {
				"@all": true,
				joinedDate: m.joinedTimestamp,
				permissions,
				booster: m.premiumSinceTimestamp,
				presence,
				voice,
				username,
				avatar,
				bot,
				roles: rolesId,
				createdDate,
				actions: m,
			};
		},
		mapDoFunction(_) {
			var member = _.actions;
			var { ban, kick, voice, roles, send, setNickname } = member;

			var newsend = function (text) {
				return send.call(this, text, { title: "Message" });
			};

			var { add: addRole, remove: removeRole } = roles;

			removeRole = removeRole.bind(roles);
			addRole = addRole.bind(roles);

			if (voice) {
				var { setMute, setChannel: moveChannel, kick: disconnect } = voice;
				var mute = setMute.bind(voice, true);
				var unmute = setMute.bind(voice, false);
				moveChannel = moveChannel.bind(voice);
				disconnect = disconnect.bind(voice);
			} else {
				var mute = (unmute = moveChannel = disconnect = function () {
					throw "Member is not in a voice channel";
				});
			}

			return {
				mute,
				unmute,
				movechannel: moveChannel,
				disconnect,
				ban,
				kick,
				addrole: addRole,
				removerole: removeRole,
				setnickname: setNickname,
				send: newsend,
				self: member,
			};
		},
	};

	typeChannel = {
		mapSelectionFunction(channel) {
			const { name, id, createdTimestamp: createdDate, parentID: category, position, type } = channel;

			return {
				"@all": true,
				name,
				id,
				createdDate,
				category,
				position,
				type,
				actions: channel,
			};
		},
		mapDoFunction(_) {
			var c = _.actions;
			var { clone, setName, setParent, setPosition, setTopic, setNSFW } = c;
			var del = c.delete;

			return {
				delete: del,
				clone,
				setname: setName,
				setparent: setParent,
				setposition: setPosition,
				settopic: setTopic,
				setnsfw: setNSFW,
				self: c,
			};
		},
	};

	typeRole = {
		mapSelectionFunction(role) {
			const { name, id, color, createdTimestamp: createdDate, position } = role;
			const permissions = this.mapPermissions(role.permissions);

			return {
				"@all": true,
				name,
				id,
				color,
				createdDate,
				position,
				permissions,
				actions: role,
			};
		},
		mapDoFunction(_) {
			var role = _.actions;
			var { clone, setName, setColor, setHoist, setPosition } = role;
			var del = role.delete;

			return {
				delete: del,
				clone,
				setname: setName,
				setcolor: setColor,
				sethoist: setHoist,
				setposition: setPosition,
				self: role,
			};
		},
	};

	typeMessage = {
		mapSelectionFunction(message) {
			const { content, createdTimestamp: date, editedTimestamp: edited, id, pinned } = message;
			const author = message.author.id;
			const channel = message.channel.id;
			var text = content;

			if (message.embeds && message.embeds.length && message.embeds[0]) {
				text += message.embeds[0].description || "";
				text += message.embeds[0].title || "";
				if (message.embeds[0].fields && message.embeds[0].fields.length) {
					message.embeds[0].fields.forEach((field) => {
						text += field.name || "";
						text += field.value || "";
					});
				}
			}

			return {
				id,
				content: text,
				date,
				edited,
				pinned,
				author,
				channel,
				actions: message,
			};
		},
		mapDoFunction(_) {
			var message = _.actions;
			var { pin, unpin, react, member } = message;
			var del = message.delete;

			if (member) {
				var { ban, kick, voice, roles, send, setNickname } = member;
				ban = ban.bind(member);
				kick = kick.bind(member);
				send = send.bind(member);
				var newsend = function (text) {
					return send.call(this, text, { title: "Message" });
				};
				setNickname = setNickname.bind(member);

				var { add: addRole, remove: removeRole } = roles;

				removeRole = removeRole.bind(roles);
				addRole = addRole.bind(roles);

				if (voice) {
					var { setMute, setChannel: moveChannel, kick: disconnect } = voice;
					var mute = setMute.bind(voice, true);
					var unmute = setMute.bind(voice, false);
					moveChannel = moveChannel.bind(voice);
					disconnect = disconnect.bind(voice);
				} else {
					var mute = (unmute = moveChannel = disconnect = function () {
						throw "Member is not in a voice channel";
					});
				}
			} else {
				var setMute = (moveChannel = removeRole = setNickname = kick = ban = disconnect = moveChannel = unmute = mute = newsend = () => {});
			}

			return {
				pin,
				unpin,
				react,
				delete: del,
				mute,
				unmute,
				movechannel: moveChannel,
				disconnect,
				ban,
				kick,
				addrole: addRole,
				removerole: removeRole,
				setnickname: setNickname,
				send: newsend,
				self: message,
			};
		},
	};
};
