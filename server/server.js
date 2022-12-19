const API = require("./api/");
const BotManager = require("./botmanager");
const mongoose = require("mongoose");

class Server {
	constructor(config) {
		this.config = config;
		this.production = config.production;
		this.api = new API(this);
		this.db = {};
		this.bots = new BotManager(this);
	}

	async start() {
		this.db = await mongoose.connect(this.config.database.url, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});

		console.log("Database connected!");

		if (!this.production) {
			this.bots.watch();
		}

		return Promise.all([this.api.start(), this.bots.init()]);
	}

	async stop() {
		try {
			await Promise.all([this.bots.shutdown(), this.api.stop()]);
			if (this.db) await this.db.disconnect();
		} catch (error) {
			console.error(error);
		}
	}
}

module.exports = Server;
