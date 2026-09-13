const milestones = [
  'Concept-focused teaching for Classes 7th to 12th',
  'Regular doubt support and teacher guidance',
  'Academic monitoring and practice-based improvement',
  'Study environment designed around focus and discipline',
];

export default function AboutPage() {
  return (
    <div className="container-shell py-16 md:py-20">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">About us</p>
          <h1 className="mt-4 text-4xl font-black text-slate-900 md:text-5xl">About Manish Mishra Academy</h1>
          <p className="mt-5 text-lg text-slate-600">
            MMA is designed for students who want clarity, consistency and confidence in academics. We believe strong fundamentals matter more than rote learning, which is why conceptual learning and regular practice remain at the centre of our approach.
          </p>
          <p className="mt-5 text-slate-600">
            Our system encourages students to understand ideas deeply, ask questions without hesitation, and improve gradually through regular assessment and guided support.
          </p>
        </div>
        <div className="card-surface overflow-hidden p-3">
          <img
            src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1000&q=80"
            alt="Teacher guiding students in a classroom"
            className="h-[420px] w-full rounded-2xl object-cover"
          />
        </div>
      </div>

      <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {milestones.map((item, index) => (
          <div key={item} className="card-surface p-6">
            <div className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">0{index + 1}</div>
            <p className="text-lg font-semibold text-slate-900">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
