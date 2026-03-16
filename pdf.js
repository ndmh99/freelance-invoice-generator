const PDFHandler = {
  async exportInvoice(invoice, client, settings) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    doc.setFont('helvetica');

    // Header - Company info
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

    // Invoice meta - right side
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

    // Status with color
    const statusColors = {
      draft: [96, 165, 250],
      sent: [251, 191, 36],
      paid: [74, 222, 128],
      overdue: [248, 113, 113],
    };
    const statusColor = statusColors[invoice.status] || [100, 100, 100];
    doc.setTextColor(...statusColor);
    doc.setFontSize(10);
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

    // Divider
    doc.setDrawColor(220);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Client info
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100);
    doc.text('BILL TO', margin, y);
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
    const colX = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + contentWidth * 0.8];

    // Table header
    doc.setFillColor(26, 26, 46);
    doc.rect(margin, y - 4, contentWidth, 8, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(160, 160, 184);
    y += 2;
    doc.text('DESCRIPTION', colX[0], y);
    doc.text('QTY', colX[1], y);
    doc.text('RATE', colX[2], y);
    doc.text('AMOUNT', colX[3] + colWidths[3], y, { align: 'right' });
    y += 6;

    // Table rows
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
      doc.text(String(item.qty || 0), colX[1], y);
      doc.text(settings.currency + Number(item.rate || 0).toFixed(2), colX[2], y);
      doc.text(settings.currency + amount.toFixed(2), colX[3] + colWidths[3], y, { align: 'right' });
      y += 6;
      // Light separator
      doc.setDrawColor(230);
      doc.setLineWidth(0.2);
      doc.line(margin, y - 2, pageWidth - margin, y - 2);
    });

    // Total
    y += 4;
    const total = DataStore.calcInvoiceTotal(invoice);
    doc.setFillColor(245, 245, 250);
    doc.rect(pageWidth - margin - colWidths[2] - colWidths[3] - 10, y - 4, colWidths[2] + colWidths[3] + 10, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text('TOTAL', pageWidth - margin - colWidths[3] - 5, y + 2, { align: 'right' });
    doc.text(settings.currency + total.toFixed(2), pageWidth - margin, y + 2, { align: 'right' });
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

    doc.save(invoice.number + '.pdf');
  },

  async parsePDF(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const typedArray = new Uint8Array(e.target.result);
          const pdf = await pdfjsLib.getDocument(typedArray).promise;
          let fullText = '';

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
          }

          resolve(this.extractClientInfo(fullText));
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  },

  extractClientInfo(text) {
    const info = { name: '', email: '', phone: '', address: '', taxId: '' };

    // Extract email
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) info.email = emailMatch[0];

    // Extract phone
    const phoneMatch = text.match(/(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) info.phone = phoneMatch[0];

    // Extract tax ID / VAT
    const taxMatch = text.match(/(?:Tax\s*(?:ID|No|Number)|VAT|GST|ABN)[:\s]*([A-Z0-9][A-Z0-9\s-]{5,20})/i);
    if (taxMatch) info.taxId = taxMatch[1].trim();

    // Try to find client name (heuristic: look for "Bill To", "Client", "Customer" sections)
    const billToMatch = text.match(/(?:Bill\s*To|Client|Customer|Sold\s*To)[:\s]*\n?([^\n]+)/i);
    if (billToMatch) {
      const name = billToMatch[1].trim();
      if (name.length > 1 && name.length < 100 && !name.includes('@')) {
        info.name = name;
      }
    }

    // Extract address (heuristic: multi-line text after name)
    const addressPatterns = [
      /(?:Bill\s*To|Client|Customer)[^\n]*\n([^\n]+(?:\n[^\n]+){0,3})/i,
      /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Place|Pl)[^\n]*/i,
    ];
    for (const pattern of addressPatterns) {
      const match = text.match(pattern);
      if (match) {
        info.address = match[1] ? match[1].trim().replace(/\s+/g, ' ') : match[0].trim();
        break;
      }
    }

    return info;
  },
};