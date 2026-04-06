import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { InvoiceEntity } from './entities/invoice.entity';

@Injectable()
export class InvoicePdfService {
  async generateInvoicePdf(invoice: InvoiceEntity): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).text('FACTURE', { align: 'left' });
      doc.moveDown(0.5);
      doc.fontSize(10).text(`Numero: ${invoice.number}`);
      doc.text(`Date emission: ${invoice.issuedAt?.toISOString() ?? 'N/A'}`);
      doc.text(`Date echeance: ${invoice.dueAt?.toISOString() ?? 'N/A'}`);
      doc.text(`Statut: ${invoice.status}`);
      doc.text(`Statut fiscal: ${invoice.fiscalStatus}`);

      doc.moveDown();
      doc.fontSize(12).text('Client', { underline: true });
      doc.fontSize(10).text(`Nom: ${invoice.customerCompanyName ?? 'N/A'}`);
      doc.text(`TVA: ${invoice.customerVatNumber ?? 'N/A'}`);
      doc.text(`Email: ${invoice.user?.email ?? 'N/A'}`);

      doc.moveDown();
      doc.fontSize(12).text('Montants', { underline: true });
      doc
        .fontSize(10)
        .text(`Montant HT: ${invoice.subtotalHt} ${invoice.currency}`);
      doc.text(`Taux TVA: ${invoice.taxRate}%`);
      doc.text(`Montant TVA: ${invoice.taxAmount} ${invoice.currency}`);
      doc.text(`Montant TTC: ${invoice.totalTtc} ${invoice.currency}`);

      doc.moveDown();
      doc.fontSize(9).text('Mentions: Facture emise par Academie (fr-FR)');
      doc.text('Conformite RGPD: minimisation des donnees personnelles');

      doc.end();
    });
  }
}
