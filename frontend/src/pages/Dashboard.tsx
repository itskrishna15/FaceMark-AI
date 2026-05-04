import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, CheckCircle, Clock } from 'lucide-react';

interface Stats {
  total_students: number;
  total_classes: number;
  total_attendance_logs: number;
  recent_classes: any[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    // In a real app, this would fetch from http://localhost:8000/api/analytics/dashboard
    // Mock data for initial rendering
    setTimeout(() => {
      setStats({
        total_students: 142,
        total_classes: 24,
        total_attendance_logs: 1250,
        recent_classes: [
          { id: 1, name: 'Computer Science 101', timestamp: '2026-05-04T10:00:00Z' },
          { id: 2, name: 'Data Structures', timestamp: '2026-05-03T14:30:00Z' },
        ]
      });
    }, 1000);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Overview of student attendance and analytics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Students', value: stats?.total_students ?? '-', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Classes Held', value: stats?.total_classes ?? '-', icon: Clock, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'Total Logs', value: stats?.total_attendance_logs ?? '-', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        ].map((stat, idx) => (
          <motion.div key={idx} variants={itemVariants} className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl flex items-center gap-4 shadow-xl shadow-black/20 relative overflow-hidden group">
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${stat.bg} blur-2xl group-hover:scale-150 transition-transform duration-500`} />
            <div className={`p-4 rounded-xl ${stat.bg} border border-slate-700/30`}>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div variants={itemVariants} className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-black/20">
        <h2 className="text-xl font-bold text-white mb-6">Recent Classes</h2>
        {stats ? (
          <div className="space-y-4">
            {stats.recent_classes.map((cls, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-700/30 hover:border-blue-500/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{cls.name}</h3>
                    <p className="text-sm text-slate-400">{new Date(cls.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <button className="px-4 py-2 text-sm font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition-colors">
                  View Logs
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="animate-pulse space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-slate-700/30 w-full" />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
