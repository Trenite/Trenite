const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	botid: String,
	website: String,
	verify: String,
	customs: String,
	statusmsg: String,
	statuschannel: String,
});

module.exports = mongoose.model("Status", userSchema, "status");
