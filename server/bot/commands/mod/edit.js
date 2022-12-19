const { Command } = require("discord.js-commando");

module.exports = class EditCommand extends Command {
  constructor(client) {
    super(client, {
      name: "edit", //lowercase
      memberName: "edit", //lowercase
      aliases: [],
      group: "mod", // [audio, bot, dev, fortnite, fun, games, media, minecraft, mod, nsfw, setup, stats, util]
      description: "edit a say message.",
      examples: [
        "edit https://discordapp.com/channels/683026970606567440/700597647651766324/738836717993459877",
      ],
      userPermissions: ["MANAGE_MESSAGES"],
      clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
      guildOnly: true,
      // if no args, delete the args object COMPLETLY
      args: [
        {
          key: "content",
          prompt: "new content",
          type: "string",
        },
        {
          key: "link",
          prompt: "the discord message link",
          type: "string",
        },
      ],
    });
  }

  async run(msg, args, lang) {
    var { client, author } = msg;
    var link = args.link;
    var content = args.content;
    var oldlink = args.link;
    link = link.replace("https://discordapp.com/channels/", "").split("/");
    //561235799233003551/569292707504193556/688697243619819520
    console.log(link);
    if (link.length != 3) {
      oldlink = await oldlink
        .replace("https://discord.com/channels/", "")
        .split("/");
      if (oldlink.length != 3) throw "You provided a wrong message link";
      link = oldlink;
    }
    var guild = link[0];
    var channel = link[1];
    var msg = link[2];

    guild = client.guilds.resolve(guild);
    if (!guild) throw "I must be on the guild";

    channel = guild.channels.resolve(channel);
    if (!channel) throw "I can't find the channel";

    try {
      msg = await channel.messages.fetch(msg);
    } catch (error) {
      msg = undefined;
    }
    if (!msg) throw "I can't find the message";
    if (msg.author.id != this.client.user.id)
      throw " I didn't send the message that you provide.";
    msg.edit("", {
      noEmbed: true,
      embed: {
        color: 3553598,
        author: {
          name: guild.name,
          icon_url: guild.iconURL({ type: "jpg" }),
        },
        description: content,
      },
    });
  }
};
