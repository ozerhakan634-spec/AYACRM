import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Bot, User, BarChart3, Users, FileText, Calendar, DollarSign, Loader2, Sparkles, TrendingUp, Settings, X, Check } from 'lucide-react';
import { DatabaseService } from '../services/database';
import { AuthService } from '../services/auth';
import AIService from '../services/aiService';
import SmartAIService from '../services/smartAIService';
import SmartQueryService from '../services/smartQueryService';
import { AITrainingService } from '../services/aiTrainingService';

const ChatBot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Merhaba! Ben vize danışmanlığı CRM asistanınızım. Müşteri bilgileri, randevu durumu, belgeler, ödemeler ve danışman performansı hakkında size yardımcı olabilirim. **Hangi konuda bilgi almak istiyorsunuz?**',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiConfig, setAiConfig] = useState({
    useAI: false,
    provider: 'openai', // 'openai', 'claude', 'gemini'
    apiKey: ''
  });
  const [showAISettings, setShowAISettings] = useState(false);
  const [tempAiConfig, setTempAiConfig] = useState(aiConfig);
  const [isTestingAPI, setIsTestingAPI] = useState(false);

  const [smartMode] = useState(true); // RAG + SQL hibrit modu - her zaman aktif
  const messagesEndRef = useRef(null);
  const currentUser = AuthService.getCurrentUser();

  // Mesajları otomatik scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Hızlı analiz butonları
  const quickAnalysisButtons = [
    {
      icon: Users,
      label: 'Müşteri Durumu',
      prompt: 'Bu ayki müşteri durumu nasıl? Hangi ülkelerden başvurular var?'
    },
    {
      icon: Calendar,
      label: 'Bu Ay Randevular',
      prompt: 'Bu ay kimlerin randevusu var? Tarih ve saatleri neler?'
    },
    {
      icon: DollarSign,
      label: 'Ödemeler',
      prompt: 'Son ödemeler kimlerden geldi? Bekleyen ödemeler var mı?'
    },
    {
      icon: FileText,
      label: 'Belge Durumu',
      prompt: 'Belge durumu nasıl? Hangi belgeler onay bekliyor?'
    }
  ];

  // CRM verilerini analiz et
  const analyzeCRMData = async () => {
    setIsAnalyzing(true);
    try {
      // Paralel veri yükleme
      const [clients, consultants, documents, payments] = await Promise.all([
        DatabaseService.getClients().catch(() => []),
        DatabaseService.getConsultantsWithClientCount().catch(() => []),
        DatabaseService.getDocuments().catch(() => []),
        DatabaseService.getPayments().catch(() => [])
      ]);

      return {
        clients,
        consultants,
        documents,
        payments,
        summary: {
          totalClients: clients.length,
          activeClients: clients.filter(c => c.status === 'active').length,
          totalConsultants: consultants.length,
          totalDocuments: documents.length,
          totalPayments: payments.length,
          totalRevenue: payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
        }
      };
    } catch (error) {
      console.error('Veri analizi hatası:', error);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Gelişmiş AI analiz motoru
  const generateAIResponse = async (userMessage, crmData) => {
    const { clients, consultants, documents, payments, summary } = crmData;
    const message = userMessage.toLowerCase();
    
    // Çok daha detaylı analiz
    const analysis = analyzeUserIntent(message);
    
    switch (analysis.intent) {
      case 'specific_client':
        return generateSpecificClientAnalysis(analysis.params, clients, payments, documents);
      case 'time_based':
        return generateTimeBasedAnalysis(analysis.params, clients, payments);
      case 'comparison':
        return generateComparisonAnalysis(analysis.params, clients, consultants, payments);
      case 'prediction':
        return generatePredictionAnalysis(analysis.params, clients, payments);
      case 'problem_solving':
        return generateProblemSolvingResponse(analysis.params, crmData);
      case 'detailed_client':
        return generateDetailedClientAnalysis(clients, summary, analysis.params);
      case 'detailed_revenue':
        return generateDetailedRevenueAnalysis(payments, clients, summary, analysis.params);
      case 'detailed_appointment':
        return generateDetailedAppointmentAnalysis(clients, analysis.params);
      case 'detailed_consultant':
        return generateDetailedConsultantAnalysis(consultants, clients, analysis.params);
      case 'detailed_document':
        return generateDetailedDocumentAnalysis(documents, clients, analysis.params);
      case 'general':
      default:
        return generateContextualGeneralAnalysis(summary, clients, consultants, payments, analysis.params);
    }
  };

  // Kullanıcı niyetini analiz et
  const analyzeUserIntent = (message) => {
    const params = {
      timeFrame: null,
      entity: null,
      metric: null,
      comparison: false,
      details: []
    };

    // Zaman ifadeleri
    if (message.includes('bugün')) params.timeFrame = 'today';
    if (message.includes('bu hafta')) params.timeFrame = 'this_week';
    if (message.includes('bu ay') || message.includes('bu ayki')) params.timeFrame = 'this_month';
    if (message.includes('geçen ay')) params.timeFrame = 'last_month';
    if (message.includes('bu yıl')) params.timeFrame = 'this_year';
    if (message.includes('son 7 gün')) params.timeFrame = 'last_7_days';
    if (message.includes('son 30 gün')) params.timeFrame = 'last_30_days';

    // Karşılaştırma ifadeleri
    if (message.includes('karşılaştır') || message.includes('fark') || message.includes('hangisi')) {
      params.comparison = true;
    }

    // Özel müşteri sorguları
    if (message.includes('isimli') || message.includes('adlı') || message.includes('hangi müşteri')) {
      return { intent: 'specific_client', params };
    }

    // Problem çözme
    if (message.includes('nasıl') || message.includes('neden') || message.includes('çözüm') || message.includes('öneri')) {
      return { intent: 'problem_solving', params };
    }

    // Tahmin/Projeksiyon
    if (message.includes('gelecek') || message.includes('tahmin') || message.includes('trend') || message.includes('artış')) {
      return { intent: 'prediction', params };
    }

    // Detaylı analizler
    if (message.includes('müşteri') && (message.includes('detay') || message.includes('hangi') || message.includes('kim'))) {
      params.details = extractDetailParams(message, 'client');
      return { intent: 'detailed_client', params };
    }

    if (message.includes('gelir') || message.includes('ödeme')) {
      params.details = extractDetailParams(message, 'revenue');
      return { intent: 'detailed_revenue', params };
    }

    if (message.includes('randevu')) {
      params.details = extractDetailParams(message, 'appointment');
      return { intent: 'detailed_appointment', params };
    }

    if (message.includes('danışman')) {
      params.details = extractDetailParams(message, 'consultant');
      return { intent: 'detailed_consultant', params };
    }

    if (message.includes('belge') || message.includes('doküman')) {
      params.details = extractDetailParams(message, 'document');
      return { intent: 'detailed_document', params };
    }

    // Zaman bazlı sorgular
    if (params.timeFrame) {
      return { intent: 'time_based', params };
    }

    return { intent: 'general', params };
  };

  // Detay parametrelerini çıkar
  const extractDetailParams = (message, type) => {
    const details = [];
    
    if (message.includes('en çok') || message.includes('en fazla')) details.push('top');
    if (message.includes('en az') || message.includes('en düşük')) details.push('bottom');
    if (message.includes('yeni') || message.includes('son')) details.push('recent');
    if (message.includes('aktif')) details.push('active');
    if (message.includes('pasif')) details.push('inactive');
    if (message.includes('ülke') || message.includes('country')) details.push('by_country');
    if (message.includes('tür') || message.includes('tip')) details.push('by_type');
    if (message.includes('durum') || message.includes('status')) details.push('by_status');
    if (message.includes('grafik') || message.includes('chart')) details.push('visual');
    
    return details;
  };

  // Müşteri analizi
  const generateClientAnalysis = (clients, summary) => {
    const activeClients = clients.filter(c => c.status === 'active');
    const recentClients = clients.filter(c => {
      const createdDate = new Date(c.created_at);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return createdDate > oneMonthAgo;
    });

    const countryStats = clients.reduce((acc, client) => {
      const country = client.country || 'Belirtilmemiş';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {});

    const topCountries = Object.entries(countryStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return `📊 **Müşteri Analizi Raporu**

📈 **Genel Durum:**
• Toplam Müşteri: ${summary.totalClients}
• Aktif Müşteri: ${activeClients.length}
• Son 30 Gün Yeni Müşteri: ${recentClients.length}
• Müşteri Aktiflik Oranı: %${((activeClients.length / summary.totalClients) * 100).toFixed(1)}

🌍 **En Popüler Ülkeler:**
${topCountries.map((country, index) => `${index + 1}. ${country[0]}: ${country[1]} müşteri`).join('\n')}

📅 **Randevu Durumu:**
• Randevusu Olan: ${clients.filter(c => c.appointment_date).length} müşteri
• Bugün Sonrası Randevu: ${clients.filter(c => c.appointment_date && new Date(c.appointment_date) > new Date()).length}

${recentClients.length > 0 ? '🔥 **Dikkat:** Son 30 günde ' + recentClients.length + ' yeni müşteri eklendi!' : '⚠️ **Uyarı:** Son 30 günde yeni müşteri eklenmedi.'}`;
  };

  // Gelir analizi
  const generateRevenueAnalysis = (payments, clients, summary) => {
    const completedPayments = payments.filter(p => p.status === 'completed');
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const totalRevenue = completedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const pendingAmount = pendingPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    const currencyStats = payments.reduce((acc, payment) => {
      const currency = payment.currency || 'TRY';
      if (!acc[currency]) acc[currency] = { total: 0, completed: 0 };
      acc[currency].total += parseFloat(payment.amount) || 0;
      if (payment.status === 'completed') {
        acc[currency].completed += parseFloat(payment.amount) || 0;
      }
      return acc;
    }, {});

    return `💰 **Gelir Analizi Raporu**

💳 **Ödeme Durumu:**
• Toplam Ödeme Kaydı: ${payments.length}
• Tamamlanmış: ${completedPayments.length} (₺${totalRevenue.toLocaleString('tr-TR')})
• Bekleyen: ${pendingPayments.length} (₺${pendingAmount.toLocaleString('tr-TR')})
• Tahsilat Oranı: %${((completedPayments.length / payments.length) * 100).toFixed(1)}

💱 **Para Birimi Dağılımı:**
${Object.entries(currencyStats).map(([currency, data]) => 
  `• ${currency}: ${data.completed.toLocaleString('tr-TR')} / ${data.total.toLocaleString('tr-TR')}`
).join('\n')}

📊 **Ortalama İşlem:**
• Ortalama Ödeme: ₺${(totalRevenue / (completedPayments.length || 1)).toLocaleString('tr-TR')}
• Müşteri Başına Ortalama: ₺${(totalRevenue / (summary.totalClients || 1)).toLocaleString('tr-TR')}

${pendingAmount > 0 ? '⏳ **Bekleyen Ödemeler:** ₺' + pendingAmount.toLocaleString('tr-TR') + ' tutarında ödeme bekliyor.' : '✅ **Mükemmel:** Bekleyen ödeme yok!'}`;
  };

  // Randevu analizi
  const generateAppointmentAnalysis = (clients) => {
    const clientsWithAppointment = clients.filter(c => c.appointment_date);
    const today = new Date();
    const upcomingAppointments = clientsWithAppointment.filter(c => {
      const appointmentDate = new Date(c.appointment_date);
      return appointmentDate > today;
    });
    const pastAppointments = clientsWithAppointment.filter(c => {
      const appointmentDate = new Date(c.appointment_date);
      return appointmentDate < today;
    });

    const nextWeekAppointments = upcomingAppointments.filter(c => {
      const appointmentDate = new Date(c.appointment_date);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      return appointmentDate <= nextWeek;
    });

    return `📅 **Randevu Analizi Raporu**

📊 **Genel Durum:**
• Toplam Randevu: ${clientsWithAppointment.length}
• Gelecek Randevular: ${upcomingAppointments.length}
• Geçmiş Randevular: ${pastAppointments.length}
• Randevu Oranı: %${((clientsWithAppointment.length / clients.length) * 100).toFixed(1)}

🗓️ **Yaklaşan Randevular:**
• Gelecek 7 Gün: ${nextWeekAppointments.length} randevu
• En Yakın Randevu: ${upcomingAppointments.length > 0 ? 
  new Date(Math.min(...upcomingAppointments.map(c => new Date(c.appointment_date)))).toLocaleDateString('tr-TR') : 
  'Randevu yok'}

⏰ **Randevu Saatleri:**
${clientsWithAppointment.filter(c => c.appointment_time).length > 0 ? 
  'Saati belirtilen randevu sayısı: ' + clientsWithAppointment.filter(c => c.appointment_time).length :
  'Hiçbir randevunun saati belirtilmemiş'}

${nextWeekAppointments.length > 3 ? '🔥 **Yoğun Hafta:** Gelecek hafta ' + nextWeekAppointments.length + ' randevunuz var!' : 
  nextWeekAppointments.length === 0 ? '😴 **Sakin Hafta:** Gelecek hafta randevunuz yok.' : 
  '👍 **Normal Tempo:** Gelecek hafta ' + nextWeekAppointments.length + ' randevunuz var.'}`;
  };

  // Danışman analizi
  const generateConsultantAnalysis = (consultants, clients) => {
    const activeConsultants = consultants.filter(c => c.status === 'active');
    const consultantsWithCredentials = consultants.filter(c => c.has_credentials);
    
    const topPerformers = consultants
      .filter(c => c.totalCases > 0)
      .sort((a, b) => b.totalCases - a.totalCases)
      .slice(0, 3);

    const unassignedClients = clients.filter(c => !c.consultant_id).length;

    return `👥 **Danışman Analizi Raporu**

📊 **Ekip Durumu:**
• Toplam Danışman: ${consultants.length}
• Aktif Danışman: ${activeConsultants.length}
• Giriş Yetkisi Olan: ${consultantsWithCredentials.length}
• Sistem Kullanım Oranı: %${((consultantsWithCredentials.length / consultants.length) * 100).toFixed(1)}

🏆 **En Başarılı Danışmanlar:**
${topPerformers.map((consultant, index) => 
  `${index + 1}. ${consultant.name}: ${consultant.totalCases} müşteri`
).join('\n')}

📈 **Performans Metrikleri:**
• Danışman Başına Ortalama Müşteri: ${(clients.length / consultants.length).toFixed(1)}
• En Yüksek Müşteri Sayısı: ${Math.max(...consultants.map(c => c.totalCases || 0))}
• Atanmamış Müşteri: ${unassignedClients}

${unassignedClients > 0 ? '⚠️ **Dikkat:** ' + unassignedClients + ' müşteri henüz danışmana atanmamış!' : '✅ **Mükemmel:** Tüm müşteriler danışmana atanmış!'}`;
  };

  // Belge analizi
  const generateDocumentAnalysis = (documents, clients) => {
    const verifiedDocs = documents.filter(d => d.status === 'verified').length;
    const pendingDocs = documents.filter(d => d.status === 'pending').length;
    const rejectedDocs = documents.filter(d => d.status === 'rejected').length;

    const docTypes = documents.reduce((acc, doc) => {
      const type = doc.type || 'other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const clientsWithDocs = new Set(documents.map(d => d.clientId)).size;
    const clientsWithoutDocs = clients.length - clientsWithDocs;

    return `📁 **Belge Analizi Raporu**

📊 **Belge Durumu:**
• Toplam Belge: ${documents.length}
• Onaylanmış: ${verifiedDocs}
• Bekleyen: ${pendingDocs}
• Reddedilen: ${rejectedDocs}
• Onay Oranı: %${((verifiedDocs / documents.length) * 100).toFixed(1)}

📋 **Belge Türleri:**
${Object.entries(docTypes).map(([type, count]) => {
  const typeNames = {
    'identity': 'Kimlik Belgeleri',
    'education': 'Eğitim Belgeleri', 
    'employment': 'İş Belgeleri',
    'financial': 'Mali Belgeler',
    'medical': 'Sağlık Belgeleri',
    'other': 'Diğer'
  };
  return `• ${typeNames[type] || type}: ${count}`;
}).join('\n')}

👥 **Müşteri Belge Durumu:**
• Belgesi Olan Müşteri: ${clientsWithDocs}
• Belge Yüklememiş: ${clientsWithoutDocs}
• Belge Yükleme Oranı: %${((clientsWithDocs / clients.length) * 100).toFixed(1)}

${pendingDocs > 0 ? '⏳ **Bekleyen İnceleme:** ' + pendingDocs + ' belge inceleme bekliyor!' : '✅ **Güncel:** Bekleyen belge yok!'}`;
  };

  // Genel analiz
  const generateGeneralAnalysis = (summary, clients, consultants, payments) => {
    const activeClientsRate = ((summary.activeClients / summary.totalClients) * 100).toFixed(1);
    const avgClientsPerConsultant = (summary.totalClients / summary.totalConsultants).toFixed(1);
    const completedPayments = payments.filter(p => p.status === 'completed').length;
    const paymentRate = ((completedPayments / payments.length) * 100).toFixed(1);

    let healthScore = 0;
    if (activeClientsRate > 80) healthScore += 25;
    else if (activeClientsRate > 60) healthScore += 15;
    else if (activeClientsRate > 40) healthScore += 10;

    if (avgClientsPerConsultant > 10 && avgClientsPerConsultant < 30) healthScore += 25;
    else if (avgClientsPerConsultant > 5) healthScore += 15;

    if (paymentRate > 80) healthScore += 25;
    else if (paymentRate > 60) healthScore += 15;
    else if (paymentRate > 40) healthScore += 10;

    if (summary.totalRevenue > 50000) healthScore += 25;
    else if (summary.totalRevenue > 20000) healthScore += 15;
    else if (summary.totalRevenue > 10000) healthScore += 10;

    const healthStatus = healthScore >= 80 ? '🟢 Mükemmel' : 
                        healthScore >= 60 ? '🟡 İyi' : 
                        healthScore >= 40 ? '🟠 Orta' : '🔴 Geliştirilmeli';

    return `📊 **CRM Genel Durumu**

🎯 **Sistem Sağlığı: ${healthStatus} (%${healthScore})**

📈 **Ana Metrikler:**
• Toplam Müşteri: ${summary.totalClients}
• Aktif Müşteri Oranı: %${activeClientsRate}
• Danışman Sayısı: ${summary.totalConsultants}
• Danışman Başına Müşteri: ${avgClientsPerConsultant}

💰 **Mali Durum:**
• Toplam Gelir: ₺${summary.totalRevenue.toLocaleString('tr-TR')}
• Ödeme Başarı Oranı: %${paymentRate}
• Toplam İşlem: ${payments.length}

📁 **Operasyonel:**
• Toplam Belge: ${summary.totalDocuments}
• Müşteri Başına Belge: ${(summary.totalDocuments / summary.totalClients).toFixed(1)}

🔍 **Öneriler:**
${activeClientsRate < 70 ? '• Pasif müşterilerle iletişime geçin\n' : ''}${avgClientsPerConsultant > 30 ? '• Yeni danışman alımı düşünün\n' : ''}${paymentRate < 80 ? '• Ödeme takip süreçlerini gözden geçirin\n' : ''}${summary.totalRevenue < 20000 ? '• Gelir artırma stratejileri geliştirin\n' : ''}${healthScore >= 80 ? '• Sistem performansı mükemmel durumda!' : ''}`;
  };

  // Yeni gelişmiş analiz fonksiyonları
  const generateTimeBasedAnalysis = (params, clients, payments) => {
    const { timeFrame } = params;
    let startDate = new Date();
    let title = '';

    switch (timeFrame) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        title = 'Bugünkü';
        break;
      case 'this_week':
        startDate.setDate(startDate.getDate() - startDate.getDay());
        title = 'Bu Haftaki';
        break;
      case 'this_month':
        startDate.setDate(1);
        title = 'Bu Ayki';
        break;
      case 'last_month':
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setDate(1);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
        title = 'Geçen Ayki';
        break;
      case 'last_7_days':
        startDate.setDate(startDate.getDate() - 7);
        title = 'Son 7 Günlük';
        break;
      case 'last_30_days':
        startDate.setDate(startDate.getDate() - 30);
        title = 'Son 30 Günlük';
        break;
      default:
        startDate.setDate(1);
        title = 'Bu Ayki';
    }

    const filteredClients = clients.filter(c => {
      const clientDate = new Date(c.created_at);
      return clientDate >= startDate;
    });

    const filteredPayments = payments.filter(p => {
      const paymentDate = new Date(p.payment_date || p.created_at);
      return paymentDate >= startDate;
    });

    const totalRevenue = filteredPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    return `📅 **${title} Analiz Raporu**

📊 **Genel Durum:**
• Yeni Müşteri: ${filteredClients.length}
• Yeni Ödeme: ${filteredPayments.length}
• Toplam Gelir: ₺${totalRevenue.toLocaleString('tr-TR')}

📈 **Müşteri Detayları:**
${filteredClients.length === 0 ? '• Bu dönemde yeni müşteri kaydı yok' : 
  filteredClients.slice(0, 5).map(c => `• ${c.name} (${c.country || 'Ülke belirtilmemiş'})`).join('\n')
}

💰 **Ödeme Detayları:**
${filteredPayments.length === 0 ? '• Bu dönemde ödeme kaydı yok' : 
  `• Toplam İşlem: ${filteredPayments.length}\n• Ortalama Tutar: ₺${(totalRevenue / filteredPayments.filter(p => p.status === 'completed').length || 0).toLocaleString('tr-TR')}`
}

📈 **Performans:**
${filteredClients.length > 0 ? '🔥 Aktif dönem - yeni müşteriler var!' : '😴 Sakin dönem - pazarlama faaliyetleri artırılabilir'}`;
  };

  const generateDetailedClientAnalysis = (clients, summary, params) => {
    const { details, timeFrame } = params;
    let result = `👥 **Detaylı Müşteri Analizi**\n\n`;

    if (details.includes('top')) {
      const topCountries = clients.reduce((acc, client) => {
        const country = client.country || 'Belirtilmemiş';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {});

      const sortedCountries = Object.entries(topCountries)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      result += `🏆 **En Popüler Ülkeler:**\n`;
      result += sortedCountries.map((country, index) => 
        `${index + 1}. ${country[0]}: ${country[1]} müşteri (${((country[1] / clients.length) * 100).toFixed(1)}%)`
      ).join('\n') + '\n\n';
    }

    if (details.includes('recent')) {
      const recentClients = clients
        .filter(c => {
          const createdDate = new Date(c.created_at);
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return createdDate > oneWeekAgo;
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      result += `🆕 **Son Eklenen Müşteriler (7 gün):**\n`;
      if (recentClients.length === 0) {
        result += '• Son 7 günde yeni müşteri eklenmedi\n\n';
      } else {
        result += recentClients.map(c => 
          `• ${c.name} - ${c.country || 'Ülke yok'} (${new Date(c.created_at).toLocaleDateString('tr-TR')})`
        ).join('\n') + '\n\n';
      }
    }

    if (details.includes('by_status')) {
      const statusCounts = clients.reduce((acc, client) => {
        const status = client.status || 'Belirtilmemiş';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      result += `📊 **Durum Dağılımı:**\n`;
      Object.entries(statusCounts).forEach(([status, count]) => {
        const percentage = ((count / clients.length) * 100).toFixed(1);
        result += `• ${status}: ${count} (%${percentage})\n`;
      });
      result += '\n';
    }

    if (details.includes('active')) {
      const activeClients = clients.filter(c => c.status === 'active');
      result += `✅ **Aktif Müşteriler (${activeClients.length}):**\n`;
      activeClients.slice(0, 10).forEach(c => {
        result += `• ${c.name} - ${c.visa_type || 'Vize türü yok'} (${c.country || 'Ülke yok'})\n`;
      });
      if (activeClients.length > 10) {
        result += `... ve ${activeClients.length - 10} müşteri daha\n`;
      }
    }

    return result || 'Belirtilen kriterlere uygun veri bulunamadı.';
  };

  const generateDetailedRevenueAnalysis = (payments, clients, summary, params) => {
    const { details } = params;
    let result = `💰 **Detaylı Gelir Analizi**\n\n`;

    const completedPayments = payments.filter(p => p.status === 'completed');
    const totalRevenue = completedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    if (details.includes('top')) {
      const topPayments = completedPayments
        .sort((a, b) => (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0))
        .slice(0, 5);

      result += `🏆 **En Yüksek Ödemeler:**\n`;
      topPayments.forEach((payment, index) => {
        result += `${index + 1}. ₺${parseFloat(payment.amount).toLocaleString('tr-TR')} - ${payment.clientName || 'İsimsiz'}\n`;
      });
      result += '\n';
    }

    if (details.includes('by_type')) {
      const typeRevenue = payments.reduce((acc, payment) => {
        const type = payment.paymentType || payment.payment_type || 'Belirtilmemiş';
        if (!acc[type]) acc[type] = { count: 0, total: 0 };
        acc[type].count += 1;
        if (payment.status === 'completed') {
          acc[type].total += parseFloat(payment.amount) || 0;
        }
        return acc;
      }, {});

      result += `📋 **Ödeme Türüne Göre Gelir:**\n`;
      Object.entries(typeRevenue).forEach(([type, data]) => {
        result += `• ${type}: ₺${data.total.toLocaleString('tr-TR')} (${data.count} işlem)\n`;
      });
      result += '\n';
    }

    if (details.includes('recent')) {
      const recentPayments = completedPayments
        .filter(p => {
          const paymentDate = new Date(p.payment_date || p.created_at);
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return paymentDate > oneWeekAgo;
        })
        .sort((a, b) => new Date(b.payment_date || b.created_at) - new Date(a.payment_date || a.created_at));

      result += `🆕 **Son 7 Günün Ödemeleri:**\n`;
      if (recentPayments.length === 0) {
        result += '• Son 7 günde tamamlanmış ödeme yok\n\n';
      } else {
        const recentTotal = recentPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        result += `• Toplam: ₺${recentTotal.toLocaleString('tr-TR')} (${recentPayments.length} işlem)\n`;
        recentPayments.slice(0, 5).forEach(p => {
          result += `• ₺${parseFloat(p.amount).toLocaleString('tr-TR')} - ${p.clientName || 'İsimsiz'}\n`;
        });
        result += '\n';
      }
    }

    const pendingPayments = payments.filter(p => p.status === 'pending');
    const pendingAmount = pendingPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    
    result += `📊 **Özet Bilgiler:**\n`;
    result += `• Toplam Tamamlanmış: ₺${totalRevenue.toLocaleString('tr-TR')}\n`;
    result += `• Bekleyen Ödemeler: ₺${pendingAmount.toLocaleString('tr-TR')}\n`;
    result += `• Ortalama İşlem: ₺${(totalRevenue / (completedPayments.length || 1)).toLocaleString('tr-TR')}\n`;

    return result;
  };

  const generatePredictionAnalysis = (params, clients, payments) => {
    const { timeFrame } = params;
    
    // Son 3 ayın verilerini analiz et
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const recentClients = clients.filter(c => {
      const clientDate = new Date(c.created_at);
      return clientDate > threeMonthsAgo;
    });

    const recentPayments = payments.filter(p => {
      const paymentDate = new Date(p.payment_date || p.created_at);
      return paymentDate > threeMonthsAgo && p.status === 'completed';
    });

    const monthlyClientGrowth = recentClients.length / 3; // Aylık ortalama
    const monthlyRevenue = recentPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) / 3;

    const nextMonthClients = Math.round(monthlyClientGrowth);
    const nextMonthRevenue = Math.round(monthlyRevenue);

    return `🔮 **Trend Analizi ve Tahminler**

📈 **Son 3 Ay Performansı:**
• Aylık Ortalama Yeni Müşteri: ${monthlyClientGrowth.toFixed(1)}
• Aylık Ortalama Gelir: ₺${monthlyRevenue.toLocaleString('tr-TR')}
• Müşteri Büyüme Trendi: ${monthlyClientGrowth > 5 ? '📈 Yüksek' : monthlyClientGrowth > 2 ? '📊 Orta' : '📉 Düşük'}

🎯 **Gelecek Ay Tahminleri:**
• Beklenen Yeni Müşteri: ~${nextMonthClients}
• Beklenen Gelir: ~₺${nextMonthRevenue.toLocaleString('tr-TR')}
• Güven Seviyesi: %${monthlyClientGrowth > 1 ? '75' : '60'}

💡 **Öneriler:**
${monthlyClientGrowth < 2 ? '• Pazarlama faaliyetlerini artırın\n' : ''}${monthlyRevenue < 20000 ? '• Ürün/hizmet fiyatlandırmasını gözden geçirin\n' : ''}• Mevcut müşteri memnuniyetini artırarak yönlendirme oranını yükseltin
• ${nextMonthClients > 10 ? 'Kapasiteyi artırma planları yapın' : 'Müşteri kazanma stratejilerinizi güçlendirin'}

📊 **Risk Analizi:**
${monthlyClientGrowth < 1 ? '🔴 Yüksek Risk: Müşteri kazanma hızı düşük' : monthlyClientGrowth < 3 ? '🟡 Orta Risk: Büyüme istikrarlı ama yavaş' : '🟢 Düşük Risk: Sağlıklı büyüme trendi'}`;
  };

  const generateProblemSolvingResponse = (params, crmData) => {
    const { clients, consultants, documents, payments } = crmData;
    
    // Sistem problemlerini tespit et
    const problems = [];
    const solutions = [];

    // Müşteri problemleri
    const unassignedClients = clients.filter(c => !c.consultant_id).length;
    if (unassignedClients > 0) {
      problems.push(`${unassignedClients} müşteri danışmana atanmamış`);
      solutions.push(`Müşterileri danışmanlara otomatik atama sistemi kur veya manuel atama yap`);
    }

    const clientsWithoutAppointment = clients.filter(c => !c.appointment_date).length;
    if (clientsWithoutAppointment > clients.length * 0.3) {
      problems.push(`Müşterilerin %${((clientsWithoutAppointment / clients.length) * 100).toFixed(0)}'ının randevusu yok`);
      solutions.push(`Randevu hatırlatma sistemi kur ve müşterilerle proaktif iletişim kur`);
    }

    // Ödeme problemleri
    const pendingPayments = payments.filter(p => p.status === 'pending').length;
    if (pendingPayments > payments.length * 0.2) {
      problems.push(`Ödemelerin %${((pendingPayments / payments.length) * 100).toFixed(0)}'i beklemede`);
      solutions.push(`Ödeme takip sistemi kur ve müşteri iletişimini artır`);
    }

    // Belge problemleri
    const clientsWithoutDocs = clients.length - new Set(documents.map(d => d.clientId)).size;
    if (clientsWithoutDocs > clients.length * 0.4) {
      problems.push(`Müşterilerin %${((clientsWithoutDocs / clients.length) * 100).toFixed(0)}'ının belgesi yok`);
      solutions.push(`Belge yükleme hatırlatma sistemi kur ve süreç takibi yap`);
    }

    // Danışman problemleri
    const avgClientsPerConsultant = clients.length / consultants.length;
    if (avgClientsPerConsultant > 25) {
      problems.push(`Danışman başına ${avgClientsPerConsultant.toFixed(1)} müşteri düşüyor (çok yüksek)`);
      solutions.push(`Yeni danışman alımı yap veya iş yükü dağılımını optimize et`);
    }

    return `🔧 **CRM Problem Analizi ve Çözüm Önerileri**

${problems.length === 0 ? '✅ **Harika Haber!** Sistem analizi sonucunda kritik problem tespit edilmedi.' : 
`⚠️ **Tespit Edilen Problemler:**
${problems.map((problem, index) => `${index + 1}. ${problem}`).join('\n')}

💡 **Önerilen Çözümler:**
${solutions.map((solution, index) => `${index + 1}. ${solution}`).join('\n')}`}

🎯 **Öncelik Sırası:**
1. **Yüksek Öncelik:** Bekleyen ödemeler ve atanmamış müşteriler
2. **Orta Öncelik:** Randevu ve belge eksiklikleri  
3. **Düşük Öncelik:** Sistem optimizasyonları

📊 **Başarı Metrikleri:**
• Müşteri atama oranı: %${((clients.filter(c => c.consultant_id).length / clients.length) * 100).toFixed(1)}
• Ödeme başarı oranı: %${((payments.filter(p => p.status === 'completed').length / payments.length) * 100).toFixed(1)}
• Belge tamamlama oranı: %${(((clients.length - clientsWithoutDocs) / clients.length) * 100).toFixed(1)}

${problems.length > 0 ? '🚀 **Sonraki Adım:** En kritik problemden başlayarak 7 günlük aksiyon planı oluştur.' : '🎉 **Devam Eden Başarı:** Mevcut performansı korumak için düzenli takip yap.'}`;
  };

  const generateSpecificClientAnalysis = (params, clients, payments, documents) => {
    // Bu fonksiyon belirli müşteri sorgularını işler
    return `🔍 **Müşteri Arama Sonuçları**

Bu özellik geliştirilme aşamasında. Şu anda aşağıdaki genel müşteri bilgilerini sunabilirim:

📊 **Müşteri Özeti:**
• Toplam Müşteri: ${clients.length}
• En Son Eklenen: ${clients.length > 0 ? clients.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0].name : 'Yok'}
• En Popüler Ülke: ${(() => {
  const countries = clients.reduce((acc, c) => {
    const country = c.country || 'Belirtilmemiş';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {});
  const topCountry = Object.entries(countries).sort((a, b) => b[1] - a[1])[0];
  return topCountry ? `${topCountry[0]} (${topCountry[1]} müşteri)` : 'Yok';
})()}

💡 **İpucu:** "Ahmet isimli müşteri" veya "Türkiye müşterileri" gibi daha spesifik sorular sorun.`;
  };

  const generateContextualGeneralAnalysis = (summary, clients, consultants, payments, params) => {
    // Kontekstual genel analiz - her seferinde farklı açılar
    const angles = [
      'efficiency', 'growth', 'quality', 'performance', 'trends'
    ];
    
    const randomAngle = angles[Math.floor(Math.random() * angles.length)];
    
    switch (randomAngle) {
      case 'efficiency':
        return generateEfficiencyAnalysis(summary, clients, consultants, payments);
      case 'growth':
        return generateGrowthAnalysis(summary, clients, payments);
      case 'quality':
        return generateQualityAnalysis(clients, payments, consultants);
      case 'performance':
        return generatePerformanceAnalysis(summary, clients, consultants, payments);
      default:
        return generateTrendsAnalysis(clients, payments);
    }
  };

  const generateEfficiencyAnalysis = (summary, clients, consultants, payments) => {
    const efficiency = {
      clientToConsultant: (summary.totalClients / summary.totalConsultants).toFixed(1),
      paymentSuccess: ((payments.filter(p => p.status === 'completed').length / payments.length) * 100).toFixed(1),
      documentCoverage: ((new Set(documents.map(d => d.clientId)).size / clients.length) * 100).toFixed(1)
    };

    return `⚡ **Sistem Verimlilik Analizi**

🎯 **Verimlilik Metrikleri:**
• Danışman Başına Müşteri: ${efficiency.clientToConsultant} (İdeal: 15-20)
• Ödeme Başarı Oranı: %${efficiency.paymentSuccess}
• Belge Tamamlama: %${efficiency.documentCoverage}

📊 **Verimlilik Skoru:**
${(() => {
  let score = 0;
  if (efficiency.clientToConsultant >= 15 && efficiency.clientToConsultant <= 20) score += 30;
  else if (efficiency.clientToConsultant >= 10 && efficiency.clientToConsultant <= 25) score += 20;
  else score += 10;
  
  if (efficiency.paymentSuccess > 80) score += 30;
  else if (efficiency.paymentSuccess > 60) score += 20;
  else score += 10;
  
  if (efficiency.documentCoverage > 80) score += 40;
  else if (efficiency.documentCoverage > 60) score += 25;
  else score += 15;
  
  return `${score}/100 - ${score >= 80 ? '🟢 Mükemmel' : score >= 60 ? '🟡 İyi' : '🔴 Geliştirilmeli'}`;
})()}

💡 **Verimlilik Önerileri:**
${efficiency.clientToConsultant > 25 ? '• Danışman kapasitesi artırılmalı\n' : ''}${efficiency.paymentSuccess < 70 ? '• Ödeme süreçleri iyileştirilmeli\n' : ''}${efficiency.documentCoverage < 60 ? '• Belge toplama süreci güçlendirilmeli\n' : ''}• Otomasyon araçları kullanarak manuel işlemleri azalt
• Süreç standartları belirle ve takip et`;
  };

  const generateGrowthAnalysis = (summary, clients, payments) => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const recentClients = clients.filter(c => new Date(c.created_at) > lastMonth);
    const recentPayments = payments.filter(p => new Date(p.payment_date || p.created_at) > lastMonth);
    
    const growthRate = (recentClients.length / clients.length * 100).toFixed(1);
    const revenueGrowth = recentPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    return `📈 **Büyüme Analizi**

🚀 **Son Ay Performansı:**
• Yeni Müşteri: ${recentClients.length} (%${growthRate} büyüme)
• Yeni Gelir: ₺${revenueGrowth.toLocaleString('tr-TR')}
• Büyüme Momentumu: ${growthRate > 10 ? '🔥 Hızlı' : growthRate > 5 ? '📊 Stabil' : '🐌 Yavaş'}

📊 **Büyüme Potansiyeli:**
${(() => {
  if (growthRate > 15) return '🌟 Pazar lideri potansiyeli - mevcut momentum koruyun!';
  if (growthRate > 8) return '📈 Sağlıklı büyüme - kapasiteyi artırma zamanı';
  if (growthRate > 3) return '⚖️ Istikrarlı büyüme - pazarlama yatırımı yapın';
  return '🎯 Büyüme fırsatı - stratejik değişiklik gerekli';
})()}

🎯 **Büyüme Stratejileri:**
• Başarılı danışmanları model alarak diğerlerini geliştir
• En karlı müşteri segmentine odaklan
• Yönlendirme programı başlat
• Dijital pazarlama yatırımını artır

🔮 **3 Ay Tahmini:**
• Beklenen Yeni Müşteri: ~${Math.round(recentClients.length * 3)}
• Tahmini Ek Gelir: ~₺${Math.round(revenueGrowth * 3).toLocaleString('tr-TR')}`;
  };

  const generateQualityAnalysis = (clients, payments, consultants) => {
    const qualityMetrics = {
      completedPaymentRatio: ((payments.filter(p => p.status === 'completed').length / payments.length) * 100).toFixed(1),
      clientsWithAppointments: ((clients.filter(c => c.appointment_date).length / clients.length) * 100).toFixed(1),
      activeClientRatio: ((clients.filter(c => c.status === 'active').length / clients.length) * 100).toFixed(1)
    };

    return `⭐ **Hizmet Kalitesi Analizi**

📊 **Kalite Metrikleri:**
• Ödeme Tamamlama Oranı: %${qualityMetrics.completedPaymentRatio}
• Randevu Planlama Oranı: %${qualityMetrics.clientsWithAppointments}
• Müşteri Aktiflik Oranı: %${qualityMetrics.activeClientRatio}

🎯 **Kalite Skoru:**
${(() => {
  const avgScore = (parseFloat(qualityMetrics.completedPaymentRatio) + parseFloat(qualityMetrics.clientsWithAppointments) + parseFloat(qualityMetrics.activeClientRatio)) / 3;
  if (avgScore >= 80) return '🌟 Mükemmel Kalite';
  if (avgScore >= 65) return '⭐ İyi Kalite';
  if (avgScore >= 50) return '📊 Orta Kalite';
  return '🔧 Geliştirilmesi Gerekli';
})()}

💡 **Kalite İyileştirme Önerileri:**
${qualityMetrics.completedPaymentRatio < 75 ? '• Ödeme süreçlerini kolaylaştır ve takibi artır\n' : ''}${qualityMetrics.clientsWithAppointments < 70 ? '• Randevu planlama sistemini iyileştir\n' : ''}${qualityMetrics.activeClientRatio < 80 ? '• Müşteri memnuniyeti ve bağlılığını artır\n' : ''}• Müşteri geri bildirimleri topla ve değerlendir
• Hizmet standartlarını belirle ve takip et`;
  };

  const generatePerformanceAnalysis = (summary, clients, consultants, payments) => {
    const performance = {
      avgRevenuePerClient: (summary.totalRevenue / summary.totalClients).toFixed(0),
      avgClientsPerConsultant: (summary.totalClients / summary.totalConsultants).toFixed(1),
      conversionRate: ((payments.filter(p => p.status === 'completed').length / clients.length) * 100).toFixed(1)
    };

    return `🎯 **Performans Analizi**

📈 **Ana Performans Göstergeleri:**
• Müşteri Başına Ortalama Gelir: ₺${parseInt(performance.avgRevenuePerClient).toLocaleString('tr-TR')}
• Danışman Başına Müşteri: ${performance.avgClientsPerConsultant}
• Ödemeye Dönüşüm Oranı: %${performance.conversionRate}

🏆 **Performans Değerlendirmesi:**
${(() => {
  let score = 0;
  if (performance.avgRevenuePerClient > 5000) score += 35;
  else if (performance.avgRevenuePerClient > 3000) score += 25;
  else score += 15;
  
  if (performance.avgClientsPerConsultant >= 15 && performance.avgClientsPerConsultant <= 25) score += 35;
  else if (performance.avgClientsPerConsultant >= 10) score += 25;
  else score += 15;
  
  if (performance.conversionRate > 70) score += 30;
  else if (performance.conversionRate > 50) score += 20;
  else score += 10;
  
  const level = score >= 80 ? 'Yıldız Performans ⭐' : score >= 65 ? 'İyi Performans 👍' : score >= 50 ? 'Orta Performans 📊' : 'Gelişim Gerekli 🔧';
  return `${score}/100 - ${level}`;
})()}

📊 **Sektör Karşılaştırması:**
• Gelir Performansı: ${performance.avgRevenuePerClient > 4000 ? 'Sektör Ortalaması Üstü 📈' : 'Sektör Ortalaması Seviyesi 📊'}
• Verimlilik: ${performance.avgClientsPerConsultant > 20 ? 'Yüksek Verimlilik 🚀' : 'Normal Verimlilik ⚖️'}
• Başarı Oranı: ${performance.conversionRate > 65 ? 'Yüksek Başarı 🎯' : 'Ortalama Başarı 📊'}

🚀 **Performans Artırma Stratejileri:**
• Premium hizmet paketleri geliştir
• Müşteri yaşam döngüsü değerini artır
• Çapraz satış fırsatlarını değerlendir
• Danışman eğitim programları düzenle`;
  };

  const generateTrendsAnalysis = (clients, payments) => {
    // Son 6 ayın verilerini analiz et
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyData = {};
    for (let i = 5; i >= 0; i--) {
      const month = new Date();
      month.setMonth(month.getMonth() - i);
      const monthKey = month.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' });
      monthlyData[monthKey] = { clients: 0, revenue: 0 };
    }

    clients.forEach(client => {
      const clientMonth = new Date(client.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' });
      if (monthlyData[clientMonth]) {
        monthlyData[clientMonth].clients++;
      }
    });

    payments.filter(p => p.status === 'completed').forEach(payment => {
      const paymentMonth = new Date(payment.payment_date || payment.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' });
      if (monthlyData[paymentMonth]) {
        monthlyData[paymentMonth].revenue += parseFloat(payment.amount) || 0;
      }
    });

    const trendData = Object.entries(monthlyData);
    const lastThreeMonths = trendData.slice(-3);
    const avgClients = lastThreeMonths.reduce((sum, [, data]) => sum + data.clients, 0) / 3;
    const avgRevenue = lastThreeMonths.reduce((sum, [, data]) => sum + data.revenue, 0) / 3;

    return `📈 **6 Aylık Trend Analizi**

📊 **Aylık Performans Trendi:**
${trendData.map(([month, data]) => `• ${month}: ${data.clients} müşteri, ₺${data.revenue.toLocaleString('tr-TR')}`).join('\n')}

🎯 **Son 3 Ay Ortalaması:**
• Aylık Ortalama Müşteri: ${avgClients.toFixed(1)}
• Aylık Ortalama Gelir: ₺${avgRevenue.toLocaleString('tr-TR')}

📈 **Trend Değerlendirmesi:**
${(() => {
  const firstHalf = trendData.slice(0, 3).reduce((sum, [, data]) => sum + data.clients, 0);
  const secondHalf = trendData.slice(3, 6).reduce((sum, [, data]) => sum + data.clients, 0);
  const growth = ((secondHalf - firstHalf) / firstHalf * 100).toFixed(1);
  
  if (growth > 20) return '🚀 Güçlü Büyüme Trendi - Harika!';
  if (growth > 10) return '📈 Pozitif Büyüme Trendi - İyi';
  if (growth > 0) return '📊 Hafif Büyüme - Stabil';
  return '📉 Yavaşlama - Dikkat Gerekli';
})()}

🔮 **Gelecek Öngörüleri:**
• Trend devam ederse, gelecek ay beklenen müşteri: ~${Math.round(avgClients)}
• Gelir tahmini: ~₺${Math.round(avgRevenue).toLocaleString('tr-TR')}
• Sezonsal faktörler ve pazar koşulları takip edilmeli`;
  };

  const generateDetailedAppointmentAnalysis = (clients, params) => {
    const { details } = params;
    let result = `📅 **Detaylı Randevu Analizi**\n\n`;

    const today = new Date();
    const clientsWithAppointments = clients.filter(c => c.appointment_date);

    if (details.includes('recent')) {
      const upcomingAppointments = clientsWithAppointments
        .filter(c => new Date(c.appointment_date) > today)
        .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
        .slice(0, 10);

      result += `🗓️ **Yaklaşan Randevular:**\n`;
      if (upcomingAppointments.length === 0) {
        result += '• Yaklaşan randevu yok\n\n';
      } else {
        upcomingAppointments.forEach(c => {
          const date = new Date(c.appointment_date).toLocaleDateString('tr-TR');
          const time = c.appointment_time || 'Saat belirtilmemiş';
          result += `• ${c.name} - ${date} ${time} (${c.country || 'Ülke yok'})\n`;
        });
        result += '\n';
      }
    }

    if (details.includes('by_status')) {
      const appointmentStats = {
        upcoming: clientsWithAppointments.filter(c => new Date(c.appointment_date) > today).length,
        past: clientsWithAppointments.filter(c => new Date(c.appointment_date) < today).length,
        today: clientsWithAppointments.filter(c => {
          const appointmentDate = new Date(c.appointment_date);
          return appointmentDate.toDateString() === today.toDateString();
        }).length
      };

      result += `📊 **Randevu Durum Dağılımı:**\n`;
      result += `• Bugün: ${appointmentStats.today}\n`;
      result += `• Gelecek: ${appointmentStats.upcoming}\n`;
      result += `• Geçmiş: ${appointmentStats.past}\n\n`;
    }

    return result || 'Randevu analizi için veri bulunamadı.';
  };

  const generateDetailedConsultantAnalysis = (consultants, clients, params) => {
    const { details } = params;
    let result = `👥 **Detaylı Danışman Analizi**\n\n`;

    if (details.includes('top')) {
      const consultantsWithMetrics = consultants
        .map(consultant => {
          const consultantClients = clients.filter(c => c.consultant_id === consultant.id);
          return {
            ...consultant,
            clientCount: consultantClients.length,
            activeClients: consultantClients.filter(c => c.status === 'active').length
          };
        })
        .sort((a, b) => b.clientCount - a.clientCount)
        .slice(0, 5);

      result += `🏆 **En Başarılı Danışmanlar:**\n`;
      consultantsWithMetrics.forEach((consultant, index) => {
        result += `${index + 1}. ${consultant.name}: ${consultant.clientCount} müşteri (${consultant.activeClients} aktif)\n`;
      });
      result += '\n';
    }

    if (details.includes('by_status')) {
      const statusCounts = consultants.reduce((acc, consultant) => {
        const status = consultant.status || 'Belirtilmemiş';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      result += `📊 **Danışman Durum Dağılımı:**\n`;
      Object.entries(statusCounts).forEach(([status, count]) => {
        result += `• ${status}: ${count}\n`;
      });
      result += '\n';
    }

    return result || 'Danışman analizi için veri bulunamadı.';
  };

  const generateDetailedDocumentAnalysis = (documents, clients, params) => {
    const { details } = params;
    let result = `📁 **Detaylı Belge Analizi**\n\n`;

    if (details.includes('by_type')) {
      const typeCounts = documents.reduce((acc, doc) => {
        const type = doc.type || 'Belirtilmemiş';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      result += `📋 **Belge Türü Dağılımı:**\n`;
      Object.entries(typeCounts).forEach(([type, count]) => {
        const typeNames = {
          'identity': 'Kimlik Belgeleri',
          'education': 'Eğitim Belgeleri',
          'employment': 'İş Belgeleri',
          'financial': 'Mali Belgeler',
          'medical': 'Sağlık Belgeleri',
          'other': 'Diğer'
        };
        result += `• ${typeNames[type] || type}: ${count}\n`;
      });
      result += '\n';
    }

    if (details.includes('by_status')) {
      const statusCounts = documents.reduce((acc, doc) => {
        const status = doc.status || 'Belirtilmemiş';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      result += `📊 **Belge Durum Dağılımı:**\n`;
      Object.entries(statusCounts).forEach(([status, count]) => {
        const percentage = ((count / documents.length) * 100).toFixed(1);
        result += `• ${status}: ${count} (%${percentage})\n`;
      });
      result += '\n';
    }

    if (details.includes('recent')) {
      const recentDocs = documents
        .filter(doc => {
          const uploadDate = new Date(doc.uploadedDate || doc.created_at);
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return uploadDate > oneWeekAgo;
        })
        .sort((a, b) => new Date(b.uploadedDate || b.created_at) - new Date(a.uploadedDate || a.created_at))
        .slice(0, 10);

      result += `🆕 **Son Yüklenen Belgeler (7 gün):**\n`;
      if (recentDocs.length === 0) {
        result += '• Son 7 günde belge yüklenmedi\n\n';
      } else {
        recentDocs.forEach(doc => {
          const date = new Date(doc.uploadedDate || doc.created_at).toLocaleDateString('tr-TR');
          result += `• ${doc.name || 'İsimsiz'} - ${doc.clientName || 'Müşteri yok'} (${date})\n`;
        });
        result += '\n';
      }
    }

    return result || 'Belge analizi için veri bulunamadı.';
  };

  // AI konfigürasyonunu localStorage'dan yükle
  useEffect(() => {
    const savedConfig = localStorage.getItem('chatbot_ai_config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setAiConfig(config);
      } catch (error) {
        console.error('AI config yükleme hatası:', error);
      }
    }
  }, []);

  // AI konfigürasyonunu kaydet
  const saveAiConfig = (config) => {
    setAiConfig(config);
    localStorage.setItem('chatbot_ai_config', JSON.stringify(config));
  };

  // AI ayarları modalını aç
  const openAISettings = () => {
    setTempAiConfig(aiConfig);
    setShowAISettings(true);
  };

  // AI ayarlarını kaydet
  const handleSaveAISettings = () => {
    saveAiConfig(tempAiConfig);
    setShowAISettings(false);
  };

  // API key test et
  const testAPIConnection = async () => {
    if (!tempAiConfig.apiKey.trim()) {
      alert('Lütfen API key girin!');
      return;
    }

    setIsTestingAPI(true);
    try {
      const result = await AIService.testConnection(tempAiConfig.apiKey, tempAiConfig.provider);
      
      if (result.success) {
        alert('✅ API bağlantısı başarılı!');
      } else {
        alert(`❌ API bağlantısı başarısız: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Test hatası: ${error.message}`);
    } finally {
      setIsTestingAPI(false);
    }
  };

  // Hibrit AI yanıt oluşturma
  const generateHybridResponse = async (message, crmData) => {


    // Smart Mode aktifse önce SmartQueryService'i dene
    if (smartMode && aiConfig.useAI && aiConfig.apiKey) {
      console.log('🧠 Smart AI ile analiz yapılıyor...');
      
      try {
        // Direkt SmartQueryService kullan (en basit ve etkili)
        console.log('🔄 SmartQueryService ile direkt analiz...');
        const directResult = await SmartQueryService.ask(message, aiConfig.apiKey);
        
        if (directResult.success) {
          console.log('✅ SmartQueryService başarılı');
          return directResult.response;
        }
        
        console.warn('Smart Query başarısız, klasik AI\'ya geçiliyor');
      } catch (error) {
        console.error('Smart Query sistemi hatası:', error);
      }
    }

    // Klasik AI sistemi (eski yöntem)
    if (aiConfig.useAI && aiConfig.apiKey) {
      console.log('🤖 Klasik OpenAI ile analiz yapılıyor...');
      
      try {
        const aiResult = await AIService.generateCRMAnalysis(message, crmData, aiConfig);
        
        if (aiResult.success) {
          return `🔍 **Yöntem:** Klasik AI\n\n${aiResult.response}`;
        } else {
          console.warn('AI hatası, yerel analize geçiliyor:', aiResult.error);
          // AI başarısız olursa yerel analiz kullan
          return await generateOptimizedLocalResponse(message, crmData);
        }
      } catch (error) {
        console.error('AI servisi hatası:', error);
        // Hata durumunda yerel sisteme geri dön
        return await generateOptimizedLocalResponse(message, crmData);
      }
    } else {
      // AI aktif değilse yerel analiz kullan
      return await generateOptimizedLocalResponse(message, crmData);
    }
  };

  // Optimize edilmiş yerel yanıt (kısa ve net)
  const generateOptimizedLocalResponse = async (message, crmData) => {
    const originalResponse = await generateAIResponse(message, crmData);
    
    // Uzun yanıtları kısalt ve önemli noktaları vurgula
    const lines = originalResponse.split('\n');
    const shortResponse = [];
    
    let bulletCount = 0;
    for (const line of lines) {
      if (line.includes('**') || line.includes('•') || line.includes('📊') || line.includes('💰') || line.includes('📈')) {
        if (bulletCount < 4) { // Maksimum 4 önemli nokta
          shortResponse.push(line.replace(/•/g, '**•**')); // Bullet'ları bold yap
          bulletCount++;
        }
      } else if (line.includes('🔥') || line.includes('⚠️') || line.includes('✅')) {
        shortResponse.push(`**${line}**`); // Uyarı/başarı mesajlarını bold yap
      }
    }
    
    return shortResponse.slice(0, 8).join('\n'); // Maksimum 8 satır
  };

  // Geri bildirim işleme
  const handleFeedback = async (messageId, feedbackType) => {
    try {
      // Mesajı bul
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      // Geri bildirimi kaydet
      await AITrainingService.saveFeedback(
        message.question || '',
        message.content,
        feedbackType
      );

      // Mesajı güncelle
      setMessages(prevMessages => 
        prevMessages.map(m => 
          m.id === messageId 
            ? { ...m, feedback: feedbackType }
            : m
        )
      );

      console.log(`✅ Geri bildirim kaydedildi: ${feedbackType} (Mesaj ID: ${messageId})`);
    } catch (error) {
      console.error('❌ Geri bildirim kaydetme hatası:', error);
    }
  };

  // Mesaj gönder
  const handleSendMessage = async (message = inputValue) => {
    if (!message.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // CRM verilerini analiz et
      const crmData = await analyzeCRMData();
      
      if (!crmData) {
        throw new Error('Veri analizi yapılamadı');
      }

      // Hibrit AI yanıtı oluştur (OpenAI + Yerel)
      const aiResponse = await generateHybridResponse(message, crmData);

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: aiResponse,
        question: message, // Geri bildirim için soruyu kaydet
        timestamp: new Date()
      };

      setTimeout(() => {
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
      }, 1000);

    } catch (error) {
      console.error('AI yanıt hatası:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: '❌ Üzgünüm, şu anda analiz yapamıyorum. Lütfen daha sonra tekrar deneyin.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  // Enter tuşu ile gönder
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-black to-gray-800 text-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-3 rounded-full">
              <Bot size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Asistanı</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {isAnalyzing && (
              <div className="flex items-center space-x-2 text-blue-100">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Analiz ediliyor...</span>
              </div>
            )}
            
            {/* Smart Mode artık her zaman aktif */}


            
            <button
              onClick={openAISettings}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
              title="AI Ayarları"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Hızlı Analiz Butonları */}
      <div className="p-4 bg-gray-50 border-b">
        <p className="text-sm text-gray-600 mb-3">Hızlı analiz için:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {quickAnalysisButtons.map((button, index) => (
            <button
              key={index}
              onClick={() => handleSendMessage(button.prompt)}
              disabled={isLoading}
              className="flex items-center space-x-2 p-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-sm disabled:opacity-50"
            >
              <button.icon size={16} className="text-black" />
              <span className="text-gray-700">{button.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Mesajları */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex space-x-3 max-w-4xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.type === 'user' 
                  ? 'bg-gray-200' 
                  : 'bg-gray-300'
              }`}>
                {message.type === 'user' ? (
                  <User size={16} className="text-black" />
                ) : (
                  <Sparkles size={16} className="text-black" />
                )}
              </div>

              {/* Mesaj İçeriği */}
              <div className={`rounded-2xl p-4 shadow-sm ${
                message.type === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white border border-gray-200'
              }`}>
                <div className={`whitespace-pre-wrap ${message.type === 'user' ? 'text-white' : 'text-gray-800'}`}>
                  {message.type === 'bot' ? (
                    <div>
                      <div dangerouslySetInnerHTML={{
                        __html: message.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **text** → <strong>text</strong>
                          .replace(/\n/g, '<br />') // Satır sonlarını <br> yap
                      }} />
                      
                      {/* Geri bildirim butonları */}
                      {message.id > 1 && !message.feedback && (
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
                          <span className="text-xs text-gray-500">Bu cevap yararlı mıydı?</span>
                          <button
                            onClick={() => handleFeedback(message.id, 'good')}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="İyi"
                          >
                            👍
                          </button>
                          <button
                            onClick={() => handleFeedback(message.id, 'bad')}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Kötü"
                          >
                            👎
                          </button>
                        </div>
                      )}
                      
                      {/* Geri bildirim sonucu */}
                      {message.feedback && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          {message.feedback === 'good' && (
                            <span className="flex items-center gap-1">
                              <Check size={12} className="text-green-600" />
                              Teşekkürler! Geri bildiriminiz kaydedildi.
                            </span>
                          )}
                          {message.feedback === 'bad' && (
                            <span className="flex items-center gap-1">
                              <X size={12} className="text-red-600" />
                              Geri bildiriminiz kaydedildi. Daha iyi hizmet için çalışıyoruz.
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    message.content
                  )}
                </div>
                <div className={`text-xs mt-2 ${
                  message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString('tr-TR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex space-x-3 max-w-4xl">
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                <Sparkles size={16} className="text-black" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Loader2 size={16} className="animate-spin text-blue-500" />
                  <span className="text-gray-600">Analiz ediyorum...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Vize danışmanlığı hakkında soru sorun... (örn: Bu ay kimlerin randevusu var?, Son ödemeler neler?, Ayşe'nin belgeleri onaylandı mı?)"
              disabled={isLoading}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              rows="2"
            />
          </div>
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            className="bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          💡 🧠 Smart AI - Akıllı hibrit sistem • {aiConfig.useAI ? 'OpenAI entegrasyonu' : 'Yerel analiz'} • Sadece vize danışmanlığı verilerinize dayanır
        </p>
      </div>

      {/* AI Ayarları Modal */}
      {showAISettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">AI Ayarları</h3>
              <button
                onClick={() => setShowAISettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* AI Kullanımı Toggle */}
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={tempAiConfig.useAI}
                    onChange={(e) => setTempAiConfig(prev => ({
                      ...prev,
                      useAI: e.target.checked
                    }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">OpenAI ile Gelişmiş Analiz</span>
                </label>
                <p className="text-xs text-gray-500 ml-7">
                  RAG + SQL hibrit sistemi için OpenAI API kullan
                </p>
              </div>

              {/* Smart Mode her zaman aktif */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">🧠</span>
                  <span className="text-sm font-medium text-green-800">Smart AI Modu (RAG + SQL) - Her Zaman Aktif</span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Sistem otomatik olarak en uygun analiz yöntemini seçer
                </p>
              </div>

              {/* Provider Seçimi */}
              <div>
                <label className="block text-sm font-medium mb-1">AI Sağlayıcı</label>
                <select
                  value={tempAiConfig.provider}
                  onChange={(e) => setTempAiConfig(prev => ({
                    ...prev,
                    provider: e.target.value
                  }))}
                  disabled={!tempAiConfig.useAI}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="openai">OpenAI (ChatGPT)</option>
                  <option value="claude">Anthropic Claude</option>
                  <option value="gemini">Google Gemini</option>
                </select>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {tempAiConfig.provider === 'openai' ? 'OpenAI API Key' : 
                   tempAiConfig.provider === 'claude' ? 'Claude API Key' : 
                   'Gemini API Key'}
                </label>
                <input
                  type="password"
                  value={tempAiConfig.apiKey}
                  onChange={(e) => setTempAiConfig(prev => ({
                    ...prev,
                    apiKey: e.target.value
                  }))}
                  disabled={!tempAiConfig.useAI}
                  placeholder={`${tempAiConfig.provider} API key'inizi girin`}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  API key'iniz güvenli şekilde tarayıcınızda saklanır
                </p>
              </div>

              {/* API Test */}
              {tempAiConfig.useAI && tempAiConfig.apiKey && (
                <div>
                  <button
                    onClick={testAPIConnection}
                    disabled={isTestingAPI}
                    className="w-full bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600 disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {isTestingAPI ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Test Ediliyor...</span>
                      </>
                    ) : (
                      <>
                        <span>API Bağlantısını Test Et</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* API Key Alma Linki */}
              {tempAiConfig.useAI && (
                <div className="text-xs text-gray-600">
                  <p className="font-medium mb-1">API Key nasıl alınır:</p>
                  {tempAiConfig.provider === 'openai' && (
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      OpenAI Platform → API Keys
                    </a>
                  )}
                  {tempAiConfig.provider === 'claude' && (
                    <a href="https://console.anthropic.com/account/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Anthropic Console → API Keys
                    </a>
                  )}
                  {tempAiConfig.provider === 'gemini' && (
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Google AI Studio → API Keys
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Modal Butonlar */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAISettings(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
              >
                İptal
              </button>
              <button
                onClick={handleSaveAISettings}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 flex items-center justify-center space-x-2"
              >
                <Check size={16} />
                <span>Kaydet</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
