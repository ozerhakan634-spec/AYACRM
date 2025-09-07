import React from 'react';
import { Navigate } from 'react-router-dom';
import { AuthService } from '../services/auth';

const ProtectedRoute = ({ children, requiredPermission = null }) => {
  const isLoggedIn = AuthService.isLoggedIn();
  const currentUser = AuthService.getCurrentUser();

  // Giriş yapılmamışsa login sayfasına yönlendir
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Belirli bir izin gerekliyse kontrol et
  if (requiredPermission && !AuthService.hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erişim Yetkisi Yok</h3>
          <p className="text-gray-600 mb-4">
            Bu sayfaya erişim yetkiniz bulunmamaktadır. Sistem yöneticinize başvurun.
          </p>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-700">
              <strong>Kullanıcı:</strong> {currentUser?.name || 'Bilinmiyor'}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Gerekli İzin:</strong> {requiredPermission}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
