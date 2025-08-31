import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  Plus, 
  Search, 
  Filter, 
  DollarSign,
  Euro,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  FileText,
  Download,
  Eye,
  Edit,
  Trash2,
  Clock
} from 'lucide-react';
import { DatabaseService } from '../services/database';
import { useToastContext } from '../components/Toast';

const Finance = () => {
  const toast = useToastContext();
  // State management
  const [payments, setPayments] = useState([]);
  const [clients, setClients] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isNewPaymentModalOpen, setIsNewPaymentModalOpen] = useState(false);
  const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false);
  const [isDeletePaymentModalOpen, setIsDeletePaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCurrency, setSelectedCurrency] = useState('all');
  const [selectedPaymentType, setSelectedPaymentType] = useState('all');
  const [selectedConsultant, setSelectedConsultant] = useState('all');
  const [sortByDate, setSortByDate] = useState('newest');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [paymentsPerPage] = useState(10);
  
  // Aylık/Yıllık filtre state'leri
  const [selectedPeriod, setSelectedPeriod] = useState('Tüm Zamanlar');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

     // Veri yükleme fonksiyonları
  useEffect(() => {
    console.log('🚀 Component mount oldu, veriler yükleniyor...');
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Veri yükleme başladı...');
      
      // Ödemeler, müşteri ve danışman verilerini paralel olarak yükle
      const [paymentsData, clientsData, consultantsData] = await Promise.all([
        DatabaseService.getPayments().catch(err => {
          console.warn('⚠️ Ödemeler yüklenemedi, boş array kullanılıyor:', err);
          return [];
        }),
        DatabaseService.getClients(),
        DatabaseService.getConsultantsWithClientCountAndRevenue()
      ]);
      
      console.log('📊 Yüklenen veriler:', {
        payments: paymentsData?.length || 0,
        clients: clientsData?.length || 0,
        consultants: consultantsData?.length || 0
      });
      
      // Payments tablosundan veri yükle
      setPayments(paymentsData || []);
      setClients(clientsData || []);
      setConsultants(consultantsData || []);
      
      console.log('✅ State güncellendi, payments array:', paymentsData?.length || 0);
      
    } catch (error) {
      console.error('❌ Veri yükleme hatası:', error);
      setError('Veriler yüklenirken hata oluştu. Lütfen sayfayı yenileyin.');
    } finally {
      setLoading(false);
      console.log('🏁 Veri yükleme tamamlandı');
    }
  };

  // New payment form state
  const [newPayment, setNewPayment] = useState({
    clientId: '',
    amount: '',
    currency: 'TRY',
    paymentType: '',
    paymentMethod: '',
    paymentDate: '',
    description: '',
    consultantId: ''
  });

  // Ay ve yıl seçimi için yardımcı fonksiyonlar
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  // Seçilen döneme göre ödemeleri filtrele
  const getFilteredPayments = () => {
    if (selectedPeriod === 'Bu Ay') {
      return payments.filter(payment => {
        const paymentDate = new Date(payment.paymentDate || payment.created_at || new Date());
        return paymentDate.getMonth() === selectedMonth && paymentDate.getFullYear() === selectedYear;
      });
    } else if (selectedPeriod === 'Bu Yıl') {
      return payments.filter(payment => {
        const paymentDate = new Date(payment.paymentDate || payment.created_at || new Date());
        return paymentDate.getFullYear() === selectedYear;
      });
    }
    return payments; // Tüm Zamanlar için tüm veriler
  };

  // Filtrelenmiş ödemeler (dönem bazında)
  const periodFilteredPayments = getFilteredPayments();

  // Helper functions
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'; // Ödeme Alındı - Yeşil
      case 'pending': return 'bg-yellow-100 text-yellow-800'; // Bekliyor - Sarı
      case 'cancelled': return 'bg-red-100 text-red-800'; // İade - Kırmızı
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Ödeme Alındı';
      case 'pending': return 'Bekliyor';
      case 'cancelled': return 'İade';
      default: return 'Bilinmiyor';
    }
  };

  const getCurrencySymbol = (currency) => {
    switch (currency) {
      case 'TRY': return '₺';
      case 'EUR': return '€';
      case 'USD': return '$';
      case 'GBP': return '£';
      default: return '';
    }
  };

  const getCurrencyColor = (currency) => {
    switch (currency) {
      case 'TRY': return 'text-green-600';
      case 'EUR': return 'text-blue-600';
      case 'USD': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  // Filtered payments - Arama, durum, para birimi, ödeme tipi ve tarih aralığı filtreleri
  const searchFilteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || payment.status === selectedStatus;
    const matchesCurrency = selectedCurrency === 'all' || payment.currency === selectedCurrency;
    const matchesPaymentType = selectedPaymentType === 'all' || payment.paymentType === selectedPaymentType;
    const matchesConsultant = selectedConsultant === 'all' || payment.consultantId === parseInt(selectedConsultant);
    
    const matchesDateRange = 
      (!dateRange.start || payment.paymentDate >= dateRange.start) &&
      (!dateRange.end || payment.paymentDate <= dateRange.end);

    return matchesSearch && matchesStatus && matchesCurrency && matchesPaymentType && matchesConsultant && matchesDateRange;
  });

  // Dönem filtresi uygula
  const periodAndSearchFilteredPayments = periodFilteredPayments.filter(payment => 
    searchFilteredPayments.some(searchPayment => searchPayment.id === payment.id)
  );

  // Tarih sıralaması uygula
  const filteredPayments = [...periodAndSearchFilteredPayments].sort((a, b) => {
    const dateA = new Date(a.paymentDate);
    const dateB = new Date(b.paymentDate);
    
    if (sortByDate === 'newest') {
      return dateB - dateA; // En yeni ödemeler önce
    } else if (sortByDate === 'oldest') {
      return dateA - dateB; // En eski ödemeler önce
    }
    return 0;
  });

  // Pagination
  const indexOfLastPayment = currentPage * paymentsPerPage;
  const indexOfFirstPayment = indexOfLastPayment - paymentsPerPage;
  const currentPayments = filteredPayments.slice(indexOfFirstPayment, indexOfLastPayment);
  const totalPages = Math.ceil(filteredPayments.length / paymentsPerPage);

  // Statistics - Filtrelenmiş verilerle hesapla
  const totalRevenue = periodFilteredPayments.reduce((sum, payment) => {
    if (payment.status === 'completed') {
      // Convert to TRY for calculation using current rates from doviz.com
      let amountInTRY = Number(payment.amount);
      if (payment.currency === 'EUR') amountInTRY = Number(payment.amount) * 48.09; // ₺48,0856
      if (payment.currency === 'USD') amountInTRY = Number(payment.amount) * 40.99; // ₺40,9880
      if (payment.currency === 'GBP') amountInTRY = Number(payment.amount) * 55.53; // ₺55,5313
      return sum + amountInTRY;
    }
    return sum;
  }, 0);

  const totalPending = periodFilteredPayments.filter(p => p.status === 'pending').length;
  const totalCompleted = periodFilteredPayments.filter(p => p.status === 'completed').length;
  const totalCancelled = periodFilteredPayments.filter(p => p.status === 'cancelled').length;

  // Currency breakdown - Filtrelenmiş verilerle hesapla
  const currencyBreakdown = periodFilteredPayments.reduce((acc, payment) => {
    if (payment.status === 'completed') {
      if (!acc[payment.currency]) acc[payment.currency] = 0;
      acc[payment.currency] += Number(payment.amount);
    }
    return acc;
  }, {});

  // Functions
  const handleAddNewPayment = async () => {
    if (newPayment.clientId && newPayment.amount && newPayment.paymentType) {
      try {
                 // Yeni ödeme verisi hazırla
         const paymentData = {
           clientId: newPayment.clientId,
           amount: Number(newPayment.amount),
           currency: newPayment.currency,
           paymentType: newPayment.paymentType,
           paymentMethod: newPayment.paymentMethod,
           paymentDate: newPayment.paymentDate || new Date().toISOString().split('T')[0],
           status: 'completed', // Yeni ödemeler "Ödeme Alındı" olarak başlar
           description: newPayment.description || 'Vize başvuru ücreti',
           consultantId: newPayment.consultantId,
           invoiceNumber: `INV-${String(Date.now()).slice(-6)}`
         };
        
        console.log('🔧 Yeni ödeme ekleniyor:', paymentData);
        
        // Veritabanında ödeme oluştur
        const newPaymentRecord = await DatabaseService.createPayment(paymentData);
        
        // Müşteri fiyatını da güncelle
        if (newPayment.clientId) {
          await DatabaseService.updateClientPrice(newPayment.clientId, newPayment.amount, newPayment.currency);
        }
        
        // Ödeme listesini güncelle
        const paymentWithNames = {
          ...newPaymentRecord,
          clientName: clients.find(c => c.id == newPayment.clientId)?.name || 
                     clients.find(c => c.id == newPayment.clientId)?.full_name || 'İsimsiz Müşteri',
          consultantName: consultants.find(c => c.id == newPayment.consultantId)?.name || 'Atanmamış'
        };
        
        setPayments([paymentWithNames, ...payments]);
        setIsNewPaymentModalOpen(false);
        setNewPayment({
          clientId: '',
          amount: '',
          currency: 'TRY',
          paymentType: '',
          paymentMethod: '',
          paymentDate: '',
          description: '',
          consultantId: ''
        });
        
        // Başarı mesajı göster
        console.log('🎉 Ödeme başarıyla eklendi ve state güncellendi');
        toast.success('Ödeme başarıyla eklendi!', 'Başarılı');
        
        // Veriyi yeniden yükle ve state'i güncelle
        try {
          console.log('🔄 Veriler yeniden yükleniyor...');
          await loadData();
          console.log('✅ Veriler başarıyla yeniden yüklendi');
        } catch (reloadError) {
          console.error('⚠️ Veri yeniden yükleme hatası:', reloadError);
          // Manuel olarak state'i güncelle
          setPayments(prevPayments => [paymentWithNames, ...prevPayments]);
        }
        
      } catch (error) {
        console.error('💥 Ödeme ekleme hatası detayı:', {
          error: error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        let userMessage = 'Ödeme eklenirken hata oluştu. ';
        
        if (error.message.includes('relation') || error.message.includes('table')) {
          userMessage += 'Payments tablosu bulunamadı. Lütfen veritabanı yapısını kontrol edin.';
        } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
          userMessage += 'Veritabanı yazma izni yok. Lütfen RLS ayarlarını kontrol edin.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          userMessage += 'Ağ bağlantısı hatası. Lütfen internet bağlantınızı kontrol edin.';
        } else {
          userMessage += error.message || 'Lütfen tekrar deneyin.';
        }
        
        toast.error(userMessage, 'Ödeme Hatası');
      }
    } else {
      toast.warning('Lütfen gerekli alanları doldurun!', 'Eksik Bilgi');
    }
  };

  const handleUpdatePayment = async () => {
    if (selectedPayment && newPayment.amount && newPayment.paymentType) {
      try {
                 // Güncelleme verisi hazırla
         const updateData = {
           amount: Number(newPayment.amount),
           currency: newPayment.currency,
           paymentType: newPayment.paymentType,
           paymentMethod: newPayment.paymentMethod,
           paymentDate: newPayment.paymentDate,
           status: selectedPayment.status, // Mevcut durumu koru (payments.status)
           description: newPayment.description,
           consultantId: newPayment.consultantId,
           invoiceNumber: selectedPayment.invoiceNumber // Mevcut fatura numarasını koru
         };
        
        console.log('🔧 Ödeme güncelleniyor:', updateData);
        
        // Veritabanında ödemeyi güncelle
        const updatedPaymentRecord = await DatabaseService.updatePayment(selectedPayment.id, updateData);
        
        // Müşteri fiyatını da güncelle
        if (selectedPayment.clientId) {
          await DatabaseService.updateClientPrice(selectedPayment.clientId, newPayment.amount, newPayment.currency);
        }
        
        // Ödeme listesini güncelle
        const updatedPayments = payments.map(p => 
          p.id === selectedPayment.id 
            ? {
                ...p,
                ...updatedPaymentRecord,
                clientName: p.clientName, // Mevcut müşteri adını koru
                consultantName: consultants.find(c => c.id == newPayment.consultantId)?.name || 'Atanmamış'
              }
            : p
        );
        
        setPayments(updatedPayments);
        setIsEditPaymentModalOpen(false);
        setSelectedPayment(null);
        setNewPayment({
          clientId: '',
          amount: '',
          currency: 'TRY',
          paymentType: '',
          paymentMethod: '',
          paymentDate: '',
          description: '',
          consultantId: ''
        });
        
        // Başarı mesajı göster
        toast.success('Ödeme başarıyla güncellendi!', 'Başarılı');
      } catch (error) {
        console.error('❌ Ödeme güncelleme hatası:', error);
        toast.error('Ödeme güncellenirken hata oluştu. Lütfen tekrar deneyin.', 'Güncelleme Hatası');
      }
    } else {
      toast.warning('Lütfen gerekli alanları doldurun!', 'Eksik Bilgi');
    }
  };

     const handleEditPayment = (payment) => {
     setSelectedPayment(payment);
     // Düzenleme formunu mevcut verilerle doldur
     setNewPayment({
       clientId: payment.clientId,
       amount: payment.amount,
       currency: payment.currency,
       paymentType: payment.paymentType,
       paymentMethod: payment.paymentMethod,
       paymentDate: payment.paymentDate,
       description: payment.description,
       consultantId: payment.consultantId || ''
     });
     
     console.log('Düzenleme için ödeme:', {
       id: payment.id,
       consultantId: payment.consultantId,
       consultantName: payment.consultantName
     });
     
     setIsEditPaymentModalOpen(true);
   };

  const handleDeletePayment = (payment) => {
    setSelectedPayment(payment);
    setIsDeletePaymentModalOpen(true);
  };

  const confirmDeletePayment = async () => {
    if (selectedPayment) {
      try {
        // Veritabanından ödemeyi sil
        await DatabaseService.deletePayment(selectedPayment.id);
        
        // Ödeme listesinden kaldır
        setPayments(payments.filter(p => p.id !== selectedPayment.id));
        setIsDeletePaymentModalOpen(false);
        setSelectedPayment(null);
        
        // Başarı mesajı göster
        toast.success('Ödeme başarıyla silindi!', 'Başarılı');
      } catch (error) {
        console.error('❌ Ödeme silme hatası:', error);
        toast.error('Ödeme silinirken hata oluştu. Lütfen tekrar deneyin.', 'Silme Hatası');
      }
    }
  };

  const handleStatusChange = async (payment) => {
  try {
    // Durum döngüsü: Bekliyor -> Ödeme Alındı -> İade -> Bekliyor
    let newStatus;
    if (payment.status === 'pending') {
      newStatus = 'completed'; // Bekliyor -> Ödeme Alındı
    } else if (payment.status === 'completed') {
      newStatus = 'cancelled'; // Ödeme Alındı -> İade
    } else if (payment.status === 'cancelled') {
      newStatus = 'pending'; // İade -> Bekliyor
    } else {
      newStatus = 'pending'; // Varsayılan olarak Bekliyor
    }
    
    // Sadece payments.status tablosunda güncelle (clients.status güncellenmez)
    await DatabaseService.updatePaymentStatus(payment.id, newStatus);
    
    // Veritabanından güncel veriyi yeniden yükle
    await loadData();
    
    console.log(`✅ Ödeme ${payment.id} durumu güncellendi: ${getStatusText(payment.status)} → ${getStatusText(newStatus)}`);
    
  } catch (error) {
    console.error('❌ Durum güncelleme hatası:', error);
    toast.error('Durum güncellenirken bir hata oluştu. Lütfen tekrar deneyin.', 'Durum Hatası');
  }
};

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedCurrency('all');
    setSelectedPaymentType('all');
    setSelectedConsultant('all');
    setSortByDate('newest');
    setDateRange({ start: '', end: '' });
    setCurrentPage(1);
  };

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

      const handleDownloadReport = async () => {
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
          company_address: 'İstanbul, Türkiye',
          company_phone: '+90 212 555 0123',
          company_email: 'info@vizedanismanlik.com',
          company_website: 'www.vizedanismanlik.com',
          company_logo_url: null
        };
      }
      
      // HTML içeriği oluştur - Modern Minimalist Tasarım
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${companySettings.company_name || 'Vize Danışmanlık'} - Finans Raporu</title>
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
              font-size: 10px;
              color: #6b7280;
              line-height: 1.4;
            }
            
            .company-divider {
              border: none;
              border-top: 2px solid #f3f4f6;
              margin: 15px 0 0 0;
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
            
            .header-left h1 { 
              font-size: 18px; 
              font-weight: 600;
              margin-bottom: 3px;
              color: #111827;
              text-align: left;
            }
            
            .header-left .subtitle {
              font-size: 11px;
              font-weight: 400;
              color: #6b7280;
              text-align: left;
              margin: 0;
            }
            
            .header-right {
              text-align: right;
              font-size: 10px;
              color: #6b7280;
              line-height: 1.3;
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
            
            .status-completed {
              background: #f0fdf4;
              color: #166534;
              border: 1px solid #bbf7d0;
            }
            
            .status-pending {
              background: #fffbeb;
              color: #92400e;
              border: 1px solid #fed7aa;
            }
            
            .status-cancelled {
              background: #fef2f2;
              color: #991b1b;
              border: 1px solid #fecaca;
            }
            
            /* Currency Grid */
            .currency-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
              gap: 10px;
              margin: 15px 0;
            }
            
            .currency-item {
              background: #ffffff;
              border: 1px solid #e5e7eb;
              border-radius: 4px;
              padding: 12px;
              text-align: center;
            }
            
            .currency-amount {
              font-size: 14px;
              font-weight: 600;
              color: #111827;
              margin-bottom: 4px;
            }
            
            .currency-code {
              font-size: 9px;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            
            /* Consultant Grid */
            .consultant-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 10px;
              margin: 15px 0;
            }
            
            .consultant-item {
              background: #ffffff;
              border: 1px solid #e5e7eb;
              border-radius: 4px;
              padding: 12px;
            }
            
            .consultant-name {
              font-weight: 600;
              color: #111827;
              margin-bottom: 6px;
              font-size: 11px;
            }
            
            .consultant-stats {
              font-size: 9px;
              color: #6b7280;
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
            
            <!-- Report Header -->
            <div class="header">
              <div class="header-left">
                <h1>Finans Raporu</h1>
                <div class="subtitle">Ödeme Takibi ve Finansal Analiz</div>
              </div>
              <div class="header-right">
                <div>Rapor Tarihi: ${currentDate}</div>
                <div>Saat: ${currentTime}</div>
                ${selectedPeriod !== 'Tüm Zamanlar' ? `
                <div class="period-info">
                  ${selectedPeriod === 'Bu Ay' ? months[selectedMonth] : selectedPeriod} ${selectedYear}
                </div>
                ` : ''}
              </div>
            </div>
            
            <!-- Özet İstatistikler -->
            <div class="section">
              <h2>Özet İstatistikler</h2>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-label">Toplam Gelir</div>
                  <div class="stat-value">₺${totalRevenue.toLocaleString('tr-TR')}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Bekleyen Ödemeler</div>
                  <div class="stat-value">${totalPending} adet</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Tamamlanan Ödemeler</div>
                  <div class="stat-value">${totalCompleted} adet</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">İade Edilen</div>
                  <div class="stat-value">${totalCancelled} adet</div>
                </div>
              </div>
            </div>
            
            <!-- Para Birimi Dağılımı -->
            <div class="section">
              <h2>Para Birimi Dağılımı</h2>
              <div class="currency-grid">
                ${Object.entries(currencyBreakdown).map(([currency, amount]) => `
                  <div class="currency-item">
                    <div class="currency-amount">${getCurrencySymbol(currency)}${amount.toLocaleString('tr-TR')}</div>
                    <div class="currency-code">${currency}</div>
                  </div>
                `).join('')}
              </div>
            </div>
            
            <!-- Ödeme Detayları -->
            <div class="section">
              <h2>Ödeme Detayları</h2>
              <div class="table-container">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Müşteri</th>
                      <th>Tutar</th>
                      <th>Para Birimi</th>
                      <th>Ödeme Türü</th>
                      <th>Tarih</th>
                      <th>Durum</th>
                      <th>Danışman</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredPayments.map(payment => `
                      <tr>
                        <td>
                          <strong>${payment.clientName}</strong>
                          ${payment.description ? `<br><small style="color: #6b7280; font-size: 8px;">${payment.description}</small>` : ''}
                        </td>
                        <td><strong>${getCurrencySymbol(payment.currency)}${payment.amount.toLocaleString('tr-TR')}</strong></td>
                        <td>${payment.currency}</td>
                        <td>${payment.paymentType}</td>
                        <td>${new Date(payment.paymentDate).toLocaleDateString('tr-TR')}</td>
                        <td>
                          <div class="status-badge status-${payment.status}">
                            ${getStatusText(payment.status)}
                          </div>
                        </td>
                        <td>${payment.consultantName}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
            
            <!-- Danışman Performansı -->
            <div class="section">
              <h2>Danışman Performansı</h2>
              <div class="consultant-grid">
                ${consultants.map(consultant => {
                  const consultantPayments = filteredPayments.filter(p => p.consultantId === consultant.id);
                  const completedPayments = consultantPayments.filter(p => p.status === 'completed');
                  const totalAmount = completedPayments.reduce((sum, p) => {
                    let amountInTRY = Number(p.amount);
                    if (p.currency === 'EUR') amountInTRY = Number(p.amount) * 48.09;
                    if (p.currency === 'USD') amountInTRY = Number(p.amount) * 40.99;
                    if (p.currency === 'GBP') amountInTRY = Number(p.amount) * 55.53;
                    return sum + amountInTRY;
                  }, 0);
                   
                  return `
                    <div class="consultant-item">
                      <div class="consultant-name">${consultant.name}</div>
                      <div class="consultant-stats">
                        ${consultantPayments.length} ödeme • ₺${totalAmount.toLocaleString('tr-TR')} gelir
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <div class="logo">${companySettings.company_name || 'Vize Danışmanlık'} - Finans Sistemi</div>
              <div>Bu rapor otomatik olarak oluşturulmuştur</div>
              <div style="margin-top: 8px; font-size: 11px; opacity: 0.8;">
                Rapor Tarihi: ${currentDate} | Saat: ${currentTime}
              </div>
              ${companySettings.company_website ? `
                <div style="margin-top: 6px; font-size: 10px; color: #6b7280;">
                  ${companySettings.company_website}
                </div>
              ` : ''}
            </div>
            
            <!-- Print Button -->
            <div class="no-print" style="text-align: center;">
              <button class="print-button" onclick="window.print()">
                PDF Olarak İndir
              </button>
              <p style="color: #6b7280; margin-top: 12px; font-size: 13px;">
                Yazdır butonuna tıklayıp "Hedef" olarak "PDF olarak kaydet" seçeneğini kullanın
              </p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      // Yeni sekmede aç
      const newWindow = window.open('', '_blank');
      newWindow.document.write(htmlContent);
      newWindow.document.close();
      
      console.log('HTML rapor başarıyla açıldı!');
      toast.success(
        'PDF olarak kaydetmek için "PDF Olarak İndir" butonuna tıklayın.',
        'Finans raporu hazır!'
      );
      
    } catch (error) {
      console.error('Rapor oluşturma hatası:', error);
      toast.error('Rapor oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.', 'Rapor Hatası');
    }
  };

  // Loading durumu
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finans</h1>
          <p className="text-gray-600 mt-2">Ödeme takibi ve finansal raporlar</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Veriler yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error durumu
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finans</h1>
          <p className="text-gray-600 mt-2">Ödeme takibi ve finansal raporlar</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Hata Oluştu</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={loadData}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finans</h1>
          <p className="text-gray-600 mt-2">
            Ödeme takibi ve finansal raporlar
            {selectedPeriod !== 'Tüm Zamanlar' && (
              <span className="ml-2 text-sm font-medium text-blue-600">
                • {selectedPeriod === 'Bu Ay' ? months[selectedMonth] : selectedPeriod} {selectedYear}
              </span>
            )}
            {selectedConsultant !== 'all' && (
              <span className="ml-2 text-sm font-medium text-green-600">
                • {consultants.find(c => c.id === parseInt(selectedConsultant))?.name} Danışman
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3 mt-4 sm:mt-0">
          {/* Aylık/Yıllık Filtre Bölümü */}
          <div className="flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <Calendar size={16} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Dönem:</span>
            </div>
            
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="Tüm Zamanlar">Tüm Zamanlar</option>
              <option value="Bu Ay">Bu Ay</option>
              <option value="Bu Yıl">Bu Yıl</option>
            </select>
            
            {/* Ay ve Yıl Seçimi - Sadece "Bu Ay" seçildiğinde görünür */}
            {selectedPeriod === 'Bu Ay' && (
              <div className="flex items-center space-x-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {months.map((month, index) => (
                    <option key={index} value={index}>{month}</option>
                  ))}
                </select>
                
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Yıl Seçimi - Sadece "Bu Yıl" seçildiğinde görünür */}
            {selectedPeriod === 'Bu Yıl' && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            )}
          </div>
          
          <button 
            onClick={() => setIsNewPaymentModalOpen(true)}
            className="btn-primary flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Yeni Ödeme
          </button>
          <button 
            onClick={handleDownloadReport}
            className="btn-secondary flex items-center"
          >
            <Download size={20} className="mr-2" />
            PDF Rapor
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-gray-900" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Toplam Gelir
                {selectedPeriod !== 'Tüm Zamanlar' && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({selectedPeriod === 'Bu Ay' ? months[selectedMonth] : selectedPeriod} {selectedYear})
                  </span>
                )}
                {selectedConsultant !== 'all' && (
                  <span className="ml-2 text-xs text-green-500">
                    ({consultants.find(c => c.id === parseInt(selectedConsultant))?.name})
                  </span>
                )}
              </p>
              <p className="text-2xl font-bold text-gray-900">₺{totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Bekleyen Ödemeler
                {selectedPeriod !== 'Tüm Zamanlar' && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({selectedPeriod === 'Bu Ay' ? months[selectedMonth] : selectedPeriod} {selectedYear})
                  </span>
                )}
              </p>
              <p className="text-2xl font-bold text-gray-900">{totalPending}</p>
            </div>
          </div>
        </div>

                 <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
           <div className="flex items-center">
             <div className="p-2 rounded-lg" style={{ backgroundColor: '#e8f5e8' }}>
               <FileText className="h-6 w-6" style={{ color: '#89e645' }} />
             </div>
             <div className="ml-4">
               <p className="text-sm font-medium text-gray-600">
                 Ödeme Alındı
                 {selectedPeriod !== 'Tüm Zamanlar' && (
                   <span className="ml-2 text-xs text-gray-500">
                     ({selectedPeriod === 'Bu Ay' ? months[selectedMonth] : selectedPeriod} {selectedYear})
                   </span>
                 )}
               </p>
               <p className="text-2xl font-bold text-gray-900">{totalCompleted}</p>
             </div>
           </div>
         </div>

         <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
           <div className="flex items-center">
             <div className="p-2 bg-red-100 rounded-lg">
               <TrendingDown className="h-6 w-6 text-red-600" />
             </div>
             <div className="ml-4">
               <p className="text-sm font-medium text-gray-600">
                 İade
                 {selectedPeriod !== 'Tüm Zamanlar' && (
                   <span className="ml-2 text-xs text-gray-500">
                     ({selectedPeriod === 'Bu Ay' ? months[selectedMonth] : selectedPeriod} {selectedYear})
                   </span>
                 )}
               </p>
               <p className="text-2xl font-bold text-gray-900">{totalCancelled}</p>
             </div>
           </div>
         </div>
      </div>

      {/* Currency Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Para Birimi Dağılımı
          {selectedPeriod !== 'Tüm Zamanlar' && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({selectedPeriod === 'Bu Ay' ? months[selectedMonth] : selectedPeriod} {selectedYear})
            </span>
          )}
          {selectedConsultant !== 'all' && (
            <span className="ml-2 text-sm font-normal text-green-500">
              ({consultants.find(c => c.id === parseInt(selectedConsultant))?.name})
            </span>
          )}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(currencyBreakdown).map(([currency, amount]) => (
            <div key={currency} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold ${getCurrencyColor(currency)}`}>
                {getCurrencySymbol(currency)}{amount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">{currency}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Müşteri adı, fatura no veya açıklama ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
                         <select
               value={selectedStatus}
               onChange={(e) => setSelectedStatus(e.target.value)}
               className="input-field w-auto"
             >
               <option value="all">Tüm Durumlar</option>
               <option value="completed">Ödeme Alındı</option>
               <option value="pending">Bekliyor</option>
               <option value="cancelled">İade</option>
             </select>

                         <select
               value={selectedCurrency}
               onChange={(e) => setSelectedCurrency(e.target.value)}
               className="input-field w-auto"
             >
               <option value="all">Tüm Para Birimleri</option>
               <option value="TRY">TL (₺)</option>
               <option value="EUR">Euro (€)</option>
               <option value="USD">Dolar ($)</option>
               <option value="GBP">Sterlin (£)</option>
             </select>

             <select
               value={selectedConsultant}
               onChange={(e) => setSelectedConsultant(e.target.value)}
               className="input-field w-auto"
             >
               <option value="all">Tüm Danışmanlar</option>
               {consultants.map(consultant => (
                 <option key={consultant.id} value={consultant.id}>
                   {consultant.name}
                 </option>
               ))}
             </select>

             <select
               value={sortByDate}
               onChange={(e) => setSortByDate(e.target.value)}
               className="input-field w-auto"
             >
               <option value="newest">En Yeni Önce</option>
               <option value="oldest">En Eski Önce</option>
             </select>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="btn-secondary flex items-center"
            >
              <Filter size={20} className="mr-2" />
              Gelişmiş Filtreler
            </button>
          </div>
        </div>

        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={selectedPaymentType}
                onChange={(e) => setSelectedPaymentType(e.target.value)}
                className="input-field"
              >
                <option value="all">Tüm Ödeme Türleri</option>
                <option value="Vize Başvuru">Vize Başvuru</option>
                <option value="Danışmanlık">Danışmanlık</option>
                <option value="Belge Hazırlama">Belge Hazırlama</option>
                <option value="Diğer">Diğer</option>
              </select>

              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="input-field"
                placeholder="Başlangıç Tarihi"
              />

              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="input-field"
                placeholder="Bitiş Tarihi"
              />
            </div>

            <div className="mt-4">
              <button
                onClick={clearAllFilters}
                className="btn-secondary"
              >
                Filtreleri Temizle
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Müşteri
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tutar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ödeme Türü
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fatura No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Danışman
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{payment.clientName}</div>
                      <div className="text-sm text-gray-500">{payment.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-lg font-bold ${getCurrencyColor(payment.currency)}`}>
                      {getCurrencySymbol(payment.currency)}{payment.amount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">{payment.paymentMethod}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.paymentType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(payment.paymentDate).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleStatusChange(payment)}
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(payment.status)}`}
                    >
                      {getStatusText(payment.status)}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.invoiceNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.consultantName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditPayment(payment)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeletePayment(payment)}
                        className="text-red-600 hover:text-red-900"
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
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Önceki
              </button>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Sonraki
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{indexOfFirstPayment + 1}</span> -{' '}
                  <span className="font-medium">
                    {Math.min(indexOfLastPayment, filteredPayments.length)}
                  </span>{' '}
                  / <span className="font-medium">{filteredPayments.length}</span> sonuç
                  {selectedPeriod !== 'Tüm Zamanlar' && (
                    <span className="ml-2 text-xs text-blue-600">
                      ({selectedPeriod === 'Bu Ay' ? months[selectedMonth] : selectedPeriod} {selectedYear})
                    </span>
                  )}
                  {selectedConsultant !== 'all' && (
                    <span className="ml-2 text-xs text-green-600">
                      ({consultants.find(c => c.id === parseInt(selectedConsultant))?.name})
                    </span>
                  )}
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Önceki
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Sonraki
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Payment Modal */}
      {isNewPaymentModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Yeni Ödeme Ekle</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri</label>
                  <select
                    value={newPayment.clientId}
                    onChange={(e) => setNewPayment({ ...newPayment, clientId: e.target.value })}
                    className="input-field w-full"
                  >
                    <option value="">Müşteri Seçin</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name || client.full_name || 'İsimsiz Müşteri'} - {client.country || 'Ülke Belirtilmemiş'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tutar</label>
                    <input
                      type="number"
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                      className="input-field w-full"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Para Birimi</label>
                                         <select
                       value={newPayment.currency}
                       onChange={(e) => setNewPayment({ ...newPayment, currency: e.target.value })}
                       className="input-field w-full"
                     >
                       <option value="TRY">TL (₺)</option>
                       <option value="EUR">Euro (€)</option>
                       <option value="USD">Dolar ($)</option>
                       <option value="GBP">Sterlin (£)</option>
                     </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Türü</label>
                  <select
                    value={newPayment.paymentType}
                    onChange={(e) => setNewPayment({ ...newPayment, paymentType: e.target.value })}
                    className="input-field w-full"
                  >
                    <option value="">Ödeme Türü Seçin</option>
                    <option value="Vize Başvuru">Vize Başvuru</option>
                    <option value="Danışmanlık">Danışmanlık</option>
                    <option value="Belge Hazırlama">Belge Hazırlama</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Yöntemi</label>
                  <select
                    value={newPayment.paymentMethod}
                    onChange={(e) => setNewPayment({ ...newPayment, paymentMethod: e.target.value })}
                    className="input-field w-full"
                  >
                    <option value="">Ödeme Yöntemi Seçin</option>
                    <option value="Kredi Kartı">Kredi Kartı</option>
                    <option value="Banka Transferi">Banka Transferi</option>
                    <option value="Nakit">Nakit</option>
                    <option value="Çek">Çek</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Tarihi</label>
                  <input
                    type="date"
                    value={newPayment.paymentDate}
                    onChange={(e) => setNewPayment({ ...newPayment, paymentDate: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                  <textarea
                    value={newPayment.description}
                    onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                    className="input-field w-full"
                    rows="3"
                    placeholder="Ödeme açıklaması..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Danışman</label>
                  <select
                    value={newPayment.consultantId}
                    onChange={(e) => setNewPayment({ ...newPayment, consultantId: e.target.value })}
                    className="input-field w-full"
                  >
                    <option value="">Danışman Seçin</option>
                    {consultants.map(consultant => (
                      <option key={consultant.id} value={consultant.id}>
                        {consultant.name} - {consultant.specialty || 'Uzmanlık Belirtilmemiş'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsNewPaymentModalOpen(false)}
                  className="btn-secondary"
                >
                  İptal
                </button>
                <button
                  onClick={handleAddNewPayment}
                  className="btn-primary"
                >
                  Ödeme Ekle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

             {/* Edit Payment Modal */}
       {isEditPaymentModalOpen && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
             <div className="mt-3">
               <h3 className="text-lg font-medium text-gray-900 mb-4">Ödeme Düzenle</h3>
               
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri</label>
                   <input
                     type="text"
                     value={selectedPayment?.clientName || ''}
                     className="input-field w-full bg-gray-100"
                     disabled
                   />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Tutar</label>
                     <input
                       type="number"
                       value={newPayment.amount}
                       onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                       className="input-field w-full"
                       placeholder="0.00"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Para Birimi</label>
                     <select
                       value={newPayment.currency}
                       onChange={(e) => setNewPayment({ ...newPayment, currency: e.target.value })}
                       className="input-field w-full"
                     >
                       <option value="TRY">TL (₺)</option>
                       <option value="EUR">Euro (€)</option>
                       <option value="USD">Dolar ($)</option>
                       <option value="GBP">Sterlin (£)</option>
                     </select>
                   </div>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Türü</label>
                   <select
                     value={newPayment.paymentType}
                     onChange={(e) => setNewPayment({ ...newPayment, paymentType: e.target.value })}
                     className="input-field w-full"
                   >
                     <option value="Vize Başvuru">Vize Başvuru</option>
                     <option value="Danışmanlık">Danışmanlık</option>
                     <option value="Belge Hazırlama">Belge Hazırlama</option>
                     <option value="Diğer">Diğer</option>
                   </select>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Yöntemi</label>
                   <select
                     value={newPayment.paymentMethod}
                     onChange={(e) => setNewPayment({ ...newPayment, paymentMethod: e.target.value })}
                     className="input-field w-full"
                   >
                     <option value="Kredi Kartı">Kredi Kartı</option>
                     <option value="Banka Transferi">Banka Transferi</option>
                     <option value="Nakit">Nakit</option>
                     <option value="Çek">Çek</option>
                   </select>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Tarihi</label>
                   <input
                     type="date"
                     value={newPayment.paymentDate}
                     onChange={(e) => setNewPayment({ ...newPayment, paymentDate: e.target.value })}
                     className="input-field w-full"
                   />
                 </div>

                                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                    <textarea
                      value={newPayment.description}
                      onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                      className="input-field w-full"
                      rows="3"
                      placeholder="Ödeme açıklaması..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Danışman</label>
                    <select
                      value={newPayment.consultantId}
                      onChange={(e) => setNewPayment({ ...newPayment, consultantId: e.target.value })}
                      className="input-field w-full"
                    >
                      <option value="">Danışman Seçin</option>
                      {consultants.map(consultant => (
                        <option key={consultant.id} value={consultant.id}>
                          {consultant.name} - {consultant.specialty || 'Uzmanlık Belirtilmemiş'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

               <div className="flex justify-end space-x-3 mt-6">
                 <button
                   onClick={() => {
                     setIsEditPaymentModalOpen(false);
                     setSelectedPayment(null);
                     setNewPayment({
                       clientId: '',
                       amount: '',
                       currency: 'TRY',
                       paymentType: '',
                       paymentMethod: '',
                       paymentDate: '',
                       description: '',
                       consultantId: ''
                     });
                   }}
                   className="btn-secondary"
                 >
                   İptal
                 </button>
                 <button
                   onClick={handleUpdatePayment}
                   className="btn-primary"
                 >
                   Güncelle
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Delete Confirmation Modal */}
       {isDeletePaymentModalOpen && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
             <div className="mt-3">
               <h3 className="text-lg font-medium text-gray-900 mb-4">Ödeme Sil</h3>
               <p className="text-sm text-gray-500 mb-6">
                 "{selectedPayment?.clientName}" müşterisinin ödemesini silmek istediğinizden emin misiniz?
               </p>
               
               <div className="flex justify-end space-x-3">
                 <button
                   onClick={() => setIsDeletePaymentModalOpen(false)}
                   className="btn-secondary"
                 >
                   İptal
                 </button>
                                   <button
                    onClick={confirmDeletePayment}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Sil
                  </button>
                 
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };
 
 export default Finance;
