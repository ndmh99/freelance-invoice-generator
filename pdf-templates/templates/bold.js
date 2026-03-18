// Bold Template - Deep charcoal + warm amber accent with refined hierarchy
PDFHandler.registerTemplate('bold', {
  name: 'Bold',
  description: 'Deep charcoal + warm amber accent with refined hierarchy',
  render: (doc, invoice, client, settings) => {
    const margin = 24;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;

    const charcoal   = [30, 41, 59];
    const deepNavy   = [15, 23, 42];
    const warmAmber  = [180, 83, 9];
    const textPrimary   = [30, 30, 30];
    const textSecondary = [71, 85, 105];
    const textMuted     = [148, 163, 184];
    const tableHeader   = [248, 250, 252];
    const hairline      = [226, 232, 240];
    const subtleBg      = [241, 245, 249];

    const statusColors = {
      draft:   [100, 116, 139],
      sent:    [180, 83, 9],
      paid:    [22, 163, 74],
      overdue: [220, 38, 38],
    };

    let y = margin;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(...charcoal);
    doc.text(settings.company || 'INVOICE', margin, y + 8);
    y += 18;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textMuted);
    if (settings.email) {
      doc.text(settings.email, margin, y);
      y += 4;
    }
    if (settings.address) {
      const addrLines = doc.splitTextToSize(settings.address, contentWidth * 0.45);
      addrLines.forEach(line => {
        doc.text(line, margin, y);
        y += 3.5;
      });
    }

    // Invoice details
    const metaTop = margin;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textMuted);
    doc.text('INVOICE', pageWidth - margin, metaTop + 2, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...deepNavy);
    doc.text(invoice.number || '', pageWidth - margin, metaTop + 14, { align: 'right' });

    const statusText = (invoice.status || 'DRAFT').toUpperCase();
    const sColor = statusColors[invoice.status] || textMuted;
    const sw = doc.getTextWidth(statusText) + 10;
    const sx = pageWidth - margin - sw;
    const sy = metaTop + 19;
    doc.setFillColor(...sColor);
    doc.roundedRect(sx, sy, sw, 9, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(statusText, sx + sw / 2, sy + 5.6, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textSecondary);
    let dy = sy + 17;
    if (invoice.issueDate) {
      doc.text('Issued  ' + invoice.issueDate, pageWidth - margin, dy, { align: 'right' });
      dy += 4.5;
    }
    if (invoice.dueDate) {
      doc.text('Due  ' + invoice.dueDate, pageWidth - margin, dy, { align: 'right' });
    }

    y = Math.max(y, dy + 6);

    doc.setDrawColor(...warmAmber);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;

    // Bill To
    doc.setFillColor(...warmAmber);
    doc.circle(margin + 2.5, y - 1.5, 1.8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...textMuted);
    doc.text('BILL TO', margin + 8, y);
    y += 6;

    doc.setTextColor(...textPrimary);
    if (client) {
      if (client.name) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(client.name, margin, y);
        y += 5;
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...textSecondary);
      if (client.email) { doc.text(client.email, margin, y); y += 4; }
      if (client.address) {
        const addrLines = doc.splitTextToSize(client.address, contentWidth * 0.4);
        addrLines.forEach(line => { doc.text(line, margin, y); y += 3.8; });
      }
      if (client.taxId) {
        doc.setTextColor(...textMuted);
        doc.setFontSize(7.5);
        doc.text('Tax ID: ' + client.taxId, margin, y);
        y += 4;
      }
    }
    y += 10;

    // Line items table
    const colWidths = [
      contentWidth * 0.44,
      contentWidth * 0.14,
      contentWidth * 0.21,
      contentWidth * 0.21,
    ];
    const colX = [
      margin,
      margin + colWidths[0],
      margin + colWidths[0] + colWidths[1],
      margin + colWidths[0] + colWidths[1] + colWidths[2],
    ];

    doc.setFillColor(...tableHeader);
    doc.rect(margin, y, contentWidth, 11, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...textMuted);
    const headerY = y + 7.5;
    doc.text('DESCRIPTION', colX[0] + 4, headerY);
    doc.text('QTY', colX[1] + 4, headerY);
    doc.text('RATE', colX[2] + 4, headerY);
    doc.text('AMOUNT', colX[3] + colWidths[3] - 4, headerY, { align: 'right' });
    y += 11;

    doc.setDrawColor(...hairline);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 2;

    const items = invoice.items || [];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    items.forEach((item) => {
      if (y > pageHeight - 45) {
        doc.addPage();
        y = margin;
      }
      const amount = (Number(item.qty) || 0) * (Number(item.rate) || 0);
      const rowY = y + 6;
      doc.setTextColor(...textPrimary);
      doc.text(item.description || '', colX[0] + 4, rowY);
      doc.setTextColor(...textSecondary);
      doc.text(String(item.qty || 0), colX[1] + 4, rowY);
      doc.text(settings.currency + Number(item.rate || 0).toFixed(2), colX[2] + 4, rowY);
      doc.setTextColor(...textPrimary);
      doc.setFont('helvetica', 'bold');
      doc.text(settings.currency + amount.toFixed(2), colX[3] + colWidths[3] - 4, rowY, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      y += 10;
      doc.setDrawColor(...hairline);
      doc.setLineWidth(0.15);
      doc.line(margin, y, pageWidth - margin, y);
    });

    doc.setDrawColor(...charcoal);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 14;

    // Total
    const subtotal = DataStore.calcInvoiceSubtotal(invoice);
    const taxRate = Number(invoice.taxRate) || 0;
    const taxLabel = invoice.taxLabel || 'Tax';
    const taxAmount = DataStore.calcInvoiceTax(invoice);
    const total = DataStore.calcInvoiceTotal(invoice);
    const totalBoxW = 110;
    const totalBoxX = pageWidth - margin - totalBoxW;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textMuted);
    doc.text('Subtotal', totalBoxX + 14, y + 2);
    doc.text(settings.currency + subtotal.toFixed(2), pageWidth - margin - 8, y + 2, { align: 'right' });
    y += 6;

    if (taxRate > 0) {
      doc.text(taxLabel + ' (' + taxRate + '%)', totalBoxX + 14, y + 2);
      doc.text(settings.currency + taxAmount.toFixed(2), pageWidth - margin - 8, y + 2, { align: 'right' });
      y += 6;
    }

    y += 2;
    const totalBoxH = 14;
    doc.setFillColor(...subtleBg);
    doc.rect(totalBoxX, y - 4, totalBoxW, totalBoxH, 'F');
    doc.setFillColor(...warmAmber);
    doc.rect(totalBoxX, y - 4, 1, totalBoxH, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...textSecondary);
    doc.text('TOTAL DUE', totalBoxX + 14, y + 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...deepNavy);
    doc.text(settings.currency + total.toFixed(2), pageWidth - margin - 8, y + 5, { align: 'right' });

    y += totalBoxH + 10;

    // Notes
    if (invoice.notes) {
      if (y > pageHeight - 40) {
        doc.addPage();
        y = margin;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...textMuted);
      doc.text('Notes', margin, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...textSecondary);
      const noteLines = doc.splitTextToSize(invoice.notes, contentWidth);
      noteLines.forEach(line => {
        if (y > pageHeight - 20) { doc.addPage(); y = margin; }
        doc.text(line, margin, y);
        y += 4;
      });
    }

    // Footer
    const footerY = pageHeight - 16;
    doc.setDrawColor(...hairline);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY, pageWidth - margin, footerY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...textMuted);
    doc.text(settings.company || '', pageWidth / 2, footerY + 6, { align: 'center' });
  }
});
