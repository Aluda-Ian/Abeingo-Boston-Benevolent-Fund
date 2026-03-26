/* ===========================
   ADMIN REPORTS PAGE
   =========================== */
Pages.adminReports = {
  render() {
    if (!Auth.requireAdmin()) return;
    const members = DB.getMembers();
    const contribs = DB.getContributions();
    const deaths = DB.getDeathEvents();
    const payments = DB.getPayments();

    const content = `
      <div class="page-header">
        <div class="page-header-top">
          <div>
            <h1 class="page-title">📊 ${I18N.t('reports')}</h1>
            <p class="page-subtitle">Generate and export fund reports as PDF.</p>
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:var(--sp-5)">
        <!-- Members Report -->
        <div class="report-card" onclick="PDF.membersReport(DB.getMembers())">
          <div class="report-card-top">
            <div class="report-card-icon">👥</div>
            <div class="report-card-title">Member Roster Report</div>
            <div class="report-card-desc">Full list of all members with status, contact info, and balances.</div>
          </div>
          <div class="report-card-body">
            <div class="report-card-meta">${members.length} total members &bull; Click to generate PDF</div>
          </div>
        </div>

        <!-- Active Members -->
        <div class="report-card" onclick="PDF.membersReport(DB.getMembers().filter(m=>m.status==='active'))">
          <div class="report-card-top" style="background:linear-gradient(135deg,#15803d,#16a34a)">
            <div class="report-card-icon">✅</div>
            <div class="report-card-title">Active Members Report</div>
            <div class="report-card-desc">Active members only with their full details.</div>
          </div>
          <div class="report-card-body">
            <div class="report-card-meta">${members.filter(m=>m.status==='active').length} active members</div>
          </div>
        </div>

        <!-- Contributions Report -->
        <div class="report-card" onclick="PDF.contributionsReport()">
          <div class="report-card-top" style="background:linear-gradient(135deg,#b91c1c,#dc2626)">
            <div class="report-card-icon">💔</div>
            <div class="report-card-title">Contributions & Death Events</div>
            <div class="report-card-desc">All death events, contribution requests, and payout history.</div>
          </div>
          <div class="report-card-body">
            <div class="report-card-meta">${deaths.length} events &bull; ${contribs.length} contributions</div>
          </div>
        </div>

        <!-- Audit Log -->
        <div class="report-card" onclick="PDF.auditReport()">
          <div class="report-card-top" style="background:linear-gradient(135deg,#4338ca,#6366f1)">
            <div class="report-card-icon">📋</div>
            <div class="report-card-title">Audit Trail Report</div>
            <div class="report-card-desc">Full audit log of all changes made to member records.</div>
          </div>
          <div class="report-card-body">
            <div class="report-card-meta">${DB.getAuditLog().length} entries logged</div>
          </div>
        </div>

        <!-- Grace Period -->
        <div class="report-card" onclick="PDF.membersReport(DB.getMembers().filter(m=>m.status==='grace'))">
          <div class="report-card-top" style="background:linear-gradient(135deg,#b45309,#d97706)">
            <div class="report-card-icon">⏳</div>
            <div class="report-card-title">Grace Period Members</div>
            <div class="report-card-desc">Members currently in their 90-day grace period.</div>
          </div>
          <div class="report-card-body">
            <div class="report-card-meta">${members.filter(m=>m.status==='grace').length} in grace period</div>
          </div>
        </div>

        <!-- Pending -->
        <div class="report-card" onclick="PDF.membersReport(DB.getMembers().filter(m=>m.status==='pending'))">
          <div class="report-card-top" style="background:linear-gradient(135deg,#5b21b6,#7c3aed)">
            <div class="report-card-icon">⌛</div>
            <div class="report-card-title">Pending Approvals</div>
            <div class="report-card-desc">Members awaiting admin approval.</div>
          </div>
          <div class="report-card-body">
            <div class="report-card-meta">${members.filter(m=>m.status==='pending').length} pending</div>
          </div>
        </div>
      </div>

      <!-- Data Summary Cards -->
      <div style="margin-top:var(--sp-8)">
        <h3 style="font-size:var(--text-xl);font-weight:700;margin-bottom:var(--sp-5)">📈 Fund Summary</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-5)">
          <!-- Status breakdown -->
          <div class="card">
            <div class="card-header"><div class="card-title">Member Status Breakdown</div></div>
            <div class="card-body">
              ${['active','grace','suspended','terminated','pending'].map(status => {
                const count = members.filter(m => m.status === status).length;
                const pct = members.length ? Math.round((count / members.length) * 100) : 0;
                return `
                  <div style="margin-bottom:1rem">
                    <div style="display:flex;justify-content:space-between;margin-bottom:0.25rem">
                      <span style="font-size:0.8rem">${Utils.statusBadge(status)}</span>
                      <span style="font-size:0.8rem;font-weight:700">${count} (${pct}%)</span>
                    </div>
                    <div class="contribution-bar">
                      <div class="contribution-fill" style="width:${pct}%;background:${status==='active'?'var(--clr-active)':status==='grace'?'var(--clr-grace)':status==='suspended'?'var(--clr-suspended)':'var(--clr-text-muted)'}"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Financial summary -->
          <div class="card">
            <div class="card-header"><div class="card-title">Financial Summary</div></div>
            <div class="card-body">
              ${[
                ['Total Kitty Collected', Utils.formatCurrency(members.reduce((s,m)=>s+(m.kittyBalance||0),0))],
                ['Payments Recorded', DB.getPayments().length],
                ['Total Paid Contributions', Utils.formatCurrency(contribs.filter(c=>c.status==='paid').reduce((s,c)=>s+(c.amount||0),0))],
                ['Outstanding Amount', Utils.formatCurrency(contribs.filter(c=>c.status==='unpaid').reduce((s,c)=>s+(c.amount||0),0))],
                ['Death Events', deaths.length],
                ['Verified Deaths', deaths.filter(d=>d.verified).length],
              ].map(([l, v]) => `
                <div style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid var(--clr-border);font-size:0.85rem">
                  <span style="color:var(--clr-text-muted)">${l}</span>
                  <span style="font-weight:700;color:var(--clr-text)">${v}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Waiver Versions -->
      <div style="margin-top:var(--sp-8)">
        <h3 style="font-size:var(--text-xl);font-weight:700;margin-bottom:var(--sp-5)">📜 Waiver Version Control</h3>
        <div class="table-wrapper">
          <div class="table-header">
            <div class="table-header-title">Waiver Versions</div>
            ${Auth.isSuperAdmin() ? '<button class="btn btn-sm btn-primary" onclick="Pages.adminReports.addWaiverVersion()">+ New Version</button>' : ''}
          </div>
          <table class="data-table">
            <thead><tr><th>Version</th><th>Effective Date</th><th>Created By</th><th>Signatures</th><th>Actions</th></tr></thead>
            <tbody>
              ${DB.getWaiverVersions().reverse().map(w => {
                const sigs = DB.getSignatures().filter(s => s.waiverVersionId === w.id).length;
                return `
                  <tr>
                    <td><strong>${Utils.sanitize(w.version)}</strong></td>
                    <td>${Utils.formatDate(w.effectiveDate)}</td>
                    <td>${Utils.sanitize(w.createdBy)}</td>
                    <td><span class="badge badge-active">${sigs} signed</span></td>
                    <td><button class="btn btn-sm btn-ghost" onclick="Pages.adminReports.viewWaiver('${w.id}')">View</button></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Notifications Log -->
      <div style="margin-top:var(--sp-8)">
        <h3 style="font-size:var(--text-xl);font-weight:700;margin-bottom:var(--sp-5)">📬 Notification History</h3>
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr><th>Date</th><th>Member</th><th>Type</th><th>Channel</th><th>Status</th></tr></thead>
            <tbody>
              ${DB.getNotifications().slice(-20).reverse().map(n => {
                const m = DB.getMember(n.memberId);
                return `
                  <tr>
                    <td style="font-size:0.8rem">${Utils.formatDateTime(n.sentAt)}</td>
                    <td style="font-size:0.8rem">${m ? Utils.sanitize(Utils.fullName(m)) : Utils.sanitize(n.recipientEmail || '—')}</td>
                    <td><span class="badge badge-active" style="text-transform:capitalize">${n.type.replace(/_/g,' ')}</span></td>
                    <td style="font-size:0.8rem">${n.channel}</td>
                    <td><span class="badge badge-active">${n.status}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    renderAdminLayout('reports', content);
  },

  viewWaiver(id) {
    const w = DB.getWaiverVersions().find(x => x.id === id);
    if (!w) return;
    Utils.showModal(
      `📜 Waiver – ${w.version}`,
      `<div style="max-height:60vh;overflow-y:auto">
        <div class="waiver-box" style="max-height:none">${w.content}</div>
      </div>`,
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">Close</button>`
    );
  },

  addWaiverVersion() {
    Utils.showModal(
      '📜 Add New Waiver Version',
      `<div>
        <div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content">Adding a new version will require all future registrations to sign the updated waiver. Existing members will be notified on their next update.</div></div>
        <div class="form-field">
          <label class="field-label">Waiver Content</label>
          <textarea id="new-waiver-content" class="field-textarea" style="min-height:200px;font-size:0.8rem;font-family:monospace">${WAIVER_TEXT}</textarea>
        </div>
      </div>`,
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="
         const content = document.getElementById('new-waiver-content').value;
         if(content){DB.addWaiverVersion(content);Utils.closeModal();Pages.adminReports.render();Utils.toast('New waiver version saved','success');}
       ">Save New Version</button>`
    );
  }
};
