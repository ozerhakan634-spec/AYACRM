import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  FileText, 
  Calendar, 
  Settings, 
  Menu, 
  X, 
  UserCircle, 
  LogOut,
  HelpCircle,
  MessageSquare,
  Bell,
  DollarSign,
  BarChart3,
  MessageCircle
} from 'lucide-react';
import { DatabaseService } from '../services/database';
import { AuthService } from '../services/auth';
import { useToastContext } from './Toast';
import ProfileModal from './ProfileModal';
import NotificationBell from './NotificationBell';

const Layout = ({ children, currentUser, onLogout, onUserUpdate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userData, setUserData] = useState(currentUser);
  const [companyLogo, setCompanyLogo] = useState(null);
  const [companyName, setCompanyName] = useState('AYA Journey CRM');
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToastContext();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Müşteriler', href: '/dashboard/clients', icon: Users },
    { name: 'Danışmanlar', href: '/dashboard/consultants', icon: Users },
    { name: 'Takım Yönetimi', href: '/dashboard/team-management', icon: Users },
    { name: 'Görevler', href: '/dashboard/tasks', icon: FileText },
    { name: 'Dokümanlar', href: '/dashboard/documents', icon: FileText },
    { name: 'Takvim', href: '/dashboard/calendar', icon: Calendar },
    { name: 'Raporlar', href: '/dashboard/reports', icon: BarChart3 },
    { name: 'Finans', href: '/dashboard/finance', icon: DollarSign },
    { name: 'Destek', href: '/dashboard/support', icon: MessageCircle },
    { name: 'Destek Yönetimi', href: '/dashboard/support-management', icon: MessageCircle },
    { name: 'Ayarlar', href: '/dashboard/settings', icon: Settings },
  ];

  // Kullanıcının izinlerine göre navigasyonu filtrele
  const filteredNavigation = navigation.filter((item) => {
    if (!currentUser?.permissions) return true;

    switch (item.href) {
      case '/dashboard':
        return true; // Dashboard her zaman görünür
      case '/dashboard/clients':
        return currentUser.permissions.clients;
      case '/dashboard/consultants':
        return currentUser.permissions.consultants;
      case '/dashboard/team-management':
        return currentUser.permissions.consultants; // Takım yönetimi danışman iznine bağlı
      case '/dashboard/tasks':
        return currentUser.permissions.tasks;
      case '/dashboard/documents':
        return currentUser.permissions.documents;
      case '/dashboard/calendar':
        return currentUser.permissions.calendar;
      case '/dashboard/reports':
        return currentUser.permissions.reports;
      case '/dashboard/finance':
        return currentUser.permissions.finance;
      case '/dashboard/support':
        return currentUser.permissions.support;
      case '/dashboard/support-management':
        return currentUser.permissions.support_management; // Destek yönetimi izni gerekli
      case '/dashboard/settings':
        return currentUser.permissions.settings;
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

  const loadCompanySettings = async () => {
    try {
      const settings = await AuthService.getCompanySettings();
      if (settings) {
        setCompanyName(settings.company_name || 'AYA Journey CRM');
        if (settings.logo_url) {
          setCompanyLogo(settings.logo_url);
        }
      }
    } catch (error) {
      console.error('Şirket ayarları yüklenemedi:', error);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const handleUserUpdate = (updatedUser) => {
    setUserData(updatedUser);
    if (onUserUpdate) {
      onUserUpdate(updatedUser);
    }
  };

  const openProfileModal = () => {
    setShowProfileModal(true);
  };

  const handleProfileClick = () => {
    setShowProfileModal(true);
  };

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
                  <span className="text-white font-bold text-lg">A</span>
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
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-gray-100 text-gray-800'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  <item.icon 
                    size={20} 
                    className={`mr-3 ${
                      isActive ? 'text-gray-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
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
          <div className="flex items-center justify-between px-4 py-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Spacer for mobile */}
            <div className="lg:hidden flex-1" />

            {/* Bildirim Bell - en sağda */}
            <div className="flex items-center">
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          user={userData}
          onClose={() => setShowProfileModal(false)}
          onUpdate={handleUserUpdate}
        />
      )}
    </div>
  );
};

export default Layout;
