import { FormEvent, useState } from 'react';

const initialForm = {
  studentName: '',
  parentName: '',
  phone: '',
  email: '',
  className: '',
  subject: '',
  batch: '',
  message: '',
};

export default function ContactPage() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof initialForm, string>>>({});
  const [status, setStatus] = useState('');

  const handleChange = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof typeof initialForm, string>> = {};
    if (!form.studentName.trim()) nextErrors.studentName = 'Student name is required.';
    if (!form.parentName.trim()) nextErrors.parentName = 'Parent name is required.';
    if (!form.phone.trim()) nextErrors.phone = 'Phone number is required.';
    else if (!/^[0-9+\-()\s]{8,}$/.test(form.phone)) nextErrors.phone = 'Please enter a valid phone number.';
    if (!form.email.trim()) nextErrors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Please enter a valid email.';
    if (!form.className.trim()) nextErrors.className = 'Class is required.';
    if (!form.subject.trim()) nextErrors.subject = 'Subject is required.';
    if (!form.batch.trim()) nextErrors.batch = 'Preferred batch is required.';
    if (!form.message.trim()) nextErrors.message = 'Message is required.';
    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatus('Please correct the highlighted fields and try again.');
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Something went wrong. Please try again.');
      }

      setStatus('Thank you for contacting Manish Mishra Academy. Our team will get back to you soon.');
      setForm(initialForm);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="container-shell py-16 md:py-20">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Contact</p>
          <h1 className="mt-4 text-4xl font-black text-slate-900 md:text-5xl">Enquire with MMA</h1>
          <p className="mt-5 text-lg text-slate-600">Share your query and our team will get in touch with the right guidance for your child’s academic needs.</p>
        </div>

        <form onSubmit={handleSubmit} className="card-surface p-8" noValidate>
          <div className="grid gap-5 md:grid-cols-2">
            {[
              ['studentName', 'Student Name'],
              ['parentName', 'Parent Name'],
              ['phone', 'Phone Number'],
              ['email', 'Email'],
              ['className', 'Class'],
              ['subject', 'Subject'],
              ['batch', 'Preferred Batch'],
            ].map(([field, label]) => (
              <label key={field} className="block text-sm font-medium text-slate-700">
                {label}
                <input
                  value={form[field as keyof typeof initialForm]}
                  onChange={(event) => handleChange(field as keyof typeof initialForm, event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white"
                  aria-invalid={Boolean(errors[field as keyof typeof initialForm])}
                />
                {errors[field as keyof typeof initialForm] && (
                  <span className="mt-2 block text-xs text-red-600">{errors[field as keyof typeof initialForm]}</span>
                )}
              </label>
            ))}
          </div>

          <label className="mt-5 block text-sm font-medium text-slate-700">
            Message
            <textarea
              rows={5}
              value={form.message}
              onChange={(event) => handleChange('message', event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white"
              aria-invalid={Boolean(errors.message)}
            />
            {errors.message && <span className="mt-2 block text-xs text-red-600">{errors.message}</span>}
          </label>

          {status && (
            <p className={`mt-6 rounded-xl px-4 py-3 text-sm ${status.includes('Thank you') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {status}
            </p>
          )}

          <button type="submit" className="primary-button mt-6 w-full">Submit Enquiry</button>
        </form>
      </div>
    </div>
  );
}
