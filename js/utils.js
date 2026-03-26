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

  // Confirm dialog
  confirm(title, message, onConfirm, dangerBtn = false) {
    const btnClass = dangerBtn ? 'btn-danger' : 'btn-primary';
    this.showModal(
      title,
      `<p style="color:var(--clr-text-muted);font-size:var(--text-sm)">${message}</p>`,
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
       <button class="btn ${btnClass}" onclick="Utils.closeModal(); (${onConfirm.toString()})()">Confirm</button>`
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
    const search = window.location.search.substring(1);
    search.split('&').forEach(pair => {
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

  // Send registration link
  sendRegistrationLink(email, name = '') {
    let member = DB.getMemberByEmail(email);
    if (!member) {
      // Create placeholder
      const id = DB.newId();
      member = { id, email, firstName: name.split(' ')[0] || 'New', lastName: name.split(' ').slice(1).join(' ') || 'Member', status: 'pending', kittyBalance: 0 };
      DB.saveMember(member);
    }
    const token = DB.generateToken('registration', member.id, email);
    const link = this.generateLink(token);
    DB.addNotification({
      memberId: member.id,
      type: 'registration_link',
      channel: 'email',
      message: `Registration link: ${link}\nExpires: ${Utils.formatDateTime(token.expiresAt)}`,
      subject: 'Abeingo Boston Benevolent Fund – Registration Link',
      status: 'sent',
      recipientEmail: email,
      link
    });
    this.toast(`Registration link generated for ${email}`, 'success');
    return { token, link, member };
  },

  sendUpdateLink(memberId) {
    const member = DB.getMember(memberId);
    if (!member) return null;
    const token = DB.generateToken('update', memberId, member.email);
    const link = this.generateLink(token);
    DB.addNotification({
      memberId,
      type: 'update_link',
      channel: 'email',
      message: `Update link: ${link}\nExpires: ${Utils.formatDateTime(token.expiresAt)}`,
      subject: 'Abeingo Boston Benevolent Fund – Update Your Information',
      status: 'sent',
      recipientEmail: member.email,
      link
    });
    this.toast(`Update link sent to ${member.email}`, 'success');
    return { token, link };
  },

  // Export to CSV (for PDF simulation)
  membersToCSV(members) {
    const headers = ['ID','First Name','Last Name','Email','Phone','Status','Join Date','City','Kitty Balance'];
    const rows = members.map(m => [
      m.id, m.firstName, m.lastName, m.email, m.phone, m.status, m.joinDate || '', m.city || '', m.kittyBalance || 0
    ]);
    return [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  }
};

window.Utils = Utils;
