/* eslint-disable no-console */
const Fortnite = require("fortnitebr.js");
const Discord = require("discord.js");

/*
This Example uses DeviceAuth to login. This avoids getting captcha errors.
The Details are stored in the local json file './deviceauth.json'.
Email and Password are only needed for the first login.
NOTE: Do not share these details with anyone. They grant full access to your account!
NOTE: If you unintentionally shared them just change your password and they get invalid.

The discord bot replies with the fortnitebot's name when a message is sent that contains !fortnite.
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
const discordbot = new Discord.Client();

// -----DISCORD BOT TOKEN HERE-----
const DISCORD_BOT_TOKEN = "ABCD1234.EXAMPLE.5678EFGH";
// --------------------------------

(async () => {
	await Promise.all([fnbot.login(), discordbot.login(DISCORD_BOT_TOKEN)]);

	console.log(`Fortnitebot ready as ${fnbot.account.displayName}`);
	console.log(`Discordbot ready as ${discordbot.user.tag}`);
})();

discordbot.on("message", async (message) => {
	if (message.content === "!fortnite")
		await message.reply(`This Discord bot is connected with the fortnite bot ${fnbot.account.displayName}`);
});

fnbot.on("friend:request", async (freq) => {
	await freq.accept();
});

fnbot.on("friend:message", async (msg) => {
	console.log(`Recieved message from ${msg.author.displayName}: ${msg.content}`);
	await msg.reply("Thanks for your message!");
});
