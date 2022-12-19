const express = require("express");
const path = require("path");
const events = require("events");
const fs = require("fs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const models = [];
const { readdir } = require("fs").promises;

var files = fs.readdirSync(`${__dirname}/mongodb/models/`);
for (const file of files) {
	models.push(require(`${__dirname}/mongodb/models/${file}`));
}
const websocket = require("./websocket/websocket");
const Browser = require("./browser/browser");
const proxyMiddleware = require("http-proxy-middleware");
require("express-async-errors");
const rateLimit = require("express-rate-limit");
var jwt = require("express-jwt");
var guard = require("express-jwt-permissions")();
var unless = require("express-unless");
var cookieParser = require("cookie-parser");
const extension = require("./extension");

class API extends events.EventEmitter {
	constructor(server) {
		super();
		this.server = server;
		this.production = server.production;
		this.config = server.config;
		this.app = express();
		this.http = require("http").createServer(this.app);
		this.port = server.config.api.port;
		this.mongodb;
		this.website = __dirname + "/../../website/www/";
		this.browser = new Browser(this);
		this.routes = [];
		this.extension = extension(this);
		this.limiter = rateLimit({
			windowMs: 60 * 1000, // 1 minute
			max: 20, // limit each IP to 10 requests per windowMs.
			message: {
				error: "Rate limited, please try again later.",
				success: false,
				status: 429,
			},
		});
	}

	async start() {
		const self = this;
		const { app, port, server, http } = this;

		this.mongodb = server.db;
		app.unless = unless;

		app.set("trust proxy", 1);
		app.use("/api/", this.limiter);
		app.use(bodyParser.json());
		app.use(bodyParser.text({ inflate: true, type: "*/*" }));
		app.use(cookieParser());
		app.use(
			"/api",
			jwt({
				secret: this.config.server.jwtSecret,
				getToken: function fromHeaderOrQuerystring(req) {
					if (req.cookies) {
						return req.cookies.token;
					}
					return null;
				},
				algorithms: ["HS256"],
			}).unless({
				path: [/\/api\/oauth2.*/, /\/api\/redirect.*/, /\/api\/webhook.*/, /\/api\/docs.*/],
			})
		);

		var host = this.config.api.host;
		var routes = await getFiles(__dirname + "/routes/");
		routes.forEach((file, a) => {
			this.routes.push(require(file)(this));
		});
		this.browser.start();
		websocket(this);

		app.use("/static", express.static(__dirname + "/public"));

		if (self.production) {
			app.use(express.static(this.website));
		} else {
			var proxy = proxyMiddleware.createProxyMiddleware({ target: "http://localhost:3001" });
		}

		app.use("*", (req, res) => {
			if (!self.production) {
				return proxy(req, res);
			}
			res.sendFile(path.resolve(this.website, "index.html"));
		});

		app.use(function (err, req, res, next) {
			if (!err) return next();
			var status = 400;
			if (err.message.includes("UnauthorizedError")) status = 401;

			res.status(status).json({ error: err.toString(), status, success: false });
		});

		return new Promise((resolve) => {
			http.listen(port, host, () => {
				resolve();
				console.log(`🚀 Server ready at http://${host}:${port}`);
			});
		});
	}

	stop() {
		this.browser.stop();
		if (this.app.close) return this.app.close();
	}
}

module.exports = API;

async function getFiles(dir) {
	const dirents = await readdir(dir, { withFileTypes: true });
	const files = await Promise.all(
		dirents.map((dirent) => {
			const res = path.resolve(dir, dirent.name);
			return dirent.isDirectory() ? getFiles(res) : res;
		})
	);
	return Array.prototype.concat(...files);
}
