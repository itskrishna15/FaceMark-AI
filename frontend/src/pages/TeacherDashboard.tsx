import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Camera, Users, Upload } from 'lucide-react';

export default function TeacherDashboard() {
  const { token } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [activeAssignment, setActiveAssignment] = useState<any | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/teacher/assignments', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => setAssignments(data));
  }, [token]);

  const startCamera = async (assignment: any) => {
    setActiveAssignment(assignment);
    setResult(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (e) {
      console.error(e);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setActiveAssignment(null);
  };

  const captureAndMark = async () => {
    if (!videoRef.current || !activeAssignment) return;
    setLoading(true);
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      
      const formData = new FormData();
      formData.append('image', blob, 'attendance.jpg');
      formData.append('assignment_id', activeAssignment.id.toString());
      
      try {
        const res = await fetch('http://localhost:8000/api/teacher/attendance/mark', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        const data = await res.json();
        setResult(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 'image/jpeg');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeAssignment) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('assignment_id', activeAssignment.id.toString());
    
    try {
      const res = await fetch('http://localhost:8000/api/teacher/attendance/mark', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white tracking-tight">Teacher Dashboard</h1>
        <p className="text-slate-400 mt-2">Manage your classes and take attendance</p>
      </header>

      {!activeAssignment ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map(a => (
            <div key={a.id} className="bg-[#1e293b]/80 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl flex flex-col justify-between hover:border-blue-500/50 transition-colors">
              <div>
                <h3 className="text-xl font-semibold mb-1">{a.class_name}</h3>
                <p className="text-slate-400">{a.subject}</p>
              </div>
              <button onClick={() => startCamera(a)} className="mt-6 w-full bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white font-medium py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2">
                <Camera className="w-5 h-5" />
                Take Attendance
              </button>
            </div>
          ))}
          {assignments.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500 border border-slate-700/50 border-dashed rounded-2xl">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No classes assigned yet.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#1e293b]/80 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold">Taking Attendance</h2>
              <p className="text-slate-400">{activeAssignment.class_name} - {activeAssignment.subject}</p>
            </div>
            <button onClick={stopCamera} className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 rounded-lg">Cancel</button>
          </div>
          
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
          
          {result ? (
            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <h3 className="text-green-400 font-medium text-lg">Attendance Marked Successfully!</h3>
              <p className="text-slate-300 mt-2">Recognized {result.recognized_count} out of {result.total_faces_detected} detected faces.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {result.students?.map((s: any) => (
                  <span key={s.id} className="px-3 py-1 bg-slate-800 rounded-full text-sm">{s.name} ({s.roll_number})</span>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-3">
              <button 
                onClick={captureAndMark} 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {loading ? <span className="animate-pulse">Processing...</span> : <><Camera className="w-5 h-5"/> Capture Live Image</>}
              </button>
              
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700/50"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[#1e293b] text-slate-500">Or</span>
                </div>
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileUpload} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-4 rounded-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2 border border-slate-700/50"
              >
                <Upload className="w-5 h-5"/> Upload Group Photo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
