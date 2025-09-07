import AIService from './aiService';
import { DatabaseService } from './database';
import { supabase } from '../config/supabase';
import { AITrainingService } from './aiTrainingService';
import SmartQueryService from './smartQueryService';

// Akıllı AI Sistemi - RAG + SQL Generation hibrit yaklaşım
export class SmartAIService {
  
  // Tüm CRM sayfalarından detaylı veri al
  static async getDetailedCRMData() {
    try {
      console.log('📊 Tüm CRM verilerini yüklüyor...');
      
      // Paralel veri yükleme - tüm sayfalardan
      const [
        clients,
        consultants, 
        documents,
        payments,
        calendarEvents,
        reports
      ] = await Promise.all([
        DatabaseService.getClients().catch(() => []),
        DatabaseService.getConsultantsWithClientCount().catch(() => []),
        DatabaseService.getAllDocumentsWithClients().catch(() => []),
        DatabaseService.getPayments().catch(() => []),
        DatabaseService.getCalendarEvents().catch(() => []),
        DatabaseService.getReports().catch(() => [])
      ]);

      console.log('✅ Veri yükleme tamamlandı:', {
        clients: clients.length,
        consultants: consultants.length,
        documents: documents.length,
        payments: payments.length,
        calendar: calendarEvents.length,
        reports: reports.length
      });

      return {
        clients: clients || [],
        consultants: consultants || [],
        documents: documents || [],
        payments: payments || [],
        calendar: calendarEvents || [],
        reports: reports || [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Detaylı veri yükleme hatası:', error);
      return {
        clients: [],
        consultants: [],
        documents: [],
        payments: [],
        calendar: [],
        reports: [],
        error: error.message
      };
    }
  }

  // Detaylı verileri AI için formatla
  static formatDetailedDataForAI(detailedData) {
    const { clients, consultants, documents, payments, calendar, reports } = detailedData;
    
    // Bugünün tarihi
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    return `
=== MÜŞTERİ VERİLERİ (${clients.length} kayıt) ===
${clients.slice(0, 20).map(c => {
  // Danışman ismini bul
  const consultant = consultants.find(cons => cons.id === c.consultant_id);
  const consultantName = consultant ? consultant.name : 'Atanmamış';
  
  // Doğum tarihi formatı
  const birthDate = c.birth_date || c.dogum_tarihi || c.birthDate || c.date_of_birth || 'Kayıtlı değil';
  const formattedBirthDate = birthDate !== 'Kayıtlı değil' ? new Date(birthDate).toLocaleDateString('tr-TR') : birthDate;
  
  return `${c.name} | BAŞVURU NO: ${c.application_number || 'Atanmamış'} | Email: ${c.email || 'Yok'} | Telefon: ${c.phone || 'Yok'} | TC: ${c.tc_no || c.kimlik_no || 'Yok'} | Doğum: ${formattedBirthDate} | Kullanıcı Adı: ${c.kullanici_adi || c.username || 'Yok'} | Ülke: ${c.country || 'Yok'} | Vize: ${c.visa_type || 'Yok'} | Hedef Ülke: ${c.hedef_ulke || c.target_country || 'Yok'} | Pasaport: ${c.passport_no || 'Yok'} | Durum: ${c.status} | Randevu: ${c.appointment_date || 'Yok'} | Saat: ${c.appointment_time || 'Yok'} | Danışman: ${consultantName} | Seyahat Amacı: ${c.seyahat_amaci || c.travel_purpose || 'Yok'} | İkamet: ${c.ikamet_adresi || c.address || 'Yok'} | Notlar: ${c.notes || c.notlar || 'Yok'} | Kayıt: ${c.created_at?.substring(0,10)} | (ID: ${c.id})`;
}).join('\n')}
${clients.length > 20 ? `\n... ve ${clients.length - 20} müşteri daha` : ''}

=== DANIŞMAN VERİLERİ (${consultants.length} kayıt) ===
${consultants.map(c => 
  `${c.name} (ID: ${c.id}) | Email: ${c.email || 'Email yok'} | Uzmanlık: ${c.specialty || 'Yok'} | Müşteri Sayısı: ${c.totalCases || 0} | Durum: ${c.status} | Kayıt: ${c.created_at?.substring(0,10)}`
).join('\n')}

=== DANIŞMAN-MÜŞTERİ EŞLEŞTİRMESİ ===
${consultants.map(consultant => {
  const assignedClients = clients.filter(c => c.consultant_id === consultant.id);
  return `**${consultant.name}** danışmanının müşterileri: ${assignedClients.length > 0 ? assignedClients.map(c => `${c.name} (${c.application_number || 'No yok'})`).join(', ') : 'Atanmış müşteri yok'}`;
}).join('\n')}

=== DANIŞMAN PERFORMANS DETAYLARI ===
${consultants.map(consultant => {
  // Bu danışmanın ödemelerini bul
  const consultantPayments = payments.filter(p => p.consultantId === consultant.id || p.consultantName === consultant.name);
  const completedPayments = consultantPayments.filter(p => p.status === 'completed');
  
  // Para birimi dönüşümleri
  let totalRevenueTRY = 0;
  const currencyBreakdown = {};
  
  completedPayments.forEach(p => {
    const amount = parseFloat(p.amount) || 0;
    const currency = p.currency || 'TRY';
    
    // Para birimi breakdown
    if (!currencyBreakdown[currency]) currencyBreakdown[currency] = 0;
    currencyBreakdown[currency] += amount;
    
    // TRY'ye çevir
    if (currency === 'EUR') totalRevenueTRY += amount * 48.09;
    else if (currency === 'USD') totalRevenueTRY += amount * 40.99;
    else if (currency === 'GBP') totalRevenueTRY += amount * 55.53;
    else totalRevenueTRY += amount; // TRY
  });
  
  const currencyDetails = Object.entries(currencyBreakdown)
    .map(([curr, amt]) => `${amt.toLocaleString('tr-TR')} ${curr}`)
    .join(' + ');
  
  return `**${consultant.name}** PERFORMANS:
- Toplam Ödeme: ${consultantPayments.length} (Tamamlanan: ${completedPayments.length})
- Toplam Gelir: ${totalRevenueTRY.toLocaleString('tr-TR')} TL
- Para Birimi Detay: ${currencyDetails || 'Hiç ödeme yok'}
- Müşteri Sayısı: ${clients.filter(c => c.consultant_id === consultant.id).length}
- Ödemeli Müşteriler: ${completedPayments.map(p => p.clientName).join(', ') || 'Yok'}`;
}).join('\n\n')}

=== TÜM ÖDEME VERİLERİ (${payments.length} kayıt) ===
${payments.slice(0, 30).map(p => {
  // Müşterinin mevcut olup olmadığını kontrol et
  const isCurrentClient = clients.some(c => c.id === p.clientId);
  const clientStatus = isCurrentClient ? '(Aktif Müşteri)' : '(Eski/Silinmiş Müşteri)';
  
  return `ÖDEME ID: ${p.id} | Müşteri: ${p.clientName || 'İsimsiz'} ${clientStatus} | Tutar: ${p.amount} ${p.currency} | Durum: ${p.status} | Ödeme Tarihi: ${p.paymentDate || p.created_at?.substring(0,10)} | Tip: ${p.paymentType || 'Belirtilmemiş'} | Yöntem: ${p.paymentMethod || 'Belirtilmemiş'} | Danışman: ${p.consultantName || 'Atanmamış'} | Fatura No: ${p.invoiceNumber || 'Yok'}`;
}).join('\n')}
${payments.length > 30 ? `\n... ve ${payments.length - 30} ödeme daha` : ''}

=== AKTİF MÜŞTERİ ÖDEMELERİ ===
${payments.filter(p => clients.some(c => c.id === p.clientId)).slice(0, 15).map(p => 
  `${p.clientName} | ${p.amount} ${p.currency} | ${p.status} | ${p.paymentDate?.substring(0,10)}`
).join('\n')}

=== ESKİ/SİLİNMİŞ MÜŞTERİ ÖDEMELERİ ===
${payments.filter(p => !clients.some(c => c.id === p.clientId)).slice(0, 15).map(p => 
  `${p.clientName} (ID: ${p.clientId}) | ${p.amount} ${p.currency} | ${p.status} | ${p.paymentDate?.substring(0,10)}`
).join('\n') || 'Eski müşteri ödemesi yok'}

=== FİNANS İSTATİSTİKLERİ ===

** GENEL İSTATİSTİKLER **
Toplam Ödeme Sayısı: ${payments.length}
Tamamlanan Ödemeler: ${payments.filter(p => p.status === 'completed').length}
Bekleyen Ödemeler: ${payments.filter(p => p.status === 'pending').length}
İade Edilen: ${payments.filter(p => p.status === 'cancelled').length}
Toplam Gelir (TL): ${payments.filter(p => p.status === 'completed').reduce((sum, p) => {
  let amountInTRY = parseFloat(p.amount) || 0;
  if (p.currency === 'EUR') amountInTRY = (parseFloat(p.amount) || 0) * 48.09;
  if (p.currency === 'USD') amountInTRY = (parseFloat(p.amount) || 0) * 40.99;
  if (p.currency === 'GBP') amountInTRY = (parseFloat(p.amount) || 0) * 55.53;
  return sum + amountInTRY;
}, 0).toLocaleString('tr-TR')} TL

** AKTİF MÜŞTERİ İSTATİSTİKLERİ **
${(() => {
  const activeClientPayments = payments.filter(p => clients.some(c => c.id === p.clientId));
  const completedActive = activeClientPayments.filter(p => p.status === 'completed');
  const activeRevenue = completedActive.reduce((sum, p) => {
    let amountInTRY = parseFloat(p.amount) || 0;
    if (p.currency === 'EUR') amountInTRY = (parseFloat(p.amount) || 0) * 48.09;
    if (p.currency === 'USD') amountInTRY = (parseFloat(p.amount) || 0) * 40.99;
    if (p.currency === 'GBP') amountInTRY = (parseFloat(p.amount) || 0) * 55.53;
    return sum + amountInTRY;
  }, 0);
  
  return `Aktif Müşteri Ödemeleri: ${activeClientPayments.length}
Aktif Müşteri Geliri: ${activeRevenue.toLocaleString('tr-TR')} TL`;
})()}

** ESKİ MÜŞTERİ İSTATİSTİKLERİ **
${(() => {
  const oldClientPayments = payments.filter(p => !clients.some(c => c.id === p.clientId));
  const completedOld = oldClientPayments.filter(p => p.status === 'completed');
  const oldRevenue = completedOld.reduce((sum, p) => {
    let amountInTRY = parseFloat(p.amount) || 0;
    if (p.currency === 'EUR') amountInTRY = (parseFloat(p.amount) || 0) * 48.09;
    if (p.currency === 'USD') amountInTRY = (parseFloat(p.amount) || 0) * 40.99;
    if (p.currency === 'GBP') amountInTRY = (parseFloat(p.amount) || 0) * 55.53;
    return sum + amountInTRY;
  }, 0);
  
  return `Eski Müşteri Ödemeleri: ${oldClientPayments.length}
Eski Müşteri Geliri: ${oldRevenue.toLocaleString('tr-TR')} TL`;
})()}

=== BELGE VERİLERİ (${documents.length} kayıt) ===
${documents.slice(0, 25).map(d => 
  `ID: ${d.id} | ${d.name || 'İsimsiz'} | Tür: ${d.type} | Durum: ${d.status} | Müşteri: ${d.clientName || 'Müşteri yok'} | Yükleme: ${d.uploadedDate?.substring(0,10) || d.created_at?.substring(0,10)}`
).join('\n')}
${documents.length > 25 ? `\n... ve ${documents.length - 25} belge daha` : ''}

=== TAKVİM/RANDEVU VERİLERİ (${calendar.length} kayıt) ===
${calendar.slice(0, 20).map(e => 
  `ID: ${e.id} | ${e.title || 'Başlık yok'} | Tarih: ${e.event_date?.substring(0,16)} | Müşteri ID: ${e.client_id || 'Yok'} | Danışman ID: ${e.consultant_id || 'Yok'} | Durum: ${e.status}`
).join('\n')}
${calendar.length > 20 ? `\n... ve ${calendar.length - 20} etkinlik daha` : ''}

=== MÜŞTERİ RANDEVU BİLGİLERİ ===
${clients.filter(c => c.appointment_date).slice(0, 20).map(c => 
  `${c.name} | Randevu: ${c.appointment_date} ${c.appointment_time || ''} | Ülke: ${c.country} | Vize: ${c.visa_type} | Durum: ${c.status}`
).join('\n')}
${clients.filter(c => c.appointment_date).length > 20 ? `\n... ve ${clients.filter(c => c.appointment_date).length - 20} randevu daha` : ''}

=== BU AY RANDEVULARİ (${today.getMonth() + 1}. AY - ${['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'][today.getMonth()]}) ===
${clients.filter(c => {
  if (!c.appointment_date) return false;
  const appointmentDate = new Date(c.appointment_date);
  return appointmentDate.getMonth() === currentMonth && appointmentDate.getFullYear() === currentYear;
}).map(c => 
  `${c.name} (BAŞVURU NO: ${c.application_number || 'Atanmamış'}) - ${new Date(c.appointment_date).getDate()}/${new Date(c.appointment_date).getMonth() + 1}/${new Date(c.appointment_date).getFullYear()} ${c.appointment_time || 'Saat yok'} | Ülke: ${c.country} | Vize: ${c.visa_type} | Durum: ${c.status}`
).join('\n') || 'Bu ay hiç randevu YOK'}

=== TÜM RANDEVU TARİHLERİ (İLK 10) ===
${clients.filter(c => c.appointment_date).slice(0, 10).map((c, i) => {
  const appointmentDate = new Date(c.appointment_date);
  const monthNames = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  return `${i+1}. ${c.name} (BAŞVURU NO: ${c.application_number || 'Atanmamış'}) - ${appointmentDate.getDate()} ${monthNames[appointmentDate.getMonth()]} ${appointmentDate.getFullYear()} ${c.appointment_time || ''} | ${c.country}`;
}).join('\n') || 'Hiç randevu yok'}

=== DETAYLI MÜŞTERİ BİLGİLERİ ===
${clients.slice(0, 10).map(c => {
  const birthDate = c.birth_date || c.dogum_tarihi || c.birthDate || c.date_of_birth;
  const formattedBirthDate = birthDate ? new Date(birthDate).toLocaleDateString('tr-TR') : 'Kayıtlı değil';
  const consultant = consultants.find(cons => cons.id === c.consultant_id);
  
  return `
** ${c.name?.toUpperCase()} - ID: ${c.id} **
- Başvuru No: ${c.application_number || 'Atanmamış'}
- TC Kimlik: ${c.tc_no || c.kimlik_no || 'Kayıtlı değil'}
- Doğum Tarihi: ${formattedBirthDate}
- Email: ${c.email || 'Kayıtlı değil'}
- Telefon: ${c.phone || 'Kayıtlı değil'}
- Kullanıcı Adı: ${c.kullanici_adi || c.username || 'Kayıtlı değil'}
- Vize Türü: ${c.visa_type || 'Belirtilmemiş'}
- Hedef Ülke: ${c.hedef_ulke || c.target_country || c.country || 'Belirtilmemiş'}
- Pasaport No: ${c.passport_no || 'Kayıtlı değil'}
- Randevu: ${c.appointment_date || 'Randevu yok'} ${c.appointment_time || ''}
- Danışman: ${consultant?.name || 'Atanmamış'}
- Seyahat Amacı: ${c.seyahat_amaci || c.travel_purpose || 'Belirtilmemiş'}
- İkamet Adresi: ${c.ikamet_adresi || c.address || 'Kayıtlı değil'}
- Güvenlik Soruları: ${c.security_questions || c.guvenlik_sorulari || 'Kayıtlı değil'}
- Güvenlik Cevapları: ${c.security_answers || c.guvenlik_cevaplari || 'Kayıtlı değil'}
- Notlar: ${c.notes || c.notlar || 'Not yok'}
- Durum: ${c.status || 'Belirtilmemiş'}`;
}).join('\n')}

=== DOĞUM TARİHİ ANALİZİ ===
${(() => {
  const clientsWithBirthDate = clients.filter(c => c.birth_date || c.dogum_tarihi || c.birthDate || c.date_of_birth);
  const clientsWithoutBirthDate = clients.filter(c => !(c.birth_date || c.dogum_tarihi || c.birthDate || c.date_of_birth));
  
  return `Doğum Tarihi Olan: ${clientsWithBirthDate.length} müşteri
Doğum Tarihi Olmayan: ${clientsWithoutBirthDate.length} müşteri

** DOĞUM TARİHİ OLAN MÜŞTERİLER **
${clientsWithBirthDate.slice(0, 15).map(c => {
  const birthDate = c.birth_date || c.dogum_tarihi || c.birthDate || c.date_of_birth;
  const formattedDate = new Date(birthDate).toLocaleDateString('tr-TR');
  const today = new Date();
  const birth = new Date(birthDate);
  const age = today.getFullYear() - birth.getFullYear() - (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate()) ? 1 : 0);
  
  return `${c.name} - ${formattedDate} (${age} yaşında) | Ülke: ${c.country}`;
}).join('\n')}
${clientsWithBirthDate.length > 15 ? `... ve ${clientsWithBirthDate.length - 15} kişi daha` : ''}

** DOĞUM TARİHİ OLMAYAN MÜŞTERİLER **
${clientsWithoutBirthDate.slice(0, 10).map(c => 
  `${c.name} | Ülke: ${c.country} | BAŞVURU NO: ${c.application_number || 'Yok'}`
).join('\n')}
${clientsWithoutBirthDate.length > 10 ? `... ve ${clientsWithoutBirthDate.length - 10} kişi daha` : ''}`;
})()}

=== İSTATİSTİKLER ===
Toplam Müşteri: ${clients.length}
Aktif Müşteri: ${clients.filter(c => c.status === 'active').length}
Randevusu Olan: ${clients.filter(c => c.appointment_date).length}
Toplam Ödeme: ${payments.length}
Tamamlanan Ödeme: ${payments.filter(p => p.status === 'completed').length}
Toplam Gelir: ${payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0).toLocaleString('tr-TR')} TL
Bekleyen Belge: ${documents.filter(d => d.status === 'pending').length}
`;
  }

  // Soru tipini tespit et
  static classifyQuestion(question) {
    const lowerQuestion = question.toLowerCase();
    
    // SQL gerektiren sayısal/istatistiksel sorular
    const sqlKeywords = [
      'kaç', 'kadar', 'toplam', 'ortalama', 'en çok', 'en az', 'sayı', 'adet',
      'liste', 'sırala', 'göster', 'bul', 'hangi', 'kim', 'nerede', 'ne zaman',
      'count', 'sum', 'avg', 'max', 'min', 'group by', 'order by',
      'müşteri sayısı', 'gelir toplamı', 'randevu listesi', 'son eklenen'
    ];

    // RAG için genel analiz soruları
    const ragKeywords = [
      'nasıl', 'neden', 'analiz', 'değerlendir', 'öneri', 'strateji', 'tavsiye',
      'durum', 'performans', 'karşılaştır', 'trend', 'gelecek', 'tahmin',
      'ne yapmalı', 'iyileştir', 'optimize', 'artır', 'geliştir'
    ];

    const sqlScore = sqlKeywords.filter(keyword => lowerQuestion.includes(keyword)).length;
    const ragScore = ragKeywords.filter(keyword => lowerQuestion.includes(keyword)).length;

    // Hibrit sorular için özel kontrol
    const isHybrid = (sqlScore > 0 && ragScore > 0) || 
                     lowerQuestion.includes('analiz') ||
                     lowerQuestion.includes('rapor');

    return {
      type: isHybrid ? 'hybrid' : sqlScore > ragScore ? 'sql' : 'rag',
      sqlScore,
      ragScore,
      confidence: Math.max(sqlScore, ragScore) / Math.max(1, sqlScore + ragScore)
    };
  }

  // SQL sorgusu üret ve çalıştır
  static async generateAndExecuteSQL(question, schema) {
    try {
      // OpenAI ile SQL üret
      const sqlPrompt = `
Sen bir PostgreSQL uzmanısın. Aşağıdaki CRM veritabanı şemasına göre SQL sorgusu üret.

VERİTABANI ŞEMASI:
- clients: id, name, email, phone, country, visa_type, status, appointment_date, appointment_time, consultant_id, created_at
- consultants: id, name, email, specialty, status, created_at
- documents: id, name, type, status, clientId, created_at
- finance/payments: id, client_id, amount, currency, status, payment_date, created_at

KULLANICI SORUSU: ${question}

SADECE SQL SORGUSU VER (açıklama yok):
`;

      const sqlResult = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('openai_api_key')}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: sqlPrompt }],
          max_tokens: 500,
          temperature: 0.1
        })
      });

      if (!sqlResult.ok) {
        throw new Error('SQL generation failed');
      }

      const sqlData = await sqlResult.json();
      const generatedSQL = sqlData.choices[0].message.content.trim()
        .replace(/```sql/g, '')
        .replace(/```/g, '')
        .trim();

      console.log('🔍 Generated SQL:', generatedSQL);

      // SQL'i güvenli hale getir (sadece SELECT)
      if (!generatedSQL.toLowerCase().startsWith('select')) {
        throw new Error('Only SELECT queries are allowed');
      }

      // Supabase ile SQL çalıştır
      const { data, error } = await supabase.rpc('execute_sql', {
        sql_query: generatedSQL
      });

      if (error) {
        console.error('SQL execution error:', error);
        return {
          success: false,
          error: error.message,
          sql: generatedSQL
        };
      }

      return {
        success: true,
        data: data,
        sql: generatedSQL,
        rowCount: data?.length || 0
      };

    } catch (error) {
      console.error('SQL generation/execution error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // RAG: Mevcut verileri analiz et (Eğitim sistemli)
  static async performRAGAnalysis(question, crmData, apiKey) {
    try {
      // Tüm CRM verilerini detaylı al
      const detailedData = await this.getDetailedCRMData();
      const formattedData = this.formatDetailedDataForAI(detailedData);
      
      // Eğitim örnekleriyle gelişmiş prompt oluştur
      const basePromptData = `Sen bir CRM tabanlı Vize Asistanısın. Görevin aşağıdaki CRM sistemindeki sayfalardan gelen verileri kullanarak kullanıcının sorularına kısa, net ve doğru cevap vermektir.

=== TAMAMLANAN CRM VERİLERİ ===
${formattedData}
=== VERİ SONU ===

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
- **BAŞVURU NUMARASI** kullan (sistem ID değil!)
- **DANIŞMAN İSMİ** kullan (ID değil!)
- **ÇOK ÖNEMLİ**: Sorulan kişinin tam ismini kontrol et, başka kişinin bilgilerini ASLA verme!
- **İSİM KONTROLÜ**: Yanlış kişinin bilgilerini vermek kesinlikle yasak!
- Asla farklı kişilerin bilgilerini karıştırma
- Rolünü vize danışmanı gibi düşün: resmi, anlaşılır ve yardımcı bir dille yanıt ver
- Önemli bilgileri **bold** yap`;

      const enhancedPrompt = await AITrainingService.buildEnhancedPrompt(question, basePromptData);

      const result = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: enhancedPrompt }],
          max_tokens: 300,
          temperature: 0.7
        })
      });

      if (!result.ok) {
        throw new Error('RAG analysis failed');
      }

      const data = await result.json();
      return {
        success: true,
        response: data.choices[0].message.content
      };

    } catch (error) {
      console.error('RAG analysis error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Hibrit: SQL sonuçlarını RAG ile analiz et
  static async performHybridAnalysis(question, sqlResult, apiKey) {
    try {
      const hybridPrompt = `
Sen bir CRM analiz uzmanısın. SQL sorgusu sonuçlarını analiz et ve kullanıcıya anlamlı cevap ver.

KULLANICI SORUSU: ${question}

SQL SORGUSU: ${sqlResult.sql}

SQL SONUÇLARI:
${JSON.stringify(sqlResult.data, null, 2)}

Bu sonuçları analiz et ve kullanıcıya anlamlı, kısa bir cevap ver:
`;

      const result = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: hybridPrompt }],
          max_tokens: 400,
          temperature: 0.7
        })
      });

      if (!result.ok) {
        throw new Error('Hybrid analysis failed');
      }

      const data = await result.json();
      return {
        success: true,
        response: data.choices[0].message.content,
        sqlData: sqlResult.data,
        sqlQuery: sqlResult.sql
      };

    } catch (error) {
      console.error('Hybrid analysis error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Ana akıllı analiz fonksiyonu
  static async performSmartAnalysis(question, crmData, apiKey) {
    try {
      console.log('🧠 Smart AI Analysis başlıyor...');
      
      // Önce SmartQueryService ile deneyelim (daha hızlı ve direkt)
      try {
        console.log('⚡ SmartQueryService deneniyor...');
        const quickResult = await SmartQueryService.ask(question, apiKey);
        
        if (quickResult.success && quickResult.response && !quickResult.response.includes('anlayamadım')) {
          console.log('✅ SmartQueryService başarılı');
          return quickResult;
        }
      } catch (queryError) {
        console.warn('⚠️ SmartQueryService hatası, klasik analiz devam ediyor:', queryError);
      }
      
      // SmartQueryService başarısızsa klasik yöntemi kullan
      console.log('🔄 Klasik Smart Analysis devam ediyor...');
      
      // 1. Soru tipini tespit et
      const classification = this.classifyQuestion(question);
      console.log('🔍 Soru sınıflandırması:', classification);

      switch (classification.type) {
        case 'sql': {
          console.log('🗄️ SQL modunda analiz yapılıyor...');
          
          // SQL üret ve çalıştır
          const sqlResult = await this.generateAndExecuteSQL(question);
          
          if (!sqlResult.success) {
            // SQL başarısız olursa RAG'e geç
            console.log('⚠️ SQL başarısız, RAG moduna geçiliyor...');
            return await this.performRAGAnalysis(question, crmData, apiKey);
          }

          // SQL sonuçlarını formatla
          const formattedResponse = this.formatSQLResults(question, sqlResult);
          
          return {
            success: true,
            response: formattedResponse,
            method: 'SQL',
            data: sqlResult.data,
            sql: sqlResult.sql
          };
        }

        case 'hybrid': {
          console.log('🔄 Hibrit modda analiz yapılıyor...');
          
          // Önce SQL çalıştır
          const sqlResult = await this.generateAndExecuteSQL(question);
          
          if (sqlResult.success) {
            // SQL sonuçlarını RAG ile analiz et
            const hybridResult = await this.performHybridAnalysis(question, sqlResult, apiKey);
            
            if (hybridResult.success) {
              return {
                success: true,
                response: hybridResult.response,
                method: 'Hybrid (SQL + RAG)',
                data: sqlResult.data,
                sql: sqlResult.sql
              };
            }
          }
          
          // Hibrit başarısız olursa RAG'e geç
          return await this.performRAGAnalysis(question, crmData, apiKey);
        }

        case 'rag':
        default: {
          console.log('📊 RAG modunda analiz yapılıyor...');
          
          const ragResult = await this.performRAGAnalysis(question, crmData, apiKey);
          
          return {
            success: ragResult.success,
            response: ragResult.response,
            method: 'RAG',
            error: ragResult.error
          };
        }
      }

    } catch (error) {
      console.error('Smart Analysis error:', error);
      return {
        success: false,
        error: error.message,
        method: 'Error'
      };
    }
  }

  // SQL sonuçlarını formatla
  static formatSQLResults(question, sqlResult) {
    const { data, sql, rowCount } = sqlResult;
    
    if (!data || data.length === 0) {
      return '📊 **Sonuç:** Sorguya uygun veri bulunamadı.';
    }

    // Basit formatlama
    if (rowCount === 1 && Object.keys(data[0]).length === 1) {
      // Tek değer sonucu
      const value = Object.values(data[0])[0];
      return `📊 **Sonuç:** ${value}`;
    }

    if (rowCount <= 10) {
      // Küçük liste - detay göster
      const formatted = data.map((row, index) => {
        const values = Object.entries(row)
          .filter(([key, value]) => value !== null)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        return `${index + 1}. ${values}`;
      }).join('\n');
      
      return `📊 **Sonuç (${rowCount} kayıt):**\n${formatted}`;
    }

    // Büyük liste - özet göster
    return `📊 **Sonuç:** ${rowCount} kayıt bulundu. İlk 5 kayıt:\n${
      data.slice(0, 5).map((row, index) => {
        const mainValue = Object.values(row)[0] || Object.values(row)[1] || 'Veri';
        return `${index + 1}. ${mainValue}`;
      }).join('\n')
    }\n\n*Tüm sonuçları görmek için daha spesifik soru sorun.*`;
  }
}

export default SmartAIService;
