import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Calendar, CheckCircle2 } from 'lucide-react';

export default function StudentDashboard() {
  const { token } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/student/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => setDashboardData(data))
    .catch(console.error);
  }, [token]);

  if (!dashboardData) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white tracking-tight">Student Dashboard</h1>
        <p className="text-slate-400 mt-2">Welcome back, {dashboardData.student_name}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1e293b]/80 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Class</p>
            <p className="text-xl font-semibold">{dashboardData.class_name || 'Unassigned'}</p>
          </div>
        </div>
        
        <div className="bg-[#1e293b]/80 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Total Classes Attended</p>
            <p className="text-xl font-semibold">{dashboardData.recent_attendance.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-[#1e293b]/80 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-400" />
          My Subjects
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboardData.my_subjects && dashboardData.my_subjects.length > 0 ? dashboardData.my_subjects.map((sub: any) => (
            <div key={sub.id} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 flex flex-col gap-1">
              <span className="font-bold text-lg text-slate-200">{sub.name}</span>
              <span className="text-sm text-purple-400 font-mono bg-purple-500/10 px-2 py-0.5 rounded w-max border border-purple-500/20">{sub.code}</span>
            </div>
          )) : (
            <div className="col-span-full text-center py-4 text-slate-500">No subjects assigned yet.</div>
          )}
        </div>
      </div>

      <div className="bg-[#1e293b]/80 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-400" />
          Recent Attendance
        </h2>
        
        <div className="space-y-3">
          {dashboardData.recent_attendance.length > 0 ? dashboardData.recent_attendance.map((log: any) => (
            <div key={log.id} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 flex justify-between items-center">
              <div>
                <p className="font-medium text-slate-200">{log.subject}</p>
                <p className="text-sm text-slate-400">{new Date(log.timestamp).toLocaleString()}</p>
              </div>
              <div className="flex flex-col items-end">
                <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm font-medium border border-green-500/20">
                  Present
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Confidence: {(log.confidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-slate-500">
              No attendance records found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
