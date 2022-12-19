require("./logger");
const Server = require("./server");
const dotenv = require("dotenv");
const path = require("path");
var config = require("../config.json");
const figlet = require("figlet");

figlet("Meltic", function (err, data) {
	console.log("\n", data);
});

if (process.env.production === undefined) dotenv.config({
	path: path.join(__dirname, ".env")
});

const infos = config.infos;
if (process.env.production == "true") {
	var production = true;
	config = config.production;
	config.production = true;
} else {
	var production = false;
	config = config.development;
	config.production = false;
}
config.infos = infos;

var server = new Server(config);
global.server = server;
server.start().catch(console.error);

process.on("SIGINT", function () {
	server.stop().then(() => {
		process.exit(0);
	});
	throw "STOP";
});

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);