import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

async function main() {
  const outputDir = path.resolve(process.cwd(), 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const sampleDir = path.resolve(process.cwd(), 'public/sample-pack');

  const tender = {
    tender_id: 'T-2026-0417',
    title: 'Supply of IT Equipment',
    procuring_entity: 'Example Directorate',
    bidder: 'Example Company Ltd.',
    submission_deadline: '2026-10-20',
  };

  const includedDocs = [
    { order: 1, id: 'R01', title: 'Trade License', filename: '01_Trade_License.pdf' },
    { order: 2, id: 'R02', title: 'TIN Certificate', filename: '02_TIN_Certificate.pdf' },
    { order: 3, id: 'R03', title: 'VAT Registration Certificate', filename: '03_VAT_Registration.pdf' },
    { order: 4, id: 'R04', title: 'Bank Solvency Certificate', filename: '04_Bank_Solvency.pdf' },
    { order: 5, id: 'R05', title: 'ISO 9001 Quality Certificate', filename: '05_ISO_9001_Quality.pdf' },
    { order: 6, id: 'R06', title: 'Technical Proposal & Specifications', filename: '06_Technical_Proposal.pdf' },
  ];

  const mergedPdf = await PDFDocument.create();
  const font = await mergedPdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await mergedPdf.embedFont(StandardFonts.HelveticaBold);

  // Load body files
  const loadedDocs = [];
  let totalBodyPages = 0;
  for (const doc of includedDocs) {
    const bytes = fs.readFileSync(path.join(sampleDir, doc.filename));
    const loaded = await PDFDocument.load(bytes);
    const pageCount = loaded.getPageCount();
    totalBodyPages += pageCount;
    loadedDocs.push({ ...doc, loaded, pageCount });
  }

  const coverPagesCount = 1;
  const indexPagesCount = 1;
  const totalPagesY = coverPagesCount + indexPagesCount + totalBodyPages;

  const A4_WIDTH = 595.28;
  const A4_HEIGHT = 841.89;
  const marginX = 48;

  // 1. Cover Page
  const coverPage = mergedPdf.addPage([A4_WIDTH, A4_HEIGHT]);
  let cursorY = A4_HEIGHT - 60;

  coverPage.drawText('TENDER DOCUMENT SUBMISSION PACKAGE', {
    x: marginX,
    y: cursorY,
    size: 10,
    font: fontBold,
    color: rgb(0.36, 0.42, 0.48),
  });
  cursorY -= 28;

  coverPage.drawText(tender.tender_id, {
    x: marginX,
    y: cursorY,
    size: 26,
    font: fontBold,
    color: rgb(0.06, 0.06, 0.06),
  });
  cursorY -= 24;

  coverPage.drawText(tender.title, {
    x: marginX,
    y: cursorY,
    size: 16,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });
  cursorY -= 24;

  coverPage.drawLine({
    start: { x: marginX, y: cursorY },
    end: { x: A4_WIDTH - marginX, y: cursorY },
    thickness: 0.75,
    color: rgb(0.8, 0.8, 0.8),
  });
  cursorY -= 20;

  const metaRows = [
    ['Procuring Entity:', tender.procuring_entity],
    ['Bidder Organization:', tender.bidder],
    ['Submission Deadline:', tender.submission_deadline],
    ['Package Compiled Date:', new Date().toISOString().slice(0, 10)],
    ['Included Documents:', `${includedDocs.length} documents (${totalBodyPages} pages)`],
  ];

  for (const [label, val] of metaRows) {
    coverPage.drawText(label, { x: marginX, y: cursorY, size: 9.5, font: fontBold, color: rgb(0.4, 0.4, 0.4) });
    coverPage.drawText(val, { x: marginX + 160, y: cursorY, size: 9.5, font, color: rgb(0.1, 0.1, 0.1) });
    cursorY -= 17;
  }

  cursorY -= 12;
  coverPage.drawLine({
    start: { x: marginX, y: cursorY },
    end: { x: A4_WIDTH - marginX, y: cursorY },
    thickness: 0.75,
    color: rgb(0.8, 0.8, 0.8),
  });
  cursorY -= 24;

  coverPage.drawText('SCHEDULE OF INCLUDED DOCUMENTS', {
    x: marginX,
    y: cursorY,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  cursorY -= 20;

  coverPage.drawText('Order', { x: marginX, y: cursorY, size: 8.5, font: fontBold, color: rgb(0.4, 0.4, 0.4) });
  coverPage.drawText('Document Title', { x: marginX + 45, y: cursorY, size: 8.5, font: fontBold, color: rgb(0.4, 0.4, 0.4) });
  coverPage.drawText('Source File', { x: marginX + 270, y: cursorY, size: 8.5, font: fontBold, color: rgb(0.4, 0.4, 0.4) });
  coverPage.drawText('Pages', { x: A4_WIDTH - marginX - 40, y: cursorY, size: 8.5, font: fontBold, color: rgb(0.4, 0.4, 0.4) });
  cursorY -= 14;

  coverPage.drawLine({
    start: { x: marginX, y: cursorY },
    end: { x: A4_WIDTH - marginX, y: cursorY },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  });
  cursorY -= 16;

  loadedDocs.forEach((item, idx) => {
    const orderStr = String(idx + 1).padStart(2, '0');
    coverPage.drawText(orderStr, { x: marginX, y: cursorY, size: 8.5, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
    coverPage.drawText(item.title, { x: marginX + 45, y: cursorY, size: 8.5, font, color: rgb(0.1, 0.1, 0.1) });
    coverPage.drawText(item.filename, { x: marginX + 270, y: cursorY, size: 8, font, color: rgb(0.45, 0.45, 0.45) });
    coverPage.drawText(`${item.pageCount} p.`, { x: A4_WIDTH - marginX - 35, y: cursorY, size: 8.5, font, color: rgb(0.2, 0.2, 0.2) });
    cursorY -= 16;
  });

  // 2. Index Page
  const indexPage = mergedPdf.addPage([A4_WIDTH, A4_HEIGHT]);
  let indexCursorY = A4_HEIGHT - 60;

  indexPage.drawText('DOCUMENT INDEX DIRECTORY', {
    x: marginX,
    y: indexCursorY,
    size: 16,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  indexCursorY -= 20;

  indexPage.drawText('Page navigation for all attached documents in this package:', {
    x: marginX,
    y: indexCursorY,
    size: 9.5,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  indexCursorY -= 25;

  indexPage.drawLine({
    start: { x: marginX, y: indexCursorY },
    end: { x: A4_WIDTH - marginX, y: indexCursorY },
    thickness: 0.75,
    color: rgb(0.8, 0.8, 0.8),
  });
  indexCursorY -= 18;

  let runningStart = 3; // After cover (1) and index (2)
  loadedDocs.forEach((item, idx) => {
    indexPage.drawText(`${idx + 1}.  ${item.title}`, {
      x: marginX,
      y: indexCursorY,
      size: 9,
      font: fontBold,
      color: rgb(0.15, 0.15, 0.15),
    });
    indexPage.drawText(`Page ${runningStart}`, {
      x: A4_WIDTH - marginX - 50,
      y: indexCursorY,
      size: 9,
      font,
      color: rgb(0.36, 0.42, 0.48),
    });
    indexCursorY -= 18;
    runningStart += item.pageCount;
  });

  // 3. Body Documents
  for (const item of loadedDocs) {
    const copiedPages = await mergedPdf.copyPages(item.loaded, item.loaded.getPageIndices());
    for (const page of copiedPages) {
      mergedPdf.addPage(page);
    }
  }

  // 4. Footer Pass on ALL Pages (1 to Y)
  const allPages = mergedPdf.getPages();
  allPages.forEach((page, pageIndex) => {
    const pageNum = pageIndex + 1;
    const { width: pWidth } = page.getSize();

    page.drawRectangle({
      x: 0,
      y: 0,
      width: pWidth,
      height: 20,
      color: rgb(1, 1, 1),
    });

    const footerText = `${tender.tender_id} | Page ${pageNum} of ${totalPagesY}`;
    const textWidth = font.widthOfTextAtSize(footerText, 8);
    const textX = Math.max((pWidth - textWidth) / 2, 10);

    page.drawText(footerText, {
      x: textX,
      y: 6,
      size: 8,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
  });

  const finalBytes = await mergedPdf.save();
  const targetPath = path.join(outputDir, `${tender.tender_id}_Package.pdf`);
  fs.writeFileSync(targetPath, finalBytes);

  console.log(`Generated official submission package at: ${targetPath} (${totalPagesY} pages total)`);
}

main().catch(console.error);
