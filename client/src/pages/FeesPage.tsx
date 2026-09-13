import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
type Fee = { id: string; totalAmountPaise: number; paidAmountPaise: number; summary: { outstandingAmountPaise: number; status: string }; feeStructure: { name: string; description?: string }; payments: Array<{ id: string; amountPaise: number; status: string; receipt?: { id: string; receiptNumber: string } | null }> };
const rupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function FeesPage({ mode }: { mode: 'student' | 'admin' }) {
  const [fees, setFees] = useState<Fee[]>([]);
  const [payments, setPayments] = useState<Array<Record<string, any>>>([]);
  const [students, setStudents] = useState<Array<{ id: string; user: { fullName: string; email: string } }>>([]);
  const [structures, setStructures] = useState<Array<{ id: string; name: string; className: string }>>([]);
  const [assignment, setAssignment] = useState({ studentId: '', feeStructureId: '' });
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [structure, setStructure] = useState({ name: '', description: '', className: '', amount: '' });

  async function load() {
    const endpoint = mode === 'student' ? '/api/student/fees' : '/api/admin/fees';
    const response = await fetch(`${API_URL}${endpoint}`, { credentials: 'include' });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || 'Unable to load fee records.');
    setFees(payload.data || []);
    if (mode === 'admin') { const [paymentResponse, studentResponse, structureResponse] = await Promise.all([fetch(`${API_URL}/api/admin/payments`, { credentials: 'include' }), fetch(`${API_URL}/api/admin/students`, { credentials: 'include' }), fetch(`${API_URL}/api/admin/fee-structures`, { credentials: 'include' })]); const paymentPayload = await paymentResponse.json(); const studentPayload = await studentResponse.json(); const structurePayload = await structureResponse.json(); if (paymentResponse.ok) setPayments(paymentPayload.data || []); if (studentResponse.ok) setStudents(studentPayload.data || []); if (structureResponse.ok) setStructures(structurePayload.data || []); }
  }
  useEffect(() => { load().catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Unable to load fee records.')); }, [mode]);

  async function createOrder(fee: Fee) {
    const amountPaise = Math.round(Number(amounts[fee.id]) * 100);
    if (!amountPaise || amountPaise > fee.summary.outstandingAmountPaise) { setError('Enter a valid amount within the outstanding balance.'); return; }
    const idempotencyKey = `mma-${fee.id}-${amountPaise}`;
    const response = await fetch(`${API_URL}/api/student/payments/order`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentFeeId: fee.id, amountPaise, idempotencyKey }) });
    const payload = await response.json();
    if (!response.ok) { setError(payload.message || 'Unable to create payment.'); return; }
    if (!payload.data.keyId) { setMessage('Sandbox order created. Configure Razorpay test credentials to open the gateway.'); return; }
    const razorpayWindow = window as Window & { Razorpay?: new (options: Record<string, unknown>) => { open: () => void } };
    if (!razorpayWindow.Razorpay) { const script = document.createElement('script'); script.src = 'https://checkout.razorpay.com/v1/checkout.js'; script.onload = () => openGateway(payload.data); document.body.appendChild(script); } else openGateway(payload.data);
    function openGateway(order: { orderId: string; amountPaise: number; keyId: string }) {
      const Razorpay = (window as unknown as { Razorpay: new (options: Record<string, unknown>) => { open: () => void } }).Razorpay;
      const checkout = new Razorpay({ key: order.keyId, amount: order.amountPaise, currency: 'INR', name: 'Manish Mishra Academy', description: fee.feeStructure.name, order_id: order.orderId, handler: async (result: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => { const verifyResponse = await fetch(`${API_URL}/api/student/payments/verify`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentRecordId: payload.data.paymentRecordId, razorpayOrderId: result.razorpay_order_id, razorpayPaymentId: result.razorpay_payment_id, razorpaySignature: result.razorpay_signature }) }); setMessage(verifyResponse.ok ? 'Payment verified successfully.' : 'Payment could not be completed. Please try again.'); if (verifyResponse.ok) load(); }, modal: { ondismiss: () => setMessage('Payment could not be completed. Please try again.') } });
      checkout.open();
    }
  }

  async function createStructure() {
    const response = await fetch(`${API_URL}/api/admin/fee-structures`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: structure.name, description: structure.description, className: structure.className, totalAmountPaise: Math.round(Number(structure.amount) * 100) }) });
    const payload = await response.json();
    if (!response.ok) { setError(payload.message || 'Unable to create fee structure.'); return; }
    setMessage('Fee structure configured. Assign it to students through the authorized administration workflow.'); setStructure({ name: '', description: '', className: '', amount: '' });
  }

  async function assignFee() {
    const response = await fetch(`${API_URL}/api/admin/student-fees`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(assignment) });
    const payload = await response.json();
    if (!response.ok) { setError(payload.message || 'Unable to assign fee.'); return; }
    setMessage('Fee assigned to the student.'); setAssignment({ studentId: '', feeStructureId: '' }); load();
  }

  return <div className="container-shell py-12"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">{mode === 'student' ? 'Student corner' : 'Administration'}</p><h1 className="mt-3 text-4xl font-bold text-slate-900">{mode === 'student' ? 'Fees & payments' : 'Fee management'}</h1><p className="mt-3 text-slate-600">{mode === 'student' ? 'View your assigned fees, balance, payment history, and receipts.' : 'Review balances and verified gateway transactions. Successful payments are not manually editable.'}</p>{message && <p className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-emerald-700">{message}</p>}{error && <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-red-700">{error}</p>}
    {mode === 'student' && !fees.length && <div className="card-surface mt-8 p-8"><h2 className="text-xl font-bold text-slate-900">No fee assigned yet</h2><p className="mt-2 text-slate-600">Your fee structure has not been configured by an authorized academy administrator.</p></div>}
    {mode === 'admin' && <div className="card-surface mt-8 grid gap-4 p-6 md:grid-cols-2"><h2 className="md:col-span-2 text-xl font-bold text-slate-900">Configure fee structure</h2>{(['name', 'description', 'className', 'amount'] as const).map((field) => <label className="text-sm font-medium text-slate-700" key={field}>{field === 'amount' ? 'Total amount in INR' : field[0].toUpperCase() + field.slice(1)}<input required={field !== 'description'} type={field === 'amount' ? 'number' : 'text'} min={field === 'amount' ? '0.01' : undefined} step={field === 'amount' ? '0.01' : undefined} value={structure[field]} onChange={(event) => setStructure({ ...structure, [field]: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label>)}<button type="button" onClick={createStructure} className="primary-button md:col-span-2">Save fee structure</button></div>}
    {mode === 'admin' && <div className="card-surface mt-8 grid gap-4 p-6 md:grid-cols-2"><h2 className="md:col-span-2 text-xl font-bold text-slate-900">Assign fee to student</h2><select value={assignment.studentId} onChange={(event) => setAssignment({ ...assignment, studentId: event.target.value })} className="rounded-xl border border-slate-200 px-4 py-3"><option value="">Choose student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.user.fullName} · {student.user.email}</option>)}</select><select value={assignment.feeStructureId} onChange={(event) => setAssignment({ ...assignment, feeStructureId: event.target.value })} className="rounded-xl border border-slate-200 px-4 py-3"><option value="">Choose fee structure</option>{structures.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.className}</option>)}</select><button type="button" onClick={assignFee} disabled={!assignment.studentId || !assignment.feeStructureId} className="primary-button md:col-span-2 disabled:opacity-50">Assign fee</button></div>}
    <div className="mt-8 grid gap-5">{fees.map((fee) => <article className="card-surface p-6" key={fee.id}><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-sky-700">{fee.summary.status}</p><h2 className="mt-2 text-xl font-bold text-slate-900">{fee.feeStructure.name}</h2><p className="mt-2 text-sm text-slate-600">{fee.feeStructure.description}</p></div><div className="text-right"><p className="text-sm text-slate-500">Outstanding</p><p className="text-2xl font-bold text-slate-900">{rupees(fee.summary.outstandingAmountPaise)}</p></div></div><div className="mt-6 grid gap-4 sm:grid-cols-3"><div><p className="text-sm text-slate-500">Total fee</p><p className="font-semibold">{rupees(fee.totalAmountPaise)}</p></div><div><p className="text-sm text-slate-500">Amount paid</p><p className="font-semibold">{rupees(fee.paidAmountPaise)}</p></div>{mode === 'student' && fee.summary.outstandingAmountPaise > 0 && <div className="flex gap-2"><input type="number" min="1" step="0.01" placeholder="Amount in INR" value={amounts[fee.id] || ''} onChange={(event) => setAmounts({ ...amounts, [fee.id]: event.target.value })} className="min-w-0 rounded-xl border border-slate-200 px-3" /><button type="button" onClick={() => createOrder(fee)} className="primary-button px-4 py-2">Pay</button></div>}</div><div className="mt-6 border-t border-slate-100 pt-4"><h3 className="font-semibold text-slate-900">Payment history</h3>{fee.payments.length ? fee.payments.map((payment) => <p className="mt-2 text-sm text-slate-600" key={payment.id}>{rupees(payment.amountPaise)} · {payment.status}{payment.receipt ? <>{` · Receipt ${payment.receipt.receiptNumber} `}<a className="text-sky-700 underline" href={`${API_URL}/api/student/receipts/${payment.receipt.id}/download`}>download</a></> : ''}</p>) : <p className="mt-2 text-sm text-slate-500">No payment attempts recorded.</p>}</div></article>)}</div>
    {mode === 'admin' && <section className="mt-12"><h2 className="section-title text-2xl">Payment records</h2><div className="mt-5 grid gap-4">{payments.map((payment) => <div className="card-surface p-5" key={payment.id}><p className="font-semibold text-slate-900">{payment.student?.user?.fullName || 'Student'} · {rupees(payment.amountPaise)}</p><p className="mt-2 text-sm text-slate-600">{payment.status} · {payment.gatewayPaymentId || payment.gatewayOrderId || 'No gateway ID yet'}</p></div>)}</div></section>}
  </div>;
}
