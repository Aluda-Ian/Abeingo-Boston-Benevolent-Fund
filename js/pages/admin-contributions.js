/* ===========================
   ADMIN CONTRIBUTIONS PAGE
   =========================== */
Pages.adminContributions = {
  currentTab: 'contributions',

  render() {
    if (!Auth.requireAdmin()) return;
    const contribs = DB.getContributions();
    const deathEvents = DB.getDeathEvents();
    const members = DB.getMembers();

    const unpaid = contribs.filter(c => c.status === 'unpaid').length;
    const paid = contribs.filter(c => c.status === 'paid').length;
    const totalCollected = contribs.filter(c => c.status === 'paid').reduce((s, c) => s + (c.amount || 0), 0);
    const totalPending = contribs.filter(c => c.status === 'unpaid').reduce((s, c) => s + (c.amount || 0), 0);

    const content = `
      <div class="page-header">
        <div class="page-header-top">
          <div>
            <h1 class="page-title">💰 ${I18N.t('contributions')}</h1>
            <p class="page-subtitle">Track death events, contributions, and payment status.</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-ghost" onclick="Notifications.bulkPaymentReminder('email')">📧 Email Reminders</button>
            <button class="btn btn-ghost" onclick="Notifications.bulkPaymentReminder('whatsapp')">📱 WhatsApp Reminders</button>
            <button class="btn btn-danger" onclick="Pages.adminContributions.showDeathEventModal()">💔 Record Death Event</button>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid" style="grid-template-columns:repeat(4,1fr)">
        <div class="stat-card" style="--stat-color:#dc2626;--stat-icon-bg:#FEF2F2">
          <div class="stat-card-icon">💔</div>
          <div class="stat-card-value">${deathEvents.length}</div>
          <div class="stat-card-label">Death Events</div>
        </div>
        <div class="stat-card" style="--stat-color:var(--clr-grace);--stat-icon-bg:#FFFBEB">
          <div class="stat-card-icon">⌛</div>
          <div class="stat-card-value">${unpaid}</div>
          <div class="stat-card-label">Unpaid Contributions</div>
        </div>
        <div class="stat-card" style="--stat-color:var(--clr-active);--stat-icon-bg:#DCFCE7">
          <div class="stat-card-icon">✅</div>
          <div class="stat-card-value">${paid}</div>
          <div class="stat-card-label">Paid Contributions</div>
        </div>
        <div class="stat-card" style="--stat-color:var(--clr-accent);--stat-icon-bg:#FFFBEB">
          <div class="stat-card-icon">💵</div>
          <div class="stat-card-value">${Utils.formatCurrency(totalCollected)}</div>
          <div class="stat-card-label">Total Collected</div>
        </div>
      </div>

      ${totalPending > 0 ? `
        <div class="alert alert-warning">
          <span class="alert-icon">⚠️</span>
          <div class="alert-content">
            <div class="alert-title">${Utils.formatCurrency(totalPending)} in Pending Contributions</div>
            <div>${unpaid} contributions outstanding. <a href="#" onclick="Notifications.bulkPaymentReminder('email')" style="font-weight:600">Send reminders now</a></div>
          </div>
        </div>
      ` : ''}

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab-btn ${this.currentTab==='contributions'?'active':''}" onclick="Pages.adminContributions.setTab('contributions')">📋 All Contributions</button>
        <button class="tab-btn ${this.currentTab==='deaths'?'active':''}" onclick="Pages.adminContributions.setTab('deaths')">💔 Death Events</button>
        <button class="tab-btn ${this.currentTab==='balances'?'active':''}" onclick="Pages.adminContributions.setTab('balances')">💰 Member Balances</button>
      </div>

      <div id="contrib-tab-content">
        ${this.renderTab(this.currentTab)}
      </div>
    `;
    renderAdminLayout('contributions', content);
  },

  setTab(tab) {
    this.currentTab = tab;
    document.getElementById('contrib-tab-content').innerHTML = this.renderTab(tab);
    document.querySelectorAll('.tab-btn').forEach((b, i) => {
      b.classList.toggle('active', ['contributions','deaths','balances'][i] === tab);
    });
  },

  renderTab(tab) {
    if (tab === 'contributions') return this.renderContributions();
    if (tab === 'deaths') return this.renderDeathEvents();
    if (tab === 'balances') return this.renderBalances();
    return '';
  },

  renderContributions() {
    const contribs = DB.getContributions();
    if (!contribs.length) return `<div class="empty-state"><div class="empty-state-icon">✅</div><div class="empty-state-title">No contributions yet</div><div class="empty-state-text">Contributions are created automatically when a death event is recorded.</div></div>`;

    return `
      <div class="table-wrapper">
        <div class="table-header">
          <div class="table-header-title">All Contributions</div>
          <div style="display:flex;gap:0.5rem">
            <button class="btn btn-sm btn-outline" onclick="Utils.showImportModal('contributions')">📥 Import Contributions</button>
            <button class="btn btn-sm btn-outline" onclick="PDF.contributionsReport()">📄 Export PDF</button>
          </div>
        </div>
        <table class="data-table">
          <thead>
            <tr><th>Member</th><th>Death Event</th><th>Amount</th><th>Due Date</th><th>Late Fee</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${contribs.map(c => {
              const m = DB.getMember(c.memberId);
              const lateFee = c.status === 'unpaid' ? Utils.calculateLateFee(c.dueDate) : (c.lateFee || 0);
              return `
                <tr>
                  <td>
                    <div class="member-info">
                      <div class="member-avatar" style="width:30px;height:30px;font-size:0.75rem">${m ? Utils.getInitials(m.firstName, m.lastName) : '?'}</div>
                      <div>
                        <div class="member-name">${m ? Utils.sanitize(Utils.fullName(m)) : 'Unknown'}</div>
                      </div>
                    </div>
                  </td>
                  <td style="font-size:0.8rem">${Utils.sanitize(c.deceasedName || '—')}</td>
                  <td style="font-weight:600">${Utils.formatCurrency(c.amount)}</td>
                  <td style="font-size:0.8rem">
                    ${Utils.formatDate(c.dueDate)}
                    ${c.status === 'unpaid' && new Date() > new Date(c.dueDate) ? '<br><span style="color:#dc2626;font-size:0.7rem">OVERDUE</span>' : ''}
                  </td>
                  <td style="color:${lateFee > 0 ? '#dc2626' : 'var(--clr-text-muted)'}">
                    ${lateFee > 0 ? Utils.formatCurrency(lateFee) : '—'}
                  </td>
                  <td>
                    <span class="badge ${c.status === 'paid' ? 'badge-active' : 'badge-grace'}">${c.status}</span>
                  </td>
                  <td>
                    ${c.status === 'unpaid' ? `
                      <button class="btn btn-sm btn-success" onclick="Pages.adminContributions.markPaid('${c.id}')">✅ Mark Paid</button>
                    ` : '<span style="font-size:0.8rem;color:var(--clr-text-muted)">Paid</span>'}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderDeathEvents() {
    const events = DB.getDeathEvents();
    if (!events.length) return `<div class="empty-state"><div class="empty-state-icon">🕊️</div><div class="empty-state-title">No death events recorded</div><div class="empty-state-text">When a death is reported, record it here to trigger contributions for all active members.</div><button class="btn btn-primary" style="margin-top:1rem" onclick="Pages.adminContributions.showDeathEventModal()">💔 Record First Death Event</button></div>`;

    return `
      <div style="display:flex;flex-direction:column;gap:var(--sp-4)">
        ${events.map(e => {
          const reporter = DB.getMember(e.reportedByMemberId);
          const contribs = DB.getContributions().filter(c => c.deathEventId === e.id);
          const paid = contribs.filter(c => c.status === 'paid').length;
          const docs = DB.getDocuments().filter(d => d.deathEventId === e.id);
          return `
            <div class="card death-event-card">
              <div class="card-header" style="background:#fef2f2">
                <div>
                  <div class="card-title" style="color:#991b1b">💔 ${Utils.sanitize(e.deceasedName)}</div>
                  <div style="font-size:0.8rem;color:var(--clr-text-muted)">${Utils.sanitize(e.relationship)} of ${reporter ? Utils.sanitize(Utils.fullName(reporter)) : 'Member'} &bull; Date of Death: ${Utils.formatDate(e.dateOfDeath)}</div>
                </div>
                <div style="display:flex;align-items:center;gap:0.75rem">
                  <span class="badge ${e.verified ? 'badge-active' : 'badge-pending'}">${e.verified ? '✅ Verified' : '⏳ Pending Verification'}</span>
                  ${!e.verified ? `<button class="btn btn-sm btn-success" onclick="Pages.adminContributions.verifyDeath('${e.id}')">Verify</button>` : ''}
                </div>
              </div>
              <div class="card-body">
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1rem">
                  <div>
                    <div style="font-size:0.65rem;text-transform:uppercase;color:var(--clr-text-muted);font-weight:700">Payout Amount</div>
                    <div style="font-size:1.2rem;font-weight:800;color:var(--clr-primary)">${Utils.formatCurrency(e.payoutAmount)}</div>
                  </div>
                  <div>
                    <div style="font-size:0.65rem;text-transform:uppercase;color:var(--clr-text-muted);font-weight:700">Contributions</div>
                    <div style="font-size:1.2rem;font-weight:800">${paid}/${contribs.length} paid</div>
                  </div>
                  <div>
                    <div style="font-size:0.65rem;text-transform:uppercase;color:var(--clr-text-muted);font-weight:700">Reported</div>
                    <div style="font-size:0.85rem;font-weight:600">${Utils.formatDate(e.createdAt)}</div>
                  </div>
                  <div>
                    <div style="font-size:0.65rem;text-transform:uppercase;color:var(--clr-text-muted);font-weight:700">Documents</div>
                    <div style="font-size:0.85rem;font-weight:600">${docs.length} uploaded</div>
                  </div>
                </div>
                ${e.notes ? `<p style="font-size:0.8rem;color:var(--clr-text-muted)">${Utils.sanitize(e.notes)}</p>` : ''}
                <div style="display:flex;gap:0.5rem;margin-top:0.75rem">
                  <button class="btn btn-sm btn-ghost" onclick="const e=DB.getDeathEvent('${e.id}'); Router.navigate('emails', {type: 'death', subject: 'Abeingo BBF — Notice of Bereavement', body: \`Dear {member_name},\\n\\nWe regret to inform you of the passing of \${e.deceasedName} on \${Utils.formatDate(e.dateOfDeath)}.\\n\\nPlease keep the family in your thoughts.\\n\\nSincerely,\\n{admin_name}\`})">📧 Send Notification</button>
                  <button class="btn btn-sm btn-ghost" onclick="PDF.contributionsReport()">📄 Export</button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderBalances() {
    const members = DB.getMembers().filter(m => m.status !== 'terminated');
    return `
      <div class="table-wrapper">
        <div class="table-header"><div class="table-header-title">Member Kitty Balances</div></div>
        <table class="data-table">
          <thead>
            <tr><th>Member</th><th>Status</th><th>Kitty Balance</th><th>Unpaid Contribs</th><th>Total Owed</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${members.sort((a, b) => (b.kittyBalance || 0) - (a.kittyBalance || 0)).map(m => {
              const unpaidContribs = DB.getMemberContributions(m.id).filter(c => c.status === 'unpaid');
              const totalOwed = unpaidContribs.reduce((s, c) => s + (c.amount || 0) + Utils.calculateLateFee(c.dueDate), 0);
              return `
                <tr>
                  <td>
                    <div class="member-info">
                      <div class="member-avatar" style="width:32px;height:32px;font-size:0.75rem">${Utils.getInitials(m.firstName, m.lastName)}</div>
                      <div class="member-name">${Utils.sanitize(Utils.fullName(m))}</div>
                    </div>
                  </td>
                  <td>${Utils.statusBadge(m.status)}</td>
                  <td style="font-weight:700;color:var(--clr-primary)">${Utils.formatCurrency(m.kittyBalance)}</td>
                  <td>${unpaidContribs.length > 0 ? `<span style="color:#dc2626;font-weight:600">${unpaidContribs.length}</span>` : '<span style="color:var(--clr-active)">0</span>'}</td>
                  <td style="font-weight:${totalOwed > 0 ? '700' : '400'};color:${totalOwed > 0 ? '#dc2626' : 'var(--clr-active)'}">
                    ${totalOwed > 0 ? Utils.formatCurrency(totalOwed) : 'None'}
                  </td>
                  <td>
                    <button class="btn btn-sm btn-outline" onclick="Pages.adminMembers.showAddPaymentModal('${m.id}')">Add Payment</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  markPaid(id) {
    const contribs = DB.getContributions();
    const c = contribs.find(x => x.id === id);
    if (!c) return;
    c.status = 'paid';
    c.paidDate = new Date().toISOString();
    c.markedPaidBy = Auth.currentUser.id;
    DB.set(DB.KEYS.contributions, contribs);
    DB.addAuditLog(id, 'contribution', 'marked_paid', {status:'unpaid'}, {status:'paid'});
    Utils.toast('Contribution marked as paid!', 'success');
    this.render();
  },

  verifyDeath(id) {
    const events = DB.getDeathEvents();
    const e = events.find(x => x.id === id);
    if (!e) return;
    e.verified = true;
    e.verifiedAt = new Date().toISOString();
    e.verifiedBy = Auth.currentUser.id;
    DB.set(DB.KEYS.deathEvents, events);
    DB.addAuditLog(id, 'death_event', 'verified', {verified:false}, {verified:true});
    
    Utils.toast('Death event verified. Please review the notification.', 'success');
    this.render();
    
    const prefilledBody = `Dear {member_name},\n\nWe regret to inform you of the passing of ${e.deceasedName} on ${Utils.formatDate(e.dateOfDeath)}.\n\nPlease keep the family in your thoughts.\n\nSincerely,\n{admin_name}`;
    setTimeout(() => {
      Router.navigate('emails', { type: 'death', subject: 'Abeingo BBF — Notice of Bereavement', body: prefilledBody });
    }, 100);
  },

  showDeathEventModal() {
    const members = DB.getMembers().filter(m => m.status === 'active');
    Utils.showModal(
      '💔 Record Death Event',
      `<div>
        <div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content">Recording a death event will automatically create contribution requests for all active members (excluding the reporting member).</div></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
          <div class="form-field">
            <label class="field-label">Deceased Name<span class="field-required">*</span></label>
            <input type="text" id="death-name" class="field-input" placeholder="Full name"/>
          </div>
          <div class="form-field">
            <label class="field-label">Date of Death<span class="field-required">*</span></label>
            <input type="date" id="death-date" class="field-input"/>
          </div>
          <div class="form-field">
            <label class="field-label">Relationship to Member</label>
            <select id="death-relationship" class="field-select">
              <option value="spouse">Spouse</option>
              <option value="child">Child</option>
              <option value="parent">Parent</option>
              <option value="sibling">Sibling</option>
              <option value="member">Member Themselves</option>
              <option value="other">Other Family</option>
            </select>
          </div>
          <div class="form-field">
            <label class="field-label">Reported By (Member)</label>
            <select id="death-reporter" class="field-select">
              <option value="">Select member</option>
              ${members.map(m => `<option value="${m.id}">${Utils.sanitize(Utils.fullName(m))}</option>`).join('')}
            </select>
          </div>
          <div class="form-field">
            <label class="field-label">Payout Amount (USD)</label>
            <input type="number" id="death-payout" class="field-input" placeholder="e.g. 2000" step="0.01" min="0"/>
          </div>
          <div class="form-field">
            <label class="field-label">Verified</label>
            <select id="death-verified" class="field-select">
              <option value="false">Pending Verification</option>
              <option value="true">Verified</option>
            </select>
          </div>
          <div class="form-field full-width" style="grid-column:1/-1">
            <label class="field-label">Notes</label>
            <textarea id="death-notes" class="field-textarea" placeholder="Additional notes or verification details..."></textarea>
          </div>
        </div>
      </div>`,
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
       <button class="btn btn-danger" onclick="Pages.adminContributions.confirmDeathEvent()">💔 Record Death Event</button>`
    );
  },

  confirmDeathEvent() {
    const name = document.getElementById('death-name').value.trim();
    const date = document.getElementById('death-date').value;
    const relationship = document.getElementById('death-relationship').value;
    const reporterId = document.getElementById('death-reporter').value;
    const payout = parseFloat(document.getElementById('death-payout').value) || 0;
    const verified = document.getElementById('death-verified').value === 'true';
    const notes = document.getElementById('death-notes').value;

    if (!name || !date) { Utils.toast('Please fill required fields', 'error'); return; }

    const event = DB.saveDeathEvent({
      deceasedName: name,
      dateOfDeath: date,
      relationship,
      reportedByMemberId: reporterId,
      payoutAmount: payout,
      verified,
      notes
    });

    DB.addAuditLog(event.id, 'death_event', 'created', null, { deceasedName: name });
    
    Utils.closeModal();
    this.render();
    
    if (verified) {
      Utils.toast(`Death event recorded. Please review the notification.`, 'success');
      const prefilledBody = `Dear {member_name},\n\nWe regret to inform you of the passing of ${name} on ${Utils.formatDate(date)}.\n\nPlease keep the family in your thoughts.\n\nSincerely,\n{admin_name}`;
      setTimeout(() => {
        Router.navigate('emails', { type: 'death', subject: 'Abeingo BBF — Notice of Bereavement', body: prefilledBody });
      }, 100);
    } else {
      Utils.toast(`Death event recorded.`, 'success');
    }
  }
};
