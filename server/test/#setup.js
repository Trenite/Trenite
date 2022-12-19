process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

before(async function () {
	this.timeout(30000);

	const { ApolloClient } = require("apollo-boost");
	const { InMemoryCache, NormalizedCacheObject } = require("apollo-cache-inmemory");
	global.fetch = require("node-fetch");
	const { HttpLink } = require("apollo-link-http");
	process.env.production = false;
	var config = require("../../config.json");
	config.development.discord.prefix = ".";
	var Server = require("../server");
	var { Client } = require("discord.js");

	console.log("setup tests");

	var userBot = new Client();
	global.userBot = userBot;
	userBot.token = config.development.discord.unittest.token;
	global.prefix = config.development.discord.prefix;
	global.config = config.development;

	const cache = new InMemoryCache();
	const link = new HttpLink({
		uri: "http://127.0.0.1:4001/graphql",
		fetchOptions: {
			timeout: 3000,
		},
	});

	global.server = new Server(global.config);
	global.server.api.port = 5001;
	global.client = new ApolloClient({
		cache,
		link,
	});

	var reportError = global.console.error;
	global.console.error = (...args) => {
		reportError.apply(null, args);
		throw new Error(args[0]);
	};

	global.awaitStartPromises = [global.server.start(), userBot.login(userBot.token)];

	global.awaitStartPromises = await Promise.all(global.awaitStartPromises).catch(console.log);
	await new Promise((r) => {
		setTimeout(r, 1000);
	});
	// wait 1 second for it to properly start
	console.log("started");
});

after(async function () {
	await global.server.stop();
	await global.userBot.destroy();
	return new Promise((r) => {
		setTimeout(r, 1000);
	});
});
