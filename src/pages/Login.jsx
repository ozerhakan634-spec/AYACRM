import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { AuthService } from '../services/auth';


const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await AuthService.login(formData.username, formData.password);
      
      if (result.success) {
        // Debug: Kullanıcı bilgilerini kontrol et
        console.log('🔍 Login result.user:', result.user);
        console.log('🔍 has_credentials:', result.user.has_credentials, typeof result.user.has_credentials);
        console.log('🔍 status:', result.user.status);
        
        // Güvenlik kontrolü
        if (!result.user.has_credentials || result.user.status !== 'active') {
          console.error('❌ Güvenlik kontrolü başarısız:', {
            has_credentials: result.user.has_credentials,
            status: result.user.status
          });
          setError('Hesabınız aktif değil veya yetkilendirilmemiş. Sistem yöneticinize başvurun.');
          setIsLoading(false);
          return;
        }
        
        console.log('✅ Güvenlik kontrolü başarılı!');

        // Geçici admin kalıntılarını temizle
        sessionStorage.removeItem('isTemporaryAdmin');
        
        setSuccess('Giriş başarılı! Yönlendiriliyorsunuz...');
        
        // User bilgilerini parent component'e gönder
        onLogin(result.user);
        
        // Session storage'a kaydet
        sessionStorage.setItem('currentUser', JSON.stringify(result.user));
        sessionStorage.setItem('isLoggedIn', 'true');
        
        console.log('✅ Güvenli giriş tamamlandı:', {
          userId: result.user.id,
          username: result.user.username,
          permissions: Object.keys(result.user.permissions || {}).filter(p => result.user.permissions[p])
        });
        
        // 1 saniye sonra yönlendir
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        setError(result.message || 'Giriş yapılamadı. Kullanıcı adı veya şifre hatalı.');
      }
    } catch (err) {
      console.error('Login hatası:', err);
      setError('Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Hata mesajını temizle
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo ve Başlık */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">V</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vize CRM</h1>
          <p className="text-gray-600">Danışman Girişi</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Kullanıcı Adı */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kullanıcı Adı
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={20} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Kullanıcı adınızı giriniz"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Şifre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Şifre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={20} className="text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Şifrenizi giriniz"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Hata Mesajı */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <AlertCircle size={16} className="text-red-600 mr-2" />
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              </div>
            )}

            {/* Başarı Mesajı */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center">
                  <CheckCircle size={16} className="text-green-600 mr-2" />
                  <span className="text-sm text-green-800">{success}</span>
                </div>
              </div>
            )}

            {/* Giriş Butonu */}
            <button
              type="submit"
              disabled={isLoading || !formData.username || !formData.password}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                isLoading || !formData.username || !formData.password
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Giriş yapılıyor...</span>
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>Giriş Yap</span>
                </>
              )}
            </button>
          </form>



          {/* Yardım Metni */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Kullanıcı adı ve şifrenizi almak için sistem yöneticinize başvurun.
            </p>
          </div>


        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © 2024 Vize CRM. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
