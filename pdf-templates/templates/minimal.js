// Minimal Template - Ultra-clean with generous whitespace, clear hierarchy, and refined typography
PDFHandler.registerTemplate('minimal', {
  name: 'Minimal',
  description: 'Ultra-clean with generous whitespace, clear hierarchy, and refined typography',
  render: (doc, invoice, client, settings) => {
    const margin = 32;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;
    const metaX = pageWidth - margin;
    let y = margin;

    doc.setFont('helvetica');

    const inkDark = [30, 30, 35];
    const inkMedium = [60, 60, 70];
    const inkMuted = [110, 110, 125];
    const inkFaint = [160, 160, 175];
    const accentLine = [30, 30, 35];
    const ruleLight = [220, 220, 228];
    const ruleMedium = [195, 195, 210];
    const bgSubtle = [247, 247, 250];

    const statusColors = {
      draft:   [96, 165, 250],
      sent:    [251, 191, 36],
      paid:    [74, 222, 128],
      overdue: [248, 113, 113],
    };

    // Header
    doc.setFontSize(32);
    doc.setFont('helvetica', 'light');
    doc.setTextColor(...inkDark);
    doc.text('Invoice', margin, y + 10);
    y += 10;

    doc.setDrawColor(...accentLine);
    doc.setLineWidth(0.6);
    doc.line(margin, y + 4, margin + 32, y + 4);
    y += 16;

    // Company info
    let leftY = y;
    if (settings.company) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...inkDark);
      doc.text(settings.company, margin, leftY);
      leftY += 5;
    }
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...inkMuted);
    if (settings.email) {
      doc.text(settings.email, margin, leftY);
      leftY += 4.5;
    }
    if (settings.address) {
      const addrLines = doc.splitTextToSize(settings.address, contentWidth * 0.42);
      addrLines.forEach(line => {
        doc.text(line, margin, leftY);
        leftY += 4.5;
      });
    }

    // Invoice details
    const statusText = (invoice.status || 'DRAFT').toUpperCase();
    const statusColor = statusColors[invoice.status] || [100, 100, 100];
    doc.setTextColor(...statusColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(statusText, metaX, margin + 10, { align: 'right' });

    let rightY = margin + 18;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...inkMuted);
    if (invoice.issueDate) {
      doc.text('Issued ' + invoice.issueDate, metaX, rightY, { align: 'right' });
      rightY += 5;
    }
    if (invoice.dueDate) {
      doc.text('Due ' + invoice.dueDate, metaX, rightY, { align: 'right' });
      rightY += 5;
    }

    y = Math.max(leftY, rightY) + 10;

    doc.setDrawColor(...accentLine);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 14;

    // Bill To
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...inkFaint);
    doc.text('BILL TO', margin, y);
    y += 7;

    if (client) {
      if (client.name) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...inkDark);
        doc.text(client.name, margin, y);
        y += 6;
      }
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...inkMuted);
      if (client.email) {
        doc.text(client.email, margin, y);
        y += 5;
      }
      if (client.address) {
        const addrLines = doc.splitTextToSize(client.address, contentWidth * 0.5);
        addrLines.forEach(line => {
          doc.text(line, margin, y);
          y += 4.5;
        });
      }
      if (client.taxId) {
        doc.setFontSize(7.5);
        doc.setTextColor(...inkFaint);
        doc.text('Tax ID  ' + client.taxId, margin, y);
        y += 5;
      }
    }
    y += 14;

    // Line items table
    const colDesc = contentWidth * 0.44;
    const colQty = contentWidth * 0.14;
    const colRate = contentWidth * 0.21;
    const colX = [
      margin,
      margin + colDesc,
      margin + colDesc + colQty,
      margin + colDesc + colQty + colRate,
    ];

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...inkFaint);
    doc.text('ITEM', margin, y);
    doc.text('QTY', colX[1], y);
    doc.text('RATE', colX[2], y);
    doc.text('AMOUNT', pageWidth - margin, y, { align: 'right' });
    y += 3;

    doc.setDrawColor(...ruleMedium);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 7;

    const items = invoice.items || [];
    items.forEach(item => {
      if (y > pageHeight - 60) {
        doc.addPage();
        y = margin + 20;
      }
      const amount = (Number(item.qty) || 0) * (Number(item.rate) || 0);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...inkMedium);
      doc.text(item.description || '', margin, y);

      doc.setTextColor(...inkMuted);
      doc.text(String(item.qty || 0), colX[1], y);

      doc.text(settings.currency + Number(item.rate || 0).toFixed(2), colX[2], y);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...inkDark);
      doc.text(settings.currency + amount.toFixed(2), pageWidth - margin, y, { align: 'right' });

      y += 6;

      doc.setDrawColor(...ruleLight);
      doc.setLineWidth(0.15);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;
    });

    // Total
    y += 4;
    const subtotal = DataStore.calcInvoiceSubtotal(invoice);
    const taxRate = Number(invoice.taxRate) || 0;
    const taxLabel = invoice.taxLabel || 'Tax';
    const taxAmount = DataStore.calcInvoiceTax(invoice);
    const total = DataStore.calcInvoiceTotal(invoice);
    const totalW = 130;
    const totalX = pageWidth - margin - totalW;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...inkMuted);
    doc.text('Subtotal', totalX + 8, y + 3);
    doc.text(settings.currency + subtotal.toFixed(2), pageWidth - margin - 6, y + 3, { align: 'right' });
    y += 6;

    if (taxRate > 0) {
      doc.text(taxLabel + ' (' + taxRate + '%)', totalX + 8, y + 3);
      doc.text(settings.currency + taxAmount.toFixed(2), pageWidth - margin - 6, y + 3, { align: 'right' });
      y += 6;
    }

    y += 2;
    doc.setFillColor(...bgSubtle);
    doc.rect(totalX, y - 3, totalW, 16, 'F');

    doc.setFillColor(...accentLine);
    doc.rect(totalX, y - 3, 1.5, 16, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...inkMuted);
    doc.text('Total', totalX + 8, y + 6);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...inkDark);
    doc.text(settings.currency + total.toFixed(2), pageWidth - margin - 6, y + 7, { align: 'right' });

    y += 24;

    // Notes
    if (invoice.notes) {
      if (y > pageHeight - 40) {
        doc.addPage();
        y = margin;
      }

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...inkFaint);
      doc.text('NOTES', margin, y);
      y += 6;

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...inkMuted);
      const noteLines = doc.splitTextToSize(invoice.notes, contentWidth - 4);
      noteLines.forEach(line => {
        if (y > pageHeight - 20) { doc.addPage(); y = margin; }
        doc.text(line, margin, y);
        y += 4.5;
      });
      y += 8;
    }

    // Footer
    const footerY = pageHeight - 14;
    doc.setDrawColor(...ruleLight);
    doc.setLineWidth(0.2);
    doc.line(margin, footerY, pageWidth - margin, footerY);

    if (settings.company) {
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...inkFaint);
      doc.text(settings.company, pageWidth / 2, footerY + 6, { align: 'center' });
    }
  }
});
