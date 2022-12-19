const mongoose = require("mongoose");
const BotModel = mongoose.model(
	"Bot",
	new mongoose.Schema({
		token: String,
		id: String,
		owner: String,
		admins: [String],
	}),
	"bots"
);
