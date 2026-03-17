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

        // Divider
        doc.setDrawColor(220);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;

        // Client info
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

        // Table header
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
        const total = DataStore.calcInvoiceTotal(invoice);
        doc.setFillColor(245, 245, 250);
        doc.rect(pageWidth - margin - colWidths[2] - colWidths[3] - 10, y - 4, colWidths[2] + colWidths[3] + 10, 10, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.text('TOTAL', pageWidth - margin - colWidths[3] - 22, y + 2.5, { align: 'right' });
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

        // Professional color palette
        const darkNavy   = [33, 41, 61];
        const charcoal   = [55, 55, 65];
        const textDark   = [40, 40, 50];
        const textMedium = [85, 85, 95];
        const textLight  = [130, 130, 140];
        const borderDark = [60, 60, 75];
        const borderLight = [200, 200, 210];
        const subtleBg   = [248, 248, 252];
        const tableHeader = [48, 48, 65];
        const rowAlt     = [250, 250, 253];

        const statusColors = {
          draft:   [130, 130, 145],
          sent:    [60, 100, 160],
          paid:    [45, 135, 75],
          overdue: [180, 55, 55],
        };

        // Top accent line (thick navy bar)
        doc.setFillColor(...darkNavy);
        doc.rect(margin, y, contentWidth, 2.5, 'F');
        y += 14;

        // Header - Invoice title with elegant spacing
        doc.setFont('times', 'bold');
        doc.setFontSize(32);
        doc.setTextColor(...darkNavy);
        doc.text('INVOICE', margin, y);
        y += 4;

        // Thin decorative rule under title
        doc.setDrawColor(...darkNavy);
        doc.setLineWidth(0.6);
        doc.line(margin, y, margin + 45, y);
        y += 12;

        // Company information
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

        // Invoice details panel (right side) - elegant bordered box
        const boxW = 90;
        const boxX = pageWidth - margin - boxW;
        const boxY = margin + 12;
        
        // Box background and border
        doc.setFillColor(...subtleBg);
        doc.setDrawColor(...borderLight);
        doc.setLineWidth(0.4);
        doc.rect(boxX, boxY, boxW, 48, 'FD');
        
        // Left accent bar on the box
        doc.setFillColor(...darkNavy);
        doc.rect(boxX, boxY, 2, 48, 'F');

        // Invoice number (prominent)
        doc.setFont('times', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...textLight);
        doc.text('INVOICE NUMBER', boxX + 10, boxY + 10);
        doc.setFont('times', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...textDark);
        doc.text(invoice.number || '', boxX + 10, boxY + 18);

        // Separator
        doc.setDrawColor(...borderLight);
        doc.setLineWidth(0.3);
        doc.line(boxX + 10, boxY + 23, boxX + boxW - 8, boxY + 23);

        // Dates
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

        // Status badge
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

        // Horizontal rule
        doc.setDrawColor(...borderLight);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;

        // Bill To section
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

        // Table with professional styling
        const colWidths = [contentWidth * 0.44, contentWidth * 0.14, contentWidth * 0.21, contentWidth * 0.21];
        const colX = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2]];

        // Table header with navy background
        doc.setFillColor(...tableHeader);
        doc.rect(margin, y, contentWidth, 12, 'F');
        
        // Subtle inner highlight on header
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

        // Table rows
        doc.setFont('times', 'normal');
        doc.setTextColor(...textDark);
        doc.setFontSize(9.5);
        const items = invoice.items || [];
        items.forEach((item, idx) => {
          if (y > pageHeight - 50) {
            doc.addPage();
            y = margin;
          }

          // Alternating row background
          if (idx % 2 === 0) {
            doc.setFillColor(...rowAlt);
            doc.rect(margin, y, contentWidth, 10, 'F');
          }

          const amount = (Number(item.qty) || 0) * (Number(item.rate) || 0);
          const rowMidY = y + 7;
          
          // Description
          doc.setTextColor(...textDark);
          doc.text(item.description || '', colX[0] + 5, rowMidY);
          
          // Quantity
          doc.setTextColor(...textMedium);
          doc.text(String(item.qty || 0), colX[1] + 5, rowMidY);
          
          // Rate
          doc.text(settings.currency + Number(item.rate || 0).toFixed(2), colX[2] + 5, rowMidY);
          
          // Amount (bold)
          doc.setFont('times', 'bold');
          doc.setTextColor(...textDark);
          doc.text(settings.currency + amount.toFixed(2), colX[3] + colWidths[3] - 5, rowMidY, { align: 'right' });
          doc.setFont('times', 'normal');
          
          y += 10;

          // Subtle row separator
          doc.setDrawColor(230, 230, 238);
          doc.setLineWidth(0.2);
          doc.line(margin, y, pageWidth - margin, y);
        });

        // Table bottom border (thicker)
        doc.setDrawColor(...borderDark);
        doc.setLineWidth(0.6);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;

        // Summary section
        const summaryBoxW = 120;
        const summaryBoxX = pageWidth - margin - summaryBoxW;

        // Subtotal
        const total = DataStore.calcInvoiceTotal(invoice);
        doc.setFont('times', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...textMedium);
        doc.text('Subtotal', summaryBoxX + 10, y + 3);
        doc.text(settings.currency + total.toFixed(2), pageWidth - margin - 5, y + 3, { align: 'right' });
        y += 8;

        // Thin separator
        doc.setDrawColor(...borderLight);
        doc.setLineWidth(0.3);
        doc.line(summaryBoxX + 10, y, pageWidth - margin - 5, y);
        y += 8;

        // Total box with accent
        const totalBoxH = 16;
        doc.setFillColor(...subtleBg);
        doc.setDrawColor(...borderLight);
        doc.setLineWidth(0.4);
        doc.rect(summaryBoxX, y - 3, summaryBoxW, totalBoxH, 'FD');
        
        // Left accent bar
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

        // Notes section
        if (invoice.notes) {
          if (y > pageHeight - 55) {
            doc.addPage();
            y = margin;
          }
          
          // Notes header with subtle background
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
        
        // Footer separator
        doc.setDrawColor(...borderLight);
        doc.setLineWidth(0.4);
        doc.line(margin, footerY, pageWidth - margin, footerY);
        
        // Thank you message
        doc.setFont('times', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(...textLight);
        doc.text('Thank you for your business', pageWidth / 2, footerY + 6, { align: 'center' });
        
        // Company name in footer
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

        const total = DataStore.calcInvoiceTotal(invoice);
        const totalBoxW = 110;
        const totalBoxX = pageWidth - margin - totalBoxW;
        const totalBoxH = 14;

        doc.setFillColor(...subtleBg);
        doc.rect(totalBoxX, y - 4, totalBoxW, totalBoxH, 'F');
        doc.setFillColor(...warmAmber);
        doc.rect(totalBoxX, y - 4, 1, totalBoxH, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...textSecondary);
        doc.text('TOTAL', totalBoxX + 14, y + 5);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.setTextColor(...deepNavy);
        doc.text(settings.currency + total.toFixed(2), pageWidth - margin - 8, y + 5, { align: 'right' });

        y += totalBoxH + 10;

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
