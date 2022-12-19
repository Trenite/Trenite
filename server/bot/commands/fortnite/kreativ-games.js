const { Command } = require("discord.js-commando");
const { NS_GEOLOC } = require("stanza/Namespaces");
const { Client, Enums } = require("fnbr");
var auth;

module.exports = class FNCreativeeCommand extends Command {
  constructor(client) {
    super(client, {
      name: "fn-creative", //lowercase
      memberName: "fn-creative", //lowercase
      aliases: [],
      group: "fortnite", // [audio, bot, dev, fortnite, fun, games, media, minecraft, mod, nsfw, setup, stats, util]
      description: "host a creative lobby.",
      examples: [""],
      userPermissions: ["MANAGE_MESSAGES"],
      clientPermissions: ["SEND_MESSAGES"], // https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
      PartnerOnly: true,
      // if no args, delete the args object COMPLETLY
      args: [
        {
          key: "anzahl",
          prompt: "How many user can play?",
          type: "string",
        },
        {
          key: "map",
          prompt: "Which Map?",
          type: "string",
        },
      ],
    });
    this.client.once("providerReady", () => {
      this.ready();
    });
    this.fnbot = new Client({
      deviceAuthOptions: {
        createNew: false, // TURN THIS TO FALSE AFTER THE DETAILS WERE GENERATED
        deleteExisting: false,
      },
      createPartyOnStart: true,
      auth: {
        deviceAuth: auth,
      },
    });
  }

  async ready() {
    this.client.guilds.cache.forEach((guild) => {
      this.client.provider.set(guild, "creative", false);
      var fnbots = this.client.provider.get("global", "fn-bots");
      fnbots.forEach((bot) => {
        bot.active = false;
      });
      this.client.provider.set("global", "fn-bots", fnbots);
    });
  }
  async fn(msg, users, anzahl, announcemsg) {
    console.log(users);
    anzahl = users.length;
    console.log(anzahl);
    var fnbots = this.client.provider.get("global", "fn-bots");
    this.client.provider.set(msg.guild, "creative", true);
    console.log(fnbots);
    var production = true;
    fnbots = fnbots.filter((x) => x.production == production);
    var spielers = [];
    if (fnbots.find((x) => x.guild === msg.guild.id)) {
      fnbots === fnbots.filter((x) => x.guild === msg.guild);

      auth = fnbots[Math.floor(Math.random() * fnbots.length)];
    } else {
      fnbots = fnbots.filter((x) => x.active != true);
      if (!fnbots) {
        this.client.treniteLog(
          "<@495517815055450112> no fortnite bot is currently available.",
          { noEmbed: true }
        );
        throw "Currently no fortnite bot is availale. The issue was reported to the developers.";
      }
      if (fnbots.length == 0) {
        this.client.treniteLog(
          "<@495517815055450112> no fortnite bot is currently available.",
          { noEmbed: true }
        );
        throw "Currently no fortnite bot is availale. The issue was reported to the developers.";
      }
      fnbots = fnbots.filter((x) => x.verify != true);
      console.log(fnbots);
      auth = fnbots[Math.floor(Math.random() * fnbots.length)];
    }

    console.log(auth.id);
    this.fnbot = new Client({
      deviceAuthOptions: {
        createNew: false, // TURN THIS TO FALSE AFTER THE DETAILS WERE GENERATED
        deleteExisting: false,
      },
      createPartyOnStart: true,
      auth: {
        deviceAuth: auth.auth,
      },
    });
    var count = 0;
    var lang = this.lang(msg.guild);
    this.fnbot.login();

    var fnbotsdb = this.client.provider.get("global", "fn-bots");
    var fnbotsdbfind = fnbotsdb.find((x) => x.id === auth.id);
    fnbotsdbfind.active = true;
    console.log(fnbotsdbfind);

    this.client.provider.set("global", "fn-bots", fnbotsdb);
    this.client.setTimeout(
      async function () {
        announcemsg.edit(
          lang.start.replace("{bot}", this.fnbot.user.displayName),
          { title: lang.title }
        );
      }.bind(this),
      1000 * 5
    );

    this.client.setTimeout(
      async function () {
        try {
          this.fnbot.setStatus("Trenite Discord Bot");
          console.log(Enums.PartyPrivacy.PRIVATE);
          this.fnbot.party.setPrivacy(Enums.PartyPrivacy.FRIENDS);
          this.fnbot.party.setPlaylist(Enums.Gamemode.CREATIVE);
        } catch (error) {
          console.log(this.fnbot);
          console.log("Status konnte nicht eingestellt werden.");
        }
        announcemsg.edit(lang.anschreiben.replace("{anzahl}", users.length), {
          title: lang.title,
        });

        var userdb = await this.client.provider.get(msg.guild, "fn-users");
        if (!userdb) {
          var fnbotsdb = this.client.provider.get("global", "fn-bots");
          var fnbotsdbfind = fnbotsdb.find((x) => x.id === auth.id);
          fnbotsdbfind.active = false;

          this.client.provider.set("global", "fn-bots", fnbotsdb);
          this.client.provider.set(msg.guild, "creative", false);
          throw "Your guild doesn't have verified members.";
        }
        users.forEach(async (user) => {
          userdb = await userdb.find((x) => x.id === user.discordID);

          if (!userdb) return console.log(user.discordID + "isn't linked.");
          //var userdb = await this.client.provider.get(msg.guild, "fn-users");
          //userdb = await users.find((x) => x.discord_id === user.discordID);
          //console.log(user);
          user = await this.client.users.resolve(user.discordID);
          //	if (user.id === this.client.user.id) return;

          if (!userdb) return user.send(lang.notlinked, "Error");
          var epicGames = this.fnbot;
          var declined = true;
          while (declined) {
            try {
              await this.fnbot.addFriend(userdb.fn_id);

              await user.send(
                lang.receiveFA.replace("{bot}", this.fnbot.user.displayName),
                { title: lang.title }
              );
            } catch (error) {
              console.log(this.fnbot.user);
              await user.send(
                lang.alreadyFA.replace("{bot}", this.fnbot.user.displayName),
                { title: lang.title }
              );
            }

            if (!(await this.fnbot.friends.get(userdb.fn_id))) {
              var anyEvent = await Promise.race([
                this.fnbot.waitForEvent(
                  `friend#${userdb.fn_id}:request:decline`,
                  120000
                ),
                this.fnbot.waitForEvent(`friend#${userdb.fn_id}:added`, 120000),
              ]);
              if (anyEvent.status === "DECLINED") {
                var reAdd = await user.send(lang.autodecline, {
                  title: lang.title,
                });
                declined = true;
                await reAdd.react("🔄");
                await reAdd.awaitReactions((_, u) => u.id === user.id, {
                  max: 1,
                });
              }
              count++;
            } else {
              declined = false;
            }
          }
          //if (!declined) return;

          this.fnbot.party.invite(userdb.fn_id);
          user.send(lang.invite.replace("{bot}", this.fnbot.user.displayName), {
            title: lang.title,
          });

          count++;
          spielers.push({ id: user.id });

          var interval = this.client.setInterval(
            async function () {
              console.log(count);
              console.log(anzahl);
              if (count == anzahl) {
                console.log("Party verlassen.");
                this.client.setTimeout(
                  async function () {
                    await this.fnbot.party.leave();
                    await this.client.clearInterval(interval);
                    await announcemsg.edit(
                      lang.started.replace("{anzahl}", spielers.length)
                    );
                    this.client.provider.set(msg.guild, "creative", false);
                    var fnbotsdb = this.client.provider.get(
                      "global",
                      "fn-bots"
                    );
                    var fnbotsdbfind = fnbotsdb.find((x) => x.id === auth.id);
                    fnbotsdbfind.active = false;

                    this.client.provider.set("global", "fn-bots", fnbotsdb);
                    var members = this.client.provider.get(
                      msg.guild,
                      "fn-users"
                    );
                    users.forEach(async (user) => {
                      console.log(user);
                      userdb = await members.find((x) => x.id === user.id);
                      console.log(userdb);

                      //var userdb = await this.client.provider.get(msg.guild, "fn-users");
                      //userdb = await users.find((x) => x.discord_id === user.discordID);
                      //console.log(user);
                      user = await this.client.users.resolve(user.id);
                      this.fnbot.removeFriend(userdb.fn_id);
                    });
                  }.bind(this),
                  1000 * 1
                );
              }
            }.bind(this),
            1000 * 2
          );
        });

        //  this.client.setTimeout(async function () {}.bind(this), 1000 * 30);
      }.bind(this),
      1000 * 10
    );
  }
  async init() {
    this.fnbot.login();
  }
  async run(msg, args, lang) {
    var { client, author } = msg;
    var { anzahl, map } = args;
    var lang = this.lang(msg.guild);
    var alreadyrunning = this.client.provider.get(msg.guild, "creative");
    if (alreadyrunning) {
      var alreadyrunningmsg = await msg.author.send(lang.alreadyrunning);
      alreadyrunningmsg.react("❌");
      const filter = (reaction, user) => {
        return reaction.emoji.name === "❌" && user.id === msg.author.id;
      };
      const collector = await alreadyrunningmsg.createReactionCollector(
        filter,
        {
          //	time: 1000 * 60 * 4,
          //errors: ["time"],
        }
      );
      collector.on("collect", async (reaction, user) => {
        //do stuff
        console.log("Test");
        alreadyrunningmsg.edit({
          embed: { title: lang.title, description: lang.cancel },
        });
        this.client.provider.set(msg.guild, "creative", false);
      });
      return;
    }
    this.client.provider.set(msg.guild, "creative", true);
    console.log(lang);
    var announcemsg = await msg.reply({
      embed: {
        fields: [
          { name: lang.players, value: "0" },
          { name: lang.hoster, value: "<@" + msg.author.id + ">" },
          { name: lang.map, value: map },
        ],
      },
    });
    announcemsg.react("✅");
    var trys = 0;
    var count;
    var announcementreactions;
    var users = [];

    //if (trys === 1) return;
    //trys++;
    //	this.client.setTimeout(1000);
    var hostermsg = await msg.author.send({
      title: lang.title,
      embed: {
        fields: [{ name: lang.players, value: "0" }],
        description: lang.hosterauswahl,
      },
    });
    hostermsg.react("✅");
    hostermsg.react("❌");
    const hostfilter = (reaction, user) => {
      return user.id === msg.author.id;
    };
    const hostcollector = await hostermsg.createReactionCollector(hostfilter, {
      //	time: 1000 * 60 * 4,
      //errors: ["time"],
    });
    hostcollector.on("collect", async (reaction, user) => {
      if (reaction.emoji.name === "✅") {
        this.client.clearInterval(interval);
        this.fn(msg, users, anzahl, announcemsg);
        announcemsg.reactions.removeAll();
        hostermsg.edit("Starting");
        return;
      }
      if (reaction.emoji.name === "❌") {
        announcemsg.reactions.removeAll();
        this.client.clearInterval(interval);
        announcemsg.edit("Canceled");
        hostermsg.edit("canceld");
      }
    });
    var interval = await this.client.setInterval(
      async function () {
        users = [];
        //	count = await this.Reactions(announcemsg, msg, map);
        count = 0;
        announcementreactions = await announcemsg.reactions.cache.find(
          (r) => r.emoji.name === "✅"
        );
        announcementreactions.users.cache.forEach(async (user) => {
          if (user.id == this.client.user.id) return console.log("Trenite");
          console.log("Richtiger User");
          count++;

          users.push({ discordID: user.id });
        });

        announcemsg.edit({
          title: lang.title,
          embed: {
            fields: [
              {
                name: lang.players,
                value: count,
              },
              {
                name: lang.hoster,
                value: "<@" + msg.author.id + ">",
              },
              { name: lang.map, value: map },
            ],
          },
        });
        console.log(anzahl);
        console.log(count);
        if (anzahl > count) return console.log("Zu wenig User.");
        this.client.clearInterval(interval);
        this.fn(msg, users, anzahl, announcemsg);
        announcemsg.reactions.removeAll();
      }.bind(this),
      1000 * 2
    );

    //	this.client.clearInterval(interval);

    //	announcementreactions.reactions.removeall();
  }
};
