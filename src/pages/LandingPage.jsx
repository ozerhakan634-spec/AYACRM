import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronUp } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);


  // Component mount olduğunda animasyon kontrol et
  useEffect(() => {
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



  useEffect(() => {
    let scrollTimeout;
    let isScrolling = false;
    
    const handleScroll = (e) => {
      if (isScrolling) return;
      
      e.preventDefault();
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        
        isScrolling = true;
        
        // Eğer scroll pozisyonu yarıdan fazlaysa aşağı git, yoksa yukarı git
        if (scrollY > windowHeight / 2) {
          // Features bölümüne git
          document.getElementById('features')?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
          setIsScrolled(true);
        } else {
          // Ana sayfaya git
          window.scrollTo({ 
            top: 0, 
            behavior: 'smooth' 
          });
          setIsScrolled(false);
        }
        
        // Scroll bitince flag'i sıfırla
        setTimeout(() => {
          isScrolling = false;
        }, 1000);
      }, 50);
    };

    // Mouse wheel eventi
    const handleWheel = (e) => {
      if (isScrolling) {
        e.preventDefault();
        return;
      }
      
      e.preventDefault();
      
      if (e.deltaY > 0 && !isScrolled) {
        // Aşağı scroll - Features'a git
        isScrolling = true;
        document.getElementById('features')?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
        setIsScrolled(true);
        setTimeout(() => { isScrolling = false; }, 1000);
      } else if (e.deltaY < 0 && isScrolled) {
        // Yukarı scroll - Ana sayfaya git
        isScrolling = true;
        window.scrollTo({ 
          top: 0, 
          behavior: 'smooth' 
        });
        setIsScrolled(false);
        setTimeout(() => { isScrolling = false; }, 1000);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: false });
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleWheel);
      clearTimeout(scrollTimeout);
    };
  }, [isScrolled]);

  return (
    <div className="relative overflow-auto">
      {/* İlk Ekran - Tam Sayfa */}
      <div className="h-screen relative flex flex-col">

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
          <main className="text-center">
                <h1 className="text-5xl sm:text-6xl md:text-7xl text-gray-900 leading-tight custom-title-font">
                  <span className="block">Vize Danışmanlık</span>
                  <span className="block">Yönetim Sistemi</span>
                </h1>
                <p className="mt-8 text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
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
        
        {/* Footer - Sayfanın altında sabit */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-gray-300 text-sm leading-none">
            &copy; 2025 Vize Danışmanlık Yönetim Sistemi. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
      </div>

              {/* Scroll to Top Button */}
        <button
          onClick={handleScrollToTop}
          className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-white/10 backdrop-blur-md border border-white/20 text-white p-3 rounded-full shadow-lg hover:bg-white/20 hover:border-white/30 transition-all duration-300 ${
            showScrollTop 
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
