import { useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, UserPlus, Image as ImageIcon, X } from 'lucide-react';

export default function Onboarding() {
  const [images, setImages] = useState<File[]>([]);
  const [name, setName] = useState('');
  const [roll, setRoll] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImages(prev => [...prev, ...filesArray].slice(0, 3));
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length !== 3) return alert("Please upload exactly 3 images.");
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('roll_number', roll);
    images.forEach(img => formData.append('images', img));

    try {
      const res = await fetch('http://localhost:8000/api/students/onboard', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        alert("Student onboarded successfully!");
        setName('');
        setRoll('');
        setImages([]);
      } else {
        const err = await res.json();
        alert(err.detail || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to backend");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Onboard Student</h1>
        <p className="text-slate-400">Add a new student to the system by providing their details and 3 reference photos.</p>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-8 rounded-2xl shadow-xl shadow-black/20">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserPlus className="h-5 w-5 text-slate-500" />
                </div>
                <input 
                  type="text" required value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-xl py-3 pl-10 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g. John Doe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Roll Number</label>
              <input 
                type="text" required value={roll} onChange={e => setRoll(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="e.g. CS2026-001"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Reference Photos (Need {3 - images.length} more)</label>
            
            <div className="grid grid-cols-3 gap-4">
              {images.map((img, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square border border-slate-600">
                  <img src={URL.createObjectURL(img)} alt={`Upload ${idx+1}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 bg-red-500/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {images.length < 3 && (
                <label className="cursor-pointer border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-blue-400 hover:border-blue-500 hover:bg-blue-500/5 transition-all aspect-square">
                  <UploadCloud className="w-8 h-8 mb-2" />
                  <span className="text-sm font-medium">Upload Image</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={images.length !== 3 || isUploading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
            >
              {isUploading ? 'Onboarding...' : 'Register Student'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
