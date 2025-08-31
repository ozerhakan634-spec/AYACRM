import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Shield, 
  Database,
  Building,
  Download,
  Upload
} from 'lucide-react';
import { DatabaseService } from '../services/database';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('company');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    taxNumber: '',
    logo: null
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const tabs = [
    { id: 'company', name: 'Şirket Bilgileri', icon: Building },
    { id: 'security', name: 'Güvenlik', icon: Shield },
    { id: 'backup', name: 'Yedekleme', icon: Database }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };



  // Sayfa yüklendiğinde ayarları getir
  useEffect(() => {
    loadCompanySettings();
  }, []);

  const loadCompanySettings = async () => {
    try {
      setLoading(true);
      console.log('🔍 Şirket ayarları yükleniyor...');
      
      const settings = await DatabaseService.getCompanySettings();
      
      // Settings'i formData formatına çevir
      setFormData({
        companyName: settings.company_name || '',
        email: settings.company_email || '',
        phone: settings.company_phone || '',
        address: settings.company_address || '',
        website: settings.company_website || '',
        taxNumber: settings.company_tax_number || '',
        logo: settings.company_logo_url || null
      });
      
      console.log('✅ Şirket ayarları başarıyla yüklendi');
    } catch (error) {
      console.error('❌ Şirket ayarları yükleme hatası:', error);
      // Hata durumunda varsayılan değerleri kullan
      setFormData({
        companyName: 'Vize Danışmanlık Ltd. Şti.',
        email: 'info@vizedanismanlik.com',
        phone: '+90 212 555 0123',
        address: 'Bağdat Caddesi No:123, Kadıköy/İstanbul',
        website: 'www.vizedanismanlik.com',
        taxNumber: '1234567890',
        logo: null
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSuccessMessage('');
      
      console.log('💾 Şirket bilgileri kaydediliyor:', formData);
      
      // FormData'yı database formatına çevir
      const settingsToSave = {
        company_name: formData.companyName,
        company_email: formData.email,
        company_phone: formData.phone,
        company_address: formData.address,
        company_website: formData.website,
        company_tax_number: formData.taxNumber,
        company_logo_url: formData.logo
      };
      
      await DatabaseService.updateCompanySettings(settingsToSave);
      
      setSuccessMessage('Şirket bilgileri başarıyla kaydedildi!');
      
      // Başarı mesajını 3 saniye sonra temizle
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
      console.log('✅ Şirket bilgileri başarıyla kaydedildi');
      
    } catch (error) {
      console.error('❌ Şirket bilgileri kaydetme hatası:', error);
      alert('Şirket bilgileri kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  // Logo yükleme fonksiyonu
  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      console.log('🏢 Logo yükleniyor:', file.name);

      const result = await DatabaseService.uploadCompanyLogo(file);
      
      if (result.success) {
        // FormData'yı güncelle
        setFormData(prev => ({
          ...prev,
          logo: result.logoUrl
        }));
        
        setSuccessMessage('Logo başarıyla yüklendi!');
        
        // Başarı mesajını 3 saniye sonra temizle
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
        
        console.log('✅ Logo başarıyla yüklendi:', result.logoUrl);
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('❌ Logo yükleme hatası:', error);
      alert(`Logo yüklenirken hata oluştu: ${error.message}`);
    } finally {
      setUploadingLogo(false);
      // File input'u temizle
      event.target.value = '';
    }
  };

  // Logo silme fonksiyonu
  const handleLogoDelete = async () => {
    if (!formData.logo) return;
    
    if (!confirm('Logoyu silmek istediğinizden emin misiniz?')) return;

    try {
      setUploadingLogo(true);
      console.log('🗑️ Logo siliniyor...');

      const result = await DatabaseService.deleteCompanyLogo();
      
      if (result.success) {
        // FormData'yı güncelle
        setFormData(prev => ({
          ...prev,
          logo: null
        }));
        
        setSuccessMessage('Logo başarıyla silindi!');
        
        // Başarı mesajını 3 saniye sonra temizle
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
        
        console.log('✅ Logo başarıyla silindi');
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('❌ Logo silme hatası:', error);
      alert(`Logo silinirken hata oluştu: ${error.message}`);
    } finally {
      setUploadingLogo(false);
    }
  };



  const renderCompanyTab = () => (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Şirket Bilgileri</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Şirket Adı
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-posta
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefon
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vergi Numarası
            </label>
            <input
              type="text"
              value={formData.taxNumber}
              onChange={(e) => handleInputChange('taxNumber', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {formData.logo ? (
                  <img 
                    src={formData.logo} 
                    alt="Şirket Logosu" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : (
                  <Building size={24} className="text-gray-400" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="btn-secondary cursor-pointer inline-flex items-center">
                  <Upload size={16} className="mr-2" />
                  {uploadingLogo ? 'Yükleniyor...' : 'Logo Yükle'}
                  <input
                    type="file"
                    accept=".svg,.png,.jpg,.jpeg,.webp"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="hidden"
                  />
                </label>
                {formData.logo && (
                  <button 
                    onClick={handleLogoDelete}
                    disabled={uploadingLogo}
                    className="btn-secondary text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Logoyu Sil
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              SVG, PNG, JPEG veya WEBP formatında, maksimum 5MB
            </p>
          </div>
        </div>
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Adres
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            rows={3}
            className="input-field"
          />
        </div>
      </div>


    </div>
  );





  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Güvenlik Ayarları</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">İki Faktörlü Doğrulama</h4>
              <p className="text-sm text-gray-500">Hesap güvenliğini artırmak için SMS veya uygulama kodu</p>
            </div>
            <button className="btn-secondary">Etkinleştir</button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Oturum Zaman Aşımı</h4>
              <p className="text-sm text-gray-500">30 dakika hareketsizlik sonrası otomatik çıkış</p>
            </div>
            <select className="input-field w-auto">
              <option value="15">15 dakika</option>
              <option value="30" selected>30 dakika</option>
              <option value="60">1 saat</option>
              <option value="never">Asla</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Şüpheli Giriş Uyarıları</h4>
              <p className="text-sm text-gray-500">Bilinmeyen cihazlardan giriş yapıldığında uyarı</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Aktif Oturumlar</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Chrome - Windows 10</p>
                <p className="text-xs text-gray-500">İstanbul, TR • Şu anda aktif</p>
              </div>
            </div>
            <button className="text-red-600 hover:text-red-900 text-sm font-medium">
              Çıkış Yap
            </button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Safari - iPhone</p>
                <p className="text-xs text-gray-500">İstanbul, TR • 2 saat önce</p>
              </div>
            </div>
            <button className="text-red-600 hover:text-red-900 text-sm font-medium">
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBackupTab = () => (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Veri Yedekleme</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Otomatik Yedekleme</h4>
            <p className="text-sm text-gray-500 mb-4">Verileriniz güvenli bir şekilde yedeklenir</p>
            <div className="flex items-center space-x-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
              <span className="text-sm text-gray-700">Etkin</span>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Yedekleme Sıklığı</h4>
            <select className="input-field">
              <option value="daily">Günlük</option>
              <option value="weekly" selected>Haftalık</option>
              <option value="monthly">Aylık</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6 flex items-center space-x-4">
          <button className="btn-primary flex items-center">
            <Download size={16} className="mr-2" />
            Manuel Yedek İndir
          </button>
          <button className="btn-secondary flex items-center">
            <Upload size={16} className="mr-2" />
            Yedek Geri Yükle
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Son Yedeklemeler</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Tam Sistem Yedeği</p>
              <p className="text-xs text-gray-500">15 Ocak 2024, 02:00 • 2.4 GB</p>
            </div>
            <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
              İndir
            </button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Veritabanı Yedeği</p>
              <p className="text-xs text-gray-500">8 Ocak 2024, 02:00 • 156 MB</p>
            </div>
            <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
              İndir
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'company': return renderCompanyTab();
      case 'security': return renderSecurityTab();
      case 'backup': return renderBackupTab();
      default: return renderCompanyTab();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ayarlar</h1>
          <p className="text-gray-600 mt-2">Sistem konfigürasyonu ve kullanıcı tercihleri</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4 sm:mt-0">
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-lg text-sm">
              {successMessage}
            </div>
          )}
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={20} className="mr-2" />
            {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="card">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Ayarlar yükleniyor...</span>
          </div>
        </div>
      ) : (
        renderTabContent()
      )}
    </div>
  );
};

export default Settings;
