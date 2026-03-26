/* ===========================
   APP.js - Application Entry Point
   =========================== */
window.App = {
  init() {
    // Seed initial data
    DB.seedIfEmpty();

    // Initialize auth from session
    Auth.init();

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
      document.querySelectorAll('.dropdown-menu').forEach(m => {
        if (!m.parentElement.contains(e.target)) m.classList.add('hidden');
      });
    });

    // Close modal on overlay click
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('modal-overlay')) Utils.closeModal();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') Utils.closeModal();
    });

    // Fade out loading screen
    setTimeout(() => {
      const loading = document.getElementById('loading-screen');
      if (loading) {
        loading.classList.add('fade-out');
        setTimeout(() => loading.remove(), 600);
      }
      // Route
      Router.init();
    }, 1800);
  },

  render() {
    // Used by i18n to re-render current page
    if (Router.currentPage) Router.navigate(Router.currentPage);
  }
};

// Landing page (used as root)
Pages.landing = {
  render() {
    document.getElementById('app-root').innerHTML = `
      <div style="min-height:100vh;background:linear-gradient(135deg,var(--clr-primary-dark) 0%,var(--clr-primary) 50%,#1e4976 100%);display:flex;align-items:center;justify-content:center;padding:2rem">
        <div style="max-width:560px;width:100%;text-align:center;animation:fadeInUp 0.6s ease">
          <div style="width:90px;height:90px;border-radius:50%;background:linear-gradient(135deg,var(--clr-accent),var(--clr-gold));display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:2.5rem;color:white;font-weight:700;margin:0 auto 2rem;box-shadow:0 0 40px rgba(200,150,62,0.6)">A</div>
          <h1 style="font-family:var(--font-display);font-size:2.5rem;font-weight:700;color:white;margin-bottom:0.75rem;line-height:1.2">Abeingo Boston<br>Benevolent Fund</h1>
          <p style="color:rgba(255,255,255,0.75);font-size:1.1rem;margin-bottom:3rem">Member Registration & Fund Management System</p>
          
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:2rem">
            <div style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:1rem;padding:1.5rem;cursor:pointer;transition:all 0.25s;backdrop-filter:blur(10px)" onclick="Router.navigate('login')" onmouseenter="this.style.background='rgba(255,255,255,0.2)'" onmouseleave="this.style.background='rgba(255,255,255,0.1)'">
              <div style="font-size:2.5rem;margin-bottom:0.75rem">🏛️</div>
              <div style="color:white;font-weight:700;font-size:1.1rem;margin-bottom:0.25rem">Admin Portal</div>
              <div style="color:rgba(255,255,255,0.65);font-size:0.8rem">Committee & Admin Access</div>
            </div>
            <div style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:1rem;padding:1.5rem;cursor:pointer;transition:all 0.25s;backdrop-filter:blur(10px)" onclick="Router.navigate('member-login')" onmouseenter="this.style.background='rgba(255,255,255,0.2)'" onmouseleave="this.style.background='rgba(255,255,255,0.1)'">
              <div style="font-size:2.5rem;margin-bottom:0.75rem">👤</div>
              <div style="color:white;font-weight:700;font-size:1.1rem;margin-bottom:0.25rem">Member Portal</div>
              <div style="color:rgba(255,255,255,0.65);font-size:0.8rem">View Your Profile & History</div>
            </div>
          </div>

          <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:0.75rem;padding:1.25rem;margin-bottom:2rem">
            <div style="color:rgba(255,255,255,0.6);font-size:0.75rem;margin-bottom:0.5rem">NEW MEMBER?</div>
            <div style="color:rgba(255,255,255,0.85);font-size:0.875rem">Registration is by invitation only. Please contact the fund administrator to receive your unique registration link.</div>
          </div>

          <div style="display:flex;justify-content:center;gap:0.5rem">
            ${['en','pt','es','it'].map(l => `
              <button onclick="I18N.setLang('${l}')" style="background:${I18N.currentLang===l?'rgba(200,150,62,0.4)':'rgba(255,255,255,0.1)'};border:1px solid rgba(255,255,255,0.2);color:white;padding:0.35rem 0.75rem;border-radius:2rem;font-size:0.75rem;cursor:pointer;transition:all 0.2s">
                ${{en:'🇺🇸 EN',pt:'🇧🇷 PT',es:'🇪🇸 ES',it:'🇮🇹 IT'}[l]}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }
};

// Bootstrap app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
