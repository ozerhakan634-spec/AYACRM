import emailjs from '@emailjs/browser';

export const SimpleEmailService = {
  // EmailJS ayarları
  SERVICE_ID: 'YOUR_EMAILJS_SERVICE_ID',
  TEMPLATE_ID: 'YOUR_EMAILJS_TEMPLATE_ID',
  PUBLIC_KEY: 'YOUR_EMAILJS_PUBLIC_KEY',
  
  // Admin e-posta adresi
  ADMIN_EMAIL: 'your-personal-email@gmail.com',

  // Ayarları güncelle
  updateSettings(serviceId, templateId, publicKey, adminEmail) {
    this.SERVICE_ID = serviceId;
    this.TEMPLATE_ID = templateId;
    this.PUBLIC_KEY = publicKey;
    this.ADMIN_EMAIL = adminEmail;
    
    // LocalStorage'a kaydet
    localStorage.setItem('emailjs_settings', JSON.stringify({
      serviceId,
      templateId,
      publicKey,
      adminEmail
    }));
  },

  // LocalStorage'dan ayarları yükle
  loadSettings() {
    const settings = localStorage.getItem('emailjs_settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      this.SERVICE_ID = parsed.serviceId || this.SERVICE_ID;
      this.TEMPLATE_ID = parsed.templateId || this.TEMPLATE_ID;
      this.PUBLIC_KEY = parsed.publicKey || this.PUBLIC_KEY;
      this.ADMIN_EMAIL = parsed.adminEmail || this.ADMIN_EMAIL;
    }
  },

  // Destek talebi bildirimi gönder
  async sendSupportNotification(ticketData) {
    try {
      // EmailJS ayarları kontrol et
      if (this.SERVICE_ID === 'YOUR_EMAILJS_SERVICE_ID') {
        console.warn('EmailJS ayarları yapılmamış. Lütfen kurulum rehberini takip edin.');
        return { success: false, error: 'EmailJS ayarları yapılmamış' };
      }

      console.log('📧 EmailJS Template Parametreleri:', {
        name: ticketData.name,
        email: ticketData.email,
        subject: ticketData.subject,
        message: ticketData.message,
        priority: ticketData.priority,
        category: ticketData.category
      });

      const templateParams = {
        to_email: this.ADMIN_EMAIL,
        name: ticketData.name,
        email: ticketData.email,
        subject: ticketData.subject,
        message: ticketData.message,
        priority: this.getPriorityText(ticketData.priority),
        category: ticketData.category || 'Genel',
        created_at: new Date(ticketData.created_at).toLocaleDateString('tr-TR'),
        admin_email: this.ADMIN_EMAIL
      };

      const result = await emailjs.send(
        this.SERVICE_ID,
        this.TEMPLATE_ID,
        templateParams,
        this.PUBLIC_KEY
      );

      console.log('E-posta başarıyla gönderildi:', result);
      return { success: true, data: result };
    } catch (error) {
      console.error('E-posta gönderme hatası:', error);
      return { success: false, error: error.message };
    }
  },

  // Admin yanıtı bildirimi gönder
  async sendResponseNotification(ticketData) {
    try {
      if (this.SERVICE_ID === 'YOUR_EMAILJS_SERVICE_ID') {
        console.warn('EmailJS ayarları yapılmamış.');
        return { success: false, error: 'EmailJS ayarları yapılmamış' };
      }

      const templateParams = {
        to_email: ticketData.email,
        subject: `✅ Destek Talebinize Yanıt: ${ticketData.subject}`,
        customer_name: ticketData.name,
        admin_response: ticketData.admin_response,
        ticket_subject: ticketData.subject,
        original_message: ticketData.message,
        date: new Date(ticketData.created_at).toLocaleDateString('tr-TR'),
        crm_url: window.location.origin + '/dashboard/support'
      };

      const result = await emailjs.send(
        this.SERVICE_ID,
        this.TEMPLATE_ID,
        templateParams,
        this.PUBLIC_KEY
      );

      console.log('Müşteri e-postası başarıyla gönderildi:', result);
      return { success: true, data: result };
    } catch (error) {
      console.error('E-posta gönderme hatası:', error);
      return { success: false, error: error.message };
    }
  },

  // Öncelik metnini döndür
  getPriorityText(priority) {
    switch (priority) {
      case 'urgent': return 'Acil';
      case 'high': return 'Yüksek';
      case 'medium': return 'Orta';
      case 'low': return 'Düşük';
      default: return priority;
    }
  },

  // Ayarları güncelle
  updateSettings(serviceId, templateId, publicKey, adminEmail) {
    this.SERVICE_ID = serviceId;
    this.TEMPLATE_ID = templateId;
    this.PUBLIC_KEY = publicKey;
    this.ADMIN_EMAIL = adminEmail;
  }
};
