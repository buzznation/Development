module.exports = {
  data: {
    name: 'clear',
    description: 'Clears a specified number of messages.',
    options: [
      {
        type: 4, // INTEGER type
        name: 'amount',
        description: 'Number of messages to delete (1-100)',
        required: true,
      },
    ],
  },
  async execute(interaction) {
    const allowedRoles = process.env.ALLOWED_ROLES.split(',');
    const member = interaction.member;
    const hasPermission = allowedRoles.some(roleId => member.roles.cache.has(roleId));

    if (!hasPermission) {
      return await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const amount = interaction.options.getInteger('amount');

    if (amount < 1 || amount > 100) {
      return await interaction.reply({ content: 'You need to specify a number between 1 and 100.', ephemeral: true });
    }

    try {
      const fetchedMessages = await interaction.channel.messages.fetch({ limit: amount });
      await interaction.channel.bulkDelete(fetchedMessages, true);
      await interaction.reply({ content: `Deleted ${fetchedMessages.size} messages.`, ephemeral: true });
    } catch (error) {
      console.error('Error deleting messages:', error);
      await interaction.reply({ content: 'There was an error trying to delete messages.', ephemeral: true });
    }
  },
};
