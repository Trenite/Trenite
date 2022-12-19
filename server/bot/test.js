const Fortnite = require("./fortnitebr.js");
const config = require("../../config.json");

const fnbot = new Fortnite.Client({
	deviceAuthDetails: __dirname + "/deviceauths/trenite1.json",
	deviceAuthOptions: {
		createNew: true, // TURN THIS TO FALSE AFTER THE DETAILS WERE GENERATED
		deleteExisting: false,
	},
	email: config.production.epicGames.email,
	password: config.production.epicGames.password,
	exchangeCode: "3aed739dc780437a93bf11ab0ce0cd80",
});

fnbot.once("ready", () => {
	console.log("--------------------------------");
	console.log(`FORTNITE CLIENT READY AS ${fnbot.account.displayName}`);
	console.log("--------------------------------");
});

var exchangeCode = `https://www.epicgames.com/id/login?redirectUrl=https://www.epicgames.com/id/api/exchange`;
// An exchange code is a one time usable code that can be used to log into your account. The code expires after 5 minutes. Never share this code with anyone!
fnbot.login();
