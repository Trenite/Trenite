/* eslint-disable class-methods-use-this */
const request = require("request-promise");
const readline = require("readline");
const exitHook = require("async-exit-hook");
const fs = require("fs").promises;
const Tokens = require("../../resources/Tokens");
const Endpoints = require("../../resources/Endpoints");

module.exports = class Authenticator {
	constructor(client) {
		Object.defineProperty(this, "Client", { value: client });
		this.auths = {
			access_token: undefined,
			expires_at: undefined,
			token_type: undefined,
		};
		this.reauths = {
			refresh_token: undefined,
			expires_at: undefined,
			token_type: undefined,
		};
		this.account = {
			displayName: undefined,
			email: this.Client.config.email,
			password: this.Client.config.password,
			id: undefined,
			externalAuths: undefined,
		};
		this.isRefreshing = false;
	}

	async authenticate(isSecond) {
		// https://www.epicgames.com/id/login?redirectUrl=https%3A%2F%2Fwww.epicgames.com%2Fid%2Fapi%2Fexchange
		if (isSecond) this.Client.config.debug("Reauthenticating with new DeviceAuth details...");
		else this.Client.config.debug("Authenticating...");
		const startAuth = new Date();
		this.jar = request.jar();
		let exchangeCode;
		let fortniteToken;

		if (this.Client.config.deviceAuthDetails && !this.Client.config.deviceAuthOptions.createNew) {
			this.usedDeviceAuth = true;
			let deviceAuthDetails;

			switch (typeof this.Client.config.deviceAuthDetails) {
				case "function":
					deviceAuthDetails = await this.Client.config.deviceAuthDetails();
					break;
				case "string": {
					if (this.Client.config.deviceAuthDetails.includes(".json")) {
						if (!fs) {
							return {
								success: false,
								err:
									`Your node version (${
										process.versions.node.split(".")[0]
									}) is too low for the module fs.promises. ` +
									"You need at least version 10. If you don't want to upgrade, filepath as DeviceAuth details is not possible",
							};
						}
						const rawDeviceAuthDetails = (
							await fs.readFile(this.Client.config.deviceAuthDetails)
						).toString();
						if (!rawDeviceAuthDetails)
							return { success: false, err: "DeviceAuth details not found: File is empty" };
						deviceAuthDetails = JSON.parse(rawDeviceAuthDetails);
						break;
					}
					return { success: false, err: "DeviceAuth details not found: No file found" };
				}
				case "object":
					deviceAuthDetails = this.Client.config.deviceAuthDetails;
					break;
				default: {
					return { success: false, err: "DeviceAuth details not found" };
				}
			}

			if (!deviceAuthDetails.accountId)
				return { success: false, err: "DeviceAuth details not found: accountId missing" };
			if (!deviceAuthDetails.deviceId)
				return { success: false, err: "DeviceAuth details not found: deviceId missing" };
			if (!deviceAuthDetails.secret)
				return { success: false, err: "DeviceAuth details not found: secret missing" };

			fortniteToken = await this.getFortniteToken(undefined, deviceAuthDetails);
			if (!fortniteToken.success) return { success: false, err: fortniteToken.response };

			if (this.Client.config.deviceAuthOptions.deleteOthers) {
				this.auths = fortniteToken.response;
				const deletedAuths = await this.deleteAllDeviceAuths(
					[deviceAuthDetails.deviceId],
					fortniteToken.response
				);
				if (!deletedAuths.success) return { success: false, err: deletedAuths.response };
			}
			this.deviceAuthDetails = deviceAuthDetails;
		} else if (this.Client.config.exchangeCode) {
			exchangeCode =
				typeof this.Client.config.exchangeCode === "function"
					? await this.Client.config.exchangeCode()
					: this.Client.config.exchangeCode;
		} else if (this.Client.config.email && this.Client.config.password) {
			const reputation = await this.getReputation();
			if (!reputation.success) return { success: false, err: reputation.response };
			if (reputation.response.verdict !== "allow")
				return {
					success: false,
					err: "Your IP got flagged because you spammed epics api! Try another auth method.",
				};

			const xsrf = await this.getXsrfToken();
			if (!xsrf.success) return { success: false, err: xsrf.response };

			this.Client.config.debug("Sending login data...");
			const login = await this.login({
				email: this.Client.config.email,
				password: this.Client.config.password,
			});

			if (!login.success) {
				switch (login.response.error.errorCode) {
					case "errors.com.epicgames.accountportal.captcha_invalid": {
						return {
							success: false,
							err: "Your IP got flagged because you spammed epics api! Try another auth method.",
						};
					}
					case "errors.com.epicgames.common.two_factor_authentication.required":
						{
							const mfacode = await this.Client.config.get2FACode();
							const mfalogin = await this.login(
								{
									code: mfacode,
									method: JSON.parse(login.response.message.substr(6)).metadata.twoFactorMethod,
								},
								true
							);
							if (!mfalogin.success) return { success: false, err: mfalogin.response };
						}
						break;
					case "errors.com.epicgames.account.invalid_account_credentials": {
						return {
							success: false,
							err: `Email '${this.Client.config.email}' and/or password '${this.Client.config.password}' wrong!`,
						};
					}
					default: {
						return { success: false, err: login.response };
					}
				}
			}

			const launcherExchange = await this.getLauncherExchange();
			if (!launcherExchange.success) return { success: false, err: launcherExchange.response };
			exchangeCode = launcherExchange.response.code;
		}

		if (!exchangeCode && !fortniteToken)
			return {
				success: false,
				err: "No login method found! Please provide email and password, exchangeCode or DeviceAuth details",
			};

		if (this.Client.config.deviceAuthOptions.createNew) {
			this.Client.config.debug("Generating new DeviceAuth details...");
			const deviceAuth = await this.createDeviceAuth(exchangeCode);
			if (!deviceAuth.success) return { success: false, err: deviceAuth.response };

			this.Client.emit("device:auth:created", deviceAuth.response);
			this.Client.config.deviceAuthDetails = deviceAuth.response;
			this.Client.config.deviceAuthOptions.createNew = false;
			return this.authenticate(true);
		}

		if (!fortniteToken) {
			const launcherToken = await this.getLauncherToken(exchangeCode);
			if (!launcherToken.success) return { success: false, err: launcherToken.response };

			const fortniteExchange = await this.getFortniteExchange(launcherToken.response.access_token);
			if (!fortniteExchange.success) return { success: false, err: fortniteExchange.response };

			fortniteToken = await this.getFortniteToken(fortniteExchange.response.code);
			if (!fortniteToken.success) return { success: false, err: fortniteToken.response };
		}

		this.account.id = fortniteToken.response.account_id;

		this.auths = {
			access_token: fortniteToken.response.access_token,
			expires_at: fortniteToken.response.expires_at,
			token_type: fortniteToken.response.token_type,
		};

		this.reauths = {
			refresh_token: fortniteToken.response.refresh_token,
			expires_at: fortniteToken.response.refresh_expires_at,
			token_type: fortniteToken.response.token_type,
		};

		const endAuth = new Date();
		const usedtime = (endAuth.getTime() - startAuth.getTime()) / 1000;
		this.Client.config.debug(`Authentification successful (${usedtime.toFixed(1)}s)`);

		exitHook(async (callback) => {
			try {
				await this.Client.logout();
			} catch (err) {
				this.Client.config.debug(`Logging out failed: ${err}`);
			}
			callback();
		});
		this.scheduleReauth();

		return { success: true };
	}

	async createDeviceAuth(exchangeCode) {
		const iosToken = await this.getLauncherToken(exchangeCode, Tokens.IOS_TOKEN);
		if (!iosToken.success) return { success: false, response: iosToken.response };

		try {
			const deviceAuthDetails = await request.post({
				url: `${Endpoints.DEVICE_AUTH}/${iosToken.response.account_id}/deviceAuth`,
				headers: {
					Authorization: `bearer ${iosToken.response.access_token}`,
				},
				json: true,
			});

			const details = {
				accountId: deviceAuthDetails.accountId,
				deviceId: deviceAuthDetails.deviceId,
				secret: deviceAuthDetails.secret,
			};

			return { success: true, response: details };
		} catch (err) {
			return { success: false, response: err };
		}
	}

	async deleteAllDeviceAuths(dontDeleteIds = []) {
		let existingDeviceAuths;
		try {
			existingDeviceAuths = await request.get({
				url: `${Endpoints.DEVICE_AUTH}/${this.auths.account_id}/deviceAuth`,
				headers: {
					Authorization: `${this.auths.token_type} ${this.auths.access_token}`,
				},
				json: true,
			});
		} catch (err) {
			return { success: false, response: err };
		}

		for (let i = 0; i < existingDeviceAuths.length; i += 1) {
			if (!dontDeleteIds.includes(existingDeviceAuths[i].deviceId)) {
				try {
					request.delete({
						url: `${Endpoints.DEVICE_AUTH}/${this.auths.accountId}/deviceAuth/${existingDeviceAuths[i].deviceId}`,
						headers: {
							Authorization: `${this.auths.token_type} ${this.auths.access_token}`,
						},
						json: true,
					});
				} catch (err) {
					this.Client.config.debug(
						`Deletion of DeviceAuth (${existingDeviceAuths[i].deviceId}) failed: ${err}`
					);
				}
			}
		}
		return { success: true, response: "" };
	}

	async getReputation() {
		try {
			const reputation = await request({
				url: Endpoints.API_REPUTATION,
				headers: {
					"User-Agent":
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36",
				},
				json: true,
				jar: this.jar,
			});
			return { success: true, response: reputation };
		} catch (err) {
			return { success: false, response: err };
		}
	}

	async getXsrfToken() {
		try {
			await request({
				url: Endpoints.CSRF_TOKEN,
				headers: {
					"User-Agent":
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36",
				},
				json: true,
				jar: this.jar,
			});
			return { success: true, response: "" };
		} catch (err) {
			return { success: false, response: err };
		}
	}

	async login(credentials, mfa) {
		try {
			const login = await request.post({
				url: `${Endpoints.API_LOGIN}${mfa ? "/mfa" : ""}`,
				headers: {
					// eslint-disable-next-line no-underscore-dangle
					"x-xsrf-token": JSON.parse(JSON.stringify(this.jar))._jar.cookies.find(
						(i) => i.key === "XSRF-TOKEN"
					).value,
					"Content-Type": "application/json",
					"User-Agent":
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36",
				},
				jar: this.jar,
				form: mfa
					? {
							code: credentials.code,
							method: credentials.method,
							rememberDevice: false,
					  }
					: {
							email: credentials.email,
							password: credentials.password,
							rememberMe: true,
					  },
				json: true,
			});
			return { success: true, response: login };
		} catch (err) {
			if (err.statusCode === 409) return this.login(credentials, mfa);
			return { success: false, response: err };
		}
	}

	async getLauncherExchange() {
		try {
			const exchange = await request({
				url: Endpoints.API_EXCHANGE_CODE,
				headers: {
					// eslint-disable-next-line no-underscore-dangle
					"x-xsrf-token": JSON.parse(JSON.stringify(this.jar))._jar.cookies.find(
						(i) => i.key === "XSRF-TOKEN"
					).value,
					"User-Agent":
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36",
				},
				jar: this.jar,
				json: true,
			});
			return { success: true, response: exchange };
		} catch (err) {
			return { success: false, response: err };
		}
	}

	async getLauncherToken(code, token = Tokens.LAUNCHER_TOKEN) {
		try {
			const launcherToken = await request.post({
				url: Endpoints.OAUTH_TOKEN,
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Authorization: `basic ${token}`,
					"User-Agent":
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36",
				},
				form: {
					grant_type: "exchange_code",
					exchange_code: code,
					includePerms: false,
				},
				json: true,
				jar: this.jar,
			});
			return { success: true, response: launcherToken };
		} catch (err) {
			return { success: false, response: err };
		}
	}

	async getFortniteExchange(token) {
		try {
			const exchangeCode = await request({
				url: Endpoints.OAUTH_EXCHANGE,
				headers: {
					Authorization: `Bearer ${token}`,
				},
				json: true,
			});
			return { success: true, response: exchangeCode };
		} catch (err) {
			return { success: false, response: err };
		}
	}

	async getFortniteToken(code, deviceAuthDetails) {
		try {
			const fortniteToken = await request.post({
				url: Endpoints.OAUTH_TOKEN,
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Authorization: `basic ${deviceAuthDetails ? Tokens.IOS_TOKEN : Tokens.FORTNITE_TOKEN}`,
				},
				form: deviceAuthDetails
					? {
							grant_type: "device_auth",
							account_id: deviceAuthDetails.accountId,
							device_id: deviceAuthDetails.deviceId,
							secret: deviceAuthDetails.secret,
					  }
					: {
							grant_type: "exchange_code",
							exchange_code: code,
							token_type: "eg1",
					  },
				json: true,
			});
			return { success: true, response: fortniteToken };
		} catch (err) {
			return { success: false, response: err };
		}
	}

	async reauthenticate() {
		if (this.isRefreshing) return;
		this.isRefreshing = true;
		this.Client.config.debug("Reauthenticating...");
		if (!this.reauths.refresh_token || !this.reauths.token_type || !this.reauths.expires_at) {
			this.isRefreshing = false;
			throw new Error("Reauthenticatification failed: Reauth data missing");
		}
		const nowDate = new Date();
		const expDate = new Date(new Date(this.reauths.expires_at).getTime() - 15 * 60000);
		if (expDate < nowDate) {
			this.isRefreshing = false;
			throw new Error("Reauthenticatification failed: Refreshtoken expired. Please restart authentification");
		}
		let fortniteToken;
		try {
			fortniteToken = await request.post({
				url: Endpoints.OAUTH_TOKEN,
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Authorization: `basic ${this.usedDeviceAuth ? Tokens.IOS_TOKEN : Tokens.FORTNITE_TOKEN}`,
				},
				form: this.usedDeviceAuth
					? {
							grant_type: "device_auth",
							account_id: this.deviceAuthDetails.accountId,
							device_id: this.deviceAuthDetails.deviceId,
							secret: this.deviceAuthDetails.secret,
					  }
					: {
							grant_type: "refresh_token",
							refresh_token: this.reauths.refresh_token,
							token_type: "eg1",
					  },
				json: true,
			});
		} catch (err) {
			this.isRefreshing = false;
			throw new Error(`Reauthenticatification failed: ${err}`);
		}

		this.auths.access_token = fortniteToken.access_token;
		this.auths.expires_at = fortniteToken.expires_at;
		this.auths.token_type = fortniteToken.token_type;

		this.reauths.refresh_token = fortniteToken.refresh_token;
		this.reauths.expires_at = fortniteToken.refresh_expires_at;
		this.reauths.token_type = fortniteToken.token_type;

		const communicator = await this.Client.Communicator.reconnect();
		if (!communicator.success)
			throw new Error(`Reauthenticatification failed: Communicator can't reconnect: ${communicator.err}`);
		await this.Client.updateFriendsCache();
		if (this.Client.party) await this.Client.party.leave(true);
		this.scheduleReauth();

		const endAuth = new Date();
		const usedtime = (endAuth.getTime() - nowDate.getTime()) / 1000;
		this.Client.config.debug(`Reauthentification successful (${usedtime.toFixed(1)}s)`);
		this.isRefreshing = false;
	}

	async checktoken() {
		if (!this.auths.access_token || !this.auths.expires_at) {
			return { valid: false };
		}
		const nowDate = new Date();
		const expDate = new Date(new Date(this.auths.expires_at).getTime() - 15 * 60000);

		if (expDate < nowDate) {
			return { valid: false };
		}
		return { valid: true };
	}

	async refreshtoken() {
		if (!this.auths.access_token || !this.auths.expires_at) {
			return this.reauthenticate();
		}
		const nowDate = new Date();
		const expDate = new Date(new Date(this.auths.expires_at).getTime() - 15 * 60000);

		if (expDate < nowDate) {
			return this.reauthenticate();
		}
		return { valid: true };
	}

	consoleQuestion(question, time = 15000) {
		const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
		return new Promise((res, rej) => {
			rl.question(question, (answer) => {
				rl.close();
				res(answer);
			});
			setTimeout(() => rej(new Error("Console question timeout exceed!")), time);
		});
	}

	scheduleReauth() {
		if (this.scheduledReauth) clearTimeout(this.scheduledReauth);

		const nowDate = new Date();
		const expDate = new Date(new Date(this.auths.expires_at).getTime() - 5 * 60000);

		this.scheduledReauth = setTimeout(() => {
			this.reauthenticate();
		}, expDate.getTime() - nowDate.getTime());
	}
};
