import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Phone,
  Calendar,
  Clock,
  User,
  Download,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { DatabaseService } from '../services/database';
import { normalizeCountryName } from '../utils/countryNormalizer';
import { getDaysUntilNextUpdate, getUpdateStatus, formatTurkishDateTime, isDateMatch } from '../utils/dateUtils';
import { useToastContext } from '../components/Toast';

// Türkçe tarih formatlama fonksiyonu
const formatTurkishDate = (dateString) => {
  if (!dateString) return 'Belirtilmemiş';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Geçersiz Tarih';
    
    const options = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    
    return date.toLocaleDateString('tr-TR', options);
  } catch (error) {
    return 'Tarih Hatası';
  }
};

const Clients = () => {
  const toast = useToastContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedVisaType, setSelectedVisaType] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedConsultant, setSelectedConsultant] = useState('all');
  const [sortCriteria, setSortCriteria] = useState('newest');
  const [selectedClient, setSelectedClient] = useState(null);
  const [isDetailCardOpen, setIsDetailCardOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, client: null });
  const [consultantModal, setConsultantModal] = useState({ isOpen: false, client: null });
  const [isSaving, setIsSaving] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [successModal, setSuccessModal] = useState({ isOpen: false, message: '' });
  const [notification, setNotification] = useState({ isVisible: false, message: '', type: 'success' });
  const [applicationUpdateModal, setApplicationUpdateModal] = useState({ isOpen: false, client: null });
  const [currentPage, setCurrentPage] = useState(1);
  const clientsPerPage = 10;
  const [quickInfoModal, setQuickInfoModal] = useState({ isOpen: false, client: null });
  const [selectedClients, setSelectedClients] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [clientsList, setClientsList] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Artık localStorage kullanmıyoruz - sadece veritabanı
  // Tüm tracking verileri Supabase'den gelecek

  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active',
    industry: '',
    address: '',
    country: '',
    visa_type: '',
    application_number: '',
    passport_number: '',
    tc_kimlik_no: '',
    kullanici_adi: '',
    dogum_tarihi: '',
    appointment_date: '',
    appointment_time: '',
    seyahat_amaci: '',
    notes: '',
    guvenlik_soru1: '',
    guvenlik_cevap1: '',
    guvenlik_soru2: '',
    guvenlik_cevap2: '',
    guvenlik_soru3: '',
    guvenlik_cevap3: ''
  });

  // Verileri yükle
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Müşterileri ve danışmanları paralel olarak yükle
      const [clientsData, consultantsData] = await Promise.all([
        DatabaseService.getClients(),
        DatabaseService.getConsultants()
      ]);
      
      // Güvenli veri kontrolü ve temizleme
      const cleanClientsData = Array.isArray(clientsData) ? clientsData.filter(client => 
        client && typeof client === 'object' && client.id
      ) : [];
      
      const cleanConsultantsData = Array.isArray(consultantsData) ? consultantsData.filter(consultant => 
        consultant && typeof consultant === 'object' && consultant.id
      ) : [];
      
      setClientsList(cleanClientsData);
      setConsultants(cleanConsultantsData);
      
      console.log('Yüklenen veriler:', { clients: cleanClientsData.length, consultants: cleanConsultantsData.length });
      
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
      setError('Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
      // Hata durumunda boş array kullan
      setClientsList([]);
      setConsultants([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'completed': return 'text-blue-600 bg-blue-50';
      case 'inactive': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'pending': return 'Bekliyor';
      case 'completed': return 'Tamamlandı';
      case 'inactive': return 'Pasif';
      default: return 'Bilinmiyor';
    }
  };



  const filteredClients = clientsList
    .filter(client => {
      // Güvenli veri kontrolü - undefined veya null değerleri filtrele
      if (!client || typeof client !== 'object') return false;
      

      
      const searchLower = searchTerm.toLowerCase();
      
      // Tüm müşteri bilgilerinde güvenli arama - hem eski hem yeni alan isimlerini kontrol et
      const matchesSearch = 
        (client.name && typeof client.name === 'string' && client.name.toLowerCase().includes(searchLower)) ||
        (client.email && typeof client.email === 'string' && client.email.toLowerCase().includes(searchLower)) ||
        (client.phone && typeof client.phone === 'string' && client.phone.toLowerCase().includes(searchLower)) ||
        (client.country && typeof client.country === 'string' && normalizeCountryName(client.country).toLowerCase().includes(searchLower)) ||
        (client.visa_type && typeof client.visa_type === 'string' && client.visa_type.toLowerCase().includes(searchLower)) ||
        (client.application_number && typeof client.application_number === 'string' && client.application_number.toLowerCase().includes(searchLower)) ||
        (client.passport_number && typeof client.passport_number === 'string' && client.passport_number.toLowerCase().includes(searchLower)) ||
        (client.tc_kimlik_no && typeof client.tc_kimlik_no === 'string' && client.tc_kimlik_no.toLowerCase().includes(searchLower)) ||
        (client.seyahat_amaci && typeof client.seyahat_amaci === 'string' && client.seyahat_amaci.toLowerCase().includes(searchLower)) ||
        (client.address && typeof client.address === 'string' && client.address.toLowerCase().includes(searchLower)) ||
        (client.notes && typeof client.notes === 'string' && client.notes.toLowerCase().includes(searchLower)) ||
        (client.kullanici_adi && typeof client.kullanici_adi === 'string' && client.kullanici_adi.toLowerCase().includes(searchLower)) ||
        (client.guvenlik_soru1 && typeof client.guvenlik_soru1 === 'string' && client.guvenlik_soru1.toLowerCase().includes(searchLower)) ||
        (client.guvenlik_cevap1 && typeof client.guvenlik_cevap1 === 'string' && client.guvenlik_cevap1.toLowerCase().includes(searchLower)) ||
        (client.guvenlik_soru2 && typeof client.guvenlik_soru2 === 'string' && client.guvenlik_soru2.toLowerCase().includes(searchLower)) ||
        (client.guvenlik_cevap2 && typeof client.guvenlik_cevap2 === 'string' && client.guvenlik_cevap2.toLowerCase().includes(searchLower)) ||
        (client.guvenlik_soru3 && typeof client.guvenlik_soru3 === 'string' && client.guvenlik_soru3.toLowerCase().includes(searchLower)) ||
        (client.guvenlik_cevap3 && typeof client.guvenlik_cevap3 === 'string' && client.guvenlik_cevap3.toLowerCase().includes(searchLower)) ||
        (client.appointment_time && typeof client.appointment_time === 'string' && client.appointment_time.toLowerCase().includes(searchLower)) ||
        // Gelişmiş tarih araması - randevu tarihi için
        (client.appointment_date && isDateMatch(client.appointment_date, searchTerm)) ||
        // Diğer tarih alanları için de tarih araması
        (client.created_at && isDateMatch(client.created_at, searchTerm)) ||
        (client.updated_at && isDateMatch(client.updated_at, searchTerm)) ||
        (client.dogum_tarihi && isDateMatch(client.dogum_tarihi, searchTerm));
      
      // Filtreleri güvenli şekilde uygula
      const matchesStatus = selectedStatus === 'all' || (client.status && client.status === selectedStatus);
      const matchesVisaType = selectedVisaType === 'all' || (client.visa_type && client.visa_type === selectedVisaType);
      const matchesCountry = selectedCountry === 'all' || 
        (client.country && normalizeCountryName(client.country) === selectedCountry);
      const matchesConsultant = selectedConsultant === 'all' || (client.consultant_id && client.consultant_id === parseInt(selectedConsultant));
      
      return matchesSearch && matchesStatus && matchesVisaType && matchesCountry && matchesConsultant;
    })
    .sort((a, b) => {
      try {
        // Güvenli sıralama - null/undefined kontrolü
        if (!a || !b) return 0;
        
        // Bugünün tarihini burada tanımla (tüm case'lerde kullanılabilir)
        const now = new Date();
        

        
        switch (sortCriteria) {
        case 'newest':
          // Veritabanından gelen alan isimlerini kullan
          const aCreatedAt = a.created_at || a.createdAt || '2024-01-01';
          const bCreatedAt = b.created_at || b.createdAt || '2024-01-01';

          
          // Tarih formatını güvenli hale getir
          const aDateNew = new Date(aCreatedAt);
          const bDateNew = new Date(bCreatedAt);
          
          if (isNaN(aDateNew.getTime()) || isNaN(bDateNew.getTime())) {
            console.warn('⚠️ Geçersiz tarih formatı:', { aCreatedAt, bCreatedAt });
            return 0;
          }
          
          return bDateNew - aDateNew;
          
        case 'oldest':
          const aCreatedAtOld = a.created_at || a.createdAt || '2024-01-01';
          const bCreatedAtOld = b.created_at || b.createdAt || '2024-01-01';

          
          // Tarih formatını güvenli hale getir
          const aDateOld = new Date(aCreatedAtOld);
          const bDateOld = new Date(bCreatedAtOld);
          
          if (isNaN(aDateOld.getTime()) || isNaN(bDateOld.getTime())) {
            console.warn('⚠️ Geçersiz tarih formatı:', { aCreatedAtOld, bCreatedAtOld });
            return 0;
          }
          
          return aDateOld - bDateOld;
          
        case 'appointmentNear':
          // En yakın randevu (sadece gelecekteki randevular, en yakından en uzağa)
          const aDateNear = a.appointment_date ? new Date(a.appointment_date + 'T' + (a.appointment_time || '00:00')) : new Date('9999-12-31');
          const bDateNear = b.appointment_date ? new Date(b.appointment_date + 'T' + (b.appointment_time || '00:00')) : new Date('9999-12-31');
          

          
          // Randevusu olmayan müşterileri en sona koy (gelecek randevular için)
          if (!a.appointment_date && b.appointment_date) return 1;
          if (a.appointment_date && !b.appointment_date) return -1;
          if (!a.appointment_date && !b.appointment_date) return 0;
          
          // Sadece gelecek randevuları sırala
          const aIsFuture = aDateNear > now;
          const bIsFuture = bDateNear > now;
          
          // Debug: İki müşteriyi de test et
          if (a.id && b.id) {
            console.log(`🔍 Gelecek randevu karşılaştırması: ${a.name} (${a.appointment_date}) vs ${b.name} (${b.appointment_date})`);
            console.log(`   A: ${aDateNear.toISOString()} (Future: ${aIsFuture})`);
            console.log(`   B: ${bDateNear.toISOString()} (Future: ${bIsFuture})`);
            console.log(`   Now: ${now.toISOString()}`);
          }
          
          // Gelecek randevuları önce sırala
          if (aIsFuture && !bIsFuture) return -1;
          if (!aIsFuture && bIsFuture) return 1;
          
          // Her ikisi de gelecekse, en yakın olanı önce sırala
          if (aIsFuture && bIsFuture) {
            const result = aDateNear - bDateNear;
            console.log(`   Gelecek sıralama sonucu: ${result} (${result < 0 ? 'A önce' : result > 0 ? 'B önce' : 'Eşit'})`);
            return result;
          }
          
          // Her ikisi de geçmişse, sıralama yapma
          return 0;
          
        case 'appointmentFar':
          // En uzak randevu (sadece geçmişteki randevular, en uzaktan en yakına)
          const aDateFar = a.appointment_date ? new Date(a.appointment_date + 'T' + (a.appointment_time || '00:00')) : new Date('1900-01-01');
          const bDateFar = b.appointment_date ? new Date(b.appointment_date + 'T' + (b.appointment_time || '00:00')) : new Date('1900-01-01');
          

          
          // Randevusu olmayan müşterileri en sona koy (geçmiş randevular için)
          if (!a.appointment_date && b.appointment_date) return 1;
          if (a.appointment_date && !b.appointment_date) return -1;
          if (!a.appointment_date && !b.appointment_date) return 0;
          
          // Sadece geçmiş randevuları sırala
          const aIsPast = aDateFar < now;
          const bIsPast = bDateFar < now;
          
          // Geçmiş randevuları önce sırala
          if (aIsPast && !bIsPast) return -1;
          if (!aIsPast && bIsPast) return 1;
          
          // Her ikisi de geçmişse, en uzak olanı önce sırala (en eski tarih)
          if (aIsPast && bIsPast) {
            return bDateFar - aDateFar;
          }
          
          // Her ikisi de gelecekse, sıralama yapma
          return 0;
          
        default:
          // İsim sıralaması için güvenli alan kullanımı
          const aName = a.name || '';
          const bName = b.name || '';

          return aName.localeCompare(bName, 'tr');
      }
    } catch (error) {
      console.error('Sıralama hatası:', error, { a, b, sortCriteria });
      return 0; // Hata durumunda sıralama yapma
    }
  });
  


  // Arama veya sıralama değiştiğinde sayfa numarasını sıfırla
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortCriteria]);

  const handleEdit = (client) => {
    setSelectedClient({ ...client });
    setIsDetailCardOpen(true);
  };

  const handleClientClick = (client) => {
    setSelectedClient(client);
    setIsDetailCardOpen(true);
  };

  const handleQuickInfoClick = (client) => {
    setQuickInfoModal({ isOpen: true, client });
  };

  const handleDownloadClients = async () => {
    try {
      console.log('PDF rapor oluşturuluyor...');
      
      const currentDate = new Date().toLocaleDateString('tr-TR');
      const currentTime = new Date().toLocaleTimeString('tr-TR');
      
      // Şirket bilgilerini al
      let companySettings = {};
      try {
        companySettings = await DatabaseService.getCompanySettings();
        console.log('✅ Şirket bilgileri alındı:', companySettings);
      } catch (error) {
        console.warn('⚠️ Şirket bilgileri alınamadı, varsayılan değerler kullanılıyor:', error);
        // Varsayılan şirket bilgileri
        companySettings = {
          company_name: 'Vize Danışmanlık',
          company_address: '',
          company_phone: '',
          company_email: '',
          company_website: '',
          company_logo_url: ''
        };
      }
      
      // HTML içeriği oluştur - Finans raporundaki stil ile aynı
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${companySettings.company_name || 'Vize Danışmanlık'} - Müşteri Listesi Raporu</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            @media print {
              body { margin: 0; padding: 20px; }
              .no-print { display: none; }
              .page-break { page-break-before: always; }
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              margin: 0;
              line-height: 1.4;
              color: #374151;
              background: #ffffff;
              font-size: 11px;
            }
            
            .container {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            
            /* Company Header Styles */
            .company-header {
              background: #ffffff;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 20px;
              margin-bottom: 25px;
              text-align: left;
            }
            
            .company-info {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 15px;
            }
            
            .company-logo-section {
              display: flex;
              align-items: center;
              justify-content: flex-start;
            }
            
            .company-logo {
              width: 120px;
              height: 90px;
              object-fit: contain;
              border-radius: 8px;
            }
            
            .company-contact {
              text-align: right;
              font-size: 11px;
              color: #6b7280;
              line-height: 1.5;
            }
            
            .company-contact div {
              margin-bottom: 3px;
            }
            
            .company-divider {
              height: 1px;
              background: #e5e7eb;
              margin: 0;
            }
            
            /* Header Styles */
            .header { 
              background: #f8fafc;
              color: #1f2937;
              padding: 15px 20px;
              border-radius: 6px;
              margin-bottom: 20px;
              border: 1px solid #e5e7eb;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            
            .header-left {
              text-align: left;
            }
            
            .header h1 { 
              font-size: 18px; 
              font-weight: 600;
              margin-bottom: 2px;
              color: #111827;
            }
            
            .header .subtitle {
              font-size: 12px;
              font-weight: 400;
              color: #6b7280;
            }
            
            .header-right {
              text-align: right;
              font-size: 10px;
              color: #6b7280;
            }
            
            .header-right .period-info {
              background: #f3f4f6;
              padding: 4px 8px;
              border-radius: 4px;
              font-weight: 500;
              color: #4b5563;
              margin-top: 5px;
              display: inline-block;
              border: 1px solid #e5e7eb;
            }
            
            /* Section Styles */
            .section { 
              margin: 20px 0; 
              page-break-inside: avoid;
            }
            
            .section h2 { 
              color: #111827; 
              font-size: 14px; 
              margin-bottom: 15px; 
              font-weight: 600;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 6px;
            }
            
            /* Stats Grid */
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 10px;
              margin-bottom: 20px;
            }
            
            .stat-card {
              background: #ffffff;
              border: 1px solid #e5e7eb;
              border-radius: 4px;
              padding: 12px;
              text-align: center;
            }
            
            .stat-label { 
              font-weight: 500; 
              color: #6b7280; 
              font-size: 9px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              margin-bottom: 6px;
            }
            
            .stat-value { 
              color: #111827; 
              font-size: 16px; 
              font-weight: 600;
              margin-bottom: 4px;
            }
            
            /* Table Styles */
            .table-container {
              background: white;
              border-radius: 4px;
              overflow: hidden;
              border: 1px solid #e5e7eb;
            }
            
            .table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 0;
            }
            
            .table th, .table td { 
              padding: 8px 10px; 
              text-align: left; 
              font-size: 9px;
              border-bottom: 1px solid #f3f4f6;
            }
            
            .table th { 
              background: #f9fafb;
              color: #374151; 
              font-weight: 600;
              font-size: 8px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            
            .table tr:hover { 
              background: #f9fafb; 
            }
            
            .table tr:last-child td {
              border-bottom: none;
            }
            
            /* Status Badges */
            .status-badge {
              padding: 3px 6px;
              border-radius: 3px;
              font-size: 8px;
              font-weight: 500;
              text-align: center;
              display: inline-block;
            }
            
            .status-active {
              background: #f0fdf4;
              color: #166534;
              border: 1px solid #bbf7d0;
            }
            
            .status-pending {
              background: #fffbeb;
              color: #92400e;
              border: 1px solid #fed7aa;
            }
            
            .status-completed {
              background: #eff6ff;
              color: #1e40af;
              border: 1px solid #bfdbfe;
            }
            
            /* Footer */
            .footer { 
              margin-top: 25px; 
              text-align: center; 
              color: #6b7280; 
              font-size: 10px;
              padding: 15px;
              background: #f9fafb;
              border-radius: 4px;
              border: 1px solid #e5e7eb;
            }
            
            .footer .logo {
              font-size: 12px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 6px;
            }
            
            /* Print Button */
            .print-button {
              background: #374151;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: 500;
              cursor: pointer;
              margin: 15px 0;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
              .container { padding: 15px; }
              .header { padding: 15px; }
              .header h1 { font-size: 16px; }
              .stats-grid { grid-template-columns: 1fr; }
              .table-container { overflow-x: auto; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Company Header -->
            ${companySettings.company_logo_url ? `
              <div class="company-header">
                <div class="company-info">
                  <div class="company-logo-section">
                    <img src="${companySettings.company_logo_url}" alt="Şirket Logosu" class="company-logo" />
                  </div>
                  <div class="company-contact">
                    ${companySettings.company_address ? `<div>${companySettings.company_address}</div>` : ''}
                    ${companySettings.company_phone ? `<div>Tel: ${companySettings.company_phone}</div>` : ''}
                    ${companySettings.company_email ? `<div>E-posta: ${companySettings.company_email}</div>` : ''}
                    ${companySettings.company_website ? `<div>Web: ${companySettings.company_website}</div>` : ''}
                  </div>
                </div>
                <hr class="company-divider" />
              </div>
            ` : ''}
            
            <!-- Header -->
            <div class="header">
              <div class="header-left">
                <h1>Müşteri Listesi Raporu</h1>
                <div class="subtitle">Vize Danışmanlık Müşteri Verileri</div>
              </div>
              <div class="header-right">
                <div>Rapor Tarihi: ${currentDate}</div>
                <div>Saat: ${currentTime}</div>
                <div class="period-info">Toplam ${filteredClients.length} Müşteri</div>
              </div>
            </div>
            
            <!-- Müşteri Detayları -->
            <div class="section">
              <h2>Müşteri Detayları</h2>
              <div class="table-container">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Müşteri Adı</th>
                      <th>Ülke</th>
                      <th>Vize Türü</th>
                      <th>Doğum Tarihi</th>
                      <th>Başvuru No</th>
                      <th>Pasaport</th>
                      <th>Randevu Tarihi</th>
                      <th>Durum</th>
                      <th>Danışman</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredClients.map(client => `
                      <tr>
                        <td>
                          <div>
                            <div style="font-weight: 600; color: #111827;">${client.name || 'Belirtilmemiş'}</div>
                            <div style="font-size: 8px; color: #6b7280;">${client.email || 'E-posta yok'}</div>
                            <div style="font-size: 8px; color: #6b7280;">${client.phone || 'Telefon yok'}</div>
                          </div>
                        </td>
                        <td>
                          <div style="font-weight: 500; color: #111827;">
                            ${normalizeCountryName(client.country) || 'Belirtilmemiş'}
                          </div>
                        </td>
                        <td>
                          <div style="font-size: 9px; color: #374151;">
                            ${client.visa_type || 'Belirtilmemiş'}
                          </div>
                        </td>
                        <td>
                          <div style="font-size: 9px; color: #374151;">
                            ${client.dogum_tarihi ? new Date(client.dogum_tarihi).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                          </div>
                        </td>
                        <td>
                          <div style="font-weight: ${client.application_number ? '700' : '500'}; color: #111827;">
                            ${client.application_number || 'Belirtilmemiş'}
                          </div>
                        </td>
                        <td>
                          <div style="font-size: 9px; color: #374151;">
                            ${client.passport_number || 'Belirtilmemiş'}
                          </div>
                        </td>
                        <td>
                          <div style="font-size: 9px; color: #374151;">
                            ${client.appointment_date ? new Date(client.appointment_date).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                          </div>
                          <div style="font-size: 8px; color: #6b7280;">
                            ${client.appointment_time || ''}
                          </div>
                        </td>
                        <td>
                          <div class="status-badge status-${client.status || 'inactive'}">
                            ${client.status === 'active' ? 'Randevu Alındı' : 
                              client.status === 'pending' ? 'Bekliyor' : 
                              client.status === 'completed' ? 'Tamamlandı' : 
                              'Bilinmiyor'}
                          </div>
                        </td>
                        <td>
                          <div style="font-size: 9px; color: #374151;">
                            ${client.consultant_id ? consultants.find(c => c.id === client.consultant_id)?.name : 'Atanmamış'}
                          </div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <div class="logo">${companySettings.company_name || 'Vize Danışmanlık'} - Müşteri Sistemi</div>
              <div>Bu rapor otomatik olarak oluşturulmuştur</div>
              <div style="margin-top: 8px; font-size: 11px; opacity: 0.8;">
                Rapor Tarihi: ${currentDate} | Saat: ${currentTime} | Toplam: ${filteredClients.length} Müşteri
              </div>
              ${companySettings.company_website ? `
                <div style="margin-top: 6px; font-size: 10px; color: #6b7280;">
                  ${companySettings.company_website}
                </div>
              ` : ''}
              <div style="margin-top: 8px;">
                <button class="print-button" onclick="window.print()">PDF Olarak İndir</button>
              </div>
              <div style="margin-top: 8px; font-size: 9px; color: #9ca3af;">
                Yazdır butonuna tıklayıp "Hedef" olarak "PDF olarak kaydet" seçeneğini kullanın
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      
      // Yeni pencere aç ve HTML içeriğini yaz
      const newWindow = window.open('', '_blank');
      newWindow.document.write(htmlContent);
      newWindow.document.close();
      
      // Kısa bir gecikme sonra yazdır dialogunu aç
      setTimeout(() => {
        newWindow.focus();
        newWindow.print();
      }, 500);
      
      toast.success(
        'PDF olarak kaydetmek için "PDF Olarak İndir" butonuna tıklayın.',
        'Müşteri raporu hazır!'
      );
      
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      toast.error(
        'PDF oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.',
        'PDF Hatası'
      );
    }
  };

  const handleCloseDetailCard = () => {
    setSelectedClient(null);
    setIsDetailCardOpen(false);
  };

  const handleDelete = (client) => {
    setDeleteModal({ isOpen: true, client });
  };

  // Notification gösterme fonksiyonu
  const showNotification = (message, type = 'success') => {
    setNotification({ isVisible: true, message, type });
    setTimeout(() => {
      setNotification({ isVisible: false, message: '', type: 'success' });
    }, 3000); // 3 saniye sonra kaybolur
  };

  // Başvuru numarası güncelleme onayı - Sadece veritabanı
  const handleApplicationNumberUpdate = async (client) => {
    try {
      setIsSaving(true);

      const updateTime = new Date().toISOString();
      const updateData = {
        application_number_updated_at: updateTime,
        application_number_manual_update: true,
        application_number_updated_by: 'current_user'
      };

      const result = await DatabaseService.updateClient(client.id, updateData);
      
      if (result) {
        // Local state'i güncelle
        const updatedClients = clientsList.map(c => 
          c.id === client.id 
            ? { 
                ...c, 
                application_number_updated_at: updateTime,
                application_number_manual_update: true,
                application_number_updated_by: updateData.application_number_updated_by
              }
            : c
        );
        setClientsList(updatedClients);

        // Modal'ı kapat
        setApplicationUpdateModal({ isOpen: false, client: null });

        console.log('✅ Veritabanında başarıyla kaydedildi');
        showNotification('20 günlük takip başladı!', 'success');
      } else {
        throw new Error('Veritabanı güncellemesi başarısız');
      }

    } catch (error) {
      console.error('Başvuru numarası güncelleme hatası:', error);
      showNotification('Veritabanı hatası: ' + error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Başvuru numarası takibini iptal et
  const handleApplicationNumberCancel = async (client) => {
    try {
      setIsSaving(true);

      const updateData = {
        application_number_updated_at: null,
        application_number_manual_update: false,
        application_number_updated_by: null
      };

      const result = await DatabaseService.updateClient(client.id, updateData);
      
      if (result) {
        // Local state'i güncelle
        const updatedClients = clientsList.map(c => 
          c.id === client.id 
            ? { 
                ...c, 
                application_number_updated_at: null,
                application_number_manual_update: false,
                application_number_updated_by: null
              }
            : c
        );
        setClientsList(updatedClients);

        // Modal'ı kapat
        setApplicationUpdateModal({ isOpen: false, client: null });

        console.log('✅ Takip iptal edildi');
        showNotification('Takip iptal edildi', 'success');
      } else {
        throw new Error('Veritabanı güncellemesi başarısız');
      }

    } catch (error) {
      console.error('Takip iptal hatası:', error);
      showNotification('İptal hatası: ' + error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };



  const confirmDelete = async () => {
    if (deleteModal.client) {
      try {
        // Veritabanından sil
        const result = await DatabaseService.deleteClient(deleteModal.client.id);
        
        if (result) {
          console.log('Müşteri başarıyla silindi:', deleteModal.client.id);
          
          // Local state'den müşteriyi kaldır
          const updatedClients = clientsList.filter(c => c.id !== deleteModal.client.id);
          setClientsList(updatedClients);
          
          // Seçili müşterilerden de kaldır
          setSelectedClients(prev => prev.filter(id => id !== deleteModal.client.id));
          
          // Toplu seçim durumunu güncelle
          if (selectAll) {
            setSelectAll(false);
          }
          
          setSuccessModal({ isOpen: true, message: 'Müşteri başarıyla silindi!' });
        } else {
          throw new Error('Silme işlemi başarısız');
        }
      } catch (error) {
        console.error('Silme hatası:', error);
        setSuccessModal({ isOpen: true, message: `Müşteri silinirken bir hata oluştu: ${error.message}` });
      }
    }
    setDeleteModal({ isOpen: false, client: null });
  };

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, client: null });
  };

  const handleAssignConsultant = (client) => {
    setConsultantModal({ isOpen: true, client });
  };

  const handleCloseConsultantModal = () => {
    setConsultantModal({ isOpen: false, client: null });
  };

  const handleSelectConsultant = async (consultantId) => {
    try {
      // assignConsultantToClient fonksiyonunu kullan (bildirim sistemi dahil)
      await DatabaseService.assignConsultantToClient(consultantId, consultantModal.client.id);
      
      const selectedConsultant = consultants.find(c => c.id === consultantId);
      
      setSuccessModal({
        isOpen: true,
        message: `${selectedConsultant.name} danışmanı ${consultantModal.client.name} müşterisine başarıyla atandı!`
      });
      
      handleCloseConsultantModal();
      await loadData(); // Verileri yenile
    } catch (error) {
      console.error('Danışman atama hatası:', error);
      toast.error('Danışman atanırken hata oluştu. Lütfen tekrar deneyin.', 'Atama Hatası');
    }
  };

  const handleRemoveConsultant = async () => {
    try {
      // removeConsultantFromClient fonksiyonunu kullan (bildirim sistemi dahil)
      await DatabaseService.removeConsultantFromClient(consultantModal.client.id);
      
      setSuccessModal({
        isOpen: true,
        message: `${consultantModal.client.name} müşterisinden danışman ataması kaldırıldı!`
      });
      
      handleCloseConsultantModal();
      await loadData(); // Verileri yenile
    } catch (error) {
      console.error('Danışman kaldırma hatası:', error);
      toast.error('Danışman kaldırılırken hata oluştu. Lütfen tekrar deneyin.', 'Kaldırma Hatası');
    }
  };

  const handleAddNewClient = async () => {
    setIsSaving(true);
    
    try {
      // Veriyi veritabanı formatına dönüştür ve boş değerleri temizle
      const clientDataForDB = {};
      
      // Sadece dolu alanları ekle
      if (newClient.name && newClient.name.trim()) clientDataForDB.name = newClient.name.trim();
      if (newClient.email && newClient.email.trim()) clientDataForDB.email = newClient.email.trim();
      if (newClient.phone && newClient.phone.trim()) clientDataForDB.phone = newClient.phone.trim();
      if (newClient.status) clientDataForDB.status = newClient.status;
      if (newClient.industry && newClient.industry.trim()) clientDataForDB.industry = newClient.industry.trim();
      if (newClient.address && newClient.address.trim()) clientDataForDB.address = newClient.address.trim();
      if (newClient.country && newClient.country.trim()) clientDataForDB.country = newClient.country.trim();
      if (newClient.visa_type && newClient.visa_type.trim()) clientDataForDB.visa_type = newClient.visa_type.trim();
      if (newClient.application_number && newClient.application_number.trim()) clientDataForDB.application_number = newClient.application_number.trim();
      if (newClient.passport_number && newClient.passport_number.trim()) clientDataForDB.passport_number = newClient.passport_number.trim();
      if (newClient.tc_kimlik_no && newClient.tc_kimlik_no.trim()) clientDataForDB.tc_kimlik_no = newClient.tc_kimlik_no.trim();
      if (newClient.kullanici_adi && newClient.kullanici_adi.trim()) clientDataForDB.kullanici_adi = newClient.kullanici_adi.trim();
      if (newClient.dogum_tarihi && newClient.dogum_tarihi.trim()) clientDataForDB.dogum_tarihi = newClient.dogum_tarihi.trim();
      if (newClient.appointment_date) clientDataForDB.appointment_date = newClient.appointment_date;
      if (newClient.appointment_time) clientDataForDB.appointment_time = newClient.appointment_time;
      if (newClient.seyahat_amaci && newClient.seyahat_amaci.trim()) clientDataForDB.seyahat_amaci = newClient.seyahat_amaci.trim();
      if (newClient.notes && newClient.notes.trim()) clientDataForDB.notes = newClient.notes.trim();
      if (newClient.guvenlik_soru1 && newClient.guvenlik_soru1.trim()) clientDataForDB.guvenlik_soru1 = newClient.guvenlik_soru1.trim();
      if (newClient.guvenlik_cevap1 && newClient.guvenlik_cevap1.trim()) clientDataForDB.guvenlik_cevap1 = newClient.guvenlik_cevap1.trim();
      if (newClient.guvenlik_soru2 && newClient.guvenlik_soru2.trim()) clientDataForDB.guvenlik_soru2 = newClient.guvenlik_soru2.trim();
      if (newClient.guvenlik_cevap2 && newClient.guvenlik_cevap2.trim()) clientDataForDB.guvenlik_cevap2 = newClient.guvenlik_cevap2.trim();
      if (newClient.guvenlik_soru3 && newClient.guvenlik_soru3.trim()) clientDataForDB.guvenlik_soru3 = newClient.guvenlik_soru3.trim();
      if (newClient.guvenlik_cevap3 && newClient.guvenlik_cevap3.trim()) clientDataForDB.guvenlik_cevap3 = newClient.guvenlik_cevap3.trim();
      
      console.log('Veritabanına gönderilecek veri:', clientDataForDB);
      
      // Veritabanına yeni müşteri ekle
      const newClientData = await DatabaseService.createClient(clientDataForDB);
      
      // Veritabanından güncel veriyi yeniden yükle
      await loadData();
      
      // Modal'ı kapat ve formu temizle
      setIsNewClientModalOpen(false);
      setNewClient({
        name: '',
        email: '',
        phone: '',
        status: 'active',
        industry: '',
        address: '',
        country: '',
        visa_type: '',
        application_number: '',
        passport_number: '',
        tc_kimlik_no: '',
        kullanici_adi: '',
        dogum_tarihi: '',
        appointment_date: '',
        appointment_time: '',
        seyahat_amaci: '',
        notes: '',
        guvenlik_soru1: '',
        guvenlik_cevap1: '',
        guvenlik_soru2: '',
        guvenlik_cevap2: '',
        guvenlik_soru3: '',
        guvenlik_cevap3: ''
      });
      
      // Başarı mesajı
      setSuccessModal({ isOpen: true, message: 'Yeni müşteri başarıyla eklendi!' });
      
    } catch (error) {
      console.error('Müşteri ekleme hatası detayı:', error);
      console.error('Hata mesajı:', error.message);
      console.error('Hata detayı:', error.details);
      setSuccessModal({ isOpen: true, message: `Müşteri ekleme hatası: ${error.message || 'Bilinmeyen hata'}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseNewClientModal = () => {
    setIsNewClientModalOpen(false);
    setNewClient({
      name: '',
      email: '',
      phone: '',
      status: 'active',
      industry: '',
      address: '',
      country: '',
      visa_type: '',
      application_number: '',
      passport_number: '',
      tc_kimlik_no: '',
      kullanici_adi: '',
      dogum_tarihi: '',
      appointment_date: '',
      appointment_time: '',
      seyahat_amaci: '',
      notes: '',
      guvenlik_soru1: '',
      guvenlik_cevap1: '',
      guvenlik_soru2: '',
      guvenlik_cevap2: '',
      guvenlik_soru3: '',
      guvenlik_cevap3: ''
    });
  };

  const handleStatusChange = async (client) => {
    // Durum döngüsü: active -> pending -> completed -> active
    let newStatus;
    if (client.status === 'active') {
      newStatus = 'pending';
    } else if (client.status === 'pending') {
      newStatus = 'completed';
    } else if (client.status === 'completed') {
      newStatus = 'active';
    } else {
      newStatus = 'active';
    }
    
    try {
      // Veritabanında güncelle
      await DatabaseService.updateClient(client.id, { status: newStatus });
      
      // Veritabanından güncel veriyi yeniden yükle
      await loadData();
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
      setSuccessModal({ isOpen: true, message: 'Durum güncellenirken bir hata oluştu.' });
    }
  };

  const clearAllFilters = () => {
    setSelectedStatus('all');
    setSelectedVisaType('all');
    setSelectedCountry('all');
    setSelectedConsultant('all');
    setSearchTerm('');
    setCurrentPage(1);
    setSelectedClients([]);
    setSelectAll(false);
  };

  const closeSuccessModal = () => {
    setSuccessModal({ isOpen: false, message: '' });
  };

  // Toplu seçim fonksiyonları
  const handleSelectClient = (clientId) => {
    setSelectedClients(prev => {
      if (prev.includes(clientId)) {
        return prev.filter(id => id !== clientId);
      } else {
        return [...prev, clientId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedClients([]);
      setSelectAll(false);
    } else {
      setSelectedClients(currentClients.map(client => client.id));
      setSelectAll(true);
    }
  };

  const handleBulkStatusChange = (newStatus) => {
    if (selectedClients.length === 0) return;
    
    const updatedClients = clientsList.map(client => 
      selectedClients.includes(client.id) ? { ...client, status: newStatus } : client
    );
    
    setClientsList(updatedClients);
    setSelectedClients([]);
    setSelectAll(false);
    
    setSuccessModal({ 
      isOpen: true, 
      message: `${selectedClients.length} müşterinin durumu başarıyla güncellendi!` 
    });
  };

  const handleBulkAssignConsultant = (consultantId) => {
    const updatedClients = clientsList.map(client => 
      selectedClients.includes(client.id) ? { ...client, consultant_id: consultantId } : client
    );
    
    setClientsList(updatedClients);
    
    const selectedConsultant = consultants.find(c => c.id === consultantId);
    
    setSuccessModal({
      isOpen: true,
      message: `${selectedClients.length} müşteriye ${selectedConsultant.name} danışmanı başarıyla atandı!`
    });
    
    setSelectedClients([]);
    setSelectAll(false);
  };

  const handleBulkDelete = () => {
    if (selectedClients.length === 0) return;
    
    // Toplu silme onay modalını aç
    setDeleteModal({ 
      isOpen: true, 
      client: { 
        id: 'bulk', 
        name: `${selectedClients.length} müşteri` 
      } 
    });
  };

  const confirmBulkDelete = async () => {
    try {
      // Seçili müşterileri veritabanından sil
      const deletePromises = selectedClients.map(clientId => 
        DatabaseService.deleteClient(clientId)
      );
      
      const results = await Promise.all(deletePromises);
      
      if (results.every(result => result === true)) {
        console.log('Toplu silme başarılı:', selectedClients.length, 'müşteri silindi');
        
        // Local state'den silinen müşterileri kaldır
        const updatedClients = clientsList.filter(client => !selectedClients.includes(client.id));
        setClientsList(updatedClients);
        setSelectedClients([]);
        setSelectAll(false);
        
        setSuccessModal({ 
          isOpen: true, 
          message: `${selectedClients.length} müşteri başarıyla silindi!` 
        });
      } else {
        throw new Error('Bazı müşteriler silinemedi');
      }
    } catch (error) {
      console.error('Toplu silme hatası:', error);
      setSuccessModal({ 
        isOpen: true, 
        message: `Toplu silme sırasında bir hata oluştu: ${error.message}` 
      });
    }
    
    setDeleteModal({ isOpen: false, client: null });
  };

  // Sayfalama fonksiyonları
  const indexOfLastClient = currentPage * clientsPerPage;
  const indexOfFirstClient = indexOfLastClient - clientsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstClient, indexOfLastClient);
  const totalPages = Math.ceil(filteredClients.length / clientsPerPage);

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
    setSelectedClients([]);
    setSelectAll(false);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      setSelectedClients([]);
      setSelectAll(false);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setSelectedClients([]);
      setSelectAll(false);
    }
  };

  return (
    <div className="space-y-6">
             {/* Header */}
       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
         <div>
           <h1 className="text-3xl font-bold text-gray-900">Müşteriler</h1>
           <p className="text-gray-600 mt-2">Müşteri bilgilerini yönetin ve takip edin</p>
         </div>
         <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
           <button 
             onClick={handleDownloadClients}
             className="btn-secondary flex items-center"
           >
             <Download size={20} className="mr-2" />
             PDF Rapor
           </button>
           <button 
             onClick={() => setIsNewClientModalOpen(true)}
             className="btn-primary flex items-center"
           >
             <Plus size={20} className="mr-2" />
             Yeni Müşteri
           </button>
         </div>
       </div>

      {/* Loading and Error States */}
      {isLoading && (
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Müşteriler yükleniyor...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
            <button
              onClick={loadData}
              className="text-red-600 hover:text-red-800 underline text-sm"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col gap-4">
          {/* Arama ve Temel Filtreler */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Müşteri adı, e-posta, telefon, ülke, vize türü, DS/BAŞVURU NO, pasaport, TC kimlik, adres, notlar, tarih (ör: 15.10.2024, 15/10/2024, 2024)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
                {searchTerm && searchTerm.match(/\d/) && (
                  <div className="absolute top-full left-0 mt-1 text-xs text-gray-500 bg-white px-3 py-1 border border-gray-200 rounded shadow-sm z-10">
                    📅 Tarih arama formatları: 15.10.2024, 15/10/2024, 15-10-2024, 10.2024, 2024
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={sortCriteria}
                onChange={(e) => setSortCriteria(e.target.value)}
                className="input-field"
              >
                <option value="newest">En Yeni Kayıt</option>
                <option value="oldest">En Eski Kayıt</option>
                <option value="appointmentNear">En Yakın Randevu</option>
                <option value="appointmentFar">En Uzak Randevu</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input-field"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="active">Randevu Alındı</option>
                <option value="pending">Bekliyor</option>
                <option value="completed">Tamamlandı</option>
              </select>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="btn-secondary flex items-center justify-center"
              >
                <Filter size={16} className="mr-2" />
                {showAdvancedFilters ? 'Filtreleri Gizle' : 'Gelişmiş Filtreler'}
              </button>
            </div>
          </div>

          {/* Gelişmiş Filtreler */}
          {showAdvancedFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vize Türü</label>
                  <select
                    value={selectedVisaType}
                    onChange={(e) => setSelectedVisaType(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="all">Tüm Vize Türleri</option>
                    <option value="Öğrenci Vizesi">Öğrenci Vizesi</option>
                    <option value="Çalışma Vizesi">Çalışma Vizesi</option>
                    <option value="Turist Vizesi">Turist Vizesi</option>
                    <option value="Aile Birleşimi">Aile Birleşimi</option>
                    <option value="İş Vizesi">İş Vizesi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hedef Ülke</label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="all">Tüm Ülkeler</option>
                    {Array.from(new Set(clientsList
                      .map(client => client.country)
                      .filter(country => country && country.trim() !== '')
                      .map(country => {
                        // Ülke isimlerini normalize et
                        const normalized = country.toString().toLowerCase().trim();
                        // Almanya varyasyonları
                        if (normalized === 'almanya' || normalized === 'germany' || normalized === 'aaaaaa' || 
                            normalized === 'almanya' || normalized === 'germany' || normalized === 'deutschland') {
                          return 'Almanya';
                        }
                        // Türkiye varyasyonları
                        if (normalized === 'türkiye' || normalized === 'turkey' || normalized === 'türkiye' || 
                            normalized === 'turkey') {
                          return 'Türkiye';
                        }
                        // Amerika varyasyonları
                        if (normalized === 'amerika' || normalized === 'usa' || normalized === 'united states' || 
                            normalized === 'amerıka' || normalized === 'amerika' || normalized === 'amerika') {
                          return 'Amerika Birleşik Devletleri';
                        }
                        // İngiltere varyasyonları
                        if (normalized === 'ingiltere' || normalized === 'england' || normalized === 'united kingdom' || 
                            normalized === 'ingiltere' || normalized === 'england' || normalized === 'uk') {
                          return 'İngiltere';
                        }
                        // Fransa varyasyonları
                        if (normalized === 'fransa' || normalized === 'france' || normalized === 'fransa') {
                          return 'Fransa';
                        }
                        // İtalya varyasyonları
                        if (normalized === 'italya' || normalized === 'italy' || normalized === 'italya') {
                          return 'İtalya';
                        }
                        // İspanya varyasyonları
                        if (normalized === 'ispanya' || normalized === 'spain' || normalized === 'ispanya') {
                          return 'İspanya';
                        }
                        // Hollanda varyasyonları
                        if (normalized === 'hollanda' || normalized === 'netherlands' || normalized === 'hollanda') {
                          return 'Hollanda';
                        }
                        // Belçika varyasyonları
                        if (normalized === 'belçika' || normalized === 'belgium' || normalized === 'belçika') {
                          return 'Belçika';
                        }
                        // Avusturya varyasyonları
                        if (normalized === 'avusturya' || normalized === 'austria' || normalized === 'avusturya') {
                          return 'Avusturya';
                        }
                        // İsviçre varyasyonları
                        if (normalized === 'isviçre' || normalized === 'switzerland' || normalized === 'isviçre') {
                          return 'İsviçre';
                        }
                        // Kanada varyasyonları
                        if (normalized === 'kanada' || normalized === 'canada' || normalized === 'kanada') {
                          return 'Kanada';
                        }
                        // Avustralya varyasyonları
                        if (normalized === 'avustralya' || normalized === 'australia' || normalized === 'avustralya') {
                          return 'Avustralya';
                        }
                        // Yeni Zelanda varyasyonları
                        if (normalized === 'yeni zelanda' || normalized === 'new zealand' || normalized === 'yeni zelanda') {
                          return 'Yeni Zelanda';
                        }
                        // Diğer ülkeler için ilk harfi büyük yap
                        return country.toString().charAt(0).toUpperCase() + country.toString().slice(1).toLowerCase();
                      })))
                      .sort()
                      .map(country => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))
                    }
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Danışman</label>
                  <select
                    value={selectedConsultant}
                    onChange={(e) => setSelectedConsultant(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="all">Tüm Danışmanlar</option>
                    <option value="null">Atanmamış</option>
                    {consultants.map(consultant => (
                      <option key={consultant.id} value={consultant.id}>
                        {consultant.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={clearAllFilters}
                    className="btn-secondary w-full"
                  >
                    Filtreleri Temizle
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

             {/* Toplu İşlemler Toolbar */}
       {selectedClients.length > 0 && (
         <div className="card bg-blue-50 border-blue-200">
           <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
             <div className="flex items-center space-x-4">
               <span className="text-sm font-medium text-blue-900">
                 {selectedClients.length} müşteri seçildi
               </span>
               <button
                 onClick={() => {
                   setSelectedClients([]);
                   setSelectAll(false);
                 }}
                 className="text-sm text-blue-600 hover:text-blue-800 underline"
               >
                 Seçimi Temizle
               </button>
             </div>
             
             <div className="flex flex-wrap items-center gap-2">
               {/* Toplu Durum Değiştirme */}
               <div className="relative">
                 <select
                   onChange={(e) => handleBulkStatusChange(e.target.value)}
                   className="input-field text-sm pr-8"
                   defaultValue=""
                 >
                   <option value="" disabled>Durum Değiştir</option>
                   <option value="active">Randevu Alındı</option>
                   <option value="pending">Bekliyor</option>
                   <option value="completed">Tamamlandı</option>
                 </select>
               </div>
               
               {/* Toplu Danışman Atama */}
               <div className="relative">
                 <select
                   onChange={(e) => handleBulkAssignConsultant(parseInt(e.target.value))}
                   className="input-field text-sm pr-8"
                   defaultValue=""
                 >
                   <option value="" disabled>Danışman Ata</option>
                   {consultants.map(consultant => (
                     <option key={consultant.id} value={consultant.id}>
                       {consultant.name}
                     </option>
                   ))}
                 </select>
               </div>
               
               {/* Toplu Silme */}
               <button
                 onClick={handleBulkDelete}
                 className="btn-danger text-sm px-3 py-1"
                 title="Seçilen müşterileri sil"
               >
                 Toplu Sil
               </button>
             </div>
           </div>
         </div>
       )}

      {/* Clients Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   <input
                     type="checkbox"
                     checked={selectAll}
                     onChange={handleSelectAll}
                     className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                   />
                 </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MÜŞTERİ ADI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ÜLKE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DOĞUM TARİHİ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  VİZE TÜRÜ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DS/BAŞVURU NO
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PASAPORT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RANDEVU TARİHİ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DURUM
                </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   DANIŞMAN
                 </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İŞLEMLER
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {currentClients.map((client) => (
                 <tr key={client.id} className={`hover:bg-gray-50 ${selectedClients.includes(client.id) ? 'bg-blue-50' : ''}`}>
                   <td className="px-6 py-4 whitespace-nowrap">
                     <input
                       type="checkbox"
                       checked={selectedClients.includes(client.id)}
                       onChange={() => handleSelectClient(client.id)}
                       className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                     />
                   </td>
                                     <td className="px-6 py-4 whitespace-nowrap">
                     <div className="flex items-center">
                       <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                         <span className="text-blue-600 font-semibold text-sm">
                           {client.name ? client.name.split(' ').map(n => n[0]).join('') : 'N/A'}
                         </span>
                       </div>
                       <div className="ml-4 cursor-pointer" onClick={() => handleQuickInfoClick(client)}>
                         <div 
                           className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                         >
                           {client.name}
                         </div>
                         <div className="text-sm text-gray-500">{client.email}</div>
                         <div className="text-sm text-gray-500 flex items-center mt-1">
                           <Phone size={14} className="mr-1" />
                           {client.phone}
                         </div>
                       </div>
                     </div>
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{client.country}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatTurkishDate(client.dogum_tarihi)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{client.visa_type || 'Belirtilmemiş'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <button
                        onClick={() => {
                          console.log('Başvuru numarasına tıklandı:', client.name);
                          setApplicationUpdateModal({ isOpen: true, client });
                        }}
                        className={`text-left text-sm text-gray-900 hover:text-blue-600 transition-colors cursor-pointer ${client.application_number ? 'font-bold' : 'font-medium'}`}
                      >
                        {client.application_number || 'Belirtilmemiş'}
                      </button>
                      {client.application_number && client.application_number_updated_at && (() => {
                        const daysUntil = getDaysUntilNextUpdate(client.application_number_updated_at);
                        const status = getUpdateStatus(daysUntil);
                        return status ? (
                          <span className={`text-xs ${status.color} mt-1`}>
                            {status.text}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{client.passport_number || 'Belirtilmemiş'}</span>
                  </td>
                                     <td className="px-6 py-4 whitespace-nowrap">
                     <div className="text-sm text-gray-900">
                       <div className="flex items-center">
                         <Calendar size={14} className="text-gray-400 mr-2" />
                         {formatTurkishDate(client.appointment_date)}
                       </div>
                       <div className="flex items-center mt-1">
                         <Clock size={14} className="text-gray-400 mr-2" />
                         {client.appointment_time || 'Belirtilmemiş'}
                       </div>
                     </div>
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <button
                       onClick={() => handleStatusChange(client)}
                       className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 hover:shadow-md cursor-pointer ${
                         client.status === 'active' 
                           ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                           : client.status === 'pending' 
                           ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                           : client.status === 'completed' 
                           ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                           : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                       }`}
                     >
                       {client.status === 'active' ? 'Randevu Alındı' : 
                        client.status === 'pending' ? 'Bekliyor' : 
                        client.status === 'completed' ? 'Tamamlandı' : 
                        getStatusText(client.status)}
                                          </button>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                     {client.consultant_id ? (
                       <span className="text-sm text-gray-900 font-medium">
                         {consultants.find(c => c.id === client.consultant_id)?.name}
                    </span>
                     ) : (
                       <span className="text-sm text-gray-400">Atanmamış</span>
                     )}
                  </td>
                                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                     <div className="flex items-center space-x-2">
                       <button 
                         className={`p-1 ${
                           client.consultant_id 
                             ? 'text-green-600 hover:text-green-900' 
                             : 'text-blue-600 hover:text-blue-900'
                         }`}
                         onClick={() => handleAssignConsultant(client)}
                         title={client.consultant_id ? 'Danışmanı Değiştir' : 'Danışman Ata'}
                       >
                         <User size={16} />
                       </button>
                       <button 
                         className="text-green-600 hover:text-green-900 p-1"
                         onClick={() => handleEdit(client)}
                         title="Düzenle"
                       >
                         <Edit size={16} />
                       </button>
                       <button 
                         className="text-red-600 hover:text-red-900 p-1"
                         onClick={() => handleDelete(client)}
                         title="Sil"
                       >
                         <Trash2 size={16} />
                       </button>
                     </div>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
             <button 
               onClick={goToPreviousPage}
               disabled={currentPage === 1}
               className={`btn-secondary ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
             >
              Önceki
            </button>
             <button 
               onClick={goToNextPage}
               disabled={currentPage === totalPages}
               className={`btn-primary ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
             >
              Sonraki
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                 <span className="font-medium">{indexOfFirstClient + 1}</span> - <span className="font-medium">{Math.min(indexOfLastClient, filteredClients.length)}</span> arası, toplam{' '}
                <span className="font-medium">{filteredClients.length}</span> sonuç
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                 <button 
                   onClick={goToPreviousPage}
                   disabled={currentPage === 1}
                   className={`btn-secondary rounded-l-md ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                 >
                  Önceki
                </button>
                 
                 {/* Sayfa numaraları */}
                 {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                   <button
                     key={pageNumber}
                     onClick={() => goToPage(pageNumber)}
                     className={`px-3 py-2 text-sm font-medium ${
                       pageNumber === currentPage
                         ? 'bg-blue-600 text-white border-blue-600'
                         : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                     } border`}
                   >
                     {pageNumber}
                   </button>
                 ))}
                 
                 <button 
                   onClick={goToNextPage}
                   disabled={currentPage === totalPages}
                   className={`btn-secondary rounded-r-md ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                 >
                  Sonraki
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Card */}
      {isDetailCardOpen && selectedClient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-5 mx-auto p-4 border w-11/12 max-w-5xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Müşteri Detayları - {selectedClient.name}</h3>
              <button
                onClick={handleCloseDetailCard}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Sol Kolon - Temel Bilgiler */}
              <div className="space-y-3">
                <div className="card">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Temel Bilgiler</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">İsim Soyisim</label>
                      <input
                        type="text"
                        value={selectedClient.name || ''}
                        onChange={(e) => setSelectedClient({...selectedClient, name: e.target.value})}
                        className="input-field"
                        placeholder="Müşteri adı"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                      <input
                        type="email"
                        value={selectedClient.email || ''}
                        onChange={(e) => setSelectedClient({...selectedClient, email: e.target.value})}
                        className="input-field"
                        placeholder="E-posta adresi"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                      <input
                        type="tel"
                        value={selectedClient.phone || ''}
                        onChange={(e) => setSelectedClient({...selectedClient, phone: e.target.value})}
                        className="input-field"
                        placeholder="+90 5XX XXX XX XX"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">TC Kimlik No</label>
                      <input
                        type="text"
                        value={selectedClient.tc_kimlik_no || ''}
                        onChange={(e) => setSelectedClient({...selectedClient, tc_kimlik_no: e.target.value})}
                        className="input-field"
                        placeholder="11 haneli TC kimlik numarası"
                        maxLength="11"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Doğum Tarihi</label>
                      <input
                        type="date"
                        value={selectedClient.dogum_tarihi || ''}
                        onChange={(e) => setSelectedClient({...selectedClient, dogum_tarihi: e.target.value})}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı Adı</label>
                      <input
                        type="text"
                        value={selectedClient.kullanici_adi || ''}
                        onChange={(e) => setSelectedClient({...selectedClient, kullanici_adi: e.target.value})}
                        className="input-field"
                        placeholder="Kullanıcı adı"
                      />
                    </div>
                  </div>
                </div>

                {/* Vize Bilgileri */}
                <div className="card">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Vize Bilgileri</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vize Türü</label>
                      <select
                        value={selectedClient.visa_type || ''}
                        onChange={(e) => setSelectedClient({...selectedClient, visa_type: e.target.value})}
                        className="input-field"
                      >
                        <option value="">Vize türü seçiniz</option>
                        <option value="Öğrenci Vizesi">Öğrenci Vizesi</option>
                        <option value="Çalışma Vizesi">Çalışma Vizesi</option>
                        <option value="Turist Vizesi">Turist Vizesi</option>
                        <option value="Aile Birleşimi">Aile Birleşimi</option>
                        <option value="İş Vizesi">İş Vizesi</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hedef Ülke</label>
                      <input
                        type="text"
                        value={selectedClient.country || ''}
                        onChange={(e) => setSelectedClient({...selectedClient, country: e.target.value})}
                        className="input-field"
                        placeholder="Hedef ülke"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">DS/BAŞVURU NO</label>
                      <input
                        type="text"
                        value={selectedClient.application_number || ''}
                        onChange={(e) => setSelectedClient({...selectedClient, application_number: e.target.value})}
                        className="input-field"
                        placeholder="DS-2024-XXX"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pasaport No</label>
                      <input
                        type="text"
                        value={selectedClient.passport_number || ''}
                        onChange={(e) => setSelectedClient({...selectedClient, passport_number: e.target.value})}
                        className="input-field"
                        placeholder="Pasaport numarası"
                      />
                    </div>
                  </div>
                </div>

                {/* Randevu Bilgileri */}
                <div className="card">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Randevu Bilgileri</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Randevu Tarihi</label>
                      <input
                        type="date"
                        value={selectedClient.appointment_date || ''}
                        onChange={(e) => setSelectedClient({...selectedClient, appointment_date: e.target.value})}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Randevu Saati</label>
                      <input
                        type="time"
                        value={selectedClient.appointment_time || ''}
                        onChange={(e) => setSelectedClient({...selectedClient, appointment_time: e.target.value})}
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>

                {/* Diğer Bilgiler */}
                <div className="card">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Diğer Bilgiler</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Seyahat Amacı</label>
                      <input
                        type="text"
                        value={selectedClient.seyahat_amaci || ''}
                        onChange={(e) => setSelectedClient({...selectedClient, seyahat_amaci: e.target.value})}
                        className="input-field"
                        placeholder="Seyahat amacı"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">İkametgah Adresi</label>
                      <textarea
                        value={selectedClient.address || ''}
                        onChange={(e) => setSelectedClient({...selectedClient, address: e.target.value})}
                        className="input-field"
                        placeholder="İkametgah adresi"
                        rows="2"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                      <textarea
                        value={selectedClient.notes || ''}
                        onChange={(e) => setSelectedClient({...selectedClient, notes: e.target.value})}
                        className="input-field"
                        placeholder="Müşteri hakkında notlar"
                        rows="3"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Sağ Kolon - Güvenlik Bilgileri */}
              <div className="space-y-3">
                <div className="card">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2 border-b pb-2">Güvenlik Bilgileri</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">1. Güvenlik Sorusu</label>
                      <input
                        type="text"
                        value={selectedClient.guvenlik_soru1 || ''}
                        onChange={(e) => setSelectedClient({...selectedClient, guvenlik_soru1: e.target.value})}
                        className="input-field"
                        placeholder="Güvenlik sorusu"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">1. Güvenlik Cevabı</label>
                      <input
                        type="text"
                        value={selectedClient.guvenlik_cevap1 || ''}
                        onChange={(e) => setSelectedClient({...selectedClient, guvenlik_cevap1: e.target.value})}
                        className="input-field"
                        placeholder="Güvenlik cevabı"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">2. Güvenlik Sorusu</label>
                      <input
                        type="text"
                        value={selectedClient.guvenlik_soru2 || ''}
                        onChange={(e) => setSelectedClient({...selectedClient, guvenlik_soru2: e.target.value})}
                        className="input-field"
                        placeholder="Güvenlik sorusu"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">2. Güvenlik Cevabı</label>
                      <input
                        type="text"
                        value={selectedClient.guvenlik_cevap2 || ''}
                        onChange={(e) => setSelectedClient({...selectedClient, guvenlik_cevap2: e.target.value})}
                        className="input-field"
                        placeholder="Güvenlik cevabı"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">3. Güvenlik Sorusu</label>
                      <input
                        type="text"
                        value={selectedClient.guvenlik_soru3 || ''}
                        onChange={(e) => setSelectedClient({...selectedClient, guvenlik_soru3: e.target.value})}
                        className="input-field"
                        placeholder="Güvenlik sorusu"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">3. Güvenlik Cevabı</label>
                      <input
                        type="text"
                        value={selectedClient.guvenlik_cevap3 || ''}
                        onChange={(e) => setSelectedClient({...selectedClient, guvenlik_cevap3: e.target.value})}
                        className="input-field"
                        placeholder="Güvenlik cevabı"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-4 pt-4 border-t">
              <button
                onClick={handleCloseDetailCard}
                className="btn-secondary"
              >
                Kapat
              </button>
              <button
                onClick={async () => {
                  setIsSaving(true);
                  
                  try {
                    // Veritabanına güncelleme gönder - sadece mevcut alanları
                    const updateData = {};
                    
                    // Sadece tanımlı alanları ekle - veritabanı sütun isimleriyle eşleştir
                    if (selectedClient.name !== undefined) updateData.name = selectedClient.name;
                    
                    // Başvuru numarası özel kontrolü - değişmişse localStorage'a kaydet
                    if (selectedClient.application_number !== undefined) {
                      updateData.application_number = selectedClient.application_number;
                      
                      // Eğer başvuru numarası değişmişse localStorage'da takip et
                      const originalClient = clientsList.find(c => c.id === selectedClient.id);
                      if (originalClient && originalClient.application_number !== selectedClient.application_number) {
                        const trackingData = {
                          clientId: selectedClient.id,
                          updateTime: new Date().toISOString(),
                          manualUpdate: true
                        };
                        
                        // localStorage'a kaydet
                        const existingTracking = JSON.parse(localStorage.getItem('applicationNumberTracking') || '{}');
                        existingTracking[selectedClient.id] = trackingData;
                        localStorage.setItem('applicationNumberTracking', JSON.stringify(existingTracking));
                        
                        console.log('Başvuru numarası değişikliği localStorage\'a kaydedildi:', trackingData);
                      }
                    }
                    if (selectedClient.country !== undefined) updateData.country = selectedClient.country;
                    if (selectedClient.phone !== undefined) updateData.phone = selectedClient.phone;
                    if (selectedClient.email !== undefined) updateData.email = selectedClient.email;
                    if (selectedClient.visa_type !== undefined) updateData.visa_type = selectedClient.visa_type;
                    if (selectedClient.status !== undefined) updateData.status = selectedClient.status;
                    if (selectedClient.passport_number !== undefined) updateData.passport_number = selectedClient.passport_number;
                    if (selectedClient.tc_kimlik_no !== undefined) updateData.tc_kimlik_no = selectedClient.tc_kimlik_no;
                    if (selectedClient.dogum_tarihi !== undefined) updateData.dogum_tarihi = selectedClient.dogum_tarihi;
                    if (selectedClient.kullanici_adi !== undefined) updateData.kullanici_adi = selectedClient.kullanici_adi;
                    if (selectedClient.appointment_date !== undefined) updateData.appointment_date = selectedClient.appointment_date;
                    if (selectedClient.appointment_time !== undefined) updateData.appointment_time = selectedClient.appointment_time;
                    if (selectedClient.seyahat_amaci !== undefined) updateData.seyahat_amaci = selectedClient.seyahat_amaci;
                    if (selectedClient.notes !== undefined) updateData.notes = selectedClient.notes;
                    if (selectedClient.address !== undefined) updateData.address = selectedClient.address;
                    if (selectedClient.industry !== undefined) updateData.industry = selectedClient.industry;
                    if (selectedClient.guvenlik_soru1 !== undefined) updateData.guvenlik_soru1 = selectedClient.guvenlik_soru1;
                    if (selectedClient.guvenlik_cevap1 !== undefined) updateData.guvenlik_cevap1 = selectedClient.guvenlik_cevap1;
                    if (selectedClient.guvenlik_soru2 !== undefined) updateData.guvenlik_soru2 = selectedClient.guvenlik_soru2;
                    if (selectedClient.guvenlik_cevap2 !== undefined) updateData.guvenlik_cevap2 = selectedClient.guvenlik_cevap2;
                    if (selectedClient.guvenlik_soru3 !== undefined) updateData.guvenlik_soru3 = selectedClient.guvenlik_soru3;
                    if (selectedClient.guvenlik_cevap3 !== undefined) updateData.guvenlik_cevap3 = selectedClient.guvenlik_cevap3;
                    
                    console.log('Güncellenecek veri:', updateData);
                    
                    const result = await DatabaseService.updateClient(selectedClient.id, updateData);
                    
                          if (result) {
        // Veritabanından güncel veriyi yeniden yükle
        await loadData();
        
        // Başarı mesajı
        showNotification('Müşteri bilgileri güncellendi!', 'success');
        
        // Modal'ı kapat
        handleCloseDetailCard();
      } else {
        throw new Error('Güncelleme başarısız');
      }
                  } catch (error) {
                    console.error('Kaydetme hatası detayı:', error);
                    console.error('Hata mesajı:', error.message);
                    console.error('Hata detayı:', error.details);
                    toast.error(`Kaydetme hatası: ${error.message || 'Bilinmeyen hata'}`, 'Kaydetme Hatası');
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving}
                className={`btn-primary ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </button>
            </div>
          </div>
                 </div>
       )}

       {/* Delete Confirmation Modal */}
       {deleteModal.isOpen && deleteModal.client && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-1/4 mx-auto p-6 border w-96 shadow-lg rounded-md bg-white">
             <div className="mt-3 text-center">
               {/* Warning Icon */}
               <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                 <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                 </svg>
               </div>
               
               {/* Title */}
               <h3 className="text-lg font-medium text-gray-900 mb-2">
                 {deleteModal.client.id === 'bulk' ? 'Toplu Silme Onayı' : 'Müşteri Silme Onayı'}
               </h3>
               
               {/* Message */}
               <div className="mt-2 px-7 py-3">
                 <p className="text-sm text-gray-500 mb-4">
                   {deleteModal.client.id === 'bulk' ? (
                     <>
                       <span className="font-semibold text-gray-700">{deleteModal.client.name}</span> silmek istediğinizden emin misiniz?
                     </>
                   ) : (
                     <>
                   <span className="font-semibold text-gray-700">{deleteModal.client.name}</span> müşterisini silmek istediğinizden emin misiniz?
                     </>
                   )}
                 </p>
                 <p className="text-xs text-gray-400">
                   Bu işlem geri alınamaz ve tüm müşteri verileri kalıcı olarak silinecektir.
                 </p>
               </div>
               
               {/* Buttons */}
               <div className="flex justify-center space-x-3 mt-6">
                 <button
                   onClick={cancelDelete}
                   className="btn-secondary px-6 py-2"
                 >
                   İptal
                 </button>
                 <button
                   onClick={deleteModal.client.id === 'bulk' ? confirmBulkDelete : confirmDelete}
                   className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                 >
                   Evet, Sil
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

      {/* New Client Modal */}
      {isNewClientModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Yeni Müşteri Ekle
              </h3>
              <button
                onClick={handleCloseNewClientModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Temel Bilgiler */}
              <div className="card">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Temel Bilgiler</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">İsim Soyisim</label>
                     <input
                       type="text"
                       value={newClient.name}
                       onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                       className="input-field"
                       placeholder="Ad Soyad giriniz"
                     />
                   </div>
                                     <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                     <input
                       type="email"
                       value={newClient.email}
                       onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                       className="input-field"
                       placeholder="E-posta adresi giriniz"
                     />
                   </div>
                                     <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                     <input
                       type="tel"
                       value={newClient.phone}
                       onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                       className="input-field"
                       placeholder="+90 5XX XXX XX XX"
                     />
                   </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">TC Kimlik No</label>
                    <input
                      type="text"
                      value={newClient.tc_kimlik_no}
                      onChange={(e) => setNewClient({...newClient, tc_kimlik_no: e.target.value})}
                      className="input-field"
                      placeholder="11 haneli TC kimlik numarası"
                      maxLength="11"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Doğum Tarihi</label>
                    <input
                      type="date"
                      value={newClient.dogum_tarihi}
                      onChange={(e) => setNewClient({...newClient, dogum_tarihi: e.target.value})}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı Adı</label>
                    <input
                      type="text"
                      value={newClient.kullanici_adi}
                      onChange={(e) => setNewClient({...newClient, kullanici_adi: e.target.value})}
                      className="input-field"
                      placeholder="Kullanıcı adı"
                    />
                  </div>
                </div>
              </div>

              {/* Vize Bilgileri */}
              <div className="card">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Vize Bilgileri</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Vize Türü</label>
                     <select
                       value={newClient.visa_type}
                       onChange={(e) => setNewClient({...newClient, visa_type: e.target.value})}
                       className="input-field"
                     >
                       <option value="">Vize türü seçiniz</option>
                       <option value="Öğrenci Vizesi">Öğrenci Vizesi</option>
                       <option value="Çalışma Vizesi">Çalışma Vizesi</option>
                       <option value="Turist Vizesi">Turist Vizesi</option>
                       <option value="Aile Birleşimi">Aile Birleşimi</option>
                       <option value="İş Vizesi">İş Vizesi</option>
                     </select>
                   </div>
                                     <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Hedef Ülke</label>
                     <input
                       type="text"
                       value={newClient.country}
                       onChange={(e) => setNewClient({...newClient, country: e.target.value})}
                       className="input-field"
                       placeholder="Hedef ülke"
                     />
                   </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">DS/BAŞVURU NO</label>
                    <input
                      type="text"
                      value={newClient.application_number}
                      onChange={(e) => setNewClient({...newClient, application_number: e.target.value})}
                      className="input-field"
                      placeholder="DS-2024-XXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pasaport No</label>
                    <input
                      type="text"
                      value={newClient.passport_number}
                      onChange={(e) => setNewClient({...newClient, passport_number: e.target.value})}
                      className="input-field"
                      placeholder="Pasaport numarası"
                    />
                  </div>
                </div>
              </div>

              {/* Randevu Bilgileri */}
              <div className="card">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Randevu Bilgileri</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Randevu Tarihi</label>
                    <input
                      type="date"
                      value={newClient.appointment_date}
                      onChange={(e) => setNewClient({...newClient, appointment_date: e.target.value})}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Randevu Saati</label>
                    <input
                      type="time"
                      value={newClient.appointment_time}
                      onChange={(e) => setNewClient({...newClient, appointment_time: e.target.value})}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Diğer Bilgiler */}
              <div className="card">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Diğer Bilgiler</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seyahat Amacı</label>
                    <input
                      type="text"
                      value={newClient.seyahat_amaci}
                      onChange={(e) => setNewClient({...newClient, seyahat_amaci: e.target.value})}
                      className="input-field"
                      placeholder="Seyahat amacı"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İkametgah Adresi</label>
                    <textarea
                      value={newClient.address}
                      onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                      className="input-field"
                      placeholder="İkametgah adresi"
                      rows="2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                    <textarea
                      value={newClient.notes}
                      onChange={(e) => setNewClient({...newClient, notes: e.target.value})}
                      className="input-field"
                      placeholder="Müşteri hakkında notlar"
                      rows="3"
                    />
                  </div>
                </div>
              </div>

              {/* Güvenlik Bilgileri */}
              <div className="card">
                <h4 className="text-lg font-semibold text-gray-900 mb-2 border-b pb-2">Güvenlik Bilgileri</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı Adı</label>
                    <input
                      type="text"
                      value={newClient.kullanici_adi || ''}
                      onChange={(e) => setNewClient({...newClient, kullanici_adi: e.target.value})}
                      className="input-field"
                      placeholder="Kullanıcı adı"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">1. Güvenlik Sorusu</label>
                    <input
                      type="text"
                      value={newClient.guvenlik_soru1 || ''}
                      onChange={(e) => setNewClient({...newClient, guvenlik_soru1: e.target.value})}
                      className="input-field"
                      placeholder="Güvenlik sorusu"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">1. Güvenlik Cevabı</label>
                    <input
                      type="text"
                      value={newClient.guvenlik_cevap1 || ''}
                      onChange={(e) => setNewClient({...newClient, guvenlik_cevap1: e.target.value})}
                      className="input-field"
                      placeholder="Güvenlik cevabı"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">2. Güvenlik Sorusu</label>
                    <input
                      type="text"
                      value={newClient.guvenlik_soru2 || ''}
                      onChange={(e) => setNewClient({...newClient, guvenlik_soru2: e.target.value})}
                      className="input-field"
                      placeholder="Güvenlik sorusu"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">2. Güvenlik Cevabı</label>
                    <input
                      type="text"
                      value={newClient.guvenlik_cevap2 || ''}
                      onChange={(e) => setNewClient({...newClient, guvenlik_cevap2: e.target.value})}
                      className="input-field"
                      placeholder="Güvenlik cevabı"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">3. Güvenlik Sorusu</label>
                    <input
                      type="text"
                      value={newClient.guvenlik_soru3 || ''}
                      onChange={(e) => setNewClient({...newClient, guvenlik_soru3: e.target.value})}
                      className="input-field"
                      placeholder="Güvenlik sorusu"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">3. Güvenlik Cevabı</label>
                    <input
                      type="text"
                      value={newClient.guvenlik_cevap3 || ''}
                      onChange={(e) => setNewClient({...newClient, guvenlik_cevap3: e.target.value})}
                      className="input-field"
                      placeholder="Güvenlik cevabı"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-4 pt-4 border-t">
              <button
                onClick={handleCloseNewClientModal}
                className="btn-secondary"
              >
                İptal
              </button>
                               <button
                   onClick={handleAddNewClient}
                   disabled={isSaving}
                   className={`btn-primary ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                 >
                   {isSaving ? 'Ekleniyor...' : 'Müşteri Ekle'}
                 </button>
            </div>
          </div>
        </div>
      )}

             {/* Success Modal */}
       {successModal.isOpen && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-1/4 mx-auto p-6 border w-96 shadow-lg rounded-md bg-white">
             <div className="mt-3 text-center">
               {/* Success Icon */}
               <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                 <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                 </svg>
               </div>
               
               {/* Title */}
               <h3 className="text-lg font-medium text-gray-900 mb-2">
                 {successModal.message.includes('başarıyla') ? 'Başarılı!' : 'Bilgi'}
               </h3>
               
               {/* Message */}
               <div className="mt-2 px-7 py-3">
                 <p className="text-sm text-gray-500">
                   {successModal.message}
                 </p>
               </div>
               
               {/* Button */}
               <div className="flex justify-center mt-6">
                 <button
                   onClick={closeSuccessModal}
                   className="btn-primary px-6 py-2"
                 >
                   Tamam
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Quick Info Modal */}
       {quickInfoModal.isOpen && quickInfoModal.client && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-5 mx-auto p-4 border w-11/12 max-w-5xl shadow-lg rounded-md bg-white">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-bold text-gray-900">
                 Müşteri Bilgileri - {quickInfoModal.client.name}
               </h3>
               <button
                 onClick={() => setQuickInfoModal({ isOpen: false, client: null })}
                 className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
               >
                 ×
               </button>
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
               {/* Sol Kolon - Temel Bilgiler */}
               <div className="space-y-3">
                 <div className="card">
                   <h4 className="text-lg font-semibold text-gray-900 mb-2">Temel Bilgiler</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     <div>
                       <span className="text-sm font-medium text-gray-700">İsim Soyisim:</span>
                       <span className="ml-2 text-sm text-gray-900">{quickInfoModal.client.name}</span>
                     </div>
                     <div>
                       <span className="text-sm font-medium text-gray-700">E-posta:</span>
                       <span className="ml-2 text-sm text-gray-900">{quickInfoModal.client.email}</span>
                     </div>
                     <div>
                       <span className="text-sm font-medium text-gray-700">Telefon:</span>
                       <span className="ml-2 text-sm text-gray-900">{quickInfoModal.client.phone}</span>
                     </div>
                     <div>
                       <span className="text-sm font-medium text-gray-700">TC Kimlik No:</span>
                       <span className="ml-2 text-sm text-gray-900">{quickInfoModal.client.tc_kimlik_no || quickInfoModal.client.tcKimlikNo}</span>
                     </div>
                     <div>
                       <span className="text-sm font-medium text-gray-700">Doğum Tarihi:</span>
                       <span className="ml-2 text-sm text-gray-900">{formatTurkishDate(quickInfoModal.client.dogum_tarihi)}</span>
                     </div>
                     <div>
                       <span className="text-sm font-medium text-gray-700">Kullanıcı Adı:</span>
                       <span className="ml-2 text-sm text-gray-900">{quickInfoModal.client.kullanici_adi || quickInfoModal.client.kullaniciAdi || 'Belirtilmemiş'}</span>
                     </div>
                   </div>
                 </div>

                 {/* Vize Bilgileri */}
                 <div className="card">
                   <h4 className="text-lg font-semibold text-gray-900 mb-2">Vize Bilgileri</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     <div>
                       <span className="text-sm font-medium text-gray-700">Vize Türü:</span>
                       <span className="ml-2 text-sm text-gray-900">{quickInfoModal.client.visa_type || quickInfoModal.client.visaType || 'Belirtilmemiş'}</span>
                     </div>
                     <div>
                       <span className="text-sm font-medium text-gray-700">Hedef Ülke:</span>
                       <span className="ml-2 text-sm text-gray-900">{quickInfoModal.client.country || 'Belirtilmemiş'}</span>
                     </div>
                     <div>
                       <span className="text-sm font-medium text-gray-700">DS/BAŞVURU NO:</span>
                       <span className="ml-2 text-sm text-gray-900">{quickInfoModal.client.application_number || quickInfoModal.client.applicationNumber || 'Belirtilmemiş'}</span>
                     </div>
                     <div>
                       <span className="text-sm font-medium text-gray-700">Pasaport No:</span>
                       <span className="ml-2 text-sm text-gray-900">{quickInfoModal.client.passport_number || quickInfoModal.client.passportNumber || 'Belirtilmemiş'}</span>
                     </div>
                   </div>
                 </div>

                 {/* Randevu Bilgileri */}
                 <div className="card">
                   <h4 className="text-lg font-semibold text-gray-900 mb-2">Randevu Bilgileri</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     <div>
                       <span className="text-sm font-medium text-gray-700">Randevu Tarihi:</span>
                       <span className="ml-2 text-sm text-gray-900">{formatTurkishDate(quickInfoModal.client.appointment_date)}</span>
                     </div>
                     <div>
                       <span className="text-sm font-medium text-gray-700">Randevu Saati:</span>
                       <span className="ml-2 text-sm text-gray-900">{quickInfoModal.client.appointment_time || quickInfoModal.client.appointmentTime || 'Belirtilmemiş'}</span>
                     </div>
                   </div>
                 </div>

                 {/* Diğer Bilgiler */}
                 <div className="card">
                   <h4 className="text-lg font-semibold text-gray-900 mb-2">Diğer Bilgiler</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     <div>
                       <span className="text-sm font-medium text-gray-700">Seyahat Amacı:</span>
                       <span className="ml-2 text-sm text-gray-900">{quickInfoModal.client.seyahat_amaci || quickInfoModal.client.seyahatAmaci || 'Belirtilmemiş'}</span>
                     </div>
                     <div>
                       <span className="text-sm font-medium text-gray-700">İkametgah Adresi:</span>
                       <span className="ml-2 text-sm text-gray-900">{quickInfoModal.client.address || quickInfoModal.client.ikametgahAdresi || 'Belirtilmemiş'}</span>
                     </div>
                     <div className="md:col-span-2">
                       <span className="text-sm font-medium text-gray-700">Notlar:</span>
                       <span className="ml-2 text-sm text-gray-900">{quickInfoModal.client.notes || quickInfoModal.client.not || 'Not bulunmuyor'}</span>
                     </div>
                   </div>
                 </div>
               </div>
               
               {/* Sağ Kolon - Güvenlik Bilgileri */}
               <div className="space-y-3">
                 <div className="card">
                   <h4 className="text-lg font-semibold text-gray-900 mb-2 border-b pb-2">Güvenlik Bilgileri</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     <div>
                       <span className="text-sm font-medium text-gray-700">1. Güvenlik Sorusu:</span>
                       <span className="ml-2 text-sm text-gray-900">{quickInfoModal.client.guvenlik_soru1 || quickInfoModal.client.guvenlikSoru1 || 'Belirtilmemiş'}</span>
                     </div>
                     <div>
                       <span className="text-sm font-medium text-gray-700">1. Güvenlik Cevabı:</span>
                       <span className="ml-2 text-sm text-gray-900">{quickInfoModal.client.guvenlik_cevap1 || quickInfoModal.client.guvenlikCevap1 || 'Belirtilmemiş'}</span>
                     </div>
                     <div>
                       <span className="text-sm font-medium text-gray-700">2. Güvenlik Sorusu:</span>
                       <span className="ml-2 text-sm text-gray-900">{quickInfoModal.client.guvenlik_soru2 || quickInfoModal.client.guvenlikSoru2 || 'Belirtilmemiş'}</span>
                     </div>
                     <div>
                       <span className="text-sm font-medium text-gray-700">2. Güvenlik Cevabı:</span>
                       <span className="ml-2 text-sm text-gray-900">{quickInfoModal.client.guvenlik_cevap2 || quickInfoModal.client.guvenlikCevap2 || 'Belirtilmemiş'}</span>
                     </div>
                     <div>
                       <span className="text-sm font-medium text-gray-700">3. Güvenlik Sorusu:</span>
                       <span className="ml-2 text-sm text-gray-900">{quickInfoModal.client.guvenlik_soru3 || quickInfoModal.client.guvenlikSoru3 || 'Belirtilmemiş'}</span>
                     </div>
                     <div>
                       <span className="text-sm font-medium text-gray-700">3. Güvenlik Cevabı:</span>
                       <span className="ml-2 text-sm text-gray-900">{quickInfoModal.client.guvenlik_cevap3 || quickInfoModal.client.guvenlikCevap3 || 'Belirtilmemiş'}</span>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
             
             <div className="flex justify-end space-x-3 mt-4 pt-4 border-t">
               <button
                 onClick={() => setQuickInfoModal({ isOpen: false, client: null })}
                 className="btn-secondary"
               >
                 Kapat
               </button>
               <button
                 onClick={() => {
                   setQuickInfoModal({ isOpen: false, client: null });
                   handleEdit(quickInfoModal.client);
                 }}
                 className="btn-primary"
               >
                 Düzenle
               </button>
             </div>
           </div>
         </div>
       )}

             {/* Consultant Assignment Modal - Profile Style Design */}
      {consultantModal.isOpen && consultantModal.client && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto border w-11/12 max-w-2xl shadow-xl rounded-lg bg-white">
            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Danışman Ata
                  </h3>
                  <p className="text-blue-100 text-sm">Müşteri Danışman Ataması</p>
                </div>
                <button
                  onClick={handleCloseConsultantModal}
                  className="text-white hover:text-blue-100 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Client Info Card */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-blue-600">
                      {consultantModal.client.name ? consultantModal.client.name.split(' ').map(n => n[0]).join('') : 'M'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{consultantModal.client.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      {consultantModal.client.country && (
                        <span>{consultantModal.client.country}</span>
                      )}
                      {consultantModal.client.visa_type && (
                        <span>{consultantModal.client.visa_type}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Consultants List */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Danışman Seçin</h4>
                <div className="grid gap-3 max-h-80 overflow-y-auto">
                  {consultants.filter(consultant => consultant.specialty !== 'Sistem Yöneticisi').map((consultant) => (
                    <div 
                      key={consultant.id} 
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                        consultantModal.client.consultant_id === consultant.id
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => handleSelectConsultant(consultant.id)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-600">
                            {consultant.name ? consultant.name.split(' ').map(n => n[0]).join('') : 'D'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900">{consultant.name}</h5>
                          <p className="text-sm text-gray-600">{consultant.specialty}</p>

                        </div>
                        <div className="flex items-center">
                          {consultantModal.client.consultant_id === consultant.id && (
                            <div className="text-blue-600">
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                {consultantModal.client.consultant_id && (
                  <button
                    onClick={handleRemoveConsultant}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Danışmanı Kaldır
                  </button>
                )}
                <button
                  onClick={handleCloseConsultantModal}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Başvuru Numarası Güncelleme Onay Modalı - Minimalist */}
      {applicationUpdateModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="text-lg font-medium text-gray-900 mb-2">
                Güncellendi mi?
              </div>
              <div className="text-sm text-gray-500">
                {applicationUpdateModal.client?.application_number_updated_at 
                  ? '20 günlük takip aktif'
                  : '20 günlük takip başlayacak'
                }
              </div>
            </div>

            <div className="space-y-2">
              {/* İlk sıra - Ana aksiyonlar */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setApplicationUpdateModal({ isOpen: false, client: null })}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Kapat
                </button>
                <button
                  onClick={() => handleApplicationNumberUpdate(applicationUpdateModal.client)}
                  disabled={isSaving}
                  className="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Kaydediliyor...' : 'Evet'}
                </button>
              </div>
              
              {/* İkinci sıra - İptal seçeneği (sadece takip aktifse göster) */}
              {applicationUpdateModal.client?.application_number_updated_at && (
                <button
                  onClick={() => handleApplicationNumberCancel(applicationUpdateModal.client)}
                  disabled={isSaving}
                  className="w-full py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'İptal ediliyor...' : 'Güncellemeyi İptal Et'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Minimalist Notification */}
      {notification.isVisible && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className={`
            rounded-full px-6 py-3 text-sm font-medium shadow-lg text-black
            ${notification.type === 'success' 
              ? 'bg-white border border-green-200' 
              : 'bg-white border border-red-200'
            }
          `}>
            {notification.message}
          </div>
        </div>
      )}

     </div>
   );
 };

export default Clients;
