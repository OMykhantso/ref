import { asyncHandler } from '../utils/asyncHandler.js';
import { reportQuerySchema } from '../validators/schemas.js';
import { buildReport } from '../services/report.service.js';
import { reportToExcel, reportToPdf } from '../services/export.service.js';

export const getReport = asyncHandler(async (req, res) => {
  const params = reportQuerySchema.parse(req.query);
  const report = await buildReport(params);
  res.json(report);
});

export const exportExcel = asyncHandler(async (req, res) => {
  const params = reportQuerySchema.parse(req.query);
  const report = await buildReport(params);
  const buffer = await reportToExcel(report);

  res.setHeader('Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="report.xlsx"');
  res.send(Buffer.from(buffer));
});

export const exportPdf = asyncHandler(async (req, res) => {
  const params = reportQuerySchema.parse(req.query);
  const report = await buildReport(params);
  const buffer = await reportToPdf(report);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="report.pdf"');
  res.send(buffer);
});
