import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { DatabaseService } from '../services/database';
import { useToastContext } from './Toast';

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToastContext();

  // Okunmamış bildirim sayısını getir
  const loadUnreadCount = async () => {
    try {
      const count = await DatabaseService.getUnreadNotificationCount(1); // user_id = 1 (admin)
      setUnreadCount(count);
    } catch (error) {
      console.error('Bildirim sayısı alınırken hata:', error);
    }
  };

  // Bildirimleri getir
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await DatabaseService.supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Bildirimler alınırken hata:', error);
      toast?.error('Bildirimler yüklenirken hata oluştu', 'Hata');
    } finally {
      setLoading(false);
    }
  };

  // Bildirimi okundu işaretle
  const markAsRead = async (notificationId) => {
    try {
      await DatabaseService.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      // Listeyi güncelle
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      
      // Sayıyı güncelle
      loadUnreadCount();
    } catch (error) {
      console.error('Bildirim okundu işaretlenirken hata:', error);
    }
  };

  // Tüm bildirimleri okundu işaretle
  const markAllAsRead = async () => {
    try {
      await DatabaseService.markNotificationsAsRead(1); // user_id = 1
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast?.success('Tüm bildirimler okundu olarak işaretlendi', 'Başarılı');
    } catch (error) {
      console.error('Tüm bildirimler okundu işaretlenirken hata:', error);
    }
  };

  // Modal açıldığında bildirimleri yükle
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  // Sayfa yüklendiğinde sayıyı yükle
  useEffect(() => {
    loadUnreadCount();
    
    // Her 30 saniyede bir sayıyı güncelle
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Bildirim türüne göre ikon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  // Bildirim türüne göre renk
  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="relative">
      {/* Bildirim Zili */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Bildirim Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Bildirimler</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Tümünü okundu işaretle
              </button>
            )}
          </div>

          {/* Bildirim Listesi */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2">Bildirimler yükleniyor...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>Henüz bildirim yok</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${getNotificationColor(notification.type)}`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notification.created_at).toLocaleString('tr-TR')}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                Tümünü Gör
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;


