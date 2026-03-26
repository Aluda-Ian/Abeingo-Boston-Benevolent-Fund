/* ===========================
   PDF.js - PDF Generation
   Uses browser print API + styled HTML
   =========================== */
const PDF = {
  // Generate and print/download a PDF report
  generate(title, contentHtml, filename = 'report') {
    const printWin = window.open('', '_blank', 'width=900,height=700');
    if (!printWin) {
      Utils.toast('Please allow pop-ups to download PDFs.', 'warning');
      return;
    }
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #0f172a; padding: 0; }
          .pdf-header {
            background: linear-gradient(135deg, #0f2238, #1a3a5c);
            color: white;
            padding: 24px 32px;
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .pdf-logo { width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #c8963e, #d4a840); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; flex-shrink: 0; }
          .pdf-org { font-size: 18px; font-weight: 700; }
          .pdf-subtitle { font-size: 11px; opacity: 0.7; margin-top: 2px; }
          .pdf-report-title { font-size: 14px; font-weight: 700; margin-top: 4px; opacity: 0.9; }
          .pdf-meta { margin-left: auto; text-align: right; font-size: 10px; opacity: 0.7; }
          .pdf-body { padding: 24px 32px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #f0f4f8; padding: 8px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; text-align: left; border-bottom: 2px solid #e2e8f0; }
          td { padding: 8px 10px; font-size: 11px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
          tr:last-child td { border-bottom: none; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
          .badge-active { background: #dcfce7; color: #16a34a; }
          .badge-grace { background: #fef3c7; color: #d97706; }
          .badge-suspended { background: #fee2e2; color: #dc2626; }
          .badge-terminated { background: #f3f4f6; color: #6b7280; }
          .badge-pending { background: #ede9fe; color: #7c3aed; }
          .section-title { font-size: 14px; font-weight: 700; color: #1a3a5c; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin: 20px 0 12px; }
          .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
          .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
          .stat-value { font-size: 22px; font-weight: 800; color: #1a3a5c; }
          .stat-label { font-size: 10px; color: #64748b; margin-top: 2px; }
          .pdf-footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; display: flex; justify-content: space-between; }
          .waiver-body { line-height: 1.8; font-size: 11px; color: #334155; }
          .waiver-body h4 { color: #1a3a5c; font-size: 12px; margin: 12px 0 6px; }
          .waiver-body p { margin-bottom: 8px; }
          .member-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; margin-bottom: 16px; }
          .detail-row { display: flex; flex-direction: column; }
          .detail-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; font-weight: 700; margin-bottom: 2px; }
          .detail-value { font-size: 11px; font-weight: 600; color: #0f172a; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="pdf-header">
          <div class="pdf-logo">A</div>
          <div>
            <div class="pdf-org">Abeingo Boston Benevolent Fund</div>
            <div class="pdf-subtitle">Official Document</div>
            <div class="pdf-report-title">${title}</div>
          </div>
          <div class="pdf-meta">
            <div>Generated: ${new Date().toLocaleString()}</div>
            <div>Confidential</div>
          </div>
        </div>
        <div class="pdf-body">
          ${contentHtml}
          <div class="pdf-footer">
            <span>Abeingo Boston Benevolent Fund – Confidential</span>
            <span>Generated on ${new Date().toLocaleString()} | ${title}</span>
          </div>
        </div>
      </body>
      </html>
    `);
    printWin.document.close();
    setTimeout(() => printWin.print(), 500);
  },

  // Members list PDF
  membersReport(members) {
    const rows = members.map(m => `
      <tr>
        <td>${m.id}</td>
        <td>${Utils.sanitize(Utils.fullName(m))}</td>
        <td>${Utils.sanitize(m.email)}</td>
        <td>${Utils.sanitize(m.phone || '—')}</td>
        <td>${Utils.sanitize(m.city || '—')}, ${Utils.sanitize(m.state || '')}</td>
        <td><span class="badge badge-${m.status}">${m.status}</span></td>
        <td>${Utils.formatDate(m.joinDate)}</td>
        <td>${Utils.formatCurrency(m.kittyBalance)}</td>
      </tr>
    `).join('');

    const stats = {
      total: members.length,
      active: members.filter(m => m.status === 'active').length,
      grace: members.filter(m => m.status === 'grace').length,
      suspended: members.filter(m => m.status === 'suspended').length,
      pending: members.filter(m => m.status === 'pending').length,
    };

    const content = `
      <div class="stat-grid">
        <div class="stat-box"><div class="stat-value">${stats.total}</div><div class="stat-label">Total Members</div></div>
        <div class="stat-box"><div class="stat-value">${stats.active}</div><div class="stat-label">Active</div></div>
        <div class="stat-box"><div class="stat-value">${stats.grace}</div><div class="stat-label">Grace Period</div></div>
        <div class="stat-box"><div class="stat-value">${stats.suspended + stats.pending}</div><div class="stat-label">Pending/Suspended</div></div>
      </div>
      <div class="section-title">Member Roster</div>
      <table>
        <thead>
          <tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Location</th><th>Status</th><th>Join Date</th><th>Balance</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
    this.generate('Member Roster Report', content, 'members-report');
  },

  // Contribution report
  contributionsReport() {
    const contributions = DB.getContributions();
    const deathEvents = DB.getDeathEvents();
    const members = DB.getMembers();

    const deathRows = deathEvents.map(d => {
      const reporter = members.find(m => m.id === d.reportedByMemberId);
      const contribs = contributions.filter(c => c.deathEventId === d.id);
      const paid = contribs.filter(c => c.status === 'paid').length;
      return `
        <tr>
          <td>${d.id}</td>
          <td>${Utils.sanitize(d.deceasedName)}</td>
          <td>${Utils.sanitize(d.relationship)}</td>
          <td>${reporter ? Utils.sanitize(Utils.fullName(reporter)) : '—'}</td>
          <td>${Utils.formatDate(d.dateOfDeath)}</td>
          <td><span class="badge ${d.verified ? 'badge-active' : 'badge-pending'}">${d.verified ? 'Verified' : 'Pending'}</span></td>
          <td>${Utils.formatCurrency(d.payoutAmount)}</td>
          <td>${paid}/${contribs.length}</td>
        </tr>
      `;
    }).join('');

    const content = `
      <div class="section-title">Death Events & Contributions</div>
      <table>
        <thead>
          <tr><th>ID</th><th>Deceased</th><th>Relationship</th><th>Reported By</th><th>Date</th><th>Status</th><th>Payout</th><th>Paid</th></tr>
        </thead>
        <tbody>${deathRows || '<tr><td colspan="8" style="text-align:center;color:#94a3b8">No death events recorded</td></tr>'}</tbody>
      </table>
    `;
    this.generate('Contribution & Death Events Report', content, 'contributions-report');
  },

  // Member detail PDF
  memberDetail(memberId) {
    const m = DB.getMember(memberId);
    if (!m) return;
    const payments = DB.getMemberPayments(memberId);
    const contribs = DB.getMemberContributions(memberId);
    const sigs = DB.getMemberSignatures(memberId);

    const paymentRows = payments.map(p => `
      <tr>
        <td>${Utils.formatDate(p.createdAt)}</td>
        <td>${Utils.formatCurrency(p.amount)}</td>
        <td>${Utils.sanitize(p.notes || '—')}</td>
        <td>${Utils.sanitize(p.type || 'Manual')}</td>
      </tr>
    `).join('');

    const familyRows = (m.familyMembers || []).map(f => `
      <tr>
        <td>${Utils.sanitize(f.firstName)} ${Utils.sanitize(f.lastName)}</td>
        <td>${Utils.sanitize(f.relationship)}</td>
        <td>${Utils.formatDate(f.dateOfBirth)}</td>
        <td><span class="badge badge-active">${f.status || 'alive'}</span></td>
      </tr>
    `).join('');

    const benRows = (m.beneficiaries || []).map(b => `
      <tr>
        <td>${Utils.sanitize(b.name)}</td>
        <td>${b.type === 'primary' ? 'Primary' : 'Secondary'}</td>
        <td>${b.percentage}%</td>
      </tr>
    `).join('');

    const content = `
      <div style="display:flex;align-items:center;gap:16px;padding:16px;background:#f8fafc;border-radius:8px;margin-bottom:20px;">
        <div style="width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#1a3a5c,#c8963e);display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem;font-weight:700;flex-shrink:0;">${Utils.getInitials(m.firstName, m.lastName)}</div>
        <div>
          <div style="font-size:20px;font-weight:700">${Utils.sanitize(Utils.fullName(m))}</div>
          <div style="font-size:11px;color:#64748b">${m.id} &bull; <span class="badge badge-${m.status}">${m.status}</span> &bull; Joined ${Utils.formatDate(m.joinDate)}</div>
        </div>
        <div style="margin-left:auto;text-align:right">
          <div style="font-size:20px;font-weight:800;color:#1a3a5c">${Utils.formatCurrency(m.kittyBalance)}</div>
          <div style="font-size:10px;color:#64748b">Kitty Balance</div>
        </div>
      </div>

      <div class="section-title">Personal Information</div>
      <div class="member-detail-grid">
        <div class="detail-row"><div class="detail-label">Email</div><div class="detail-value">${Utils.sanitize(m.email)}</div></div>
        <div class="detail-row"><div class="detail-label">Phone</div><div class="detail-value">${Utils.sanitize(m.phone || '—')}</div></div>
        <div class="detail-row"><div class="detail-label">Date of Birth</div><div class="detail-value">${Utils.formatDate(m.dateOfBirth)}</div></div>
        <div class="detail-row"><div class="detail-label">Occupation</div><div class="detail-value">${Utils.sanitize(m.occupation || '—')}</div></div>
        <div class="detail-row"><div class="detail-label">Address</div><div class="detail-value">${Utils.sanitize(m.address || '—')}, ${Utils.sanitize(m.city || '')}, ${Utils.sanitize(m.state || '')}</div></div>
        <div class="detail-row"><div class="detail-label">Country</div><div class="detail-value">${Utils.sanitize(m.country || '—')}</div></div>
      </div>

      ${familyRows ? `<div class="section-title">Family Members</div>
      <table><thead><tr><th>Name</th><th>Relationship</th><th>Date of Birth</th><th>Status</th></tr></thead>
      <tbody>${familyRows}</tbody></table>` : ''}

      ${benRows ? `<div class="section-title">Beneficiaries</div>
      <table><thead><tr><th>Name</th><th>Type</th><th>Percentage</th></tr></thead>
      <tbody>${benRows}</tbody></table>` : ''}

      ${paymentRows ? `<div class="section-title">Payment History</div>
      <table><thead><tr><th>Date</th><th>Amount</th><th>Notes</th><th>Type</th></tr></thead>
      <tbody>${paymentRows}</tbody></table>` : ''}

      ${sigs.length ? `<div class="section-title">Signature & Waiver</div>
      <p style="font-size:11px;color:#64748b">Waiver signed on ${Utils.formatDateTime(sigs[sigs.length-1].signedAt)}</p>` : ''}
    `;
    this.generate(`Member Detail – ${Utils.fullName(m)}`, content, `member-${m.id}`);
  },

  // Audit log PDF
  auditReport() {
    const logs = DB.getAuditLog().slice(-100);
    const rows = logs.reverse().map(l => `
      <tr>
        <td>${Utils.formatDateTime(l.timestamp)}</td>
        <td>${Utils.sanitize(l.performedBy)}</td>
        <td>${Utils.sanitize(l.entityType)}</td>
        <td>${Utils.sanitize(l.action)}</td>
        <td style="font-size:9px;color:#94a3b8">${Utils.sanitize(l.entityId)}</td>
      </tr>
    `).join('');

    const content = `
      <div class="section-title">Audit Trail (Last 100 entries)</div>
      <table>
        <thead><tr><th>Timestamp</th><th>Performed By</th><th>Entity</th><th>Action</th><th>ID</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:#94a3b8">No audit logs</td></tr>'}</tbody>
      </table>
    `;
    this.generate('Audit Trail Report', content, 'audit-report');
  }
};

window.PDF = PDF;
