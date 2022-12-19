const axios = require("axios").default;
const fetch = require("node-fetch");
const { Command } = require("discord.js-commando");

module.exports = class ttsCommand extends Command {
	constructor(client) {
		super(client, {
			name: "tts",
			memberName: "tts",
			aliases: [],
			group: "audio",
			description: "Text to Speech",
			examples: ["tts"],
			clientPermissions: ["SPEAK", "CONNECT"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
			args: [
				{
					key: "text",
					prompt: "Which text should I say?\nEnter ``interactive`` to enable the interactive mode.",
					type: "string",
					wait: 60,
				},
			],
		});
	}

	async tts({ text, connection, msg }) {
		var language = msg.guild.lang.short;
		return connection.play(
			`https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${language}&q=${encodeURIComponent(
				text
			)}`,
			{ volume: 2 }
		);
	}

	async interactive(msg) {
		var interactive = await msg.reply(msg.lang.interactive);
		interactive.react("❌");
		var stopped = false;
		var connection = await msg.member.voice.channel.join();

		var reactor = interactive.createReactionCollector((reaction, user) => {
			if (reaction.emoji.name === "❌" && !user.bot) {
				stopped = true;
				reactor.stop();
				collector.stop();
				connection.disconnect();
				interactive.delete();
			}
		});
		var collector = msg.channel.createMessageCollector(() => !stopped);
		collector.on("collect", async (m) => {
			const dispatcher = await this.tts({ text: m.content, connection, msg });
		});
	}

	async run(msg, args, lang) {
		var { client, guild } = msg;
		const text = args.text;
		if (!msg.member.voice.channel) throw lang.novoice;

		var connection = await msg.member.voice.channel.join();

		if (text === "interactive") return this.interactive(msg);

		const dispatcher = await this.tts({ text, connection, msg });

		var message = await msg.channel.send({
			title: lang.tts,
			embed: {
				fields: [
					{
						name: lang.content,
						value: text,
					},
					{ name: lang.voicechannel, value: "#" + connection.channel.name },
					{ name: lang.status, value: lang.saying },
				],
				color: 7506394,
			},
		});

		dispatcher.on("finish", async () => {
			// connection.disconnect(); // dont disconnect if finished -> annoying
			await message.edit({
				title: lang.tts,
				embed: {
					fields: [
						{
							name: lang.content,
							value: text,
						},
						{
							name: lang.voicechannel,
							value: "#" + connection.channel.name,
						},
					],
					color: 7506394,
				},
			});
		});

		dispatcher.on("error", () => {
			connection.disconnect();
		});
	}
};
