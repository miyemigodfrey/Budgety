import PDFDocument from 'pdfkit';
import { ITransaction, TransactionType } from '../interfaces';
import { ISource } from '../interfaces/source.interface';

interface PdfOptions {
  transactions: ITransaction[];
  sources: ISource[];
  startDate: string;
  endDate: string;
  userName: string;
}

export function generateTransactionsPdf(options: PdfOptions): Promise<Buffer> {
  const { transactions, sources, startDate, endDate, userName } = options;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Uint8Array[] = [];

    doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const sourceMap = new Map(sources.map((s) => [s.id, s.name]));

    // ── Header ───────────────────────────────────────────────────
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('Budgety Financial Report', { align: 'center' });
    doc.moveDown(0.3);
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Prepared for: ${userName}`, { align: 'center' });
    doc.text(`Period: ${startDate}  to  ${endDate}`, { align: 'center' });
    doc.moveDown(1);

    // ── Summary ──────────────────────────────────────────────────
    let totalInflow = 0;
    let totalOutflow = 0;

    for (const tx of transactions) {
      if (tx.type === TransactionType.INFLOW) totalInflow += tx.amount;
      if (tx.type === TransactionType.OUTFLOW) totalOutflow += tx.amount;
    }

    doc.fontSize(12).font('Helvetica-Bold').text('Summary');
    doc.moveDown(0.3);
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Total Inflow:   ${formatCurrency(totalInflow)}`)
      .text(`Total Outflow:  ${formatCurrency(totalOutflow)}`)
      .text(`Net:            ${formatCurrency(totalInflow - totalOutflow)}`)
      .text(`Transactions:   ${transactions.length}`);
    doc.moveDown(1);

    // ── Table Header ─────────────────────────────────────────────
    doc.fontSize(12).font('Helvetica-Bold').text('Transaction Details');
    doc.moveDown(0.5);

    const colX = {
      date: 40,
      type: 120,
      source: 185,
      category: 310,
      amount: 420,
      note: 490,
    };
    const tableTop = doc.y;

    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .text('Date', colX.date, tableTop)
      .text('Type', colX.type, tableTop)
      .text('Source', colX.source, tableTop)
      .text('Category', colX.category, tableTop)
      .text('Amount', colX.amount, tableTop)
      .text('Note', colX.note, tableTop);

    doc
      .moveTo(40, tableTop + 12)
      .lineTo(555, tableTop + 12)
      .stroke();

    let y = tableTop + 18;

    // ── Rows ─────────────────────────────────────────────────────
    doc.font('Helvetica').fontSize(8);

    for (const tx of transactions) {
      if (y > 750) {
        doc.addPage();
        y = 40;
      }

      const sourceName = sourceMap.get(tx.sourceId) ?? tx.sourceId;
      const targetName = tx.transferTargetId
        ? (sourceMap.get(tx.transferTargetId) ?? tx.transferTargetId)
        : '';
      const sourceLabel =
        tx.type === TransactionType.TRANSFER
          ? `${sourceName} → ${targetName}`
          : sourceName;

      doc
        .text(formatDate(tx.date), colX.date, y, { width: 75 })
        .text(tx.type, colX.type, y, { width: 60 })
        .text(sourceLabel, colX.source, y, { width: 120 })
        .text(tx.category, colX.category, y, { width: 105 })
        .text(formatCurrency(tx.amount), colX.amount, y, { width: 65 })
        .text(tx.note || '—', colX.note, y, { width: 70 });

      y += 16;
    }

    if (transactions.length === 0) {
      doc.text('No transactions in this period.', 40, y);
    }

    doc.end();
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(date: Date): string {
  return new Date(date).toISOString().slice(0, 10);
}
