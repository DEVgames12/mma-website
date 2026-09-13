const facilities = [
  { title: 'Smart Classroom', description: 'Interactive learning spaces that make lessons easier to understand and retain.', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80' },
  { title: 'AC Classroom', description: 'Comfortable, air-conditioned classrooms for focused and uninterrupted learning.', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80' },
  { title: 'Library', description: 'Dedicated reading and revision space with resources for independent preparation.', image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80' },
  { title: 'Fibre Internet', description: 'High-speed connectivity for productive educational work during free study time.', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80' },
  { title: 'Quiet Study Environment', description: 'A calm and disciplined study atmosphere that supports concentration.', image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80' },
  { title: 'Comfortable Seating', description: 'Ergonomic seating designed for comfortable, extended study sessions.', image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80' },
  { title: 'Learning Resources', description: 'Subject-wise learning support materials for practice and revision.', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80' },
  { title: 'Doubt Support', description: 'Students can resolve difficult concepts with faculty guidance.', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80' },
  { title: 'Regular Tests', description: 'Frequent assessments to track improvement and strengthen weak areas.', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80' },
  { title: 'Academic Guidance', description: 'Personal guidance and monitoring that keeps students on track.', image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80' },
];

export default function FacilitiesPage() {
  return (
    <div className="container-shell py-16 md:py-20">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Facilities</p>
        <h1 className="mt-4 text-4xl font-black text-slate-900 md:text-5xl">A premium study environment</h1>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {facilities.map((facility) => (
          <div key={facility.title} className="card-surface overflow-hidden">
            <img src={facility.image} alt={facility.title} className="h-52 w-full object-cover" />
            <div className="p-6">
              <h2 className="text-2xl font-bold text-slate-900">{facility.title}</h2>
              <p className="mt-3 text-slate-600">{facility.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
