import { FormEvent, useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const resourceTypes = ['Notes', 'PDF', 'Assignment', 'Worksheet', 'Question paper', 'Revision material', 'Reference material'];

type Resource = {
  id: string;
  title: string;
  description?: string;
  className: string;
  subject: string;
  topic: string;
  type: string;
  fileName: string;
  createdAt: string;
  teacher?: { user?: { fullName?: string } };
};

type Assignment = { className: string; subject: string; batch?: string };

export default function ResourcesPage({ mode }: { mode: 'student' | 'teacher' }) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ className: '', subject: '', type: '' });
  const [form, setForm] = useState({ title: '', description: '', className: '', subject: '', topic: '', type: 'Notes', file: null as File | null });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadResources() {
    const query = new URLSearchParams({ search, ...filters });
    const response = await fetch(`${API_URL}/api/${mode}/resources?${query}`, { credentials: 'include' });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || 'Unable to load resources.');
    setResources(payload.data || []);
    setAssignments(payload.assignments || []);
  }

  useEffect(() => { loadResources().catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Unable to load resources.')); }, [mode, search, filters]);

  async function download(resource: Resource) {
    const response = await fetch(`${API_URL}/api/resources/${resource.id}/download`, { credentials: 'include' });
    if (!response.ok) { setError('You are not authorized to download this file.'); return; }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = resource.fileName; link.click(); URL.revokeObjectURL(url);
  }

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setMessage('');
    if (!form.file) { setError('Choose a PDF, image, or text file first.'); return; }
    const fileData = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(form.file as File); });
    const response = await fetch(`${API_URL}/api/teacher/resources`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, file: undefined, fileName: form.file.name, mimeType: form.file.type, fileData }) });
    const payload = await response.json();
    if (!response.ok) { setError(payload.message || 'Unable to publish resource.'); return; }
    setMessage('Resource published successfully.'); setForm({ title: '', description: '', className: '', subject: '', topic: '', type: 'Notes', file: null }); loadResources();
  }

  return (
    <div className="container-shell py-12">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">{mode === 'student' ? 'Student corner' : 'Teacher workspace'}</p>
      <h1 className="mt-3 text-4xl font-bold text-slate-900">{mode === 'student' ? 'Study resources' : 'My resource library'}</h1>
      <p className="mt-3 max-w-2xl text-slate-600">{mode === 'student' ? 'Find notes, assignments, worksheets, and revision material available for your enrolled classes.' : 'Publish academic material only to classes and subjects assigned to your teacher profile.'}</p>

      {mode === 'teacher' && <form onSubmit={publish} className="card-surface mt-8 grid gap-4 p-6 md:grid-cols-2">
        <h2 className="md:col-span-2 text-xl font-bold text-slate-900">Publish a resource</h2>
        {(['title', 'description', 'topic'] as const).map((field) => <label key={field} className="text-sm font-medium text-slate-700">{field[0].toUpperCase() + field.slice(1)}<input required={field !== 'description'} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label>)}
        <label className="text-sm font-medium text-slate-700">Class<select required value={form.className} onChange={(event) => setForm({ ...form, className: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"><option value="">Choose assigned class</option>{[...new Set(assignments.map((item) => item.className))].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="text-sm font-medium text-slate-700">Subject<select required value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"><option value="">Choose assigned subject</option>{[...new Set(assignments.filter((item) => !form.className || item.className === form.className).map((item) => item.subject))].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="text-sm font-medium text-slate-700">Type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3">{resourceTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="text-sm font-medium text-slate-700">File<input required type="file" accept=".pdf,.jpg,.jpeg,.png,.txt" onChange={(event) => setForm({ ...form, file: event.target.files?.[0] || null })} className="mt-2 block w-full text-sm" /></label>
        <button className="primary-button md:col-span-2" type="submit">Publish resource</button>
      </form>}

      <div className="card-surface mt-8 grid gap-4 p-5 md:grid-cols-4">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search resources" className="rounded-xl border border-slate-200 px-4 py-3 md:col-span-2" />
        {(['className', 'subject', 'type'] as const).map((filter) => <input key={filter} value={filters[filter]} onChange={(event) => setFilters({ ...filters, [filter]: event.target.value })} placeholder={filter === 'className' ? 'Class' : filter[0].toUpperCase() + filter.slice(1)} className="rounded-xl border border-slate-200 px-4 py-3" />)}
      </div>

      {message && <p className="mt-5 rounded-lg bg-emerald-50 px-4 py-3 text-emerald-700">{message}</p>}
      {error && <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-red-700">{error}</p>}
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {resources.map((resource) => <article className="card-surface p-6" key={resource.id}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-sky-700">{resource.type}</p><h2 className="mt-2 text-xl font-bold text-slate-900">{resource.title}</h2></div><button type="button" onClick={() => download(resource)} className="secondary-button px-4 py-2">Download</button></div><p className="mt-3 text-sm text-slate-600">{resource.description || resource.topic}</p><p className="mt-4 text-sm text-slate-500">{resource.className} · {resource.subject} · {resource.teacher?.user?.fullName || 'MMA faculty'}</p><p className="mt-2 text-xs text-slate-400">Uploaded {new Date(resource.createdAt).toLocaleDateString()}</p></article>)}
      </div>
      {!resources.length && !error && <p className="mt-8 text-slate-600">No resources match your current filters.</p>}
    </div>
  );
}
