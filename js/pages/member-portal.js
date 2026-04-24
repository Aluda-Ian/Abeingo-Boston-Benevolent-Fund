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
            <button class="tab-btn ${this.activeTab==='tickets'?'active':''}" onclick="Pages.memberPortal.setTab('tickets')">🎫 Support</button>
            <button class="tab-btn ${this.activeTab==='messages'?'active':''}" onclick="Pages.memberPortal.setTab('messages')">💬 Messages</button>
            <button class="tab-btn ${this.activeTab==='forum'?'active':''}" onclick="Pages.memberPortal.setTab('forum')">👥 Forum</button>
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
      const tabs = ['profile','family','contributions','documents','notifications','tickets','messages'];
      b.classList.toggle('active', tabs[i] === tab);
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
    if (this.activeTab === 'tickets') return this.renderTickets(member);
    if (this.activeTab === 'messages') return this.renderMessages(member);
    if (this.activeTab === 'forum') return this.renderForum(member);
    return '';
  },

  renderForum(member) {
    const committees = DB.getCommittees();
    const allTopics = DB.getForumTopics();
    const myTopics = allTopics.filter(t => t.authorId === member.id).reverse();
    
    return `
      <div style="margin-top:1.5rem">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
          <h3 style="font-family:var(--font-display);font-weight:700">Community Forum</h3>
          <button class="btn btn-primary" onclick="Pages.memberPortal.showNewProposalModal()">+ Submit Topic to Committee</button>
        </div>

        <div class="alert alert-info" style="margin-bottom:1.5rem">
          <span class="alert-icon">ℹ️</span>
          <div class="alert-content">Submit topics, proposals, or questions directly to our committees. Committee chairs will review and lead the discussion.</div>
        </div>

        <div style="display:grid;grid-template-columns:1fr;gap:1rem">
          ${myTopics.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">💬</div>
              <div class="empty-state-title">No topics submitted</div>
              <div class="empty-state-text">Your submitted topics and committee discussions will appear here.</div>
            </div>
          ` : myTopics.map(t => {
            const committee = DB.getCommittee(t.committeeId);
            const replies = DB.getForumReplies(t.id).length;
            return `
              <div class="card" onclick="Pages.memberPortal.viewTopicDetails('${t.id}')" style="cursor:pointer;transition:transform 0.2s">
                <div class="card-body">
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.75rem">
                    <h4 style="font-weight:700;font-size:1.1rem;margin:0">${Utils.sanitize(t.title)}</h4>
                    <div class="badge badge-active">${committee ? committee.name : 'General'}</div>
                  </div>
                  <p style="font-size:0.9rem;color:var(--clr-text-muted);margin-bottom:1rem;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${Utils.sanitize(t.content)}</p>
                  <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.75rem;color:var(--clr-text-light)">
                    <span>Submitted ${Utils.formatDate(t.createdAt)}</span>
                    <span style="font-weight:600;color:var(--clr-primary)">${replies} Replies →</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  showNewProposalModal() {
    const committees = DB.getCommittees();
    Utils.showModal(
      'Submit Topic to Committee',
      `<div style="display:flex;flex-direction:column;gap:1.25rem">
        <div class="form-field">
          <label class="field-label">Target Committee</label>
          <select id="pr-committee" class="field-select">
            ${committees.map(c => `<option value="${c.id}">${c.name} (${c.category})</option>`).join('')}
          </select>
        </div>
        <div class="form-field">
          <label class="field-label">Topic Title</label>
          <input type="text" id="pr-title" class="field-input" placeholder="What would you like to discuss?"/>
        </div>
        <div class="form-field">
          <label class="field-label">Description / Proposal</label>
          <textarea id="pr-content" class="field-input" rows="5" placeholder="Provide details for the committee to discuss..."></textarea>
        </div>
      </div>`,
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="Pages.memberPortal.handleSubmitProposal()">Submit Topic</button>`
    );
  },

  async handleSubmitProposal() {
    const committeeId = document.getElementById('pr-committee').value;
    const title = document.getElementById('pr-title').value.trim();
    const content = document.getElementById('pr-content').value.trim();

    if (!title || !content) {
      Utils.toast('Title and Content are required', 'error');
      return;
    }

    const topic = {
      committeeId,
      authorId: Auth.currentUser.id,
      title,
      content,
      type: 'member_proposal'
    };

    DB.saveForumTopic(topic);
    
    // Notify Committee Chair
    const committee = DB.getCommittee(committeeId);
    if (committee) {
      DB.addNotification({
        memberId: committee.chairId,
        type: 'new_forum_topic',
        subject: 'New Member Proposal',
        message: `${Auth.currentUser.firstName} ${Auth.currentUser.lastName} has submitted a new topic to the ${committee.name}.`,
        read: false
      });
    }

    Utils.toast('Topic submitted to committee!', 'success');
    Utils.closeModal();
    this.render();
  },

  viewTopicDetails(topicId) {
    const t = DB.getForumTopics().find(x => x.id === topicId);
    const replies = DB.getForumReplies(topicId);
    const committee = DB.getCommittee(t.committeeId);

    Utils.showModal(
      `Discussion: ${Utils.sanitize(t.title)}`,
      `<div style="max-height:60vh;overflow-y:auto;padding-right:0.5rem">
        <div style="background:var(--clr-surface-2);padding:1.25rem;border-radius:var(--radius);margin-bottom:1.5rem">
          <div style="font-size:0.7rem;text-transform:uppercase;color:var(--clr-primary);font-weight:700;margin-bottom:0.5rem">${committee ? committee.name : 'General Committee'}</div>
          <div style="font-size:0.95rem;line-height:1.6;white-space:pre-wrap">${Utils.sanitize(t.content)}</div>
        </div>

        <div style="font-weight:700;margin-bottom:1rem;font-size:0.9rem">Replies (${replies.length})</div>
        
        <div style="display:flex;flex-direction:column;gap:1rem">
          ${replies.length === 0 ? `
            <p style="font-size:0.85rem;color:var(--clr-text-muted);text-align:center;padding:1rem">Waiting for committee response...</p>
          ` : replies.map(r => {
            const author = DB.getAdmins().find(a => a.id === r.authorId) || DB.getMember(r.authorId);
            const isAdmin = DB.getAdmins().some(a => a.id === r.authorId);
            return `
              <div style="background:${isAdmin ? '#eff6ff' : 'white'};border:1px solid ${isAdmin ? '#bfdbfe' : 'var(--clr-border)'};padding:1rem;border-radius:var(--radius);box-shadow:var(--shadow-sm)">
                <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem">
                  <span style="font-weight:700;font-size:0.85rem;color:${isAdmin ? 'var(--clr-primary)' : 'var(--clr-text)'}">${author ? Utils.fullName(author) : 'Unknown'} ${isAdmin ? '(Committee)' : ''}</span>
                  <span style="font-size:0.7rem;color:var(--clr-text-muted)">${Utils.formatDate(r.createdAt)}</span>
                </div>
                <div style="font-size:0.9rem;line-height:1.5">${Utils.sanitize(r.content)}</div>
              </div>
            `;
          }).join('')}
        </div>

        <div style="margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid var(--clr-border)">
          <div style="font-weight:700;margin-bottom:0.75rem;font-size:0.9rem">Add to Discussion</div>
          <textarea id="topic-reply-input" class="field-input" rows="2" placeholder="Write your follow-up..."></textarea>
        </div>
      </div>`,
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">Close</button>
       <button class="btn btn-primary" onclick="Pages.memberPortal.handleTopicReply('${topicId}')">Send Reply</button>`
    );
  },

  handleTopicReply(topicId) {
    const content = document.getElementById('topic-reply-input').value.trim();
    if (!content) return;

    DB.saveForumReply({
      topicId,
      authorId: Auth.currentUser.id,
      content
    });

    Utils.toast('Reply sent', 'success');
    Utils.closeModal();
    this.render();
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
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
          <h3 style="font-family:var(--font-display);font-weight:700">My Documents</h3>
          <div style="display:flex;gap:0.75rem">
            <input type="file" id="portal-doc-upload" style="display:none" multiple onchange="Pages.memberPortal.handlePortalUpload(this)"/>
            <button class="btn btn-primary" onclick="document.getElementById('portal-doc-upload').click()">+ Upload New Document</button>
          </div>
        </div>

        ${!docs.length ? `
          <div class="empty-state">
            <div class="empty-state-icon">📁</div>
            <div class="empty-state-title">No documents uploaded</div>
            <div class="empty-state-text">Upload your ID or other supporting documents here for verification.</div>
          </div>
        ` : `
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem">
            ${docs.map(d => `
              <div class="card">
                <div class="card-body" style="display:flex;flex-direction:column;gap:1rem">
                  <div style="display:flex;align-items:center;gap:1rem">
                    <div style="font-size:2rem;flex-shrink:0">${d.filename ? (d.filename.includes('.pdf') ? '📄' : '🖼️') : '📎'}</div>
                    <div style="flex:1;min-width:0">
                      <div style="font-weight:600;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${Utils.sanitize(d.filename || 'Document')}">${Utils.sanitize(d.filename || 'Document')}</div>
                      <div style="font-size:0.75rem;color:var(--clr-text-muted);text-transform:capitalize">${(d.type || 'document').replace(/_/g,' ')}</div>
                      <div style="font-size:0.7rem;color:var(--clr-text-light)">${Utils.formatDate(d.uploadedAt)}</div>
                    </div>
                  </div>
                  <div style="display:flex;gap:0.5rem;border-top:1px solid var(--clr-border);padding-top:0.75rem">
                    <button class="btn btn-sm btn-outline" style="flex:1" onclick="Utils.previewDocument('${d.id}')">👁️ Preview</button>
                    <button class="btn btn-sm btn-ghost" style="flex:1" onclick="Utils.downloadDocument('${d.id}')">⬇️ Download</button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  },

  async handlePortalUpload(input) {
    const files = Array.from(input.files);
    if (!files.length) return;

    Utils.toast('Processing uploads...', 'info');
    for (const f of files) {
      const dataUri = await Utils.fileToDataUri(f);
      DB.saveDocument({
        memberId: Auth.currentUser.id,
        filename: f.name,
        type: 'other',
        size: f.size,
        dataUri
      });
    }

    Utils.toast(`Successfully uploaded ${files.length} document(s)`, 'success');
    this.setTab('documents');
    
    // Notify admin
    DB.addNotification({
      memberId: 'admin',
      type: 'document_upload',
      subject: 'New Document Uploaded',
      message: `${Auth.currentUser.firstName} ${Auth.currentUser.lastName} has uploaded new documents.`,
      read: false
    });
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

  },

  renderTickets(member) {
    const tickets = DB.getTickets().filter(t => t.memberId === member.id).reverse();
    return `
      <div style="margin-top:1.5rem">
        <div class="card-header" style="padding:0;margin-bottom:1rem;background:none;border:none">
          <div class="card-title">Support Tickets</div>
          <button class="btn btn-primary" onclick="Pages.memberPortal.showNewTicketModal()">+ Open New Ticket</button>
        </div>
        
        ${!tickets.length ? '<div class="empty-state"><div class="empty-state-icon">🎫</div><div class="empty-state-title">No support tickets</div></div>' : `
          <div style="display:flex;flex-direction:column;gap:1rem">
            ${tickets.map(t => `
              <div class="card">
                <div class="card-body" style="display:flex;justify-content:space-between;align-items:center">
                  <div>
                    <div style="font-weight:700;font-size:1rem">${Utils.sanitize(t.subject)}</div>
                    <div style="font-size:0.8rem;color:var(--clr-text-muted)">ID: ${t.id} &bull; Updated: ${Utils.formatDateTime(t.updatedAt)}</div>
                  </div>
                  <div style="display:flex;align-items:center;gap:1rem">
                    <span class="badge ${t.status === 'open' ? 'badge-active' : t.status === 'closed' ? 'badge-terminated' : 'badge-pending'}">${t.status.toUpperCase()}</span>
                    <button class="btn btn-sm btn-outline" onclick="Pages.memberPortal.viewTicket('${t.id}')">View</button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  },

  showNewTicketModal() {
    Utils.showModal(
      '🎫 Open New Support Ticket',
      `<div>
        <div class="form-field">
          <label class="field-label">Subject</label>
          <input type="text" id="mtk-subject" class="field-input" placeholder="e.g. Question about my balance"/>
        </div>
        <div class="form-field">
          <label class="field-label">Message</label>
          <textarea id="mtk-message" class="field-input" rows="5" placeholder="Please describe your issue in detail..."></textarea>
        </div>
      </div>`,
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="Pages.memberPortal.submitTicket()">Submit Ticket</button>`
    );
  },

  submitTicket() {
    const subject = document.getElementById('mtk-subject').value.trim();
    const message = document.getElementById('mtk-message').value.trim();
    if (!subject || !message) { Utils.toast('Please fill all fields', 'error'); return; }

    DB.saveTicket({
      memberId: Auth.currentUser.id,
      subject,
      message,
      from: 'member'
    });

    Utils.closeModal();
    this.setTab('tickets');
    Utils.toast('Ticket submitted successfully!', 'success');
  },

  viewTicket(id) {
    const t = DB.getTickets().find(x => x.id === id);
    if (!t) return;

    Utils.showModal(
      `🎫 Ticket: ${Utils.sanitize(t.subject)}`,
      `<div class="ticket-view">
        <div class="ticket-info">
          <div style="display:flex;justify-content:space-between;margin-bottom:1rem;font-size:0.9rem">
            <span><strong>Status:</strong> ${t.status.toUpperCase()}</span>
            <span><strong>ID:</strong> ${t.id}</span>
          </div>
          <div style="background:var(--clr-surface-2);padding:1rem;border-radius:var(--radius);margin-bottom:1.5rem">
            ${Utils.sanitize(t.message)}
          </div>
        </div>
        
        <div style="max-height:250px;overflow-y:auto;margin-bottom:1.5rem;display:flex;flex-direction:column;gap:0.75rem">
          ${t.replies.map(r => `
            <div style="align-self:${r.from === 'admin' ? 'flex-start' : 'flex-end'};max-width:85%">
              <div style="font-size:0.7rem;color:var(--clr-text-muted);margin-bottom:2px;text-align:${r.from === 'admin' ? 'left' : 'right'}">${r.from === 'admin' ? 'Admin' : 'You'} &bull; ${Utils.formatDateTime(r.timestamp)}</div>
              <div style="padding:0.75rem;border-radius:var(--radius);background:${r.from === 'admin' ? 'var(--clr-surface-3)' : 'var(--clr-primary)'};color:${r.from === 'admin' ? 'inherit' : 'white'}">
                ${Utils.sanitize(r.message)}
              </div>
            </div>
          `).join('')}
        </div>

        ${t.status !== 'closed' ? `
          <div class="reply-form">
            <textarea id="mtk-reply-msg" class="field-input" placeholder="Type your reply..." rows="2"></textarea>
            <div style="display:flex;justify-content:flex-end;margin-top:0.75rem">
              <button class="btn btn-primary" onclick="Pages.memberPortal.submitTicketReply('${t.id}')">Send Reply</button>
            </div>
          </div>
        ` : '<div class="alert alert-info">This ticket is closed.</div>'}
      </div>`,
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">Close</button>`
    );
  },

  submitTicketReply(id) {
    const msg = document.getElementById('mtk-reply-msg').value.trim();
    if (!msg) return;

    const tickets = DB.getTickets();
    const t = tickets.find(x => x.id === id);
    if (t) {
      t.replies.push({ from: 'member', message: msg, timestamp: new Date().toISOString() });
      t.updatedAt = new Date().toISOString();
      DB.saveTicket(t);
      this.viewTicket(id);
      this.setTab('tickets');
    }
  },

  renderMessages(member) {
    const messages = DB.getMessages().filter(m => m.memberId === member.id);
    return `
      <div style="margin-top:1.5rem;height:500px;display:flex;flex-direction:column" class="card">
        <div class="card-header"><div class="card-title">💬 Direct Messages with Admin</div></div>
        <div id="member-chat-box" style="flex:1;overflow-y:auto;padding:1.5rem;display:flex;flex-direction:column;gap:1rem;background:var(--clr-surface-1)">
          ${messages.map(m => `
            <div style="align-self:${m.from === 'member' ? 'flex-end' : 'flex-start'};max-width:80%">
              <div style="font-size:0.7rem;color:var(--clr-text-muted);margin-bottom:2px;text-align:${m.from === 'member' ? 'right' : 'left'}">${m.from === 'member' ? 'You' : 'Admin'} &bull; ${Utils.formatDateTime(m.timestamp)}</div>
              <div style="padding:0.8rem 1rem;border-radius:1rem;background:${m.from === 'member' ? 'var(--clr-primary)' : 'var(--clr-surface-3)'};color:${m.from === 'member' ? 'white' : 'inherit'};${m.from==='member'?'border-bottom-right-radius:0':'border-bottom-left-radius:0'}">
                ${Utils.sanitize(m.text)}
              </div>
            </div>
          `).join('')}
          ${!messages.length ? '<div style="text-align:center;margin-top:2rem;color:var(--clr-text-muted)">No messages yet. Send a message to start a conversation.</div>' : ''}
        </div>
        <div style="padding:1rem;border-top:1px solid var(--clr-border);display:flex;gap:0.75rem;background:white">
          <textarea id="member-chat-input" class="field-input" placeholder="Type a message..." rows="1" style="border-radius:2rem;padding-left:1.25rem" onkeydown="if(event.key==='Enter' && !event.shiftKey){ event.preventDefault(); Pages.memberPortal.sendMessage(); }"></textarea>
          <button class="btn btn-primary" style="border-radius:50%;width:44px;height:44px;padding:0;display:flex;align-items:center;justify-content:center" onclick="Pages.memberPortal.sendMessage()">🚀</button>
        </div>
      </div>
    `;
  },

  sendMessage() {
    const input = document.getElementById('member-chat-input');
    const text = input.value.trim();
    if (!text) return;

    DB.saveMessage({
      memberId: Auth.currentUser.id,
      from: 'member',
      text: text
    });

    input.value = '';
    this.setTab('messages');
    setTimeout(() => {
      const box = document.getElementById('member-chat-box');
      if (box) box.scrollTop = box.scrollHeight;
    }, 50);
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
