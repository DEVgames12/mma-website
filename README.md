# Manish Mishra Academy (MMA)

Full-stack coaching academy website with public content, role-based portals, academic resources, fee management, and Razorpay-ready sandbox payments.

## Requirements

- Node.js 20 LTS or newer
- npm 10 or newer

## Technology

- Frontend: React, Vite, TypeScript, Tailwind CSS, React Router
- Backend: Node.js, Express, TypeScript, Zod
- Database: SQLite with Prisma ORM
- Authentication: JWT in HTTP-only cookie, backend role and permission checks
- Payments: Razorpay REST API and signed webhook verification

## Installation

```bash
npm install
npm --prefix client install
npm --prefix server install
copy .env.example .env
```

Never commit `.env`, payment secrets, private uploads, or local database files.

## Environment

Set these values in the root `.env`:

```env
PORT=4000
CLIENT_URL=http://localhost:5173
DATABASE_URL="file:./dev.db"
JWT_SECRET=use-a-long-random-secret
ADMIN_EMAIL=replace-with-admin-email
ADMIN_PASSWORD=replace-with-admin-password
PAYMENT_KEY_ID=
PAYMENT_KEY_SECRET=
PAYMENT_WEBHOOK_SECRET=
PAYMENT_SANDBOX=true
```

Payment secrets are read only by the server and are never sent to the frontend.

## Database

```bash
npm run db:generate
npm run db:push
npm run db:seed
npm --prefix server exec tsx -- prisma/seed-part2.ts
```

For a clean local development database only:

```bash
npm --prefix server exec prisma db push -- --force-reset
npm run db:seed
npm --prefix server exec tsx -- prisma/seed-part2.ts
```

The seed creates clearly marked development accounts and sample academic assignments. It does not invent real MMA fee structures.

## Development

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:4000

## Production

```bash
npm run build
npm --prefix server start
```

Configure HTTPS, a production database, secure cookies, and real Razorpay webhook settings before launch.

## Authentication and authorization

Roles are `HEAD`, `SUPERVISOR`, `TEACHER`, and `STUDENT`. There is no public student or teacher registration. The backend enforces record ownership, teacher class/subject assignments, student enrollments, and supervisor permissions.

## Payment

Set Razorpay test credentials in `.env` and keep `PAYMENT_SANDBOX=true` during development. The backend verifies payment signatures and webhooks, uses transactions for balance updates, prevents overpayment, and creates receipts only for verified successful payments. The no-credential development mode creates internal sandbox orders for workflow testing; it is not a real payment gateway.

## Testing

```bash
npm --prefix server exec tsc -- -p tsconfig.json
npm --prefix client exec tsc -- -b tsconfig.app.json
npm run build
```

The security checks cover invalid signatures, failed payments, duplicate verification, student fee privacy, teacher assignment restrictions, private downloads, and supervisor payment permission denial.

## Real MMA information still required

- Official address, phone, email, and WhatsApp details
- Approved logo and brand assets
- Real faculty names and assignments
- Actual subjects, batches, timetable, and photographs
- Approved fee structures and policies
- Production Razorpay account and webhook URL
- Privacy, refund, cancellation, and terms policies
- Production domain for canonical URLs and sitemap entries
