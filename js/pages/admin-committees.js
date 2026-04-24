/* ===========================
   ADMIN COMMITTEES PAGE
   =========================== */
Pages.adminCommittees = {
  render() {
    if (!Auth.requireAdmin()) return;
    const committees = DB.getCommittees();
    const isAdmin = Auth.isSuperAdmin();
    
    const content = `
      <div class="page-header">
        <div class="page-header-top">
          <div>
            <h1 class="page-title">👥 Committees</h1>
            <p class="page-subtitle">Manage committees, appoint chairs, and lead discussions.</p>
          </div>
          ${isAdmin ? `<button class="btn btn-primary" onclick="Pages.adminCommittees.showCreateCommitteeModal()">+ Create Committee</button>` : ''}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1.5rem">
        ${committees.length === 0 ? `
          <div style="grid-column:1/-1;text-align:center;padding:4rem;background:var(--clr-surface);border-radius:var(--radius-xl);border:2px dashed var(--clr-border)">
            <div style="font-size:3rem;margin-bottom:1rem">👥</div>
            <h3 style="font-weight:700">No committees formed yet</h3>
            <p style="color:var(--clr-text-muted);margin-bottom:1.5rem">Create committees to delegate tasks and lead focused discussions.</p>
            ${isAdmin ? `<button class="btn btn-primary" onclick="Pages.adminCommittees.showCreateCommitteeModal()">Form First Committee</button>` : ''}
          </div>
        ` : committees.map(c => this.renderCommitteeCard(c)).join('')}
      </div>
    `;
    renderAdminLayout('committees', content);
  },

  renderCommitteeCard(c) {
    const isChair = c.chairId === Auth.currentUser.id;
    const isSuper = Auth.isSuperAdmin();
    const canManage = isChair || isSuper;
    const chair = DB.getAdmins().find(a => a.id === c.chairId);
    
    return `
      <div class="card" style="height:100%;display:flex;flex-direction:column">
        <div class="card-body" style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem">
            <div class="badge badge-active">${c.category || 'General'}</div>
            <div style="font-size:0.7rem;color:var(--clr-text-muted)">ID: ${c.id}</div>
          </div>
          <h3 style="font-family:var(--font-display);font-weight:700;font-size:1.25rem;margin-bottom:0.5rem">${Utils.sanitize(c.name)}</h3>
          <p style="font-size:0.85rem;color:var(--clr-text-muted);margin-bottom:1.5rem;line-height:1.5;min-height:3em">${Utils.sanitize(c.description || 'No description provided.')}</p>
          
          <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;padding:0.75rem;background:var(--clr-surface-2);border-radius:var(--radius)">
            <div style="width:32px;height:32px;border-radius:50%;background:var(--clr-primary);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem">
              ${chair ? Utils.getInitials(chair.firstName, chair.lastName) : '?'}
            </div>
            <div>
              <div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--clr-text-muted);font-weight:700">Committee Chair</div>
              <div style="font-size:0.85rem;font-weight:600">${chair ? Utils.fullName(chair) : 'Unassigned'}</div>
            </div>
          </div>

          <div style="font-size:0.85rem;margin-bottom:1rem">
            <strong>Members:</strong> ${c.members ? c.members.length : 0} assigned
          </div>
        </div>
        <div class="card-footer" style="display:flex;gap:0.5rem;background:var(--clr-surface-2)">
          <button class="btn btn-outline btn-sm" style="flex:1" onclick="Pages.adminCommittees.viewForum('${c.id}')">💬 Forum</button>
          ${canManage ? `<button class="btn btn-ghost btn-sm" style="flex:1" onclick="Pages.adminCommittees.showManageMembersModal('${c.id}')">⚙️ Manage</button>` : ''}
        </div>
      </div>
    `;
  },

  showCreateCommitteeModal() {
    const admins = DB.getAdmins();
    Utils.showModal(
      'Create New Committee',
      `<div style="display:flex;flex-direction:column;gap:1.25rem">
        <div class="form-field">
          <label class="field-label">Committee Name</label>
          <input type="text" id="cm-name" class="field-input" placeholder="e.g. Welfare Committee"/>
        </div>
        <div class="form-field">
          <label class="field-label">Category</label>
          <select id="cm-category" class="field-select">
            <option value="Governance">Governance</option>
            <option value="Finance">Finance</option>
            <option value="Welfare">Welfare</option>
            <option value="Disciplinary">Disciplinary</option>
            <option value="Audit">Audit</option>
          </select>
        </div>
        <div class="form-field">
          <label class="field-label">Appoint Chair</label>
          <select id="cm-chair" class="field-select">
            <option value="">Select an Admin...</option>
            ${admins.map(a => `<option value="${a.id}">${Utils.fullName(a)} (${a.role})</option>`).join('')}
          </select>
        </div>
        <div class="form-field">
          <label class="field-label">Description</label>
          <textarea id="cm-desc" class="field-input" rows="3" placeholder="Purpose and goals of this committee..."></textarea>
        </div>
      </div>`,
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="Pages.adminCommittees.handleCreate()">Create Committee</button>`
    );
  },

  handleCreate() {
    const name = document.getElementById('cm-name').value.trim();
    const chairId = document.getElementById('cm-chair').value;
    const category = document.getElementById('cm-category').value;
    const description = document.getElementById('cm-desc').value.trim();

    if (!name || !chairId) {
      Utils.toast('Name and Chair are required', 'error');
      return;
    }

    DB.saveCommittee({
      name,
      chairId,
      category,
      description,
      members: [chairId] // Chair is first member
    });

    Utils.toast('Committee created successfully', 'success');
    Utils.closeModal();
    this.render();
  },

  showManageMembersModal(id) {
    const c = DB.getCommittee(id);
    const admins = DB.getAdmins();
    
    Utils.showModal(
      `Manage Committee: ${Utils.sanitize(c.name)}`,
      `<div style="display:flex;flex-direction:column;gap:1rem">
        <p style="font-size:0.85rem;color:var(--clr-text-muted)">Add or remove committee members. Members will have access to the committee forum.</p>
        
        <div style="max-height:300px;overflow-y:auto;border:1px solid var(--clr-border);border-radius:var(--radius)">
          ${admins.map(a => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem;border-bottom:1px solid var(--clr-border)">
              <div>
                <div style="font-weight:600;font-size:0.9rem">${Utils.fullName(a)}</div>
                <div style="font-size:0.7rem;color:var(--clr-text-muted)">${a.role}</div>
              </div>
              <label class="checkbox-item" style="margin:0">
                <input type="checkbox" name="cm-member" value="${a.id}" ${c.members.includes(a.id) ? 'checked' : ''} ${a.id === c.chairId ? 'disabled' : ''}/>
                <span class="checkbox-label" style="display:none"></span>
              </label>
            </div>
          `).join('')}
        </div>
      </div>`,
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="Pages.adminCommittees.handleUpdateMembers('${id}')">Save Members</button>`
    );
  },

  handleUpdateMembers(id) {
    const c = DB.getCommittee(id);
    const checkboxes = document.querySelectorAll('input[name="cm-member"]:checked');
    const memberIds = Array.from(checkboxes).map(cb => cb.value);
    
    // Ensure chair is always included
    if (!memberIds.includes(c.chairId)) memberIds.push(c.chairId);
    
    c.members = memberIds;
    DB.saveCommittee(c);
    
    Utils.toast('Committee members updated', 'success');
    Utils.closeModal();
    this.render();
  },

  viewForum(committeeId) {
    Router.navigate('committee-forum', { id: committeeId });
  }
};
