/* ===========================
   LOGIN PAGE
   =========================== */
Pages.login = {
  render(type = 'admin') {
    const root = document.getElementById('app-root');
    const isAdmin = type === 'admin';
    root.innerHTML = `
      <div class="login-page">
        <div class="login-card">
          <div class="login-card-top">
            <div class="login-logo">A</div>
            <div class="login-title">${I18N.t('appName')}</div>
            <div class="login-subtitle">${isAdmin ? 'Admin Portal' : 'Member Portal'} – Secure Login</div>
          </div>
          <div class="login-card-body">
            <div id="login-error" class="alert alert-error" style="display:none">
              <span class="alert-icon">❌</span>
              <div class="alert-content"><span id="login-error-msg"></span></div>
            </div>
            <form id="login-form" onsubmit="Pages.login.handleSubmit(event, '${type}')">
              <div class="form-field" style="margin-bottom:1.25rem">
                <label class="field-label" for="login-email">${I18N.t('email')}</label>
                <input type="email" id="login-email" class="field-input" placeholder="your@email.com" required autocomplete="email"/>
              </div>
              <div class="form-field" style="margin-bottom:1.25rem">
                <label class="field-label" for="login-password">${I18N.t('password')}</label>
                <div style="position:relative">
                  <input type="password" id="login-password" class="field-input" placeholder="••••••••" required autocomplete="current-password"/>
                  <button type="button" onclick="Pages.login.togglePwd()" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--clr-text-muted);font-size:1rem">👁</button>
                </div>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
                <label class="checkbox-item" style="margin:0">
                  <input type="checkbox" id="remember-me"/>
                  <span class="checkbox-label" style="font-size:0.8rem">${I18N.t('rememberMe')}</span>
                </label>
                <span style="font-size:0.8rem;color:var(--clr-primary);cursor:pointer" onclick="Pages.login.forgotPassword('${type}')">${I18N.t('forgotPassword')}</span>
              </div>
              <button type="submit" class="btn btn-primary" style="width:100%;padding:0.9rem" id="login-btn">
                <span>🔐</span> ${I18N.t('login')}
              </button>
            </form>

            <div style="text-align:center;margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid var(--clr-border)">
              ${isAdmin 
                ? `<a href="#" onclick="Router.navigate('member-login')" style="font-size:0.8rem;color:var(--clr-text-muted)">Member? <strong style="color:var(--clr-primary)">Access Member Portal</strong></a>`
                : `<a href="#" onclick="Router.navigate('login')" style="font-size:0.8rem;color:var(--clr-text-muted)">Admin? <strong style="color:var(--clr-primary)">Access Admin Portal</strong></a>`
              }
            </div>

            ${isAdmin ? `
            <div class="alert alert-info" style="margin-top:1rem">
              <span class="alert-icon">ℹ️</span>
              <div class="alert-content" style="font-size:0.75rem">
                <strong>Demo Credentials:</strong><br>
                Super Admin: admin@abeingo.org / Admin@1234<br>
                Committee: committee@abeingo.org / Committee@1234
              </div>
            </div>` : `
            <div class="alert alert-info" style="margin-top:1rem">
              <span class="alert-icon">ℹ️</span>
              <div class="alert-content" style="font-size:0.75rem">
                Member login uses your registered email and password set during registration.
              </div>
            </div>`}

            <div style="text-align:center;margin-top:1rem">
              <select class="lang-select" onchange="I18N.setLang(this.value)" style="margin:0 auto">
                <option value="en" ${I18N.currentLang==='en'?'selected':''}>🇺🇸 English</option>
                <option value="pt" ${I18N.currentLang==='pt'?'selected':''}>🇧🇷 Português</option>
                <option value="es" ${I18N.currentLang==='es'?'selected':''}>🇪🇸 Español</option>
                <option value="it" ${I18N.currentLang==='it'?'selected':''}>🇮🇹 Italiano</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    `;

    // Auto-fill for demo
    if (isAdmin) {
      document.getElementById('login-email').value = 'admin@abeingo.org';
      document.getElementById('login-password').value = 'Admin@1234';
    }
  },

  togglePwd() {
    const inp = document.getElementById('login-password');
    inp.type = inp.type === 'password' ? 'text' : 'password';
  },

  handleSubmit(e, type) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const remember = document.getElementById('remember-me').checked;
    const btn = document.getElementById('login-btn');
    const errDiv = document.getElementById('login-error');
    const errMsg = document.getElementById('login-error-msg');

    btn.disabled = true;
    btn.innerHTML = '<span class="spin" style="display:inline-block;animation:spin 1s linear infinite">⟳</span> Logging in...';
    errDiv.style.display = 'none';

    setTimeout(() => {
      const result = type === 'admin' 
        ? Auth.loginAdmin(email, password, remember)
        : Auth.loginMember(email, password);

      if (result.success) {
        Utils.toast(`Welcome back, ${result.user.firstName}!`, 'success');
        Router.navigate(type === 'admin' ? 'dashboard' : 'portal');
      } else {
        errMsg.textContent = result.error;
        errDiv.style.display = 'flex';
        btn.disabled = false;
        btn.innerHTML = `<span>🔐</span> ${I18N.t('login')}`;
      }
    }, 600);
  },

  forgotPassword(type = 'member') {
    const isAdmin = type === 'admin';
    Utils.showModal(
      '🔑 Reset Password',
      `<div class="form-field">
        <label class="field-label">Enter your registered email</label>
        <input type="email" id="reset-email-input" class="field-input" placeholder="your@email.com"/>
      </div>
      <p style="font-size:0.8rem;color:var(--clr-text-muted);margin-top:0.75rem">A secure password reset link will be sent to your email.</p>`,
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
       <button class="btn btn-primary" id="send-reset-btn" onclick="Pages.login.handleForgotPasswordRequest('${type}')">Send Reset Link</button>`
    );
  },

  async handleForgotPasswordRequest(type) {
    const email = document.getElementById('reset-email-input').value.trim();
    if (!email || !Utils.isValidEmail(email)) { Utils.toast('Please enter a valid email', 'error'); return; }

    const btn = document.getElementById('send-reset-btn');
    btn.disabled = true;
    btn.textContent = 'Sending...';

    const user = type === 'admin' ? DB.getAdminByEmail(email) : DB.getMemberByEmail(email);
    
    if (user) {
      const token = DB.generateToken(type === 'admin' ? 'admin_reset' : 'password_reset', user.id, email);
      const link = Utils.generateLink(token);
      await Notifications.sendPasswordReset(user, link);
      Utils.toast('Reset link sent to ' + email, 'success');
    } else {
      // For security, still say sent
      Utils.toast('If that email exists, reset instructions have been sent.', 'info');
    }
    Utils.closeModal();
  }
};
