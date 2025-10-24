const { Client, GatewayIntentBits, Events, EmbedBuilder } = require('discord.js');

require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds] // Only Guilds needed for slash commands
});

client.once(Events.ClientReady, () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'weather') {
        const city = interaction.options.getString('city');

        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${process.env.WEATHER_API_KEY}&units=metric`
            );
            const data = await response.json();

            if (data.cod !== 200) {
                return interaction.reply(`City not found: ${city}`);
            }

            const weatherEmbed = new EmbedBuilder()
                .setTitle(`Weather in ${data.name}, ${data.sys.country}`)
                .addFields(
                    { name: 'Temperature', value: `${data.main.temp}°C`, inline: true },
                    { name: 'Humidity', value: `${data.main.humidity}%`, inline: true },
                    { name: 'Wind', value: `${data.wind.speed} m/s`, inline: true },
                    { name: 'Description', value: data.weather[0].description, inline: false }
                )
                .setColor(0x1D82B6);

            interaction.reply({ embeds: [weatherEmbed] });

        } catch (err) {
            console.error(err);
            interaction.reply('Error fetching weather data. Try again later.');
        }
    }

    if (interaction.commandName === 'traindetails') {
    const train_no = interaction.options.getString('train_no');
    await interaction.deferReply();

    const url = `https://railradar.in/api/v1/trains/${train_no}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            return interaction.editReply(`Could not fetch train details (status: ${response.status}).`);
        }

        const result = await response.json();
        const train = result?.data?.train;
        const live = result?.data?.liveData;

        if (!train || !train.trainName) {
            return interaction.editReply(`Train not found with number: ${train_no}`);
        }

        // --- Helper: Decode running days ---
        const getDaysFromBitmap = (bitmap) => {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            let runningDays = [];
            for (let i = 0; i < 7; i++) {
                if (bitmap & (1 << i)) runningDays.push(days[i]);
            }
            return runningDays.length > 0 ? runningDays.join(', ') : 'Not Available';
        };

        // --- Extract details ---
        const fromStation = `${train.sourceStationName} (${train.sourceStationCode})`;
        const toStation = `${train.destinationStationName} (${train.destinationStationCode})`;
        const distance = `${train.distanceKm} km`;
        const travelTime = `${Math.floor(train.travelTimeMinutes / 60)}h ${train.travelTimeMinutes % 60}m`;
        const avgSpeed = `${train.avgSpeedKmph} km/h`;
        const frequency = train.runningDaysBitmap
            ? getDaysFromBitmap(train.runningDaysBitmap)
            : 'Not Available';
        const pantry = JSON.parse(train.otherDetails)?.pantry?.notes || 'Not Available';
        const delay = live?.overallDelayMinutes ? `${live.overallDelayMinutes} min` : 'On time';

        // --- Embed ---
        const trainEmbed = new EmbedBuilder()
            .setTitle(`🚆 ${train.trainName} (${train.trainNumber})`)
            .setDescription(train.hindiName || '')
            .addFields(
                { name: 'From', value: fromStation, inline: true },
                { name: 'To', value: toStation, inline: true },
                { name: 'Type', value: train.type, inline: true },
                { name: 'Zone', value: train.zone, inline: true },
                { name: 'Distance', value: distance, inline: true },
                { name: 'Avg Speed', value: avgSpeed, inline: true },
                { name: 'Travel Time', value: travelTime, inline: true },
                { name: 'Frequency', value: frequency, inline: false },
                { name: 'Pantry Info', value: pantry, inline: false },
                { name: 'Live Delay', value: delay, inline: true }
            )
            .setURL(train.sourceUrl)
            .setColor(0x1D82B6)
            .setFooter({ text: 'Data from RailRadar.in | Updated live' });

        await interaction.editReply({ embeds: [trainEmbed] });

    } catch (error) {
        console.error(error);
        await interaction.editReply('⚠️ Error fetching train details. Try again later.');
    }
}



});

client.login(process.env.BOT_TOKEN);
