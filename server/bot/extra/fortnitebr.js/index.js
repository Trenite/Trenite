/* eslint-disable global-require */
module.exports = {
	Client: require("./src/Client"),

	Endpoints: require("./resources/Endpoints"),
	Tokens: require("./resources/Tokens"),

	Enums: {
		PartyPrivacy: require("./enums/PartyPrivacy"),
		Platform: require("./enums/Platform"),
		ReadyState: require("./enums/ReadyState"),
		Region: require("./enums/Region"),
		KairosColor: require("./enums/KairosColor"),
		Playlist: require("./enums/Playlist"),
	},
};
