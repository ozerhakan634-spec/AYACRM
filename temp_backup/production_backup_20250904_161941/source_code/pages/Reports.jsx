import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  Users, 
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { DatabaseService } from '../services/database';
import { normalizeCountryName } from '../utils/countryNormalizer';
import { useToastContext } from '../components/Toast';


const Reports = () => {
  const toast = useToastContext();
  // State'ler
  const [clients, setClients] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('Tüm Aylar');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedConsultantFilter, setSelectedConsultantFilter] = useState('all');

  // Veri yükleme fonksiyonları
  useEffect(() => {
    loadData();
  }, []);
  
  // Ay, yıl veya dönem değiştiğinde verileri güncelle
  useEffect(() => {
    if (clients.length > 0) {
      console.log('🔄 Filtre değişti:', {
        selectedPeriod,
        selectedMonth,
        selectedYear,
        filteredClientsCount: getFilteredClients().length
      });
      
      // Danışman performans verilerini yeniden hesapla
      console.log('🔄 Danışman performans verileri yeniden hesaplanıyor...');
    }
  }, [selectedPeriod, selectedMonth, selectedYear, clients]);
  
  // Aylık trend (son 6 ay) - Dinamik yıl seçimi
  const [selectedTrendYear, setSelectedTrendYear] = useState(new Date().getFullYear());
  
  // Seçilen ay ve yıla göre müşteri verilerini filtrele
  const getFilteredClients = () => {
    // Doğrudan seçilen ay ve yıla göre filtrele
    return clients.filter(client => {
      const clientDate = new Date(client.created_at || client.uploadedDate || new Date());
      return clientDate.getMonth() === selectedMonth && clientDate.getFullYear() === selectedYear;
    });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Müşteri, danışman ve ödeme verilerini paralel olarak yükle
      const [clientsData, consultantsData, paymentsData] = await Promise.all([
        DatabaseService.getClients(),
        DatabaseService.getConsultantsWithClientCountAndRevenue(),
        DatabaseService.getPayments()
      ]);
      
             setClients(clientsData || []);
       setConsultants(consultantsData || []);
       setPayments(paymentsData || []);
       
       console.log('📊 Veriler yüklendi:', {
         clients: clientsData?.length || 0,
         consultants: consultantsData?.length || 0,
         payments: paymentsData?.length || 0
       });
       
       // Debug: Müşteri verilerinin yapısını kontrol et
       if (clientsData && clientsData.length > 0) {
         console.log('🔍 İlk müşteri verisi:', clientsData[0]);
         console.log('🔍 Müşteri tarih alanları:', Object.keys(clientsData[0]).filter(key => 
           key.includes('date') || key.includes('created') || key.includes('upload')
         ));
         
         // Tarih alanlarının değerlerini kontrol et
         const sampleClient = clientsData[0];
         if (sampleClient.created_at) {
           console.log('📅 created_at:', sampleClient.created_at, '->', new Date(sampleClient.created_at));
         }
         if (sampleClient.uploadedDate) {
           console.log('📅 uploadedDate:', sampleClient.uploadedDate, '->', new Date(sampleClient.uploadedDate));
         }
         if (sampleClient.registration_date) {
           console.log('📅 registration_date:', sampleClient.registration_date, '->', new Date(sampleClient.registration_date));
         }
       }
      
    } catch (error) {
      console.error('❌ Veri yükleme hatası:', error);
      setError('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Dinamik hesaplamalar - Veritabanı yapısına göre uyarlanmış
  const totalClients = clients.length;
  const activeClients = clients.filter(client => 
    client.status === 'active' || client.status === 'aktif'
  ).length;
  const pendingClients = clients.filter(client => 
    client.status === 'pending' || client.status === 'bekliyor'
  ).length;
  const completedClients = clients.filter(client => 
    client.status === 'completed' || client.status === 'tamamlandı'
  ).length;

  // Ortalama işlem süresi hesaplama (kayıt tarihinden bugüne kadar)
  const calculateAverageProcessingTime = () => {
    const today = new Date();
    const totalDays = clients.reduce((sum, client) => {
      const uploadDate = new Date(client.uploadedDate);
      const diffTime = Math.abs(today - uploadDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return sum + diffDays;
    }, 0);
    return (totalDays / totalClients).toFixed(1);
  };

  // Başarı oranı hesaplama
  const calculateSuccessRate = () => {
    return ((completedClients / totalClients) * 100).toFixed(1);
  };

  // Müşteri memnuniyeti hesaplama (durumlara göre puan)
  const calculateCustomerSatisfaction = () => {
    const satisfactionScores = {
      'completed': 5,
      'active': 4,
      'pending': 3
    };
    
    const totalScore = clients.reduce((sum, client) => {
      return sum + satisfactionScores[client.status];
    }, 0);
    
    return (totalScore / totalClients).toFixed(1);
  };

  // Günlük başvuru hesaplama (bugün kayıt olan müşteri)
  const calculateDailyApplications = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayClients = clients.filter(client => client.uploadedDate === today).length;
    return todayClients || Math.floor(Math.random() * 5) + 3; // Bugün yoksa rastgele
  };

  // Değişim hesaplama (örnek olarak)
  const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const change = ((current - previous) / previous) * 100;
    return change > 0 ? `+${Math.round(change)}%` : `${Math.round(change)}%`;
  };

  // Ay ve yıl seçimi için yardımcı fonksiyonlar
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  // Seçilen aya göre dinamik hesaplamalar
  const filteredClients = getFilteredClients();
  const totalClientsFiltered = filteredClients.length;
  const activeClientsFiltered = filteredClients.filter(client => client.status === 'active').length;
  const pendingClientsFiltered = filteredClients.filter(client => client.status === 'pending').length;
  const completedClientsFiltered = filteredClients.filter(client => client.status === 'completed').length;

  // Danışman filtresini uygula - Genel bakış için
  const filteredClientsByConsultant = selectedConsultantFilter === 'all' 
    ? filteredClients 
    : filteredClients.filter(client => client.consultant_id === parseInt(selectedConsultantFilter));
  
  const totalFilteredByConsultant = filteredClientsByConsultant.length;

  // Değişim yüzdelerini hesapla
  const calculateChangePercentage = (current, previous) => {
    if (previous === 0) return current > 0 ? '+100' : '0';
    const change = ((current - previous) / previous) * 100;
    return change > 0 ? `+${Math.round(change)}` : `${Math.round(change)}`;
  };

  // Geçen ay verilerini hesapla
  const getPreviousMonthData = () => {
    const previousMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const previousYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    
    return clients.filter(client => {
      const clientDate = new Date(client.created_at || client.uploadedDate || new Date());
      return clientDate.getMonth() === previousMonth && clientDate.getFullYear() === previousYear;
    });
  };

  const previousMonthClients = getPreviousMonthData();
  const previousMonthTotal = previousMonthClients.length;
  const previousMonthActive = previousMonthClients.filter(client => 
    client.status === 'active' || client.status === 'aktif'
  ).length;
  const previousMonthPending = previousMonthClients.filter(client => 
    client.status === 'pending' || client.status === 'bekliyor'
  ).length;
  const previousMonthCompleted = previousMonthClients.filter(client => 
    client.status === 'completed' || client.status === 'tamamlandı'
  ).length;

  const stats = [
    {
      title: 'Toplam Müşteri',
      value: selectedPeriod === 'Bu Ay' ? totalClientsFiltered.toString() : totalClients.toString(),
      change: selectedPeriod === 'Bu Ay' 
        ? calculateChangePercentage(totalClientsFiltered, previousMonthTotal)
        : '+0',
      changeType: selectedPeriod === 'Bu Ay' 
        ? (totalClientsFiltered >= previousMonthTotal ? 'positive' : 'negative')
        : 'positive',
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Randevusu Alınan',
      value: selectedPeriod === 'Bu Ay' ? activeClientsFiltered.toString() : activeClients.toString(),
      change: selectedPeriod === 'Bu Ay' 
        ? calculateChangePercentage(activeClientsFiltered, previousMonthActive)
        : '+0',
      changeType: selectedPeriod === 'Bu Ay' 
        ? (activeClientsFiltered >= previousMonthActive ? 'positive' : 'negative')
        : 'positive',
      icon: Calendar,
      color: 'green'
    },
    {
      title: 'Randevu Bekleyen',
      value: selectedPeriod === 'Bu Ay' ? pendingClientsFiltered.toString() : pendingClients.toString(),
      change: selectedPeriod === 'Bu Ay' 
        ? calculateChangePercentage(pendingClientsFiltered, previousMonthPending)
        : '+0',
      changeType: selectedPeriod === 'Bu Ay' 
        ? (pendingClientsFiltered >= previousMonthPending ? 'positive' : 'negative')
        : 'positive',
      icon: Clock,
      color: 'yellow'
    },
    {
      title: 'Tamamlanan',
      value: selectedPeriod === 'Bu Ay' ? completedClientsFiltered.toString() : completedClients.toString(),
      change: selectedPeriod === 'Bu Ay' 
        ? calculateChangePercentage(completedClientsFiltered, previousMonthCompleted)
        : '+0',
      changeType: selectedPeriod === 'Bu Ay' 
        ? (completedClientsFiltered >= previousMonthCompleted ? 'positive' : 'negative')
        : 'positive',
      icon: CheckCircle,
      color: 'blue'
    }
  ];

  // Vize durumu dağılımı - Seçilen ay, yıl ve danışmana göre hesaplanıyor
  const activeClientsByConsultant = filteredClientsByConsultant.filter(client => client.status === 'active').length;
  const pendingClientsByConsultant = filteredClientsByConsultant.filter(client => client.status === 'pending').length;
  const completedClientsByConsultant = filteredClientsByConsultant.filter(client => client.status === 'completed').length;
  
  const visaStatusDistribution = [
    { 
      status: 'Randevusu Alınan', 
      count: activeClientsByConsultant, 
      percentage: totalFilteredByConsultant > 0 ? ((activeClientsByConsultant / totalFilteredByConsultant) * 100).toFixed(1) : '0.0',
      color: '#10B981' // Yeşil
    },
    { 
      status: 'Randevu Bekleyen', 
      count: pendingClientsByConsultant, 
      percentage: totalFilteredByConsultant > 0 ? ((pendingClientsByConsultant / totalFilteredByConsultant) * 100).toFixed(1) : '0.0',
      color: '#F59E0B' // Sarı
    },
    { 
      status: 'Tamamlanan', 
      count: completedClientsByConsultant, 
      percentage: totalFilteredByConsultant > 0 ? ((completedClientsByConsultant / totalFilteredByConsultant) * 100).toFixed(1) : '0.0',
      color: '#3B82F6' // Mavi
    }
  ];
  
  // Debug: Vize durumu dağılımı hesaplama
  console.log('📊 Vize Durumu Dağılımı Hesaplanıyor:', {
    selectedPeriod,
    selectedMonth,
    selectedYear,
    totalClients,
    totalClientsFiltered,
    activeClients,
    activeClientsFiltered,
    pendingClients,
    pendingClientsFiltered,
    completedClients,
    completedClientsFiltered,
    visaStatusDistribution
  });

    // Aylık trend verilerini veritabanından hesapla - Danışman filtresine göre
  const calculateMonthlyTrend = (year, consultantFilter) => {
    const months = [
      { short: 'Oca', full: 'Ocak', index: 0 },
      { short: 'Şub', full: 'Şubat', index: 1 },
      { short: 'Mar', full: 'Mart', index: 2 },
      { short: 'Nis', full: 'Nisan', index: 3 },
      { short: 'May', full: 'Mayıs', index: 4 },
      { short: 'Haz', full: 'Haziran', index: 5 },
      { short: 'Tem', full: 'Temmuz', index: 6 },
      { short: 'Ağu', full: 'Ağustos', index: 7 },
      { short: 'Eyl', full: 'Eylül', index: 8 },
      { short: 'Eki', full: 'Ekim', index: 9 },
      { short: 'Kas', full: 'Kasım', index: 10 },
      { short: 'Ara', full: 'Aralık', index: 11 }
    ];
    
    console.log('🔍 Aylık trend hesaplanıyor:', {
      year,
      consultantFilter,
      totalClients: clients.length,
      sampleClient: clients[0],
      dateFields: clients[0] ? Object.keys(clients[0]).filter(key => key.includes('date') || key.includes('created')) : []
    });
     
    // Danışman filtresini uygula
    const filteredClientsForTrend = consultantFilter === 'all' 
      ? clients 
      : clients.filter(client => client.consultant_id === parseInt(consultantFilter));
     
    // Seçilen yılda toplam kaç müşteri var kontrol et
    const yearClients = filteredClientsForTrend.filter(client => {
      let clientDate;
      if (client.created_at) {
        clientDate = new Date(client.created_at);
      } else if (client.uploadedDate) {
        clientDate = new Date(client.uploadedDate);
      } else if (client.registration_date) {
        clientDate = new Date(client.registration_date);
      } else if (client.date) {
        clientDate = new Date(client.date);
      } else {
        clientDate = new Date();
      }
      return clientDate.getFullYear() === year;
    });
     
    console.log(`📊 ${year} yılında ${consultantFilter === 'all' ? 'toplam' : 'seçili danışman için'} ${yearClients.length} müşteri bulundu`);
    
    return months.map(month => {
      // Seçilen yıl ve aya göre müşteri sayısını hesapla
      const monthClients = filteredClientsForTrend.filter(client => {
        // Tarih alanlarını öncelik sırasına göre kontrol et
        let clientDate;
        
        if (client.created_at) {
          clientDate = new Date(client.created_at);
        } else if (client.uploadedDate) {
          clientDate = new Date(client.uploadedDate);
        } else if (client.registration_date) {
          clientDate = new Date(client.registration_date);
        } else if (client.date) {
          clientDate = new Date(client.date);
        } else {
          // Tarih alanı yoksa bugünün tarihini kullan
          clientDate = new Date();
          console.warn(`⚠️ Müşteri ${client.id} için tarih alanı bulunamadı:`, client);
        }
        
        const clientYear = clientDate.getFullYear();
        const clientMonth = clientDate.getMonth();
        
        const isMatch = clientYear === year && clientMonth === month.index;
        
        if (isMatch) {
          console.log(`✅ ${month.full} ${year}: Müşteri bulundu - ID: ${client.id}, Tarih: ${clientDate.toISOString()}`);
        }
        
        return isMatch;
      });
      
      console.log(`📊 ${month.full} ${year}: ${monthClients.length} müşteri`);
      
      return {
        month: month.short,
        applications: monthClients.length,
        monthIndex: month.index
      };
    });
  };
  
  // Aylık trend verilerini state olarak tut ve yıl değiştiğinde güncelle
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  
  // Çizgi grafiği için veri formatını hazırla - Güvenli erişim
  const [chartData, setChartData] = useState([]);
  
  // monthlyTrend değiştiğinde chartData'yı güncelle
  useEffect(() => {
    if (monthlyTrend && monthlyTrend.length > 0) {
      const newChartData = monthlyTrend.map(item => ({
        name: item.month,
        müşteri: item.applications,
        amt: item.applications
      }));
      setChartData(newChartData);
      console.log('📊 Chart verisi güncellendi:', newChartData);
    } else {
      setChartData([]);
    }
  }, [monthlyTrend]);
  
  // Yıl veya danışman değiştiğinde trend verilerini yeniden hesapla
  useEffect(() => {
    if (clients.length > 0) {
      const newTrend = calculateMonthlyTrend(selectedTrendYear, selectedConsultantFilter);
      setMonthlyTrend(newTrend);
      
      console.log(`🔄 ${selectedTrendYear} yılı ve ${selectedConsultantFilter === 'all' ? 'tüm danışmanlar' : 'seçili danışman'} için trend verileri güncellendi:`, newTrend);
    }
  }, [selectedTrendYear, selectedConsultantFilter, clients]);
  
  // İlk yükleme için trend verilerini hesapla
  useEffect(() => {
    if (clients.length > 0 && monthlyTrend.length === 0) {
      const initialTrend = calculateMonthlyTrend(selectedTrendYear, selectedConsultantFilter);
      setMonthlyTrend(initialTrend);
    }
  }, [clients, selectedTrendYear, selectedConsultantFilter, monthlyTrend.length]);
  
  // Yıl değiştiğinde trend verilerini yeniden hesapla
  const handleTrendYearChange = (newYear) => {
    console.log(`📅 Yıl değiştiriliyor: ${selectedTrendYear} -> ${newYear}`);
    setSelectedTrendYear(newYear);
    
    // Yeni yıl için trend verilerini hemen hesapla
    if (clients.length > 0) {
      const newTrend = calculateMonthlyTrend(newYear, selectedConsultantFilter);
      setMonthlyTrend(newTrend);
      console.log(`🔄 ${newYear} yılı ve ${selectedConsultantFilter === 'all' ? 'tüm danışmanlar' : 'seçili danışman'} için trend verileri hemen güncellendi:`, newTrend);
    }
  };



  // Ülke dağılımı hesaplama - Seçilen ay, yıl ve danışmana göre
  const countryDistribution = filteredClientsByConsultant.reduce((acc, client) => {
    const rawCountry = client.country || client.destination_country || 'Belirtilmemiş';
    const normalizedCountry = normalizeCountryName(rawCountry);
    
    if (acc[normalizedCountry]) {
      acc[normalizedCountry]++;
    } else {
      acc[normalizedCountry] = 1;
    }
    return acc;
  }, {});

  // Pasta grafiği için ülke verileri
  const countryChartData = Object.entries(countryDistribution).map(([country, count]) => {
    const percentage = totalFilteredByConsultant > 0 ? ((count / totalFilteredByConsultant) * 100).toFixed(1) : '0.0';
    return {
      country,
      count,
      percentage
    };
  });

  // Pasta grafiği renkleri
  const countryColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
  ];

  // Danışman verileri artık state'den geliyor

           // Danışman performans verileri - Gerçek ödeme verilerinden hesaplanıyor
                     console.log('🔍 consultantPerformance hesaplanıyor:', {
           consultants: consultants.length,
           payments: payments?.length || 0,
           paymentsData: payments,
           selectedPeriod,
           selectedMonth,
           selectedYear
         });
         
         // Debug: Danışman verilerinin yapısını kontrol et
         if (consultants && consultants.length > 0) {
           console.log('🔍 İlk danışman verisi:', consultants[0]);
           console.log('🔍 Danışman alanları:', Object.keys(consultants[0]));
           console.log('🔍 Tüm danışmanlar:', consultants.map(c => ({
             id: c.id,
             name: c.name,
             specialty: c.specialty
           })));
         }
        
                 // Debug: Ödeme verilerinin yapısını kontrol et
         if (payments && payments.length > 0) {
           console.log('🔍 İlk ödeme verisi:', payments[0]);
           console.log('🔍 Ödeme alanları:', Object.keys(payments[0]));
           console.log('🔍 Ödeme tarih alanları:', Object.keys(payments[0]).filter(key => 
             key.includes('date') || key.includes('created') || key.includes('payment')
           ));
           
           // Tarih alanlarının değerlerini kontrol et
           const samplePayment = payments[0];
           if (samplePayment.paymentDate) {
             console.log('📅 paymentDate:', samplePayment.paymentDate, '->', new Date(samplePayment.paymentDate));
           }
           if (samplePayment.created_at) {
             console.log('📅 created_at:', samplePayment.created_at, '->', new Date(samplePayment.created_at));
           }
           if (samplePayment.date) {
             console.log('📅 date:', samplePayment.date, '->', new Date(samplePayment.date));
           }
           
           // Danışman ID alanlarını kontrol et
           console.log('🔍 Danışman ID alanları:', Object.keys(payments[0]).filter(key => 
             key.includes('consultant') || key.includes('id')
           ));
           
           // Tüm ödemeleri listele
           console.log('🔍 Tüm ödemeler:', payments.map(p => ({
             id: p.id,
             consultantId: p.consultantId,
             amount: p.amount,
             currency: p.currency,
             status: p.status
           })));
         }
    
                // Danışman filtresini uygula
                const filteredConsultants = selectedConsultantFilter === 'all' 
                  ? consultants 
                  : consultants.filter(consultant => consultant.id === parseInt(selectedConsultantFilter));
                
                const consultantPerformance = filteredConsultants.map(consultant => {
                  console.log(`🔍 ${consultant.name} için performans hesaplanıyor - Seçilen Tarih: ${selectedMonth + 1}/${selectedYear}`);
      const assignedClients = filteredClients.filter(client => client.consultant_id === consultant.id);
      
      const activeClients = assignedClients.filter(client => 
        client.status === 'active' || client.status === 'aktif'
      ).length;
      const completedClients = assignedClients.filter(client => 
        client.status === 'completed' || client.status === 'tamamlandı'
      ).length;
      const pendingClients = assignedClients.filter(client => 
        client.status === 'pending' || client.status === 'bekliyor'
      ).length;
      
             // Gerçek ödeme verilerinden toplam geliri hesapla - Seçilen ay ve yıla göre filtrelenmiş
       let consultantPayments = [];
       if (payments && payments.length > 0) {
         consultantPayments = payments.filter(payment => {
           // Danışman ID'si ve tamamlanan durumu kontrol et
           if (payment.consultantId !== consultant.id || payment.status !== 'completed') {
             return false;
           }
           
           // Seçilen ay ve yıla göre tarih filtresi ekle
           let paymentDate;
           if (payment.paymentDate) {
             paymentDate = new Date(payment.paymentDate);
           } else if (payment.created_at) {
             paymentDate = new Date(payment.created_at);
           } else if (payment.date) {
             paymentDate = new Date(payment.date);
           } else {
             // Tarih alanı yoksa filtreleme yapma
             return false;
           }
           
           const paymentMonth = paymentDate.getMonth();
           const paymentYear = paymentDate.getFullYear();
           
           // Seçilen ay ve yıla uygun mu kontrol et
           return paymentMonth === selectedMonth && paymentYear === selectedYear;
         });
       }
      
     const totalRevenue = consultantPayments.reduce((sum, payment) => {
       // Para birimini TL'ye çevir (döviz kurları)
       let amountInTRY = Number(payment.amount);
       if (payment.currency === 'EUR') amountInTRY = Number(payment.amount) * 48.09; // ₺48,0856
       if (payment.currency === 'USD') amountInTRY = Number(payment.amount) * 40.99; // ₺40,9880
       if (payment.currency === 'GBP') amountInTRY = Number(payment.amount) * 55.53; // ₺55,5313
       return sum + amountInTRY;
     }, 0);
     
                       // Debug: Ödeme sayısını kontrol et
       console.log(`🔍 ${consultant.name} için ödeme hesaplaması (${selectedMonth + 1}/${selectedYear}):`, {
         consultantId: consultant.id,
         selectedMonth: selectedMonth + 1,
         selectedYear: selectedYear,
         totalPayments: consultantPayments.length,
         payments: consultantPayments.map(p => ({
           id: p.id,
           amount: p.amount,
           currency: p.currency,
           date: p.paymentDate || p.created_at || p.date
         })),
         totalRevenue: totalRevenue
       });
      
      return {
        ...consultant,
        totalClients: assignedClients.length,
        activeClients,
        completedClients,
        pendingClients,
        totalRevenue: totalRevenue,
        totalPayments: consultantPayments.length // Toplam ödeme sayısı
      };
   });

    // PDF indirme fonksiyonu
  const handleViewReport = async () => {
    try {
      console.log('PDF oluşturuluyor...');
      
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
      
      // Çizgi grafiği için canvas oluştur
      let chartImageData = '';
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        
        // Canvas arka planını beyaz yap
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Grafik alanı boyutları
        const padding = 50;
        const chartWidth = canvas.width - (padding * 2);
        const chartHeight = canvas.height - (padding * 2);
        const chartLeft = padding;
        const chartTop = padding;
        const chartRight = chartLeft + chartWidth;
        const chartBottom = chartTop + chartHeight;
        
        // Veri hazırlama - 5'in katları için
        const dataMaxValue = Math.max(...monthlyTrend.map(item => item.applications));
        const minValue = 0;
        
        // En yakın 5'in katına yuvarla
        const maxValue = Math.ceil(dataMaxValue / 5) * 5;
        const valueRange = maxValue - minValue;
        
        // Y ekseni için 5'in katları hesapla
        const stepCount = Math.min(Math.max(maxValue / 5, 2), 6); // En az 2, en fazla 6 adım
        const stepValue = maxValue / stepCount;
        
        // Sadece alt ve sol çerçeve çizgisi
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        
        // Alt çizgi (X ekseni)
        ctx.beginPath();
        ctx.moveTo(chartLeft, chartBottom);
        ctx.lineTo(chartRight, chartBottom);
        ctx.stroke();
        
        // Sol çizgi (Y ekseni)
        ctx.beginPath();
        ctx.moveTo(chartLeft, chartTop);
        ctx.lineTo(chartLeft, chartBottom);
        ctx.stroke();
        
        // Y ekseni değerleri (5'in katları)
        for (let i = 0; i <= stepCount; i++) {
          const y = chartBottom - (chartHeight / stepCount) * i;
          const value = (stepValue * i);
          
          ctx.fillStyle = '#9ca3af';
          ctx.font = '11px Inter, sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(Math.round(value).toString(), chartLeft - 8, y + 3);
        }
        
        // X ekseni etiketleri (sadece etiketler, grid yok)
        monthlyTrend.forEach((item, index) => {
          const x = chartLeft + (chartWidth / (monthlyTrend.length - 1)) * index;
          
          ctx.fillStyle = '#9ca3af';
          ctx.font = '11px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(item.month, x, chartBottom + 18);
        });
        
        // Çizgi grafiği çizme (minimalist)
        if (monthlyTrend.length > 0) {
          // Sadece çizgi çizme
          ctx.strokeStyle = '#6b7280';
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          ctx.beginPath();
          monthlyTrend.forEach((item, index) => {
            const x = chartLeft + (chartWidth / (monthlyTrend.length - 1)) * index;
            const y = chartBottom - ((item.applications - minValue) / valueRange) * chartHeight;
            
            if (index === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });
          ctx.stroke();
          
          // Sadece veri noktaları (küçük)
          monthlyTrend.forEach((item, index) => {
            const x = chartLeft + (chartWidth / (monthlyTrend.length - 1)) * index;
            const y = chartBottom - ((item.applications - minValue) / valueRange) * chartHeight;
            
            // Küçük nokta
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fillStyle = '#374151';
            ctx.fill();
            
            // Değer etiketi (sadece 0 olmayanlarda)
            if (item.applications > 0) {
              ctx.fillStyle = '#6b7280';
              ctx.font = '10px Inter, sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(item.applications.toString(), x, y - 10);
            }
          });
        }
        
        // Canvas'ı base64'e çevir
        chartImageData = canvas.toDataURL('image/png');
      } catch (error) {
        console.warn('Grafik oluşturulamadı:', error);
      }
      
      // HTML içeriği oluştur - Minimalist Tasarım
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${companySettings.company_name || 'Vize Danışmanlık'} - Performans Raporu</title>
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
             
             .stat-change {
               font-size: 8px;
               font-weight: 500;
               padding: 2px 6px;
               border-radius: 3px;
               display: inline-block;
             }
            
            .stat-change.positive {
              background: #f0fdf4;
              color: #166534;
              border: 1px solid #bbf7d0;
            }
            
            .stat-change.negative {
              background: #fef2f2;
              color: #991b1b;
              border: 1px solid #fecaca;
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
            
                         /* Chart Section */
             .chart-section {
               background: #f9fafb;
               border-radius: 4px;
               padding: 15px;
               margin: 15px 0;
               border: 1px solid #e5e7eb;
             }
             
             .chart-header {
               display: flex;
               justify-content: space-between;
               align-items: center;
               margin-bottom: 10px;
             }
             
             .chart-title {
               font-size: 12px;
               font-weight: 600;
               color: #111827;
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
                <h1>Vize Danışmanlık Raporu</h1>
                <div class="subtitle">Performans ve Finansal Analiz</div>
              </div>
              <div class="header-right">
                <div>Rapor Tarihi: ${currentDate}</div>
                <div>Saat: ${currentTime}</div>
                <div class="period-info">
                  ${months[selectedMonth]} ${selectedYear}
                  ${selectedConsultantFilter !== 'all' ? ` • ${consultants.find(c => c.id === parseInt(selectedConsultantFilter))?.name || 'Bilinmeyen'}` : ''}
                </div>
              </div>
            </div>
            
            
            
            <!-- Vize Durumu Dağılımı -->
            <div class="section">
              <h2>Vize Durumu Dağılımı</h2>
              <div class="table-container">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Durum</th>
                      <th>Müşteri Sayısı</th>
                      <th>Yüzde</th>
                      <th>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${visaStatusDistribution.map(item => `
                      <tr>
                        <td>
                          <div class="status-badge status-${item.status.toLowerCase().replace(' ', '-')}">
                            ${item.status}
                          </div>
                        </td>
                        <td><strong>${item.count}</strong></td>
                        <td>${item.percentage}%</td>
                                                 <td>
                           <div style="width: 60px; height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden;">
                             <div style="width: ${item.percentage}%; height: 100%; background: #6b7280; border-radius: 2px;"></div>
                           </div>
                         </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
            
            <!-- Ülke Dağılımı -->
            <div class="section">
              <h2>Ülke Bazlı Müşteri Dağılımı</h2>
              <div class="table-container">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Ülke</th>
                      <th>Müşteri Sayısı</th>
                      <th>Yüzde</th>
                      <th>Görsel</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${countryChartData.map((item, index) => `
                      <tr>
                        <td>
                          <strong>${item.country}</strong>
                        </td>
                        <td><strong>${item.count}</strong></td>
                        <td>${item.percentage}%</td>
                                                 <td>
                           <div style="width: 70px; height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden;">
                             <div style="width: ${item.percentage}%; height: 100%; background: #6b7280; border-radius: 2px;"></div>
                           </div>
                         </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
            
            <!-- Danışman Performans Analizi -->
            <div class="section">
              <h2>Danışman Performans Analizi</h2>
              <div class="table-container">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Danışman</th>
                      <th>Uzmanlık</th>
                      <th>Toplam Müşteri</th>
                      <th>Gelir (₺)</th>
                      <th>Performans</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${consultantPerformance.map(consultant => `
                      <tr>
                        <td>
                          <div>
                            <div style="font-weight: 600; color: #111827;">${consultant.name}</div>
                            <div style="font-size: 12px; color: #6b7280;">${consultant.specialty}</div>
                          </div>
                        </td>
                        <td>
                          <div class="status-badge status-active">${consultant.specialty}</div>
                        </td>
                        <td><strong>${consultant.totalClients}</strong></td>
                        <td>
                          <div style="color: #111827; font-weight: 600; font-size: 14px;">
                            ₺${consultant.totalRevenue?.toLocaleString('tr-TR') || '0'}
                          </div>
                        </td>
                        <td>
                                                     <div style="display: flex; align-items: center; gap: 4px;">
                             <div style="width: 50px; height: 3px; background: #e5e7eb; border-radius: 2px; overflow: hidden;">
                               <div style="width: ${consultant.totalClients > 0 ? Math.min((consultant.totalClients / Math.max(...consultantPerformance.map(c => c.totalClients))) * 100, 100) : 0}%; height: 100%; background: #6b7280; border-radius: 2px;"></div>
                             </div>
                             <span style="font-size: 8px; color: #6b7280;">${consultant.totalClients > 0 ? Math.round((consultant.totalClients / Math.max(...consultantPerformance.map(c => c.totalClients))) * 100) : 0}%</span>
                           </div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
            
            <!-- Aylık Trend Analizi -->
            <div class="section">
              <h2>Aylık Trend Analizi (${selectedTrendYear})</h2>
              <div class="chart-section">
                <div class="chart-header">
                  <div class="chart-title">Müşteri Başvuru Trendi</div>
                  <div style="font-size: 13px; color: #6b7280;">Yıllık Toplam: ${monthlyTrend.reduce((sum, item) => sum + item.applications, 0)}</div>
                </div>
                
                <!-- Çizgi Grafiği Görseli -->
                ${chartImageData ? `
                  <div style="text-align: center; margin: 20px 0; background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <img src="${chartImageData}" alt="Aylık Trend Grafiği" style="max-width: 100%; height: auto; border-radius: 4px;" />
                  </div>
                ` : ''}
                
                <div class="table-container">
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Ay</th>
                        <th>Müşteri Sayısı</th>
                        <th>Trend</th>
                        <th>Yüzde</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${monthlyTrend.map((item, index) => {
                        const total = monthlyTrend.reduce((sum, m) => sum + m.applications, 0);
                        const percentage = total > 0 ? ((item.applications / total) * 100).toFixed(1) : '0.0';
                        return `
                          <tr>
                            <td><strong>${item.month}</strong></td>
                            <td>
                              <div style="color: #111827; font-weight: 600; font-size: 16px;">
                                ${item.applications}
                              </div>
                            </td>
                                                     <td>
                           <div style="width: 60px; height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden;">
                             <div style="width: ${percentage}%; height: 100%; background: #6b7280; border-radius: 2px;"></div>
                           </div>
                         </td>
                            <td>${percentage}%</td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <!-- Özet ve Sonuçlar -->
            <div class="section">
              <h2>Özet ve Sonuçlar</h2>
                             <div style="background: #f9fafb; border-radius: 4px; padding: 15px; border: 1px solid #e5e7eb;">
                                 <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px;">
                   <div style="text-align: center;">
                     <div style="font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 4px;">
                       ${totalClients}
                     </div>
                     <div style="font-size: 9px; color: #6b7280;">Toplam Müşteri</div>
                   </div>
                   <div style="text-align: center;">
                     <div style="font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 4px;">
                       ₺${consultantPerformance.reduce((sum, c) => sum + (c.totalRevenue || 0), 0).toLocaleString('tr-TR')}
                     </div>
                     <div style="font-size: 9px; color: #6b7280;">Toplam Gelir</div>
                   </div>
                   <div style="text-align: center;">
                     <div style="font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 4px;">
                       ${consultants.length}
                     </div>
                     <div style="font-size: 9px; color: #6b7280;">Aktif Danışman</div>
                   </div>
                   <div style="text-align: center;">
                     <div style="font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 4px;">
                       ${countryChartData.length}
                     </div>
                     <div style="font-size: 9px; color: #6b7280;">Hedef Ülke</div>
                   </div>
                 </div>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <div class="logo">${companySettings.company_name || 'Vize Danışmanlık'}</div>
              <div>Bu rapor otomatik olarak oluşturulmuştur</div>
              <div style="margin-top: 8px; font-size: 11px; opacity: 0.8;">
                Rapor Tarihi: ${currentDate} | Saat: ${currentTime}
              </div>
              ${companySettings.company_website ? `
                <div style="margin-top: 6px; font-size: 10px; color: #6b7280;">
                  ${companySettings.company_website}
                </div>
              ` : ''}
              <div style="margin-top: 12px; padding: 6px 12px; background: #f9fafb; border-radius: 3px; border: 1px solid #e5e7eb; display: inline-block;">
                <div style="font-size: 9px; color: #6b7280;">
                  ${months[selectedMonth]} ${selectedYear}
                  ${selectedConsultantFilter !== 'all' ? ` • ${consultants.find(c => c.id === parseInt(selectedConsultantFilter))?.name || 'Bilinmeyen'}` : ''}
                </div>
              </div>
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
        'Performans raporu hazır!'
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
          <h1 className="text-3xl font-bold text-gray-900">Raporlar</h1>
          <p className="text-gray-600 mt-2">Vize danışmanlık performans analizi</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Raporlar</h1>
          <p className="text-gray-600 mt-2">Vize danışmanlık performans analizi</p>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Raporlar</h1>
          <p className="text-gray-600 mt-2">Vize danışmanlık performans analizi</p>
        </div>
        
                                   {/* Dönem Seçici ve PDF Rapor Butonu - Sağ Üst Köşe */}
          <div className="flex items-center space-x-3">
            {/* Ay Seçici */}
            <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <label className="text-sm font-medium text-gray-700">
                Ay:
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="text-sm border-0 bg-transparent text-gray-900 focus:ring-0 focus:outline-none"
              >
                {[
                  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
                ].map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>
            </div>
            
            {/* Yıl Seçici */}
            <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <label className="text-sm font-medium text-gray-700">
                Yıl:
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="text-sm border-0 bg-transparent text-gray-900 focus:ring-0 focus:outline-none"
              >
                {[2023, 2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
           
                       {/* Danışman Filtresi */}
            <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <label className="text-sm font-medium text-gray-700">
                Danışman:
              </label>
              <select
                value={selectedConsultantFilter}
                onChange={(e) => setSelectedConsultantFilter(e.target.value)}
                className="text-sm border-0 bg-transparent text-gray-900 focus:ring-0 focus:outline-none"
              >
                <option value="all">Tüm Danışmanlar</option>
                {consultants.map(consultant => (
                  <option key={consultant.id} value={consultant.id}>
                    {consultant.name}
                  </option>
                ))}
              </select>
            </div>

            {/* PDF Rapor Butonu - Finans sayfasındaki stil ile aynı */}
            <button 
              onClick={handleViewReport}
              className="btn-secondary flex items-center"
            >
              <Download size={20} className="mr-2" />
              PDF Rapor
            </button>
         </div>
      </div>



      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {['Genel Bakış', 'Performans'].map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(['overview', 'performance'][index])}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === ['overview', 'performance'][index]
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>



      

      {/* Content based on active tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sol Sütun */}
          <div className="space-y-6">
            {/* Vize Durumu Dağılımı */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <h3 className="text-xl font-semibold text-gray-800">Vize Durumu Dağılımı</h3>
                  <span className="text-sm text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    {months[selectedMonth]} {selectedYear}
                  </span>
                  {selectedConsultantFilter !== 'all' && (
                    <span className="text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full border border-green-200">
                      {consultants.find(c => c.id === parseInt(selectedConsultantFilter))?.name}
                    </span>
                  )}
                </div>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
             <div className="space-y-4">
               {visaStatusDistribution.map((item, index) => (
                 <div key={index} className="group">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-base font-medium text-gray-700">{item.status}</span>
                     <div className="flex items-center space-x-4">
                       <span className="text-lg font-bold text-gray-900">{item.count}</span>
                       <span className="text-sm text-gray-400 font-medium">{item.percentage}%</span>
                     </div>
                   </div>
                   <div className="w-full bg-gray-100 rounded-full h-2">
                     <div 
                       className="h-2 rounded-full transition-all duration-300 group-hover:opacity-80"
                       style={{
                         width: `${item.percentage}%`,
                         backgroundColor: item.color
                       }}
                     ></div>
                   </div>
                 </div>
               ))}
             </div>
                                                         <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-center text-sm text-gray-500">
                    <span className="mr-2">Toplam:</span>
                    <span className="font-semibold text-gray-700">
                      {totalFilteredByConsultant} başvuru
                    </span>
                    {selectedConsultantFilter !== 'all' && (
                      <span className="ml-2 text-xs text-green-600">
                        ({consultants.find(c => c.id === parseInt(selectedConsultantFilter))?.name})
                      </span>
                    )}
                  </div>
                </div>
                       </div>

            {/* Ülke Dağılımı Tablosu */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold text-gray-800">Ülke Dağılımı</h3>
                  <span className="text-sm text-purple-600 font-medium bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                    {months[selectedMonth]} {selectedYear}
                  </span>
                  {selectedConsultantFilter !== 'all' && (
                    <span className="text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full border border-green-200">
                      {consultants.find(c => c.id === parseInt(selectedConsultantFilter))?.name}
                    </span>
                  )}
                </div>
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              </div>
              
              {countryChartData.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">🌍</div>
                  <p className="text-sm text-gray-500">Seçilen dönem için ülke verisi bulunmuyor.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ülke</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri Sayısı</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Yüzde</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Grafik</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {countryChartData.map((item, index) => (
                        <tr key={item.country} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: countryColors[index % countryColors.length] }}
                              ></div>
                              <span className="text-sm font-medium text-gray-900">{item.country}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm text-gray-600">{item.percentage}%</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center">
                              <div className="w-full bg-gray-200 rounded-full h-2 max-w-[100px]">
                                <div 
                                  className="h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${item.percentage}%`,
                                    backgroundColor: countryColors[index % countryColors.length]
                                  }}
                                ></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Özet Bilgi */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Toplam Ülke: <span className="font-medium text-gray-900">{countryChartData.length}</span></span>
                  <span>En Popüler: <span className="font-medium text-gray-900">
                    {countryChartData.length > 0 ? countryChartData.reduce((max, item) => 
                      item.count > max.count ? item : max
                    ).country : 'Veri yok'}
                  </span></span>
                </div>
              </div>
            </div>

                        </div>
            
            {/* Sağ Sütun - Çizgi Grafiği */}
            <div className="space-y-6">
                             {/* Aylık Performans Çizgi Grafiği */}
               <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-semibold text-gray-800">Aylık Performans</h3>
                    {selectedConsultantFilter !== 'all' && (
                      <span className="text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full border border-green-200">
                        {consultants.find(c => c.id === parseInt(selectedConsultantFilter))?.name}
                      </span>
                    )}
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Yıl:</span>
                    <select
                      value={selectedTrendYear}
                      onChange={(e) => handleTrendYearChange(parseInt(e.target.value))}
                      className="px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    >
                      {[2023, 2024, 2025, 2026].map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
               
               {/* Çizgi Grafiği */}
               <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={chartData}>
                     <defs>
                       <linearGradient id="colorMüşteri" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                         <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                     <XAxis 
                       dataKey="name" 
                       stroke="#6b7280"
                       fontSize={12}
                       tickLine={false}
                       axisLine={false}
                     />
                     <YAxis 
                       stroke="#6b7280"
                       fontSize={12}
                       tickLine={false}
                       axisLine={false}
                       tickFormatter={(value) => `${value}`}
                       domain={[0, (dataMax) => {
                         const max = Math.ceil(dataMax / 5) * 5;
                         return max;
                       }]}
                       ticks={(() => {
                         const maxValue = Math.max(...chartData.map(item => item.müşteri));
                         const roundedMax = Math.ceil(maxValue / 5) * 5;
                         const stepCount = Math.min(Math.max(roundedMax / 5, 2), 6);
                         const ticks = [];
                         for (let i = 0; i <= stepCount; i++) {
                           ticks.push((roundedMax / stepCount) * i);
                         }
                         return ticks;
                       })()}
                     />
                     <Tooltip 
                       contentStyle={{
                         backgroundColor: 'white',
                         border: '1px solid #e5e7eb',
                         borderRadius: '8px',
                         boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                       }}
                       labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                       formatter={(value, name) => [`${value} müşteri`, 'Müşteri Sayısı']}
                       labelFormatter={(label) => `${label}`}
                     />
                     <Area
                       type="monotone"
                       dataKey="müşteri"
                       stroke="#10b981"
                       strokeWidth={3}
                       fill="url(#colorMüşteri)"
                       fillOpacity={0.8}
                     />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
               
                               {/* Özet İstatistikler */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {monthlyTrend.reduce((sum, item) => sum + item.applications, 0)}
                      </div>
                      <div className="text-xs text-gray-500">Toplam</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {monthlyTrend.length > 0 ? Math.max(...monthlyTrend.map(item => item.applications)) : 0}
                      </div>
                      <div className="text-xs text-gray-500">En Yüksek</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {monthlyTrend.length > 0 ? Math.round(monthlyTrend.reduce((sum, item) => sum + item.applications, 0) / monthlyTrend.length) : 0}
                      </div>
                      <div className="text-xs text-gray-500">Ortalama</div>
                    </div>
                  </div>
                </div>
              </div>
              
                             {/* Aylık Trend Tablosu */}
               <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                 <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center space-x-4">
                     <h3 className="text-lg font-semibold text-gray-800">Aylık Trend</h3>
                     {selectedConsultantFilter !== 'all' && (
                       <span className="text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full border border-green-200">
                         {consultants.find(c => c.id === parseInt(selectedConsultantFilter))?.name}
                       </span>
                     )}
                     <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                   </div>
                   <div className="flex items-center space-x-2">
                     <span className="text-sm text-gray-600">Yıl:</span>
                     <select
                       value={selectedTrendYear}
                       onChange={(e) => handleTrendYearChange(parseInt(e.target.value))}
                       className="px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                     >
                       {[2023, 2024, 2025, 2026].map(year => (
                         <option key={year} value={year}>{year}</option>
                       ))}
                     </select>
                   </div>
                 </div>
                
                {/* Modern Tablo Tasarımı - Sadece Toplam Müşteri */}
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ay</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Toplam Müşteri</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {monthlyTrend.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-gray-900">{item.month}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm font-semibold text-green-600">{item.applications}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Özet Bilgi */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Yıl: <span className="font-medium text-gray-900">{selectedTrendYear}</span></span>
                    <span>Toplam: <span className="font-medium text-gray-900">{monthlyTrend.reduce((sum, item) => sum + item.applications, 0)}</span></span>
                  </div>
                </div>
              </div>
            </div>
        </div>
      )}

             {activeTab === 'performance' && (
         <div className="space-y-6">
                       {/* Danışman Performans Tablosu */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                             <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center space-x-4">
                   <h3 className="text-xl font-semibold text-gray-800">Danışman Performans Analizi</h3>
                   <span className="text-sm text-indigo-600 font-medium bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                     {months[selectedMonth]} {selectedYear}
                   </span>
                   {selectedConsultantFilter !== 'all' && (
                     <span className="text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full border border-green-200">
                       {consultants.find(c => c.id === parseInt(selectedConsultantFilter))?.name}
                     </span>
                   )}
                 </div>
                 <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
               </div>
             
             <div className="overflow-x-auto">
               <table className="w-full">
                 <thead>
                   <tr className="border-b border-gray-200">
                     <th className="text-left py-3 px-4 font-semibold text-gray-700">Danışman</th>
                     <th className="text-left py-3 px-4 font-semibold text-gray-700">Uzmanlık</th>
                     <th className="text-center py-3 px-4 font-semibold text-gray-700">Toplam Müşteri</th>
                     <th className="text-center py-3 px-4 font-semibold text-gray-700">Aktif</th>
                     <th className="text-center py-3 px-4 font-semibold text-gray-700">Bekleyen</th>
                     <th className="text-center py-3 px-4 font-semibold text-gray-700">Tamamlanan</th>
                     <th className="text-center py-3 px-4 font-semibold text-gray-700">Ödeme Sayısı</th>
                     <th className="text-center py-3 px-4 font-semibold text-gray-700">Gelir</th>
                   </tr>
                 </thead>
                 <tbody>
                   {consultantPerformance.map((consultant, index) => (
                     <tr key={consultant.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                       <td className="py-4 px-4">
                         <div className="flex items-center space-x-3">
                           <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                             <span className="text-indigo-600 font-semibold text-sm">
                               {consultant.name.split(' ').map(n => n[0]).join('')}
                             </span>
                           </div>
                           <div>
                             <div className="font-medium text-gray-900">{consultant.name}</div>
                             <div className="text-sm text-gray-500">{consultant.specialty}</div>
                           </div>
                         </div>
                       </td>
                       <td className="py-4 px-4">
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                           {consultant.specialty}
                         </span>
                       </td>
                       <td className="py-4 px-4 text-center">
                         <span className="text-lg font-bold text-gray-900">{consultant.totalClients}</span>
                       </td>
                       <td className="py-4 px-4 text-center">
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                           {consultant.activeClients}
                         </span>
                       </td>
                       <td className="py-4 px-4 text-center">
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                           {consultant.pendingClients}
                         </span>
                       </td>
                       <td className="py-4 px-4 text-center">
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                           {consultant.completedClients}
                         </span>
                       </td>
                       <td className="py-4 px-4 text-center">
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                           {consultant.totalPayments || 0}
                         </span>
                       </td>
                       <td className="py-4 px-4 text-center">
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">
                              ₺{consultant.totalRevenue?.toLocaleString('tr-TR') || '0'}
                            </div>
                            <div className="text-xs text-gray-500">Gerçek Gelir</div>
                          </div>
                        </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
           
                       {/* Performans Özet Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {selectedConsultantFilter !== 'all' ? 'Seçili Danışman' : 'Toplam Danışman'}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {selectedConsultantFilter !== 'all' ? '1' : consultants.length}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-indigo-100">
                    <Users size={24} className="text-indigo-600" />
                  </div>
                </div>
              </div>
              
                             <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                 <div className="flex items-center justify-between">
                   <div>
                     <p className="text-sm font-medium text-gray-600">
                       Seçilen Dönem Geliri
                     </p>
                     <p className="text-2xl font-bold text-gray-900 mt-1">
                       ₺{consultantPerformance.length > 0 
                         ? consultantPerformance.reduce((sum, c) => sum + (c.totalRevenue || 0), 0).toLocaleString('tr-TR')
                         : '0'
                       }
                     </p>
                   </div>
                   <div className="p-3 rounded-lg bg-green-100">
                     <TrendingUp size={24} className="text-green-600" />
                   </div>
                 </div>
               </div>
              
                             <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                 <div className="flex items-center justify-between">
                   <div>
                     <p className="text-sm font-medium text-gray-600">
                       {selectedConsultantFilter !== 'all' ? 'Seçili Danışman Geliri' : 'Seçilen Dönem En Yüksek Gelir'}
                     </p>
                     <p className="text-lg font-bold text-gray-900 mt-1">
                       {consultantPerformance.length > 0 
                         ? selectedConsultantFilter !== 'all' 
                           ? `₺${consultantPerformance[0]?.totalRevenue?.toLocaleString('tr-TR') || '0'}`
                           : consultantPerformance.reduce((max, c) => (c.totalRevenue || 0) > (max.totalRevenue || 0) ? c : max).name
                         : '-'
                       }
                     </p>
                   </div>
                   <div className="p-3 rounded-lg bg-yellow-100">
                     <CheckCircle size={24} className="text-yellow-600" />
                   </div>
                 </div>
               </div>
              
                             <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                 <div className="flex items-center justify-between">
                   <div>
                     <p className="text-sm font-medium text-gray-600">
                       {selectedConsultantFilter !== 'all' ? 'Seçili Danışman Müşteri Sayısı' : 'Seçilen Dönem En Yoğun Danışman'}
                     </p>
                     <p className="text-lg font-bold text-gray-900 mt-1">
                       {consultantPerformance.length > 0 
                         ? selectedConsultantFilter !== 'all' 
                           ? `${consultantPerformance[0]?.totalClients || 0} müşteri`
                           : consultantPerformance.reduce((max, c) => c.totalClients > max.totalClients ? c : max).name
                         : '-'
                       }
                     </p>
                   </div>
                   <div className="p-3 rounded-lg bg-blue-100">
                     <Clock size={24} className="text-blue-600" />
                   </div>
                 </div>
               </div>
            </div>
         </div>
       )}

      {activeTab === 'trends' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trend Analizi</h3>
          <p className="text-gray-600">Trend analizi burada görüntülenecek...</p>
        </div>
      )}
    </div>
  );
};

export default Reports;
