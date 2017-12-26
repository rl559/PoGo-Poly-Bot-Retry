/* jshint esversion: 6 */
/* jshint node: true */
const Discord = require("discord.js"),
	client = new Discord.Client(),
	newUsers = [],
	request = require('request').defaults({
		encoding: null
	}),
	DateTime = require('datetime-converter-nodejs'),
	Moment = require('moment-timezone'),
	moment = require('moment'),
	Exif = require("simple-exiftool"),
	textract = require("textract"),
	Jimp = require("jimp"),
	GMapsAPI = require("./classes/GMapsAPI.js"),
	GMapsObj = new GMapsAPI(),
	Address = require("./classes/Address.js"),
	AddressObj = new Address(),
	PokedexCmd = require("./classes/PokedexCmd.js"),
	PokedexObj = new PokedexCmd(),
	Invite = require("./classes/Invite.js"),
	InviteObj = new Invite(),
	TAddDel = require("./classes/TAddDel.js"),
	TAddDelObj = new TAddDel(),
	Userinfo = require("./classes/Userinfo.js"),
	UserinfoObj = new Userinfo(),
	Help = require("./classes/Help.js"),
	HelpObj = new Help(),
	Callme = require("./classes/Callme.js"),
	CallmeObj = new Callme(),
	BotContact = require("./classes/BotContact.js"),
	BotContactObj = new BotContact(),
	TwitterMsgs = require("./classes/TwitterMsgs.js"),
	TwitterObj = new TwitterMsgs(),
	GymNotice = require("./classes/GymNotice.js"),
	GymNoticeObj = new GymNotice(),
	Rraid = require("./classes/Rraid.js"),
	RraidObj = new Rraid(),
	raidChannelPattern = new RegExp(/raids/);

var raidBosses = require('./data/raidboss.json'),
	timesAnHour = 0;


client.login("Mzk0MTMyNTcyNzYzODQ4NzA1.DSAKTA.d2r7QnChHAAcLD7mqXeYczsK4Mo");

client.on("ready", () => {
	console.log("I am ready!");
	client.setInterval( everyHour, 900000 );//3600000 1800000 1200000 900000 60000
});

//start tweet messaging service
TwitterObj.display(client);

client.on("guildMemberAdd", (member) => {
	const guild = member.guild;
	
	console.log(`New User "${member.user.username}" has joined "${member.guild.name}"`);
	member.user.send(`Welcome! ${member.user.username} to **${member.guild.name}**
  Here are a few things to start with:
  1. __**Please**__ go ahead and read the **#rules** channel for general information, as well as rules and guidelines on how to use the **PoGoPoly** discord server.
  2. __**Please Do Not**__ post raids in the **#general** channel, use the **#raids** channel. It helps keep the conversations organized.  
  3. If you don't see any of the other channels please be patient. Contact an admin, and someone will give you permissions as soon as possible.
  4. To change your nickname, you can use the \`.callme\` command followed by the nickname you want to use. Your nickname will only change in this server.  Changing it to your PoGo account name will help others identify you.
  5. Use @here to notify active users in the current channel. It will help you call the attention of people that may be interested in your post, but __please do not misuse__ @here. Use it only when absolutely necessary.
  6. You can use the \`.tadd\` and \`.tdel\` commands to receive @ notifications for specific tiers of raids.  For example, try .tadd T5 or .tadd tier 5.
	7. You can also notify others of raids at poly, using \`.rraid PokeName MinsLeft\`
	8. Use the voice channels in times of inclement weather.
  9. Under no circumstances should you cause drama or fight with other members. If you need to talk, create a private group chat and talk it out there.
	10. If you are having issues, or want to learn more what the bot can do, just type \`.help\`
  Happy Hunting, hope you catch 'em all.`);

	let role = member.guild.roles.find("name", 'Member');
	member.addRole(role).catch(console.error);
	
	
  if (!newUsers[guild.id]){
	 newUsers[guild.id] = new Discord.Collection(); 
  } 
  newUsers[guild.id].set(member.id, member.user);
});

client.on("guildMemberRemove", (member) => {
  const guild = member.guild;
  if ( newUsers[guild.id] && newUsers[guild.id].has(member.id) ){
	  newUsers[guild.id].delete(member.id);
  }
});

//actually runs every 15 minutes
function everyHour(){
	let currentDate = Moment().tz('America/New_York').format('YYYY-MM-DD HH:MM:SS');
	let currentDateString = Moment().tz('America/New_York').format( 'YYYY-MM-DD');
	let currentTime = Moment().tz('America/New_York');
	if( currentTime.hour() <= 23 && currentTime.hour() >= 6 ){
		client.guilds.forEach((item, index)=>{
			if ( newUsers[index] && newUsers[index].size > 0 && timesAnHour == 0) {
				const userlist = newUsers[index].map(u => u.toString()).join(" ");
				item.channels.find('name', 'announcements').send("Welcome our new members!\n" + userlist);
				newUsers[index].clear();
			}

			/*
			 * Clear pinned messages on raid channels. (only 1 right now)
			 */
			
				item.channels.forEach((item, index)=>{
					if( raidChannelPattern.test( item.name ) ){
						item.fetchPinnedMessages()
						.then((pinnedMessages)=>{
							if( pinnedMessages.size > 0){
								pinnedMessages.forEach(( message, index)=>{
									let timerEnds = new Date( currentDateString + ' ' + message.embeds[0].fields[2].value );
									//console.log( timerEnds );
									//console.log( currentDate );
									let	isExpired = moment( currentDate ).isAfter( timerEnds );
									
									//console.log( 'timerends: ' + timerEnds + ' currentTime: '+ currentDate + ' isExpired: '+isExpired );
									if( isExpired ){
										message.unpin();
									}

								});
							}
						})
						.catch((error)=>{
							if(error){
								console.log(error);
							}
						});
					}
				});
		});
	}
	if( timesAnHour >= 3 ){
		timesAnHour = 0;
	}else{
		timesAnHour++;
	}
}

client.on("message", (message) => {
	// Set the prefix
	let prefix = ".",
		channelName = message.channel.name,
		currentTime = Moment().tz('America/New_York');
	
	if( message.system && message.type === 'PINS_ADD' && raidChannelPattern.test(channelName) && message.author.username === 'PoGoPolyBot' ){
		message.delete();
	}
	
	if( message.author.username == 'GymHuntrBot' || message.author.username == 'PoGoPolyBot' ){
		GymNoticeObj.display(message, GMapsObj);
	}
	
	if (message.author.bot) return;
	
	if( message.isMentioned(message.guild.members.get("394132572763848705")) ){
		BotContactObj.display(message);
	}
	
	/*
	 * CALLME
	 */
	if (message.content.startsWith(prefix + "callme")) {
		CallmeObj.display(prefix, message);
	}
	
	/*
	 * HELP
	 */
	if (message.content.startsWith(prefix + "help")) {
		HelpObj.display(prefix, message);
	}
	
	/*
	 * test Commands (commented out)
	 */
	 /*
	 if (message.content.startsWith(prefix + "test1")) {
		 //Put stuff here to test.
		 message.guild.channels.find('name', 'raids').send({
			 "embed": {
				 "color": 3447003,
				 "title": 'Level 4 Raid has started!',
				 "url": 'https://GymHuntr.com/#28.144546148580186,-81.84874534606935',
				 "thumbnail": {
					 "url": 'http://www.serebii.net/pokemongo/pokemon/248.png',
				 },
				 description: '**GymName**\nTyranitar\n**CP:** 34707 - **Moves:** Iron Tail / Crunch\n*Raid Ending: 0 hours 45 min 50 sec*'
			 }
		 });
	 }
	 if (message.content.startsWith(prefix + "test2")) {
		 message.guild.channels.find('name', 'raids').send({
			 "embed": {
				 "color": 3447003,
				 "title": 'Level 4 Raid is starting soon!',
				 "url": 'https://GymHuntr.com/#28.144546148580186,-81.84874534606935',
				 "thumbnail": {
					 "url": 'https://images-ext-2.discordapp.net/external/zVajuJNDDxqjZc8VAUCL5txYG8yGYm2wFcOCMbC3ugw/https/raw.githubusercontent.com/PokeHuntr/Assets/master/raidlevels/4.png?width=160&height=154',
				 },
				 description: '**GymName**\n*Raid Starting: 0 hours 45 min 50 sec*'
			 }
		 });
	 }*/
	 
	 /*
	 * rraid
	 */
	 if(message.content.startsWith(prefix + "rraid")) {
				RraidObj.display(prefix, message, raidBosses);
		 }
	
	/*
	 * USERINFO Command
	 */
	if (message.content.startsWith(prefix + "userinfo")) {
		UserinfoObj.display(prefix, message, channelName);
	}
	
	/*
	 *  tadd - tdel Command
	 */
	if (message.content.startsWith(prefix + "tdel")) {
		TAddDelObj.tdel(prefix, message);
	} else if (message.content.startsWith(prefix + "tadd")) {
		TAddDelObj.tadd(prefix, message);
	}
	
	/*
	 * INVITE COMMAND
	 */
	if (message.content.startsWith(prefix + "invite")) {
		InviteObj.genInvite(message);
	}

	/*
	 * POKEDEX COMMAND
	 */
	if (message.content.startsWith(prefix + "pokedex")) {
		PokedexObj.display(prefix, message);
	}
	/*
	 * ADDRESS COMMAND
	 */
	if (message.content.startsWith(prefix + "address")) {
		AddressObj.display(message, prefix, GMapsObj);
		}

});