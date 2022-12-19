const { Command } = require("discord.js-commando");
var fetch = require('node-fetch')
module.exports = class FeaturedIslandCommand extends Command {
    constructor(client) {
        super(client, {
            name: "fn-featured-islands", //lowercase
            memberName: "", //lowercase
            aliases: ["fortnite-featured-islands", "fn-islands", "fortnite-islands"],
            group: "fortnite", // [audio, bot, dev, fortnite, fun, games, media, minecraft, mod, nsfw, stats, util]
            description: "",
            examples: [""],

            clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS

            // if no args, delete the args object COMPLETLY

        });
    }

    async run(msg, args) {
        var headers = { Authorization: "f6fce57c-e09f7d37-9051f5b9-8c57160e" }
        var islands = await fetch('https://fortniteapi.io/creative/featured', {
            method: "GET",
            headers: headers,
        })
        islands = await islands.json()

        if (!islands.result) return msg.reply("It currently doesn't have featured islands.")
        var fields = []
        islands.featured.map(island => {
            fields.push({ name: island.title + ' (' + island.code + ')', value: island.description + "\n **Creator: " + island.creator + "**\n **Tags:**\n " + island.tags.map(tag => tag).join('\n') })
        })
        msg.reply({ title: "Fortnite featured islands", embed: { fields: fields } })
    }
};