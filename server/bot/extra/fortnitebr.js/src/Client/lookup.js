const request = require("request-promise");
const Endpoints = require("../../resources/Endpoints");

module.exports = class Lookup {
	constructor(client) {
		Object.defineProperty(this, "Client", { value: client });
	}

	async lookup(idorname) {
		await this.Client.Authenticator.refreshtoken();
		if (idorname.length === 32) {
			try {
				const profile = await request.get({
					url: `${Endpoints.ACCOUNT_BY_ID}/${encodeURI(idorname)}`,
					headers: {
						Authorization: `${this.Client.Authenticator.auths.token_type} ${this.Client.Authenticator.auths.access_token}`,
					},
					json: true,
				});
				return profile;
			} catch (err) {
				return false;
			}
		} else {
			try {
				const profile = await request.get({
					url: `${Endpoints.ACCOUNT_BY_NAME}/${encodeURI(idorname)}`,
					headers: {
						Authorization: `${this.Client.Authenticator.auths.token_type} ${this.Client.Authenticator.auths.access_token}`,
					},
					json: true,
				});
				return profile;
			} catch (err) {
				return false;
			}
		}
	}

	async lookupmultipleids(ids) {
		await this.Client.Authenticator.refreshtoken();
		try {
			const profile = await request.get({
				url: `${Endpoints.ACCOUNT}?accountId=${ids.join("&accountId=")}`,
				headers: {
					Authorization: `${this.Client.Authenticator.auths.token_type} ${this.Client.Authenticator.auths.access_token}`,
				},
				json: true,
			});
			return profile;
		} catch (err) {
			return false;
		}
	}

	async lookupEmail(email) {
		try {
			const profile = await request.get({
				url: `${Endpoints.ACCOUNT_BY_EMAIL}/${encodeURI(email)}`,
				headers: {
					Authorization: `${this.Client.Authenticator.auths.token_type} ${this.Client.Authenticator.auths.access_token}`,
				},
				json: true,
			});
			return profile;
		} catch (err) {
			return false;
		}
	}
};
