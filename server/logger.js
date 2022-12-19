const { WebhookClient } = require("discord.js");

var webhooks = [
	new WebhookClient(
		"735641385176400043",
		"0VYtIu_G7198FyxkK3W4XbAtFT7TKf6lqxwofJT4ESySg563vvFuyK7cXguNrPvZ_mQK"
	),
];

var oldConsoleLog = console.log;
var colorLog = function (args, color) {
	args.forEach((x) => {
		if (typeof x === "string") {
			oldConsoleLog(`%c${x}`, "color:" + color);
		} else {
			oldConsoleLog(x);
		}
	});
};

console.success = (...args) => {
	return colorLog(args, "#21c208");
};
console.warn = (...args) => {
	return colorLog(args, "#e38100");
};
console.color = (color, ...args) => {
	return colorLog(args, color);
};

var buffer = "";
var maxSize = 1000;

["log", "warn", "debug", "error", "success"].forEach((func) => {
	var old = console[func];
	console[func] = function (...args) {
		var string = "";

		var datum = new Date();
		var minutes = datum.getMinutes() < 10 ? "0" + datum.getMinutes() : datum.getMinutes();
		var today =
			datum.getDate() +
			"." +
			(datum.getMonth() + 1) +
			"." +
			datum.getFullYear() +
			" " +
			datum.getHours() +
			":" +
			minutes;
		args.unshift(`[${today}]`);

		for (var test of args) {
			if (typeof test === "object") {
				try {
					test = JSON.stringify(test);
				} catch (error) {}
			}
			string += test + " ";
		}
		if (server.production) send(string, func);

		old.apply(this, args);
	};
});

async function send(string, type) {
	var webhook = webhooks[Math.floor(webhooks.length * Math.random())];
	buffer += string + "\n";
	if (buffer.length > maxSize || !server.production) {
		webhook.send("```\n" + buffer.slice(0, maxSize) + "```").catch((e) => {});
		buffer = buffer.slice(maxSize);
	}
}
