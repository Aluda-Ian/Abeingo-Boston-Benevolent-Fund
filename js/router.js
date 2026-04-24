/* ===========================
   ROUTER.js - Client-side routing
   =========================== */
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
    'members':      () => Pages.adminMembers.render(),
    'emails':       (params) => Pages.adminEmails.render(params?.type, params?.subject ? {subject: params.subject, body: params.body} : null),
    'contributions':() => Pages.adminContributions.render(),
    'reports':      () => Pages.adminReports.render(),
    'settings':     () => Pages.adminSettings.render(),
    // Member portal
    'portal':       () => Pages.memberPortal.render(),
  },

  navigate(page, params = {}) {
    if (this.currentPage) this.history.push(this.currentPage);

    // Auth guards
    const adminPages = ['dashboard', 'members', 'emails', 'contributions', 'reports', 'settings'];
    const memberPages = ['portal'];

    if (adminPages.includes(page) && !Auth.isAdmin()) {
      return this.navigate('login');
    }
    if (memberPages.includes(page) && !Auth.isMember()) {
      return this.navigate('member-login');
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

    // Update URL without reload
    const url = new URL(window.location.href);
    url.searchParams.set('page', page);
    if (Object.keys(params).length) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    window.history.pushState({ page, params }, '', url.toString());
  },

  back() {
    if (this.history.length) {
      this.navigate(this.history.pop());
    }
  },

  init() {
    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.page) {
        this.navigate(e.state.page, e.state.params || {});
      }
    });

    // Detect initial route from URL params
    const params = Utils.getUrlParams();
    if (params.page) {
      this.navigate(params.page, params);
    } else if (Auth.isAdmin()) {
      this.navigate('dashboard');
    } else if (Auth.isMember()) {
      this.navigate('portal');
    } else {
      this.navigate('landing');
    }
  }
};

window.Router = Router;
