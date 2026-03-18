// Vintage Purple Template - Classic sepia tones with royal purple accents
PDFHandler.registerTemplate('vintage-purple', {
  name: 'Vintage Purple',
  description: 'Classic sepia aesthetic with elegant royal purple accents and serif typography',
  render: (doc, invoice, client, settings) => {
    const margin = 28;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const royalPurple = [102, 51, 153];
    const deepPurple = [76, 40, 120];
    const lavenderAccent = [180, 150, 220];
    const sepiaDark = [62, 47, 35];
    const sepiaMedium = [92, 77, 62];
    const sepiaLight = [139, 126, 112];
    const sepiaFaint = [180, 168, 155];
    const paperBg = [252, 248, 240];
    const paperCream = [247, 242, 232];
    const borderSepia = [210, 195, 175];
    const tableHeader = royalPurple;

    const statusColors = {
      draft: [139, 126, 112],
      sent: [178, 102, 178],
      paid: [107, 142, 35],
      overdue: [165, 65, 65],
    };

    // Decorative top border
    doc.setFillColor(...royalPurple);
    doc.rect(margin, y, contentWidth, 3, 'F');
    y += 8;

    // Decorative flourish (simplified double line)
    doc.setDrawColor(...lavenderAccent);
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + 25, y);
    doc.line(pageWidth - margin - 25, y, pageWidth - margin, y);
    y += 12;

    // Header - Invoice title with serif font
    doc.setFont('times', 'bold');
    doc.setFontSize(36);
    doc.setTextColor(...royalPurple);
    doc.text('INVOICE', margin, y);
    y += 8;

    // Decorative underline
    doc.setDrawColor(...royalPurple);
    doc.setLineWidth(0.8);
    doc.line(margin, y, margin + 60, y);
    y += 14;

    // Company info (left side)
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...sepiaMedium);
    if (settings.company) {
      doc.setFont('times', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...sepiaDark);
      doc.text(settings.company, margin, y);
      y += 5;
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...sepiaMedium);
    }
    if (settings.email) {
      doc.text(settings.email, margin, y);
      y += 4.5;
    }
    if (settings.address) {
      const addrLines = doc.splitTextToSize(settings.address, contentWidth * 0.4);
      addrLines.forEach(line => {
        doc.text(line, margin, y);
        y += 4.5;
      });
    }

    // Invoice details box (right side)
    const boxW = 85;
    const boxX = pageWidth - margin - boxW;
    const boxY = margin + 25;

    // Box background
    doc.setFillColor(...paperCream);
    doc.setDrawColor(...borderSepia);
    doc.setLineWidth(0.5);
    doc.rect(boxX, boxY, boxW, 52, 'FD');

    // Purple accent strip on left
    doc.setFillColor(...royalPurple);
    doc.rect(boxX, boxY, 3, 52, 'F');

    // Invoice number
    doc.setFont('times', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...sepiaFaint);
    doc.text('INVOICE NO.', boxX + 10, boxY + 10);
    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...deepPurple);
    doc.text(invoice.number || '', boxX + 10, boxY + 19);

    // Separator line
    doc.setDrawColor(...borderSepia);
    doc.setLineWidth(0.3);
    doc.line(boxX + 10, boxY + 25, boxX + boxW - 8, boxY + 25);

    // Dates
    doc.setFont('times', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...sepiaFaint);
    doc.text('ISSUED', boxX + 10, boxY + 32);
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...sepiaDark);
    doc.text(invoice.issueDate || '\u2014', boxX + 10, boxY + 39);

    doc.setFont('times', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...sepiaFaint);
    doc.text('DUE', boxX + 48, boxY + 32);
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...sepiaDark);
    doc.text(invoice.dueDate || '\u2014', boxX + 48, boxY + 39);

    // Status badge
    const statusText = (invoice.status || 'DRAFT').toUpperCase();
    const statusColor = statusColors[invoice.status] || sepiaFaint;
    const sw = doc.getTextWidth(statusText) + 14;
    doc.setFillColor(...statusColor);
    doc.roundedRect(boxX + boxW - sw - 6, boxY + 6, sw, 10, 1.5, 1.5, 'F');
    doc.setFont('times', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(statusText, boxX + boxW - sw / 2 - 6, boxY + 12.5, { align: 'center' });

    y = Math.max(y, boxY + 60) + 10;

    // Decorative divider
    doc.setDrawColor(...borderSepia);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    doc.setFillColor(...royalPurple);
    doc.circle(pageWidth / 2, y, 2, 'F');
    y += 14;

    // Bill To section
    doc.setFont('times', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...sepiaFaint);
    doc.text('BILL TO', margin, y);
    y += 7;

    if (client) {
      if (client.name) {
        doc.setFont('times', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(...sepiaDark);
        doc.text(client.name, margin, y);
        y += 6;
      }
      doc.setFont('times', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(...sepiaMedium);
      if (client.email) {
        doc.text(client.email, margin, y);
        y += 4.5;
      }
      if (client.address) {
        const addrLines = doc.splitTextToSize(client.address, contentWidth * 0.42);
        addrLines.forEach(line => {
          doc.text(line, margin, y);
          y += 4.5;
        });
      }
      if (client.taxId) {
        doc.setFontSize(8);
        doc.setTextColor(...sepiaFaint);
        doc.text('Tax ID: ' + client.taxId, margin, y);
        y += 4.5;
      }
    }
    y += 12;

    // Line items table
    const colWidths = [contentWidth * 0.44, contentWidth * 0.14, contentWidth * 0.21, contentWidth * 0.21];
    const colX = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2]];

    // Table header with purple background
    doc.setFillColor(...tableHeader);
    doc.rect(margin, y, contentWidth, 12, 'F');
    doc.setFont('times', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    const headerY = y + 8.5;
    doc.text('DESCRIPTION', colX[0] + 5, headerY);
    doc.text('QTY', colX[1] + 5, headerY);
    doc.text('RATE', colX[2] + 5, headerY);
    doc.text('AMOUNT', colX[3] + colWidths[3] - 5, headerY, { align: 'right' });
    y += 12;

    // Table rows
    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    const items = invoice.items || [];
    items.forEach((item, idx) => {
      if (y > pageHeight - 60) {
        doc.addPage();
        y = margin;
      }

      // Alternating row background
      if (idx % 2 === 0) {
        doc.setFillColor(...paperCream);
        doc.rect(margin, y, contentWidth, 10, 'F');
      }

      const amount = (Number(item.qty) || 0) * (Number(item.rate) || 0);
      const rowMidY = y + 7;

      doc.setTextColor(...sepiaDark);
      doc.text(item.description || '', colX[0] + 5, rowMidY);

      doc.setTextColor(...sepiaMedium);
      doc.text(String(item.qty || 0), colX[1] + 5, rowMidY);
      doc.text(settings.currency + Number(item.rate || 0).toFixed(2), colX[2] + 5, rowMidY);

      doc.setFont('times', 'bold');
      doc.setTextColor(...deepPurple);
      doc.text(settings.currency + amount.toFixed(2), colX[3] + colWidths[3] - 5, rowMidY, { align: 'right' });
      doc.setFont('times', 'normal');

      y += 10;

      doc.setDrawColor(...borderSepia);
      doc.setLineWidth(0.2);
      doc.line(margin, y, pageWidth - margin, y);
    });

    // Bottom border of table
    doc.setDrawColor(...royalPurple);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;

    // Summary section
    const subtotal = DataStore.calcInvoiceSubtotal(invoice);
    const taxRate = Number(invoice.taxRate) || 0;
    const taxLabel = invoice.taxLabel || 'Tax';
    const taxAmount = DataStore.calcInvoiceTax(invoice);
    const total = DataStore.calcInvoiceTotal(invoice);
    const summaryBoxW = 130;
    const summaryBoxX = pageWidth - margin - summaryBoxW;

    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...sepiaMedium);
    doc.text('Subtotal', summaryBoxX + 10, y + 3);
    doc.text(settings.currency + subtotal.toFixed(2), pageWidth - margin - 8, y + 3, { align: 'right' });
    y += 7;

    if (taxRate > 0) {
      doc.text(taxLabel + ' (' + taxRate + '%)', summaryBoxX + 10, y + 3);
      doc.text(settings.currency + taxAmount.toFixed(2), pageWidth - margin - 8, y + 3, { align: 'right' });
      y += 7;
    }

    // Separator before total
    doc.setDrawColor(...borderSepia);
    doc.setLineWidth(0.5);
    doc.line(summaryBoxX + 10, y, pageWidth - margin - 8, y);
    y += 6;

    // Total box with purple accent
    const totalBoxH = 18;
    doc.setFillColor(...paperCream);
    doc.setDrawColor(...borderSepia);
    doc.setLineWidth(0.4);
    doc.rect(summaryBoxX, y - 4, summaryBoxW, totalBoxH, 'FD');
    doc.setFillColor(...royalPurple);
    doc.rect(summaryBoxX, y - 4, 3, totalBoxH, 'F');

    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...sepiaMedium);
    doc.text('TOTAL DUE', summaryBoxX + 12, y + 6);
    doc.setFontSize(16);
    doc.setTextColor(...deepPurple);
    doc.text(settings.currency + total.toFixed(2), pageWidth - margin - 8, y + 7, { align: 'right' });
    y += totalBoxH + 12;

    // Notes section
    if (invoice.notes) {
      if (y > pageHeight - 55) {
        doc.addPage();
        y = margin;
      }

      doc.setFillColor(...paperCream);
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.setFont('times', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...royalPurple);
      doc.text('NOTES', margin + 5, y + 5.5);
      y += 12;

      doc.setFont('times', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...sepiaMedium);
      const noteLines = doc.splitTextToSize(invoice.notes, contentWidth - 10);
      noteLines.forEach(line => {
        if (y > pageHeight - 25) { doc.addPage(); y = margin; }
        doc.text(line, margin + 5, y);
        y += 4.5;
      });
      y += 8;
    }

    // Footer
    const footerY = pageHeight - 20;

    doc.setDrawColor(...borderSepia);
    doc.setLineWidth(0.4);
    doc.line(margin, footerY, pageWidth - margin, footerY);
    doc.setFillColor(...royalPurple);
    doc.circle(pageWidth / 2, footerY, 1.5, 'F');

    doc.setFont('times', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...sepiaLight);
    doc.text('Thank you for your business', pageWidth / 2, footerY + 7, { align: 'center' });

    if (settings.company) {
      doc.setFont('times', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...sepiaFaint);
      doc.text(settings.company, pageWidth / 2, footerY + 13, { align: 'center' });
    }

    // Bottom decorative border
    doc.setFillColor(...royalPurple);
    doc.rect(margin, pageHeight - 8, contentWidth, 2, 'F');
  }
});
