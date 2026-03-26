/* ===========================
   MEMBER PORTAL PAGE
   =========================== */
Pages.memberPortal = {
  activeTab: 'profile',

  render() {
    if (!Auth.requireMember()) return;
    const member = DB.getMember(Auth.currentUser.id);
    if (!member) { Auth.logout(); return; }

    const contributions = DB.getMemberContributions(member.id);
    const payments = DB.getMemberPayments(member.id);
    const docs = DB.getMemberDocuments(member.id);
    const unpaid = contributions.filter(c => c.status === 'unpaid');
    const graceEnd = Utils.graceEndDate(member);
    const inGrace = Utils.isInGracePeriod(member);

    document.getElementById('app-root').innerHTML = `
      <div style="min-height:100vh;background:var(--clr-bg)">
        <!-- Portal Header -->
        <header style="background:linear-gradient(135deg,var(--clr-primary-dark),var(--clr-primary));color:white;padding:0">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem 2rem;border-bottom:1px solid rgba(255,255,255,0.1)">
            <div style="display:flex;align-items:center;gap:0.75rem">
              <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--clr-accent),var(--clr-gold));display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:1.1rem;font-weight:700">A</div>
              <span style="font-family:var(--font-display);font-weight:700;font-size:1.1rem">Abeingo BBBF</span>
            </div>
            <div style="display:flex;align-items:center;gap:1rem">
              <select class="lang-select" style="color:white;background:rgba(255,255,255,0.15);border-color:rgba(255,255,255,0.3)" onchange="I18N.setLang(this.value);Pages.memberPortal.render()">
                <option value="en">🇺🇸 EN</option>
                <option value="pt">🇧🇷 PT</option>
                <option value="es">🇪🇸 ES</option>
                <option value="it">🇮🇹 IT</option>
              </select>
              <span style="font-size:0.85rem;opacity:0.8">${Utils.sanitize(Utils.fullName(member))}</span>
              <button class="btn btn-sm" style="background:rgba(255,255,255,0.15);color:white;border-color:rgba(255,255,255,0.3)" onclick="Auth.logout()">Logout</button>
            </div>
          </div>
          <!-- Member banner -->
          <div style="padding:2rem;display:flex;align-items:center;gap:1.5rem">
            <div style="width:70px;height:70px;border-radius:50%;background:linear-gradient(135deg,var(--clr-accent-dark),var(--clr-accent));display:flex;align-items:center;justify-content:center;font-size:1.8rem;font-weight:700;color:white;border:3px solid rgba(255,255,255,0.3);flex-shrink:0">${Utils.getInitials(member.firstName, member.lastName)}</div>
            <div style="flex:1">
              <div style="font-family:var(--font-display);font-size:1.75rem;font-weight:700">${Utils.sanitize(Utils.fullName(member))}</div>
              <div style="font-size:0.85rem;opacity:0.75">${member.id} &bull; ${Utils.sanitize(member.email)}</div>
              <div style="margin-top:0.5rem;display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center">
                ${Utils.statusBadge(member.status)}
                ${inGrace ? `<span class="expiry-badge" style="color:white;background:rgba(255,255,255,0.15);border-color:rgba(255,255,255,0.3)">⏳ Grace Period ends ${Utils.formatDate(graceEnd)}</span>` : ''}
                ${member.lastVerified ? `<span style="font-size:0.75rem;opacity:0.7">✅ Last verified: ${Utils.formatDate(member.lastVerified)}</span>` : '<span style="font-size:0.75rem;opacity:0.7;color:#fde68a">⚠️ Profile not yet verified</span>'}
              </div>
            </div>
            <div style="text-align:right">
              <div style="font-size:2rem;font-weight:800">${Utils.formatCurrency(member.kittyBalance)}</div>
              <div style="font-size:0.75rem;opacity:0.7">Kitty Balance</div>
              ${unpaid.length > 0 ? `<div style="color:#fde68a;font-size:0.8rem;margin-top:0.25rem">⚠️ ${unpaid.length} unpaid contribution(s)</div>` : ''}
            </div>
          </div>
        </header>

        <!-- Alerts -->
        <div style="padding:0 2rem;margin-top:1.5rem">
          ${inGrace ? `
            <div class="alert alert-warning">
              <span class="alert-icon">⏳</span>
              <div class="alert-content">
                <div class="alert-title">Grace Period Active</div>
                No benefits will be paid until ${Utils.formatDate(graceEnd)}. Please complete your profile.
              </div>
            </div>
          ` : ''}
          ${unpaid.length > 0 ? `
            <div class="alert alert-error">
              <span class="alert-icon">💰</span>
              <div class="alert-content">
                <div class="alert-title">${unpaid.length} Outstanding Contribution(s)</div>
                Total owed: ${Utils.formatCurrency(unpaid.reduce((s,c)=>s+(c.amount||0),0))}. Please contact the admin to make payment.
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Tabs -->
        <div style="padding:0 2rem;margin-top:1rem">
          <div class="tabs">
            <button class="tab-btn ${this.activeTab==='profile'?'active':''}" onclick="Pages.memberPortal.setTab('profile')">👤 My Profile</button>
            <button class="tab-btn ${this.activeTab==='family'?'active':''}" onclick="Pages.memberPortal.setTab('family')">👨‍👩‍👧 Family & Beneficiaries</button>
            <button class="tab-btn ${this.activeTab==='contributions'?'active':''}" onclick="Pages.memberPortal.setTab('contributions')">💰 Contributions</button>
            <button class="tab-btn ${this.activeTab==='documents'?'active':''}" onclick="Pages.memberPortal.setTab('documents')">📁 Documents</button>
            <button class="tab-btn ${this.activeTab==='notifications'?'active':''}" onclick="Pages.memberPortal.setTab('notifications')">📬 Notifications</button>
          </div>
        </div>

        <div style="padding:0 2rem 3rem" id="portal-tab-content">
          ${this.renderTab(member, contributions, payments, docs)}
        </div>
      </div>
    `;
  },

  setTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.tab-btn').forEach((b, i) => {
      b.classList.toggle('active', ['profile','family','contributions','documents','notifications'][i] === tab);
    });
    const member = DB.getMember(Auth.currentUser.id);
    const contributions = DB.getMemberContributions(member.id);
    const payments = DB.getMemberPayments(member.id);
    const docs = DB.getMemberDocuments(member.id);
    document.getElementById('portal-tab-content').innerHTML = this.renderTab(member, contributions, payments, docs);
  },

  renderTab(member, contributions, payments, docs) {
    if (this.activeTab === 'profile') return this.renderProfile(member);
    if (this.activeTab === 'family') return this.renderFamily(member);
    if (this.activeTab === 'contributions') return this.renderContributions(member, contributions, payments);
    if (this.activeTab === 'documents') return this.renderDocuments(member, docs);
    if (this.activeTab === 'notifications') return this.renderNotifications(member);
    return '';
  },

  renderProfile(member) {
    const sigs = DB.getMemberSignatures(member.id);
    return `
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:1.5rem;margin-top:1.5rem">
        <div class="card">
          <div class="card-header">
            <div class="card-title">Personal Information</div>
            <button class="btn btn-sm btn-outline" onclick="Pages.memberPortal.requestUpdateLink()">✏️ Request Update</button>
          </div>
          <div class="card-body">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
              ${[
                ['Full Name', Utils.fullName(member)],
                ['Email', member.email],
                ['Phone', member.phone || '—'],
                ['Date of Birth', Utils.formatDate(member.dateOfBirth)],
                ['Gender', member.gender || '—'],
                ['Occupation', member.occupation || '—'],
                ['Address', member.address || '—'],
                ['City', member.city || '—'],
                ['State', member.state || '—'],
                ['Zip Code', member.zipCode || '—'],
                ['Country', member.country || '—'],
                ['Join Date', Utils.formatDate(member.joinDate)],
              ].map(([l, v]) => `
                <div>
                  <div style="font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--clr-text-muted);margin-bottom:2px">${l}</div>
                  <div style="font-size:0.9rem;font-weight:500">${Utils.sanitize(v || '—')}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:1rem">
          <!-- Status Card -->
          <div class="card">
            <div class="card-header"><div class="card-title">Membership Status</div></div>
            <div class="card-body">
              <div style="text-align:center;padding:0.5rem 0">
                <div style="font-size:2rem;margin-bottom:0.5rem">${member.status === 'active' ? '✅' : member.status === 'grace' ? '⏳' : '⛔'}</div>
                ${Utils.statusBadge(member.status)}
                <div style="margin-top:0.75rem;font-size:0.8rem;color:var(--clr-text-muted)">Joined: ${Utils.formatDate(member.joinDate)}</div>
                <div style="font-size:0.8rem;color:var(--clr-text-muted)">Member ID: <strong>${member.id}</strong></div>
              </div>
            </div>
          </div>

          <!-- Waiver Status -->
          <div class="card">
            <div class="card-header"><div class="card-title">Waiver Status</div></div>
            <div class="card-body">
              ${sigs.length ? `
                <div class="alert alert-success" style="margin:0">
                  <span class="alert-icon">✅</span>
                  <div class="alert-content" style="font-size:0.8rem">
                    <strong>Waiver Signed</strong><br>
                    ${Utils.formatDateTime(sigs[sigs.length-1].signedAt)}
                  </div>
                </div>
              ` : `
                <div class="alert alert-warning" style="margin:0">
                  <span class="alert-icon">⚠️</span>
                  <div class="alert-content" style="font-size:0.8rem"><strong>No signature on file</strong></div>
                </div>
              `}
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="card">
            <div class="card-header"><div class="card-title">Quick Actions</div></div>
            <div class="card-body" style="display:flex;flex-direction:column;gap:0.5rem">
              <button class="btn btn-outline" style="width:100%;justify-content:flex-start" onclick="Pages.memberPortal.requestUpdateLink()">📨 Request Update Link</button>
              <button class="btn btn-ghost" style="width:100%;justify-content:flex-start" onclick="PDF.memberDetail('${member.id}')">📄 Download My Profile PDF</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderFamily(member) {
    const family = member.familyMembers || [];
    const bens = member.beneficiaries || [];
    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-top:1.5rem">
        <div class="card">
          <div class="card-header">
            <div class="card-title">👨‍👩‍👧 Family Members (${family.length})</div>
          </div>
          <div class="card-body" style="padding:0">
            ${!family.length ? '<div class="empty-state"><div class="empty-state-icon">👨‍👩‍👧</div><div class="empty-state-title">No family members</div><div class="empty-state-text">Request an update link to add family members.</div></div>' :
              family.map(f => `
                <div style="display:flex;align-items:center;gap:1rem;padding:1rem;border-bottom:1px solid var(--clr-border)">
                  <div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--clr-primary),var(--clr-accent));display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:0.8rem;flex-shrink:0">${Utils.getInitials(f.firstName, f.lastName)}</div>
                  <div style="flex:1">
                    <div style="font-weight:600;font-size:0.9rem">${Utils.sanitize(f.firstName)} ${Utils.sanitize(f.lastName)}</div>
                    <div style="font-size:0.75rem;color:var(--clr-text-muted)">${Utils.sanitize(f.relationship)} &bull; Born ${Utils.formatDate(f.dateOfBirth)}</div>
                  </div>
                  <span class="badge ${f.status === 'deceased' ? 'badge-terminated' : 'badge-active'}">${f.status || 'alive'}</span>
                </div>
              `).join('')
            }
          </div>
        </div>
        <div>
          <div class="card" style="margin-bottom:1rem">
            <div class="card-header"><div class="card-title">🏦 Beneficiaries</div></div>
            <div class="card-body" style="padding:0">
              ${!bens.length ? '<div style="padding:1rem;text-align:center;color:var(--clr-text-muted);font-size:0.875rem">No beneficiaries set</div>' :
                bens.map(b => `
                  <div style="display:flex;align-items:center;gap:1rem;padding:1rem;border-bottom:1px solid var(--clr-border)">
                    <div style="flex:1">
                      <div style="font-weight:600">${Utils.sanitize(b.name || '—')}</div>
                      <div style="font-size:0.75rem;color:var(--clr-text-muted)">${b.type === 'primary' ? 'Primary Beneficiary' : 'Secondary Beneficiary'}</div>
                    </div>
                    <div style="font-size:1.5rem;font-weight:800;color:var(--clr-primary)">${b.percentage}%</div>
                  </div>
                `).join('')
              }
            </div>
          </div>
          ${member.nextOfKinId ? (() => {
            const kin = family.find(f => f.id === member.nextOfKinId);
            return kin ? `
              <div class="card">
                <div class="card-header"><div class="card-title">🆘 Next of Kin</div></div>
                <div class="card-body">
                  <div style="font-weight:600">${Utils.sanitize(kin.firstName)} ${Utils.sanitize(kin.lastName)}</div>
                  <div style="font-size:0.8rem;color:var(--clr-text-muted)">${Utils.sanitize(kin.relationship)}</div>
                </div>
              </div>
            ` : '';
          })() : ''}
        </div>
      </div>
    `;
  },

  renderContributions(member, contributions, payments) {
    const unpaid = contributions.filter(c => c.status === 'unpaid');
    const paid = contributions.filter(c => c.status === 'paid');
    return `
      <div style="margin-top:1.5rem">
        <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:1.5rem">
          <div class="stat-card" style="--stat-color:var(--clr-primary)">
            <div class="stat-card-icon" style="background:#eff6ff">💰</div>
            <div class="stat-card-value">${Utils.formatCurrency(member.kittyBalance)}</div>
            <div class="stat-card-label">Kitty Balance</div>
          </div>
          <div class="stat-card" style="--stat-color:#dc2626">
            <div class="stat-card-icon" style="background:#fef2f2">⌛</div>
            <div class="stat-card-value">${unpaid.length}</div>
            <div class="stat-card-label">Unpaid Contributions</div>
          </div>
          <div class="stat-card" style="--stat-color:var(--clr-active)">
            <div class="stat-card-icon" style="background:#dcfce7">✅</div>
            <div class="stat-card-value">${paid.length}</div>
            <div class="stat-card-label">Paid</div>
          </div>
        </div>

        ${unpaid.length ? `
          <div class="alert alert-error">
            <span class="alert-icon">⚠️</span>
            <div class="alert-content">
              <div class="alert-title">Payment Required</div>
              You have ${unpaid.length} pending contribution(s). Please contact the administrator to make payment. Late fees of $5 apply after the first week.
            </div>
          </div>
        ` : ''}

        <div class="table-wrapper" style="margin-bottom:1.5rem">
          <div class="table-header"><div class="table-header-title">Contribution History</div></div>
          <table class="data-table">
            <thead><tr><th>Event</th><th>Amount</th><th>Due Date</th><th>Late Fee</th><th>Status</th></tr></thead>
            <tbody>
              ${contributions.length ? contributions.map(c => {
                const lateFee = c.status === 'unpaid' ? Utils.calculateLateFee(c.dueDate) : (c.lateFee || 0);
                return `
                  <tr>
                    <td style="font-size:0.85rem">${Utils.sanitize(c.deceasedName || '—')}</td>
                    <td style="font-weight:600">${Utils.formatCurrency(c.amount)}</td>
                    <td style="font-size:0.85rem">${Utils.formatDate(c.dueDate)}</td>
                    <td style="color:${lateFee > 0 ? '#dc2626' : 'var(--clr-text-muted)'}">${lateFee > 0 ? Utils.formatCurrency(lateFee) : '—'}</td>
                    <td><span class="badge ${c.status==='paid'?'badge-active':'badge-grace'}">${c.status}</span></td>
                  </tr>
                `;
              }).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--clr-text-muted);padding:2rem">No contributions yet</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="table-wrapper">
          <div class="table-header"><div class="table-header-title">Payment History</div></div>
          <table class="data-table">
            <thead><tr><th>Date</th><th>Amount</th><th>Type</th><th>Notes</th></tr></thead>
            <tbody>
              ${payments.length ? payments.map(p => `
                <tr>
                  <td style="font-size:0.85rem">${Utils.formatDate(p.createdAt)}</td>
                  <td style="font-weight:600;color:var(--clr-active)">${Utils.formatCurrency(p.amount)}</td>
                  <td style="font-size:0.85rem;text-transform:capitalize">${(p.type || 'manual').replace(/_/g,' ')}</td>
                  <td style="font-size:0.85rem;color:var(--clr-text-muted)">${Utils.sanitize(p.notes || '—')}</td>
                </tr>
              `).join('') : '<tr><td colspan="4" style="text-align:center;color:var(--clr-text-muted);padding:2rem">No payments recorded</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderDocuments(member, docs) {
    return `
      <div style="margin-top:1.5rem">
        ${!docs.length ? `
          <div class="empty-state">
            <div class="empty-state-icon">📁</div>
            <div class="empty-state-title">No documents uploaded</div>
            <div class="empty-state-text">Documents are uploaded during registration. Request an update to add more.</div>
          </div>
        ` : `
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem">
            ${docs.map(d => `
              <div class="card">
                <div class="card-body" style="display:flex;align-items:center;gap:1rem">
                  <div style="font-size:2rem;flex-shrink:0">${d.filename ? (d.filename.includes('.pdf') ? '📄' : '🖼️') : '📎'}</div>
                  <div style="flex:1;min-width:0">
                    <div style="font-weight:600;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${Utils.sanitize(d.filename || 'Document')}</div>
                    <div style="font-size:0.75rem;color:var(--clr-text-muted);text-transform:capitalize">${(d.type || 'document').replace(/_/g,' ')}</div>
                    <div style="font-size:0.7rem;color:var(--clr-text-light)">${Utils.formatDate(d.uploadedAt)}</div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  },

  renderNotifications(member) {
    const notifs = DB.getNotifications().filter(n => n.memberId === member.id).reverse();
    return `
      <div style="margin-top:1.5rem">
        ${!notifs.length ? `
          <div class="empty-state">
            <div class="empty-state-icon">📬</div>
            <div class="empty-state-title">No notifications</div>
          </div>
        ` : `
          <div style="display:flex;flex-direction:column;gap:0.75rem">
            ${notifs.map(n => `
              <div class="card">
                <div class="card-body">
                  <div style="display:flex;align-items:flex-start;gap:1rem">
                    <div style="font-size:1.5rem;flex-shrink:0">${n.type.includes('death') ? '💔' : n.type.includes('payment') ? '💰' : n.type.includes('link') ? '🔗' : '📧'}</div>
                    <div style="flex:1">
                      <div style="font-weight:600;font-size:0.9rem;text-transform:capitalize;margin-bottom:0.25rem">${n.type.replace(/_/g,' ')}</div>
                      <div style="font-size:0.8rem;color:var(--clr-text-muted);line-height:1.5">${Utils.sanitize(n.message || '').substring(0, 200)}${n.message && n.message.length > 200 ? '...' : ''}</div>
                      ${n.link ? `<div style="margin-top:0.5rem"><a href="#" onclick="Utils.copyToClipboard('${n.link}')" style="font-size:0.75rem;color:var(--clr-primary);font-weight:600">📋 Copy Link</a></div>` : ''}
                    </div>
                    <div style="font-size:0.7rem;color:var(--clr-text-light);flex-shrink:0">${Utils.formatDateTime(n.sentAt)}</div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  },

  requestUpdateLink() {
    const member = DB.getMember(Auth.currentUser.id);
    const result = Utils.sendUpdateLink(member.id);
    if (!result) { Utils.toast('Could not generate update link', 'error'); return; }
    Utils.showModal(
      '📨 Update Link Ready',
      `<div>
        <div class="alert alert-success"><span class="alert-icon">✅</span><div class="alert-content">Your update link has been generated!</div></div>
        <div class="expiry-badge" style="margin-bottom:0.75rem">⏰ Expires in 72 hours: ${Utils.formatDateTime(result.token.expiresAt)}</div>
        <div style="background:var(--clr-surface-2);border:1px solid var(--clr-border);border-radius:var(--radius);padding:0.75rem;font-size:0.8rem;word-break:break-all;font-family:monospace">${result.link}</div>
        <p style="font-size:0.8rem;color:var(--clr-text-muted);margin-top:0.75rem">Copy this link and open it to update your profile. In production, this would be sent to your email automatically.</p>
      </div>`,
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">Close</button>
       <button class="btn btn-primary" onclick="Utils.closeModal();window.location.href='${result.link}'">Open Update Form →</button>`
    );
  }
};
