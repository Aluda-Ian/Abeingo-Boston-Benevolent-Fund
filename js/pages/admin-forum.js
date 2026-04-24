/* ===========================
   ADMIN FORUM PAGE
   =========================== */
Pages.adminForum = {
  activeTopicId: null,

  render() {
    const params = Utils.getUrlParams();
    const committeeId = params.id;
    const committee = DB.getCommittee(committeeId);
    
    if (!committee) {
      Router.navigate('admin-committees');
      return;
    }

    const topics = DB.getForumTopics().filter(t => t.committeeId === committeeId).reverse();
    const isMember = committee.members.includes(Auth.currentUser.id) || Auth.isSuperAdmin();

    if (!isMember) {
      this.renderAccessDenied();
      return;
    }

    const content = `
      <div style="display:flex;gap:1.5rem;height:calc(100vh - 160px)">
        <!-- Topics Sidebar -->
        <div style="width:340px;background:var(--clr-surface);border:1px solid var(--clr-border);border-radius:var(--radius-xl);display:flex;flex-direction:column;overflow:hidden">
          <div style="padding:1.5rem;border-bottom:1px solid var(--clr-border);display:flex;justify-content:space-between;align-items:center">
            <h3 style="font-family:var(--font-display);font-weight:700">Discussions</h3>
            <button class="btn btn-primary btn-sm" onclick="Pages.adminForum.showNewTopicModal('${committeeId}')">+</button>
          </div>
          <div style="flex:1;overflow-y:auto">
            ${topics.length === 0 ? `
              <div style="text-align:center;padding:2rem;color:var(--clr-text-muted);font-size:0.85rem">No discussions yet.</div>
            ` : topics.map(t => this.renderTopicItem(t)).join('')}
          </div>
        </div>

        <!-- Discussion Content -->
        <div id="forum-main-content" style="flex:1;background:var(--clr-surface);border:1px solid var(--clr-border);border-radius:var(--radius-xl);display:flex;flex-direction:column;overflow:hidden">
          ${this.activeTopicId ? this.renderActiveTopic() : `
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--clr-text-muted);text-align:center;padding:2rem">
              <div style="font-size:4rem;margin-bottom:1.5rem;opacity:0.3">💬</div>
              <h3 style="font-weight:700;color:var(--clr-text)">Select a discussion</h3>
              <p>Choose a topic from the sidebar or start a new one to lead the committee.</p>
            </div>
          `}
        </div>
      </div>
    `;
    renderAdminLayout('committees', content);
  },

  renderTopicItem(t) {
    const author = DB.getAdmins().find(a => a.id === t.authorId) || DB.getMember(t.authorId);
    const replies = DB.getForumReplies(t.id).length;
    const isActive = this.activeTopicId === t.id;

    return `
      <div onclick="Pages.adminForum.setActiveTopic('${t.id}')" 
           style="padding:1.25rem;border-bottom:1px solid var(--clr-border);cursor:pointer;transition:background 0.2s;${isActive ? 'background:var(--clr-surface-2);border-left:4px solid var(--clr-primary)' : ''}">
        <div style="font-weight:700;font-size:0.95rem;margin-bottom:0.5rem;line-height:1.4">${Utils.sanitize(t.title)}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.7rem;color:var(--clr-text-muted)">
          <span>By ${author ? Utils.fullName(author) : 'Unknown'}</span>
          <span>${replies} replies</span>
        </div>
        <div style="font-size:0.65rem;color:var(--clr-text-light);margin-top:4px">${Utils.formatDate(t.createdAt)}</div>
      </div>
    `;
  },

  setActiveTopic(id) {
    this.activeTopicId = id;
    this.render();
  },

  renderActiveTopic() {
    const t = DB.getForumTopics().find(x => x.id === this.activeTopicId);
    if (!t) return '';
    const author = DB.getAdmins().find(a => a.id === t.authorId) || DB.getMember(t.authorId);
    const replies = DB.getForumReplies(t.id);

    return `
      <!-- Header -->
      <div style="padding:1.5rem;border-bottom:1px solid var(--clr-border);background:var(--clr-surface-2)">
        <h2 style="font-family:var(--font-display);font-weight:800;font-size:1.5rem;margin-bottom:0.75rem">${Utils.sanitize(t.title)}</h2>
        <div style="display:flex;align-items:center;gap:0.75rem">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--clr-primary);color:white;display:flex;align-items:center;justify-content:center;font-weight:700">
            ${author ? Utils.getInitials(author.firstName, author.lastName) : '?'}
          </div>
          <div>
            <div style="font-size:0.9rem;font-weight:700">${author ? Utils.fullName(author) : 'Unknown'}</div>
            <div style="font-size:0.7rem;color:var(--clr-text-muted)">Started ${Utils.formatDateTime(t.createdAt)}</div>
          </div>
        </div>
      </div>

      <!-- Messages -->
      <div style="flex:1;overflow-y:auto;padding:2rem;display:flex;flex-direction:column;gap:1.5rem;background:#f8fafc">
        <!-- Original Post -->
        <div style="display:flex;gap:1rem">
           <div style="flex:1;background:white;padding:1.5rem;border-radius:var(--radius-lg);box-shadow:var(--shadow-sm);border:1px solid var(--clr-border)">
             <div style="font-size:1rem;line-height:1.6;color:var(--clr-text);white-space:pre-wrap">${Utils.sanitize(t.content)}</div>
           </div>
        </div>

        <div style="display:flex;align-items:center;gap:1rem;margin:1rem 0">
          <div style="flex:1;height:1px;background:var(--clr-border)"></div>
          <div style="font-size:0.75rem;font-weight:700;color:var(--clr-text-muted);text-transform:uppercase;letter-spacing:0.1em">${replies.length} Replies</div>
          <div style="flex:1;height:1px;background:var(--clr-border)"></div>
        </div>

        ${replies.map(r => {
          const rAuthor = DB.getAdmins().find(a => a.id === r.authorId) || DB.getMember(r.authorId);
          return `
            <div style="display:flex;gap:1rem">
              <div style="width:40px;height:40px;border-radius:50%;background:var(--clr-surface-3);color:var(--clr-primary);display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0">
                ${rAuthor ? Utils.getInitials(rAuthor.firstName, rAuthor.lastName) : '?'}
              </div>
              <div style="flex:1;background:white;padding:1.25rem;border-radius:var(--radius-lg);box-shadow:var(--shadow-sm);border:1px solid var(--clr-border)">
                <div style="display:flex;justify-content:space-between;margin-bottom:0.75rem">
                  <span style="font-weight:700;font-size:0.9rem">${rAuthor ? Utils.fullName(rAuthor) : 'Unknown'}</span>
                  <span style="font-size:0.7rem;color:var(--clr-text-muted)">${Utils.formatDateTime(r.createdAt)}</span>
                </div>
                <div style="font-size:0.95rem;line-height:1.5;color:var(--clr-text);white-space:pre-wrap">${Utils.sanitize(r.content)}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Reply Area -->
      <div style="padding:1.5rem;background:white;border-top:1px solid var(--clr-border)">
        <div style="display:flex;gap:1rem">
          <textarea id="forum-reply-input" class="field-input" rows="2" placeholder="Write a reply..." style="resize:none"></textarea>
          <button class="btn btn-primary" onclick="Pages.adminForum.handleReply()">Reply</button>
        </div>
      </div>
    `;
  },

  showNewTopicModal(committeeId) {
    Utils.showModal(
      'Start New Discussion',
      `<div style="display:flex;flex-direction:column;gap:1.25rem">
        <div class="form-field">
          <label class="field-label">Topic Title</label>
          <input type="text" id="ft-title" class="field-input" placeholder="What would you like to discuss?"/>
        </div>
        <div class="form-field">
          <label class="field-label">Content</label>
          <textarea id="ft-content" class="field-input" rows="5" placeholder="Details of the discussion..."></textarea>
        </div>
      </div>`,
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="Pages.adminForum.handleCreateTopic('${committeeId}')">Start Discussion</button>`
    );
  },

  handleCreateTopic(committeeId) {
    const title = document.getElementById('ft-title').value.trim();
    const content = document.getElementById('ft-content').value.trim();

    if (!title || !content) {
      Utils.toast('Title and Content are required', 'error');
      return;
    }

    const topic = {
      committeeId,
      authorId: Auth.currentUser.id,
      title,
      content
    };

    DB.saveForumTopic(topic);
    Utils.toast('Discussion started', 'success');
    Utils.closeModal();
    this.render();
  },

  handleReply() {
    const content = document.getElementById('forum-reply-input').value.trim();
    if (!content) return;

    DB.saveForumReply({
      topicId: this.activeTopicId,
      authorId: Auth.currentUser.id,
      content
    });

    this.render();
  },

  renderAccessDenied() {
    const content = `
      <div style="display:flex;align-items:center;justify-content:center;height:calc(100vh - 200px)">
        <div class="card" style="max-width:400px;text-align:center;padding:3rem">
          <div style="font-size:4rem;margin-bottom:1.5rem">🔒</div>
          <h2 style="font-weight:800;margin-bottom:1rem">Committee Access Required</h2>
          <p style="color:var(--clr-text-muted);margin-bottom:2rem">You are not a member of this committee and cannot view its private forum.</p>
          <button class="btn btn-primary" onclick="Router.navigate('admin-committees')">Back to Committees</button>
        </div>
      </div>
    `;
    renderAdminLayout('committees', content);
  }
};
