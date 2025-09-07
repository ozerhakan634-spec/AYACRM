import { supabase } from "../config/supabase";

export class SmartQueryService {
  static async ask(question, apiKey) {
    console.log("❓ Kullanıcı sorusu:", question);

    // Basit keyword bazlı modül seçimi
    const q = question.toLowerCase();
    let sql = null;

    if (q.includes("ödeme") || q.includes("para") || q.includes("tutar") || q.includes("tahsilat") || q.includes("gelir") || q.includes("kim yaptı") || q.includes("hangi kullanıcı")) {
      sql = `
        SELECT 
          p.client_id,
          COALESCE(c.name, p.clientName) as client_name,
          p.amount, 
          p.currency, 
          p.payment_date,
          p.status,
          p.payment_type,
          cons.name as consultant_name
        FROM payments p
        LEFT JOIN clients c ON p.client_id = c.id
        LEFT JOIN consultants cons ON p.consultant_id = cons.id
        ORDER BY p.payment_date DESC
        LIMIT 15;
      `;
    } else if (q.includes("randevu") || q.includes("takvim") || q.includes("appointment")) {
      sql = `
        SELECT 
          name, 
          appointment_date, 
          appointment_time,
          country,
          visa_type,
          status,
          application_number
        FROM clients
        WHERE appointment_date IS NOT NULL
        ORDER BY appointment_date ASC
        LIMIT 15;
      `;
    } else if (q.includes("belge") || q.includes("evrak") || q.includes("döküman")) {
      sql = `
        SELECT 
          d.name, 
          d.type, 
          d.status, 
          d.created_at,
          COALESCE(c.name, d.clientName) as client_name
        FROM documents d
        LEFT JOIN clients c ON d.clientId = c.id
        ORDER BY d.created_at DESC
        LIMIT 15;
      `;
    } else if (q.includes("müşteri") || q.includes("danışan") || q.includes("client") || q.includes("liste") || q.includes("hepsi")) {
      sql = `
        SELECT 
          name, 
          email, 
          phone,
          country, 
          visa_type,
          status,
          appointment_date,
          application_number,
          created_at
        FROM clients
        ORDER BY created_at DESC
        LIMIT 15;
      `;
    } else if (q.includes("danışman") || q.includes("consultant")) {
      sql = `
        SELECT 
          cons.name as consultant_name,
          cons.email,
          cons.specialty,
          COUNT(c.id) as client_count,
          COALESCE(SUM(p.amount), 0) as total_revenue
        FROM consultants cons
        LEFT JOIN clients c ON cons.id = c.consultant_id
        LEFT JOIN payments p ON cons.id = p.consultant_id AND p.status = 'completed'
        GROUP BY cons.id, cons.name, cons.email, cons.specialty
        ORDER BY client_count DESC;
      `;
    } else if (q.includes("doğum") || q.includes("yaş") || q.includes("birth")) {
      sql = `
        SELECT 
          name,
          birth_date,
          EXTRACT(YEAR FROM AGE(birth_date)) as age,
          country,
          visa_type
        FROM clients
        WHERE birth_date IS NOT NULL
        ORDER BY birth_date DESC
        LIMIT 15;
      `;
    } else if (q.includes("güvenlik") || q.includes("security") || q.includes("şifre")) {
      // Güvenlik bilgileri için özel sorgu
      sql = `
        SELECT 
          name,
          kullanici_adi,
          CASE 
            WHEN security_questions IS NOT NULL THEN 'Güvenlik soruları mevcut'
            ELSE 'Güvenlik soruları eksik'
          END as security_status
        FROM clients
        WHERE name ILIKE '%${q.replace(/[^a-zA-ZğĞıİşŞüÜöÖçÇ\s]/g, '')}%'
        LIMIT 10;
      `;
    } else {
      return { 
        success: false, 
        response: "🤖 **Bu soruyu anlayamadım.** Şu konularda yardımcı olabilirim:\n\n• **\"kim yaptı bu ödemeleri\"** - ödeme listesi\n• **\"bu ay kimlerin randevusu var\"** - randevu listesi\n• **\"müşteri listesi\"** - tüm müşteriler\n• **\"hangi belgeler bekliyor\"** - belge durumları\n• **\"danışman performansı\"** - danışman istatistikleri" 
      };
    }

    console.log("🔧 Çalıştırılacak SQL:", sql);

    // SQL çalıştır - RPC fonksiyonu yerine direkt sorgu
    let data, error;
    
    try {
      // Supabase'de direkt SQL çalıştırma
      const { data: result, error: sqlError } = await supabase.rpc("execute_sql", {
        sql_query: sql,
      });
      
      if (sqlError) {
        // RPC fonksiyonu yoksa normal sorgu deneyelim
        console.warn("⚠️ RPC çalışmadı, normal sorgu deneniyor...");
        
        // Basit sorgu fallback'i
        if (q.includes("ödeme")) {
          const { data: payments, error: paymentsError } = await supabase
            .from('payments')
            .select('*')
            .order('payment_date', { ascending: false })
            .limit(10);
          data = payments;
          error = paymentsError;
        } else if (q.includes("randevu")) {
          const { data: appointments, error: appointmentsError } = await supabase
            .from('clients')
            .select('name, appointment_date, appointment_time, country')
            .not('appointment_date', 'is', null)
            .order('appointment_date', { ascending: true })
            .limit(10);
          data = appointments;
          error = appointmentsError;
        } else {
          const { data: clients, error: clientsError } = await supabase
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
          data = clients;
          error = clientsError;
        }
      } else {
        data = result;
        error = null;
      }
    } catch (sqlError) {
      console.error("❌ SQL çalıştırma hatası:", sqlError);
      return { success: false, response: "Veritabanı sorgu hatası: " + sqlError.message };
    }

    if (error) {
      console.error("❌ Veritabanı hatası:", error);
      return { success: false, response: "Veritabanı hatası: " + error.message };
    }

    if (!data || data.length === 0) {
      return { success: true, response: "Bu konuda veri bulunamadı. 📊" };
    }

    console.log("✅ SQL sonuçları:", data?.length, "kayıt bulundu");

    // Kısa ve net cevap için OpenAI kullan
    const prompt = `
Sen bir CRM asistanısın. Kullanıcının sorusuna aşağıdaki verilere göre kısa ve net cevap ver.

Kullanıcı sorusu: ${question}

SQL sonuçları:
${JSON.stringify(data.slice(0, 10), null, 2)}

KURALLAR:
- Çok kısa ve net cevap (maksimum 3-4 cümle)
- Önemli sayıları **bold** yap
- En fazla 4-5 kayıt göster, fazlası için "...ve X kayıt daha" de
- Türkçe sayı formatı kullan (1.234 değil 1,234)
- Para birimi belirt (TL, EUR, USD)
- Tarih formatı: gün/ay/yıl
`;

    try {
      const result = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 250,
          temperature: 0.3,
        }),
      });

      if (!result.ok) {
        // OpenAI çalışmazsa basit özetleme
        return {
          success: true,
          response: `📊 **${data.length} kayıt** bulundu. Detaylı analiz için OpenAI bağlantısı gerekli.`
        };
      }

      const json = await result.json();
      return {
        success: true,
        response: json.choices[0].message.content.trim()
      };
      
    } catch (aiError) {
      console.error("❌ OpenAI hatası:", aiError);
      // AI çalışmazsa basit formatlama
      const summary = this.formatDataSummary(data, question);
      return {
        success: true,
        response: summary
      };
    }
  }

  // AI çalışmazsa basit özetleme
  static formatDataSummary(data, question) {
    const q = question.toLowerCase();
    
    if (q.includes("ödeme") || q.includes("para")) {
      const total = data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      return `💰 **${data.length} ödeme** bulundu. Toplam: **${total.toLocaleString('tr-TR')} TL**. İlk ${Math.min(3, data.length)} kayıt: ${data.slice(0, 3).map(p => `${p.client_name}: ${p.amount} ${p.currency}`).join(', ')}${data.length > 3 ? '...' : ''}`;
    }
    
    if (q.includes("randevu")) {
      return `📅 **${data.length} randevu** bulundu. İlk ${Math.min(3, data.length)}: ${data.slice(0, 3).map(r => `${r.name} (${r.appointment_date})`).join(', ')}${data.length > 3 ? '...' : ''}`;
    }
    
    if (q.includes("müşteri")) {
      return `👥 **${data.length} müşteri** bulundu. İlk ${Math.min(3, data.length)}: ${data.slice(0, 3).map(c => `${c.name} (${c.country})`).join(', ')}${data.length > 3 ? '...' : ''}`;
    }
    
    return `📊 **${data.length} kayıt** bulundu.`;
  }
}

export default SmartQueryService;
