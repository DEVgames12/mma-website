const subjects = [
  {
    title: 'Physics',
    details: ['Conceptual understanding', 'Numerical problem solving', 'Class 11 / Class 12 batches', 'Doubt support', 'Regular practice'],
  },
  {
    title: 'Chemistry',
    details: ['Concept-based learning', 'Reactions and problem solving', 'Regular practice', 'Class 11 / Class 12 batches', 'Doubt support'],
  },
  {
    title: 'Mathematics',
    details: ['Concept building', 'Problem solving', 'Regular practice', 'Class 11 / Class 12 batches', 'Faculty guidance'],
  },
];

export default function Classes1112Page() {
  return (
    <div className="container-shell py-16 md:py-20">
      <div className="mb-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Classes 11–12</p>
        <h1 className="mt-4 text-4xl font-black text-slate-900 md:text-5xl">Subject-focused senior batches</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {subjects.map((subject) => (
          <div key={subject.title} className="card-surface p-8">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">{subject.title}</div>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">{subject.title}</h2>
            <p className="mt-3 text-sm text-slate-500">Class 11 / Class 12</p>
            <ul className="mt-5 space-y-3 text-slate-600">
              {subject.details.map((item) => (
                <li key={item} className="flex items-center gap-3"><span className="rounded-full bg-sky-100 p-1 text-sky-700">✓</span> {item}</li>
              ))}
            </ul>
            <button type="button" className="primary-button mt-6 w-full">Enquire Now</button>
          </div>
        ))}
      </div>
    </div>
  );
}
