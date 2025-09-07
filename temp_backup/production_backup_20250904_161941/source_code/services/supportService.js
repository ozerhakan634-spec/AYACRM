import { supabase } from '../config/supabase';
import { EmailService } from './emailService';
import { WebhookService } from './webhookService';
import { SimpleEmailService } from './simpleEmailService';
import { AuthService } from './auth';

export const SupportService = {
  // Yeni destek talebi oluştur
  async createSupportTicket(ticketData) {
    try {
      const currentUser = AuthService.getCurrentUser();
      
      if (!currentUser) {
        throw new Error('Kullanıcı girişi yapılmamış');
      }

      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: currentUser.id,
          name: ticketData.name,
          email: ticketData.email,
          subject: ticketData.subject,
          message: ticketData.message,
          priority: ticketData.priority,
          category: ticketData.category || 'general'
        })
        .select()
        .single();

      if (error) {
        console.error('Destek talebi oluşturma hatası:', error);
        throw new Error(error.message);
      }

      // Kişisel e-posta bildirimi gönder
      try {
        await SimpleEmailService.sendSupportNotification(data);
      } catch (emailError) {
        console.error('E-posta bildirimi gönderilemedi:', emailError);
        // E-posta hatası destek talebi oluşturmayı engellemez
      }

      // Slack/Discord webhook bildirimi gönder (isteğe bağlı)
      try {
        await WebhookService.sendSlackNotification(data, 'new_ticket');
        await WebhookService.sendDiscordNotification(data, 'new_ticket');
      } catch (webhookError) {
        console.error('Webhook bildirimi gönderilemedi:', webhookError);
        // Webhook hatası destek talebi oluşturmayı engellemez
      }

      return { success: true, data };
    } catch (error) {
      console.error('Destek talebi oluşturma hatası:', error);
      return { success: false, error: error.message };
    }
  },

  // Kullanıcının destek taleplerini getir
  async getUserSupportTickets() {
    try {
      const currentUser = AuthService.getCurrentUser();
      
      if (!currentUser) {
        throw new Error('Kullanıcı girişi yapılmamış');
      }

      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          admin_response,
          resolved_at
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Destek talepleri getirme hatası:', error);
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Destek talepleri getirme hatası:', error);
      return { success: false, error: error.message };
    }
  },

  // Tüm destek taleplerini getir (Admin için)
  async getAllSupportTickets() {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Tüm destek talepleri getirme hatası:', error);
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Tüm destek talepleri getirme hatası:', error);
      return { success: false, error: error.message };
    }
  },

  // Destek talebini güncelle (Kullanıcı ve Admin için)
  async updateSupportTicket(ticketId, updateData) {
    try {
      const currentUser = AuthService.getCurrentUser();
      
      if (!currentUser) {
        throw new Error('Kullanıcı girişi yapılmamış');
      }

      const updateFields = {
        ...updateData,
        updated_at: new Date().toISOString()
      };

      // Eğer durum "resolved" olarak değiştiriliyorsa resolved_at'i güncelle
      if (updateData.status === 'resolved') {
        updateFields.resolved_at = new Date().toISOString();
      }

      // Admin kullanıcılar tüm talepleri güncelleyebilir
      const { data, error } = await supabase
        .from('support_tickets')
        .update(updateFields)
        .eq('id', ticketId)
        .select()
        .single();

      if (error) {
        console.error('Destek talebi güncelleme hatası:', error);
        throw new Error(error.message);
      }

      // E-posta bildirimleri gönder
      try {
        // Eğer admin yanıtı eklendiyse müşteriye bildirim gönder
        if (updateData.admin_response) {
          await SimpleEmailService.sendResponseNotification(data);
        }
      } catch (emailError) {
        console.error('E-posta bildirimi gönderilemedi:', emailError);
        // E-posta hatası güncellemeyi engellemez
      }

      return { success: true, data };
    } catch (error) {
      console.error('Destek talebi güncelleme hatası:', error);
      return { success: false, error: error.message };
    }
  },

  // Destek talebini sil
  async deleteSupportTicket(ticketId) {
    try {
      const currentUser = AuthService.getCurrentUser();
      
      if (!currentUser) {
        throw new Error('Kullanıcı girişi yapılmamış');
      }

      // Admin kullanıcılar tüm talepleri silebilir
      const { error } = await supabase
        .from('support_tickets')
        .delete()
        .eq('id', ticketId);

      if (error) {
        console.error('Destek talebi silme hatası:', error);
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error) {
      console.error('Destek talebi silme hatası:', error);
      return { success: false, error: error.message };
    }
  },

  // Destek talebi istatistikleri
  async getSupportTicketStats() {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('status, priority, created_at');

      if (error) {
        console.error('Destek talebi istatistikleri getirme hatası:', error);
        throw new Error(error.message);
      }

      const stats = {
        total: data.length,
        open: data.filter(ticket => ticket.status === 'open').length,
        inProgress: data.filter(ticket => ticket.status === 'in_progress').length,
        resolved: data.filter(ticket => ticket.status === 'resolved').length,
        closed: data.filter(ticket => ticket.status === 'closed').length,
        urgent: data.filter(ticket => ticket.priority === 'urgent').length,
        high: data.filter(ticket => ticket.priority === 'high').length,
        medium: data.filter(ticket => ticket.priority === 'medium').length,
        low: data.filter(ticket => ticket.priority === 'low').length
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Destek talebi istatistikleri getirme hatası:', error);
      return { success: false, error: error.message };
    }
  }
};
