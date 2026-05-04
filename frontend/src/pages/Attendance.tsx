import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Attendance() {
  const [image, setImage] = useState<File | null>(null);
  const [className, setClassName] = useState('Computer Science 101');
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<any | null>(null);

  const handleProcess = async () => {
    if (!image) return;
    setIsScanning(true);
    
    const formData = new FormData();
    formData.append('class_name', className);
    formData.append('image', image);

    try {
      const res = await fetch('http://localhost:8000/api/attendance/mark', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      } else {
        alert("Failed to process attendance image");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to backend");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Mark Attendance</h1>
        <p className="text-slate-400">Upload a photo of the entire classroom to automatically identify and log attendance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-xl shadow-black/20 space-y-6 h-fit">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Class Session Name</label>
            <input 
              type="text" value={className} onChange={e => setClassName(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-600 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Classroom Photo</label>
            {!image ? (
              <label className="cursor-pointer flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-600 rounded-2xl hover:border-blue-500 hover:bg-blue-500/5 transition-all text-slate-400">
                <Camera className="w-12 h-12 mb-4 text-slate-500" />
                <span className="font-medium">Click to upload class photo</span>
                <span className="text-xs mt-1 opacity-70">High resolution recommended</span>
                <input type="file" accept="image/*" onChange={e => setImage(e.target.files?.[0] || null)} className="hidden" />
              </label>
            ) : (
              <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-slate-600 group">
                <img src={URL.createObjectURL(image)} alt="Class preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => setImage(null)} className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium shadow-lg hover:bg-red-600">
                    Remove Image
                  </button>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={handleProcess}
            disabled={!image || isScanning}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-500 hover:to-teal-500 focus:ring-2 focus:ring-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
          >
            {isScanning ? (
              <><span className="animate-pulse flex items-center gap-2"><Upload className="animate-bounce" /> Processing AI Vision...</span></>
            ) : (
              <><Camera className="w-5 h-5" /> Run Recognition</>
            )}
          </button>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-xl shadow-black/20 flex flex-col">
          <h2 className="text-xl font-bold text-white mb-4">Results Panel</h2>
          
          <div className="flex-1 bg-slate-900/50 rounded-xl border border-slate-700/50 p-4 overflow-y-auto">
            <AnimatePresence mode="wait">
              {!results && !isScanning && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                  <AlertCircle className="w-12 h-12 opacity-50" />
                  <p>Upload a photo and run recognition to see results.</p>
                </motion.div>
              )}

              {isScanning && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center text-blue-400 space-y-6">
                  <div className="relative w-24 h-24">
                    <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <Camera className="absolute inset-0 m-auto w-8 h-8 animate-pulse" />
                  </div>
                  <p className="font-medium animate-pulse">Extracting 512-dim embeddings...</p>
                </motion.div>
              )}

              {results && !isScanning && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <div>
                      <h3 className="text-emerald-400 font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Analysis Complete
                      </h3>
                      <p className="text-sm text-slate-300 mt-1">Found {results.total_faces_detected} faces, recognized {results.recognized_count} students.</p>
                    </div>
                  </div>

                  <div className="space-y-2 mt-6">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Recognized Students</h4>
                    {results.students.map((student: any, idx: number) => (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} key={idx} className="flex items-center justify-between p-3 bg-slate-800/80 border border-slate-600 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-bold">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-white">{student.name}</p>
                            <p className="text-xs text-slate-400">{student.roll_number}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-emerald-400 font-bold text-sm">{(student.confidence * 100).toFixed(1)}% Match</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
