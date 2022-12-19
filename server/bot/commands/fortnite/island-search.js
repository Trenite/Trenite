const { Command } = require("discord.js-commando");
var fetch = require('node-fetch')
module.exports = class IslandSearchCommand extends Command {
    constructor(client) {
        super(client, {
            name: "fn-island", //lowercase
            memberName: "fn-island", //lowercase
            aliases: ["fortnite-island", "fortnite-islandsearch", "fortnite-island-search"],
            group: "fortnite", // [audio, bot, dev, fortnite, fun, games, media, minecraft, mod, nsfw, stats, util]
            description: "Get information about a fortnite island.",
            examples: [""],

            clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
            guildOnly: true,
            // if no args, delete the args object COMPLETLY
            args: [{
                key: "id",
                prompt: "The map id.",
                type: "string",

            }, ],
        });
    }

    async run(msg, args) {
        var id = args.id
        var headers = { Authorization: "f6fce57c-e09f7d37-9051f5b9-8c57160e" }
        var island = await fetch('https://fortniteapi.io/creative/island?code=' + id, {
            method: "GET",
            headers: headers,
        })
        island = await island.json()

        if (!island.result) return msg.reply('You provide an invalid map code.')
        msg.reply({
                description: island.island.description,
                title: island.island.title,

                embed: {
                    url: "https://epicgames.com/fn/" + id,
                    image: { link: island.island.image },
                    fields: [{
                        name: "Creator:",
                        value: island.island.creator
                    }, { name: "Island type:", value: island.island.islandType }, { name: "introduction:", value: island.island.introduction }, { name: "Tags", value: island.island.tags.map(island => island).join(" \n") }]
                }

            }

        )
    }
};