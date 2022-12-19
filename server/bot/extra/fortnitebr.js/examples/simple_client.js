/* eslint-disable no-console */
const Fortnite = require("fortnitebr.js");
const fs = require("fs").promises;

/*
This Example uses DeviceAuth to login. This avoids getting captcha errors.
The Details are stored in the local json file './deviceauth.json'.
Email and Password are only needed for the first login.
NOTE: Do not share these details with anyone. They grant full access to your account!
NOTE: If you unintentionally shared them just change your password and they get invalid.
*/
const fnbot = new Fortnite.Client({
	debug: console.log,
	deviceAuthDetails: "./deviceauth.json",
	deviceAuthOptions: {
		createNew: true, // TURN THIS TO FALSE AFTER THE DETAILS WERE GENERATED
		deleteExisting: false,
	},
	email: "example@example.com", // ENTER EMAIL HERE
	password: "Example1", // ENTER PASSWORD HERE
});

fnbot.once("ready", () => {
	console.log("--------------------------------");
	console.log(`FORTNITE CLIENT READY AS ${fnbot.account.displayName}`);
	console.log("--------------------------------");
});

fnbot.on("friend:request", async (freq) => {
	await freq.accept();
});

fnbot.on("friend:message", async (msg) => {
	console.log(`Recieved message from ${msg.author.displayName}: ${msg.content}`);
	await msg.reply("Thanks for your message!");
});

// This stores your device auth details in a file. Dont share your device auth details with anyone!
fnbot.on("device:auth:created", async (details) => {
	await fs.writeFile("./deviceauth.json", JSON.stringify(details));
});

fnbot.login();
