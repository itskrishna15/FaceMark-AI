import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, BookOpen, Plus, Camera, Trash2 } from 'lucide-react';

export default function AdminDashboard() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('classes');
  
  // States
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  
  // Forms
  const [newClassName, setNewClassName] = useState('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
  
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  
  const [teacherForm, setTeacherForm] = useState({ username: '', password: '', name: '' });
  
  const [assignForm, setAssignForm] = useState({ teacher_id: '', class_id: '', subject_id: '' });
  
  const [studentForm, setStudentForm] = useState({ name: '', roll_number: '', username: '', password: '', class_id: '' });
  const [images, setImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const fetchAll = async () => {
    try {
      const [clsRes, subRes, tchrRes, stdRes, assignRes] = await Promise.all([
        fetch('http://localhost:8000/api/admin/classes', { headers }),
        fetch('http://localhost:8000/api/admin/subjects', { headers }),
        fetch('http://localhost:8000/api/admin/teachers', { headers }),
        fetch('http://localhost:8000/api/admin/students', { headers }),
        fetch('http://localhost:8000/api/admin/assignments', { headers })
      ]);
      setClasses(await clsRes.json());
      setSubjects(await subRes.json());
      setTeachers(await tchrRes.json());
      setStudents(await stdRes.json());
      setAssignments(await assignRes.json());
    } catch (e) {
      console.error("Failed to fetch data", e);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const createClass = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('http://localhost:8000/api/admin/classes', {
      method: 'POST', headers, body: JSON.stringify({ name: newClassName, subject_ids: selectedSubjectIds })
    });
    setNewClassName('');
    setSelectedSubjectIds([]);
    fetchAll();
  };

  const createSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('http://localhost:8000/api/admin/subjects', {
      method: 'POST', headers, body: JSON.stringify({ name: newSubjectName, code: newSubjectCode })
    });
    setNewSubjectName('');
    setNewSubjectCode('');
    fetchAll();
  };

  const createTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('http://localhost:8000/api/admin/teachers', {
      method: 'POST', headers, body: JSON.stringify(teacherForm)
    });
    setTeacherForm({ username: '', password: '', name: '' });
    fetchAll();
  };

  const assignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('http://localhost:8000/api/admin/assignments', {
      method: 'POST', headers, body: JSON.stringify({ 
        teacher_id: parseInt(assignForm.teacher_id), 
        class_id: parseInt(assignForm.class_id), 
        subject_id: parseInt(assignForm.subject_id) 
      })
    });
    setAssignForm({ teacher_id: '', class_id: '', subject_id: '' });
    fetchAll();
  };

  const createStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length !== 3) {
      alert("Please upload exactly 3 images");
      return;
    }
    
    const formData = new FormData();
    formData.append('name', studentForm.name);
    formData.append('roll_number', studentForm.roll_number);
    formData.append('username', studentForm.username);
    formData.append('password', studentForm.password);
    formData.append('class_id', studentForm.class_id);
    images.forEach(img => formData.append('images', img));

    try {
      const res = await fetch('http://localhost:8000/api/admin/students/onboard', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (res.ok) {
        setStudentForm({ name: '', roll_number: '', username: '', password: '', class_id: '' });
        setImages([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchAll();
      } else {
        const error = await res.json();
        alert("Error: " + error.detail);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (type: string, id: number) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}? This action may delete related data.`)) return;
    try {
      const res = await fetch(`http://localhost:8000/api/admin/${type}/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        fetchAll();
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to delete');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 3);
      setImages(files);
    }
  };

  const toggleSubject = (id: number) => {
    if (selectedSubjectIds.includes(id)) {
      setSelectedSubjectIds(selectedSubjectIds.filter(s => s !== id));
    } else {
      setSelectedSubjectIds([...selectedSubjectIds, id]);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
        <p className="text-slate-400 mt-2">Manage your institution's records</p>
      </header>

      <div className="flex flex-wrap gap-4 border-b border-slate-700/50 pb-2">
        <button onClick={() => setActiveTab('classes')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'classes' ? 'bg-blue-500/10 text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}>Classes</button>
        <button onClick={() => setActiveTab('subjects')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'subjects' ? 'bg-blue-500/10 text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}>Subjects</button>
        <button onClick={() => setActiveTab('teachers')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'teachers' ? 'bg-blue-500/10 text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}>Teachers</button>
        <button onClick={() => setActiveTab('assignments')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'assignments' ? 'bg-blue-500/10 text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}>Assign Teachers</button>
        <button onClick={() => setActiveTab('students')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'students' ? 'bg-blue-500/10 text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}>Students</button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main list view */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-[#1e293b]/80 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl max-h-[70vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 capitalize">{activeTab} List</h2>
            <div className="space-y-3">
              {activeTab === 'classes' && classes.map(c => (
                <div key={c.id} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 flex justify-between items-start gap-4 hover:border-slate-600 transition-colors">
                  <div className="flex flex-col gap-2">
                    <span className="font-bold text-lg">{c.name}</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {c.subjects?.map((s: any) => (
                        <span key={s.id} className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-300 border border-slate-600/50">{s.name} ({s.code})</span>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => handleDelete('classes', c.id)} className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-5 h-5"/></button>
                </div>
              ))}
              
              {activeTab === 'subjects' && subjects.map(s => (
                <div key={s.id} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 flex justify-between items-center hover:border-slate-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-sm font-mono bg-slate-900/50 px-2 py-1 rounded text-blue-400 border border-blue-500/20">{s.code}</span>
                  </div>
                  <button onClick={() => handleDelete('subjects', s.id)} className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-5 h-5"/></button>
                </div>
              ))}
              
              {activeTab === 'teachers' && teachers.map(t => (
                <div key={t.id} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 flex justify-between items-center hover:border-slate-600 transition-colors">
                  <div>
                    <span className="block font-medium">{t.name}</span>
                    <span className="text-slate-400 text-sm">@{t.username}</span>
                  </div>
                  <button onClick={() => handleDelete('teachers', t.id)} className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-5 h-5"/></button>
                </div>
              ))}
              
              {activeTab === 'assignments' && assignments.map(a => (
                <div key={a.id} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 flex justify-between items-center hover:border-slate-600 transition-colors">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-blue-400">{a.teacher}</span>
                    <span className="text-sm text-slate-400">Class: {a.class_name} | Subject: {a.subject}</span>
                  </div>
                  <button onClick={() => handleDelete('assignments', a.id)} className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-5 h-5"/></button>
                </div>
              ))}

              {activeTab === 'students' && students.map(s => (
                <div key={s.id} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 flex justify-between items-center hover:border-slate-600 transition-colors">
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex justify-between items-center pr-4">
                      <span className="font-medium text-lg">{s.name}</span>
                      <span className="text-slate-400 text-sm">@{s.username}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-slate-400 mt-1 pr-4">
                      <span>Roll: {s.roll_number}</span>
                      <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">{s.class_name}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDelete('students', s.id)} className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-5 h-5"/></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action sidebar */}
        <div className="space-y-6">
          {activeTab === 'classes' && (
            <form onSubmit={createClass} className="bg-[#1e293b]/80 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-blue-400"/> New Class</h3>
              <input required value={newClassName} onChange={e => setNewClassName(e.target.value)} placeholder="Class Name (e.g. 10A)" className="w-full bg-[#0f172a]/50 border border-slate-700 rounded-xl px-4 py-3 mb-4 text-slate-200" />
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-400 mb-2">Assign Subjects</label>
                <div className="max-h-40 overflow-y-auto space-y-2 p-2 bg-[#0f172a]/30 rounded-xl border border-slate-700/50">
                  {subjects.map(s => (
                    <label key={s.id} className="flex items-center gap-3 cursor-pointer p-1">
                      <input type="checkbox" checked={selectedSubjectIds.includes(s.id)} onChange={() => toggleSubject(s.id)} className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900" />
                      <span className="text-sm text-slate-300">{s.name} ({s.code})</span>
                    </label>
                  ))}
                  {subjects.length === 0 && <span className="text-xs text-slate-500 px-2">No subjects available</span>}
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl">Create Class</button>
            </form>
          )}

          {activeTab === 'subjects' && (
            <form onSubmit={createSubject} className="bg-[#1e293b]/80 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl space-y-4">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-blue-400"/> New Subject</h3>
              <input required value={newSubjectCode} onChange={e => setNewSubjectCode(e.target.value)} placeholder="Subject Code (e.g. CS101)" className="w-full bg-[#0f172a]/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200" />
              <input required value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} placeholder="Subject Name (e.g. Math)" className="w-full bg-[#0f172a]/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200" />
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl">Create Subject</button>
            </form>
          )}

          {activeTab === 'teachers' && (
            <form onSubmit={createTeacher} className="bg-[#1e293b]/80 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl space-y-4">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-blue-400"/> New Teacher</h3>
              <input required value={teacherForm.name} onChange={e => setTeacherForm({...teacherForm, name: e.target.value})} placeholder="Full Name" className="w-full bg-[#0f172a]/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200" />
              <input required value={teacherForm.username} onChange={e => setTeacherForm({...teacherForm, username: e.target.value})} placeholder="Username" className="w-full bg-[#0f172a]/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200" />
              <input required type="password" value={teacherForm.password} onChange={e => setTeacherForm({...teacherForm, password: e.target.value})} placeholder="Password" className="w-full bg-[#0f172a]/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200" />
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl">Create Teacher</button>
            </form>
          )}

          {activeTab === 'assignments' && (
            <form onSubmit={assignTeacher} className="bg-[#1e293b]/80 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl space-y-4">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-blue-400"/> Assign Teacher</h3>
              
              <select required value={assignForm.teacher_id} onChange={e => setAssignForm({...assignForm, teacher_id: e.target.value})} className="w-full bg-[#0f172a]/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200">
                <option value="">Select Teacher</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>

              <select required value={assignForm.class_id} onChange={e => setAssignForm({...assignForm, class_id: e.target.value})} className="w-full bg-[#0f172a]/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200">
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <select required value={assignForm.subject_id} onChange={e => setAssignForm({...assignForm, subject_id: e.target.value})} className="w-full bg-[#0f172a]/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200">
                <option value="">Select Subject</option>
                {/* Dynamically list subjects that belong to the selected class */}
                {assignForm.class_id 
                  ? classes.find(c => c.id === parseInt(assignForm.class_id))?.subjects.map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)
                  : subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                }
              </select>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl">Assign</button>
            </form>
          )}

          {activeTab === 'students' && (
            <form onSubmit={createStudent} className="bg-[#1e293b]/80 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl space-y-4">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-blue-400"/> Onboard Student</h3>
              
              <input required value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} placeholder="Full Name" className="w-full bg-[#0f172a]/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200" />
              <input required value={studentForm.roll_number} onChange={e => setStudentForm({...studentForm, roll_number: e.target.value})} placeholder="Roll Number" className="w-full bg-[#0f172a]/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200" />
              
              <div className="flex gap-2">
                <input required value={studentForm.username} onChange={e => setStudentForm({...studentForm, username: e.target.value})} placeholder="Username" className="w-full bg-[#0f172a]/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200" />
                <input required type="password" value={studentForm.password} onChange={e => setStudentForm({...studentForm, password: e.target.value})} placeholder="Password" className="w-full bg-[#0f172a]/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200" />
              </div>

              <select required value={studentForm.class_id} onChange={e => setStudentForm({...studentForm, class_id: e.target.value})} className="w-full bg-[#0f172a]/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200">
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Upload 3 Face Images</label>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="image/*" 
                  multiple 
                  onChange={handleImageChange}
                  className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20"
                />
                {images.length > 0 && <p className="text-xs text-slate-500 mt-2">{images.length} files selected</p>}
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2">
                <Camera className="w-4 h-4"/> Extract & Onboard
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
