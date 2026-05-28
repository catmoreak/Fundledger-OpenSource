import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import Home from './pages/user/Home'
import Announcements from './pages/user/Announcement'
import Transactions from './pages/user/Transactions'
import RequestGrant from './pages/user/RequestGrant'
import QrScanner from './pages/user/QrScanner'
import { ToastProvider, useToast } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'
import { ToastContainer } from './components/Toast'

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