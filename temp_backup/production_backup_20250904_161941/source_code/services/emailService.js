import { supabase } from '../config/supabase';

export const EmailService = {
  // Destek talebi oluşturulduğunda admin'e bildirim gönder
  async sendSupportTicketNotification(ticketData) {
    try {
      // Supabase Edge Functions kullanarak e-posta gönderimi
      const { data, error } = await supabase.functions.invoke('send-support-notification', {
        body: {
          ticket: ticketData,
          type: 'new_ticket'
        }
      });

      if (error) {
        console.error('E-posta gönderme hatası:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('E-posta servisi hatası:', error);
      return { success: false, error: error.message };
    }
  },

  // Admin yanıt verdiğinde müşteriye bildirim gönder
  async sendCustomerResponseNotification(ticketData) {
    try {
      const { data, error } = await supabase.functions.invoke('send-customer-notification', {
        body: {
          ticket: ticketData,
          type: 'admin_response'
        }
      });

      if (error) {
        console.error('E-posta gönderme hatası:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('E-posta servisi hatası:', error);
      return { success: false, error: error.message };
    }
  },

  // Durum güncellendiğinde müşteriye bildirim gönder
  async sendStatusUpdateNotification(ticketData, oldStatus, newStatus) {
    try {
      const { data, error } = await supabase.functions.invoke('send-status-notification', {
        body: {
          ticket: ticketData,
          oldStatus,
          newStatus,
          type: 'status_update'
        }
      });

      if (error) {
        console.error('E-posta gönderme hatası:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('E-posta servisi hatası:', error);
      return { success: false, error: error.message };
    }
  }
};
