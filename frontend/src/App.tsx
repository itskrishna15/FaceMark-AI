import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, UserPlus, Camera } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import Attendance from './pages/Attendance';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-[#0f172a] text-slate-50">
        
        {/* Sidebar */}
        <aside className="w-64 bg-[#1e293b] border-r border-slate-700/50 flex flex-col transition-all duration-300">
          <div className="h-16 flex items-center px-6 border-b border-slate-700/50">
            <div className="flex items-center gap-2 text-blue-500">
              <Camera className="w-6 h-6" />
              <span className="font-bold text-xl tracking-tight text-white">FaceMark<span className="text-blue-500">AI</span></span>
            </div>
          </div>
          
          <nav className="flex-1 py-6 px-4 space-y-2">
            <NavLink to="/" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-blue-500/10 text-blue-400 font-medium' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/onboard" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-blue-500/10 text-blue-400 font-medium' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
              <UserPlus className="w-5 h-5" />
              <span>Onboard Student</span>
            </NavLink>
            <NavLink to="/attendance" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-blue-500/10 text-blue-400 font-medium' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
              <Camera className="w-5 h-5" />
              <span>Mark Attendance</span>
            </NavLink>
          </nav>
          
          <div className="p-4 border-t border-slate-700/50">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                T
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Teacher User</span>
                <span className="text-xs text-slate-500">Admin</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed relative">
          <div className="absolute inset-0 bg-[#0f172a]/95 pointer-events-none" />
          <div className="relative p-8 h-full">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/onboard" element={<Onboarding />} />
              <Route path="/attendance" element={<Attendance />} />
            </Routes>
          </div>
        </main>
        
      </div>
    </BrowserRouter>
  );
}
