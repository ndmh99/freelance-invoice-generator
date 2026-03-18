// Classic Template - Traditional invoice with bordered tables and formal layout
PDFHandler.registerTemplate('classic', {
  name: 'Classic',
  description: 'Traditional invoice with bordered tables and formal layout',
  render: (doc, invoice, client, settings) => {
    const margin = 25;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const darkNavy = [33, 41, 61];
    const charcoal = [55, 55, 65];
    const textDark = [40, 40, 50];
    const textMedium = [85, 85, 95];
    const textLight = [130, 130, 140];
    const borderDark = [60, 60, 75];
    const borderLight = [200, 200, 210];
    const subtleBg = [248, 248, 252];
    const tableHeader = [48, 48, 65];
    const rowAlt = [250, 250, 253];

    const statusColors = {
      draft: [130, 130, 145],
      sent: [60, 100, 160],
      paid: [45, 135, 75],
      overdue: [180, 55, 55],
    };

    // Header
    doc.setFillColor(...darkNavy);
    doc.rect(margin, y, contentWidth, 2.5, 'F');
    y += 14;

    doc.setFont('times', 'bold');
    doc.setFontSize(32);
    doc.setTextColor(...darkNavy);
    doc.text('INVOICE', margin, y);
    y += 4;

    doc.setDrawColor(...darkNavy);
    doc.setLineWidth(0.6);
    doc.line(margin, y, margin + 45, y);
    y += 12;

    // Company info
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...textMedium);
    if (settings.company) {
      doc.setFont('times', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...textDark);
      doc.text(settings.company, margin, y);
      y += 6;
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...textMedium);
    }
    if (settings.email) {
      doc.text(settings.email, margin, y);
      y += 5;
    }
    if (settings.address) {
      const addrLines = doc.splitTextToSize(settings.address, contentWidth * 0.45);
      addrLines.forEach(line => {
        doc.text(line, margin, y);
        y += 5;
      });
    }

    // Invoice details box
    const boxW = 90;
    const boxX = pageWidth - margin - boxW;
    const boxY = margin + 12;

    doc.setFillColor(...subtleBg);
    doc.setDrawColor(...borderLight);
    doc.setLineWidth(0.4);
    doc.rect(boxX, boxY, boxW, 48, 'FD');

    doc.setFillColor(...darkNavy);
    doc.rect(boxX, boxY, 2, 48, 'F');

    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textLight);
    doc.text('INVOICE NUMBER', boxX + 10, boxY + 10);
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...textDark);
    doc.text(invoice.number || '', boxX + 10, boxY + 18);

    doc.setDrawColor(...borderLight);
    doc.setLineWidth(0.3);
    doc.line(boxX + 10, boxY + 23, boxX + boxW - 8, boxY + 23);

    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textLight);
    doc.text('ISSUE DATE', boxX + 10, boxY + 30);
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...textDark);
    doc.text(invoice.issueDate || '\u2014', boxX + 10, boxY + 37);

    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textLight);
    doc.text('DUE DATE', boxX + 48, boxY + 30);
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...textDark);
    doc.text(invoice.dueDate || '\u2014', boxX + 48, boxY + 37);

    const statusText = (invoice.status || 'DRAFT').toUpperCase();
    const statusColor = statusColors[invoice.status] || textLight;
    const statusW = doc.getTextWidth(statusText) + 12;
    doc.setFillColor(...statusColor);
    doc.roundedRect(boxX + boxW - statusW - 8, boxY + 6, statusW, 9, 1.5, 1.5, 'F');
    doc.setFont('times', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(statusText, boxX + boxW - statusW / 2 - 8, boxY + 11.5, { align: 'center' });

    y = Math.max(y + 5, boxY + 58);

    doc.setDrawColor(...borderLight);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Bill To
    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...textLight);
    doc.text('BILL TO', margin, y);
    y += 7;

    if (client) {
      if (client.name) {
        doc.setFont('times', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...textDark);
        doc.text(client.name, margin, y);
        y += 6;
      }
      doc.setFont('times', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(...textMedium);
      if (client.address) {
        const addrLines = doc.splitTextToSize(client.address, contentWidth * 0.45);
        addrLines.forEach(line => { doc.text(line, margin, y); y += 4.5; });
      }
      if (client.email) { doc.text(client.email, margin, y); y += 4.5; }
      if (client.taxId) {
        doc.setTextColor(...textLight);
        doc.setFontSize(8.5);
        doc.text('Tax ID: ' + client.taxId, margin, y);
        y += 4.5;
      }
    }
    y += 12;

    // Line items table
    const colWidths = [contentWidth * 0.44, contentWidth * 0.14, contentWidth * 0.21, contentWidth * 0.21];
    const colX = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2]];

    doc.setFillColor(...tableHeader);
    doc.rect(margin, y, contentWidth, 12, 'F');

    doc.setFillColor(58, 58, 78);
    doc.rect(margin, y, contentWidth, 0.5, 'F');

    doc.setFont('times', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(190, 190, 210);
    const headerY = y + 8;
    doc.text('DESCRIPTION', colX[0] + 5, headerY);
    doc.text('QTY', colX[1] + 5, headerY);
    doc.text('RATE', colX[2] + 5, headerY);
    doc.text('AMOUNT', colX[3] + colWidths[3] - 5, headerY, { align: 'right' });
    y += 12;

    doc.setFont('times', 'normal');
    doc.setTextColor(...textDark);
    doc.setFontSize(9.5);
    const items = invoice.items || [];
    items.forEach((item, idx) => {
      if (y > pageHeight - 50) {
        doc.addPage();
        y = margin;
      }

      if (idx % 2 === 0) {
        doc.setFillColor(...rowAlt);
        doc.rect(margin, y, contentWidth, 10, 'F');
      }

      const amount = (Number(item.qty) || 0) * (Number(item.rate) || 0);
      const rowMidY = y + 7;

      doc.setTextColor(...textDark);
      doc.text(item.description || '', colX[0] + 5, rowMidY);

      doc.setTextColor(...textMedium);
      doc.text(String(item.qty || 0), colX[1] + 5, rowMidY);

      doc.text(settings.currency + Number(item.rate || 0).toFixed(2), colX[2] + 5, rowMidY);

      doc.setFont('times', 'bold');
      doc.setTextColor(...textDark);
      doc.text(settings.currency + amount.toFixed(2), colX[3] + colWidths[3] - 5, rowMidY, { align: 'right' });
      doc.setFont('times', 'normal');

      y += 10;

      doc.setDrawColor(230, 230, 238);
      doc.setLineWidth(0.2);
      doc.line(margin, y, pageWidth - margin, y);
    });

    doc.setDrawColor(...borderDark);
    doc.setLineWidth(0.6);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Summary
    const summaryBoxW = 120;
    const summaryBoxX = pageWidth - margin - summaryBoxW;

    const subtotal = DataStore.calcInvoiceSubtotal(invoice);
    const taxRate = Number(invoice.taxRate) || 0;
    const taxLabel = invoice.taxLabel || 'Tax';
    const taxAmount = DataStore.calcInvoiceTax(invoice);
    const total = DataStore.calcInvoiceTotal(invoice);
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...textMedium);
    doc.text('Subtotal', summaryBoxX + 10, y + 3);
    doc.text(settings.currency + subtotal.toFixed(2), pageWidth - margin - 5, y + 3, { align: 'right' });
    y += 8;

    if (taxRate > 0) {
      doc.text(taxLabel + ' (' + taxRate + '%)', summaryBoxX + 10, y + 3);
      doc.text(settings.currency + taxAmount.toFixed(2), pageWidth - margin - 5, y + 3, { align: 'right' });
      y += 8;
    }

    doc.setDrawColor(...borderLight);
    doc.setLineWidth(0.3);
    doc.line(summaryBoxX + 10, y, pageWidth - margin - 5, y);
    y += 8;

    const totalBoxH = 16;
    doc.setFillColor(...subtleBg);
    doc.setDrawColor(...borderLight);
    doc.setLineWidth(0.4);
    doc.rect(summaryBoxX, y - 3, summaryBoxW, totalBoxH, 'FD');

    doc.setFillColor(...darkNavy);
    doc.rect(summaryBoxX, y - 3, 2.5, totalBoxH, 'F');

    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...textMedium);
    doc.text('TOTAL DUE', summaryBoxX + 12, y + 6);
    doc.setFontSize(14);
    doc.setTextColor(...darkNavy);
    doc.text(settings.currency + total.toFixed(2), pageWidth - margin - 8, y + 6, { align: 'right' });
    y += totalBoxH + 10;

    // Notes
    if (invoice.notes) {
      if (y > pageHeight - 55) {
        doc.addPage();
        y = margin;
      }

      doc.setFillColor(250, 250, 252);
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.setFont('times', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...textLight);
      doc.text('NOTES & TERMS', margin + 5, y + 5.5);
      y += 12;

      doc.setFont('times', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...textMedium);
      const noteLines = doc.splitTextToSize(invoice.notes, contentWidth - 10);
      noteLines.forEach(line => {
        if (y > pageHeight - 25) { doc.addPage(); y = margin; }
        doc.text(line, margin + 5, y);
        y += 4.5;
      });
      y += 8;
    }

    // Footer
    const footerY = pageHeight - 22;

    doc.setDrawColor(...borderLight);
    doc.setLineWidth(0.4);
    doc.line(margin, footerY, pageWidth - margin, footerY);

    doc.setFont('times', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...textLight);
    doc.text('Thank you for your business', pageWidth / 2, footerY + 6, { align: 'center' });

    if (settings.company) {
      doc.setFont('times', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 170);
      doc.text(settings.company, pageWidth / 2, footerY + 11, { align: 'center' });
    }
  }
});
