const { SettingProvider } = require("discord.js-commando");

module.exports = class MongoDBProvider extends SettingProvider {
	/**
	 * @param {Db} db - Database for the provider
	 */
	constructor(mongoClient) {
		super();

		/**
		 * Database that will be used for storing/retrieving settings
		 * @type {Db}
		 */
		this.mongoClient = mongoClient;
		this.db = mongoClient.db;

		/**
		 * Client that the provider is for (set once the client is ready, after using {@link CommandoClient#setProvider})
		 * @name SQLiteProvider#client
		 * @type {CommandoClient}
		 * @readonly
		 */
		Object.defineProperty(this, "client", { value: null, writable: true });

		/**
		 * Settings cached in memory, mapped by guild ID (or 'global')
		 * @type {Map}
		 * @private
		 */
		this.settings = new Map();

		/**
		 * Listeners on the Client, mapped by the event name
		 * @type {Map}
		 * @private
		 */
		this.listeners = new Map();
	}

	async init(table) {
		this.table = table;

		const collection = await this.db.collection(table);
		var docs = await collection.find().toArray();

		for (const doc of docs) {
			const guild = doc.guild !== 0 ? doc.guild : "global";

			this.settings.set(guild, doc.settings);
		}
	}

	async destroy() {}

	get(guild, key, defVal) {
		const settings = this.settings.get(this.constructor.getGuildID(guild));
		if (key == undefined) return settings;
		return settings ? (typeof settings[key] !== "undefined" ? settings[key] : defVal) : defVal;
	}

	async set(guild, key, val) {
		guild = this.constructor.getGuildID(guild);
		let settings = this.settings.get(guild);
		if (!settings) {
			settings = {};
			this.settings.set(guild, settings);
		}

		settings[key] = val;

		await this.updateGuild(guild, settings);

		if (guild === "global") this.updateOtherShards(key, val);
		return val;
	}

	async remove(guild, key) {
		guild = this.constructor.getGuildID(guild);
		const settings = this.settings.get(guild);
		if (!settings || typeof settings[key] === "undefined") return;

		const val = settings[key];
		delete settings[key]; // NOTE: I know this isn't efficient, but it does the job.

		await this.updateGuild(guild, settings);

		if (guild === "global") this.updateOtherShards(key, undefined);
		return val;
	}

	async clear(guild) {
		guild = this.constructor.getGuildID(guild);
		if (!this.settings.has(guild)) return;
		this.settings.delete(guild);

		const collection = await this.db.collection(this.table);
		return collection.deleteOne({ guild: guild !== "global" ? guild : 0 });
	}

	async updateGuild(guild, settings) {
		guild = guild !== "global" ? guild : 0;

		const collection = await this.db.collection(this.table);
		return collection.updateOne({ guild }, { $set: { guild, settings } }, { upsert: true });
	}

	/**
	 * Updates a global setting on all other shards if using the {@link ShardingManager}.
	 * @param {string} key - Key of the setting to update
	 * @param {*} val - Value of the setting
	 * @private
	 */
	updateOtherShards(key, val) {
		// if (!this.client.shard) return;
		// key = JSON.stringify(key);
		// val = typeof val !== "undefined" ? JSON.stringify(val) : "undefined";
		// this.client.shard.broadcastEval(`
		// 	if(this.shard.id !== ${this.client.shard.id} && this.provider && this.provider.settings) {
		// 		let global = this.provider.settings.get('global');
		// 		if(!global) {
		// 			global = {};
		// 			this.provider.settings.set('global', global);
		// 		}
		// 		global[${key}] = ${val};
		// 	}
		// `);
	}
};
