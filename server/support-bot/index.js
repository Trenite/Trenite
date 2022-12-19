// Require Packages
const Discord = require("discord.js");
const mongoose = require("mongoose");
const footer = "Trenite Support";
const logo =
    "https://cdn.discordapp.com/attachments/689235943475249153/700664802254651473/Trenite_silver_-_big_1_1.png";
const client = new Discord.Client();
const prefix = ".";
const ownerID = [
    "311129357362135041",
    "417699816836169728",
    "390810485244821505",
    "495517815055450112",
];
const shelljs = require("shelljs");
const active = new Map();
const status = require("./mongoose_schema/status");
const token = "NzAwNjM2MDI5MjUzNzEzOTkw.Xpl0Rg.4PJIFy3X8sotux3BTzKIJHWCYkg";
const discord = require("discord-rich-presence")("689577516150816866");
let starttime = Date.now();
mongoose.set("useUnifiedTopology", true);
mongoose.connect(
    "mongodb+srv://trenite:aXYdw7DeCJoJ4t1f@cluster0-eunfd.mongodb.net/trenitesupport?retryWrites=true&w=majority", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }
);
mongoose.connection.on("connected", () => {
    console.log("nice");
});
console.log(
    "Started!"
);
/*
discord.updatePresence({
	details: "Waiting for Support",
	startTimestamp: starttime,
	endTimestamp: "1507665886",
	largeImageKey: "logo1024",
	smallImageKey: "KEY_HERE",
	largeImageText: "Trenite Support",
	smallImageText: "TEXT HERE",
	instance: true,
	partyID: "ae488379-351d-4a4f-ad32-2b9b01c91657",
	partySize: 1,
	partyMax: 5,
	spectateSecret: "MTIzNDV8MTIzNDV8MTMyNDU0",
	joinSecret: "MTI4NzM0OjFpMmhuZToxMjMxMjM=",
});*/

client.login(token);
client.on('ready', async() => {
    setInterval(async function() {
        const guild = client.guilds.resolve("683026970606567440");
        var supportstandart = guild.roles.resolve("728603408684023851");
        //    supportstandart.members.map(u => { var users = u.members })
        supportstandart.members.map(u => {
            if (
                u.presence.status === "online" ||
                u.presence.status === "dnd" ||
                u.presence.status === "idle"
            ) {
                u.roles.add("704661047612538890");
            } else {
                u.roles.remove("704661047612538890");
            }
            if (u.presence.status === 'offline') { u.roles.remove("704661047612538890"); }
        })

        guild.members.cache.forEach((member) => {

            if (!member.roles.cache.has("728603408684023851"))
                return member.roles.remove("704661047612538890");

        });
    }, 30000);
})
client.on("ready", () => {
    console.log(`Auf dem Support Server sind ${client.users.cache.size} Users.`);

    client.user.setStatus("online");
    client.user.setPresence({
        activity: {
            name: "MESSAGE ME FOR HELP | Available support: 0",
        },
    });
    setInterval(async function() {
        const data = await status.findOne({ botid: "689577516150816866" });
        const guild = client.guilds.resolve("683026970606567440");
        const statuschannel = await client.channels.resolve('700639028030078997');
        const statusmsg = await statuschannel.messages.fetch("728608431925362749");
        const trenite = await client.users.resolve("689577516150816866");
        var botstatus = "offline";
        if (trenite.presence.status === "online") {
            botstatus = "🟢 online 🟢";
        } else {
            botstatus = " 🔴 offline 🔴";
            const log = client.channels.resolve("683027288283021388");
        }


        var websitestatus = data.website;
        var websitestatus2 = "0";
        //	console.log(websitestatus);
        try {
            if (websitestatus === "online") {
                websitestatus2 = "🟢 online 🟢";
            } else if (websitestatus === "offline") {
                websitestatus2 = "🔴 offline 🔴";
            } else {
                websitestatus2 = `🟠 ${websitestatus} 🟠`;
            }
            var supportsize = guild.roles.resolve("704661047612538890").members.size;
            var support = guild.roles.resolve("704661047612538890")
            const embed = new Discord.MessageEmbed()
                .setThumbnail(
                    "https://cdn.discordapp.com/attachments/689235943475249153/700664802254651473/Trenite_silver_-_big_1_1.png"
                )
                .setTitle(`Trenite Status`)
                .addField(`Discord Bot Status:`, botstatus)
                .addField("Website:", websitestatus2)
            if (support.members.size === 0) { embed.addField("Available support: 0", "currently no supporter is online."); } else {
                embed.addField("Available support: " + supportsize, support.members.map(u => `<@${u.id}>`))
            }
            //console.log(websitestatus2);



            embed.setFooter(`Trenite | trenite.tk`);

            statusmsg.edit("https://status.trenite.tk", embed);
            client.user.setPresence({
                activity: {
                    name: "MESSAGE ME FOR HELP | Available support: " + supportsize,
                },
            });
        } catch (error) {
            console.log(error);
        }
        //console.log(statusmsg);
    }, 30000);
});
const db = require("quick.db");
client.on("message", async(message) => {
    const log = client.channels.resolve("690166719087378504");

    if (message.channel.id === "687299416012488711") {
        if (message.embeds && message.embeds.length && message.embeds[0].title) {
            if (
                message.embeds[0].title.includes("skipped on master") ||
                message.embeds[0].description.includes("update version - Trenite") ||
                message.embeds[0].description.includes("GitHub Actions checks")
            ) {
                return message.delete();
            }
        }
    }

    /* if (message.author.bot) return;
    if (message.author.id === client.user.id) return;
    if (message.guild === null) {
        let active = await db.fetch(`support_${message.author.id}`);
        let guild = client.guilds.resolve("683026970606567440");
        let channel,
            found = true;
        try {
            if (active) client.channels.resolve(active.channelID).guild;
        } catch (e) {
            found = false;
        }
        if (!active || !found) {
            active = {};
            let modRoles = guild.roles.cache.find(
                (r) => r.id === "690104317675700464"
            );
            const everyone = guild.roles.cache.find(
                (role) => role.id === "683026970606567440"
            );

            channel = await guild.channels.create(
                `${message.author.username}-${message.author.discriminator}`
            );
            channel.setParent("689411428657922091");
            channel.setTopic(
                `_complete to close the Ticket | ModMail for ${message.author.tag} | ID: ${message.author.id}`
            );
            channel.createOverwrite(modRoles, {
                VIEW_CHANNEL: true,
                SEND_MESSAGES: true,
                MANAGE_CHANNELS: true,
            });
            channel.createOverwrite(everyone, {
                VIEW_CHANNEL: false,
            });
            let author = message.author;
            const logembed = new Discord.MessageEmbed()
                .setColor("36393E")
                .setAuthor(author.tag, author.displayAvatarURL)
                .setFooter("ModMail Ticket Created")
                .addField("User", author)
                .addField("ID", author.id)
                .addField("Channel", channel)
                .setFooter(footer, logo)
                .setTimestamp();
            log.send(logembed);

            const newChannel = new Discord.MessageEmbed()
                .setColor("36393E")
                .setAuthor(author.tag, author.displayAvatarURL)
                .setFooter("ModMail Ticket Created")
                .addField("User", author)
                .addField("ID", author.id)
                .setFooter(footer, logo);
            await channel.send(newChannel);
            const support3 = await guild.roles.resolve("704661047612538890");

            const newTicket = new Discord.MessageEmbed()
                .setColor("36393E")
                .setAuthor(`Hello, ${author.tag}`, author.displayAvatarURL)
                .setDescription("ModMail Ticket Created")
                .setFooter(footer, logo);
            await author.send(newTicket);

            active.channelID = channel.id;
            active.targetID = author.id;

            const dm = new Discord.MessageEmbed()
                .setColor("36393E")
                .setAuthor(
                    `Thank you, ${message.author.tag}`,
                    message.author.displayAvatarURL
                )
                .setDescription(
                    `Your message has been sent -- A staff member will be in contact soon.`
                )
                .setThumbnail(logo)
                .setFooter(footer, logo);

            await message.author.send(dm);
        }
        channel = client.channels.resolve(active.channelID);
        const embed = new Discord.MessageEmbed()
            .setColor("36393E")
            .setAuthor(message.author.tag, message.author.displayAvatarURL)
            .addField("Content", message.content)
            .setDescription(`Message Recieved -- ${message.author.tag}`)
            .setFooter(footer, logo);

        await channel.send(embed);
        db.set(`support_${message.author.id}`, active);
        db.set(`supportChannel_${channel.id}`, message.author.id);
        return;
    }

    let support = await db.fetch(`supportChannel_${message.channel.id}`);
    if (support) {
        support = await db.fetch(`support_${support}`);
        let supportUser = client.users.resolve(support.targetID);
        if (!supportUser) return message.channel.delete();
        console.log(support);

        if (message.content.toLowerCase() === "_complete") {
            const complete = new Discord.MessageEmbed()
                .setColor("36393E")
                .setAuthor(`Hey, ${supportUser.tag}`, supportUser.displayAvatarURL)
                .setFooter("Ticket Closed")
                .setDescription(
                    "*Your ModMail has been marked as **Complete**. If you wish to reopen this, or create a new one, please send a message to the bot.*"
                )
                .setThumbnail(logo)
                .setFooter(footer, logo);

            supportUser.send(complete);
            const logembed = new Discord.MessageEmbed()
                .setColor("36393E")
                .setAuthor(supportUser.tag, supportUser.displayAvatarURL)
                .setFooter("ModMail Ticket deleted")
                .addField("User", supportUser)
                .addField("ID", supportUser.id)
                .addField("Deleted by", message.author)
                .setFooter(footer, logo);
            log.send(logembed);
            message.channel
                .delete()
                .then(console.log(`Support for ${supportUser.tag} has been closed.`))
                .catch(console.error);

            return db.delete(`support_${support.targetID}`);
        }
        const embed = new Discord.MessageEmbed()
            .setColor("36393E")
            .setAuthor(message.author.tag, message.author.displayAvatarURL)
            .setFooter(`Message Recieved`)
            .setDescription(message.content);

        client.users.resolve(support.targetID).send(embed);
        message.delete({ timeout: 1000 });
        embed
            .setFooter(`Message Sent -- ${supportUser.tag}`, logo)
            .setDescription(message.content);
        return message.channel.send(embed);
    }
*/

    let msg = message.content.toUpperCase();
    let sender = message.author;
    let args = message.content.slice(prefix.length).trim().split(" ");
    let cmd = args.shift().toLowerCase();

    if (!msg.startsWith(prefix)) return;
    const guild = client.guilds.resolve("683026970606567440");
    //const dev = guild.roles.resolve("683027063808327745");
    const dev = guild.roles.cache.find(
        (role) => role.id === "683027063808327745"
    );

    const member = message.author;
    if (message.content === `${prefix}status`) {
        if (!message.member.roles.cache.some(
                (role) => role.id === "683027063808327745"
            ))
            return message.reply("Keine Rechte!");
        const data = await status.findOne({ botid: "689577516150816866" });
        const embed = new Discord.MessageEmbed()
            .setTitle(`Trenite Status`)
            .addField(`Discord Status:`, ":green_circle: Online :green_circle: ")
            .addField("Website:", ":green_circle: Online :green_circle: ")
            .setFooter(`Trenite | trenite.tk`);
        const msg = await message.channel.send("https://status.trenite.tk", embed);
        message.delete();
        data.statusmsg = msg.id;
        data.statuschannel = message.channel.id;
        data.save();
    }
});