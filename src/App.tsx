import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import Home from './pages/user/Home'
import Announcements from './pages/user/Announcement'
import Transactions from './pages/user/Transactions'
import RequestGrant from './pages/user/RequestGrant'
import QrScanner from './pages/user/QrScanner'
import Settings from './pages/user/Settings.tsx'
import { ToastProvider, useToast } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'
import { ToastContainer } from './components/Toast'


import AdminHome from './pages/admin/AdminHome'
import AdminAnnouncements from './pages/admin/Announcements'
import Projects from './pages/admin/Projects'
import AdminQRScanner from './pages/admin/QRScanner'
import AdminTransactions from './pages/admin/Transactions.tsx'
import AdminGrants from './pages/admin/Grants.tsx'
import { AdminRoute } from './components/ProtectedRoute'

function AppContent() {
  const { toasts, removeToast } = useToast();
  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/home" element={<Home />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/request-grant" element={<RequestGrant />} />
          <Route path="/scan" element={<QrScanner />} />
          <Route path="/settings" element={<Settings />} />


          <Route path="/admin" element={
            <AdminRoute>
              <AdminHome />
            </AdminRoute>
          } />
          <Route path="/admin/announcements" element={
            <AdminRoute>
              <AdminAnnouncements />
            </AdminRoute>
          } />
          <Route path="/admin/projects" element={
            <AdminRoute>
              <Projects />
            </AdminRoute>
          } />
          <Route path="/admin/scan" element={
            <AdminRoute>
              <AdminQRScanner />
            </AdminRoute>
          } />
          <Route path="/admin/transactions" element={
            <AdminRoute>
              <AdminTransactions />
            </AdminRoute>
          } />
          <Route path="/admin/grants" element={
            <AdminRoute>
              <AdminGrants />
            </AdminRoute>
          } />

          <Route path="/" element={<Login />} />
        </Routes>
      </Router>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  )
}
export default App