// Tarih işlemleri için utility fonksiyonları

/**
 * İki tarih arasındaki gün farkını hesaplar
 * @param {Date|string} date1 - İlk tarih
 * @param {Date|string} date2 - İkinci tarih (varsayılan: bugün)
 * @returns {number} Gün farkı
 */
export function getDaysDifference(date1, date2 = new Date()) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const timeDiff = d2.getTime() - d1.getTime();
  return Math.floor(timeDiff / (1000 * 3600 * 24));
}

/**
 * Başvuru numarası güncelleme tarihinden itibaren kalan günleri hesaplar
 * @param {Date|string} updateDate - Son güncelleme tarihi
 * @returns {number} Kalan gün sayısı (0 veya negatif ise güncelleme gerekiyor)
 */
export function getDaysUntilNextUpdate(updateDate) {
  if (!updateDate) return null;
  
  const daysSinceUpdate = getDaysDifference(updateDate);
  const daysUntilNext = 20 - daysSinceUpdate;
  
  return Math.max(0, daysUntilNext);
}

/**
 * Güncelleme durumuna göre stil ve metin döndürür
 * @param {number} daysUntil - Kalan gün sayısı
 * @returns {Object} Stil ve metin bilgileri
 */
export function getUpdateStatus(daysUntil) {
  if (daysUntil === null) return null;
  
  if (daysUntil === 0) {
    return {
      text: 'Bugün güncellenmeli',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    };
  } else if (daysUntil <= 3) {
    return {
      text: `${daysUntil} gün sonra güncellenmeli`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    };
  } else if (daysUntil <= 7) {
    return {
      text: `${daysUntil} gün sonra güncellenmeli`,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    };
  } else {
    return {
      text: `${daysUntil} gün sonra güncellenmeli`,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    };
  }
}

/**
 * Tarihi Türkçe formatında gösterir
 * @param {Date|string} date - Formatlanacak tarih
 * @returns {string} Türkçe formatlanmış tarih
 */
export function formatTurkishDateTime(date) {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Tarih aramalarını desteklemek için çeşitli tarih formatlarını normalize eder
 * @param {string} dateString - Aranacak tarih stringi
 * @returns {Array} Muhtemel tarih formatları dizisi
 */
export function normalizeDateSearch(dateString) {
  if (!dateString || typeof dateString !== 'string') return [];
  
  const cleaned = dateString.trim();
  const formats = [];
  
  // Türkçe tarih formatları (gg.aa.yyyy, gg/aa/yyyy, gg-aa-yyyy)
  const turkishDateRegex = /^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/;
  const turkishMatch = cleaned.match(turkishDateRegex);
  if (turkishMatch) {
    const [, day, month, year] = turkishMatch;
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    formats.push(isoDate);
  }
  
  // ISO formatı (yyyy-mm-dd)
  const isoDateRegex = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
  const isoMatch = cleaned.match(isoDateRegex);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    formats.push(isoDate);
  }
  
  // Amerikan formatı (mm/dd/yyyy)
  const americanDateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const americanMatch = cleaned.match(americanDateRegex);
  if (americanMatch) {
    const [, month, day, year] = americanMatch;
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    formats.push(isoDate);
  }
  
  // Sadece gün/ay arama (mevcut yıl varsayımı)
  const dayMonthRegex = /^(\d{1,2})[.\/-](\d{1,2})$/;
  const dayMonthMatch = cleaned.match(dayMonthRegex);
  if (dayMonthMatch) {
    const [, day, month] = dayMonthMatch;
    const currentYear = new Date().getFullYear();
    const isoDate = `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    formats.push(isoDate);
  }
  
  // Sadece yıl arama
  const yearRegex = /^(\d{4})$/;
  const yearMatch = cleaned.match(yearRegex);
  if (yearMatch) {
    formats.push(yearMatch[1]); // Sadece yıl
  }
  
  // Ay/yıl formatı (aa/yyyy veya aa.yyyy)
  const monthYearRegex = /^(\d{1,2})[.\/-](\d{4})$/;
  const monthYearMatch = cleaned.match(monthYearRegex);
  if (monthYearMatch) {
    const [, month, year] = monthYearMatch;
    formats.push(`${year}-${month.padStart(2, '0')}`);
  }
  
  return formats;
}

/**
 * Bir tarihin, arama kriterlerine uyup uymadığını kontrol eder
 * @param {string} targetDate - Kontrol edilecek tarih (ISO formatında)
 * @param {string} searchTerm - Arama terimi
 * @returns {boolean} Eşleşme durumu
 */
export function isDateMatch(targetDate, searchTerm) {
  if (!targetDate || !searchTerm) return false;
  
  try {
    const searchFormats = normalizeDateSearch(searchTerm);
    
    // Tam tarih eşleşmesi
    if (searchFormats.some(format => targetDate.startsWith(format))) {
      return true;
    }
    
    // Formatlanmış tarih metni araması
    const date = new Date(targetDate);
    if (isNaN(date.getTime())) return false;
    
    const turkishDateStr = date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    const turkishDateLongStr = date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    const searchLower = searchTerm.toLowerCase();
    
    return turkishDateStr.includes(searchLower) || 
           turkishDateLongStr.toLowerCase().includes(searchLower) ||
           targetDate.includes(searchLower);
           
  } catch (error) {
    return false;
  }
}

/**
 * Tarih arama için çeşitli formatları döndürür
 * @param {string} dateString - Formatlanacak tarih
 * @returns {Object} Çeşitli tarih formatları
 */
export function getDateFormats(dateString) {
  if (!dateString) return {};
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return {};
    
    return {
      iso: dateString,
      turkish: date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      turkishLong: date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      year: date.getFullYear().toString(),
      month: (date.getMonth() + 1).toString().padStart(2, '0'),
      day: date.getDate().toString().padStart(2, '0')
    };
  } catch (error) {
    return {};
  }
}