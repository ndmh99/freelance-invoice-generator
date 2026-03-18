// Modern Template - Clean design with dark header and status badges
PDFHandler.registerTemplate('modern', {
  name: 'Modern',
  description: 'Clean design with dark header and status badges',
  render: (doc, invoice, client, settings) => {
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    doc.setFont('helvetica');

    // Header
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.company || 'INVOICE', margin, y + 8);
    y += 14;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    if (settings.email) {
      doc.text(settings.email, margin, y);
      y += 4;
    }
    if (settings.address) {
      const addrLines = doc.splitTextToSize(settings.address, contentWidth / 2);
      addrLines.forEach(line => {
        doc.text(line, margin, y);
        y += 4;
      });
    }
    y += 4;

    // Invoice details
    let metaY = margin;
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth - margin, metaY, { align: 'right' });
    metaY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(invoice.number || '', pageWidth - margin, metaY, { align: 'right' });
    metaY += 12;

    const statusColors = {
      draft: [96, 165, 250],
      sent: [251, 191, 36],
      paid: [74, 222, 128],
      overdue: [248, 113, 113],
    };
    const statusColor = statusColors[invoice.status] || [100, 100, 100];
    doc.setTextColor(...statusColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text((invoice.status || 'DRAFT').toUpperCase(), pageWidth - margin, metaY, { align: 'right' });
    metaY += 8;

    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (invoice.issueDate) {
      doc.text('Issue: ' + invoice.issueDate, pageWidth - margin, metaY, { align: 'right' });
      metaY += 4;
    }
    if (invoice.dueDate) {
      doc.text('Due: ' + invoice.dueDate, pageWidth - margin, metaY, { align: 'right' });
      metaY += 4;
    }
    y = Math.max(y, metaY + 8);

    doc.setDrawColor(220);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Bill To
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100);
    doc.text('BILL TO:', margin, y);
    y += 5;
    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    if (client) {
      doc.text(client.name || '', margin, y);
      y += 5;
      if (client.email) { doc.text(client.email, margin, y); y += 5; }
      if (client.address) {
        const addrLines = doc.splitTextToSize(client.address, contentWidth / 2);
        addrLines.forEach(line => { doc.text(line, margin, y); y += 4; });
      }
      if (client.taxId) { doc.text('Tax ID: ' + client.taxId, margin, y); y += 5; }
    }
    y += 8;

    // Line items table
    const colWidths = [contentWidth * 0.46, contentWidth * 0.14, contentWidth * 0.2, contentWidth * 0.2];
    const colX = [margin + 4, margin + colWidths[0] + 4, margin + colWidths[0] + colWidths[1] + 4, margin + contentWidth * 0.8 - 4];

    doc.setFillColor(26, 26, 46);
    doc.rect(margin, y - 4, contentWidth, 8, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    y += 2;
    doc.text('DESCRIPTION', colX[0], y);
    doc.text('QTY', colX[1], y);
    doc.text('RATE', colX[2], y);
    doc.text('AMOUNT', colX[3] + colWidths[3], y, { align: 'right' });
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40);
    doc.setFontSize(9);
    const items = invoice.items || [];
    items.forEach(item => {
      if (y > pageHeight - 40) {
        doc.addPage();
        y = margin;
      }
      const amount = (Number(item.qty) || 0) * (Number(item.rate) || 0);
      doc.text(item.description || '', colX[0], y);
      doc.text(String(item.qty || 0), colX[1]+1, y);
      doc.text(settings.currency + Number(item.rate || 0).toFixed(2), colX[2], y);
      doc.text(settings.currency + amount.toFixed(2), colX[3] + colWidths[3], y, { align: 'right' });
      y += 6;
      doc.setDrawColor(230);
      doc.setLineWidth(0.2);
      doc.line(margin, y - 2, pageWidth - margin, y - 2);
    });

    // Total
    y += 4;
    const subtotal = DataStore.calcInvoiceSubtotal(invoice);
    const taxRate = Number(invoice.taxRate) || 0;
    const taxLabel = invoice.taxLabel || 'Tax';
    const taxAmount = DataStore.calcInvoiceTax(invoice);
    const total = DataStore.calcInvoiceTotal(invoice);
    const summaryW = colWidths[2] + colWidths[3] + 10;
    const summaryX = pageWidth - margin - summaryW;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text('Subtotal', pageWidth - margin - colWidths[3] - 22, y + 2.5, { align: 'right' });
    doc.text(settings.currency + subtotal.toFixed(2), pageWidth - margin - 8, y + 2.5, { align: 'right' });
    y += 6;

    if (taxRate > 0) {
      doc.text(taxLabel + ' (' + taxRate + '%)', pageWidth - margin - colWidths[3] - 22, y + 2.5, { align: 'right' });
      doc.text(settings.currency + taxAmount.toFixed(2), pageWidth - margin - 8, y + 2.5, { align: 'right' });
      y += 6;
    }

    y += 2;
    doc.setFillColor(245, 245, 250);
    doc.rect(summaryX, y - 4, summaryW, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text('TOTAL DUE', pageWidth - margin - colWidths[3] - 18, y + 2.5, { align: 'right' });
    doc.text(settings.currency + total.toFixed(2), pageWidth - margin - 8, y + 2.5, { align: 'right' });
    y += 16;

    // Notes
    if (invoice.notes) {
      if (y > pageHeight - 40) {
        doc.addPage();
        y = margin;
      }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100);
      doc.text('NOTES', margin, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60);
      const noteLines = doc.splitTextToSize(invoice.notes, contentWidth);
      noteLines.forEach(line => {
        if (y > pageHeight - 20) { doc.addPage(); y = margin; }
        doc.text(line, margin, y);
        y += 4;
      });
    }

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(
      settings.company || '',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
});
