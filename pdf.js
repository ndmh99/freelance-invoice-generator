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

        // Invoice details
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
        doc.text(invoice.issueDate || '—', boxX + 10, boxY + 37);

        doc.setFont('times', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...textLight);
        doc.text('DUE DATE', boxX + 48, boxY + 30);
        doc.setFont('times', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...textDark);
        doc.text(invoice.dueDate || '—', boxX + 48, boxY + 37);

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
    },

    minimal: {
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
    },

    bold: {
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
