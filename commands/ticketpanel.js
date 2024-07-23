const { ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: {
    name: 'ticketpanel',
    description: 'Create or update the ticket panel in the channel where the command is used.',
  },
  async execute(interaction) {
    const member = interaction.member;
    const allowedRoles = process.env.ALLOWED_ROLES.split(',');

    // Check if the user has any of the required roles
    const hasPermission = allowedRoles.some(roleId => member.roles.cache.has(roleId));

    if (!hasPermission) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const channel = interaction.channel;
    const messages = await channel.messages.fetch();
    const existingMessage = messages.find(msg => msg.author.id === interaction.client.user.id);

    // Check if a ticket panel already exists in the channel
    if (existingMessage) {
      return interaction.reply({ content: 'A ticket panel already exists in this channel.', ephemeral: true });
    }

    // Create the embed
    const embed = new EmbedBuilder()
      .setTitle('Support Ticket Panel')
      .setDescription('Click the button below to open a support ticket. Our team will assist you shortly.')
      .setColor('#0099ff')
      .setImage('https://example.com/your-image.png') // Optional image URL
      .setFooter({ text: 'Support Bot' });

    // Create the button
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('open_ticket')
          .setLabel('Open Ticket')
          .setStyle('Primary')
          .setEmoji('✉️')
      );

    // Send the embed and button to the current channel
    await channel.send({ embeds: [embed], components: [row] });

    // Confirm creation
    await interaction.reply({ content: 'Ticket panel has been set up in this channel.', ephemeral: true });
  },
};
