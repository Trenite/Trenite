const express = require("express");

module.exports = (api) => {
	var { app } = api;
	app.use("/stats/", express.static(__dirname + "/../../../stats/"));
};
