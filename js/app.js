window.App = {
  initialized: false,

  async init() {
    if (this.initialized) return;

    // Safety Timer: Always remove loading screen after 4s max if DB hangs
    const safetyTimer = setTimeout(() => {
      this.hideLoading();
    }, 4000);

    try {
      // 1. Load Data
      await DB.init();
      DB.seedIfEmpty();

      // 2. Load Auth
      Auth.init();
      
      this.initialized = true;
      clearTimeout(safetyTimer);
      
      // Start router first so page content is ready
      Router.init();
      // Then fade out the preloader
      this.hideLoading();
    } catch (err) {
      console.error('App init failed:', err);
      Router.init();
      this.hideLoading();
    }
  },

  hideLoading() {
    if (this.loadingHidden) return;
    this.loadingHidden = true;

    const loading = document.getElementById('loading-screen');
    if (loading) {
      loading.classList.add('fade-out');
      setTimeout(() => {
        if (loading.parentNode) loading.remove();
      }, 600);
    }
  },

  render() {
    if (Router.currentPage) Router.refresh();
  }
};

// Bootstrap
document.addEventListener('DOMContentLoaded', () => App.init());
