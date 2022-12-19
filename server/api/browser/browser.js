const Spotify = require("./spotify/player");
const Trello = require("./trello/trello");
const Vote = require("./vote/vote");
const puppeteer = require("puppeteer");

module.exports = class Puppeteer {
	constructor(server) {
		this.server = server;
	}

	async start() {
		const mac = process.platform === "darwin";
		process.env.DISPLAY = "=:1";

		this.browser = await puppeteer.launch({
			headless: true,
			devtools: true,
			defaultViewport: {
				width: 800,
				height: 600,
			},
			userDataDir: __dirname + "/chromeUserDir/",
			ignoreDefaultArgs: ["--mute-audio", "--hide-scrollbars"],
			args: [
				"--autoplay-policy=no-user-gesture-required",
				"--no-sandbox",
				"--hide-scrollbars",
				// `--disable-extensions-except=${pathToExtension}`,
				// `--load-extension=${pathToExtension}`,
			],
		});

		// const pathToExtension = require("path").join(__dirname + "/", "recorder");

		// this.headful = await puppeteer.launch({
		// 	headless: false,
		// 	args: [
		// 		"--no-sandbox",
		// 		`--disable-extensions-except=${pathToExtension}`,
		// 		`--load-extension=${pathToExtension}`,
		// 	],
		// });
		this.trello = new Trello(this);
		// this.vote = new Vote(this);
		// this.spotify = new Spotify(this);
	}

	async stop() {
		if (this.browser) this.browser.close();
	}
};
