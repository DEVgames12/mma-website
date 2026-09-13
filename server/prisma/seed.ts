import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('Mma@2026', 10);

  await prisma.user.upsert({
    where: { email: 'admin@mmacademy.com' },
    update: {},
    create: {
      email: 'admin@mmacademy.com',
      password: adminPassword,
      fullName: 'MMA Admin',
      role: 'ADMIN',
    },
  });

  await prisma.academySettings.upsert({
    where: { id: 'academy-settings' },
    update: {},
    create: {
      id: 'academy-settings',
      siteName: 'Manish Mishra Academy',
      tagline: 'Learn Better. Think Smarter. Achieve More.',
      description: 'Placeholder academy details: update in admin dashboard when official information is available.',
      phone: '+91 00000 00000',
      email: 'info@mmacademy.com',
      address: 'Add academy address here',
      whatsapp: '+910000000000',
    },
  });

  const courses = [
    { name: 'Class 7', slug: 'class-7', category: 'Classes 7-10', classLevel: 'Class 7', subjects: 'Mathematics, Science, English, Social Science, Hindi', highlights: 'Concept building, Practice, Homework, Regular tests, Doubt solving, Faculty guidance' },
    { name: 'Class 8', slug: 'class-8', category: 'Classes 7-10', classLevel: 'Class 8', subjects: 'Mathematics, Science, English, Social Science, Hindi', highlights: 'Concept building, Practice, Homework, Regular tests, Doubt solving, Faculty guidance' },
    { name: 'Class 9', slug: 'class-9', category: 'Classes 7-10', classLevel: 'Class 9', subjects: 'Mathematics, Science, English, Social Science, Hindi', highlights: 'Concept building, Practice, Homework, Regular tests, Doubt solving, Faculty guidance' },
    { name: 'Class 10', slug: 'class-10', category: 'Classes 7-10', classLevel: 'Class 10', subjects: 'Mathematics, Science, English, Social Science, Hindi', highlights: 'Concept building, Practice, Homework, Regular tests, Doubt solving, Faculty guidance' },
    { name: 'Physics', slug: 'physics', category: 'Classes 11-12', classLevel: 'Class 11 / Class 12', subjects: 'Physics', highlights: 'Conceptual understanding, Numerical problem solving, Doubt support, Regular practice' },
    { name: 'Chemistry', slug: 'chemistry', category: 'Classes 11-12', classLevel: 'Class 11 / Class 12', subjects: 'Chemistry', highlights: 'Concepts, reactions, problem solving, regular practice, doubt support' },
    { name: 'Mathematics', slug: 'mathematics', category: 'Classes 11-12', classLevel: 'Class 11 / Class 12', subjects: 'Mathematics', highlights: 'Concept building, problem solving, regular practice, faculty guidance' },
  ];

  for (const course of courses) {
    await prisma.course.upsert({
      where: { slug: course.slug },
      update: {},
      create: {
        ...course,
        description: `Placeholder course description for ${course.name}. Replace with official academy details when available.`,
      },
    });
  }

  const batches = [
    { name: 'Batch A', label: '4:00 PM - 5:00 PM', startTime: '16:00', endTime: '17:00' },
    { name: 'Batch B', label: '5:00 PM - 6:00 PM', startTime: '17:00', endTime: '18:00' },
    { name: 'Batch C', label: '6:00 PM - 7:00 PM', startTime: '18:00', endTime: '19:00' },
  ];

  for (const batch of batches) {
    await prisma.batch.upsert({
      where: { id: batch.name },
      update: {},
      create: {
        id: batch.name,
        ...batch,
      },
    });
  }

  const facilities = [
    { title: 'Smart Classroom', description: 'Modern interactive classroom setup and teaching support.', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80' },
    { title: 'AC Classroom', description: 'Comfortable classroom environment that supports focus and learning.', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80' },
    { title: 'Library', description: 'Reading and revision area for independent study and academic support.', image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80' },
    { title: 'Fibre Internet', description: 'High-speed fibre connectivity for educational online study during free time.', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80' },
    { title: 'Quiet Study Environment', description: 'A peaceful and disciplined environment for concentration.', image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80' },
    { title: 'Learning Resources', description: 'Study materials and learning support for concept building and revision.', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80' },
  ];

  for (const facility of facilities) {
    await prisma.facility.create({ data: facility });
  }

  for (const testimonial of [
    { name: 'Demo Parent', role: 'Parent', quote: 'A welcoming environment with strong focus on concept clarity and discipline.', isActive: true },
    { name: 'Demo Student', role: 'Student', quote: 'The academy creates a calm study atmosphere and helps us understand difficult topics better.', isActive: true },
  ]) {
    await prisma.testimonial.upsert({
      where: { id: testimonial.name },
      update: {},
      create: {
        id: testimonial.name,
        ...testimonial,
      },
    });
  }

  for (const timetable of [
    { day: 'Monday', classLevel: 'Class 7', subject: 'Placeholder subject', teacher: 'Placeholder teacher', batch: 'Batch A', room: 'Room 1', startTime: '16:00', endTime: '17:00' },
    { day: 'Tuesday', classLevel: 'Class 8', subject: 'Placeholder subject', teacher: 'Placeholder teacher', batch: 'Batch B', room: 'Room 2', startTime: '17:00', endTime: '18:00' },
    { day: 'Wednesday', classLevel: 'Class 9', subject: 'Placeholder subject', teacher: 'Placeholder teacher', batch: 'Batch C', room: 'Room 3', startTime: '18:00', endTime: '19:00' },
  ]) {
    await prisma.timetable.create({ data: timetable });
  }

  console.log('Seed completed');
}

main()
  .catch((error) => {
    console.error('Seed error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
