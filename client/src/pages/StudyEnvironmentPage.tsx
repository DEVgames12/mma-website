const experience = [
  'Attend classes and stay consistent',
  'Revise topics with guided support',
  'Read books and study resources',
  'Use educational internet resources',
  'Ask doubts and receive timely guidance',
  'Prepare for tests in a calm environment',
  'Study during free time productively',
  'Receive academic guidance and follow-up',
];

export default function StudyEnvironmentPage() {
  return (
    <div className="container-shell py-16 md:py-20">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Study environment</p>
          <h1 className="mt-4 text-4xl font-black text-slate-900 md:text-5xl">More than just a classroom</h1>
          <p className="mt-5 text-lg text-slate-600">
            Students can attend classes, revise concepts, read books, use educational internet resources, ask doubts and study during free time in a focused environment built for progress.
          </p>
        </div>
        <div className="card-surface overflow-hidden p-3">
          <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80" alt="Students studying together" className="h-[420px] w-full rounded-2xl object-cover" />
        </div>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {experience.map((item) => (
          <div key={item} className="card-surface p-5 text-slate-800">{item}</div>
        ))}
      </div>
    </div>
  );
}
