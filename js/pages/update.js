/* ===========================
   UPDATE PAGE
   Pre-filled profile update form with change tracking and re-signature
   =========================== */
Pages.update = {
  currentStep: 0,
  totalSteps: 5,
  originalData: {},
  formData: {},
  signatureData: null,
  token: null,
  member: null,
  uploadedFiles: {},

  steps: ['Personal', 'Family', 'Beneficiary', 'Waiver', 'Review'],

  render() {
    const params = Utils.getUrlParams();
    const tokenId = params.token;

    if (tokenId) {
      const result = DB.validateToken(tokenId);
      if (!result.valid) {
        this.renderExpired(result.reason);
        return;
      }
      this.token = result.token;
      this.member = DB.getMember(result.token.memberId);
      if (!this.member) { this.renderExpired('not_found'); return; }
      if (!Object.keys(this.formData).length) {
        this.formData = JSON.parse(JSON.stringify(this.member));
        this.originalData = JSON.parse(JSON.stringify(this.member));
      }
    } else {
      this.renderExpired('not_found');
      return;
    }

    const waiver = DB.getLatestWaiver();
    const changes = this.detectChanges();

    document.getElementById('app-root').innerHTML = `
      <div class="public-page">
        <div class="public-header">
          <div class="public-logo">A</div>
          <div class="public-title">${I18N.t('appName')}</div>
          <div class="public-subtitle">Member Profile Update</div>
          <div class="expiry-badge" style="margin-top:0.75rem">⏰ Expires: ${Utils.formatDateTime(this.token.expiresAt)}</div>
        </div>

        <div class="form-card" style="max-width:760px">
          <div class="form-card-header">
            <div class="form-card-title">Update Profile – ${Utils.sanitize(Utils.fullName(this.member))}</div>
            <div class="form-card-subtitle">Step ${this.currentStep + 1} of ${this.totalSteps}: ${this.steps[this.currentStep]}</div>
          </div>
          <div class="form-card-body">
            <!-- Progress -->
            <div class="progress-steps">
              ${this.steps.map((s, i) => `
                <div class="step-item ${i < this.currentStep ? 'completed' : i === this.currentStep ? 'active' : ''}">
                  <div class="step-circle">${i < this.currentStep ? '✓' : i + 1}</div>
                  <div class="step-label">${s}</div>
                </div>
              `).join('')}
            </div>

            ${changes.length > 0 ? `
              <div class="alert alert-warning" style="margin-bottom:1.5rem">
                <span class="alert-icon">⚠️</span>
                <div class="alert-content"><strong>${changes.length} change(s) detected</strong> from your previous submission.</div>
              </div>
            ` : ''}

            <div id="update-steps">
              ${this.renderSteps(waiver)}
            </div>
          </div>
        </div>
      </div>
    `;

    if (this.currentStep === 3) {
      setTimeout(() => Pages.register.initSignaturePad.call(this), 100);
    }
  },

  renderExpired(reason) {
    document.getElementById('app-root').innerHTML = `
      <div class="public-page">
        <div class="public-header"><div class="public-logo">A</div><div class="public-title">${I18N.t('appName')}</div></div>
        <div class="form-card">
          <div class="form-card-body">
            <div class="expired-screen">
              <div class="expired-icon">⏰</div>
              <h2 style="font-size:1.5rem;font-weight:700;margin-bottom:0.75rem">${reason === 'expired' ? I18N.t('linkExpired') : 'Invalid Link'}</h2>
              <p style="color:var(--clr-text-muted);margin-bottom:1.5rem">${I18N.t('requestNewLink')}</p>
              <div class="alert alert-info"><span class="alert-icon">ℹ️</span><div class="alert-content">Update links expire after 72 hours. Please request a new link through your member portal or contact the admin.</div></div>
              <button class="btn btn-primary" style="margin-top:1rem" onclick="Router.navigate('member-login')">Member Portal Login →</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  detectChanges() {
    const changes = [];
    const fields = ['firstName', 'lastName', 'phone', 'address', 'city', 'state', 'zipCode', 'country', 'occupation'];
    fields.forEach(f => {
      if (this.formData[f] !== this.originalData[f]) {
        changes.push({ field: f, old: this.originalData[f], new: this.formData[f] });
      }
    });
    return changes;
  },

  renderSteps(waiver) {
    const d = this.formData;
    const orig = this.originalData;
    const changed = (field) => d[field] !== orig[field] ? 'border-color:var(--clr-accent);background:#fffbeb' : '';

    return `
      <!-- Step 0: Personal -->
      <div class="form-step ${this.currentStep === 0 ? 'active' : ''}">
        <div class="form-section-title">👤 Personal Information</div>
        <div class="form-grid">
          <div class="form-field">
            <label class="field-label">First Name<span class="field-required">*</span></label>
            <input type="text" id="u-fname" class="field-input" style="${changed('firstName')}" value="${Utils.sanitize(d.firstName || '')}" oninput="Pages.update.updateField('firstName',this.value)"/>
          </div>
          <div class="form-field">
            <label class="field-label">Last Name<span class="field-required">*</span></label>
            <input type="text" id="u-lname" class="field-input" style="${changed('lastName')}" value="${Utils.sanitize(d.lastName || '')}" oninput="Pages.update.updateField('lastName',this.value)"/>
          </div>
          <div class="form-field">
            <label class="field-label">Email</label>
            <input type="email" class="field-input" value="${Utils.sanitize(d.email || '')}" readonly style="background:var(--clr-surface-2);cursor:not-allowed"/>
            <div class="field-hint">Email cannot be changed. Contact admin.</div>
          </div>
          <div class="form-field">
            <label class="field-label">Phone</label>
            <input type="tel" id="u-phone" class="field-input" style="${changed('phone')}" value="${Utils.sanitize(d.phone || '')}" oninput="Pages.update.updateField('phone',this.value)"/>
          </div>
          <div class="form-field">
            <label class="field-label">Occupation</label>
            <input type="text" id="u-occupation" class="field-input" style="${changed('occupation')}" value="${Utils.sanitize(d.occupation || '')}" oninput="Pages.update.updateField('occupation',this.value)"/>
          </div>
          <div class="form-field full-width">
            <label class="field-label">Address</label>
            <input type="text" id="u-address" class="field-input" style="${changed('address')}" value="${Utils.sanitize(d.address || '')}" oninput="Pages.update.updateField('address',this.value)"/>
          </div>
          <div class="form-field">
            <label class="field-label">City</label>
            <input type="text" id="u-city" class="field-input" style="${changed('city')}" value="${Utils.sanitize(d.city || '')}" oninput="Pages.update.updateField('city',this.value)"/>
          </div>
          <div class="form-field">
            <label class="field-label">State</label>
            <input type="text" id="u-state" class="field-input" style="${changed('state')}" value="${Utils.sanitize(d.state || '')}" oninput="Pages.update.updateField('state',this.value)"/>
          </div>
          <div class="form-field">
            <label class="field-label">Zip Code</label>
            <input type="text" id="u-zip" class="field-input" style="${changed('zipCode')}" value="${Utils.sanitize(d.zipCode || '')}" oninput="Pages.update.updateField('zipCode',this.value)"/>
          </div>
          <div class="form-field">
            <label class="field-label">Country</label>
            <input type="text" id="u-country" class="field-input" style="${changed('country')}" value="${Utils.sanitize(d.country || '')}" oninput="Pages.update.updateField('country',this.value)"/>
          </div>
        </div>
        ${this.renderFormNav(0)}
      </div>

      <!-- Step 1: Family -->
      <div class="form-step ${this.currentStep === 1 ? 'active' : ''}">
        <div class="form-section-title">👨‍👩‍👧 Family Members</div>
        <div class="alert alert-info"><span class="alert-icon">ℹ️</span><div class="alert-content">Update family members here. If a family member has passed away, change their status accordingly. You may add new newborn children or a new spouse.</div></div>
        <div id="update-family-rows">
          ${this.renderUpdateFamilyRows()}
        </div>
        <button type="button" class="add-row-btn" onclick="Pages.update.addFamilyMember()">+ Add Family Member</button>
        ${this.renderFormNav(1)}
      </div>

      <!-- Step 2: Beneficiaries -->
      <div class="form-step ${this.currentStep === 2 ? 'active' : ''}">
        <div class="form-section-title">🏦 Beneficiaries</div>
        <div id="update-beneficiary-container">
          ${Pages.register.renderBeneficiarySection.call({ formData: this.formData })}
        </div>
        ${this.renderFormNav(2)}
      </div>

      <!-- Step 3: Waiver Re-sign -->
      <div class="form-step ${this.currentStep === 3 ? 'active' : ''}">
        <div class="form-section-title">📜 Re-confirm Waiver</div>
        <div class="alert alert-info"><span class="alert-icon">ℹ️</span><div class="alert-content">By submitting this update, you re-confirm and consent to the current terms of the Abeingo Boston Benevolent Fund.</div></div>
        <div class="waiver-box" style="max-height:200px">${waiver ? waiver.content : WAIVER_TEXT}</div>
        <div class="form-section-title">✍️ Re-sign</div>
        <div class="signature-area">
          <canvas id="signature-canvas"></canvas>
          <div class="sig-hint" id="sig-hint">Sign here to confirm</div>
          <div class="signature-toolbar">
            <button type="button" class="btn btn-ghost btn-sm" onclick="Pages.register.clearSignature.call(Pages.update)">Clear</button>
          </div>
        </div>
        <div style="margin-top:1rem">
          <label class="checkbox-item">
            <input type="checkbox" id="u-consent-waiver"/>
            <span class="checkbox-label">I confirm that all my information is accurate and up to date. I re-affirm my agreement to the Waiver of Liability.</span>
          </label>
        </div>
        ${this.renderFormNav(3)}
      </div>

      <!-- Step 4: Review -->
      <div class="form-step ${this.currentStep === 4 ? 'active' : ''}">
        <div class="form-section-title">✅ Review Changes</div>
        ${this.renderChangeSummary()}
        <div style="margin-top:1.5rem">
          <label class="checkbox-item">
            <input type="checkbox" id="u-consent-final"/>
            <span class="checkbox-label"><strong>${I18N.t('consent')}</strong></span>
          </label>
        </div>
        ${this.renderFormNav(4)}
      </div>
    `;
  },

  renderUpdateFamilyRows() {
    const family = this.formData.familyMembers || [];
    if (!family.length) return '<div style="color:var(--clr-text-muted);font-size:0.875rem;text-align:center;padding:1rem">No family members listed.</div>';
    return family.map((f, i) => `
      <div class="family-row">
        <div class="family-row-header">
          <div class="family-row-title">${Utils.sanitize(f.firstName || '')} ${Utils.sanitize(f.lastName || '')} (${f.relationship})</div>
          <button type="button" class="family-row-remove" onclick="Pages.update.removeFamilyMember(${i})">✕</button>
        </div>
        <div class="form-grid">
          <div class="form-field">
            <label class="field-label">First Name</label>
            <input type="text" class="field-input" value="${Utils.sanitize(f.firstName || '')}" onchange="Pages.update.updateFamilyField(${i},'firstName',this.value)"/>
          </div>
          <div class="form-field">
            <label class="field-label">Last Name</label>
            <input type="text" class="field-input" value="${Utils.sanitize(f.lastName || '')}" onchange="Pages.update.updateFamilyField(${i},'lastName',this.value)"/>
          </div>
          <div class="form-field">
            <label class="field-label">Status</label>
            <select class="field-select" onchange="Pages.update.updateFamilyField(${i},'status',this.value)">
              <option value="alive" ${f.status!=='deceased'?'selected':''}>Alive</option>
              <option value="deceased" ${f.status==='deceased'?'selected':''}>Deceased</option>
            </select>
          </div>
          <div class="form-field">
            <label class="field-label">Date of Birth</label>
            <input type="date" class="field-input" value="${f.dateOfBirth || ''}" onchange="Pages.update.updateFamilyField(${i},'dateOfBirth',this.value)"/>
          </div>
        </div>
      </div>
    `).join('');
  },

  renderChangeSummary() {
    const changes = this.detectChanges();
    const hasFamily = JSON.stringify(this.formData.familyMembers) !== JSON.stringify(this.originalData.familyMembers);
    const hasBens = JSON.stringify(this.formData.beneficiaries) !== JSON.stringify(this.originalData.beneficiaries);

    if (!changes.length && !hasFamily && !hasBens) {
      return `<div class="alert alert-success"><span class="alert-icon">✅</span><div class="alert-content"><strong>No changes detected.</strong> Submitting will confirm your information is up to date.</div></div>`;
    }

    return `
      <div class="confirm-section">
        <div class="confirm-section-title">Updated Fields</div>
        ${changes.map(c => `
          <div class="confirm-row">
            <span class="confirm-label">${c.field}</span>
            <span class="confirm-value">
              <span style="text-decoration:line-through;color:var(--clr-text-muted);font-size:0.75rem">${Utils.sanitize(c.old || '—')}</span>
              → <span style="color:var(--clr-active)">${Utils.sanitize(c.new || '—')}</span>
            </span>
          </div>
        `).join('')}
        ${hasFamily ? `<div class="confirm-row"><span class="confirm-label">Family Members</span><span class="confirm-value" style="color:var(--clr-accent)">Updated</span></div>` : ''}
        ${hasBens ? `<div class="confirm-row"><span class="confirm-label">Beneficiaries</span><span class="confirm-value" style="color:var(--clr-accent)">Updated</span></div>` : ''}
      </div>
    `;
  },

  renderFormNav(step) {
    return `
      <div class="form-nav">
        ${step > 0 ? `<button type="button" class="btn btn-ghost" onclick="Pages.update.prevStep()">← Previous</button>` : '<div></div>'}
        ${step < this.totalSteps - 1
          ? `<button type="button" class="btn btn-primary" onclick="Pages.update.nextStep(${step})">Next →</button>`
          : `<button type="button" class="btn btn-success btn-lg" onclick="Pages.update.submit()">✅ Confirm & Submit Update</button>`
        }
      </div>
    `;
  },

  updateField(field, value) {
    this.formData[field] = value;
    // Highlight changed fields
    const el = document.getElementById(`u-${field.toLowerCase()}`);
    if (el) el.style.borderColor = value !== this.originalData[field] ? 'var(--clr-accent)' : '';
  },

  updateFamilyField(i, field, value) {
    if (this.formData.familyMembers && this.formData.familyMembers[i]) {
      this.formData.familyMembers[i][field] = value;
    }
  },

  addFamilyMember() {
    if (!this.formData.familyMembers) this.formData.familyMembers = [];
    this.formData.familyMembers.push({ id: DB.newGenId('FM'), firstName: '', lastName: '', relationship: 'child', dateOfBirth: '', status: 'alive' });
    document.getElementById('update-family-rows').innerHTML = this.renderUpdateFamilyRows();
  },

  removeFamilyMember(i) {
    this.formData.familyMembers.splice(i, 1);
    document.getElementById('update-family-rows').innerHTML = this.renderUpdateFamilyRows();
  },

  nextStep(step) {
    if (step === 3) {
      if (!this.signatureData) { Utils.toast('Please sign to confirm your update', 'error'); return; }
      if (!document.getElementById('u-consent-waiver').checked) { Utils.toast('Please confirm you have read the waiver', 'error'); return; }
    }
    this.currentStep++;
    this.render();
  },

  prevStep() { if (this.currentStep > 0) { this.currentStep--; this.render(); } },

  submit() {
    if (!document.getElementById('u-consent-final').checked) {
      Utils.toast('Please confirm the information is accurate', 'error'); return;
    }

    const waiver = DB.getLatestWaiver();
    const memberId = this.member.id;
    const changes = this.detectChanges();

    // Save old data for audit
    const oldData = { ...this.originalData };

    // Update member
    this.formData.lastVerified = new Date().toISOString().split('T')[0];
    DB.saveMember({ ...this.formData, id: memberId });
    DB.useToken(this.token.id);

    // Send automated success email to member
    Notifications.sendProfileUpdateSuccess(memberId);

    // Save new signature
    if (this.signatureData && waiver) {
      DB.saveSignature(memberId, waiver.id, this.signatureData);
    }

    // Audit log
    changes.forEach(c => {
      DB.addAuditLog(memberId, 'member', 'field_updated', { [c.field]: c.old }, { [c.field]: c.new });
    });
    DB.addAuditLog(memberId, 'member', 'profile_updated', null, { lastVerified: this.formData.lastVerified });

    document.getElementById('app-root').innerHTML = `
      <div class="public-page">
        <div class="form-card" style="max-width:560px">
          <div class="form-card-body">
            <div class="success-screen">
              <div class="success-icon">✅</div>
              <h2 class="success-title">${I18N.t('updateSuccess')}</h2>
              <p class="success-message">Your profile has been updated and verified. The administrator has been notified.</p>
              <div class="alert alert-success">
                <span class="alert-icon">✅</span>
                <div class="alert-content">
                  <strong>${changes.length} change(s) saved</strong><br>
                  Last verified: ${Utils.formatDate(this.formData.lastVerified)}
                </div>
              </div>
              <button class="btn btn-primary" style="margin-top:1rem" onclick="Router.navigate('member-login')">Access Member Portal →</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
};
