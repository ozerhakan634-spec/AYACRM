import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './components/Toast';
import { AITrainingService } from './services/aiTrainingService';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Documents from './pages/Documents';
import Tasks from './pages/Tasks';
import Calendar from './pages/Calendar';
import Reports from './pages/Reports';
import Consultants from './pages/Consultants';
import Settings from './pages/Settings';
import Finance from './pages/Finance';
import TeamManagement from './pages/TeamManagement';
import ChatBot from './pages/ChatBot';
import Support from './pages/Support';
import SupportManagement from './pages/SupportManagement';
import { AuthService } from './services/auth';
import ProductionErrorHandler from './components/ProductionErrorHandler';
import ProductionDebug from './pages/ProductionDebug';


function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // AI öğrenme sistemi başlat
  useEffect(() => {
    // Uygulama başlarken AI öğrenme döngüsünü başlat
    AITrainingService.startLearningLoop();
    
    // Başlangıç eğitim örneklerini ekle (bir kez)
    const initializeAI = async () => {
      try {
        await AITrainingService.seedTrainingExamples();
        console.log('🧠 AI eğitim sistemi başlatıldı');
      } catch (error) {
        console.warn('⚠️ AI eğitim sistemi başlatılamadı:', error);
      }
    };
    
    initializeAI();
  }, []);

  useEffect(() => {
    // Sayfa yüklendiğinde mevcut kullanıcıyı kontrol et
    const user = AuthService.getCurrentUser();
    setCurrentUser(user);
    setIsLoading(false);
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
  };

  const handleUserUpdate = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ProductionErrorHandler>
      <ToastProvider>
        <Router>
          <Routes>
          {/* Landing Page Route */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Login Route */}
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          
          {/* Debug Route (sadece production'da) */}
          {window.location.hostname === 'admin.ayajourneys.com' && (
            <Route path="/debug" element={<ProductionDebug />} />
          )}
          
          {/* Protected Routes */}
          <Route path="/dashboard/*" element={
            <ProtectedRoute>
              <Layout currentUser={currentUser} onLogout={handleLogout} onUserUpdate={handleUserUpdate}>
                <Routes>
                <Route path="/" element={
                  <ProtectedRoute requiredPermission="dashboard">
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="clients" element={
                  <ProtectedRoute requiredPermission="clients">
                    <Clients />
                  </ProtectedRoute>
                } />
                
                <Route path="documents" element={
                  <ProtectedRoute requiredPermission="documents">
                    <Documents />
                  </ProtectedRoute>
                } />
                
                <Route path="tasks" element={
                  <ProtectedRoute requiredPermission="tasks">
                    <Tasks />
                  </ProtectedRoute>
                } />
                
                <Route path="calendar" element={
                  <ProtectedRoute requiredPermission="calendar">
                    <Calendar />
                  </ProtectedRoute>
                } />
                
                <Route path="reports" element={
                  <ProtectedRoute requiredPermission="reports">
                    <Reports />
                  </ProtectedRoute>
                } />
                
                <Route path="consultants" element={
                  <ProtectedRoute requiredPermission="consultants">
                    <Consultants />
                  </ProtectedRoute>
                } />
                
                <Route path="finance" element={
                  <ProtectedRoute requiredPermission="finance">
                    <Finance />
                  </ProtectedRoute>
                } />
                
                <Route path="team-management" element={
                  <ProtectedRoute requiredPermission="consultants">
                    <TeamManagement />
                  </ProtectedRoute>
                } />
                
                <Route path="settings" element={
                  <ProtectedRoute requiredPermission="settings">
                    <Settings />
                  </ProtectedRoute>
                } />
                
                <Route path="support" element={
                  <ProtectedRoute requiredPermission="support">
                    <Support />
                  </ProtectedRoute>
                } />
                
                <Route path="support-management" element={
                  <ProtectedRoute requiredPermission="support_management">
                    <SupportManagement />
                  </ProtectedRoute>
                } />
                
                <Route path="chatbot" element={
                  <ProtectedRoute requiredPermission="chatbot">
                    <ChatBot />
                  </ProtectedRoute>
                } />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
    </ToastProvider>
  </ProductionErrorHandler>
  );
}

export default App;
