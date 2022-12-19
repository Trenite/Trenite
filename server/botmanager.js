const mongoose = require("mongoose");
const fs = require("fs");
const _ = require("lodash");
const Bot = require("./bot/bot");
const MongoDBProvider = require("./bot/database/provider");
const Canvas = require("canvas");
const { dirname } = require("path");
const BotModel = mongoose.model("Bot");

module.exports = class BotManager {
	constructor(server) {
		this.server = server;
		this.meltic; // meltic bot
		this.bots = [];
	}

	loadFonts() {
		Canvas.registerFont(__dirname + "/bot/ressources/lypix-font.ttf", {
			family: "lypix-font",
		});
		Canvas.registerFont(__dirname + "/bot/ressources/BurbankBigCondensedBlack.ttf", {
			family: "Burbank Big Condensed Black",
			weight: "900",
			style: "normal",
		});
	}

	async epicGames(props) {
		const Fortnite = require("fnbr");

		try {
			var exchangeCode = `https://www.epicgames.com/id/login?redirectUrl=https://www.epicgames.com/id/api/exchange`;
			var deviceAuth;

			deviceAuth = __dirname + "/bot/deviceauths/trenite1.json";
			/* if (this.Client.production) {
                   
                 } else { deviceAuth = __dirname + "/deviceauths/dev1.json" }*/
			this.fnbot = new Fortnite.Client({
				deviceAuthOptions: {
					createNew: false, // TURN THIS TO FALSE AFTER THE DETAILS WERE GENERATED
					deleteExisting: false,
				},
				createPartyOnStart: true,
				auth: {
					deviceAuth: deviceAuth,
				},
			});

			this.fnbot.on("device:auth:created", async (details) => {
				await fs.writeFile(__dirname + "/deviceauths/dev1.json", JSON.stringify(details));
			});

			await this.fnbot.login().catch((x) => {
				this.fnbot.login();
			});
			console.log("🎮 Fortnite Bot " + this.fnbot.user.displayName + " is online.");
			await this.fnbot.setStatus("Battle Royale Lobby - 1 / 16");
		} catch (error) {
			console.error("epicGames Client Startup error: Error: " + error);
		}
	}

	async init() {
		this.loadFonts();
		this.epicGames();
		this.provider = new MongoDBProvider(this.server.db.connection);
		this.allUsers = new MongoDBProvider(this.server.db.connection);

		await this.provider.init("guilds");
		await this.allUsers.init("users");

		var bots = await BotModel.find({}).exec();

		var { client_id, dev, token } = this.server.config.discord;
		var meltic = {
			id: client_id,
			owner: "759425764394795008",
			admins: dev,
			token,
		};

		bots = bots.filter(
			(x) => x._doc.id !== "759453286683508737" && x._doc.id !== "759439765073428500"
		);
		this.meltic = await this.add(meltic);

		return Promise.all(bots.map((x) => this.add(x._doc)));
	}

	async add({ token, owner, id, admins = [] }) {
		console.log(id);
		var config = { ...this.server.config };
		var owners = [owner, ...admins];

		config.discord = {
			...config.discord,
			token,
			id,
			client_id: id,
			owner: owners,
		};
		const bot = new Bot(this, config);
		this.bots.push(bot);
		await BotModel.updateOne({ id }, { token, owner, id }, { upsert: true }).exec();
		await bot.start();

		return bot;
	}

	getBot({ id }) {
		const bot = this.bots.find((x) => x.id === id);
		if (!bot) throw new Error("Bot not found");
		return bot;
	}

	async stop({ id, restart = false }) {
		var bot = this.getBot({ id });
		await bot.stop({ restart }).catch((e) => {});
		this.bots = this.bots.filter((x) => x.id !== id);

		return bot;
	}

	async delete(id, author = {}) {
		var bot = await this.stop({ id, restart: false });
		await BotModel.deleteOne({ id }).exec();

		this.meltic.Client.treniteLog(`${author} (${author.tag}) deleted the custombot <@${id}>`, {
			title: "Custombot deleted",
			embed: {
				color: "#ff0000",
			},
		});
	}

	async restart({ id }) {
		await this.stop({ id, restart: true });
		if (global.gc) global.gc();
		const bot = await BotModel.findOne({ id }).exec();
		return this.add({ ...bot._doc });
	}

	async watch() {
		const self = this;
		var onChange = function (eventType, filename) {
			console.log("Restarting all bots");
			self.restartAll();
		};
		onChange = _.debounce(onChange, 4000);
		fs.watch(`${__dirname}/bot/`, { recursive: true }, (...args) => {
			var file = args[1];
			if (file && file.includes("ressources")) return;
			onChange.cancel();
			onChange.apply(self, args);
		});
	}

	async restartAll() {
		const cache = Object.keys(require.cache).filter((x) => !x.includes("node_modules"));
		cache.forEach((x) => {
			delete require.cache[x];
		});
		return Promise.all(this.bots.map((x) => this.restart({ id: x.id })));
	}

	async shutdown() {
		this.fnbot.logout().catch((e) => console.log(e));
		return Promise.all(this.bots.map((bot) => this.stop({ id: bot.id, restart: true })));
	}
};
