/* ===========================
   ADMIN LAYOUT (shared sidebar/topbar)
   =========================== */
function renderAdminLayout(pageId, contentHtml) {
  // Ensure preloader is removed if still present
  const preloader = document.getElementById('loading-screen');
  if (preloader) preloader.remove();

  const user = Auth.currentUser;
  const navItems = [
    { id: 'dashboard',    icon: '🏠', label: 'Dashboard' },
    { id: 'members',      icon: '👥', label: 'Members' },
    { id: 'contributions',icon: '💰', label: 'Contributions' },
    { id: 'reports',      icon: '📊', label: 'Reports' },
    { id: 'settings',     icon: '⚙️', label: 'Settings', superOnly: true },
  ];

  const pendingCount = DB.getMembers().filter(m => m.status === 'pending').length;
  const unreadNotifs = DB.getNotifications().filter(n => !n.read).length;
  const openTickets = (DB.getTickets ? DB.getTickets() : []).filter(t => t.status === 'open').length;

  const navHtml = navItems
    .filter(n => !n.superOnly || Auth.isSuperAdmin())
    .map(n => `
      <div class="sidebar-nav-item ${pageId === n.id ? 'active' : ''}" onclick="Router.navigate('${n.id}')">
        <span class="sidebar-nav-icon">${n.icon}</span>
        <span>${n.label}</span>
        ${n.id === 'members' && pendingCount > 0 ? `<span class="sidebar-nav-badge">${pendingCount}</span>` : ''}
      </div>
    `).join('');

  document.getElementById('app-root').innerHTML = `
    <div class="app-layout">
      <!-- Sidebar Overlay -->
      <div class="sidebar-overlay" id="sidebar-overlay" onclick="Pages.adminDashboard.toggleSidebar()"></div>
      
      <!-- Sidebar -->
      <nav class="sidebar" id="sidebar">
        <div class="sidebar-logo">
          <div class="sidebar-logo-icon">A</div>
          <div class="sidebar-logo-text">
            <div class="sidebar-logo-name">Abeingo BBBF</div>
            <div class="sidebar-logo-sub">Boston Benevolent Fund</div>
          </div>
        </div>
        <nav class="sidebar-nav">
          <div class="sidebar-section-label">Navigation</div>
          ${navHtml}
          
          <div class="sidebar-section-label" style="margin-top:1rem">Support & CRM</div>
          <div class="sidebar-nav-item ${pageId === 'tickets' ? 'active' : ''}" onclick="Router.navigate('tickets')">
            <span class="sidebar-nav-icon">🎫</span>
            <span>Support Tickets</span>
            ${openTickets > 0 ? `<span class="sidebar-nav-badge" style="background:#dc2626">${openTickets}</span>` : ''}
          </div>
          <div class="sidebar-nav-item ${pageId === 'messages' ? 'active' : ''}" onclick="Router.navigate('messages')">
            <span class="sidebar-nav-icon">💬</span>
            <span>Member Messages</span>
          </div>
          <div class="sidebar-nav-item ${pageId === 'committees' ? 'active' : ''}" onclick="Router.navigate('committees')">
            <span class="sidebar-nav-icon">👥</span>
            <span>Committees</span>
          </div>

          <div class="sidebar-section-label" style="margin-top:1rem">Communications</div>
          <div class="sidebar-nav-item ${pageId === 'emails' ? 'active' : ''}" onclick="Router.navigate('emails')">
            <span class="sidebar-nav-icon">📢</span>
            <span>Email Templates</span>
          </div>

          <div class="sidebar-section-label" style="margin-top:1rem">Member Access</div>
          <div class="sidebar-nav-item" onclick="Router.navigate('member-login')">
            <span class="sidebar-nav-icon">🧑‍💼</span>
            <span>Member Portal</span>
          </div>
        </nav>
        <div class="sidebar-bottom">
          <div class="sidebar-nav-item" style="color:rgba(255,255,255,0.5)" onclick="Auth.logout()">
            <span class="sidebar-nav-icon">🚪</span>
            <span>Logout</span>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <div class="main-content">
        <!-- Topbar -->
        <header class="topbar">
          <div class="topbar-left">
            <button class="mobile-menu-btn" onclick="Pages.adminDashboard.toggleSidebar()">☰</button>
            <div>
              <div class="topbar-title" id="page-topbar-title">Admin Portal</div>
            </div>
          </div>
          <div class="topbar-right">
            <div style="display:flex;align-items:center;gap:1.25rem;margin-right:1rem;border-right:1px solid var(--clr-border);padding-right:1.25rem">
              <!-- Messages Icon -->
              <div class="topbar-icon-btn" onclick="Router.navigate('messages')" title="Messages">
                💬
                <span class="icon-badge"></span>
              </div>
              <!-- Notification Bell -->
              <div class="topbar-icon-btn" onclick="Pages.adminDashboard.showNotifications()" title="Notifications">
                🔔
                ${unreadNotifs > 0 ? `<span class="icon-badge">${unreadNotifs}</span>` : ''}
              </div>
            </div>
            <select class="lang-select" onchange="I18N.setLang(this.value)" style="margin-right:1rem">
              <option value="en" ${I18N.currentLang==='en'?'selected':''}>🇺🇸 EN</option>
              <option value="pt" ${I18N.currentLang==='pt'?'selected':''}>🇧🇷 PT</option>
              <option value="es" ${I18N.currentLang==='es'?'selected':''}>🇪🇸 ES</option>
              <option value="it" ${I18N.currentLang==='it'?'selected':''}>🇮🇹 IT</option>
            </select>
            <div class="topbar-user" onclick="Pages.adminDashboard.showUserMenu()">
              <div class="topbar-user-info">
                <div class="topbar-user-name">${Utils.sanitize(user.firstName + ' ' + user.lastName)}</div>
                <div class="topbar-user-role">${user.role === 'super_admin' ? 'Super Admin' : 'Committee Member'}</div>
              </div>
              <div class="topbar-avatar">${Utils.getInitials(user.firstName, user.lastName)}</div>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="page-content">
          ${contentHtml}
        </main>
      </div>
    </div>
  `;
}

/* ===========================
   DASHBOARD PAGE
   =========================== */
Pages.adminDashboard = {
  render() {
    if (!Auth.requireAdmin()) return;
    const members = DB.getMembers();
    const active = members.filter(m => m.status === 'active').length;
    const grace = members.filter(m => m.status === 'grace').length;
    const pending = members.filter(m => m.status === 'pending').length;
    const suspended = members.filter(m => m.status === 'suspended').length;
    const totalKitty = members.reduce((s, m) => s + (m.kittyBalance || 0), 0);
    const deathEvents = DB.getDeathEvents();
    const recentLogs = DB.getAuditLog().slice(-8).reverse();
    const unpaidContribs = DB.getContributions().filter(c => c.status === 'unpaid').length;

    const content = `
      <!-- Hero -->
      <div class="dashboard-hero">
        <div class="hero-greeting">Welcome back</div>
        <div class="hero-title">Good ${this.getGreeting()}, ${Utils.sanitize(Auth.currentUser.firstName)}!</div>
        <div class="hero-subtitle">Here's an overview of the Abeingo Boston Benevolent Fund</div>
        <div class="hero-actions">
          <button class="btn btn-accent" onclick="Pages.adminMembers.showSendLinkModal()">📨 Send Registration Link</button>
          <button class="btn" style="background:rgba(255,255,255,0.15);color:white;border:1px solid rgba(255,255,255,0.3)" onclick="Pages.adminContributions.showDeathEventModal()">💔 Record Death Event</button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card" style="--stat-color:var(--clr-primary);--stat-icon-bg:#EFF6FF" onclick="Router.navigate('members', { filter: 'all' })">
          <div class="stat-card-icon">👥</div>
          <div class="stat-card-value">${members.length}</div>
          <div class="stat-card-label">Total Members</div>
        </div>
        <div class="stat-card" style="--stat-color:var(--clr-active);--stat-icon-bg:#DCFCE7" onclick="Router.navigate('members', { filter: 'active' })">
          <div class="stat-card-icon">✅</div>
          <div class="stat-card-value">${active}</div>
          <div class="stat-card-label">Active Members</div>
        </div>
        <div class="stat-card" style="--stat-color:var(--clr-grace);--stat-icon-bg:#FEF3C7" onclick="Router.navigate('members', { filter: 'grace' })">
          <div class="stat-card-icon">⏳</div>
          <div class="stat-card-value">${grace}</div>
          <div class="stat-card-label">Grace Period</div>
        </div>
        <div class="stat-card" style="--stat-color:#7c3aed;--stat-icon-bg:#EDE9FE" onclick="Router.navigate('members', { filter: 'pending' })">
          <div class="stat-card-icon">⌛</div>
          <div class="stat-card-value">${pending}</div>
          <div class="stat-card-label">Pending Approval</div>
        </div>
        <div class="stat-card" style="--stat-color:var(--clr-accent);--stat-icon-bg:#FFFBEB" onclick="Router.navigate('contributions')">
          <div class="stat-card-icon">💰</div>
          <div class="stat-card-value">${Utils.formatCurrency(totalKitty)}</div>
          <div class="stat-card-label">Total Kitty Balance</div>
        </div>
        <div class="stat-card" style="--stat-color:#dc2626;--stat-icon-bg:#FEF2F2" onclick="Router.navigate('contributions')">
          <div class="stat-card-icon">💔</div>
          <div class="stat-card-value">${deathEvents.length}</div>
          <div class="stat-card-label">Death Events</div>
        </div>
        <div class="stat-card" style="--stat-color:#d97706;--stat-icon-bg:#FFFBEB" onclick="Router.navigate('contributions')">
          <div class="stat-card-icon">📋</div>
          <div class="stat-card-value">${unpaidContribs}</div>
          <div class="stat-card-label">Unpaid Contributions</div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div style="margin-bottom:var(--sp-4)">
        <h3 style="font-size:var(--text-lg);font-weight:700;margin-bottom:var(--sp-4)">Quick Actions</h3>
      </div>
      <div class="quick-actions">
        <div class="quick-action-card" onclick="Pages.adminMembers.showSendLinkModal()">
          <div class="quick-action-icon" style="background:#EFF6FF">📨</div>
          <div class="quick-action-label">Send Registration Link</div>
        </div>
        <div class="quick-action-card" onclick="Router.navigate('emails')">
          <div class="quick-action-icon" style="background:#F0FDF4">📢</div>
          <div class="quick-action-label">Bulk Send Links</div>
        </div>
        <div class="quick-action-card" onclick="Notifications.bulkPaymentReminder('email');Utils.toast('Payment reminders sent!','success')">
          <div class="quick-action-icon" style="background:#FFFBEB">💸</div>
          <div class="quick-action-label">Payment Reminder</div>
        </div>
        <div class="quick-action-card" onclick="Pages.adminContributions.showDeathEventModal()">
          <div class="quick-action-icon" style="background:#FEF2F2">💔</div>
          <div class="quick-action-label">Record Death Event</div>
        </div>
        <div class="quick-action-card" onclick="PDF.membersReport(DB.getMembers())">
          <div class="quick-action-icon" style="background:#EDE9FE">📄</div>
          <div class="quick-action-label">Export Members PDF</div>
        </div>
        <div class="quick-action-card" onclick="Notifications.bulkSemiAnnualReminder()">
          <div class="quick-action-icon" style="background:#F0F9FF">🔔</div>
          <div class="quick-action-label">Semi-Annual Reminder</div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-5)">
        <!-- Pending Approvals -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">⏳ Pending Approvals</div>
            <button class="btn btn-sm btn-outline" onclick="Router.navigate('members')">View All</button>
          </div>
          <div class="card-body" style="padding:0">
            ${this.renderPendingList()}
          </div>
        </div>

        <!-- Audit Log -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">📋 Recent Activity</div>
            <button class="btn btn-sm btn-outline" onclick="PDF.auditReport()">Export</button>
          </div>
          <div class="card-body" style="padding:var(--sp-4)">
            <div class="audit-log-list">
              ${recentLogs.length ? recentLogs.map(l => `
                <div class="audit-log-item">
                  <span class="audit-log-icon">${this.actionIcon(l.action)}</span>
                  <div class="audit-log-msg">
                    <span class="audit-log-user">${Utils.sanitize(l.performedBy)}</span>
                    <span class="audit-log-field"> ${Utils.sanitize(l.action.replace(/_/g,' '))}</span>
                    on ${Utils.sanitize(l.entityType)}
                  </div>
                  <div class="audit-log-time">${Utils.formatDateTime(l.timestamp)}</div>
                </div>
              `).join('') : '<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-title">No recent activity</div></div>'}
            </div>
          </div>
        </div>
      </div>
    `;
    renderAdminLayout('dashboard', content);
  },

  renderPendingList() {
    const pending = DB.getMembers().filter(m => m.status === 'pending');
    if (!pending.length) {
      return '<div class="empty-state"><div class="empty-state-icon">✅</div><div class="empty-state-title">No pending approvals</div></div>';
    }
    return pending.slice(0, 5).map(m => `
      <div style="display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-4) var(--sp-5);border-bottom:1px solid var(--clr-border)">
        <div class="member-avatar">${Utils.getInitials(m.firstName, m.lastName)}</div>
        <div class="member-info" style="flex:1">
          <div class="member-name">${Utils.sanitize(Utils.fullName(m))}</div>
          <div class="member-email">${Utils.sanitize(m.email)}</div>
        </div>
        <div style="display:flex;gap:var(--sp-1)">
          <button class="btn btn-sm btn-success" onclick="Pages.adminMembers.approveMember('${m.id}')">Approve</button>
          <button class="btn btn-sm btn-ghost" onclick="Pages.adminMembers.rejectMember('${m.id}')">Reject</button>
        </div>
      </div>
    `).join('');
  },

  getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  },

  actionIcon(action) {
    const icons = { login: '🔑', logout: '🚪', status_change: '🔄', created: '✨', updated: '✏️', deleted: '🗑️', approved: '✅', rejected: '❌' };
    return icons[action] || '📋';
  },

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
  },

  showNotifications() {
    const notifs = DB.getNotifications().sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    const unread = notifs.filter(n => !n.read).length;

    Utils.showModal(
      `🔔 Notifications ${unread > 0 ? `<span class="badge badge-active" style="margin-left:0.5rem">${unread} new</span>` : ''}`,
      `<div class="notif-list-modal">
        ${notifs.length ? notifs.map(n => `
          <div class="notif-item ${n.read ? '' : 'unread'}" onclick="Pages.adminDashboard.toggleRead('${n.id}', event)">
            <div class="notif-icon">${this.actionIcon(n.type)}</div>
            <div class="notif-content">
              <div class="notif-subject">${Utils.sanitize(n.subject || 'Notification')}</div>
              <div class="notif-msg">${Utils.sanitize(n.message).substring(0, 100)}...</div>
              <div class="notif-time">${Utils.formatDateTime(n.timestamp)}</div>
            </div>
            ${!n.read ? '<div class="notif-dot"></div>' : ''}
          </div>
        `).join('') : '<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-title">No notifications</div></div>'}
      </div>`,
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">Close</button>
       ${notifs.some(n => !n.read) ? `<button class="btn btn-primary" onclick="Pages.adminDashboard.markAllRead()">Mark all as read</button>` : ''}`
    );
  },

  toggleRead(id, event) {
    DB.markNotificationRead(id);
    this.showNotifications();
    this.render(); // Update topbar
  },

  markAllRead() {
    const notifs = DB.getNotifications();
    notifs.forEach(n => n.read = true);
    DB.set(DB.KEYS.notifications, notifs);
    this.showNotifications();
    this.render();
  },

  showUserMenu() {
    Utils.showModal(
      '👤 Account',
      `<div style="text-align:center;margin-bottom:1rem">
        <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--clr-primary),var(--clr-accent));display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem;font-weight:700;margin:0 auto 0.75rem">${Utils.getInitials(Auth.currentUser.firstName, Auth.currentUser.lastName)}</div>
        <div style="font-weight:700;font-size:1.1rem">${Utils.sanitize(Utils.fullName(Auth.currentUser))}</div>
        <div style="color:var(--clr-text-muted);font-size:0.8rem">${Utils.sanitize(Auth.currentUser.email)}</div>
        <div style="margin-top:0.5rem">${Auth.isSuperAdmin() ? '<span class="badge badge-active">Super Admin</span>' : '<span class="badge badge-pending">Committee Member</span>'}</div>
      </div>`,
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">Close</button>
       <button class="btn btn-danger" onclick="Utils.closeModal();Auth.logout()">🚪 Logout</button>`
    );
  }
};
