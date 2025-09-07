import React, { useState, useEffect } from 'react';
import { DatabaseService } from '../services/database';
import { supabase } from '../config/supabase';

const ProductionDebug = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    runDebugTests();
  }, []);

  const runDebugTests = async () => {
    setIsLoading(true);
    const results = {};

    try {
      // 1. Environment Debug
      results.environment = DatabaseService.debugEnvironment();

      // 2. Supabase Bağlantı Testi
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('count')
          .limit(1);
        
        results.supabaseConnection = {
          success: !error,
          error: error?.message,
          data: data
        };
      } catch (error) {
        results.supabaseConnection = {
          success: false,
          error: error.message
        };
      }

      // 3. Storage Bucket Testi
      try {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        results.storageBuckets = {
          success: !error,
          error: error?.message,
          buckets: buckets?.map(b => b.name) || []
        };
      } catch (error) {
        results.storageBuckets = {
          success: false,
          error: error.message,
          buckets: []
        };
      }

      // 4. Documents Tablosu Testi
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .limit(5);
        
        results.documentsTable = {
          success: !error,
          error: error?.message,
          count: data?.length || 0
        };
      } catch (error) {
        results.documentsTable = {
          success: false,
          error: error.message,
          count: 0
        };
      }

      setDebugInfo(results);
    } catch (error) {
      console.error('Debug test hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runSpecificTest = async (testName) => {
    setTestResults(prev => ({ ...prev, [testName]: { loading: true } }));

    try {
      let result;
      
      switch (testName) {
        case 'uploadTest':
          // Dosya yükleme testi
          const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
          result = await DatabaseService.uploadFile(testFile, 1, { name: 'Test File' });
          break;
        
        case 'storageTest':
          // Storage testi
          const { data, error } = await supabase.storage
            .from('documents')
            .list('', { limit: 1 });
          result = { success: !error, error: error?.message, data };
          break;
        
        case 'rlsTest':
          // RLS testi - documents tablosuna insert denemesi
          try {
            const { data: insertData, error: insertError } = await supabase
              .from('documents')
              .insert([{
                name: 'RLS Test',
                type: 'test',
                description: 'RLS policy test',
                clientId: 1,
                status: 'pending'
              }])
              .select();
            
            result = { 
              success: !insertError, 
              error: insertError?.message, 
              data: insertData,
              isRLSError: insertError?.message?.includes('row-level security')
            };
          } catch (error) {
            result = { 
              success: false, 
              error: error.message,
              isRLSError: error.message?.includes('row-level security')
            };
          }
          break;
        
        default:
          result = { success: false, error: 'Bilinmeyen test' };
      }

      setTestResults(prev => ({ 
        ...prev, 
        [testName]: { 
          loading: false, 
          result,
          timestamp: new Date().toISOString()
        } 
      }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [testName]: { 
          loading: false, 
          error: error.message,
          timestamp: new Date().toISOString()
        } 
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Debug testleri çalıştırılıyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Production Debug Sayfası
        </h1>

        {/* Environment Bilgileri */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment Bilgileri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>Hostname:</strong> {debugInfo.environment?.hostname}</p>
              <p><strong>Environment:</strong> {debugInfo.environment?.environment}</p>
              <p><strong>Is Production:</strong> {debugInfo.environment?.isProduction ? 'Evet' : 'Hayır'}</p>
            </div>
            <div>
              <p><strong>Supabase URL:</strong> {debugInfo.environment?.supabaseUrl ? '✅ Mevcut' : '❌ Eksik'}</p>
              <p><strong>Supabase Key:</strong> {debugInfo.environment?.supabaseAnonKey ? '✅ Mevcut' : '❌ Eksik'}</p>
            </div>
          </div>
        </div>

        {/* Test Sonuçları */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Supabase Bağlantı */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-3">Supabase Bağlantı</h3>
            <div className={`p-3 rounded ${debugInfo.supabaseConnection?.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <p><strong>Durum:</strong> {debugInfo.supabaseConnection?.success ? '✅ Başarılı' : '❌ Başarısız'}</p>
              {debugInfo.supabaseConnection?.error && (
                <p className="text-sm mt-2"><strong>Hata:</strong> {debugInfo.supabaseConnection.error}</p>
              )}
            </div>
          </div>

          {/* Storage Buckets */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-3">Storage Buckets</h3>
            <div className={`p-3 rounded ${debugInfo.storageBuckets?.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <p><strong>Durum:</strong> {debugInfo.storageBuckets?.success ? '✅ Başarılı' : '❌ Başarısız'}</p>
              <p><strong>Bucket'lar:</strong> {debugInfo.storageBuckets?.buckets?.join(', ') || 'Yok'}</p>
              {debugInfo.storageBuckets?.error && (
                <p className="text-sm mt-2"><strong>Hata:</strong> {debugInfo.storageBuckets.error}</p>
              )}
            </div>
          </div>

          {/* Documents Tablosu */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-3">Documents Tablosu</h3>
            <div className={`p-3 rounded ${debugInfo.documentsTable?.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <p><strong>Durum:</strong> {debugInfo.documentsTable?.success ? '✅ Başarılı' : '❌ Başarısız'}</p>
              <p><strong>Kayıt Sayısı:</strong> {debugInfo.documentsTable?.count}</p>
              {debugInfo.documentsTable?.error && (
                <p className="text-sm mt-2"><strong>Hata:</strong> {debugInfo.documentsTable.error}</p>
              )}
            </div>
          </div>
        </div>

        {/* Manuel Testler */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Manuel Testler</h2>
          <div className="space-y-4">
            <button
              onClick={() => runSpecificTest('uploadTest')}
              disabled={testResults.uploadTest?.loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {testResults.uploadTest?.loading ? 'Test Ediliyor...' : 'Dosya Yükleme Testi'}
            </button>

            <button
              onClick={() => runSpecificTest('storageTest')}
              disabled={testResults.storageTest?.loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 ml-2"
            >
              {testResults.storageTest?.loading ? 'Test Ediliyor...' : 'Storage Testi'}
            </button>

            <button
              onClick={() => runSpecificTest('rlsTest')}
              disabled={testResults.rlsTest?.loading}
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50 ml-2"
            >
              {testResults.rlsTest?.loading ? 'Test Ediliyor...' : 'RLS Testi'}
            </button>

            <button
              onClick={runDebugTests}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 ml-2"
            >
              Tüm Testleri Yenile
            </button>
          </div>

                     {/* Test Sonuçları */}
           {Object.keys(testResults).length > 0 && (
             <div className="mt-4">
               <h3 className="font-semibold mb-2">Test Sonuçları:</h3>
               
               {/* RLS Test Sonucu */}
               {testResults.rlsTest && (
                 <div className={`p-3 rounded mb-3 ${testResults.rlsTest.isRLSError ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
                   <h4 className="font-medium">RLS Test Sonucu:</h4>
                   <p><strong>Durum:</strong> {testResults.rlsTest.isRLSError ? '❌ RLS Hatası' : '✅ Başarılı'}</p>
                   {testResults.rlsTest.isRLSError && (
                     <div className="mt-2">
                       <p className="text-sm"><strong>Hata:</strong> {testResults.rlsTest.error}</p>
                                                <p className="text-sm mt-1">
                           <strong>Çözüm:</strong> Supabase Dashboard {'>'} SQL Editor'da RLS politikalarını düzeltin
                         </p>
                     </div>
                   )}
                 </div>
               )}
               
               <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                 {JSON.stringify(testResults, null, 2)}
               </pre>
             </div>
           )}
        </div>

        {/* Çözüm Önerileri */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-4">Çözüm Önerileri</h2>
                     <ul className="space-y-2 text-yellow-700">
             <li>• Environment değişkenleri eksikse: Netlify Dashboard {'>'} Site settings {'>'} Environment variables</li>
             <li>• Storage bucket yoksa: Supabase Dashboard {'>'} Storage {'>'} New bucket</li>
             <li>• RLS hatası varsa: Supabase Dashboard {'>'} Authentication {'>'} Policies</li>
             <li>• 401 hatası varsa: Supabase API anahtarlarını kontrol edin</li>
           </ul>
        </div>
      </div>
    </div>
  );
};

export default ProductionDebug;
