const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, AttachmentBuilder } = require('discord.js'); // Zorg ervoor dat alle benodigde modules worden geïmporteerd
const path = require('path');
const fs = require('fs');

module.exports = {
  data: {
    name: 'close_ticket',
    description: 'Close an open support ticket.',
  },
  async execute(interaction) {
    const user = interaction.member.user;
    const ticketChannel = interaction.channel;

    // Create confirmation embed
    const confirmEmbed = new EmbedBuilder()
      .setTitle('Are you sure you want to close this ticket?')
      .setColor('#ff0000')
      .setDescription('This action cannot be undone.');

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('confirm_close_ticket')
          .setLabel('Yes')
          .setStyle('Danger'),
        new ButtonBuilder()
          .setCustomId('cancel_close_ticket')
          .setLabel('No')
          .setStyle('Secondary')
      );

    const replyMessage = await interaction.reply({ embeds: [confirmEmbed], components: [row], ephemeral: true });

    // Collect the response
    const filter = i => ['confirm_close_ticket', 'cancel_close_ticket'].includes(i.customId) && i.user.id === user.id;
    const collector = ticketChannel.createMessageComponentCollector({ filter, time: 10000 });

    collector.on('collect', async i => {
      if (i.customId === 'confirm_close_ticket') {
        // Fetch chat history
        const messages = await ticketChannel.messages.fetch();
        const logContent = messages.map(msg => `${msg.author.tag}: ${msg.content}`).join('\n');
        const logFilePath = path.join(__dirname, `ticket-${ticketChannel.name}.txt`);
        fs.writeFileSync(logFilePath, logContent);

        // Send chat log to the user
        const attachment = new AttachmentBuilder(logFilePath);
        await user.send({ content: `Here is the chat log for your ticket ${ticketChannel.name}:`, files: [attachment] });

        // Log ticket closure
        const logChannelId = process.env.LOG_CHANNEL_ID;
        const logChannel = await i.client.channels.fetch(logChannelId);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle('Ticket Closed')
            .setDescription(`Ticket ${ticketChannel.name} was closed by ${user.tag}.`)
            .addFields(
              { name: 'Ticket Number', value: ticketChannel.name.split('-')[1], inline: true },
              { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
              { name: 'Closed At', value: new Date().toISOString(), inline: true }
            )
            .setColor('#00ff00')
            .setTimestamp();
          await logChannel.send({ embeds: [logEmbed], files: [attachment] });
        }

        // Close the ticket and delete channel
        await ticketChannel.delete();
        fs.unlinkSync(logFilePath); // Remove the temporary log file
      } else if (i.customId === 'cancel_close_ticket') {
        await i.update({ content: 'Ticket closure cancelled.', components: [] });
      }
    });

    collector.on('end', collected => {
      if (!collected.size) {
        interaction.editReply({ content: 'Ticket closure timed out.', components: [] });
      }
    });
  },
};
