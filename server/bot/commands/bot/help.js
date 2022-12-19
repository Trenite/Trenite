const { stripIndents, oneLine } = require("common-tags");
const Command = require("discord.js-commando").Command;

function disambiguation(items, label, property = "name") {
	const itemList = items.map((item) => `${(property ? item[property] : item).replace(/ /g, "\xa0")}`).join("\n");
	return `Multiple ${label} found, please be more specific:\n\`\`\`${itemList}\`\`\``;
}

module.exports = class HelpCommand extends Command {
	constructor(client) {
		super(client, {
			name: "help",
			group: "bot",
			memberName: "help",
			aliases: ["commands"],
			description: "Displays a list of available commands, or detailed information for a specified command.",
			examples: ["help", "help music"],
			guarded: true,
			clientPermissions: ["SEND_MESSAGES"],
			args: [
				{
					key: "command",
					prompt: "Which command would you like to view the help for?",
					type: "string",
					default: "",
				},
			],
		});
	}

	async run(msg, args, lang) {
		// eslint-disable-line complexity
		const groups = this.client.registry.groups;
		const commands = this.client.registry.findCommands(args.command, false, msg);
		const showAll = args.command && args.command.toLowerCase() === "all";
		if (args.command && !showAll) {
			if (commands.length === 1) {
				const command = commands[0];
				if (msg.guild) var language = command.lang(msg.guild);
				else var language = command.lang({ lang: this.client.en });
				language = language || {};
				var name = language.name || command.name;
				var description = language.description || command.description;
				var aliases = [...(language.aliases || []), ...(command.aliases || [])];
				var examples = language.examples || command.examples;
				var details = language.details || command.details;

				let help = stripIndents`
					${oneLine`
						__${lang.command} **${name}**:__ ${description}
						${command.guildOnly ? ` (${lang.serveronly})` : ""}
						${command.nsfw ? ` (${lang.nsfw})` : ""}
					`}

					**${lang.format}** ${msg.anyUsage(`${name}${command.format ? ` ${command.format}` : ""}`)}
				`;
				if (aliases.length > 0) help += `\n**${lang.alias}** ${aliases.join(", ")}`;
				help += `\n${oneLine`
					**Group:** ${command.group.name}
					(\`${command.groupID}:${name}\`)
				`}`;
				if (details) help += `\n**${lang.details}** ${details}`;
				if (examples) help += `\n**${lang.example}**\n${examples.join("\n")}`;

				try {
					await msg.reply(help);
				} catch (err) {}
			} else if (commands.length > 15) {
				return msg.reply(lang.multiplecmds);
			} else if (commands.length > 1) {
				return msg.reply(disambiguation(commands, "commands"));
			} else {
				return msg.reply(
					lang.notfound.replace(
						"{usage}",
						msg.usage(
							null,
							msg.channel.type === "dm" ? null : undefined,
							msg.channel.type === "dm" ? null : undefined
						)
					)
				);
			}
		} else {
			var helpText = stripIndents`
			${lang.anyserver
				.replace("{server}", msg.guild ? msg.guild.name : "any server")
				.replace(
					"{usage}",
					Command.usage("command", msg.guild ? msg.guild.commandPrefix : null, this.client.user)
				)
				.replace(
					"{example}",
					Command.usage("prefix", msg.guild ? msg.guild.commandPrefix : null, this.client.user)
				)
				.replace("{dm}", Command.usage("command", null, null))
				.replace("{specific}", this.usage("<command>", null, null))
				.replace("{all}", this.usage("all", null, null))}

				**${showAll ? lang.allcommands : lang.availablecmd.replace("{channel}", msg.guild || "this DM")}**`;

			var fields = [];

			var groupIterator = showAll
				? groups
				: groups.filter((grp) => grp.commands.some((cmd) => cmd.isUsable(msg)));

			groupIterator = msg.channel.nsfw ? groupIterator : groupIterator.filter((grp) => grp.id !== "nsfw");

			groupIterator.forEach((grp) => {
				var cmds = showAll ? grp.commands : grp.commands.filter((cmd) => cmd.isUsable(msg));

				fields.push({
					name: this.client.meltic
						? grp.name
						: grp.name.replace(/<:\w+:\d+>( • )?/g, "") + ` (**${cmds.size}**)`,
					inline: true,
					value:
						"```\n" +
						stripIndents`${cmds
							.sort((a, b) => a.memberName.localeCompare(b.memberName))
							.map((cmd) => {
								var language = cmd.lang(msg.guild);
								var name = language.name;
								if (language.name === cmd.name) name = false;

								var name = name ? name + ` (${cmd.name})` : cmd.name;

								return `${name}`;
								// return `${name}${cmd.nsfw ? ` (${lang.nsfw})` : ""}`;
							})
							.join("\n")}` +
						"\n```",
				});
			});

			var embed = {
				description: helpText,
				fields,
			};

			await msg.reply({ embed });
		}
	}
};
