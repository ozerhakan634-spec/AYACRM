import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  User,
  Flag,
  Eye,
  X
} from 'lucide-react';
import { DatabaseService } from '../services/database';
import { AuthService } from '../services/auth';
import { supabase } from '../config/supabase';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterConsultant, setFilterConsultant] = useState('all');

  // Form state for adding/editing tasks
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
    status: 'pending',
    assigned_to: [],
    category: 'general'
  });

  // Çoklu seçim için state
  const [selectedConsultants, setSelectedConsultants] = useState([]);
  const [updatingTasks, setUpdatingTasks] = useState(new Set()); // Güncellenen görevleri takip et

  // Görevleri yükle
  useEffect(() => {
    loadTasks();
    loadConsultants();
  }, []);

  // Filtreleme ve arama
  useEffect(() => {
    let filtered = tasks;

    // Status filtresi
    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }

    // Priority filtresi
    if (filterPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === filterPriority);
    }

    // Arama filtresi
    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Danışman filtresi
    if (filterConsultant !== 'all') {
      filtered = filtered.filter(task => {
        if (!task.assigned_to) return false;
        const assignedTo = Array.isArray(task.assigned_to) ? task.assigned_to : [task.assigned_to];
        return assignedTo.some(assigned => assigned === filterConsultant);
      });
    }

    setFilteredTasks(filtered);
  }, [tasks, filterStatus, filterPriority, filterConsultant, searchTerm]);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Mevcut kullanıcıyı al
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }
      
      console.log('🔍 Kullanıcı görevleri yükleniyor:', currentUser.id, currentUser.name);
      
      // Önce tüm görevleri dene, sonra kullanıcıya özgü filtreleme yap
      try {
        // Kullanıcının görevlerini veritabanından yükle
        const tasksData = await DatabaseService.getUserTasks(currentUser.id);
        
        console.log('📋 Veritabanından alınan görevler:', tasksData);
        
        if (tasksData && tasksData.length > 0) {
          setTasks(tasksData);
          console.log('✅ Görevler başarıyla yüklendi:', tasksData.length);
        } else {
          // Eğer kullanıcıya özel görev yoksa, tüm görevleri al ve kontrol et
          console.log('⚠️ Kullanıcıya özel görev bulunamadı, tüm görevleri kontrol ediliyor...');
          const allTasks = await DatabaseService.getTasks();
          console.log('📋 Tüm görevler:', allTasks);
          setTasks(allTasks || []);
        }
      } catch (dbError) {
        console.error('❌ Veritabanı hatası:', dbError);
        
        // Alternatif: Basit query dene
        console.log('🔄 Basit sorgu deneniyor...');
        const { data: simpleTasks, error: simpleError } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (simpleError) {
          throw simpleError;
        }
        
        console.log('✅ Basit sorgu ile görevler alındı:', simpleTasks);
        setTasks(simpleTasks || []);
      }
      
    } catch (err) {
      console.error('❌ Görevler yüklenirken hata:', err);
      setError('Görevler yüklenirken bir hata oluştu: ' + err.message);
      
      // Hata durumunda boş array
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConsultants = async () => {
    try {
      const consultantsData = await DatabaseService.getConsultants();
      setConsultants(consultantsData || []);
    } catch (err) {
      console.error('Danışmanlar yüklenirken hata:', err);
      // Demo danışman verisi
      setConsultants([
        { id: 1, name: 'Mehmet Kaya', email: 'mehmet@example.com' },
        { id: 2, name: 'Ayşe Demir', email: 'ayse@example.com' },
        { id: 3, name: 'Fatma Şen', email: 'fatma@example.com' },
        { id: 4, name: 'Murat Özkan', email: 'murat@example.com' },
        { id: 5, name: 'Zehra Yıldız', email: 'zehra@example.com' }
      ]);
    }
  };

  const handleAddTask = () => {
    setSelectedTask(null);
    setTaskForm({
      title: '',
      description: '',
      due_date: '',
      priority: 'medium',
      status: 'pending',
      assigned_to: [],
      category: 'general'
    });
    setSelectedConsultants([]);
    setShowAddModal(true);
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      due_date: task.due_date,
      priority: task.priority,
      status: task.status,
      assigned_to: Array.isArray(task.assigned_to) ? task.assigned_to : [task.assigned_to],
      category: task.category
    });
    // Seçilen danışmanları ayarla
    const taskConsultants = Array.isArray(task.assigned_to) ? task.assigned_to : [task.assigned_to];
    const consultantObjects = consultants.filter(consultant => 
      taskConsultants.includes(consultant.name)
    );
    setSelectedConsultants(consultantObjects);
    setShowAddModal(true);
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    try {
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }

      const taskData = {
        ...taskForm,
        created_by: currentUser.name,
        created_by_user_id: currentUser.id
      };

      if (selectedTask) {
        // Güncelle
        console.log('🔄 Görev güncelleniyor:', selectedTask.id);
        await DatabaseService.updateTask(selectedTask.id, taskData, selectedConsultants);
        
        console.log('✅ Görev başarıyla güncellendi');
      } else {
        // Yeni ekle
        console.log('➕ Yeni görev oluşturuluyor');
        await DatabaseService.createTask(taskData, selectedConsultants);
        console.log('✅ Görev başarıyla oluşturuldu');
      }
      
      setShowAddModal(false);
      setSelectedConsultants([]);
      
      // Görevleri yeniden yükle
      await loadTasks();
      
    } catch (err) {
      console.error('❌ Görev kaydedilirken hata:', err);
      setError('Görev kaydedilirken bir hata oluştu: ' + err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Bu görevi silmek istediğinizden emin misiniz?')) {
      try {
        console.log('🗑️ Görev siliniyor:', taskId);
        await DatabaseService.deleteTask(taskId);
        
        // Görevleri yeniden yükle
        await loadTasks();
        console.log('✅ Görev başarıyla silindi');
      } catch (err) {
        console.error('❌ Görev silinirken hata:', err);
        setError('Görev silinirken bir hata oluştu: ' + err.message);
      }
    }
  };

  const handleToggleStatus = async (taskId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      console.log('🔄 Görev durumu güncelleniyor:', taskId, newStatus);
      
      // Sadece status'u güncelle
      await DatabaseService.updateTask(taskId, { status: newStatus });
      
      // Görevleri yeniden yükle
      await loadTasks();
      console.log('✅ Görev durumu başarıyla güncellendi');
    } catch (err) {
      console.error('❌ Görev durumu güncellenirken hata:', err);
      setError('Görev durumu güncellenirken bir hata oluştu: ' + err.message);
    }
  };

  const handleStatusCycle = async (taskId, currentStatus) => {
    try {
      // Loading state'e ekle
      setUpdatingTasks(prev => new Set([...prev, taskId]));
      
      // Durum döngüsü: pending -> in_progress -> completed -> pending
      let newStatus;
      switch (currentStatus) {
        case 'pending':
          newStatus = 'in_progress';
          break;
        case 'in_progress':
          newStatus = 'completed';
          break;
        case 'completed':
          newStatus = 'pending';
          break;
        default:
          newStatus = 'pending';
      }
      
      console.log('🔄 Görev durum döngüsü:', taskId, currentStatus, '->', newStatus);
      
      await DatabaseService.updateTask(taskId, { status: newStatus });
      await loadTasks();
      console.log('✅ Görev durumu değiştirildi');
    } catch (err) {
      console.error('❌ Görev durumu değiştirirken hata:', err);
      setError('Görev durumu değiştirirken bir hata oluştu: ' + err.message);
    } finally {
      // Loading state'den çıkar
      setUpdatingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const handlePriorityCycle = async (taskId, currentPriority) => {
    try {
      // Loading state'e ekle
      setUpdatingTasks(prev => new Set([...prev, taskId]));
      
      // Öncelik döngüsü: low -> medium -> high -> low
      let newPriority;
      switch (currentPriority) {
        case 'low':
          newPriority = 'medium';
          break;
        case 'medium':
          newPriority = 'high';
          break;
        case 'high':
          newPriority = 'low';
          break;
        default:
          newPriority = 'medium';
      }
      
      console.log('🔄 Görev öncelik döngüsü:', taskId, currentPriority, '->', newPriority);
      
      await DatabaseService.updateTask(taskId, { priority: newPriority });
      await loadTasks();
      console.log('✅ Görev önceliği değiştirildi');
    } catch (err) {
      console.error('❌ Görev önceliği değiştirirken hata:', err);
      setError('Görev önceliği değiştirirken bir hata oluştu: ' + err.message);
    } finally {
      // Loading state'den çıkar
      setUpdatingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Tamamlandı';
      case 'in_progress': return 'Devam Ediyor';
      case 'pending': return 'Bekliyor';
      default: return 'Bilinmiyor';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high': return 'Yüksek';
      case 'medium': return 'Orta';
      case 'low': return 'Düşük';
      default: return 'Orta';
    }
  };

  // Danışman seçimi fonksiyonları
  const handleConsultantSelect = (consultant) => {
    if (!selectedConsultants.find(c => c.id === consultant.id)) {
      setSelectedConsultants([...selectedConsultants, consultant]);
    }
  };

  const handleConsultantRemove = (consultantId) => {
    setSelectedConsultants(selectedConsultants.filter(c => c.id !== consultantId));
  };

  const formatAssignedTo = (assignedTo) => {
    if (!assignedTo) return 'Atanmamış';
    if (Array.isArray(assignedTo)) {
      return assignedTo.length > 0 ? assignedTo.join(', ') : 'Atanmamış';
    }
    return assignedTo;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Tarih belirlenmemiş';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
  };

  const isOverdue = (dueDateString) => {
    if (!dueDateString) return false;
    const dueDate = new Date(dueDateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  // İstatistikler
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => isOverdue(t.due_date) && t.status !== 'completed').length
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Görevlerim</h1>
          <p className="text-gray-600 mt-2">Atanmış görevlerinizi yönetin ve takip edin</p>
        </div>
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Görevler yükleniyor...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Görevlerim</h1>
          <p className="text-gray-600 mt-2">Atanmış görevlerinizi yönetin ve takip edin</p>
        </div>
        <button
          onClick={handleAddTask}
          className="btn-primary flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Yeni Görev
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center">
            <AlertCircle size={20} className="text-red-600 mr-3" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Stats - Minimal */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-lg border border-gray-100 p-3 text-center">
          <div className="text-lg font-semibold text-gray-900">{stats.total}</div>
          <div className="text-xs text-gray-500">Toplam</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-3 text-center">
          <div className="text-lg font-semibold text-amber-600">{stats.pending}</div>
          <div className="text-xs text-gray-500">Bekleyen</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-3 text-center">
          <div className="text-lg font-semibold text-blue-600">{stats.inProgress}</div>
          <div className="text-xs text-gray-500">Devam Eden</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-3 text-center">
          <div className="text-lg font-semibold text-green-600">{stats.completed}</div>
          <div className="text-xs text-gray-500">Tamamlanan</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-3 text-center">
          <div className="text-lg font-semibold text-red-500">{stats.overdue}</div>
          <div className="text-xs text-gray-500">Geciken</div>
        </div>
      </div>

      {/* Filters - Minimal */}
      <div className="bg-white rounded-lg border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Görev ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-gray-50"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-gray-50"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="pending">Bekleyen</option>
              <option value="in_progress">Devam Eden</option>
              <option value="completed">Tamamlanan</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-gray-50"
            >
              <option value="all">Tüm Öncelikler</option>
              <option value="high">Yüksek</option>
              <option value="medium">Orta</option>
              <option value="low">Düşük</option>
            </select>
            <select
              value={filterConsultant}
              onChange={(e) => setFilterConsultant(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-gray-50"
            >
              <option value="all">Tüm Danışmanlar</option>
              {consultants.map(consultant => (
                <option key={consultant.id} value={consultant.name}>
                  {consultant.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <div key={task.id} className={`
              ${task.status === 'completed' 
                ? 'bg-gray-50 border-gray-200' 
                : 'bg-white border-gray-100'
              } 
              rounded-lg border p-4 transition-all duration-200
              ${isOverdue(task.due_date) && task.status !== 'completed' 
                ? 'border-red-200 bg-red-50' 
                : 'hover:shadow-sm'
              }
            `}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <button
                    onClick={() => handleToggleStatus(task.id, task.status)}
                    className="mt-0.5"
                  >
                    <CheckCircle2 
                      size={18} 
                      className={`transition-colors ${
                        task.status === 'completed' 
                          ? 'text-green-500 fill-current' 
                          : 'text-gray-300 hover:text-green-500'
                      }`}
                    />
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`font-medium ${
                        task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'
                      }`}>
                        {task.title}
                      </h3>
                      <button
                        onClick={() => handlePriorityCycle(task.id, task.priority)}
                        disabled={updatingTasks.has(task.id)}
                        className={`px-2 py-0.5 text-xs font-medium rounded border transition-all duration-200 hover:scale-105 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${getPriorityColor(task.priority)}`}
                        title={`Öncelik değiştir: ${getPriorityText(task.priority)} → ${
                          task.priority === 'low' ? 'Orta' : 
                          task.priority === 'medium' ? 'Yüksek' : 'Düşük'
                        }`}
                      >
                        {updatingTasks.has(task.id) ? (
                          <div className="inline-flex items-center">
                            <div className="animate-spin rounded-full h-2 w-2 border-b-1 border-current mr-1"></div>
                            {getPriorityText(task.priority)}
                          </div>
                        ) : (
                          <>
                            <Flag size={10} className="inline mr-1" />
                            {getPriorityText(task.priority)}
                          </>
                        )}
                      </button>
                    </div>
                    {task.description && (
                      <p className={`text-sm mb-3 ${task.status === 'completed' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {task.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      {task.due_date && (
                        <div className="flex items-center">
                          <Calendar size={12} className="mr-1" />
                          <span className={isOverdue(task.due_date) && task.status !== 'completed' ? 'text-red-500 font-medium' : ''}>
                            {formatDate(task.due_date)}
                          </span>
                        </div>
                      )}
                      {task.assigned_to && task.assigned_to.length > 0 && (
                        <div className="flex items-center">
                          <User size={12} className="mr-1" />
                          {formatAssignedTo(task.assigned_to)}
                        </div>
                      )}
                      {task.created_by && (
                        <div className="flex items-center">
                          <User size={12} className="mr-1" />
                          <span>Veren: {task.created_by}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleStatusCycle(task.id, task.status)}
                    disabled={updatingTasks.has(task.id)}
                    className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 hover:scale-105 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${getStatusColor(task.status)}`}
                    title={`Durum değiştir: ${getStatusText(task.status)} → ${
                      task.status === 'pending' ? 'Devam Ediyor' : 
                      task.status === 'in_progress' ? 'Tamamlandı' : 'Bekliyor'
                    }`}
                  >
                    {updatingTasks.has(task.id) ? (
                      <div className="inline-flex items-center">
                        <div className="animate-spin rounded-full h-2 w-2 border-b-1 border-current mr-1"></div>
                        {getStatusText(task.status)}
                      </div>
                    ) : (
                      getStatusText(task.status)
                    )}
                  </button>
                  <button
                    onClick={() => handleEditTask(task)}
                    className="p-1.5 text-gray-300 hover:text-blue-500 transition-colors"
                    title="Düzenle"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                    title="Sil"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg border border-gray-100 text-center py-12">
            <CheckCircle2 size={40} className="mx-auto mb-3 text-gray-200" />
            <h3 className="font-medium text-gray-900 mb-2">Görev bulunamadı</h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' 
                ? 'Arama kriterlerinize uygun görev bulunamadı.' 
                : 'Henüz hiç görev eklenmemiş.'}
            </p>
            {!searchTerm && filterStatus === 'all' && filterPriority === 'all' && (
              <button
                onClick={handleAddTask}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                İlk Görevi Ekle
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {selectedTask ? 'Görevi Düzenle' : 'Yeni Görev Ekle'}
            </h2>
            <form onSubmit={handleSubmitTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Başlık *
                </label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bitiş Tarihi
                </label>
                <input
                  type="date"
                  value={taskForm.due_date}
                  onChange={(e) => setTaskForm({...taskForm, due_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Öncelik
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Düşük</option>
                    <option value="medium">Orta</option>
                    <option value="high">Yüksek</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durum
                  </label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({...taskForm, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Bekleyen</option>
                    <option value="in_progress">Devam Eden</option>
                    <option value="completed">Tamamlanan</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Atanan Danışmanlar
                </label>
                
                {/* Seçilen danışmanları göster */}
                {selectedConsultants.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {selectedConsultants.map(consultant => (
                      <span
                        key={consultant.id}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {consultant.name}
                        <button
                          type="button"
                          onClick={() => handleConsultantRemove(consultant.id)}
                          className="ml-2 inline-flex items-center justify-center w-4 h-4 text-blue-600 hover:text-blue-800"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Danışman seçim dropdown'u */}
                <select
                  onChange={(e) => {
                    const consultantId = parseInt(e.target.value);
                    const consultant = consultants.find(c => c.id === consultantId);
                    if (consultant) {
                      handleConsultantSelect(consultant);
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue=""
                >
                  <option value="" disabled>Danışman seçin...</option>
                  {consultants
                    .filter(consultant => !selectedConsultants.find(sc => sc.id === consultant.id))
                    .map(consultant => (
                    <option key={consultant.id} value={consultant.id}>
                      {consultant.name}
                    </option>
                  ))}
                </select>
                
                {consultants.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">Danışman bulunamadı</p>
                )}
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedConsultants([]);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {selectedTask ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
