import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

const groupByLabels = {
  category: 'Категорія', user: 'Користувач', currency: 'Валюта',
  day: 'День', month: 'Місяць',
};

// ---- Excel ----
export async function reportToExcel(report) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Biz Finance';
  const ws = wb.addWorksheet('Звіт');

  ws.mergeCells('A1:D1');
  ws.getCell('A1').value = 'Фінансовий звіт';
  ws.getCell('A1').font = { size: 14, bold: true };

  ws.addRow([]);
  ws.addRow(['Період', `${report.period.from ?? '—'} — ${report.period.to ?? '—'}`]);
  ws.addRow(['Групування', groupByLabels[report.groupBy] ?? report.groupBy]);
  ws.addRow(['Базова валюта', report.baseCurrency]);
  ws.addRow([]);

  const header = ws.addRow([
    groupByLabels[report.groupBy] ?? 'Група', 'Доходи', 'Витрати', 'Прибуток', 'К-сть',
  ]);
  header.font = { bold: true };
  header.eachCell((c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  });

  for (const r of report.rows) {
    ws.addRow([r.label, r.income, r.expense, r.net, r.count]);
  }

  ws.addRow([]);
  const total = ws.addRow([
    'РАЗОМ', report.summary.income, report.summary.expense, report.summary.profit, report.summary.count,
  ]);
  total.font = { bold: true };

  [2, 3, 4].forEach((i) => (ws.getColumn(i).numFmt = '#,##0.00'));
  ws.columns.forEach((c) => (c.width = 20));

  return wb.xlsx.writeBuffer();
}

// ---- PDF ----
export function reportToPdf(report) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Примітка: для повної підтримки кирилиці підключіть TTF-шрифт через doc.font(path).
    doc.fontSize(18).text('Фінансовий звіт', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10)
      .text(`Період: ${report.period.from ?? '—'} — ${report.period.to ?? '—'}`)
      .text(`Групування: ${groupByLabels[report.groupBy] ?? report.groupBy}`)
      .text(`Базова валюта: ${report.baseCurrency}`);
    doc.moveDown();

    doc.fontSize(12).text(
      `Доходи: ${report.summary.income}   Витрати: ${report.summary.expense}   ` +
      `Прибуток: ${report.summary.profit}`
    );
    doc.moveDown();

    const top = doc.y;
    const cols = [40, 240, 340, 440];
    doc.fontSize(10).text('Група', cols[0], top)
      .text('Доходи', cols[1], top)
      .text('Витрати', cols[2], top)
      .text('Прибуток', cols[3], top);
    doc.moveTo(40, top + 14).lineTo(555, top + 14).stroke();

    let y = top + 20;
    for (const r of report.rows) {
      if (y > 780) { doc.addPage(); y = 40; }
      doc.text(String(r.label), cols[0], y, { width: 190 })
        .text(String(r.income), cols[1], y)
        .text(String(r.expense), cols[2], y)
        .text(String(r.net), cols[3], y);
      y += 18;
    }

    doc.end();
  });
}
