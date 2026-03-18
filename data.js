const DataStore = {
  KEYS: {
    SETTINGS: 'invoicegen_settings',
    CLIENTS: 'invoicegen_clients',
    INVOICES: 'invoicegen_invoices',
    TEMPLATES: 'invoicegen_templates',
    COUNTER: 'invoicegen_counter',
  },

  defaults: {
    settings: {
      company: '',
      email: '',
      address: '',
      currency: '$',
      prefix: 'INV-',
      counter: 1,
      pdfTemplate: '',
      taxRate: 0,
      taxLabel: 'Tax',
    },
    clients: [],
    invoices: [],
    templates: [],
  },

  get(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage write failed:', e);
      return false;
    }
  },

  getSettings() {
    return { ...this.defaults.settings, ...this.get(this.KEYS.SETTINGS) };
  },

  saveSettings(settings) {
    return this.set(this.KEYS.SETTINGS, settings);
  },

  getClients() {
    return this.get(this.KEYS.CLIENTS) || [...this.defaults.clients];
  },

  saveClients(clients) {
    return this.set(this.KEYS.CLIENTS, clients);
  },

  getClient(id) {
    return this.getClients().find(c => c.id === id) || null;
  },

  addClient(client) {
    const clients = this.getClients();
    client.id = this.generateId();
    client.createdAt = new Date().toISOString();
    clients.push(client);
    this.saveClients(clients);
    return client;
  },

  updateClient(id, updates) {
    const clients = this.getClients();
    const idx = clients.findIndex(c => c.id === id);
    if (idx === -1) return null;
    clients[idx] = { ...clients[idx], ...updates, updatedAt: new Date().toISOString() };
    this.saveClients(clients);
    return clients[idx];
  },

  deleteClient(id) {
    const clients = this.getClients().filter(c => c.id !== id);
    this.saveClients(clients);
  },

  getInvoices() {
    return this.get(this.KEYS.INVOICES) || [...this.defaults.invoices];
  },

  saveInvoices(invoices) {
    return this.set(this.KEYS.INVOICES, invoices);
  },

  getInvoice(id) {
    return this.getInvoices().find(i => i.id === id) || null;
  },

  addInvoice(invoice) {
    const invoices = this.getInvoices();
    const settings = this.getSettings();
    invoice.id = this.generateId();
    invoice.number = settings.prefix + settings.counter;
    invoice.createdAt = new Date().toISOString();
    invoices.push(invoice);
    this.saveInvoices(invoices);
    settings.counter++;
    this.saveSettings(settings);
    return invoice;
  },

  updateInvoice(id, updates) {
    const invoices = this.getInvoices();
    const idx = invoices.findIndex(i => i.id === id);
    if (idx === -1) return null;
    invoices[idx] = { ...invoices[idx], ...updates, updatedAt: new Date().toISOString() };
    this.saveInvoices(invoices);
    return invoices[idx];
  },

  deleteInvoice(id) {
    const invoices = this.getInvoices().filter(i => i.id !== id);
    this.saveInvoices(invoices);
  },

  getNextInvoiceNumber() {
    const settings = this.getSettings();
    return settings.prefix + settings.counter;
  },

  getTemplates() {
    return this.get(this.KEYS.TEMPLATES) || [...this.defaults.templates];
  },

  saveTemplates(templates) {
    return this.set(this.KEYS.TEMPLATES, templates);
  },

  getTemplate(id) {
    return this.getTemplates().find(t => t.id === id) || null;
  },

  addTemplate(template) {
    const templates = this.getTemplates();
    template.id = this.generateId();
    template.createdAt = new Date().toISOString();
    templates.push(template);
    this.saveTemplates(templates);
    return template;
  },

  updateTemplate(id, updates) {
    const templates = this.getTemplates();
    const idx = templates.findIndex(t => t.id === id);
    if (idx === -1) return null;
    templates[idx] = { ...templates[idx], ...updates, updatedAt: new Date().toISOString() };
    this.saveTemplates(templates);
    return templates[idx];
  },

  deleteTemplate(id) {
    const templates = this.getTemplates().filter(t => t.id !== id);
    this.saveTemplates(templates);
  },

  exportAll() {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      clients: this.getClients(),
      invoices: this.getInvoices(),
      templates: this.getTemplates(),
    };
  },

  importAll(data) {
    if (!data || data.version !== 1) {
      throw new Error('Invalid data format');
    }
    if (data.settings) this.saveSettings(data.settings);
    if (data.clients) this.saveClients(data.clients);
    if (data.invoices) this.saveInvoices(data.invoices);
    if (data.templates) this.saveTemplates(data.templates);
  },

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },

  calcInvoiceSubtotal(invoice) {
    const items = invoice.items || [];
    return items.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.rate) || 0), 0);
  },

  calcInvoiceTax(invoice) {
    const subtotal = this.calcInvoiceSubtotal(invoice);
    const rate = Number(invoice.taxRate) || 0;
    return subtotal * rate / 100;
  },

  calcInvoiceTotal(invoice) {
    return this.calcInvoiceSubtotal(invoice) + this.calcInvoiceTax(invoice);
  },

  formatCurrency(amount, settings) {
    const s = settings || this.getSettings();
    return s.currency + Number(amount).toFixed(2);
  },

  getStats() {
    const invoices = this.getInvoices();
    const today = new Date().toISOString().split('T')[0];
    let revenue = 0, outstanding = 0, overdue = 0;

    invoices.forEach(inv => {
      const total = this.calcInvoiceTotal(inv);
      if (inv.status === 'paid') {
        revenue += total;
      } else if (inv.status === 'sent') {
        if (inv.dueDate && inv.dueDate < today) {
          overdue += total;
        } else {
          outstanding += total;
        }
      } else if (inv.status === 'overdue') {
        overdue += total;
      }
    });

    return { revenue, outstanding, overdue, count: invoices.length };
  },
};

const ExportHandlerRegistry = {
  handlers: {},

  register(format, handler) {
    if (!format || !handler) {
      console.error('ExportHandlerRegistry.register: format and handler are required');
      return;
    }
    if (!handler.name || typeof handler.export !== 'function') {
      console.error('ExportHandlerRegistry.register: handler must have name and export function');
      return;
    }
    this.handlers[format] = handler;
  },

  async export(format, data, options = {}) {
    const handler = this.handlers[format];
    if (!handler) {
      console.error(`ExportHandlerRegistry.export: format "${format}" not found`);
      return false;
    }
    try {
      await handler.export(data, options);
      return true;
    } catch (err) {
      console.error(`ExportHandlerRegistry.export: ${format} export failed:`, err);
      return false;
    }
  },

  getAll() {
    return Object.entries(this.handlers).map(([format, handler]) => ({
      format,
      name: handler.name
    }));
  },

  has(format) {
    return !!this.handlers[format];
  }
};

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeCSV(value) {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function arrayToCSV(data, headers) {
  const rows = [headers.map(escapeCSV).join(',')];
  data.forEach(item => {
    const row = headers.map(h => escapeCSV(item[h] ?? ''));
    rows.push(row.join(','));
  });
  return rows.join('\n');
}

const PDFExportHandler = {
  name: 'PDF',
  export: async (data, options) => {
    const { invoice, client, settings, templateId } = options;
    if (!invoice) {
      throw new Error('PDF export requires invoice data in options');
    }
    if (templateId && typeof PDFHandler !== 'undefined') {
      await PDFHandler.exportInvoice(invoice, client, settings, templateId);
      return;
    }
    const settingsData = settings || (typeof DataStore !== 'undefined' ? DataStore.getSettings() : {});
    const defaultTemplate = settingsData.pdfTemplate || 'modern';
    if (typeof PDFHandler !== 'undefined') {
      await PDFHandler.exportInvoice(invoice, client, settingsData, defaultTemplate);
    } else {
      throw new Error('PDFHandler not loaded');
    }
  }
};

const JSONExportHandler = {
  name: 'JSON',
  export: async (data, options) => {
    const filename = options.filename || 'export.json';
    const content = JSON.stringify(data, null, 2);
    downloadBlob(content, filename, 'application/json');
  }
};

const CSVExportHandler = {
  name: 'CSV',
  export: async (data, options) => {
    const filename = options.filename || 'export.csv';
    const settings = options.settings || (typeof DataStore !== 'undefined' ? DataStore.getSettings() : { currency: '$' });
    const currency = settings.currency || '$';
    
    let invoices = [];
    if (Array.isArray(data)) {
      invoices = data;
    } else if (data && data.invoices) {
      invoices = data.invoices;
    } else if (data && data.number) {
      invoices = [data];
    }
    
    const getClient = typeof DataStore !== 'undefined' ? DataStore.getClient.bind(DataStore) : () => null;
    
    const rows = invoices.map(inv => {
      const client = getClient(inv.clientId);
      const subtotal = typeof DataStore !== 'undefined' ? DataStore.calcInvoiceSubtotal(inv) : 
        (inv.items || []).reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.rate) || 0), 0);
      const taxRate = Number(inv.taxRate) || 0;
      const tax = subtotal * taxRate / 100;
      const total = subtotal + tax;
      
      return {
        'Invoice Number': inv.number || '',
        'Client': client ? client.name : 'No client',
        'Issue Date': inv.issueDate || '',
        'Due Date': inv.dueDate || '',
        'Status': inv.status || '',
        'Subtotal': currency + subtotal.toFixed(2),
        'Tax': currency + tax.toFixed(2),
        'Total': currency + total.toFixed(2)
      };
    });
    
    const headers = ['Invoice Number', 'Client', 'Issue Date', 'Due Date', 'Status', 'Subtotal', 'Tax', 'Total'];
    const csv = arrayToCSV(rows, headers);
    downloadBlob(csv, filename, 'text/csv;charset=utf-8;');
  }
};

ExportHandlerRegistry.register('pdf', PDFExportHandler);
ExportHandlerRegistry.register('json', JSONExportHandler);
ExportHandlerRegistry.register('csv', CSVExportHandler);