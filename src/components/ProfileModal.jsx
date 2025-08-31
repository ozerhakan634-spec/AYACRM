import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Save, 
  Eye, 
  EyeOff, 
  UserCircle,
  Camera,
  Lock,
  Trash2,
  Upload
} from 'lucide-react';
import { DatabaseService } from '../services/database';
import { AuthService } from '../services/auth';

const ProfileModal = ({ isOpen, onClose, currentUser, onUserUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  // Profil bilgileri state'i
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    position: ''
  });

  // Şifre değiştirme state'i
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    if (isOpen && currentUser) {
      setProfileData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        department: currentUser.department || '',
        position: currentUser.position || ''
      });
      
      // Form'u temizle
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setSuccessMessage('');
      setErrorMessage('');
    }
  }, [isOpen, currentUser]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Profil bilgilerini güncelle
      const updatedUser = await DatabaseService.updateConsultant(currentUser.id, {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        department: profileData.department,
        position: profileData.position
      });

      // Session'daki kullanıcı bilgilerini güncelle
      const sessionUser = {
        ...currentUser,
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        department: profileData.department,
        position: profileData.position
      };

      sessionStorage.setItem('currentUser', JSON.stringify(sessionUser));
      
      if (onUserUpdate) {
        onUserUpdate(sessionUser);
      }

      setSuccessMessage('Profil bilgileriniz başarıyla güncellendi!');
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

    } catch (error) {
      console.error('❌ Profil güncelleme hatası:', error);
      setErrorMessage('Profil bilgileri güncellenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Form validasyonu
      if (!passwordData.currentPassword) {
        setErrorMessage('Mevcut şifrenizi girin.');
        return;
      }

      if (!passwordData.newPassword) {
        setErrorMessage('Yeni şifrenizi girin.');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        setErrorMessage('Yeni şifre en az 6 karakter olmalıdır.');
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setErrorMessage('Yeni şifreler eşleşmiyor.');
        return;
      }

      // Mevcut şifreyi doğrula
      const isCurrentPasswordValid = await AuthService.login(currentUser.username, passwordData.currentPassword);
      
      if (!isCurrentPasswordValid.success) {
        setErrorMessage('Mevcut şifreniz hatalı.');
        return;
      }

      // Sadece şifreyi güncelle (username değiştirme)
      await DatabaseService.updateConsultantPassword(
        currentUser.id, 
        passwordData.newPassword
      );

      setSuccessMessage('Şifreniz başarıyla değiştirildi!');
      
      // Form'u temizle
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

    } catch (error) {
      console.error('❌ Şifre değiştirme hatası:', error);
      setErrorMessage('Şifre değiştirilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      console.log('📸 Fotoğraf yükleme başlıyor:', file.name);

      const result = await DatabaseService.uploadProfilePhoto(currentUser.id, file);

      if (result.success) {
        console.log('✅ Fotoğraf başarıyla yüklendi:', result.photoUrl);
        
        // Session'daki kullanıcı bilgilerini güncelle
        const updatedUser = {
          ...currentUser,
          profile_photo_url: result.photoUrl,
          profile_photo_filename: result.fileName
        };

        sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
        console.log('📱 Session güncellendi:', updatedUser);
        
        if (onUserUpdate) {
          onUserUpdate(updatedUser);
        }

        setSuccessMessage('Profil fotoğrafınız başarıyla güncellendi!');
        
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        console.error('❌ Fotoğraf yükleme hatası:', result.error);
        setErrorMessage(result.error || 'Fotoğraf yüklenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('💥 Fotoğraf yükleme hatası:', error);
      setErrorMessage('Fotoğraf yüklenirken bir hata oluştu.');
    } finally {
      setUploadingPhoto(false);
      // File input'u temizle
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePhotoDelete = async () => {
    if (!currentUser.profile_photo_url) return;

    setUploadingPhoto(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      console.log('🗑️ Fotoğraf silme başlıyor');

      const result = await DatabaseService.deleteProfilePhoto(currentUser.id);

      if (result.success) {
        console.log('✅ Fotoğraf başarıyla silindi');
        
        // Session'daki kullanıcı bilgilerini güncelle
        const updatedUser = {
          ...currentUser,
          profile_photo_url: null,
          profile_photo_filename: null
        };

        sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
        console.log('📱 Session güncellendi (fotoğraf silindi):', updatedUser);
        
        if (onUserUpdate) {
          onUserUpdate(updatedUser);
        }

        setSuccessMessage('Profil fotoğrafınız başarıyla silindi!');
        
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        console.error('❌ Fotoğraf silme hatası:', result.error);
        setErrorMessage(result.error || 'Fotoğraf silinirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('💥 Fotoğraf silme hatası:', error);
      setErrorMessage('Fotoğraf silinirken bir hata oluştu.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <UserCircle size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Profil Yönetimi</h2>
                <p className="text-blue-100 text-sm">{currentUser?.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'profile'
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <User size={16} />
                <span>Profil Bilgileri</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'password'
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Lock size={16} />
                <span>Şifre Değiştir</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* Success/Error Messages */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {successMessage}
            </div>
          )}
          
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {errorMessage}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="relative">
                  {currentUser?.profile_photo_url ? (
                    <img
                      src={currentUser.profile_photo_url}
                      alt={currentUser.name}
                      className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-sm"
                      key={currentUser.profile_photo_url} // Force re-render when URL changes
                    />
                  ) : (
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                      <User size={32} className="text-blue-600" />
                    </div>
                  )}
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Profil Fotoğrafı</h3>
                  <p className="text-sm text-gray-500 mb-3">JPG, PNG, WEBP veya GIF formatında (maksimum 5MB)</p>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      disabled={uploadingPhoto}
                      className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {uploadingPhoto ? (
                        <>
                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Yükleniyor...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={14} />
                          <span>Fotoğraf Yükle</span>
                        </>
                      )}
                    </button>
                    {currentUser?.profile_photo_url && (
                      <button
                        type="button"
                        onClick={handlePhotoDelete}
                        disabled={uploadingPhoto}
                        className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Trash2 size={14} />
                        <span>Sil</span>
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ad Soyad *
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-posta
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departman
                  </label>
                  <input
                    type="text"
                    value={profileData.department}
                    onChange={(e) => setProfileData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pozisyon
                  </label>
                  <input
                    type="text"
                    value={profileData.position}
                    onChange={(e) => setProfileData(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kullanıcı Adı
                  </label>
                  <input
                    type="text"
                    value={currentUser?.username || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-1"></span>
                      Kullanıcı adı değiştirilemez
                    </span>
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save size={16} />
                  <span>{loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mevcut Şifre *
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yeni Şifre *
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">En az 6 karakter olmalıdır.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yeni Şifre (Tekrar) *
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Şifre Gereksinimleri:</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• En az 6 karakter uzunluğunda</li>
                  <li>• Güvenlik için büyük harf, küçük harf ve sayı kullanmanız önerilir</li>
                  <li>• Başkalarının tahmin edemeyeceği bir şifre seçin</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Lock size={16} />
                  <span>{loading ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
