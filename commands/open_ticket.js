const { ChannelType, ActionRowBuilder, ButtonBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');

module.exports = {
  data: {
    name: 'open_ticket',
    description: 'Open a new support ticket.',
  },
  async execute(interaction) {
    const member = interaction.member;
    const guild = interaction.guild;
    const staffRoleId = process.env.STAFF_ROLE_ID;

    // Load ticket log
    const ticketLog = loadTicketLog();

    // Check if the user already has an open ticket
    const existingChannel = guild.channels.cache.find(channel => channel.name.startsWith('ticket-') && channel.name.includes(member.user.id));
    if (existingChannel) {
      return interaction.reply({ content: 'You already have an open ticket.', ephemeral: true });
    }

    // Get the next ticket number
    const ticketNumber = ticketLog.nextTicketNumber;

    // Create a new text channel for the ticket
    const ticketChannel = await guild.channels.create({
      name: `ticket-${ticketNumber}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: ['ViewChannel'],
        },
        {
          id: member.id,
          allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
        },
        {
          id: staffRoleId,
          allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
        },
      ],
    });

    // Create a welcome embed for the ticket channel
    const welcomeEmbed = new EmbedBuilder()
      .setTitle('Welcome to Your Ticket')
      .setDescription(`Hello ${member.user.username}, this is your ticket channel. A staff member will assist you shortly.`)
      .setColor('#0099ff')
      .setFooter({ text: 'Support Bot' });

    // Send a message to the new ticket channel
    await ticketChannel.send({
      embeds: [welcomeEmbed],
      components: [
        new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('close_ticket')
              .setLabel('Close Ticket')
              .setStyle('Danger')
              .setEmoji('🔒')
          )
      ],
    });

    // Log the ticket creation
    ticketLog.tickets.push({
      ticketNumber,
      userName: member.user.username,
      userId: member.user.id,
      openedAt: new Date().toISOString(),
    });
    ticketLog.nextTicketNumber += 1;
    saveTicketLog(ticketLog);

    // Confirm ticket creation
    await interaction.reply({ content: `Your ticket has been created. Your ticket number is ${ticketNumber}.`, ephemeral: true });
  },
};

// Utility functions
const loadTicketLog = () => {
  if (fs.existsSync(process.env.TICKETS_LOG_FILE_PATH)) {
    return JSON.parse(fs.readFileSync(process.env.TICKETS_LOG_FILE_PATH));
  } else {
    return { tickets: [], nextTicketNumber: 1 };
  }
};

const saveTicketLog = (log) => {
  fs.writeFileSync(process.env.TICKETS_LOG_FILE_PATH, JSON.stringify(log, null, 2));
};
