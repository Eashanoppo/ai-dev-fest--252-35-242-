import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

async function createDoc(title, subtitle, pages = 1) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  for (let i = 0; i < pages; i++) {
    const page = doc.addPage([595.28, 841.89]);
    page.drawText(title, {
      x: 50,
      y: 780,
      size: 20,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    page.drawText(`${subtitle} — Page ${i + 1} of ${pages}`, {
      x: 50,
      y: 750,
      size: 11,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
    page.drawLine({
      start: { x: 50, y: 730 },
      end: { x: 545, y: 730 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    page.drawText('Sample certified document issued for procurement evaluation.', {
      x: 50,
      y: 700,
      size: 10,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
  }

  return await doc.save();
}

async function main() {
  const outDir = path.resolve(process.cwd(), 'public/sample-pack');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const tradeLicenseBytes = await createDoc('TRADE LICENSE', 'Government of Bangladesh Authority', 2);
  fs.writeFileSync(path.join(outDir, '01_Trade_License.pdf'), tradeLicenseBytes);
  // Duplicate file with exact same bytes
  fs.writeFileSync(path.join(outDir, '01_Trade_License_DUPLICATE_COPY.pdf'), tradeLicenseBytes);

  const tinBytes = await createDoc('TIN CERTIFICATE', 'National Board of Revenue', 1);
  fs.writeFileSync(path.join(outDir, '02_TIN_Certificate.pdf'), tinBytes);

  const vatBytes = await createDoc('VAT REGISTRATION CERTIFICATE', 'Value Added Tax Division', 1);
  fs.writeFileSync(path.join(outDir, '03_VAT_Registration.pdf'), vatBytes);

  const bankBytes = await createDoc('BANK SOLVENCY CERTIFICATE', 'Premier Commercial Bank Ltd.', 1);
  fs.writeFileSync(path.join(outDir, '04_Bank_Solvency.pdf'), bankBytes);

  const isoBytes = await createDoc('ISO 9001 QUALITY CERTIFICATE', 'International Standards Org.', 3);
  fs.writeFileSync(path.join(outDir, '05_ISO_9001_Quality.pdf'), isoBytes);

  const proposalBytes = await createDoc('TECHNICAL PROPOSAL & SPECIFICATIONS', 'IT Infrastructure Equipment', 4);
  fs.writeFileSync(path.join(outDir, '06_Technical_Proposal.pdf'), proposalBytes);

  // Corrupted PDF file for error handling test
  fs.writeFileSync(path.join(outDir, '07_Corrupted_Damaged.pdf'), Buffer.from('%PDF-1.4\nBROKEN_GARBAGE_PAYLOAD_TEST'));

  console.log('Sample test pack generated successfully in public/sample-pack/');
}

main().catch(console.error);
