/* ===========================
   ADMIN SETTINGS PAGE
   =========================== */
Pages.adminSettings = {
  render() {
    if (!Auth.requireAdmin()) return;
    const settings = { ...DB.getDefaultSettings(), ...DB.getSettings() };
    const admins = DB.getAdmins();

    const content = `
      <div class="page-header">
        <div class="page-header-top">
          <div>
            <h1 class="page-title">⚙️ ${I18N.t('settings')}</h1>
            <p class="page-subtitle">Configure system settings, admin users, and notification preferences.</p>
          </div>
          <button class="btn btn-primary" onclick="Pages.adminSettings.saveAllSettings()">💾 Save All Settings</button>
        </div>
      </div>

      <!-- Fund Settings -->
      <div class="settings-section">
        <div class="settings-section-header">🏛️ Fund Settings</div>
        <div class="settings-section-body">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
            <div class="form-field">
              <label class="field-label">Organization Name</label>
              <input type="text" id="set-org-name" class="field-input" value="${Utils.sanitize(settings.orgName)}"/>
            </div>
            <div class="form-field">
              <label class="field-label">Currency</label>
              <select id="set-currency" class="field-select">
                <option value="USD" ${settings.currency==='USD'?'selected':''}>USD ($)</option>
                <option value="EUR" ${settings.currency==='EUR'?'selected':''}>EUR (€)</option>
                <option value="GBP" ${settings.currency==='GBP'?'selected':''}>GBP (£)</option>
              </select>
            </div>
            <div class="form-field">
              <label class="field-label">Registration Fee ($)</label>
              <input type="number" id="set-reg-fee" class="field-input" value="${settings.registrationFee}" min="0" step="0.01"/>
            </div>
            <div class="form-field">
              <label class="field-label">Grace Period (days)</label>
              <input type="number" id="set-grace-days" class="field-input" value="${settings.gracePeriodDays}" min="1"/>
            </div>
            <div class="form-field">
              <label class="field-label">Late Fee – Week 1 ($)</label>
              <input type="number" id="set-late-w1" class="field-input" value="${settings.lateFeeWeek1}" min="0" step="0.01"/>
            </div>
            <div class="form-field">
              <label class="field-label">Late Fee – Week 2+ ($)</label>
              <input type="number" id="set-late-w2" class="field-input" value="${settings.lateFeeWeek2Plus}" min="0" step="0.01"/>
            </div>
            <div class="form-field">
              <label class="field-label">Payment Due (business days)</label>
              <input type="number" id="set-pay-due" class="field-input" value="${settings.paymentDueDays}" min="1"/>
            </div>
            <div class="form-field">
              <label class="field-label">Link Expiry (hours)</label>
              <input type="number" id="set-link-expiry" class="field-input" value="${settings.linkExpiryHours}" min="1"/>
            </div>
            <div class="form-field">
              <label class="field-label">Semi-Annual Reminder (months)</label>
              <input type="number" id="set-semi-annual" class="field-input" value="${settings.semiAnnualReminderMonths}" min="1" max="12"/>
            </div>
          </div>
        </div>
      </div>

      <!-- Notification Settings -->
      <div class="settings-section">
        <div class="settings-section-header">📧 Notification Settings</div>
        <div class="settings-section-body">
          <div class="settings-row">
            <div class="settings-row-left">
              <div class="settings-row-label">Email Notifications</div>
              <div class="settings-row-desc">Send notifications via email to members and admins</div>
            </div>
            <label class="toggle">
              <input type="checkbox" id="set-email-enabled" ${settings.emailEnabled?'checked':''}/>
              <div class="toggle-slider"></div>
            </label>
          </div>
          <div class="settings-row">
            <div class="settings-row-left">
              <div class="settings-row-label">WhatsApp Notifications</div>
              <div class="settings-row-desc">Send notifications via WhatsApp (requires API key)</div>
            </div>
            <label class="toggle">
              <input type="checkbox" id="set-whatsapp-enabled" ${settings.whatsappEnabled?'checked':''}/>
              <div class="toggle-slider"></div>
            </label>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1rem">
            <div class="form-field">
              <label class="field-label">Admin Email</label>
              <input type="email" id="set-admin-email" class="field-input" value="${Utils.sanitize(settings.adminEmail)}" placeholder="admin@abeingo.org"/>
            </div>
            <div class="form-field">
              <label class="field-label">Admin WhatsApp Number</label>
              <input type="text" id="set-admin-phone" class="field-input" value="${Utils.sanitize(settings.adminPhone)}" placeholder="+1-617-555-0000"/>
            </div>
            <div class="form-field">
              <label class="field-label">SMTP Host</label>
              <input type="text" id="set-smtp-host" class="field-input" value="${Utils.sanitize(settings.smtpHost)}" placeholder="smtp.gmail.com"/>
            </div>
            <div class="form-field">
              <label class="field-label">SMTP Port</label>
              <input type="text" id="set-smtp-port" class="field-input" value="${Utils.sanitize(settings.smtpPort)}" placeholder="587"/>
            </div>
            <div class="form-field">
              <label class="field-label">SMTP Username</label>
              <input type="email" id="set-smtp-user" class="field-input" value="${Utils.sanitize(settings.smtpUser)}" placeholder="your@email.com"/>
            </div>
            <div class="form-field">
              <label class="field-label">SMTP Password</label>
              <input type="password" id="set-smtp-pass" class="field-input" value="${Utils.sanitize(settings.smtpPass)}" placeholder="••••••••"/>
            </div>
            <div class="form-field">
              <label class="field-label">WhatsApp API Key</label>
              <input type="text" id="set-wa-key" class="field-input" value="${Utils.sanitize(settings.whatsappApiKey)}" placeholder="Your Twilio/API key"/>
            </div>
          </div>
        </div>
      </div>

      <!-- Admin Users -->
      <div class="settings-section">
        <div class="settings-section-header" style="justify-content:space-between">
          <span>👤 Admin Users</span>
          <button class="btn btn-sm btn-primary" onclick="Pages.adminSettings.showAddAdminModal()">+ Add Admin</button>
        </div>
        <div class="settings-section-body" style="padding:0">
          <table class="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              ${admins.map(a => `
                <tr>
                  <td>
                    <div class="member-info">
                      <div class="member-avatar" style="width:32px;height:32px;font-size:0.75rem">${Utils.getInitials(a.firstName, a.lastName)}</div>
                      <div class="member-name">${Utils.sanitize(Utils.fullName(a))}</div>
                    </div>
                  </td>
                  <td style="font-size:0.8rem">${Utils.sanitize(a.email)}</td>
                  <td><span class="badge ${a.role==='super_admin'?'badge-active':'badge-pending'}">${a.role === 'super_admin' ? 'Super Admin' : 'Committee'}</span></td>
                  <td><span class="badge ${a.active?'badge-active':'badge-suspended'}">${a.active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    ${a.id !== Auth.currentUser.id ? `
                      <button class="btn btn-sm btn-ghost" onclick="Pages.adminSettings.toggleAdminActive('${a.id}',${!a.active})">
                        ${a.active ? '🚫 Deactivate' : '✅ Activate'}
                      </button>
                    ` : '<span style="font-size:0.75rem;color:var(--clr-text-muted)">You</span>'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Data Management -->
      <div class="settings-section">
        <div class="settings-section-header">🗄️ Data Management</div>
        <div class="settings-section-body">
          <div class="settings-row">
            <div class="settings-row-left">
              <div class="settings-row-label">Export All Data</div>
              <div class="settings-row-desc">Download all member data as JSON backup</div>
            </div>
            <button class="btn btn-outline" onclick="Pages.adminSettings.exportData()">📦 Export Backup</button>
          </div>
          <div class="settings-row">
            <div class="settings-row-left">
              <div class="settings-row-label">Clear Expired Tokens</div>
              <div class="settings-row-desc">Remove all expired registration/update links</div>
            </div>
            <button class="btn btn-ghost" onclick="Pages.adminSettings.clearExpiredTokens()">🧹 Clear Tokens</button>
          </div>
          ${Auth.isSuperAdmin() ? `
          <div class="settings-row">
            <div class="settings-row-left">
              <div class="settings-row-label" style="color:#dc2626">Reset Demo Data</div>
              <div class="settings-row-desc">Reset all member data to initial demo state (DESTRUCTIVE)</div>
            </div>
            <button class="btn btn-danger" onclick="Pages.adminSettings.resetData()">⚠️ Reset Data</button>
          </div>
          ` : ''}
        </div>
      </div>
    `;
    renderAdminLayout('settings', content);
  },

  saveAllSettings() {
    const settings = {
      orgName: document.getElementById('set-org-name').value,
      currency: document.getElementById('set-currency').value,
      registrationFee: parseFloat(document.getElementById('set-reg-fee').value) || 10,
      gracePeriodDays: parseInt(document.getElementById('set-grace-days').value) || 90,
      lateFeeWeek1: parseFloat(document.getElementById('set-late-w1').value) || 5,
      lateFeeWeek2Plus: parseFloat(document.getElementById('set-late-w2').value) || 2,
      paymentDueDays: parseInt(document.getElementById('set-pay-due').value) || 15,
      linkExpiryHours: parseInt(document.getElementById('set-link-expiry').value) || 72,
      semiAnnualReminderMonths: parseInt(document.getElementById('set-semi-annual').value) || 6,
      emailEnabled: document.getElementById('set-email-enabled').checked,
      whatsappEnabled: document.getElementById('set-whatsapp-enabled').checked,
      adminEmail: document.getElementById('set-admin-email').value,
      adminPhone: document.getElementById('set-admin-phone').value,
      smtpHost: document.getElementById('set-smtp-host').value,
      smtpPort: document.getElementById('set-smtp-port').value,
      smtpUser: document.getElementById('set-smtp-user').value,
      smtpPass: document.getElementById('set-smtp-pass').value,
      whatsappApiKey: document.getElementById('set-wa-key').value,
    };
    DB.saveSettings(settings);
    DB.addAuditLog('system', 'settings', 'updated', null, null);
    Utils.toast('Settings saved successfully!', 'success');
  },

  showAddAdminModal() {
    Utils.showModal(
      '👤 Add Admin User',
      `<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
        <div class="form-field">
          <label class="field-label">First Name<span class="field-required">*</span></label>
          <input type="text" id="new-admin-fname" class="field-input"/>
        </div>
        <div class="form-field">
          <label class="field-label">Last Name<span class="field-required">*</span></label>
          <input type="text" id="new-admin-lname" class="field-input"/>
        </div>
        <div class="form-field">
          <label class="field-label">Email<span class="field-required">*</span></label>
          <input type="email" id="new-admin-email" class="field-input"/>
        </div>
        <div class="form-field">
          <label class="field-label">Role</label>
          <select id="new-admin-role" class="field-select">
            <option value="committee">Committee Member</option>
            ${Auth.isSuperAdmin() ? '<option value="super_admin">Super Admin</option>' : ''}
          </select>
        </div>
        <div class="form-field">
          <label class="field-label">Password<span class="field-required">*</span></label>
          <input type="password" id="new-admin-pass" class="field-input"/>
        </div>
        <div class="form-field">
          <label class="field-label">Confirm Password</label>
          <input type="password" id="new-admin-pass2" class="field-input"/>
        </div>
      </div>`,
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="Pages.adminSettings.confirmAddAdmin()">Add Admin</button>`
    );
  },

  confirmAddAdmin() {
    const fname = document.getElementById('new-admin-fname').value.trim();
    const lname = document.getElementById('new-admin-lname').value.trim();
    const email = document.getElementById('new-admin-email').value.trim();
    const role = document.getElementById('new-admin-role').value;
    const pass = document.getElementById('new-admin-pass').value;
    const pass2 = document.getElementById('new-admin-pass2').value;

    if (!fname || !email || !pass) { Utils.toast('Please fill all required fields', 'error'); return; }
    if (pass !== pass2) { Utils.toast('Passwords do not match', 'error'); return; }
    if (!Utils.isValidEmail(email)) { Utils.toast('Invalid email', 'error'); return; }
    if (DB.getAdminByEmail(email)) { Utils.toast('Admin with this email already exists', 'error'); return; }

    DB.saveAdmin({ id: DB.newGenId('ADM'), firstName: fname, lastName: lname, email, password: pass, role, active: true });
    DB.addAuditLog('admin', 'admin', 'created', null, { email, role });
    Utils.closeModal();
    Utils.toast(`Admin ${fname} ${lname} added!`, 'success');
    this.render();
  },

  toggleAdminActive(id, active) {
    const admins = DB.getAdmins();
    const a = admins.find(x => x.id === id);
    if (a) { a.active = active; DB.set(DB.KEYS.admins, admins); }
    Utils.toast(`Admin ${active ? 'activated' : 'deactivated'}`, 'success');
    this.render();
  },

  exportData() {
    const data = {
      exportDate: new Date().toISOString(),
      members: DB.getMembers(),
      deathEvents: DB.getDeathEvents(),
      contributions: DB.getContributions(),
      payments: DB.getPayments(),
      notifications: DB.getNotifications(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `abeingo-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    Utils.toast('Data exported!', 'success');
  },

  clearExpiredTokens() {
    const tokens = DB.get(DB.KEYS.tokens).filter(t => new Date() < new Date(t.expiresAt) && !t.used);
    DB.set(DB.KEYS.tokens, tokens);
    Utils.toast('Expired tokens cleared!', 'success');
  },

  resetData() {
    Utils.confirm('⚠️ Reset All Data', 'This will remove all members, contributions, and events. Admin accounts will be kept. This cannot be undone!', () => {
      DB.set(DB.KEYS.members, []);
      DB.set(DB.KEYS.contributions, []);
      DB.set(DB.KEYS.payments, []);
      DB.set(DB.KEYS.deathEvents, []);
      DB.set(DB.KEYS.documents, []);
      DB.set(DB.KEYS.tokens, []);
      DB.set(DB.KEYS.auditLog, []);
      DB.set(DB.KEYS.notifications, []);
      DB.seedIfEmpty();
      Utils.toast('Data reset to demo state!', 'warning');
      Pages.adminSettings.render();
    }, true);
  }
};
