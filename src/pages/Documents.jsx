import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Upload,
  FileText,
  Image,
  File,
  Calendar,
  User,
  X,
  Paperclip
} from 'lucide-react';
import { DatabaseService } from '../services/database';
import JSZip from 'jszip';

const Documents = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [fileSearchTerm, setFileSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedClient, setSelectedClient] = useState(null);
  const [sortCriteria, setSortCriteria] = useState('newest');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [isNewDocumentModalOpen, setIsNewDocumentModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [bulkUploadFiles, setBulkUploadFiles] = useState([]);
  const [newDocument, setNewDocument] = useState({
    name: '',
    type: 'identity',
    description: '',
    clientName: '',
    fileName: '', // Yeni eklenen
    fileSize: '', // Yeni eklenen
    selectedFile: null // Yeni eklenen
  });
  const [bulkUploadData, setBulkUploadData] = useState({
    selectedClient: null,
    selectedFiles: [],
    uploadProgress: 0,
    isUploading: false
  });

  // Veritabanı verileri için state'ler
  const [clients, setClients] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [documentsWithClients, setDocumentsWithClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sayfalama için state'ler
  const [currentPage, setCurrentPage] = useState(1);
  const [clientsPerPage] = useState(10);

  // Verileri yükle
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Müşterileri ve belgeleri paralel olarak yükle
      const [clientsData, documentsData, documentsWithClientsData] = await Promise.all([
        DatabaseService.getClients(),
        DatabaseService.getDocuments(),
        DatabaseService.getAllDocumentsWithClients()
      ]);
      
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setDocuments(Array.isArray(documentsData) ? documentsData : []);
      setDocumentsWithClients(Array.isArray(documentsWithClientsData) ? documentsWithClientsData : []);
      
    } catch (err) {
      console.error('Belge veri yükleme hatası:', err);
      setError('Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
    } finally {
      setIsLoading(false);
    }
  };

  // Yardımcı fonksiyonlar
  const getTypeColor = (type) => {
    switch (type) {
      case 'identity': return 'text-blue-600 bg-blue-50';
      case 'education': return 'text-green-600 bg-green-50';
      case 'employment': return 'text-purple-600 bg-purple-50';
      case 'financial': return 'text-yellow-600 bg-yellow-50';
      case 'medical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'identity': return 'Kimlik';
      case 'education': return 'Eğitim';
      case 'employment': return 'İstihdam';
      case 'financial': return 'Finansal';
      case 'medical': return 'Sağlık';
      default: return 'Diğer';
    }
  };

  const getDocumentStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      case 'expired': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getDocumentStatusText = (status) => {
    switch (status) {
      case 'verified': return 'Doğrulandı';
      case 'pending': return 'Bekliyor';
      case 'rejected': return 'Reddedildi';
      case 'expired': return 'Süresi Doldu';
      default: return 'Bilinmiyor';
    }
  };

  const getFormatIcon = (format) => {
    switch (format?.toLowerCase()) {
      case 'pdf': return <FileText size={16} />;
      case 'jpg':
      case 'jpeg':
      case 'png': return <Image size={16} />;
      default: return <File size={16} />;
    }
  };

  const getClientStatusText = (status) => {
    switch (status) {
      case 'active': return 'Randevu Alındı';
      case 'pending': return 'Bekliyor';
      case 'completed': return 'Tamamlandı';
      default: return 'Bilinmiyor';
    }
  };

  const getClientStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'completed': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Filtreleme ve arama
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || doc.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Dosya arama filtreleme
  const filteredFiles = documentsWithClients.filter(doc => {
    const searchLower = fileSearchTerm.toLowerCase();
    return doc.originalFileName?.toLowerCase().includes(searchLower) ||
           doc.fileName?.toLowerCase().includes(searchLower) ||
           doc.name?.toLowerCase().includes(searchLower) ||
           doc.clients?.name?.toLowerCase().includes(searchLower) ||
           doc.clientName?.toLowerCase().includes(searchLower) ||
           doc.clients?.email?.toLowerCase().includes(searchLower);
  });

  const filteredClients = clients
    .filter(client => {
      const searchLower = searchTerm.toLowerCase();
      return client.name?.toLowerCase().includes(searchLower) ||
             client.email?.toLowerCase().includes(searchLower) ||
             client.country?.toLowerCase().includes(searchLower) ||
             (client.visa_type || client.visaType || '')?.toLowerCase().includes(searchLower) ||
             (client.application_number || client.applicationNumber || '')?.toLowerCase().includes(searchLower);
    })
    .sort((a, b) => {
      // Bugünün tarihini burada tanımla (tüm case'lerde kullanılabilir)
      const now = new Date();
      
      switch (sortCriteria) {
        case 'newest':
          return new Date(b.uploadedDate || '2024-01-01') - new Date(a.uploadedDate || '2024-01-01');
        case 'oldest':
          return new Date(a.uploadedDate || '2024-01-01') - new Date(b.uploadedDate || '2024-01-01');
        case 'appointmentNear':
          // En yakın randevu (bugünden sonraki en erken tarih)
          const aDate = a.appointment_date ? new Date(a.appointment_date + 'T' + (a.appointment_time || '00:00')) : new Date('9999-12-31');
          const bDate = b.appointment_date ? new Date(b.appointment_date + 'T' + (b.appointment_time || '00:00')) : new Date('9999-12-31');
          
          // Sadece gelecek randevuları sırala
          const aIsFuture = aDate > now;
          const bIsFuture = bDate > now;
          
          if (aIsFuture && !bIsFuture) return -1;
          if (!aIsFuture && bIsFuture) return 1;
          if (!aIsFuture && !bIsFuture) return 0;
          
          return aDate - bDate;
          
        case 'appointmentFar':
          // En uzak randevu (bugünden önceki en geç tarih)
          const aPastDate = a.appointment_date ? new Date(a.appointment_date + 'T' + (a.appointment_time || '00:00')) : new Date('1900-01-01');
          const bPastDate = b.appointment_date ? new Date(b.appointment_date + 'T' + (b.appointment_time || '00:00')) : new Date('1900-01-01');
          
          // Sadece geçmiş randevuları sırala
          const aIsPast = aPastDate < now;
          const bIsPast = bPastDate < now;
          
          if (aIsPast && !bIsPast) return -1;
          if (!aIsPast && bIsPast) return 1;
          if (!aIsPast && !bIsPast) return 0;
          
          return bPastDate - aPastDate;
        default:
          return a.name?.localeCompare(b.name, 'tr') || 0;
      }
    });

  // Sayfalama
  const indexOfLastClient = currentPage * clientsPerPage;
  const indexOfFirstClient = indexOfLastClient - clientsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstClient, indexOfLastClient);
  const totalPages = Math.ceil(filteredClients.length / clientsPerPage);

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  // Event handlers
  const handleClientClick = (client) => {
    setSelectedClient(client);
    setIsClientModalOpen(true);
  };

  const handleFileUpload = async (event, clientId = null) => {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) {
      console.log('Dosya seçilmedi');
      return;
    }

    console.log('🚀 Dosya yükleme başlıyor:', {
      fileCount: files.length,
      files: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
      clientId: clientId
    });
    
    try {
      for (const file of files) {
        console.log(`📁 ${file.name} dosyası işleniyor...`);
        
        // Dosya boyutu kontrolü
        if (file.size > 10 * 1024 * 1024) {
          const errorMsg = `${file.name} dosyası çok büyük! Maksimum 10MB olmalıdır.`;
          console.error(errorMsg);
          alert(errorMsg);
          continue;
        }

        // Dosya tipi kontrolü
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
          const errorMsg = `${file.name} dosya tipi desteklenmiyor! Sadece PDF, JPEG, PNG ve Word dosyaları kabul edilir.`;
          console.error(errorMsg);
          alert(errorMsg);
          continue;
        }

        console.log(`✅ ${file.name} dosyası validasyonu geçti`);

        // Dosyayı veritabanına yükle
        const documentInfo = {
          name: file.name.split('.')[0],
          type: 'identity', // Varsayılan tip, kullanıcı değiştirebilir
          description: '',
          clientId: clientId
        };

        console.log('📋 Belge bilgileri:', documentInfo);

        try {
          const uploadResult = await DatabaseService.uploadFile(file, clientId, documentInfo);
          console.log('✅ Dosya yükleme sonucu:', uploadResult);
          
          if (uploadResult.success) {
            const savedDocument = uploadResult.data;
            console.log('✅ Dosya başarıyla yüklendi:', savedDocument);
            
            // Yerel state'i güncelle
            setUploadedFiles(prev => [...prev, {
              id: savedDocument.id,
              name: savedDocument.name,
              description: savedDocument.description,
              fileName: savedDocument.originalFileName,
              fileSize: savedDocument.fileSize + ' MB',
              fileType: savedDocument.fileType.includes('pdf') ? 'PDF' : 
                        savedDocument.fileType.includes('jpeg') || savedDocument.fileType.includes('jpg') ? 'JPEG' : 
                        savedDocument.fileType.includes('png') ? 'PNG' : 'DOC',
              status: savedDocument.status,
              uploadDate: savedDocument.uploadedDate,
              clientId: savedDocument.clientId
            }]);

            // Belgeler listesini yenile
            await loadData();
            console.log('🔄 Belgeler listesi yenilendi, yeni belge sayısı:', documentsWithClients.length);
            
            alert(`${file.name} dosyası başarıyla yüklendi!`);
          } else {
            console.error(`❌ ${file.name} dosyası yüklenemedi:`, uploadResult.error);
            alert(`${file.name}: ${uploadResult.error}`);
          }
          
        } catch (uploadError) {
          console.error(`❌ ${file.name} dosyası yüklenirken hata:`, uploadError);
          
          let errorMessage = 'Dosya yükleme işlemi sırasında beklenmeyen bir hata oluştu.';
          
          if (uploadError.message) {
            if (uploadError.message.includes('bucket')) {
              errorMessage = 'Storage bucket bulunamadı. Lütfen Supabase Dashboard\'da documents bucket\'ını oluşturun.';
            } else if (uploadError.message.includes('permission')) {
              errorMessage = 'Dosya yükleme izni yok. Lütfen Supabase ayarlarını kontrol edin.';
            } else if (uploadError.message.includes('network')) {
              errorMessage = 'Ağ bağlantısı hatası. Lütfen internet bağlantınızı kontrol edin.';
            }
          }
          
          alert(`${file.name}: ${errorMessage}\n\nHata detayı: ${uploadError.message}`);
        }
      }
    } catch (error) {
      console.error('💥 Genel dosya yükleme hatası:', error);
      alert('Dosya yükleme işlemi sırasında beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.\n\nHata: ' + error.message);
    }

    // Input'u temizle
    event.target.value = '';
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleDeleteFile = async (fileId) => {
    if (window.confirm('Bu dosyayı silmek istediğinizden emin misiniz?')) {
      try {
        // Önce dosya bilgilerini al
        const fileToDelete = uploadedFiles.find(file => file.id === fileId);
        if (fileToDelete) {
          // Veritabanından belgeyi sil
          await DatabaseService.deleteDocument(fileId);
          
          // Yerel state'den kaldır
          setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
          
          // Belgeler listesini yenile
          await loadData();
          
          alert('Dosya başarıyla silindi.');
        }
      } catch (error) {
        console.error('Dosya silme hatası:', error);
        alert('Dosya silinirken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    }
  };



  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'PDF':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'JPEG':
      case 'PNG':
        return <Image className="w-5 h-5 text-blue-500" />;
      case 'DOC':
        return <File className="w-5 h-5 text-blue-600" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'verified':
        return 'Doğrulandı';
      case 'pending':
        return 'Bekliyor';
      case 'rejected':
        return 'Reddedildi';
      default:
        return 'Bilinmiyor';
    }
  };

  // Belge işlemleri
  const handleViewDocument = (doc) => {
    setSelectedDocument(doc);
    setIsViewModalOpen(true);
  };

  const handlePreviewDocument = (doc) => {
    setPreviewDocument(doc);
    setIsPreviewModalOpen(true);
  };

  const handleEditDocument = (doc) => {
    setSelectedDocument(doc);
    setNewDocument({
      name: doc.name,
      type: doc.type,
      description: doc.description,
      clientName: doc.clientName
    });
    setIsEditModalOpen(true);
  };

  const handleDownloadDocument = (doc) => {
    try {
      if (doc.fileUrl) {
        // Dosyayı otomatik indir
        const link = document.createElement('a');
        link.href = doc.fileUrl;
        link.download = doc.originalFileName || doc.name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('📥 Dosya indiriliyor:', doc.originalFileName || doc.name);
      } else {
        alert('Dosya URL\'i bulunamadı. İndirme yapılamıyor.');
      }
    } catch (error) {
      console.error('Dosya indirme hatası:', error);
      alert('Dosya indirilirken bir hata oluştu.');
    }
  };

  const handleDownloadAllDocuments = async (clientId, clientName) => {
    try {
      console.log('📦 ZIP indirme başlıyor, müşteri:', clientName);
      
      // Müşteriye ait tüm belgeleri al
      const clientDocuments = documentsWithClients.filter(doc => doc.clientId === clientId);
      
      if (clientDocuments.length === 0) {
        alert('Bu müşteri için indirilecek belge bulunamadı.');
        return;
      }
      
      console.log('📄 Bulunan belge sayısı:', clientDocuments.length);
      
      // ZIP oluştur
      const zip = new JSZip();
      const downloadPromises = [];
      
      // Her belge için indirme promise'i oluştur
      clientDocuments.forEach((doc, index) => {
        if (doc.fileUrl) {
          const fileName = doc.originalFileName || `${doc.name}_${index + 1}`;
          const fileExtension = doc.fileType?.split('/')[1] || 'unknown';
          const fullFileName = `${fileName}.${fileExtension}`;
          
          console.log(`📥 ${fullFileName} indiriliyor...`);
          
          const downloadPromise = fetch(doc.fileUrl)
            .then(response => response.blob())
            .then(blob => {
              zip.file(fullFileName, blob);
              console.log(`✅ ${fullFileName} ZIP'e eklendi`);
            })
            .catch(error => {
              console.error(`❌ ${fullFileName} indirilemedi:`, error);
            });
          
          downloadPromises.push(downloadPromise);
        }
      });
      
      // Tüm indirmelerin tamamlanmasını bekle
      await Promise.all(downloadPromises);
      
      // ZIP dosyasını oluştur ve indir
      console.log('🗜️ ZIP dosyası oluşturuluyor...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // ZIP dosyasını indir
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `${clientName}_Belgeler_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // URL'i temizle
      URL.revokeObjectURL(link.href);
      
      console.log('✅ ZIP dosyası başarıyla indirildi');
      alert(`${clientName} için ${clientDocuments.length} belge ZIP halinde indirildi!`);
      
    } catch (error) {
      console.error('💥 ZIP indirme hatası:', error);
      alert('ZIP dosyası oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handleDeleteDocument = (doc) => {
    setSelectedDocument(doc);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteDocument = async () => {
    try {
      if (!selectedDocument) {
        alert('Silinecek belge bulunamadı.');
        return;
      }

      // Belgeyi veritabanından sil
      await DatabaseService.deleteDocument(selectedDocument.id);
      
      // Modal'ı kapat
      setIsDeleteModalOpen(false);
      setSelectedDocument(null);
      
      // Belgeler listesini yenile
      await loadData();
      
      alert('Belge başarıyla silindi.');
    } catch (error) {
      console.error('Belge silme hatası:', error);
      alert('Belge silinirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handleBulkUpload = () => {
    setIsBulkUploadModalOpen(true);
    setBulkUploadData({
      selectedClient: null,
      selectedFiles: [],
      uploadProgress: 0,
      isUploading: false
    });
  };

  const handleBulkFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setBulkUploadData(prev => ({
      ...prev,
      selectedFiles: files
    }));
  };

  const handleBulkUploadSubmit = async () => {
    if (!bulkUploadData.selectedClient) {
      alert('Lütfen bir müşteri seçin!');
      return;
    }

    if (bulkUploadData.selectedFiles.length === 0) {
      alert('Lütfen en az bir dosya seçin!');
      return;
    }

    setBulkUploadData(prev => ({ ...prev, isUploading: true, uploadProgress: 0 }));

    try {
      const totalFiles = bulkUploadData.selectedFiles.length;
      let uploadedCount = 0;

      for (let i = 0; i < totalFiles; i++) {
        const file = bulkUploadData.selectedFiles[i];
        
        // Her dosya için belge kaydı oluştur
        const documentData = {
          name: file.name.split('.')[0],
          type: 'bulk_upload',
          description: `Toplu yükleme ile yüklenen dosya: ${file.name}`,
          fileName: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${file.name}`,
          originalFileName: file.name,
          fileSize: (file.size / 1024 / 1024).toFixed(2),
          fileType: file.type,
          status: 'pending',
          clientId: bulkUploadData.selectedClient.id,
          clientName: bulkUploadData.selectedClient.name
        };

        // Dosyayı storage'a yükle
        const uploadResult = await DatabaseService.uploadFile(
          file, 
          bulkUploadData.selectedClient.id, 
          {
            name: documentData.name,
            type: documentData.type,
            description: documentData.description,
            clientName: documentData.clientName
          }
        );
        
        if (uploadResult && uploadResult.success) {
          // Belge zaten veritabanına kaydedildi, sadece sayacı artır
          uploadedCount++;
          console.log(`✅ ${file.name} başarıyla yüklendi (${uploadedCount}/${totalFiles})`);
        } else {
          console.error(`❌ ${file.name} yüklenemedi:`, uploadResult.error || uploadResult);
        }

        // Progress güncelle
        const progress = Math.round(((i + 1) / totalFiles) * 100);
        setBulkUploadData(prev => ({ ...prev, uploadProgress: progress }));
      }

      // Başarı mesajı
      alert(`${uploadedCount} dosya başarıyla yüklendi!`);
      
      // Modal'ı kapat ve verileri yenile
      setIsBulkUploadModalOpen(false);
      loadData();
      
    } catch (error) {
      console.error('💥 Toplu yükleme hatası:', error);
      alert('Toplu yükleme sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setBulkUploadData(prev => ({ ...prev, isUploading: false, uploadProgress: 0 }));
    }
  };

  const handleNewDocument = () => {
    setIsNewDocumentModalOpen(true);
  };

  const handleBulkFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      type: file.type,
      uploadedDate: new Date().toISOString().split('T')[0],
      status: 'pending'
    }));
    setBulkUploadFiles(prev => [...prev, ...newFiles]);
  };

  const removeBulkFile = (fileId) => {
    setBulkUploadFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const saveNewDocument = async () => {
    try {
      if (!newDocument.name || !newDocument.clientName) {
        alert('Lütfen belge adı ve müşteri bilgilerini doldurun.');
        return;
      }

      // Müşteri ID'sini bul
      const selectedClient = clients.find(client => client.name === newDocument.clientName);
      if (!selectedClient) {
        alert('Seçilen müşteri bulunamadı.');
        return;
      }

      // Eğer dosya seçilmişse, önce dosyayı yükle
      if (newDocument.selectedFile) {
        console.log('📁 Dosya yükleniyor:', newDocument.selectedFile.name);
        
        const documentInfo = {
          name: newDocument.name,
          type: newDocument.type,
          description: newDocument.description,
          clientId: selectedClient.id,
          clientName: newDocument.clientName
        };

        // Dosyayı yükle
        const uploadResult = await DatabaseService.uploadFile(newDocument.selectedFile, selectedClient.id, documentInfo);
        if (uploadResult.success) {
          console.log('✅ Dosya başarıyla yüklendi');
        } else {
          console.error('❌ Dosya yüklenemedi:', uploadResult.error);
          alert(`Dosya yüklenemedi: ${uploadResult.error}`);
          return;
        }
        
      } else {
        // Sadece belge bilgilerini kaydet (dosya olmadan)
        const documentData = {
          name: newDocument.name,
          type: newDocument.type,
          description: newDocument.description,
          clientName: newDocument.clientName,
          clientId: selectedClient.id,
          status: 'pending',
          uploadedDate: new Date().toISOString()
        };

        await DatabaseService.createDocument(documentData);
        console.log('✅ Belge bilgileri kaydedildi (dosya olmadan)');
      }
      
      // Modal'ı kapat ve formu temizle
      setIsNewDocumentModalOpen(false);
      setNewDocument({
        name: '',
        type: 'identity',
        description: '',
        clientName: '',
        fileName: '',
        fileSize: '',
        selectedFile: null
      });
      
      // Belgeler listesini yenile
      await loadData();
      
      // Eğer müşteri modal'ı açıksa, onu da güncelle
      if (isClientModalOpen && selectedClient) {
        console.log('🔄 Müşteri modal\'ı güncelleniyor...');
        // Modal zaten açık olduğu için loadData() ile güncellenmiş olacak
      }
      
      alert('Belge başarıyla eklendi!');
      
      // Eğer müşteri modal'ı açıksa, kullanıcıya bilgi ver
      if (isClientModalOpen) {
        alert('Belge eklendi! Müşteri modal\'ında görebilirsiniz.');
      }
      
    } catch (error) {
      console.error('Belge ekleme hatası:', error);
      alert('Belge eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const saveEditedDocument = async () => {
    try {
      if (!selectedDocument || !newDocument.name || !newDocument.clientName) {
        alert('Lütfen gerekli alanları doldurun.');
        return;
      }

      // Belgeyi veritabanında güncelle
      const updates = {
        name: newDocument.name,
        type: newDocument.type,
        description: newDocument.description,
        clientName: newDocument.clientName
      };

      await DatabaseService.updateDocument(selectedDocument.id, updates);
      
      // Modal'ı kapat ve formu temizle
      setIsEditModalOpen(false);
      setSelectedDocument(null);
      setNewDocument({
        name: '',
        type: 'identity',
        description: '',
        clientName: ''
      });
      
      // Belgeler listesini yenile
      await loadData();
      
      alert('Belge başarıyla güncellendi.');
    } catch (error) {
      console.error('Belge güncelleme hatası:', error);
      alert('Belge güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Arama veya sıralama değiştiğinde sayfa numarasını sıfırla
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, fileSearchTerm, sortCriteria]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Belgeler</h1>
          <p className="text-gray-600 mt-2">Müşteri belgelerini yönetin ve takip edin</p>
        </div>
        <div className="flex gap-3 mt-4 sm:mt-0">
          <button 
            onClick={handleBulkUpload}
            className="btn-secondary flex items-center space-x-2"
          >
            <Upload size={20} />
            <span>Toplu Yükleme</span>
          </button>
          <button 
            onClick={handleNewDocument}
            className="btn-primary flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Yeni Belge
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Belgeler yükleniyor...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
            <button
              onClick={loadData}
              className="text-red-600 hover:text-red-800 underline text-sm"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      )}

      {/* Content - sadece loading ve error yoksa göster */}
      {!isLoading && !error && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText size={24} className="text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Toplam Belge</p>
                  <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FileText size={24} className="text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Doğrulanan</p>
                  <p className="text-2xl font-bold text-gray-900">{documents.filter(doc => doc.status === 'verified').length}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <FileText size={24} className="text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Bekleyen</p>
                  <p className="text-2xl font-bold text-gray-900">{documents.filter(doc => doc.status === 'pending').length}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <FileText size={24} className="text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Reddedilen</p>
                  <p className="text-2xl font-bold text-gray-900">{documents.filter(doc => doc.status === 'rejected').length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="card">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Müşteri adı, e-posta, ülke, vize türü, DS/BAŞVURU NO ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <select
                  value={sortCriteria}
                  onChange={(e) => setSortCriteria(e.target.value)}
                  className="input-field w-auto"
                >
                  <option value="newest">En Yeni</option>
                  <option value="oldest">En Eski</option>
                  <option value="appointmentNear">En Yakın Randevu</option>
                  <option value="appointmentFar">En Uzak Randevu</option>
                </select>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="input-field w-auto"
                >
                  <option value="all">Tüm Türler</option>
                  <option value="identity">Kimlik</option>
                  <option value="education">Eğitim</option>
                  <option value="employment">İstihdam</option>
                  <option value="financial">Finansal</option>
                  <option value="medical">Sağlık</option>
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="input-field w-auto"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="verified">Doğrulandı</option>
                  <option value="pending">Bekliyor</option>
                  <option value="rejected">Reddedildi</option>
                  <option value="expired">Süresi Doldu</option>
                </select>
                <button className="btn-secondary flex items-center">
                  <Filter size={20} className="mr-2" />
                  Filtrele
                </button>
              </div>
            </div>
          </div>

          {/* Müşteriler Listesi */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Müşteriler ve Belgeleri</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MÜŞTERİ BİLGİLERİ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      VİZE BİLGİLERİ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DURUM
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      BELGE SAYISI
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İŞLEMLER
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentClients.map((client) => {
                    const clientDocuments = documents.filter(doc => doc.clientName === client.name);
                    return (
                      <tr key={client.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleClientClick(client)}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">
                                {client.name?.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{client.name}</div>
                              <div className="text-sm text-gray-500">{client.email}</div>
                              <div className="text-sm text-gray-500">{client.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{client.visa_type || client.visaType || 'Belirtilmemiş'}</div>
                          <div className="text-sm text-gray-500">{client.country}</div>
                          <div className="text-sm text-gray-500 font-medium">{client.application_number || client.applicationNumber || 'Belirtilmemiş'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getClientStatusColor(client.status)}`}>
                            {getClientStatusText(client.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">{clientDocuments.length}</div>
                          <div className="text-sm text-gray-500">belge</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button 
                              className="text-blue-600 hover:text-blue-900 p-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClientClick(client);
                              }}
                              title="Belgeleri Görüntüle"
                            >
                              <Eye size={16} />
                            </button>
                            <button 
                              className="text-green-600 hover:text-green-900 p-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadAllDocuments(client.id, client.name);
                              }}
                              title="Tüm Belgeleri ZIP Olarak İndir"
                            >
                              <Download size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Sayfalama */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{indexOfFirstClient + 1}</span> - <span className="font-medium">
                      {Math.min(indexOfLastClient, filteredClients.length)}
                    </span> arası, toplam{' '}
                    <span className="font-medium">{filteredClients.length}</span> müşteri
                  </p>
                </div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Önceki
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                    <button
                      key={pageNumber}
                      onClick={() => goToPage(pageNumber)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNumber === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Sonraki
                  </button>
                </nav>
              </div>
            )}
          </div>

          {/* Müşteri Belge Modal */}
          {isClientModalOpen && selectedClient && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-10 mx-auto p-6 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedClient.name} - Belgeler
                  </h3>
                  <button
                    onClick={() => setIsClientModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Sol Kolon - Müşteri Bilgileri */}
                  <div className="space-y-6">
                    <div className="card">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Müşteri Bilgileri</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">Ad Soyad:</span>
                          <span className="text-sm text-gray-900">{selectedClient.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">E-posta:</span>
                          <span className="text-sm text-gray-900">{selectedClient.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">Telefon:</span>
                          <span className="text-sm text-gray-900">{selectedClient.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">Vize Türü:</span>
                          <span className="text-sm text-gray-900">{selectedClient.visa_type || selectedClient.visaType || 'Belirtilmemiş'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">Hedef Ülke:</span>
                          <span className="text-sm text-gray-900">{selectedClient.country}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">DS/BAŞVURU NO:</span>
                          <span className="text-sm text-gray-900 font-medium">{selectedClient.application_number || selectedClient.applicationNumber || 'Belirtilmemiş'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Dosya Yükleme */}
                    <div className="card">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Yeni Belge Yükle</h4>
                      <div className="space-y-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                          <input
                            type="file"
                            multiple
                            onChange={(e) => handleFileUpload(e, selectedClient.id)}
                            className="hidden"
                            id="file-upload"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          />
                          <label htmlFor="file-upload" className="cursor-pointer">
                            <Paperclip size={48} className="mx-auto text-gray-400 mb-4" />
                            <p className="text-sm text-gray-600 mb-2">
                              <span className="font-medium text-blue-600">Dosya seç</span> veya sürükle bırak
                            </p>
                            <p className="text-xs text-gray-500">PDF, JPG, PNG, DOC, DOCX (Max 10MB)</p>
                          </label>
                        </div>
                        
                        {/* Yüklenen Dosyalar */}
                        {uploadedFiles.filter(file => file.clientId === selectedClient.id).length > 0 && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium text-gray-700">Yüklenen Dosyalar:</h5>
                            {uploadedFiles.filter(file => file.clientId === selectedClient.id).map((file) => (
                              <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center space-x-2">
                                  {getFileIcon(file.fileType)}
                                  <span className="text-sm text-gray-900">{file.fileName}</span>
                                  <span className="text-xs text-gray-500">({file.fileSize})</span>
                                </div>
                                <button
                                  onClick={() => handleDeleteFile(file.id)}
                                  className="text-red-600 hover:text-red-800 p-1"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sağ Kolon - Mevcut Belgeler */}
                  <div className="space-y-6">
                    <div className="card">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Mevcut Belgeler</h4>
                      <div className="space-y-3">
                        {documentsWithClients
                          .filter(file => file.clientId === selectedClient.id)
                          .map((file) => (
                          <div key={file.id} className="border rounded-lg p-3 hover:bg-gray-50">
                            <div className="flex items-center space-x-2 mb-2">
                              {getFileIcon(file.fileType?.includes('pdf') ? 'PDF' : 
                                         file.fileType?.includes('jpeg') || file.fileType?.includes('jpg') ? 'JPEG' : 
                                         file.fileType?.includes('png') ? 'PNG' : 'DOC')}
                              <span className="text-sm font-medium text-gray-900">{file.name}</span>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{file.description || 'Açıklama yok'}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <button 
                                onClick={() => handlePreviewDocument(file)}
                                className="text-blue-600 hover:text-blue-800 p-1 text-xs"
                                title="Önizle"
                              >
                                <Eye size={12} />
                              </button>
                              <button 
                                onClick={() => handleDownloadDocument(file)}
                                className="text-green-600 hover:text-green-800 p-1 text-xs"
                                title="İndir"
                              >
                                <Download size={12} />
                              </button>
                              <button 
                                onClick={() => handleEditDocument(file)}
                                className="text-yellow-600 hover:text-yellow-800 p-1 text-xs"
                                title="Düzenle"
                              >
                                <Edit size={12} />
                              </button>
                              <button 
                                onClick={() => handleDeleteFile(file.id)}
                                className="text-red-600 hover:text-red-800 p-1 text-xs"
                                title="Sil"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        {documentsWithClients.filter(file => file.clientId === selectedClient.id).length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <FileText size={48} className="mx-auto mb-2 text-gray-300" />
                            <p>Bu müşteri için henüz belge yüklenmemiş</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
                  <button
                    onClick={() => setIsClientModalOpen(false)}
                    className="btn-secondary"
                  >
                    Kapat
                  </button>
                  <button
                    onClick={() => handleDownloadAllDocuments(selectedClient.id, selectedClient.name)}
                    className="btn-primary flex items-center"
                    title="Tüm Belgeleri ZIP Olarak İndir"
                  >
                    <Download size={20} className="mr-2" />
                    Tüm Belgeleri İndir
                  </button>
                </div>
              </div>
            </div>
          )}



        {/* Kullanıcı Bazlı Dosya Listesi */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Tüm Yüklenen Dosyalar</h2>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Dosya adı, müşteri adı veya e-posta ara..."
                  value={fileSearchTerm}
                  onChange={(e) => setFileSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-80"
                />
              </div>
              {fileSearchTerm && (
                <button
                  onClick={() => setFileSearchTerm('')}
                  className="text-gray-500 hover:text-gray-700 p-1"
                  title="Aramayı temizle"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DOSYA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MÜŞTERİ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    BOYUT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TARİH
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İŞLEMLER
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFiles.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          {getFormatIcon(doc.fileType)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {doc.originalFileName || doc.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {doc.fileName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {doc.clients?.name || doc.clientName || 'Bilinmiyor'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {doc.clients?.email || 'E-posta yok'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {doc.fileSize} MB
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(doc.uploadedDate).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handlePreviewDocument(doc)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Önizle"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleDownloadDocument(doc)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="İndir"
                        >
                          <Download size={16} />
                        </button>
                        <button 
                          onClick={() => handleEditDocument(doc)}
                          className="text-yellow-600 hover:text-yellow-900 p-1"
                          title="Düzenle"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteDocument(doc)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Sil"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredFiles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText size={48} className="mx-auto mb-2 text-gray-300" />
              <p>
                {fileSearchTerm 
                  ? `"${fileSearchTerm}" araması için sonuç bulunamadı` 
                  : 'Henüz dosya yüklenmemiş'
                }
              </p>
            </div>
          )}
        </div>

                 {/* Belge Görüntüleme Modal */}
         {isViewModalOpen && selectedDocument && (
           <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
             <div className="relative top-20 mx-auto p-6 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-2xl font-bold text-gray-900">
                   {selectedDocument.name}
                 </h3>
                 <button
                   onClick={() => setIsViewModalOpen(false)}
                   className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                 >
                   <X size={24} />
                 </button>
               </div>
               
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* Sol Kolon - Belge Önizleme */}
                 <div className="space-y-6">
                   <div className="card">
                     <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Belge Önizleme</h4>
                     <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                       <FileText size={64} className="mx-auto text-gray-400 mb-4" />
                       <p className="text-gray-600">Belge önizlemesi burada gösterilecek</p>
                       <p className="text-sm text-gray-500 mt-2">PDF, resim veya belge görüntüleyici</p>
                     </div>
                   </div>
                 </div>

                 {/* Sağ Kolon - Belge Bilgileri */}
                 <div className="space-y-6">
                   <div className="card">
                     <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Belge Bilgileri</h4>
                     <div className="space-y-3">
                       <div className="flex justify-between">
                         <span className="text-sm font-medium text-gray-700">Belge Adı:</span>
                         <span className="text-sm text-gray-900">{selectedDocument.name}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-sm font-medium text-gray-700">Tür:</span>
                         <span className="text-sm text-gray-900">{getTypeText(selectedDocument.type)}</span>
                       </div>

                       <div className="flex justify-between">
                         <span className="text-sm font-medium text-gray-700">Müşteri:</span>
                         <span className="text-sm text-gray-900">{selectedDocument.clientName}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-sm font-medium text-gray-700">Boyut:</span>
                         <span className="text-sm text-gray-900">{selectedDocument.size}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-sm font-medium text-gray-700">Format:</span>
                         <span className="text-sm text-gray-900">{selectedDocument.format}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-sm font-medium text-gray-700">Yüklenme Tarihi:</span>
                         <span className="text-sm text-gray-900">{selectedDocument.uploadedDate}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-sm font-medium text-gray-700">Açıklama:</span>
                         <span className="text-sm text-gray-900">{selectedDocument.description}</span>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
               
               <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
                 <button
                   onClick={() => setIsViewModalOpen(false)}
                   className="btn-secondary"
                 >
                   Kapat
                 </button>
                 <button
                   onClick={() => handleDownloadDocument(selectedDocument)}
                   className="btn-primary"
                 >
                   İndir
                 </button>
               </div>
             </div>
           </div>
         )}

         {/* Belge Düzenleme Modal */}
         {isEditModalOpen && selectedDocument && (
           <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
             <div className="relative top-20 mx-auto p-6 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-2xl font-bold text-gray-900">
                   Belge Düzenle - {selectedDocument.name}
                 </h3>
                 <button
                   onClick={() => setIsEditModalOpen(false)}
                   className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                 >
                   <X size={24} />
                 </button>
               </div>
               
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Belge Adı</label>
                   <input
                     type="text"
                     value={newDocument.name}
                     onChange={(e) => setNewDocument({...newDocument, name: e.target.value})}
                     className="input-field w-full"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Tür</label>
                   <select
                     value={newDocument.type}
                     onChange={(e) => setNewDocument({...newDocument, type: e.target.value})}
                     className="input-field w-full"
                   >
                     <option value="identity">Kimlik</option>
                     <option value="education">Eğitim</option>
                     <option value="employment">İstihdam</option>
                     <option value="financial">Finansal</option>
                     <option value="medical">Sağlık</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                   <textarea
                     value={newDocument.description}
                     onChange={(e) => setNewDocument({...newDocument, description: e.target.value})}
                     className="input-field w-full"
                     rows={3}
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Müşteri</label>
                   <select
                     value={newDocument.clientName}
                     onChange={(e) => setNewDocument({...newDocument, clientName: e.target.value})}
                     className="input-field w-full"
                   >
                     <option value="">Müşteri Seçin</option>
                     {clients.map(client => (
                       <option key={client.id} value={client.name}>{client.name}</option>
                     ))}
                   </select>
                 </div>
               </div>
               
               <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
                 <button
                   onClick={() => setIsEditModalOpen(false)}
                   className="btn-secondary"
                 >
                   İptal
                 </button>
                 <button
                   onClick={saveEditedDocument}
                   className="btn-primary"
                 >
                   Kaydet
                 </button>
               </div>
             </div>
           </div>
         )}

         {/* Belge Silme Onay Modal */}
         {isDeleteModalOpen && selectedDocument && (
           <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
             <div className="relative top-1/4 mx-auto p-6 border w-96 shadow-lg rounded-md bg-white">
               <div className="mt-3 text-center">
                 <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                   <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                   </svg>
                 </div>
                 
                 <h3 className="text-lg font-medium text-gray-900 mb-2">Belge Silme Onayı</h3>
                 <p className="text-sm text-gray-500 mb-6">
                   <strong>{selectedDocument.name}</strong> belgesini silmek istediğinizden emin misiniz?
                   Bu işlem geri alınamaz.
                 </p>
                 
                 <div className="flex justify-center space-x-3">
                   <button
                     onClick={() => setIsDeleteModalOpen(false)}
                     className="btn-secondary"
                   >
                     İptal
                   </button>
                   <button
                     onClick={confirmDeleteDocument}
                     className="btn-danger"
                   >
                     Evet, Sil
                   </button>
                 </div>
               </div>
             </div>
           </div>
         )}

         {/* Toplu Yükleme Modal */}
         {isBulkUploadModalOpen && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
             <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold text-gray-900">Toplu Dosya Yükleme</h2>
                 <button
                   onClick={() => setIsBulkUploadModalOpen(false)}
                   className="text-gray-400 hover:text-gray-600"
                 >
                   <X size={24} />
                 </button>
               </div>

               {/* Müşteri Seçimi - ZORUNLU */}
               <div className="mb-6">
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Müşteri Seçimi <span className="text-red-500">*</span>
                 </label>
                 <select
                   value={bulkUploadData.selectedClient?.id || ''}
                   onChange={(e) => {
                     const clientId = parseInt(e.target.value);
                     const selectedClient = clients.find(c => c.id === clientId);
                     setBulkUploadData(prev => ({ ...prev, selectedClient }));
                   }}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   required
                 >
                   <option value="">Müşteri seçin...</option>
                   {clients.map((client) => (
                     <option key={client.id} value={client.id}>
                       {client.name} - {client.email}
                     </option>
                   ))}
                 </select>
                 {!bulkUploadData.selectedClient && (
                   <p className="text-red-500 text-sm mt-1">Müşteri seçimi zorunludur!</p>
                 )}
               </div>

               {/* Dosya Seçimi */}
               <div className="mb-6">
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Dosyalar <span className="text-red-500">*</span>
                 </label>
                 <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                   <input
                     type="file"
                     multiple
                     onChange={handleBulkFileSelect}
                     className="hidden"
                     id="bulk-file-upload"
                     accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                   />
                   <label
                     htmlFor="bulk-file-upload"
                     className="cursor-pointer flex flex-col items-center"
                   >
                     <Upload className="w-12 h-12 text-gray-400 mb-4" />
                     <span className="text-lg font-medium text-gray-700">
                       Dosyaları seçmek için tıklayın
                     </span>
                     <span className="text-sm text-gray-500 mt-1">
                       PDF, DOC, resim dosyaları ve daha fazlası
                     </span>
                   </label>
                 </div>
                 
                 {/* Seçilen Dosyalar Listesi */}
                 {bulkUploadData.selectedFiles.length > 0 && (
                   <div className="mt-4">
                     <h4 className="text-sm font-medium text-gray-700 mb-2">
                       Seçilen Dosyalar ({bulkUploadData.selectedFiles.length})
                     </h4>
                     <div className="space-y-2 max-h-40 overflow-y-auto">
                       {bulkUploadData.selectedFiles.map((file, index) => (
                         <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                           <div className="flex items-center space-x-2">
                             <FileText size={16} className="text-gray-500" />
                             <span className="text-sm text-gray-700">{file.name}</span>
                             <span className="text-xs text-gray-500">
                               ({(file.size / 1024 / 1024).toFixed(2)} MB)
                             </span>
                           </div>
                           <button
                             onClick={() => {
                               setBulkUploadData(prev => ({
                                 ...prev,
                                 selectedFiles: prev.selectedFiles.filter((_, i) => i !== index)
                               }));
                             }}
                             className="text-red-500 hover:text-red-700"
                           >
                             <X size={16} />
                           </button>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
               </div>

               {/* Upload Progress */}
               {bulkUploadData.isUploading && (
                 <div className="mb-6">
                   <div className="flex justify-between text-sm text-gray-600 mb-2">
                     <span>Yükleme İlerlemesi</span>
                     <span>{bulkUploadData.uploadProgress}%</span>
                   </div>
                   <div className="w-full bg-gray-200 rounded-full h-2">
                     <div
                       className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                       style={{ width: `${bulkUploadData.uploadProgress}%` }}
                     ></div>
                   </div>
                 </div>
               )}

               {/* Butonlar */}
               <div className="flex justify-end space-x-3">
                 <button
                   onClick={() => setIsBulkUploadModalOpen(false)}
                   className="btn-secondary"
                   disabled={bulkUploadData.isUploading}
                 >
                   İptal
                 </button>
                 <button
                   onClick={handleBulkUploadSubmit}
                   disabled={
                     !bulkUploadData.selectedClient || 
                     bulkUploadData.selectedFiles.length === 0 ||
                     bulkUploadData.isUploading
                   }
                   className={`btn-primary ${
                     (!bulkUploadData.selectedClient || 
                      bulkUploadData.selectedFiles.length === 0 ||
                      bulkUploadData.isUploading) 
                       ? 'opacity-50 cursor-not-allowed' 
                       : ''
                   }`}
                 >
                   {bulkUploadData.isUploading ? (
                     <>
                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                       Yükleniyor...
                     </>
                   ) : (
                     <>
                       <Upload size={20} className="mr-2" />
                       Dosyaları Yükle
                     </>
                   )}
                 </button>
               </div>
             </div>
           </div>
         )}

         {/* Yeni Belge Modal */}
         {isNewDocumentModalOpen && (
           <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
             <div className="relative top-20 mx-auto p-6 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-2xl font-bold text-gray-900">
                   Yeni Belge Ekle
                 </h3>
                 <button
                   onClick={() => setIsNewDocumentModalOpen(false)}
                   className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                 >
                   <X size={24} />
                 </button>
               </div>
               
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Belge Adı</label>
                   <input
                     type="text"
                     value={newDocument.name}
                     onChange={(e) => setNewDocument({...newDocument, name: e.target.value})}
                     className="input-field w-full"
                     placeholder="Belge adını girin"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Tür</label>
                   <select
                     value={newDocument.type}
                     onChange={(e) => setNewDocument({...newDocument, type: e.target.value})}
                     className="input-field w-full"
                   >
                     <option value="identity">Kimlik</option>
                     <option value="education">Eğitim</option>
                     <option value="employment">İstihdam</option>
                     <option value="financial">Finansal</option>
                     <option value="medical">Sağlık</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                   <textarea
                     value={newDocument.description}
                     onChange={(e) => setNewDocument({...newDocument, description: e.target.value})}
                     className="input-field w-full"
                     rows={3}
                     placeholder="Belge açıklamasını girin"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Müşteri</label>
                   <select
                     value={newDocument.clientName}
                     onChange={(e) => setNewDocument({...newDocument, clientName: e.target.value})}
                     className="input-field w-full"
                   >
                     <option value="">Müşteri Seçin</option>
                     {clients.map(client => (
                       <option key={client.id} value={client.name}>{client.name}</option>
                     ))}
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Dosya Yükle</label>
                   <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                     <input
                       type="file"
                       onChange={(e) => {
                         // Dosya yükleme işlemi
                         if (e.target.files.length > 0) {
                           const file = e.target.files[0];
                           console.log('📁 Yeni belge modal\'ında dosya seçildi:', file.name);
                           
                           // Dosya bilgilerini form'a ekle
                           setNewDocument(prev => ({
                             ...prev,
                             fileName: file.name,
                             fileSize: (file.size / (1024 * 1024)).toFixed(2)
                           }));
                           
                           // Dosyayı geçici olarak sakla (yükleme için)
                           setNewDocument(prev => ({
                             ...prev,
                             selectedFile: file
                           }));
                           
                           alert(`Dosya seçildi: ${file.name}\nŞimdi "Belge Ekle" butonuna tıklayarak belgeyi kaydedin.`);
                         }
                       }}
                       className="hidden"
                       id="new-document-upload"
                       accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                     />
                     <label htmlFor="new-document-upload" className="cursor-pointer">
                       <Paperclip size={32} className="mx-auto text-gray-400 mb-2" />
                       <p className="text-sm text-gray-600">
                         <span className="font-medium text-blue-600">Dosya seç</span> veya sürükle bırak
                       </p>
                     </label>
                   </div>
                   
                   {/* Seçilen dosya bilgisi */}
                   {newDocument.fileName && (
                     <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                       <div className="flex items-center space-x-2">
                         <FileText size={16} className="text-blue-600" />
                         <span className="text-sm text-blue-900">{newDocument.fileName}</span>
                         <span className="text-xs text-blue-700">({newDocument.fileSize} MB)</span>
                       </div>
                     </div>
                   )}
                 </div>
               </div>
               
               <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
                 <button
                   onClick={() => setIsNewDocumentModalOpen(false)}
                   className="btn-secondary"
                 >
                   İptal
                 </button>
                 <button
                   onClick={saveNewDocument}
                   disabled={!newDocument.name || !newDocument.clientName}
                   className={`btn-primary ${(!newDocument.name || !newDocument.clientName) ? 'opacity-50 cursor-not-allowed' : ''}`}
                 >
                   Belge Ekle
                 </button>
               </div>
             </div>
           </div>
         )}

         {/* Belge Önizleme Modal */}
         {isPreviewModalOpen && previewDocument && (
           <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
             <div className="relative top-4 mx-auto p-6 border w-[95vw] max-w-[1400px] min-h-[90vh] shadow-lg rounded-md bg-white">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl lg:text-2xl font-bold text-gray-900 truncate">
                   {previewDocument.name} - Önizleme
                 </h3>
                 <div className="flex items-center space-x-2">
                   <button
                     onClick={() => {
                       if (previewDocument.fileUrl) {
                         window.open(previewDocument.fileUrl, '_blank');
                       }
                     }}
                     className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-50 transition-colors"
                     title="Yeni sekmede aç"
                   >
                     📄
                   </button>
                   <button
                     onClick={() => setIsPreviewModalOpen(false)}
                     className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-md transition-colors"
                     title="Kapat"
                   >
                     <X size={24} />
                   </button>
                 </div>
               </div>
               
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 {/* Sol Kolon - Belge Önizleme */}
                 <div className="lg:col-span-2">
                   <div className="card">
                     <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Belge Önizleme</h4>
                     <div className="border rounded-lg overflow-hidden">
                       {previewDocument.fileType?.includes('pdf') ? (
                         <iframe
                           src={previewDocument.fileUrl}
                           className="w-full h-[70vh] min-h-[600px]"
                           title="PDF Önizleme"
                         />
                       ) : previewDocument.fileType?.includes('image') ? (
                         <img
                           src={previewDocument.fileUrl}
                           alt={previewDocument.name}
                           className="w-full h-auto max-h-[70vh] min-h-[600px] object-contain"
                         />
                       ) : (
                         <div className="p-12 text-center min-h-[400px] flex flex-col justify-center">
                           <FileText size={64} className="mx-auto text-gray-400 mb-4" />
                           <p className="text-gray-600">Bu dosya türü önizlenemiyor</p>
                           <p className="text-sm text-gray-500 mt-2">İndirerek görüntüleyin</p>
                         </div>
                       )}
                     </div>
                   </div>
                 </div>

                 {/* Sağ Kolon - Belge Bilgileri */}
                 <div className="space-y-6">
                   <div className="card">
                     <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Belge Bilgileri</h4>
                     <div className="space-y-3">
                       <div className="flex justify-between">
                         <span className="text-sm font-medium text-gray-700">Belge Adı:</span>
                         <span className="text-sm text-gray-900">{previewDocument.name}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-sm font-medium text-gray-700">Tür:</span>
                         <span className="text-sm text-gray-900">{getTypeText(previewDocument.type)}</span>
                       </div>

                       <div className="flex justify-between">
                         <span className="text-sm font-medium text-gray-700">Müşteri:</span>
                         <span className="text-sm text-gray-900">{previewDocument.clientName}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-sm font-medium text-gray-700">Boyut:</span>
                         <span className="text-sm text-gray-900">{previewDocument.fileSize} MB</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-sm font-medium text-gray-700">Format:</span>
                         <span className="text-sm text-gray-900">{previewDocument.fileType}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-sm font-medium text-gray-700">Yüklenme Tarihi:</span>
                         <span className="text-sm text-gray-900">{new Date(previewDocument.uploadedDate).toLocaleDateString('tr-TR')}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-sm font-medium text-gray-700">Açıklama:</span>
                         <span className="text-sm text-gray-900">{previewDocument.description || 'Açıklama yok'}</span>
                       </div>
                     </div>
                   </div>
                   
                   {/* Hızlı İşlemler */}
                   <div className="card">
                     <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Hızlı İşlemler</h4>
                     <div className="space-y-2">
                       <button
                         onClick={() => handleDownloadDocument(previewDocument)}
                         className="w-full btn-primary flex items-center justify-center"
                       >
                         <Download size={16} className="mr-2" />
                         İndir
                       </button>
                       <button
                         onClick={() => {
                           setIsPreviewModalOpen(false);
                           handleEditDocument(previewDocument);
                         }}
                         className="w-full btn-secondary flex items-center justify-center"
                       >
                         <Edit size={16} className="mr-2" />
                         Düzenle
                       </button>
                     </div>
                   </div>
                 </div>
               </div>
               
               <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
                 <button
                   onClick={() => setIsPreviewModalOpen(false)}
                   className="btn-secondary"
                 >
                   Kapat
                 </button>
               </div>
             </div>
           </div>
         )}
        </>
      )}

      {/* Modals buraya eklenecek */}
    </div>
  );
};

export default Documents;
