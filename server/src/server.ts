import cors from 'cors';
import express from 'express';
import bcrypt from 'bcryptjs';
import { createHmac, randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { config } from './config.js';
import { signToken, verifyToken } from './lib/auth.js';
import { prisma } from './lib/prisma.js';

const app = express();
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const VALID_ROLES = ['HEAD', 'SUPERVISOR', 'TEACHER', 'STUDENT'];
const VALID_PERMISSIONS = [
  'CREATE_STUDENT',
  'EDIT_STUDENT',
  'CREATE_TEACHER',
  'EDIT_TEACHER',
  'MANAGE_CLASSES',
  'MANAGE_TIMETABLE',
  'MANAGE_RESOURCES',
  'MANAGE_TESTS',
  'MANAGE_ANNOUNCEMENTS',
  'VIEW_PAYMENTS',
  'MANAGE_PAYMENTS',
  'MANAGE_SETTINGS',
];
const RESOURCE_TYPES = ['Notes', 'PDF', 'Assignment', 'Worksheet', 'Question paper', 'Revision material', 'Reference material'];
const ALLOWED_FILES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'text/plain': ['.txt'],
};
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const PRIVATE_UPLOAD_DIR = path.resolve(process.cwd(), 'private-uploads');

app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: '12mb', verify: (req, _res, buffer) => { (req as any).rawBody = buffer; } }));

const rateLimitMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const ip = req.ip || 'unknown';
  const current = loginAttempts.get(ip) || { count: 0, firstAttempt: Date.now() };

  if (Date.now() - current.firstAttempt > 60 * 1000) {
    loginAttempts.set(ip, { count: 1, firstAttempt: Date.now() });
    return next();
  }

  if (current.count >= 5) {
    return res.status(429).json({ message: 'Too many login attempts. Please try again later.' });
  }

  loginAttempts.set(ip, { count: current.count + 1, firstAttempt: current.firstAttempt });
  next();
};

const getTokenFromRequest = (req: express.Request): string | null => {
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookieItems = cookieHeader.split(';').map((entry) => entry.trim());
    const tokenCookie = cookieItems.find((entry) => entry.startsWith('mma_token='));
    if (tokenCookie) {
      return decodeURIComponent(tokenCookie.split('=')[1] || '');
    }
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) return authHeader.replace('Bearer ', '');
  return null;
};

const setAuthCookie = (res: express.Response, token: string) => {
  res.setHeader('Set-Cookie', `mma_token=${encodeURIComponent(token)}; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax`);
};

const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = getTokenFromRequest(req);
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) {
      return res.status(403).json({ message: 'Account is disabled or unavailable.' });
    }

    (req as any).user = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
    };
    next();
  } catch (_error) {
    return res.status(401).json({ message: 'Invalid or expired session.' });
  }
};

const requireRoles = (...roles: string[]) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userRole = (req as any).user?.role;
    if (!roles.includes(userRole)) {
      return res.status(403).json({ message: 'Permission denied.' });
    }
    next();
  };
};

const requirePermission = (permission: string) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userRole = (req as any).user?.role;
    if (userRole === 'HEAD') return next();
    if (userRole !== 'SUPERVISOR') {
      return res.status(403).json({ message: 'Permission denied.' });
    }

    const supervisorPermission = await prisma.supervisorPermission.findFirst({
      where: {
        userId: (req as any).user.userId,
        permission,
        isActive: true,
      },
    });

    if (!supervisorPermission) {
      return res.status(403).json({ message: 'Supervisor permission missing.' });
    }

    next();
  };
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const enquirySchema = z.object({
  studentName: z.string().min(2),
  parentName: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email(),
  className: z.string().min(1),
  subject: z.string().min(1),
  batch: z.string().min(1),
  message: z.string().min(10),
});

const studentSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  className: z.string().min(1),
  batch: z.string().min(1),
  subjects: z.string().min(1),
  guardianName: z.string().min(2),
  guardianPhone: z.string().min(8),
  password: z.string().min(8),
});

const teacherSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  classes: z.string().min(1),
  subjects: z.string().min(1),
  batches: z.string().min(1),
  password: z.string().min(8),
});

const resourceSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(1000).optional().default(''),
  className: z.string().min(1).max(80),
  subject: z.string().min(1).max(80),
  topic: z.string().min(1).max(120),
  type: z.enum(['Notes', 'PDF', 'Assignment', 'Worksheet', 'Question paper', 'Revision material', 'Reference material']),
  fileName: z.string().min(1).max(180),
  mimeType: z.string().min(1),
  fileData: z.string().min(1),
});

const testSchema = z.object({
  title: z.string().min(2).max(120),
  className: z.string().min(1),
  subject: z.string().min(1),
  topic: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  instructions: z.string().max(1000).optional().default(''),
});

const announcementSchema = z.object({
  title: z.string().min(2).max(120),
  message: z.string().min(2).max(2000),
  audience: z.enum(['ALL', 'STUDENT', 'TEACHER', 'CLASS']),
  className: z.string().optional(),
  subject: z.string().optional(),
});

const timetableSchema = z.object({
  day: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  classLevel: z.string().min(1),
  subject: z.string().min(1),
  teacherId: z.string().optional(),
  batch: z.string().optional(),
  room: z.string().optional(),
});

const paymentOrderSchema = z.object({
  studentFeeId: z.string().min(1),
  amountPaise: z.number().int().positive(),
  idempotencyKey: z.string().min(16).max(120),
});

const paymentVerifySchema = z.object({
  paymentRecordId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

const feeStructureSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  className: z.string().min(1),
  totalAmountPaise: z.number().int().positive(),
});

const studentFeeSchema = z.object({
  studentId: z.string().min(1),
  feeStructureId: z.string().min(1),
});

const splitValues = (value: string | null | undefined) => (value || '').split(',').map((item) => item.trim()).filter(Boolean);

const getTeacherAssignments = async (teacherId: string) => prisma.teacherAssignment.findMany({ where: { teacherId }, orderBy: [{ className: 'asc' }, { subject: 'asc' }] });

const getStudentEnrollments = async (studentId: string) => prisma.studentEnrollment.findMany({ where: { studentId }, orderBy: [{ className: 'asc' }, { subject: 'asc' }] });

const notifyUsers = async (userIds: string[], type: string, title: string, message: string) => {
  if (!userIds.length) return;
  await prisma.notification.createMany({ data: [...new Set(userIds)].map((userId) => ({ userId, type, title, message })) });
};

const matchesAssignment = (assignments: Array<{ className: string; subject: string }>, className: string, subject: string) =>
  assignments.some((assignment) => assignment.className === className && assignment.subject.toLowerCase() === subject.toLowerCase());

const razorpayRequest = async (endpoint: string, method: string, body?: unknown) => {
  if (!config.paymentKeyId || !config.paymentKeySecret) throw new Error('Payment gateway is not configured.');
  const response = await fetch(`https://api.razorpay.com/v1${endpoint}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.paymentKeyId}:${config.paymentKeySecret}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await response.json() as Record<string, unknown>;
  if (!response.ok) throw new Error(String(payload.error || 'Payment gateway request failed.'));
  return payload;
};

const paymentSummary = (fee: { totalAmountPaise: number; paidAmountPaise: number }) => ({
  totalAmountPaise: fee.totalAmountPaise,
  paidAmountPaise: fee.paidAmountPaise,
  outstandingAmountPaise: Math.max(0, fee.totalAmountPaise - fee.paidAmountPaise),
  status: fee.paidAmountPaise >= fee.totalAmountPaise ? 'PAID' : fee.paidAmountPaise > 0 ? 'PARTIALLY_PAID' : 'OUTSTANDING',
});

const createReceipt = async (tx: any, paymentId: string) => {
  const payment = await tx.payment.findUnique({ where: { id: paymentId }, include: { student: { include: { user: true } }, studentFee: { include: { feeStructure: true } } } });
  if (!payment || payment.status !== 'SUCCESS') return null;
  return tx.paymentReceipt.upsert({
    where: { paymentId },
    update: {},
    create: {
      paymentId,
      receiptNumber: `MMA-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`,
      studentName: payment.student.user.fullName,
      studentIdentifier: payment.student.studentId,
      className: payment.student.className,
      amountPaise: payment.amountPaise,
      currency: payment.currency,
      feeDescription: payment.studentFee.feeStructure.description || payment.studentFee.feeStructure.name,
      status: payment.status,
    },
  });
};

const settleSuccessfulPayment = async (paymentId: string, gatewayPaymentId: string, gatewaySignature?: string) => prisma.$transaction(async (tx) => {
  const payment = await tx.payment.findUnique({ where: { id: paymentId }, include: { studentFee: true } });
  if (!payment) throw new Error('Payment record not found.');
  if (payment.status === 'SUCCESS') return payment;
  const outstanding = payment.studentFee.totalAmountPaise - payment.studentFee.paidAmountPaise;
  if (payment.amountPaise > outstanding) throw new Error('Payment exceeds the outstanding balance.');

  const updatedPayment = await tx.payment.update({ where: { id: payment.id }, data: { status: 'SUCCESS', gatewayPaymentId, gatewaySignature } });
  const paidAmountPaise = Math.min(payment.studentFee.totalAmountPaise, payment.studentFee.paidAmountPaise + payment.amountPaise);
  await tx.studentFee.update({ where: { id: payment.studentFeeId }, data: { paidAmountPaise, status: paidAmountPaise >= payment.studentFee.totalAmountPaise ? 'PAID' : 'PARTIALLY_PAID' } });
  await createReceipt(tx, payment.id);
  await tx.auditLog.create({ data: { userId: payment.createdById, userRole: 'STUDENT', action: 'PAYMENT_VERIFIED', targetType: 'Payment', targetId: payment.id, details: `Verified gateway payment ${gatewayPaymentId}` } });
  return updatedPayment;
});

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, message: 'MMA API is running', timestamp: new Date().toISOString() });
  } catch (_error) {
    res.status(500).json({ message: 'Database connection failed' });
  }
});

app.get('/api/academy', async (_req, res) => {
  const settings = await prisma.academySettings.findFirst();
  res.json({ data: settings || { siteName: 'Manish Mishra Academy', tagline: 'Learn Better. Think Smarter. Achieve More.' } });
});

app.get('/api/courses', async (_req, res) => {
  const courses = await prisma.course.findMany({ orderBy: { createdAt: 'asc' } });
  res.json({ data: courses });
});

app.get('/api/classes', async (_req, res) => {
  const classes = await prisma.course.findMany({ orderBy: { name: 'asc' } });
  res.json({ data: classes });
});

app.get('/api/timetable', async (_req, res) => {
  const timetable = await prisma.timetable.findMany({ orderBy: { day: 'asc' } });
  res.json({ data: timetable });
});

app.get('/api/facilities', async (_req, res) => {
  const facilities = await prisma.facility.findMany({ orderBy: { createdAt: 'asc' } });
  res.json({ data: facilities });
});

app.get('/api/testimonials', async (_req, res) => {
  const testimonials = await prisma.testimonial.findMany({ where: { isActive: true } });
  res.json({ data: testimonials });
});

app.post('/api/enquiries', async (req, res) => {
  const result = enquirySchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: 'Please fill in all required fields correctly.', errors: result.error.flatten().fieldErrors });
  }

  try {
    const enquiry = await prisma.enquiry.create({ data: result.data });
    res.status(201).json({ message: 'Thank you for contacting Manish Mishra Academy. Our team will get back to you soon.', data: enquiry });
  } catch (_error) {
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

app.post('/api/auth/login', rateLimitMiddleware, async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: 'Please provide a valid email and password.' });
  }

  const user = await prisma.user.findUnique({ where: { email: result.data.email } });
  if (!user || !user.isActive) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const passwordMatch = await bcrypt.compare(result.data.password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  if (!VALID_ROLES.includes(user.role)) {
    return res.status(403).json({ message: 'Account role is not recognized.' });
  }

  loginAttempts.delete(req.ip || 'unknown');
  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  setAuthCookie(res, token);

  const redirectMap = {
    HEAD: '/admin/dashboard',
    SUPERVISOR: '/admin/dashboard',
    TEACHER: '/teacher/dashboard',
    STUDENT: '/student/dashboard',
  } as const;

  res.json({
    user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, status: user.status },
    redirectTo: redirectMap[user.role as keyof typeof redirectMap] || '/',
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'mma_token=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax');
  res.json({ message: 'Logged out successfully.' });
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: (req as any).user.userId } });
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  res.json({ user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, status: user.status } });
});

app.get('/api/admin/dashboard', authMiddleware, requireRoles('HEAD', 'SUPERVISOR'), async (_req, res) => {
  const [students, teachers, enquiries, courses, resources] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.enquiry.count(),
    prisma.course.count(),
    prisma.resource.count(),
  ]);

  res.json({ data: { students, teachers, enquiries, courses, resources } });
});

app.get('/api/admin/students', authMiddleware, requireRoles('HEAD', 'SUPERVISOR'), async (req, res) => {
  if ((req as any).user.role === 'SUPERVISOR') {
    const hasPermission = await prisma.supervisorPermission.findFirst({
      where: { userId: (req as any).user.userId, permission: 'EDIT_STUDENT', isActive: true },
    });
    if (!hasPermission) {
      return res.status(403).json({ message: 'Supervisor does not have student management permission.' });
    }
  }

  const students = await prisma.student.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ data: students });
});

app.post('/api/admin/students', authMiddleware, requireRoles('HEAD', 'SUPERVISOR'), requirePermission('CREATE_STUDENT'), async (req, res) => {
  const result = studentSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: 'Invalid student details.', errors: result.error.flatten().fieldErrors });
  }

  const userExists = await prisma.user.findUnique({ where: { email: result.data.email } });
  if (userExists) {
    return res.status(409).json({ message: 'A user with this email already exists.' });
  }

  const passwordHash = await bcrypt.hash(result.data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: result.data.email,
      password: passwordHash,
      fullName: result.data.fullName,
      role: 'STUDENT',
      status: 'ACTIVE',
      isActive: true,
    },
  });

  const student = await prisma.student.create({
    data: {
      userId: user.id,
      className: result.data.className,
      batch: result.data.batch,
      subjects: result.data.subjects,
      guardianName: result.data.guardianName,
      guardianPhone: result.data.guardianPhone,
      accountStatus: 'ACTIVE',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: (req as any).user.userId,
      userRole: (req as any).user.role,
      action: 'CREATE_STUDENT',
      targetType: 'Student',
      targetId: student.id,
      details: `Created student ${result.data.fullName}`,
    },
  });

  res.status(201).json({ message: 'Student created successfully.', data: student });
});

app.get('/api/admin/teachers', authMiddleware, requireRoles('HEAD', 'SUPERVISOR'), async (req, res) => {
  if ((req as any).user.role === 'SUPERVISOR') {
    const hasPermission = await prisma.supervisorPermission.findFirst({
      where: { userId: (req as any).user.userId, permission: 'CREATE_TEACHER', isActive: true },
    });
    if (!hasPermission) {
      return res.status(403).json({ message: 'Supervisor does not have teacher management permission.' });
    }
  }

  const teachers = await prisma.teacher.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ data: teachers });
});

app.post('/api/admin/teachers', authMiddleware, requireRoles('HEAD', 'SUPERVISOR'), requirePermission('CREATE_TEACHER'), async (req, res) => {
  const result = teacherSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: 'Invalid teacher details.', errors: result.error.flatten().fieldErrors });
  }

  const userExists = await prisma.user.findUnique({ where: { email: result.data.email } });
  if (userExists) {
    return res.status(409).json({ message: 'A user with this email already exists.' });
  }

  const passwordHash = await bcrypt.hash(result.data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: result.data.email,
      password: passwordHash,
      fullName: result.data.fullName,
      role: 'TEACHER',
      status: 'ACTIVE',
      isActive: true,
    },
  });

  const teacher = await prisma.teacher.create({
    data: {
      userId: user.id,
      classes: result.data.classes,
      subjects: result.data.subjects,
      batches: result.data.batches,
      accountStatus: 'ACTIVE',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: (req as any).user.userId,
      userRole: (req as any).user.role,
      action: 'CREATE_TEACHER',
      targetType: 'Teacher',
      targetId: teacher.id,
      details: `Created teacher ${result.data.fullName}`,
    },
  });

  res.status(201).json({ message: 'Teacher created successfully.', data: teacher });
});

app.get('/api/teacher/dashboard', authMiddleware, requireRoles('TEACHER'), async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: (req as any).user.userId }, include: { teacher: true } });
  const assignments = user?.teacher ? await getTeacherAssignments(user.teacher.id) : [];
  const timetable = user?.teacher ? await prisma.timetable.findMany({ where: { teacherId: user.teacher.id }, take: 5, orderBy: { day: 'asc' } }) : [];
  const resources = user?.teacher ? await prisma.resource.findMany({ where: { teacherId: user.teacher.id }, take: 3, orderBy: { createdAt: 'desc' } }) : [];

  res.json({ data: { user, assignments, timetable, resources } });
});

app.get('/api/student/dashboard', authMiddleware, requireRoles('STUDENT'), async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: (req as any).user.userId }, include: { student: true } });
  const enrollments = user?.student ? await getStudentEnrollments(user.student.id) : [];
  const classNames = [...new Set(enrollments.map((item) => item.className))];
  const subjects = [...new Set(enrollments.map((item) => item.subject))];
  const feeStatus = await prisma.feeRecord.findFirst({ where: { studentName: user?.fullName || '' } });
  const announcements = await prisma.announcement.findMany({ where: { OR: [{ audience: 'ALL' }, { audience: 'STUDENT' }, ...classNames.map((className) => ({ audience: 'CLASS', className }))] }, take: 3, orderBy: { createdAt: 'desc' } });
  const tests = await prisma.testRecord.findMany({ where: { OR: classNames.flatMap((className) => subjects.map((subject) => ({ className, subject }))) }, take: 3, orderBy: { createdAt: 'desc' } });
  const notifications = user ? await prisma.notification.findMany({ where: { userId: user.id }, take: 5, orderBy: { createdAt: 'desc' } }) : [];
  const teachers = user?.student ? await prisma.teacherAssignment.findMany({ where: { className: { in: classNames }, subject: { in: subjects } }, include: { teacher: { include: { user: { select: { fullName: true } } } } }, distinct: ['teacherId'] }) : [];

  res.json({ data: { user, enrollments, assignedTeachers: teachers, feeStatus, announcements, tests, notifications } });
});

app.get('/api/student/fees', authMiddleware, requireRoles('STUDENT'), async (req, res) => {
  const student = await prisma.student.findUnique({ where: { userId: (req as any).user.userId } });
  if (!student) return res.status(404).json({ message: 'Student profile not found.' });
  const fees = await prisma.studentFee.findMany({ where: { studentId: student.id }, include: { feeStructure: true, payments: { include: { receipt: true }, orderBy: { createdAt: 'desc' } } }, orderBy: { createdAt: 'desc' } });
  res.json({ data: fees.map((fee) => ({ ...fee, summary: paymentSummary(fee), payments: fee.payments.map((payment) => ({ ...payment, receipt: payment.receipt ? { id: payment.receipt.id, receiptNumber: payment.receipt.receiptNumber, issuedAt: payment.receipt.issuedAt } : null })) })) });
});

app.post('/api/student/payments/order', authMiddleware, requireRoles('STUDENT'), async (req, res) => {
  const result = paymentOrderSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: 'Invalid payment amount.' });
  const student = await prisma.student.findUnique({ where: { userId: (req as any).user.userId } });
  if (!student) return res.status(404).json({ message: 'Student profile not found.' });
  const fee = await prisma.studentFee.findFirst({ where: { id: result.data.studentFeeId, studentId: student.id }, include: { feeStructure: true } });
  if (!fee) return res.status(404).json({ message: 'Fee record not found.' });
  const outstanding = Math.max(0, fee.totalAmountPaise - fee.paidAmountPaise);
  if (!outstanding || result.data.amountPaise > outstanding) return res.status(400).json({ message: 'Payment amount exceeds the outstanding balance.' });

  const existingPayment = await prisma.payment.findUnique({ where: { idempotencyKey: result.data.idempotencyKey } });
  if (existingPayment) {
    if (existingPayment.studentId !== student.id || existingPayment.studentFeeId !== fee.id || existingPayment.amountPaise !== result.data.amountPaise) return res.status(409).json({ message: 'Idempotency key is already associated with another payment attempt.' });
    return res.status(200).json({ data: { paymentRecordId: existingPayment.id, orderId: existingPayment.gatewayOrderId, amountPaise: existingPayment.amountPaise, currency: existingPayment.currency, keyId: config.paymentKeyId || null, sandbox: config.paymentSandbox } });
  }
  const idempotencyKey = result.data.idempotencyKey;
  const gatewayOrder = config.paymentKeyId && config.paymentKeySecret ? await razorpayRequest('/orders', 'POST', { amount: result.data.amountPaise, currency: 'INR', receipt: idempotencyKey, notes: { studentFeeId: fee.id, sandbox: config.paymentSandbox } }) : { id: `sandbox_order_${randomUUID()}` };
  const payment = await prisma.payment.create({ data: { studentId: student.id, studentFeeId: fee.id, amountPaise: result.data.amountPaise, feeType: fee.feeStructure.name, gatewayOrderId: String(gatewayOrder.id), idempotencyKey, createdById: (req as any).user.userId, isSandbox: config.paymentSandbox, metadataJson: JSON.stringify({ gatewayOrder }) } });
  res.status(201).json({ data: { paymentRecordId: payment.id, orderId: payment.gatewayOrderId, amountPaise: payment.amountPaise, currency: payment.currency, keyId: config.paymentKeyId || null, sandbox: config.paymentSandbox } });
});

app.post('/api/student/payments/verify', authMiddleware, requireRoles('STUDENT'), async (req, res) => {
  const result = paymentVerifySchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: 'Invalid payment verification details.' });
  const payment = await prisma.payment.findFirst({ where: { id: result.data.paymentRecordId, student: { userId: (req as any).user.userId }, gatewayOrderId: result.data.razorpayOrderId } });
  if (!payment) return res.status(404).json({ message: 'Payment attempt not found.' });
  const expectedSignature = createHmac('sha256', config.paymentKeySecret || 'development-payment-secret').update(`${result.data.razorpayOrderId}|${result.data.razorpayPaymentId}`).digest('hex');
  if (expectedSignature !== result.data.razorpaySignature) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED', failureReason: 'Invalid gateway signature' } });
    return res.status(400).json({ message: 'Payment could not be verified.' });
  }
  const settled = await settleSuccessfulPayment(payment.id, result.data.razorpayPaymentId, result.data.razorpaySignature);
  res.json({ message: 'Payment verified successfully.', data: settled });
});

app.post('/api/payments/webhook', async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = (req as any).rawBody as Buffer | undefined;
  if (!config.paymentWebhookSecret || !signature || !rawBody) return res.status(400).json({ message: 'Invalid webhook request.' });
  const expectedSignature = createHmac('sha256', config.paymentWebhookSecret).update(rawBody).digest('hex');
  if (expectedSignature !== signature) return res.status(400).json({ message: 'Invalid webhook signature.' });
  const event = req.body as { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string; error_description?: string } } } };
  const entity = event.payload?.payment?.entity;
  if (!entity?.order_id) return res.json({ received: true });
  const payment = await prisma.payment.findUnique({ where: { gatewayOrderId: entity.order_id } });
  if (!payment) return res.json({ received: true });
  if (event.event === 'payment.captured' && entity.id) await settleSuccessfulPayment(payment.id, entity.id);
  if (event.event === 'payment.failed' && payment.status !== 'SUCCESS') await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED', failureReason: entity.error_description || 'Gateway payment failed.' } });
  res.json({ received: true });
});

app.get('/api/student/receipts/:id', authMiddleware, requireRoles('STUDENT'), async (req, res) => {
  const receipt = await prisma.paymentReceipt.findFirst({ where: { id: String(req.params.id), payment: { student: { userId: (req as any).user.userId } } }, include: { payment: { include: { studentFee: { include: { feeStructure: true } } } } } });
  if (!receipt) return res.status(404).json({ message: 'Receipt not found.' });
  res.json({ data: receipt });
});

app.get('/api/student/receipts/:id/download', authMiddleware, requireRoles('STUDENT'), async (req, res) => {
  const receipt = await prisma.paymentReceipt.findFirst({ where: { id: String(req.params.id), payment: { student: { userId: (req as any).user.userId } } }, include: { payment: { include: { studentFee: { include: { feeStructure: true } } } } } });
  if (!receipt) return res.status(404).json({ message: 'Receipt not found.' });
  const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character] || character));
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>MMA Receipt ${escapeHtml(receipt.receiptNumber)}</title><style>body{font-family:Arial,sans-serif;max-width:720px;margin:40px auto;color:#172033}h1{color:#0369a1}.row{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding:12px 0}.muted{color:#64748b}</style></head><body><h1>MANISH MISHRA ACADEMY (MMA)</h1><p class="muted">Payment receipt</p><div class="row"><strong>Student</strong><span>${escapeHtml(receipt.studentName)}</span></div><div class="row"><strong>Student ID</strong><span>${escapeHtml(receipt.studentIdentifier)}</span></div><div class="row"><strong>Class</strong><span>${escapeHtml(receipt.className || 'Not specified')}</span></div><div class="row"><strong>Receipt</strong><span>${escapeHtml(receipt.receiptNumber)}</span></div><div class="row"><strong>Payment status</strong><span>${escapeHtml(receipt.status)}</span></div><div class="row"><strong>Amount</strong><span>${escapeHtml(receipt.currency)} ${(receipt.amountPaise / 100).toFixed(2)}</span></div><div class="row"><strong>Fee description</strong><span>${escapeHtml(receipt.feeDescription)}</span></div><div class="row"><strong>Issued</strong><span>${escapeHtml(receipt.issuedAt.toISOString())}</span></div></body></html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${receipt.receiptNumber}.html"`);
  res.send(html);
});

app.get('/api/admin/fees', authMiddleware, requireRoles('HEAD', 'SUPERVISOR'), async (req, res) => {
  const permission = (req as any).user.role === 'HEAD' ? true : await prisma.supervisorPermission.findFirst({ where: { userId: (req as any).user.userId, permission: 'VIEW_PAYMENTS', isActive: true } });
  if (!permission) return res.status(403).json({ message: 'Supervisor payment permission missing.' });
  const fees = await prisma.studentFee.findMany({ include: { student: { include: { user: true } }, feeStructure: true }, orderBy: { updatedAt: 'desc' } });
  res.json({ data: fees.map((fee) => ({ ...fee, summary: paymentSummary(fee) })) });
});

app.get('/api/admin/fee-structures', authMiddleware, requireRoles('HEAD', 'SUPERVISOR'), requirePermission('MANAGE_PAYMENTS'), async (_req, res) => {
  res.json({ data: await prisma.feeStructure.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } }) });
});

app.post('/api/admin/fee-structures', authMiddleware, requireRoles('HEAD', 'SUPERVISOR'), requirePermission('MANAGE_PAYMENTS'), async (req, res) => {
  const result = feeStructureSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: 'Invalid fee structure.' });
  const structure = await prisma.feeStructure.create({ data: { ...result.data, createdById: (req as any).user.userId } });
  res.status(201).json({ data: structure });
});

app.post('/api/admin/student-fees', authMiddleware, requireRoles('HEAD', 'SUPERVISOR'), requirePermission('MANAGE_PAYMENTS'), async (req, res) => {
  const result = studentFeeSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: 'Invalid student fee assignment.' });
  const [student, structure] = await Promise.all([prisma.student.findUnique({ where: { id: result.data.studentId } }), prisma.feeStructure.findUnique({ where: { id: result.data.feeStructureId } })]);
  if (!student || !structure) return res.status(404).json({ message: 'Student or fee structure not found.' });
  const fee = await prisma.studentFee.upsert({ where: { studentId_feeStructureId: result.data }, update: { totalAmountPaise: structure.totalAmountPaise }, create: { studentId: student.id, feeStructureId: structure.id, totalAmountPaise: structure.totalAmountPaise } });
  res.status(201).json({ data: fee });
});

app.get('/api/admin/payments', authMiddleware, requireRoles('HEAD', 'SUPERVISOR'), async (req, res) => {
  const permission = (req as any).user.role === 'HEAD' ? true : await prisma.supervisorPermission.findFirst({ where: { userId: (req as any).user.userId, permission: 'VIEW_PAYMENTS', isActive: true } });
  if (!permission) return res.status(403).json({ message: 'Supervisor payment permission missing.' });
  const search = String(req.query.search || '').trim();
  const className = String(req.query.className || '').trim();
  const from = String(req.query.from || '').trim();
  const to = String(req.query.to || '').trim();
  const payments = await prisma.payment.findMany({ where: { AND: [ ...(req.query.status ? [{ status: String(req.query.status) }] : []), ...(req.query.paymentId ? [{ gatewayPaymentId: String(req.query.paymentId) }] : []), ...(search ? [{ student: { OR: [{ studentId: { contains: search } }, { user: { fullName: { contains: search } } }] } }] : []), ...(className ? [{ student: { className } }] : []), ...(from || to ? [{ createdAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}) } }] : []) ] }, include: { student: { include: { user: true } }, receipt: true }, orderBy: { createdAt: 'desc' } });
  const totals = payments.reduce((result, payment) => { result[payment.status] = (result[payment.status] || 0) + payment.amountPaise; return result; }, {} as Record<string, number>);
  res.json({ data: payments, totals });
});

app.get('/api/teacher/assignments', authMiddleware, requireRoles('TEACHER'), async (req, res) => {
  const teacher = await prisma.teacher.findUnique({ where: { userId: (req as any).user.userId } });
  if (!teacher) return res.status(404).json({ message: 'Teacher profile not found.' });
  res.json({ data: await getTeacherAssignments(teacher.id) });
});

app.get('/api/student/resources', authMiddleware, requireRoles('STUDENT'), async (req, res) => {
  const student = await prisma.student.findUnique({ where: { userId: (req as any).user.userId } });
  if (!student) return res.status(404).json({ message: 'Student profile not found.' });
  const enrollments = await getStudentEnrollments(student.id);
  const search = String(req.query.search || '').trim();
  const className = String(req.query.className || '').trim();
  const subject = String(req.query.subject || '').trim();
  const type = String(req.query.type || '').trim();
  const teacherId = String(req.query.teacherId || '').trim();
  if (!enrollments.length) return res.json({ data: [], filters: { classes: [], subjects: [], types: RESOURCE_TYPES } });
  const resources = await prisma.resource.findMany({
    where: {
      AND: [
        { OR: enrollments.map((enrollment) => ({ className: enrollment.className, subject: enrollment.subject })) },
        ...(className ? [{ className }] : []),
        ...(subject ? [{ subject }] : []),
        ...(type ? [{ type }] : []),
        ...(teacherId ? [{ teacherId }] : []),
        ...(search ? [{ OR: [{ title: { contains: search } }, { description: { contains: search } }, { topic: { contains: search } }] }] : []),
      ],
    },
    include: { teacher: { include: { user: { select: { fullName: true } } } } },
    orderBy: { createdAt: String(req.query.order || '') === 'oldest' ? 'asc' : 'desc' },
  });
  res.json({ data: resources, filters: { classes: [...new Set(enrollments.map((item) => item.className))], subjects: [...new Set(enrollments.map((item) => item.subject))], types: RESOURCE_TYPES } });
});

app.get('/api/student/teachers', authMiddleware, requireRoles('STUDENT'), async (req, res) => {
  const student = await prisma.student.findUnique({ where: { userId: (req as any).user.userId } });
  const enrollments = student ? await getStudentEnrollments(student.id) : [];
  const teachers = await prisma.teacherAssignment.findMany({ where: { OR: enrollments.map((item) => ({ className: item.className, subject: item.subject })) }, include: { teacher: { include: { user: { select: { fullName: true, email: true } } } } } });
  res.json({ data: teachers });
});

app.get('/api/teacher/resources', authMiddleware, requireRoles('TEACHER'), async (req, res) => {
  const teacher = await prisma.teacher.findUnique({ where: { userId: (req as any).user.userId } });
  if (!teacher) return res.status(404).json({ message: 'Teacher profile not found.' });
  const search = String(req.query.search || '').trim();
  const resources = await prisma.resource.findMany({
    where: { teacherId: teacher.id, ...(search ? { OR: [{ title: { contains: search } }, { topic: { contains: search } }] } : {}) },
    include: { teacher: { include: { user: { select: { fullName: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ data: resources, assignments: await getTeacherAssignments(teacher.id), types: RESOURCE_TYPES });
});

app.post('/api/teacher/resources', authMiddleware, requireRoles('TEACHER'), async (req, res) => {
  const result = resourceSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: 'Invalid resource details.', errors: result.error.flatten().fieldErrors });

  const teacher = await prisma.teacher.findUnique({ where: { userId: (req as any).user.userId } });
  if (!teacher) return res.status(404).json({ message: 'Teacher profile not found.' });
  const assignments = await getTeacherAssignments(teacher.id);
  if (!matchesAssignment(assignments, result.data.className, result.data.subject)) {
    return res.status(403).json({ message: 'You may only publish resources to your assigned class and subject.' });
  }

  const extension = path.extname(result.data.fileName).toLowerCase();
  const allowedExtensions = ALLOWED_FILES[result.data.mimeType];
  if (!allowedExtensions || !allowedExtensions.includes(extension)) return res.status(400).json({ message: 'Unsupported or unsafe file type.' });
  let fileBuffer: Buffer;
  try { fileBuffer = Buffer.from(result.data.fileData.replace(/^data:[^;]+;base64,/, ''), 'base64'); } catch (_error) { return res.status(400).json({ message: 'Invalid file data.' }); }
  if (!fileBuffer.length || fileBuffer.length > MAX_FILE_SIZE) return res.status(400).json({ message: 'File must be between 1 byte and 10 MB.' });

  await mkdir(PRIVATE_UPLOAD_DIR, { recursive: true });
  const storedFileName = `${randomUUID()}${extension}`;
  await writeFile(path.join(PRIVATE_UPLOAD_DIR, storedFileName), fileBuffer, { flag: 'wx' });
  const resource = await prisma.resource.create({ data: { title: result.data.title, description: result.data.description, className: result.data.className, subject: result.data.subject, topic: result.data.topic, type: result.data.type, fileName: result.data.fileName, storedFileName, mimeType: result.data.mimeType, fileSize: fileBuffer.length, teacherId: teacher.id, createdById: (req as any).user.userId } });

  const students = await prisma.student.findMany({ where: { enrollments: { some: { className: result.data.className, subject: result.data.subject } } }, select: { userId: true } });
  await notifyUsers(students.map((student) => student.userId), 'NEW_RESOURCE', 'New study resource', `${result.data.title} is available for ${result.data.className} ${result.data.subject}.`);
  res.status(201).json({ message: 'Resource published successfully.', data: resource });
});

app.get('/api/resources/:id/download', authMiddleware, async (req, res) => {
  const resource = await prisma.resource.findUnique({ where: { id: String(req.params.id) }, include: { teacher: true } });
  if (!resource) return res.status(404).json({ message: 'Resource not found.' });
  const user = (req as any).user;
  let allowed = user.role === 'HEAD' || user.role === 'SUPERVISOR' || (user.role === 'TEACHER' && resource.teacher.userId === user.userId);
  if (user.role === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { userId: user.userId } });
    const enrollment = student && await prisma.studentEnrollment.findFirst({ where: { studentId: student.id, className: resource.className, subject: resource.subject } });
    allowed = Boolean(enrollment);
  }
  if (!allowed) return res.status(403).json({ message: 'You are not authorized to download this resource.' });
  res.download(path.join(PRIVATE_UPLOAD_DIR, resource.storedFileName), resource.fileName);
});

app.get('/api/teacher/timetable', authMiddleware, requireRoles('TEACHER'), async (req, res) => {
  const teacher = await prisma.teacher.findUnique({ where: { userId: (req as any).user.userId } });
  res.json({ data: teacher ? await prisma.timetable.findMany({ where: { teacherId: teacher.id }, orderBy: { day: 'asc' } }) : [] });
});

app.get('/api/student/timetable', authMiddleware, requireRoles('STUDENT'), async (req, res) => {
  const student = await prisma.student.findUnique({ where: { userId: (req as any).user.userId } });
  const enrollments = student ? await getStudentEnrollments(student.id) : [];
  if (!enrollments.length) return res.json({ data: [] });
  res.json({ data: await prisma.timetable.findMany({ where: { OR: enrollments.map((item) => ({ classLevel: item.className, subject: item.subject })) }, orderBy: { day: 'asc' } }) });
});

app.get('/api/student/notifications', authMiddleware, requireRoles('STUDENT', 'TEACHER'), async (req, res) => {
  res.json({ data: await prisma.notification.findMany({ where: { userId: (req as any).user.userId }, orderBy: { createdAt: 'desc' }, take: 50 }) });
});

app.post('/api/admin/announcements', authMiddleware, requireRoles('HEAD', 'SUPERVISOR'), async (req, res) => {
  const result = announcementSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: 'Invalid announcement details.' });
  const announcement = await prisma.announcement.create({ data: { ...result.data, createdById: (req as any).user.userId } });
  const users = await prisma.user.findMany({ where: result.data.audience === 'TEACHER' ? { role: 'TEACHER' } : { role: 'STUDENT' }, select: { id: true } });
  await notifyUsers(users.map((user) => user.id), 'ANNOUNCEMENT', result.data.title, result.data.message);
  res.status(201).json({ data: announcement });
});

app.post('/api/teacher/announcements', authMiddleware, requireRoles('TEACHER'), async (req, res) => {
  const result = announcementSchema.safeParse({ ...req.body, audience: 'CLASS' });
  if (!result.success || !result.data.className || !result.data.subject) return res.status(400).json({ message: 'Class and subject are required for teacher announcements.' });
  const teacher = await prisma.teacher.findUnique({ where: { userId: (req as any).user.userId } });
  if (!teacher || !matchesAssignment(await getTeacherAssignments(teacher.id), result.data.className, result.data.subject)) return res.status(403).json({ message: 'You may only announce to your assigned class and subject.' });
  const announcement = await prisma.announcement.create({ data: { ...result.data, createdById: (req as any).user.userId } });
  const students = await prisma.student.findMany({ where: { enrollments: { some: { className: result.data.className, subject: result.data.subject } } }, select: { userId: true } });
  await notifyUsers(students.map((student) => student.userId), 'ANNOUNCEMENT', result.data.title, result.data.message);
  res.status(201).json({ data: announcement });
});

app.post('/api/admin/timetable', authMiddleware, requireRoles('HEAD', 'SUPERVISOR'), requirePermission('MANAGE_TIMETABLE'), async (req, res) => {
  const result = timetableSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: 'Invalid timetable details.' });
  const timetable = await prisma.timetable.create({ data: result.data });
  const students = await prisma.student.findMany({ where: { enrollments: { some: { className: result.data.classLevel, subject: result.data.subject } } }, select: { userId: true } });
  await notifyUsers(students.map((student) => student.userId), 'TIMETABLE_CHANGE', 'Timetable updated', `${result.data.classLevel} ${result.data.subject} has a timetable update.`);
  res.status(201).json({ data: timetable });
});

app.get('/api/admin/tests', authMiddleware, requireRoles('HEAD', 'SUPERVISOR'), async (_req, res) => {
  res.json({ data: await prisma.testRecord.findMany({ orderBy: { date: 'asc' } }) });
});

app.get('/api/teacher/tests', authMiddleware, requireRoles('TEACHER'), async (req, res) => {
  const teacher = await prisma.teacher.findUnique({ where: { userId: (req as any).user.userId } });
  res.json({ data: teacher ? await prisma.testRecord.findMany({ where: { teacherId: teacher.id }, orderBy: { date: 'asc' } }) : [] });
});

app.post('/api/teacher/tests', authMiddleware, requireRoles('TEACHER'), async (req, res) => {
  const result = testSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: 'Invalid test details.' });
  const teacher = await prisma.teacher.findUnique({ where: { userId: (req as any).user.userId } });
  if (!teacher || !matchesAssignment(await getTeacherAssignments(teacher.id), result.data.className, result.data.subject)) return res.status(403).json({ message: 'You may only create tests for assigned classes and subjects.' });
  const test = await prisma.testRecord.create({ data: { ...result.data, teacherId: teacher.id, createdById: (req as any).user.userId } });
  const students = await prisma.student.findMany({ where: { enrollments: { some: { className: result.data.className, subject: result.data.subject } } }, select: { userId: true } });
  await notifyUsers(students.map((student) => student.userId), 'TEST_ANNOUNCEMENT', 'New test announced', `${result.data.title} is scheduled for ${result.data.date}.`);
  res.status(201).json({ data: test });
});

app.get('/api/student/tests', authMiddleware, requireRoles('STUDENT'), async (req, res) => {
  const student = await prisma.student.findUnique({ where: { userId: (req as any).user.userId } });
  const enrollments = student ? await getStudentEnrollments(student.id) : [];
  if (!enrollments.length) return res.json({ data: [] });
  res.json({ data: await prisma.testRecord.findMany({ where: { OR: enrollments.map((item) => ({ className: item.className, subject: item.subject })) }, orderBy: { date: 'asc' } }) });
});

app.get('/api/admin/audit-log', authMiddleware, requireRoles('HEAD', 'SUPERVISOR'), async (_req, res) => {
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });
  res.json({ data: logs });
});

app.get('/api/admin/permissions', authMiddleware, requireRoles('HEAD'), async (_req, res) => {
  res.json({ data: VALID_PERMISSIONS });
});

app.post('/api/admin/permissions/:userId', authMiddleware, requireRoles('HEAD'), async (req, res) => {
  const { permission, isActive } = req.body as { permission?: string; isActive?: boolean };
  if (!permission || !VALID_PERMISSIONS.includes(permission)) {
    return res.status(400).json({ message: 'Invalid permission.' });
  }

  const targetUser = await prisma.user.findUnique({ where: { id: String(req.params.userId) } });
  if (!targetUser || targetUser.role !== 'SUPERVISOR') {
    return res.status(400).json({ message: 'Permission can only be managed for supervisor accounts.' });
  }

  const existingPermission = await prisma.supervisorPermission.findFirst({
    where: { userId: targetUser.id, permission },
  });

  if (existingPermission) {
    const updatedPermission = await prisma.supervisorPermission.update({
      where: { id: existingPermission.id },
      data: { isActive: Boolean(isActive), grantedBy: (req as any).user.userId },
    });
    return res.json({ message: 'Supervisor permission updated.', data: updatedPermission });
  }

  const createdPermission = await prisma.supervisorPermission.create({
    data: {
      userId: targetUser.id,
      permission,
      grantedBy: (req as any).user.userId,
      isActive: Boolean(isActive),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: (req as any).user.userId,
      userRole: (req as any).user.role,
      action: 'PERMISSION_CHANGE',
      targetType: 'SupervisorPermission',
      targetId: createdPermission.id,
      details: `Updated ${permission} for ${targetUser.fullName}`,
    },
  });

  res.status(201).json({ message: 'Supervisor permission created.', data: createdPermission });
});

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(config.port, () => {
  console.log(`MMA server running on http://localhost:${config.port}`);
});
