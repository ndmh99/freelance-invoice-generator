const DataStore = {
  KEYS: {
    SETTINGS: 'invoiceforge_settings',
    CLIENTS: 'invoiceforge_clients',
    INVOICES: 'invoiceforge_invoices',
    TEMPLATES: 'invoiceforge_templates',
    COUNTER: 'invoiceforge_counter',
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