const commando = require("discord.js-commando");
const Discord = require("discord.js");
const fetch = require("node-fetch");
var osu = require("node-os-utils");
// const DBL = require("dblapi.js");
// const dbl = new DBL(
// 	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OTU3NzUxNjE1MDgxNjg2NiIsImJvdCI6dHJ1ZSwiaWF0IjoxNTkyOTA2OTgxfQ.Ar4wWhS8_0JrnbEET9dyzvcpYLk-gGFrfM0j7wLiDoM",
// 	this.client
// );
var votes;
module.exports = class StatusCommand extends commando.Command {
	constructor(client) {
		super(client, {
			name: "status",
			memberName: "status",
			aliases: [],
			group: "dev",
			description: "Status",
			examples: ["status"],
			devOnly: true,
			clientPermissions: ["SEND_MESSAGES"],
			args: [
				{
					type: "voice-channel",
					key: "servers",
					prompt: "What is the Servers count channel?",
				},
				{
					type: "voice-channel",
					key: "custombots",
					prompt: "What is the Custom Bots count channel?",
				},
				{
					type: "text-channel",
					key: "votelog",
					prompt: "What is the vote log channel?",
				},
			],
		});

		this.client.once(
			"providerReady",
			(() => {
				if (this.client.meltic) {
					this.statusupdate.bind(this)();
				}
			}).bind(this)
		);
	}

	async makeStatusMsg(guild) {
		var inOut = await osu.netstat.inOut();
		if (inOut === "not supported") {
			inOut = {
				inputMb: "not supported",
				outputMb: "not supported",
			};
		} else {
			inOut = inOut.total;
		}
		var uptime = osu.os.uptime();
		var cpuUsage = await osu.cpu.usage();
		var cpuCores = await osu.cpu.count();
		var memUsed = await osu.mem.used();
		// var votesgg = await dbl.getBot("689577516150816866");
		// votes = votesgg.monthlyPoints;

		return {
			title: "Status",
			embed: {
				fields: [
					{
						name: "Guilds",
						value: this.client.guilds.cache.size + "",
					},
					{ name: "Users", value: this.client.users.cache.size + "" },
					{
						name: "Discord Ping:",
						value: `${Math.round(this.client.ws.ping)}ms`,
					},
					{
						name: "Ram Used:",
						value:
							(memUsed.usedMemMb / 1000).toFixed(1) +
							" GB of " +
							(memUsed.totalMemMb / 1000).toFixed(1) +
							" GB",
					},
					{ name: "CPU Usage:", value: cpuUsage + " %" },
					{ name: "CPU Cores:", value: cpuCores + "" },
					{ name: "Network In:", value: inOut.inputMb + " Mb" },
					{ name: "Network Out:", value: inOut.outputMb + " Mb" },
					{
						name: "Custombots",
						value: guild.client.bot.server.bots.bots.length,
					},
					// { name: "Votes", value: votes },
				],
			},
		};
	}

	async run(msg, args) {
		var { client, guild, channel } = msg;
		var { servers, custombots, votelog } = args;
		var m = await msg.channel.send(await this.makeStatusMsg(guild));
		this.client.provider.set("global", "serversCount", servers.id);
		this.client.provider.set("global", "customBotsCount", custombots.id);
		this.client.provider.set("global", "statusMsg", m.id);
		this.client.provider.set("global", "statusChannel", channel.id);
		this.client.provider.set("global", "votelog", votelog.id);
	}

	async server() {
		var servers = this.client.guilds.cache.size;
		servers = `Servers: ` + servers;
		return servers;
	}

	async customBots() {
		var custombot = this.client.bot.server.bots.bots.length;
		custombot = `Custom Bots: ` + custombot;

		return custombot;
	}

	async statusupdate() {
		var interval = this.client.setInterval(
			async function () {
				try {
					var statuschannel = this.client.provider.get("global", "statusChannel");
					statuschannel = this.client.channels.resolve(statuschannel);
					if (!statuschannel) return;

					var statusmessage = await this.client.provider.get("global", "statusMsg");
					statusmessage = new Discord.Message(
						this.client,
						{ id: statusmessage },
						statuschannel
					); // do not fetch message to save ressources

					statusmessage.edit(await this.makeStatusMsg(statuschannel.guild));
				} catch (error) {
					console.error(error);
				}
			}.bind(this),
			1000 * 10 // 10 sec
		);

		var channelInterval = this.client.setInterval(
			async function () {
				try {
					var servers = this.client.provider.get("global", "serversCount");
					servers = this.client.channels.resolve(servers);
					if (!servers) return;
					await servers.edit({ name: this.server(servers.guild) });

					var customBots = this.client.provider.get("global", "customBotsCount");
					customBots = this.client.channels.resolve(customBots);
					if (!customBots) return;
					await customBots.edit({
						name: this.customBots(customBots.guild),
					});
					var votelog = this.client.provider.get("global", "votelog");
					if (!votelog) return;
					votelog = await this.client.channels.resolve(votelog);
					if (!votelog) return;

					// await votelog.edit({ name: votes + " votes" });
				} catch (error) {
					console.error(error);
				}
			}.bind(this),
			1000 * 60 * 5 // 5 minutes
		);
	}
};
