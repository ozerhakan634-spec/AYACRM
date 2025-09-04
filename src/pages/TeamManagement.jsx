import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Trash2, 
  Mail, 
  Phone, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  Settings,
  Eye,
  EyeOff,
  Save,
  X,
  Key,
  Lock,
  Copy
} from 'lucide-react';
import { DatabaseService } from '../services/database';

const TeamManagement = () => {
  const [consultants, setConsultants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingConsultant, setEditingConsultant] = useState(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [credentialsData, setCredentialsData] = useState({
    username: '',
    password: '',
    consultantId: null,
    isEditing: false,
    hasExistingPassword: false,
    originalPassword: '' // Mevcut şifreyi saklamak için
  });



  const pagePermissions = [
    { key: 'dashboard', name: 'Dashboard', description: 'Ana sayfa görüntüleme' },
    { key: 'clients', name: 'Müşteriler', description: 'Müşteri listesi ve detayları' },
    { key: 'documents', name: 'Belgeler', description: 'Belge yönetimi' },
    { key: 'tasks', name: 'Görevlerim', description: 'Görev yönetimi ve takibi' },
    { key: 'calendar', name: 'Takvim', description: 'Randevu yönetimi' },
    { key: 'reports', name: 'Raporlar', description: 'Analitik raporlar' },
    { key: 'finance', name: 'Finans', description: 'Mali işlemler' },
    { key: 'consultants', name: 'Danışmanlar', description: 'Personel bilgileri' },
    { key: 'chatbot', name: 'AI Asistanı', description: 'Yapay zeka destekli asistan' },
    { key: 'support', name: 'Destek', description: 'Destek talepleri ve yardım' },
    { key: 'support_management', name: 'Destek Yönetimi', description: 'Tüm destek taleplerini yönetme' },
    { key: 'settings', name: 'Ayarlar', description: 'Sistem ayarları' }
  ];

  useEffect(() => {
    loadConsultants();
  }, []);

  const loadConsultants = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await DatabaseService.getConsultants();
      setConsultants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Danışman verilerini yükleme hatası:', err);
      setError('Danışman verileri yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };



  const handleDeleteConsultant = async (id) => {
    if (window.confirm('Bu danışmanı silmek istediğinizden emin misiniz?')) {
      try {
        await DatabaseService.deleteConsultant(id);
        await loadConsultants();
      } catch (err) {
        console.error('Danışman silme hatası:', err);
        setError('Danışman silinirken bir hata oluştu.');
      }
    }
  };

  const handleUpdatePermissions = async (consultantId, permissions) => {
    try {
      await DatabaseService.updateConsultantPermissions(consultantId, permissions);
      await loadConsultants();
      setShowPermissionsModal(false);
      setSelectedConsultant(null);
    } catch (err) {
      console.error('İzin güncelleme hatası:', err);
      setError('İzinler güncellenirken bir hata oluştu.');
    }
  };

  const handleCredentialsClick = async (consultant) => {
    try {
      // Mevcut kimlik bilgilerini kontrol et
      const existingCredentials = await DatabaseService.getConsultantCredentials(consultant.id);
      
      if (existingCredentials) {
        // Mevcut kimlik bilgilerini göster
        setCredentialsData({
          username: existingCredentials.username,
          password: existingCredentials.password,
          consultantId: consultant.id,
          isEditing: true,
          hasExistingPassword: true,
          originalPassword: existingCredentials.password
        });
      } else {
        // Yeni kimlik bilgileri oluştur
        const generatedUsername = generateUsername(consultant.name);
        const generatedPassword = generatePassword();
        
        setCredentialsData({
          username: generatedUsername,
          password: generatedPassword,
          consultantId: consultant.id,
          isEditing: false,
          hasExistingPassword: false,
          originalPassword: ''
        });
      }
      
      setShowCredentialsModal(true);
    } catch (err) {
      console.error('Kimlik bilgileri yükleme hatası:', err);
      setError('Kimlik bilgileri yüklenirken bir hata oluştu.');
    }
  };

  const handleSaveCredentials = async () => {
    try {
      if (credentialsData.isEditing) {
        // Mevcut kullanıcı - şifre değiştirilmiş mi kontrol et
        if (credentialsData.password !== credentialsData.originalPassword) {
          await DatabaseService.updateConsultantCredentials(
            credentialsData.consultantId,
            credentialsData.username,
            credentialsData.password
          );
        } else {
          // Şifre değişmemiş, sadece kullanıcı adını güncelle
          await DatabaseService.updateConsultantUsername(
            credentialsData.consultantId,
            credentialsData.username
          );
        }
      } else {
        // Yeni kullanıcı - her zaman şifre ile birlikte oluştur
        await DatabaseService.createConsultantCredentials(
          credentialsData.consultantId,
          credentialsData.username,
          credentialsData.password
        );
      }
      
      await loadConsultants();
      setShowCredentialsModal(false);
      setCredentialsData({ username: '', password: '', consultantId: null, isEditing: false, hasExistingPassword: false, originalPassword: '' });
      setShowPassword(false);
    } catch (err) {
      console.error('Kimlik bilgileri kaydetme hatası:', err);
      setError('Kimlik bilgileri kaydedilirken bir hata oluştu.');
    }
  };

  const generateUsername = (name) => {
    const cleanName = name.toLowerCase()
      .replace(/ç/g, 'c')
      .replace(/ğ/g, 'g')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ş/g, 's')
      .replace(/ü/g, 'u')
      .replace(/[^a-z]/g, '');
    
    const randomNum = Math.floor(Math.random() * 100);
    return `${cleanName}${randomNum}`;
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Kopyalama başarılı mesajı gösterilebilir
    });
  };



  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'inactive': return 'text-red-600 bg-red-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'inactive': return 'Pasif';
      case 'pending': return 'Bekliyor';
      default: return 'Bilinmiyor';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Takım Yönetimi</h1>
          <p className="text-gray-600 mt-2">Danışman ekibinizi yönetin</p>
        </div>
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Danışman verileri yükleniyor...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Takım Yönetimi</h1>
          <p className="text-gray-600 mt-2">Danışman ekibinizi yönetin ve izinlerini düzenleyin</p>
        </div>

      </div>

      {/* Error Message */}
      {error && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center">
            <AlertCircle size={20} className="text-red-400 mr-2" />
            <span className="text-red-800">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aktif Danışman</p>
              <p className="text-2xl font-bold text-gray-900">
                {consultants.filter(c => c.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100">
              <AlertCircle size={24} className="text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Bekleyen</p>
              <p className="text-2xl font-bold text-gray-900">
                {consultants.filter(c => c.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <Users size={24} className="text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam</p>
              <p className="text-2xl font-bold text-gray-900">{consultants.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Consultants Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Danışman</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">İletişim</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Departman</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Durum</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {consultants.length > 0 ? (
                consultants.map((consultant) => (
                  <tr key={consultant.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{consultant.name}</p>
                        <p className="text-sm text-gray-600">{consultant.position}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail size={14} className="mr-2" />
                          {consultant.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone size={14} className="mr-2" />
                          {consultant.phone}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-900">{consultant.department}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(consultant.status)}`}>
                        {getStatusText(consultant.status)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleCredentialsClick(consultant)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                          title={consultant.has_credentials ? "Kimlik Bilgilerini Görüntüle" : "Kullanıcı Adı ve Şifre Ata"}
                        >
                          {consultant.has_credentials ? <Lock size={16} /> : <Key size={16} />}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedConsultant(consultant);
                            setShowPermissionsModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="İzinleri Düzenle"
                        >
                          <Shield size={16} />
                        </button>

                        <button
                          onClick={() => handleDeleteConsultant(consultant.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Sil"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500">
                    <Users size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>Henüz danışman eklenmemiş</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* Credentials Modal */}
      {showCredentialsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {credentialsData.isEditing ? 'Mevcut Kimlik Bilgileri' : 'Yeni Kimlik Bilgileri Oluştur'}
              </h3>
              <button
                onClick={() => {
                  setShowCredentialsModal(false);
                  setCredentialsData({ username: '', password: '', consultantId: null, isEditing: false, hasExistingPassword: false, originalPassword: '' });
                  setShowPassword(false);
                }}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı Adı</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={credentialsData.username}
                    onChange={(e) => setCredentialsData({...credentialsData, username: e.target.value})}
                    className="input-field flex-1"
                    placeholder="Kullanıcı adı"
                  />
                  <button
                    onClick={() => copyToClipboard(credentialsData.username)}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 border rounded"
                    title="Kopyala"
                  >
                    Kopyala
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={credentialsData.password}
                      onChange={(e) => setCredentialsData({...credentialsData, password: e.target.value})}
                      className="input-field w-full pr-10"
                      placeholder="Şifre"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 text-sm"
                      title={showPassword ? "Şifreyi Gizle" : "Şifreyi Göster"}
                    >
                      {showPassword ? 'Gizle' : 'Göster'}
                    </button>
                  </div>
                  <button
                    onClick={() => copyToClipboard(credentialsData.password)}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 border rounded"
                    title="Kopyala"
                  >
                    Kopyala
                  </button>
                  <button
                    onClick={() => setCredentialsData({...credentialsData, password: generatePassword()})}
                    className="px-2 py-1 text-xs text-blue-500 hover:text-blue-700 border rounded"
                    title="Yeni Şifre Oluştur"
                  >
                    Yeni
                  </button>
                </div>
              </div>



              {!credentialsData.isEditing && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <CheckCircle size={16} className="text-green-600 mr-2" />
                    <span className="text-sm text-green-800">
                      Otomatik oluşturulan kimlik bilgileri. İsterseniz düzenleyebilirsiniz.
                    </span>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3 pt-6">
                <button
                  onClick={() => {
                    setShowCredentialsModal(false);
                    setCredentialsData({ username: '', password: '', consultantId: null, isEditing: false, hasExistingPassword: false, originalPassword: '' });
                    setShowPassword(false);
                  }}
                  className="flex-1 px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveCredentials}
                  className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  {credentialsData.isEditing ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedConsultant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedConsultant.name} - Sayfa Erişim İzinleri
              </h3>
              <button
                onClick={() => {
                  setShowPermissionsModal(false);
                  setSelectedConsultant(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-3">
              {pagePermissions.map((page) => (
                <div key={page.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">{page.name}</span>
                      {selectedConsultant.permissions?.[page.key] ? (
                        <Eye size={16} className="ml-2 text-green-600" />
                      ) : (
                        <EyeOff size={16} className="ml-2 text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{page.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedConsultant.permissions?.[page.key] || false}
                      onChange={(e) => {
                        const updatedPermissions = {
                          ...selectedConsultant.permissions,
                          [page.key]: e.target.checked
                        };
                        setSelectedConsultant({
                          ...selectedConsultant,
                          permissions: updatedPermissions
                        });
                      }}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${
                      selectedConsultant.permissions?.[page.key] ? 'bg-blue-600' : 'bg-gray-200'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                        selectedConsultant.permissions?.[page.key] ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </div>
                  </label>
                </div>
              ))}
            </div>
            
            <div className="flex space-x-3 pt-6">
              <button
                onClick={() => {
                  setShowPermissionsModal(false);
                  setSelectedConsultant(null);
                }}
                className="btn-secondary flex-1"
              >
                İptal
              </button>
              <button
                onClick={() => handleUpdatePermissions(selectedConsultant.id, selectedConsultant.permissions)}
                className="btn-primary flex-1"
              >
                <Save size={16} className="mr-2" />
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
