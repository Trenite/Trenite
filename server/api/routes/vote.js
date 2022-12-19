const express = require("express");
const fetch = require("node-fetch");
const mongoose = require("mongoose");

module.exports = (api) => {
	var { app, browser, server } = api;
	var { provider, allUsers } = server.bots;

	// async function autovote() {
	// 	var users = allUsers.settings.filter(
	// 		(user, id) => new Date(user.lastVote || 0) < new Date(Date.now() - 1000 * 60 * 60 * 12) && user.connectSid
	// 	);

	// 	for (const user of users) {
	// 		var { connectSid, id } = user;
	// 		if (!connectSid) continue;
	// 		var vote = await browser.vote.vote({ sid: connectSid });
	// 		if (!vote) continue;

	// 		allUsers.set(id, "lastVote", Date.now());
	// 	}
	// 	setTimeout(autovote.bind(this), 1000 * 10);
	// }
	// autovote();

	// app.post("/api/user/autovote", async (req, res, next) => {
	// 	if (!req.body) throw "invalid request";

	// 	var { sid } = req.body;

	// 	if (sid) {
	// 		await fetch(`https://top.gg/me`, {
	// 			headers: {
	// 				cookie: `connect.sid=${sid}`,
	// 			},
	// 			redirect: "error",
	// 		}).catch((e) => {
	// 			return next(new Error("Invalid connect.sid"));
	// 		});
	// 	}

	// 	await allUsers.set(req.user.id, "connectSid", sid);

	// 	return res.json({ success: true });
	// });

	// app.post("/api/webhook/vote", (req, res) => {
	// 	if (!req.body) return;
	// 	if (!req.headers.authorization || req.headers.authorization !== api.config.discord.voteAuth) return;
	// 	var vote = req.body;
	// 	var { user, isWeekend, query, type } = vote;

	// 	api.emit("vote", user, isWeekend);

	// 	res.send("OK");
	// });
};

Map.prototype.find = function (fn) {
	if (typeof fn !== "function") throw new Error("You need to pass a function");

	var found;

	for (const [key, value] of this) {
		if (fn(value, key)) {
			found = value;
			break;
		}
	}

	return found;
};

Map.prototype.filter = function (fn) {
	if (typeof fn !== "function") throw new Error("You need to pass a function");

	var found = [];

	for (const [key, value] of this) {
		if (fn(value, key)) {
			value.id = key;
			found.push(value);
		}
	}

	return found;
};
