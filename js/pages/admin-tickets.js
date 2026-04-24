/* ===========================
   ADMIN TICKETS PAGE
   =========================== */
Pages.adminTickets = {
  render() {
    if (!Auth.requireAdmin()) return;
    const tickets = DB.getTickets().sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    const content = `
      <div class="page-header">
        <div class="page-header-top">
          <div>
            <h1 class="page-title">🎫 Support Tickets</h1>
            <p class="page-subtitle">Manage member support requests and inquiries.</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary" onclick="Pages.adminTickets.showCreateModal()">+ New Ticket</button>
          </div>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Member</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${tickets.length ? tickets.map(t => {
              const m = DB.getMember(t.memberId);
              return `
                <tr>
                  <td><code>${t.id}</code></td>
                  <td>
                    ${m ? `
                      <div style="display:flex;align-items:center;gap:0.5rem">
                        <div class="member-avatar" style="width:24px;height:24px;font-size:0.6rem">${Utils.getInitials(m.firstName, m.lastName)}</div>
                        <span>${Utils.sanitize(Utils.fullName(m))}</span>
                      </div>
                    ` : 'System'}
                  </td>
                  <td><strong>${Utils.sanitize(t.subject)}</strong></td>
                  <td>
                    <span class="badge ${t.status === 'open' ? 'badge-active' : t.status === 'closed' ? 'badge-terminated' : 'badge-pending'}">
                      ${t.status.toUpperCase()}
                    </span>
                  </td>
                  <td>${Utils.formatDateTime(t.updatedAt)}</td>
                  <td>
                    <button class="btn btn-sm btn-outline" onclick="Pages.adminTickets.viewTicket('${t.id}')">View & Reply</button>
                  </td>
                </tr>
              `;
            }).join('') : '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--clr-text-muted)">No tickets found.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
    renderAdminLayout('tickets', content);
  },

  viewTicket(id) {
    const t = DB.getTickets().find(x => x.id === id);
    if (!t) return;
    const m = DB.getMember(t.memberId);

    Utils.showModal(
      `🎫 Ticket: ${Utils.sanitize(t.subject)}`,
      `<div class="ticket-view">
        <div class="ticket-info">
          <div style="display:flex;justify-content:space-between;margin-bottom:1rem">
            <span><strong>From:</strong> ${m ? Utils.sanitize(Utils.fullName(m)) : 'System'}</span>
            <span><strong>Status:</strong> ${t.status.toUpperCase()}</span>
          </div>
          <div class="ticket-body" style="background:var(--clr-surface-2);padding:1rem;border-radius:var(--radius);margin-bottom:1rem">
            ${Utils.sanitize(t.message)}
          </div>
        </div>
        
        <div class="ticket-replies" style="max-height:300px;overflow-y:auto;margin-bottom:1.5rem;display:flex;flex-direction:column;gap:1rem">
          ${t.replies.map(r => `
            <div class="reply-item ${r.from === 'admin' ? 'admin' : 'member'}" style="align-self:${r.from === 'admin' ? 'flex-end' : 'flex-start'};max-width:80%">
              <div style="font-size:0.7rem;color:var(--clr-text-muted);margin-bottom:0.25rem">${r.from === 'admin' ? 'Admin' : 'Member'} &bull; ${Utils.formatDateTime(r.timestamp)}</div>
              <div style="padding:0.75rem;border-radius:var(--radius);background:${r.from === 'admin' ? 'var(--clr-primary)' : 'var(--clr-surface-3)'};color:${r.from === 'admin' ? 'white' : 'inherit'}">
                ${Utils.sanitize(r.message)}
              </div>
            </div>
          `).join('')}
        </div>

        <div class="reply-form">
          <textarea id="ticket-reply-msg" class="field-input" placeholder="Type your reply..." rows="3"></textarea>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:1rem">
            <select id="ticket-status-update" class="field-select" style="width:auto">
              <option value="open" ${t.status === 'open' ? 'selected' : ''}>Keep Open</option>
              <option value="in-progress" ${t.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
              <option value="closed" ${t.status === 'closed' ? 'selected' : ''}>Close Ticket</option>
            </select>
            <button class="btn btn-primary" onclick="Pages.adminTickets.submitReply('${t.id}')">Send Reply</button>
          </div>
        </div>
      </div>`,
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">Close</button>`
    );
  },

  submitReply(id) {
    const msg = document.getElementById('ticket-reply-msg').value.trim();
    const status = document.getElementById('ticket-status-update').value;
    if (!msg) return;

    const tickets = DB.getTickets();
    const t = tickets.find(x => x.id === id);
    if (t) {
      t.replies.push({
        from: 'admin',
        message: msg,
        timestamp: new Date().toISOString()
      });
      t.status = status;
      t.updatedAt = new Date().toISOString();
      DB.saveTicket(t);
      
      // Notify member
      DB.addNotification({
        memberId: t.memberId,
        type: 'ticket_reply',
        subject: 'Reply to your support ticket',
        message: `Admin has replied to your ticket: "${t.subject}". Status: ${status}`,
        read: false
      });

      this.viewTicket(id);
      this.render();
      Utils.toast('Reply sent!', 'success');
    }
  },

  showCreateModal() {
    const members = DB.getMembers();
    Utils.showModal(
      '🎫 Create New Ticket',
      `<div>
        <div class="form-field">
          <label class="field-label">Select Member</label>
          <select id="tk-member" class="field-select">
            ${members.map(m => `<option value="${m.id}">${Utils.sanitize(Utils.fullName(m))}</option>`).join('')}
          </select>
        </div>
        <div class="form-field">
          <label class="field-label">Subject</label>
          <input type="text" id="tk-subject" class="field-input" placeholder="e.g. Profile Update Issue"/>
        </div>
        <div class="form-field">
          <label class="field-label">Message</label>
          <textarea id="tk-message" class="field-input" rows="4"></textarea>
        </div>
      </div>`,
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="Pages.adminTickets.createTicket()">Create Ticket</button>`
    );
  },

  createTicket() {
    const memberId = document.getElementById('tk-member').value;
    const subject = document.getElementById('tk-subject').value.trim();
    const message = document.getElementById('tk-message').value.trim();
    
    if (!subject || !message) {
      Utils.toast('Please fill all fields', 'error');
      return;
    }

    DB.saveTicket({
      memberId,
      subject,
      message,
      from: 'admin'
    });

    Utils.closeModal();
    this.render();
    Utils.toast('Ticket created!', 'success');
  }
};
