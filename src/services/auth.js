import { DatabaseService } from './database';

export class AuthService {
  static async login(username, password) {
    try {
      console.log('🔐 Login denemesi:', { username });
      
      // Kullanıcı adı ve şifre kontrolü
      const user = await DatabaseService.authenticateUser(username, password);
      
      if (user) {
        console.log('✅ Login başarılı:', { userId: user.id, name: user.name });
        
        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            username: user.username,
            department: user.department,
            position: user.position,
            permissions: user.permissions || {},
            profile_photo_url: user.profile_photo_url,
            profile_photo_filename: user.profile_photo_filename,
            has_credentials: user.has_credentials,
            status: user.status,
            loginTime: new Date().toISOString()
          },
          message: 'Giriş başarılı'
        };
      } else {
        console.log('❌ Login başarısız: Kullanıcı bulunamadı veya şifre hatalı');
        
        return {
          success: false,
          message: 'Kullanıcı adı veya şifre hatalı'
        };
      }
    } catch (error) {
      console.error('🚨 Login hatası:', error);
      
      return {
        success: false,
        message: 'Giriş yapılırken bir hata oluştu'
      };
    }
  }

  static logout() {
    // Session storage'ı temizle
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('isLoggedIn');
    
    console.log('🚪 Kullanıcı çıkış yaptı');
    
    return {
      success: true,
      message: 'Çıkış başarılı'
    };
  }

  static getCurrentUser() {
    try {
      const isLoggedIn = sessionStorage.getItem('isLoggedIn');
      const userJson = sessionStorage.getItem('currentUser');
      
      if (isLoggedIn === 'true' && userJson) {
        const user = JSON.parse(userJson);
        console.log('👤 Mevcut kullanıcı:', { userId: user.id, name: user.name });
        return user;
      }
      
      return null;
    } catch (error) {
      console.error('Kullanıcı bilgileri alınırken hata:', error);
      return null;
    }
  }

  static getCurrentUserId() {
    const user = this.getCurrentUser();
    return user ? user.id : null;
  }

  static isLoggedIn() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    const user = this.getCurrentUser();
    
    // Geçici admin modunu kaldır
    if (sessionStorage.getItem('isTemporaryAdmin') === 'true') {
      console.warn('🚨 Geçici admin modu tespit edildi, temizleniyor...');
      sessionStorage.removeItem('isTemporaryAdmin');
    }
    
    return isLoggedIn && user !== null && user.has_credentials === true;
  }

  static async getCompanySettings() {
    try {
      // Veritabanından şirket ayarlarını al
      const { data: settings, error } = await DatabaseService.supabase
        .from('company_settings')
        .select('*')
        .eq('is_active', true)
        .limit(10);
      
      if (error) {
        console.error('Şirket ayarları alınırken hata:', error);
        return {
          company_name: 'AYA Journey CRM',
          logo_url: null
        };
      }
      
      // Ayarları objeye çevir
      const companySettings = {};
      if (settings && settings.length > 0) {
        settings.forEach(setting => {
          companySettings[setting.setting_key] = setting.setting_value;
        });
      }
      
      // Logo URL'ini al
      let logoUrl = companySettings.company_logo_url || null;
      
      return {
        company_name: companySettings.company_name || 'AYA Journey CRM',
        logo_url: logoUrl,
        company_email: companySettings.company_email,
        company_phone: companySettings.company_phone,
        company_address: companySettings.company_address
      };
    } catch (error) {
      console.error('Şirket ayarları alınırken hata:', error);
      return {
        company_name: 'AYA Journey CRM',
        logo_url: null
      };
    }
  }

  static hasPermission(permission) {
    const user = this.getCurrentUser();
    
    if (!user || !user.permissions) {
      return false;
    }
    
    // Sadece spesifik izin kontrolü
    return user.permissions[permission] === true;
  }

  static getAccessiblePages() {
    const user = this.getCurrentUser();
    
    if (!user || !user.permissions) {
      return [];
    }
    
    const pages = [];
    const permissions = user.permissions;
    
    if (permissions.dashboard) pages.push({ name: 'Dashboard', path: '/' });
    if (permissions.clients) pages.push({ name: 'Müşteriler', path: '/clients' });
    if (permissions.documents) pages.push({ name: 'Belgeler', path: '/documents' });
    if (permissions.calendar) pages.push({ name: 'Takvim', path: '/calendar' });
    if (permissions.reports) pages.push({ name: 'Raporlar', path: '/reports' });
    if (permissions.finance) pages.push({ name: 'Finans', path: '/finance' });
    if (permissions.consultants) pages.push({ name: 'Danışmanlar', path: '/consultants' });
    if (permissions.settings) pages.push({ name: 'Ayarlar', path: '/settings' });
    
    return pages;
  }

  static canAccessPage(pagePath) {
    const user = this.getCurrentUser();
    
    if (!user || !user.permissions) {
      return false;
    }
    
    const permissions = user.permissions;
    
    // Sayfa yoluna göre izin kontrolü
    switch (pagePath) {
      case '/':
        return permissions.dashboard === true;
      case '/clients':
        return permissions.clients === true;
      case '/documents':
        return permissions.documents === true;
      case '/calendar':
        return permissions.calendar === true;
      case '/reports':
        return permissions.reports === true;
      case '/finance':
        return permissions.finance === true;
      case '/consultants':
        return permissions.consultants === true;
      case '/team-management':
        return permissions.consultants === true; // Takım yönetimi danışman iznine bağlı
      case '/tasks':
        return permissions.dashboard === true; // Görevlerim dashboard iznine bağlı
      case '/settings':
        return permissions.settings === true;
      default:
        return false;
    }
  }

  // Şifre hash'leme fonksiyonu (basit implementasyon)
  static async hashPassword(password) {
    // Gerçek uygulamada bcrypt gibi güvenli bir hash algoritması kullanılmalı
    // Şimdilik basit bir encode işlemi yapıyoruz
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'vize_crm_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Şifre doğrulama fonksiyonu
  static async verifyPassword(password, hashedPassword) {
    const inputHash = await this.hashPassword(password);
    return inputHash === hashedPassword;
  }
}
