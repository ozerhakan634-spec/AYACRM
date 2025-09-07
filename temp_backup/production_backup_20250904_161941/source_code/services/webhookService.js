export const WebhookService = {
  // Slack webhook URL'si
  SLACK_WEBHOOK_URL: import.meta.env.VITE_SLACK_WEBHOOK_URL || 'YOUR_SLACK_WEBHOOK_URL',
  
  // Discord webhook URL'si
  DISCORD_WEBHOOK_URL: import.meta.env.VITE_DISCORD_WEBHOOK_URL || 'YOUR_DISCORD_WEBHOOK_URL',

  // Slack'e bildirim gönder
  async sendSlackNotification(ticketData, type = 'new_ticket') {
    try {
      if (!this.SLACK_WEBHOOK_URL || this.SLACK_WEBHOOK_URL === 'YOUR_SLACK_WEBHOOK_URL') {
        console.warn('Slack webhook URL ayarlanmamış');
        return { success: false, error: 'Webhook URL ayarlanmamış' };
      }

      let message = '';
      let color = '#36a64f';

      if (type === 'new_ticket') {
        message = {
          text: `🔔 *Yeni Destek Talebi*`,
          attachments: [{
            color: this.getPriorityColor(ticketData.priority),
            title: ticketData.subject,
            fields: [
              {
                title: 'Gönderen',
                value: `${ticketData.name} (${ticketData.email})`,
                short: true
              },
              {
                title: 'Öncelik',
                value: this.getPriorityText(ticketData.priority),
                short: true
              },
              {
                title: 'Mesaj',
                value: ticketData.message.length > 200 
                  ? ticketData.message.substring(0, 200) + '...' 
                  : ticketData.message
              }
            ],
            footer: 'CRM Destek Sistemi',
            ts: Math.floor(new Date(ticketData.created_at).getTime() / 1000)
          }]
        };
      } else if (type === 'admin_response') {
        message = {
          text: `✅ *Destek Talebine Yanıt Verildi*`,
          attachments: [{
            color: '#36a64f',
            title: ticketData.subject,
            fields: [
              {
                title: 'Müşteri',
                value: `${ticketData.name} (${ticketData.email})`,
                short: true
              },
              {
                title: 'Durum',
                value: 'Çözüldü',
                short: true
              },
              {
                title: 'Yanıt',
                value: ticketData.admin_response.length > 200 
                  ? ticketData.admin_response.substring(0, 200) + '...' 
                  : ticketData.admin_response
              }
            ],
            footer: 'CRM Destek Sistemi',
            ts: Math.floor(new Date().getTime() / 1000)
          }]
        };
      }

      const response = await fetch(this.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        throw new Error(`Slack webhook hatası: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Slack bildirimi gönderme hatası:', error);
      return { success: false, error: error.message };
    }
  },

  // Discord'a bildirim gönder
  async sendDiscordNotification(ticketData, type = 'new_ticket') {
    try {
      if (!this.DISCORD_WEBHOOK_URL || this.DISCORD_WEBHOOK_URL === 'YOUR_DISCORD_WEBHOOK_URL') {
        console.warn('Discord webhook URL ayarlanmamış');
        return { success: false, error: 'Webhook URL ayarlanmamış' };
      }

      let embed = {};

      if (type === 'new_ticket') {
        embed = {
          title: '🔔 Yeni Destek Talebi',
          description: ticketData.subject,
          color: this.getPriorityColorHex(ticketData.priority),
          fields: [
            {
              name: 'Gönderen',
              value: `${ticketData.name} (${ticketData.email})`,
              inline: true
            },
            {
              name: 'Öncelik',
              value: this.getPriorityText(ticketData.priority),
              inline: true
            },
            {
              name: 'Mesaj',
              value: ticketData.message.length > 1000 
                ? ticketData.message.substring(0, 1000) + '...' 
                : ticketData.message
            }
          ],
          timestamp: new Date(ticketData.created_at).toISOString(),
          footer: {
            text: 'CRM Destek Sistemi'
          }
        };
      } else if (type === 'admin_response') {
        embed = {
          title: '✅ Destek Talebine Yanıt Verildi',
          description: ticketData.subject,
          color: 0x36a64f,
          fields: [
            {
              name: 'Müşteri',
              value: `${ticketData.name} (${ticketData.email})`,
              inline: true
            },
            {
              name: 'Durum',
              value: 'Çözüldü',
              inline: true
            },
            {
              name: 'Yanıt',
              value: ticketData.admin_response.length > 1000 
                ? ticketData.admin_response.substring(0, 1000) + '...' 
                : ticketData.admin_response
            }
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: 'CRM Destek Sistemi'
          }
        };
      }

      const response = await fetch(this.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          embeds: [embed]
        })
      });

      if (!response.ok) {
        throw new Error(`Discord webhook hatası: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Discord bildirimi gönderme hatası:', error);
      return { success: false, error: error.message };
    }
  },

  // Öncelik rengini döndür (Slack için)
  getPriorityColor(priority) {
    switch (priority) {
      case 'urgent': return '#ff0000';
      case 'high': return '#ff8c00';
      case 'medium': return '#ffd700';
      case 'low': return '#32cd32';
      default: return '#36a64f';
    }
  },

  // Öncelik rengini döndür (Discord için hex)
  getPriorityColorHex(priority) {
    switch (priority) {
      case 'urgent': return 0xff0000;
      case 'high': return 0xff8c00;
      case 'medium': return 0xffd700;
      case 'low': return 0x32cd32;
      default: return 0x36a64f;
    }
  },

  // Öncelik metnini döndür
  getPriorityText(priority) {
    switch (priority) {
      case 'urgent': return '🔴 Acil';
      case 'high': return '🟠 Yüksek';
      case 'medium': return '🟡 Orta';
      case 'low': return '🟢 Düşük';
      default: return priority;
    }
  }
};
