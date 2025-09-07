import { supabase } from '../config/supabase';

// AI Eğitim Servisi
export class AITrainingService {
  
  // Soru-cevap örneklerini veritabanında sakla
  static async saveTrainingExample(question, answer, category = 'general') {
    try {
      const { data, error } = await supabase
        .from('ai_training_examples')
        .insert([{
          question: question.toLowerCase().trim(),
          answer: answer,
          category: category,
          created_at: new Date().toISOString(),
          is_active: true
        }])
        .select();

      if (error) throw error;
      
      console.log('✅ Eğitim örneği kaydedildi:', data[0]);
      return data[0];
    } catch (error) {
      console.error('❌ Eğitim örneği kaydetme hatası:', error);
      throw error;
    }
  }

  // Benzer soru örneklerini bul
  static async findSimilarExamples(question) {
    try {
      const cleanQuestion = question.toLowerCase().trim();
      
      // PostgreSQL ile benzer sorular bul
      const { data, error } = await supabase
        .from('ai_training_examples')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Basit benzerlik algoritması
      const similarities = data.map(example => {
        const similarity = this.calculateSimilarity(cleanQuestion, example.question);
        return { ...example, similarity };
      });

      // En benzer 5 örneği döndür
      return similarities
        .filter(ex => ex.similarity > 0.3)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);

    } catch (error) {
      console.error('❌ Benzer örnekler bulma hatası:', error);
      return [];
    }
  }

  // Basit kelime benzerliği hesapla
  static calculateSimilarity(str1, str2) {
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');
    
    let commonWords = 0;
    const totalWords = Math.max(words1.length, words2.length);
    
    words1.forEach(word => {
      if (words2.includes(word) && word.length > 2) {
        commonWords++;
      }
    });
    
    return commonWords / totalWords;
  }

  // Kategori bazlı örnekleri getir
  static async getTrainingExamplesByCategory(category) {
    try {
      const { data, error } = await supabase
        .from('ai_training_examples')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Kategori örnekleri getirme hatası:', error);
      return [];
    }
  }

  // Kullanıcı geri bildirimini kaydet
  static async saveFeedback(question, aiAnswer, userFeedback, correctAnswer = null) {
    try {
      const { data, error } = await supabase
        .from('ai_feedback')
        .insert([{
          question: question,
          ai_answer: aiAnswer,
          user_feedback: userFeedback, // 'good', 'bad', 'partial'
          correct_answer: correctAnswer,
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      
      // Eğer kötü geri bildirim varsa ve doğru cevap verilmişse, eğitim örneği olarak kaydet
      if (userFeedback === 'bad' && correctAnswer) {
        await this.saveTrainingExample(question, correctAnswer, 'user_correction');
      }

      return data[0];
    } catch (error) {
      console.error('❌ Geri bildirim kaydetme hatası:', error);
      throw error;
    }
  }

  // Gelişmiş prompt oluştur (örneklerle)
  static async buildEnhancedPrompt(question, baseData) {
    try {
      // Benzer örnekleri bul
      const similarExamples = await this.findSimilarExamples(question);
      
      let enhancedPrompt = `Sen CRM asistanısın. Aşağıdaki örneklerden öğren:

=== ÖĞRENİLMİŞ ÖRNEKLER ===
${similarExamples.map(ex => 
  `SORU: ${ex.question}
CEVAP: ${ex.answer}
---`
).join('\n')}

=== MEVCUT VERİLER ===
${baseData}

=== YENİ SORU ===
${question}

KURALLAR:
- Yukarıdaki örneklerden öğren ama aynısını kopyalama
- Mevcut verileri kullan
- Kısa ve net cevap ver
- Önemli bilgileri **bold** yap`;

      return enhancedPrompt;
    } catch (error) {
      console.error('❌ Gelişmiş prompt oluşturma hatası:', error);
      return baseData; // Fallback to basic prompt
    }
  }

  // AI öğrenme döngüsü
  static async startLearningLoop() {
    console.log('🧠 AI öğrenme döngüsü başlatılıyor...');
    
    // Her 5 dakikada bir feedback'leri analiz et
    setInterval(async () => {
      try {
        await this.analyzeFeedbackAndImprove();
      } catch (error) {
        console.error('❌ Öğrenme döngüsü hatası:', error);
      }
    }, 5 * 60 * 1000); // 5 dakika
  }

  // Geri bildirimleri analiz et ve geliştir
  static async analyzeFeedbackAndImprove() {
    try {
      // Kötü geri bildirim alan soruları bul
      const { data: badFeedbacks, error } = await supabase
        .from('ai_feedback')
        .select('*')
        .eq('user_feedback', 'bad')
        .is('processed', null)
        .limit(10);

      if (error) throw error;

      console.log(`📊 ${badFeedbacks.length} kötü geri bildirim analiz ediliyor...`);

      for (const feedback of badFeedbacks) {
        if (feedback.correct_answer) {
          // Doğru cevap varsa eğitim örneği olarak kaydet
          await this.saveTrainingExample(
            feedback.question, 
            feedback.correct_answer, 
            'auto_correction'
          );
        }

        // İşlendi olarak işaretle
        await supabase
          .from('ai_feedback')
          .update({ processed: true })
          .eq('id', feedback.id);
      }

      console.log('✅ Geri bildirimler işlendi ve AI eğitimi güncellendi');
    } catch (error) {
      console.error('❌ Geri bildirim analizi hatası:', error);
    }
  }

  // Ön tanımlı eğitim örnekleri ekle
  static async seedTrainingExamples() {
    const examples = [
      {
        question: 'bu ay kaç randevu var',
        answer: 'Bu ay toplam **X randevu** bulunuyor. Detaylar: [randevu listesi]',
        category: 'appointments'
      },
      {
        question: 'toplam gelir ne kadar',
        answer: 'Toplam gelir **X TL**. Aktif müşterilerden **Y TL**, eski müşterilerden **Z TL**.',
        category: 'finance'
      },
      {
        question: 'hangi danışman en çok müşteriye sahip',
        answer: '**[Danışman Adı]** en çok müşteriye sahip (**X müşteri**).',
        category: 'consultants'
      },
      {
        question: 'bekleyen ödemeler neler',
        answer: 'Toplam **X bekleyen ödeme** var: [liste]',
        category: 'finance'
      },
      {
        question: 'ahmet yavuz aybaş ne kadar tahsilat yapmış',
        answer: '**Ahmet Yavuz Aybaş** toplamda **X EUR + Y TL** tahsilat yapmış (**Z TL karşılığı**). **N adet tamamlanmış ödeme** var. Detaylar: [müşteri listesi]',
        category: 'consultant_performance'
      },
      {
        question: 'danışman performansı ne kadar tahsilat yapmış',
        answer: '**[Danışman Adı]** toplamda **X TL** tahsilat yapmış. **Y adet ödeme** tamamlanmış. Para birimi dağılımı: **Z EUR + W TL**. Müşteriler: [liste]',
        category: 'consultant_performance'
      },
      {
        question: 'müşterilerin doğum tarihleri',
        answer: '**X müşterinin doğum tarihi** kayıtlarda var, **Y müşterinin yok**. Doğum tarihi olanlar: [liste]. Eksik olanlar: [liste]. En genç: **A yaşında**, en yaşlı: **B yaşında**.',
        category: 'birth_dates'
      },
      {
        question: 'ahmet özerin doğum tarihi ne zaman',
        answer: '**Ahmet Özer**in doğum tarihi **[tarih]** (**X yaşında**). / **Ahmet Özer**in doğum tarihi kayıtlarda bulunmuyor.',
        category: 'birth_dates'
      },
      {
        question: 'kaç yaşında müşteriler var',
        answer: 'Doğum tarihi olan **X müşteri** var. Yaş dağılımı: [aralıklar]. En genç **Y yaşında**, en yaşlı **Z yaşında**.',
        category: 'birth_dates'
      },
      {
        question: 'hakan özerin telefon numarası nedir',
        answer: '**Hakan Özer**in telefon numarası **5075918223**. Email: **hello@hknozr.com**, TC: **13741134712**.',
        category: 'personal_info'
      },
      {
        question: 'hakan özerin pasaport numarası ne',
        answer: '**Hakan Özer**in pasaport numarası **U27058679**. Hedef ülke: **Almanya**, vize türü: **Turist Vizesi**.',
        category: 'personal_info'
      },
      {
        question: 'hakan özerin güvenlik cevapları neler',
        answer: '**Hakan Özer**in güvenlik cevapları: **ankara şehir** (ilk yaşadığın şehir), **cutmedia** (ilk işin), **otobüs** (eşinle nerede tanıştın).',
        category: 'personal_info'
      },
      {
        question: 'müşteri kişisel bilgileri',
        answer: '**[Müşteri Adı]** - TC: **[TC]**, Tel: **[telefon]**, Email: **[email]**, Pasaport: **[pasaport]**, Adres: **[adres]**. Güvenlik bilgileri mevcut.',
        category: 'personal_info'
      },
      {
        question: 'halil ibrahim paksoyun güvenlik soruları',
        answer: '**Halil İbrahim Paksoy**un güvenlik bilgileri kayıtlarda bulunmuyor. / **Halil İbrahim Paksoy**un güvenlik soruları: [sorular]. Cevapları: [cevaplar].',
        category: 'personal_info'
      },
      {
        question: 'yanlış kişi bilgileri verme',
        answer: 'ASLA başka kişinin bilgilerini verme! Sorulan kişinin tam ismini kontrol et. Bilgi yoksa "kayıtlarda bulunmuyor" de.',
        category: 'error_prevention'
      }
    ];

    for (const example of examples) {
      try {
        await this.saveTrainingExample(example.question, example.answer, example.category);
      } catch (error) {
        console.warn('⚠️ Örnek eklenirken hata:', error.message);
      }
    }

    console.log('✅ Ön tanımlı eğitim örnekleri eklendi');
  }
}
