/**
 * PDFHandler - Template Registry Pattern for PDF Generation
 * 
 * @open-closed-principle
 * This module is OPEN for extension (new templates) but CLOSED for modification.
 * 
 * Templates are loaded from pdf-templates/ folder via script tags in index.html.
 * To add a new template:
 * 1. Create a new file in pdf-templates/ folder (e.g., 'my-template.js')
 * 2. Call PDFHandler.registerTemplate('my-template', { name: '...', description: '...', render: (doc, invoice, client, settings) => {...} })
 * 3. Add a script tag in index.html: <script src="pdf-templates/my-template.js"></script>
 */

const PDFHandler = {
  templates: {},

  registerTemplate(id, template) {
    if (!id || !template) {
      console.error('PDFHandler.registerTemplate: id and template are required');
      return;
    }
    if (!template.name || !template.render) {
      console.error('PDFHandler.registerTemplate: template must have name and render function');
      return;
    }
    if (typeof template.render !== 'function') {
      console.error('PDFHandler.registerTemplate: template.render must be a function');
      return;
    }
    this.templates[id] = template;
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
    if (!template) {
      console.error(`Template "${templateId}" not found, and default "modern" template not available`);
      return;
    }
    template.render(doc, invoice, client, settings);

    doc.save(invoice.number + '.pdf');
  },

  async generatePreview(invoice, client, settings, templateId) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const template = this.templates[templateId] || this.templates.modern;
    if (!template) {
      console.error(`Template "${templateId}" not found for preview`);
      return '';
    }
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

// Templates are loaded from pdf-templates/ folder via script tags in index.html
