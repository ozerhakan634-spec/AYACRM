import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  FileText,
  FolderOpen,
  Calendar,
  BarChart3,
  DollarSign,
  Settings,
  Menu,
  X,
  UserCog,
  LogOut,
  UserCircle,
  MessageCircle,
  CheckSquare,
  Bell,
  HelpCircle,
  MessageSquare,
  Mail
} from 'lucide-react';
import { AuthService } from '../services/auth';
import { DatabaseService } from '../services/database';
import ProfileModal from './ProfileModal';

const Layout = ({ children, currentUser, onLogout, onUserUpdate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [userData, setUserData] = useState(currentUser);
  const [companyLogo, setCompanyLogo] = useState(null);
  const [companyName, setCompanyName] = useState('Vize CRM');
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Müşteriler', href: '/dashboard/clients', icon: Users },
    { name: 'Belgeler', href: '/dashboard/documents', icon: FileText },
    { name: 'Finans', href: '/dashboard/finance', icon: DollarSign },
    { name: 'Görevlerim', href: '/dashboard/tasks', icon: CheckSquare },
    { name: 'Takvim', href: '/dashboard/calendar', icon: Calendar },
    { name: 'Raporlar', href: '/dashboard/reports', icon: BarChart3 },
    { name: 'Danışmanlar', href: '/dashboard/consultants', icon: Users },
    { name: 'Takım Yönetimi', href: '/dashboard/team-management', icon: UserCog },
    { name: 'AI Asistanı', href: '/dashboard/chatbot', icon: MessageCircle },
    { name: 'Destek Yönetimi', href: '/dashboard/support-management', icon: HelpCircle },
  ];

  // Sadece izni olan menüleri göster
  const filteredNavigation = navigation.filter(item => {
    if (!currentUser || !currentUser.permissions) return false;
    
    switch (item.href) {
      case '/dashboard':
        return currentUser.permissions.dashboard;
      case '/dashboard/clients':
        return currentUser.permissions.clients;
      case '/dashboard/documents':
        return currentUser.permissions.documents;
      case '/dashboard/tasks':
        return currentUser.permissions.tasks; // Görevlerim için tasks izni gerekli
      case '/dashboard/calendar':
        return currentUser.permissions.calendar;
      case '/dashboard/reports':
        return currentUser.permissions.reports;
      case '/dashboard/finance':
        return currentUser.permissions.finance;
      case '/dashboard/consultants':
        return currentUser.permissions.consultants;
      case '/dashboard/team-management':
        return currentUser.permissions.consultants;
      case '/dashboard/chatbot':
        return currentUser.permissions.chatbot; // AI Asistanı için chatbot izni gerekli

      case '/dashboard/support-management':
        return currentUser.permissions.support_management; // Destek Yönetimi için support_management izni gerekli
    case '/dashboard/email-settings':
      return currentUser.permissions.settings; // E-posta Ayarları için settings izni gerekli
      default:
        return false;
    }
  });

  // currentUser prop'u değiştiğinde userData'yı güncelle
  useEffect(() => {
    setUserData(currentUser);
  }, [currentUser]);

  // Şirket ayarlarını yükle
  useEffect(() => {
    loadCompanySettings();
  }, []);

  // Bildirimları yükle ve periyodik olarak güncelle
  useEffect(() => {
    if (currentUser?.id) {
      loadNotifications();
      
      // Her 30 saniyede bir bildirimleri güncelle
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser?.id]);

  const loadCompanySettings = async () => {
    try {
      const settings = await DatabaseService.getCompanySettings();
      setCompanyLogo(settings.company_logo_url);
      setCompanyName(settings.company_name || 'Vize CRM');
    } catch (error) {
      console.error('❌ Şirket ayarları yüklenemedi:', error);
      // Hata durumunda varsayılan değerleri kullan
    }
  };

  // Kullanıcının bildirimlerini yükle
  const loadNotifications = async () => {
    if (!currentUser?.id) return;
    
    try {
      // Sadece okunmamış bildirimleri al
      const unreadTasks = await DatabaseService.getUserTasks(currentUser.id, true);
      
      // Sadece tamamlanmamış görevleri filtrele
      const pendingUnreadTasks = unreadTasks.filter(task => 
        task.status !== 'completed' && task.status !== 'cancelled'
      );
      
      // Tüm görevleri de al (dropdown'da göstermek için)
      const allUserTasks = await DatabaseService.getUserTasks(currentUser.id);
      const allPendingTasks = allUserTasks.filter(task => 
        task.status !== 'completed' && task.status !== 'cancelled'
      );
      
      console.log('🔔 Okunmamış bildirimler:', pendingUnreadTasks.length, 'adet');
      console.log('🔔 Toplam görevler:', allPendingTasks.length, 'adet');
      
      setNotifications(allPendingTasks); // Dropdown'da tüm görevleri göster
      setNotificationCount(pendingUnreadTasks.length); // Sadece okunmamışların sayısını göster
    } catch (error) {
      console.error('❌ Bildirimler yüklenemedi:', error);
    }
  };

  // Bildirimleri okundu olarak işaretle
  const markNotificationsAsRead = async () => {
    if (!currentUser?.id) return;
    
    try {
      await DatabaseService.markNotificationsAsRead(currentUser.id);
      // Bildirimleri yeniden yükle
      await loadNotifications();
    } catch (error) {
      console.error('❌ Bildirimler okundu işaretlenirken hata:', error);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const handleUserUpdate = (updatedUser) => {
    setUserData(updatedUser);
    // App.jsx'deki ana state'i de güncelle
    if (onUserUpdate) {
      onUserUpdate(updatedUser);
    }
  };

  const openProfileModal = () => {
    setShowProfileModal(true);
  };

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications) {
        // Dropdown içindeki elementlere tıklanmışsa kapatma
        const notificationDropdown = event.target.closest('.notification-dropdown');
        if (!notificationDropdown) {
          setShowNotifications(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 py-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center space-x-3 w-full">
            {companyLogo ? (
              <div className="flex items-center justify-center w-full py-2">
                <div className="h-12 w-auto max-w-[180px] flex items-center justify-center p-2">
                  <img 
                    src={companyLogo} 
                    alt={companyName} 
                    className="h-full w-auto object-contain"
                    style={{ maxHeight: '44px', maxWidth: '170px' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.nextElementSibling.style.display = 'block';
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">V</span>
                </div>
                <span className="ml-3 text-xl font-semibold text-gray-900">{companyName}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-gray-100 text-gray-800'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon 
                      size={20} 
                      className={`mr-3 ${
                        isActive ? 'text-gray-600' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {item.name}
                  </div>
                  {item.name === 'AI Asistanı' && (
                    <span className="text-xs text-gray-400 font-medium">
                      BETA
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Kullanıcı bilgileri ve ayarlar - en altta */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200">
          {/* Kullanıcı Bilgileri */}
          <div className="mb-3 px-3 py-2 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <button
                onClick={openProfileModal}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:ring-2 hover:ring-blue-200 transition-all"
                title="Profil Ayarları"
              >
                {userData?.profile_photo_url ? (
                  <img
                    src={userData.profile_photo_url}
                    alt={userData.name}
                    className="w-8 h-8 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserCircle size={16} className="text-blue-600" />
                  </div>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <button
                  onClick={openProfileModal}
                  className="text-left w-full hover:text-blue-600 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {userData?.name || 'Kullanıcı'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {userData?.department || 'Departman'}
                  </p>
                </button>
              </div>
              <button
                onClick={handleLogout}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Çıkış Yap"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>

          {/* Destek Butonu */}
          {(currentUser?.permissions?.settings || currentUser?.permissions?.support) && (
            <Link
              to="/dashboard/support"
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                location.pathname === '/dashboard/support'
                  ? 'bg-gray-100 text-gray-800'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <HelpCircle 
                size={20} 
                className={`mr-3 ${
                  location.pathname === '/dashboard/support' ? 'text-gray-600' : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              Destek
            </Link>
          )}

          {/* Ayarlar Butonu */}
          {currentUser?.permissions?.settings && (
            <Link
              to="/dashboard/settings"
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                location.pathname === '/dashboard/settings'
                  ? 'bg-gray-100 text-gray-800'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Settings 
                size={20} 
                className={`mr-3 ${
                  location.pathname === '/dashboard/settings' ? 'text-gray-600' : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              Ayarlar
            </Link>
          )}
        </div>


      </div>

      {/* Main content */}
      <div className="lg:pl-72">



        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <Menu size={20} />
            </button>

            {/* Notification icon - positioned at far right */}
            <div className="flex items-center ml-auto">
              {/* Notification Icon */}
              <div className="relative">
                <button
                  onClick={() => {
                    const wasOpen = showNotifications;
                    setShowNotifications(!showNotifications);
                    
                    // Eğer dropdown açılıyorsa bildirimleri okundu işaretle
                    if (!wasOpen && notificationCount > 0) {
                      markNotificationsAsRead();
                    }
                  }}
                  className="p-2 rounded-lg hover:bg-gray-50 transition-colors relative"
                  title="Bildirimler"
                >
                  <Bell size={20} className="text-gray-600" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="notification-dropdown absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">
                        Bildirimler ({notificationCount})
                      </p>
                    </div>
                    
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center">
                        <Bell size={32} className="text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Henüz bildirim yok</p>
                      </div>
                    ) : (
                      <div className="py-1">
                        {notifications.map((task) => (
                          <div
                            key={task.id}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0"
                            onClick={() => {
                              console.log('🔗 GÖREV KARTINA TIKLANDI!');
                              setShowNotifications(false);
                              navigate('/dashboard/tasks');
                            }}
                            style={{ pointerEvents: 'auto' }}
                          >
                            <div className="flex items-start space-x-3">
                              <CheckSquare size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                  {task.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {task.client_name && `Müşteri: ${task.client_name}`}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Öncelik: <span className={`font-medium ${
                                    task.priority === 'high' ? 'text-red-600' :
                                    task.priority === 'medium' ? 'text-yellow-600' :
                                    'text-green-600'
                                  }`}>
                                    {task.priority === 'high' ? 'Yüksek' :
                                     task.priority === 'medium' ? 'Orta' : 'Düşük'}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {notifications.length > 0 && (
                      <div className="px-4 py-2 border-t border-gray-100">
                        <button
                          onClick={() => {
                            console.log('🔗 TÜM GÖREVLER BUTONUNA TIKLANDI!');
                            setShowNotifications(false);
                            navigate('/dashboard/tasks');
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-left"
                          style={{ pointerEvents: 'auto' }}
                        >
                          Tüm görevleri görüntüle →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        currentUser={userData}
        onUserUpdate={handleUserUpdate}
      />
    </div>
  );
};

export default Layout;
