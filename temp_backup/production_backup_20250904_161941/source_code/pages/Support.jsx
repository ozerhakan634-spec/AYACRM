import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  HelpCircle,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Mail,
  Save
} from 'lucide-react';
import { useToastContext } from '../components/Toast';
import { SupportService } from '../services/supportService';
import { SimpleEmailService } from '../services/simpleEmailService';

const Support = () => {
  const { toast } = useToastContext();
  const [activeTab, setActiveTab] = useState('contact');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'medium'
  });
  const [sending, setSending] = useState(false);
  const [userTickets, setUserTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [emailSettings, setEmailSettings] = useState({
    serviceId: SimpleEmailService.SERVICE_ID === 'YOUR_EMAILJS_SERVICE_ID' ? '' : SimpleEmailService.SERVICE_ID,
    templateId: SimpleEmailService.TEMPLATE_ID === 'YOUR_EMAILJS_TEMPLATE_ID' ? '' : SimpleEmailService.TEMPLATE_ID,
    publicKey: SimpleEmailService.PUBLIC_KEY === 'YOUR_EMAILJS_PUBLIC_KEY' ? '' : SimpleEmailService.PUBLIC_KEY,
    adminEmail: SimpleEmailService.ADMIN_EMAIL === 'your-personal-email@gmail.com' ? '' : SimpleEmailService.ADMIN_EMAIL
  });
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailTesting, setEmailTesting] = useState(false);
  
  // Düzenleme state'leri
  const [editingTicket, setEditingTicket] = useState(null);
  const [editingMessage, setEditingMessage] = useState('');
  const [updatingTicket, setUpdatingTicket] = useState(false);

  const tabs = [
    { id: 'contact', name: 'Destek Talebi', icon: MessageCircle },
    { id: 'faq', name: 'Sık Sorulan Sorular', icon: HelpCircle }
  ];

  // Kullanıcının destek taleplerini yükle
  useEffect(() => {
    loadUserTickets();
    
    // Özel URL kontrolü - e-posta ayarları sekmesi için
    const urlParams = new URLSearchParams(window.location.search);
    const secretKey = urlParams.get('secret');
    
    // Özel anahtar kontrolü (sadece siz bileceksiniz)
    if (secretKey === 'aya2024email') {
      setActiveTab('email');
      // URL'den gizli anahtarı temizle
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // URL parametrelerinden e-posta ayarlarını kontrol et
    const emailjsService = urlParams.get('emailjs_service');
    const emailjsTemplate = urlParams.get('emailjs_template');
    const emailjsKey = urlParams.get('emailjs_key');
    const adminEmail = urlParams.get('admin_email');
    
    if (emailjsService && emailjsTemplate && emailjsKey && adminEmail) {
      // URL'den gelen ayarları kaydet
      SimpleEmailService.updateSettings(emailjsService, emailjsTemplate, emailjsKey, adminEmail);
      if (toast) toast.success('URL\'den e-posta ayarları otomatik olarak kaydedildi!');
      
      // URL'yi temizle
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // EmailJS ayarlarını yükle
    SimpleEmailService.loadSettings();
    
    // LocalStorage'dan ayarları al
    const savedSettings = localStorage.getItem('emailjs_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setEmailSettings({
          serviceId: parsed.serviceId || '',
          templateId: parsed.templateId || '',
          publicKey: parsed.publicKey || '',
          adminEmail: parsed.adminEmail || ''
        });
      } catch (error) {
        console.error('LocalStorage ayarları parse edilemedi:', error);
      }
    }
  }, []);

  const loadUserTickets = async () => {
    try {
      setLoadingTickets(true);
      const result = await SupportService.getUserSupportTickets();
      
      if (result.success) {
        setUserTickets(result.data);
      } else {
        console.error('Destek talepleri yüklenemedi:', result.error);
        if (toast) toast.error('Destek talepleri yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Destek talepleri yüklenirken hata:', error);
      if (toast) toast.error('Destek talepleri yüklenirken hata oluştu');
    } finally {
      setLoadingTickets(false);
    }
  };

  // Destek talebini düzenleme
  const handleEditTicket = (ticket) => {
    setEditingTicket(ticket);
    setEditingMessage(ticket.message);
  };

  // Düzenlemeyi iptal et
  const handleCancelEdit = () => {
    setEditingTicket(null);
    setEditingMessage('');
  };

  // Destek talebini güncelle
  const handleUpdateTicket = async () => {
    if (!editingMessage.trim()) {
      if (toast) toast.error('Mesaj boş olamaz');
      return;
    }

    try {
      setUpdatingTicket(true);
      
      const result = await SupportService.updateSupportTicket(editingTicket.id, {
        message: editingMessage
      });
      
      if (result.success) {
        if (toast) toast.success('Destek talebi başarıyla güncellendi!');
        await loadUserTickets(); // Listeyi yenile
        handleCancelEdit(); // Düzenleme modunu kapat
      } else {
        if (toast) toast.error(`Güncelleme hatası: ${result.error}`);
      }
    } catch (error) {
      console.error('Destek talebi güncelleme hatası:', error);
      if (toast) toast.error('Destek talebi güncellenirken hata oluştu');
    } finally {
      setUpdatingTicket(false);
    }
  };

  // Destek talebi durumunu güncelle
  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      const result = await SupportService.updateSupportTicket(ticketId, {
        status: newStatus
      });
      
      if (result.success) {
        if (toast) toast.success('Durum başarıyla güncellendi!');
        await loadUserTickets(); // Listeyi yenile
      } else {
        if (toast) toast.error(`Durum güncelleme hatası: ${result.error}`);
      }
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
      if (toast) toast.error('Durum güncellenirken hata oluştu');
    }
  };

  const faqItems = [
    {
      question: 'CRM sistemini nasıl kullanmaya başlayabilirim?',
      answer: 'Sisteme giriş yaptıktan sonra Dashboard sayfasından başlayabilirsiniz. Müşteri ekleme, belge yükleme ve görev oluşturma işlemlerini kolayca yapabilirsiniz.'
    },
    {
      question: 'Müşteri bilgilerini nasıl düzenleyebilirim?',
      answer: 'Müşteriler sayfasından mevcut müşterilerinizi görüntüleyebilir, düzenleyebilir veya yeni müşteri ekleyebilirsiniz. Her müşteri için detaylı bilgi girişi yapabilirsiniz.'
    },
    {
      question: 'Belge yükleme işlemi nasıl yapılır?',
      answer: 'Belgeler sayfasından "Yeni Belge Ekle" butonuna tıklayarak dosyalarınızı yükleyebilirsiniz. PDF, JPG, PNG gibi formatlar desteklenmektedir.'
    },
    {
      question: 'Görevlerimi nasıl takip edebilirim?',
      answer: 'Görevlerim sayfasından tüm görevlerinizi görüntüleyebilir, durumlarını güncelleyebilir ve yeni görevler oluşturabilirsiniz.'
    },
    {
      question: 'Raporlar nasıl oluşturulur?',
      answer: 'Raporlar sayfasından çeşitli analiz raporlarına erişebilirsiniz. Müşteri durumları, finansal raporlar ve performans analizleri mevcuttur.'
    }
  ];



  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEmailInputChange = (field, value) => {
    setEmailSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEmailSave = () => {
    if (!emailSettings.serviceId || !emailSettings.templateId || !emailSettings.publicKey || !emailSettings.adminEmail) {
      if (toast) toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    setEmailSaving(true);
    
    try {
      // Önce localStorage'a kaydet
      localStorage.setItem('emailjs_settings', JSON.stringify({
        serviceId: emailSettings.serviceId,
        templateId: emailSettings.templateId,
        publicKey: emailSettings.publicKey,
        adminEmail: emailSettings.adminEmail
      }));
      
      // Sonra SimpleEmailService'i güncelle
      SimpleEmailService.updateSettings(
        emailSettings.serviceId,
        emailSettings.templateId,
        emailSettings.publicKey,
        emailSettings.adminEmail
      );
      
      console.log('✅ Ayarlar kaydedildi:', emailSettings);
      if (toast) toast.success('E-posta ayarları başarıyla kaydedildi!');
    } catch (error) {
      console.error('Ayarlar kaydedilirken hata:', error);
      if (toast) toast.error('Ayarlar kaydedilirken hata oluştu');
    } finally {
      setEmailSaving(false);
    }
  };

  const handleEmailTest = async () => {
    if (!emailSettings.serviceId || !emailSettings.templateId || !emailSettings.publicKey || !emailSettings.adminEmail) {
      if (toast) toast.error('Lütfen önce ayarları kaydedin');
      return;
    }

    setEmailTesting(true);
    
    try {
      const testData = {
        subject: 'Test Destek Talebi',
        name: 'Test Müşteri',
        email: 'test@example.com',
        message: 'Bu bir test mesajıdır. E-posta bildirim sistemi çalışıyor!',
        priority: 'medium',
        created_at: new Date().toISOString()
      };

      // Önce ayarları güncelle
      SimpleEmailService.updateSettings(
        emailSettings.serviceId,
        emailSettings.templateId,
        emailSettings.publicKey,
        emailSettings.adminEmail
      );

      const result = await SimpleEmailService.sendSupportNotification(testData);
      
      if (result.success) {
        if (toast) toast.success('Test e-postası başarıyla gönderildi! E-posta kutunuzu kontrol edin.');
      } else {
        if (toast) toast.error(`Test e-postası gönderilemedi: ${result.error}`);
      }
    } catch (error) {
      console.error('Test e-postası gönderme hatası:', error);
      if (toast) toast.error('Test e-postası gönderilirken hata oluştu');
    } finally {
      setEmailTesting(false);
    }
  };

  // Debug fonksiyonu - localStorage'ı kontrol et
  const debugEmailSettings = () => {
    const saved = localStorage.getItem('emailjs_settings');
    console.log('🔍 LocalStorage EmailJS Ayarları:', saved);
    if (saved) {
      console.log('📋 Parse edilmiş ayarlar:', JSON.parse(saved));
    }
    console.log('📧 Mevcut State:', emailSettings);
    
    // Manuel localStorage kaydetme
    if (emailSettings.serviceId && emailSettings.templateId && emailSettings.publicKey && emailSettings.adminEmail) {
      localStorage.setItem('emailjs_settings', JSON.stringify({
        serviceId: emailSettings.serviceId,
        templateId: emailSettings.templateId,
        publicKey: emailSettings.publicKey,
        adminEmail: emailSettings.adminEmail
      }));
      console.log('✅ Manuel olarak localStorage\'a kaydedildi!');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      if (toast) toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    try {
      setSending(true);
      
      const result = await SupportService.createSupportTicket(formData);
      
      if (result.success) {
        if (toast) toast.success('Destek talebiniz başarıyla gönderildi! En kısa sürede size dönüş yapacağız.');
        
        // Formu temizle
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          priority: 'medium'
        });
        
        // Destek taleplerini yeniden yükle
        await loadUserTickets();
      } else {
        if (toast) toast.error(`Destek talebi gönderilirken hata oluştu: ${result.error}`);
      }
      
    } catch (error) {
      console.error('Destek talebi gönderme hatası:', error);
      if (toast) toast.error('Destek talebi gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSending(false);
    }
  };

  const renderContactTab = () => (
    <div className="space-y-6">
      {/* Yeni Destek Talebi Formu */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Yeni Destek Talebi</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ad Soyad *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-posta *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Konu *
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              className="input-field"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Öncelik
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              className="input-field"
            >
              <option value="low">Düşük</option>
              <option value="medium">Orta</option>
              <option value="high">Yüksek</option>
              <option value="urgent">Acil</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mesajınız *
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              rows={5}
              className="input-field"
              placeholder="Sorununuzu veya sorunuzu detaylı olarak açıklayın..."
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={sending}
            className="btn-primary flex items-center justify-center disabled:opacity-50"
          >
            <Send size={16} className="mr-2" />
            {sending ? 'Gönderiliyor...' : 'Destek Talebi Gönder'}
          </button>
        </form>
      </div>

      {/* Kullanıcının Destek Talepleri */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Destek Taleplerim</h3>
        
        {loadingTickets ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Destek talepleri yükleniyor...</span>
          </div>
        ) : userTickets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
            <p>Henüz destek talebiniz bulunmuyor</p>
            <p className="text-sm">Yukarıdaki formu kullanarak yeni bir destek talebi oluşturabilirsiniz</p>
          </div>
        ) : (
          <div className="space-y-4">
            {userTickets.map((ticket) => (
                      <div key={ticket.id} className={`border rounded-lg p-4 ${
          ticket.status === 'resolved' ? 'border-gray-300 bg-gray-50 opacity-60' : 'border-gray-200 bg-white'
        }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className={`font-semibold ${
                  ticket.status === 'resolved' ? 'text-gray-500' : 'text-gray-900'
                }`}>{ticket.subject}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {ticket.priority === 'urgent' ? 'Acil' :
                         ticket.priority === 'high' ? 'Yüksek' :
                         ticket.priority === 'medium' ? 'Orta' : 'Düşük'}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        ticket.status === 'open' ? 'bg-blue-100 text-blue-800' :
                        ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ticket.status === 'open' ? 'Açık' :
                         ticket.status === 'in_progress' ? 'İşlemde' :
                         ticket.status === 'resolved' ? 'Çözüldü' : 'Kapalı'}
                      </span>
                    </div>
                    
                    {/* Mesaj İçeriği - Düzenleme Modu */}
                    {editingTicket?.id === ticket.id ? (
                      <div className="mb-3">
                        <textarea
                          value={editingMessage}
                          onChange={(e) => setEditingMessage(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          rows={3}
                          placeholder="Mesajınızı güncelleyin..."
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={handleUpdateTicket}
                            disabled={updatingTicket}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50"
                          >
                            {updatingTicket ? 'Güncelleniyor...' : 'Kaydet'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1 bg-gray-500 text-white text-xs rounded-md hover:bg-gray-600"
                          >
                            İptal
                          </button>
                        </div>
                      </div>
                    ) : (
                                      <p className={`text-sm mb-2 ${
                  ticket.status === 'resolved' ? 'text-gray-400' : 'text-gray-600'
                }`}>{ticket.message}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(ticket.created_at).toLocaleDateString('tr-TR')}
                      </span>
                      {ticket.resolved_at && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle size={12} />
                          {new Date(ticket.resolved_at).toLocaleDateString('tr-TR')}
                        </span>
                      )}
                    </div>
                    
                    {/* Admin Yanıtı */}
                    {ticket.admin_response && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-1">Yanıt:</p>
                        <p className="text-sm text-blue-800">{ticket.admin_response}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Düzenleme Butonları */}
                  <div className="flex flex-col gap-2 ml-4">
                    {editingTicket?.id !== ticket.id && (
                      <button
                        onClick={() => handleEditTicket(ticket)}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-md hover:bg-gray-200"
                      >
                        Düzenle
                      </button>
                    )}
                    
                    {/* Durum Güncelleme */}
                    {ticket.status === 'open' && (
                      <button
                        onClick={() => handleUpdateStatus(ticket.id, 'resolved')}
                        className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-md hover:bg-green-200"
                      >
                        Çözüldü
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderFaqTab = () => (
    <div className="space-y-4">
      {faqItems.map((item, index) => (
        <div key={index} className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {item.question}
          </h3>
          <p className="text-gray-600 leading-relaxed">
            {item.answer}
          </p>
        </div>
      ))}
    </div>
  );

  const renderEmailTab = () => {
    const isConfigured = emailSettings.serviceId && emailSettings.templateId && emailSettings.publicKey && emailSettings.adminEmail;
    
    return (
      <div className="space-y-6">
        {/* Durum Kartı */}
        <div className={`card ${isConfigured ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
          <div className="flex items-center">
            <Mail size={24} className={`mr-3 ${isConfigured ? 'text-green-600' : 'text-yellow-600'}`} />
            <div>
              <h3 className={`font-semibold ${isConfigured ? 'text-green-800' : 'text-yellow-800'}`}>
                {isConfigured ? 'E-posta Bildirimi Aktif' : 'E-posta Bildirimi Pasif'}
              </h3>
              <p className={`text-sm ${isConfigured ? 'text-green-700' : 'text-yellow-700'}`}>
                {isConfigured 
                  ? 'Müşteri destek talepleri e-posta adresinize gönderilecek'
                  : 'E-posta bildirimi için ayarları tamamlayın'
                }
              </p>
            </div>
          </div>
        </div>

        {/* EmailJS Ayarları */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">EmailJS Ayarları</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service ID *
              </label>
              <input
                type="text"
                value={emailSettings.serviceId}
                onChange={(e) => handleEmailInputChange('serviceId', e.target.value)}
                className="input-field"
                placeholder="service_abc123"
              />
              <p className="text-xs text-gray-500 mt-1">
                EmailJS Dashboard {'>'} Email Services {'>'} Service ID
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template ID *
              </label>
              <input
                type="text"
                value={emailSettings.templateId}
                onChange={(e) => handleEmailInputChange('templateId', e.target.value)}
                className="input-field"
                placeholder="template_xyz789"
              />
              <p className="text-xs text-gray-500 mt-1">
                EmailJS Dashboard {'>'} Email Templates {'>'} Template ID
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Public Key *
              </label>
              <input
                type="text"
                value={emailSettings.publicKey}
                onChange={(e) => handleEmailInputChange('publicKey', e.target.value)}
                className="input-field"
                placeholder="public_key_123"
              />
              <p className="text-xs text-gray-500 mt-1">
                EmailJS Dashboard {'>'} Account {'>'} API Keys {'>'} Public Key
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kişisel E-posta Adresiniz *
              </label>
              <input
                type="email"
                value={emailSettings.adminEmail}
                onChange={(e) => handleEmailInputChange('adminEmail', e.target.value)}
                className="input-field"
                placeholder="ozerhakan634@gmail.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                Destek talepleri bu e-posta adresine gönderilecek
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleEmailSave}
              disabled={emailSaving}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={16} />
              {emailSaving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
            </button>

            <button
              onClick={handleEmailTest}
              disabled={emailTesting || !isConfigured}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50"
            >
              <Mail size={16} />
              {emailTesting ? 'Test Ediliyor...' : 'Test E-postası Gönder'}
            </button>

            <button
              onClick={debugEmailSettings}
              className="btn-secondary flex items-center gap-2"
            >
              🔍 Debug
            </button>
          </div>
        </div>

        {/* Kurulum Rehberi */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Kurulum Rehberi</h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-start">
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-3 mt-0.5">1</span>
              <div>
                <p className="font-medium text-gray-900">EmailJS Hesabı Oluşturun</p>
                <p className="text-gray-600">https://www.emailjs.com/ adresinden ücretsiz hesap oluşturun</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-3 mt-0.5">2</span>
              <div>
                <p className="font-medium text-gray-900">Gmail Servisi Ekleyin</p>
                <p className="text-gray-600">Dashboard {'>'} Email Services {'>'} Gmail ile bağlayın</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-3 mt-0.5">3</span>
              <div>
                <p className="font-medium text-gray-900">E-posta Şablonu Oluşturun</p>
                <p className="text-gray-600">Email Templates {'>'} Yeni şablon oluşturun</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-3 mt-0.5">4</span>
              <div>
                <p className="font-medium text-gray-900">ID'leri Kopyalayın</p>
                <p className="text-gray-600">Service ID, Template ID ve Public Key'i yukarıya girin</p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Detaylı kurulum rehberi:</strong> <code>EMAILJS_SETUP.md</code> dosyasını inceleyin
            </p>
          </div>
        </div>

        {/* Özellikler */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card">
            <h4 className="font-semibold text-gray-900 mb-2">✅ Avantajlar</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Aylık 200 e-posta ücretsiz</li>
              <li>• Gmail ile güvenli gönderim</li>
              <li>• Profesyonel HTML format</li>
              <li>• Mobil uyumlu tasarım</li>
              <li>• Anında bildirim</li>
            </ul>
          </div>

          <div className="card">
            <h4 className="font-semibold text-gray-900 mb-2">📧 E-posta İçeriği</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Müşteri adı ve e-postası</li>
              <li>• Talep konusu ve mesajı</li>
              <li>• Öncelik seviyesi</li>
              <li>• Tarih ve saat</li>
              <li>• CRM'e direkt link</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'contact': return renderContactTab();
      case 'faq': return renderFaqTab();
      case 'email': return renderEmailTab();
      default: return renderContactTab();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Destek</h1>
          <p className="text-gray-600 mt-2">Yardıma mı ihtiyacınız var? Size yardımcı olmaya hazırız</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon size={16} className="mr-2" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default Support;
