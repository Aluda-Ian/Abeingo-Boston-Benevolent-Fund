/* ===========================
   ADMIN MESSAGES PAGE
   =========================== */
Pages.adminMessages = {
  activeChatId: null,

  render() {
    if (!Auth.requireAdmin()) return;
    const members = DB.getMembers().filter(m => m.status !== 'terminated');
    const messages = DB.getMessages();
    
    // Group messages by member
    const chats = members.map(m => {
      const memberMsgs = messages.filter(msg => msg.memberId === m.id);
      const lastMsg = memberMsgs.length ? memberMsgs[memberMsgs.length - 1] : null;
      return { member: m, lastMsg, count: memberMsgs.length };
    }).sort((a, b) => {
      if (!a.lastMsg) return 1;
      if (!b.lastMsg) return -1;
      return new Date(b.lastMsg.timestamp) - new Date(a.lastMsg.timestamp);
    });

    const content = `
      <div class="messages-layout">
        <div class="messages-sidebar">
          <div class="messages-sidebar-header">
            <h3>Chats</h3>
            <div class="search-input-wrap">
              <input type="text" class="field-input" placeholder="Search members..." oninput="Pages.adminMessages.filterChats(this.value)"/>
            </div>
          </div>
          <div class="chats-list" id="chats-list">
            ${chats.map(chat => `
              <div class="chat-item ${this.activeChatId === chat.member.id ? 'active' : ''}" onclick="Pages.adminMessages.selectChat('${chat.member.id}')">
                <div class="member-avatar">${Utils.getInitials(chat.member.firstName, chat.member.lastName)}</div>
                <div class="chat-info">
                  <div class="chat-name">${Utils.sanitize(Utils.fullName(chat.member))}</div>
                  <div class="chat-last-msg">${chat.lastMsg ? Utils.sanitize(chat.lastMsg.text).substring(0, 30) + '...' : 'No messages yet'}</div>
                </div>
                ${chat.lastMsg ? `<div class="chat-time">${Utils.formatDate(chat.lastMsg.timestamp)}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="messages-main" id="chat-window">
          ${this.activeChatId ? this.renderChatWindow() : `
            <div class="empty-chat">
              <div class="empty-state-icon">💬</div>
              <div class="empty-state-title">Select a member to start chatting</div>
              <div class="empty-state-text">All messages sent here are secure and private.</div>
            </div>
          `}
        </div>
      </div>
    `;
    renderAdminLayout('messages', content);
  },

  selectChat(memberId) {
    this.activeChatId = memberId;
    this.render();
    this.scrollToBottom();
  },

  renderChatWindow() {
    const member = DB.getMember(this.activeChatId);
    const messages = DB.getMessages().filter(m => m.memberId === this.activeChatId);

    return `
      <div class="chat-header">
        <div style="display:flex;align-items:center;gap:1rem">
          <div class="member-avatar">${Utils.getInitials(member.firstName, member.lastName)}</div>
          <div>
            <div class="chat-header-name">${Utils.sanitize(Utils.fullName(member))}</div>
            <div class="chat-header-status"><span class="badge-dot" style="background:var(--clr-active)"></span>Online</div>
          </div>
        </div>
        <div class="chat-header-actions">
          <button class="btn btn-sm btn-outline" onclick="Router.navigate('members', {id: '${member.id}'})">View Profile</button>
        </div>
      </div>
      
      <div class="chat-messages" id="chat-messages">
        ${messages.map(m => `
          <div class="chat-bubble-wrap ${m.from === 'admin' ? 'sent' : 'received'}">
            <div class="chat-bubble">
              <div class="chat-bubble-text">${Utils.sanitize(m.text)}</div>
              <div class="chat-bubble-time">${Utils.formatDateTime(m.timestamp)}</div>
            </div>
          </div>
        `).join('')}
        ${!messages.length ? '<div style="text-align:center;padding:2rem;color:var(--clr-text-muted)">No messages yet. Start the conversation!</div>' : ''}
      </div>
      
      <div class="chat-input-area">
        <textarea id="chat-input" class="field-input" placeholder="Type your message..." rows="1" onkeydown="if(event.key==='Enter' && !event.shiftKey){ event.preventDefault(); Pages.adminMessages.sendMessage(); }"></textarea>
        <button class="btn btn-primary" onclick="Pages.adminMessages.sendMessage()">Send</button>
      </div>
    `;
  },

  sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    const msg = {
      memberId: this.activeChatId,
      from: 'admin',
      text: text
    };

    DB.saveMessage(msg);
    
    // Add notification for member
    DB.addNotification({
      memberId: this.activeChatId,
      type: 'message',
      subject: 'New message from Admin',
      message: text,
      read: false
    });

    input.value = '';
    this.render();
    this.scrollToBottom();
  },

  scrollToBottom() {
    setTimeout(() => {
      const container = document.getElementById('chat-messages');
      if (container) container.scrollTop = container.scrollHeight;
    }, 50);
  },

  filterChats(q) {
    const query = q.toLowerCase();
    document.querySelectorAll('.chat-item').forEach(item => {
      const name = item.querySelector('.chat-name').textContent.toLowerCase();
      item.style.display = name.includes(query) ? 'flex' : 'none';
    });
  }
};
