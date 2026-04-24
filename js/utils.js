/* ===========================
   UTILS.js - Utility Functions
   =========================== */
const Utils = {
  // Format date
  formatDate(dateStr, options = {}) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', ...options });
  },

  // Format datetime
  formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  },

  // Format currency
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  },

  // Get member initials
  getInitials(firstName, lastName) {
    return ((firstName || '')[0] || '') + ((lastName || '')[0] || '');
  },

  // Status badge HTML
  statusBadge(status) {
    const map = {
      active:     { cls: 'badge-active',     label: 'Active' },
      grace:      { cls: 'badge-grace',      label: 'Grace Period' },
      suspended:  { cls: 'badge-suspended',  label: 'Suspended' },
      terminated: { cls: 'badge-terminated', label: 'Terminated' },
      pending:    { cls: 'badge-pending',    label: 'Pending' },
    };
    const s = map[status] || map.pending;
    return `<span class="badge ${s.cls}"><span class="badge-dot"></span>${s.label}</span>`;
  },

  // Toast notification
  toast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
    container.appendChild(el);
    setTimeout(() => el.remove(), duration);
  },

  // Modal
  showModal(titleHtml, bodyHtml, footerHtml = '') {
    const overlay = document.getElementById('modal-overlay');
    const box = document.getElementById('modal-box');
    box.innerHTML = `
      <div class="modal-header">
        <div class="modal-title">${titleHtml}</div>
        <button class="modal-close" onclick="Utils.closeModal()">✕</button>
      </div>
      <div class="modal-body">${bodyHtml}</div>
      ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
    `;
    overlay.classList.remove('hidden');
  },

  closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
  },

  confirm(title, message, onConfirm, dangerBtn = false) {
    const btnClass = dangerBtn ? 'btn-danger' : 'btn-primary';
    window._currentConfirmCallback = onConfirm;
    this.showModal(
      title,
      `<p style="color:var(--clr-text-muted);font-size:var(--text-sm)">${message}</p>`,
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
       <button class="btn ${btnClass}" onclick="Utils.closeModal(); if(window._currentConfirmCallback) window._currentConfirmCallback();">Confirm</button>`
    );
  },

  // Generate unique link URL (simulated)
  generateLink(token) {
    const base = window.location.origin + window.location.pathname;
    const type = token.type === 'registration' ? 'register' : 'update';
    return `${base}?page=${type}&token=${token.id}`;
  },

  // Copy to clipboard
  copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      this.toast('Link copied to clipboard!', 'success');
    }).catch(() => {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      this.toast('Link copied!', 'success');
    });
  },

  // Calculate grace period status
  isInGracePeriod(member) {
    if (!member.joinDate) return false;
    const join = new Date(member.joinDate);
    const settings = DB.getSettings();
    const graceDays = settings.gracePeriodDays || 90;
    const graceEnd = new Date(join.getTime() + graceDays * 24 * 60 * 60 * 1000);
    return new Date() < graceEnd;
  },

  graceEndDate(member) {
    if (!member.joinDate) return null;
    const join = new Date(member.joinDate);
    const settings = DB.getSettings();
    const graceDays = settings.gracePeriodDays || 90;
    return new Date(join.getTime() + graceDays * 24 * 60 * 60 * 1000);
  },

  // Calculate late fees for a contribution
  calculateLateFee(dueDateStr) {
    const due = new Date(dueDateStr);
    const now = new Date();
    if (now <= due) return 0;
    const daysLate = Math.floor((now - due) / (1000 * 60 * 60 * 24));
    const weeksLate = Math.ceil(daysLate / 7);
    const settings = DB.getSettings();
    const w1 = settings.lateFeeWeek1 || 5;
    const w2 = settings.lateFeeWeek2Plus || 2;
    if (weeksLate <= 1) return w1;
    return w1 + (weeksLate - 1) * w2;
  },

  // Debounce
  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  // Validate email
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  // Sanitize HTML
  sanitize(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
  },

  // Get URL params
  getUrlParams() {
    const params = {};
    const hash = window.location.hash.substring(1);
    const searchPart = hash.includes('?') ? hash.split('?')[1] : window.location.search.substring(1);
    if (!searchPart) return params;
    
    searchPart.split('&').forEach(pair => {
      const [k, v] = pair.split('=');
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
    });
    return params;
  },

  // Days remaining
  daysUntil(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  },

  // Member full name
  fullName(member) {
    return `${member.firstName || ''} ${member.lastName || ''}`.trim();
  },

  // Send notification (simulated - shows toast + logs)
  sendNotification(memberId, type, channel, message, subject = '') {
    const member = DB.getMember(memberId);
    if (!member) return;
    DB.addNotification({
      memberId,
      type,
      channel,
      message,
      subject,
      status: 'sent',
      recipientEmail: member.email,
      recipientPhone: member.phone
    });
    const channelIcon = channel === 'email' ? '📧' : '📱';
    this.toast(`${channelIcon} Notification sent to ${this.fullName(member)}`, 'success');
  },

  wrapEmailBody(rawBody) {
    const settings = DB.getSettings();
    const color = settings.emailBrandColor || '#0f3a63';
    const logo = settings.emailLogoUrl ? `<img src="${settings.emailLogoUrl}" style="max-height:60px;margin-bottom:10px" alt="Logo"/>` : '';
    const headerTxt = settings.emailHeader || settings.orgName || 'Abeingo Boston Benevolent Fund';
    const footerTxt = (settings.emailFooter || '').replace(/\n/g, '<br>');
    
    let htmlBody = rawBody;
    if (!htmlBody.includes('<')) htmlBody = htmlBody.replace(/\n/g, '<br>');

    return `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 20px 0; color: #111;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background-color: ${color}; padding: 20px; text-align: center; color: #ffffff;">
            ${logo}
            <h2 style="margin: 0; font-size: 20px; font-weight: 600;">${headerTxt}</h2>
          </div>
          <div style="padding: 30px 20px; font-size: 16px; line-height: 1.6; color: #374151;">
            ${htmlBody}
          </div>
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; line-height: 1.5;">
            ${footerTxt}
          </div>
        </div>
      </div>
    `.replace(/\n\s+/g, '');
  },

  // Send registration link
  async sendRegistrationLink(email, name = '') {
    let member = DB.getMemberByEmail(email);
    if (!member) {
      const id = DB.newId();
      member = { id, email, firstName: name.split(' ')[0] || 'New', lastName: name.split(' ').slice(1).join(' ') || 'Member', status: 'pending', kittyBalance: 0 };
      DB.saveMember(member);
    }
    const token = DB.generateToken('registration', member.id, email);
    const link = this.generateLink(token);
    
    const adminName = window.Auth && window.Auth.currentUser ? this.fullName(window.Auth.currentUser) : 'Admin';
    const dateStr = this.formatDate(new Date().toISOString());
    const tpl = DB.getEmailTemplates().find(t => t.id === 'tpl_reg_link');
    
    const subject = tpl.subject.replace(/{member_name}/g, member.firstName).replace(/{admin_name}/g, adminName).replace(/{date}/g, dateStr);
    let body = tpl.body.replace(/{member_name}/g, member.firstName).replace(/{admin_name}/g, adminName).replace(/{date}/g, dateStr).replace(/{link}/g, link).replace(/{expiry}/g, 30 * 24);
    
    const notification = {
      memberId: member.id,
      type: 'registration_link',
      channel: 'email',
      message: this.wrapEmailBody(body),
      subject: subject,
      status: 'sent',
      recipientEmail: email,
      link
    };
    
    await DB.apiSendEmails([notification]);
    return { token, link, member };
  },

  async sendUpdateLink(memberId) {
    const member = DB.getMember(memberId);
    if (!member) return null;
    const token = DB.generateToken('update', memberId, member.email);
    const link = this.generateLink(token);
    
    const adminName = window.Auth && window.Auth.currentUser ? this.fullName(window.Auth.currentUser) : 'Admin';
    const dateStr = this.formatDate(new Date().toISOString());
    const tpl = DB.getEmailTemplates().find(t => t.id === 'tpl_update_link');
    
    const subject = tpl.subject.replace(/{member_name}/g, member.firstName).replace(/{admin_name}/g, adminName).replace(/{date}/g, dateStr);
    let body = tpl.body.replace(/{member_name}/g, member.firstName).replace(/{admin_name}/g, adminName).replace(/{date}/g, dateStr).replace(/{link}/g, link).replace(/{expiry}/g, 3 * 24);
    
    const notification = {
      memberId,
      type: 'update_link',
      channel: 'email',
      message: this.wrapEmailBody(body),
      subject: subject,
      status: 'sent',
      recipientEmail: member.email,
      link
    };
    
    await DB.apiSendEmails([notification]);
    return { token, link };
  },

  // Export to CSV (for PDF simulation)
  membersToCSV(members) {
    const headers = ['ID','First Name','Last Name','Email','Phone','Status','Join Date','City','Kitty Balance'];
    const rows = members.map(m => [
      m.id, m.firstName, m.lastName, m.email, m.phone, m.status, m.joinDate || '', m.city || '', m.kittyBalance || 0
    ]);
    return [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  },

  exportCSV(filename, csvContent) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  fileToDataUri(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  },

  // Document Preview
  previewDocument(docId) {
    const docs = DB.getDocuments();
    const doc = docs.find(d => d.id === docId);
    if (!doc) {
       this.toast('Document not found', 'error');
       return;
    }
    
    const ext = doc.filename.split('.').pop().toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    const isPDF = ext === 'pdf';
    
    // Use real data URI if available, otherwise use a placeholder
    const fileUrl = doc.dataUri || 'data:text/plain;base64,U2ltdWxhdGVkIGRvY3VtZW50IGNvbnRlbnQ='; 
    
    let previewHtml = '';
    if (isImage) {
      previewHtml = `<img src="${fileUrl}" style="max-width:100%;max-height:70vh;object-fit:contain;display:block;margin:0 auto;border-radius:4px" alt="Preview"/>`;
    } else if (isPDF) {
      previewHtml = `<iframe src="${fileUrl}" style="width:100%;height:70vh;border:none;background:white;border-radius:4px" title="PDF Preview"></iframe>`;
    } else {
      previewHtml = `
        <div style="padding:4rem 2rem;text-align:center;background:var(--clr-surface-2);border-radius:var(--radius);width:100%;border:2px dashed var(--clr-border);">
          <div style="font-size:5rem;margin-bottom:1.5rem;">📄</div>
          <h3 style="margin-bottom:0.75rem;color:var(--clr-text)">${this.sanitize(doc.filename)}</h3>
          <p style="color:var(--clr-text-muted);margin-bottom:2rem;max-width:300px;margin-left:auto;margin-right:auto">Full preview for .${ext} files is not available in the browser. You can download the file to view it.</p>
          <button class="btn btn-primary" onclick="Utils.downloadDocument('${doc.id}')">💾 Download Original File</button>
        </div>
      `;
    }
    
    // Create a fresh overlay to support multiple modals
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'preview-overlay';
    overlay.style.zIndex = '10000'; // Higher than normal modals (1000)
    overlay.style.background = 'rgba(0,0,0,0.85)';
    overlay.style.backdropFilter = 'blur(8px)';
    
    overlay.innerHTML = `
      <div class="modal-box" style="width:900px;max-width:95vw;background:var(--clr-surface);box-shadow:0 25px 50px -12px rgba(0,0,0,0.5)">
        <div class="modal-header" style="background:var(--clr-surface);border-bottom:1px solid var(--clr-border)">
          <div class="modal-title" style="display:flex;align-items:center;gap:0.5rem">
            <span style="font-size:1.2rem">${isImage ? '🖼️' : isPDF ? '📄' : '📎'}</span>
            <span>Document Preview: ${this.sanitize(doc.filename)}</span>
          </div>
          <button class="modal-close" onclick="document.getElementById('preview-overlay').remove()">✕</button>
        </div>
        <div class="modal-body" style="background:#0f172a;padding:1.5rem;display:flex;align-items:center;justify-content:center;min-height:300px">
          ${previewHtml}
        </div>
        <div class="modal-footer" style="background:var(--clr-surface-2);border-top:1px solid var(--clr-border)">
          <button class="btn btn-ghost" onclick="document.getElementById('preview-overlay').remove()">Close Preview</button>
          <button class="btn btn-primary" onclick="Utils.downloadDocument('${doc.id}')">💾 Download Original</button>
        </div>
      </div>
    `;

    // Close on background click
    overlay.onclick = (e) => {
      if (e.target === overlay) overlay.remove();
    };

    document.body.appendChild(overlay);
  },

  downloadDocument(docId) {
    const docs = DB.getDocuments();
    const doc = docs.find(d => d.id === docId);
    if (!doc) return;
    const a = document.createElement('a');
    a.href = doc.dataUri || 'data:text/plain;base64,U2ltdWxhdGVkIGRvY3VtZW50IGNvbnRlbnQ=';
    a.download = doc.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    this.toast(`Downloading ${doc.filename}...`, 'success');
  },

  // Import Utilities
  showImportModal(targetType) {
    const title = `📥 Import ${targetType.charAt(0).toUpperCase() + targetType.slice(1)}`;
    const body = `
      <div style="display:flex;flex-direction:column;gap:1.5rem">
        <div class="alert alert-info" style="font-size:0.8rem">
          <span class="alert-icon">ℹ️</span>
          <div class="alert-content">Supported formats: CSV (Excel export), XML, and Google Sheets public CSV links.</div>
        </div>
        
        <div class="form-field">
          <label class="field-label">1. Choose Source Type</label>
          <select id="import-source-type" class="field-select" onchange="document.getElementById('import-file-input-wrapper').style.display = this.value === 'google' ? 'none' : 'block'; document.getElementById('import-url-wrapper').style.display = this.value === 'google' ? 'block' : 'none';">
            <option value="csv">CSV (Excel Export)</option>
            <option value="xml">XML File</option>
            <option value="google">Google Sheets (Public Link)</option>
          </select>
        </div>

        <div id="import-file-input-wrapper" class="form-field">
          <label class="field-label">2. Select File</label>
          <input type="file" id="import-file" class="field-input" accept=".csv,.xml"/>
        </div>

        <div id="import-url-wrapper" class="form-field" style="display:none">
          <label class="field-label">2. Paste Google Sheets CSV URL</label>
          <input type="text" id="import-url" class="field-input" placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"/>
          <p style="font-size:0.7rem;color:var(--clr-text-muted);margin-top:0.25rem">Tip: In Google Sheets, go to File > Share > Publish to web, choose 'CSV', and paste that link here.</p>
        </div>

        <div class="form-field">
          <label class="field-label">3. Parsing Options</label>
          <div style="display:flex;gap:1rem;align-items:center">
            <label style="display:flex;align-items:center;gap:0.5rem;font-size:0.85rem">
              <input type="checkbox" id="import-has-headers" checked/> First row is headers
            </label>
            <label style="display:flex;align-items:center;gap:0.5rem;font-size:0.85rem">
              <input type="checkbox" id="import-overwrite"/> Overwrite existing IDs
            </label>
          </div>
        </div>
      </div>
    `;
    
    this.showModal(
      title,
      body,
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="Utils.processImport('${targetType}')">🚀 Process Import</button>`
    );
  },

  async processImport(targetType) {
    const source = document.getElementById('import-source-type').value;
    const hasHeaders = document.getElementById('import-has-headers').checked;
    const overwrite = document.getElementById('import-overwrite').checked;
    
    let rawData = '';
    
    try {
      if (source === 'google') {
        const url = document.getElementById('import-url').value;
        if (!url) throw new Error('Please enter a Google Sheets URL');
        this.toast('Fetching data from Google Sheets...', 'info');
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch from URL. Ensure the sheet is published to web as CSV.');
        rawData = await res.text();
      } else {
        const fileInput = document.getElementById('import-file');
        if (!fileInput.files.length) throw new Error('Please select a file');
        rawData = await fileInput.files[0].text();
      }

      let parsed = [];
      if (source === 'xml') {
        parsed = this.parseXML(rawData, targetType);
      } else {
        parsed = this.parseCSV(rawData, hasHeaders);
      }

      if (!parsed || !parsed.length) throw new Error('No data found in source.');

      // Map data to schema
      const cleaned = parsed.map(row => this.mapImportRow(row, targetType));
      
      // Save to DB
      const count = DB.importData(targetType, cleaned, overwrite);
      
      this.toast(`Successfully imported ${count} ${targetType}!`, 'success');
      this.closeModal();
      
      // Refresh current page
      if (window.Router && window.Router.currentPage) {
        window.Router.navigate(window.Router.currentPage);
      }
    } catch (err) {
      console.error(err);
      this.toast(err.message, 'error');
    }
  },

  parseCSV(text, hasHeaders) {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (!lines.length) return [];
    
    const delimiter = text.includes('\t') ? '\t' : ',';
    const rows = lines.map(line => {
      // Basic CSV parser handling quotes
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });

    if (hasHeaders) {
      const headers = rows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
      return rows.slice(1).map(row => {
        const obj = {};
        headers.forEach((h, i) => { if (row[i] !== undefined) obj[h] = row[i]; });
        return obj;
      });
    }
    return rows;
  },

  parseXML(text, targetType) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");
    const tagName = targetType.endsWith('s') ? targetType.slice(0, -1) : targetType;
    const elements = xmlDoc.getElementsByTagName(tagName);
    const results = [];
    
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const obj = {};
      for (let j = 0; j < el.children.length; j++) {
        const child = el.children[j];
        obj[child.tagName.toLowerCase()] = child.textContent;
      }
      results.push(obj);
    }
    return results;
  },

  mapImportRow(row, type) {
    // Basic mapping based on keys found in row
    // In a real app, you'd show a mapping UI
    if (type === 'members') {
      return {
        id: row.id || row.memberid || null,
        firstName: row.firstname || row.first || row.name?.split(' ')[0] || '',
        lastName: row.lastname || row.last || row.name?.split(' ').slice(1).join(' ') || '',
        email: row.email || row.emailaddress || '',
        phone: row.phone || row.phonenumber || '',
        status: row.status || 'active',
        joinDate: row.joindate || row.date || new Date().toISOString().split('T')[0],
        kittyBalance: parseFloat(row.kittybalance || row.balance || 0),
        address: row.address || '',
        city: row.city || '',
        state: row.state || '',
        zipCode: row.zipcode || row.zip || '',
        country: row.country || 'USA'
      };
    }
    if (type === 'contributions') {
      return {
        id: row.id || null,
        memberId: row.memberid || '',
        deathEventId: row.deatheventid || '',
        deceasedName: row.deceasedname || row.deceased || '',
        amount: parseFloat(row.amount || 0),
        dueDate: row.duedate || row.date || '',
        status: row.status || 'unpaid'
      };
    }
    return row;
  }
};

window.Utils = Utils;
