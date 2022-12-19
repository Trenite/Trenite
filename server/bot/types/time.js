const { ArgumentType } = require("discord.js-commando");

class TimeArgumentType extends ArgumentType {
	constructor(client) {
		super(client, "time");
	}

	validate(val) {
		const lc = val.toLowerCase();
		return this.truthy.has(lc) || this.falsy.has(lc);
	}

	parse(val) {
		const lc = val.toLowerCase();
		if (this.truthy.has(lc)) return true;
		if (this.falsy.has(lc)) return false;
		throw new RangeError("Unknown boolean value.");
	}
}

module.exports = TimeArgumentType;
