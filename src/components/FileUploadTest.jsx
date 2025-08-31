import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { DatabaseService } from '../services/database';

const FileUploadTest = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Lütfen bir dosya seçin');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      console.log('🧪 Test dosyası yükleniyor:', selectedFile);

      const documentInfo = {
        name: 'Test Belgesi',
        type: 'identity',
        description: 'Bu bir test belgesidir',
        clientId: 1, // Test için sabit ID
        clientName: 'Test Müşteri'
      };

      const result = await DatabaseService.uploadFile(selectedFile, 1, documentInfo);
      
      console.log('✅ Test başarılı:', result);
      setUploadResult({
        success: true,
        message: 'Dosya başarıyla yüklendi!',
        data: result
      });

    } catch (error) {
      console.error('❌ Test hatası:', error);
      setError({
        message: error.message,
        details: error
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetTest = () => {
    setSelectedFile(null);
    setError(null);
    setUploadResult(null);
    // Input'u temizle
    const fileInput = document.getElementById('test-file-input');
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dosya Yükleme Test Bileşeni</h2>
      
      <div className="space-y-6">
        {/* Dosya Seçimi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Dosyası Seçin
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              id="test-file-input"
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <label htmlFor="test-file-input" className="cursor-pointer">
              <Upload size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium text-blue-600">Dosya seç</span> veya sürükle bırak
              </p>
              <p className="text-xs text-gray-500">PDF, JPG, PNG, DOC, DOCX (Max 10MB)</p>
            </label>
          </div>
        </div>

        {/* Seçilen Dosya Bilgisi */}
        {selectedFile && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <FileText size={20} className="text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">{selectedFile.name}</p>
                <p className="text-xs text-blue-700">
                  Boyut: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • 
                  Tip: {selectedFile.type}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Hata Mesajı */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle size={20} className="text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-900">Hata Oluştu</p>
                <p className="text-xs text-red-700">{error.message}</p>
                {error.details && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 cursor-pointer">Hata Detayları</summary>
                    <pre className="text-xs text-red-700 mt-2 bg-red-100 p-2 rounded overflow-auto">
                      {JSON.stringify(error.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Başarı Mesajı */}
        {uploadResult && uploadResult.success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle size={20} className="text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Test Başarılı!</p>
                <p className="text-xs text-green-700">{uploadResult.message}</p>
                <details className="mt-2">
                  <summary className="text-xs text-green-600 cursor-pointer">Sonuç Detayları</summary>
                  <pre className="text-xs text-green-700 mt-2 bg-green-100 p-2 rounded overflow-auto">
                    {JSON.stringify(uploadResult.data, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          </div>
        )}

        {/* Butonlar */}
        <div className="flex space-x-3">
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className={`flex-1 px-4 py-2 rounded-lg font-medium ${
              !selectedFile || isUploading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Yükleniyor...
              </>
            ) : (
              'Test Et'
            )}
          </button>
          
          <button
            onClick={resetTest}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
          >
            Sıfırla
          </button>
        </div>

        {/* Test Sonuçları */}
        {uploadResult && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Test Sonuçları</h3>
            <div className="text-xs text-gray-700 space-y-1">
              <p><strong>Dosya Adı:</strong> {uploadResult.data?.originalFileName}</p>
              <p><strong>Storage Adı:</strong> {uploadResult.data?.fileName}</p>
              <p><strong>Boyut:</strong> {uploadResult.data?.fileSize} MB</p>
              <p><strong>Tip:</strong> {uploadResult.data?.fileType}</p>
              <p><strong>URL:</strong> {uploadResult.data?.fileUrl}</p>
              <p><strong>Durum:</strong> {uploadResult.data?.status}</p>
            </div>
          </div>
        )}
      </div>

      {/* Yardım Bilgileri */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-sm font-medium text-yellow-900 mb-2">Test Öncesi Kontrol Listesi</h3>
        <ul className="text-xs text-yellow-700 space-y-1">
          <li>✓ .env.local dosyasında Supabase bilgileri var mı?</li>
          <li>✓ Supabase'de documents storage bucket oluşturuldu mu?</li>
          <li>✓ Veritabanı şeması güncellendi mi?</li>
          <li>✓ RLS policies ayarlandı mı?</li>
          <li>✓ Storage policies ayarlandı mı?</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUploadTest; 