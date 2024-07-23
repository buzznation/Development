const { PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: {
    name: 'ticketpurge',
    description: 'Purge all ticket channels and clear the ticket log.',
    defaultPermission: false, // Ensure this command is not available by default
  },
  async execute(interaction) {
    const guild = interaction.guild;
    const ownerId = guild.ownerId;

    // Check if the command user is the server owner
    if (interaction.user.id !== ownerId) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    // Delete all ticket channels
    const ticketChannels = guild.channels.cache.filter(channel => channel.name.startsWith('ticket-'));
    await Promise.all(ticketChannels.map(channel => channel.delete()));

    // Clear the ticket log
    const logFilePath = path.join(__dirname, '..', '..', 'tickets-log.json');
    if (fs.existsSync(logFilePath)) {
      fs.writeFileSync(logFilePath, JSON.stringify({ tickets: [], nextTicketNumber: 1 }, null, 2));
    }

    await interaction.reply({ content: 'All tickets have been purged and the log has been cleared.', ephemeral: true });
  },
};
