// Ülke isimlerini normalize eden merkezi fonksiyon
export const normalizeCountryName = (countryName) => {
  if (!countryName) return 'Belirtilmemiş';
  
  // Küçük harfe çevir ve boşlukları temizle
  let normalized = countryName.toString().toLowerCase().trim();
  
  // Yaygın ülke isimlerini standartlaştır
  const countryMappings = {
    // Almanya varyasyonları
    'almanya': 'Almanya',
    'germany': 'Almanya',
    'deutschland': 'Almanya',
    'aaaaaa': 'Almanya', // Test verisi için
    
    // Türkiye varyasyonları
    'türkiye': 'Türkiye',
    'turkey': 'Türkiye',
    
    // Amerika varyasyonları - Artık sadece "Amerika" olarak
    'amerika': 'Amerika',
    'amerıka': 'Amerika',
    'usa': 'Amerika',
    'united states': 'Amerika',
    'united states of america': 'Amerika',
    
    // İngiltere varyasyonları
    'ingiltere': 'İngiltere',
    'england': 'İngiltere',
    'united kingdom': 'İngiltere',
    'uk': 'İngiltere',
    
    // Fransa varyasyonları
    'fransa': 'Fransa',
    'france': 'Fransa',
    
    // İtalya varyasyonları
    'italya': 'İtalya',
    'italy': 'İtalya',
    
    // İspanya varyasyonları
    'ispanya': 'İspanya',
    'spain': 'İspanya',
    
    // Hollanda varyasyonları
    'hollanda': 'Hollanda',
    'netherlands': 'Hollanda',
    
    // Belçika varyasyonları
    'belçika': 'Belçika',
    'belgium': 'Belçika',
    
    // Avusturya varyasyonları
    'avusturya': 'Avusturya',
    'austria': 'Avusturya',
    
    // İsviçre varyasyonları
    'isviçre': 'İsviçre',
    'switzerland': 'İsviçre',
    
    // Kanada varyasyonları
    'kanada': 'Kanada',
    'canada': 'Kanada',
    
    // Avustralya varyasyonları
    'avustralya': 'Avustralya',
    'australia': 'Avustralya',
    
    // Yeni Zelanda varyasyonları
    'yeni zelanda': 'Yeni Zelanda',
    'new zealand': 'Yeni Zelanda'
  };
  
  // Eşleşme varsa standart ismi döndür
  if (countryMappings[normalized]) {
    return countryMappings[normalized];
  }
  
  // Eşleşme yoksa ilk harfi büyük yap
  return countryName.toString().charAt(0).toUpperCase() + 
         countryName.toString().slice(1).toLowerCase();
};

// Özel olarak Amerika varyasyonlarını kontrol eden fonksiyon
export const isAmericaVariant = (countryName) => {
  if (!countryName) return false;
  
  const normalized = countryName.toString().toLowerCase().trim();
  const americaVariants = [
    'amerika', 'amerıka', 'amerika', 'amerika',
    'amerika', 'amerika', 'amerika', 'amerika'
  ];
  
  return americaVariants.includes(normalized);
};

// Tüm ülke varyasyonlarını getiren fonksiyon
export const getAllCountryVariants = () => {
  return {
    'Almanya': ['almanya', 'germany', 'deutschland', 'aaaaaa'],
    'Türkiye': ['türkiye', 'turkey'],
    'Amerika': [
      'amerika', 'amerıka', 'amerika', 'amerika',
      'amerika', 'amerika', 'amerika', 'amerika',
      'usa', 'united states', 'united states of america'
    ],
    'İngiltere': ['ingiltere', 'england', 'united kingdom', 'uk'],
    'Fransa': ['fransa', 'france'],
    'İtalya': ['italya', 'italy'],
    'İspanya': ['ispanya', 'spain'],
    'Hollanda': ['hollanda', 'netherlands'],
    'Belçika': ['belçika', 'belgium'],
    'Avusturya': ['avusturya', 'austria'],
    'İsviçre': ['isviçre', 'switzerland'],
    'Kanada': ['kanada', 'canada'],
    'Avustralya': ['avustralya', 'australia'],
    'Yeni Zelanda': ['yeni zelanda', 'new zealand']
  };
};
