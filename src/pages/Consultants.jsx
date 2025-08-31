import React, { useState, useEffect, useCallback } from 'react';
import { useToastContext } from '../components/Toast';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Phone,
  Mail,
  MapPin,
  Calendar,
  Star,
  User
} from 'lucide-react';
import { DatabaseService } from '../services/database';

const Consultants = () => {
  const { toast } = useToastContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, consultant: null });
  const [assignmentModal, setAssignmentModal] = useState({ isOpen: false, consultant: null });

  const [consultants, setConsultants] = useState([]);
  const [clients, setClients] = useState([]);

  // Veritabanından danışman verilerini yükle
  useEffect(() => {
    loadConsultants();
  }, []);

  const loadConsultants = async () => {
    try {
      console.log('🔄 Danışman verileri yükleniyor...');
      const consultantsData = await DatabaseService.getConsultantsWithClientCount();
      
      if (consultantsData && Array.isArray(consultantsData) && consultantsData.length > 0) {
        console.log('✅ Veritabanından danışman verileri yüklendi:', consultantsData.length, 'danışman');
        setConsultants(consultantsData);
      } else {
        console.log('ℹ️ Veritabanında henüz danışman verisi bulunmuyor');
        setConsultants([]); // Boş array
      }
    } catch (error) {
      console.error('❌ Danışman verisi yüklenirken hata:', error);
      setConsultants([]); // Hata durumında boş array
    }
  };

  const loadClients = async () => {
    try {
      console.log('🔄 Müşteri verileri yükleniyor...');
      const clientsData = await DatabaseService.getClients();
      
      if (clientsData && Array.isArray(clientsData) && clientsData.length > 0) {
        console.log('✅ Veritabanından müşteri verileri yüklendi:', clientsData.length, 'müşteri');
        setClients(clientsData);
      } else {
        console.log('ℹ️ Veritabanında henüz müşteri verisi bulunmuyor');
        setClients([]); // Boş array
      }
    } catch (error) {
      console.error('❌ Müşteri verisi yüklenirken hata:', error);
      setClients([]); // Hata durumunda boş array
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'inactive': return 'text-gray-600 bg-gray-50';
      case 'onLeave': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'inactive': return 'Pasif';
      case 'onLeave': return 'İzinde';
      default: return 'Bilinmiyor';
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredConsultants = consultants && Array.isArray(consultants) ? consultants.filter(consultant => {
    const matchesSearch = consultant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         consultant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         consultant.phone.includes(searchTerm);
    const matchesSpecialty = selectedSpecialty === 'all' || consultant.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  }) : [];

  const handleEdit = (consultant) => {
    if (consultant && consultant.id) {
      console.log('Düzenlenecek danışman:', consultant);
      setSelectedConsultant({ ...consultant });
      setIsEditModalOpen(true);
    } else {
      console.error('Geçersiz danışman verisi:', consultant);
      if (toast) toast.error('Danışman bilgileri yüklenemedi', 'Hata');
    }
  };

  const handleAdd = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setSelectedConsultant(null);
    setIsEditModalOpen(false);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleEditConsultant = async (updatedConsultant) => {
    try {
      // Veritabanında danışmanı güncelle - tüm alanları kullan
      const consultantData = {
        name: updatedConsultant.name,
        email: updatedConsultant.email,
        phone: updatedConsultant.phone,
        specialty: updatedConsultant.specialty,
        experience: updatedConsultant.experience,
        location: updatedConsultant.location,
        education: updatedConsultant.education || '',
        certifications: Array.isArray(updatedConsultant.certifications) ? updatedConsultant.certifications.join(', ') : updatedConsultant.certifications || '',
        languages: Array.isArray(updatedConsultant.languages) ? updatedConsultant.languages.join(', ') : updatedConsultant.languages || '',
        notes: updatedConsultant.notes || '',
        rating: updatedConsultant.rating || 5.0,
        status: updatedConsultant.status || 'active'
      };

      const updatedConsultantData = await DatabaseService.updateConsultant(updatedConsultant.id, consultantData);
      
      if (updatedConsultantData) {
        // Başarılı güncelleme sonrası danışman listesini güncelle
        await loadConsultants();
        if (toast) toast.success('Danışman başarıyla güncellendi!', 'Başarılı');
      }
    } catch (error) {
      console.error('Danışman güncellenirken hata:', error);
      if (toast) toast.error('Danışman güncellenirken hata oluştu', 'Hata');
    }
    
    handleCloseEditModal();
  };

  const handleAddConsultant = async (newConsultant) => {
    try {
      // Veritabanına danışman ekle - tüm alanları kullan
      const consultantData = {
        name: newConsultant.name,
        email: newConsultant.email,
        phone: newConsultant.phone,
        specialty: newConsultant.specialty,
        experience: newConsultant.experience,
        location: newConsultant.location,
        education: newConsultant.education || '',
        certifications: Array.isArray(newConsultant.certifications) ? newConsultant.certifications.join(', ') : newConsultant.certifications || '',
        languages: Array.isArray(newConsultant.languages) ? newConsultant.languages.join(', ') : newConsultant.languages || '',
        notes: newConsultant.notes || '',
        rating: 5.0, // Varsayılan değer
        status: 'active'
      };

      const createdConsultant = await DatabaseService.createConsultant(consultantData);
      
      if (createdConsultant) {
        // Başarılı ekleme sonrası danışman listesini güncelle
        await loadConsultants();
        if (toast) toast.success('Danışman başarıyla eklendi!', 'Başarılı');
      }
    } catch (error) {
      console.error('Danışman eklenirken hata:', error);
      if (toast) toast.error('Danışman eklenirken hata oluştu', 'Hata');
    }
    
    handleCloseAddModal();
  };

  const handleDelete = (consultant) => {
    setDeleteModal({ isOpen: true, consultant });
  };

  const confirmDelete = async () => {
    if (deleteModal.consultant) {
      try {
        // Veritabanından danışmanı sil
        await DatabaseService.deleteConsultant(deleteModal.consultant.id);
        
        // Başarılı silme sonrası danışman listesini güncelle
        await loadConsultants();
        if (toast) toast.success('Danışman başarıyla silindi!', 'Başarılı');
      } catch (error) {
        console.error('Danışman silinirken hata:', error);
        if (toast) toast.error('Danışman silinirken hata oluştu', 'Hata');
      }
    }
    setDeleteModal({ isOpen: false, consultant: null });
  };

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, consultant: null });
  };

  const handleAssign = async (consultant) => {
    setAssignmentModal({ isOpen: true, consultant });
    // Modal açıldığında müşteri listesini yükle
    await loadClients();
  };

  const handleCloseAssignmentModal = () => {
    setAssignmentModal({ isOpen: false, consultant: null });
  };

  const handleAssignToClient = async (clientId) => {
    try {
      // Müşteri bilgilerini bul
      const client = clients.find(c => c.id === clientId);
      if (!client) {
        if (toast) toast.warning('Müşteri bulunamadı', 'Uyarı');
        return;
      }

      console.log(`🔄 ${assignmentModal.consultant.name} danışmanı ${client.name || client.full_name} müşterisine atanıyor...`);
      
      // Veritabanına danışman ataması yap
      const updatedClient = await DatabaseService.assignConsultantToClient(
        assignmentModal.consultant.id, 
        clientId
      );
      
      if (updatedClient) {
        // Başarı mesajı göster
        if (toast) toast.success(`${assignmentModal.consultant.name} danışmanı başarıyla atandı`, 'Atama Başarılı');
        
        // Modal'ı kapat
        handleCloseAssignmentModal();
        
        // Müşteri listesini yenile (güncel danışman bilgileri için)
        await loadClients();
        
        console.log('✅ Danışman ataması tamamlandı ve müşteri listesi yenilendi');
      }
      
    } catch (error) {
      console.error('❌ Danışman atama hatası:', error);
      if (toast) toast.error('Danışman atanırken hata oluştu', 'Hata');
    }
  };

  const handleRemoveConsultantFromClient = async (clientId) => {
    try {
      const updatedClient = await DatabaseService.removeConsultantFromClient(clientId);

      if (updatedClient) {
        if (toast) toast.success('Danışman ataması başarıyla kaldırıldı', 'Başarılı');
        await loadClients();
        console.log('✅ Danışman ataması kaldırıldı ve müşteri listesi yenilendi');
      }
    } catch (error) {
      console.error('❌ Danışman ataması kaldırılırken hata:', error);
      if (toast) toast.error('Danışman ataması kaldırılırken hata oluştu', 'Hata');
    }
  };

  const handleToggleStatus = async (consultant) => {
    try {
      const updatedStatus = consultant.status === 'active' ? 'inactive' : 'active';
      const consultantData = {
        status: updatedStatus
      };
      const updatedConsultant = await DatabaseService.updateConsultant(consultant.id, consultantData);

      if (updatedConsultant) {
        if (toast) toast.success(`Danışman durumu ${updatedStatus === 'active' ? 'Aktif' : 'Pasif'} yapıldı`, 'Durum Güncellendi');
        await loadConsultants(); // Veritabanındaki durumu güncelle
      }
    } catch (error) {
      console.error('Danışman durumu güncellenirken hata:', error);
      if (toast) toast.error('Danışman durumu güncellenirken hata oluştu', 'Hata');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Danışmanlar</h1>
          <p className="text-gray-600 mt-2">Vize danışmanlarını yönetin ve takip edin</p>
        </div>
        <button 
          className="btn-primary mt-4 sm:mt-0 flex items-center"
          onClick={handleAdd}
        >
          <Plus size={20} className="mr-2" />
          Yeni Danışman
        </button>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Danışman ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="input-field w-auto"
            >
              <option value="all">Tüm Uzmanlık Alanları</option>
              <option value="Öğrenci Vizesi">Öğrenci Vizesi</option>
              <option value="Çalışma Vizesi">Çalışma Vizesi</option>
              <option value="Turist Vizesi">Turist Vizesi</option>
              <option value="Aile Birleşimi">Aile Birleşimi</option>
            </select>
            <button className="btn-secondary flex items-center">
              <Filter size={20} className="mr-2" />
              Filtrele
            </button>
          </div>
        </div>
      </div>

      {/* Consultants Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Danışman
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İletişim
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uzmanlık
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Müşteri Sayısı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredConsultants && filteredConsultants.length > 0 ? (
                filteredConsultants.map((consultant) => (
                  <tr key={consultant.id} className="hover:bg-gray-50">
                    {/* Danışman Bilgileri */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {consultant.profile_photo_url ? (
                            <img
                              src={consultant.profile_photo_url}
                              alt={consultant.name}
                              className="h-10 w-10 rounded-full object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {consultant.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{consultant.name}</div>
                          <div className="text-sm text-gray-500">{consultant.location}</div>
                        </div>
                      </div>
                    </td>

                    {/* İletişim Bilgileri */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail size={14} className="mr-2 text-gray-400" />
                          {consultant.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-900">
                          <Phone size={14} className="mr-2 text-gray-400" />
                          {consultant.phone}
                        </div>
                      </div>
                    </td>

                    {/* Uzmanlık Bilgileri */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-900">{consultant.specialty}</span>
                          <div className="text-xs text-gray-500">{consultant.experience} deneyim</div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {consultant.languages ? (
                            consultant.languages.split(', ').map((language, index) => (
                              <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                                {language.trim()}
                              </span>
                            ))
                          ) : (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-full">
                              Dil bilgisi yok
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Performans Bilgileri */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="inline-block">
                        <div className="text-2xl font-bold text-blue-600">{consultant.totalCases || 0}</div>
                        <div className="text-xs text-gray-500">Müşteri</div>
                      </div>
                    </td>

                    {/* Durum */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(consultant)}
                        className={`px-3 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors hover:opacity-80 ${
                          consultant.status === 'active' 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        title={`${consultant.status === 'active' ? 'Pasif yap' : 'Aktif yap'} için tıklayın`}
                      >
                        {consultant.status === 'active' ? 'Aktif' : 'Pasif'}
                      </button>
                    </td>

                    {/* İşlemler */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-900 p-1"
                          onClick={() => handleAssign(consultant)}
                          title="Müşteriye Ata"
                        >
                          <User size={16} />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-900 p-1"
                          onClick={() => handleEdit(consultant)}
                          title="Düzenle"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900 p-1"
                          onClick={() => handleDelete(consultant)}
                          title="Sil"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <User size={24} className="text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz Danışman Bulunmuyor</h3>
                        <p className="text-gray-500 mb-4">İlk danışmanınızı ekleyerek başlayın</p>
                        <button
                          onClick={handleAdd}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Plus size={16} className="mr-2" />
                          İlk Danışmanı Ekle
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && selectedConsultant && selectedConsultant.id ? (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Danışman Düzenle - {selectedConsultant.name || 'Bilinmeyen'}</h3>
              <button
                onClick={handleCloseEditModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Sol Kolon - Temel Bilgiler */}
              <div className="space-y-6">
                <div className="card">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Temel Bilgiler</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                      <input
                        type="text"
                        value={selectedConsultant.name || ''}
                        onChange={(e) => setSelectedConsultant({...selectedConsultant, name: e.target.value})}
                        className="input-field"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                      <input
                        type="email"
                        value={selectedConsultant.email || ''}
                        onChange={(e) => setSelectedConsultant({...selectedConsultant, email: e.target.value})}
                        className="input-field"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                      <input
                        type="text"
                        value={selectedConsultant.phone || ''}
                        onChange={(e) => setSelectedConsultant({...selectedConsultant, phone: e.target.value})}
                        className="input-field"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Uzmanlık Alanı</label>
                      <select
                        value={selectedConsultant.specialty || 'Öğrenci Vizesi'}
                        onChange={(e) => setSelectedConsultant({...selectedConsultant, specialty: e.target.value})}
                        className="input-field"
                      >
                        <option value="Öğrenci Vizesi">Öğrenci Vizesi</option>
                        <option value="Çalışma Vizesi">Çalışma Vizesi</option>
                        <option value="Turist Vizesi">Turist Vizesi</option>
                        <option value="Aile Birleşimi">Aile Birleşimi</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Deneyim</label>
                      <input
                        type="text"
                        value={selectedConsultant.experience || ''}
                        onChange={(e) => setSelectedConsultant({...selectedConsultant, experience: e.target.value})}
                        className="input-field"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Konum</label>
                      <input
                        type="text"
                        value={selectedConsultant.location || ''}
                        onChange={(e) => setSelectedConsultant({...selectedConsultant, location: e.target.value})}
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Sağ Kolon - Detay Bilgileri */}
              <div className="space-y-6">
                <div className="card">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Detay Bilgileri</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Eğitim</label>
                      <textarea
                        value={selectedConsultant.education || ''}
                        onChange={(e) => setSelectedConsultant({...selectedConsultant, education: e.target.value})}
                        className="input-field"
                        rows="2"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sertifikalar</label>
                      <textarea
                        value={selectedConsultant.certifications || ''}
                        onChange={(e) => setSelectedConsultant({...selectedConsultant, certifications: e.target.value})}
                        className="input-field"
                        rows="2"
                        placeholder="Virgülle ayırarak yazın"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Konuştuğu Diller</label>
                      <textarea
                        value={selectedConsultant.languages || ''}
                        onChange={(e) => setSelectedConsultant({...selectedConsultant, languages: e.target.value})}
                        className="input-field"
                        rows="2"
                        placeholder="Virgülle ayırarak yazın"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                      <select
                        value={selectedConsultant.status || 'active'}
                        onChange={(e) => setSelectedConsultant({...selectedConsultant, status: e.target.value})}
                        className="input-field"
                      >
                        <option value="active">Aktif</option>
                        <option value="inactive">Pasif</option>
                        <option value="onLeave">İzinde</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Not</label>
                      <textarea
                        value={selectedConsultant.notes || ''}
                        onChange={(e) => setSelectedConsultant({...selectedConsultant, notes: e.target.value})}
                        className="input-field"
                        rows="3"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
              <button
                onClick={handleCloseEditModal}
                className="btn-secondary"
              >
                İptal
              </button>
              <button
                onClick={() => handleEditConsultant(selectedConsultant)}
                className="btn-primary"
              >
                Değişiklikleri Kaydet
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Yeni Danışman Ekle</h3>
              <button
                onClick={handleCloseAddModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <AddConsultantForm onSubmit={handleAddConsultant} onCancel={handleCloseAddModal} />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.consultant && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-1/4 mx-auto p-6 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              {/* Warning Icon */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              {/* Title */}
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Danışman Silme Onayı
              </h3>
              
              {/* Message */}
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 mb-4">
                  <span className="font-semibold text-gray-700">{deleteModal.consultant.name}</span> danışmanını silmek istediğinizden emin misiniz?
                </p>
                <p className="text-xs text-gray-400">
                  Bu işlem geri alınamaz ve tüm danışman verileri kalıcı olarak silinecektir.
                </p>
              </div>
              
              {/* Buttons */}
              <div className="flex justify-center space-x-3 mt-6">
                <button
                  onClick={cancelDelete}
                  className="btn-secondary px-6 py-2"
                >
                  İptal
                </button>
                <button
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Evet, Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {assignmentModal.isOpen && assignmentModal.consultant && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Danışman Ata - {assignmentModal.consultant.name}
              </h3>
              <button
                onClick={handleCloseAssignmentModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="mb-6">
              <div className="card">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Danışman Bilgileri</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Ad Soyad:</span>
                    <span className="ml-2 text-sm text-gray-900">{assignmentModal.consultant.name}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Uzmanlık:</span>
                    <span className="ml-2 text-sm text-gray-900">{assignmentModal.consultant.specialty}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Deneyim:</span>
                    <span className="ml-2 text-sm text-gray-900">{assignmentModal.consultant.experience}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Konum:</span>
                    <span className="ml-2 text-sm text-gray-900">{assignmentModal.consultant.location}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Müşteri Seçin</h4>
              <div className="card">
                {clients && clients.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            MÜŞTERİ ADI
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            VİZE TÜRÜ
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ÜLKE
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            DURUM
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            İŞLEM
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {clients.map((client) => (
                          <tr key={client.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{client.name || client.full_name || 'İsim yok'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{client.visa_type || client.visaType || 'Belirtilmemiş'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{client.country || client.destination_country || 'Belirtilmemiş'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                (client.status === 'active' || client.status === 'aktif') ? 'text-green-600 bg-green-50' :
                                (client.status === 'pending' || client.status === 'bekliyor') ? 'text-yellow-600 bg-yellow-50' :
                                (client.status === 'completed' || client.status === 'tamamlandı') ? 'text-blue-600 bg-blue-50' :
                                'text-gray-600 bg-gray-50'
                              }`}>
                                {client.status === 'active' || client.status === 'aktif' ? 'Aktif' :
                                 client.status === 'pending' || client.status === 'bekliyor' ? 'Bekliyor' : 
                                 client.status === 'completed' || client.status === 'tamamlandı' ? 'Tamamlandı' : 'Bilinmiyor'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {client.consultant_id ? (
                                <div className="space-y-2">
                                  <div className="text-xs text-gray-500">Mevcut Danışman:</div>
                                  <div className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                    {(() => {
                                      const consultant = consultants.find(c => c.id === client.consultant_id);
                                      return consultant ? consultant.name : 'Bilinmeyen Danışman';
                                    })()}
                                  </div>
                                  <button
                                    onClick={() => handleRemoveConsultantFromClient(client.id)}
                                    className="text-xs text-red-600 hover:text-red-800 underline"
                                    title="Danışman atamasını kaldır"
                                  >
                                    Atamayı Kaldır
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleAssignToClient(client.id)}
                                  className="btn-primary text-sm px-3 py-1"
                                  disabled={client.status === 'completed' || client.status === 'tamamlandı'}
                                >
                                  {(client.status === 'completed' || client.status === 'tamamlandı') ? 'Tamamlandı' : 'Ata'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User size={24} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz Müşteri Bulunmuyor</h3>
                    <p className="text-gray-500">Danışman atamak için önce müşteri eklemelisiniz.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                onClick={handleCloseAssignmentModal}
                className="btn-secondary"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add Consultant Form Component
const AddConsultantForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: 'Öğrenci Vizesi',
    experience: '',
    location: '',
    education: '',
    certifications: '',
    languages: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const consultant = {
      ...formData,
      certifications: formData.certifications ? formData.certifications.split(', ') : [],
      languages: formData.languages ? formData.languages.split(', ') : [],
      status: 'active'
    };
    onSubmit(consultant);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sol Kolon - Temel Bilgiler */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="input-field"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="input-field"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
            <input
              type="text"
              required
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="input-field"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Uzmanlık Alanı *</label>
            <select
              required
              value={formData.specialty}
              onChange={(e) => setFormData({...formData, specialty: e.target.value})}
              className="input-field"
            >
              <option value="Öğrenci Vizesi">Öğrenci Vizesi</option>
              <option value="Çalışma Vizesi">Çalışma Vizesi</option>
              <option value="Turist Vizesi">Turist Vizesi</option>
              <option value="Aile Birleşimi">Aile Birleşimi</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deneyim</label>
            <input
              type="text"
              value={formData.experience}
              onChange={(e) => setFormData({...formData, experience: e.target.value})}
              className="input-field"
              placeholder="örn: 5 yıl"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Konum</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="input-field"
            />
          </div>
        </div>
        
        {/* Sağ Kolon - Detay Bilgileri */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Eğitim</label>
            <textarea
              value={formData.education}
              onChange={(e) => setFormData({...formData, education: e.target.value})}
              className="input-field"
              rows="2"
              placeholder="Eğitim bilgileri..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sertifikalar</label>
            <textarea
              value={formData.certifications}
              onChange={(e) => setFormData({...formData, certifications: e.target.value})}
              className="input-field"
              rows="2"
              placeholder="Virgülle ayırarak yazın"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Konuştuğu Diller</label>
            <textarea
              value={formData.languages}
              onChange={(e) => setFormData({...formData, languages: e.target.value})}
              className="input-field"
              rows="2"
              placeholder="Virgülle ayırarak yazın"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Not</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="input-field"
              rows="3"
              placeholder="Ek notlar..."
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          İptal
        </button>
        <button
          type="submit"
          className="btn-primary"
        >
          Danışman Ekle
        </button>
      </div>
    </form>
  );
};

export default Consultants;
