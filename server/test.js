const mongoose = require("mongoose");
console.log("started");

process.exit(); // do not accidently execute this

(async () => {
	var db = await mongoose.connect("mongodb://trenite:27BvTLngUqMP9TVwbYALu@127.0.0.1:27017/Trenite", {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	console.log("connected");

	var guildsOrg = db.connection.collection("guilds");
	var usersOrg = db.connection.collection("users");

	global.db = db;
	global.guildsOrg = guildsOrg;
	global.usersOrg = usersOrg;

	var guilds = await guildsOrg.find({ "settings.users": { $exists: true } }).toArray();
	console.log(guilds);
	var wait = guilds.map(async (guild) => {
		guild.settings.users = guild.settings.users.map((user) => {
			user.id = user.discord_id;
			delete user.discord_id;
			return user;
		});
		await guildsOrg.updateOne({ guild: guild.guild }, { $set: { "settings.users": guild.settings.users } });
	});
	await Promise.all(wait);
	console.log("renamed");
})();
