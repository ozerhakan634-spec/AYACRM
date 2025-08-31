import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { DatabaseService } from '../services/database';

const Dashboard = () => {
  const [clients, setClients] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [financeRecords, setFinanceRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verileri yükle
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Tüm verileri paralel olarak yükle
      const [clientsData, consultantsData, documentsData, financeData] = await Promise.all([
        DatabaseService.getClients(),
        DatabaseService.getConsultants(),
        DatabaseService.getDocuments(),
        DatabaseService.getFinanceRecords()
      ]);
      
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setConsultants(Array.isArray(consultantsData) ? consultantsData : []);
      setDocuments(Array.isArray(documentsData) ? documentsData : []);
      setFinanceRecords(Array.isArray(financeData) ? financeData : []);
      
    } catch (err) {
      console.error('Dashboard veri yükleme hatası:', err);
      setError('Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
    } finally {
      setIsLoading(false);
    }
  };

  // İstatistikleri hesapla
  const totalClients = clients.length;
  const activeClients = clients.filter(client => client.status === 'active').length;
  const pendingClients = clients.filter(client => client.status === 'pending').length;
  const completedClients = clients.filter(client => client.status === 'completed').length;

  // Debug için console.log
  console.log('Dashboard Debug Bilgileri:', {
    totalClients,
    activeClients,
    pendingClients,
    completedClients,
    allClients: clients.map(c => ({ id: c.id, name: c.name, status: c.status }))
  });

  // Yüzde değişimleri hesapla (örnek olarak)
  const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const change = ((current - previous) / previous) * 100;
    return change > 0 ? `+${Math.round(change)}%` : `${Math.round(change)}%`;
  };

  const stats = [
    {
      title: 'Toplam Müşteri',
      value: totalClients.toString(),
      change: calculateChange(totalClients, Math.max(0, totalClients - 5)), // Son 5 müşteri eklenmiş gibi
      changeType: totalClients > 0 ? 'positive' : 'neutral',
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Randevu Alınan Müşteri',
      value: activeClients.toString(),
      change: calculateChange(activeClients, Math.max(0, activeClients - 3)),
      changeType: activeClients > 0 ? 'positive' : 'neutral',
      icon: Calendar,
      color: 'green'
    },
    {
      title: 'Bekleyen Müşteri',
      value: pendingClients.toString(),
      change: calculateChange(pendingClients, Math.max(0, pendingClients - 2)),
      changeType: pendingClients > 0 ? 'positive' : 'neutral',
      icon: Clock,
      color: 'yellow'
    },
    {
      title: 'Tamamlanan',
      value: completedClients.toString(),
      change: calculateChange(completedClients, Math.max(0, completedClients - 1)),
      changeType: completedClients > 0 ? 'positive' : 'neutral',
      icon: CheckCircle,
      color: 'emerald'
    }
  ];

  // Son aktiviteleri müşteri verilerine göre oluştur
  const generateRecentActivities = () => {
    const activities = [];
    const usedClientIds = new Set(); // Hangi müşterilerin kullanıldığını takip et
    
    // Son eklenen müşteriler
    const recentClients = clients
      .sort((a, b) => new Date(b.created_at || b.uploadedDate || '2024-01-01') - new Date(a.created_at || a.uploadedDate || '2024-01-01'))
      .slice(0, 3);
    
    recentClients.forEach((client) => {
      if (!usedClientIds.has(client.id)) {
        const timeAgo = getTimeAgo(client.created_at || client.uploadedDate);
        activities.push({
          id: `client-${client.id}`,
          type: 'client',
          message: `Yeni müşteri kaydı - ${client.name}`,
          time: timeAgo,
          status: client.status,
          client: client
        });
        usedClientIds.add(client.id);
      }
    });

    // Son güncellenen müşteriler (henüz kullanılmamış olanlar)
    const updatedClients = clients
      .filter(client => (client.updated_at || client.lastModified) && !usedClientIds.has(client.id))
      .sort((a, b) => new Date(b.updated_at || b.lastModified || '2024-01-01') - new Date(a.updated_at || a.lastModified || '2024-01-01'))
      .slice(0, 2);
    
    updatedClients.forEach((client) => {
      if (!usedClientIds.has(client.id)) {
        const timeAgo = getTimeAgo(client.updated_at || client.lastModified);
        activities.push({
          id: `update-${client.id}`,
          type: 'update',
          message: `Müşteri bilgileri güncellendi - ${client.name}`,
          time: timeAgo,
          status: 'completed',
          client: client
        });
        usedClientIds.add(client.id);
      }
    });

    // Randevu tarihi yaklaşan müşteriler (henüz kullanılmamış olanlar)
    const upcomingAppointments = clients
      .filter(client => client.appointment_date && client.status === 'active' && !usedClientIds.has(client.id))
      .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
      .slice(0, 2);
    
    upcomingAppointments.forEach((client) => {
      if (!usedClientIds.has(client.id)) {
        const daysUntil = getDaysUntil(client.appointment_date);
        activities.push({
          id: `appointment-${client.id}`,
          type: 'appointment',
          message: `Randevu yaklaşıyor - ${client.name} (${daysUntil})`,
          time: `${daysUntil} gün kaldı`,
          status: 'pending',
          client: client
        });
        usedClientIds.add(client.id);
      }
    });

    // Aktivite türüne göre sırala ve en son 6 tanesini al
    return activities
      .sort((a, b) => {
        const timeA = new Date(a.client.created_at || a.client.updated_at || a.client.appointment_date || '2024-01-01');
        const timeB = new Date(b.client.created_at || b.client.updated_at || b.client.appointment_date || '2024-01-01');
        return timeB - timeA;
      })
      .slice(0, 6);
  };

  // Yardımcı fonksiyonlar
  const getDaysUntil = (dateString) => {
    if (!dateString) return 'Bilinmiyor';
    
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = date - now;
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 0) return 'Geçmiş';
    if (diffInDays === 0) return 'Bugün';
    if (diffInDays === 1) return 'Yarın';
    return `${diffInDays} gün`;
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Bilinmiyor';
    
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Az önce';
    if (diffInHours < 24) return `${diffInHours} saat önce`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} gün önce`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} hafta önce`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} ay önce`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'completed': return 'text-green-600 bg-green-50';
      case 'approved': return 'text-blue-600 bg-blue-50';
      case 'active': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Bekliyor';
      case 'completed': return 'Tamamlandı';
      case 'approved': return 'Onaylandı';
      case 'active': return 'Aktif';
      default: return 'Bilinmiyor';
    }
  };

  // Loading durumu
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Vize danışmanlık işlerinizin genel durumu</p>
        </div>
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Dashboard verileri yükleniyor...</span>
          </div>
        </div>
      </div>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Vize danışmanlık işlerinizin genel durumu</p>
        </div>
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
            <button
              onClick={loadDashboardData}
              className="text-red-600 hover:text-red-800 underline text-sm"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      </div>
    );
  }

  const recentActivities = generateRecentActivities();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Vize danışmanlık işlerinizin genel durumu</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                <stat.icon size={24} className={`text-${stat.color}-600`} />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className={`text-sm font-medium ${
                stat.changeType === 'positive' ? 'text-green-600' : 
                stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {stat.change}
              </span>
              <span className="text-sm text-gray-500 ml-2">geçen aya göre</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Son Aktiviteler</h3>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Tümünü Gör
              </button>
            </div>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.status === 'pending' ? 'bg-yellow-400' :
                      activity.status === 'completed' ? 'bg-green-400' :
                      'bg-blue-400'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                      {getStatusText(activity.status)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock size={48} className="mx-auto mb-2 text-gray-300" />
                  <p>Henüz aktivite bulunmuyor</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
