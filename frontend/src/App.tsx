import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { LayoutDashboard, UserPlus, Camera, LogOut, BookOpen, Users, ClipboardCheck } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';

function Sidebar() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <aside className="w-64 bg-[#1e293b] border-r border-slate-700/50 flex flex-col transition-all duration-300">
      <div className="h-16 flex items-center px-6 border-b border-slate-700/50">
        <div className="flex items-center gap-2 text-blue-500">
          <Camera className="w-6 h-6" />
          <span className="font-bold text-xl tracking-tight text-white">FaceMark<span className="text-blue-500">AI</span></span>
        </div>
      </div>
      
      <nav className="flex-1 py-6 px-4 space-y-2">
        {user.role === 'admin' && (
          <NavLink to="/admin-dashboard" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-blue-500/10 text-blue-400 font-medium' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </NavLink>
        )}
        {user.role === 'teacher' && (
          <NavLink to="/teacher-dashboard" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-blue-500/10 text-blue-400 font-medium' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
            <ClipboardCheck className="w-5 h-5" />
            <span>Classes & Attendance</span>
          </NavLink>
        )}
        {user.role === 'student' && (
          <NavLink to="/student-dashboard" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-blue-500/10 text-blue-400 font-medium' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
            <BookOpen className="w-5 h-5" />
            <span>My Attendance</span>
          </NavLink>
        )}
      </nav>
      
      <div className="p-4 border-t border-slate-700/50">
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold shrink-0 uppercase">
              {user.username[0]}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium truncate">{user.username}</span>
              <span className="text-xs text-slate-500 uppercase">{user.role}</span>
            </div>
          </div>
          <button onClick={logout} className="text-slate-400 hover:text-red-400 transition-colors p-1" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function MainLayout() {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed relative">
        <div className="absolute inset-0 bg-[#0f172a]/95 pointer-events-none" />
        <div className="relative p-8 h-full">
          <Routes>
            <Route path="/" element={<Navigate to={`/${user.role}-dashboard`} replace />} />
            <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/teacher-dashboard" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/student-dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<MainLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
