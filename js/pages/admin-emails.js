/* ===========================
   ADMIN EMAILS PAGE
   =========================== */
Pages.adminEmails = {
  state: { templateId: 'tpl_general', subject: '', body: '', group: 'active', individualMemberId: '', schedule: '' },
  currentTab: 'compose',

  setTab(tab) {
    this.currentTab = tab;
    this.render();
  },

  render(preselectedType = null, prefilledData = null) {
    if (!Auth.requireAdmin()) return;
    const templates = DB.getEmailTemplates();
    
    // Setup state
    if (preselectedType || prefilledData) {
      let tid = preselectedType;
      if (tid === 'death') tid = 'tpl_death';
      if (tid === 'reminder') tid = 'tpl_reminder';
      if (tid === 'general') tid = 'tpl_general';
      const t = templates.find(x => x.id === tid) || templates[0];
      if (t) {
        this.state.templateId = t.id;
        this.state.subject = prefilledData?.subject || t.subject;
        this.state.body = prefilledData?.body || t.body;
      }
      this.state.group = 'active';
      this.state.schedule = '';
    } else if (!this.state.subject && templates.length > 0) {
      this.state.templateId = templates[0].id;
      this.state.subject = templates[0].subject;
      this.state.body = templates[0].body;
    }

    const s = this.state;
    const content = `
      <div class="page-header">
        <div class="page-header-top">
          <div>
            <h1 class="page-title">📢 Communications</h1>
            <p class="page-subtitle">Design templates, schedule broadcasts, and track email history.</p>
          </div>
          ${this.currentTab === 'compose' ? `<button class="btn btn-primary" onclick="Pages.adminEmails.confirmBulkSend()">📨 Send / Schedule Email</button>` : ''}
          ${this.currentTab === 'templates' ? `<button class="btn btn-primary" onclick="Pages.adminEmails.showSaveTemplateModal()">+ New Template</button>` : ''}
        </div>
      </div>

      <div class="tabs" style="margin-top:1rem">
        <button class="tab-btn ${this.currentTab === 'compose' ? 'active' : ''}" onclick="Pages.adminEmails.setTab('compose')">✏️ Compose Email</button>
        <button class="tab-btn ${this.currentTab === 'templates' ? 'active' : ''}" onclick="Pages.adminEmails.setTab('templates')">📑 Saved Templates</button>
        <button class="tab-btn ${this.currentTab === 'scheduled' ? 'active' : ''}" onclick="Pages.adminEmails.setTab('scheduled')">⏰ Scheduled</button>
        <button class="tab-btn ${this.currentTab === 'history' ? 'active' : ''}" onclick="Pages.adminEmails.setTab('history')">📜 Sent History</button>
      </div>

      ${this.renderTabContent(s, templates)}
    `;
    
    renderAdminLayout('emails', content);
    if (this.currentTab === 'compose') {
      setTimeout(() => this.updatePreview(), 50);
    }
  },

  renderTabContent(s, templates) {
    if (this.currentTab === 'compose') return this.renderCompose(s, templates);
    if (this.currentTab === 'templates') return this.renderTemplates(templates);
    if (this.currentTab === 'scheduled') return this.renderScheduled();
    if (this.currentTab === 'history') return this.renderHistory();
    return '';
  },

  renderCompose(s, templates) {
    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-top:1.5rem;height:calc(100vh - 180px);align-items:start">
        <!-- Editor Column -->
        <div class="card" style="height:100%;display:flex;flex-direction:column">
          <div class="card-body" style="flex:1;display:flex;flex-direction:column;gap:1rem">
            <div style="display:flex;gap:1rem">
              <div class="form-field" style="flex:1">
                <label class="field-label">Load Template</label>
                <select id="bulk-type" class="field-select" onchange="Pages.adminEmails.onTemplateChange(this.value)">
                  <option value="">-- Custom Blank --</option>
                  ${templates.map(t => `<option value="${t.id}" ${s.templateId===t.id?'selected':''}>${Utils.sanitize(t.name)}</option>`).join('')}
                </select>
              </div>
              <div class="form-field" style="flex:1">
                <label class="field-label">Recipient Group</label>
                <select id="bulk-group" class="field-select" onchange="Pages.adminEmails.state.group=this.value; Pages.adminEmails.render()">
                  <option value="all" ${s.group==='all'?'selected':''}>All Members</option>
                  <option value="active" ${s.group==='active'?'selected':''}>Active Members</option>
                  <option value="grace" ${s.group==='grace'?'selected':''}>Members in Grace Period</option>
                  <option value="individual" ${s.group==='individual'?'selected':''}>Specific Individual Member</option>
                </select>
              </div>
            </div>
            
            ${s.group === 'individual' ? `
            <div class="form-field">
              <label class="field-label">Select Member</label>
              <select id="bulk-individual-member" class="field-select" onchange="Pages.adminEmails.state.individualMemberId=this.value; Pages.adminEmails.updatePreview()">
                <option value="">-- Select a Member --</option>
                ${DB.getMembers().filter(m => m.status !== 'terminated').map(m => `<option value="${m.id}" ${s.individualMemberId===m.id?'selected':''}>${Utils.sanitize(Utils.fullName(m))} (${Utils.sanitize(m.email)})</option>`).join('')}
              </select>
            </div>
            ` : ''}

            <div class="form-field">
              <label class="field-label">Subject</label>
              <input type="text" id="bulk-subject" class="field-input" value="${Utils.sanitize(s.subject)}" oninput="Pages.adminEmails.state.subject=this.value; Pages.adminEmails.updatePreview()"/>
            </div>
            <div class="form-field" style="flex:1;display:flex;flex-direction:column">
              <label class="field-label" style="display:flex;justify-content:space-between;align-items:flex-end">
                <span>Message Body</span>
                <div>
                  <button class="btn btn-ghost btn-sm" style="padding:0 0.5rem;font-size:0.75rem" onclick="Pages.adminEmails.showSaveTemplateModal()">💾 Save as Template</button>
                  <button class="btn btn-ghost btn-sm" style="padding:0 0.5rem;font-size:0.75rem;color:var(--clr-text-muted)" onclick="Pages.adminEmails.resetTemplate()">↺ Reset</button>
                </div>
              </label>
              <div style="border:1px solid var(--clr-border);border-radius:var(--radius);overflow:hidden;display:flex;flex-direction:column;flex:1">
                <div style="background:var(--clr-surface-2);padding:0.5rem;border-bottom:1px solid var(--clr-border);display:flex;flex-wrap:wrap;gap:0.25rem;align-items:center">
                  <button class="btn btn-ghost btn-sm" onclick="document.execCommand('bold',false,null)" title="Bold" style="font-weight:bold;min-width:32px">B</button>
                  <button class="btn btn-ghost btn-sm" onclick="document.execCommand('italic',false,null)" title="Italic" style="font-style:italic;min-width:32px">I</button>
                  <button class="btn btn-ghost btn-sm" onclick="document.execCommand('underline',false,null)" title="Underline" style="text-decoration:underline;min-width:32px">U</button>
                  <button class="btn btn-ghost btn-sm" onclick="document.execCommand('strikeThrough',false,null)" title="Strikethrough" style="text-decoration:line-through;min-width:32px">S</button>
                  
                  <div style="width:1px;height:20px;background:var(--clr-border);margin:0 4px"></div>
                  
                  <select style="padding:0.25rem;font-size:0.8rem;border:1px solid transparent;background:transparent;border-radius:var(--radius);cursor:pointer;outline:none" onchange="document.execCommand('formatBlock',false,this.value); this.selectedIndex=0;" title="Format Text">
                    <option value="" disabled selected>Format...</option>
                    <option value="H1">Heading 1</option>
                    <option value="H2">Heading 2</option>
                    <option value="P">Paragraph</option>
                  </select>
                  
                  <div style="width:1px;height:20px;background:var(--clr-border);margin:0 4px"></div>
                  
                  <button class="btn btn-ghost btn-sm" onclick="document.execCommand('insertUnorderedList',false,null)" title="Bullet List">• List</button>
                  <button class="btn btn-ghost btn-sm" onclick="document.execCommand('insertOrderedList',false,null)" title="Numbered List">1. List</button>
                  
                  <div style="width:1px;height:20px;background:var(--clr-border);margin:0 4px"></div>
                  
                  <button class="btn btn-ghost btn-sm" onclick="document.execCommand('justifyLeft',false,null)" title="Align Left">⇤</button>
                  <button class="btn btn-ghost btn-sm" onclick="document.execCommand('justifyCenter',false,null)" title="Align Center">↔</button>
                  <button class="btn btn-ghost btn-sm" onclick="document.execCommand('justifyRight',false,null)" title="Align Right">⇥</button>
                  
                  <div style="width:1px;height:20px;background:var(--clr-border);margin:0 4px"></div>
                  
                  <button class="btn btn-ghost btn-sm" onclick="const u = prompt('Enter URL:'); if(u) document.execCommand('createLink',false,u);" title="Insert Link">🔗</button>
                  <button class="btn btn-ghost btn-sm" onclick="document.execCommand('unlink',false,null)" title="Remove Link">🚫🔗</button>
                  
                  <div style="width:1px;height:20px;background:var(--clr-border);margin:0 4px"></div>
                  
                  <input type="color" onchange="document.execCommand('foreColor',false,this.value)" title="Text Color" style="width:24px;height:24px;padding:0;border:none;cursor:pointer;background:transparent" />
                  <input type="color" onchange="document.execCommand('hiliteColor',false,this.value)" title="Highlight Color" style="width:24px;height:24px;padding:0;border:none;cursor:pointer;background:transparent" value="#ffffff" />
                  <button class="btn btn-ghost btn-sm" onclick="document.execCommand('removeFormat',false,null)" title="Clear Formatting">🧹</button>
                </div>
                <div id="bulk-body" contenteditable="true" style="padding:0.75rem;flex:1;outline:none;font-size:0.875rem;overflow-y:auto;min-height:150px" oninput="Pages.adminEmails.state.body=this.innerHTML; Pages.adminEmails.updatePreview()">${s.body.replace(/\n/g, '<br>')}</div>
              </div>
              <div style="font-size:0.7rem;color:var(--clr-text-muted);margin-top:0.25rem">Placeholders: {member_name}, {date}, {admin_name}</div>
            </div>
            <div class="form-field">
              <label class="field-label">Schedule Send (Optional)</label>
              <input type="datetime-local" id="bulk-schedule" class="field-input" value="${s.schedule}" onchange="Pages.adminEmails.state.schedule=this.value"/>
            </div>
          </div>
        </div>
        
        <!-- Preview Column -->
        <div style="display:flex;flex-direction:column;background:var(--clr-surface-2);border-radius:var(--radius);border:1px solid var(--clr-border);overflow:hidden;height:100%">
          <div style="padding:0.75rem;background:var(--clr-border);font-weight:600;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.05em;display:flex;align-items:center;gap:0.5rem">
            <span>👁️</span> Live Preview
          </div>
          <div style="padding:1.5rem;flex:1;overflow-y:auto;background:white;color:#111">
            <div style="margin-bottom:1.5rem;padding-bottom:1rem;border-bottom:1px solid #e5e7eb">
              <div style="font-size:0.8rem;color:#6b7280;margin-bottom:0.25rem">Subject:</div>
              <div id="preview-subject" style="font-weight:700;font-size:1.25rem"></div>
            </div>
            <div id="preview-body" style="font-size:0.95rem;line-height:1.6;color:#374151"></div>
          </div>
        </div>
      </div>
    `;
  },

  renderTemplates(templates) {
    if (!templates.length) return `<div class="empty-state" style="margin-top:2rem"><div class="empty-state-title">No templates</div></div>`;
    return `
      <div class="table-wrapper" style="margin-top:1.5rem">
        <table class="data-table">
          <thead>
            <tr><th>Template Name</th><th>Subject</th><th>Type</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${templates.map(t => `
              <tr>
                <td style="font-weight:600">${Utils.sanitize(t.name)}</td>
                <td style="color:var(--clr-text-muted);max-width:300px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${Utils.sanitize(t.subject)}</td>
                <td>${t.isDefault ? '<span class="badge badge-active">System Default</span>' : '<span class="badge badge-pending">Custom</span>'}</td>
                <td>
                  <button class="btn btn-sm btn-ghost" onclick="Pages.adminEmails.state.templateId='${t.id}'; Pages.adminEmails.resetTemplate(); Pages.adminEmails.setTab('compose')">✏️ Use</button>
                  ${!t.isDefault ? `<button class="btn btn-sm btn-danger" onclick="Pages.adminEmails.deleteTemplate('${t.id}')">Delete</button>` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderScheduled() {
    const notifications = DB.getNotifications().filter(n => n.channel === 'email' && n.status === 'scheduled');
    return this.renderNotificationGroups(notifications, true);
  },

  renderHistory() {
    const notifications = DB.getNotifications().filter(n => n.channel === 'email' && n.status !== 'scheduled');
    return this.renderNotificationGroups(notifications, false);
  },

  renderNotificationGroups(notifications, isScheduled) {
    const groups = {};
    notifications.forEach(n => {
      const key = n.timestamp + '_' + n.subject;
      if (!groups[key]) groups[key] = {
        subject: n.subject,
        timestamp: n.timestamp,
        scheduledFor: n.scheduledFor,
        status: n.status,
        recipients: []
      };
      groups[key].recipients.push({ email: n.recipientEmail, memberId: n.memberId, status: n.status });
    });

    const list = Object.values(groups).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (!list.length) return `<div class="empty-state" style="margin-top:2rem"><div class="empty-state-icon">📭</div><div class="empty-state-title">No emails found</div></div>`;

    return `
      <div class="table-wrapper" style="margin-top:1.5rem">
        <table class="data-table">
          <thead>
            <tr><th>Subject</th><th>${isScheduled ? 'Scheduled For' : 'Sent Date'}</th><th>Recipients</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${list.map(g => {
              const bounced = g.recipients.filter(r => r.status === 'bounced').length;
              let statusBadge = '';
              if (isScheduled) statusBadge = '<span class="badge badge-pending">Scheduled</span>';
              else if (bounced > 0) statusBadge = `<span class="badge badge-suspended">Sent (${bounced} bounced)</span>`;
              else statusBadge = '<span class="badge badge-active">Sent</span>';

              return `
                <tr>
                  <td style="font-weight:600">${Utils.sanitize(g.subject)}</td>
                  <td style="font-size:0.85rem;color:var(--clr-text-muted)">
                    ${isScheduled ? '🗓️ ' + Utils.formatDateTime(g.scheduledFor) : Utils.formatDateTime(g.timestamp)}
                  </td>
                  <td>${g.recipients.length} members</td>
                  <td>${statusBadge}</td>
                  <td>
                    ${isScheduled ? `<button class="btn btn-sm btn-danger" onclick="Pages.adminEmails.cancelScheduled('${g.timestamp}')">Cancel</button>` : '<span style="font-size:0.8rem;color:var(--clr-text-muted)">Delivered</span>'}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  onTemplateChange(id) {
    this.state.templateId = id;
    if (id) {
      const t = DB.getEmailTemplates().find(x => x.id === id);
      if (t) {
        this.state.subject = t.subject;
        this.state.body = t.body;
      }
    } else {
      this.state.subject = '';
      this.state.body = '';
    }
    this.render();
  },

  resetTemplate() {
    this.onTemplateChange(this.state.templateId);
  },

  updatePreview() {
    const s = this.state;
    const adminName = Auth.currentUser ? Utils.fullName(Auth.currentUser) : 'Admin';
    let memberName = 'John Doe';
    if (s.group === 'individual' && s.individualMemberId) {
      const m = DB.getMember(s.individualMemberId);
      if (m) memberName = Utils.fullName(m);
    }
    const dateStr = Utils.formatDate(new Date().toISOString());
    
    let subjectPreview = s.subject.replace(/{member_name}/g, memberName).replace(/{admin_name}/g, adminName).replace(/{date}/g, dateStr);
    let bodyPreview = s.body.replace(/{member_name}/g, memberName).replace(/{admin_name}/g, adminName).replace(/{date}/g, dateStr);
    
    if (!bodyPreview.includes('<')) {
      bodyPreview = bodyPreview.replace(/\n/g, '<br>');
    }

    const settings = DB.getSettings();
    const color = settings.emailBrandColor || '#0f3a63';
    const logo = settings.emailLogoUrl ? `<img src="${settings.emailLogoUrl}" style="max-height:50px;margin-bottom:8px" alt="Logo"/>` : '';
    const headerTxt = settings.emailHeader || settings.orgName || 'Abeingo Boston Benevolent Fund';
    const footerTxt = (settings.emailFooter || '').replace(/\n/g, '<br>');

    const wrappedPreview = `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 1rem; border-radius: 4px;">
        <div style="max-width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background-color: ${color}; padding: 1.5rem; text-align: center; color: #ffffff;">
            ${logo}
            <div style="margin: 0; font-size: 1.25rem; font-weight: 600;">${headerTxt}</div>
          </div>
          <div style="padding: 1.5rem; font-size: 0.95rem; line-height: 1.6; color: #374151;">
            ${bodyPreview}
          </div>
          <div style="background-color: #f9fafb; padding: 1.25rem; text-align: center; border-top: 1px solid #e5e7eb; font-size: 0.75rem; color: #6b7280; line-height: 1.5;">
            ${footerTxt}
          </div>
        </div>
      </div>
    `;

    const ps = document.getElementById('preview-subject');
    const pb = document.getElementById('preview-body');
    if (ps) ps.textContent = subjectPreview;
    if (pb) pb.innerHTML = wrappedPreview;
  },

  showSaveTemplateModal() {
    Utils.showModal(
      '💾 Save Email Template',
      `<div class="form-field">
        <label class="field-label">Template Name</label>
        <input type="text" id="new-template-name" class="field-input" placeholder="e.g. Monthly Newsletter" />
      </div>`,
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="Pages.adminEmails.confirmSaveTemplate()">Save</button>`
    );
  },

  confirmSaveTemplate() {
    const name = document.getElementById('new-template-name').value.trim();
    if (!name) { Utils.toast('Template name is required', 'error'); return; }
    
    DB.saveEmailTemplate({
      name,
      subject: this.state.subject,
      body: this.state.body,
      isDefault: false
    });
    
    Utils.toast('Template saved!', 'success');
    Utils.closeModal();
    this.setTab('templates');
  },

  deleteTemplate(id) {
    Utils.confirm('Delete Template', 'Are you sure you want to delete this custom template?', () => {
      DB.deleteEmailTemplate(id);
      Utils.toast('Template deleted', 'success');
      this.render();
    });
  },

  cancelScheduled(timestamp) {
    Utils.confirm('Cancel Scheduled Email', 'Are you sure you want to cancel this scheduled email?', () => {
      let notifs = DB.getNotifications();
      notifs = notifs.filter(n => !(n.timestamp === timestamp && n.status === 'scheduled'));
      DB.set(DB.KEYS.notifications, notifs);
      Utils.toast('Scheduled email cancelled', 'success');
      this.render();
    });
  },

  confirmBulkSend() {
    const s = this.state;
    let members = [];
    if (s.group === 'individual') {
      if (!s.individualMemberId) {
        Utils.toast('Please select a member first.', 'error');
        return;
      }
      const m = DB.getMember(s.individualMemberId);
      if (m) members = [m];
    } else {
      members = DB.getMembers().filter(m => m.status !== 'terminated');
      if (s.group === 'active') members = members.filter(m => m.status === 'active');
      if (s.group === 'grace') members = members.filter(m => m.status === 'grace');
    }

    if (members.length === 0) {
      Utils.toast('No members found in the selected group.', 'error');
      return;
    }

    Utils.confirm(
      '📨 Confirm Send',
      `You are about to send this email to <strong>${members.length} member(s)</strong>.${s.schedule ? ` It will be scheduled for ${Utils.formatDateTime(s.schedule)}.` : ' It will be sent immediately.'} Confirm?`,
      async () => {
        const adminName = Auth.currentUser ? Utils.fullName(Auth.currentUser) : 'Admin';
        const dateStr = Utils.formatDate(new Date().toISOString());
        
        const timestamp = new Date().toISOString();
        const settings = DB.getSettings();
        const color = settings.emailBrandColor || '#0f3a63';
        const logo = settings.emailLogoUrl ? `<img src="${settings.emailLogoUrl}" style="max-height:60px;margin-bottom:10px" alt="Logo"/>` : '';
        const headerTxt = settings.emailHeader || settings.orgName || 'Abeingo Boston Benevolent Fund';
        const footerTxt = (settings.emailFooter || '').replace(/\n/g, '<br>');

        const notificationsToCreate = members.map(m => {
          const subject = s.subject.replace(/{member_name}/g, Utils.fullName(m)).replace(/{admin_name}/g, adminName).replace(/{date}/g, dateStr);
          let rawBody = s.body.replace(/{member_name}/g, Utils.fullName(m)).replace(/{admin_name}/g, adminName).replace(/{date}/g, dateStr);
          if (!rawBody.includes('<')) rawBody = rawBody.replace(/\n/g, '<br>');
          
          const styledHtml = `
            <div style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 20px 0; color: #111;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <div style="background-color: ${color}; padding: 20px; text-align: center; color: #ffffff;">
                  ${logo}
                  <h2 style="margin: 0; font-size: 20px; font-weight: 600;">${headerTxt}</h2>
                </div>
                <div style="padding: 30px 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                  ${rawBody}
                </div>
                <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; line-height: 1.5;">
                  ${footerTxt}
                </div>
              </div>
            </div>
          `.replace(/\n\s+/g, ''); // Minify slightly

          return {
            memberId: m.id,
            type: `bulk_${s.templateId}`,
            channel: 'email',
            message: styledHtml, 
            subject: subject,
            status: s.schedule ? 'scheduled' : 'sent',
            scheduledFor: s.schedule || null,
            recipientEmail: m.email,
            timestamp: timestamp
          };
        });

        Utils.toast('Processing request on server...', 'info');
        try {
          const response = await DB.apiSendEmails(notificationsToCreate);
          Utils.toast(response.message, 'success');
          Utils.closeModal();
          this.setTab(s.schedule ? 'scheduled' : 'history');
        } catch (err) {
          Utils.toast(err.message || 'Server error occurred', 'error');
        }
      }
    );
  }
};
