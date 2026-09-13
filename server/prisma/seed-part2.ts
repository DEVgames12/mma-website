import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const headPassword = await bcrypt.hash('DevHead@123', 10);
  const supervisorPassword = await bcrypt.hash('DevSupervisor@123', 10);
  const teacherPassword = await bcrypt.hash('DevTeacher@123', 10);
  const studentPassword = await bcrypt.hash('DevStudent@123', 10);

  const headUser = await prisma.user.upsert({
    where: { email: 'head.dev@mmacademy.local' },
    update: {},
    create: {
      email: 'head.dev@mmacademy.local',
      fullName: 'Manish Mishra',
      password: headPassword,
      role: 'HEAD',
      status: 'ACTIVE',
      isActive: true,
    },
  });

  const supervisorUser = await prisma.user.upsert({
    where: { email: 'supervisor.dev@mmacademy.local' },
    update: {},
    create: {
      email: 'supervisor.dev@mmacademy.local',
      fullName: 'Development Supervisor',
      password: supervisorPassword,
      role: 'SUPERVISOR',
      status: 'ACTIVE',
      isActive: true,
      createdBy: headUser.id,
    },
  });

  for (const permission of [
    'CREATE_STUDENT',
    'EDIT_STUDENT',
    'CREATE_TEACHER',
    'EDIT_TEACHER',
    'MANAGE_CLASSES',
    'MANAGE_TIMETABLE',
    'MANAGE_RESOURCES',
    'MANAGE_TESTS',
    'MANAGE_ANNOUNCEMENTS',
    'MANAGE_SETTINGS',
  ]) {
    await prisma.supervisorPermission.upsert({
      where: { userId_permission: { userId: supervisorUser.id, permission } },
      update: { isActive: true },
      create: { userId: supervisorUser.id, permission, grantedBy: headUser.id, isActive: true },
    });
  }

  await prisma.supervisorPermission.deleteMany({
    where: { userId: supervisorUser.id, permission: { in: ['VIEW_PAYMENTS', 'MANAGE_PAYMENTS'] } },
  });

  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher.dev@mmacademy.local' },
    update: {},
    create: {
      email: 'teacher.dev@mmacademy.local',
      fullName: 'Development Teacher',
      password: teacherPassword,
      role: 'TEACHER',
      status: 'ACTIVE',
      isActive: true,
      createdBy: headUser.id,
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: 'student.dev@mmacademy.local' },
    update: {},
    create: {
      email: 'student.dev@mmacademy.local',
      fullName: 'Development Student',
      password: studentPassword,
      role: 'STUDENT',
      status: 'ACTIVE',
      isActive: true,
      createdBy: headUser.id,
    },
  });

  await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      teacherId: 'teacher-dev-001',
      classes: 'Class 9, Class 10',
      subjects: 'Mathematics, Physics',
      batches: 'Batch A, Batch B',
      accountStatus: 'ACTIVE',
    },
  });

  await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      studentId: 'student-dev-001',
      className: 'Class 9',
      batch: 'Batch A',
      subjects: 'Mathematics, Science',
      guardianName: 'Development Guardian',
      guardianPhone: '9999999999',
      accountStatus: 'ACTIVE',
    },
  });

  const seededTeacher = await prisma.teacher.findUnique({ where: { userId: teacherUser.id } });
  const seededStudent = await prisma.student.findUnique({ where: { userId: studentUser.id } });
  if (seededTeacher && seededStudent) {
    await prisma.teacherAssignment.deleteMany({ where: { teacherId: seededTeacher.id } });
    for (const assignment of [
      { className: 'Class 9', subject: 'Mathematics', batch: 'Batch A' },
      { className: 'Class 10', subject: 'Mathematics', batch: 'Batch A' },
    ]) {
      await prisma.teacherAssignment.create({ data: { teacherId: seededTeacher.id, ...assignment } });
    }
    await prisma.studentEnrollment.upsert({
      where: { studentId_className_subject_batch: { studentId: seededStudent.id, className: 'Class 9', subject: 'Mathematics', batch: 'Batch A' } },
      update: {},
      create: { studentId: seededStudent.id, className: 'Class 9', subject: 'Mathematics', batch: 'Batch A' },
    });
  }

  await prisma.announcement.createMany({
    data: [
      { title: 'Development Mode Enabled', message: 'These are development-only accounts for testing the MMA role system.', audience: 'ALL' },
      { title: 'Upcoming test', message: 'A class test has been scheduled for next week.', audience: 'STUDENT' },
    ],
  });

  await prisma.testRecord.createMany({
    data: [
      { title: 'Unit test - Mathematics', className: 'Class 9', subject: 'Mathematics', topic: 'Number systems', date: '2026-09-20', time: '10:00', status: 'UPCOMING' },
      { title: 'Mock test - Physics', className: 'Class 11', subject: 'Physics', topic: 'Motion', date: '2026-09-25', time: '10:00', status: 'UPCOMING' },
    ],
  });

  await prisma.feeRecord.createMany({
    data: [
      { studentId: 'student-dev-001', studentName: 'Development Student', amount: '₹2500', dueDate: '2026-09-30', status: 'PENDING', paymentStatus: 'NOT_PAID' },
    ],
  });

  console.log('Development role seed completed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
