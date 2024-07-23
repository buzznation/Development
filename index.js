const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Initialize the bot client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

// Initialize commands collection
client.commands = new Map();
const commandsPath = path.join(__dirname, 'commands');

// Load commands function
const loadCommands = (dir) => {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      loadCommands(fullPath);
    } else if (file.endsWith('.js')) {
      const command = require(fullPath);
      client.commands.set(command.data.name, command);
    }
  });
};
loadCommands(commandsPath);

// Register commands with Discord
const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    const commands = Array.from(client.commands.values()).map(command => command.data);

    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands,
    });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

// Event handler when the bot is ready
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Event handler for interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand() && !interaction.isButton()) return;

  const command = client.commands.get(interaction.commandName);

  if (interaction.isCommand()) {
    if (command) {
      try {
        await command.execute(interaction);
      } catch (error) {
        console.error('Error executing command:', error);
        await interaction.reply({ content: 'There was an error executing this command.', ephemeral: true });
      }
    }
  } else if (interaction.isButton()) {
    const buttonCommand = client.commands.get(interaction.customId);
    if (buttonCommand) {
      try {
        await buttonCommand.execute(interaction);
      } catch (error) {
        console.error('Error executing button command:', error);
        await interaction.reply({ content: 'There was an error executing this button command.', ephemeral: true });
      }
    }
  }
});

// Log in to Discord
client.login(token);
