/* ===========================
   ADMIN MEMBERS PAGE
   =========================== */
Pages.adminMembers = {
  currentView: 'table',
  currentFilter: 'all',
  searchQuery: '',
  currentPage: 1,
  perPage: 10,

  render() {
    if (!Auth.requireAdmin()) return;
    const members = this.getFilteredMembers();
    const content = `
      <div class="page-header">
        <div class="page-header-top">
          <div>
            <h1 class="page-title">👥 ${I18N.t('members')}</h1>
            <p class="page-subtitle">Manage all fund members, send links, and track status.</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-outline" onclick="Pages.adminMembers.showBulkSendModal()">📢 ${I18N.t('bulkSend')}</button>
            <button class="btn btn-primary" onclick="Pages.adminMembers.showSendLinkModal()">+ ${I18N.t('sendInvite')}</button>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <div class="search-input-wrap">
          <span class="search-icon">🔍</span>
          <input type="text" class="field-input" style="padding-left:2.2rem;width:220px" placeholder="Search members..." id="member-search" oninput="Pages.adminMembers.onSearch(this.value)" value="${Utils.sanitize(this.searchQuery)}"/>
        </div>
        <select class="filter-select" onchange="Pages.adminMembers.setFilter(this.value)" id="status-filter">
          <option value="all" ${this.currentFilter==='all'?'selected':''}>All Status</option>
          <option value="active" ${this.currentFilter==='active'?'selected':''}>Active</option>
          <option value="grace" ${this.currentFilter==='grace'?'selected':''}>Grace Period</option>
          <option value="pending" ${this.currentFilter==='pending'?'selected':''}>Pending</option>
          <option value="suspended" ${this.currentFilter==='suspended'?'selected':''}>Suspended</option>
          <option value="terminated" ${this.currentFilter==='terminated'?'selected':''}>Terminated</option>
        </select>
        <div class="view-toggle">
          <button class="view-toggle-btn ${this.currentView==='table'?'active':''}" onclick="Pages.adminMembers.setView('table')">☰ Table</button>
          <button class="view-toggle-btn ${this.currentView==='grid'?'active':''}" onclick="Pages.adminMembers.setView('grid')">⊞ Grid</button>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="PDF.membersReport(DB.getMembers())">📄 ${I18N.t('exportPDF')}</button>
        <span style="color:var(--clr-text-muted);font-size:var(--text-sm)">${members.length} members</span>
      </div>

      <!-- Content -->
      <div id="members-content">
        ${this.currentView === 'table' ? this.renderTable(members) : this.renderGrid(members)}
      </div>
    `;
    renderAdminLayout('members', content);
  },

  getFilteredMembers() {
    let members = DB.getMembers();
    if (this.currentFilter !== 'all') members = members.filter(m => m.status === this.currentFilter);
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      members = members.filter(m =>
        Utils.fullName(m).toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.phone || '').includes(q) ||
        m.id.toLowerCase().includes(q)
      );
    }
    return members;
  },

  setFilter(filter) { this.currentFilter = filter; this.currentPage = 1; this.render(); },
  setView(view) { this.currentView = view; this.render(); },
  onSearch(q) { this.searchQuery = q; this.currentPage = 1; this.render(); },

  renderTable(members) {
    const start = (this.currentPage - 1) * this.perPage;
    const paged = members.slice(start, start + this.perPage);
    const totalPages = Math.ceil(members.length / this.perPage);

    if (!paged.length) return `<div class="empty-state"><div class="empty-state-icon">👥</div><div class="empty-state-title">No members found</div><div class="empty-state-text">Try changing filters or send registration links to new members.</div></div>`;

    return `
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>ID</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Join Date</th>
              <th>Kitty Balance</th>
              <th>Last Verified</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${paged.map(m => `
              <tr>
                <td>
                  <div class="member-info">
                    <div class="member-avatar">${Utils.getInitials(m.firstName, m.lastName)}</div>
                    <div>
                      <div class="member-name">${Utils.sanitize(Utils.fullName(m))}</div>
                      <div class="member-email">${Utils.sanitize(m.city || '')}${m.state ? ', '+m.state : ''}</div>
                    </div>
                  </div>
                </td>
                <td><code style="font-size:0.75rem;background:var(--clr-surface-2);padding:2px 6px;border-radius:4px">${m.id}</code></td>
                <td>
                  <div style="font-size:0.8rem">${Utils.sanitize(m.email)}</div>
                  <div style="font-size:0.75rem;color:var(--clr-text-muted)">${Utils.sanitize(m.phone || '—')}</div>
                </td>
                <td>${Utils.statusBadge(m.status)}</td>
                <td style="font-size:0.8rem">${Utils.formatDate(m.joinDate)}</td>
                <td style="font-weight:600">${Utils.formatCurrency(m.kittyBalance)}</td>
                <td style="font-size:0.8rem">
                  ${m.lastVerified 
                    ? Utils.formatDate(m.lastVerified)
                    : '<span style="color:var(--clr-suspended)">Never</span>'
                  }
                </td>
                <td>
                  <div class="action-btn-group">
                    <button class="action-btn primary" title="View Details" onclick="Pages.adminMembers.viewMember('${m.id}')">👁</button>
                    <button class="action-btn success" title="Send Update Link" onclick="Pages.adminMembers.sendUpdateLink('${m.id}')">📨</button>
                    <button class="action-btn primary" title="Add Payment" onclick="Pages.adminMembers.showAddPaymentModal('${m.id}')">💰</button>
                    <button class="action-btn" title="More Options" onclick="Pages.adminMembers.showMemberMenu(event, '${m.id}')">⋯</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${this.renderPagination(totalPages)}
      </div>
    `;
  },

  renderGrid(members) {
    if (!members.length) return `<div class="empty-state"><div class="empty-state-icon">👥</div><div class="empty-state-title">No members found</div></div>`;
    return `<div class="members-grid">${members.map(m => `
      <div class="member-card">
        <div class="member-card-header">
          <div class="member-card-avatar">${Utils.getInitials(m.firstName, m.lastName)}</div>
          <div class="member-card-info">
            <div class="member-card-name">${Utils.sanitize(Utils.fullName(m))}</div>
            <div class="member-card-id">${m.id}</div>
            <div style="margin-top:4px">${Utils.statusBadge(m.status)}</div>
          </div>
        </div>
        <div class="member-card-details">
          <div class="member-card-detail">
            <div class="member-card-detail-label">Email</div>
            <div class="member-card-detail-value">${Utils.sanitize(m.email)}</div>
          </div>
          <div class="member-card-detail">
            <div class="member-card-detail-label">Phone</div>
            <div class="member-card-detail-value">${Utils.sanitize(m.phone || '—')}</div>
          </div>
          <div class="member-card-detail">
            <div class="member-card-detail-label">Join Date</div>
            <div class="member-card-detail-value">${Utils.formatDate(m.joinDate)}</div>
          </div>
          <div class="member-card-detail">
            <div class="member-card-detail-label">Kitty Balance</div>
            <div class="member-card-detail-value" style="color:var(--clr-primary);font-weight:700">${Utils.formatCurrency(m.kittyBalance)}</div>
          </div>
          <div class="member-card-detail">
            <div class="member-card-detail-label">Family Members</div>
            <div class="member-card-detail-value">${(m.familyMembers || []).length}</div>
          </div>
          <div class="member-card-detail">
            <div class="member-card-detail-label">Last Verified</div>
            <div class="member-card-detail-value">${Utils.formatDate(m.lastVerified)}</div>
          </div>
        </div>
        <div class="member-card-actions">
          <button class="btn btn-sm btn-outline" onclick="Pages.adminMembers.viewMember('${m.id}')">👁 View</button>
          <button class="btn btn-sm btn-primary" onclick="Pages.adminMembers.sendUpdateLink('${m.id}')">📨 Update Link</button>
          <button class="btn btn-sm btn-ghost" onclick="Pages.adminMembers.showMemberMenu(event, '${m.id}')">⋯</button>
        </div>
      </div>
    `).join('')}</div>`;
  },

  renderPagination(totalPages) {
    if (totalPages <= 1) return '';
    const pages = Array.from({length: totalPages}, (_, i) => i + 1);
    return `<div class="pagination">
      <button class="page-btn" onclick="Pages.adminMembers.goPage(${this.currentPage-1})" ${this.currentPage===1?'disabled':''}>‹</button>
      ${pages.map(p => `<button class="page-btn ${p===this.currentPage?'active':''}" onclick="Pages.adminMembers.goPage(${p})">${p}</button>`).join('')}
      <button class="page-btn" onclick="Pages.adminMembers.goPage(${this.currentPage+1})" ${this.currentPage===totalPages?'disabled':''}>›</button>
    </div>`;
  },

  goPage(p) { const total = Math.ceil(this.getFilteredMembers().length / this.perPage); if (p < 1 || p > total) return; this.currentPage = p; this.render(); },

  showMemberMenu(event, memberId) {
    event.stopPropagation();
    const m = DB.getMember(memberId);
    if (!m) return;
    Utils.showModal(
      `⋯ Actions for ${Utils.sanitize(Utils.fullName(m))}`,
      `<div style="display:flex;flex-direction:column;gap:0.5rem">
        <button class="btn btn-outline" style="width:100%;justify-content:flex-start" onclick="Utils.closeModal();Pages.adminMembers.viewMember('${memberId}')">👁 View Full Profile</button>
        <button class="btn btn-outline" style="width:100%;justify-content:flex-start" onclick="Utils.closeModal();Pages.adminMembers.sendUpdateLink('${memberId}')">📨 Send Update Link</button>
        <button class="btn btn-outline" style="width:100%;justify-content:flex-start" onclick="Utils.closeModal();Pages.adminMembers.showAddPaymentModal('${memberId}')">💰 Add Payment</button>
        <button class="btn btn-outline" style="width:100%;justify-content:flex-start" onclick="Utils.closeModal();PDF.memberDetail('${memberId}')">📄 Export PDF</button>
        <button class="btn btn-outline" style="width:100%;justify-content:flex-start" onclick="Utils.closeModal();Pages.adminMembers.changeStatus('${memberId}')">🔄 Change Status</button>
        ${m.status === 'pending' ? `
        <button class="btn btn-success" style="width:100%;justify-content:flex-start" onclick="Utils.closeModal();Pages.adminMembers.approveMember('${memberId}')">✅ Approve Membership</button>
        <button class="btn btn-danger" style="width:100%;justify-content:flex-start" onclick="Utils.closeModal();Pages.adminMembers.rejectMember('${memberId}')">❌ Reject Application</button>
        ` : ''}
      </div>`
    );
  },

  viewMember(id) {
    const m = DB.getMember(id);
    if (!m) return;
    const docs = DB.getMemberDocuments(id);
    const payments = DB.getMemberPayments(id);
    const contribs = DB.getMemberContributions(id);
    const sigs = DB.getMemberSignatures(id);
    const unpaid = contribs.filter(c => c.status === 'unpaid');

    Utils.showModal(
      `👤 ${Utils.sanitize(Utils.fullName(m))} – ${m.id}`,
      `<div style="max-height:65vh;overflow-y:auto">
        <!-- Header -->
        <div style="display:flex;align-items:center;gap:1rem;padding:1rem;background:linear-gradient(135deg,var(--clr-primary-dark),var(--clr-primary));border-radius:var(--radius);margin-bottom:1rem;color:white">
          <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,var(--clr-accent-dark),var(--clr-accent));display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:700">${Utils.getInitials(m.firstName, m.lastName)}</div>
          <div>
            <div style="font-size:1.2rem;font-weight:700">${Utils.sanitize(Utils.fullName(m))}</div>
            <div style="font-size:0.8rem;opacity:0.75">${m.id} &bull; ${m.email}</div>
            <div style="margin-top:4px">${Utils.statusBadge(m.status)}</div>
          </div>
          <div style="margin-left:auto;text-align:right">
            <div style="font-size:1.5rem;font-weight:800">${Utils.formatCurrency(m.kittyBalance)}</div>
            <div style="font-size:0.75rem;opacity:0.7">Kitty Balance</div>
          </div>
        </div>
        
        <!-- Details Grid -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem 1.5rem;margin-bottom:1rem">
          ${[
            ['Phone', m.phone || '—'],
            ['Date of Birth', Utils.formatDate(m.dateOfBirth)],
            ['Gender', m.gender || '—'],
            ['Occupation', m.occupation || '—'],
            ['Address', `${m.address || ''} ${m.city || ''} ${m.state || ''}`.trim() || '—'],
            ['Country', m.country || '—'],
            ['Join Date', Utils.formatDate(m.joinDate)],
            ['Last Verified', m.lastVerified ? Utils.formatDate(m.lastVerified) : '<span style="color:#dc2626">Never</span>'],
          ].map(([l, v]) => `
            <div>
              <div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--clr-text-muted);font-weight:700;margin-bottom:2px">${l}</div>
              <div style="font-size:0.85rem;font-weight:600">${v}</div>
            </div>
          `).join('')}
        </div>

        ${unpaid.length ? `<div class="alert alert-warning" style="margin-bottom:0.75rem">
          <span class="alert-icon">⚠️</span>
          <div class="alert-content"><strong>${unpaid.length} unpaid contribution(s)</strong> totaling ${Utils.formatCurrency(unpaid.reduce((s,c)=>s+(c.amount||0),0))}</div>
        </div>` : ''}

        <!-- Family Members -->
        ${m.familyMembers && m.familyMembers.length ? `
          <div style="font-size:0.8rem;font-weight:700;color:var(--clr-primary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.5rem">👨‍👩‍👧 Family Members</div>
          <div style="background:var(--clr-surface-2);border-radius:var(--radius);padding:0.75rem;margin-bottom:0.75rem">
            ${m.familyMembers.map(f => `
              <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--clr-border);font-size:0.8rem">
                <span>${Utils.sanitize(f.firstName)} ${Utils.sanitize(f.lastName)}</span>
                <span style="color:var(--clr-text-muted)">${Utils.sanitize(f.relationship)} &bull; Born ${Utils.formatDate(f.dateOfBirth)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Beneficiaries -->
        ${m.beneficiaries && m.beneficiaries.length ? `
          <div style="font-size:0.8rem;font-weight:700;color:var(--clr-primary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.5rem">🏦 Beneficiaries</div>
          <div style="background:var(--clr-surface-2);border-radius:var(--radius);padding:0.75rem;margin-bottom:0.75rem">
            ${m.beneficiaries.map(b => `
              <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--clr-border);font-size:0.8rem">
                <span>${Utils.sanitize(b.name)}</span>
                <span><span class="badge ${b.type==='primary'?'badge-active':'badge-pending'}">${b.type}</span> <strong>${b.percentage}%</strong></span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Payment History -->
        ${payments.length ? `
          <div style="font-size:0.8rem;font-weight:700;color:var(--clr-primary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.5rem">💰 Recent Payments</div>
          <div style="background:var(--clr-surface-2);border-radius:var(--radius);padding:0.75rem;margin-bottom:0.75rem">
            ${payments.slice(-3).reverse().map(p => `
              <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--clr-border);font-size:0.8rem">
                <span>${Utils.formatDate(p.createdAt)}</span>
                <span style="font-weight:600;color:var(--clr-active)">${Utils.formatCurrency(p.amount)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Documents -->
        ${docs.length ? `
          <div style="font-size:0.8rem;font-weight:700;color:var(--clr-primary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.5rem">📁 Documents (${docs.length})</div>
          <div style="background:var(--clr-surface-2);border-radius:var(--radius);padding:0.75rem;margin-bottom:0.75rem">
            ${docs.map(d => `<div style="font-size:0.8rem;padding:4px 0;border-bottom:1px solid var(--clr-border)">📄 ${Utils.sanitize(d.filename)} <span style="color:var(--clr-text-muted)">– ${Utils.formatDate(d.uploadedAt)}</span></div>`).join('')}
          </div>
        ` : ''}

        <!-- Signature -->
        ${sigs.length ? `
          <div class="alert alert-success">
            <span class="alert-icon">✅</span>
            <div class="alert-content" style="font-size:0.8rem">Waiver signed on ${Utils.formatDateTime(sigs[sigs.length-1].signedAt)}</div>
          </div>
        ` : `
          <div class="alert alert-warning">
            <span class="alert-icon">⚠️</span>
            <div class="alert-content" style="font-size:0.8rem">No waiver signature on file</div>
          </div>
        `}
      </div>`,
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">Close</button>
       <button class="btn btn-outline" onclick="Utils.closeModal();Pages.adminMembers.sendUpdateLink('${id}')">📨 Send Update Link</button>
       <button class="btn btn-primary" onclick="Utils.closeModal();PDF.memberDetail('${id}')">📄 Export PDF</button>`
    );
  },

  approveMember(id) {
    const m = DB.getMember(id);
    if (!m) return;
    DB.updateMemberStatus(id, 'active');
    const members = DB.getMembers();
    const member = members.find(x => x.id === id);
    if (member) {
      member.joinDate = new Date().toISOString().split('T')[0];
      member.approvedAt = new Date().toISOString();
      member.approvedBy = Auth.currentUser.id;
      DB.set(DB.KEYS.members, members);
    }
    DB.addAuditLog(id, 'member', 'approved', null, { status: 'active' });
    Notifications.sendApprovalNotification(id);
    Utils.toast(`${Utils.fullName(m)} approved!`, 'success');
    this.render();
  },

  rejectMember(id) {
    const m = DB.getMember(id);
    if (!m) return;
    Utils.confirm(
      '❌ Reject Application',
      `Are you sure you want to reject ${Utils.fullName(m)}'s membership application?`,
      () => {
        DB.updateMemberStatus(id, 'terminated');
        DB.addAuditLog(id, 'member', 'rejected', null, { status: 'terminated' });
        Utils.toast(`Application rejected for ${Utils.fullName(m)}`, 'warning');
        Pages.adminMembers.render();
      },
      true
    );
  },

  changeStatus(id) {
    const m = DB.getMember(id);
    Utils.showModal(
      '🔄 Change Member Status',
      `<div style="display:flex;flex-direction:column;gap:0.5rem">
        <p style="font-size:0.875rem;color:var(--clr-text-muted);margin-bottom:0.75rem">Change status for <strong>${Utils.sanitize(Utils.fullName(m))}</strong></p>
        ${['active','grace','suspended','terminated'].map(s => `
          <label class="radio-item">
            <input type="radio" name="new-status" value="${s}" ${m.status===s?'checked':''}/>
            <span class="radio-label">${Utils.statusBadge(s)} ${s.charAt(0).toUpperCase()+s.slice(1)}</span>
          </label>
        `).join('')}
      </div>`,
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="
         const s = document.querySelector('input[name=new-status]:checked');
         if(s){DB.updateMemberStatus('${id}',s.value);Utils.closeModal();Pages.adminMembers.render();Utils.toast('Status updated','success');}
       ">Save</button>`
    );
  },

  sendUpdateLink(id) {
    const result = Utils.sendUpdateLink(id);
    if (!result) { Utils.toast('Could not generate link', 'error'); return; }
    const m = DB.getMember(id);
    Utils.showModal(
      '📨 Update Link Generated',
      `<div>
        <div class="alert alert-info"><span class="alert-icon">ℹ️</span><div class="alert-content">Link expires in <strong>72 hours</strong>. Share with the member by email or WhatsApp.</div></div>
        <div style="margin-bottom:0.75rem">
          <div style="font-size:0.75rem;color:var(--clr-text-muted);margin-bottom:4px">Member: ${Utils.sanitize(Utils.fullName(m))}</div>
          <div style="font-size:0.75rem;color:var(--clr-text-muted);margin-bottom:8px">Expires: ${Utils.formatDateTime(result.token.expiresAt)}</div>
          <div style="background:var(--clr-surface-2);border:1px solid var(--clr-border);border-radius:var(--radius);padding:0.75rem;font-size:0.8rem;word-break:break-all;font-family:monospace">${result.link}</div>
        </div>
      </div>`,
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">Close</button>
       <button class="btn btn-primary" onclick="Utils.copyToClipboard('${result.link}')">📋 Copy Link</button>`
    );
  },

  showSendLinkModal() {
    Utils.showModal(
      '📨 Send Registration Link',
      `<div>
        <div class="alert alert-info"><span class="alert-icon">ℹ️</span><div class="alert-content">A unique 72-hour registration link will be generated and logged. Share it with the new member.</div></div>
        <div class="form-field" style="margin-bottom:1rem">
          <label class="field-label">Full Name</label>
          <input type="text" id="new-member-name" class="field-input" placeholder="First Last"/>
        </div>
        <div class="form-field">
          <label class="field-label">Email Address<span class="field-required">*</span></label>
          <input type="email" id="new-member-email" class="field-input" placeholder="member@email.com" required/>
        </div>
      </div>`,
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="Pages.adminMembers.confirmSendLink()">📨 Generate & Log Link</button>`
    );
  },

  confirmSendLink() {
    const email = document.getElementById('new-member-email').value.trim();
    const name = document.getElementById('new-member-name').value.trim();
    if (!email || !Utils.isValidEmail(email)) { Utils.toast('Please enter a valid email', 'error'); return; }
    const result = Utils.sendRegistrationLink(email, name);
    Utils.closeModal();
    Utils.showModal(
      '✅ Registration Link Created',
      `<div>
        <div class="alert alert-success"><span class="alert-icon">✅</span><div class="alert-content">Link generated and logged for <strong>${Utils.sanitize(email)}</strong></div></div>
        <div class="expiry-badge" style="margin-bottom:0.75rem">⏰ Expires: ${Utils.formatDateTime(result.token.expiresAt)}</div>
        <div style="background:var(--clr-surface-2);border:1px solid var(--clr-border);border-radius:var(--radius);padding:0.75rem;font-size:0.8rem;word-break:break-all;font-family:monospace">${result.link}</div>
      </div>`,
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">Close</button>
       <button class="btn btn-primary" onclick="Utils.copyToClipboard('${result.link}')">📋 Copy Link</button>`
    );
  },

  showBulkSendModal() {
    const members = DB.getMembers().filter(m => m.status !== 'terminated');
    Utils.showModal(
      '📢 Bulk Send',
      `<div>
        <div class="alert alert-info"><span class="alert-icon">ℹ️</span><div class="alert-content">Send links to multiple members at once.</div></div>
        <div style="display:flex;flex-direction:column;gap:0.75rem">
          <button class="btn btn-outline" style="justify-content:flex-start" onclick="Utils.closeModal();Pages.adminMembers.bulkSendUpdate()">📨 Send Update Links to All Active Members</button>
          <button class="btn btn-outline" style="justify-content:flex-start" onclick="Utils.closeModal();Notifications.bulkPaymentReminder('email')">💰 Send Payment Reminders (Email)</button>
          <button class="btn btn-outline" style="justify-content:flex-start" onclick="Utils.closeModal();Notifications.bulkPaymentReminder('whatsapp')">📱 Send Payment Reminders (WhatsApp)</button>
          <button class="btn btn-outline" style="justify-content:flex-start" onclick="Utils.closeModal();Notifications.bulkSemiAnnualReminder()">🔔 Send Semi-Annual Verification Reminders</button>
        </div>
        <p style="font-size:0.75rem;color:var(--clr-text-muted);margin-top:1rem">Sending to ${members.length} eligible members. All notifications are logged in the audit trail.</p>
      </div>`,
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>`
    );
  },

  bulkSendUpdate() {
    const active = DB.getMembers().filter(m => m.status === 'active');
    active.forEach(m => Utils.sendUpdateLink(m.id));
    Utils.toast(`Update links sent to ${active.length} active members`, 'success');
  },

  showAddPaymentModal(id) {
    const m = DB.getMember(id);
    Utils.showModal(
      `💰 Add Payment – ${Utils.sanitize(Utils.fullName(m))}`,
      `<div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
          <div class="form-field">
            <label class="field-label">Amount (USD)<span class="field-required">*</span></label>
            <input type="number" id="pay-amount" class="field-input" placeholder="0.00" step="0.01" min="0"/>
          </div>
          <div class="form-field">
            <label class="field-label">Payment Type</label>
            <select id="pay-type" class="field-select">
              <option value="contribution">Contribution</option>
              <option value="registration_fee">Registration Fee</option>
              <option value="late_fee">Late Fee</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div class="form-field">
          <label class="field-label">Notes</label>
          <input type="text" id="pay-notes" class="field-input" placeholder="Payment reference, notes..."/>
        </div>
        <div style="margin-top:1rem;padding:0.75rem;background:var(--clr-surface-2);border-radius:var(--radius);font-size:0.8rem">
          Current kitty balance: <strong style="color:var(--clr-primary)">${Utils.formatCurrency(m.kittyBalance)}</strong>
        </div>
      </div>`,
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
       <button class="btn btn-success" onclick="Pages.adminMembers.confirmPayment('${id}')">✅ Add Payment</button>`
    );
  },

  confirmPayment(id) {
    const amount = parseFloat(document.getElementById('pay-amount').value);
    const type = document.getElementById('pay-type').value;
    const notes = document.getElementById('pay-notes').value;
    if (!amount || amount <= 0) { Utils.toast('Enter a valid amount', 'error'); return; }
    DB.addPayment({ memberId: id, amount, type, notes, addedBy: Auth.currentUser.id });
    DB.addAuditLog(id, 'member', 'payment_added', null, { amount, type });
    Utils.closeModal();
    Utils.toast(`Payment of ${Utils.formatCurrency(amount)} recorded!`, 'success');
    this.render();
  }
};
