const commando = require("discord.js-commando");
const ytdl = require("../../extra/ytdl-core-discord");
const { getInfo } = require("ytdl-core");
// const ytdl = require("ytdl-core");
const searchYoutube = require("youtube-api-v3-search");
const spotifyApi = require("../../extra/spotifyApi");
const fetch = require("node-fetch");
const { oneLine, stripIndents } = require("common-tags");
const Transform = require("stream").Transform;

global.skip = false;
global.seek = new Transform({
	decodeStrings: false,
	transform(chunk, encoding, done) {
		if (global.skip) done(null, Buffer.alloc(0));
		else done(null, chunk);
	},
});

var youtubeLink = /https?:\/\/(www.)?youtu.?be(.com)?\/(watch\?v=)?([\w]+)/g;

module.exports = class MusicCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "music",
			memberName: "music",
			group: "audio",
			aliases: [],
			description: "Creates a Music Player",
			examples: [
				`React with:
				⏯ to pause and resume
				⏹ to clear the queue
				⏮ to skip back to the previous song
				⏭ to skip
				🔀 to shuffle the queue
				🔁 to repeat the queue
				🔂 to hear the song in continuous loop
				🔎 to search for song (spotify, youtube)
				🔉 to turn down the volume
				🔊 to turn up the volume
				<:spotify:690172298346496116> to sync your spotify account and hear it in discord with your friends`,
			],
			guildOnly: true,
			userPermissions: ["SPEAK", "CONNECT", "MANAGE_CHANNELS"],
			clientPermissions: ["SEND_MESSAGES", "SPEAK", "CONNECT", "MANAGE_CHANNELS"],
		});

		this.settings = {};

		client.once("providerReady", () => {
			client.guilds.cache.forEach(this.fetch.bind(this));
			client.on("voiceStateUpdate", this.onVoiceUpdate);
		});

		this.spotifyApi = spotifyApi
			.setup()
			.then((token) => {
				spotifyApi.setToken(token);
			})
			.catch(console.error);
	}

	convertSecondsToTimestamp(seconds) {
		if (seconds >= 3600) {
			return new Date(seconds * 1000).toISOString().slice(11, -5);
		} else {
			return new Date(seconds * 1000).toISOString().slice(14, -5);
		}
	}

	onVoiceUpdate(oldState, newState) {}

	createMessage(guild, info, extra, about) {
		var lang = this.lang(guild);
		const { msg, queue, options } = this.settings[guild.id];
		if (guild.voice) {
			var connection = guild.voice.connection;
			if (connection) {
				var { dispatcher } = connection;
			}
		}

		var description = about || "";

		if (queue && queue.length > 0) {
			for (var song of queue) {
				var text = `[${song.name}](${song.link})\n`;
				if ((description + text).length > 2044) {
					description += "...";
					break;
				} else {
					description += text;
				}
			}
		}

		var volume = options.volume || 0;

		var hasEmoji = this.client.emojis.resolve("726881499147796520");
		if (hasEmoji) {
			var v = `🔇 `;
			var i = 0;
			var max = 1;
			var min = 0;
			var step = 0.1;

			for (i = min + step; i <= volume; i += step) {
				i = Number((Math.round(i * 10) / 10).toFixed(1));
				if (i === min + step) {
					v += "<:baronstart:726881675602165771>";
				} else if (i === max) {
					v += "<:baronend:726881394294521948>";
				} else {
					v += "<:baron:726881487101624330>";
				}
			}

			if (volume === min) {
				v += "<:baroffstart:726881499147796520>";
				i += step;
			}

			for (var j = i; j <= max; j += step) {
				j = Number((Math.round(j * 10) / 10).toFixed(1));
				if (j === max) {
					v += "<:baroffend:726881432345116732>";
				} else {
					v += "<:baroff:726881453622689822>";
				}
			}

			v += " 🔊";

			volume = v;
		}

		if (msg.updateAuthor) {
			info = msg.updateAuthor;
		}

		var author = {};

		if (dispatcher && !dispatcher.paused) {
			author = {
				name: lang.playing,
				icon_url: "https://thumbs.gfycat.com/BlushingBrownLamb-max-1mb.gif",
			};
		} else {
			author = {
				name: lang.paused,
				icon_url: "https://i.imgur.com/oe2nh2R.png",
			};
		}

		var time = "00:00 🔘───────────────────────────── 00:00";
		// "0:48 |----------+-----------| 3:18";
		if (queue && queue.length > 0 && dispatcher) {
			var song = queue[0];
			var total = song.duration;
			var played = dispatcher;
			var seconds = 5;

			if (played) {
				played = played.streamTime / 1000;
			} else {
				played = 0;
			}

			var seek = this.convertSecondsToTimestamp(0) + " ";

			if (total === 0) {
				time = lang.live;
			} else {
				seek += "🔘─────────────────────────────";
				// for (var i = 0; i < played; i += seconds) {
				// 	seek += "─";
				// }
				// seek += "🔘";
				// for (var i = played; i < total; i += seconds) {
				// 	seek += "─";
				// }
				seek += " " + this.convertSecondsToTimestamp(total);
				time = seek;
			}
		} else {
			author = {
				name: lang.empty,
				icon_url: "https://i.ibb.co/6JMSqPd/minus-square-regular.png",
			};
		}

		switch (info) {
			case "entersearch":
				author = {
					name: "YouTube/Spotify link/search ...",
					icon_url:
						"https://i.ya-webdesign.com/images/pointer-transparent-blinking-11.gif",
				};
				break;
			case "searching":
				author = {
					name: "Searching ...",
					icon_url: "https://i.imgur.com/mFalBNg.gif",
				};
				break;
			case "error":
				author = {
					name: extra,
					icon_url: "https://www.freeiconspng.com/uploads/error-icon-4.png",
				};
				break;
		}

		return commando.createMessage(guild, description, {
			title: lang.musicplayer,
			embed: {
				author,
				fields: [
					{
						name: lang.volume,
						value: volume,
					},
					{
						name: lang.loopsong,
						value: options.loop,
						inline: true,
					},
					{
						name: lang.repeatqueue,
						value: options.repeat,
						inline: true,
					},
					{
						name: lang.time,
						value: "```json\n" + time + "```",
					},
				],
			},
		});
	}

	async reaction(guild, reaction, user) {
		try {
			var lang = this.lang(guild);
			var { msg, queue, options, lastqueue, channel } = this.settings[guild.id];
			const member = guild.member(user);

			const removeReaction = "spotify,🔎,🔀,⏯,⏹,⏭,⏮,🔁,🔂,🔉,🔊";

			if (removeReaction.split(",").includes(reaction.emoji.name)) {
				reaction.users.remove(user);
			}

			if (!member.voice || !member.voice.channel) {
				return await channel
					.send(lang.joinvoicechannel.replace("{member}", `${member}`))
					.then((x) => x.delete({ timeout: 4000 }));
			}

			if (!guild.voice || !guild.voice.channel) {
				await member.voice.channel.join();
			}

			var connection = guild.voice.connection;
			if (!connection) connection = await guild.voice.channel.join();

			var dispatcher = connection.dispatcher;
			const filter = (m) => m.author.id === user.id;
			const awaitMessagesOptions = { maxProcessed: 1, time: 30000, errors: ["time"] };

			var step = 0.1; // volume down/up steps

			switch (reaction.emoji.name) {
				case "spotify":
					break;
				case "🔎":
					msg.updateAuthor = "entersearch";
					msg.edit(this.createMessage(guild, "entersearch"));

					var answer = await channel.awaitMessages(filter, awaitMessagesOptions);
					msg.updateAuthor = false;

					answer = answer.first();
					answer.delete();
					answer = answer.content;
					this.processSearch(answer, guild);

					break;
				case "🔀":
					for (let i = 1; i < queue.length - 1; i++) {
						const j = Math.floor(Math.random() * (i + 1)) + 1;
						[queue[i], queue[j]] = [queue[j], queue[i]];
					}
					break;
				case "🔁":
					options.repeat = !options.repeat;
					break;
				case "🔂":
					options.loop = !options.loop;
					break;
				case "⏯":
					if (!dispatcher) return;
					var connection = guild.voice.connection;
					if (dispatcher.paused) {
						dispatcher.resume();
					} else {
						dispatcher.pause(true);
					}
					break;
				case "⏹":
					lastqueue = queue;
					queue = [];
					this.stopDownload(guild);
					connection.disconnect();
					break;
				case "⏭":
					this.stopDownload(guild);
					break;
				case "⏮":
					if (lastqueue.length > 0) {
						var t = lastqueue.pop();
						queue.splice(1, 0, t);
						queue.splice(2, 0, queue[0]);
						this.stopDownload(guild);
						setTimeout(() => {
							lastqueue.pop();
						}, 500);
					}
					break;
				case "🔉":
					var newVolume = Number((options.volume - step).toFixed(1));
					if (newVolume >= 0.0) {
						options.volume = newVolume;
						if (dispatcher) dispatcher.setVolume(newVolume - 0.06);
					}
					break;
				case "🔊":
					var newVolume = Number((options.volume + step).toFixed(1));
					if (newVolume <= 1) {
						options.volume = newVolume;
						if (dispatcher) dispatcher.setVolume(newVolume - 0.06);
					}
					break;
			}

			this.settings[guild.id] = { ...this.settings[guild.id], queue, lastqueue, options };

			msg.edit(this.createMessage(guild));
		} catch (error) {
			msg.updateAuthor = false;
			try {
				msg.edit(this.createMessage(guild, "error", error));
			} catch (error) {
				console.error(error);
			}
		}
	}

	stopDownload(guild) {
		var connection = guild.voice.connection;
		if (connection.download) {
			connection.download.destroy();
		}
		if (connection.demuxer) {
			connection.demuxer.destroy();
		}
		if (connection.dispatcher) {
			connection.dispatcher.end();
		}
	}

	randomKey() {
		var keys = this.client.config.google.youtube;
		return keys[Math.floor(Math.random() * keys.length)];
	}

	async getSongs(search, guild) {
		var lang = this.lang(guild);
		var url = search.startsWith("https://") ? search : null;
		var songs = [];
		var provider;
		var link = url;
		var duration;
		var name;
		var img;
		var author;

		// podcast track https://open.spotify.com/episode/1ppgGZSj2sLMz0n1q1Ltna
		// podcast show https://open.spotify.com/show/0drocFkvMxAt0P8MFTMZmk
		// https://open.spotify.com/track/0UzJBnSUySLPyFuTN2uk8M?si=TzaCxJFsTdaDAubgGSj1tQ

		if (url && url.startsWith("https://open.spotify.com/")) {
			var playlist;
			var type = spotifyApi.parser(search);
			var trackid = spotifyApi.removeQuery(url.replace("https://open.spotify.com/", ""));
			provider = "spotify";

			switch (type) {
				case "song":
					trackid = trackid.replace("track/", "");
					const songData = await spotifyApi.extractTrack(trackid);
					const songName = songData.name + songData.artists[0];
					var result = await searchYoutube(this.randomKey(), {
						q: songName,
						type: "video",
						part: "snippet",
					});
					if (result.error) throw result.error;

					if (!result || result.items.length <= 0) {
						throw lang.songnotfound;
					}

					result = result.items[0];
					duration = 0;
					name = result.snippet.title;
					link = `https://youtube.com/watch?v=${result.id.videoId}`;
					img = result.snippet.thumbnails.high.url;
					author = result.snippet.channelTitle;
					songs.push({ name, img, author, duration, link, provider });
					break;
				case "playlist":
					trackid = trackid.replace("playlist/", "");
					playlist = await spotifyApi.extractPlaylist(trackid);

					break;
				case "album":
					trackid = trackid.replace("album/", "");
					playlist = await spotifyApi.extractAlbum(trackid);
					break;
			}

			if (type === "playlist" || type === "album") {
				if (!playlist || playlist.tracks.length <= 0) {
					throw lang.playlistnotfound;
				}
				playlist = playlist.tracks;
				var pending = playlist.length;
				var resolve;
				await new Promise((resolve) => {
					playlist.forEach(async (track) => {
						try {
							var song = await this.getSongs(
								"https://open.spotify.com/track/" + track,
								guild
							);
						} catch (error) {}
						pending--;
						if (song && song.length > 0) {
							songs.push(song[0]);
						}
						if (pending <= 0) {
							resolve(songs);
						}
					});
				});

				console.log("found " + songs.length + " songs in playlist");

				return songs;
			}
		} else if (search.startsWith("http") && !search.match(youtubeLink)) {
			songs.push({
				name: search,
				img: "",
				author: "",
				duration: 0,
				link: search,
				provider: "other",
			});
		} else {
			var isYoutube = search.replace(youtubeLink, "$4");
			if (isYoutube === search) {
				var result = await searchYoutube(this.randomKey(), {
					q: search,
					type: "video",
					part: "snippet",
				});
				if (result.error) throw result.error;

				if (!result || result.items.length <= 0) {
					throw lang.songnotfound;
				}

				result = result.items[0];
				duration = 0;
				name = result.snippet.title;
				link = `https://youtube.com/watch?v=${result.id.videoId}`;
				img = result.snippet.thumbnails.high.url;
				author = result.snippet.channelTitle;
			} else {
				var result = await getInfo(search).catch((e) => {
					throw lang.songnotfound;
				});
				var {
					title: name,
					thumbnail: img,
					author,
					video_url: link,
					lengthSeconds: duration,
				} = result.videoDetails;
				author = author.name;
				img = img.thumbnails[img.thumbnails.length - 1].url;
				duration = Number(duration);
			}
			songs.push({ name, img, author, duration, link, provider: "youtube" });
		}

		return songs;
	}

	async handle(guild) {
		try {
			const { msg, queue, lastqueue, image, options, voiceChannel } = this.settings[guild.id];

			this.client.provider.set(guild, "musicqueue", queue);

			if (!queue || queue.length <= 0) {
				msg.edit(this.createMessage(guild));
				image.edit({
					title: "Music",
					embed: {
						author: null,
						footer: null,
						color: 3619135,
						image: {
							url:
								"https://cdn2.iconfinder.com/data/icons/shopping-and-retail-01-mix/168/list_clipboard_document_note_paper_white_report_curve_form_blank_empty-512.png",
						},
					},
				});
				try {
					if (guild.voice && guild.voice.channel) await guild.voice.channel.leave();
				} catch (error) {}
				return;
			}

			const { provider, link, name, img, duration, author } = queue[0];

			image.edit({
				title: "Music",
				embed: {
					author: null,
					footer: null,
					color: 3619135,
					image: { url: img },
				},
			});

			if (!guild.voice) {
				if (!voiceChannel) {
					// TODO
				}
				await voiceChannel.join();
			} else {
				if (!guild.voice.connection) await guild.voice.channel.join();
			}
			var connection = guild.voice.connection;
			if (connection.download) {
				connection.download.destroy();
			}
			if (connection.dispatcher) {
				connection.dispatcher.end();
			}

			var dispatcher;

			switch (provider) {
				case "spotify":
				case "youtube":
					var result = await ytdl(link);
					const download = result.download;
					const length = result.length;
					if (length) queue[0].duration = length;
					const demuxer = result.demuxer;
					var type = !download ? "unknown" : "opus";

					// volume for premium?
					// maxbitrate for premium

					dispatcher = connection.play(demuxer, {
						type,
						volume: options.volume,
						bitrate: 64,
						fec: true,
					});

					connection.download = download;
					connection.demuxer = demuxer;

					break;
				case "other":
					dispatcher = connection.play(link, {
						volume: options.volume,
						bitrate: 64,
						fec: true,
					});

					break;
				default:
					return;
			}

			dispatcher
				.on("error", (e) => {
					console.error(e);
					msg.reply("Unkown error");
				})
				.on("finish", () => {
					if (!options.loop) {
						lastqueue.push(queue[0]);
						queue.splice(0, 1);
					}
					this.handle(guild);
				})
				.on("debug", console.log);

			msg.edit(this.createMessage(guild));

			this.client.provider.set(guild, "musicvoicechannel", guild.voice.channel.id);
		} catch (error) {
			console.error(error);
		}
	}

	async processSearch(search, guild) {
		if (!search) return;
		try {
			const { msg, channel, queue } = this.settings[guild.id];
			var searching = channel.send(search, { title: "Searching" });
			var songs = await this.getSongs(search, guild);
			songs.forEach((song) => {
				queue.push(new QueueItem(song));
			});
			await (await searching).delete();
			msg.edit(this.createMessage(guild));
			if (!guild.voice.connection) await guild.voice.channel.join();
			if (!guild.voice.connection.dispatcher) {
				this.handle(guild);
			}
		} catch (error) {
			if (searching) await (await searching).delete();
			await this.settings[guild.id].channel
				.send(error.toString(), { title: "Error" })
				.then((x) => x.delete({ timeout: 6000 }))
				.catch(console.error);
		}
	}

	initSettings(guild) {
		if (!this.settings[guild.id]) {
			this.settings[guild.id] = {
				options: {
					loop: false,
					repeat: false,
					volume: 0.1,
				},
				lastqueue: [],
				msg: {},
				queue: [],
				channel: {},
			};
		}
		return this.settings[guild.id];
	}

	async fetch(guild) {
		try {
			const { client } = guild;
			this.initSettings(guild);

			var options = client.provider.get(guild, "musicoptions");
			if (options) this.settings[guild.id].options = options;

			var queue = client.provider.get(guild, "musicqueue") || [];
			this.settings[guild.id].queue = queue;

			var musicchannel = client.provider.get(guild, "musicchannel");
			if (!musicchannel) return;
			musicchannel = await guild.channels.resolve(musicchannel);
			if (!musicchannel) return;

			var musicmsg = client.provider.get(guild, "musicmsg");
			if (!musicmsg) return;
			musicmsg = await musicchannel.messages.fetch(musicmsg);
			if (!musicmsg) return;
			this.settings[guild.id].msg = musicmsg;

			var musicimage = client.provider.get(guild, "musicimage");
			if (!musicimage) return;
			musicimage = await musicchannel.messages.fetch(musicimage);
			if (!musicimage) return;
			this.settings[guild.id].image = musicimage;

			const reactionCollector = musicmsg.createReactionCollector(
				(reaction, user) => !user.bot
			);
			reactionCollector.on("collect", this.reaction.bind(this, guild));

			this.settings[guild.id].channel = musicchannel;
			const msgCollector = musicchannel.createMessageCollector((msg) => !msg.author.bot);
			msgCollector.on("collect", this.onCollect.bind(this));

			var musicvoicechannel = this.client.provider.get(guild, "musicvoicechannel");
			if (!musicvoicechannel) return;
			musicvoicechannel = guild.channels.resolve(musicvoicechannel);
			if (!musicvoicechannel) return;
			this.settings[guild.id].voiceChannel = musicvoicechannel;

			this.handle(guild);
		} catch (error) {}
	}

	async onCollect(msg) {
		var { content, guild, channel, member } = msg;
		var lang = this.lang(guild);
		msg.delete();
		if (member.user.bot) return;
		if (!content) return;
		content = content.replace(`${guild.commandPrefix}play`, "");
		if (content.startsWith("!") || content.startsWith(guild.commandPrefix)) return;
		if (!member.voice.channel) {
			return channel
				.send(lang.joinvoicechannel.replace("{member}", `${member}`))
				.then((x) => x.delete({ timeout: 4000 }));
		}
		if (!guild.voice || !guild.voice.channel) await member.voice.channel.join();
		return this.processSearch(content, guild);
	}

	async run(triggerMsg, args, lang) {
		const { guild, channel, member, client } = triggerMsg;
		var voicechannel = client.provider.get(guild, "musicchannel");
		if (voicechannel) {
			voicechannel = await guild.channels.resolve(voicechannel);
			if (voicechannel)
				return triggerMsg
					.reply(lang.musicsetupalready.replace(/{channel}/g, `${voicechannel}`))
					.then((x) => x.delete({ timeout: 4000 }));
		}

		voicechannel = await guild.channels.create(lang.channelname, {
			type: "text",
			topic: lang.topic,
			nsfw: false,
			parent: channel.parentID,
			position: channel.position,
		});

		var image = await voicechannel.send({
			title: lang.music,
			embed: {
				author: null,
				footer: null,
				color: 3619135,
				image: {
					url:
						"https://cdn2.iconfinder.com/data/icons/shopping-and-retail-01-mix/168/list_clipboard_document_note_paper_white_report_curve_form_blank_empty-512.png",
				},
			},
		});

		this.initSettings(guild);
		var msg = await voicechannel.send(this.createMessage(guild));
		client.provider.set(guild, "musicchannel", voicechannel.id);
		client.provider.set(guild, "musicmsg", msg.id);
		client.provider.set(guild, "musicimage", image.id);

		this.fetch(guild);

		var reactions = "⏯,⏹,⏮,⏭,🔀,🔁,🔂,🔉,🔊";
		setTimeout(async () => {
			reactions = reactions.split(",");
			for (var react of reactions) {
				await msg.react(react);
			}
			var spotify = client.savedEmojis.spotify;
			if (spotify) {
				await msg.react(spotify);
			}
		});

		var answer = await triggerMsg.reply(
			lang.musicsetupdone.replace(/{channel}/g, `${voicechannel}`),
			{
				title: lang.music,
			}
		);
	}
};

// play simulatnously with user
// media player, youtube with reactions, mit queue, searching animations, results

class QueueItem {
	constructor(opts) {
		if (!opts) return;
		var { provider, link, name, img, duration, author } = opts;
		this.duration = duration;
		this.author = author;
		this.provider = provider;
		this.link = link;
		this.name = name;
		this.img = img;
	}
}
