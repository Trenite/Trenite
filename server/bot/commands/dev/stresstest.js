const commando = require("discord.js-commando");
const ytdl = require("../../extra/ytdl-core-discord");

module.exports = class StresstestCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "stresstest",
			memberName: "stresstest",
			aliases: [],
			group: "dev",
			description: "stresstest the bot and joins many channels to play music",
			examples: ["stresstest https://youtu.be/LlY90lG_Fuw single"],
			devOnly: true,
			args: [
				{
					key: "link",
					prompt: "YouTube link to play",
					type: "string",
				},
				{
					key: "mode",
					prompt:
						"Mode of stresstest: broadcast or single?\nbroadcast: download the music once and play it in all channels\nsingle: download the music for every guild individually",
					type: "string",
				},
			],
		});
	}

	async run(msg, args) {
		const { client } = msg;
		const { link, mode } = args;
		if (!mode || !["single", "broadcast"].includes(mode)) {
			msg.reply("Wrong mode");
			return;
		}
		console.log("stresstest in " + client.guilds.cache.size);

		if (mode === "broadcast") {
			var voiceBroadcast = Client.voice.createBroadcast();
			voiceBroadcast.on("error", console.error);
			voiceBroadcast.on("warn", console.warn);
			var result = await ytdl(link);
			const download = result.download;
			const demuxer = result.demuxer;
			var type = !download ? "unknown" : "opus";
			const dispatcher = voiceBroadcast.play(demuxer, {
				type,
				volume: 1,
				bitrate: 64,
			});
			dispatcher.on("debug", console.log);
			dispatcher.on("error", console.error);
		}

		client.guilds.cache.forEach(async (g) => {
			var voice = g.channels.cache.find((c) => c.type === "voice" && c.joinable);
			if (voice) {
				var voiceConnection = await voice.join();
				if (mode === "single") {
					var result = await ytdl(link);
					const download = result.download;
					const demuxer = result.demuxer;
					var type = !download ? "unknown" : "opus";
					var dispatcher = voiceConnection.play(demuxer, {
						type,
						volume: true,
						bitrate: 64,
					});
					dispatcher.on("debug", console.log);
					dispatcher.on("error", console.error);
				} else if (mode === "broadcast") {
					voiceConnection.playBroadcast(voiceBroadcast);
				}
			}
		});

		msg.reply("OK playing in " + client.guilds.size + " guilds");
	}
};
