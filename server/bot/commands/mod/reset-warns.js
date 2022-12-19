const commando = require("discord.js-commando");

module.exports = class ResetWarnsCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: "reset-warns",
            memberName: "reset-warns",
            aliases: ["warn-reset", "remove-warns"],
            group: "mod",
            description: "reset warns of a user",
            examples: ["reset-warns @Wumpus"],
            guildOnly: true,
            userPermissions: ["MANAGE_MESSAGES"],
            clientPermissions: ["MANAGE_MESSAGES"],
            args: [{
                key: "member",
                prompt: "Which user do you mean?",
                type: "member",
            }, ],
        });
    }

    async run(msg, args) {
        var {
            client,
            guild
        } = msg;
        const {
            member
        } = args;
        var data = this.client.provider.get(guild, "warns");
        if (!data) data = [];
        var player = data.find((x) => x.id === member.id);
        var cringevalue = 0;
        if (player) {
            player.warns = cringevalue;
            this.client.provider.set(guild, "warns", data);
            msg.reply("Sucessfully Warns resetted!")
        } else {
            msg.reply("This Player has no warns!");
        }
    }
};