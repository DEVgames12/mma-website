import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

type RecordItem = Record<string, string | undefined> & { id: string };

export default function AcademicListPage({ kind, role }: { kind: 'tests' | 'timetable'; role: 'student' | 'teacher' | 'admin' }) {
  const [items, setItems] = useState<RecordItem[]>([]);
  const [error, setError] = useState('');
  const endpoint = `/api/${role === 'admin' ? 'admin' : role}/${kind}`;

  useEffect(() => { fetch(`${API_URL}${endpoint}`, { credentials: 'include' }).then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload.message || 'Unable to load academic records.'); setItems(payload.data || []); }).catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Unable to load academic records.')); }, [endpoint]);

  return <div className="container-shell py-12"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Academic portal</p><h1 className="mt-3 text-4xl font-bold text-slate-900">{kind === 'tests' ? 'Tests' : 'Timetable'}</h1><p className="mt-3 text-slate-600">Database-driven records available to your account.</p>{error ? <p className="card-surface mt-8 p-6 text-red-700">{error}</p> : <div className="mt-8 grid gap-4 md:grid-cols-2">{items.map((item) => <article className="card-surface p-6" key={item.id}><h2 className="text-xl font-bold text-slate-900">{item.title || `${item.day} · ${item.subject || 'Class session'}`}</h2><p className="mt-3 text-sm text-slate-600">{kind === 'tests' ? `${item.className} · ${item.subject} · ${item.topic}` : `${item.classLevel} · ${item.subject || 'Class session'} · ${item.startTime} - ${item.endTime}`}</p><p className="mt-2 text-sm text-slate-500">{kind === 'tests' ? `${item.date} at ${item.time} · ${item.status}` : `${item.day}${item.batch ? ` · ${item.batch}` : ''}${item.room ? ` · ${item.room}` : ''}`}</p>{item.instructions && <p className="mt-3 text-sm text-slate-600">{item.instructions}</p>}</article>)}</div>}{!items.length && !error && <p className="mt-8 text-slate-600">No records are available yet.</p>}</div>;
}
