import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  X,
  Filter,
  Search,
  Send,
  Eye
} from 'lucide-react';
import { DatabaseService } from '../services/database';
import { useToastContext } from '../components/Toast';
import { AuthService } from '../services/auth';

const SupportManagement = () => {
  const { toast } = useToastContext();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [sendingResponse, setSendingResponse] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    loadTickets();
    // Mevcut kullanıcıyı al
    const user = AuthService.getCurrentUser();
    setCurrentUser(user);
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const tickets = await DatabaseService.getSupportTickets();
      setTickets(tickets);
    } catch (error) {
      console.error('Destek talepleri yükleme hatası:', error);
      if (toast) toast.error('Destek talepleri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await DatabaseService.updateSupportTicket(ticketId, { status: newStatus });
      if (toast) toast.success('Durum başarıyla güncellendi');
      await loadTickets(); // Listeyi yenile
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
      if (toast) toast.error('Durum güncellenirken hata oluştu');
    }
  };

  const handleResponseSubmit = async () => {
    if (!selectedTicket || !responseText.trim()) {
      if (toast) toast.error('Lütfen yanıt metni girin');
      return;
    }

    try {
      setSendingResponse(true);
      
      await DatabaseService.updateSupportTicket(selectedTicket.id, {
        admin_response: responseText,
        status: 'resolved'
      });
      
      if (toast) toast.success('Yanıt başarıyla gönderildi');
      setShowResponseModal(false);
      setSelectedTicket(null);
      setResponseText('');
      await loadTickets(); // Listeyi yenile
    } catch (error) {
      console.error('Yanıt gönderme hatası:', error);
      if (toast) toast.error('Yanıt gönderilirken hata oluştu');
    } finally {
      setSendingResponse(false);
    }
  };

  // Destek talebini sil
  const handleDeleteTicket = async (ticketId) => {
    if (!confirm('Bu destek talebini silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await DatabaseService.deleteSupportTicket(ticketId);
      if (toast) toast.success('Destek talebi başarıyla silindi');
      await loadTickets(); // Listeyi yenile
    } catch (error) {
      console.error('Destek talebi silme hatası:', error);
      if (toast) toast.error('Destek talebi silinirken hata oluştu');
    }
  };

  // Toplu seçim fonksiyonları
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTickets([]);
      setSelectAll(false);
    } else {
      setSelectedTickets(filteredTickets.map(ticket => ticket.id));
      setSelectAll(true);
    }
  };

  const handleSelectTicket = (ticketId) => {
    if (selectedTickets.includes(ticketId)) {
      setSelectedTickets(selectedTickets.filter(id => id !== ticketId));
      setSelectAll(false);
    } else {
      setSelectedTickets([...selectedTickets, ticketId]);
      // Eğer tüm talepler seçildiyse "Tümünü Seç" işaretle
      if (selectedTickets.length + 1 === filteredTickets.length) {
        setSelectAll(true);
      }
    }
  };

  // Toplu silme
  const handleBulkDelete = async () => {
    if (selectedTickets.length === 0) {
      if (toast) toast.error('Lütfen silinecek talepleri seçin');
      return;
    }

    const confirmMessage = `Seçili ${selectedTickets.length} destek talebini silmek istediğinizden emin misiniz?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setBulkDeleting(true);
      let successCount = 0;
      let errorCount = 0;

      for (const ticketId of selectedTickets) {
        try {
          await DatabaseService.deleteSupportTicket(ticketId);
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        if (toast) toast.success(`${successCount} destek talebi başarıyla silindi`);
        await loadTickets(); // Listeyi yenile
        setSelectedTickets([]);
        setSelectAll(false);
      }

      if (errorCount > 0) {
        if (toast) toast.error(`${errorCount} talebin silinmesinde hata oluştu`);
      }
    } catch (error) {
      console.error('Toplu silme hatası:', error);
      if (toast) toast.error('Toplu silme işleminde hata oluştu');
    } finally {
      setBulkDeleting(false);
    }
  };

  const openResponseModal = (ticket) => {
    setSelectedTicket(ticket);
    setResponseText(ticket.admin_response || '');
    setShowResponseModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'open': return 'Açık';
      case 'in_progress': return 'İşlemde';
      case 'resolved': return 'Çözüldü';
      case 'closed': return 'Kapalı';
      default: return status;
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'urgent': return 'Acil';
      case 'high': return 'Yüksek';
      case 'medium': return 'Orta';
      case 'low': return 'Düşük';
      default: return priority;
    }
  };

  // Filtreleme
  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    const matchesSearch = searchTerm === '' || 
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Destek Talepleri Yönetimi</h1>
          <p className="text-gray-600 mt-2">Kullanıcı destek taleplerini yönetin ve yanıtlayın</p>
        </div>
      </div>

      {/* Filtreler */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Toplu İşlem Butonları */}
          {selectedTickets.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm font-medium text-blue-900">
                {selectedTickets.length} talep seçildi
              </span>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
              >
                <X size={14} />
                {bulkDeleting ? 'Siliniyor...' : 'Seçilenleri Sil'}
              </button>
            </div>
          )}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Arama</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Konu, ad veya e-posta ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field"
            >
              <option value="all">Tümü</option>
              <option value="open">Açık</option>
              <option value="in_progress">İşlemde</option>
              <option value="resolved">Çözüldü</option>
              <option value="closed">Kapalı</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Öncelik</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="input-field"
            >
              <option value="all">Tümü</option>
              <option value="urgent">Acil</option>
              <option value="high">Yüksek</option>
              <option value="medium">Orta</option>
              <option value="low">Düşük</option>
            </select>
          </div>
        </div>
      </div>

      {/* Destek Talepleri Listesi */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Destek talepleri yükleniyor...</span>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
            <p>Destek talebi bulunamadı</p>
            <p className="text-sm">Filtreleri değiştirerek daha fazla sonuç görebilirsiniz</p>
          </div>
        ) : (
          <div>
            {/* Tümünü Seç Butonu */}
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Tümünü Seç ({filteredTickets.length})
                </span>
              </div>
              {selectedTickets.length > 0 && (
                <span className="text-sm text-blue-600 font-medium">
                  {selectedTickets.length} talep seçildi
                </span>
              )}
            </div>
            
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <div key={ticket.id} className={`border rounded-lg p-4 ${
                  ticket.status === 'resolved' ? 'border-gray-300 bg-gray-50 opacity-60' : 'border-gray-200 bg-white'
                }`}>
                  <div className="flex items-start justify-between">
                    {/* Checkbox */}
                    <div className="flex items-start gap-3 mr-3">
                      <input
                        type="checkbox"
                        checked={selectedTickets.includes(ticket.id)}
                        onChange={() => handleSelectTicket(ticket.id)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 mt-1"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className={`font-semibold ${
                          ticket.status === 'resolved' ? 'text-gray-500' : 'text-gray-900'
                        }`}>{ticket.title}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(ticket.priority)}`}>
                          {getPriorityText(ticket.priority)}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(ticket.status)}`}>
                          {getStatusText(ticket.status)}
                        </span>
                      </div>
                      <p className={`text-sm mb-2 ${
                        ticket.status === 'resolved' ? 'text-gray-400' : 'text-gray-600'
                      }`}>{ticket.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(ticket.created_at).toLocaleDateString('tr-TR')}
                        </span>
                        <span>Gönderen: Kullanıcı ID: {ticket.user_id}</span>
                      </div>
                      {ticket.admin_response && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium text-blue-900 mb-1">Yanıtınız:</p>
                          <p className="text-sm text-blue-800">{ticket.admin_response}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => openResponseModal(ticket)}
                        className="btn-secondary text-sm flex items-center gap-1"
                      >
                        <Send size={14} />
                        Yanıtla
                      </button>
                      
                      {/* Çözüldü Butonu - Sadece açık talepler için */}
                      {ticket.status === 'open' && (
                        <button
                          onClick={() => handleStatusChange(ticket.id, 'resolved')}
                          className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-md hover:bg-green-200 flex items-center gap-1"
                        >
                          <CheckCircle size={12} />
                          Çözüldü
                        </button>
                      )}
                      
                      <select
                        value={ticket.status}
                        onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="open">Açık</option>
                        <option value="in_progress">İşlemde</option>
                        <option value="resolved">Çözüldü</option>
                        <option value="closed">Kapalı</option>
                      </select>
                      
                      {/* Silme Butonu - Sadece admin veya destek yöneticisi */}
                      {(currentUser?.permissions?.settings || currentUser?.permissions?.support) && (
                        <button
                          onClick={() => handleDeleteTicket(ticket.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-md hover:bg-red-200 flex items-center gap-1"
                        >
                          <X size={12} />
                          Sil
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Yanıt Modal */}
      {showResponseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Destek Talebine Yanıt</h3>
              <button
                onClick={() => setShowResponseModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">{selectedTicket?.title}</h4>
              <p className="text-sm text-gray-600 mb-4">{selectedTicket?.description}</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Yanıtınız
              </label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={6}
                className="input-field"
                placeholder="Kullanıcıya yanıtınızı yazın..."
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowResponseModal(false)}
                className="btn-secondary"
              >
                İptal
              </button>
              <button
                onClick={handleResponseSubmit}
                disabled={sendingResponse}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                <Send size={16} />
                {sendingResponse ? 'Gönderiliyor...' : 'Yanıt Gönder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportManagement;
