import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { Navbar } from './components/Navbar';
import { QuickDemoBar } from './components/QuickDemoBar';
import { ToastContainer } from './components/ToastContainer';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Directory } from './pages/Directory';
import { BookingCalendar } from './pages/BookingCalendar';
import { MyBookings } from './pages/MyBookings';
import { LabAssistantQueue } from './pages/LabAssistantQueue';
import { AdminPanel } from './pages/AdminPanel';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WebSocketProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-transparent text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
              <QuickDemoBar />
              <Navbar />
              <main className="flex-1 pb-16">
                <Routes>
                  {/* Public Authentication Route */}
                  <Route path="/login" element={<Login />} />

                  {/* Protected Routes */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/directory"
                    element={
                      <ProtectedRoute>
                        <Directory />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/calendar"
                    element={
                      <ProtectedRoute>
                        <BookingCalendar />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/my-bookings"
                    element={
                      <ProtectedRoute>
                        <MyBookings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/assistant/queue"
                    element={
                      <ProtectedRoute allowedRoles={['lab_assistant', 'admin']}>
                        <LabAssistantQueue />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminPanel />
                      </ProtectedRoute>
                    }
                  />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>

              {/* Real-time WebSockets Toast Notification Hub */}
              <ToastContainer />

              {/* Footer */}
              <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
                <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div>
                    Smart Campus Equipment & Lab Booking System &copy; 2026. Academic Research Infrastructure.
                  </div>
                  <div className="flex items-center gap-4 text-slate-400">
                    <span>FastAPI + SQLAlchemy</span>
                    <span>&bull;</span>
                    <span>React + Vite</span>
                    <span>&bull;</span>
                    <span>WebSocket Hub</span>
                  </div>
                </div>
              </footer>
            </div>
          </BrowserRouter>
        </WebSocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
