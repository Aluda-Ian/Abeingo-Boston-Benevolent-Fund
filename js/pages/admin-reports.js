/* ===========================
   ADMIN REPORTS PAGE
   =========================== */
Pages.adminReports = {
  viewState: 'main', // 'main' or 'preview'
  previewData: null,
  previewType: '',

  render() {
    if (!Auth.requireAdmin()) return;
    
    if (this.viewState === 'preview') {
      return this.renderPreview();
    }

    const members = DB.getMembers();
    const contribs = DB.getContributions();
    const deaths = DB.getDeathEvents();

    const content = `
      <div class="page-header">
        <div class="page-header-top">
          <div>
            <h1 class="page-title">📊 ${I18N.t('reports')}</h1>
            <p class="page-subtitle">Visual analytics and data export control center.</p>
          </div>
        </div>
      </div>

      <!-- Visual Analytics Section -->
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:1.5rem;margin-bottom:2rem">
        <div class="card" style="padding:1rem">
          <div style="font-weight:700;margin-bottom:1rem;font-size:0.9rem">Member Status Distribution</div>
          <div id="chart-status" style="min-height:300px"></div>
        </div>
        <div class="card" style="padding:1rem">
          <div style="font-weight:700;margin-bottom:1rem;font-size:0.9rem">Contribution Collection Rate (Paid vs Unpaid)</div>
          <div id="chart-contribs" style="min-height:300px"></div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:var(--sp-5)">
        <!-- Members Report -->
        <div class="report-card" onclick="Pages.adminReports.showPreview('members', DB.getMembers())">
          <div class="report-card-top">
            <div class="report-card-icon">👥</div>
            <div class="report-card-title">Member Roster</div>
            <div class="report-card-desc">Review all members before choosing export format.</div>
          </div>
          <div class="report-card-body">
            <div class="report-card-meta">${members.length} members &bull; Click to review</div>
          </div>
        </div>

        <!-- Contributions Report -->
        <div class="report-card" onclick="Pages.adminReports.showPreview('contributions', DB.getContributions())">
          <div class="report-card-top" style="background:linear-gradient(135deg,#b91c1c,#dc2626)">
            <div class="report-card-icon">💰</div>
            <div class="report-card-title">Contributions Ledger</div>
            <div class="report-card-desc">Review financial contribution records.</div>
          </div>
          <div class="report-card-body">
            <div class="report-card-meta">${contribs.length} entries &bull; Click to review</div>
          </div>
        </div>

        <!-- Audit Log -->
        <div class="report-card" onclick="Pages.adminReports.showPreview('audit', DB.getAuditLog())">
          <div class="report-card-top" style="background:linear-gradient(135deg,#4338ca,#6366f1)">
            <div class="report-card-icon">📋</div>
            <div class="report-card-title">Audit Trail</div>
            <div class="report-card-desc">Examine system activity and change logs.</div>
          </div>
          <div class="report-card-body">
            <div class="report-card-meta">${DB.getAuditLog().length} events &bull; Click to review</div>
          </div>
        </div>

        <!-- Death Events -->
        <div class="report-card" onclick="Pages.adminReports.showPreview('deaths', DB.getDeathEvents())">
          <div class="report-card-top" style="background:linear-gradient(135deg,#000,#333)">
            <div class="report-card-icon">🕊️</div>
            <div class="report-card-title">Bereavement Records</div>
            <div class="report-card-desc">Summary of all death events and payouts.</div>
          </div>
          <div class="report-card-body">
            <div class="report-card-meta">${deaths.length} events &bull; Click to review</div>
          </div>
        </div>
      </div>

      <!-- Rest of original sections (Waivers) -->
      <div style="margin-top:var(--sp-8)">
        <h3 style="font-size:var(--text-xl);font-weight:700;margin-bottom:var(--sp-5)">📜 Waiver Version Control</h3>
        <div class="table-wrapper">
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
    `;
    renderAdminLayout('reports', content);
    setTimeout(() => this.initCharts(), 100);
  },

  renderPreview() {
    const type = this.previewType;
    const data = this.previewData;
    let headers = [];
    let rows = [];

    if (type === 'members') {
      headers = ['Name', 'Email', 'Status', 'Balance', 'Join Date'];
      rows = data.map(m => [Utils.fullName(m), m.email, m.status, Utils.formatCurrency(m.kittyBalance), Utils.formatDate(m.joinDate)]);
    } else if (type === 'contributions') {
      headers = ['Member', 'Amount', 'Due Date', 'Status'];
      rows = data.map(c => {
        const m = DB.getMember(c.memberId);
        return [m ? Utils.fullName(m) : 'Unknown', Utils.formatCurrency(c.amount), Utils.formatDate(c.dueDate), c.status];
      });
    } else if (type === 'audit') {
      headers = ['Date', 'Entity', 'Action', 'By'];
      rows = data.map(a => [Utils.formatDateTime(a.timestamp), a.entityType, a.action, a.performedBy]);
    } else {
      headers = ['ID', 'Date', 'Type'];
      rows = data.map(i => [i.id, Utils.formatDate(i.createdAt || i.timestamp), type]);
    }

    const content = `
      <div class="page-header">
        <div class="page-header-top">
          <div style="display:flex;align-items:center;gap:1rem">
            <button class="btn btn-ghost" onclick="Pages.adminReports.goBack()" style="padding:0.5rem">⬅️</button>
            <div>
              <h1 class="page-title">👁️ Report Preview: ${type.charAt(0).toUpperCase() + type.slice(1)}</h1>
              <p class="page-subtitle">Reviewing ${data.length} records found in the database.</p>
            </div>
          </div>
          <div class="page-actions">
            <button class="btn btn-outline" onclick="Utils.exportCSV('${type}.csv', Utils.membersToCSV(DB.getMembers()))">📊 Excel/CSV</button>
            <button class="btn btn-primary" onclick="PDF.${type === 'members' ? 'membersReport' : type === 'contributions' ? 'contributionsReport' : 'auditReport'}(${type === 'members' ? 'DB.getMembers()' : ''})">📄 Download PDF</button>
          </div>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>
            ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
    renderAdminLayout('reports', content);
  },

  goBack() {
    this.viewState = 'main';
    this.render();
  },

  showPreview(type, data) {
    this.viewState = 'preview';
    this.previewType = type;
    this.previewData = data;
    this.render();
  },

  initCharts() {
    const members = DB.getMembers();
    const statusCounts = {
      active: members.filter(m => m.status === 'active').length,
      grace: members.filter(m => m.status === 'grace').length,
      pending: members.filter(m => m.status === 'pending').length,
      other: members.filter(m => !['active','grace','pending'].includes(m.status)).length
    };

    const contribs = DB.getContributions();
    const paidCount = contribs.filter(c => c.status === 'paid').length;
    const unpaidCount = contribs.filter(c => c.status === 'unpaid').length;

    const el1 = document.querySelector("#chart-status");
    const el2 = document.querySelector("#chart-contribs");
    if(!el1 || !el2) return;

    // Status Chart
    new ApexCharts(el1, {
      series: Object.values(statusCounts),
      chart: { type: 'donut', height: 300, foreColor: '#94a3b8' },
      labels: ['Active', 'Grace', 'Pending', 'Other'],
      colors: ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444'],
      legend: { position: 'bottom' },
      plotOptions: { pie: { donut: { size: '70%' } } }
    }).render();

    // Contributions Chart
    new ApexCharts(el2, {
      series: [{ name: 'Count', data: [paidCount, unpaidCount] }],
      chart: { type: 'bar', height: 300, foreColor: '#94a3b8', toolbar: { show: false } },
      plotOptions: { bar: { borderRadius: 4, distributed: true } },
      colors: ['#22c55e', '#ef4444'],
      xaxis: { categories: ['Paid', 'Unpaid'] },
      legend: { show: false }
    }).render();
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
  }
};
