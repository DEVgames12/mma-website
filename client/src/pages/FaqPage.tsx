const faqs = [
  { question: 'Which classes are offered?', answer: 'MMA focuses on academic coaching for Classes 7th to 12th.' },
  { question: 'What subjects are available?', answer: 'For Classes 7th to 10th, all major academic subjects are covered. For Classes 11th and 12th, separate batches are offered in Physics, Chemistry and Mathematics.' },
  { question: 'What are the batch timings?', answer: 'The academy operates on batches scheduled around 4:00 PM to 7:00 PM, with one-hour learning batches.' },
  { question: 'Is library access available?', answer: 'Yes, the academy provides a dedicated study and library resource area for revision and reading.' },
  { question: 'Can students study during free time?', answer: 'Yes, students can use the available study facilities during free time for academic work.' },
  { question: 'Is doubt support available?', answer: 'Yes, faculty guidance and support are provided to help students resolve difficulties.' },
  { question: 'How can parents enquire?', answer: 'Parents and students can submit an enquiry through the contact form or reach out using the available contact details.' },
  { question: 'Are regular tests conducted?', answer: 'Yes, regular assessments are part of the learning process to track progress and identify weak areas.' },
  { question: 'Is there a student portal?', answer: 'This foundation is prepared for future student and admin portal features.' },
  { question: 'Is there a teacher portal?', answer: 'This foundation is prepared for future teacher and admin workflows.' },
  { question: 'Are fee payment policies available?', answer: 'Fee information is not specified here and should be added later from official academy records.' },
];

export default function FaqPage() {
  return (
    <div className="container-shell py-16 md:py-20">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">FAQ</p>
        <h1 className="mt-4 text-4xl font-black text-slate-900 md:text-5xl">Frequently asked questions</h1>
      </div>

      <div className="mt-12 space-y-5">
        {faqs.map((faq) => (
          <details key={faq.question} className="card-surface p-6">
            <summary className="cursor-pointer list-none text-lg font-semibold text-slate-900">{faq.question}</summary>
            <p className="mt-4 text-slate-600">{faq.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
