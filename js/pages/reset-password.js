/* ===========================
   RESET PASSWORD PAGE
   =========================== */
Pages.resetPassword = {
  token: null,
  type: 'member',

  render() {
    const params = Utils.getUrlParams();
    const tokenId = params.token;

    if (!tokenId) {
      this.renderError('Invalid or missing token.');
      return;
    }

    const result = DB.validateToken(tokenId);
    if (!result.valid) {
      this.renderError('This link has expired or is invalid. Please request a new password reset link.');
      return;
    }

    this.token = result.token;
    this.type = result.token.type === 'admin_reset' ? 'admin' : 'member';

    document.getElementById('app-root').innerHTML = `
      <div class="public-page">
        <div class="login-card" style="max-width:420px">
          <div class="login-card-top">
            <div class="login-logo">A</div>
            <div class="login-title">Reset Password</div>
            <div class="login-subtitle">Set a new secure password for your account</div>
          </div>
          <div class="login-card-body">
            <div id="reset-error" class="alert alert-error" style="display:none">
              <span class="alert-icon">❌</span>
              <div class="alert-content"><span id="reset-error-msg"></span></div>
            </div>

            <form onsubmit="Pages.resetPassword.handleSubmit(event)">
              <div class="form-field" style="margin-bottom:1.25rem">
                <label class="field-label">New Password</label>
                <input type="password" id="new-password" class="field-input" placeholder="••••••••" required minlength="6"/>
              </div>
              <div class="form-field" style="margin-bottom:2rem">
                <label class="field-label">Confirm New Password</label>
                <input type="password" id="confirm-password" class="field-input" placeholder="••••••••" required minlength="6"/>
              </div>
              
              <button type="submit" class="btn btn-primary" style="width:100%" id="reset-btn">
                Update Password →
              </button>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  renderError(msg) {
    document.getElementById('app-root').innerHTML = `
      <div class="public-page">
        <div class="form-card" style="max-width:400px;text-align:center">
          <div class="form-card-body">
            <div style="font-size:3rem;margin-bottom:1.5rem">⚠️</div>
            <h2 style="font-weight:700;margin-bottom:1rem">Link Issue</h2>
            <p style="color:var(--clr-text-muted);margin-bottom:1.5rem">${msg}</p>
            <button class="btn btn-primary" onclick="Router.navigate('login')">Go to Login</button>
          </div>
        </div>
      </div>
    `;
  },

  handleSubmit(e) {
    e.preventDefault();
    const p1 = document.getElementById('new-password').value;
    const p2 = document.getElementById('confirm-password').value;
    const errDiv = document.getElementById('reset-error');
    const errMsg = document.getElementById('reset-error-msg');
    const btn = document.getElementById('reset-btn');

    if (p1 !== p2) {
      errMsg.textContent = 'Passwords do not match.';
      errDiv.style.display = 'flex';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Updating...';

    const success = Auth.resetPassword(this.token.memberId, this.type, p1);

    if (success) {
      DB.useToken(this.token.id);
      Utils.toast('Password updated successfully!', 'success');
      
      document.getElementById('app-root').innerHTML = `
        <div class="public-page">
          <div class="form-card" style="max-width:400px;text-align:center">
            <div class="form-card-body">
              <div style="font-size:3rem;margin-bottom:1.5rem">✅</div>
              <h2 style="font-weight:700;margin-bottom:1rem">Password Reset</h2>
              <p style="color:var(--clr-text-muted);margin-bottom:1.5rem">Your password has been updated. You can now login with your new credentials.</p>
              <button class="btn btn-success" style="width:100%" onclick="Router.navigate('${this.type === 'admin' ? 'login' : 'member-login'}')">Login Now →</button>
            </div>
          </div>
        </div>
      `;
    } else {
      errMsg.textContent = 'Could not reset password. User not found.';
      errDiv.style.display = 'flex';
      btn.disabled = false;
      btn.textContent = 'Update Password →';
    }
  }
};
