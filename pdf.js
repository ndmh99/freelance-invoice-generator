const PDFHandler = {
  templates: {
    modern: {
      name: 'Modern',
      description: 'Clean design with dark header and status badges',
      render: (doc, invoice, client, settings) => {
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
      }
    },

    classic: {
      name: 'Classic',
      description: 'Traditional invoice with bordered tables and formal layout',
      render: (doc, invoice, client, settings) => {
        const margin = 25;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const contentWidth = pageWidth - margin * 2;
        let y = margin;

        // Top border line
        doc.setDrawColor(50, 50, 50);
        doc.setLineWidth(1);
        doc.line(margin, y, pageWidth - margin, y);
        y += 15;

        // Header
        doc.setFont('times', 'bold');
        doc.setFontSize(28);
        doc.setTextColor(30, 30, 30);
        doc.text('INVOICE', margin, y);
        y += 12;

        doc.setFont('times', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        if (settings.company) {
          doc.text(settings.company, margin, y);
          y += 5;
        }
        if (settings.email) {
          doc.text(settings.email, margin, y);
          y += 5;
        }
        if (settings.address) {
          const addrLines = doc.splitTextToSize(settings.address, contentWidth / 2);
          addrLines.forEach(line => {
            doc.text(line, margin, y);
            y += 5;
          });
        }
        y += 5;

        // Invoice details box (right side)
        const boxX = pageWidth - margin - 80;
        const boxY = margin + 10;
        doc.setDrawColor(100, 100, 100);
        doc.setLineWidth(0.3);
        doc.setFillColor(248, 248, 248);
        doc.rect(boxX, boxY, 80, 40, 'FD');

        doc.setFont('times', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(30, 30, 30);
        doc.text('Invoice No.', boxX + 5, boxY + 10);
        doc.text('Date', boxX + 5, boxY + 20);
        doc.text('Due Date', boxX + 5, boxY + 30);

        doc.setFont('times', 'normal');
        doc.text(invoice.number || '', boxX + 50, boxY + 10);
        doc.text(invoice.issueDate || '', boxX + 50, boxY + 20);
        doc.text(invoice.dueDate || '', boxX + 50, boxY + 30);

        y = Math.max(y, boxY + 50);

        // Bill To section
        doc.setDrawColor(50, 50, 50);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;

        doc.setFont('times', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);
        doc.text('Bill To:', margin, y);
        y += 7;

        doc.setFont('times', 'normal');
        doc.setFontSize(10);
        if (client) {
          if (client.name) { doc.text(client.name, margin, y); y += 5; }
          if (client.address) {
            const addrLines = doc.splitTextToSize(client.address, contentWidth / 2);
            addrLines.forEach(line => { doc.text(line, margin, y); y += 5; });
          }
          if (client.email) { doc.text(client.email, margin, y); y += 5; }
          if (client.taxId) { doc.text('Tax ID: ' + client.taxId, margin, y); y += 5; }
        }
        y += 10;

        // Table with borders
        const tableStartY = y;
        const colWidths = [contentWidth * 0.45, contentWidth * 0.15, contentWidth * 0.2, contentWidth * 0.2];
        const colX = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2]];

        // Table header
        doc.setFillColor(50, 50, 50);
        doc.rect(margin, y, contentWidth, 10, 'F');
        doc.setFont('times', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        y += 7;
        doc.text('DESCRIPTION', colX[0] + 3, y);
        doc.text('QTY', colX[1] + 3, y);
        doc.text('RATE', colX[2] + 3, y);
        doc.text('AMOUNT', colX[3] + colWidths[3] - 3, y, { align: 'right' });
        y += 6;

        // Table rows
        doc.setFont('times', 'normal');
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(9);
        const items = invoice.items || [];
        items.forEach((item, idx) => {
          if (y > pageHeight - 40) {
            doc.addPage();
            y = margin;
          }
          const amount = (Number(item.qty) || 0) * (Number(item.rate) || 0);
          doc.text(item.description || '', colX[0] + 3, y);
          doc.text(String(item.qty || 0), colX[1] + 3, y);
          doc.text(settings.currency + Number(item.rate || 0).toFixed(2), colX[2] + 3, y);
          doc.text(settings.currency + amount.toFixed(2), colX[3] + colWidths[3] - 3, y, { align: 'right' });
          y += 6;

          // Zebra striping
          if (idx % 2 === 0) {
            doc.setFillColor(245, 245, 245);
            doc.rect(margin, y - 6, contentWidth, 6, 'F');
          }

          // Row border
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.2);
          doc.line(margin, y - 1, pageWidth - margin, y - 1);
        });

        // Table bottom border
        doc.setDrawColor(50, 50, 50);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;

        // Total
        const total = DataStore.calcInvoiceTotal(invoice);
        doc.setFont('times', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(30, 30, 30);
        doc.text('Total:', pageWidth - margin - 60, y);
        doc.text(settings.currency + total.toFixed(2), pageWidth - margin, y, { align: 'right' });
        y += 20;

        // Notes
        if (invoice.notes) {
          if (y > pageHeight - 50) {
            doc.addPage();
            y = margin;
          }
          doc.setFont('times', 'bold');
          doc.setFontSize(10);
          doc.text('Notes:', margin, y);
          y += 6;
          doc.setFont('times', 'normal');
          doc.setFontSize(9);
          const noteLines = doc.splitTextToSize(invoice.notes, contentWidth);
          noteLines.forEach(line => {
            if (y > pageHeight - 20) { doc.addPage(); y = margin; }
            doc.text(line, margin, y);
            y += 5;
          });
        }

        // Footer with top line
        y = pageHeight - 25;
        doc.setDrawColor(50, 50, 50);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        doc.setFont('times', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(settings.company || 'Thank you for your business', pageWidth / 2, y + 8, { align: 'center' });
      }
    },

    minimal: {
      name: 'Minimal',
      description: 'Ultra-clean with lots of whitespace and subtle styling',
      render: (doc, invoice, client, settings) => {
        const margin = 30;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const contentWidth = pageWidth - margin * 2;
        let y = margin + 20;

        doc.setFont('helvetica');

        // Minimal header - just the word invoice
        doc.setFontSize(36);
        doc.setFont('helvetica', 'light');
        doc.setTextColor(200, 200, 200);
        doc.text('invoice', margin, y);
        y += 25;

        // Company info - small and clean
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120);
        if (settings.company) {
          doc.setTextColor(60, 60, 60);
          doc.setFont('helvetica', 'medium');
          doc.text(settings.company, margin, y);
          y += 4;
        }
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120);
        if (settings.email) {
          doc.text(settings.email, margin, y);
          y += 4;
        }
        if (settings.address) {
          const addrLines = doc.splitTextToSize(settings.address, 100);
          addrLines.forEach(line => {
            doc.text(line, margin, y);
            y += 4;
          });
        }
        y += 15;

        // Invoice details - right aligned, minimal
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Invoice ' + (invoice.number || ''), pageWidth - margin, margin + 20, { align: 'right' });
        doc.text(invoice.issueDate || '', pageWidth - margin, margin + 26, { align: 'right' });
        if (invoice.dueDate) {
          doc.text('Due ' + invoice.dueDate, pageWidth - margin, margin + 32, { align: 'right' });
        }

        // Client info
        if (client) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'medium');
          doc.setTextColor(60, 60, 60);
          if (client.name) {
            doc.text(client.name, margin, y);
            y += 4;
          }
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(120, 120, 120);
          if (client.address) {
            const addrLines = doc.splitTextToSize(client.address, 100);
            addrLines.forEach(line => {
              doc.text(line, margin, y);
              y += 4;
            });
          }
          if (client.email) {
            doc.text(client.email, margin, y);
            y += 4;
          }
        }
        y += 20;

        // Simple line items - no borders
        const items = invoice.items || [];
        doc.setFontSize(8);
        doc.setFont('helvetica', 'medium');
        doc.setTextColor(180, 180, 180);
        doc.text('ITEM', margin, y);
        doc.text('QTY', margin + contentWidth * 0.5, y);
        doc.text('RATE', margin + contentWidth * 0.65, y);
        doc.text('AMOUNT', margin + contentWidth, y, { align: 'right' });
        y += 3;

        // Subtle line
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;

        // Items
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        items.forEach(item => {
          if (y > pageHeight - 50) {
            doc.addPage();
            y = margin + 20;
          }
          const amount = (Number(item.qty) || 0) * (Number(item.rate) || 0);
          doc.text(item.description || '', margin, y);
          doc.text(String(item.qty || 0), margin + contentWidth * 0.5, y);
          doc.text(settings.currency + Number(item.rate || 0).toFixed(2), margin + contentWidth * 0.65, y);
          doc.text(settings.currency + amount.toFixed(2), margin + contentWidth, y, { align: 'right' });
          y += 10;
        });

        // Subtle line before total
        y += 5;
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(margin + contentWidth * 0.6, y, pageWidth - margin, y);
        y += 10;

        // Total - clean and prominent
        const total = DataStore.calcInvoiceTotal(invoice);
        doc.setFont('helvetica', 'medium');
        doc.setFontSize(14);
        doc.setTextColor(30, 30, 30);
        doc.text('Total', pageWidth - margin - 80, y + 2);
        doc.text(settings.currency + total.toFixed(2), pageWidth - margin, y + 2, { align: 'right' });

        // Notes at bottom
        if (invoice.notes) {
          y = pageHeight - 50;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          const noteLines = doc.splitTextToSize(invoice.notes, contentWidth);
          noteLines.forEach(line => {
            doc.text(line, margin, y);
            y += 4;
          });
        }
      }
    },

    bold: {
      name: 'Bold',
      description: 'Strong accent colors and modern business look',
      render: (doc, invoice, client, settings) => {
        const margin = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const contentWidth = pageWidth - margin * 2;
        const accentColor = [59, 130, 246]; // Blue accent
        let y = 0;

        // Header background
        doc.setFillColor(...accentColor);
        doc.rect(0, 0, pageWidth, 55, 'F');

        // Header content
        y = 20;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        doc.text(settings.company || 'INVOICE', margin, y);
        y += 10;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(220, 230, 250);
        if (settings.email) {
          doc.text(settings.email, margin, y);
          y += 4;
        }
        if (settings.address) {
          const addrLines = doc.splitTextToSize(settings.address, 150);
          addrLines.forEach(line => {
            doc.text(line, margin, y);
            y += 4;
          });
        }

        // Invoice number in header (right side)
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('INVOICE', pageWidth - margin, 20, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(18);
        doc.text(invoice.number || '', pageWidth - margin, 32, { align: 'right' });

        y = 65;

        // Status badge
        const statusColors = {
          draft: [147, 197, 253],
          sent: [252, 211, 77],
          paid: [134, 239, 172],
          overdue: [252, 165, 165],
        };
        const badgeColor = statusColors[invoice.status] || [209, 213, 219];
        doc.setFillColor(...badgeColor);
        const statusText = (invoice.status || 'DRAFT').toUpperCase();
        const statusWidth = doc.getTextWidth(statusText) + 12;
        doc.roundedRect(pageWidth - margin - statusWidth, y - 5, statusWidth, 10, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(30, 30, 30);
        doc.text(statusText, pageWidth - margin - 6, y + 2, { align: 'right' });

        // Dates
        y += 15;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        if (invoice.issueDate) {
          doc.text('Issued: ' + invoice.issueDate, margin, y);
        }
        if (invoice.dueDate) {
          doc.text('Due: ' + invoice.dueDate, pageWidth - margin, y, { align: 'right' });
        }
        y += 15;

        // Client section with accent bar
        doc.setFillColor(...accentColor);
        doc.rect(margin, y, 4, 25, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);
        doc.text('BILL TO', margin + 10, y + 5);
        y += 12;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        if (client) {
          if (client.name) { doc.text(client.name, margin + 10, y); y += 5; }
          if (client.email) { doc.text(client.email, margin + 10, y); y += 5; }
          if (client.address) {
            const addrLines = doc.splitTextToSize(client.address, contentWidth / 2);
            addrLines.forEach(line => { doc.text(line, margin + 10, y); y += 4; });
          }
        }
        y += 15;

        // Items table
        const colWidths = [contentWidth * 0.45, contentWidth * 0.15, contentWidth * 0.2, contentWidth * 0.2];
        const colX = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2]];

        // Table header with accent color
        doc.setFillColor(...accentColor);
        doc.rect(margin, y, contentWidth, 10, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        y += 7;
        doc.text('DESCRIPTION', colX[0] + 3, y);
        doc.text('QTY', colX[1] + 3, y);
        doc.text('RATE', colX[2] + 3, y);
        doc.text('AMOUNT', colX[3] + colWidths[3] - 3, y, { align: 'right' });
        y += 8;

        // Table rows
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 40, 40);
        doc.setFontSize(9);
        const items = invoice.items || [];
        items.forEach((item, idx) => {
          if (y > pageHeight - 50) {
            doc.addPage();
            y = margin;
          }
          const amount = (Number(item.qty) || 0) * (Number(item.rate) || 0);

          // Alternating row colors
          if (idx % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, y - 4, contentWidth, 8, 'F');
          }

          doc.text(item.description || '', colX[0] + 3, y);
          doc.text(String(item.qty || 0), colX[1] + 3, y);
          doc.text(settings.currency + Number(item.rate || 0).toFixed(2), colX[2] + 3, y);
          doc.text(settings.currency + amount.toFixed(2), colX[3] + colWidths[3] - 3, y, { align: 'right' });
          y += 8;
        });

        // Total section with accent background
        y += 5;
        const total = DataStore.calcInvoiceTotal(invoice);
        doc.setFillColor(248, 250, 252);
        doc.rect(pageWidth - margin - 120, y - 5, 120, 20, 'F');
        doc.setFillColor(...accentColor);
        doc.rect(pageWidth - margin - 120, y - 5, 4, 20, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text('TOTAL', pageWidth - margin - 100, y + 4);
        doc.setFontSize(14);
        doc.setTextColor(30, 30, 30);
        doc.text(settings.currency + total.toFixed(2), pageWidth - margin - 5, y + 4, { align: 'right' });

        // Notes
        if (invoice.notes) {
          y += 35;
          if (y > pageHeight - 50) {
            doc.addPage();
            y = margin;
          }
          doc.setFillColor(...accentColor);
          doc.rect(margin, y, 4, 12, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(30, 30, 30);
          doc.text('NOTES', margin + 10, y + 8);
          y += 15;
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(80, 80, 80);
          const noteLines = doc.splitTextToSize(invoice.notes, contentWidth - 10);
          noteLines.forEach(line => {
            if (y > pageHeight - 20) { doc.addPage(); y = margin; }
            doc.text(line, margin + 10, y);
            y += 4;
          });
        }

        // Footer
        doc.setFillColor(248, 250, 252);
        doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
        doc.setFillColor(...accentColor);
        doc.rect(0, pageHeight - 20, pageWidth, 2, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text(settings.company || '', pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
    }
  },

  getTemplateList() {
    return Object.entries(this.templates).map(([id, template]) => ({
      id,
      name: template.name,
      description: template.description
    }));
  },

  async exportInvoice(invoice, client, settings, templateId = 'modern') {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const template = this.templates[templateId] || this.templates.modern;
    template.render(doc, invoice, client, settings);

    doc.save(invoice.number + '.pdf');
  },

  async generatePreview(invoice, client, settings, templateId) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const template = this.templates[templateId] || this.templates.modern;
    template.render(doc, invoice, client, settings);

    return doc.output('datauristring');
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

    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) info.email = emailMatch[0];

    const phoneMatch = text.match(/(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) info.phone = phoneMatch[0];

    const taxMatch = text.match(/(?:Tax\s*(?:ID|No|Number)|VAT|GST|ABN)[:\s]*([A-Z0-9][A-Z0-9\s-]{5,20})/i);
    if (taxMatch) info.taxId = taxMatch[1].trim();

    const billToMatch = text.match(/(?:Bill\s*To|Client|Customer|Sold\s*To)[:\s]*\n?([^\n]+)/i);
    if (billToMatch) {
      const name = billToMatch[1].trim();
      if (name.length > 1 && name.length < 100 && !name.includes('@')) {
        info.name = name;
      }
    }

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
