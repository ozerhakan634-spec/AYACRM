import React, { useState, useEffect } from 'react';
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

  // Component mount olduğunda glass emerge efekti
  useEffect(() => {
    // Eğer landing'den geliyorsak form glass'dan çıksın
    if (window.previousPath === '/') {
      const loginForm = document.querySelector('.login-form-container');
      if (loginForm) {
        loginForm.classList.add('form-emerge-from-glass');
        
        // Cleanup
        const cleanup = setTimeout(() => {
          loginForm.classList.remove('form-emerge-from-glass');
        }, 900);
        
        return () => clearTimeout(cleanup);
      }
    }
  }, []);

  // Ana sayfaya dönüş fonksiyonu
  const handleBackToHome = () => {
    // Form glass'a geri karışsın
    const loginForm = document.querySelector('.login-form-container');
    if (loginForm) {
      loginForm.classList.add('form-dissolve-to-glass');
    }
    
    // Glass wave'leri form şeklinden normal şekle morph et
    const glassLayers = document.querySelectorAll('.glass-wave-layer');
    glassLayers.forEach((layer, index) => {
      setTimeout(() => {
        layer.classList.add('glass-morph-to-waves');
      }, 100 + (index * 50));
    });
    
    // Animasyon bitince navigate et
    setTimeout(() => {
      window.previousPath = '/login';
      navigate('/');
    }, 600);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await AuthService.login(formData.username, formData.password);
      
      if (result.success) {
        // Güvenlik kontrolü
        if (!result.user.has_credentials || result.user.status !== 'active') {
          setError('Hesabınız aktif değil veya yetkilendirilmemiş. Sistem yöneticinize başvurun.');
          setIsLoading(false);
          return;
        }

        // Geçici admin kalıntılarını temizle
        sessionStorage.removeItem('isTemporaryAdmin');
        
        setSuccess('Giriş başarılı! Yönlendiriliyorsunuz...');
        
        // User bilgilerini parent component'e gönder
        onLogin(result.user);
        
        // Session storage'a kaydet
        sessionStorage.setItem('currentUser', JSON.stringify(result.user));
        sessionStorage.setItem('isLoggedIn', 'true');
        
        // 1 saniye sonra dashboard'a yönlendir
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        setError(result.message || 'Giriş yapılamadı. Kullanıcı adı veya şifre hatalı.');
      }
    } catch (err) {
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
    if (error) setError('');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 overflow-hidden">
        {/* Glass Effect Wave Layers */}
        <div className="absolute inset-0">
          {/* Glass Wave 1 */}
          <div 
            className="absolute inset-0 backdrop-blur-sm glass-wave-layer"
            style={{
              background: 'linear-gradient(45deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.08))',
              clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0 95%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              animation: 'wave1 12s ease-in-out infinite'
            }}
          ></div>
          
          {/* Glass Wave 2 */}
          <div 
            className="absolute inset-0 backdrop-blur-md glass-wave-layer"
            style={{
              background: 'linear-gradient(-45deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06))',
              clipPath: 'polygon(0 10%, 100% 5%, 100% 90%, 0 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              animation: 'wave2 16s ease-in-out infinite reverse'
            }}
          ></div>
          
          {/* Glass Wave 3 */}
          <div 
            className="absolute inset-0 backdrop-blur-lg glass-wave-layer"
            style={{
              background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.04))',
              clipPath: 'polygon(0 15%, 100% 10%, 100% 95%, 0 85%)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              animation: 'wave3 20s ease-in-out infinite'
            }}
          ></div>
          
          {/* Soft Glass Overlay */}
          <div 
            className="absolute inset-0 backdrop-blur-xl glass-wave-layer"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.03) 0%, transparent 70%)',
              clipPath: 'polygon(0 20%, 100% 15%, 100% 80%, 0 85%)',
              animation: 'glassFloat 24s ease-in-out infinite'
            }}
          ></div>
        </div>

        {/* Hexagonal Pattern Background */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            maskImage: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.6) 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.6) 100%)'
          }}
        ></div>

        {/* Subtle edge gradient blobs */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 -right-40 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-pulse delay-500"></div>
        <div className="absolute top-1/3 -left-40 w-64 h-64 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-pulse delay-300"></div>
      </div>

      {/* CSS Wave Animations */}
      <style jsx>{`
        @keyframes wave1 {
          0%, 100% {
            clip-path: polygon(0 0, 100% 0, 100% 85%, 0 95%);
          }
          25% {
            clip-path: polygon(0 5%, 100% 10%, 100% 90%, 0 85%);
          }
          50% {
            clip-path: polygon(0 10%, 100% 5%, 100% 95%, 0 90%);
          }
          75% {
            clip-path: polygon(0 3%, 100% 15%, 100% 88%, 0 92%);
          }
        }
        
        @keyframes wave2 {
          0%, 100% {
            clip-path: polygon(0 10%, 100% 5%, 100% 90%, 0 100%);
          }
          33% {
            clip-path: polygon(0 15%, 100% 20%, 100% 85%, 0 95%);
          }
          66% {
            clip-path: polygon(0 8%, 100% 12%, 100% 92%, 0 88%);
          }
        }
        
        @keyframes wave3 {
          0%, 100% {
            clip-path: polygon(0 15%, 100% 10%, 100% 95%, 0 85%);
          }
          20% {
            clip-path: polygon(0 20%, 100% 15%, 100% 90%, 0 80%);
          }
          40% {
            clip-path: polygon(0 12%, 100% 8%, 100% 98%, 0 88%);
          }
          60% {
            clip-path: polygon(0 18%, 100% 22%, 100% 85%, 0 92%);
          }
          80% {
            clip-path: polygon(0 25%, 100% 18%, 100% 93%, 0 87%);
          }
        }
        
        @keyframes glassFloat {
          0%, 100% {
            clip-path: polygon(0 20%, 100% 15%, 100% 80%, 0 85%);
            transform: translateY(0px);
          }
          25% {
            clip-path: polygon(0 25%, 100% 20%, 100% 75%, 0 90%);
            transform: translateY(-10px);
          }
          50% {
            clip-path: polygon(0 18%, 100% 12%, 100% 82%, 0 88%);
            transform: translateY(5px);
          }
          75% {
            clip-path: polygon(0 22%, 100% 25%, 100% 78%, 0 83%);
            transform: translateY(-5px);
          }
        }
      `}</style>

      <div className="max-w-md w-full relative z-10">


        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 login-form-container">
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

          {/* Ana Sayfaya Dön Butonu */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleBackToHome}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
            >
              ← Ana Sayfaya Dön
            </button>
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
