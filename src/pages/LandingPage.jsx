import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronUp, ChevronDown } from 'lucide-react';
import emailjs from '@emailjs/browser';

const LandingPage = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1); // 1, 2, 3 sayfaları
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Form state'leri
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null


  // Component mount olduğunda animasyon kontrol et
  useEffect(() => {
    // EmailJS'i initialize et
    emailjs.init('Jq8gMoFG7ScUDnTw9'); // EmailJS Public Key
    
    // Eğer login'den geliyorsak glass wave'leri reverse morph yap
    if (window.previousPath === '/login') {
      const glassLayers = document.querySelectorAll('.glass-wave-layer');
      glassLayers.forEach((layer, index) => {
        setTimeout(() => {
          layer.classList.add('glass-morph-to-waves');
        }, index * 50);
      });
      
      // Cleanup
      const cleanup = setTimeout(() => {
        glassLayers.forEach(layer => {
          layer.classList.remove('glass-morph-to-waves');
        });
      }, 800);
      
      return () => clearTimeout(cleanup);
    }
  }, []);

  // Scroll event listener ekle
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShowScrollTop(scrollY > 300); // 300px'den fazla scroll edildiğinde göster
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = () => {
    // Glass wave'leri form şekline morph et
    const glassLayers = document.querySelectorAll('.glass-wave-layer');
    
    glassLayers.forEach((layer, index) => {
      setTimeout(() => {
        layer.classList.add('glass-morph-to-form');
      }, index * 50);
    });
    
    // Animasyon bitince navigate et
    setTimeout(() => {
      window.previousPath = '/';
      navigate('/login');
    }, 700);
  };

  const handleLearnMore = () => {
    // Scroll to features section
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.phone || !formData.message) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        from_phone: formData.phone,
        message: formData.message,
        admin_email: 'ozerhakan634@gmail.com' // Sizin e-posta adresiniz
      };

      const result = await emailjs.send(
        'service_4gf3bpt', // EmailJS Service ID
        'template_tw5abv6', // EmailJS Template ID
        templateParams,
        'Jq8gMoFG7ScUDnTw9' // EmailJS Public Key
      );

      if (result.status === 200) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('E-posta gönderme hatası:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };



  useEffect(() => {
    let scrollTimeout;
    let isScrolling = false;
    let lastWheelTime = 0;
    
    const handleScroll = (e) => {
      // Scroll event'ini sadece izle, müdahale etme
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // Sayfa pozisyonunu güncelle
      if (scrollY < windowHeight * 0.5) {
        setCurrentPage(1);
      } else if (scrollY < windowHeight * 1.5) {
        setCurrentPage(2);
      } else {
        setCurrentPage(3);
      }
    };

    // Mouse wheel eventi - daha kontrollü
    const handleWheel = (e) => {
      const now = Date.now();
      if (isScrolling || now - lastWheelTime < 500) {
        e.preventDefault();
        return;
      }
      
      lastWheelTime = now;
      isScrolling = true;
      
      if (e.deltaY > 0) {
        // Aşağı scroll
        if (currentPage === 1) {
          e.preventDefault();
          document.getElementById('features')?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
          setCurrentPage(2);
        } else if (currentPage === 2) {
          e.preventDefault();
          document.getElementById('contact')?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
          setCurrentPage(3);
        }
      } else if (e.deltaY < 0) {
        // Yukarı scroll
        if (currentPage === 3) {
          e.preventDefault();
          document.getElementById('features')?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
          setCurrentPage(2);
        } else if (currentPage === 2) {
          e.preventDefault();
          window.scrollTo({ 
            top: 0, 
            behavior: 'smooth' 
          });
          setCurrentPage(1);
        }
      }
      
      setTimeout(() => { 
        isScrolling = false; 
      }, 800);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleWheel);
      clearTimeout(scrollTimeout);
    };
  }, [currentPage]);

  return (
    <div className="relative overflow-auto">
      {/* İlk Ekran - Tam Sayfa */}
      <div className="h-screen relative flex flex-col">

        {/* Üst Bar - Beyaz Arka Plan */}
        <div className="absolute top-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-sm z-10"></div>

        {/* Logo - Sol Üst */}
        <div className="absolute top-6 left-6 z-20">
          <img 
            src="/images/visamod-logo.svg" 
            alt="VisaMod Logo" 
            className="h-10 w-auto"
          />
        </div>

        {/* Üst Sağ Butonlar */}
        <div className="absolute top-6 right-6 z-20 flex gap-3">
          <button 
            onClick={handleLogin}
            className="text-sm text-gray-600 hover:text-gray-800 font-medium px-4 py-2 transition-colors duration-200"
          >
            Giriş
          </button>
          <button 
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-sm text-gray-600 hover:text-gray-800 font-medium px-4 py-2 transition-colors duration-200"
          >
            İletişim
          </button>
        </div>

        {/* Gradient Background - Sadece ilk ekran için */}
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

      {/* Hero Section */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main content */}
          <main className="text-center mt-32">
                <h1 className="text-3xl sm:text-4xl md:text-5xl text-gray-900 leading-tight custom-title-font">
                  <span className="block">Vize Danışmanlık</span>
                  <span className="block">Yönetim Sistemi</span>
                </h1>
                <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                  Müşterilerinizi, danışmanlarınızı ve vize süreçlerinizi tek platformda yönetin. 
                  Basit, etkili ve güvenilir.
                </p>
                <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={handleLogin}
                    className="px-8 py-4 bg-gray-900 text-white font-medium rounded-sm hover:bg-gray-800 transition duration-200"
                  >
                    Başlayın
                  </button>
                  <button
                    onClick={handleLearnMore}
                    className="px-8 py-4 border border-gray-300 text-gray-700 font-medium rounded-sm hover:border-gray-400 transition duration-200"
                  >
                    Daha Fazla Bilgi
                  </button>
                  <button
                    onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                    className="px-8 py-4 bg-gray-900 text-white font-medium rounded-sm hover:bg-gray-800 transition duration-200"
                  >
                    Demo Talep Et
                  </button>
                </div>
                
                {/* Mockup Görsel */}
                <div className="mt-16 flex justify-center">
                  <img 
                    src="/images/laptop-mockup.png" 
                    alt="Vİsamod - Yönetim Sistemleri Mockup" 
                    className="w-full h-auto"
                    style={{ maxWidth: '2048px' }}
                  />
                </div>
          </main>
        </div>
      </div>
      </div>

      {/* İkinci Ekran - Features Section */}
      <div className="h-screen relative">
      <div id="features" className="h-full relative z-10 flex flex-col justify-center items-center"
           style={{
             background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.85), rgba(10, 10, 23, 0.9), rgba(20, 20, 35, 0.85))',
             backdropFilter: 'blur(20px)',
             border: '1px solid rgba(255, 255, 255, 0.08)',
             boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 0 60px rgba(147, 51, 234, 0.5), 0 0 100px rgba(59, 130, 246, 0.4)'
           }}>
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-4">
              Özellikler
            </h2>
            <p className="text-base text-gray-300 max-w-2xl mx-auto">
              Vize danışmanlık süreçlerinizi basitleştiren modern araçlar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="feature-card group cursor-pointer p-6 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:transform hover:scale-105 hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-purple-500/20">
              <h3 className="text-base font-bold text-white mb-3 group-hover:text-purple-200 transition-colors">Müşteri Yönetimi</h3>
              <p className="text-xs text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors">
                Müşteri bilgilerini, vize başvuru durumlarını ve iletişim geçmişini tek yerden takip edin.
              </p>
            </div>

            <div className="feature-card group cursor-pointer p-6 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:transform hover:scale-105 hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-blue-500/20">
              <h3 className="text-base font-bold text-white mb-3 group-hover:text-blue-200 transition-colors">Randevu Sistemi</h3>
              <p className="text-xs text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors">
                Entegre takvim sistemi ile randevularınızı organize edin ve müşterilerinizle koordinasyon sağlayın.
              </p>
            </div>

            <div className="feature-card group cursor-pointer p-6 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:transform hover:scale-105 hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-green-500/20">
              <h3 className="text-base font-bold text-white mb-3 group-hover:text-green-200 transition-colors">Belge Yönetimi</h3>
              <p className="text-xs text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors">
                Vize başvuru belgelerini güvenli bir şekilde saklayın ve organize edin.
              </p>
            </div>

            <div className="feature-card group cursor-pointer p-6 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:transform hover:scale-105 hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-orange-500/20">
              <h3 className="text-base font-bold text-white mb-3 group-hover:text-orange-200 transition-colors">Raporlama & Analiz</h3>
              <p className="text-xs text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors">
                Detaylı raporlar ve analizlerle işletmenizin performansını izleyin.
              </p>
            </div>

            <div className="feature-card group cursor-pointer p-6 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:transform hover:scale-105 hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-red-500/20">
              <h3 className="text-base font-bold text-white mb-3 group-hover:text-red-200 transition-colors">Güvenlik</h3>
              <p className="text-xs text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors">
                Müşteri verileriniz en yüksek güvenlik standartlarıyla korunur.
              </p>
            </div>

            <div className="feature-card group cursor-pointer p-6 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:transform hover:scale-105 hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-cyan-500/20">
              <h3 className="text-base font-bold text-white mb-3 group-hover:text-cyan-200 transition-colors">Verimlilik</h3>
              <p className="text-xs text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors">
                Modern arayüz ve optimize edilmiş iş akışları ile zamandan tasarruf edin.
              </p>
            </div>
          </div>
        </div>
        
        {/* Aşağı Ok - İletişim Bölümüne Git */}
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-center">
          <button 
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-white/60 hover:text-white transition-colors duration-300"
          >
            <ChevronDown size={24} />
          </button>
        </div>
        
      </div>
      </div>

      {/* Üçüncü Ekran - İletişim Formu */}
      <div id="contact" className="min-h-screen relative flex flex-col">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50"></div>
        
        <div className="flex-1 relative z-10 flex flex-col justify-center items-center py-16">
          <div className="w-full max-w-sm mx-auto px-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-light text-gray-800 mb-2">
                İletişim
              </h2>
              <p className="text-sm text-gray-500">
                Bizimle iletişime geçin
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ad/Soyad veya Firma İsmi"
                  className="w-full px-3 py-2.5 border-0 border-b border-gray-200 bg-transparent focus:outline-none focus:border-gray-400 transition-all duration-200 text-sm"
                />
              </div>
              
              <div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="E-posta Adresiniz"
                  className="w-full px-3 py-2.5 border-0 border-b border-gray-200 bg-transparent focus:outline-none focus:border-gray-400 transition-all duration-200 text-sm"
                />
              </div>
              
              <div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Telefon Numaranız"
                  className="w-full px-3 py-2.5 border-0 border-b border-gray-200 bg-transparent focus:outline-none focus:border-gray-400 transition-all duration-200 text-sm"
                />
              </div>
              
              <div>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Mesajınız"
                  rows={3}
                  className="w-full px-3 py-2.5 border-0 border-b border-gray-200 bg-transparent focus:outline-none focus:border-gray-400 transition-all duration-200 resize-none text-sm"
                />
              </div>
              
              {/* Status Messages */}
              {submitStatus === 'success' && (
                <div className="text-green-600 text-sm text-center">
                  Mesajınız başarıyla gönderildi!
                </div>
              )}
              
              {submitStatus === 'error' && (
                <div className="text-red-600 text-sm text-center">
                  Bir hata oluştu. Lütfen tekrar deneyin.
                </div>
              )}
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 bg-gray-800 text-white text-sm font-light rounded-none hover:bg-gray-700 transition duration-200 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
              </button>
            </form>
          </div>
        </div>
        
        {/* Footer - Sayfanın tam en altında */}
        <div className="py-8 text-center bg-white/20 backdrop-blur-sm border-t border-white/30">
          <p className="text-gray-600 text-sm font-medium mb-2">
            info@visamod.com
          </p>
          <p className="text-gray-600 text-sm">
            &copy; 2025 Visamod Müşteri Yönetim Sistemi. Tüm hakları saklıdır.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <span className="underline cursor-pointer hover:text-gray-800 transition-colors">Gizlilik Politikası</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <span className="underline cursor-pointer hover:text-gray-800 transition-colors">Kişisel Verilerin Korunması ve Gizlilik Politikası (KVKK)</span>
          </p>
        </div>
      </div>

              {/* Scroll to Top Button */}
        <button
          onClick={handleScrollToTop}
          className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-white/10 backdrop-blur-md border border-white/20 text-white p-3 rounded-full shadow-lg hover:bg-white/20 hover:border-white/30 transition-all duration-300 ${
            currentPage > 1 
              ? 'opacity-100 scale-100' 
              : 'opacity-0 scale-75 pointer-events-none'
          }`}
          title="Yukarı Çık"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
    </div>
  );
};

export default LandingPage;
