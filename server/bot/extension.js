module.exports = function extend({ commando }) {
	commando.createMessage = (guild, content, opts) => {
		return commando.Client.prototype.createMessage.bind({
			guild,
			client: guild.client,
			command: {
				name: opts && opts.title ? opts.title : "",
			},
		})(content, opts);
	};
};
