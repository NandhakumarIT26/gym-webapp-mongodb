import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import MemberForm from './pages/MemberForm';
import MemberProfile from './pages/MemberProfile';
import Plans from './pages/Plans';
import Attendance from './pages/Attendance';
import Reminders from './pages/Reminders';
import Payments from './pages/Payments';
import Finance from './pages/Finance';
import Enquiries from './pages/Enquiries';
import { Menu } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default function App() {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div className="app-shell">
              <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

              {/* Floating hamburger button — mobile only */}
              <button className="mobile-fab-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
                <Menu size={22} />
              </button>

              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/members" element={<Members />} />
                  <Route path="/members/new" element={<MemberForm />} />
                  <Route path="/members/:id/edit" element={<MemberForm />} />
                  <Route path="/members/:id" element={<MemberProfile />} />
                  <Route path="/plans" element={<Plans />} />
                  <Route path="/attendance" element={<Attendance />} />
                  <Route path="/reminders" element={<Reminders />} />
                  <Route path="/payments" element={<Payments />} />
                  <Route path="/finance" element={<Finance />} />
                  <Route path="/enquiries" element={<Enquiries />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
