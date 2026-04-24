/* ===========================
   AUTH.js - Authentication
   =========================== */
const Auth = {
  currentUser: null,
  SESSION_KEY: 'abbf_session',

  init() {
    const saved = sessionStorage.getItem(this.SESSION_KEY) || localStorage.getItem(this.SESSION_KEY);
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved);
      } catch { this.currentUser = null; }
    }
  },

  loginAdmin(email, password, remember = false) {
    const admin = DB.getAdminByEmail(email);
    if (!admin) return { success: false, error: 'Invalid email or password.' };
    if (admin.password !== password) return { success: false, error: 'Invalid email or password.' };
    if (!admin.active) return { success: false, error: 'This account has been deactivated.' };
    this.currentUser = { ...admin, type: 'admin' };
    delete this.currentUser.password;
    const store = remember ? localStorage : sessionStorage;
    store.setItem(this.SESSION_KEY, JSON.stringify(this.currentUser));
    DB.addAuditLog(admin.id, 'admin', 'login', null, null, admin.email);
    return { success: true, user: this.currentUser };
  },

  loginMember(email, password) {
    const member = DB.getMemberByEmail(email);
    if (!member) return { success: false, error: 'Invalid email or password.' };
    if (member.password !== password) return { success: false, error: 'Invalid email or password.' };
    if (member.status === 'terminated') return { success: false, error: 'Your membership has been terminated.' };
    this.currentUser = { ...member, type: 'member' };
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(this.currentUser));
    return { success: true, user: this.currentUser };
  },

  logout() {
    this.currentUser = null;
    sessionStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.SESSION_KEY);
    window.Router.navigate('login');
  },

  isAdmin() {
    return this.currentUser && this.currentUser.type === 'admin';
  },

  isSuperAdmin() {
    return this.currentUser && this.currentUser.role === 'super_admin';
  },

  isMember() {
    return this.currentUser && this.currentUser.type === 'member';
  },

  requireAdmin() {
    if (!this.isAdmin()) {
      window.Router.navigate('login');
      return false;
    }
    return true;
  },

  requireMember() {
    if (!this.isMember()) {
      window.Router.navigate('member-login');
      return false;
    }
    return true;
  },

  resetPassword(memberId, type, newPassword) {
    if (type === 'admin') {
      const admins = DB.get(DB.KEYS.admins);
      const index = admins.findIndex(a => a.id === memberId);
      if (index >= 0) {
        admins[index].password = newPassword;
        admins[index].updatedAt = new Date().toISOString();
        DB.set(DB.KEYS.admins, admins);
        return true;
      }
    } else {
      const members = DB.getMembers();
      const index = members.findIndex(m => m.id === memberId);
      if (index >= 0) {
        members[index].password = newPassword;
        DB.set(DB.KEYS.members, members);
        return true;
      }
    }
    return false;
  }
};

window.Auth = Auth;
