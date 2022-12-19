const mongoose = require("mongoose");

module.exports = mongoose.model(
	"OAuth2",
	new mongoose.Schema({
		access_token: String,
		expires_in: Date,
		refresh_token: String,
		scope: String,
		token_type: String,
		discord: String,
		provider: String,
		email: String,
	}),
	"oauth2"
);
