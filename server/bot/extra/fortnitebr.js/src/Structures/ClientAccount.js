const User = require("./User.js");

class LauncherAccount extends User {
	constructor(client, data) {
		super(client, data);

		Object.defineProperty(this, "data", { value: data });

		this.name = data.name;
		this.lastName = data.lastName;
		this.failedLoginAttempts = data.failedLoginAttempts;
		this.lastLogin = data.lastLogin;
		this.numberOfDisplayNameChanges = data.numberOfDisplayNameChanges;
		this.ageGroup = data.ageGroup;
		this.headless = data.headless;
		this.country = data.country;
		this.preferredLanguage = data.preferredLanguage;
		this.canUpdateDisplayName = data.canUpdateDisplayName;
		this.tfaEnabled = data.tfaEnabled;
		this.emailVerified = data.emailVerified;
		this.minorVerified = data.minorVerified;
		this.minorExpected = data.minorExpected;
		this.minorStatus = data.minorStatus;
	}
}

module.exports = LauncherAccount;
