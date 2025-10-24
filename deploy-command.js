const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
    new SlashCommandBuilder()
        .setName('weather')
        .setDescription('Get current weather for a city')
        .addStringOption(option =>
            option.setName('city')
                  .setDescription('City name')
                  .setRequired(true)
        )
        ,new SlashCommandBuilder()
        .setName('traindetails')
        .setDescription('Get details of a train by its number').addStringOption(option =>
            option.setName('train_no')
                  .setDescription('Train Number')
                  .setRequired(true)
        )
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

// Replace 'YOUR_GUILD_ID' with your server ID
rest.put(Routes.applicationGuildCommands('1430826408778924043', '1430825323699638274'), { body: commands })
    .then(() => console.log('✅ Slash command registered!'))
    .catch(console.error);
