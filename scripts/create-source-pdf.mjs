import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const output = path.join(root, 'MMA-website-source-code.pdf');
const files = [
  'README.md',
  '.env.example',
  '.gitignore',
  'package.json',
  'client/index.html',
  'client/public/robots.txt',
  'client/public/sitemap.xml',
  'client/src/App.tsx',
  'client/src/main.tsx',
  'client/src/styles.css',
  'client/src/components/Layout.tsx',
  'client/src/pages/AboutPage.tsx',
  'client/src/pages/AcademicListPage.tsx',
  'client/src/pages/Classes710Page.tsx',
  'client/src/pages/Classes1112Page.tsx',
  'client/src/pages/ContactPage.tsx',
  'client/src/pages/CoursesPage.tsx',
  'client/src/pages/FacilitiesPage.tsx',
  'client/src/pages/FaqPage.tsx',
  'client/src/pages/FeesPage.tsx',
  'client/src/pages/HomePage.tsx',
  'client/src/pages/LoginPage.tsx',
  'client/src/pages/NotFoundPage.tsx',
  'client/src/pages/PortalPage.tsx',
  'client/src/pages/ResourcesPage.tsx',
  'client/src/pages/StudyEnvironmentPage.tsx',
  'client/src/pages/TimetablePage.tsx',
  'server/package.json',
  'server/src/config.ts',
  'server/src/lib/auth.ts',
  'server/src/lib/prisma.ts',
  'server/src/server.ts',
  'server/prisma/schema.prisma',
  'server/prisma/seed.ts',
  'server/prisma/seed-part2.ts',
];

const ascii = (value) => value.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '?');
const escapePdf = (value) => ascii(value).replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
const linesPerPage = 62;
const charactersPerLine = 112;
const pages = [];

for (const relativePath of files) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) continue;
  const source = fs.readFileSync(filePath, 'utf8').replaceAll('\r\n', '\n');
  const sourceLines = [`===== ${relativePath} =====`, ...source.split('\n')];
  for (const line of sourceLines) {
    const value = line.length ? line : ' ';
    for (let index = 0; index < value.length; index += charactersPerLine) {
      if (pages.length === 0 || pages.at(-1).length >= linesPerPage) pages.push([]);
      pages.at(-1).push(value.slice(index, index + charactersPerLine));
    }
  }
}

const objects = [];
const addObject = (body) => { objects.push(body); return objects.length; };
addObject('<< /Type /Catalog /Pages 2 0 R >>');
const pageObjectIds = pages.map((_, index) => 4 + index * 2);
addObject(`<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`);
addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>');

for (const page of pages) {
  const pageObjectId = addObject('');
  const content = ['BT', '/F1 8 Tf', '40 760 Td', '10 TL', ...page.map((line, index) => `${index ? 'T*\n' : ''}(${escapePdf(line)}) Tj`), 'ET'].join('\n');
  const contentObjectId = addObject(`<< /Length ${Buffer.byteLength(content, 'ascii')} >>\nstream\n${content}\nendstream`);
  objects[pageObjectId - 1] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectId} 0 R >>`;
}

const chunks = [Buffer.from('%PDF-1.4\n', 'ascii')];
const offsets = [0];
for (let index = 0; index < objects.length; index += 1) {
  offsets.push(Buffer.concat(chunks).length);
  chunks.push(Buffer.from(`${index + 1} 0 obj\n${objects[index]}\nendobj\n`, 'ascii'));
}
const xrefOffset = Buffer.concat(chunks).length;
chunks.push(Buffer.from(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`, 'ascii'));
fs.writeFileSync(output, Buffer.concat(chunks));
console.log(`Created ${output} (${pages.length} pages)`);
