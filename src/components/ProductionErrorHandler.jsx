import React, { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, Settings } from 'lucide-react';
import { DatabaseService } from '../services/database';

const ProductionErrorHandler = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);
  const [isProduction, setIsProduction] = useState(false);

  useEffect(() => {
    // Production ortamı kontrolü
    const production = window.location.hostname === 'admin.ayajourneys.com';
    setIsProduction(production);

    if (production) {
      // Environment debug
      const debugInfo = DatabaseService.debugEnvironment();
      
      if (!debugInfo.supabaseUrl || !debugInfo.supabaseAnonKey) {
        setHasError(true);
        setErrorDetails({
          type: 'environment',
          message: 'Production ortamında Supabase environment değişkenleri eksik',
          details: debugInfo
        });
      }
    }
  }, []);

  // Global error handler
  useEffect(() => {
    const handleError = (error) => {
      if (isProduction) {
        console.error('Production Error:', error);
        
        if (error.message?.includes('Supabase') || error.message?.includes('environment')) {
          setHasError(true);
          setErrorDetails({
            type: 'supabase',
            message: 'Supabase bağlantı hatası',
            details: error.message
          });
        }
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', (event) => handleError(event.reason));

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, [isProduction]);

  if (!hasError) {
    return children;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">
            Production Hatası
          </h2>
        </div>

        <div className="mb-4">
          <p className="text-gray-600 mb-2">
            {errorDetails?.message || 'Beklenmeyen bir hata oluştu'}
          </p>
          
          {errorDetails?.type === 'environment' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h3 className="font-medium text-yellow-800 mb-2">Çözüm:</h3>
                             <ol className="text-sm text-yellow-700 space-y-1">
                 <li>1. Netlify Dashboard'a gidin</li>
                 <li>2. Site settings {'>'} Environment variables</li>
                 <li>3. VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY ekleyin</li>
                 <li>4. Redeploy yapın</li>
               </ol>
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Yenile
          </button>
          
          <button
            onClick={() => {
              setHasError(false);
              setErrorDetails(null);
            }}
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
          >
            <Settings className="w-4 h-4 mr-2" />
            Devam Et
          </button>
        </div>

        {errorDetails?.details && (
          <details className="mt-4">
            <summary className="text-sm text-gray-500 cursor-pointer">
              Teknik Detaylar
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(errorDetails.details, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

export default ProductionErrorHandler;
