const commando = require("discord.js-commando");
module.exports = class PremiumCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: "premium",
            memberName: "premium",
            aliases: [],
            group: "dev",
            description: "Premium.",
            examples: ["guilds"],
            devOnly: true,
            args: [{
                    key: "guildid",
                    prompt: "Please send the guild id.",
                    type: "string",
                },
                {
                    key: "modus",
                    prompt: "Which modus? \n options are true or false",
                    type: "boolean",
                },
            ],
        });
    }

    async run(msg, args) {
        const { channel, client } = msg;
        const { guildid, modus } = args;
        const guild = this.client.guilds.resolve(guildid);
        client.provider.set(guildid, "premium", modus);
        var premium = client.provider.get(guild.id, "premium");
        msg.reply(`${guild} new Premium Status: ${premium}`);
    }
};