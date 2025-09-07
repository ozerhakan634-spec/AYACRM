// AI Service - External AI API entegrasyonu
export class AIService {
  static async callOpenAI(messages, apiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: messages,
          max_tokens: 2000,
          temperature: 0.7,
          stream: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API Error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return {
        success: true,
        response: data.choices[0].message.content,
        usage: data.usage
      };
    } catch (error) {
      console.error('OpenAI API çağrısı hatası:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async callClaude(messages, apiKey) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 2000,
          messages: messages.filter(m => m.role !== 'system').map(m => ({
            role: m.role,
            content: m.content
          })),
          system: messages.find(m => m.role === 'system')?.content || ''
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Claude API Error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return {
        success: true,
        response: data.content[0].text,
        usage: data.usage
      };
    } catch (error) {
      console.error('Claude API çağrısı hatası:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async callGemini(messages, apiKey) {
    try {
      // Gemini API için message formatını dönüştür
      const contents = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

      const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
      if (systemPrompt) {
        contents.unshift({
          role: 'user',
          parts: [{ text: systemPrompt }]
        });
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API Error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return {
        success: true,
        response: data.candidates[0].content.parts[0].text,
        usage: data.usageMetadata
      };
    } catch (error) {
      console.error('Gemini API çağrısı hatası:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async generateCRMAnalysis(userQuestion, crmData, config) {
    const { apiKey, provider = 'openai', useAI = false } = config;

    if (!useAI || !apiKey) {
      throw new Error('AI servisi aktif değil veya API key eksik');
    }

    // CRM verilerini özetle
    const dataSummary = this.summarizeCRMData(crmData);
    
    // AI için mesajları hazırla
    const messages = [
      {
        role: 'system',
        content: `Sen bir CRM tabanlı Vize Asistanısın. Görevin CRM sistemindeki sayfalardan gelen verileri kullanarak kullanıcının sorularına kısa, net ve doğru cevap vermektir.

SADECE ŞU CRM VERİLERİNİ KULLAN:
${dataSummary}

Kullanabileceğin CRM sayfaları:
- Müşteriler: isim, başvuru numarası, iletişim, ülke, vize tipi, randevu tarihi, danışman bilgisi
- Belgeler: yüklenen evraklar, durum (beklemede, onaylı, reddedildi), müşteri ile ilişkisi
- Takvim: müşteri randevuları (tarih, saat, ülke, vize türü)
- Raporlar: genel istatistikler ve özetler
- Finans: ödemeler (müşteri, tutar, para birimi, tarih, durum)
- Danışmanlar: danışmanların müşteri sayısı, performansı, iletişim bilgileri
- Takım Yönetimi: ekip üyeleri ve görevleri

Davranış Kuralları:
- Cevaplarını sadece yukarıdaki verilere dayandır
- Yanıtlar kısa ve net olsun (2-3 cümle)
- Tarihleri okunabilir biçimde yaz (örn: 12 Ekim 2025)
- Bilgi yoksa "kayıtlarda bulunmuyor" de
- Kişisel bilgiler (TC, pasaport, adres) sadece açıkça sorulursa ve kayıt varsa göster
- Asla farklı kişilerin bilgilerini karıştırma
- Rolünü vize danışmanı gibi düşün: resmi, anlaşılır ve yardımcı bir dille yanıt ver
- Önemli bilgileri **bold** yap`
      },
      {
        role: 'assistant',
        content: 'Yukarıdaki CRM verilerini okudum. Randevu, müşteri, gelir ve diğer tüm bilgileri analiz edebilirim. Hangi konuda yardım istersiniz?'
      },
      {
        role: 'user',
        content: userQuestion
      }
    ];

    // Seçilen AI servisini çağır
    switch (provider.toLowerCase()) {
      case 'openai':
        return await this.callOpenAI(messages, apiKey);
      case 'claude':
        return await this.callClaude(messages, apiKey);
      case 'gemini':
        return await this.callGemini(messages, apiKey);
      default:
        throw new Error(`Desteklenmeyen AI provider: ${provider}`);
    }
  }

  static summarizeCRMData(crmData) {
    const { clients, consultants, documents, payments, summary } = crmData;

    // Temel istatistikler
    const stats = {
      totalClients: clients.length,
      activeClients: clients.filter(c => c.status === 'active').length,
      totalConsultants: consultants.length,
      totalPayments: payments.length,
      completedPayments: payments.filter(p => p.status === 'completed').length,
      totalRevenue: payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
      totalDocuments: documents.length,
      pendingDocuments: documents.filter(d => d.status === 'pending').length
    };

    // Ülke dağılımı
    const countryStats = clients.reduce((acc, client) => {
      const country = client.country || 'Belirtilmemiş';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {});

    const topCountries = Object.entries(countryStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Son 30 günün verileri
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentClients = clients.filter(c => new Date(c.created_at) > thirtyDaysAgo);
    const recentPayments = payments.filter(p => 
      new Date(p.payment_date || p.created_at) > thirtyDaysAgo && p.status === 'completed'
    );

    // Randevu bilgileri - detaylı analiz
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const appointmentStats = {
      total: clients.filter(c => c.appointment_date).length,
      upcoming: clients.filter(c => c.appointment_date && new Date(c.appointment_date) > today).length,
      today: clients.filter(c => {
        if (!c.appointment_date) return false;
        const appointmentDate = new Date(c.appointment_date);
        return appointmentDate.toDateString() === today.toDateString();
      }).length,
      thisMonth: clients.filter(c => {
        if (!c.appointment_date) return false;
        const appointmentDate = new Date(c.appointment_date);
        return appointmentDate.getMonth() === currentMonth && appointmentDate.getFullYear() === currentYear;
      }).length,
      thisMonthList: clients.filter(c => {
        if (!c.appointment_date) return false;
        const appointmentDate = new Date(c.appointment_date);
        return appointmentDate.getMonth() === currentMonth && appointmentDate.getFullYear() === currentYear;
      }).map(c => ({
        name: c.name,
        date: c.appointment_date,
        time: c.appointment_time || 'Saat belirtilmemiş',
        country: c.country || 'Ülke belirtilmemiş'
      }))
    };

    // Danışman performansı
    const consultantPerformance = consultants.map(consultant => {
      const consultantClients = clients.filter(c => c.consultant_id === consultant.id);
      return {
        name: consultant.name,
        clientCount: consultantClients.length,
        activeClients: consultantClients.filter(c => c.status === 'active').length
      };
    }).sort((a, b) => b.clientCount - a.clientCount);

    const currentDate = new Date();
    const currentMonthName = currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

    return `
=== TEMEL BİLGİLER ===
Toplam Müşteri: ${stats.totalClients}
Aktif Müşteri: ${stats.activeClients}
Danışman Sayısı: ${stats.totalConsultants}

=== RANDEVU BİLGİLERİ ===
Bugün Randevu: ${appointmentStats.today}
Bu Ay (${currentMonthName}) Randevu: ${appointmentStats.thisMonth}
Yaklaşan Randevular: ${appointmentStats.upcoming}

=== ${currentMonthName.toUpperCase()} AYININ RANDEVULARİ ===
${appointmentStats.thisMonthList.length > 0 ? 
  appointmentStats.thisMonthList.map((app, index) => 
    `${index + 1}. ${app.name} - ${new Date(app.date).getDate()}/${new Date(app.date).getMonth() + 1} ${app.time}`
  ).join('\n') : 
  'Bu ay hiç randevu YOK'
}

=== MALİ DURUM ===
Toplam Gelir: ${stats.totalRevenue.toLocaleString('tr-TR')} TL
Ödeme Sayısı: ${stats.totalPayments}
Tamamlanan Ödeme: ${stats.completedPayments}

=== SON 30 GÜN ===
Yeni Müşteri: ${recentClients.length}
Yeni Ödeme: ${recentPayments.length}
Yeni Gelir: ${recentPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0).toLocaleString('tr-TR')} TL

=== DANIŞMAN PERFORMANSI ===
${consultantPerformance.slice(0, 5).map((c, index) => `${index + 1}. ${c.name}: ${c.clientCount} müşteri`).join('\n')}

=== POPÜLER ÜLKELER ===
${topCountries.map(([country, count], index) => `${index + 1}. ${country}: ${count} müşteri`).join('\n')}

=== BELGE DURUMU ===
Toplam Belge: ${stats.totalDocuments}
Bekleyen İnceleme: ${stats.pendingDocuments}
`;
  }

  static async testConnection(apiKey, provider) {
    try {
      const testMessages = [
        {
          role: 'system',
          content: 'Sen bir test asistanısın. Sadece "Bağlantı başarılı!" yanıtını ver.'
        },
        {
          role: 'user',
          content: 'Test'
        }
      ];

      const result = await this.generateCRMAnalysis('Test', {
        clients: [],
        consultants: [],
        documents: [],
        payments: [],
        summary: {}
      }, { apiKey, provider, useAI: true });

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default AIService;
