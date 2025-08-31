import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Database,
  Building,
  Download,
  Upload,
  Clock
} from 'lucide-react';
import { DatabaseService } from '../services/database';
import { BackupService } from '../services/backupService';
import { useToastContext } from '../components/Toast';

const Settings = () => {
  const { toast } = useToastContext();
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
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupHistory, setBackupHistory] = useState([]);

  const tabs = [
    { id: 'company', name: 'Şirket Bilgileri', icon: Building },
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
    loadBackupHistory();
  }, []);

  const loadBackupHistory = () => {
    const history = BackupService.getBackupHistory();
    setBackupHistory(history);
  };

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

  // Tam sistem yedeği indirme
  const handleFullBackup = async () => {
    try {
      setBackupLoading(true);
      if (toast) toast.info('Tam sistem yedeği oluşturuluyor...');

      const result = await BackupService.createFullBackup();
      
      if (result.success) {
        // Dosyayı indir
        BackupService.downloadBackup(result.data, result.filename);
        
        // Geçmişe ekle
        BackupService.addToBackupHistory({
          type: 'full',
          filename: result.filename,
          size: `${(JSON.stringify(result.data).length / (1024 * 1024)).toFixed(2)} MB`,
          records_count: result.data.metadata.total_records
        });
        
        // Geçmişi yenile
        loadBackupHistory();
        
        if (toast) toast.success('Tam sistem yedeği başarıyla indirildi!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Yedekleme hatası:', error);
      if (toast) toast.error(`Yedekleme hatası: ${error.message}`);
    } finally {
      setBackupLoading(false);
    }
  };

  // Sadece veritabanı yedeği indirme
  const handleDatabaseBackup = async () => {
    try {
      setBackupLoading(true);
      if (toast) toast.info('Veritabanı yedeği oluşturuluyor...');

      const result = await BackupService.createDatabaseBackup();
      
      if (result.success) {
        // SQL dosyasını indir
        BackupService.downloadBackup(result.data, result.filename, 'application/sql');
        
        // Geçmişe ekle
        BackupService.addToBackupHistory({
          type: 'database',
          filename: result.filename,
          size: `${(result.data.length / (1024 * 1024)).toFixed(2)} MB`,
          records_count: 'SQL Export'
        });
        
        // Geçmişi yenile
        loadBackupHistory();
        
        if (toast) toast.success('Veritabanı yedeği başarıyla indirildi!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Veritabanı yedekleme hatası:', error);
      if (toast) toast.error(`Veritabanı yedekleme hatası: ${error.message}`);
    } finally {
      setBackupLoading(false);
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







  const renderBackupTab = () => (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Manuel Yedekleme</h3>
        <p className="text-sm text-gray-600 mb-6">Sistem verilerinizi güvenli bir şekilde yedekleyin ve indirin.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Tam Sistem Yedeği</h4>
            <p className="text-xs text-gray-500 mb-4">Tüm veriler JSON formatında</p>
            <button 
              onClick={handleFullBackup}
              disabled={backupLoading}
              className="btn-primary flex items-center w-full justify-center disabled:opacity-50"
            >
              <Download size={16} className="mr-2" />
              {backupLoading ? 'Oluşturuluyor...' : 'Tam Yedek İndir'}
            </button>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Veritabanı Yedeği</h4>
            <p className="text-xs text-gray-500 mb-4">Sadece veriler SQL formatında</p>
            <button 
              onClick={handleDatabaseBackup}
              disabled={backupLoading}
              className="btn-secondary flex items-center w-full justify-center disabled:opacity-50"
            >
              <Database size={16} className="mr-2" />
              {backupLoading ? 'Oluşturuluyor...' : 'DB Yedek İndir'}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Son Yedeklemeler</h3>
        {backupHistory.length > 0 ? (
          <div className="space-y-3">
            {backupHistory.map((backup) => (
              <div key={backup.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {backup.type === 'full' ? '🗂️ Tam Sistem Yedeği' : '🗃️ Veritabanı Yedeği'}
                  </p>
                  <p className="text-xs text-gray-500">
                    <Clock size={12} className="inline mr-1" />
                    {new Date(backup.created_at).toLocaleString('tr-TR')} • {backup.size}
                    {backup.records_count && typeof backup.records_count === 'number' && (
                      <span> • {backup.records_count} kayıt</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                    Tamamlandı
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Database size={48} className="mx-auto mb-4 text-gray-300" />
            <p>Henüz yedekleme yapılmadı</p>
            <p className="text-sm">Yukarıdaki butonları kullanarak yedek oluşturun</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'company': return renderCompanyTab();
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
