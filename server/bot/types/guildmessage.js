const { ArgumentType } = require("discord.js-commando");
const regexes = {
	id: /^(\d+)$/,
	pair: /^(\d+)\-(\d+)$/,
	link: /^https?:\/\/(?:(?:canary|ptb)\.)?discorda?p?p?\.com\/channels\/\d+\/(\d+)\/(\d+)$/,
};

module.exports = class GuildMessageArgumentType extends ArgumentType {
	constructor(client) {
		super(client, "guildmessage");
		this.quote = null;
	}
	async validate(val, msg) {
		let quoted;
		let channel;
		let failed = false;
		if (regexes.id.test(val)) quoted = await msg.channel.messages.fetch(val).catch(() => (failed = true));
		else if (regexes.pair.test(val) || regexes.link.test(val)) {
			val = val.match(regexes.pair.test(val) ? regexes.pair : regexes.link);
			channel = val[1];
			quoted = val[2];
			channel = this.client.channels.resolve(channel);
			if (!channel || channel.type !== "text" || channel.guild.id !== msg.guild.id) failed = true;
			else quoted = await channel.messages.fetch(quoted).catch(() => (failed = true));
		} else
			return ":warning: Invalid: Please provide a `messageid`, a `message link`, or a `channelid-messageid` pair.";
		if (failed) return ":x: Message not found.";
		this.quote = quoted;
		return true;
	}
	parse(val) {
		if (!this.quote || !this.quote.author) throw new Error("Message did not validate correctly");
		const quote = this.quote;
		this.quote = false;
		return quote;
	}
};
