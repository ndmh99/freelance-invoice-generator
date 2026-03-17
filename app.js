const App = {
  state: {
    currentTab: 'dashboard',
    editingInvoiceId: null,
    editingClientId: null,
    editingTemplateId: null,
  },
  pendingInvoiceExport: null,

  init() {
    this.initTheme();
    this.bindTheme();
    this.bindNavigation();
    this.bindModals();
    this.bindSettings();
    this.bindInvoice();
    this.bindClient();
    this.bindTemplate();
    this.bindImport();
    this.bindConfirm();
    this.bindTemplateSelect();
    this.render();
    this.updateOnlineStatus();
    window.addEventListener('online', () => this.updateOnlineStatus());
    window.addEventListener('offline', () => this.updateOnlineStatus());
  },

  initTheme() {
    const saved = localStorage.getItem('invoice-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    this.updateThemeIcon(theme);
  },

  bindTheme() {
    document.getElementById('theme-toggle').addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('invoice-theme', next);
      this.updateThemeIcon(next);
    });
  },

  updateThemeIcon(theme) {
    const darkIcon = document.getElementById('theme-icon-dark');
    const lightIcon = document.getElementById('theme-icon-light');
    if (theme === 'dark') {
      darkIcon.classList.remove('hidden');
      lightIcon.classList.add('hidden');
    } else {
      darkIcon.classList.add('hidden');
      lightIcon.classList.remove('hidden');
    }
  },

  updateOnlineStatus() {
    const badge = document.getElementById('offline-badge');
    badge.classList.toggle('hidden', navigator.onLine);
  },

  toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
      success: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
      error: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };
    
    toast.innerHTML = `
      ${icons[type] || icons.info}
      <span class="toast-message">${this.escapeHtml(message)}</span>
    `;
    
    container.appendChild(toast);
    
    const dismiss = () => {
      toast.classList.add('removing');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    };
    
    toast.addEventListener('click', dismiss);
    setTimeout(dismiss, 3000);
  },

  render() {
    this.renderDashboard();
    this.renderInvoices();
    this.renderClients();
    this.renderTemplates();
  },

  bindNavigation() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;
        document.getElementById(target).classList.add('active');
        this.state.currentTab = target;
      });
    });
  },

  bindModals() {
    document.querySelectorAll('.modal-overlay, .modal-close').forEach(el => {
      el.addEventListener('click', () => {
        el.closest('.modal').classList.add('hidden');
      });
    });
  },

  openModal(id) {
    document.getElementById(id).classList.remove('hidden');
  },
  closeModal(id) {
    document.getElementById(id).classList.add('hidden');
  },

  // Settings
  bindSettings() {
    document.getElementById('settings-btn').addEventListener('click', () => {
      const s = DataStore.getSettings();
      document.getElementById('setting-company').value = s.company;
      document.getElementById('setting-email').value = s.email;
      document.getElementById('setting-address').value = s.address;
      document.getElementById('setting-currency').value = s.currency;
      document.getElementById('setting-prefix').value = s.prefix;
      document.getElementById('setting-counter').value = s.counter;
      document.getElementById('setting-pdf-template').value = s.pdfTemplate || '';
      this.openModal('settings-modal');
    });

    document.getElementById('save-settings-btn').addEventListener('click', () => {
      const settings = {
        company: document.getElementById('setting-company').value.trim(),
        email: document.getElementById('setting-email').value.trim(),
        address: document.getElementById('setting-address').value.trim(),
        currency: document.getElementById('setting-currency').value.trim() || '$',
        prefix: document.getElementById('setting-prefix').value.trim() || 'INV-',
        counter: parseInt(document.getElementById('setting-counter').value) || 1,
        pdfTemplate: document.getElementById('setting-pdf-template').value,
      };
      DataStore.saveSettings(settings);
      this.closeModal('settings-modal');
      this.render();
      this.toast('Settings saved', 'success');
    });

    document.getElementById('export-all-btn').addEventListener('click', () => {
      const data = DataStore.exportAll();
      this.downloadJSON(data, `invoice-backup-${new Date().toISOString().split('T')[0]}.json`);
      this.toast('All data exported', 'success');
    });

    document.getElementById('import-all-btn').addEventListener('click', () => {
      document.getElementById('import-all-file').click();
    });

    document.getElementById('import-all-file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          DataStore.importAll(data);
          this.render();
          this.closeModal('settings-modal');
          this.toast('Data imported', 'success');
        } catch (err) {
          this.toast('Import failed: ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });
  },

  // Dashboard
  renderDashboard() {
    const stats = DataStore.getStats();
    const settings = DataStore.getSettings();
    document.getElementById('stat-revenue').textContent = DataStore.formatCurrency(stats.revenue, settings);
    document.getElementById('stat-outstanding').textContent = DataStore.formatCurrency(stats.outstanding, settings);
    document.getElementById('stat-overdue').textContent = DataStore.formatCurrency(stats.overdue, settings);
    document.getElementById('stat-count').textContent = stats.count;

    const invoices = DataStore.getInvoices().sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    ).slice(0, 10);

    const container = document.getElementById('recent-invoices');
    container.innerHTML = invoices.length
      ? invoices.map(inv => this.renderInvoiceItem(inv)).join('')
      : '<div class="empty">No invoices yet</div>';
  },

  renderInvoiceItem(inv) {
    const client = DataStore.getClient(inv.clientId);
    const total = DataStore.calcInvoiceTotal(inv);
    const settings = DataStore.getSettings();
    const statusLabel = inv.status.charAt(0).toUpperCase() + inv.status.slice(1);
    return `
      <div class="list-item" data-id="${inv.id}">
        <div class="list-item-main">
          <div class="list-item-title">
            ${inv.number}
            <span class="status status-${inv.status}">
              <span class="status-dot"></span>
              ${statusLabel}
            </span>
          </div>
          <div class="list-item-sub">${client ? client.name : 'No client'} · ${inv.issueDate || ''}${inv.dueDate ? ' → ' + inv.dueDate : ''}</div>
        </div>
        <div class="list-item-amount">${DataStore.formatCurrency(total, settings)}</div>
        <div class="list-item-actions">
          <button class="btn-icon btn-delete-invoice" data-id="${inv.id}" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
  },

  // Invoices
  bindInvoice() {
    const openNewInvoice = () => {
      this.state.editingInvoiceId = null;
      document.getElementById('invoice-modal-title').textContent = 'New Invoice';
      document.getElementById('invoice-id').value = '';
      document.getElementById('invoice-number').value = DataStore.getNextInvoiceNumber();
      document.getElementById('invoice-status').value = 'draft';
      document.getElementById('invoice-issue-date').value = new Date().toISOString().split('T')[0];
      const due = new Date();
      due.setDate(due.getDate() + 30);
      document.getElementById('invoice-due').value = due.toISOString().split('T')[0];
      document.getElementById('invoice-notes').value = '';
      this.populateClientSelect('invoice-client');
      this.populateTemplateSelect('invoice-template');
      document.getElementById('line-items').innerHTML = '';
      this.addLineItem('line-items');
      this.updateInvoiceTotal();
      this.openModal('invoice-modal');
    };

    document.getElementById('new-invoice-btn').addEventListener('click', openNewInvoice);
    document.getElementById('invoice-new-btn').addEventListener('click', openNewInvoice);

    document.getElementById('add-line-item-btn').addEventListener('click', () => {
      this.addLineItem('line-items');
    });

    document.getElementById('invoice-template').addEventListener('change', (e) => {
      const templateId = e.target.value;
      if (!templateId) return;
      const template = DataStore.getTemplate(templateId);
      if (!template) return;
      if (template.clientId) document.getElementById('invoice-client').value = template.clientId;
      if (template.notes) document.getElementById('invoice-notes').value = template.notes;
      const container = document.getElementById('line-items');
      container.innerHTML = '';
      (template.items || []).forEach(item => {
        this.addLineItem('line-items', item);
      });
      this.updateInvoiceTotal();
    });

    document.getElementById('save-invoice-btn').addEventListener('click', () => {
      const items = this.getLineItems('line-items');
      if (items.length === 0) {
        this.toast('Add at least one item', 'error');
        return;
      }
      const invoice = {
        number: document.getElementById('invoice-number').value,
        status: document.getElementById('invoice-status').value,
        clientId: document.getElementById('invoice-client').value,
        issueDate: document.getElementById('invoice-issue-date').value,
        dueDate: document.getElementById('invoice-due').value,
        notes: document.getElementById('invoice-notes').value.trim(),
        items,
      };

      if (this.state.editingInvoiceId) {
        DataStore.updateInvoice(this.state.editingInvoiceId, invoice);
        this.toast('Invoice updated', 'success');
      } else {
        DataStore.addInvoice(invoice);
        this.toast('Invoice created', 'success');
      }
      this.closeModal('invoice-modal');
      this.render();
    });

    document.getElementById('save-as-template-btn').addEventListener('click', () => {
      const items = this.getLineItems('line-items');
      if (items.length === 0) {
        this.toast('Add at least one item', 'error');
        return;
      }
      const name = prompt('Template name:');
      if (!name) return;
      DataStore.addTemplate({
        name: name.trim(),
        clientId: document.getElementById('invoice-client').value,
        notes: document.getElementById('invoice-notes').value.trim(),
        items,
      });
      this.toast('Template saved', 'success');
      this.renderTemplates();
    });

    document.getElementById('export-invoice-pdf-btn').addEventListener('click', () => {
      const items = this.getLineItems('line-items');
      const invoice = {
        number: document.getElementById('invoice-number').value,
        status: document.getElementById('invoice-status').value,
        issueDate: document.getElementById('invoice-issue-date').value,
        dueDate: document.getElementById('invoice-due').value,
        notes: document.getElementById('invoice-notes').value.trim(),
        items,
      };
      const clientId = document.getElementById('invoice-client').value;
      const client = clientId ? DataStore.getClient(clientId) : null;
      const settings = DataStore.getSettings();

      // Store invoice data for template selection
      this.pendingInvoiceExport = { invoice, client, settings };

      // Check if user has a default template set
      const defaultTemplate = settings.pdfTemplate || null;
      if (defaultTemplate) {
        PDFHandler.exportInvoice(invoice, client, settings, defaultTemplate);
        this.toast('PDF exported', 'success');
      } else {
        this.showTemplateSelectModal(invoice, client, settings);
      }
    });

    document.getElementById('invoice-filter').addEventListener('change', () => {
      this.renderInvoices();
    });

    document.getElementById('invoice-export-btn').addEventListener('click', () => {
      const data = { version: 1, type: 'invoices', data: DataStore.getInvoices() };
      this.downloadJSON(data, 'invoices.json');
      this.toast('Invoices exported', 'success');
    });

    document.getElementById('invoice-import-btn').addEventListener('click', () => {
      document.getElementById('invoice-import-file').click();
    });

    document.getElementById('invoice-import-file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const json = JSON.parse(ev.target.result);
          const invoices = json.data || json;
          if (!Array.isArray(invoices)) throw new Error('Invalid format');
          const existing = DataStore.getInvoices();
          const merged = [...existing, ...invoices];
          DataStore.saveInvoices(merged);
          this.render();
          this.toast(`Imported ${invoices.length} invoices`, 'success');
        } catch (err) {
          this.toast('Import failed: ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    document.getElementById('all-invoices').addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.btn-delete-invoice');
      if (deleteBtn) {
        e.stopPropagation();
        this.showConfirm('Delete', 'Remove this invoice?', () => {
          DataStore.deleteInvoice(deleteBtn.dataset.id);
          this.render();
          this.toast('Deleted', 'success');
        });
        return;
      }
      const item = e.target.closest('.list-item');
      if (item) this.editInvoice(item.dataset.id);
    });

    document.getElementById('recent-invoices').addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.btn-delete-invoice');
      if (deleteBtn) {
        e.stopPropagation();
        this.showConfirm('Delete', 'Remove this invoice?', () => {
          DataStore.deleteInvoice(deleteBtn.dataset.id);
          this.render();
          this.toast('Deleted', 'success');
        });
        return;
      }
      const item = e.target.closest('.list-item');
      if (item) this.editInvoice(item.dataset.id);
    });
  },

  editInvoice(id) {
    const inv = DataStore.getInvoice(id);
    if (!inv) return;
    this.state.editingInvoiceId = id;
    document.getElementById('invoice-modal-title').textContent = 'Edit Invoice';
    document.getElementById('invoice-id').value = id;
    document.getElementById('invoice-number').value = inv.number;
    document.getElementById('invoice-status').value = inv.status;
    document.getElementById('invoice-issue-date').value = inv.issueDate || '';
    document.getElementById('invoice-due').value = inv.dueDate || '';
    document.getElementById('invoice-notes').value = inv.notes || '';
    this.populateClientSelect('invoice-client');
    document.getElementById('invoice-client').value = inv.clientId || '';
    this.populateTemplateSelect('invoice-template');
    const container = document.getElementById('line-items');
    container.innerHTML = '';
    (inv.items || []).forEach(item => this.addLineItem('line-items', item));
    this.updateInvoiceTotal();
    this.openModal('invoice-modal');
  },

  renderInvoices() {
    const filter = document.getElementById('invoice-filter').value;
    let invoices = DataStore.getInvoices().sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    if (filter !== 'all') {
      const today = new Date().toISOString().split('T')[0];
      if (filter === 'overdue') {
        invoices = invoices.filter(i =>
          (i.status === 'sent' && i.dueDate && i.dueDate < today) || i.status === 'overdue'
        );
      } else {
        invoices = invoices.filter(i => i.status === filter);
      }
    }
    const container = document.getElementById('all-invoices');
    container.innerHTML = invoices.length
      ? invoices.map(inv => this.renderInvoiceItem(inv)).join('')
      : '<div class="empty">No invoices</div>';
  },

  addLineItem(containerId, data = null) {
    const container = document.getElementById(containerId);
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
      <input type="text" placeholder="Description" value="${data ? data.description : ''}">
      <input type="number" min="0" step="1" value="${data ? data.qty : 1}">
      <input type="number" min="0" step="0.01" value="${data ? data.rate : ''}" placeholder="0.00">
      <span class="item-amount">$0.00</span>
      <button class="btn-icon btn-remove-item" title="Remove">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    container.appendChild(row);

    const calcRow = () => {
      const qty = parseFloat(row.querySelector('input[type="number"]').value) || 0;
      const rate = parseFloat(row.querySelectorAll('input[type="number"]')[1].value) || 0;
      row.querySelector('.item-amount').textContent = '$' + (qty * rate).toFixed(2);
      this.updateInvoiceTotal();
    };

    row.querySelectorAll('input[type="number"]').forEach(inp => inp.addEventListener('input', calcRow));
    row.querySelector('.btn-remove-item').addEventListener('click', () => {
      row.remove();
      this.updateInvoiceTotal();
    });
    calcRow();
  },

  getLineItems(containerId) {
    return Array.from(document.getElementById(containerId).querySelectorAll('.item-row')).map(row => {
      const inputs = row.querySelectorAll('input');
      return {
        description: inputs[0].value.trim(),
        qty: parseFloat(inputs[1].value) || 0,
        rate: parseFloat(inputs[2].value) || 0,
      };
    }).filter(i => i.description || i.rate);
  },

  updateInvoiceTotal() {
    const items = this.getLineItems('line-items');
    const total = items.reduce((s, i) => s + i.qty * i.rate, 0);
    const settings = DataStore.getSettings();
    document.getElementById('invoice-total').textContent = DataStore.formatCurrency(total, settings);
  },

  populateClientSelect(selectId) {
    const select = document.getElementById(selectId);
    const current = select.value;
    select.innerHTML = '<option value="">Select...</option>';
    DataStore.getClients().sort((a, b) => a.name.localeCompare(b.name)).forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      select.appendChild(opt);
    });
    if (current) select.value = current;
  },

  populateTemplateSelect(selectId) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">None</option>';
    DataStore.getTemplates().forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.name;
      select.appendChild(opt);
    });
  },

  // Clients
  bindClient() {
    document.getElementById('client-new-btn').addEventListener('click', () => {
      this.state.editingClientId = null;
      document.getElementById('client-modal-title').textContent = 'New Client';
      document.getElementById('client-id').value = '';
      document.getElementById('client-name').value = '';
      document.getElementById('client-email').value = '';
      document.getElementById('client-phone').value = '';
      document.getElementById('client-address').value = '';
      document.getElementById('client-tax-id').value = '';
      document.getElementById('client-notes').value = '';
      document.getElementById('delete-client-btn').classList.add('hidden');
      this.openModal('client-modal');
    });

    document.getElementById('delete-client-btn').addEventListener('click', () => {
      const id = this.state.editingClientId;
      if (!id) return;
      const client = DataStore.getClient(id);
      const invoiceCount = DataStore.getInvoices().filter(i => i.clientId === id).length;
      const message = invoiceCount > 0
        ? `Delete "${client.name}"? ${invoiceCount} invoice(s) will become unlinked.`
        : `Delete "${client.name}"?`;
      this.showConfirm('Delete Client', message, () => {
        DataStore.deleteClient(id);
        this.closeModal('client-modal');
        this.render();
        this.toast('Client deleted', 'success');
      });
    });

    document.getElementById('save-client-btn').addEventListener('click', () => {
      const name = document.getElementById('client-name').value.trim();
      if (!name) {
        this.toast('Name required', 'error');
        return;
      }
      const client = {
        name,
        email: document.getElementById('client-email').value.trim(),
        phone: document.getElementById('client-phone').value.trim(),
        address: document.getElementById('client-address').value.trim(),
        taxId: document.getElementById('client-tax-id').value.trim(),
        notes: document.getElementById('client-notes').value.trim(),
      };
      if (this.state.editingClientId) {
        DataStore.updateClient(this.state.editingClientId, client);
        this.toast('Client updated', 'success');
      } else {
        DataStore.addClient(client);
        this.toast('Client added', 'success');
      }
      this.closeModal('client-modal');
      this.render();
    });

    document.getElementById('client-export-btn').addEventListener('click', () => {
      const data = { version: 1, type: 'clients', data: DataStore.getClients() };
      this.downloadJSON(data, 'clients.json');
      this.toast('Clients exported', 'success');
    });

    document.getElementById('client-list').addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.btn-delete-client');
      if (deleteBtn) {
        e.stopPropagation();
        const id = deleteBtn.dataset.id;
        const client = DataStore.getClient(id);
        const invoiceCount = DataStore.getInvoices().filter(i => i.clientId === id).length;
        const message = invoiceCount > 0
          ? `Delete "${client.name}"? ${invoiceCount} invoice(s) will become unlinked.`
          : `Delete "${client.name}"?`;
        this.showConfirm('Delete Client', message, () => {
          DataStore.deleteClient(id);
          this.render();
          this.toast('Client deleted', 'success');
        });
        return;
      }
      const card = e.target.closest('.card');
      if (card) this.editClient(card.dataset.id);
    });
  },

  editClient(id) {
    const client = DataStore.getClient(id);
    if (!client) return;
    this.state.editingClientId = id;
    document.getElementById('client-modal-title').textContent = 'Edit Client';
    document.getElementById('client-id').value = id;
    document.getElementById('client-name').value = client.name || '';
    document.getElementById('client-email').value = client.email || '';
    document.getElementById('client-phone').value = client.phone || '';
    document.getElementById('client-address').value = client.address || '';
    document.getElementById('client-tax-id').value = client.taxId || '';
    document.getElementById('client-notes').value = client.notes || '';
    document.getElementById('delete-client-btn').classList.remove('hidden');
    this.openModal('client-modal');
  },

  renderClients() {
    const clients = DataStore.getClients().sort((a, b) => a.name.localeCompare(b.name));
    const invoices = DataStore.getInvoices();
    const container = document.getElementById('client-list');
    if (clients.length === 0) {
      container.innerHTML = '<div class="empty">No clients</div>';
      return;
    }
    container.innerHTML = clients.map(c => {
      const initials = c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      const invoiceCount = invoices.filter(i => i.clientId === c.id).length;
      const totalBilled = invoices.filter(i => i.clientId === c.id)
        .reduce((sum, i) => sum + DataStore.calcInvoiceTotal(i), 0);
      const settings = DataStore.getSettings();
      return `
        <div class="card" data-id="${c.id}">
          <button class="card-delete btn-delete-client" data-id="${c.id}" title="Delete client">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
          <div class="card-header">
            <div class="card-avatar">${initials}</div>
            <div class="card-header-text">
              <div class="card-title">${this.escapeHtml(c.name)}</div>
              ${c.email ? `<div class="card-subtitle">${this.escapeHtml(c.email)}</div>` : ''}
            </div>
          </div>
          <div class="card-details">
            ${c.phone ? `<div class="card-detail"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>${this.escapeHtml(c.phone)}</div>` : ''}
            ${c.address ? `<div class="card-detail"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>${this.escapeHtml(c.address.split('\n')[0])}</div>` : ''}
            ${c.taxId ? `<div class="card-detail"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>${this.escapeHtml(c.taxId)}</div>` : ''}
          </div>
          <div class="card-footer">
            <span class="card-stat">${invoiceCount} invoice${invoiceCount !== 1 ? 's' : ''}</span>
            <span class="card-stat">${DataStore.formatCurrency(totalBilled, settings)}</span>
          </div>
        </div>
      `;
    }).join('');
  },

  // Templates
  bindTemplate() {
    document.getElementById('template-new-btn').addEventListener('click', () => {
      this.state.editingTemplateId = null;
      document.getElementById('template-modal-title').textContent = 'New Template';
      document.getElementById('template-id').value = '';
      document.getElementById('template-name').value = '';
      document.getElementById('template-notes').value = '';
      this.populateClientSelect('template-client');
      document.getElementById('template-line-items').innerHTML = '';
      this.addLineItem('template-line-items');
      this.updateTemplateTotal();
      this.openModal('template-modal');
    });

    document.getElementById('add-template-item-btn').addEventListener('click', () => {
      this.addLineItem('template-line-items');
    });

    document.getElementById('save-template-btn').addEventListener('click', () => {
      const name = document.getElementById('template-name').value.trim();
      if (!name) {
        this.toast('Name required', 'error');
        return;
      }
      const items = this.getLineItems('template-line-items');
      const template = {
        name,
        clientId: document.getElementById('template-client').value,
        notes: document.getElementById('template-notes').value.trim(),
        items,
      };
      if (this.state.editingTemplateId) {
        DataStore.updateTemplate(this.state.editingTemplateId, template);
        this.toast('Template updated', 'success');
      } else {
        DataStore.addTemplate(template);
        this.toast('Template created', 'success');
      }
      this.closeModal('template-modal');
      this.render();
    });

    document.getElementById('use-template-btn').addEventListener('click', () => {
      const name = document.getElementById('template-name').value.trim();
      const items = this.getLineItems('template-line-items');
      const template = {
        name: name || 'Template',
        clientId: document.getElementById('template-client').value,
        notes: document.getElementById('template-notes').value.trim(),
        items,
      };
      let saved;
      if (this.state.editingTemplateId) {
        saved = DataStore.updateTemplate(this.state.editingTemplateId, template);
      } else {
        saved = DataStore.addTemplate(template);
      }
      this.closeModal('template-modal');
      this.createFromTemplate(saved.id);
    });

    document.getElementById('template-export-btn').addEventListener('click', () => {
      const data = { version: 1, type: 'templates', data: DataStore.getTemplates() };
      this.downloadJSON(data, 'templates.json');
      this.toast('Templates exported', 'success');
    });

    document.getElementById('template-import-btn').addEventListener('click', () => {
      document.getElementById('template-import-file').click();
    });

    document.getElementById('template-import-file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const json = JSON.parse(ev.target.result);
          const templates = json.data || json;
          if (!Array.isArray(templates)) throw new Error('Invalid format');
          const existing = DataStore.getTemplates();
          const merged = [...existing, ...templates];
          DataStore.saveTemplates(merged);
          this.render();
          this.toast(`Imported ${templates.length} templates`, 'success');
        } catch (err) {
          this.toast('Import failed: ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    document.getElementById('template-list').addEventListener('click', (e) => {
      const card = e.target.closest('.card');
      if (!card) return;
      const id = card.dataset.id;
      if (e.target.closest('.btn-use-template')) {
        this.createFromTemplate(id);
      } else if (e.target.closest('.btn-delete-template')) {
        this.showConfirm('Delete', 'Remove this template?', () => {
          DataStore.deleteTemplate(id);
          this.render();
          this.toast('Deleted', 'success');
        });
      } else {
        this.editTemplate(id);
      }
    });
  },

  createFromTemplate(templateId) {
    const template = DataStore.getTemplate(templateId);
    if (!template) return;
    this.state.editingInvoiceId = null;
    document.getElementById('invoice-modal-title').textContent = 'New Invoice';
    document.getElementById('invoice-id').value = '';
    document.getElementById('invoice-number').value = DataStore.getNextInvoiceNumber();
    document.getElementById('invoice-status').value = 'draft';
    document.getElementById('invoice-issue-date').value = new Date().toISOString().split('T')[0];
    const due = new Date();
    due.setDate(due.getDate() + 30);
    document.getElementById('invoice-due').value = due.toISOString().split('T')[0];
    document.getElementById('invoice-notes').value = template.notes || '';
    this.populateClientSelect('invoice-client');
    document.getElementById('invoice-client').value = template.clientId || '';
    this.populateTemplateSelect('invoice-template');
    const container = document.getElementById('line-items');
    container.innerHTML = '';
    (template.items || []).forEach(item => this.addLineItem('line-items', item));
    this.updateInvoiceTotal();
    this.openModal('invoice-modal');
  },

  editTemplate(id) {
    const template = DataStore.getTemplate(id);
    if (!template) return;
    this.state.editingTemplateId = id;
    document.getElementById('template-modal-title').textContent = 'Edit Template';
    document.getElementById('template-id').value = id;
    document.getElementById('template-name').value = template.name || '';
    document.getElementById('template-notes').value = template.notes || '';
    this.populateClientSelect('template-client');
    document.getElementById('template-client').value = template.clientId || '';
    const container = document.getElementById('template-line-items');
    container.innerHTML = '';
    (template.items || []).forEach(item => this.addLineItem('template-line-items', item));
    this.updateTemplateTotal();
    this.openModal('template-modal');
  },

  updateTemplateTotal() {
    const items = this.getLineItems('template-line-items');
    const total = items.reduce((s, i) => s + i.qty * i.rate, 0);
    const settings = DataStore.getSettings();
    document.getElementById('template-total').textContent = DataStore.formatCurrency(total, settings);
  },

  renderTemplates() {
    const templates = DataStore.getTemplates();
    const container = document.getElementById('template-list');
    const settings = DataStore.getSettings();
    if (templates.length === 0) {
      container.innerHTML = '<div class="empty">No templates</div>';
      return;
    }
    container.innerHTML = templates.map(t => {
      const items = t.items || [];
      const total = items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.rate) || 0), 0);
      const client = t.clientId ? DataStore.getClient(t.clientId) : null;
      const previewItems = items.slice(0, 3);
      return `
        <div class="card" data-id="${t.id}">
          <div class="card-header">
            <div class="card-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <div class="card-header-text">
              <div class="card-title">${this.escapeHtml(t.name)}</div>
              ${client ? `<div class="card-subtitle">${this.escapeHtml(client.name)}</div>` : ''}
            </div>
            <div class="card-amount-badge">${DataStore.formatCurrency(total, settings)}</div>
          </div>
          <div class="card-items-preview">
            ${previewItems.map(item => `
              <div class="card-item-row">
                <span class="card-item-desc">${this.escapeHtml(item.description || 'Item')}</span>
                <span class="card-item-qty">${item.qty || 0}x</span>
              </div>
            `).join('')}
            ${items.length > 3 ? `<div class="card-item-more">+${items.length - 3} more items</div>` : ''}
          </div>
          <div class="card-actions">
            <button class="btn btn-sm btn-primary btn-use-template">Create Invoice</button>
            <button class="btn btn-sm btn-ghost btn-delete-template">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  },

  // Import (PDF or JSON)
  bindImport() {
    const dropZone = document.getElementById('import-drop-zone');
    const fileInput = document.getElementById('import-file-input');

    document.getElementById('client-import-btn').addEventListener('click', () => {
      document.getElementById('import-parse-result').classList.add('hidden');
      document.getElementById('import-save').classList.add('hidden');
      this.openModal('import-modal');
    });

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) this.handleImportFile(file);
    });
    fileInput.addEventListener('change', () => {
      if (fileInput.files[0]) this.handleImportFile(fileInput.files[0]);
      fileInput.value = '';
    });

    document.getElementById('import-cancel').addEventListener('click', () => {
      this.closeModal('import-modal');
    });

    document.getElementById('import-save').addEventListener('click', () => {
      if (this.importMode === 'pdf') {
        const client = {
          name: document.getElementById('import-client-name').value.trim(),
          email: document.getElementById('import-client-email').value.trim(),
          phone: document.getElementById('import-client-phone').value.trim(),
          address: document.getElementById('import-client-address').value.trim(),
          taxId: document.getElementById('import-client-tax-id').value.trim(),
        };
        if (!client.name) {
          this.toast('Name required', 'error');
          return;
        }
        DataStore.addClient(client);
        this.toast('Client imported', 'success');
      } else if (this.importMode === 'json') {
        const clients = this.importData;
        const existing = DataStore.getClients();
        const merged = [...existing, ...clients];
        DataStore.saveClients(merged);
        this.toast(`Imported ${clients.length} clients`, 'success');
      }
      this.closeModal('import-modal');
      this.render();
    });
  },

  importMode: null,
  importData: null,

  handleImportFile(file) {
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      this.processPDFImport(file);
    } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
      this.processJSONImport(file);
    } else {
      this.toast('Unsupported file type', 'error');
    }
  },

  async processPDFImport(file) {
    try {
      const info = await PDFHandler.parsePDF(file);
      this.importMode = 'pdf';
      document.getElementById('import-result-title').textContent = 'Detected from PDF';
      document.getElementById('import-fields').innerHTML = `
        <div class="field">
          <label>Name</label>
          <input type="text" id="import-client-name" value="${this.escapeHtml(info.name)}">
        </div>
        <div class="field">
          <label>Email</label>
          <input type="email" id="import-client-email" value="${this.escapeHtml(info.email)}">
        </div>
        <div class="field">
          <label>Phone</label>
          <input type="tel" id="import-client-phone" value="${this.escapeHtml(info.phone)}">
        </div>
        <div class="field">
          <label>Address</label>
          <textarea id="import-client-address" rows="2">${this.escapeHtml(info.address)}</textarea>
        </div>
        <div class="field">
          <label>Tax ID</label>
          <input type="text" id="import-client-tax-id" value="${this.escapeHtml(info.taxId)}">
        </div>
      `;
      document.getElementById('import-parse-result').classList.remove('hidden');
      document.getElementById('import-save').classList.remove('hidden');
      document.getElementById('import-save').textContent = 'Import Client';
    } catch (err) {
      this.toast('PDF parse failed', 'error');
    }
  },

  processJSONImport(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        const clients = json.data || json;
        if (!Array.isArray(clients)) throw new Error('Invalid format');
        this.importMode = 'json';
        this.importData = clients;
        document.getElementById('import-result-title').textContent = `${clients.length} Clients Found`;
        document.getElementById('import-fields').innerHTML = `
          <div class="import-preview">
            ${clients.slice(0, 5).map(c => `
              <div class="import-preview-item">
                <strong>${this.escapeHtml(c.name)}</strong>
                ${c.email ? `<span>${this.escapeHtml(c.email)}</span>` : ''}
              </div>
            `).join('')}
            ${clients.length > 5 ? `<div class="import-preview-more">+${clients.length - 5} more</div>` : ''}
          </div>
        `;
        document.getElementById('import-parse-result').classList.remove('hidden');
        document.getElementById('import-save').classList.remove('hidden');
        document.getElementById('import-save').textContent = `Import ${clients.length} Clients`;
      } catch (err) {
        this.toast('Invalid JSON file', 'error');
      }
    };
    reader.readAsText(file);
  },

  // Confirm
  bindConfirm() {
    document.getElementById('confirm-cancel').addEventListener('click', () => {
      this.closeModal('confirm-modal');
    });
    document.querySelector('#confirm-modal .modal-overlay').addEventListener('click', () => {
      this.closeModal('confirm-modal');
    });
  },

  confirmCallback: null,
  showConfirm(title, message, callback) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    this.confirmCallback = callback;
    this.openModal('confirm-modal');
    const okBtn = document.getElementById('confirm-ok');
    const handler = () => {
      okBtn.removeEventListener('click', handler);
      this.closeModal('confirm-modal');
      if (this.confirmCallback) this.confirmCallback();
    };
    okBtn.addEventListener('click', handler);
  },

  // Template Selection Modal
  bindTemplateSelect() {
    document.getElementById('back-to-templates').addEventListener('click', () => {
      document.getElementById('template-preview-area').classList.add('hidden');
      document.getElementById('template-preview-grid').classList.remove('hidden');
    });

    document.getElementById('use-template-export').addEventListener('click', () => {
      const selectedTemplate = document.querySelector('.template-card.selected');
      if (!selectedTemplate) {
        this.toast('Please select a template', 'warning');
        return;
      }

      const templateId = selectedTemplate.dataset.template;
      const setAsDefault = document.getElementById('set-as-default').checked;

      if (setAsDefault) {
        const settings = DataStore.getSettings();
        settings.pdfTemplate = templateId;
        DataStore.saveSettings(settings);
        this.toast('Template set as default', 'success');
      }

      if (this.pendingInvoiceExport) {
        const { invoice, client, settings } = this.pendingInvoiceExport;
        PDFHandler.exportInvoice(invoice, client, settings, templateId);
        this.toast('PDF exported', 'success');
      }

      this.closeModal('template-select-modal');
      this.pendingInvoiceExport = null;
    });
  },

  async showTemplateSelectModal(invoice, client, settings) {
    const templates = PDFHandler.getTemplateList();
    const grid = document.getElementById('template-preview-grid');
    const previewArea = document.getElementById('template-preview-area');

    // Reset state
    previewArea.classList.add('hidden');
    grid.classList.remove('hidden');
    document.getElementById('set-as-default').checked = false;

    // Render template cards
    grid.innerHTML = templates.map(t => `
      <div class="template-card" data-template="${t.id}">
        <div class="template-card-name">${t.name}</div>
        <div class="template-card-desc">${t.description}</div>
      </div>
    `).join('');

    // Bind card clicks
    grid.querySelectorAll('.template-card').forEach(card => {
      card.addEventListener('click', async () => {
        const templateId = card.dataset.template;
        const template = templates.find(t => t.id === templateId);

        // Update selection
        grid.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        // Show preview
        grid.classList.add('hidden');
        previewArea.classList.remove('hidden');

        document.getElementById('preview-template-name').textContent = template.name;
        document.getElementById('preview-template-desc').textContent = template.description;

        // Generate preview
        try {
          const previewDataUrl = await PDFHandler.generatePreview(invoice, client, settings, templateId);
          const iframe = document.getElementById('template-preview-iframe');
          iframe.src = previewDataUrl;
        } catch (err) {
          console.error('Preview failed:', err);
        }
      });
    });

    this.openModal('template-select-modal');
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  },

  downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
};

document.addEventListener('DOMContentLoaded', () => {
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
  App.init();
});