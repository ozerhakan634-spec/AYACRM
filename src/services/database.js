import { supabase, TABLES, STORAGE_BUCKETS } from '../config/supabase'

// Genel veritabanı işlemleri
export class DatabaseService {
  // Müşteri işlemleri
  static async getClients() {
    const { data, error } = await supabase
      .from(TABLES.CLIENTS)
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // Debug için log
    console.log('DatabaseService.getClients() sonucu:', {
      dataLength: data ? data.length : 0,
      data: data
    });
    
    // Tarih alanlarını kontrol et ve düzenle
    if (data && data.length > 0) {
      const sampleClient = data[0];
      console.log('🔍 Müşteri veri yapısı:', {
        id: sampleClient.id,
        name: sampleClient.name,
        created_at: sampleClient.created_at,
        uploadedDate: sampleClient.uploadedDate,
        registration_date: sampleClient.registration_date,
        date: sampleClient.date,
        allFields: Object.keys(sampleClient)
      });
      
      // Tarih alanlarını kontrol et
      data.forEach(client => {
        if (client.created_at) {
          const date = new Date(client.created_at);
          if (isNaN(date.getTime())) {
            console.warn(`⚠️ Geçersiz created_at tarihi: ${client.created_at} (Müşteri ID: ${client.id})`);
          }
        }
      });
    }
    
    return data
  }

  static async createClient(clientData) {
    const { data, error } = await supabase
      .from(TABLES.CLIENTS)
      .insert([clientData])
      .select()
    
    if (error) throw error
    return data[0]
  }

  static async updateClient(id, updates) {
    const { data, error } = await supabase
      .from(TABLES.CLIENTS)
      .update(updates)
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  }

  static async deleteClient(id) {
    const { error } = await supabase
      .from(TABLES.CLIENTS)
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  }

  // Danışman işlemleri
  static async getConsultants() {
    const { data, error } = await supabase
      .from(TABLES.CONSULTANTS)
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  // Danışman başına müşteri sayısını getir
  static async getConsultantsWithClientCount() {
    try {
      // Önce tüm danışmanları al
      const { data: consultants, error: consultantsError } = await supabase
        .from(TABLES.CONSULTANTS)
        .select('*')
        .order('created_at', { ascending: false })
      
      if (consultantsError) throw consultantsError
      
      // Her danışman için müşteri sayısını hesapla
      const consultantsWithCount = await Promise.all(
        consultants.map(async (consultant) => {
          const { count, error: countError } = await supabase
            .from(TABLES.CLIENTS)
            .select('*', { count: 'exact', head: true })
            .eq('consultant_id', consultant.id)
          
          if (countError) {
            console.warn(`⚠️ ${consultant.name} için müşteri sayısı hesaplanamadı:`, countError)
            return { ...consultant, totalCases: 0 }
          }
          
          return { ...consultant, totalCases: count || 0 }
        })
      )
      
      return consultantsWithCount
    } catch (error) {
      console.error('❌ Danışman ve müşteri sayısı getirme hatası:', error)
      throw error
    }
  }

  // Danışman başına müşteri sayısı ve gelir bilgilerini getir
  static async getConsultantsWithClientCountAndRevenue() {
    try {
      // Önce tüm danışmanları al
      const { data: consultants, error: consultantsError } = await supabase
        .from(TABLES.CONSULTANTS)
        .select('*')
        .order('created_at', { ascending: false })
      
      if (consultantsError) throw consultantsError
      
      // Her danışman için müşteri sayısı ve gelir bilgilerini hesapla
      const consultantsWithDetails = await Promise.all(
        consultants.map(async (consultant) => {
          // Danışmanın müşterilerini al
          const { data: clients, error: clientsError } = await supabase
            .from(TABLES.CLIENTS)
            .select('*')
            .eq('consultant_id', consultant.id)
          
          if (clientsError) {
            console.error(`❌ Danışman ${consultant.id} için müşteri verileri alınamadı:`, clientsError)
            return { ...consultant, totalCases: 0, totalRevenue: 0 }
          }
          
          // Toplam geliri hesapla (fiyat alanı varsa)
          const totalRevenue = clients.reduce((sum, client) => {
            const price = client.price || client.fiyat || client.amount || 0
            return sum + (parseFloat(price) || 0)
          }, 0)
          
          return { 
            ...consultant, 
            totalCases: clients.length || 0,
            totalRevenue: totalRevenue
          }
        })
      )
      
      return consultantsWithDetails
    } catch (error) {
      console.error('❌ Danışman ve gelir bilgileri getirme hatası:', error)
      throw error
    }
  }

  // Müşteri fiyatını ve para birimini güncelle
  static async updateClientPrice(clientId, amount, currency = 'TRY') {
    try {
      // Önce mevcut sütunları kontrol et
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'clients')
        .in('column_name', ['price', 'fiyat', 'amount'])
      
      if (columnsError) {
        console.warn('⚠️ Sütun bilgileri alınamadı, tüm sütunları deneyeceğiz')
      }
      
      // Mevcut sütunları tespit et
      const availableColumns = columns ? columns.map(c => c.column_name) : ['price', 'fiyat', 'amount', 'currency', 'para_birimi']
      
      // Güncelleme verisi oluştur
      const updateData = {}
      if (availableColumns.includes('price')) updateData.price = amount
      if (availableColumns.includes('fiyat')) updateData.fiyat = amount
      if (availableColumns.includes('amount')) updateData.amount = amount
      if (availableColumns.includes('currency')) updateData.currency = currency
      if (availableColumns.includes('para_birimi')) updateData.para_birimi = currency
      
      // Eğer hiçbir sütun yoksa, price sütununu oluşturmayı dene
      if (Object.keys(updateData).length === 0) {
        console.warn('⚠️ Hiçbir fiyat sütunu bulunamadı, price sütunu oluşturulmaya çalışılacak')
        updateData.price = amount
        updateData.currency = currency
      }
      
      const { error } = await supabase
        .from(TABLES.CLIENTS)
        .update(updateData)
        .eq('id', clientId)
      
      if (error) {
        // Eğer sütun yoksa, alternatif olarak notes alanına kaydet
        if (error.message.includes('price') || error.message.includes('fiyat') || error.message.includes('amount')) {
          console.warn('⚠️ Fiyat sütunları bulunamadı, notes alanına kaydediliyor')
          const { error: notesError } = await supabase
            .from(TABLES.CLIENTS)
            .update({ notes: `Fiyat: ${amount} ${currency}` })
            .eq('id', clientId)
          
          if (notesError) throw notesError
          console.log(`✅ Müşteri ${clientId} fiyatı notes alanına kaydedildi: ${amount} ${currency}`)
          return true
        }
        throw error
      }
      
      console.log(`✅ Müşteri ${clientId} fiyatı güncellendi: ${amount} ${currency}`)
      return true
    } catch (error) {
      console.error(`❌ Müşteri fiyatı güncelleme hatası:`, error)
      throw error
    }
  }

  // Müşteri fiyat güncelleme
  static async updateClientPrice(clientId, price) {
    try {
      const { data, error } = await supabase
        .from(TABLES.CLIENTS)
        .update({ price: price })
        .eq('id', clientId)
        .select()
      
      if (error) throw error
      return data[0]
    } catch (error) {
      console.error('❌ Müşteri fiyat güncelleme hatası:', error)
      throw error
    }
  }

  static async createConsultant(consultantData) {
    const { data, error } = await supabase
      .from(TABLES.CONSULTANTS)
      .insert([consultantData])
      .select()
    
    if (error) throw error
    return data[0]
  }

  static async updateConsultant(id, updates) {
    const { data, error } = await supabase
      .from(TABLES.CONSULTANTS)
      .update(updates)
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  }

  static async addConsultant(consultantData) {
    // Yeni danışman ekle
    const { data, error } = await supabase
      .from(TABLES.CONSULTANTS)
      .insert([{
        ...consultantData,
        created_at: new Date().toISOString()
      }])
      .select()
    
    if (error) throw error
    return data
  }

  static async updateConsultantPermissions(consultantId, permissions) {
    // Danışman izinlerini güncelle
    const { data, error } = await supabase
      .from(TABLES.CONSULTANTS)
      .update({ permissions })
      .eq('id', consultantId)
      .select()
    
    if (error) throw error
    return data
  }

  static async deleteConsultant(id) {
    const { error } = await supabase
      .from(TABLES.CONSULTANTS)
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  }

  static async getConsultantCredentials(consultantId) {
    // Danışman kimlik bilgilerini getir
    const { data, error } = await supabase
      .from(TABLES.CONSULTANTS)
      .select('username, password, plain_password, has_credentials')
      .eq('id', consultantId)
      .single()
    
    if (error) {
      console.error('Kimlik bilgileri getirme hatası:', error);
      return null;
    }
    
    if (data && data.has_credentials) {
      return {
        username: data.username,
        password: data.plain_password || '••••••••' // Düz metin şifre varsa göster
      };
    }
    
    return null;
  }



  static async updateConsultantCredentials(consultantId, username, password) {
    try {
      console.log('🔧 Danışman şifresi güncelleniyor:', { consultantId, username });
      
      // Şifreyi hash'le
      const hashedPassword = await this.hashPassword(password);
      
      // Mevcut kimlik bilgilerini güncelle (hem hash hem düz metin sakla)
      const { data, error } = await supabase
        .from(TABLES.CONSULTANTS)
        .update({
          username: username,
          password: hashedPassword,
          plain_password: password, // Düz metin şifre (görüntüleme için)
          has_credentials: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', consultantId)
        .select()
      
      if (error) {
        console.error('❌ Şifre güncelleme hatası:', error);
        throw error;
      }
      
      console.log('✅ Şifre başarıyla güncellendi');
      return data[0];
    } catch (error) {
      console.error('💥 updateConsultantCredentials hatası:', error);
      throw error;
    }
  }

  static async updateConsultantPassword(consultantId, newPassword) {
    try {
      console.log('🔧 Sadece şifre güncelleniyor:', { consultantId });
      
      // Şifreyi hash'le
      const hashedPassword = await this.hashPassword(newPassword);
      
      // Sadece şifreyi güncelle
      const { data, error } = await supabase
        .from(TABLES.CONSULTANTS)
        .update({
          password: hashedPassword,
          plain_password: newPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', consultantId)
        .select()
      
      if (error) {
        console.error('❌ Şifre güncelleme hatası:', error);
        throw error;
      }
      
      console.log('✅ Şifre başarıyla güncellendi');
      return data[0];
    } catch (error) {
      console.error('💥 updateConsultantPassword hatası:', error);
      throw error;
    }
  }

  static async updateConsultantUsername(consultantId, username) {
    // Sadece kullanıcı adını güncelle, şifre aynı kalsın
    const { data, error } = await supabase
      .from(TABLES.CONSULTANTS)
      .update({
        username: username,
        updated_at: new Date().toISOString()
      })
      .eq('id', consultantId)
      .select()
    
    if (error) throw error
    return data
  }

  static async createConsultantCredentials(consultantId, username, password) {
    // Şifreyi hash'le
    const hashedPassword = await this.hashPassword(password);
    
    // Yeni kimlik bilgileri oluştur (hem hash hem düz metin sakla)
    const { data, error } = await supabase
      .from(TABLES.CONSULTANTS)
      .update({
        username: username,
        password: hashedPassword,
        plain_password: password, // Düz metin şifre (görüntüleme için)
        has_credentials: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', consultantId)
      .select()
    
    if (error) throw error
    return data
  }

  static async authenticateUser(username, password) {
    try {
      console.log('🔍 Kullanıcı doğrulama:', { username });
      
      // Kullanıcıyı username ile bul
      const { data: consultant, error } = await supabase
        .from(TABLES.CONSULTANTS)
        .select('*')
        .eq('username', username)
        .eq('has_credentials', true)
        .eq('status', 'active')
        .single()
      
      if (error || !consultant) {
        console.log('❌ Kullanıcı bulunamadı:', username);
        return null;
      }
      
      // Şifreyi kontrol et
      const isPasswordValid = await this.verifyPassword(password, consultant.password);
      
      if (!isPasswordValid) {
        console.log('❌ Şifre hatalı:', username);
        return null;
      }
      
      console.log('✅ Kullanıcı doğrulandı:', { id: consultant.id, name: consultant.name });
      
      // Şifre alanını kaldır ve kullanıcı bilgilerini döndür
      const { password: _, ...userWithoutPassword } = consultant;
      return userWithoutPassword;
      
    } catch (error) {
      console.error('🚨 Authentication hatası:', error);
      return null;
    }
  }

  // Şifre hash'leme fonksiyonu
  static async hashPassword(password) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password + 'vize_crm_salt_2024');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Şifre hash\'leme hatası:', error);
      throw error;
    }
  }

  // Şifre doğrulama fonksiyonu
  static async verifyPassword(password, hashedPassword) {
    try {
      const inputHash = await this.hashPassword(password);
      return inputHash === hashedPassword;
    } catch (error) {
      console.error('Şifre doğrulama hatası:', error);
      return false;
    }
  }

  // Danışman atama işlemleri
  static async assignConsultantToClient(consultantId, clientId) {
    try {
      console.log(`🔄 Danışman ataması yapılıyor: Consultant ID: ${consultantId}, Client ID: ${clientId}`);
      
      // Müşteriye danışman ata
      const { data, error } = await supabase
        .from(TABLES.CLIENTS)
        .update({ consultant_id: consultantId })
        .eq('id', clientId)
        .select()
      
      if (error) throw error
      
      console.log('✅ Danışman başarıyla atandı:', data[0]);
      return data[0]
    } catch (error) {
      console.error('❌ Danışman atama hatası:', error);
      throw error
    }
  }

  static async removeConsultantFromClient(clientId) {
    try {
      console.log(`🔄 Danışman ataması kaldırılıyor: Client ID: ${clientId}`);
      
      // Müşteriden danışman atamasını kaldır
      const { data, error } = await supabase
        .from(TABLES.CLIENTS)
        .update({ consultant_id: null })
        .eq('id', clientId)
        .select()
      
      if (error) throw error
      
      console.log('✅ Danışman ataması kaldırıldı:', data[0]);
      return data[0]
    } catch (error) {
      console.error('❌ Danışman ataması kaldırma hatası:', error);
      throw error
    }
  }

  static async getClientWithConsultant(clientId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.CLIENTS)
        .select(`
          *,
          consultants:consultant_id (
            id,
            name,
            email,
            phone,
            specialty,
            experience,
            location
          )
        `)
        .eq('id', clientId)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Müşteri ve danışman bilgisi getirme hatası:', error);
      throw error
    }
  }

  // Veritabanı şemasını güncelle (consultants tablosuna yeni sütunlar ekle)
  static async updateConsultantsSchema() {
    try {
      console.log('🔄 Consultants tablosu şeması güncelleniyor...');
      
      // Yeni sütunları ekle
      const { error: educationError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE consultants ADD COLUMN IF NOT EXISTS education TEXT;'
      });
      
      const { error: certificationsError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE consultants ADD COLUMN IF NOT EXISTS certifications TEXT;'
      });
      
      const { error: languagesError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE consultants ADD COLUMN IF NOT EXISTS languages TEXT;'
      });
      
      const { error: notesError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE consultants ADD COLUMN IF NOT EXISTS notes TEXT;'
      });

      if (educationError || certificationsError || languagesError || notesError) {
        console.warn('⚠️ Bazı sütunlar zaten mevcut olabilir:', { educationError, certificationsError, languagesError, notesError });
      }

      console.log('✅ Consultants tablosu şeması güncellendi!');
      return true;
    } catch (error) {
      console.error('❌ Şema güncelleme hatası:', error);
      throw error;
    }
  }

  // Doküman işlemleri
  static async getDocuments() {
    const { data, error } = await supabase
      .from(TABLES.DOCUMENTS)
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async createDocument(documentData) {
    const { data, error } = await supabase
      .from(TABLES.DOCUMENTS)
      .insert([documentData])
      .select()
    
    if (error) throw error
    return data[0]
  }

  static async updateDocument(id, updates) {
    const { data, error } = await supabase
      .from(TABLES.DOCUMENTS)
      .update(updates)
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  }

  static async deleteDocument(id) {
    try {
      console.log('🗑️ Belge silme işlemi başlıyor, ID:', id);
      
      // Önce belge bilgilerini al
      const { data: document, error: fetchError } = await supabase
        .from(TABLES.DOCUMENTS)
        .select('fileName, originalFileName')
        .eq('id', id)
        .single()
      
      if (fetchError) {
        console.error('❌ Belge bilgileri alınamadı:', fetchError);
        throw fetchError;
      }
      
      console.log('📄 Silinecek belge bilgileri:', document);
      
      // Storage'dan dosyayı sil
      if (document.fileName) {
        console.log('🗂️ Storage dosyası siliniyor:', document.fileName);
        
        const { error: storageError } = await supabase.storage
          .from(STORAGE_BUCKETS.DOCUMENTS)
          .remove([document.fileName])
        
        if (storageError) {
          console.error('❌ Storage dosyası silinemedi:', storageError);
          // Storage hatası olsa bile devam et, sadece log'la
        } else {
          console.log('✅ Storage dosyası başarıyla silindi:', document.fileName);
        }
      } else {
        console.log('⚠️ Storage dosya adı bulunamadı, sadece veritabanı kaydı silinecek');
      }
      
      // Veritabanından belgeyi sil
      console.log('💾 Veritabanı kaydı siliniyor...');
      const { error: deleteError } = await supabase
        .from(TABLES.DOCUMENTS)
        .delete()
        .eq('id', id)
      
      if (deleteError) {
        console.error('❌ Veritabanı kaydı silinemedi:', deleteError);
        throw deleteError;
      }
      
      console.log('✅ Belge başarıyla silindi - ID:', id, 'Dosya:', document.originalFileName);
      return true
      
    } catch (error) {
      console.error('💥 Belge silme hatası:', error);
      throw error
    }
  }

  // Dosya yükleme işlemleri
  static async uploadFile(file, clientId, documentInfo) {
    try {
      // File parametresi validasyonu
      if (!file || !file.name) {
        console.error('❌ Geçersiz file parametresi:', file);
        return { 
          success: false, 
          error: 'Geçersiz dosya. Lütfen tekrar dosya seçin.' 
        };
      }

      if (!clientId) {
        console.error('❌ Geçersiz clientId parametresi:', clientId);
        return { 
          success: false, 
          error: 'Müşteri ID\'si gerekli.' 
        };
      }

      console.log('🚀 Dosya yükleme başlıyor:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        clientId: clientId,
        documentInfo: documentInfo
      });

      // Supabase bağlantı kontrolü
      if (!supabase) {
        throw new Error('Supabase bağlantısı kurulamadı. Lütfen environment değişkenlerini kontrol edin.');
      }

      // Storage bucket kontrolü
      console.log('🔍 Storage bucket kontrol ediliyor...');
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('❌ Bucket listesi alınamadı:', bucketsError);
        throw new Error(`Storage bucket listesi alınamadı: ${bucketsError.message}`);
      }

      console.log('📦 Mevcut bucket\'lar:', buckets);
      console.log('🔍 Aranan bucket:', STORAGE_BUCKETS.DOCUMENTS);
      console.log('🔍 Bucket bulundu mu?', buckets.some(b => b.name === STORAGE_BUCKETS.DOCUMENTS));
      
      const documentsBucket = buckets.find(b => b.name === STORAGE_BUCKETS.DOCUMENTS);
      if (!documentsBucket) {
        console.error('❌ Documents bucket bulunamadı!');
        console.error('❌ Mevcut bucket\'lar:', buckets.map(b => ({ name: b.name, public: b.public })));
        throw new Error(`Storage bucket "${STORAGE_BUCKETS.DOCUMENTS}" bulunamadı. Lütfen Supabase Dashboard'da Storage > Buckets bölümünden oluşturun.`);
      }

      console.log('✅ Documents bucket bulundu:', documentsBucket);

      // Dosya adını benzersiz hale getir
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
      
      console.log('📝 Oluşturulan dosya adı:', fileName);
      console.log('🔧 Storage bucket:', STORAGE_BUCKETS.DOCUMENTS);

      // Supabase Storage'a dosyayı yükle
      console.log('⬆️ Dosya yükleniyor...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.DOCUMENTS)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('❌ Upload hatası:', uploadError);
        throw new Error(`Dosya yükleme hatası: ${uploadError.message}`);
      }

      console.log('✅ Dosya başarıyla yüklendi:', uploadData);

      // Dosya URL'ini al
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKETS.DOCUMENTS)
        .getPublicUrl(fileName)

      console.log('🔗 Public URL:', publicUrl);

      // Belge bilgilerini veritabanına kaydet
      const documentData = {
        name: documentInfo.name || file.name.split('.')[0],
        type: documentInfo.type || 'other',
        description: documentInfo.description || '',
        fileName: fileName,
        originalFileName: file.name,
        fileSize: (file.size / (1024 * 1024)).toFixed(2), // MB cinsinden
        fileType: file.type,
        fileUrl: publicUrl,
        status: 'pending',
        clientId: clientId,
        clientName: documentInfo.clientName || '',
        uploadedDate: new Date().toISOString()
      }

      console.log('💾 Veritabanına kaydediliyor:', documentData);
      
      // Veritabanı bağlantısını test et
      const { data: testData, error: testError } = await supabase
        .from(TABLES.DOCUMENTS)
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('❌ Veritabanı bağlantı hatası:', testError);
        throw new Error(`Veritabanı bağlantısı kurulamadı: ${testError.message}`);
      }
      
      console.log('✅ Veritabanı bağlantısı başarılı');

      const savedDocument = await this.createDocument(documentData)
      console.log('✅ Belge veritabanına kaydedildi:', savedDocument);
      
      return { 
        success: true, 
        data: savedDocument,
        fileUrl: publicUrl,
        fileName: fileName
      }

    } catch (error) {
      console.error('💥 Dosya yükleme hatası detayı:', {
        error: error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // Hata mesajını daha kullanıcı dostu hale getir
      let userMessage = error.message;
      
      if (error.message.includes('bucket')) {
        userMessage = 'Storage bucket bulunamadı. Lütfen Supabase Dashboard\'da Storage > Buckets bölümünden "documents" bucket\'ını oluşturun.';
      } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
        userMessage = 'Dosya yükleme izni yok. Lütfen Supabase RLS (Row Level Security) ayarlarını kontrol edin.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        userMessage = 'Ağ bağlantısı hatası. Lütfen internet bağlantınızı ve Supabase URL\'ini kontrol edin.';
      } else if (error.message.includes('environment')) {
        userMessage = 'Environment değişkenleri eksik. Lütfen .env.local dosyasında VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY değerlerini kontrol edin.';
      }
      
      return { 
        success: false, 
        error: userMessage 
      };
    }
  }

  async deleteFile(fileName) {
    try {
      console.log('🗑️ Dosya siliniyor:', fileName);
      
      if (!fileName) {
        console.error('❌ fileName boş olamaz');
        return { success: false, error: 'fileName boş olamaz' };
      }

      const { error } = await supabase.storage
        .from(STORAGE_BUCKETS.DOCUMENTS)
        .remove([fileName]);

      if (error) {
        console.error('❌ Storage dosya silme hatası:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Storage dosyası başarıyla silindi');
      return { success: true };
    } catch (error) {
      console.error('💥 Dosya silme hatası:', error);
      return { success: false, error: error.message };
    }
  }

  async saveDocument(documentData) {
    try {
      console.log('💾 Belge kaydediliyor:', documentData);
      
      const { data, error } = await supabase
        .from('documents')
        .insert([documentData])
        .select();

      if (error) {
        console.error('❌ Belge kaydetme hatası:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Belge başarıyla kaydedildi:', data[0]);
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('💥 Belge kaydetme hatası:', error);
      return { success: false, error: error.message };
    }
  }

  // Müşteriye ait belgeleri getir
  static async getClientDocuments(clientId) {
    const { data, error } = await supabase
      .from(TABLES.DOCUMENTS)
      .select('*')
      .eq('clientId', clientId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  // Tüm belgeleri kullanıcı bilgileriyle getir
  static async getAllDocumentsWithClients() {
    try {
      console.log('🔍 getAllDocumentsWithClients çağrılıyor...');
      
      // Önce basit sorgu ile test edelim
      const { data, error } = await supabase
        .from(TABLES.DOCUMENTS)
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ Basit sorgu hatası:', error);
        throw error;
      }
      
      console.log('✅ Basit sorgu başarılı, veri sayısı:', data?.length || 0);
      
      // Eğer veri varsa, client bilgilerini ayrı sorgu ile alalım
      if (data && data.length > 0) {
        const clientIds = [...new Set(data.filter(doc => doc.clientId).map(doc => doc.clientId))];
        console.log('🔍 Bulunan client ID\'ler:', clientIds);
        
        if (clientIds.length > 0) {
          const { data: clientsData, error: clientsError } = await supabase
            .from(TABLES.CLIENTS)
            .select('id, name, email, phone, visa_type, country, application_number')
            .in('id', clientIds)
          
          if (clientsError) {
            console.error('❌ Client sorgu hatası:', clientsError);
          } else {
            console.log('✅ Client verileri alındı:', clientsData?.length || 0);
            
            // Client verilerini documents ile birleştir
            const documentsWithClients = data.map(doc => {
              const client = clientsData?.find(c => c.id === doc.clientId);
              return {
                ...doc,
                clients: client || null
              };
            });
            
            return documentsWithClients;
          }
        }
      }
      
      return data || [];
      
    } catch (error) {
      console.error('💥 getAllDocumentsWithClients hatası:', error);
      throw error;
    }
  }

  // Belge türüne göre filtrele
  static async getDocumentsByType(type) {
    const { data, error } = await supabase
      .from(TABLES.DOCUMENTS)
      .select('*')
      .eq('type', type)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  // Belge durumuna göre filtrele
  static async getDocumentsByStatus(status) {
    const { data, error } = await supabase
      .from(TABLES.DOCUMENTS)
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  // Finans işlemleri
  static async getFinanceRecords() {
    const { data, error } = await supabase
      .from(TABLES.FINANCE)
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  // Takvim işlemleri
  static async getCalendarEvents() {
    const { data, error } = await supabase
      .from(TABLES.CALENDAR)
      .select('*')
      .order('event_date', { ascending: true })
    
    if (error) throw error
    return data
  }

  // Randevu işlemleri
  static async getNextAppointment() {
    const now = new Date().toISOString().split('T')[0]; // Bugünün tarihi (YYYY-MM-DD)
    
    const { data, error } = await supabase
      .from(TABLES.CLIENTS)
      .select('*')
      .gte('appointment_date', now)
      .eq('status', 'active')
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })
      .limit(1)
    
    if (error) throw error
    return data[0] || null
  }

  static async getLastAppointment() {
    const now = new Date().toISOString().split('T')[0]; // Bugünün tarihi (YYYY-MM-DD)
    
    const { data, error } = await supabase
      .from(TABLES.CLIENTS)
      .select('*')
      .lt('appointment_date', now)
      .eq('status', 'completed')
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false })
      .limit(1)
    
    if (error) throw error
    return data[0] || null
  }

  static async getUpcomingAppointments(limit = 5) {
    const now = new Date().toISOString().split('T')[0]; // Bugünün tarihi (YYYY-MM-DD)
    
    const { data, error } = await supabase
      .from(TABLES.CLIENTS)
      .select('*')
      .gte('appointment_date', now)
      .eq('status', 'active')
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })
      .limit(limit)
    
    if (error) throw error
    return data || []
  }

  static async getPastAppointments(limit = 5) {
    const now = new Date().toISOString().split('T')[0]; // Bugünün tarihi (YYYY-MM-DD)
    
    const { data, error } = await supabase
      .from(TABLES.CLIENTS)
      .select('*')
      .lt('appointment_date', now)
      .eq('status', 'completed')
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  }

  // Rapor işlemleri
  static async getReports() {
    const { data, error } = await supabase
      .from(TABLES.REPORTS)
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  // Görev işlemleri
  static async getTasks(userId = null) {
    try {
      let query = supabase
        .from(TABLES.TASKS)
        .select(`
          *,
          task_assignments!inner(
            consultant_id,
            consultant_name,
            assigned_at
          )
        `)
      
      // Eğer userId verilmişse sadece o kullanıcının görevlerini getir
      if (userId) {
        query = query.eq('task_assignments.consultant_id', userId)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ Görevler yüklenirken hata:', error)
        throw error
      }
      
      // Atanan danışmanları görev objelerine ekle
      const tasksWithAssignments = data.map(task => ({
        ...task,
        assigned_to: task.task_assignments.map(assignment => assignment.consultant_name)
      }))
      
      return tasksWithAssignments || []
    } catch (error) {
      console.error('❌ getTasks hatası:', error)
      return []
    }
  }

  // Kullanıcının görevlerini getir (sadece kendisine atananlar)
  static async getUserTasks(userId, unreadOnly = false) {
    try {
      console.log('🔍 Kullanıcı görevleri alınıyor, User ID:', userId, 'Sadece okunmamış:', unreadOnly)
      
      // RLS devre dışıysa tüm görevleri al ve client-side'da filtrele
      const { data, error } = await supabase
        .from(TABLES.TASKS)
        .select(`
          *,
          task_assignments(
            consultant_id,
            consultant_name,
            assigned_at,
            is_read,
            read_at
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ Görevler yüklenirken hata:', error)
        throw error
      }
      
      console.log('📋 Tüm görevler yüklendi:', data?.length || 0)
      
      // Client-side'da filtreleme yap
      // Kullanıcıya atanan görevleri bul
      const userTasks = data.filter(task => {
        // Eğer task_assignments varsa, bu kullanıcıya atanmış mı kontrol et
        if (task.task_assignments && task.task_assignments.length > 0) {
          const userAssignment = task.task_assignments.find(assignment => 
            assignment.consultant_id === userId ||
            assignment.consultant_name === userId || // Name ile de kontrol et
            assignment.consultant_id === String(userId)
          );
          
          if (userAssignment) {
            // Eğer sadece okunmamış isteniyor ve bu görev okunmuşsa dahil etme
            if (unreadOnly && userAssignment.is_read) {
              return false;
            }
            return true;
          }
          return false;
        }
        
        // Eğer bu kullanıcı tarafından oluşturulmuşsa
        if (task.created_by_user_id === userId || task.created_by_user_id === String(userId)) {
          return true
        }
        
        return false
      })
      
      // Atanan danışmanları görev objelerine ekle
      const tasksWithAssignments = userTasks.map(task => ({
        ...task,
        assigned_to: task.task_assignments ? 
          task.task_assignments.map(assignment => assignment.consultant_name) : 
          []
      }))
      
      console.log('✅ Kullanıcı görevleri filtrelendi:', tasksWithAssignments.length)
      return tasksWithAssignments || []
    } catch (error) {
      console.error('❌ getUserTasks hatası:', error)
      return []
    }
  }

  static async createTask(taskData, assignedConsultants = []) {
    try {
      console.log('➕ Yeni görev oluşturuluyor:', taskData)
      
      // Önce görevi oluştur
      const { data: taskResult, error: taskError } = await supabase
        .from(TABLES.TASKS)
        .insert([{
          title: taskData.title,
          description: taskData.description,
          due_date: taskData.due_date,
          priority: taskData.priority,
          status: taskData.status,
          category: taskData.category,
          created_by: taskData.created_by,
          created_by_user_id: taskData.created_by_user_id, // Local user ID kullan
          client_id: taskData.client_id,
          client_name: taskData.client_name,
          notes: taskData.notes
        }])
        .select()
      
      if (taskError) throw taskError
      
      const task = taskResult[0]
      console.log('✅ Görev oluşturuldu:', task.id)
      
      // Danışman atamalarını ekle
      if (assignedConsultants.length > 0) {
        const assignments = assignedConsultants.map(consultant => ({
          task_id: task.id,
          consultant_id: consultant.id, // Local consultant ID kullan
          consultant_name: consultant.name,
          assigned_by_user_id: taskData.created_by_user_id
        }))
        
        console.log('➕ Atamalar ekleniyor:', assignments)
        
        const { error: assignmentError } = await supabase
          .from(TABLES.TASK_ASSIGNMENTS)
          .insert(assignments)
        
        if (assignmentError) {
          console.error('❌ Atama ekleme hatası:', assignmentError)
          // Hata varsa görevi sil
          try {
            await supabase.from(TABLES.TASKS).delete().eq('id', task.id)
          } catch (deleteError) {
            console.error('❌ Görev silme hatası:', deleteError)
          }
          throw assignmentError
        }
        
        console.log('✅ Atamalar başarıyla eklendi')
      }
      
      return task
    } catch (error) {
      console.error('❌ createTask hatası:', error)
      throw error
    }
  }

  static async updateTask(taskId, updates, assignedConsultants = null) {
    try {
      console.log('🔄 Görev güncelleniyor:', taskId, updates)
      
      // Sadece mevcut alanları güncelle
      const updateData = {}
      if (updates.title !== undefined) updateData.title = updates.title
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.due_date !== undefined) updateData.due_date = updates.due_date
      if (updates.priority !== undefined) updateData.priority = updates.priority
      if (updates.status !== undefined) updateData.status = updates.status
      if (updates.category !== undefined) updateData.category = updates.category
      if (updates.client_id !== undefined) updateData.client_id = updates.client_id
      if (updates.client_name !== undefined) updateData.client_name = updates.client_name
      if (updates.notes !== undefined) updateData.notes = updates.notes
      
      // Updated_at her zaman güncelle
      updateData.updated_at = new Date().toISOString()
      
      // Görevi güncelle
      const { data, error } = await supabase
        .from(TABLES.TASKS)
        .update(updateData)
        .eq('id', taskId)
        .select()
      
      if (error) throw error
      
      console.log('✅ Görev başarıyla güncellendi')
      
      // Eğer danışman atamalarını da güncellememiz gerekiyorsa
      if (assignedConsultants !== null) {
        console.log('🔄 Atamalar güncelleniyor...')
        
        // Önce mevcut atamaları sil
        await supabase
          .from(TABLES.TASK_ASSIGNMENTS)
          .delete()
          .eq('task_id', taskId)
        
        // Yeni atamaları ekle
        if (assignedConsultants.length > 0) {
          const assignments = assignedConsultants.map(consultant => ({
            task_id: taskId,
            consultant_id: consultant.id,
            consultant_name: consultant.name,
            assigned_by_user_id: updates.updated_by_user_id || updates.created_by_user_id || 1
          }))
          
          const { error: assignmentError } = await supabase
            .from(TABLES.TASK_ASSIGNMENTS)
            .insert(assignments)
          
          if (assignmentError) {
            console.error('❌ Atama güncelleme hatası:', assignmentError)
            throw assignmentError
          }
          
          console.log('✅ Atamalar başarıyla güncellendi')
        }
      }
      
      return data[0]
    } catch (error) {
      console.error('❌ updateTask hatası:', error)
      throw error
    }
  }

  static async deleteTask(taskId) {
    try {
      // Task assignments CASCADE ile silinecek, sadece task'ı silmemiz yeterli
      const { error } = await supabase
        .from(TABLES.TASKS)
        .delete()
        .eq('id', taskId)
      
      if (error) throw error
      return true
    } catch (error) {
      console.error('❌ deleteTask hatası:', error)
      throw error
    }
  }

  // Bu metodu kaldırıyoruz çünkü yukarıda getUserTasks var
  // static async getTasksByUser(userId) - REMOVED

  static async getTasksByStatus(status) {
    try {
      const { data, error } = await supabase
        .from(TABLES.TASKS)
        .select('*')
        .eq('status', status)
        .order('due_date', { ascending: true })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ getTasksByStatus hatası:', error)
      return []
    }
  }

  // Ödeme işlemleri
  static async getPayments() {
    try {
      console.log('🔍 Payments tablosundan veri yükleniyor...');
      
      const { data, error } = await supabase
        .from(TABLES.PAYMENTS)
        .select(`
          *,
          clients:client_id(name, country),
          consultants:consultant_id(name, specialty)
        `)
        .order('payment_date', { ascending: false })
      
      if (error) {
        console.error('❌ Payments veri yükleme hatası:', error);
        throw error;
      }
      
      // Veriyi düzenle
      const formattedPayments = data.map(payment => ({
        id: payment.id,
        clientId: payment.client_id,
        clientName: payment.clients?.name || 'İsimsiz Müşteri',
        amount: payment.amount || 0,
        currency: payment.currency || 'TRY',
        paymentType: payment.payment_type || 'Vize Başvuru',
        paymentMethod: payment.payment_method || 'Banka Transferi',
        paymentDate: payment.payment_date || payment.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        status: payment.status || 'pending',
        description: payment.description || 'Vize başvuru ücreti',
        invoiceNumber: payment.invoice_number || `INV-${payment.id.toString().padStart(3, '0')}`,
        consultantId: payment.consultant_id,
        consultantName: payment.consultants?.name || 'Atanmamış'
      }))
      
      console.log('✅ Ödemeler başarıyla yüklendi:', formattedPayments.length);
      return formattedPayments
      
    } catch (error) {
      console.error('❌ Ödemeler yüklenirken hata:', error)
      // Hata durumunda boş array döndür
      return []
    }
  }

  static async createPayment(paymentData) {
    try {
      console.log('🔧 createPayment çağrıldı:', paymentData);
      
      // Veri validasyonu
      if (!paymentData.clientId) {
        throw new Error('Müşteri ID gerekli');
      }
      if (!paymentData.amount || paymentData.amount <= 0) {
        throw new Error('Geçerli tutar gerekli');
      }
      
      // Supabase bağlantı kontrolü
      if (!supabase) {
        throw new Error('Supabase bağlantısı kurulamadı');
      }
      
      console.log('📝 Veritabanına kaydediliyor...');
      
      const { data, error } = await supabase
        .from(TABLES.PAYMENTS)
        .insert([{
          client_id: paymentData.clientId,
          amount: paymentData.amount,
          currency: paymentData.currency,
          payment_type: paymentData.paymentType,
          payment_method: paymentData.paymentMethod,
          payment_date: paymentData.paymentDate,
          status: paymentData.status || 'pending',
          description: paymentData.description,
          consultant_id: paymentData.consultantId,
          invoice_number: paymentData.invoiceNumber
        }])
        .select()
      
      if (error) {
        console.error('❌ Supabase hatası:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error('Veri eklenemedi - boş response');
      }
      
      console.log('✅ Yeni ödeme başarıyla oluşturuldu:', data[0]);
      
      // Eklenen veriyi doğrula
      const { data: verifyData, error: verifyError } = await supabase
        .from(TABLES.PAYMENTS)
        .select('*')
        .eq('id', data[0].id)
        .single();
      
      if (verifyError) {
        console.warn('⚠️ Veri doğrulama hatası:', verifyError);
      } else {
        console.log('✅ Veri doğrulandı:', verifyData);
      }
      
      return data[0]
      
    } catch (error) {
      console.error('💥 Ödeme oluşturma hatası detayı:', {
        error: error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error
    }
  }

  static async updatePayment(paymentId, updates) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PAYMENTS)
        .update({
          amount: updates.amount,
          currency: updates.currency,
          payment_type: updates.paymentType,
          payment_method: updates.paymentMethod,
          payment_date: updates.paymentDate,
          status: updates.status,
          description: updates.description,
          consultant_id: updates.consultantId,
          invoice_number: updates.invoiceNumber
        })
        .eq('id', paymentId)
        .select()
      
      if (error) throw error
      
      console.log('✅ Ödeme güncellendi:', data[0])
      return data[0]
      
    } catch (error) {
      console.error('❌ Ödeme güncelleme hatası:', error)
      throw error
    }
  }

  static async deletePayment(paymentId) {
    try {
      const { error } = await supabase
        .from(TABLES.PAYMENTS)
        .delete()
        .eq('id', paymentId)
      
      if (error) throw error
      
      console.log('✅ Ödeme silindi:', paymentId)
      return true
      
    } catch (error) {
      console.error('❌ Ödeme silme hatası:', error)
      throw error
    }
  }

  // Ödeme durumunu güncelle
  static async updatePaymentStatus(paymentId, status) {
    try {
      console.log(`🔧 updatePaymentStatus çağrıldı: paymentId=${paymentId}, status=${status}`);
      
      // Ödeme tablosunda durumu güncelle
      const { data: paymentData, error: paymentError } = await supabase
        .from(TABLES.PAYMENTS)
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select();
      
      if (paymentError) throw paymentError;
      
      console.log(`✅ Ödeme ${paymentId} durumu güncellendi: ${status}`);
      return paymentData[0];
      
    } catch (error) {
      console.error('❌ Ödeme durum güncelleme hatası:', error);
      throw error;
    }
  }

  // Şirket ayarları işlemleri
  static async getCompanySettings() {
    try {
      console.log('🔍 Şirket ayarları yükleniyor...');
      
      const { data, error } = await supabase
        .from(TABLES.COMPANY_SETTINGS)
        .select('*')
        .eq('is_active', true)
        .eq('category', 'company')
        .order('setting_key', { ascending: true });
      
      if (error) {
        console.error('❌ Şirket ayarları yükleme hatası:', error);
        throw error;
      }
      
      // Key-value formatına dönüştür
      const settings = {};
      data.forEach(setting => {
        let value = setting.setting_value;
        
        // Veri türüne göre değeri dönüştür
        if (setting.setting_type === 'number') {
          value = parseFloat(value) || 0;
        } else if (setting.setting_type === 'boolean') {
          value = value === 'true';
        } else if (setting.setting_type === 'json') {
          try {
            value = JSON.parse(value);
          } catch (e) {
            console.warn(`⚠️ JSON parse hatası: ${setting.setting_key}`, e);
            value = null;
          }
        }
        
        settings[setting.setting_key] = value;
      });
      
      console.log('✅ Şirket ayarları yüklendi:', settings);
      return settings;
      
    } catch (error) {
      console.error('💥 Şirket ayarları yükleme hatası:', error);
      // Hata durumunda varsayılan değerleri döndür
      return {
        company_name: 'Vize Danışmanlık Ltd. Şti.',
        company_email: 'info@vizedanismanlik.com',
        company_phone: '+90 212 555 0123',
        company_address: 'Bağdat Caddesi No:123, Kadıköy/İstanbul',
        company_website: 'www.vizedanismanlik.com',
        company_tax_number: '1234567890',
        company_logo_url: null
      };
    }
  }

  static async updateCompanySettings(settings) {
    try {
      console.log('💾 Şirket ayarları kaydediliyor:', settings);
      
      const updates = [];
      
      // Her ayar için update işlemi hazırla
      for (const [key, value] of Object.entries(settings)) {
        if (key.startsWith('company_')) {
          let settingValue = value;
          let settingType = 'string';
          
          // Veri türünü belirle
          if (typeof value === 'number') {
            settingType = 'number';
            settingValue = value.toString();
          } else if (typeof value === 'boolean') {
            settingType = 'boolean';
            settingValue = value.toString();
          } else if (typeof value === 'object' && value !== null) {
            settingType = 'json';
            settingValue = JSON.stringify(value);
          }
          
          updates.push({
            setting_key: key,
            setting_value: settingValue,
            setting_type: settingType,
            category: 'company'
          });
        }
      }
      
      if (updates.length === 0) {
        console.log('⚠️ Güncellenecek ayar bulunamadı');
        return true;
      }
      
      // Batch upsert işlemi
      for (const update of updates) {
        const { error } = await supabase
          .from(TABLES.COMPANY_SETTINGS)
          .upsert(update, {
            onConflict: 'setting_key'
          });
        
        if (error) {
          console.error(`❌ ${update.setting_key} ayarı güncellenemedi:`, error);
          throw error;
        }
      }
      
      console.log('✅ Şirket ayarları başarıyla güncellendi');
      return true;
      
    } catch (error) {
      console.error('💥 Şirket ayarları güncelleme hatası:', error);
      throw error;
    }
  }

  static async updateCompanySetting(key, value) {
    try {
      console.log(`🔧 Tek ayar güncelleniyor: ${key} = ${value}`);
      
      let settingValue = value;
      let settingType = 'string';
      
      // Veri türünü belirle
      if (typeof value === 'number') {
        settingType = 'number';
        settingValue = value.toString();
      } else if (typeof value === 'boolean') {
        settingType = 'boolean';
        settingValue = value.toString();
      } else if (typeof value === 'object' && value !== null) {
        settingType = 'json';
        settingValue = JSON.stringify(value);
      }
      
      const { data, error } = await supabase
        .from(TABLES.COMPANY_SETTINGS)
        .upsert({
          setting_key: key,
          setting_value: settingValue,
          setting_type: settingType,
          category: 'company'
        }, {
          onConflict: 'setting_key'
        })
        .select();
      
      if (error) {
        console.error(`❌ ${key} ayarı güncellenemedi:`, error);
        throw error;
      }
      
      console.log(`✅ ${key} ayarı güncellendi:`, data[0]);
      return data[0];
      
    } catch (error) {
      console.error(`💥 ${key} ayarı güncelleme hatası:`, error);
      throw error;
    }
  }

  // Şirket logosu yükleme işlemleri
  static async uploadCompanyLogo(file) {
    try {
      console.log('🏢 Şirket logosu yükleniyor:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      // Dosya validasyonu
      if (!file || !file.name) {
        throw new Error('Geçersiz dosya. Lütfen tekrar dosya seçin.');
      }

      // Dosya türü kontrolü (SVG, PNG, JPEG destekleniyor)
      const allowedTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Sadece SVG, PNG, JPEG ve WEBP formatında logo dosyaları yükleyebilirsiniz.');
      }

      // Dosya boyutu kontrolü (maksimum 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('Logo dosyası maksimum 5MB olabilir.');
      }

      // Storage bucket kontrolü
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('❌ Bucket listesi alınamadı:', bucketsError);
        throw new Error(`Storage bucket listesi alınamadı: ${bucketsError.message}`);
      }

      let logosBucket = buckets.find(b => b.name === STORAGE_BUCKETS.COMPANY_LOGOS);
      
      // Bucket yoksa oluşturmaya çalış
      if (!logosBucket) {
        console.log('⚠️ Company logos bucket bulunamadı, oluşturmaya çalışıyor...');
        
        try {
          const { data: createBucketData, error: createBucketError } = await supabase.storage
            .createBucket(STORAGE_BUCKETS.COMPANY_LOGOS, {
              public: true,
              fileSizeLimit: 5242880, // 5MB
              allowedMimeTypes: ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp']
            });
          
          if (createBucketError) {
            console.error('❌ Bucket oluşturma hatası:', createBucketError);
            throw new Error(`Storage bucket "${STORAGE_BUCKETS.COMPANY_LOGOS}" oluşturulamadı: ${createBucketError.message}`);
          }
          
          console.log('✅ Company logos bucket başarıyla oluşturuldu:', createBucketData);
          logosBucket = { name: STORAGE_BUCKETS.COMPANY_LOGOS };
          
        } catch (bucketCreateError) {
          console.error('❌ Bucket oluşturma hatası:', bucketCreateError);
          throw new Error(`Storage bucket "${STORAGE_BUCKETS.COMPANY_LOGOS}" bulunamadı ve oluşturulamadı.`);
        }
      }

      // Mevcut logoyu sil (varsa)
      const currentSettings = await this.getCompanySettings();
      if (currentSettings.company_logo_url) {
        const oldFileName = currentSettings.company_logo_url.split('/').pop();
        if (oldFileName) {
          console.log('🗑️ Mevcut logo siliniyor:', oldFileName);
          const { error: deleteError } = await supabase.storage
            .from(STORAGE_BUCKETS.COMPANY_LOGOS)
            .remove([oldFileName]);
          
          if (deleteError) {
            console.warn('⚠️ Mevcut logo silinemedi:', deleteError);
          }
        }
      }

      // Yeni dosya adı oluştur
      const fileExt = file.name.split('.').pop().toLowerCase();
      const fileName = `company_logo_${Date.now()}.${fileExt}`;
      
      console.log('📝 Oluşturulan dosya adı:', fileName);

      // Dosyayı Storage'a yükle
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.COMPANY_LOGOS)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Upload hatası:', uploadError);
        throw new Error(`Dosya yükleme hatası: ${uploadError.message}`);
      }

      console.log('✅ Logo başarıyla yüklendi:', uploadData);

      // Public URL'i al
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKETS.COMPANY_LOGOS)
        .getPublicUrl(fileName);

      console.log('🔗 Logo Public URL:', publicUrl);

      // Şirket ayarlarında logo URL'ini güncelle
      await this.updateCompanySetting('company_logo_url', publicUrl);

      console.log('✅ Şirket logosu başarıyla güncellendi');

      return {
        success: true,
        logoUrl: publicUrl,
        fileName: fileName
      };

    } catch (error) {
      console.error('💥 Şirket logosu yükleme hatası:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async deleteCompanyLogo() {
    try {
      console.log('🗑️ Şirket logosu siliniyor...');

      // Mevcut logo bilgisini al
      const currentSettings = await this.getCompanySettings();
      if (!currentSettings.company_logo_url) {
        console.log('⚠️ Silinecek logo bulunamadı');
        return { success: true, message: 'Zaten logo yok' };
      }

      const fileName = currentSettings.company_logo_url.split('/').pop();
      
      if (fileName) {
        // Storage'dan dosyayı sil
        const { error: deleteError } = await supabase.storage
          .from(STORAGE_BUCKETS.COMPANY_LOGOS)
          .remove([fileName]);

        if (deleteError) {
          console.warn('⚠️ Storage dosyası silinemedi:', deleteError);
        }
      }

      // Şirket ayarlarında logo URL'ini temizle
      await this.updateCompanySetting('company_logo_url', null);

      console.log('✅ Şirket logosu başarıyla silindi');

      return {
        success: true,
        message: 'Logo başarıyla silindi'
      };

    } catch (error) {
      console.error('💥 Şirket logosu silme hatası:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Profil fotoğrafı işlemleri
  static async uploadProfilePhoto(consultantId, file) {
    try {
      console.log('📸 Profil fotoğrafı yükleniyor:', {
        consultantId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      // Dosya validasyonu
      if (!file || !file.name) {
        throw new Error('Geçersiz dosya. Lütfen tekrar dosya seçin.');
      }

      // Dosya türü kontrolü (sadece resim dosyaları)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Sadece JPG, PNG, WEBP ve GIF formatında resim dosyaları yükleyebilirsiniz.');
      }

      // Dosya boyutu kontrolü (maksimum 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('Dosya boyutu maksimum 5MB olabilir.');
      }

      // Storage bucket kontrolü
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('❌ Bucket listesi alınamadı:', bucketsError);
        throw new Error(`Storage bucket listesi alınamadı: ${bucketsError.message}`);
      }

      let profilePhotosBucket = buckets.find(b => b.name === STORAGE_BUCKETS.PROFILE_PHOTOS);
      
      // Bucket yoksa oluşturmaya çalış
      if (!profilePhotosBucket) {
        console.log('⚠️ Profile photos bucket bulunamadı, oluşturmaya çalışıyor...');
        
        try {
          const { data: createBucketData, error: createBucketError } = await supabase.storage
            .createBucket(STORAGE_BUCKETS.PROFILE_PHOTOS, {
              public: true,
              fileSizeLimit: 5242880, // 5MB
              allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
            });
          
          if (createBucketError) {
            console.error('❌ Bucket oluşturma hatası:', createBucketError);
            throw new Error(`Storage bucket "${STORAGE_BUCKETS.PROFILE_PHOTOS}" oluşturulamadı: ${createBucketError.message}\n\nLütfen manuel olarak oluşturun:\n1. Supabase Dashboard > Storage > Buckets\n2. "New bucket" > "${STORAGE_BUCKETS.PROFILE_PHOTOS}"\n3. "Public bucket" seçeneğini işaretleyin`);
          }
          
          console.log('✅ Profile photos bucket başarıyla oluşturuldu:', createBucketData);
          profilePhotosBucket = { name: STORAGE_BUCKETS.PROFILE_PHOTOS };
          
        } catch (bucketCreateError) {
          console.error('❌ Bucket oluşturma hatası:', bucketCreateError);
          throw new Error(`Storage bucket "${STORAGE_BUCKETS.PROFILE_PHOTOS}" bulunamadı ve oluşturulamadı.\n\nLütfen manuel olarak oluşturun:\n1. Supabase Dashboard'a gidin\n2. Storage > Buckets\n3. "New bucket" tıklayın\n4. Bucket adı: "${STORAGE_BUCKETS.PROFILE_PHOTOS}"\n5. "Public bucket" seçeneğini işaretleyin\n6. "Create bucket" tıklayın`);
        }
      }

      // Mevcut profil fotoğrafını sil (varsa)
      const { data: currentUser, error: userError } = await supabase
        .from(TABLES.CONSULTANTS)
        .select('profile_photo_url, profile_photo_filename')
        .eq('id', consultantId)
        .single();

      if (!userError && currentUser?.profile_photo_filename) {
        console.log('🗑️ Mevcut profil fotoğrafı siliniyor:', currentUser.profile_photo_filename);
        const { error: deleteError } = await supabase.storage
          .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
          .remove([currentUser.profile_photo_filename]);
        
        if (deleteError) {
          console.warn('⚠️ Mevcut fotoğraf silinemedi:', deleteError);
          // Devam et, kritik hata değil
        }
      }

      // Yeni dosya adı oluştur
      const fileExt = file.name.split('.').pop().toLowerCase();
      const fileName = `consultant_${consultantId}_${Date.now()}.${fileExt}`;
      
      console.log('📝 Oluşturulan dosya adı:', fileName);

      // Dosyayı Storage'a yükle
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Upload hatası:', uploadError);
        throw new Error(`Dosya yükleme hatası: ${uploadError.message}`);
      }

      console.log('✅ Dosya başarıyla yüklendi:', uploadData);

      // Public URL'i al
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
        .getPublicUrl(fileName);

      console.log('🔗 Public URL:', publicUrl);

      // Danışman tablosunda profil fotoğrafı URL'ini güncelle
      const { data: updatedUser, error: updateError } = await supabase
        .from(TABLES.CONSULTANTS)
        .update({
          profile_photo_url: publicUrl,
          profile_photo_filename: fileName,
          updated_at: new Date().toISOString()
        })
        .eq('id', consultantId)
        .select();

      if (updateError) {
        console.error('❌ Profil fotoğrafı URL güncelleme hatası:', updateError);
        // Yüklenen dosyayı temizle
        await supabase.storage
          .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
          .remove([fileName]);
        throw new Error(`Profil fotoğrafı kaydedilirken hata oluştu: ${updateError.message}`);
      }

      console.log('✅ Profil fotoğrafı başarıyla güncellendi');

      return {
        success: true,
        photoUrl: publicUrl,
        fileName: fileName,
        user: updatedUser[0]
      };

    } catch (error) {
      console.error('💥 Profil fotoğrafı yükleme hatası:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async deleteProfilePhoto(consultantId) {
    try {
      console.log('🗑️ Profil fotoğrafı siliniyor:', consultantId);

      // Mevcut profil fotoğrafı bilgisini al
      const { data: currentUser, error: userError } = await supabase
        .from(TABLES.CONSULTANTS)
        .select('profile_photo_filename')
        .eq('id', consultantId)
        .single();

      if (userError) {
        throw new Error(`Kullanıcı bilgileri alınamadı: ${userError.message}`);
      }

      if (currentUser?.profile_photo_filename) {
        // Storage'dan dosyayı sil
        const { error: deleteError } = await supabase.storage
          .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
          .remove([currentUser.profile_photo_filename]);

        if (deleteError) {
          console.warn('⚠️ Storage dosyası silinemedi:', deleteError);
          // Devam et, veritabanını temizle
        }
      }

      // Danışman tablosunda profil fotoğrafı bilgilerini temizle
      const { data: updatedUser, error: updateError } = await supabase
        .from(TABLES.CONSULTANTS)
        .update({
          profile_photo_url: null,
          profile_photo_filename: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', consultantId)
        .select();

      if (updateError) {
        throw new Error(`Profil fotoğrafı kaydı temizlenirken hata oluştu: ${updateError.message}`);
      }

      console.log('✅ Profil fotoğrafı başarıyla silindi');

      return {
        success: true,
        user: updatedUser[0]
      };

    } catch (error) {
      console.error('💥 Profil fotoğrafı silme hatası:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Bildirimleri okundu olarak işaretle
  static async markNotificationsAsRead(userId) {
    try {
      console.log('📖 Kullanıcının bildirimleri okundu olarak işaretleniyor:', userId);
      
      const { data, error } = await supabase
        .from('task_assignments')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('consultant_id', userId)
        .eq('is_read', false); // Sadece okunmamış olanları güncelle
      
      if (error) {
        console.error('❌ Bildirimler okundu işaretlenirken hata:', error);
        throw error;
      }
      
      console.log('✅ Bildirimler okundu olarak işaretlendi:', data);
      return true;
    } catch (error) {
      console.error('❌ markNotificationsAsRead hatası:', error);
      return false;
    }
  }

  // Kullanıcının okunmamış bildirim sayısını getir
  static async getUnreadNotificationCount(userId) {
    try {
      const { count, error } = await supabase
        .from('task_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('consultant_id', userId)
        .eq('is_read', false);
      
      if (error) {
        console.error('❌ Okunmamış bildirim sayısı alınırken hata:', error);
        return 0;
      }
      
      return count || 0;
    } catch (error) {
      console.error('❌ getUnreadNotificationCount hatası:', error);
      return 0;
    }
  }
}
