/* ===========================
   ROUTER.js - Client-side routing
   =========================== */
window.Pages = {};

const Router = {
  currentPage: null,
  history: [],

  routes: {
    // Public routes
    'landing':      () => Pages.landing.render(),
    'login':        () => Pages.login.render('admin'),
    'member-login': () => Pages.login.render('member'),
    'register':     () => Pages.register.render(),
    'update':       () => Pages.update.render(),
    // Admin routes
    'dashboard':    () => Pages.adminDashboard.render(),
    'members':      (params) => Pages.adminMembers.render(params),
    'emails':       (params) => Pages.adminEmails.render(params?.type, params?.subject ? {subject: params.subject, body: params.body} : null),
    'contributions':() => Pages.adminContributions.render(),
    'reports':      () => Pages.adminReports.render(),
    'tickets':      () => Pages.adminTickets.render(),
    'messages':     () => Pages.adminMessages.render(),
    'committees':   () => Pages.adminCommittees.render(),
    'committee-forum': (params) => Pages.adminForum.render(params),
    'settings':     () => Pages.adminSettings.render(),
    // Member portal
    'portal':       () => Pages.memberPortal.render(),
    'reset-password':() => Pages.resetPassword.render(),
  },

  navigate(page, params = {}) {
    // Prevent redundant navigation to the same page/params
    if (this.currentPage === page && JSON.stringify(this.currentParams) === JSON.stringify(params)) {
      return;
    }

    if (this.currentPage) this.history.push(this.currentPage);

    // Auth guards
    const adminPages = ['dashboard', 'members', 'emails', 'contributions', 'reports', 'settings', 'tickets', 'messages', 'committees', 'committee-forum'];
    const memberPages = ['portal'];

    if (adminPages.includes(page) && !Auth.isAdmin()) {
      return this.navigate('login');
    }
    if (memberPages.includes(page) && !Auth.isMember()) {
      return this.navigate('member-login');
    }

    // Always ensure preloader is removed when navigating
    const preloader = document.getElementById('loading-screen');
    if (preloader) {
      preloader.classList.add('fade-out');
      setTimeout(() => preloader.remove(), 600);
    }

    this.currentPage = page;
    this.currentParams = params;

    const root = document.getElementById('app-root');
    root.innerHTML = '';

    const renderer = this.routes[page];
    if (renderer) {
      renderer(this.currentParams);
    } else {
      root.innerHTML = '<div style="text-align:center;padding:4rem"><h2>Page not found</h2></div>';
    }

    // Update URL hash without reload
    const hash = `#${page}` + (Object.keys(params).length > 0 ? `?${new URLSearchParams(params).toString()}` : '');
    if (window.location.hash !== hash) {
      window.history.pushState({ page, params }, '', hash);
    }
  },

  refresh() {
    if (!this.currentPage) return;
    const renderer = this.routes[this.currentPage];
    if (renderer) renderer(this.currentParams);
  },

  back() {
    if (this.history.length) {
      this.navigate(this.history.pop());
    }
  },

  init() {
    if (this.started) return;
    this.started = true;
    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
      this.handleHashChange();
    });

    window.addEventListener('hashchange', () => {
      this.handleHashChange();
    });

    // Handle initial route
    this.handleHashChange();
  },

  handleHashChange() {
    const hash = window.location.hash.substring(1); // Remove #
    if (!hash) {
      if (Auth.isAdmin()) {
        this.navigate('dashboard');
      } else if (Auth.isMember()) {
        this.navigate('portal');
      } else {
        this.navigate('landing');
      }
      return;
    }

    const [page, search] = hash.split('?');
    const params = {};
    if (search) {
      search.split('&').forEach(pair => {
        const [k, v] = pair.split('=');
        if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
      });
    }
    
    this.navigate(page, params);
  }
};

window.Router = Router;
