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
            <div className="app-shell min-h-screen flex flex-col font-sans">
              <QuickDemoBar />
              <Navbar />
              <main className="app-main">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/directory" element={<ProtectedRoute><Directory /></ProtectedRoute>} />
                  <Route path="/calendar" element={<ProtectedRoute><BookingCalendar /></ProtectedRoute>} />
                  <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
                  <Route path="/assistant/queue" element={<ProtectedRoute allowedRoles={['lab_assistant', 'admin']}><LabAssistantQueue /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminPanel /></ProtectedRoute>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>

              <ToastContainer />

              <footer className="app-footer py-5 text-center text-[11px]">
                <div className="mx-auto flex w-[min(100%-2rem,1160px)] flex-col items-center justify-between gap-2 sm:flex-row">
                  <span>Smart Campus Equipment &amp; Lab Booking System · Academic infrastructure, made simple.</span>
                  <span className="flex items-center gap-3 text-slate-400 dark:text-slate-600">
                    <span>FastAPI</span><span>•</span><span>React</span><span>•</span><span>Live slot sync</span>
                  </span>
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
